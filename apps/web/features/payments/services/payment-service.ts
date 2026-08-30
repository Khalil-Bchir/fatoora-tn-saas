import { getInvoicesClient } from '@/features/invoices/services/invoice-service'
import type { Invoice } from '@/features/invoices/services/invoice-service'

export interface PaymentProof {
  id: string
  invoiceId: string
  organizationId: string
  fileUrl: string
  amount?: number | null
  submittedAt: string
  status: 'SUBMITTED' | 'CONFIRMED' | 'REJECTED'
  notes?: string | null
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
  invoice?: Invoice
}

export const paymentService = {
  async listProofs(): Promise<PaymentProof[]> {
    const client = getInvoicesClient()
    const { data } = await client.get<{ data: PaymentProof[] }>('/api/v1/payment-proofs')
    return data.data
  },

  async confirmProof(id: string): Promise<PaymentProof> {
    const client = getInvoicesClient()
    const { data } = await client.post<{ data: PaymentProof }>(`/api/v1/payment-proofs/${id}/confirm`)
    return data.data
  },

  async rejectProof(id: string, reason: string): Promise<PaymentProof> {
    const client = getInvoicesClient()
    const { data } = await client.post<{ data: PaymentProof }>(`/api/v1/payment-proofs/${id}/reject`, {
      reason,
    })
    return data.data
  },
}
