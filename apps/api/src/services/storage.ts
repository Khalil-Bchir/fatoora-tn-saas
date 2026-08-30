import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

const BUCKET_NAME = env.SUPABASE_STORAGE || 'docs';

export class StorageService {
  /**
   * Upload a base64 encoded file string (e.g. data:image/png;base64,...) directly to Supabase Storage
   */
  static async uploadBase64(
    base64Data: string,
    originalName: string,
    folder: 'signatures' | 'stamps' | 'payment-proofs' | 'logos' | 'general' = 'general'
  ): Promise<string> {
    try {
      let mimeType = 'image/png';
      let cleanBase64 = base64Data;

      if (base64Data.startsWith('data:')) {
        const matches = base64Data.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
        if (matches && matches[1] && matches[2]) {
          mimeType = matches[1];
          cleanBase64 = matches[2];
        }
      }

      const buffer = Buffer.from(cleanBase64, 'base64');
      const ext = originalName.includes('.')
        ? originalName.split('.').pop()
        : mimeType.split('/').pop() || 'png';
      const cleanFileName = originalName
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = `${folder}/${Date.now()}_${cleanFileName}.${ext}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        logger.error({ error, filePath, bucket: BUCKET_NAME }, 'Failed to upload to Supabase Storage');
        throw new Error(`Supabase Storage upload failed: ${error.message}`);
      }

      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      return publicData.publicUrl;
    } catch (err: any) {
      logger.error({ err }, 'Error in StorageService.uploadBase64');
      throw err;
    }
  }

  /**
   * Upload a binary buffer directly to Supabase Storage
   */
  static async uploadBuffer(
    buffer: Buffer,
    originalName: string,
    contentType: string,
    folder: 'signatures' | 'stamps' | 'payment-proofs' | 'logos' | 'general' = 'general'
  ): Promise<string> {
    try {
      const ext = originalName.includes('.')
        ? originalName.split('.').pop()
        : contentType.split('/').pop() || 'png';
      const cleanFileName = originalName
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = `${folder}/${Date.now()}_${cleanFileName}.${ext}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        logger.error({ error, filePath, bucket: BUCKET_NAME }, 'Failed to upload buffer to Supabase Storage');
        throw new Error(`Supabase Storage upload failed: ${error.message}`);
      }

      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      return publicData.publicUrl;
    } catch (err: any) {
      logger.error({ err }, 'Error in StorageService.uploadBuffer');
      throw err;
    }
  }
}
