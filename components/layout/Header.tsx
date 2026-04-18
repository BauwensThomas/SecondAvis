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

// Header principal avec menu hamburger sur mobile
export default function Header() {
  const router = useRouter()
  const [session, setSession] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOuvert, setMenuOuvert] = useState(false)

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

  // Ferme le menu mobile quand on navigue
  function fermerMenu() {
    setMenuOuvert(false)
  }

  // Déconnecte l'utilisateur et redirige vers l'accueil
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setSession(null)
    fermerMenu()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-white dark:bg-[#162333] border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center h-10" onClick={fermerMenu}>
          <img src="/avisbox-clair.png" alt="Avisbox" className="h-12 w-auto block dark:hidden" draggable={false} />
          <img src="/avisbox-fonce.png" alt="Avisbox" className="h-12 w-auto hidden dark:block" draggable={false} />
        </Link>

        {/* Navigation desktop - cachée sur mobile */}
        <nav className="hidden md:flex items-center gap-2">

          {loading && <div className="w-24 h-9 bg-slate-100 rounded-md animate-pulse" />}

          {!loading && (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/blog">Blog</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/experts">Nos experts</Link>
              </Button>
            </>
          )}

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

          {!loading && session && (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/mes-demandes">Tableau de bord</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/mon-compte">Mon profil</Link>
              </Button>

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

              {session.role === 'admin' && (
                <Button asChild size="sm" className="border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-[#162333] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-[#22304a] font-semibold shadow-none">
                  <Link href="/admin">Admin</Link>
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={handleLogout}>
                Se déconnecter
              </Button>
            </>
          )}

          <ThemeToggle />
        </nav>

        {/* Boutons droite sur mobile : theme + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMenuOuvert(!menuOuvert)}
            aria-label="Menu"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {/* Icone hamburger / croix */}
            {menuOuvert ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

      </div>

      {/* Menu mobile déroulant */}
      {menuOuvert && (
        <div className="md:hidden bg-white dark:bg-[#162333] border-t border-slate-200 dark:border-slate-700 px-4 py-3 flex flex-col gap-1">

          <Link href="/blog" onClick={fermerMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Blog
          </Link>
          <Link href="/experts" onClick={fermerMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Nos experts
          </Link>

          {!loading && !session && (
            <>
              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
              <Link href="/login" onClick={fermerMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Se connecter
              </Link>
              <Link href="/register" onClick={fermerMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 text-center transition-colors">
                S'inscrire
              </Link>
            </>
          )}

          {!loading && session && (
            <>
              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
              <Link href="/mes-demandes" onClick={fermerMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Tableau de bord
              </Link>
              <Link href="/mon-compte" onClick={fermerMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Mon profil
              </Link>

              {(session.role === 'expert' || session.role === 'admin') && (
                <>
                  <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                  <Link href="/expert/dashboard" onClick={fermerMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    Demandes expert
                  </Link>
                  <Link href="/expert/mes-reponses" onClick={fermerMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    Mes réponses
                  </Link>
                  <Link href="/expert/gains" onClick={fermerMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    Gains
                  </Link>
                  <Link href="/expert/profil" onClick={fermerMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    Profil expert
                  </Link>
                </>
              )}

              {session.role === 'admin' && (
                <>
                  <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                  <Link href="/admin" onClick={fermerMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold transition-colors">
                    Admin
                  </Link>
                </>
              )}

              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
              <button onClick={handleLogout} className="px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors">
                Se déconnecter
              </button>
            </>
          )}

        </div>
      )}
    </header>
  )
}
