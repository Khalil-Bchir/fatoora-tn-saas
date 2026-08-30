import axios from 'axios'
import { createCookieAuthApiClient } from '@/lib/api-client'
import { AUTH_ROUTES } from '@/features/auth/services/auth-service'
import { useAuthStore } from '@/store/auth-store'

const baseURL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

let apiClient: ReturnType<typeof createCookieAuthApiClient> | null = null

export function getInvoicesClient() {
  if (apiClient) return apiClient
  const refreshClient = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  })
  apiClient = createCookieAuthApiClient({
    baseURL,
    useCookies: true,
    refreshUrl: AUTH_ROUTES.refresh,
    onRefresh: async () => {
      const auth = useAuthStore.getState()
      const currentRefresh = auth.refreshToken
      const payload = currentRefresh ? { refreshToken: currentRefresh } : {}
      const res = await refreshClient.post<{ data: { accessToken: string; refreshToken: string } }>(
        AUTH_ROUTES.refresh,
        payload
      )
      if (res.data?.data) {
        auth.setSession({
          profile: auth.profile!,
          accessToken: res.data.data.accessToken,
          refreshToken: res.data.data.refreshToken,
        })
      }
    },
  })
  return apiClient
}

export interface InvoiceItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
  total?: number
}

export interface Invoice {
  id: string
  organizationId: string
  invoiceNumber: string
  clientId: string
  currency: string
  vatApplicable: boolean
  vatRate: number
  subtotal: number
  vatAmount: number
  timbreFiscalAmount: number
  total: number
  issueDate: string
  dueDate: string
  status:
    | 'DRAFT'
    | 'SENT'
    | 'AWAITING_PAYMENT'
    | 'PAYMENT_CLAIMED'
    | 'PAID'
    | 'OVERDUE'
    | 'DISPUTED'
    | 'CANCELLED'
  publicToken: string
  pdfUrl?: string | null
  mdContent?: string | null
  notes?: string | null
  paymentTerms?: string | null
  createdAt: string
  updatedAt: string
  items: InvoiceItem[]
  client?: {
    id: string
    name: string
    companyName?: string | null
    email?: string | null
    phone?: string | null
    taxId?: string | null
    address?: string | null
    city?: string | null
  }
  organization?: {
    id: string
    name: string
    taxId?: string | null
    address?: string | null
    city?: string | null
    phone?: string | null
    email?: string | null
    bankName?: string | null
    bankRib?: string | null
    stampUrl?: string | null
    signatureUrl?: string | null
    logoUrl?: string | null
  }
  paymentProofs?: Array<{
    id: string
    fileUrl: string
    amount?: number | null
    status: 'SUBMITTED' | 'CONFIRMED' | 'REJECTED'
    submittedAt: string
    notes?: string | null
    rejectionReason?: string | null
  }>
}

export interface CreateInvoicePayload {
  clientId: string
  currency?: string
  vatApplicable?: boolean
  vatRate?: number
  timbreFiscalAmount?: number
  issueDate?: string
  dueDate: string
  notes?: string
  paymentTerms?: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    vatRate: number
  }>
}

export const invoiceService = {
  async listInvoices(params?: { status?: string; clientId?: string }): Promise<Invoice[]> {
    const client = getInvoicesClient()
    const { data } = await client.get<{ data: Invoice[] }>('/api/v1/invoices', { params })
    return data.data
  },

  async getInvoice(id: string): Promise<Invoice> {
    const client = getInvoicesClient()
    const { data } = await client.get<{ data: Invoice }>(`/api/v1/invoices/${id}`)
    return data.data
  },

  async createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
    const client = getInvoicesClient()
    const { data } = await client.post<{ data: Invoice }>('/api/v1/invoices', payload)
    return data.data
  },

  async sendInvoice(id: string): Promise<Invoice> {
    const client = getInvoicesClient()
    const { data } = await client.post<{ data: Invoice }>(`/api/v1/invoices/${id}/send`)
    return data.data
  },

  async cancelInvoice(id: string): Promise<Invoice> {
    const client = getInvoicesClient()
    const { data } = await client.post<{ data: Invoice }>(`/api/v1/invoices/${id}/cancel`)
    return data.data
  },

  async duplicateInvoice(id: string): Promise<Invoice> {
    const client = getInvoicesClient()
    const { data } = await client.post<{ data: Invoice }>(`/api/v1/invoices/${id}/duplicate`)
    return data.data
  },

  async updateStatus(id: string, status: Invoice['status']): Promise<Invoice> {
    const client = getInvoicesClient()
    const { data } = await client.patch<{ data: Invoice }>(`/api/v1/invoices/${id}/status`, { status })
    return data.data
  },

  async deleteInvoice(id: string): Promise<void> {
    const client = getInvoicesClient()
    await client.delete(`/api/v1/invoices/${id}`)
  },
}
