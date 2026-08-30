import { prisma } from '@repo/database';
import { logger } from '../utils/logger.js';

export class PaymentProofsService {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  async listProofs() {
    return prisma.paymentProof.findMany({
      where: {
        organizationId: this.organizationId,
      },
      include: {
        invoice: {
          include: {
            client: true,
            items: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }

  async confirmProof(id: string) {
    const proof = await prisma.paymentProof.findFirst({
      where: {
        id,
        organizationId: this.organizationId,
      },
      include: {
        invoice: true,
      },
    });

    if (!proof) {
      throw new Error('Payment proof not found');
    }

    const updatedProof = await prisma.paymentProof.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
      },
      include: {
        invoice: {
          include: { client: true, items: true },
        },
      },
    });

    // Update invoice status to PAID
    await prisma.invoice.update({
      where: { id: proof.invoiceId },
      data: { status: 'PAID' },
    });

    logger.info({ proofId: id, invoiceId: proof.invoiceId }, 'Payment proof confirmed and invoice marked as PAID');
    return updatedProof;
  }

  async rejectProof(id: string, rejectionReason: string) {
    const proof = await prisma.paymentProof.findFirst({
      where: {
        id,
        organizationId: this.organizationId,
      },
      include: {
        invoice: true,
      },
    });

    if (!proof) {
      throw new Error('Payment proof not found');
    }

    const updatedProof = await prisma.paymentProof.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason,
      },
      include: {
        invoice: {
          include: { client: true, items: true },
        },
      },
    });

    // Update invoice status to DISPUTED
    await prisma.invoice.update({
      where: { id: proof.invoiceId },
      data: { status: 'DISPUTED' },
    });

    logger.info({ proofId: id, invoiceId: proof.invoiceId, rejectionReason }, 'Payment proof rejected and invoice marked as DISPUTED');
    return updatedProof;
  }
}
