import { getInvoicesClient } from '@/features/invoices/services/invoice-service'
import type { Invoice } from '@/features/invoices/services/invoice-service'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  quickReplies?: string[]
}

export interface ExtractedItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
  total?: number
}

export interface ExtractedData {
  clientId?: string
  clientName?: string
  clientTaxId?: string
  currency: string
  items: ExtractedItem[]
  subtotal: number
  vatAmount: number
  timbreFiscal: number
  total: number
  notes?: string
  paymentTerms?: string
  issueDate?: string
  dueDate?: string
  isReady: boolean
  missingField?: string
  quickReplies?: string[]
}

export interface ChatSession {
  id: string
  organizationId: string
  userId?: string | null
  title: string
  messages: ChatMessage[]
  extractedData?: ExtractedData | null
  status: 'ACTIVE' | 'FINALIZED' | 'ABANDONED'
  invoiceId?: string | null
  createdAt: string
  updatedAt: string
}

export const chatService = {
  async listSessions(): Promise<ChatSession[]> {
    const client = getInvoicesClient()
    const { data } = await client.get<{ data: ChatSession[] }>('/api/v1/chat-sessions')
    return data.data
  },

  async createSession(initialMessage?: string): Promise<ChatSession> {
    const client = getInvoicesClient()
    const { data } = await client.post<{ data: ChatSession }>('/api/v1/chat-sessions', {
      initialMessage,
    })
    return data.data
  },

  async getSession(id: string): Promise<ChatSession> {
    const client = getInvoicesClient()
    const { data } = await client.get<{ data: ChatSession }>(`/api/v1/chat-sessions/${id}`)
    return data.data
  },

  async sendMessage(
    id: string,
    message: string
  ): Promise<{ session: ChatSession; reply: string; extractedData: ExtractedData; quickReplies?: string[] }> {
    const client = getInvoicesClient()
    const { data } = await client.post<{
      data: { session: ChatSession; reply: string; extractedData: ExtractedData; quickReplies?: string[] }
    }>(`/api/v1/chat-sessions/${id}/messages`, { message })
    return data.data
  },

  async updateDraft(
    id: string,
    updates: Partial<ExtractedData>
  ): Promise<{ session: ChatSession; extractedData: ExtractedData }> {
    const client = getInvoicesClient()
    const { data } = await client.patch<{
      data: { session: ChatSession; extractedData: ExtractedData }
    }>(`/api/v1/chat-sessions/${id}/draft`, updates)
    return data.data
  },

  async finalizeSession(id: string): Promise<Invoice> {
    const client = getInvoicesClient()
    const { data } = await client.post<{ data: Invoice }>(`/api/v1/chat-sessions/${id}/finalize`)
    return data.data
  },
}
