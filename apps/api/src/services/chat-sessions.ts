import { prisma } from '@repo/database';
import { InvoicesService } from './invoices.js';
import { ClientsService } from './clients.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  quickReplies?: string[];
}

export interface ExtractedItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total?: number;
}

export interface ExtractedData {
  clientId?: string;
  clientName?: string;
  clientTaxId?: string;
  currency: string;
  items: ExtractedItem[];
  subtotal: number;
  vatAmount: number;
  timbreFiscal: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
  issueDate?: string;
  dueDate?: string;
  isReady: boolean;
  missingField?: string;
  quickReplies?: string[];
}

export class ChatSessionsService {
  private organizationId: string;
  private userId?: string;

  constructor(organizationId: string, userId?: string) {
    this.organizationId = organizationId;
    this.userId = userId;
  }

  async listSessions() {
    const sessions = await prisma.chatSession.findMany({
      where: {
        organizationId: this.organizationId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return sessions.map((s) => ({
      ...s,
      extractedData: (s.draftInvoice as unknown as ExtractedData) || null,
    }));
  }

  async getSession(id: string) {
    const session = await prisma.chatSession.findFirst({
      where: {
        id,
        organizationId: this.organizationId,
      },
    });

    if (!session) return null;

    return {
      ...session,
      extractedData: (session.draftInvoice as unknown as ExtractedData) || null,
    };
  }

  async createSession(initialMessage?: string) {
    const org = await prisma.organization.findUnique({
      where: { id: this.organizationId },
    });

    const recentClients = await prisma.client.findMany({
      where: { organizationId: this.organizationId },
      orderBy: { updatedAt: 'desc' },
      take: 4,
    });

    const defaultExtracted: ExtractedData = {
      currency: org?.currency || 'TND',
      items: [],
      subtotal: 0,
      vatAmount: 0,
      timbreFiscal: org?.vatRegistered ? 1.0 : 0,
      total: 0,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: org?.defaultPaymentTerms || 'Virement bancaire sous 30 jours dès réception.',
      isReady: false,
      quickReplies: recentClients.map((c) => c.companyName || c.name),
    };

    const initialQuickReplies = recentClients.map((c) => c.companyName || c.name);

    const messages: Message[] = [
      {
        role: 'assistant',
        content:
          'Bonjour ! Décrivez votre facture en une seule phrase (ex: *"Facture pour Carthage Tech 10h de dév à 50 DT/h, échéance 15 jours"* ou *"فاتورة لسليم 850 دينار"*). Je m\'occupe de tout extraire et calculer.',
        timestamp: new Date().toISOString(),
        quickReplies: initialQuickReplies.length > 0 ? initialQuickReplies : undefined,
      },
    ];

    let title = 'Nouvelle facture assistée';
    let extracted = defaultExtracted;

    if (initialMessage && initialMessage.trim()) {
      messages.push({
        role: 'user',
        content: initialMessage,
        timestamp: new Date().toISOString(),
      });

      const parsed = await this.extractAndRefine(initialMessage, defaultExtracted);
      extracted = parsed.extracted;
      messages.push({
        role: 'assistant',
        content: parsed.reply,
        timestamp: new Date().toISOString(),
        quickReplies: parsed.quickReplies,
      });
      title = extracted.clientName ? `Facture ${extracted.clientName}` : 'Facture par assistant';
    }

    const created = await prisma.chatSession.create({
      data: {
        organizationId: this.organizationId,
        userId: this.userId || null,
        title,
        messages: messages as any,
        draftInvoice: extracted as any,
        status: 'active',
      },
    });

    return {
      ...created,
      extractedData: extracted,
    };
  }

  async sendMessage(id: string, userMessage: string) {
    const session = await prisma.chatSession.findFirst({
      where: {
        id,
        organizationId: this.organizationId,
      },
    });

    if (!session) {
      throw new Error('Chat session not found');
    }

    const messages = (session.messages as any as Message[]) || [];
    const currentExtracted = (session.draftInvoice as any as ExtractedData) || {
      currency: 'TND',
      items: [],
      subtotal: 0,
      vatAmount: 0,
      timbreFiscal: 1.0,
      total: 0,
      isReady: false,
    };

    messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    });

    const parsed = await this.extractAndRefine(userMessage, currentExtracted);

    messages.push({
      role: 'assistant',
      content: parsed.reply,
      timestamp: new Date().toISOString(),
      quickReplies: parsed.quickReplies,
    });

    const updatedSession = await prisma.chatSession.update({
      where: { id },
      data: {
        messages: messages as any,
        draftInvoice: parsed.extracted as any,
        title: parsed.extracted.clientName
          ? `Facture ${parsed.extracted.clientName}`
          : session.title,
      },
    });

    return {
      session: {
        ...updatedSession,
        extractedData: parsed.extracted,
      },
      reply: parsed.reply,
      extractedData: parsed.extracted,
      quickReplies: parsed.quickReplies,
    };
  }

  async updateDraft(id: string, updates: Partial<ExtractedData>) {
    const session = await prisma.chatSession.findFirst({
      where: {
        id,
        organizationId: this.organizationId,
      },
    });

    if (!session) {
      throw new Error('Chat session not found');
    }

    const current = (session.draftInvoice as any as ExtractedData) || {
      currency: 'TND',
      items: [],
      subtotal: 0,
      vatAmount: 0,
      timbreFiscal: 1.0,
      total: 0,
      isReady: false,
    };

    const org = await prisma.organization.findUnique({
      where: { id: this.organizationId },
    });

    const items = (updates.items || current.items || []).map((it) => {
      const q = Number(it.quantity) || 1;
      const p = Number(it.unitPrice) || 0;
      const v = Number(it.vatRate) || 0;
      const itemSubtotal = q * p;
      const itemVat = (itemSubtotal * v) / 100;
      return {
        ...it,
        quantity: q,
        unitPrice: p,
        vatRate: v,
        total: itemSubtotal + itemVat,
      };
    });

    const subtotal = items.reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0);
    const vatAmount = items.reduce(
      (acc, curr) => acc + (curr.quantity * curr.unitPrice * curr.vatRate) / 100,
      0
    );
    const timbreFiscal = org?.vatRegistered ? updates.timbreFiscal ?? current.timbreFiscal ?? 1.0 : 0;
    const total = subtotal + vatAmount + timbreFiscal;

    const merged: ExtractedData = {
      ...current,
      ...updates,
      items,
      subtotal,
      vatAmount,
      timbreFiscal,
      total,
      isReady: items.length > 0 && !!(updates.clientName || current.clientName),
    };

    const updated = await prisma.chatSession.update({
      where: { id },
      data: {
        draftInvoice: merged as any,
        title: merged.clientName ? `Facture ${merged.clientName}` : session.title,
      },
    });

    return {
      session: {
        ...updated,
        extractedData: merged,
      },
      extractedData: merged,
    };
  }

