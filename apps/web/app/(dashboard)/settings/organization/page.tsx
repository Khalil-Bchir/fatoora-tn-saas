'use client'

import React, { useState, useEffect } from 'react'
import {
  Building2,
  Save,
  CreditCard,
  FileCheck2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Globe,
  HelpCircle,
  Eye,
  FileText,
  BadgePercent,
  Landmark,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MediaUploader } from '@/components/ui/media-uploader'
import {
  organizationService,
  type Organization,
} from '@/features/organization/services/organization-service'

const TUNISIAN_BANKS = [
  { id: 'BIAT', name: 'BIAT (Banque Internationale Arabe de Tunisie)' },
  { id: 'Attijari Bank', name: 'Attijari Bank Tunisie' },
  { id: 'Amen Bank', name: 'Amen Bank' },
  { id: 'BNA', name: 'BNA (Banque Nationale Agricole)' },
  { id: 'STB', name: 'STB (Société Tunisienne de Banque)' },
  { id: 'BH Bank', name: 'BH Bank (Banque de l’Habitat)' },
  { id: 'Banque Zitouna', name: 'Banque Zitouna (Finance Islamique)' },
  { id: 'UIB', name: 'UIB (Société Générale)' },
  { id: 'UBCI', name: 'UBCI (Groupe BNP Paribas / Carte)' },
  { id: 'BT', name: 'BT (Banque de Tunisie)' },
  { id: 'ATB', name: 'ATB (Arab Tunisian Bank)' },
  { id: 'Poste Tunisienne', name: 'La Poste Tunisienne (Compte Courant Postal - CCP)' },
]

const PAYMENT_TERMS_SHORTCUTS = [
  'Paiement à réception de facture.',
  'Paiement par virement bancaire sous 15 jours dès réception.',
  'Paiement par virement bancaire sous 30 jours fin de mois.',
  'Acompte de 50% à la commande, solde à la livraison.',
]

