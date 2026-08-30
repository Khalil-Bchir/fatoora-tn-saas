import { prisma } from '@repo/database';
import { InvoicesService } from './invoices.js';
import { ClientsService } from './clients.js';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

interface ExtractedData {
  clientName?: string;
  clientTaxId?: string;
  currency: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    total?: number;
  }>;
  subtotal: number;
  vatAmount: number;
  timbreFiscal: number;
  total: number;
  notes?: string;
  dueDate?: string;
  isReady: boolean;
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
    const defaultExtracted: ExtractedData = {
      currency: 'TND',
      items: [],
      subtotal: 0,
      vatAmount: 0,
      timbreFiscal: 1.0,
      total: 0,
      isReady: false,
    };

    const messages: Message[] = [
      {
        role: 'assistant',
        content:
          'Bonjour ! Je suis votre assistant Fatoora AI. Décrivez la facture ou le devis que vous souhaitez établir (ex: "Facturer 1200 DT à SARL Carthage Dev pour refonte de site web et hébergement").',
        timestamp: new Date().toISOString(),
      },
    ];

    let title = 'Nouvelle session de facturation';
    let extracted = defaultExtracted;

    if (initialMessage && initialMessage.trim()) {
      messages.push({
        role: 'user',
        content: initialMessage,
        timestamp: new Date().toISOString(),
      });
      const parsed = this.parsePrompt(initialMessage, defaultExtracted);
      extracted = parsed.extracted;
      messages.push({
        role: 'assistant',
        content: parsed.reply,
        timestamp: new Date().toISOString(),
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

    const parsed = this.parsePrompt(userMessage, currentExtracted);
    messages.push({
      role: 'assistant',
      content: parsed.reply,
      timestamp: new Date().toISOString(),
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

    const returnedSession = {
      ...updatedSession,
      extractedData: parsed.extracted,
    };

    return {
      session: returnedSession,
      reply: parsed.reply,
      extractedData: parsed.extracted,
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
    const invoice = await invoicesService.createInvoice({
      clientId: client.id,
      currency: data.currency || 'TND',
      vatApplicable: true,
      vatRate: 19,
      timbreFiscalAmount: data.timbreFiscal ?? 1.0,
      dueDate: data.dueDate || (new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] as string),
      notes: data.notes,
      items: data.items.map((it) => ({
        description: it.description,
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        vatRate: it.vatRate || 19,
      })),
    }, this.organizationId);

    await prisma.chatSession.update({
      where: { id },
      data: {
        status: 'FINALIZED',
        invoiceId: invoice.id,
      },
    });

    return invoice;
  }

  private parsePrompt(
    prompt: string,
    existing: ExtractedData
  ): { extracted: ExtractedData; reply: string } {
    let clientName = existing.clientName;
    let amount = 0;
    let desc = '';

    // Amount extraction
    const matchAmount = prompt.match(/(\d+(?:[.,]\d+)?)\s*(?:dt|tnd|dinar|dinars)/i);
    if (matchAmount && matchAmount[1]) {
      amount = parseFloat(matchAmount[1].replace(',', '.'));
    }

    // Client extraction
    const matchClient = prompt.match(
      /(?:à|pour le client|client)\s+([A-Za-z0-9\s]+?)(?:\s+(?:pour|avec|d'un|concerne|concernant)|$)/i
    );
    if (matchClient && matchClient[1]?.trim()) {
      clientName = matchClient[1].trim();
    }

    // Prestation extraction
    const matchDesc = prompt.match(/(?:pour|concerne|prestation|concernant)\s+([A-Za-z0-9\s,.-]+)/i);
    if (matchDesc && matchDesc[1]?.trim()) {
      desc = matchDesc[1].trim();
    }

    const items = [...existing.items];
    if (desc && amount > 0) {
      items.push({
        description: desc,
        quantity: 1,
        unitPrice: amount,
        vatRate: 19,
        total: amount,
      });
    } else if (items.length === 0 && amount > 0) {
      items.push({
        description: 'Prestation de service',
        quantity: 1,
        unitPrice: amount,
        vatRate: 19,
        total: amount,
      });
    }

    const subtotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
    const vatAmount = (subtotal * 19) / 100;
    const timbreFiscal = 1.0;
    const total = subtotal + vatAmount + timbreFiscal;

    const extracted: ExtractedData = {
      clientName: clientName || existing.clientName,
      clientTaxId: existing.clientTaxId,
      currency: 'TND',
      items,
      subtotal,
      vatAmount,
      timbreFiscal,
      total,
      notes: existing.notes,
      dueDate: existing.dueDate,
      isReady: items.length > 0 && !!clientName,
    };

    let reply = '';
    if (extracted.isReady) {
      reply = `Parfait ! J'ai structuré votre facture pour **${extracted.clientName}** d'un montant Total TTC de **${extracted.total.toFixed(
        3
      )} TND** (dont TVA 19%: ${extracted.vatAmount.toFixed(
        3
      )} DT et Timbre fiscal: 1.000 DT). Vous pouvez valider l'émission dès maintenant !`;
    } else if (items.length > 0 && !clientName) {
      reply = `J'ai bien noté les prestations pour un montant de **${extracted.subtotal.toFixed(
        3
      )} DT**. À quel client ou entreprise souhaitez-vous adresser cette facture ?`;
    } else {
      reply = `J'ai bien reçu votre message. Veuillez préciser le montant en Dinars (DT) et la nature de la prestation pour compléter la facture.`;
    }

    return { extracted, reply };
  }
}
