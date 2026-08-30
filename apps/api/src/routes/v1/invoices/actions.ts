import { OpenAPIHono } from '@hono/zod-openapi';
import type { AutoLoadRoute } from 'hono-autoload/types';
import type { Env } from '../../../types/index.js';
import { tenantMiddleware } from '../../../middleware/tenant.js';
import { InvoicesService } from '../../../services/invoices.js';
import {
  listInvoicesRoute,
  getInvoiceRoute,
  createInvoiceRoute,
  updateInvoiceStatusRoute,
  deleteInvoiceRoute,
  sendInvoiceRoute,
  cancelInvoiceRoute,
  duplicateInvoiceRoute,
} from '../../../schema/v1/invoices.schema.js';
import type { InvoiceStatus } from '@repo/types';

const handler = new OpenAPIHono<Env>();

handler.use('*', tenantMiddleware);

handler.openapi(listInvoicesRoute, async (c) => {
  const orgId = c.get('organizationId');
  const query = c.req.valid('query');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new InvoicesService();
    const invoices = await service.listInvoices(
      orgId,
      query?.status as InvoiceStatus | undefined,
      query?.clientId,
      query?.limit
    );
    return c.json({ data: invoices as any }, 200);
  } catch (error: any) {
    return c.json({ error: { message: error.message || 'Failed to list invoices' } }, 500);
  }
});

handler.openapi(getInvoiceRoute, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.valid('param');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new InvoicesService();
    const invoice = await service.getInvoiceById(orgId, id);
    if (!invoice) {
      return c.json({ error: { message: 'Invoice not found' } }, 404);
    }
    return c.json({ data: invoice as any }, 200);
  } catch (error: any) {
    return c.json({ error: { message: error.message || 'Failed to get invoice' } }, 500);
  }
});

handler.openapi(createInvoiceRoute, async (c) => {
  const orgId = c.get('organizationId');
  const body = c.req.valid('json');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new InvoicesService();
    const invoice = await service.createInvoice(body, orgId);
    return c.json({ data: invoice as any }, 201);
  } catch (error: any) {
    return c.json({ error: { message: error.message || 'Failed to create invoice' } }, 400);
  }
});

handler.openapi(sendInvoiceRoute, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.valid('param');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new InvoicesService();
    const invoice = await service.sendInvoice(orgId, id);
    return c.json({ data: invoice as any }, 200);
  } catch (error: any) {
    const isNotFound = /not found/i.test(error.message);
    return c.json(
      { error: { message: error.message || 'Failed to send invoice' } },
      isNotFound ? 404 : 500
    );
  }
});

handler.openapi(cancelInvoiceRoute, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.valid('param');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new InvoicesService();
    const invoice = await service.cancelInvoice(orgId, id);
    return c.json({ data: invoice as any }, 200);
  } catch (error: any) {
    const isNotFound = /not found/i.test(error.message);
    return c.json(
      { error: { message: error.message || 'Failed to cancel invoice' } },
      isNotFound ? 404 : 500
    );
  }
});

handler.openapi(duplicateInvoiceRoute, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.valid('param');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new InvoicesService();
    const invoice = await service.duplicateInvoice(orgId, id);
    return c.json({ data: invoice as any }, 201);
  } catch (error: any) {
    const isNotFound = /not found/i.test(error.message);
    return c.json(
      { error: { message: error.message || 'Failed to duplicate invoice' } },
      isNotFound ? 404 : 500
    );
  }
});

handler.openapi(updateInvoiceStatusRoute, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new InvoicesService();
    const invoice = await service.updateInvoiceStatus(orgId, id, body.status as InvoiceStatus);
    return c.json({ data: invoice as any }, 200);
  } catch (error: any) {
    const isNotFound = /not found/i.test(error.message);
    return c.json(
      { error: { message: error.message || 'Failed to update invoice status' } },
      isNotFound ? 404 : 400
    );
  }
});

handler.openapi(deleteInvoiceRoute, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.valid('param');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new InvoicesService();
    await service.deleteInvoice(orgId, id);
    return c.json({ success: true }, 200);
  } catch (error: any) {
    const isNotFound = /not found/i.test(error.message);
    return c.json(
      { error: { message: error.message || 'Failed to delete invoice' } },
      isNotFound ? 404 : 500
    );
  }
});

const route: AutoLoadRoute = {
  path: '/api/v1/invoices',
  handler,
};

export default route;
