'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles,
  Send,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Bot,
  User,
  Plus,
  ArrowRight,
  RotateCcw,
  Trash2,
  Edit3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  chatService,
  type ChatSession,
  type ChatMessage,
  type ExtractedData,
  type ExtractedItem,
} from '@/features/chat/services/chat-service'
import { clientService, type Client } from '@/features/clients/services/client-service'
import {
  organizationService,
  type Organization,
} from '@/features/organization/services/organization-service'

const STARTER_SHORTCUTS = [
  'Facture pour Acme, 10 heures de dév à 50 TND/h, due dans 15 jours',
  'Facturer 1 450 DT à SARL Carthage Tech pour refonte site web',
  'فاتورة لشركة الزيتونة 850 دينار صيانة برمجيات',
]

function formatChatMessageContent(content: string) {
  const lines = content.split('\n')
  return lines.map((line, lIdx) => {
    const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ')
    const cleanLine = isBullet ? line.trim().substring(2) : line

    const parts = cleanLine.split(/(\*\*.*?\*\*)/g)
    const formattedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-semibold text-zinc-950 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })

    if (isBullet) {
      return (
        <div key={lIdx} className="flex items-start gap-1.5 py-0.5 pl-1">
          <span className="text-emerald-500 font-bold">•</span>
          <span>{formattedParts}</span>
        </div>
      )
    }

    return (
      <div key={lIdx} className={line.trim() === '' ? 'h-1.5' : 'py-0.5'}>
        {formattedParts}
      </div>
    )
  })
}

