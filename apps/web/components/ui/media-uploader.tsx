'use client'

import React, { useState, useRef } from 'react'
import {
  Upload,
  CheckCircle2,
  RefreshCw,
  Trash2,
  FileText,
  ExternalLink,
  ImageIcon,
  Maximize2,
  X,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { storageService } from '@/features/storage/services/storage-service'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

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
  const [isDragOver, setIsDragOver] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await processFile(file)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await processFile(file)
  }

  const isPdf = value?.toLowerCase().endsWith('.pdf')
  const fileName = value?.split('/').pop() || 'media'
  const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'IMG'

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
          {label}
        </label>
        {value && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Connecté au Cloud
          </span>
        )}
      </div>

      {value ? (
        <div className="relative group border border-zinc-200 dark:border-zinc-700/80 rounded-2xl p-4 bg-white dark:bg-zinc-900 shadow-xs hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* High Quality Checkerboard Transparency Preview Box */}
            <div className="relative w-full sm:w-28 h-28 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:8px_8px] bg-zinc-50 dark:bg-zinc-950">
              {isPdf ? (
                <div className="flex flex-col items-center justify-center gap-1 text-red-600">
                  <FileText className="w-9 h-9" />
                  <span className="text-[9px] font-bold uppercase">Document PDF</span>
                </div>
              ) : imgLoadError ? (
                <div className="flex flex-col items-center justify-center gap-1 text-amber-600">
                  <ImageIcon className="w-7 h-7" />
                  <span className="text-[9px] font-bold">Image indisponible</span>
                </div>
              ) : (
                <div className="relative w-full h-full p-2 flex items-center justify-center group/preview">
                  <img
                    src={value}
                    alt={label}
                    onError={() => setImgLoadError(true)}
                    className="max-w-full max-h-full object-contain filter drop-shadow-xs transition-transform duration-200 group-hover/preview:scale-105"
                  />
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center text-white rounded-xl"
                  >
                    <Maximize2 className="w-5 h-5 drop-shadow-md" />
                  </button>
                </div>
              )}

              {/* Format Badge */}
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-zinc-900/80 text-[9px] font-mono font-bold text-white uppercase backdrop-blur-xs">
                {fileExtension}
              </div>
            </div>

            {/* Info & Quick Actions */}
            <div className="flex-1 space-y-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold text-xs">
                  <span>{label}</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono break-all line-clamp-1">
                  {fileName}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ouvrir en plein écran
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 text-xs font-semibold text-zinc-700 dark:text-zinc-300 gap-1.5 hover:border-emerald-500 hover:text-emerald-600"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Remplacer le fichier
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChange('')
                    setImgLoadError(false)
                  }}
                  className="h-8 text-xs text-zinc-400 hover:text-red-600 gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-[1.01]'
              : 'border-zinc-300 dark:border-zinc-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 bg-zinc-50/60 dark:bg-zinc-800/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center justify-center gap-2.5 text-zinc-500 py-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Téléversement sécurisé vers Supabase Storage...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-1">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shadow-xs">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                  Glissez-déposez votre fichier ici
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                  ou <strong className="text-emerald-600 dark:text-emerald-400 font-semibold underline">parcourez vos fichiers</strong>
                </span>
              </div>
              {hint ? (
                <span className="text-[10px] text-zinc-400 font-medium">{hint}</span>
              ) : (
                <span className="text-[10px] text-zinc-400 font-medium">PNG, JPG, SVG ou PDF (max 5 MB)</span>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}

      {/* Fullscreen Lightbox Modal */}
      {value && !isPdf && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-2xl p-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Aperçu Haute Définition : {label}
            </DialogTitle>
            <div className="mt-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:10px_10px] bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center min-h-[300px]">
              <img
                src={value}
                alt={label}
                className="max-h-[400px] w-auto object-contain filter drop-shadow-md"
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLightboxOpen(false)}
                className="text-xs"
              >
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