  async finalizeSession(id: string) {
    const session = await prisma.chatSession.findFirst({
      where: {
        id,
        organizationId: this.organizationId,
      },
    });

    if (!session) {
      throw new Error('Chat session not found');
    }

    const data = session.draftInvoice as any as ExtractedData;
    if (!data || !data.items || data.items.length === 0) {
      throw new Error('La facture ne contient aucun article ou prestation.');
    }

    const clientName = data.clientName || 'Client Particulier';
    const clientsService = new ClientsService({ prisma });

    // Find or create client
    let client = await prisma.client.findFirst({
      where: {
        organizationId: this.organizationId,
        name: { equals: clientName, mode: 'insensitive' },
      },
    });

    if (!client) {
      client = await clientsService.createClient(this.organizationId, {
        name: clientName,
        companyName: clientName,
        taxId: data.clientTaxId,
      });
    }

    const invoicesService = new InvoicesService();
    const invoice = await invoicesService.createInvoice(
      {
        clientId: client.id,
        currency: data.currency || 'TND',
        vatApplicable: true,
        vatRate: 19,
        timbreFiscalAmount: data.timbreFiscal ?? 1.0,
        issueDate: data.issueDate || (new Date().toISOString().split('T')[0] as string),
        dueDate:
          data.dueDate ||
          (new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] as string),
        notes: data.notes,
        paymentTerms: data.paymentTerms,
        items: data.items.map((it) => ({
          description: it.description,
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice || 0,
          vatRate: it.vatRate ?? 19,
        })),
      },
      this.organizationId
    );

    await prisma.chatSession.update({
      where: { id },
      data: {
        status: 'FINALIZED',
        invoiceId: invoice.id,
      },
    });

