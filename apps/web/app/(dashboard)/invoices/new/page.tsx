'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  Calendar,
  Sparkles,
  Calculator,
  Save,
  Check,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { clientService, type Client } from '@/features/clients/services/client-service'
import { invoiceService } from '@/features/invoices/services/invoice-service'
import { organizationService, type Organization } from '@/features/organization/services/organization-service'

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New Client Quick-Add State
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientTaxId, setNewClientTaxId] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')

  // Invoice Form State
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })
  const [currency, setCurrency] = useState('TND')
  const [vatApplicable, setVatApplicable] = useState(true)
  const [timbreFiscal, setTimbreFiscal] = useState(1.0)
  const [notes, setNotes] = useState('')
  const [paymentTerms, setPaymentTerms] = useState(
    'Règlement par virement bancaire sous 30 jours dès réception de la facture.'
  )

  const [items, setItems] = useState<LineItem[]>([
    {
      id: '1',
      description: 'Prestation de développement & intégration web',
      quantity: 1,
      unitPrice: 1200,
      vatRate: 19,
    },
  ])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [clientsData, orgData] = await Promise.all([
          clientService.listClients(),
          organizationService.getOrganization().catch(() => null),
        ])
        setClients(clientsData)
        if (clientsData.length > 0) {
          setSelectedClientId(clientsData[0].id)
        }
        if (orgData) {
          setOrganization(orgData)
          setVatApplicable(orgData.vatRegistered)
          setTimbreFiscal(orgData.timbreFiscalAmount ?? 1.0)
          if (orgData.defaultPaymentTerms) {
            setPaymentTerms(orgData.defaultPaymentTerms)
          }
        }
      } catch (err) {
        console.error('Failed to load initial data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        description: '',
        quantity: 1,
        unitPrice: 0,
        vatRate: vatApplicable ? 19 : 0,
      },
    ])
  }

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    )
  }

  const removeItem = (id: string) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const handleQuickAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClientName.trim()) return
    try {
      const created = await clientService.createClient({
        name: newClientName,
        companyName: newClientName,
        taxId: newClientTaxId || undefined,
        email: newClientEmail || undefined,
      })
      setClients((prev) => [created, ...prev])
      setSelectedClientId(created.id)
      setShowNewClient(false)
      setNewClientName('')
      setNewClientTaxId('')
      setNewClientEmail('')
    } catch (err) {
      console.error('Failed to create client', err)
    }
  }

  // Live Financial Calculation
  const subtotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  )
  const vatAmount = vatApplicable
    ? items.reduce(
        (acc, it) =>
          acc +
          ((Number(it.quantity) || 0) *
            (Number(it.unitPrice) || 0) *
            (Number(it.vatRate) || 0)) /
            100,
        0
      )
    : 0
  const timbreAmount = vatApplicable ? timbreFiscal : 0
  const total = subtotal + vatAmount + timbreAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId) {
      setError('Veuillez sélectionner un client')
      return
    }
    if (items.some((it) => !it.description.trim() || it.unitPrice <= 0)) {
      setError('Veuillez renseigner la description et le prix de chaque ligne')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const created = await invoiceService.createInvoice({
        clientId: selectedClientId,
        currency,
        vatApplicable,
        vatRate: 19,
        timbreFiscalAmount: timbreAmount,
        issueDate: issueDate || undefined,
        dueDate: dueDate || (new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] as string),
        notes: notes || undefined,
        paymentTerms: paymentTerms || undefined,
        items: items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          vatRate: vatApplicable ? Number(it.vatRate) || 0 : 0,
        })),
      })
      router.push(`/invoices/${created.id}`)
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la création de la facture')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/invoices">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">
              Émettre une Facture
            </h1>
            <p className="text-xs text-zinc-500">
              Conforme au code de la TVA et aux droits de timbre tunisiens.
            </p>
          </div>
        </div>

        <Link href="/invoices/chat">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Remplir avec l'IA
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-xs border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client & Date Info */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Destinataire & Dates
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowNewClient(!showNewClient)}
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 h-7"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              {showNewClient ? 'Annuler' : 'Nouveau Client'}
            </Button>
          </div>

          {showNewClient ? (
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Ajout Rapide de Client
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-[11px]">Raison Sociale / Nom *</Label>
                  <Input
                    placeholder="ex: SARL MedTech Solutions"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="h-8 text-xs mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Matricule Fiscal (MF)</Label>
                  <Input
                    placeholder="1234567/A/M/000"
                    value={newClientTaxId}
                    onChange={(e) => setNewClientTaxId(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Email</Label>
                  <Input
                    type="email"
                    placeholder="contact@client.tn"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewClient(false)}
                  className="h-7 text-xs"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleQuickAddClient}
                  className="h-7 text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Enregistrer le Client
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Client *</Label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-zinc-900 dark:text-white mt-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  <option value="">Sélectionner un client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName || c.name} {c.taxId ? `(MF: ${c.taxId})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">Date d'émission</Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="h-9 text-xs mt-1.5"
                  required
                />
              </div>

              <div>
                <Label className="text-xs">Date d'échéance</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9 text-xs mt-1.5"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Prestations & Articles
            </h3>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vatApplicable}
                  onChange={(e) => setVatApplicable(e.target.checked)}
                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                Assujetti à la TVA (19%)
              </label>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2.5 items-end p-2.5 rounded-lg bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800"
              >
                <div className="col-span-12 md:col-span-5">
                  <Label className="text-[10px] text-zinc-400">Description</Label>
                  <Input
                    placeholder="Description du service ou produit..."
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="h-8 text-xs mt-0.5 bg-white dark:bg-zinc-900"
                    required
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Label className="text-[10px] text-zinc-400">Quantité</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    className="h-8 text-xs mt-0.5 bg-white dark:bg-zinc-900 text-center"
                    required
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Label className="text-[10px] text-zinc-400">Prix Unit. HT (DT)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                    className="h-8 text-xs mt-0.5 bg-white dark:bg-zinc-900 text-right"
                    required
                  />
                </div>
                {vatApplicable && (
                  <div className="col-span-3 md:col-span-2">
                    <Label className="text-[10px] text-zinc-400">Taux TVA</Label>
                    <select
                      value={item.vatRate}
                      onChange={(e) => updateItem(item.id, 'vatRate', Number(e.target.value))}
                      className="w-full h-8 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-xs text-zinc-900 dark:text-white mt-0.5"
                    >
                      <option value="19">19% (Services & Ventes)</option>
                      <option value="13">13% (Prestations spéc.)</option>
                      <option value="7">7% (Équipements & IT)</option>
                      <option value="0">0% (Exonéré)</option>
                    </select>
                  </div>
                )}
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 1}
                    className="h-8 w-8 text-zinc-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="gap-1.5 text-xs text-zinc-700 dark:text-zinc-300"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter une ligne
          </Button>
        </div>

        {/* Bottom Section: Notes & Live Financial Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notes & Terms */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Modalités & Notes
            </h3>
            <div>
              <Label className="text-xs">Conditions de règlement</Label>
              <textarea
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-white mt-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <Label className="text-xs">Notes ou mentions légales</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ex: Facture établie en Dinars Tunisiens (TND)."
                rows={2}
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-white mt-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="bg-zinc-900 text-white rounded-xl p-6 shadow-md flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Récapitulatif Fiscal
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  Tunisie (TND)
                </span>
              </div>

              <div className="space-y-2.5 mt-4 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Total Brut Hors Taxe (HT) :</span>
                  <span className="font-mono font-medium">{subtotal.toFixed(3)} DT</span>
                </div>
                {vatApplicable && (
                  <div className="flex justify-between text-zinc-300">
                    <span>Total TVA (Taux mixte) :</span>
                    <span className="font-mono font-medium">{vatAmount.toFixed(3)} DT</span>
                  </div>
                )}
                {vatApplicable && timbreAmount > 0 && (
                  <div className="flex justify-between text-zinc-300">
                    <span>Droit de Timbre Fiscal :</span>
                    <span className="font-mono font-medium">{timbreAmount.toFixed(3)} DT</span>
                  </div>
                )}
                {!vatApplicable && (
                  <div className="text-[11px] text-zinc-400 italic">
                    Exonéré de TVA selon le régime fiscal de l'émetteur.
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-zinc-200">TOTAL NET TTC :</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {total.toFixed(3)} <span className="text-xs text-zinc-400 font-normal">TND</span>
                </span>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold gap-2 shadow-sm h-10"
              >
                {saving ? (
                  'Création en cours...'
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer la Facture (Brouillon)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
