'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ExternalLink,
  FileText,
  AlertTriangle,
  Building2,
  ArrowUpRight,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { paymentService, type PaymentProof } from '@/features/payments/services/payment-service'

export default function PaymentsPage() {
  const [proofs, setProofs] = useState<PaymentProof[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUBMITTED' | 'CONFIRMED' | 'REJECTED'>('SUBMITTED')

  // Reject modal state
  const [rejectProofId, setRejectProofId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadProofs = async () => {
    try {
      setLoading(true)
      const data = await paymentService.listProofs()
      setProofs(data)
    } catch (err) {
      console.error('Failed to load payment proofs', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProofs()
  }, [])

  const handleConfirm = async (id: string) => {
    try {
      setActionLoading(true)
      await paymentService.confirmProof(id)
      await loadProofs()
    } catch (err) {
      console.error('Failed to confirm proof', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectProofId || !rejectReason.trim()) return
    try {
      setActionLoading(true)
      await paymentService.rejectProof(rejectProofId, rejectReason)
      setRejectProofId(null)
      setRejectReason('')
      await loadProofs()
    } catch (err) {
      console.error('Failed to reject proof', err)
    } finally {
      setActionLoading(false)
    }
  }

  const filteredProofs = proofs.filter((p) => {
    if (filterStatus === 'ALL') return true
    return p.status === filterStatus
  })

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Vérification des Règlements
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Validez les reçus de virements bancaires et avis d'opérations déposés par vos clients.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex items-center gap-2">
        <button
          onClick={() => setFilterStatus('SUBMITTED')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            filterStatus === 'SUBMITTED'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          À vérifier ({proofs.filter((p) => p.status === 'SUBMITTED').length})
        </button>
        <button
          onClick={() => setFilterStatus('CONFIRMED')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            filterStatus === 'CONFIRMED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Validés ({proofs.filter((p) => p.status === 'CONFIRMED').length})
        </button>
        <button
          onClick={() => setFilterStatus('REJECTED')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            filterStatus === 'REJECTED'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          Refusés ({proofs.filter((p) => p.status === 'REJECTED').length})
        </button>
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filterStatus === 'ALL'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Tous ({proofs.length})
        </button>
      </div>

      {/* Proofs List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-zinc-500">Chargement des preuves de paiement...</p>
        </div>
      ) : filteredProofs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
            Aucun justificatif dans cette section
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1">
            Lorsqu'un client dépose son reçu de virement bancaire sur son lien de facture, il apparaîtra ici pour validation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProofs.map((proof) => (
            <div
              key={proof.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                    Facture :{' '}
                    <Link
                      href={`/invoices/${proof.invoiceId}`}
                      className="text-emerald-600 hover:underline"
                    >
                      {proof.invoice?.invoiceNumber || proof.invoiceId}
                    </Link>
                  </span>

                  {proof.status === 'SUBMITTED' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60">
                      En attente de validation
                    </span>
                  )}
                  {proof.status === 'CONFIRMED' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60">
                      ✓ Confirmé
                    </span>
                  )}
                  {proof.status === 'REJECTED' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200/60">
                      ✗ Refusé
                    </span>
                  )}
                </div>

                <div className="text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
                  <p>
                    <strong>Client :</strong>{' '}
                    {proof.invoice?.client?.companyName || proof.invoice?.client?.name || 'Client'}
                  </p>
                  <p>
                    <strong>Montant déclaré :</strong>{' '}
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">
                      {(proof.amount ?? proof.invoice?.total ?? 0).toFixed(3)} TND
                    </span>
                  </p>
                  <p className="text-zinc-400 text-[11px]">
                    Déposé le {new Date(proof.submittedAt).toLocaleDateString('fr-TN')}
                  </p>
                  {proof.notes && (
                    <p className="italic text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded">
                      "{proof.notes}"
                    </p>
                  )}
                  {proof.rejectionReason && (
                    <p className="text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded text-[11px]">
                      Motif du refus : {proof.rejectionReason}
                    </p>
                  )}
                </div>

                {/* Proof Link / Preview Button */}
                <a
                  href={proof.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium underline"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Ouvrir le reçu / pièce jointe <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {proof.status === 'SUBMITTED' && (
                <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <Button
                    onClick={() => handleConfirm(proof.id)}
                    disabled={actionLoading}
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Valider le Virement
                  </Button>
                  <Button
                    onClick={() => setRejectProofId(proof.id)}
                    disabled={actionLoading}
                    variant="outline"
                    size="sm"
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Refuser
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Dialog open={!!rejectProofId} onOpenChange={(open) => !open && setRejectProofId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Motif du Refus de Paiement
            </DialogTitle>
            <DialogDescription>
              Expliquez pourquoi le justificatif est rejeté. Le client pourra soumettre une nouvelle preuve.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="ex: Montant viré non conforme, virement introuvable..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectProofId(null)}>
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirmer le Refus
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
