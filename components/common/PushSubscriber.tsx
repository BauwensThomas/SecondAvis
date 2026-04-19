'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// Bannière discrète en bas à gauche pour activer les notifications push
// S'affiche uniquement si : utilisateur connecté, VAPID key présente, permission pas encore accordée/refusée
export default function PushSubscriber() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isExpert, setIsExpert] = useState(false)

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    ) return

    // N'affiche la bannière que si la permission n'a pas encore été tranchée
    if (Notification.permission !== 'default') return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Vérifie que l'utilisateur est connecté et détecte son rôle (client ou expert)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return

      const { count } = await supabase
        .from('experts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)

      setIsExpert((count ?? 0) > 0)

      const timer = setTimeout(() => setVisible(true), 3000)
      return () => clearTimeout(timer)
    })
  }, [])

  async function activerNotifications() {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setVisible(false); return }

      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      const existing = await registration.pushManager.getSubscription()
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      setVisible(false)
    } catch {
      setVisible(false)
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-24 left-4 z-40 max-w-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Activer les notifications</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isExpert
              ? "Soyez alerté dès qu'une nouvelle demande est disponible."
              : "Soyez alerté dès qu'un expert répond à votre demande."}
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none shrink-0"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={activerNotifications}
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg px-3 py-2 transition-colors"
        >
          {loading ? 'Activation...' : 'Activer'}
        </button>
        <button
          onClick={() => setVisible(false)}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-2"
        >
          Plus tard
        </button>
      </div>
    </div>
  )
}
