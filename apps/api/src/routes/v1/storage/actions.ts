import { OpenAPIHono } from '@hono/zod-openapi';
import type { AutoLoadRoute } from 'hono-autoload/types';
import type { Env } from '../../../types/index.js';
import { uploadMediaRoute } from '../../../schema/v1/storage.schema.js';
import { StorageService } from '../../../services/storage.js';
import { logger } from '../../../utils/logger.js';

const handler = new OpenAPIHono<Env>();

handler.openapi(uploadMediaRoute, async (c) => {
  const { data, fileName, folder } = c.req.valid('json');

  try {
    const publicUrl = await StorageService.uploadBase64(data, fileName, folder as any);

    return c.json(
      {
        data: {
          url: publicUrl,
          fileName,
          folder,
        },
      },
      201
    );
  } catch (error: any) {
    logger.error({ error, scope: 'storage.upload' }, 'Failed to upload media to Supabase Storage');
    return c.json(
      {
        error: {
          message: error.message || 'Failed to upload file to Supabase Storage',
          code: 'STORAGE_UPLOAD_FAILED',
        },
      },
      500
    );
  }
});

const routeModule: AutoLoadRoute = {
  path: '/api/v1/storage',
  handler,
};

export default routeModule;
