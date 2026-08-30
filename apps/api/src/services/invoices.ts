import { prisma } from '@repo/database';
import type { PrismaClient } from '@repo/database';
import type { CreateInvoiceRequest, InvoiceStatus } from '@repo/types';
import crypto from 'crypto';

export class InvoicesService {
  private prisma: PrismaClient;
  private organizationId?: string;

  constructor(organizationId?: string, prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
    this.organizationId = organizationId;
  }

  async listInvoices(orgId: string, status?: InvoiceStatus, clientId?: string, limit = 50) {
    return this.prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        ...(status ? { status } : {}),
        ...(clientId ? { clientId } : {}),
      },
      include: {
        client: true,
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getInvoiceById(orgId: string, invoiceId: string) {
    return this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId: orgId,
      },
      include: {
        client: true,
        items: true,
        organization: true,
        paymentProofs: true,
      },
    });
  }

  async createInvoice(data: CreateInvoiceRequest, organizationId?: string) {
    const orgId = organizationId || this.organizationId;
    if (!orgId) {
      throw new Error('Organization ID is required to create an invoice');
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    const vatApplicable = data.vatApplicable ?? org.vatRegistered;
    const defaultVatRate = data.vatRate ?? org.defaultVatRate ?? 19.0;
    const timbreFiscalAmount = vatApplicable ? data.timbreFiscalAmount ?? 1.0 : 0;

    let subtotal = 0;
    let totalVatAmount = 0;

    const calculatedItems = data.items.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemVatRate = vatApplicable ? item.vatRate ?? defaultVatRate : 0;
      const itemVatAmount = (itemSubtotal * itemVatRate) / 100;
      const itemTotal = itemSubtotal + itemVatAmount;

      subtotal += itemSubtotal;
      totalVatAmount += itemVatAmount;

      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: itemVatRate,
        total: itemTotal,
      };
    });

    const total = subtotal + totalVatAmount + timbreFiscalAmount;

    // Increment per-organization sequential invoice counter
    const updatedOrg = await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        invoiceCounter: {
          increment: 1,
        },
      },
    });

    const year = new Date().getFullYear();
    const sequenceNumber = String(updatedOrg.invoiceCounter).padStart(4, '0');
    const invoicePrefix = updatedOrg.invoicePrefix || 'FAC';
    const invoiceNumber = `${invoicePrefix}-${year}-${sequenceNumber}`;

    // Cryptographically secure random token for public link
    const publicToken = crypto.randomBytes(24).toString('hex');

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

  async sendInvoice(orgId: string, invoiceId: string) {
    const existing = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgId },
    });
    if (!existing) {
      throw new Error('Invoice not found');
    }
    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'SENT' },
      include: { client: true, items: true },
    });
  }

  async cancelInvoice(orgId: string, invoiceId: string) {
    const existing = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgId },
    });
    if (!existing) {
      throw new Error('Invoice not found');
    }
    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'CANCELLED' },
      include: { client: true, items: true },
    });
  }

  async duplicateInvoice(orgId: string, invoiceId: string) {
    const original = await this.getInvoiceById(orgId, invoiceId);
    if (!original) {
      throw new Error('Original invoice not found');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    return this.createInvoice(
      {
        clientId: original.clientId,
        currency: original.currency,
        vatApplicable: original.vatApplicable,
        vatRate: original.vatRate,
        timbreFiscalAmount: original.timbreFiscalAmount,
        dueDate: (dueDate.toISOString().split('T')[0] as string),
        notes: original.notes || undefined,
        paymentTerms: original.paymentTerms || undefined,
        items: original.items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          vatRate: it.vatRate,
        })),
      },
      orgId
    );
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

    return { success: true };
  }

  async getPublicInvoiceByToken(token: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { publicToken: token },
      include: {
        client: true,
        items: true,
        organization: true,
        paymentProofs: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found with provided token');
    }

    return invoice;
  }

  async submitPublicPaymentProof(
    token: string,
    data: { fileUrl: string; amount?: number; notes?: string }
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { publicToken: token },
    });

    if (!invoice) {
      throw new Error('Invoice not found with provided token');
    }

    const proof = await this.prisma.paymentProof.create({
      data: {
        invoiceId: invoice.id,
        organizationId: invoice.organizationId,
        fileUrl: data.fileUrl,
        amount: data.amount || invoice.total,
        notes: data.notes || null,
        status: 'SUBMITTED',
      },
    });

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'PAYMENT_CLAIMED',
      },
    });

    return proof;
  }

  private generateInvoiceMarkdown(params: {
    org: any;
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
    items: Array<any>;
    notes?: string | null;
    paymentTerms?: string | null;
  }): string {
    const {
      org,
      client,
      invoiceNumber,
      issueDate,
      dueDate,
      currency,
      vatApplicable,
      vatRate,
      subtotal,
      vatAmount,
      timbreFiscalAmount,
      total,
      items,
      notes,
      paymentTerms,
    } = params;

    let md = `# FACTURE ${invoiceNumber}\n\n`;
    md += `**Date d'émission** : ${issueDate.toLocaleDateString('fr-TN')}\n`;
    md += `**Date d'échéance** : ${dueDate.toLocaleDateString('fr-TN')}\n\n`;
    md += `---\n\n`;
    md += `### ÉMETTEUR\n`;
    md += `**${org.name}**\n`;
    if (org.activityType) md += `*${org.activityType}*\n`;
    if (org.taxId) md += `Matricule Fiscal : \`${org.taxId}\`\n`;
    if (org.address) md += `Adresse : ${org.address}, ${org.city || ''}\n`;
    if (org.phone) md += `Tél : ${org.phone}\n`;
    if (org.email) md += `Email : ${org.email}\n`;
    if (org.bankRib) md += `RIB : \`${org.bankRib}\` (${org.bankName || 'Banque'})\n\n`;

    md += `### DESTINATAIRE (CLIENT)\n`;
    md += `**${client.name}**\n`;
    if (client.companyName) md += `Entreprise : ${client.companyName}\n`;
    if (client.taxId) md += `Matricule Fiscal : \`${client.taxId}\`\n`;
    if (client.address) md += `Adresse : ${client.address}, ${client.city || ''}\n\n`;

    md += `---\n\n`;
    md += `### DÉTAIL DES PRESTATIONS\n\n`;
    md += `| Description | Qté | Prix Unitaire (${currency}) | TVA (%) | Total (${currency}) |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: |\n`;

    items.forEach((item) => {
      md += `| ${item.description} | ${item.quantity} | ${item.unitPrice.toFixed(3)} | ${item.vatRate}% | ${item.total.toFixed(3)} |\n`;
    });

    md += `\n`;
    md += `### RÉCAPITULATIF FINANCIER\n\n`;
    md += `- **Total Hors Taxe (HT)** : ${subtotal.toFixed(3)} ${currency}\n`;
    if (vatApplicable) {
      md += `- **Total TVA (${vatRate}%)** : ${vatAmount.toFixed(3)} ${currency}\n`;
      if (timbreFiscalAmount > 0) {
        md += `- **Droit de Timbre Fiscal** : ${timbreFiscalAmount.toFixed(3)} ${currency}\n`;
      }
      md += `- **TOTAL TOUTES TAXES COMPRISES (TTC)** : **${total.toFixed(3)} ${currency}**\n\n`;
    } else {
      md += `*TVA non applicable (Régime : ${org.taxRegime || 'Auto-Entrepreneur'})*\n`;
      md += `- **NET À PAYER** : **${total.toFixed(3)} ${currency}**\n\n`;
    }

    if (paymentTerms) {
      md += `**Modalités de règlement** : ${paymentTerms}\n\n`;
    }

    if (notes) {
      md += `**Notes** : ${notes}\n\n`;
    }

    return md;
  }
}
