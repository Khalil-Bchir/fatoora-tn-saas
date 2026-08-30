import type { PrismaClient, Client } from '@repo/database';
import type { CreateClientRequest } from '@repo/types';

export class ClientsService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async listClients(orgId: string, search?: string, limit = 50): Promise<Client[]> {
    return this.prisma.client.findMany({
      where: {
        organizationId: orgId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getClient(orgId: string, clientId: string): Promise<Client | null> {
    return this.prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: orgId,
      },
    });
  }

  async createClient(orgId: string, data: CreateClientRequest): Promise<Client> {
    return this.prisma.client.create({
      data: {
        organizationId: orgId,
        name: data.name,
        companyName: data.companyName || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        postalCode: data.postalCode || null,
        country: data.country || 'Tunisie',
        taxId: data.taxId || null,
        notes: data.notes || null,
      },
    });
  }

  async updateClient(
    orgId: string,
    clientId: string,
    data: Partial<CreateClientRequest>
  ): Promise<Client> {
    // Verify client belongs to tenant
    const existing = await this.getClient(orgId, clientId);
    if (!existing) {
      throw new Error('Client not found');
    }

    return this.prisma.client.update({
      where: { id: clientId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.taxId !== undefined && { taxId: data.taxId }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async deleteClient(orgId: string, clientId: string): Promise<boolean> {
    const existing = await this.getClient(orgId, clientId);
    if (!existing) {
      throw new Error('Client not found');
    }

    await this.prisma.client.delete({
      where: { id: clientId },
    });

    return true;
  }
}
