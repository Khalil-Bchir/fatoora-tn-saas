import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import axios from 'axios'
import type { Profile } from '@/lib/db-types'
import { createCookieAuthApiClient, ApiError } from '@/lib/api-client'
import type { AxiosInstance } from 'axios'
import {
  AUTH_ROUTES,
  normalizeProfile,
  mapBackendRoleToFrontend,
  mapFrontendRoleToBackend,
  type BackendUserRole,
  type LoginPayload,
  type RegisterPayload,
  type RegisterResult,
  type LoginResponseData,
} from '@/features/auth/services/auth-service'
import { USER_ROUTES } from '@/features/users/services/user-service'

export interface AuthState {
  profile: Profile | null
  accessToken: string | null
  refreshToken: string | null
  hasHydrated: boolean
  authLoading: boolean
  authError: string | null
  setSession: (session: { profile: Profile; accessToken?: string; refreshToken?: string }) => void
  clearSession: () => void
  setHasHydrated: (value: boolean) => void
  /** Revalidate profile from server (GET /users/me). Role comes from JWT; keeps UI in sync with token. */
  revalidateSession: () => Promise<void>
  signIn: (payload: LoginPayload) => Promise<void>
  signUp: (payload: RegisterPayload) => Promise<RegisterResult>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (params: { newPassword: string; accessToken: string }) => Promise<void>
  getGoogleOAuthUrl: (redirectTo?: string) => Promise<string>
  handleGoogleCallback: (code: string, state?: string) => Promise<void>
  handleGoogleTokens: (accessToken: string, refreshToken?: string) => Promise<void>
}

const STORAGE_KEY = process.env.NEXT_PUBLIC_APP_AUTH_STORAGE_KEY ?? 'app.auth'
const baseURL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

type PersistedAuthState = Pick<AuthState, 'profile' | 'accessToken' | 'refreshToken'>

const storage =
  typeof window !== 'undefined'
    ? createJSONStorage<PersistedAuthState>(() => localStorage)
    : undefined

let authClient: AxiosInstance | null = null

