'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useInvoicesStore } from '@/store/invoices-store';
import { useOrganizationStore } from '@/store/organization-store';
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { InvoiceStatus } from '@repo/types';

export default function InvoicesPage() {
  const { invoices, loading, fetchInvoices } = useInvoicesStore();
  const { organization, fetchOrganization } = useOrganizationStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchInvoices();
    fetchOrganization();
  }, [fetchInvoices, fetchOrganization]);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (inv.client?.name && inv.client.name.toLowerCase().includes(search.toLowerCase())) ||
      (inv.client?.companyName && inv.client.companyName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((acc, curr) => acc + curr.total, 0);

  const pendingAmount = invoices
    .filter((inv) => inv.status === 'SENT' || inv.status === 'AWAITING_PAYMENT' || inv.status === 'PAYMENT_CLAIMED')
    .reduce((acc, curr) => acc + curr.total, 0);

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Payée
          </Badge>
        );
      case 'AWAITING_PAYMENT':
      case 'SENT':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-blue-500/20">
            <Clock className="w-3 h-3 mr-1" /> En attente
          </Badge>
        );
      case 'PAYMENT_CLAIMED':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/20">
            <FileCheck className="w-3 h-3 mr-1" /> Preuve reçue
          </Badge>
        );
      case 'OVERDUE':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border-rose-500/20">
            <AlertCircle className="w-3 h-3 mr-1" /> En retard
          </Badge>
        );
      case 'DRAFT':
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Brouillon
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturation & Devis</h1>
          <p className="text-muted-foreground">
            Gérez vos factures conformes aux régimes fiscaux tunisiens
          </p>
        </div>
        <Link href="/invoices/new">
          <Button className="bg-primary hover:bg-primary/90 gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Créer une facture
          </Button>
        </Link>
      </div>

      {/* VAT Disclaimer Banner for VAT-Registered Businesses */}
      {organization?.vatRegistered && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Notice Régime TVA & Obligation El Fatoora (TEIF)</p>
            <p className="text-xs opacity-90 mt-0.5">
              Votre entreprise est assujettie à la TVA (Matricule Fiscal : {organization.taxId || 'Non configuré'}). 
              Cette plateforme génère des factures conformes aux taux légaux tunisiens (0%, 7%, 13%, 19%). 
              La passerelle d'e-facturation automatique TTN (TunisieTradeNet) et signature TunTrust sera activée en Phase 3.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Total Encaissé
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalRevenue.toFixed(3)} {organization?.currency || 'TND'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Factures réglées confirmées</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              En attente de paiement
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {pendingAmount.toFixed(3)} {organization?.currency || 'TND'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Factures émises non réglées</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Régime Fiscal Entreprise
            </CardDescription>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {organization?.taxRegime === 'AUTO_ENTREPRENEUR'
                ? 'Auto-Entrepreneur (Exonéré TVA)'
                : organization?.taxRegime === 'FORFAITAIRE'
                ? 'Régime Forfaitaire'
                : 'Régime Réel (Assujetti TVA)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {organization?.name || 'Mon Entreprise'} · {organization?.city || 'Tunis'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par N° facture ou client..."
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-card">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="DRAFT">Brouillon</SelectItem>
              <SelectItem value="SENT">Envoyée</SelectItem>
              <SelectItem value="AWAITING_PAYMENT">En attente</SelectItem>
              <SelectItem value="PAYMENT_CLAIMED">Preuve reçue</SelectItem>
              <SelectItem value="PAID">Payée</SelectItem>
              <SelectItem value="OVERDUE">En retard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoices Table */}
      <Card className="border-border/60 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="font-semibold">N° Facture</TableHead>
              <TableHead className="font-semibold">Client</TableHead>
              <TableHead className="font-semibold">Date d'émission</TableHead>
              <TableHead className="font-semibold">Échéance</TableHead>
              <TableHead className="font-semibold">Montant Total</TableHead>
              <TableHead className="font-semibold">Statut</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Chargement des factures...
                </TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-muted-foreground/60" />
                    <p className="font-medium text-foreground">Aucune facture trouvée</p>
                    <p className="text-xs text-muted-foreground">
                      Commencez par créer votre première facture
                    </p>
                    <Link href="/invoices/new" className="mt-2">
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Nouvelle Facture
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono font-semibold text-primary">
                    <Link href={`/invoices/${invoice.id}`} className="hover:underline flex items-center gap-1.5">
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{invoice.client?.name || 'Client inconnu'}</div>
                    {invoice.client?.companyName && (
                      <div className="text-xs text-muted-foreground">{invoice.client.companyName}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(invoice.issueDate).toLocaleDateString('fr-TN')}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(invoice.dueDate).toLocaleDateString('fr-TN')}
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    {invoice.total.toFixed(3)} {invoice.currency}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/i/${invoice.publicToken}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground">
                        <ExternalLink className="w-3.5 h-3.5" /> Lien Public
                      </Button>
                    </Link>
                    <Link href={`/invoices/${invoice.id}`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        Détails
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
