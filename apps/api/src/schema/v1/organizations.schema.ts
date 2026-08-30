import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema } from './common.schema.js';

export const taxRegimeEnum = z.enum(['AUTO_ENTREPRENEUR', 'FORFAITAIRE', 'REEL']);

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerUserId: z.string().nullable().optional(),
  activityType: z.string().nullable().optional(),
  taxRegime: taxRegimeEnum,
  vatRegistered: z.boolean(),
  taxId: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  bankRib: z.string().nullable().optional(),
  bankIban: z.string().nullable().optional(),
  bankBic: z.string().nullable().optional(),
  stampImageUrl: z.string().nullable().optional(),
  signatureImageUrl: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  invoicePrefix: z.string(),
  invoiceCounter: z.number(),
  currency: z.string(),
  defaultVatRate: z.number(),
  defaultPaymentTerms: z.string().nullable().optional(),
  plan: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  activityType: z.string().nullable().optional(),
  taxRegime: taxRegimeEnum.optional(),
  vatRegistered: z.boolean().optional(),
  taxId: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().or(z.literal('')).nullable().optional(),
  website: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  bankRib: z.string().nullable().optional(),
  bankIban: z.string().nullable().optional(),
  bankBic: z.string().nullable().optional(),
  stampImageUrl: z.string().nullable().optional(),
  signatureImageUrl: z.string().nullable().optional(),
  stampUrl: z.string().nullable().optional(),
  signatureUrl: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  invoicePrefix: z.string().optional(),
  currency: z.string().optional(),
  defaultVatRate: z.number().optional(),
  defaultPaymentTerms: z.string().nullable().optional(),
});

export const getOrganizationRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Organizations'],
  summary: 'Get current tenant organization profile',
  responses: {
    200: {
      description: 'Current organization profile',
      content: {
        'application/json': {
          schema: z.object({ data: organizationSchema }),
        },
      },
    },
    404: {
      description: 'Organization not found',
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

export const updateOrganizationRoute = createRoute({
  method: 'patch',
  path: '/',
  tags: ['Organizations'],
  summary: 'Update current tenant organization settings',
  request: {
    body: {
      content: {
        'application/json': {
          schema: updateOrganizationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated organization profile',
      content: {
        'application/json': {
          schema: z.object({ data: organizationSchema }),
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