function getAuthClient(): AxiosInstance {
  if (authClient) return authClient
  const refreshClient = axios.create({
    baseURL: baseURL.replace(/\/$/, ''),
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  })
  authClient = createCookieAuthApiClient({
    baseURL,
    useCookies: true,
    refreshUrl: AUTH_ROUTES.refresh,
    onRefresh: async () => {
      const currentRefresh = useAuthStore.getState().refreshToken
      const payload = currentRefresh ? { refreshToken: currentRefresh } : {}
      const res = await refreshClient.post<{ data: { accessToken: string; refreshToken: string } }>(
        AUTH_ROUTES.refresh,
        payload
      )
      if (res.data?.data) {
        useAuthStore.setState({
          accessToken: res.data.data.accessToken,
          refreshToken: res.data.data.refreshToken,
        })
      }
    },
  })
  return authClient
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      const setAuthLoading = (loading: boolean) => set({ authLoading: loading })
      const setAuthError = (error: string | null) => set({ authError: error })
      const clearAuthError = () => set({ authError: null })

      return {
        profile: null,
        accessToken: null,
        refreshToken: null,
        hasHydrated: false,
        authLoading: false,
        authError: null,
        setSession: ({ profile, accessToken, refreshToken }) =>
          set({
            profile,
            accessToken: accessToken ?? get().accessToken,
            refreshToken: refreshToken ?? get().refreshToken,
            hasHydrated: true,
          }),
        clearSession: () =>
          set({ profile: null, accessToken: null, refreshToken: null, hasHydrated: true }),
        setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

        revalidateSession: async () => {
          try {
            const client = getAuthClient()
            const { data } = await client.get<{ data: { id: string; email: string; role: BackendUserRole; profile: { fullName?: string | null; phone?: string | null } } }>(USER_ROUTES.me)
            const d = data.data
            set({
              profile: {
                id: d.id,
                email: d.email,
                full_name: d.profile?.fullName ?? null,
                phone: d.profile?.phone ?? null,
                role: mapBackendRoleToFrontend(d.role),
                avatar_url: null,
                is_verified: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            })
          } catch {
            get().clearSession()
          }
        },

        signIn: async (payload: LoginPayload) => {
          setAuthLoading(true)
          clearAuthError()
          try {
            const client = getAuthClient()
            const { data } = await client.post<{ data: LoginResponseData }>(AUTH_ROUTES.login, payload)
            const session = data.data
            const profile = normalizeProfile(session.user)
            set({
              profile,
              accessToken: session.accessToken,
              refreshToken: session.refreshToken ?? null,
              hasHydrated: true,
              authLoading: false,
              authError: null,
            })
          } catch (err) {
            const message =
              err instanceof ApiError ? err.message : 'Sign in failed. Please try again.'
            set({ authLoading: false, authError: message })
            throw err
          }
        },

        signUp: async (payload: RegisterPayload): Promise<RegisterResult> => {
          setAuthLoading(true)
          clearAuthError()
          try {
            const client = getAuthClient()
            const { data } = await client.post<{
              data: {
                id: string
                email: string
                role: string
                profile: { fullName?: string | null; phone?: string | null }
                requiresEmailVerification: boolean
              }
            }>(AUTH_ROUTES.register, {
              ...payload,
              role: mapFrontendRoleToBackend(payload.role ?? 'USER'),
            })
            const result = data.data
            set({ authLoading: false, authError: null })
            return {
              userId: result.id,
              email: result.email,
              role: mapBackendRoleToFrontend(result.role as BackendUserRole),
              requiresEmailVerification: result.requiresEmailVerification,
            }
          } catch (err) {
            const message =
              err instanceof ApiError ? err.message : 'Registration failed. Please try again.'
            set({ authLoading: false, authError: message })
            throw err
          }
        },

        signOut: async () => {
          try {
            const client = getAuthClient()
            await client.post(AUTH_ROUTES.logout, {})
          } finally {
            get().clearSession()
            setAuthError(null)
          }
        },

        requestPasswordReset: async (email: string) => {
          setAuthLoading(true)
          clearAuthError()
          try {
            const client = getAuthClient()
            await client.post(AUTH_ROUTES.forgotPassword, { email })
            set({ authLoading: false, authError: null })
          } catch (err) {
            const message =
              err instanceof ApiError ? err.message : 'Request failed. Please try again.'
            set({ authLoading: false, authError: message })
            throw err
          }
        },

        resetPassword: async ({ newPassword, accessToken }) => {
          setAuthLoading(true)
          clearAuthError()
          try {
            const oneOff = axios.create({
              baseURL: baseURL.replace(/\/$/, ''),
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
            })
            await oneOff.post(AUTH_ROUTES.resetPassword, {
              newPassword,
              confirmPassword: newPassword,
            })
            set({ authLoading: false, authError: null })
          } catch (err) {
            const message =
              err instanceof ApiError ? err.message : 'Password reset failed. Please try again.'
            set({ authLoading: false, authError: message })
            throw err
          }
        },

        getGoogleOAuthUrl: async (redirectTo?: string) => {
          try {
            const client = getAuthClient()
            const { data } = await client.post<{ data: { url: string } }>(
              AUTH_ROUTES.googleOAuthUrl,
              { redirectTo }
            )
            return data.data.url
          } catch (err) {
            const message =
              err instanceof ApiError ? err.message : 'Failed to get OAuth URL. Please try again.'
            set({ authError: message })
            throw err
          }
        },

        handleGoogleCallback: async (code: string, state?: string) => {
          setAuthLoading(true)
          clearAuthError()
          try {
            const client = getAuthClient()
            const { data } = await client.post<{ data: LoginResponseData }>(
              AUTH_ROUTES.googleOAuthCallback,
              { code, state }
            )
            const session = data.data
            const profile = normalizeProfile(session.user)
            set({
              profile,
              accessToken: session.accessToken,
              refreshToken: session.refreshToken ?? null,
              hasHydrated: true,
              authLoading: false,
              authError: null,
            })
          } catch (err) {
            const message =
              err instanceof ApiError ? err.message : 'Google authentication failed. Please try again.'
            set({ authLoading: false, authError: message })
            throw err
          }
        },

        handleGoogleTokens: async (accessToken: string, refreshToken?: string) => {
          setAuthLoading(true)
          clearAuthError()
          try {
            const client = getAuthClient()
            const { data } = await client.post<{ data: LoginResponseData }>(
              AUTH_ROUTES.googleOAuthTokens,
              { accessToken, refreshToken }
            )
            const session = data.data
            const profile = normalizeProfile(session.user)
            set({
              profile,
              accessToken: session.accessToken,
              refreshToken: session.refreshToken ?? null,
              hasHydrated: true,
              authLoading: false,
              authError: null,
            })
          } catch (err) {
            const message =
              err instanceof ApiError ? err.message : 'Google authentication failed. Please try again.'
            set({ authLoading: false, authError: message })
            throw err
          }
        },
      }
    },
    {
      name: STORAGE_KEY,
      storage,
      partialize: (state) => ({
        profile: state.profile,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
