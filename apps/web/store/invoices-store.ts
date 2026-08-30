import { create } from 'zustand';
import axios from 'axios';
import type { InvoiceDTO, InvoiceStatus, CreateInvoiceRequest } from '@repo/types';

interface InvoicesState {
  invoices: InvoiceDTO[];
  currentInvoice: InvoiceDTO | null;
  loading: boolean;
  error: string | null;
  fetchInvoices: (status?: InvoiceStatus, clientId?: string) => Promise<void>;
  getInvoice: (id: string) => Promise<InvoiceDTO>;
  createInvoice: (data: CreateInvoiceRequest) => Promise<InvoiceDTO>;
  updateStatus: (id: string, status: InvoiceStatus) => Promise<InvoiceDTO>;
  deleteInvoice: (id: string) => Promise<void>;
  fetchPublicInvoice: (token: string) => Promise<InvoiceDTO>;
  submitPaymentProof: (token: string, fileUrl: string, amount?: number, notes?: string) => Promise<void>;
}

const apiURL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const useInvoicesStore = create<InvoicesState>((set, get) => ({
  invoices: [],
  currentInvoice: null,
  loading: false,
  error: null,

  fetchInvoices: async (status?: InvoiceStatus, clientId?: string) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get<{ data: InvoiceDTO[] }>(`${apiURL}/api/v1/invoices`, {
        params: { status, clientId },
        headers: { 'Content-Type': 'application/json' },
      });
      set({ invoices: res.data.data, loading: false, error: null });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to load invoices';
      set({ error: msg, loading: false });
    }
  },

  getInvoice: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get<{ data: InvoiceDTO }>(`${apiURL}/api/v1/invoices/${id}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      set({ currentInvoice: res.data.data, loading: false, error: null });
      return res.data.data;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to load invoice';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  createInvoice: async (data: CreateInvoiceRequest) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post<{ data: InvoiceDTO }>(`${apiURL}/api/v1/invoices`, data, {
        headers: { 'Content-Type': 'application/json' },
      });
      const created = res.data.data;
      set((state) => ({
        invoices: [created, ...state.invoices],
        loading: false,
        error: null,
      }));
      return created;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create invoice';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  updateStatus: async (id: string, status: InvoiceStatus) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.patch<{ data: InvoiceDTO }>(
        `${apiURL}/api/v1/invoices/${id}/status`,
        { status },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const updated = res.data.data;
      set((state) => ({
        invoices: state.invoices.map((inv) => (inv.id === id ? updated : inv)),
        currentInvoice: state.currentInvoice?.id === id ? updated : state.currentInvoice,
        loading: false,
        error: null,
      }));
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update invoice status';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  deleteInvoice: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${apiURL}/api/v1/invoices/${id}`);
      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
        currentInvoice: state.currentInvoice?.id === id ? null : state.currentInvoice,
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to delete invoice';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  fetchPublicInvoice: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get<{ data: InvoiceDTO }>(
        `${apiURL}/api/v1/public/invoices/${token}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      set({ currentInvoice: res.data.data, loading: false, error: null });
      return res.data.data;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Invoice not found';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  submitPaymentProof: async (token: string, fileUrl: string, amount?: number, notes?: string) => {
    set({ loading: true, error: null });
    try {
      await axios.post(
        `${apiURL}/api/v1/public/invoices/${token}/payment-proof`,
        { fileUrl, amount, notes },
        { headers: { 'Content-Type': 'application/json' } }
      );
      set({ loading: false, error: null });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to submit payment proof';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },
}));
