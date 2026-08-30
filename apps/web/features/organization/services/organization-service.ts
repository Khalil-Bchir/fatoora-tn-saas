import { getInvoicesClient } from '@/features/invoices/services/invoice-service'

export interface Organization {
  id: string
  name: string
  slug?: string
  logoUrl?: string | null
  stampUrl?: string | null
  signatureUrl?: string | null
  stampImageUrl?: string | null
  signatureImageUrl?: string | null
  taxId?: string | null
  taxRegime?: string | null
  vatRegistered: boolean
  defaultVatRate: number
  timbreFiscalAmount: number
  currency: string
  address?: string | null
  city?: string | null
  postalCode?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  activityType?: string | null
  bankName?: string | null
  bankRib?: string | null
  bankIban?: string | null
  invoicePrefix?: string
  defaultPaymentTerms?: string | null
  invoiceCounter: number
}

export const organizationService = {
  async getOrganization(): Promise<Organization> {
    const client = getInvoicesClient()
    const { data } = await client.get<{ data: Organization }>('/api/v1/organization')
    return data.data
  },

  async updateOrganization(payload: Partial<Organization>): Promise<Organization> {
    const client = getInvoicesClient()
    const { data } = await client.patch<{ data: Organization }>('/api/v1/organization', payload)
    return data.data
  },
}
