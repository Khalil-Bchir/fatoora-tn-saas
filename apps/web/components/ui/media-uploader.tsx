'use client'

import React, { useState, useRef } from 'react'
import {
  Upload,
  CheckCircle2,
  RefreshCw,
  X,
  FileText,
  ExternalLink,
  ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { storageService } from '@/features/storage/services/storage-service'

interface MediaUploaderProps {
  label: string
  folder: 'signatures' | 'stamps' | 'payment-proofs' | 'logos' | 'general'
  value?: string | null
  onChange: (url: string) => void
  accept?: string
  hint?: string
}

export function MediaUploader({
  label,
  folder,
  value,
  onChange,
  accept = 'image/png, image/jpeg, image/webp, image/svg+xml, application/pdf',
  hint,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imgLoadError, setImgLoadError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setError(null)
      setImgLoadError(false)
      const res = await storageService.uploadFile(file, folder)
      onChange(res.url)
    } catch (err: any) {
      console.error('Failed to upload file to Supabase storage', err)
      setError(err?.message || 'Erreur lors du téléversement vers Supabase Storage')
    } finally {
      setUploading(false)
    }
  }

  const isPdf = value?.toLowerCase().endsWith('.pdf')

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
        {label}
      </label>

      {value ? (
        <div className="relative group border border-zinc-200 dark:border-zinc-700 rounded-xl p-3.5 bg-zinc-50/70 dark:bg-zinc-800/40 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 overflow-hidden">
            {isPdf ? (
              <div className="w-14 h-14 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            ) : imgLoadError ? (
              <div className="w-14 h-14 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                <ImageIcon className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={value}
                  alt={label}
                  onError={() => setImgLoadError(true)}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}

            <div className="overflow-hidden text-xs space-y-0.5">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Fichier hébergé (Supabase)</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono truncate max-w-[200px]">
                {value.split('/').pop()}
              </p>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium pt-0.5"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                Voir le fichier source
              </a>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 text-xs px-2.5 text-zinc-600 dark:text-zinc-300"
            >
              Remplacer
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange('')
                setImgLoadError(false)
              }}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors rounded-xl p-5 text-center cursor-pointer bg-zinc-50/50 dark:bg-zinc-800/20 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 py-1">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
              <span className="text-xs font-medium">Téléversement vers Supabase Storage...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 py-1">
              <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Cliquez pour téléverser ou glissez un fichier
              </span>
              {hint ? (
                <span className="text-[10px] text-zinc-400">{hint}</span>
              ) : (
                <span className="text-[10px] text-zinc-400">PNG, JPG ou PDF (max 5 MB)</span>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  )
}