export default function InvoiceChatPage() {
  const router = useRouter()
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)
  const [org, setOrg] = useState<Organization | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [recentClients, setRecentClients] = useState<Client[]>([])
  const [directEditing, setDirectEditing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const initSession = async () => {
    try {
      setLoading(true)
      const [created, clientsList, orgData] = await Promise.all([
        chatService.createSession(),
        clientService.listClients().catch(() => []),
        organizationService.getOrganization().catch(() => null),
      ])
      setSession(created)
      setMessages(created.messages)
      setExtracted(created.extractedData || null)
      setRecentClients(clientsList)
      if (orgData) setOrg(orgData)
    } catch (err) {
      console.error('Failed to create chat session', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initSession()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputValue
    if (!message.trim() || !session || loading) return

    setInputValue('')
    setLoading(true)

    const userMsg: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await chatService.sendMessage(session.id, message)
      setSession(res.session)
      setMessages(res.session.messages)
      setExtracted(res.extractedData)
    } catch (err) {
      console.error('Failed to send message', err)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickReply = (qr: string) => {
    if (qr.startsWith('✓') || qr.includes('émettre') || qr.includes('générer')) {
      handleFinalize()
    } else if (qr === 'Modifier le montant') {
      setDirectEditing(true)
    } else {
      handleSendMessage(qr)
    }
  }

  const handleUpdateDraft = async (updates: Partial<ExtractedData>) => {
    if (!session || !extracted) return
    try {
      const updatedLocal = { ...extracted, ...updates }
      setExtracted(updatedLocal)
      const res = await chatService.updateDraft(session.id, updates)
      setSession(res.session)
      setExtracted(res.extractedData)
    } catch (err) {
      console.error('Failed to update draft', err)
    }
  }

  const handleAddItem = () => {
    if (!extracted) return
    const newItems: ExtractedItem[] = [
      ...extracted.items,
      {
        id: Math.random().toString(36).substring(2, 9),
        description: 'Nouvelle prestation',
        quantity: 1,
        unitPrice: 0,
        vatRate: 19,
        total: 0,
      },
    ]
    handleUpdateDraft({ items: newItems })
  }

  const handleUpdateItem = (index: number, field: keyof ExtractedItem, value: any) => {
    if (!extracted) return
    const newItems = [...extracted.items]
    newItems[index] = { ...newItems[index], [field]: value }
    handleUpdateDraft({ items: newItems })
  }

  const handleRemoveItem = (index: number) => {
    if (!extracted || extracted.items.length <= 1) return
    const newItems = extracted.items.filter((_, i) => i !== index)
    handleUpdateDraft({ items: newItems })
  }

  const handleFinalize = async () => {
    if (!session || !extracted || extracted.items.length === 0) return
    try {
      setFinalizing(true)
      const invoice = await chatService.finalizeSession(session.id)
      router.push(`/invoices/${invoice.id}`)
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la création de la facture')
    } finally {
      setFinalizing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/invoices">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Fatoora AI Builder (Génération en 1-Shot)
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tapez une phrase libre en français, arabe ou anglais : extraction contextuelle, fiscalité tunisienne et création immédiate.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={initSession}
          className="gap-1.5 text-xs border-zinc-200 dark:border-zinc-800"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Réinitialiser
        </Button>
      </div>

      {/* Repeat Shortcuts & Quick Chips */}
      <div className="bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 rounded-xl p-3">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex items-center gap-2 pb-2.5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> Raccourcis :
            </span>
            {recentClients.slice(0, 2).map((c) => (
              <button
                key={c.id}
                onClick={() => handleSendMessage(`Reconduire la dernière facture pour ${c.companyName || c.name}`)}
                className="text-[11px] px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-600 border border-zinc-200 dark:border-zinc-700 transition-all shrink-0 font-medium shadow-xs"
              >
                Même facture pour <strong>{c.companyName || c.name}</strong>
              </button>
            ))}
            {STARTER_SHORTCUTS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug)}
                className="text-[11px] px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-emerald-500 hover:text-emerald-600 border border-zinc-200 dark:border-zinc-700 transition-all shrink-0 whitespace-nowrap shadow-xs"
              >
                {sug}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>
      </div>

      {/* Main Dual-Pane Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chat Conversation & Quick-Reply Chips */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 md:p-5 shadow-sm flex flex-col h-[650px] max-h-[calc(100vh-200px)] overflow-hidden">
          {/* Chat Messages */}
          <ScrollArea className="flex-1 min-h-0 pr-3" type="always">
            <div className="space-y-4 pb-2">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user'
                return (
                  <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1.5`}>
                    <div className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} max-w-full`}>
                      {!isUser && (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-emerald-600 text-white rounded-br-none shadow-xs font-medium'
                            : 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 rounded-bl-none border border-zinc-200/60 dark:border-zinc-700/60'
                        }`}
                      >
                        {isUser ? msg.content : formatChatMessageContent(msg.content)}
                      </div>

                      {isUser && (
                        <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Tappable Quick-Reply Chips under Assistant Bubble */}
                    {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-9 pt-1">
                        {msg.quickReplies.map((qr, qIdx) => (
                          <button
                            key={qIdx}
                            onClick={() => handleQuickReply(qr)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 hover:border-emerald-400 transition-colors font-medium shadow-2xs cursor-pointer"
                          >
                            {qr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {loading && (
                <div className="flex gap-2.5 items-center text-zinc-400 text-xs py-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 animate-bounce" />
                  </div>
                  <span className="italic">Traitement fiscal et extraction contextuelle...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 mt-2"
          >
            <Input
              placeholder="Écrivez librement : ex. Facture pour Acme 10h à 50 DT/h..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
              className="h-10 text-xs bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60 focus-visible:ring-emerald-500"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-4 shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Right Column: Live Editable Preview Panel */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 md:p-5 shadow-sm flex flex-col h-[650px] max-h-[calc(100vh-200px)] overflow-hidden">
          {/* Header & Direct Edit Toggle */}
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              Aperçu Document & Édition Directe
            </span>
            <div className="flex items-center gap-2">
              {extracted?.isReady && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Prête à émettre
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDirectEditing(!directEditing)}
                className="h-7 text-xs text-zinc-600 hover:text-emerald-600 gap-1"
              >
                <Edit3 className="w-3 h-3" />
                {directEditing ? 'Aperçu Simple' : 'Modifier'}
              </Button>
            </div>
          </div>

          {/* Scrollable Document Content */}
          <ScrollArea className="flex-1 min-h-0 pr-3 my-3" type="always">
            <div className="space-y-4">
              {/* Emitter Header */}
              {org && (
                <div className="p-3 rounded-lg bg-zinc-50/70 dark:bg-zinc-800/30 border border-zinc-200/60 dark:border-zinc-700/40 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-white">{org.name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">MF: {org.taxId || 'Non spécifié'}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {org.invoicePrefix || 'FAC'}-BROUILLON
                    </span>
                  </div>
                </div>
              )}

              {/* Client Section */}
              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/40 space-y-2">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block">
                  Destinataire (Client)
                </span>
                {directEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder="Nom du client ou Société"
                      value={extracted?.clientName || ''}
                      onChange={(e) => handleUpdateDraft({ clientName: e.target.value })}
                      className="h-8 text-xs bg-white dark:bg-zinc-900"
                    />
                    <Input
                      placeholder="Matricule Fiscal (ex: 1234567/A/M/000)"
                      value={extracted?.clientTaxId || ''}
                      onChange={(e) => handleUpdateDraft({ clientTaxId: e.target.value })}
                      className="h-8 text-xs font-mono bg-white dark:bg-zinc-900"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="font-bold text-sm text-zinc-900 dark:text-white">
                      {extracted?.clientName || '— (En attente de précision)'}
                    </div>
                    {extracted?.clientTaxId && (
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        MF: {extracted.clientTaxId}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Prestations Table / Items */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block">
                    Prestations & Lignes ({extracted?.items.length || 0})
                  </span>
                  {directEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAddItem}
                      className="h-6 text-[11px] text-emerald-600 hover:text-emerald-700 gap-1 p-0"
                    >
                      <Plus className="w-3 h-3" /> Ajouter une ligne
                    </Button>
                  )}
                </div>

                {extracted?.items && extracted.items.length > 0 ? (
                  <div className="space-y-2">
                    {extracted.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-700/40 space-y-2 text-xs"
                      >
                        {directEditing ? (
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-6">
                              <Input
                                value={it.description}
                                onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                className="h-7 text-xs bg-white dark:bg-zinc-900"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                value={it.quantity}
                                onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                                className="h-7 text-xs bg-white dark:bg-zinc-900 text-center"
                              />
                            </div>
                            <div className="col-span-3">
                              <Input
                                type="number"
                                value={it.unitPrice}
                                onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                                className="h-7 text-xs bg-white dark:bg-zinc-900 text-right"
                              />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(idx)}
                                disabled={extracted.items.length <= 1}
                                className="h-7 w-7 text-zinc-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-zinc-800 dark:text-zinc-200">
                                {it.description}
                              </div>
                              <div className="text-[10px] text-zinc-400">
                                Qté : {it.quantity} × {it.unitPrice.toFixed(3)} DT • TVA : {it.vatRate}%
                              </div>
                            </div>
                            <div className="font-mono font-semibold text-zinc-900 dark:text-white">
                              {(it.quantity * it.unitPrice).toFixed(3)} DT
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                    Aucun article extrait pour le moment.
                  </div>
                )}
              </div>

              {/* Dates & Notes in Direct Edit */}
              {directEditing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div>
                    <Label className="text-[10px] text-zinc-400">Date d'échéance</Label>
                    <Input
                      type="date"
                      value={extracted?.dueDate || ''}
                      onChange={(e) => handleUpdateDraft({ dueDate: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-zinc-400">Notes / Référence</Label>
                    <Input
                      placeholder="ex: Réf bon de commande #45"
                      value={extracted?.notes || ''}
                      onChange={(e) => handleUpdateDraft({ notes: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Fiscal Calculation Summary */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Total Brut Hors Taxe (HT) :</span>
                  <span className="font-mono font-medium">
                    {(extracted?.subtotal || 0).toFixed(3)} DT
                  </span>
                </div>
                {extracted?.vatAmount && extracted.vatAmount > 0 ? (
                  <div className="flex justify-between text-zinc-500">
                    <span>Total TVA :</span>
                    <span className="font-mono font-medium">
                      {(extracted?.vatAmount || 0).toFixed(3)} DT
                    </span>
                  </div>
                ) : null}
                {extracted?.timbreFiscal && extracted.timbreFiscal > 0 ? (
                  <div className="flex justify-between text-zinc-500">
                    <span>Droit de Timbre Fiscal :</span>
                    <span className="font-mono font-medium">
                      {(extracted?.timbreFiscal || 0).toFixed(3)} DT
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between py-2 border-t border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-900 dark:text-white">
                  <span>TOTAL NET TTC :</span>
                  <span className="font-mono text-base text-emerald-600 dark:text-emerald-400">
                    {(extracted?.total || 0).toFixed(3)} TND
                  </span>
                </div>
              </div>

              {/* Cachet & Signature de l'émetteur */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-end">
                <div className="text-[10px] text-zinc-400">
                  Fait à {org?.city || 'Tunis'}, le {new Date().toLocaleDateString('fr-TN')}
                </div>
                <div className="text-center p-2.5 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg min-w-[150px] bg-zinc-50/50 dark:bg-zinc-800/20">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-1">
                    Cachet & Signature
                  </span>
                  {((org as any)?.stampImageUrl || org?.stampUrl) &&
                  ((org as any)?.signatureImageUrl || org?.signatureUrl) ? (
                    <div className="relative inline-block mx-auto">
                      <img
                        src={(org as any)?.stampImageUrl || org?.stampUrl || ''}
                        alt="Cachet"
                        className="max-h-14 max-w-[120px] object-contain opacity-95"
                      />
                      <img
                        src={(org as any)?.signatureImageUrl || org?.signatureUrl || ''}
                        alt="Signature"
                        className="absolute inset-0 max-h-12 max-w-[110px] object-contain -rotate-6 translate-x-2 translate-y-1 mix-blend-multiply"
                      />
                    </div>
                  ) : (org as any)?.stampImageUrl ||
                    org?.stampUrl ||
                    (org as any)?.signatureImageUrl ||
                    org?.signatureUrl ? (
                    <img
                      src={
                        (org as any)?.stampImageUrl ||
                        org?.stampUrl ||
                        (org as any)?.signatureImageUrl ||
                        org?.signatureUrl ||
                        ''
                      }
                      alt="Cachet & Signature"
                      className="max-h-14 max-w-[120px] mx-auto object-contain"
                    />
                  ) : (
                    <div className="h-10 flex items-center justify-center text-[9px] text-zinc-400 font-medium">
                      {org?.name || 'Cachet & Signature'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          {/* 1-Click Fast Confirm Button */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              onClick={handleFinalize}
              disabled={!extracted?.isReady || finalizing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {finalizing ? (
                'Génération et enregistrement...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  C'est parfait, émettre la facture
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
