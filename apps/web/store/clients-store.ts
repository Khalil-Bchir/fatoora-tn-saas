import { create } from 'zustand';
import axios from 'axios';
import type { ClientDTO, CreateClientRequest } from '@repo/types';

interface ClientsState {
  clients: ClientDTO[];
  loading: boolean;
  error: string | null;
  fetchClients: (search?: string) => Promise<void>;
  createClient: (data: CreateClientRequest) => Promise<ClientDTO>;
  updateClient: (id: string, data: Partial<CreateClientRequest>) => Promise<ClientDTO>;
  deleteClient: (id: string) => Promise<void>;
}

const apiURL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  loading: false,
  error: null,

  fetchClients: async (search?: string) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get<{ data: ClientDTO[] }>(`${apiURL}/api/v1/clients`, {
        params: { search },
        headers: { 'Content-Type': 'application/json' },
      });
      set({ clients: res.data.data, loading: false, error: null });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to load clients';
      set({ error: msg, loading: false });
    }
  },

  createClient: async (data: CreateClientRequest) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post<{ data: ClientDTO }>(`${apiURL}/api/v1/clients`, data, {
        headers: { 'Content-Type': 'application/json' },
      });
      const created = res.data.data;
      set((state) => ({
        clients: [created, ...state.clients],
        loading: false,
        error: null,
      }));
      return created;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create client';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  updateClient: async (id: string, data: Partial<CreateClientRequest>) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.patch<{ data: ClientDTO }>(`${apiURL}/api/v1/clients/${id}`, data, {
        headers: { 'Content-Type': 'application/json' },
      });
      const updated = res.data.data;
      set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? updated : c)),
        loading: false,
        error: null,
      }));
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update client';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  deleteClient: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${apiURL}/api/v1/clients/${id}`);
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to delete client';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },
}));
