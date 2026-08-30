'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useInvoicesStore } from '@/store/invoices-store';
import {
  FileText,
  Printer,
  Upload,
  CheckCircle2,
  Clock,
  Building2,
  CreditCard,
  FileCheck,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PublicInvoicePage() {
  const params = useParams();
  const token = params.token as string;
  const { fetchPublicInvoice, submitPaymentProof, currentInvoice, loading } = useInvoicesStore();

  const [proofFileUrl, setProofFileUrl] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [proofSubmittedSuccess, setProofSubmittedSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      fetchPublicInvoice(token).catch((err) => {
        toast.error(err.message || 'Facture introuvable');
      });
    }
  }, [token, fetchPublicInvoice]);

  if (loading || !currentInvoice) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
        <p className="text-muted-foreground animate-pulse">Chargement de votre facture...</p>
      </div>
    );
  }

  const invoice = currentInvoice;
  const org = invoice.organization;
  const client = invoice.client;

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFileUrl.trim()) {
      toast.error('Veuillez fournir le lien ou URL de votre justificatif');
      return;
    }

    setIsSubmittingProof(true);
    try {
      await submitPaymentProof(token, proofFileUrl, invoice.total, proofNotes);
      setProofSubmittedSuccess(true);
      toast.success('Justificatif transmis avec succès à votre prestataire !');
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi de la preuve");
    } finally {
      setIsSubmittingProof(false);
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
  };

  return (
    <div className="min-h-screen bg-muted/10 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">Facture en ligne</span>
            {invoice.status === 'PAID' ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Payée & Confirmée
              </Badge>
            ) : invoice.status === 'PAYMENT_CLAIMED' || proofSubmittedSuccess ? (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                <FileCheck className="w-3 h-3 mr-1" /> Preuve de paiement reçue
              </Badge>
            ) : (
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                <Clock className="w-3 h-3 mr-1" /> En attente de règlement
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1 text-xs">
              <Printer className="w-3.5 h-3.5" /> Imprimer / PDF
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadMarkdown} className="gap-1 text-xs">
              <Download className="w-3.5 h-3.5" /> Markdown
            </Button>
          </div>
        </div>

        {/* Invoice Card Container */}
        <Card className="border shadow-lg bg-card print:border-none print:shadow-none p-8 sm:p-12 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-6">
            <div>
              {org?.logoUrl ? (
                <img src={org.logoUrl} alt={org.name} className="h-12 w-auto object-contain mb-3" />
              ) : (
                <h1 className="text-2xl font-black tracking-tight text-foreground mb-1">
                  {org?.name || 'Mon Entreprise'}
                </h1>
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
              {org?.phone && <p className="text-xs text-muted-foreground">Tél : {org.phone}</p>}
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block bg-primary/10 border border-primary/20 rounded-lg px-3 py-1 text-primary font-mono font-bold text-xs mb-2">
                FACTURE OFFICIELLE
              </span>
              <p className="text-2xl font-bold font-mono text-foreground">{invoice.invoiceNumber}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Date : {new Date(invoice.issueDate).toLocaleDateString('fr-TN')}
              </p>
              <p className="text-xs text-muted-foreground">
                Échéance : {new Date(invoice.dueDate).toLocaleDateString('fr-TN')}
              </p>
            </div>
          </div>

          {/* Client box */}
          <div className="p-4 rounded-lg bg-muted/20 border text-sm">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Facturé À :</p>
            <p className="font-bold text-foreground">{client?.name}</p>
            {client?.companyName && (
              <p className="text-xs font-semibold text-muted-foreground">{client.companyName}</p>
            )}
            {client?.taxId && (
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Matricule Fiscal : <strong>{client.taxId}</strong>
              </p>
            )}
            {client?.address && <p className="text-xs text-muted-foreground">{client.address}</p>}
          </div>

          {/* Items */}
          <div>
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-bold">
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Qté</th>
                  <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                  {invoice.vatApplicable && <th className="py-2.5 px-3 text-center">TVA</th>}
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

          {/* Summary */}
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
                    <span>TOTAL TTC À PAYER :</span>
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

          {/* Bank Coordinates & Cachet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t pt-6 text-xs">
            <div>
              <p className="font-bold text-primary mb-1">Instructions de Règlement Bancaire :</p>
              {org?.bankRib && (
                <div className="p-3 border rounded bg-muted/20 font-mono space-y-1">
                  <p><strong>Banque :</strong> {org.bankName || 'Banque Tunisienne'}</p>
                  <p><strong>RIB :</strong> {org.bankRib}</p>
                  {org.bankIban && <p><strong>IBAN :</strong> {org.bankIban}</p>}
                </div>
              )}
              {invoice.paymentTerms && (
                <p className="mt-2 text-muted-foreground">{invoice.paymentTerms}</p>
              )}
              {invoice.notes && (
                <p className="mt-1 text-muted-foreground italic">{invoice.notes}</p>
              )}
            </div>

            <div className="flex flex-col items-center sm:items-end justify-center">
              <p className="font-bold text-muted-foreground mb-2">Cachet et Signature de l'émetteur :</p>
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
              </div>
            </div>
          </div>
        </Card>

        {/* Client Payment Proof Submission Form (Hidden when printing) */}
        {invoice.status !== 'PAID' && (
          <Card className="print:hidden border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Confirmer votre Paiement (Virement / Versement)
              </CardTitle>
              <CardDescription className="text-xs">
                Une fois votre virement effectué, transmettez ici votre reçu ou ordre de virement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {proofSubmittedSuccess ? (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Justificatif transmis avec succès !</p>
                    <p className="text-xs mt-0.5">
                      L'émetteur a été notifié et validera le paiement après vérification sur son compte bancaire.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitProof} className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold">
                      Justificatif de virement bancaire (Image du reçu ou PDF) *
                    </Label>
                    <div className="mt-1.5">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp, application/pdf"
                        required={!proofFileUrl}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = () => setProofFileUrl(reader.result as string)
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer border rounded-md p-1 bg-card"
                      />
                    </div>
                    {proofFileUrl && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Fichier sélectionné, prêt à être transmis vers le stockage sécurisé.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">Remarques ou référence du virement (optionnel)</Label>
                    <Textarea
                      value={proofNotes}
                      onChange={(e) => setProofNotes(e.target.value)}
                      placeholder="ex. Virement exécuté sous la référence VIR-98234"
                      className="mt-1 bg-card min-h-[60px]"
                    />
                  </div>
                  <Button type="submit" disabled={isSubmittingProof || !proofFileUrl} className="w-full gap-2 font-semibold">
                    <Upload className="w-4 h-4" />
                    {isSubmittingProof ? 'Téléversement vers Supabase Storage...' : 'Téléverser et confirmer le virement'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
