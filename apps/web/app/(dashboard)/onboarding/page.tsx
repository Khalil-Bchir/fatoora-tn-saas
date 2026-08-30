'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  FileCheck2,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  organizationService,
  type Organization,
} from '@/features/organization/services/organization-service'

const STEPS = [
  { id: 1, title: 'Profil & Fiscalité', icon: Building2 },
  { id: 2, title: 'Cachet & Signature', icon: FileCheck2 },
  { id: 3, title: 'Banque & RIB', icon: CreditCard },
  { id: 4, title: 'Prêt !', icon: CheckCircle2 },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<Partial<Organization>>({
    name: '',
    activityType: 'Services Informatiques & Conseil',
    taxRegime: 'Régime Réel',
    taxId: '',
    vatRegistered: true,
    defaultVatRate: 19,
    timbreFiscalAmount: 1.0,
    address: 'Les Berges du Lac 2',
    city: 'Tunis',
    country: 'Tunisie',
    phone: '+216 71 000 000',
    email: '',
    bankName: 'BIAT',
    bankRib: '',
    stampUrl: '',
    signatureUrl: '',
    invoicePrefix: 'FAC',
  })

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
        console.error('Failed to load org for onboarding', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleNext = async () => {
    try {
      setSaving(true)
      await organizationService.updateOrganization(formData)
      if (currentStep < 4) {
        setCurrentStep((prev) => prev + 1)
      } else {
        router.push('/overview')
      }
    } catch (err) {
      console.error('Failed to save organization step', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-10 space-y-8">
      {/* Onboarding Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800/40">
          <Sparkles className="w-3.5 h-3.5" />
          Configuration Initiale Fatoora TN
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
          Configurez votre Entreprise en 3 étapes
        </h1>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          Vos informations apparaîtront automatiquement sur toutes vos factures avec la conformité fiscale tunisienne.
        </p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-between relative max-w-lg mx-auto">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 z-0" />
        {STEPS.map((s) => {
          const Icon = s.icon
          const isActive = currentStep === s.id
          const isDone = currentStep > s.id
          return (
            <div key={s.id} className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isActive
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/60 shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[11px] font-medium ${isActive ? 'text-zinc-900 dark:text-white font-semibold' : 'text-zinc-400'}`}>
                {s.title}
              </span>
            </div>
          )
        })}
      </div>

      {/* Step Content Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        {/* Step 1: Business Profile & Tax ID */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Renseignements de l'Entreprise & Fiscalité
              </h3>
              <p className="text-xs text-zinc-500">
                Indiquez le nom commercial et le Matricule Fiscal (MF) délivré par la recette des finances.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Raison Sociale / Nom Commercial *</Label>
                <Input
                  placeholder="ex: Carthage Digital Studio"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Matricule Fiscal (MF) *</Label>
                <Input
                  placeholder="ex: 1234567/A/M/000"
                  value={formData.taxId || ''}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Secteur / Activité</Label>
                <Input
                  placeholder="ex: Développement logiciel, Conseil, Agence..."
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
                  <option value="Régime Réel">Régime Réel (Sociétés & SARL/SUARL)</option>
                  <option value="Auto-Entrepreneur">Régime Auto-Entrepreneur</option>
                  <option value="Forfaitaire">Régime Forfaitaire</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Adresse du siège</Label>
                <Input
                  placeholder="Rue, Immeuble, Étage..."
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Ville</Label>
                <Input
                  placeholder="Tunis, Ariana, Sfax, Sousse..."
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
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
                  Active le calcul automatique de la TVA et du Timbre Fiscal (1.000 DT)
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
        )}

        {/* Step 2: Stamp & Signature */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Cachet Numérique & Signature
              </h3>
              <p className="text-xs text-zinc-500">
                Ces éléments seront automatiquement apposés en bas de chaque facture générée et PDF.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-center space-y-3 bg-zinc-50/50 dark:bg-zinc-800/30">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                  Lien image Cachet Entreprise
                </span>
                <Input
                  placeholder="https://.../cachet.png"
                  value={formData.stampUrl || ''}
                  onChange={(e) => setFormData({ ...formData, stampUrl: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
                <p className="text-[10px] text-zinc-400">Format PNG transparent recommandé (max 500x500px)</p>
              </div>

              <div className="p-5 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-center space-y-3 bg-zinc-50/50 dark:bg-zinc-800/30">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                  Lien image Signature Gérant
                </span>
                <Input
                  placeholder="https://.../signature.png"
                  value={formData.signatureUrl || ''}
                  onChange={(e) => setFormData({ ...formData, signatureUrl: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
                <p className="text-[10px] text-zinc-400">Signature manuscrite scannée sur fond blanc ou transparent</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Bank Details */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Coordonnées Bancaires (RIB Tunisien)
              </h3>
              <p className="text-xs text-zinc-500">
                Votre RIB à 20 chiffres sera affiché aux clients pour leur permettre de virer les règlements directement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Banque / Établissement *</Label>
                <select
                  value={formData.bankName || 'BIAT'}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-zinc-900 dark:text-white mt-1"
                >
                  <option value="BIAT">BIAT (Banque Internationale Arabe de Tunisie)</option>
                  <option value="Attijari Bank">Attijari Bank Tunisie</option>
                  <option value="Amen Bank">Amen Bank</option>
                  <option value="BNA">BNA (Banque Nationale Agricole)</option>
                  <option value="STB">STB (Société Tunisienne de Banque)</option>
                  <option value="Banque de l'Habitat">BH Bank</option>
                  <option value="Zitouna Bank">Banque Zitouna</option>
                  <option value="UIB">UIB (Société Générale)</option>
                  <option value="UBCI">UBCI</option>
                  <option value="BT">Banque de Tunisie (BT)</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">RIB (20 chiffres) *</Label>
                <Input
                  placeholder="08 000 0000000000000 00"
                  value={formData.bankRib || ''}
                  onChange={(e) => setFormData({ ...formData, bankRib: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono tracking-wider"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Préfixe de Numérotation des Factures</Label>
              <Input
                placeholder="FAC"
                value={formData.invoicePrefix || 'FAC'}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="h-9 text-xs mt-1 w-32 font-mono"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Exemple généré : {formData.invoicePrefix || 'FAC'}-2026-0001
              </span>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {currentStep === 4 && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              Votre Espace Fatoora TN est Prêt !
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Vous pouvez maintenant émettre vos premières factures en toute sérénité ou laisser notre assistant IA les rédiger pour vous.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
          {currentStep > 1 && currentStep < 4 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="text-xs gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Précédent
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            onClick={handleNext}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-5 gap-2 shadow-sm font-semibold"
          >
            {saving ? (
              'Enregistrement...'
            ) : currentStep === 4 ? (
              <>
                Accéder au Tableau de Bord
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
