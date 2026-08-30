import { OpenAPIHono } from '@hono/zod-openapi';
import type { AutoLoadRoute } from 'hono-autoload/types';
import type { Env } from '../../../types/index.js';
import {
  getPublicInvoiceRoute,
  submitPublicPaymentProofRoute,
} from '../../../schema/v1/public-invoices.schema.js';
import { InvoicesService } from '../../../services/invoices.js';
import { logger } from '../../../utils/logger.js';

const handler = new OpenAPIHono<Env>();

// Public route: NO tenant middleware (resolves strictly by token)
handler.openapi(getPublicInvoiceRoute, async (c) => {
  const prisma = c.get('prisma');
  const { token } = c.req.valid('param');
  const service = new InvoicesService(undefined, prisma);

  try {
    const invoice = await service.getPublicInvoiceByToken(token);
    if (!invoice) {
      return c.json(
        {
          error: {
            message: 'Invoice not found',
            code: 'INVOICE_NOT_FOUND',
          },
        },
        404
      );
    }
    return c.json({ data: invoice as any }, 200);
  } catch (error) {
    logger.error({ error, scope: 'publicInvoices.get' }, 'Failed to get public invoice');
    return c.json(
      {
        error: {
          message: 'Failed to load invoice',
          code: 'PUBLIC_INVOICE_GET_FAILED',
        },
      },
      500
    );
  }
});

handler.openapi(submitPublicPaymentProofRoute, async (c) => {
  const prisma = c.get('prisma');
  const { token } = c.req.valid('param');
  const body = c.req.valid('json');
  const service = new InvoicesService(undefined, prisma);

  try {
    const invoice = await service.getPublicInvoiceByToken(token);
    if (!invoice) {
      return c.json(
        {
          error: {
            message: 'Invoice not found',
            code: 'INVOICE_NOT_FOUND',
          },
        },
        404
      );
    }

    const proof = await prisma.paymentProof.create({
      data: {
        organizationId: invoice.organizationId,
        invoiceId: invoice.id,
        fileUrl: body.fileUrl,
        amount: body.amount ?? invoice.total,
        notes: body.notes || null,
        status: 'SUBMITTED',
      },
    });

    // Automatically transition status to PAYMENT_CLAIMED
    if (invoice.status === 'SENT' || invoice.status === 'AWAITING_PAYMENT') {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'PAYMENT_CLAIMED' },
      });
    }

    return c.json(
      {
        data: {
          id: proof.id,
          status: proof.status,
          submittedAt: proof.submittedAt,
        },
      },
      201
    );
  } catch (error) {
    logger.error({ error, scope: 'publicInvoices.proof' }, 'Failed to submit payment proof');
    return c.json(
      {
        error: {
          message: 'Failed to submit payment proof',
          code: 'PAYMENT_PROOF_FAILED',
        },
      },
      500
    );
  }
});

const routeModule: AutoLoadRoute = {
  path: '/api/v1/public/invoices',
  handler: handler as unknown as AutoLoadRoute['handler'],
};

export default routeModule;
