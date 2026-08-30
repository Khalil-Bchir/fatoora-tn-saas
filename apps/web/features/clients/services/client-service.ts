import { getInvoicesClient } from '@/features/invoices/services/invoice-service'

export interface Client {
  id: string
  organizationId: string
  name: string
  companyName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  postalCode?: string | null
  country?: string | null
  taxId?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  invoices?: Array<{
    id: string
    invoiceNumber: string
    total: number
    currency: string
    status: string
    issueDate: string
    dueDate: string
  }>
}

export interface CreateClientPayload {
  name: string
  companyName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  taxId?: string
  notes?: string
}

export const clientService = {
  async listClients(search?: string): Promise<Client[]> {
    const client = getInvoicesClient()
    const { data } = await client.get<{ data: Client[] }>('/api/v1/clients', {
      params: search ? { search } : undefined,
    })
    return data.data
  },

  async getClient(id: string): Promise<Client> {
    const client = getInvoicesClient()
    const { data } = await client.get<{ data: Client }>(`/api/v1/clients/${id}`)
    return data.data
  },

  async createClient(payload: CreateClientPayload): Promise<Client> {
    const client = getInvoicesClient()
    const { data } = await client.post<{ data: Client }>('/api/v1/clients', payload)
    return data.data
  },

  async updateClient(id: string, payload: Partial<CreateClientPayload>): Promise<Client> {
    const client = getInvoicesClient()
    const { data } = await client.patch<{ data: Client }>(`/api/v1/clients/${id}`, payload)
    return data.data
  },

  async deleteClient(id: string): Promise<void> {
    const client = getInvoicesClient()
    await client.delete(`/api/v1/clients/${id}`)
  },
}
