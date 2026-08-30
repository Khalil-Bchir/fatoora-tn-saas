import { createRoute, z } from '@hono/zod-openapi';
import { invoiceSchema } from './invoices.schema.js';
import { errorResponseSchema } from './common.schema.js';

export const getPublicInvoiceRoute = createRoute({
  method: 'get',
  path: '/{token}',
  tags: ['Public Invoices'],
  summary: 'Get invoice details by public shareable token',
  request: {
    params: z.object({
      token: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Invoice details for public viewing',
      content: {
        'application/json': {
          schema: z.object({ data: invoiceSchema }),
        },
      },
    },
    404: {
      description: 'Invoice not found or invalid token',
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

export const submitPaymentProofBodySchema = z.object({
  fileUrl: z.string().min(1, 'Proof file URL or base64 is required'),
  amount: z.number().optional(),
  notes: z.string().optional(),
});

export const submitPublicPaymentProofRoute = createRoute({
  method: 'post',
  path: '/{token}/payment-proof',
  tags: ['Public Invoices'],
  summary: 'Submit payment proof for invoice by public token',
  request: {
    params: z.object({
      token: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: submitPaymentProofBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Payment proof submitted successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              id: z.string(),
              status: z.string(),
              submittedAt: z.string().or(z.date()),
            }),
          }),
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
