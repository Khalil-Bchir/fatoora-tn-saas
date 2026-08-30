import type { PrismaClient, Organization } from '@repo/database';
import type { UpdateOrganizationRequest } from '@repo/types';

export class OrganizationsService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async getOrganization(orgId: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { id: orgId },
    });
  }

  async updateOrganization(orgId: string, data: UpdateOrganizationRequest): Promise<Organization> {
    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.activityType !== undefined && { activityType: data.activityType }),
        ...(data.taxRegime && { taxRegime: data.taxRegime }),
        ...(data.vatRegistered !== undefined && { vatRegistered: data.vatRegistered }),
        ...(data.taxId !== undefined && { taxId: data.taxId }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.bankName !== undefined && { bankName: data.bankName }),
        ...(data.bankRib !== undefined && { bankRib: data.bankRib }),
        ...(data.bankIban !== undefined && { bankIban: data.bankIban }),
        ...(data.stampImageUrl !== undefined && { stampImageUrl: data.stampImageUrl }),
        ...((data as any).stampUrl !== undefined && { stampImageUrl: (data as any).stampUrl }),
        ...(data.signatureImageUrl !== undefined && { signatureImageUrl: data.signatureImageUrl }),
        ...((data as any).signatureUrl !== undefined && { signatureImageUrl: (data as any).signatureUrl }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.invoicePrefix !== undefined && { invoicePrefix: data.invoicePrefix }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.defaultVatRate !== undefined && { defaultVatRate: data.defaultVatRate }),
        ...(data.defaultPaymentTerms !== undefined && { defaultPaymentTerms: data.defaultPaymentTerms }),
      },
    });
  }
}
