export type TaxRegime = 'AUTO_ENTREPRENEUR' | 'FORFAITAIRE' | 'REEL';

export type UserRole = 'OWNER' | 'MEMBER' | 'ADMIN' | 'USER' | 'DEMO';

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_CLAIMED'
  | 'PAID'
  | 'OVERDUE'
  | 'DISPUTED'
  | 'CANCELLED';

export type PaymentProofStatus = 'SUBMITTED' | 'CONFIRMED' | 'REJECTED';

export interface OrganizationDTO {
  id: string;
  name: string;
  ownerUserId?: string | null;
  activityType?: string | null;
  taxRegime: TaxRegime;
  vatRegistered: boolean;
  taxId?: string | null; // Matricule Fiscal / Identifiant Unique
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  bankName?: string | null;
  bankRib?: string | null; // 20 digits RIB
  bankIban?: string | null;
  bankBic?: string | null;
  stampImageUrl?: string | null;
  signatureImageUrl?: string | null;
  logoUrl?: string | null;
  invoicePrefix: string;
  invoiceCounter: number;
  currency: string;
  defaultVatRate: number;
  defaultPaymentTerms?: string | null;
  plan: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ClientDTO {
  id: string;
  organizationId: string;
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  taxId?: string | null;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface InvoiceItemDTO {
  id?: string;
  invoiceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface InvoiceDTO {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  clientId: string;
  client?: ClientDTO;
  currency: string;
  vatApplicable: boolean;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  timbreFiscalAmount: number;
  total: number;
  issueDate: string | Date;
  dueDate: string | Date;
  status: InvoiceStatus;
  publicToken: string;
  pdfUrl?: string | null;
  mdContent?: string | null;
  notes?: string | null;
  paymentTerms?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: InvoiceItemDTO[];
  organization?: OrganizationDTO;
  paymentProofs?: PaymentProofDTO[];
}

export interface PaymentProofDTO {
  id: string;
  organizationId: string;
  invoiceId: string;
  fileUrl: string;
  amount?: number | null;
  notes?: string | null;
  status: PaymentProofStatus;
  submittedAt: string | Date;
  reviewedAt?: string | Date | null;
}

export interface CreateInvoiceRequest {
  clientId: string;
  currency?: string;
  vatApplicable?: boolean;
  vatRate?: number;
  timbreFiscalAmount?: number;
  issueDate?: string;
  dueDate: string;
  notes?: string;
  paymentTerms?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate?: number;
  }>;
}

export interface CreateClientRequest {
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  notes?: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  activityType?: string;
  taxRegime?: TaxRegime;
  vatRegistered?: boolean;
  taxId?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  bankName?: string;
  bankRib?: string;
  bankIban?: string;
  bankBic?: string;
  stampImageUrl?: string;
  signatureImageUrl?: string;
  logoUrl?: string;
  invoicePrefix?: string;
  currency?: string;
  defaultVatRate?: number;
  defaultPaymentTerms?: string;
}
