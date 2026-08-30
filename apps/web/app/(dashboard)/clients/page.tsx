'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  MoreVertical,
  Trash2,
  Edit2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { clientService, type Client, type CreateClientPayload } from '@/features/clients/services/client-service'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [saving, setSaving] = useState(false)

  // Form State
  const [formData, setFormData] = useState<CreateClientPayload>({
    name: '',
    companyName: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    city: 'Tunis',
    country: 'Tunisie',
  })

  const loadClients = async () => {
    try {
      setLoading(true)
      const data = await clientService.listClients(search || undefined)
      setClients(data)
    } catch (err) {
      console.error('Failed to load clients', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [search])

  const openCreateModal = () => {
    setEditingClient(null)
    setFormData({
      name: '',
      companyName: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
      city: 'Tunis',
      country: 'Tunisie',
    })
    setShowModal(true)
  }

  const openEditModal = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      companyName: client.companyName || '',
      taxId: client.taxId || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || 'Tunis',
      country: client.country || 'Tunisie',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    try {
      setSaving(true)
      if (editingClient) {
        await clientService.updateClient(editingClient.id, formData)
      } else {
        await clientService.createClient(formData)
      }
      setShowModal(false)
      await loadClients()
    } catch (err) {
      console.error('Failed to save client', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return
    try {
      await clientService.deleteClient(id)
      await loadClients()
    } catch (err) {
      console.error('Failed to delete client', err)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Clients & Entreprises
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gérez votre carnet de clients avec leur Matricule Fiscal et historique des factures émises.
          </p>
        </div>

        <Button onClick={openCreateModal} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Plus className="w-4 h-4" />
          Ajouter un Client
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Rechercher par nom, MF, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/60"
          />
        </div>
        <div className="text-xs text-zinc-500 font-medium">
          {clients.length} client{clients.length > 1 ? 's' : ''} enregistré{clients.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Client List Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-zinc-500">Chargement des clients...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
            Aucun client enregistré
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 mb-5">
            Ajoutez vos clients professionnels avec leur Matricule Fiscal pour émettre des factures légales instantanément.
          </p>
          <Button onClick={openCreateModal} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-3.5 h-3.5" />
            Ajouter un Client
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50/80 dark:bg-zinc-800/40 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800 text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Client / Raison Sociale</th>
                  <th className="py-3.5 px-4">Matricule Fiscal</th>
                  <th className="py-3.5 px-4">Coordonnées</th>
                  <th className="py-3.5 px-4">Localisation</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-semibold text-zinc-900 dark:text-white hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                      >
                        <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                        {client.companyName || client.name}
                      </Link>
                      {client.companyName && client.name !== client.companyName && (
                        <div className="text-[10px] text-zinc-400 pl-5">Contact : {client.name}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-zinc-800 dark:text-zinc-200">
                      {client.taxId ? (
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px]">
                          {client.taxId}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">Non renseigné</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5 text-zinc-500">
                      {client.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-zinc-400" /> {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-400" /> {client.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500">
                      {client.city || client.address ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          {[client.address, client.city].filter(Boolean).join(', ')}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/clients/${client.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-white" title="Voir historique">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(client)}
                          className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(client.id)}
                          className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              {editingClient ? 'Modifier le Client' : 'Nouveau Client'}
            </DialogTitle>
            <DialogDescription>
              Renseignez les coordonnées et informations fiscales du client.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Raison Sociale / Société</Label>
                <Input
                  placeholder="ex: SARL Carthage Tech"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Nom du contact *</Label>
                <Input
                  placeholder="ex: Moncef Ben Salem"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-8 text-xs mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Matricule Fiscal (MF)</Label>
                <Input
                  placeholder="1234567/A/M/000"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  placeholder="contact@client.tn"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Téléphone</Label>
                <Input
                  placeholder="+216 71 000 000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Ville</Label>
                <Input
                  placeholder="Tunis, Sousse, Sfax..."
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Adresse complète</Label>
              <Input
                placeholder="Rue, Immeuble, Zone Industrielle..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving ? 'Enregistrement...' : editingClient ? 'Mettre à jour' : 'Créer le Client'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
