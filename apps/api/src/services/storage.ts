import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

const BUCKET_NAME = env.SUPABASE_STORAGE || 'docs';

export type StorageCategory =
  | 'stamps'
  | 'signatures'
  | 'logos'
  | 'payment-proofs'
  | 'invoices-pdf'
  | 'general';

export interface StorageUploadOptions {
  folder: StorageCategory;
  organizationId?: string;
  invoiceId?: string;
  originalName?: string;
}

export class StorageService {
  /**
   * Builds an organized, structured storage path based on media type and owner IDs
   * Example:
   *  - organizations/org_123/stamps/stamp_1788123456_cachet.png
   *  - invoices/org_123/inv_456/payment-proofs/proof_1788123456_recu.pdf
   */
  static buildStructuredPath(options: StorageUploadOptions, extension: string): string {
    const orgPart = options.organizationId
      ? options.organizationId.replace(/[^a-zA-Z0-9_-]/g, '')
      : 'global';
    const invoicePart = options.invoiceId
      ? options.invoiceId.replace(/[^a-zA-Z0-9_-]/g, '')
      : 'unassigned';
    const rawName = (options.originalName || 'file')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();

    switch (options.folder) {
      case 'stamps':
        return `organizations/${orgPart}/stamps/stamp_${timestamp}_${rawName}.${extension}`;
      case 'signatures':
        return `organizations/${orgPart}/signatures/signature_${timestamp}_${rawName}.${extension}`;
      case 'logos':
        return `organizations/${orgPart}/logos/logo_${timestamp}_${rawName}.${extension}`;
      case 'payment-proofs':
        return `invoices/${orgPart}/${invoicePart}/payment-proofs/proof_${timestamp}_${rawName}.${extension}`;
      case 'invoices-pdf':
        return `invoices/${orgPart}/${invoicePart}/invoice_${timestamp}_${rawName}.pdf`;
      default:
        return `general/${orgPart}/${timestamp}_${rawName}.${extension}`;
    }
  }

  /**
   * Upload a base64 encoded file string (e.g. data:image/png;base64,...) to Supabase Storage
   */
  static async uploadBase64(
    base64Data: string,
    originalName: string,
    folder: StorageCategory = 'general',
    meta?: { organizationId?: string; invoiceId?: string }
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
        ? originalName.split('.').pop() || 'png'
        : mimeType.split('/').pop() || 'png';

      const filePath = this.buildStructuredPath(
        {
          folder,
          originalName,
          organizationId: meta?.organizationId,
          invoiceId: meta?.invoiceId,
        },
        ext
      );

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
    folder: StorageCategory = 'general',
    meta?: { organizationId?: string; invoiceId?: string }
  ): Promise<string> {
    try {
      const ext = originalName.includes('.')
        ? originalName.split('.').pop() || 'png'
        : contentType.split('/').pop() || 'png';

      const filePath = this.buildStructuredPath(
        {
          folder,
          originalName,
          organizationId: meta?.organizationId,
          invoiceId: meta?.invoiceId,
        },
        ext
      );

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
