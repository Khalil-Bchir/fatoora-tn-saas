import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema } from './common.schema.js';
import { invoiceSchema } from './invoices.schema.js';

export const paymentProofSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  organizationId: z.string(),
  fileUrl: z.string(),
  amount: z.number().nullable().optional(),
  submittedAt: z.string().or(z.date()),
  status: z.enum(['SUBMITTED', 'CONFIRMED', 'REJECTED']),
  notes: z.string().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  invoice: invoiceSchema.optional(),
});

export const rejectProofBodySchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
});

export const listPaymentProofsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Payment Proofs'],
  summary: 'List payment review queue for current tenant organization',
  responses: {
    200: {
      description: 'List of payment proofs',
      content: {
        'application/json': {
          schema: z.object({ data: z.array(paymentProofSchema) }),
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

export const confirmPaymentProofRoute = createRoute({
  method: 'post',
  path: '/{id}/confirm',
  tags: ['Payment Proofs'],
  summary: 'Confirm a payment proof and mark the invoice as PAID',
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Payment confirmed successfully',
      content: {
        'application/json': {
          schema: z.object({ data: paymentProofSchema }),
        },
      },
    },
    404: {
      description: 'Proof not found',
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

export const rejectPaymentProofRoute = createRoute({
  method: 'post',
  path: '/{id}/reject',
  tags: ['Payment Proofs'],
  summary: 'Reject a payment proof with reason and mark invoice as DISPUTED',
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: rejectProofBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Payment proof rejected',
      content: {
        'application/json': {
          schema: z.object({ data: paymentProofSchema }),
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
      description: 'Proof not found',
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
