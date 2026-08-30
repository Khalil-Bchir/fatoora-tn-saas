import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema } from './common.schema.js';

export const uploadMediaBodySchema = z.object({
  data: z.string().min(1, 'Base64 data or content is required'),
  fileName: z.string().default('media.png'),
  folder: z.enum(['signatures', 'stamps', 'payment-proofs', 'logos', 'general']).default('general'),
});

export const uploadMediaResponseSchema = z.object({
  url: z.string().url(),
  fileName: z.string(),
  folder: z.string(),
});

export const uploadMediaRoute = createRoute({
  method: 'post',
  path: '/upload',
  tags: ['Storage'],
  summary: 'Upload media files (signatures, stamps, logos, proofs) to Supabase Storage',
  request: {
    body: {
      content: {
        'application/json': {
          schema: uploadMediaBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'File uploaded successfully to Supabase Storage',
      content: {
        'application/json': {
          schema: z.object({
            data: uploadMediaResponseSchema,
          }),
        },
      },
    },
    400: {
      description: 'Validation or upload error',
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
