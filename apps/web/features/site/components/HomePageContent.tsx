'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Building2,
  Receipt,
  CreditCard,
  Stamp,
  Users,
  FileCheck2,
  Wand2,
  Lock,
  Download,
  Printer,
  ChevronDown,
  Star,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function HomePageContent() {
  // Live Simulator State
  const [simClientName, setSimClientName] = useState('Société Horizon Tech SARL');
  const [simServiceDesc, setSimServiceDesc] = useState('Développement Web & Hébergement Cloud');
  const [simAmountHT, setSimAmountHT] = useState(1500);
  const [simVatRate, setSimVatRate] = useState(19);
  const [simVatApplicable, setSimVatApplicable] = useState(true);
  const [simIncludeTimbre, setSimIncludeTimbre] = useState(true);

  // Computed simulator values
  const simVatAmount = simVatApplicable ? (simAmountHT * simVatRate) / 100 : 0;
  const simTimbre = simVatApplicable && simIncludeTimbre ? 1.0 : 0;
  const simTotalTTC = simAmountHT + simVatAmount + simTimbre;

  return (
    <div className="flex flex-col min-h-screen">
      {/* ─── 1. HERO SECTION ─── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b bg-linear-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col: Hero Pitch */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                <span className="text-sm">🇹🇳</span>
                <span>Plateforme Conforme Fiscale DGI & El Fatoora</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
                La Facturation Tunisienne{' '}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-blue-600 to-emerald-600">
                  Intelligente & 100% Conforme
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                Auto-entrepreneurs, freelances, cabinets et entreprises : générez vos factures en <strong>Dinar Tunisien (TND)</strong> avec calcul automatique de la TVA (0%, 7%, 13%, 19%), droit de timbre fiscal (1.000 DT), cachet & signature, et validation des règlements par virement.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link href="/auth/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 gap-2 h-12 px-8">
                    Créer mon compte gratuit <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/invoices" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full border-border/80 hover:bg-muted font-medium h-12 px-6 gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Voir l'Espace Facturation
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-border/60 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Conforme Loi Auto-entrepreneur</span>
                </div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary shrink-0" />
                  <span>Timbre Fiscal 1 DT & TVA Légale</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Suivi des RIB & Virements</span>
                </div>
              </div>
            </div>

            {/* Right Col: Live Interactive Invoice Simulator */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-primary/20 bg-card p-6 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500" />
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono text-muted-foreground ml-2">FAC-2026-0001.preview</span>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px]">
                    Simulateur Live
                  </Badge>
                </div>

                <div className="space-y-4 pt-4 text-xs">
                  {/* Business & Client Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm text-foreground">Mon Entreprise SARL</p>
                      <p className="text-muted-foreground font-mono text-[11px]">Matricule: 1892014/A/M/000</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-primary">FACTURE OFFICIELLE</p>
                      <p className="text-muted-foreground text-[11px]">Date : {new Date().toLocaleDateString('fr-TN')}</p>
                    </div>
                  </div>

                  {/* Simulator Controls */}
                  <div className="p-3 border rounded-lg bg-muted/30 space-y-2.5">
                    <div>
                      <Label className="text-[11px]">Client facturé</Label>
                      <Input
                        value={simClientName}
                        onChange={(e) => setSimClientName(e.target.value)}
                        className="h-7 text-xs mt-1 bg-background"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px]">Montant HT (TND)</Label>
                        <Input
                          type="number"
                          step="50"
                          value={simAmountHT}
                          onChange={(e) => setSimAmountHT(parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs mt-1 font-mono bg-background"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Taux TVA</Label>
                        <Select
                          value={String(simVatRate)}
                          onValueChange={(val) => setSimVatRate(parseFloat(val))}
                        >
                          <SelectTrigger className="h-7 text-xs mt-1 bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0% (Exonéré)</SelectItem>
                            <SelectItem value="7">7% (Taux réduit)</SelectItem>
                            <SelectItem value="13">13% (Prestations IT)</SelectItem>
                            <SelectItem value="19">19% (Taux standard)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted-foreground">Régime avec TVA</span>
                      <Switch checked={simVatApplicable} onCheckedChange={setSimVatApplicable} />
                    </div>
                  </div>

                  {/* Financial Breakdown Table */}
                  <div className="space-y-1.5 pt-1 font-mono">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total HT :</span>
                      <span>{simAmountHT.toFixed(3)} TND</span>
                    </div>
                    {simVatApplicable ? (
                      <>
                        <div className="flex justify-between text-muted-foreground">
                          <span>TVA ({simVatRate}%) :</span>
                          <span>{simVatAmount.toFixed(3)} TND</span>
                        </div>
                        {simTimbre > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Timbre Fiscal :</span>
                            <span>{simTimbre.toFixed(3)} TND</span>
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between font-bold text-sm text-foreground">
                          <span>TOTAL TTC À PAYER :</span>
                          <span className="text-primary text-base font-black">
                            {simTotalTTC.toFixed(3)} TND
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] text-muted-foreground italic">
                          TVA non applicable, art. 39 du Code de la TVA (Auto-entrepreneur)
                        </p>
                        <div className="border-t pt-2 flex justify-between font-bold text-sm text-foreground">
                          <span>NET À PAYER :</span>
                          <span className="text-primary text-base font-black">
                            {simAmountHT.toFixed(3)} TND
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Stamp badge */}
                  <div className="flex items-center justify-between pt-3 border-t text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Stamp className="w-3.5 h-3.5 text-primary" /> Cachet & Signature apposés
                    </span>
                    <span className="font-mono text-emerald-600 font-semibold">RIB: 08 000 ... 20</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. TUNISIAN FISCAL MATRIX ─── */}
      <section className="py-16 md:py-24 bg-muted/20 border-b">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Adapté à Tous les Régimes Fiscaux en Tunisie
            </h2>
            <p className="text-muted-foreground">
              Que vous soyez développeur freelance, profession libérale, ou dirigeant de SARL/SUARL, Fatoora TN gère automatiquement vos mentions légales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Auto-Entrepreneur */}
            <Card className="border-border/60 hover:border-primary/40 transition-all hover:shadow-lg">
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  Loi Auto-Entrepreneur
                </Badge>
                <CardTitle className="text-xl font-bold">Auto-Entrepreneur</CardTitle>
                <CardDescription className="text-xs">
                  Freelances & consultants individuels (Plafond 75 000 DT/an)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Exonération automatique de TVA avec clause légale obligatoire</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Pas de droit de timbre fiscal requis</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Numérotation séquentielle certifiée</span>
                </div>
              </CardContent>
            </Card>

            {/* Régime Forfaitaire */}
            <Card className="border-border/60 hover:border-primary/40 transition-all hover:shadow-lg">
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2 bg-blue-500/10 text-blue-600 border-blue-500/20">
                  Régime Simplifié
                </Badge>
                <CardTitle className="text-xl font-bold">Régime Forfaitaire</CardTitle>
                <CardDescription className="text-xs">
                  Commerçants et artisans avec comptabilité simplifiée
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Gestion souple de la TVA selon l'activité</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Gestion des coordonnées bancaires et reçus</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Suivi direct des encaissements clients</span>
                </div>
              </CardContent>
            </Card>

            {/* Régime Réel */}
            <Card className="border-primary/40 bg-primary/5 hover:shadow-xl transition-all relative">
              <div className="absolute -top-3 right-4">
                <Badge className="bg-primary text-primary-foreground text-[10px]">
                  B2B & Sociétés
                </Badge>
              </div>
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2 bg-primary/10 text-primary border-primary/20">
                  Assujetti TVA
                </Badge>
                <CardTitle className="text-xl font-bold">Régime Réel (SARL / SA)</CardTitle>
                <CardDescription className="text-xs">
                  Entreprises avec déclaration mensuelle TVA et Matricule Fiscal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Taux de TVA paramétrables par ligne (0%, 7%, 13%, 19%)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Droit de Timbre Fiscal obligatoire (1.000 DT)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Préparation à la passerelle TTN El Fatoora (TEIF)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── 3. CORE PLATFORM FEATURES ─── */}
      <section className="py-16 md:py-24 border-b">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="outline" className="text-primary bg-primary/10 border-primary/20">
              Fonctionnalités Clés
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Tout ce dont vous avez besoin pour gérer vos encaissements
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-3">
              <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit">
                <Wand2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Fatoora AI Builder</h3>
              <p className="text-sm text-muted-foreground">
                Tapez votre prestation en langage naturel ou dialecte, et notre intelligence artificielle extrait le client, le montant, la TVA et génère le devis en 3 secondes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 w-fit">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Suivi des Virements 2-Étapes</h3>
              <p className="text-sm text-muted-foreground">
                Partagez un lien direct et sécurisé <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/i/[token]</code>. Votre client consulte sa facture et dépose son ordre de virement en ligne.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-3">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 w-fit">
                <Stamp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Cachet & Signature Intégrés</h3>
              <p className="text-sm text-muted-foreground">
                Téléversez l'image de votre tampon officiel et signature : vos documents et exports PDF sont automatiquement cachetés et signés.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-3">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 w-fit">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Isolation Multi-Tenant</h3>
              <p className="text-sm text-muted-foreground">
                Chaque organisation possède son espace étanche, ses compteurs séquentiels indépendants, ses coordonnées bancaires et ses équipes.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-3">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 w-fit">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Exports PDF & Markdown</h3>
              <p className="text-sm text-muted-foreground">
                Imprimez directement dans un format épuré ou téléchargez votre facture en Markdown prêt pour l'intégration comptable et archivage.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-3">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 w-fit">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Prêt pour El Fatoora (TTN)</h3>
              <p className="text-sm text-muted-foreground">
                Architecture conçue pour accueillir la passerelle XML TEIF et certificats TunTrust dès l'obligation légale Phase 3.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. PRICING SECTION (TND) ─── */}
      <section className="py-16 md:py-24 bg-muted/20 border-b">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="outline" className="text-primary bg-primary/10 border-primary/20">
              Tarification Transparente
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Des forfaits en Dinars Tunisiens pour chaque étape
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <Card className="border-border/60 bg-card flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Auto-Entrepreneur</CardTitle>
                <CardDescription className="text-xs">
                  Idéal pour débuter et émettre ses premières factures
                </CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-black font-mono">0 DT</span>
                  <span className="text-muted-foreground text-sm"> / mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Jusqu'à 15 factures / mois</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Exonération légale de TVA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Liens publics partageables</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Fatoora AI Assistant basique</span>
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                <Link href="/auth/register" className="w-full">
                  <Button variant="outline" className="w-full">
                    Commencer Gratuitement
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Pro Tier */}
            <Card className="border-primary bg-card shadow-xl flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold">
                  Le Plus Populaire
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-bold">Pro & Freelance</CardTitle>
                <CardDescription className="text-xs">
                  Pour les prestataires et consultants en activité
                </CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-black font-mono text-primary">29 DT</span>
                  <span className="text-muted-foreground text-sm"> / mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-semibold">Factures & Devis illimités</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Cachet humide & signature automatique</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Multi-devises (TND, EUR, USD)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Réception des preuves de virement</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Fatoora AI Builder Illimité</span>
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                <Link href="/auth/register" className="w-full">
                  <Button className="w-full bg-primary hover:bg-primary/90 font-bold">
                    Essai Gratuit 14 Jours
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Enterprise Tier */}
            <Card className="border-border/60 bg-card flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Société / B2B</CardTitle>
                <CardDescription className="text-xs">
                  Pour les PME, agences et équipes
                </CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-black font-mono">79 DT</span>
                  <span className="text-muted-foreground text-sm"> / mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tout le forfait Pro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Multi-utilisateurs & rôles d'équipe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Support prioritaire & export comptable</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Accès anticipé e-facturation TTN</span>
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                <Link href="/auth/register" className="w-full">
                  <Button variant="outline" className="w-full">
                    Choisir Forfait Société
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── 5. FAQ SECTION ─── */}
      <section className="py-16 md:py-24 border-b">
        <div className="container mx-auto max-w-4xl px-4 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Foire Aux Questions</h2>
            <p className="text-muted-foreground text-sm">
              Réponses aux questions courantes sur la facturation et fiscalité tunisienne
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 border rounded-xl bg-card space-y-2">
              <p className="font-bold text-base text-foreground">
                Comment fonctionne l'exonération de TVA pour les auto-entrepreneurs ?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Selon la loi tunisienne régissant le statut de l'auto-entrepreneur, les prestations réalisées dans la limite du plafond légal (75 000 DT/an) sont exonérées de TVA. Fatoora TN insère automatiquement la mention légale d'exonération sur vos factures et désactive le droit de timbre.
              </p>
            </div>

            <div className="p-5 border rounded-xl bg-card space-y-2">
              <p className="font-bold text-base text-foreground">
                Comment mes clients paient-ils leurs factures ?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                En Tunisie, le règlement s'effectue principalement par virement bancaire ou chèque. Fatoora TN affiche clairement votre RIB (20 chiffres) sur la facture en ligne. Dès que votre client effectue le virement, il téléverse sa preuve sur sa page dédiée, vous permettant de la valider en un clic.
              </p>
            </div>

            <div className="p-5 border rounded-xl bg-card space-y-2">
              <p className="font-bold text-base text-foreground">
                Puis-je facturer des clients étrangers à l'export ?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Oui, Fatoora TN supporte les factures en EUR et USD avec mention des coordonnées bancaires internationales (IBAN / Code BIC) pour vos encaissements depuis l'étranger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. FINAL CTA ─── */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-5xl px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Prêt à simplifier votre facturation en Tunisie ?
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto text-base">
            Rejoignez les professionnels et entreprises tunisiennes qui émettent des factures impeccables en quelques clics.
          </p>
          <div className="pt-2">
            <Link href="/auth/register">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-bold px-8 h-12 shadow-xl">
                Créer mon compte gratuitement
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
