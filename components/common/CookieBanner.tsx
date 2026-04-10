'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

// Bandeau de consentement aux cookies - obligatoire en Belgique (RGPD)
// Le choix est sauvegardé dans localStorage pour ne pas ré-afficher le bandeau
export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  // Vérifie si l'utilisateur a déjà fait son choix
  useEffect(() => {
    const choix = localStorage.getItem('cookie_consent')
    if (!choix) {
      setVisible(true)
    }
  }, [])

  // Accepte tous les cookies (dont les analytics si configurés)
  function accepter() {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
  }

  // Refuse les cookies non essentiels (aucun analytics ne sera chargé)
  function refuser() {
    localStorage.setItem('cookie_consent', 'refused')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-600 flex-1">
          Nous utilisons des cookies essentiels au fonctionnement du site.
          Avec votre accord, nous utilisons également des cookies d'analyse pour
          améliorer notre service.{' '}
          <a
            href="/politique-confidentialite"
            className="underline text-gray-800 hover:text-black"
          >
            En savoir plus
          </a>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={refuser}
          >
            Refuser
          </Button>
          <Button
            size="sm"
            onClick={accepter}
          >
            Accepter
          </Button>
        </div>
      </div>
    </div>
  )
}
