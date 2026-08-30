'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clientService, type Client } from '@/features/clients/services/client-service'

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await clientService.getClient(id)
        setClient(data)
      } catch (err) {
        console.error('Failed to load client details', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-zinc-500">Chargement du client...</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Client introuvable</h2>
        <Link href="/clients" className="text-xs text-emerald-600 underline mt-2 block">
          Retour aux clients
        </Link>
      </div>
    )
  }

  const invoices = client.invoices || []
  const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0)
  const paidInvoices = invoices.filter((inv) => inv.status === 'PAID')
  const totalPaid = paidInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0)

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/clients">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-emerald-600" />
              {client.companyName || client.name}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Client depuis le {new Date(client.createdAt).toLocaleDateString('fr-TN')}
            </p>
          </div>
        </div>

        <Link href={`/invoices/new`}>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 shadow-sm">
            <Plus className="w-3.5 h-3.5" />
            Nouvelle Facture
          </Button>
        </Link>
      </div>

      {/* Client Info & Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Contact Info Card */}
        <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Fiche Client & Matricule Fiscal
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 block text-[11px]">Matricule Fiscal (MF)</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-white">
                {client.taxId || 'Non renseigné'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">Contact Principal</span>
              <span className="font-medium text-zinc-900 dark:text-white">{client.name}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">Email</span>
              <span className="text-zinc-700 dark:text-zinc-300">{client.email || '—'}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">Téléphone</span>
              <span className="text-zinc-700 dark:text-zinc-300">{client.phone || '—'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-zinc-400 block text-[11px]">Adresse</span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {[client.address, client.city, client.country].filter(Boolean).join(', ') || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Financial Summary */}
        <div className="bg-zinc-900 text-white rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Historique Client
            </span>
            <div className="mt-4 space-y-3">
              <div>
                <div className="text-[11px] text-zinc-400">Total Facturé :</div>
                <div className="text-xl font-bold font-mono text-white">
                  {totalInvoiced.toFixed(3)} <span className="text-xs text-zinc-400 font-normal">TND</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-400">Total Encaissé :</div>
                <div className="text-base font-bold font-mono text-emerald-400">
                  {totalPaid.toFixed(3)} <span className="text-xs text-zinc-400 font-normal">TND</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-zinc-400 border-t border-zinc-800 pt-3">
            {invoices.length} facture{invoices.length > 1 ? 's' : ''} émise{invoices.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Associated Invoices */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          Factures associées ({invoices.length})
        </h3>

        {invoices.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
            Aucune facture n'a encore été émise pour ce client.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800 text-[10px]">
                <tr>
                  <th className="py-3 px-3">Numéro</th>
                  <th className="py-3 px-3">Date d'émission</th>
                  <th className="py-3 px-3">Échéance</th>
                  <th className="py-3 px-3">Montant TTC</th>
                  <th className="py-3 px-3">Statut</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="py-3 px-3 font-mono font-medium text-zinc-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3">{new Date(inv.issueDate).toLocaleDateString('fr-TN')}</td>
                    <td className="py-3 px-3">{new Date(inv.dueDate).toLocaleDateString('fr-TN')}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-zinc-900 dark:text-white">
                      {inv.total.toFixed(3)} {inv.currency}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link href={`/invoices/${inv.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600 hover:text-emerald-700">
                          Consulter <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
