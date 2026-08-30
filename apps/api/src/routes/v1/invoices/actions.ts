import { OpenAPIHono } from '@hono/zod-openapi';
import type { AutoLoadRoute } from 'hono-autoload/types';
import type { Env } from '../../../types/index.js';
import { tenantMiddleware } from '../../../middleware/tenant.js';
import {
  listInvoicesRoute,
  getInvoiceRoute,
  createInvoiceRoute,
  updateInvoiceStatusRoute,
  deleteInvoiceRoute,
} from '../../../schema/v1/invoices.schema.js';
import { InvoicesService } from '../../../services/invoices.js';
import { logger } from '../../../utils/logger.js';

const handler = new OpenAPIHono<Env>();

handler.use('*', tenantMiddleware);

handler.openapi(listInvoicesRoute, async (c) => {
  const prisma = c.get('prisma');
  const orgId = c.get('organizationId')!;
  const { status, clientId, limit } = c.req.valid('query');
  const service = new InvoicesService({ prisma });

  try {
    const invoices = await service.listInvoices(orgId, status as any, clientId, limit);
    return c.json({ data: invoices as any }, 200);
  } catch (error) {
    logger.error({ error, scope: 'invoices.list' }, 'Failed to list invoices');
    return c.json(
      {
        error: {
          message: 'Failed to retrieve invoices',
          code: 'INVOICES_LIST_FAILED',
        },
      },
      500
    );
  }
});

handler.openapi(getInvoiceRoute, async (c) => {
  const prisma = c.get('prisma');
  const orgId = c.get('organizationId')!;
  const { id } = c.req.valid('param');
  const service = new InvoicesService({ prisma });

  try {
    const invoice = await service.getInvoice(orgId, id);
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
    logger.error({ error, scope: 'invoices.get' }, 'Failed to get invoice');
    return c.json(
      {
        error: {
          message: 'Failed to retrieve invoice',
          code: 'INVOICE_GET_FAILED',
        },
      },
      500
    );
  }
});

handler.openapi(createInvoiceRoute, async (c) => {
  const prisma = c.get('prisma');
  const orgId = c.get('organizationId')!;
  const org = c.get('organization')!;
  const body = c.req.valid('json');
  const service = new InvoicesService({ prisma });

  try {
    const created = await service.createInvoice(orgId, body as any, org);
    return c.json({ data: created as any }, 201);
  } catch (error) {
    logger.error({ error, scope: 'invoices.create' }, 'Failed to create invoice');
    return c.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Failed to create invoice',
          code: 'INVOICE_CREATE_FAILED',
        },
      },
      500
    );
  }
});

handler.openapi(updateInvoiceStatusRoute, async (c) => {
  const prisma = c.get('prisma');
  const orgId = c.get('organizationId')!;
  const { id } = c.req.valid('param');
  const { status } = c.req.valid('json');
  const service = new InvoicesService({ prisma });

  try {
    const updated = await service.updateInvoiceStatus(orgId, id, status as any);
    return c.json({ data: updated as any }, 200);
  } catch (error) {
    logger.error({ error, scope: 'invoices.updateStatus' }, 'Failed to update invoice status');
    return c.json(
      {
        error: {
          message: 'Failed to update status',
          code: 'INVOICE_STATUS_UPDATE_FAILED',
        },
      },
      500
    );
  }
});

handler.openapi(deleteInvoiceRoute, async (c) => {
  const prisma = c.get('prisma');
  const orgId = c.get('organizationId')!;
  const { id } = c.req.valid('param');
  const service = new InvoicesService({ prisma });

  try {
    await service.deleteInvoice(orgId, id);
    return c.json({ success: true }, 200);
  } catch (error) {
    logger.error({ error, scope: 'invoices.delete' }, 'Failed to delete invoice');
    return c.json(
      {
        error: {
          message: 'Failed to delete invoice',
          code: 'INVOICE_DELETE_FAILED',
        },
      },
      500
    );
  }
});

const routeModule: AutoLoadRoute = {
  path: '/api/v1/invoices',
  handler: handler as unknown as AutoLoadRoute['handler'],
};

export default routeModule;
