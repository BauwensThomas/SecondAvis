'use client'

import { useRef, useEffect, useCallback } from 'react'
import SignaturePadLib from 'signature_pad'

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void
}

// Composant de signature numérique - affiche un canvas sur lequel l'expert dessine sa signature
export default function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const padRef      = useRef<SignaturePadLib | null>(null)

  // Ajuste la résolution du canvas selon le ratio de pixels de l'écran
  const redimensionner = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !padRef.current) return

    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width  = canvas.offsetWidth  * ratio
    canvas.height = canvas.offsetHeight * ratio
    canvas.getContext('2d')?.scale(ratio, ratio)
    padRef.current.clear()
    onChange(null)
  }, [onChange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    padRef.current = new SignaturePadLib(canvas, {
      minWidth: 1,
      maxWidth: 3,
      penColor: '#22c55e', // vert Tailwind 500
    })

    padRef.current.addEventListener('afterUpdateStroke', () => {
      if (padRef.current && !padRef.current.isEmpty()) {
        onChange(padRef.current.toDataURL('image/png'))
      }
    })

    redimensionner()
    window.addEventListener('resize', redimensionner)

    return () => {
      window.removeEventListener('resize', redimensionner)
      padRef.current?.off()
    }
  }, [redimensionner, onChange])

  function effacer() {
    padRef.current?.clear()
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <div className="border-2 border-slate-300 rounded-xl bg-white overflow-hidden" style={{ height: 140 }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair"
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Signez dans le cadre ci-dessus avec votre souris ou votre doigt</p>
        <button
          type="button"
          onClick={effacer}
          className="text-xs text-slate-500 hover:text-slate-700 underline"
        >
          Effacer
        </button>
      </div>
    </div>
  )
}
