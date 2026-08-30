'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useInvoicesStore } from '@/store/invoices-store';
import { useOrganizationStore } from '@/store/organization-store';
import { useClientsStore } from '@/store/clients-store';
import {
  FileText,
  Plus,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Receipt,
  ExternalLink,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FatooraAiBuilder } from '@/components/fatoora-ai-builder';

export default function OverviewPage() {
  const { invoices, fetchInvoices } = useInvoicesStore();
  const { organization, fetchOrganization } = useOrganizationStore();
  const { clients, fetchClients } = useClientsStore();

  useEffect(() => {
    fetchInvoices();
    fetchOrganization();
    fetchClients();
  }, [fetchInvoices, fetchOrganization, fetchClients]);

  const paidInvoices = invoices.filter((i) => i.status === 'PAID');
  const pendingInvoices = invoices.filter(
    (i) => i.status === 'SENT' || i.status === 'AWAITING_PAYMENT' || i.status === 'PAYMENT_CLAIMED'
  );

  const totalRevenue = paidInvoices.reduce((acc, curr) => acc + curr.total, 0);
  const pendingAmount = pendingInvoices.reduce((acc, curr) => acc + curr.total, 0);

  const recoveryRate =
    invoices.length > 0
      ? Math.round((paidInvoices.length / invoices.length) * 100)
      : 100;

  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              {organization?.taxRegime === 'AUTO_ENTREPRENEUR'
                ? 'Auto-Entrepreneur (Exonéré TVA)'
                : organization?.taxRegime === 'FORFAITAIRE'
                ? 'Régime Forfaitaire'
                : 'Régime Réel (TVA 19%)'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenue sur votre espace de facturation pour <strong>{organization?.name || 'votre entreprise'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/invoices/new">
            <Button className="bg-primary hover:bg-primary/90 gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" /> Nouvelle Facture
            </Button>
          </Link>
        </div>
      </div>

      {/* Embedded Fatoora AI Invoicing Assistant */}
      <FatooraAiBuilder />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Encaissé
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {totalRevenue.toFixed(3)} {organization?.currency || 'TND'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidInvoices.length} factures réglées
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              En Attente de Paiement
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {pendingAmount.toFixed(3)} {organization?.currency || 'TND'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingInvoices.length} factures en cours
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Taux de Recouvrement
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {recoveryRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sur {invoices.length} factures totales
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Clients Actifs
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {clients.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Particuliers & B2B enregistrés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two columns: Recent Invoices & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table (2 cols) */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Dernières Factures Émises</CardTitle>
              <CardDescription className="text-xs">
                Aperçu de vos transactions récentes
              </CardDescription>
            </div>
            <Link href="/invoices">
              <Button size="sm" variant="ghost" className="text-xs gap-1">
                Voir tout <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentInvoices.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Aucune facture émise pour le moment.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-mono font-bold text-sm text-primary hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                        <Badge variant="outline" className="text-[10px]">
                          {inv.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {inv.client?.name} · Émise le{' '}
                        {new Date(inv.issueDate).toLocaleDateString('fr-TN')}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-mono font-bold text-sm">
                        {inv.total.toFixed(3)} {inv.currency}
                      </div>
                      <Link href={`/i/${inv.publicToken}`} target="_blank">
                        <span className="text-[11px] text-muted-foreground hover:text-foreground underline flex items-center justify-end gap-1">
                          Lien public <ExternalLink className="w-3 h-3" />
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Operations & Fiscal Settings Card (1 col) */}
        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Raccourcis & Conformité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/clients" className="block">
                <div className="p-3 border rounded-lg hover:border-primary/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="w-4 h-4 text-primary" />
                    Gérer les Clients
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{clients.length}</span>
                </div>
              </Link>

              <Link href="/settings/organization" className="block">
                <div className="p-3 border rounded-lg hover:border-primary/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Building2 className="w-4 h-4 text-primary" />
                    Profil Fiscal & TVA
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {organization?.vatRegistered ? 'TVA 19%' : 'Exonéré'}
                  </span>
                </div>
              </Link>

              <Link href="/settings/organization" className="block">
                <div className="p-3 border rounded-lg hover:border-primary/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Coordonnées Bancaires
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {organization?.bankRib ? 'RIB Configuré' : 'À renseigner'}
                  </span>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
