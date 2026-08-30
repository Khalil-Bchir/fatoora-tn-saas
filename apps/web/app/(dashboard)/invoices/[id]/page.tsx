'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInvoicesStore } from '@/store/invoices-store';
import {
  ArrowLeft,
  Share2,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  FileCheck,
  Copy,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { InvoiceStatus } from '@repo/types';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const { getInvoice, updateStatus, deleteInvoice, currentInvoice, loading } = useInvoicesStore();
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      getInvoice(invoiceId).catch((err) => {
        toast.error(err.message || 'Facture introuvable');
      });
    }
  }, [invoiceId, getInvoice]);

  if (loading || !currentInvoice) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground animate-pulse">Chargement de la facture...</p>
      </div>
    );
  }

  const invoice = currentInvoice;
  const org = invoice.organization;
  const client = invoice.client;

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/i/${invoice.publicToken}`
    : `/i/${invoice.publicToken}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('Lien public copié dans le presse-papiers !');
  };

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    setUpdatingStatus(true);
    try {
      await updateStatus(invoice.id, newStatus);
      toast.success('Statut mis à jour avec succès');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;
    try {
      await deleteInvoice(invoice.id);
      toast.success('Facture supprimée');
      router.push('/invoices');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleDownloadMarkdown = () => {
    if (!invoice.mdContent) return;
    const blob = new Blob([invoice.mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceNumber}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Facture Markdown téléchargée');
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-mono text-primary">{invoice.invoiceNumber}</h1>
              <Badge variant="outline">{invoice.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Émise le {new Date(invoice.issueDate).toLocaleDateString('fr-TN')} · Échéance le{' '}
              {new Date(invoice.dueDate).toLocaleDateString('fr-TN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={copyShareLink} className="gap-1.5 text-xs">
            <Copy className="w-3.5 h-3.5" /> Copier Lien Public
          </Button>
          <Link href={`/i/${invoice.publicToken}`} target="_blank">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <ExternalLink className="w-3.5 h-3.5" /> Vue Client
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1.5 text-xs">
            <Printer className="w-3.5 h-3.5" /> Imprimer / PDF
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownloadMarkdown} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Markdown
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Preview Document (Left 2 cols) */}
        <div className="lg:col-span-2">
          <Card className="border shadow-md bg-card print:border-none print:shadow-none p-8 space-y-8">
            {/* Header / Org Info */}
            <div className="flex justify-between items-start border-b pb-6">
              <div>
                {org?.logoUrl ? (
                  <img src={org.logoUrl} alt={org.name} className="h-12 w-auto object-contain mb-3" />
                ) : (
                  <h2 className="text-2xl font-black text-foreground tracking-tight mb-1">
                    {org?.name || 'Mon Entreprise'}
                  </h2>
                )}
                {org?.activityType && (
                  <p className="text-xs text-muted-foreground italic mb-1">{org.activityType}</p>
                )}
                {org?.taxId && (
                  <p className="text-xs text-muted-foreground font-mono">
                    Matricule Fiscal : <strong>{org.taxId}</strong>
                  </p>
                )}
                {org?.address && (
                  <p className="text-xs text-muted-foreground">
                    {org.address}, {org.city}
                  </p>
                )}
                {org?.phone && (
                  <p className="text-xs text-muted-foreground">Tél : {org.phone}</p>
                )}
              </div>

              <div className="text-right">
                <div className="inline-block bg-primary/10 border border-primary/20 rounded-lg px-3 py-1 text-primary font-mono font-bold text-sm mb-2">
                  FACTURE
                </div>
                <p className="text-xl font-bold font-mono">{invoice.invoiceNumber}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Date : {new Date(invoice.issueDate).toLocaleDateString('fr-TN')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Échéance : {new Date(invoice.dueDate).toLocaleDateString('fr-TN')}
                </p>
              </div>
            </div>

            {/* Client Details */}
            <div className="p-4 rounded-lg bg-muted/20 border text-sm">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                Facturé À :
              </p>
              <p className="font-bold text-foreground">{client?.name}</p>
              {client?.companyName && (
                <p className="text-xs font-semibold text-muted-foreground">{client.companyName}</p>
              )}
              {client?.taxId && (
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Matricule Fiscal Client : <strong>{client.taxId}</strong>
                </p>
              )}
              {client?.address && (
                <p className="text-xs text-muted-foreground">{client.address}</p>
              )}
              {client?.email && (
                <p className="text-xs text-muted-foreground">{client.email}</p>
              )}
            </div>

            {/* Items Table */}
            <div>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-bold">
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Qté</th>
                    <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                    {invoice.vatApplicable && (
                      <th className="py-2.5 px-3 text-center">TVA</th>
                    )}
                    <th className="py-2.5 px-3 text-right">Total ({invoice.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-3">{item.description}</td>
                      <td className="py-3 px-3 text-center font-mono">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono">{item.unitPrice.toFixed(3)}</td>
                      {invoice.vatApplicable && (
                        <td className="py-3 px-3 text-center font-mono">{item.vatRate}%</td>
                      )}
                      <td className="py-3 px-3 text-right font-mono font-medium">
                        {item.total.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end pt-4 border-t">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total HT :</span>
                  <span className="font-mono">{invoice.subtotal.toFixed(3)} {invoice.currency}</span>
                </div>

                {invoice.vatApplicable ? (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total TVA ({invoice.vatRate}%) :</span>
                      <span className="font-mono">{invoice.vatAmount.toFixed(3)} {invoice.currency}</span>
                    </div>
                    {invoice.timbreFiscalAmount > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Timbre Fiscal :</span>
                        <span className="font-mono">{invoice.timbreFiscalAmount.toFixed(3)} {invoice.currency}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t pt-2 text-foreground">
                      <span>TOTAL TTC :</span>
                      <span className="font-mono text-primary text-lg">
                        {invoice.total.toFixed(3)} {invoice.currency}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] text-muted-foreground italic">
                      TVA non applicable (Régime : {org?.taxRegime || 'Auto-entrepreneur'})
                    </p>
                    <div className="flex justify-between font-bold text-base border-t pt-2 text-foreground">
                      <span>NET À PAYER :</span>
                      <span className="font-mono text-primary text-lg">
                        {invoice.total.toFixed(3)} {invoice.currency}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Payment Coordinates & Stamp/Signature Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-6 text-xs">
              <div>
                <p className="font-bold text-primary mb-1">Coordonnées de Règlement :</p>
                {org?.bankRib && (
                  <p className="font-mono">
                    <strong>RIB :</strong> {org.bankRib}
                  </p>
                )}
                {org?.bankName && <p><strong>Banque :</strong> {org.bankName}</p>}
                {invoice.paymentTerms && (
                  <p className="mt-2 text-muted-foreground">{invoice.paymentTerms}</p>
                )}
                {invoice.notes && (
                  <p className="mt-2 text-muted-foreground italic">{invoice.notes}</p>
                )}
              </div>

              <div className="flex flex-col items-center sm:items-end justify-center">
                <p className="font-bold text-muted-foreground mb-2">Cachet et Signature :</p>
                <div className="flex items-center gap-3">
                  {org?.stampImageUrl && (
                    <img
                      src={org.stampImageUrl}
                      alt="Cachet"
                      className="h-20 w-auto object-contain border rounded p-1 bg-white"
                    />
                  )}
                  {org?.signatureImageUrl && (
                    <img
                      src={org.signatureImageUrl}
                      alt="Signature"
                      className="h-20 w-auto object-contain border rounded p-1 bg-white"
                    />
                  )}
                  {!org?.stampImageUrl && !org?.signatureImageUrl && (
                    <div className="h-20 w-36 border-2 border-dashed rounded flex items-center justify-center text-[10px] text-muted-foreground text-center p-2">
                      Cachet / Signature non configuré
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Management Actions (Right col) */}
        <div className="space-y-6">
          {/* Status Management */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Gestion du Statut</CardTitle>
              <CardDescription className="text-xs">
                Mise à jour manuelle du cycle de règlement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={invoice.status}
                onValueChange={(val) => handleStatusChange(val as InvoiceStatus)}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Brouillon (DRAFT)</SelectItem>
                  <SelectItem value="SENT">Envoyée (SENT)</SelectItem>
                  <SelectItem value="AWAITING_PAYMENT">En attente (AWAITING_PAYMENT)</SelectItem>
                  <SelectItem value="PAYMENT_CLAIMED">Preuve reçue (PAYMENT_CLAIMED)</SelectItem>
                  <SelectItem value="PAID">Payée & Confirmée (PAID)</SelectItem>
                  <SelectItem value="OVERDUE">En retard (OVERDUE)</SelectItem>
                  <SelectItem value="CANCELLED">Annulée (CANCELLED)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Payment Proofs received */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-primary" />
                Preuves de Paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!invoice.paymentProofs || invoice.paymentProofs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aucun justificatif de virement soumis par le client pour le moment.
                </p>
              ) : (
                <div className="space-y-3">
                  {invoice.paymentProofs.map((proof) => (
                    <div key={proof.id} className="p-3 border rounded-lg bg-card text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Justificatif</span>
                        <Badge variant="outline">{proof.status}</Badge>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        Reçu le {new Date(proof.submittedAt).toLocaleString('fr-TN')}
                      </p>
                      {proof.notes && <p className="italic">{proof.notes}</p>}
                      <a
                        href={proof.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline block pt-1 font-medium"
                      >
                        Consulter la pièce jointe
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-destructive font-semibold">Zone de Danger</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="sm"
                className="w-full text-xs gap-1.5"
                onClick={handleDelete}
              >
                <Trash2 className="w-3.5 h-3.5" /> Supprimer la facture
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
