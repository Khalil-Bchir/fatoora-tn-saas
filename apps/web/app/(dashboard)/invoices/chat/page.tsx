'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles,
  Send,
  ArrowLeft,
  Building2,
  FileText,
  CheckCircle2,
  Bot,
  User,
  Plus,
  ArrowRight,
  ShieldCheck,
  Calculator,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  chatService,
  type ChatSession,
  type ChatMessage,
  type ExtractedData,
} from '@/features/chat/services/chat-service'

const SUGGESTIONS = [
  'Facturer 1 450 DT à SARL Carthage Tech pour audit de sécurité et mise en conformité',
  'Établir une facture de 800 DT à Moncef Ben Salem pour mission de conseil IT',
  'Facturer 2 800 DT à Société Zitouna pour développement d’application web',
]

export default function InvoiceChatPage() {
  const router = useRouter()
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const initSession = async () => {
    try {
      setLoading(true)
      const created = await chatService.createSession()
      setSession(created)
      setMessages(created.messages)
      setExtracted(created.extractedData || null)
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

    // Optimistic user message
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/invoices">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Fatoora AI Builder
            </h1>
            <p className="text-xs text-zinc-500">
              Dictez ou écrivez votre facture en français ou arabe : l'assistant extrait le client, calcule la TVA et le timbre fiscal.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={initSession}
          className="gap-1.5 text-xs text-zinc-600 dark:text-zinc-400"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouvelle Session
        </Button>
      </div>

      {/* Main Grid: Chat Left + Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Conversational Assistant */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col h-[640px]">
          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user'
              return (
                <div
                  key={idx}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 rounded-bl-none border border-zinc-200/50 dark:border-zinc-700/50'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              )
            })}

            {loading && (
              <div className="flex gap-3 items-center text-zinc-400 text-xs py-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <span className="italic">Analyse fiscale et extraction en cours...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="pt-3 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap border border-zinc-200/60 dark:border-zinc-700/40"
              >
                + {sug.slice(0, 38)}...
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800"
          >
            <Input
              placeholder="Ex: Facture de 1500 DT à SARL Carthage pour refonte de site web..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
              className="h-10 text-xs bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60"
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

        {/* Right Column: Live Interactive Invoice Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Aperçu Document Extrait
              </span>
              {extracted?.isReady ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Prête à émettre
                </span>
              ) : (
                <span className="text-[10px] font-medium text-zinc-400">
                  En attente de détails...
                </span>
              )}
            </div>

            {/* Client Extracted */}
            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/40">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block mb-1">
                Client Détecté
              </span>
              <div className="font-bold text-sm text-zinc-900 dark:text-white">
                {extracted?.clientName || '— (En attente)'}
              </div>
            </div>

            {/* Prestations Table Extracted */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block">
                Prestations & Articles ({extracted?.items.length || 0})
              </span>

              {extracted?.items && extracted.items.length > 0 ? (
                <div className="space-y-2">
                  {extracted.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-700/40 flex justify-between items-center text-xs"
                    >
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">
                        {it.description}
                        <div className="text-[10px] text-zinc-400">
                          Qté : {it.quantity} • TVA : {it.vatRate}%
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-zinc-900 dark:text-white">
                        {(it.quantity * it.unitPrice).toFixed(3)} DT
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                  Aucun article extrait pour le moment.
                </div>
              )}
            </div>

            {/* Fiscal Calculations */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Total HT :</span>
                <span className="font-mono font-medium">
                  {(extracted?.subtotal || 0).toFixed(3)} DT
                </span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>TVA (19%) :</span>
                <span className="font-mono font-medium">
                  {(extracted?.vatAmount || 0).toFixed(3)} DT
                </span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Timbre Fiscal :</span>
                <span className="font-mono font-medium">
                  {(extracted?.timbreFiscal || 1.0).toFixed(3)} DT
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-900 dark:text-white">
                <span>TOTAL NET TTC :</span>
                <span className="font-mono text-base text-emerald-600 dark:text-emerald-400">
                  {(extracted?.total || 0).toFixed(3)} TND
                </span>
              </div>
            </div>

            {/* Finalize Button */}
            <Button
              onClick={handleFinalize}
              disabled={!extracted?.isReady || finalizing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {finalizing ? (
                'Génération de la facture...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Générer la Facture Officielle
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
