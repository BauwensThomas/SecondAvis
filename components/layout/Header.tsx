'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/common/ThemeToggle'

interface UserSession {
  role: 'user' | 'expert' | 'admin'
  user: { email: string; first_name?: string }
}

// Header principal - affiche les boutons connexion ou le menu selon l'état de connexion
export default function Header() {
  const router = useRouter()
  const [session, setSession] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)

  // Vérifie si l'utilisateur est connecté au chargement
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.role) setSession(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Déconnecte l'utilisateur et redirige vers l'accueil
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setSession(null)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-white dark:bg-[#162333] border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo - image claire pour le jour, foncée pour la nuit */}
        <Link href="/" className="shrink-0 flex items-center h-10">
          {/* Image claire (jour) */}
          <img
            src="/avisbox-clair.png"
            alt="Avisbox logo clair"
            className="h-12 w-auto block dark:hidden"
            draggable={false}
          />
          {/* Image foncée (nuit) */}
          <img
            src="/avisbox-fonce.png"
            alt="Avisbox logo foncé"
            className="h-12 w-auto hidden dark:block"
            draggable={false}
          />
        </Link>

        {/* Navigation droite */}
        <nav className="flex items-center gap-2">

          {/* Chargement en cours - on n'affiche rien pour éviter le flash */}
          {loading && (
            <div className="w-24 h-9 bg-slate-100 rounded-md animate-pulse" />
          )}

          {/* Lien experts - visible par tous */}
          {!loading && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/experts">Nos experts</Link>
            </Button>
          )}

          {/* Utilisateur non connecté */}
          {!loading && !session && (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link href="/register">S'inscrire</Link>
              </Button>
            </>
          )}

          {/* Utilisateur connecté (tous rôles) */}
          {!loading && session && (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/mes-demandes">Tableau de bord</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/mon-compte">Mon profil</Link>
              </Button>

              {/* Espace expert - visible uniquement si expert ou admin */}
              {(session.role === 'expert' || session.role === 'admin') && (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/expert/dashboard">Demandes</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/expert/mes-reponses">Mes réponses</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/expert/gains">Gains</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/expert/profil">Profil expert</Link>
                  </Button>
                </>
              )}

              {/* Lien admin - visible uniquement pour l'administrateur */}
              {session.role === 'admin' && (
                <Button
                  asChild
                  size="sm"
                  className="border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-[#162333] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-[#22304a] font-semibold shadow-none"
                >
                  <Link href="/admin">Admin</Link>
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={handleLogout}>
                Se déconnecter
              </Button>
            </>
          )}

          {/* Bouton selection theme - toujours visible, tout a droite */}
          <ThemeToggle />

        </nav>
      </div>
    </header>
  )
}
