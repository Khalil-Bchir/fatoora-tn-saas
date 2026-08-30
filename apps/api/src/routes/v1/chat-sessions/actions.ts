import { OpenAPIHono } from '@hono/zod-openapi';
import type { AutoLoadRoute } from 'hono-autoload/types';
import type { Env } from '../../../types/index.js';
import { tenantMiddleware } from '../../../middleware/tenant.js';
import { ChatSessionsService } from '../../../services/chat-sessions.js';
import {
  listChatSessionsRoute,
  createChatSessionRoute,
  getChatSessionRoute,
  sendMessageRoute,
  updateDraftRoute,
  finalizeChatSessionRoute,
} from '../../../schema/v1/chat-sessions.schema.js';

const handler = new OpenAPIHono<Env>();

handler.use('*', tenantMiddleware);

handler.openapi(listChatSessionsRoute, async (c) => {
  const orgId = c.get('organizationId');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new ChatSessionsService(orgId);
    const sessions = await service.listSessions();
    return c.json({ data: sessions as any }, 200);
  } catch (error: any) {
    return c.json({ error: { message: error.message || 'Failed to list chat sessions' } }, 500);
  }
});

handler.openapi(createChatSessionRoute, async (c) => {
  const orgId = c.get('organizationId');
  const body = c.req.valid('json');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new ChatSessionsService(orgId);
    const session = await service.createSession(body?.initialMessage);
    return c.json({ data: session as any }, 201);
  } catch (error: any) {
    return c.json({ error: { message: error.message || 'Failed to create chat session' } }, 500);
  }
});

handler.openapi(getChatSessionRoute, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.valid('param');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new ChatSessionsService(orgId);
    const session = await service.getSession(id);
    if (!session) {
      return c.json({ error: { message: 'Session not found' } }, 404);
    }
    return c.json({ data: session as any }, 200);
  } catch (error: any) {
    return c.json({ error: { message: error.message || 'Failed to get chat session' } }, 500);
  }
});

handler.openapi(sendMessageRoute, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.valid('param');
  const { message } = c.req.valid('json');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new ChatSessionsService(orgId);
    const result = await service.sendMessage(id, message);
    return c.json({ data: result as any }, 200);
  } catch (error: any) {
    const isNotFound = /not found/i.test(error.message);
    return c.json(
      { error: { message: error.message || 'Failed to send message' } },
      isNotFound ? 404 : 500
    );
  }
});

handler.openapi(updateDraftRoute, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new ChatSessionsService(orgId);
    const result = await service.updateDraft(id, body as any);
    return c.json({ data: result as any }, 200);
  } catch (error: any) {
    const isNotFound = /not found/i.test(error.message);
    return c.json(
      { error: { message: error.message || 'Failed to update draft' } },
      isNotFound ? 404 : 500
    );
  }
});

handler.openapi(finalizeChatSessionRoute, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.valid('param');
  if (!orgId) {
    return c.json({ error: { message: 'Organization context missing' } }, 500);
  }
  try {
    const service = new ChatSessionsService(orgId);
    const invoice = await service.finalizeSession(id);
    return c.json({ data: invoice as any }, 201);
  } catch (error: any) {
    const isNotFound = /not found/i.test(error.message);
    return c.json(
      { error: { message: error.message || 'Failed to finalize session' } },
      isNotFound ? 404 : 400
    );
  }
});

const route: AutoLoadRoute = {
  path: '/api/v1/chat-sessions',
  handler,
};

export default route;
