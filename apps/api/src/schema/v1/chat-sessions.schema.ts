import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema } from './common.schema.js';
import { invoiceSchema } from './invoices.schema.js';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string().optional(),
});

export const extractedItemSchema = z.object({
  description: z.string(),
  quantity: z.number().default(1),
  unitPrice: z.number().default(0),
  vatRate: z.number().default(19),
  total: z.number().optional(),
});

export const extractedDataSchema = z.object({
  clientName: z.string().optional(),
  clientTaxId: z.string().optional(),
  currency: z.string().default('TND'),
  items: z.array(extractedItemSchema).default([]),
  subtotal: z.number().default(0),
  vatAmount: z.number().default(0),
  timbreFiscal: z.number().default(1.0),
  total: z.number().default(0),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
  isReady: z.boolean().default(false),
});

export const chatSessionSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string().nullable().optional(),
  title: z.string(),
  messages: z.array(chatMessageSchema),
  extractedData: extractedDataSchema.nullable().optional(),
  status: z.enum(['ACTIVE', 'FINALIZED', 'ABANDONED']),
  invoiceId: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export const createChatSessionBodySchema = z.object({
  initialMessage: z.string().optional(),
});

export const sendMessageBodySchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

export const listChatSessionsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Chat Sessions'],
  summary: 'List AI invoice chat sessions for current tenant',
  responses: {
    200: {
      description: 'List of chat sessions',
      content: {
        'application/json': {
          schema: z.object({ data: z.array(chatSessionSchema) }),
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

export const createChatSessionRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Chat Sessions'],
  summary: 'Create a new AI invoice chat session',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createChatSessionBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Chat session created',
      content: {
        'application/json': {
          schema: z.object({ data: chatSessionSchema }),
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

export const getChatSessionRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Chat Sessions'],
  summary: 'Get details of an AI invoice chat session',
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Chat session details',
      content: {
        'application/json': {
          schema: z.object({ data: chatSessionSchema }),
        },
      },
    },
    404: {
      description: 'Session not found',
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

export const sendMessageRoute = createRoute({
  method: 'post',
  path: '/{id}/messages',
  tags: ['Chat Sessions'],
  summary: 'Send message to AI assistant to refine invoice data',
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: sendMessageBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Message processed and invoice data extracted',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              session: chatSessionSchema,
              reply: z.string(),
              extractedData: extractedDataSchema,
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
      description: 'Session not found',
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

export const finalizeChatSessionRoute = createRoute({
  method: 'post',
  path: '/{id}/finalize',
  tags: ['Chat Sessions'],
  summary: 'Convert AI chat session extracted data into a real Invoice',
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    201: {
      description: 'Invoice created from AI chat session',
      content: {
        'application/json': {
          schema: z.object({ data: invoiceSchema }),
        },
      },
    },
    400: {
      description: 'Incomplete invoice data',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: 'Session not found',
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
