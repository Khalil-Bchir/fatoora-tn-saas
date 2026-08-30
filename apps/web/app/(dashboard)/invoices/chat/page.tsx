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
  Eye,
  Building2,
  Calendar,
  CreditCard,
  HelpCircle,
  Zap,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  chatService,
  type ChatSession,
  type ChatMessage,
  type ExtractedData,
  type ExtractedItem,
} from '@/features/chat/services/chat-service'
import {
  organizationService,
  type Organization,
} from '@/features/organization/services/organization-service'

const PROMPT_SUGGESTIONS = [
  {
    title: '💻 Prestation IT',
    prompt: 'Facture pour Cynapsys SARL, 15 heures de développement frontend à 75 TND/h, due sous 30 jours',
  },
  {
    title: '📦 Vente Matériel',
    prompt: 'Facturer 4 Ordinateurs portables à 1 850 DT HT l\'unité à Vermeg avec TVA 19%',
  },
  {
    title: '📊 Audit & Conseil',
    prompt: 'Facture de 1 200 DT pour Conseil Stratégique et Marketing à Société Carthage Tech',
  },
  {
    title: '🇹🇳 Arabe / دارجة',
    prompt: 'فاتورة لشركة الزيتونة للخدمات 850 دينار صيانة برمجيات',
  },
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
        <div key={lIdx} className="flex items-start gap-2 py-0.5 pl-1">
          <span className="text-emerald-500 font-bold leading-none mt-1">•</span>
          <span className="leading-relaxed">{formattedParts}</span>
        </div>
      )
    }

    return (
      <div key={lIdx} className={line.trim() === '' ? 'h-2' : 'py-0.5 leading-relaxed'}>
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
  const [directEditing, setDirectEditing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const initSession = async () => {
    try {
      setLoading(true)
      const [created, orgData] = await Promise.all([
        chatService.createSession(),
        organizationService.getOrganization().catch(() => null),
      ])
      setSession(created)
      setMessages(created.messages)
      setExtracted(created.extractedData || null)
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
  }, [messages, loading])

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
    } else if (qr === 'Modifier le montant' || qr.includes('Modifier')) {
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

  const hasItems = extracted?.items && extracted.items.length > 0
  const isReady = extracted?.isReady

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/10 via-zinc-900/5 to-transparent dark:from-emerald-950/20 dark:via-zinc-900/20 p-4 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/invoices">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 shadow-xs hover:bg-zinc-100"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </span>
                Fatoora AI Builder
              </h1>
              <Badge
                variant="outline"
                className="hidden sm:inline-flex text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium px-2 py-0.5 gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Moteur Fiscal TN 2026
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Générez une facture tunisienne conforme en une seule phrase naturelle.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={initSession}
            disabled={loading}
            className="gap-1.5 text-xs h-8 rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nouvelle Session
          </Button>
        </div>
      </div>

      {/* Main Dual-Pane Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Conversational AI Studio */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col h-[680px] max-h-[calc(100vh-160px)] overflow-hidden">
          {/* Chat Studio Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white block leading-tight">
                  Assistant Facturation IA
                </span>
                <span className="text-[10px] text-zinc-400">Prêt pour l'extraction & le calcul</span>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              Session Active
            </Badge>
          </div>

          {/* Messages Stream */}
          <ScrollArea className="flex-1 min-h-0 pr-3 my-3" type="always">
            <div className="space-y-4 pb-2">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user'
                return (
                  <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1.5`}>
                    <div className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} max-w-full`}>
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs shadow-xs font-medium'
                            : 'bg-zinc-50 dark:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200 rounded-bl-xs border border-zinc-200/70 dark:border-zinc-700/50 shadow-2xs'
                        }`}
                      >
                        {isUser ? msg.content : formatChatMessageContent(msg.content)}
                      </div>

                      {isUser && (
                        <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Quick-Reply Suggestion Pills */}
                    {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-9 pt-1">
                        {msg.quickReplies.map((qr, qIdx) => {
                          const isFinalizeAction = qr.startsWith('✓') || qr.includes('émettre')
                          return (
                            <button
                              key={qIdx}
                              onClick={() => handleQuickReply(qr)}
                              className={`text-[11px] px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                isFinalizeAction
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                                  : 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/70 hover:border-emerald-500 hover:text-emerald-600'
                              }`}
                            >
                              {isFinalizeAction && <Check className="w-3 h-3" />}
                              {qr}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Helpful Starter Inspiration Cards when conversation is fresh */}
              {messages.length <= 1 && (
                <div className="pt-2 pl-9 space-y-2">
                  <span className="text-[11px] font-semibold text-zinc-400 block flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" /> Exemples en 1 clic :
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PROMPT_SUGGESTIONS.map((item, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSendMessage(item.prompt)}
                        className="text-left p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border border-zinc-200/60 dark:border-zinc-800 hover:border-emerald-500/40 transition-all group"
                      >
                        <div className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5">
                          {item.prompt}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Loading Pulse State */}
              {loading && (
                <div className="flex gap-2.5 items-center pl-1 text-zinc-400 text-xs py-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                    <span>Analyse fiscale et calcul en temps réel...</span>
                  </div>
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
            className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 mt-1"
          >
            <div className="relative flex-1">
              <Input
                placeholder="Écrivez librement : ex. Facture pour Vermeg 15h à 80 DT/h..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
                className="h-11 text-xs bg-zinc-50 dark:bg-zinc-800/70 border-zinc-200/80 dark:border-zinc-700/60 pr-16 rounded-xl focus-visible:ring-emerald-500"
              />
              <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 pointer-events-none bg-zinc-200/50 dark:bg-zinc-700/50 px-1.5 py-0.5 rounded">
                ↵ Entrée
              </span>
            </div>
            <Button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-5 rounded-xl shrink-0 shadow-sm transition-all disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Right Column: Live Tunisian Document Canvas */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col h-[680px] max-h-[calc(100vh-160px)] overflow-hidden">
          {/* Header & Direct Edit Toggle */}
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 block">
                  Aperçu Document Direct
                </span>
                <span className="text-[10px] text-zinc-400">Simulation conforme TVA & Timbre</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isReady ? (
                <Badge className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 gap-1 font-semibold px-2 py-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Prête
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5">
                  Brouillon
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDirectEditing(!directEditing)}
                className="h-7 text-xs text-zinc-600 hover:text-emerald-600 gap-1 px-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800"
              >
                {directEditing ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                {directEditing ? 'Aperçu' : 'Éditer'}
              </Button>
            </div>
          </div>

          {/* Scrollable Paper-Style Canvas */}
          <ScrollArea className="flex-1 min-h-0 pr-3 my-3" type="always">
            <div className="space-y-4">
              {/* Emitter Company Banner */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                    {org?.name ? org.name.substring(0, 2).toUpperCase() : 'FT'}
                  </div>
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-white">
                      {org?.name || 'Mon Entreprise'}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      MF : {org?.taxId || 'Non spécifié'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/40 dark:border-emerald-800/40">
                    {org?.invoicePrefix || 'FAC'}-BROUILLON
                  </span>
                  <div className="text-[10px] text-zinc-400 mt-1">
                    Émission : {new Date().toLocaleDateString('fr-TN')}
                  </div>
                </div>
              </div>

              {/* Client Destination Card */}
              <div className="p-3.5 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/30 border border-zinc-200/70 dark:border-zinc-800/70 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-600" /> Client Destinataire
                </span>
                {directEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-zinc-400">Nom du client ou Société</Label>
                      <Input
                        placeholder="ex: Cynapsys SARL"
                        value={extracted?.clientName || ''}
                        onChange={(e) => handleUpdateDraft({ clientName: e.target.value })}
                        className="h-8 text-xs bg-white dark:bg-zinc-900 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-zinc-400">Matricule Fiscal (MF)</Label>
                      <Input
                        placeholder="ex: 1234567/A/M/000"
                        value={extracted?.clientTaxId || ''}
                        onChange={(e) => handleUpdateDraft({ clientTaxId: e.target.value })}
                        className="h-8 text-xs font-mono bg-white dark:bg-zinc-900 mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-zinc-900 dark:text-white">
                        {extracted?.clientName || (
                          <span className="text-zinc-400 italic font-normal">
                            En attente de précision du client...
                          </span>
                        )}
                      </div>
                      {extracted?.clientTaxId ? (
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                          MF : {extracted.clientTaxId}
                        </div>
                      ) : null}
                    </div>
                    {extracted?.dueDate && (
                      <div className="text-right text-[10px] text-zinc-400">
                        Échéance : <span className="font-medium text-zinc-700 dark:text-zinc-300">{extracted.dueDate}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Prestations Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                    Lignes & Prestations ({extracted?.items.length || 0})
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

                {hasItems ? (
                  <div className="border border-zinc-200/70 dark:border-zinc-800/80 rounded-xl overflow-hidden divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-zinc-100/60 dark:bg-zinc-800/60 text-[10px] uppercase font-bold text-zinc-400">
                      <div className="col-span-6">Désignation</div>
                      <div className="col-span-2 text-center">Qté</div>
                      <div className="col-span-2 text-right">P.U (HT)</div>
                      <div className="col-span-2 text-right">Total HT</div>
                    </div>

                    {extracted!.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center bg-white dark:bg-zinc-900/60 text-xs"
                      >
                        {directEditing ? (
                          <>
                            <div className="col-span-6">
                              <Input
                                value={it.description}
                                onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                className="h-7 text-xs bg-zinc-50 dark:bg-zinc-800"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                value={it.quantity}
                                onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                                className="h-7 text-xs bg-zinc-50 dark:bg-zinc-800 text-center"
                              />
                            </div>
                            <div className="col-span-3">
                              <Input
                                type="number"
                                value={it.unitPrice}
                                onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                                className="h-7 text-xs bg-zinc-50 dark:bg-zinc-800 text-right font-mono"
                              />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(idx)}
                                disabled={extracted!.items.length <= 1}
                                className="h-7 w-7 text-zinc-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="col-span-6">
                              <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                                {it.description}
                              </div>
                              <div className="text-[10px] text-zinc-400">
                                TVA {it.vatRate}%
                              </div>
                            </div>
                            <div className="col-span-2 text-center font-mono font-medium text-zinc-700 dark:text-zinc-300">
                              {it.quantity}
                            </div>
                            <div className="col-span-2 text-right font-mono text-zinc-600 dark:text-zinc-400">
                              {it.unitPrice.toFixed(3)}
                            </div>
                            <div className="col-span-2 text-right font-mono font-bold text-zinc-900 dark:text-white">
                              {(it.quantity * it.unitPrice).toFixed(3)} DT
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 px-4 text-center text-xs text-zinc-400 border border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/10">
                    <Bot className="w-6 h-6 mx-auto mb-2 text-zinc-400 opacity-60" />
                    Décrivez votre prestation dans le chat pour voir les lignes s'ajouter automatiquement.
                  </div>
                )}
              </div>

              {/* Due Date & Notes in Direct Edit */}
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
                      placeholder="ex: Bon de commande #892"
                      value={extracted?.notes || ''}
                      onChange={(e) => handleUpdateDraft({ notes: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Fiscal Calculation Summary Panel */}
              <div className="rounded-xl p-3.5 bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800/70 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                  <span>Total Brut Hors Taxe (HT) :</span>
                  <span className="font-mono font-medium text-zinc-900 dark:text-zinc-200">
                    {(extracted?.subtotal || 0).toFixed(3)} DT
                  </span>
                </div>
                {extracted?.vatAmount && extracted.vatAmount > 0 ? (
                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span>Total TVA Collectée :</span>
                    <span className="font-mono font-medium text-zinc-900 dark:text-zinc-200">
                      {(extracted?.vatAmount || 0).toFixed(3)} DT
                    </span>
                  </div>
                ) : null}
                {extracted?.timbreFiscal && extracted.timbreFiscal > 0 ? (
                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span>Droit de Timbre Fiscal (Loi de finances) :</span>
                    <span className="font-mono font-medium text-zinc-900 dark:text-zinc-200">
                      {(extracted?.timbreFiscal || 0).toFixed(3)} DT
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm font-bold text-zinc-900 dark:text-white mt-1">
                  <span className="uppercase text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    TOTAL NET TTC (À PAYER) :
                  </span>
                  <span className="font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {(extracted?.total || 0).toFixed(3)} TND
                  </span>
                </div>
              </div>

              {/* Cachet & Signature de l'émetteur */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-end">
                <div className="text-[10px] text-zinc-400">
                  Fait à {org?.city || 'Tunis'}, le {new Date().toLocaleDateString('fr-TN')}
                </div>
                <div className="text-center p-2.5 border border-dashed border-zinc-200 dark:border-zinc-700/80 rounded-xl min-w-[150px] bg-zinc-50/60 dark:bg-zinc-800/30">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-1.5">
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
                      {org?.name || 'Cachet Officiel'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          {/* 1-Click Fast Confirm & Finalize Button */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
            <Button
              onClick={handleFinalize}
              disabled={!isReady || finalizing}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold h-11 rounded-xl gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {finalizing ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Génération et enregistrement fiscal...
                </span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Émettre et Enregistrer la Facture
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
