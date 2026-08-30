'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, CheckCircle2, RefreshCw, Wand2, Calculator, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInvoicesStore } from '@/store/invoices-store';
import { useClientsStore } from '@/store/clients-store';
import { toast } from 'sonner';

interface ParsedItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export function FatooraAiBuilder() {
  const router = useRouter();
  const { createInvoice } = useInvoicesStore();
  const { clients, createClient } = useClientsStore();

  const [prompt, setPrompt] = useState(
    'Facturer 1800 DT à Société Carthage Tech SARL pour Développement de module e-commerce et intégration paiement en ligne'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<{
    clientName: string;
    companyName: string;
    items: ParsedItem[];
    vatApplicable: boolean;
    timbreFiscal: number;
    subtotal: number;
    vatAmount: number;
    total: number;
  } | null>(null);

  const handleParsePrompt = () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);

    setTimeout(() => {
      // Intelligent rule-based parsing simulating AI extraction
      let clientName = 'Carthage Tech SARL';
      let amount = 1800;
      let desc = 'Développement de module e-commerce et intégration paiement en ligne';

      const matchAmount = prompt.match(/(\d+(?:[.,]\d+)?)\s*(?:dt|tnd|dinar|dinars)/i);
      if (matchAmount) {
        amount = parseFloat(matchAmount[1].replace(',', '.'));
      }

      const matchClient = prompt.match(/(?:à|pour le client|client)\s+([A-Za-z0-9\s]+?)(?:\s+(?:pour|avec|d'un|concerne)|$)/i);
      if (matchClient && matchClient[1].trim()) {
        clientName = matchClient[1].trim();
      }

      const matchDesc = prompt.match(/(?:pour|concerne|prestation)\s+([A-Za-z0-9\s,.-]+)/i);
      if (matchDesc && matchDesc[1].trim()) {
        desc = matchDesc[1].trim();
      }

      const items: ParsedItem[] = [
        {
          description: desc,
          quantity: 1,
          unitPrice: amount,
          vatRate: 19,
        },
      ];

      const subtotal = amount;
      const vatAmount = (subtotal * 19) / 100;
      const timbreFiscal = 1.0;
      const total = subtotal + vatAmount + timbreFiscal;

      setParsedData({
        clientName,
        companyName: clientName,
        items,
        vatApplicable: true,
        timbreFiscal,
        subtotal,
        vatAmount,
        total,
      });

      setIsProcessing(false);
      toast.success('Facture structurée générée avec succès par l’IA !');
    }, 600);
  };

  const handleCreateDraft = async () => {
    if (!parsedData) return;
    try {
      // Find or create client
      let targetClient = clients.find(
        (c) =>
          c.name.toLowerCase() === parsedData.clientName.toLowerCase() ||
          (c.companyName && c.companyName.toLowerCase() === parsedData.companyName.toLowerCase())
      );

      if (!targetClient) {
        targetClient = await createClient({
          name: parsedData.clientName,
          companyName: parsedData.companyName,
          city: 'Tunis',
        });
      }

      const created = await createInvoice({
        clientId: targetClient.id,
        currency: 'TND',
        vatApplicable: parsedData.vatApplicable,
        vatRate: 19,
        timbreFiscalAmount: parsedData.timbreFiscal,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentTerms: 'Règlement par virement bancaire sous 30 jours',
        items: parsedData.items,
      });

      toast.success(`Facture ${created.invoiceNumber} créée avec succès !`);
      router.push(`/invoices/${created.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création de la facture');
    }
  };

  return (
    <Card className="border-primary/20 bg-linear-to-b from-primary/5 via-card to-card shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Fatoora AI Builder
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  Assistant Intelligent
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Saisissez votre demande en langage naturel (français ou dialecte tunisien)
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Exemple: Facturer 1200 DT à SARL Tunis Consulting pour audit de sécurité réseau..."
            className="min-h-[75px] text-sm bg-background border-border/80"
          />
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                setPrompt(
                  'Facturer 750 DT à Ahmed Mansour pour création de logo & charte graphique'
                )
              }
              className="text-muted-foreground hover:text-primary transition-colors text-[11px] underline"
            >
              Exemple 1: Design / Freelance
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              type="button"
              onClick={() =>
                setPrompt(
                  'Facturer 3500 DT à Société Alpha SARL pour développement application web et hébergement annuel'
                )
              }
              className="text-muted-foreground hover:text-primary transition-colors text-[11px] underline"
            >
              Exemple 2: Prestation IT & B2B
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleParsePrompt}
            disabled={isProcessing || !prompt.trim()}
            className="gap-2 bg-primary hover:bg-primary/90 text-xs h-8"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyse IA en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Structurer la facture
              </>
            )}
          </Button>
        </div>

        {/* Live Parsed Preview */}
        {parsedData && (
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Analyse terminée
              </span>
              <span className="font-mono">Client : {parsedData.clientName}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              {parsedData.items.map((item, i) => (
                <div key={i} className="flex justify-between p-2 rounded bg-background/80 border text-muted-foreground">
                  <span className="font-medium text-foreground">{item.description}</span>
                  <span className="font-mono font-semibold text-foreground">
                    {item.unitPrice.toFixed(3)} TND (TVA {item.vatRate}%)
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-emerald-500/20 pt-2 flex justify-between items-center text-xs">
              <div className="text-muted-foreground space-x-2">
                <span>HT: <strong className="font-mono text-foreground">{parsedData.subtotal.toFixed(3)} DT</strong></span>
                <span>TVA (19%): <strong className="font-mono text-foreground">{parsedData.vatAmount.toFixed(3)} DT</strong></span>
                <span>Timbre: <strong className="font-mono text-foreground">1.000 DT</strong></span>
              </div>
              <div className="text-sm font-bold text-primary font-mono">
                Total TTC : {parsedData.total.toFixed(3)} TND
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button size="sm" onClick={handleCreateDraft} className="gap-1.5 text-xs">
                <Receipt className="w-3.5 h-3.5" /> Émettre cette facture
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
