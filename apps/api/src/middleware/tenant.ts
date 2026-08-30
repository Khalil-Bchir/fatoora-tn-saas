import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types/index.js';
import { logger } from '../utils/logger.js';

export const tenantMiddleware: MiddlewareHandler<Env> = async (c, next) => {
  const prisma = c.get('prisma');
  
  // Look for tenant id from header or user session
  let orgId = c.req.header('x-organization-id');

  // Fallback: check query parameter ?organizationId=...
  if (!orgId) {
    orgId = c.req.query('organizationId');
  }

  // Fallback: If no organizationId is passed in header or user, retrieve or create default org
  if (!orgId) {
    let defaultOrg = await prisma.organization.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!defaultOrg) {
      // Auto-bootstrap a demo Tunisian business tenant if none exists
      defaultOrg = await prisma.organization.create({
        data: {
          name: 'Mon Entreprise Tunisienne',
          activityType: 'Services Informatiques & Conseil',
          taxRegime: 'AUTO_ENTREPRENEUR',
          vatRegistered: false,
          taxId: '1234567/A/M/000',
          address: 'Avenue Habib Bourguiba',
          city: 'Tunis',
          postalCode: '1000',
          country: 'Tunisie',
          phone: '+216 71 000 000',
          email: 'contact@entreprise.tn',
          bankName: 'BIAT',
          bankRib: '08000000000000000000',
          currency: 'TND',
          defaultVatRate: 19.0,
          invoicePrefix: 'FAC',
          invoiceCounter: 0,
        },
      });
      logger.info({ orgId: defaultOrg.id }, 'Initialized default organization');
    }

    orgId = defaultOrg.id;
    c.set('organizationId', orgId);
    c.set('organization', defaultOrg);
  } else {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return c.json(
        {
          error: {
            message: 'Organization not found',
            code: 'TENANT_NOT_FOUND',
          },
        },
        404
      );
    }

    c.set('organizationId', org.id);
    c.set('organization', org);
  }

  await next();
};
