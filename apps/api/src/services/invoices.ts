import type { PrismaClient, Invoice, InvoiceStatus, Organization } from '@repo/database';
import type { CreateInvoiceRequest } from '@repo/types';
import crypto from 'node:crypto';

export class InvoicesService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async listInvoices(orgId: string, status?: InvoiceStatus, clientId?: string, limit = 50) {
    return this.prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        ...(status && { status }),
        ...(clientId && { clientId }),
      },
      include: {
        client: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getInvoice(orgId: string, invoiceId: string) {
    return this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId: orgId,
      },
      include: {
        client: true,
        items: true,
        organization: true,
        paymentProofs: {
          orderBy: { submittedAt: 'desc' },
        },
      },
    });
  }

  async getInvoiceByPublicToken(publicToken: string) {
    return this.prisma.invoice.findUnique({
      where: {
        publicToken,
      },
      include: {
        client: true,
        items: true,
        organization: true,
        paymentProofs: {
          orderBy: { submittedAt: 'desc' },
        },
      },
    });
  }

  async createInvoice(orgId: string, data: CreateInvoiceRequest, org: Organization) {
    // 1. Calculate line item totals and subtotal
    let subtotal = 0;
    let totalVatAmount = 0;

    const vatApplicable =
      data.vatApplicable !== undefined ? data.vatApplicable : org.vatRegistered;
    const defaultVatRate =
      data.vatRate !== undefined ? data.vatRate : (org.defaultVatRate ?? 19.0);

    const calculatedItems = data.items.map((item) => {
      const itemVatRate = vatApplicable ? (item.vatRate ?? defaultVatRate) : 0;
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemVat = (itemSubtotal * itemVatRate) / 100;
      const itemTotal = itemSubtotal + itemVat;

      subtotal += itemSubtotal;
      totalVatAmount += itemVat;

      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: itemVatRate,
        total: itemTotal,
      };
    });

    const timbreFiscalAmount = vatApplicable
      ? (data.timbreFiscalAmount !== undefined ? data.timbreFiscalAmount : 1.0)
      : 0.0;

    const total = subtotal + totalVatAmount + timbreFiscalAmount;

    // 2. Atomically increment organization invoice counter and generate invoice number
    const updatedOrg = await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        invoiceCounter: { increment: 1 },
      },
    });

    const year = new Date().getFullYear();
    const sequenceNumber = String(updatedOrg.invoiceCounter).padStart(4, '0');
    const invoicePrefix = updatedOrg.invoicePrefix || 'FAC';
    const invoiceNumber = `${invoicePrefix}-${year}-${sequenceNumber}`;

    // 3. Cryptographically secure random token for public link
    const publicToken = crypto.randomBytes(24).toString('hex');

    // 4. Generate markdown invoice content
    const client = await this.prisma.client.findFirst({
      where: { id: data.clientId, organizationId: orgId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    const mdContent = this.generateInvoiceMarkdown({
      org: updatedOrg,
      client,
      invoiceNumber,
      issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
      dueDate: new Date(data.dueDate),
      currency: data.currency || updatedOrg.currency || 'TND',
      vatApplicable,
      vatRate: defaultVatRate,
      subtotal,
      vatAmount: totalVatAmount,
      timbreFiscalAmount,
      total,
      items: calculatedItems,
      notes: data.notes,
      paymentTerms: data.paymentTerms || updatedOrg.defaultPaymentTerms,
    });

    // 5. Create invoice in DB
    return this.prisma.invoice.create({
      data: {
        organizationId: orgId,
        invoiceNumber,
        clientId: data.clientId,
        currency: data.currency || updatedOrg.currency || 'TND',
        vatApplicable,
        vatRate: defaultVatRate,
        subtotal,
        vatAmount: totalVatAmount,
        timbreFiscalAmount,
        total,
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: new Date(data.dueDate),
        status: 'DRAFT',
        publicToken,
        mdContent,
        notes: data.notes || null,
        paymentTerms: data.paymentTerms || updatedOrg.defaultPaymentTerms || null,
        items: {
          create: calculatedItems,
        },
      },
      include: {
        client: true,
        items: true,
      },
    });
  }

  async updateInvoiceStatus(orgId: string, invoiceId: string, status: InvoiceStatus) {
    const existing = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgId },
    });

    if (!existing) {
      throw new Error('Invoice not found');
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status },
      include: {
        client: true,
        items: true,
      },
    });
  }

  async deleteInvoice(orgId: string, invoiceId: string) {
    const existing = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgId },
    });

    if (!existing) {
      throw new Error('Invoice not found');
    }

    await this.prisma.invoice.delete({
      where: { id: invoiceId },
    });

    return true;
  }

  private generateInvoiceMarkdown(params: {
    org: Organization;
    client: any;
    invoiceNumber: string;
    issueDate: Date;
    dueDate: Date;
    currency: string;
    vatApplicable: boolean;
    vatRate: number;
    subtotal: number;
    vatAmount: number;
    timbreFiscalAmount: number;
    total: number;
    items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
    notes?: string | null;
    paymentTerms?: string | null;
  }): string {
    const lines = [
      `# FACTURE : ${params.invoiceNumber}`,
      `\n**Date d'émission** : ${params.issueDate.toISOString().split('T')[0]}`,
      `**Date d'échéance** : ${params.dueDate.toISOString().split('T')[0]}`,
      `\n---`,
      `\n### Émetteur :`,
      `**${params.org.name}**`,
      params.org.activityType ? `*${params.org.activityType}*` : '',
      params.org.taxId ? `Matricule Fiscal / Identifiant : ${params.org.taxId}` : '',
      params.org.address ? `Adresse : ${params.org.address}, ${params.org.city || ''}` : '',
      params.org.phone ? `Tél : ${params.org.phone}` : '',
      params.org.bankRib ? `RIB Bancaire : ${params.org.bankRib} (${params.org.bankName || 'Banque'})` : '',
      `\n### Client :`,
      `**${params.client.companyName ? `${params.client.companyName} (${params.client.name})` : params.client.name}**`,
      params.client.taxId ? `Matricule Fiscal Client : ${params.client.taxId}` : '',
      params.client.address ? `Adresse : ${params.client.address}` : '',
      params.client.email ? `Email : ${params.client.email}` : '',
      `\n---`,
      `\n### Détail des prestations :`,
      `| Description | Quantité | Prix Unitaire (${params.currency}) | Total (${params.currency}) |`,
      `| :--- | :---: | :---: | :---: |`,
    ];

    params.items.forEach((item) => {
      lines.push(
        `| ${item.description} | ${item.quantity} | ${item.unitPrice.toFixed(3)} | ${item.total.toFixed(3)} |`
      );
    });

    lines.push(`\n---`);
    lines.push(`\n### Récapitulatif :`);
    lines.push(`- **Total Hors Taxe (HT)** : ${params.subtotal.toFixed(3)} ${params.currency}`);

    if (params.vatApplicable) {
      lines.push(`- **TVA (${params.vatRate}%)** : ${params.vatAmount.toFixed(3)} ${params.currency}`);
      if (params.timbreFiscalAmount > 0) {
        lines.push(`- **Droit de Timbre Fiscal** : ${params.timbreFiscalAmount.toFixed(3)} ${params.currency}`);
      }
      lines.push(`- **TOTAL TTC À PAYER** : **${params.total.toFixed(3)} ${params.currency}**`);
    } else {
      lines.push(`- *TVA non applicable (Régime fiscal : ${params.org.taxRegime})*`);
      lines.push(`- **TOTAL NET À PAYER** : **${params.total.toFixed(3)} ${params.currency}**`);
    }

    if (params.paymentTerms) {
      lines.push(`\n**Modalités de paiement** : ${params.paymentTerms}`);
    }
    if (params.notes) {
      lines.push(`\n**Notes** : ${params.notes}`);
    }

    return lines.filter(Boolean).join('\n');
  }
}