export default function OrganizationSettingsPage() {
  const [formData, setFormData] = useState<Partial<Organization>>({
    name: '',
    activityType: '',
    taxRegime: 'AUTO_ENTREPRENEUR',
    taxId: '',
    vatRegistered: false,
    defaultVatRate: 19,
    timbreFiscalAmount: 1.0,
    address: '',
    city: 'Tunis',
    country: 'Tunisie',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    bankName: 'BIAT',
    bankRib: '',
    bankIban: '',
    bankBic: '',
    stampUrl: '',
    signatureUrl: '',
    logoUrl: '',
    invoicePrefix: 'FAC',
    defaultPaymentTerms: 'Paiement par virement bancaire sous 30 jours dès réception.',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('identity')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const org = await organizationService.getOrganization()
        if (org) {
          setFormData((prev) => ({
            ...prev,
            ...org,
            stampUrl: org.stampImageUrl || org.stampUrl || prev.stampUrl || '',
            signatureUrl: org.signatureImageUrl || org.signatureUrl || prev.signatureUrl || '',
            logoUrl: org.logoUrl || prev.logoUrl || '',
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
      const payload = {
        ...formData,
        stampImageUrl: formData.stampUrl || formData.stampImageUrl || null,
        signatureImageUrl: formData.signatureUrl || formData.signatureImageUrl || null,
        logoUrl: formData.logoUrl || null,
      }
      await organizationService.updateOrganization(payload)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3500)
    } catch (err: any) {
      console.error('Failed to save settings', err)
      alert(err?.message || 'Erreur lors de la sauvegarde des paramètres')
    } finally {
      setSaving(false)
    }
  }

  const formatRibDisplay = (rib?: string | null) => {
    if (!rib) return '00 000 0000000000000 00'
    const clean = rib.replace(/\s+/g, '')
    if (clean.length === 20) {
      return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 18)} ${clean.slice(18, 20)}`
    }
    return rib
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-zinc-500 font-medium">Chargement des paramètres de l&apos;entreprise...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">
                Paramètres & Identité de l&apos;Entreprise
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Configurez vos informations légales, coordonnées bancaires (RIB) et visuels pour vos factures.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 px-5 font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 text-xs border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">
              Paramètres enregistrés avec succès ! Vos futures factures et devis utiliseront ces données à jour.
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 opacity-80">Synchronisé</span>
        </div>
      )}

      {/* Main Grid: Form + Live Document Header Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Tabs & Settings */}
        <div className="lg:col-span-8 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full h-11 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
              <TabsTrigger
                value="identity"
                className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-emerald-600 rounded-lg shadow-2xs gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                1. Entreprise & Fiscalité
              </TabsTrigger>
              <TabsTrigger
                value="bank"
                className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-emerald-600 rounded-lg shadow-2xs gap-1.5"
              >
                <Landmark className="w-3.5 h-3.5" />
                2. Banque & RIB
              </TabsTrigger>
              <TabsTrigger
                value="visuals"
                className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-emerald-600 rounded-lg shadow-2xs gap-1.5"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                3. Cachet & Signature
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Entreprise & Fiscalité */}
            <TabsContent value="identity" className="space-y-5 pt-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-xs space-y-5">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Identité Commerciale & Statut Fiscal Tunisien
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Ces mentions légales figurent obligatoirement sur l&apos;en-tête de vos factures et devis.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Raison Sociale / Nom Professionnel *
                    </Label>
                    <Input
                      placeholder="ex: Mohamed Khalil Bchir"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-9 text-xs mt-1 bg-zinc-50/50 dark:bg-zinc-800/40"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Identifiant Unique / Matricule Fiscal (MF) *
                    </Label>
                    <Input
                      placeholder="ex: 1993527G ou 1234567/A/M/000"
                      value={formData.taxId || ''}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      className="h-9 text-xs mt-1 font-mono bg-zinc-50/50 dark:bg-zinc-800/40"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Secteur / Activité
                    </Label>
                    <Input
                      placeholder="ex: Création artistique, Dév web..."
                      value={formData.activityType || ''}
                      onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                      className="h-9 text-xs mt-1 bg-zinc-50/50 dark:bg-zinc-800/40"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Régime Fiscal
                    </Label>
                    <select
                      value={formData.taxRegime || 'AUTO_ENTREPRENEUR'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          taxRegime: e.target.value as any,
                          vatRegistered: e.target.value === 'REEL',
                        })
                      }
                      className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 px-3 text-xs text-zinc-900 dark:text-white mt-1 focus:ring-emerald-500"
                    >
                      <option value="AUTO_ENTREPRENEUR">Auto-Entrepreneur (Exonéré TVA)</option>
                      <option value="FORFAITAIRE">Régime Forfaitaire</option>
                      <option value="REEL">Régime Réel (Sociétés & Sujet TVA)</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Préfixe de Numérotation
                    </Label>
                    <Input
                      placeholder="FAC"
                      value={formData.invoicePrefix || 'FAC'}
                      onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                      className="h-9 text-xs mt-1 font-mono bg-zinc-50/50 dark:bg-zinc-800/40"
                    />
                  </div>
                </div>

                {/* TVA & Timbre Fiscal Checkbox Panel */}
                <div
                  onClick={() => setFormData({ ...formData, vatRegistered: !formData.vatRegistered })}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    formData.vatRegistered
                      ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                      : 'bg-zinc-50/70 border-zinc-200 dark:bg-zinc-800/40 dark:border-zinc-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-white">
                      <BadgePercent className="w-4 h-4 text-emerald-600" />
                      <span>Assujetti à la Taxe sur la Valeur Ajoutée (TVA 19%)</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {formData.vatRegistered
                        ? 'Actif : Vos factures incluront la TVA 19% et le droit de timbre fiscal obligatoire de 1.000 DT.'
                        : 'Inactif (Auto-Entrepreneur / Exonéré) : Vos factures seront générées sans TVA (HT = TTC).'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.vatRegistered}
                    onChange={(e) => setFormData({ ...formData, vatRegistered: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                </div>
              </div>

              {/* Coordonnées & Siège */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Adresse & Coordonnées de Contact
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Adresse (Rue, Numéro, Bâtiment)
                    </Label>
                    <Input
                      placeholder="ex: Avenue Habib Bourguiba, N° 45"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="h-9 text-xs mt-1 bg-zinc-50/50 dark:bg-zinc-800/40"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Gouvernorat / Ville
                    </Label>
                    <Input
                      placeholder="ex: Tunis, Sousse, Kairouan..."
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="h-9 text-xs mt-1 bg-zinc-50/50 dark:bg-zinc-800/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-zinc-400" /> Téléphone
                    </Label>
                    <Input
                      placeholder="+216 52 000 000"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-9 text-xs mt-1 bg-zinc-50/50 dark:bg-zinc-800/40"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-zinc-400" /> Email Professionnel
                    </Label>
                    <Input
                      type="email"
                      placeholder="contact@entreprise.tn"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-9 text-xs mt-1 bg-zinc-50/50 dark:bg-zinc-800/40"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-zinc-400" /> Site Web (Optionnel)
                    </Label>
                    <Input
                      placeholder="https://mon-site.tn"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="h-9 text-xs mt-1 bg-zinc-50/50 dark:bg-zinc-800/40"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Banque & RIB */}
            <TabsContent value="bank" className="space-y-5 pt-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-xs space-y-5">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    Coordonnées Bancaires (RIB Tunisien à 20 chiffres)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Ces coordonnées sont affichées sur votre lien de paiement public pour permettre les virements rapides.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Établissement Bancaire *
                    </Label>
                    <select
                      value={formData.bankName || 'BIAT'}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 px-3 text-xs text-zinc-900 dark:text-white mt-1 focus:ring-emerald-500"
                    >
                      {TUNISIAN_BANKS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      RIB (20 chiffres) *
                    </Label>
                    <Input
                      placeholder="08 000 0000000000000 00"
                      value={formData.bankRib || ''}
                      onChange={(e) => setFormData({ ...formData, bankRib: e.target.value })}
                      className="h-9 text-xs mt-1 font-mono tracking-widest font-bold bg-zinc-50/50 dark:bg-zinc-800/40 text-emerald-700 dark:text-emerald-400"
                      maxLength={23}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      IBAN International (Optionnel)
                    </Label>
                    <Input
                      placeholder="TN59 0800 0000 0000 0000 0000"
                      value={formData.bankIban || ''}
                      onChange={(e) => setFormData({ ...formData, bankIban: e.target.value })}
                      className="h-9 text-xs mt-1 font-mono bg-zinc-50/50 dark:bg-zinc-800/40"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Code BIC / SWIFT (Optionnel)
                    </Label>
                    <Input
                      placeholder="BIATTNTT"
                      value={formData.bankBic || ''}
                      onChange={(e) => setFormData({ ...formData, bankBic: e.target.value })}
                      className="h-9 text-xs mt-1 font-mono bg-zinc-50/50 dark:bg-zinc-800/40"
                    />
                  </div>
                </div>

                {/* Default Terms & Quick Chips */}
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Conditions de règlement & Échéance par défaut
                    </Label>
                    <span className="text-[10px] text-zinc-400">Inséré automatiquement sur chaque facture</span>
                  </div>
                  <textarea
                    value={formData.defaultPaymentTerms || ''}
                    onChange={(e) => setFormData({ ...formData, defaultPaymentTerms: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 p-2.5 text-xs text-zinc-900 dark:text-white focus:ring-emerald-500"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" /> Suggestions :
                    </span>
                    {PAYMENT_TERMS_SHORTCUTS.map((term, tIdx) => (
                      <button
                        key={tIdx}
                        type="button"
                        onClick={() => setFormData({ ...formData, defaultPaymentTerms: term })}
                        className="text-[10px] px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 transition-colors border border-zinc-200/60 dark:border-zinc-700 cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Cachet, Signature & Logo */}
            <TabsContent value="visuals" className="space-y-5 pt-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-xs space-y-6">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    Visuels Officiels & Fichiers Multimédia (Supabase Storage)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Téléversez vos fichiers : ils sont automatiquement stockés dans votre espace cloud dédié et intégrés à vos documents.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MediaUploader
                    label="Cachet Officiel de l'Entreprise"
                    folder="stamps"
                    value={formData.stampUrl}
                    onChange={(url) => setFormData({ ...formData, stampUrl: url })}
                    hint="Format PNG transparent recommandé (max 5 MB)"
                  />
                  <MediaUploader
                    label="Signature Numérique du Gérant"
                    folder="signatures"
                    value={formData.signatureUrl}
                    onChange={(url) => setFormData({ ...formData, signatureUrl: url })}
                    hint="Signature manuscrite scannée sur fond transparent"
                  />
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <MediaUploader
                    label="Logo de la Société (Optionnel)"
                    folder="logos"
                    value={formData.logoUrl}
                    onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                    hint="Apparaît en haut à gauche de vos factures et devis (PNG / SVG)"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel: Live Document Visual Preview */}
        <div className="lg:col-span-4 space-y-4 sticky top-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600" />
                Aperçu Document Direct
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold">
                Live Sync
              </span>
            </div>

            {/* Document Card Simulation */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/30 p-4 space-y-4 text-xs">
              {/* Top Header */}
              <div className="flex items-start justify-between gap-3 border-b border-zinc-200 dark:border-zinc-700/60 pb-3">
                <div>
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="h-8 w-auto object-contain mb-1.5"
                    />
                  ) : null}
                  <div className="font-bold text-sm text-zinc-900 dark:text-white">
                    {formData.name || 'Nom de votre entreprise'}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {formData.activityType || 'Activité non spécifiée'}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-semibold mt-1">
                    MF: {formData.taxId || '1234567/A/M/000'}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                    {formData.invoicePrefix || 'FAC'}-2026-001
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    {formData.vatRegistered ? 'Régime Réel (TVA 19%)' : 'Auto-Entrepreneur (HT = TTC)'}
                  </span>
                </div>
              </div>

              {/* Coordinates */}
              <div className="text-[11px] text-zinc-500 space-y-0.5">
                <p>{formData.address || 'Adresse de votre siège'}</p>
                <p>
                  {formData.city || 'Ville'}, {formData.country || 'Tunisie'}
                </p>
                {formData.phone && <p>Tél : {formData.phone}</p>}
                {formData.email && <p>Email : {formData.email}</p>}
              </div>

              {/* RIB Card on Public Link */}
              <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[11px] space-y-1">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3 text-emerald-600" />
                  <span>Virement {formData.bankName || 'BIAT'}</span>
                </div>
                <div className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 break-all">
                  {formatRibDisplay(formData.bankRib)}
                </div>
              </div>

              {/* Stamps & Signatures */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700/60">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-2">
                  Cachet & Signature apposés :
                </span>
                <div className="flex items-center justify-end gap-3 h-16">
                  {formData.stampUrl ? (
                    <img
                      src={formData.stampUrl}
                      alt="Cachet"
                      className="h-14 w-auto object-contain border border-zinc-200 dark:border-zinc-700 rounded p-1 bg-white"
                    />
                  ) : (
                    <div className="h-14 w-20 border border-dashed border-zinc-300 dark:border-zinc-700 rounded flex items-center justify-center text-[9px] text-zinc-400 text-center px-1">
                      Cachet
                    </div>
                  )}

                  {formData.signatureUrl ? (
                    <img
                      src={formData.signatureUrl}
                      alt="Signature"
                      className="h-14 w-auto object-contain border border-zinc-200 dark:border-zinc-700 rounded p-1 bg-white"
                    />
                  ) : (
                    <div className="h-14 w-20 border border-dashed border-zinc-300 dark:border-zinc-700 rounded flex items-center justify-center text-[9px] text-zinc-400 text-center px-1">
                      Signature
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
