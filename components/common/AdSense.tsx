'use client'

import { useEffect } from 'react'

interface AdSenseProps {
  slot: string
  format?: string
}

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

// Composant publicitaire Google AdSense - affiche une unite publicitaire
export default function AdSense({ slot, format = 'auto' }: AdSenseProps) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID

  useEffect(() => {
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // Silencieux si AdSense n'est pas encore charge
    }
  }, [])

  if (!publisherId) return null

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
