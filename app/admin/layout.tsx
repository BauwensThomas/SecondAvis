'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
// Pas de mode nuit pour l'admin

interface Badges {
  signalements: number
  candidatures: number
  rgpd: number
  avis: number
  demandes: number
  experts_suspendus: number
  experts_non_verifies: number
}

// Layout de l'espace admin - navigation latérale + contenu principal

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [badges, setBadges] = useState<Badges>({ signalements: 0, candidatures: 0, rgpd: 0, avis: 0, demandes: 0, experts_suspendus: 0, experts_non_verifies: 0 })
  const [nbNouveauxExperts, setNbNouveauxExperts] = useState(0)

  // Charge les compteurs pour les bulles de notification
  useEffect(() => {
    async function chargerBadges() {
      try {
        const res  = await fetch('/api/admin/stats')
        const data = await res.json()
        setBadges({
          signalements:         data.signalements_en_attente ?? 0,
          candidatures:         data.candidatures_en_attente ?? 0,
          rgpd:                 data.rgpd_en_attente         ?? 0,
          avis:                 data.avis_en_attente         ?? 0,
          demandes:             data.demandes_en_attente     ?? 0,
          experts_suspendus:    data.experts_suspendus       ?? 0,
          experts_non_verifies: data.experts_non_verifies    ?? 0,
        })
      } catch {
        // Silencieux - les badges restent à 0
      }
    }
    chargerBadges()
  }, [pathname]) // Recharge à chaque changement de page

  // Synchronise la bulle "nouveaux experts" avec le localStorage à chaque navigation
  useEffect(() => {
    function syncNouveauxExperts() {
      if (typeof window !== 'undefined') {
        const n = Number(localStorage.getItem('nbNouveauxExperts') || '0')
        setNbNouveauxExperts(n)
      }
    }
    syncNouveauxExperts()
    window.addEventListener('storage', syncNouveauxExperts)
    return () => window.removeEventListener('storage', syncNouveauxExperts)
  }, [])

  // Ajout : resynchronise à chaque navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const n = Number(localStorage.getItem('nbNouveauxExperts') || '0')
      setNbNouveauxExperts(n)
    }
  }, [pathname])

  const NAV_ITEMS = [
    { href: '/admin',               label: 'Tableau de bord', icon: '▦', badge: 0 },
    { href: '/admin/signalements',  label: 'Signalements',    icon: '⚑', badge: badges.signalements },
    { href: '/admin/candidatures',  label: 'Candidatures',    icon: '✎', badge: badges.candidatures },
    { href: '/admin/experts',       label: 'Experts',         icon: '★', badge: nbNouveauxExperts, badgeOrange: badges.experts_suspendus, badgeRouge: badges.experts_non_verifies },
    { href: '/admin/utilisateurs',  label: 'Utilisateurs',    icon: '♟', badge: 0 },
    { href: '/admin/demandes',      label: 'Demandes',        icon: '✉', badge: badges.demandes },
    { href: '/admin/avis',          label: 'Avis clients',    icon: '★', badge: badges.avis },
    { href: '/admin/finances',      label: 'Finances',        icon: '€', badge: 0 },
    { href: '/admin/paiements',     label: 'Paiements',       icon: '↕', badge: 0 },
    { href: '/admin/marketing',     label: 'Marketing',       icon: '✉', badge: 0 },
    { href: '/admin/rgpd',          label: 'RGPD',            icon: '⚙', badge: badges.rgpd },
    { href: '/admin/audit',         label: 'Audit',           icon: '≡', badge: 0 },
  ] as { href: string; label: string; icon: string; badge: number; badgeOrange?: number; badgeRouge?: number }[]

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Sidebar fixe */}
      <aside className="w-56 shrink-0 bg-slate-900 text-white flex flex-col">
        <div className="px-5 py-4 border-b border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Admin</p>
          <p className="text-lg font-bold text-white mt-0.5">Avisbox</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const actif = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  actif
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                <span className="flex items-center gap-1">
                  {item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  {item.badgeOrange != null && item.badgeOrange > 0 && (
                    <span className="bg-orange-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none" title="Experts suspendus">
                      {item.badgeOrange > 99 ? '99+' : item.badgeOrange}
                    </span>
                  )}
                  {item.badgeRouge != null && item.badgeRouge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none" title="Experts non vérifiés">
                      {item.badgeRouge > 99 ? '99+' : item.badgeRouge}
                    </span>
                  )}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t border-slate-700">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
            ← Retour au site
          </Link>
        </div>
      </aside>

      {/* Contenu */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
