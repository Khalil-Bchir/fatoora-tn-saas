import { OpenAPIHono } from '@hono/zod-openapi';
import type { AutoLoadRoute } from 'hono-autoload/types';
import type { Env } from '../../../types/index.js';
import { tenantMiddleware } from '../../../middleware/tenant.js';
import {
  listClientsRoute,
  getClientRoute,
  createClientRoute,
  updateClientRoute,
  deleteClientRoute,
} from '../../../schema/v1/clients.schema.js';
import { ClientsService } from '../../../services/clients.js';
import { logger } from '../../../utils/logger.js';

const handler = new OpenAPIHono<Env>();

handler.use('*', tenantMiddleware);

handler.openapi(listClientsRoute, async (c) => {
  const prisma = c.get('prisma');
  const orgId = c.get('organizationId')!;
  const { search, limit } = c.req.valid('query');
  const service = new ClientsService({ prisma });

  try {
    const clients = await service.listClients(orgId, search, limit);
    return c.json({ data: clients as any }, 200);
  } catch (error) {
    logger.error({ error, scope: 'clients.list' }, 'Failed to list clients');
    return c.json(
      {
        error: {
          message: 'Failed to retrieve clients',
          code: 'CLIENTS_LIST_FAILED',
        },
      },
      500
    );
  }
});

handler.openapi(getClientRoute, async (c) => {
  const prisma = c.get('prisma');
  const orgId = c.get('organizationId')!;
  const { id } = c.req.valid('param');
  const service = new ClientsService({ prisma });

  try {
    const client = await service.getClient(orgId, id);
    if (!client) {
      return c.json(
        {
          error: {
            message: 'Client not found',
            code: 'CLIENT_NOT_FOUND',
          },
        },
        404
      );
    }
    return c.json({ data: client as any }, 200);
  } catch (error) {
    logger.error({ error, scope: 'clients.get' }, 'Failed to get client');
    return c.json(
      {
        error: {
          message: 'Failed to retrieve client',
          code: 'CLIENT_GET_FAILED',
        },
      },
      500
    );
  }
});

handler.openapi(createClientRoute, async (c) => {
  const prisma = c.get('prisma');
  const orgId = c.get('organizationId')!;
  const body = c.req.valid('json');
  const service = new ClientsService({ prisma });

  try {
    const client = await service.createClient(orgId, body);
    return c.json({ data: client as any }, 201);
  } catch (error) {
    logger.error({ error, scope: 'clients.create' }, 'Failed to create client');
    return c.json(
      {
        error: {
          message: 'Failed to create client',
          code: 'CLIENT_CREATE_FAILED',
        },
      },
      500
    );
  }
});

handler.openapi(updateClientRoute, async (c) => {
  const prisma = c.get('prisma');
  const orgId = c.get('organizationId')!;
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const service = new ClientsService({ prisma });

  try {
    const updated = await service.updateClient(orgId, id, body);
    return c.json({ data: updated as any }, 200);
  } catch (error) {
    logger.error({ error, scope: 'clients.update' }, 'Failed to update client');
    return c.json(
      {
        error: {
          message: 'Failed to update client',
          code: 'CLIENT_UPDATE_FAILED',
        },
      },
      500
    );
  }
});

handler.openapi(deleteClientRoute, async (c) => {
  const prisma = c.get('prisma');
  const orgId = c.get('organizationId')!;
  const { id } = c.req.valid('param');
  const service = new ClientsService({ prisma });

  try {
    await service.deleteClient(orgId, id);
    return c.json({ success: true }, 200);
  } catch (error) {
    logger.error({ error, scope: 'clients.delete' }, 'Failed to delete client');
    return c.json(
      {
        error: {
          message: 'Failed to delete client',
          code: 'CLIENT_DELETE_FAILED',
        },
      },
      500
    );
  }
});

const routeModule: AutoLoadRoute = {
  path: '/api/v1/clients',
  handler: handler as unknown as AutoLoadRoute['handler'],
};

export default routeModule;
