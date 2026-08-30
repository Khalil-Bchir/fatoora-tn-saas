'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Plus,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  MoreVertical,
  Trash2,
  Send,
  Eye,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { invoiceService, type Invoice } from '@/features/invoices/services/invoice-service'

const STATUS_FILTERS = [
  { label: 'Toutes', value: 'ALL' },
  { label: 'Brouillons', value: 'DRAFT' },
  { label: 'Envoyées', value: 'SENT' },
  { label: 'Preuves Déposées', value: 'PAYMENT_CLAIMED' },
  { label: 'Payées', value: 'PAID' },
  { label: 'En retard', value: 'OVERDUE' },
  { label: 'Litiges', value: 'DISPUTED' },
]

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const data = await invoiceService.listInvoices()
      setInvoices(data)
    } catch (err) {
      console.error('Failed to load invoices', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const handleDuplicate = async (id: string) => {
    try {
      setActionLoading(id)
      const newInvoice = await invoiceService.duplicateInvoice(id)
      router.push(`/invoices/${newInvoice.id}`)
    } catch (err) {
      console.error('Failed to duplicate invoice', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSend = async (id: string) => {
    try {
      setActionLoading(id)
      await invoiceService.sendInvoice(id)
      await loadInvoices()
    } catch (err) {
      console.error('Failed to send invoice', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return
    try {
      setActionLoading(id)
      await invoiceService.deleteInvoice(id)
      await loadInvoices()
    } catch (err) {
      console.error('Failed to delete invoice', err)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesStatus =
        selectedStatus === 'ALL' || inv.status === selectedStatus
      const q = search.toLowerCase()
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.client?.name && inv.client.name.toLowerCase().includes(q)) ||
        (inv.client?.companyName && inv.client.companyName.toLowerCase().includes(q))
      return matchesStatus && matchesSearch
    })
  }, [invoices, selectedStatus, search])

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
            <CheckCircle2 className="w-3.5 h-3.5" /> Payée
          </span>
        )
      case 'PAYMENT_CLAIMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
            <ShieldCheck className="w-3.5 h-3.5" /> Preuve à vérifier
          </span>
        )
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
            <Send className="w-3.5 h-3.5" /> Envoyée
          </span>
        )
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200/60 dark:border-red-800/40">
            <Clock className="w-3.5 h-3.5" /> En retard
          </span>
        )
      case 'DISPUTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40">
            <AlertCircle className="w-3.5 h-3.5" /> En litige
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            Annulée
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Brouillon
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Factures & Devis
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gérez vos factures conformes à la réglementation tunisienne (Matricule Fiscal, Timbre, TVA).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/invoices/chat">
            <Button
              variant="outline"
              className="gap-2 border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              Assistant AI
            </Button>
          </Link>
          <Link href="/invoices/new">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <Plus className="w-4 h-4" />
              Nouvelle Facture
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 no-scrollbar scrollbar-none"
          >
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setSelectedStatus(f.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedStatus === f.value
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder="Rechercher numéro, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/60"
            />
          </div>
        </div>
      </div>

      {/* Invoice Table / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-zinc-500">Chargement de vos factures...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
            Aucune facture trouvée
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 mb-5">
            {search || selectedStatus !== 'ALL'
              ? 'Aucun document ne correspond à vos filtres actuels.'
              : 'Commencez par créer votre première facture tunisienne avec calcul de TVA et Timbre Fiscal automatique.'}
          </p>
          <div className="flex items-center gap-2">
            <Link href="/invoices/chat">
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Générer par IA
              </Button>
            </Link>
            <Link href="/invoices/new">
              <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-3.5 h-3.5" />
                Créer manuellement
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50/80 dark:bg-zinc-800/40 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800 text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Numéro</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Émission / Échéance</th>
                  <th className="py-3.5 px-4">Montant TTC</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-zinc-900 dark:text-white">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                      >
                        {invoice.invoiceNumber}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">
                        {invoice.client?.companyName || invoice.client?.name || 'Client Particulier'}
                      </div>
                      {invoice.client?.taxId && (
                        <div className="text-[10px] text-zinc-400 font-mono">
                          MF: {invoice.client.taxId}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500">
                      <div>{new Date(invoice.issueDate).toLocaleDateString('fr-TN')}</div>
                      <div className="text-[10px] text-zinc-400">
                        Éch: {new Date(invoice.dueDate).toLocaleDateString('fr-TN')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-white">
                      {invoice.total.toFixed(3)}{' '}
                      <span className="text-[10px] font-normal text-zinc-400">
                        {invoice.currency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(invoice.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/invoices/${invoice.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        {invoice.publicToken && (
                          <a
                            href={`/i/${invoice.publicToken}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                              title="Voir page publique"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem asChild>
                              <Link href={`/invoices/${invoice.id}`} className="cursor-pointer">
                                Ouvrir les détails
                              </Link>
                            </DropdownMenuItem>
                            {invoice.status === 'DRAFT' && (
                              <DropdownMenuItem
                                onClick={() => handleSend(invoice.id)}
                                className="cursor-pointer text-blue-600"
                              >
                                Marquer comme envoyée
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(invoice.id)}
                              className="cursor-pointer"
                            >
                              Dupliquer la facture
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(invoice.id)}
                              className="cursor-pointer text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
