'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useClientsStore } from '@/store/clients-store';
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Trash2,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { ClientDTO } from '@repo/types';

export default function ClientsPage() {
  const { clients, loading, fetchClients, createClient, updateClient, deleteClient } =
    useClientsStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientDTO | null>(null);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const openCreateDialog = () => {
    setEditingClient(null);
    setName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setTaxId('');
    setAddress('');
    setCity('');
    setNotes('');
    setDialogOpen(true);
  };

  const openEditDialog = (client: ClientDTO) => {
    setEditingClient(client);
    setName(client.name);
    setCompanyName(client.companyName || '');
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setTaxId(client.taxId || '');
    setAddress(client.address || '');
    setCity(client.city || '');
    setNotes(client.notes || '');
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Le nom du client est requis');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingClient) {
        await updateClient(editingClient.id, {
          name,
          companyName: companyName || undefined,
          email: email || undefined,
          phone: phone || undefined,
          taxId: taxId || undefined,
          address: address || undefined,
          city: city || undefined,
          notes: notes || undefined,
        });
        toast.success('Client mis à jour');
      } else {
        await createClient({
          name,
          companyName: companyName || undefined,
          email: email || undefined,
          phone: phone || undefined,
          taxId: taxId || undefined,
          address: address || undefined,
          city: city || undefined,
          notes: notes || undefined,
        });
        toast.success('Nouveau client ajouté');
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, clientName: string) => {
    if (!confirm(`Supprimer le client "${clientName}" ?`)) return;
    try {
      await deleteClient(id);
      toast.success('Client supprimé');
    } catch (err: any) {
      toast.error(err.message || 'Impossible de supprimer le client (factures associées)');
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.taxId && c.taxId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Gérez votre carnet de clients, particuliers et entreprises (B2B)
          </p>
        </div>
        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90 gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Ajouter un client
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, entreprise, matricule..."
          className="pl-9 bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Clients Table */}
      <Card className="border-border/60 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="font-semibold">Client / Contact</TableHead>
              <TableHead className="font-semibold">Entreprise</TableHead>
              <TableHead className="font-semibold">Matricule Fiscal</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Adresse / Ville</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Chargement des clients...
                </TableCell>
              </TableRow>
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="w-8 h-8 text-muted-foreground/60" />
                    <p className="font-medium text-foreground">Aucun client enregistré</p>
                    <p className="text-xs text-muted-foreground">
                      Ajoutez vos premiers clients pour créer des factures rapidement
                    </p>
                    <Button size="sm" variant="outline" className="mt-2 gap-1.5" onClick={openCreateDialog}>
                      <Plus className="w-3.5 h-3.5" /> Nouveau Client
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.companyName || '—'}</TableCell>
                  <TableCell>
                    {client.taxId ? (
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                        {client.taxId}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      {client.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3 h-3" /> {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" /> {client.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {client.city ? `${client.city}${client.address ? `, ${client.address}` : ''}` : client.address || '—'}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(client)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(client.id, client.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add / Edit Client Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Modifier le client' : 'Nouveau client'}
            </DialogTitle>
            <DialogDescription>
              Renseignez les coordonnées et informations fiscales du client
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nom complet du contact *</Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex. Mohamed Trabelsi"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Raison Sociale (Entreprise)</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="ex. Alpha Services SA"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@client.tn"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Téléphone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+216 ..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Matricule Fiscal (B2B)</Label>
                <Input
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="ex. 1234567/A/M/000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Ville</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="ex. Sousse, Tunis, Sfax..."
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Adresse postale</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ex. Rue de la Liberté, Immeuble B"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Notes internes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Remarques particulières..."
                className="mt-1"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
