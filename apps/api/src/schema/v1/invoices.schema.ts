import { createRoute, z } from '@hono/zod-openapi';
import { clientSchema } from './clients.schema.js';
import { organizationSchema } from './organizations.schema.js';
import { errorResponseSchema } from './common.schema.js';

export const invoiceStatusEnum = z.enum([
  'DRAFT',
  'SENT',
  'AWAITING_PAYMENT',
  'PAYMENT_CLAIMED',
  'PAID',
  'OVERDUE',
  'DISPUTED',
  'CANCELLED',
]);

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  invoiceId: z.string().optional(),
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  vatRate: z.number(),
  total: z.number(),
});

export const invoiceSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  invoiceNumber: z.string(),
  clientId: z.string(),
  currency: z.string(),
  vatApplicable: z.boolean(),
  vatRate: z.number(),
  subtotal: z.number(),
  vatAmount: z.number(),
  timbreFiscalAmount: z.number(),
  total: z.number(),
  issueDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
  status: invoiceStatusEnum,
  publicToken: z.string(),
  pdfUrl: z.string().nullable().optional(),
  mdContent: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  paymentTerms: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  items: z.array(invoiceItemSchema),
  client: clientSchema.optional(),
  organization: organizationSchema.optional(),
});

export const createInvoiceItemBodySchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative().default(0),
  vatRate: z.number().nonnegative().default(0),
});

export const createInvoiceBodySchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  currency: z.string().default('TND'),
  vatApplicable: z.boolean().optional(),
  vatRate: z.number().optional(),
  timbreFiscalAmount: z.number().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  items: z.array(createInvoiceItemBodySchema).min(1, 'At least one item is required'),
});

export const updateInvoiceStatusBodySchema = z.object({
  status: invoiceStatusEnum,
});

export const listInvoicesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Invoices'],
  summary: 'List invoices for current tenant organization',
  request: {
    query: z.object({
      status: invoiceStatusEnum.optional(),
      clientId: z.string().optional(),
      limit: z.coerce.number().optional().default(50),
    }),
  },
  responses: {
    200: {
      description: 'List of invoices',
      content: {
        'application/json': {
          schema: z.object({ data: z.array(invoiceSchema) }),
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

export const getInvoiceRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Invoices'],
  summary: 'Get single invoice by ID',
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Invoice details',
      content: {
        'application/json': {
          schema: z.object({ data: invoiceSchema }),
        },
      },
    },
    404: {
      description: 'Invoice not found',
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

export const createInvoiceRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Invoices'],
  summary: 'Create a new invoice with per-tenant sequential numbering and auto VAT calculation',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createInvoiceBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Invoice created',
      content: {
        'application/json': {
          schema: z.object({ data: invoiceSchema }),
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

export const sendInvoiceRoute = createRoute({
  method: 'post',
  path: '/{id}/send',
  tags: ['Invoices'],
  summary: 'Mark invoice as sent and generate sharing options',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Invoice marked as sent',
      content: {
        'application/json': { schema: z.object({ data: invoiceSchema }) },
      },
    },
    404: {
      description: 'Invoice not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const cancelInvoiceRoute = createRoute({
  method: 'post',
  path: '/{id}/cancel',
  tags: ['Invoices'],
  summary: 'Cancel an invoice',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Invoice cancelled',
      content: {
        'application/json': { schema: z.object({ data: invoiceSchema }) },
      },
    },
    404: {
      description: 'Invoice not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const duplicateInvoiceRoute = createRoute({
  method: 'post',
  path: '/{id}/duplicate',
  tags: ['Invoices'],
  summary: 'Duplicate an invoice as a new draft with next sequential number',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    201: {
      description: 'Invoice duplicated',
      content: {
        'application/json': { schema: z.object({ data: invoiceSchema }) },
      },
    },
    404: {
      description: 'Original invoice not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const updateInvoiceStatusRoute = createRoute({
  method: 'patch',
  path: '/{id}/status',
  tags: ['Invoices'],
  summary: 'Update invoice status (manual lifecycle tracking)',
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateInvoiceStatusBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Status updated',
      content: {
        'application/json': {
          schema: z.object({ data: invoiceSchema }),
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
      description: 'Invoice not found',
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

export const deleteInvoiceRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Invoices'],
  summary: 'Delete invoice',
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Invoice deleted',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean() }),
        },
      },
    },
    404: {
      description: 'Invoice not found',
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
