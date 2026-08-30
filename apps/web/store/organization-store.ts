import { create } from 'zustand';
import axios from 'axios';
import type { OrganizationDTO, UpdateOrganizationRequest } from '@repo/types';

interface OrganizationState {
  organization: OrganizationDTO | null;
  loading: boolean;
  error: string | null;
  fetchOrganization: () => Promise<void>;
  updateOrganization: (data: UpdateOrganizationRequest) => Promise<OrganizationDTO>;
}

const apiURL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  organization: null,
  loading: false,
  error: null,

  fetchOrganization: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get<{ data: OrganizationDTO }>(`${apiURL}/api/v1/organization`, {
        headers: { 'Content-Type': 'application/json' },
      });
      set({ organization: res.data.data, loading: false, error: null });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to load organization';
      set({ error: msg, loading: false });
    }
  },

  updateOrganization: async (data: UpdateOrganizationRequest) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.patch<{ data: OrganizationDTO }>(`${apiURL}/api/v1/organization`, data, {
        headers: { 'Content-Type': 'application/json' },
      });
      set({ organization: res.data.data, loading: false, error: null });
      return res.data.data;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update organization';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },
}));
