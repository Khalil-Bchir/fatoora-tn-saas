import { OpenAPIHono } from '@hono/zod-openapi';
import type { AutoLoadRoute } from 'hono-autoload/types';
import type { Env } from '../../../types/index.js';
import { tenantMiddleware } from '../../../middleware/tenant.js';
import { PaymentProofsService } from '../../../services/payment-proofs.js';
import {
  listPaymentProofsRoute,
  confirmPaymentProofRoute,
  rejectPaymentProofRoute,
} from '../../../schema/v1/payment-proofs.schema.js';

const handler = new OpenAPIHono<Env>();

handler.use('*', tenantMiddleware);

handler.openapi(listPaymentProofsRoute, async (c) => {
  const orgId = c.get('organizationId');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new PaymentProofsService(orgId);
    const proofs = await service.listProofs();
    return c.json({ data: proofs as any }, 200);
  } catch (error: any) {
    return c.json({ error: { message: error.message || 'Failed to list payment proofs' } }, 500);
  }
});

handler.openapi(confirmPaymentProofRoute, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.valid('param');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new PaymentProofsService(orgId);
    const updated = await service.confirmProof(id);
    return c.json({ data: updated as any }, 200);
  } catch (error: any) {
    const isNotFound = /not found/i.test(error.message);
    return c.json(
      { error: { message: error.message || 'Failed to confirm payment proof' } },
      isNotFound ? 404 : 500
    );
  }
});

handler.openapi(rejectPaymentProofRoute, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.valid('param');
  const { reason } = c.req.valid('json');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new PaymentProofsService(orgId);
    const updated = await service.rejectProof(id, reason);
    return c.json({ data: updated as any }, 200);
  } catch (error: any) {
    const isNotFound = /not found/i.test(error.message);
    return c.json(
      { error: { message: error.message || 'Failed to reject payment proof' } },
      isNotFound ? 404 : 500
    );
  }
});

const route: AutoLoadRoute = {
  path: '/api/v1/payment-proofs',
  handler,
};

export default route;
