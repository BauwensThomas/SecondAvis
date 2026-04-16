'use client'

import { useEffect, useState } from 'react'

interface AdSenseProps {
  slot: string
  format?: string
}

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

// Composant publicitaire Google AdSense - s'affiche uniquement si l'utilisateur a accepté les cookies
export default function AdSense({ slot, format = 'auto' }: AdSenseProps) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID
  const [consentAccepte, setConsentAccepte] = useState(false)

  // Vérifie le consentement cookies au chargement
  useEffect(() => {
    const choix = localStorage.getItem('cookie_consent')
    if (choix === 'accepted') {
      setConsentAccepte(true)
    }
  }, [])

  // Initialise l'annonce AdSense une fois le consentement confirmé
  useEffect(() => {
    if (!consentAccepte) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // Silencieux si AdSense n'est pas encore chargé
    }
  }, [consentAccepte])

  // Pas de pub si pas de publisher ID ou si cookies refusés
  if (!publisherId || !consentAccepte) return null

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={publisherId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  )
}
