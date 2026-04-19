'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Widget d'assistance IA flottant - chatbot Grok en bas à droite
export default function AssistantWidget() {
  const [ouvert, setOuvert]       = useState(false)
  const [messages, setMessages]   = useState<Message[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis l\'assistant Avisbox. Comment puis-je vous aider ?' }
  ])
  const [saisie, setSaisie]       = useState('')
  const [enCours, setEnCours]     = useState(false)
  const messagesRef               = useRef<HTMLDivElement>(null)

  // Scroll automatique vers le bas à chaque nouveau message
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  // Envoie le message à l'API Grok et ajoute la réponse
  async function envoyer() {
    const texte = saisie.trim()
    if (!texte || enCours) return

    const nouveauxMessages: Message[] = [...messages, { role: 'user', content: texte }]
    setMessages(nouveauxMessages)
    setSaisie('')
    setEnCours(true)

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nouveauxMessages.filter((m) => m.role !== 'assistant' || nouveauxMessages.indexOf(m) > 0) }),
      })
      const data = await res.json()
      const reponse = data.reponse ?? "Désolé, je n'ai pas pu répondre. Contactez-nous à contact@avisbox.be."
      setMessages((prev) => [...prev, { role: 'assistant', content: reponse }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Une erreur s'est produite. Réessayez ou contactez-nous à contact@avisbox.be." }])
    } finally {
      setEnCours(false)
    }
  }

  return (
    <>
      {/* Fenêtre de chat */}
      {ouvert && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-h-[70vh] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">

          {/* En-tête */}
          <div className="bg-slate-700 px-4 py-3 flex items-center justify-between shrink-0">
            <div>
              <p className="font-semibold text-sm text-white">Assistant Avisbox</p>
              <p className="text-xs text-slate-300">Réponse instantanée par IA</p>
            </div>
            <button
              onClick={() => setOuvert(false)}
              className="text-slate-300 hover:text-white text-xl leading-none"
              aria-label="Fermer l'assistant"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {enCours && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
                  <span className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Saisie */}
          <div className="border-t border-slate-100 dark:border-slate-700 p-3 flex gap-2 shrink-0">
            <input
              type="text"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && envoyer()}
              placeholder="Posez votre question..."
              disabled={enCours}
              className="flex-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={envoyer}
              disabled={enCours || !saisie.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            >
              Envoyer
            </button>
          </div>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        onClick={() => setOuvert(!ouvert)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 focus:outline-none overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        aria-label={ouvert ? "Fermer l'assistant" : "Ouvrir l'assistant"}
      >
        <Image src="/robot-aide.png" alt="Assistant" width={56} height={56} loading="eager" className="w-full h-full object-cover" />
      </button>
    </>
  )
}
