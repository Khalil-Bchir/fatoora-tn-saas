'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  Copy,
  Printer,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Trash2,
  Ban,
  Files,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { invoiceService, type Invoice } from '@/features/invoices/services/invoice-service'
import { paymentService } from '@/features/payments/services/payment-service'
import { numberToTunisianDinars } from '@/lib/number-to-words'

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Payment proof rejection modal
  const [rejectProofId, setRejectProofId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadInvoice = async () => {
    try {
      setLoading(true)
      const data = await invoiceService.getInvoice(id)
      setInvoice(data)
    } catch (err) {
      console.error('Failed to load invoice', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoice()
  }, [id])

  const handleSend = async () => {
    try {
      setActionLoading(true)
      await invoiceService.sendInvoice(id)
      await loadInvoice()
      setShowShareModal(true)
    } catch (err) {
      console.error('Failed to send invoice', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDuplicate = async () => {
    try {
      setActionLoading(true)
      const dup = await invoiceService.duplicateInvoice(id)
      router.push(`/invoices/${dup.id}`)
    } catch (err) {
      console.error('Failed to duplicate invoice', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette facture ?')) return
    try {
      setActionLoading(true)
      await invoiceService.cancelInvoice(id)
      await loadInvoice()
    } catch (err) {
      console.error('Failed to cancel invoice', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmProof = async (proofId: string) => {
    try {
      setActionLoading(true)
      await paymentService.confirmProof(proofId)
      await loadInvoice()
    } catch (err) {
      console.error('Failed to confirm proof', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectProof = async () => {
    if (!rejectProofId || !rejectReason.trim()) return
    try {
      setActionLoading(true)
      await paymentService.rejectProof(rejectProofId, rejectReason)
      setRejectProofId(null)
      setRejectReason('')
      await loadInvoice()
    } catch (err) {
      console.error('Failed to reject proof', err)
    } finally {
      setActionLoading(false)
    }
  }

  const publicUrl =
    typeof window !== 'undefined' && invoice?.publicToken
      ? `${window.location.origin}/i/${invoice.publicToken}`
      : ''

  const copyPublicLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-zinc-500">Chargement de la facture...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Facture introuvable</h2>
        <Link href="/invoices" className="text-xs text-emerald-600 underline mt-2 block">
          Retour aux factures
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/invoices">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-mono font-bold text-zinc-900 dark:text-white">
                {invoice.invoiceNumber}
              </h1>
              {invoice.status === 'PAID' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Payée
                </span>
              )}
              {invoice.status === 'PAYMENT_CLAIMED' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Preuve de virement déposée
                </span>
              )}
              {invoice.status === 'DRAFT' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Brouillon
                </span>
              )}
              {invoice.status === 'SENT' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 flex items-center gap-1">
                  <Send className="w-3.5 h-3.5" /> Envoyée
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Émise le {new Date(invoice.issueDate).toLocaleDateString('fr-TN')} • Échéance le{' '}
              {new Date(invoice.dueDate).toLocaleDateString('fr-TN')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === 'DRAFT' && (
            <Button
              onClick={handleSend}
              disabled={actionLoading}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              Émettre & Partager
            </Button>
          )}

          {invoice.publicToken && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareModal(true)}
              className="gap-1.5 text-xs h-9"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-600" />
              Lien Public
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs h-9"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimer / PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            disabled={actionLoading}
            className="gap-1.5 text-xs h-9"
          >
            <Files className="w-3.5 h-3.5" />
            Dupliquer
          </Button>

          {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={actionLoading}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-9"
            >
              <Ban className="w-3.5 h-3.5 mr-1" />
              Annuler
            </Button>
          )}
        </div>
      </div>

      {/* Payment Proofs Review Queue Banner if any pending */}
      {invoice.paymentProofs && invoice.paymentProofs.length > 0 && (
        <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            Preuve de paiement soumise par le client
          </div>
          <div className="space-y-3">
            {invoice.paymentProofs.map((proof) => (
              <div
                key={proof.id}
                className="bg-white dark:bg-zinc-900 border border-amber-200/60 dark:border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
                    <span>Reçu de virement :</span>
                    <a
                      href={proof.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 underline flex items-center gap-1"
                    >
                      Consulter le justificatif <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Déposé le {new Date(proof.submittedAt).toLocaleDateString('fr-TN')} • Montant
                    déclaré :{' '}
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {(proof.amount ?? invoice.total).toFixed(3)} {invoice.currency}
                    </span>
                  </div>
                  {proof.notes && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 italic">
                      Note client : "{proof.notes}"
                    </div>
                  )}
                  {proof.status === 'CONFIRMED' && (
                    <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-600">
                      ✓ Paiement validé
                    </span>
                  )}
                  {proof.status === 'REJECTED' && (
                    <span className="inline-block mt-2 text-[11px] font-semibold text-red-600">
                      ✗ Refusé : {proof.rejectionReason}
                    </span>
                  )}
                </div>

                {proof.status === 'SUBMITTED' && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleConfirmProof(proof.id)}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirmer le paiement
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectProofId(proof.id)}
                      disabled={actionLoading}
                      className="text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Rejeter
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official Tunisian Invoice Document Preview */}
      <div
        id="invoice-document"
        className="bg-white text-zinc-900 border border-zinc-200 rounded-xl p-8 md:p-12 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0"
      >
        {/* Document Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-zinc-200 pb-8">
          <div>
            <h2 className="text-2xl font-bold text-zinc-950">
              {invoice.organization?.name || 'Mon Entreprise'}
            </h2>
            <div className="mt-2 text-xs text-zinc-600 space-y-1">
              {invoice.organization?.taxId && (
                <p>
                  <strong className="text-zinc-900">Matricule Fiscal :</strong>{' '}
                  <span className="font-mono">{invoice.organization.taxId}</span>
                </p>
              )}
              {invoice.organization?.address && <p>{invoice.organization.address}</p>}
              {invoice.organization?.phone && <p>Tél : {invoice.organization.phone}</p>}
              {invoice.organization?.email && <p>Email : {invoice.organization.email}</p>}
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-zinc-100 rounded text-xs font-semibold uppercase tracking-wider text-zinc-800">
              FACTURE OFFICIELLE
            </div>
            <h3 className="text-xl font-mono font-bold text-emerald-700 mt-2">
              {invoice.invoiceNumber}
            </h3>
            <div className="mt-2 text-xs text-zinc-500 space-y-1">
              <p>
                <strong>Date d'émission :</strong>{' '}
                {new Date(invoice.issueDate).toLocaleDateString('fr-TN')}
              </p>
              <p>
                <strong>Date d'échéance :</strong>{' '}
                {new Date(invoice.dueDate).toLocaleDateString('fr-TN')}
              </p>
            </div>
          </div>
        </div>

        {/* Client Destinataire */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-lg p-5">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block mb-1">
            Facturé à (Client)
          </span>
          <h4 className="text-base font-bold text-zinc-900">
            {invoice.client?.companyName || invoice.client?.name}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-zinc-600 mt-2">
            {invoice.client?.taxId && (
              <p>
                <strong>Matricule Fiscal :</strong>{' '}
                <span className="font-mono">{invoice.client.taxId}</span>
              </p>
            )}
            {invoice.client?.email && <p>Email : {invoice.client.email}</p>}
            {invoice.client?.phone && <p>Tél : {invoice.client.phone}</p>}
            {invoice.client?.address && <p>Adresse : {invoice.client.address}</p>}
          </div>
        </div>

        {/* Prestations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-zinc-900 text-[11px] uppercase tracking-wider text-zinc-700 font-bold">
                <th className="py-3 px-2">Désignation des Prestations / Articles</th>
                <th className="py-3 px-2 text-center">Qté</th>
                <th className="py-3 px-2 text-right">Prix Unit. HT</th>
                {invoice.vatApplicable && <th className="py-3 px-2 text-center">TVA</th>}
                <th className="py-3 px-2 text-right">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 px-2 font-medium text-zinc-900">{item.description}</td>
                  <td className="py-3.5 px-2 text-center text-zinc-600">{item.quantity}</td>
                  <td className="py-3.5 px-2 text-right font-mono text-zinc-700">
                    {item.unitPrice.toFixed(3)} {invoice.currency}
                  </td>
                  {invoice.vatApplicable && (
                    <td className="py-3.5 px-2 text-center text-zinc-600">{item.vatRate}%</td>
                  )}
                  <td className="py-3.5 px-2 text-right font-mono font-semibold text-zinc-900">
                    {(item.quantity * item.unitPrice).toFixed(3)} {invoice.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Recap & Stamps */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border-t border-zinc-200 pt-6">
          {/* Terms & Notes */}
          <div className="md:col-span-7 space-y-3">
            {invoice.paymentTerms && (
              <div className="text-xs text-zinc-600">
                <strong>Conditions de paiement :</strong> {invoice.paymentTerms}
              </div>
            )}

            {invoice.notes && (
              <div className="text-xs text-zinc-500 italic">
                <strong>Notes :</strong> {invoice.notes}
              </div>
            )}
          </div>

          {/* Totals Table */}
          <div className="md:col-span-5 space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-zinc-100 text-zinc-600">
              <span>Total Brut Hors Taxe (HT) :</span>
              <span className="font-mono font-medium">
                {invoice.subtotal.toFixed(3)} {invoice.currency}
              </span>
            </div>
            {invoice.vatApplicable && (
              <div className="flex justify-between py-1.5 border-b border-zinc-100 text-zinc-600">
                <span>Total TVA :</span>
                <span className="font-mono font-medium">
                  {invoice.vatAmount.toFixed(3)} {invoice.currency}
                </span>
              </div>
            )}
            {invoice.vatApplicable && invoice.timbreFiscalAmount > 0 && (
              <div className="flex justify-between py-1.5 border-b border-zinc-100 text-zinc-600">
                <span>Droit de Timbre Fiscal :</span>
                <span className="font-mono font-medium">
                  {invoice.timbreFiscalAmount.toFixed(3)} {invoice.currency}
                </span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-zinc-900 text-sm font-bold text-zinc-950">
              <span>TOTAL FACTURE (HT = TTC) :</span>
              <span className="font-mono text-base text-emerald-700">
                {invoice.total.toFixed(3)} {invoice.currency}
              </span>
            </div>

            {/* Montant en toutes lettres */}
            <div className="pt-2 text-[11px] text-zinc-700 bg-zinc-50 p-2.5 rounded border border-zinc-200">
              <strong>Montant en lettres :</strong>{' '}
              <span className="italic">{numberToTunisianDinars(invoice.total)} ({invoice.total.toFixed(3)} {invoice.currency}).</span>
            </div>
          </div>
        </div>

        {/* Cachet & Signature */}
        <div className="border-t border-zinc-200 pt-6 flex justify-between items-end">
          <div className="text-[10px] text-zinc-400">
            Document généré électroniquement via Fatoora Hub Tunisie.
          </div>
          <div className="text-center p-4 border border-dashed border-zinc-300 rounded-lg min-w-[200px]">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-2">
              Cachet & Signature
            </span>
            {invoice.organization?.stampUrl && invoice.organization?.signatureUrl ? (
              <div className="relative inline-block mx-auto">
                <img
                  src={invoice.organization.stampUrl}
                  alt="Cachet"
                  className="max-h-20 max-w-[160px] object-contain opacity-95"
                />
                <img
                  src={invoice.organization.signatureUrl}
                  alt="Signature"
                  className="absolute inset-0 max-h-16 max-w-[150px] object-contain -rotate-6 translate-x-2 translate-y-1 mix-blend-multiply"
                />
              </div>
            ) : invoice.organization?.stampUrl || invoice.organization?.signatureUrl ? (
              <img
                src={invoice.organization.stampUrl || invoice.organization.signatureUrl || ''}
                alt="Cachet & Signature"
                className="max-h-20 max-w-[160px] mx-auto object-contain"
              />
            ) : (
              <div className="h-16 flex flex-col items-center justify-center text-[11px] text-zinc-700 font-serif">
                <div className="font-bold">{invoice.organization?.name || 'Mohamed Khalil Bchir'}</div>
                <div className="text-[10px] text-zinc-400 font-mono">[Signature & Cachet]</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal Dialog */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" />
              Lien Public Sécurisé
            </DialogTitle>
            <DialogDescription>
              Transmettez ce lien à votre client pour qu'il consulte sa facture et dépose son reçu
              de virement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Input readOnly value={publicUrl} className="text-xs font-mono" />
              <Button onClick={copyPublicLink} size="sm" className="bg-emerald-600 text-white shrink-0">
                {copied ? 'Copié !' : 'Copier'}
              </Button>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg text-xs text-zinc-500 space-y-1">
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                Ce que voit votre client :
              </p>
              <p>✓ Votre facture officielle avec Matricule Fiscal & RIB</p>
              <p>✓ Bouton de téléchargement PDF</p>
              <p>✓ Formulaire pour téléverser la preuve de paiement</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Payment Proof Dialog */}
      <Dialog open={!!rejectProofId} onOpenChange={(open) => !open && setRejectProofId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Refuser le justificatif
            </DialogTitle>
            <DialogDescription>
              Précisez le motif du refus. Cette mention sera visible par le client sur son lien de
              facture.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Input
                placeholder="ex: Montant viré incomplet, virement non reçu sur le compte..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectProofId(null)}>
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleRejectProof}
                disabled={!rejectReason.trim() || actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirmer le refus
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
