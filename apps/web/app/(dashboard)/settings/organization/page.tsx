'use client';

import React, { useEffect, useState } from 'react';
import { useOrganizationStore } from '@/store/organization-store';
import {
  Building2,
  Save,
  CreditCard,
  Stamp,
  FileCheck2,
  AlertTriangle,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { TaxRegime } from '@repo/types';

export default function OrganizationSettingsPage() {
  const { organization, loading, fetchOrganization, updateOrganization } =
    useOrganizationStore();

  const [name, setName] = useState('');
  const [activityType, setActivityType] = useState('');
  const [taxRegime, setTaxRegime] = useState<TaxRegime>('AUTO_ENTREPRENEUR');
  const [vatRegistered, setVatRegistered] = useState(false);
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankRib, setBankRib] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [stampImageUrl, setStampImageUrl] = useState('');
  const [signatureImageUrl, setSignatureImageUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('FAC');
  const [defaultVatRate, setDefaultVatRate] = useState(19);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  useEffect(() => {
    if (organization) {
      setName(organization.name || '');
      setActivityType(organization.activityType || '');
      setTaxRegime(organization.taxRegime || 'AUTO_ENTREPRENEUR');
      setVatRegistered(organization.vatRegistered || false);
      setTaxId(organization.taxId || '');
      setAddress(organization.address || '');
      setCity(organization.city || '');
      setPostalCode(organization.postalCode || '');
      setPhone(organization.phone || '');
      setEmail(organization.email || '');
      setWebsite(organization.website || '');
      setBankName(organization.bankName || '');
      setBankRib(organization.bankRib || '');
      setBankIban(organization.bankIban || '');
      setStampImageUrl(organization.stampImageUrl || '');
      setSignatureImageUrl(organization.signatureImageUrl || '');
      setLogoUrl(organization.logoUrl || '');
      setInvoicePrefix(organization.invoicePrefix || 'FAC');
      setDefaultVatRate(organization.defaultVatRate || 19);
      setDefaultPaymentTerms(organization.defaultPaymentTerms || '');
    }
  }, [organization]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateOrganization({
        name,
        activityType: activityType || undefined,
        taxRegime,
        vatRegistered,
        taxId: taxId || undefined,
        address: address || undefined,
        city: city || undefined,
        postalCode: postalCode || undefined,
        phone: phone || undefined,
        email: email || undefined,
        website: website || undefined,
        bankName: bankName || undefined,
        bankRib: bankRib || undefined,
        bankIban: bankIban || undefined,
        stampImageUrl: stampImageUrl || undefined,
        signatureImageUrl: signatureImageUrl || undefined,
        logoUrl: logoUrl || undefined,
        invoicePrefix: invoicePrefix || 'FAC',
        defaultVatRate: Number(defaultVatRate),
        defaultPaymentTerms: defaultPaymentTerms || undefined,
      });
      toast.success('Paramètres de votre entreprise enregistrés avec succès !');
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres de l'Entreprise</h1>
        <p className="text-muted-foreground">
          Configurez votre profil fiscal tunisien, cachet, signature et coordonnées bancaires
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Fiscal Regime & Identifiers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Identité & Régime Fiscal Tunisien
            </CardTitle>
            <CardDescription>
              Informations légales requises sur vos factures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Raison Sociale / Nom Commercial *</Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex. DevConsulting Tunisie"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Type d'activité</Label>
                <Input
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  placeholder="ex. Services Informatiques & Digital"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Régime Fiscal</Label>
                <Select
                  value={taxRegime}
                  onValueChange={(val) => {
                    setTaxRegime(val as TaxRegime);
                    if (val === 'AUTO_ENTREPRENEUR') {
                      setVatRegistered(false);
                    } else if (val === 'REEL') {
                      setVatRegistered(true);
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO_ENTREPRENEUR">
                      Auto-entrepreneur (Exonéré TVA, plafond 75k DT)
                    </SelectItem>
                    <SelectItem value="FORFAITAIRE">
                      Régime Forfaitaire
                    </SelectItem>
                    <SelectItem value="REEL">
                      Régime Réel (Assujetti TVA obligatoire)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Matricule Fiscal / Identifiant Unique</Label>
                <Input
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="ex. 1234567/A/M/000 ou ID Auto-entrepreneur"
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
              <div>
                <Label className="text-xs font-semibold">Assujettissement à la TVA</Label>
                <p className="text-[11px] text-muted-foreground">
                  Active le calcul automatique de la TVA (0%, 7%, 13%, 19%) sur vos factures
                </p>
              </div>
              <Switch checked={vatRegistered} onCheckedChange={setVatRegistered} />
            </div>

            {vatRegistered && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Information de conformité :</strong> Pour les entreprises assujetties à la TVA, l'obligation e-invoicing (El Fatoora / TTN) est en cours de préparation dans notre roadmap (Phase 3). Vos factures mentionneront toutes les mentions légales tunisiennes en attendant l'intégration directe.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coordonnées & Adresse */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Coordonnées de l'Entreprise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Téléphone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+216 ..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Email Professionnel</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@entreprise.tn"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Site Web</Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Label className="text-xs">Adresse physique</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ex. Rue Alain Savary, Immeuble Horizon"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Ville / Gouvernorat</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="ex. Tunis, Sousse, Sfax..."
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coordonnées Bancaires */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Coordonnées Bancaires (Paiement)
            </CardTitle>
            <CardDescription>
              Ces coordonnées seront affichées sur les factures remises à vos clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Banque</Label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="ex. BIAT, Attijari, STB, Amen Bank..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">RIB Bancaire Tunisien (20 chiffres)</Label>
                <Input
                  value={bankRib}
                  onChange={(e) => setBankRib(e.target.value)}
                  placeholder="08 000 0000000000000 00"
                  className="mt-1 font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Conditions et modalités de règlement par défaut</Label>
              <Input
                value={defaultPaymentTerms}
                onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                placeholder="ex. Règlement par virement bancaire sous 30 jours à réception"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cachet, Signature et Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Stamp className="w-5 h-5 text-primary" />
              Cachet, Signature & Logo
            </CardTitle>
            <CardDescription>
              Images apposées automatiquement sur vos factures et exports PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">URL du Logo de l'entreprise</Label>
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://.../logo.png"
                  className="mt-1 text-xs"
                />
                {logoUrl && (
                  <div className="mt-2 p-2 border rounded bg-white flex justify-center">
                    <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs">URL de l'image du Cachet (Tampon)</Label>
                <Input
                  value={stampImageUrl}
                  onChange={(e) => setStampImageUrl(e.target.value)}
                  placeholder="https://.../cachet.png"
                  className="mt-1 text-xs"
                />
                {stampImageUrl && (
                  <div className="mt-2 p-2 border rounded bg-white flex justify-center">
                    <img src={stampImageUrl} alt="Cachet" className="h-16 w-auto object-contain" />
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs">URL de l'image de Signature</Label>
                <Input
                  value={signatureImageUrl}
                  onChange={(e) => setSignatureImageUrl(e.target.value)}
                  placeholder="https://.../signature.png"
                  className="mt-1 text-xs"
                />
                {signatureImageUrl && (
                  <div className="mt-2 p-2 border rounded bg-white flex justify-center">
                    <img src={signatureImageUrl} alt="Signature" className="h-16 w-auto object-contain" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Prefix & Numbering */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Numérotation des Factures</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Préfixe de facturation</Label>
              <Input
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                placeholder="ex. FAC ou INV"
                className="mt-1 font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Format généré : {invoicePrefix}-2026-0001, {invoicePrefix}-2026-0002...
              </p>
            </div>
            <div>
              <Label className="text-xs">Compteur actuel de factures émises</Label>
              <Input
                disabled
                value={organization?.invoiceCounter || 0}
                className="mt-1 font-mono bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}
