import { OpenAPIHono } from '@hono/zod-openapi';
import type { AutoLoadRoute } from 'hono-autoload/types';
import type { Env } from '../../../types/index.js';
import { tenantMiddleware } from '../../../middleware/tenant.js';
import {
  getOrganizationRoute,
  updateOrganizationRoute,
} from '../../../schema/v1/organizations.schema.js';
import { OrganizationsService } from '../../../services/organizations.js';
import { logger } from '../../../utils/logger.js';

const handler = new OpenAPIHono<Env>();

handler.use('*', tenantMiddleware);

handler.openapi(getOrganizationRoute, async (c) => {
  const prisma = c.get('prisma');
  const orgId = c.get('organizationId')!;
  const service = new OrganizationsService({ prisma });

  try {
    const org = await service.getOrganization(orgId);
    if (!org) {
      return c.json(
        {
          error: {
            message: 'Organization not found',
            code: 'ORG_NOT_FOUND',
          },
        },
        404
      );
    }
    return c.json({ data: org as any }, 200);
  } catch (error) {
    logger.error({ error, scope: 'organizations.get' }, 'Failed to get organization');
    return c.json(
      {
        error: {
          message: 'Failed to retrieve organization',
          code: 'ORG_GET_FAILED',
        },
      },
      500
    );
  }
});

handler.openapi(updateOrganizationRoute, async (c) => {
  const prisma = c.get('prisma');
  const orgId = c.get('organizationId')!;
  const body = c.req.valid('json');
  const service = new OrganizationsService({ prisma });

  try {
    const updated = await service.updateOrganization(orgId, body);
    return c.json({ data: updated as any }, 200);
  } catch (error) {
    logger.error({ error, scope: 'organizations.update' }, 'Failed to update organization');
    return c.json(
      {
        error: {
          message: 'Failed to update organization',
          code: 'ORG_UPDATE_FAILED',
        },
      },
      500
    );
  }
});

const routeModule: AutoLoadRoute = {
  path: '/api/v1/organization',
  handler: handler as unknown as AutoLoadRoute['handler'],
};

export default routeModule;
