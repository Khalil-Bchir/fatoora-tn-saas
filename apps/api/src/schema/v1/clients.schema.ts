import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema } from './common.schema.js';

export const clientSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  companyName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export const createClientBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  companyName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateClientBodySchema = createClientBodySchema.partial();

export const listClientsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Clients'],
  summary: 'List clients for current tenant organization',
  request: {
    query: z.object({
      search: z.string().optional(),
      limit: z.coerce.number().optional().default(50),
    }),
  },
  responses: {
    200: {
      description: 'List of clients',
      content: {
        'application/json': {
          schema: z.object({ data: z.array(clientSchema) }),
        },
      },
    },
    500: {
      description: 'Server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

export const getClientRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Clients'],
  summary: 'Get single client by ID',
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Client details',
      content: {
        'application/json': {
          schema: z.object({ data: clientSchema }),
        },
      },
    },
    404: {
      description: 'Client not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

export const createClientRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Clients'],
  summary: 'Create new client for current organization',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createClientBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Client created',
      content: {
        'application/json': {
          schema: z.object({ data: clientSchema }),
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

export const updateClientRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Clients'],
  summary: 'Update client',
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateClientBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Client updated',
      content: {
        'application/json': {
          schema: z.object({ data: clientSchema }),
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: 'Client not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

export const deleteClientRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Clients'],
  summary: 'Delete client',
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Client deleted',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean() }),
        },
      },
    },
    404: {
      description: 'Client not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