    return invoice;
  }

  /**
   * Enhanced Context-Rich Extraction Pipeline:
   * 1. Injects Organization defaults (VAT rate, currency, timbre fiscal)
   * 2. Matches against existing tenant clients and past billing history
   * 3. Calls LLM if API key exists; otherwise falls back to smart Tunisian NLP regex engine
   * 4. Asks only what is strictly missing with single targeted question and tappable chips
   */
  private async extractAndRefine(
    userPrompt: string,
    existing: ExtractedData
  ): Promise<{ extracted: ExtractedData; reply: string; quickReplies?: string[] }> {
    // 1. Fetch organization context
    const org = await prisma.organization.findUnique({
      where: { id: this.organizationId },
    });

    // 2. Fetch existing clients and previous invoices
    const [clients, recentInvoices] = await Promise.all([
      prisma.client.findMany({
        where: { organizationId: this.organizationId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      prisma.invoice.findMany({
        where: { organizationId: this.organizationId },
        include: { client: true, items: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Check for LLM API Key (Groq, Gemini, OpenRouter, OpenAI)
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (groqKey || geminiKey || openaiKey) {
      try {
        const llmResult = await this.callLLMExtractor(
          userPrompt,
          existing,
          org,
          clients,
          recentInvoices,
          groqKey || geminiKey || openaiKey!
        );
        if (llmResult) return llmResult;
      } catch (err) {
        logger.warn({ err }, 'LLM extraction failed, falling back to deterministic extractor');
      }
    }

    // Fallback: Deterministic Tunisian NLP Extraction Engine
    return this.deterministicExtractor(userPrompt, existing, org, clients, recentInvoices);
  }

  private async callLLMExtractor(
    prompt: string,
    existing: ExtractedData,
    org: any,
    clients: any[],
    recentInvoices: any[],
    apiKey: string
  ): Promise<{ extracted: ExtractedData; reply: string; quickReplies?: string[] } | null> {
    const isGroq = apiKey.startsWith('gsk_');
    const isGemini = apiKey.startsWith('AIza');
    const endpoint = isGroq
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : isGemini
      ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const model = isGroq
      ? 'llama-3.3-70b-versatile'
      : isGemini
      ? 'gemini-1.5-flash'
      : 'gpt-4o-mini';

    const systemPrompt = `You are Fatoora AI, an expert invoicing assistant for Tunisian businesses and freelancers.
Your goal is to parse user input in French, Arabic (or Tunisian Darija), or English and output a structured JSON invoice draft.

Context:
- Organization: "${org?.name || 'Entreprise'}", VAT registered: ${org?.vatRegistered ?? true}, Default VAT: ${org?.defaultVatRate ?? 19}%, Timbre Fiscal: ${org?.timbreFiscalAmount ?? 1.0} DT, Currency: TND.
- Existing Clients in DB: ${JSON.stringify(clients.map((c) => ({ id: c.id, name: c.name, company: c.companyName, taxId: c.taxId })))}
- Recent Invoices History: ${JSON.stringify(recentInvoices.map((i) => ({ client: i.client?.name, total: i.total, items: i.items.map((it: any) => it.description) })))}

Instructions:
1. Extract or maintain: clientName, clientTaxId, items (description, quantity, unitPrice, vatRate), dueDate, notes.
2. If client matches an existing client name (or partial/fuzzy match), use that exact client.
3. If the prompt says "same as last time" or "reconduire facture", reuse the items and rates from recent invoices for that client.
4. Calculate subtotal, VAT amount (19% unless specified), timbre fiscal (1.000 DT if VAT applicable), and total.
5. If something is missing (e.g. client or amount), ask ONE short targeted question and suggest 2-4 quickReplies.
6. Return ONLY valid JSON in this format:
{
  "clientName": "...",
  "clientTaxId": "...",
  "items": [{"description": "...", "quantity": 1, "unitPrice": 100, "vatRate": 19}],
  "notes": "...",
  "dueDate": "YYYY-MM-DD",
  "isReady": true/false,
  "reply": "Friendly response in French or Arabic summarizing what was built or asking the single missing question",
  "quickReplies": ["Option 1", "Option 2"]
}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Current draft state: ${JSON.stringify(existing)}\n\nUser message: "${prompt}"` },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) return null;
    const responseData = (await res.json()) as any;
    const content = responseData?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const vatApplicable = org?.vatRegistered ?? true;
    const items = (parsed.items || []).map((it: any) => {
      const q = Number(it.quantity) || 1;
      const p = Number(it.unitPrice) || 0;
      const v = vatApplicable ? Number(it.vatRate) || 19 : 0;
      return {
        description: it.description || 'Prestation de service',
        quantity: q,
        unitPrice: p,
        vatRate: v,
        total: q * p + (q * p * v) / 100,
      };
    });

    const subtotal = items.reduce((acc: number, curr: any) => acc + curr.quantity * curr.unitPrice, 0);
    const vatAmount = items.reduce(
      (acc: number, curr: any) => acc + (curr.quantity * curr.unitPrice * curr.vatRate) / 100,
      0
    );
    const timbreFiscal = vatApplicable ? org?.timbreFiscalAmount ?? 1.0 : 0;
    const total = subtotal + vatAmount + timbreFiscal;

    const extracted: ExtractedData = {
      clientName: parsed.clientName || existing.clientName,
      clientTaxId: parsed.clientTaxId || existing.clientTaxId,
      currency: 'TND',
      items,
      subtotal,
      vatAmount,
      timbreFiscal,
      total,
      notes: parsed.notes || existing.notes,
      paymentTerms: org?.defaultPaymentTerms || existing.paymentTerms,
      issueDate: existing.issueDate || new Date().toISOString().split('T')[0],
      dueDate: parsed.dueDate || existing.dueDate,
      isReady: items.length > 0 && !!(parsed.clientName || existing.clientName),
      quickReplies: parsed.quickReplies,
    };

    return {
      extracted,
      reply: parsed.reply,
      quickReplies: parsed.quickReplies,
    };
  }

  private deterministicExtractor(
    prompt: string,
    existing: ExtractedData,
    org: any,
    clients: any[],
    recentInvoices: any[]
  ): { extracted: ExtractedData; reply: string; quickReplies?: string[] } {
    let clientName = existing.clientName;
    let clientTaxId = existing.clientTaxId;
    let amount = 0;
    let quantity = 1;
    let unitPrice = 0;
    let desc = '';
    let quickReplies: string[] | undefined = undefined;

    // 1. Check for Repeat Invoice Shortcut (e.g. "même que la dernière fois", "reconduire", "comme le mois dernier")
    const isRepeat = /(?:m[eê]me|reconduire|dernier|derni[eè]re|kima|kif|comme)/i.test(prompt);

    // 2. Fuzzy Client Matching against tenant clients database
    for (const c of clients) {
      const namesToCheck = [c.name, c.companyName].filter(Boolean);
      for (const n of namesToCheck) {
        if (n && new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(prompt)) {
          clientName = c.companyName || c.name;
          clientTaxId = c.taxId || undefined;
          break;
        }
      }
      if (clientName && clientName === (c.companyName || c.name)) break;
    }

    // 3. Fallback Client Regex if not already in DB
    if (!clientName) {
      const matchClient = prompt.match(
        /(?:à|pour le client|client|pour|société|sarl|ste)\s+([A-Za-z0-9\s\u0600-\u06FF]+?)(?:\s+(?:pour|avec|d'un|concerne|concernant|de|à|\d+|dt|tnd|دينار)|$)/i
      );
      if (matchClient && matchClient[1]?.trim() && matchClient[1].trim().length > 2) {
        clientName = matchClient[1].trim();
      }
    }

    // If client is matched and repeat requested, clone last invoice
    if (clientName && isRepeat) {
      const lastClientInvoice = recentInvoices.find(
        (i) =>
          i.client?.name?.toLowerCase().includes(clientName!.toLowerCase()) ||
          i.client?.companyName?.toLowerCase().includes(clientName!.toLowerCase())
      );
      if (lastClientInvoice && lastClientInvoice.items.length > 0) {
        const clonedItems: ExtractedItem[] = lastClientInvoice.items.map((it: any) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          vatRate: it.vatRate,
          total: it.total,
        }));

        const subtotal = clonedItems.reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0);
        const vatAmount = clonedItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice * curr.vatRate) / 100, 0);
        const timbreFiscal = org?.vatRegistered ? (org?.timbreFiscalAmount ?? 1.0) : 0;
        const total = subtotal + vatAmount + timbreFiscal;

        const extracted: ExtractedData = {
          clientName,
          clientTaxId: lastClientInvoice.client?.taxId || clientTaxId,
          currency: 'TND',
          items: clonedItems,
          subtotal,
          vatAmount,
          timbreFiscal,
          total,
          isReady: true,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        };

        return {
          extracted,
          reply: `J'ai reconduit la dernière facture pour **${clientName}** (${clonedItems.length} prestation(s), Total TTC: **${total.toFixed(3)} TND**). Vous pouvez valider en 1 clic !`,
          quickReplies: ['✓ Valider et générer', 'Modifier le montant', 'Changer l\'échéance'],
        };
      }
    }

    // 4. Quantity & Unit Rate parsing: "10 hours at 50 DT", "10h à 50 DT/h", "3 jours à 400 DT"
    const matchHourly = prompt.match(/(\d+(?:[.,]\d+)?)\s*(?:h|heures?|hrs?|jours?|j|days?)\s*(?:[àa@]|au tarif de)?\s*(\d+(?:[.,]\d+)?)\s*(?:dt|tnd|dinar|\/h|\/j)?/i);
    if (matchHourly && matchHourly[1] && matchHourly[2]) {
      quantity = parseFloat(matchHourly[1].replace(',', '.'));
      unitPrice = parseFloat(matchHourly[2].replace(',', '.'));
      amount = quantity * unitPrice;
    } else {
      // General Amount extraction: "1500 DT", "850 dinars", "2400.500 TND"
      const matchAmount = prompt.match(/(\d+(?:[.,]\d+)?)\s*(?:dt|tnd|dinar|dinars|\u062f\u064a\u0646\u0627\u0631)/i);
      if (matchAmount && matchAmount[1]) {
        amount = parseFloat(matchAmount[1].replace(',', '.'));
        unitPrice = amount;
        quantity = 1;
      }
    }

    // 5. Description / Prestation extraction
    const matchDesc = prompt.match(/(?:pour|concerne|prestation|concernant|de|travail de|mission)\s+([A-Za-z0-9\s,.\-'\u0600-\u06FF]+)/i);
    if (matchDesc && matchDesc[1]?.trim()) {
      desc = matchDesc[1].trim().replace(/\b(due|échéance|dans|jours|dt|tnd|dinars|\d+)\b.*/i, '').trim();
    }

    // 6. Due Date parsing ("due in 15 days", "échéance 15 jours", "dans 15j")
    let dueDate = existing.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const matchDueDays = prompt.match(/(?:due in|[ée]ch[ée]ance|dans)\s*(\d+)\s*(?:jours?|days?|j)/i);
    if (matchDueDays && matchDueDays[1]) {
      const days = parseInt(matchDueDays[1], 10);
      const d = new Date();
      d.setDate(d.getDate() + days);
      dueDate = d.toISOString().split('T')[0] as string;
    }

    const items = [...existing.items];
    const defaultVat = org?.vatRegistered ? (org?.defaultVatRate ?? 19) : 0;

    if (amount > 0) {
      items.push({
        description: desc || 'Prestation de services & conseil IT',
        quantity,
        unitPrice,
        vatRate: defaultVat,
        total: amount + (amount * defaultVat) / 100,
      });
    }

    const subtotal = items.reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0);
    const vatAmount = items.reduce(
      (acc, curr) => acc + (curr.quantity * curr.unitPrice * curr.vatRate) / 100,
      0
    );
    const timbreFiscal = org?.vatRegistered ? (org?.timbreFiscalAmount ?? 1.0) : 0;
    const total = subtotal + vatAmount + timbreFiscal;

    const isReady = items.length > 0 && !!clientName;

    const extracted: ExtractedData = {
      clientName: clientName || existing.clientName,
      clientTaxId: clientTaxId || existing.clientTaxId,
      currency: 'TND',
      items,
      subtotal,
      vatAmount,
      timbreFiscal,
      total,
      notes: existing.notes,
      dueDate,
      issueDate: existing.issueDate || new Date().toISOString().split('T')[0],
      paymentTerms: org?.defaultPaymentTerms || 'Virement bancaire sous 30 jours dès réception.',
      isReady,
    };

    let reply = '';
    if (isReady) {
      reply = `J'ai préparé votre facture pour **${extracted.clientName}** :\n- **Total HT** : ${extracted.subtotal.toFixed(3)} DT\n- **TVA (${defaultVat}%)** : ${extracted.vatAmount.toFixed(3)} DT\n- **Timbre Fiscal** : ${extracted.timbreFiscal.toFixed(3)} DT\n- **TOTAL TTC** : **${extracted.total.toFixed(3)} TND**\n\nVous pouvez valider en 1 clic ou ajuster les champs sur le panneau de droite.`;
      quickReplies = ['✓ Tout est bon, émettre', 'Modifier le montant', 'Ajouter une note'];
    } else if (items.length > 0 && !clientName) {
      reply = `J'ai extrait le montant de **${extracted.subtotal.toFixed(3)} DT** (${items[0]?.description}).\n\nPour quel client souhaitez-vous émettre cette facture ?`;
      quickReplies = clients.slice(0, 3).map((c) => c.companyName || c.name);
      quickReplies.push('+ Nouveau Client');
    } else if (clientName && items.length === 0) {
      reply = `Client sélectionné : **${clientName}**.\n\nQuel est le montant ou tarif unitaire de la prestation ?`;
      quickReplies = ['500 DT', '1 200 DT', '2 500 DT', '50 DT/h (10h)'];
    } else {
      reply = `Précisez simplement votre demande en une phrase (ex: *"Facture pour Acme 1200 DT"*).`;
      quickReplies = clients.slice(0, 3).map((c) => `Facture pour ${c.companyName || c.name}`);
    }

    return { extracted, reply, quickReplies };
  }
}
