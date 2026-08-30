'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Save,
  CreditCard,
  FileCheck2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  organizationService,
  type Organization,
} from '@/features/organization/services/organization-service'

export default function OrganizationSettingsPage() {
  const [formData, setFormData] = useState<Partial<Organization>>({
    name: '',
    activityType: '',
    taxRegime: 'Régime Réel',
    taxId: '',
    vatRegistered: true,
    defaultVatRate: 19,
    timbreFiscalAmount: 1.0,
    address: '',
    city: 'Tunis',
    country: 'Tunisie',
    phone: '',
    email: '',
    bankName: 'BIAT',
    bankRib: '',
    stampUrl: '',
    signatureUrl: '',
    invoicePrefix: 'FAC',
    defaultPaymentTerms: 'Paiement par virement bancaire sous 30 jours dès réception.',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const org = await organizationService.getOrganization()
        if (org) {
          setFormData((prev) => ({
            ...prev,
            ...org,
          }))
        }
      } catch (err) {
        console.error('Failed to load organization settings', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await organizationService.updateOrganization(formData)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save settings', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-zinc-500">Chargement des paramètres...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
          <Building2 className="w-6 h-6 text-emerald-600" />
          Profil Entreprise & Fiscalité
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Gérez vos mentions obligatoires, coordonnées bancaires (RIB) et visuels officiels.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Paramètres de l'entreprise mis à jour avec succès !
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identité & Fiscalité */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
            1. Identité Fiscale & Commerciale
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Raison Sociale / Nom Commercial *</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 text-xs mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Matricule Fiscal (MF) *</Label>
              <Input
                value={formData.taxId || ''}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="h-9 text-xs mt-1 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Activité</Label>
              <Input
                value={formData.activityType || ''}
                onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Régime Fiscal</Label>
              <select
                value={formData.taxRegime || 'Régime Réel'}
                onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value })}
                className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-zinc-900 dark:text-white mt-1"
              >
                <option value="Régime Réel">Régime Réel (Sociétés)</option>
                <option value="Auto-Entrepreneur">Auto-Entrepreneur</option>
                <option value="Forfaitaire">Régime Forfaitaire</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Préfixe de Facture</Label>
              <Input
                value={formData.invoicePrefix || 'FAC'}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="h-9 text-xs mt-1 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Adresse</Label>
              <Input
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Ville</Label>
              <Input
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Téléphone</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Email Professionnel</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 block">
                Assujetti à la TVA Tunisienne (19%)
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Active le droit de timbre fiscal de 1.000 DT et le calcul de la TVA.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.vatRegistered}
              onChange={(e) => setFormData({ ...formData, vatRegistered: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Section 2: Banque & RIB */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            2. Coordonnées Bancaires (RIB)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Établissement Bancaire</Label>
              <Input
                value={formData.bankName || 'BIAT'}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">RIB (20 chiffres)</Label>
              <Input
                value={formData.bankRib || ''}
                onChange={(e) => setFormData({ ...formData, bankRib: e.target.value })}
                className="h-9 text-xs mt-1 font-mono tracking-wider"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Conditions de règlement par défaut</Label>
            <textarea
              value={formData.defaultPaymentTerms || ''}
              onChange={(e) => setFormData({ ...formData, defaultPaymentTerms: e.target.value })}
              rows={2}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-white mt-1"
            />
          </div>
        </div>

        {/* Section 3: Cachet & Signature */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            3. Visuels Officiels (Cachet & Signature)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Lien Image Cachet Entreprise</Label>
              <Input
                placeholder="https://.../cachet.png"
                value={formData.stampUrl || ''}
                onChange={(e) => setFormData({ ...formData, stampUrl: e.target.value })}
                className="h-9 text-xs mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs">Lien Image Signature Gérant</Label>
              <Input
                placeholder="https://.../signature.png"
                value={formData.signatureUrl || ''}
                onChange={(e) => setFormData({ ...formData, signatureUrl: e.target.value })}
                className="h-9 text-xs mt-1 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 px-6 font-semibold shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer les Modifications'}
          </Button>
        </div>
      </form>
    </div>
  )
}
