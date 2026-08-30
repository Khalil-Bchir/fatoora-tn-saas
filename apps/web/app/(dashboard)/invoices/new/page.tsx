'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInvoicesStore } from '@/store/invoices-store';
import { useClientsStore } from '@/store/clients-store';
import { useOrganizationStore } from '@/store/organization-store';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calculator,
  Building2,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { createInvoice } = useInvoicesStore();
  const { clients, fetchClients, createClient } = useClientsStore();
  const { organization, fetchOrganization } = useOrganizationStore();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [currency, setCurrency] = useState<string>('TND');
  const [vatApplicable, setVatApplicable] = useState<boolean>(false);
  const [defaultVatRate, setDefaultVatRate] = useState<number>(19.0);
  const [timbreFiscalAmount, setTimbreFiscalAmount] = useState<number>(1.0);
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [paymentTerms, setPaymentTerms] = useState<string>('Virement bancaire sous 30 jours');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Client Add state
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientTaxId, setNewClientTaxId] = useState('');

  const [items, setItems] = useState<InvoiceLineItem[]>([
    { description: 'Prestation de service / Développement logiciel', quantity: 1, unitPrice: 500, vatRate: 19 },
  ]);

  useEffect(() => {
    fetchClients();
    fetchOrganization();
  }, [fetchClients, fetchOrganization]);

  useEffect(() => {
    if (organization) {
      setCurrency(organization.currency || 'TND');
      setVatApplicable(organization.vatRegistered);
      setDefaultVatRate(organization.defaultVatRate || 19.0);
      if (organization.defaultPaymentTerms) {
        setPaymentTerms(organization.defaultPaymentTerms);
      }
    }
  }, [organization]);

  const addItem = () => {
    setItems([
      ...items,
      { description: '', quantity: 1, unitPrice: 0, vatRate: defaultVatRate },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Calculations
  const subtotal = items.reduce(
    (acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.unitPrice) || 0),
    0
  );

  const vatTotal = vatApplicable
    ? items.reduce((acc, curr) => {
        const itemSubtotal = (Number(curr.quantity) || 0) * (Number(curr.unitPrice) || 0);
        const rate = Number(curr.vatRate) || defaultVatRate;
        return acc + (itemSubtotal * rate) / 100;
      }, 0)
    : 0;

  const timbre = vatApplicable ? timbreFiscalAmount : 0;
  const total = subtotal + vatTotal + timbre;

  const handleQuickAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) {
      toast.error('Le nom du client est obligatoire');
      return;
    }
    try {
      const created = await createClient({
        name: newClientName,
        companyName: newClientCompany || undefined,
        email: newClientEmail || undefined,
        taxId: newClientTaxId || undefined,
      });
      setSelectedClientId(created.id);
      setShowQuickAddClient(false);
      setNewClientName('');
      setNewClientCompany('');
      setNewClientEmail('');
      setNewClientTaxId('');
      toast.success('Client ajouté avec succès');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création du client');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }
    if (items.some((it) => !it.description.trim())) {
      toast.error('Chaque ligne de prestation doit avoir une description');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createInvoice({
        clientId: selectedClientId,
        currency,
        vatApplicable,
        vatRate: defaultVatRate,
        timbreFiscalAmount: vatApplicable ? timbreFiscalAmount : 0,
        issueDate,
        dueDate,
        paymentTerms,
        notes,
        items: items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          vatRate: vatApplicable ? Number(it.vatRate) : 0,
        })),
      });

      toast.success(`Facture ${created.invoiceNumber} créée avec succès !`);
      router.push(`/invoices/${created.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création de la facture');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
      {/* Back button & title */}
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvelle Facture</h1>
          <p className="text-sm text-muted-foreground">
            Émission d'une facture séquentielle pour {organization?.name || 'votre entreprise'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Destinataire (Client)</CardTitle>
                  <CardDescription className="text-xs">
                    Sélectionnez le client facturé
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1"
                  onClick={() => setShowQuickAddClient(!showQuickAddClient)}
                >
                  <Plus className="w-3.5 h-3.5" /> Nouveau Client
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showQuickAddClient ? (
                <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Ajout Rapide de Client
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Nom / Contact *</Label>
                      <Input
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="ex. Ahmed Ben Salah"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Raison Sociale (Entreprise)</Label>
                      <Input
                        value={newClientCompany}
                        onChange={(e) => setNewClientCompany(e.target.value)}
                        placeholder="ex. Société Tech SARL"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        placeholder="client@domaine.tn"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Matricule Fiscal (B2B)</Label>
                      <Input
                        value={newClientTaxId}
                        onChange={(e) => setNewClientTaxId(e.target.value)}
                        placeholder="ex. 1234567/B/M/000"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setShowQuickAddClient(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleQuickAddClient}
                    >
                      Enregistrer et Sélectionner
                    </Button>
                  </div>
                </div>
              ) : (
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir un client enregistré..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.companyName ? `(${c.companyName})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Dates & Currency */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Paramètres de la Facture</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Date d'émission</Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Date d'échéance</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Devise</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TND">TND (Dinar Tunisien)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="USD">USD (Dollar US)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Prestations & Articles</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1"
                  onClick={addItem}
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-card/60 space-y-2 relative group"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Description de la prestation / produit</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="ex. Développement application web & API"
                        className="mt-1"
                      />
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 mt-5"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Quantité</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="any"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Prix Unitaire ({currency})</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        className="mt-1"
                      />
                    </div>
                    {vatApplicable ? (
                      <div>
                        <Label className="text-xs">TVA Applicable</Label>
                        <Select
                          value={String(item.vatRate)}
                          onValueChange={(val) =>
                            updateItem(index, 'vatRate', parseFloat(val))
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0% (Exonéré)</SelectItem>
                            <SelectItem value="7">7% (Taux réduit)</SelectItem>
                            <SelectItem value="13">13% (Prestations IT)</SelectItem>
                            <SelectItem value="19">19% (Taux normal)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs">Total Ligne</Label>
                        <div className="mt-2.5 font-semibold text-sm">
                          {(item.quantity * item.unitPrice).toFixed(3)} {currency}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment Terms and Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Conditions & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Conditions et modalités de règlement</Label>
                <Input
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="ex. Virement bancaire sur compte BIAT RIB: ..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Notes supplémentaires affichées sur la facture</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ex. Facture exonérée de TVA selon l'article ... ou Remerciements"
                  className="mt-1 min-h-[70px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary & Settings (Right col) */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5 sticky top-20">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Récapitulatif Financier
              </CardTitle>
              <CardDescription className="text-xs">
                Calcul automatique selon le régime fiscal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* VAT toggle */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div>
                  <Label className="text-xs font-semibold">Appliquer la TVA</Label>
                  <p className="text-[11px] text-muted-foreground">
                    {vatApplicable
                      ? 'Régime réel / forfaitaire avec TVA'
                      : 'Exonération (Auto-entrepreneur)'}
                  </p>
                </div>
                <Switch checked={vatApplicable} onCheckedChange={setVatApplicable} />
              </div>

              {vatApplicable && (
                <div className="p-3 border rounded-lg bg-card space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Droit de Timbre Fiscal</span>
                    <Input
                      type="number"
                      step="0.1"
                      className="w-20 h-7 text-right text-xs"
                      value={timbreFiscalAmount}
                      onChange={(e) =>
                        setTimbreFiscalAmount(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
              )}

              {/* Summary Numbers */}
              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Hors Taxe (HT) :</span>
                  <span className="font-mono">{subtotal.toFixed(3)} {currency}</span>
                </div>

                {vatApplicable && (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total TVA :</span>
                      <span className="font-mono">{vatTotal.toFixed(3)} {currency}</span>
                    </div>
                    {timbre > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Timbre Fiscal :</span>
                        <span className="font-mono">{timbre.toFixed(3)} {currency}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="border-t pt-2 flex justify-between items-center text-base font-bold text-foreground">
                  <span>{vatApplicable ? 'Total TTC à Payer :' : 'Net à Payer :'}</span>
                  <span className="font-mono text-primary text-lg">
                    {total.toFixed(3)} {currency}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Création en cours...' : 'Émettre la Facture'}
              </Button>
              <Link href="/invoices" className="w-full">
                <Button type="button" variant="ghost" className="w-full text-xs">
                  Annuler
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
