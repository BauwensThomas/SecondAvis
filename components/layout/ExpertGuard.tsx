'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// Contexte partagé avec toutes les pages enfant de l'espace expert
interface ExpertContextType {
  role: string   // 'expert' | 'admin'
  hasExpertAccount: boolean
}

export const ExpertContext = createContext<ExpertContextType>({ role: 'expert', hasExpertAccount: true })

// Hook pratique pour lire le contexte dans les pages expert
export function useExpertContext() {
  return useContext(ExpertContext)
}

// Vérifie que l'utilisateur est un expert et qu'il a signé la charte avant d'afficher la page
export default function ExpertGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [autorise, setAutorise]             = useState(false)
  const [role, setRole]                     = useState('expert')
  const [hasExpertAccount, setHasExpertAccount] = useState(true)

  useEffect(() => {
    async function verifier() {
      // Vérifie d'abord le rôle
      const meRes  = await fetch('/api/auth/me')
      const meData = await meRes.json()

      if (meData.role !== 'expert' && meData.role !== 'admin') {
        router.replace('/')
        return
      }

      setRole(meData.role)

      // L'admin a accès aux pages expert sans avoir à signer la charte
      // On vérifie s'il a un compte expert associé pour afficher les bons messages
      if (meData.role === 'admin') {
        const expertRes  = await fetch('/api/expert/profile-data')
        const expertData = await expertRes.json()
        setHasExpertAccount(expertData.expert !== null && expertData.expert !== undefined)
        setAutorise(true)
        return
      }

      // Si on est déjà sur la page charte, on laisse passer sans vérifier la signature
      if (pathname === '/expert/charte') {
        setAutorise(true)
        return
      }

      // Vérifie que la charte a été signée
      const charteRes  = await fetch('/api/expert/charte')
      const charteData = await charteRes.json()

      if (!charteData.signed) {
        router.replace('/expert/charte')
        return
      }

      setAutorise(true)
    }

    verifier().catch(() => router.replace('/'))
  }, [router, pathname])

  if (!autorise) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <ExpertContext.Provider value={{ role, hasExpertAccount }}>
      {children}
    </ExpertContext.Provider>
  )
}
