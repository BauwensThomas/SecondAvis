'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState, useRef } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Bouton de selection du theme - affiche l'icone du theme actif
export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null) // Reference for the button

  // Evite le flash cote serveur (SSR ne connait pas le theme de l'OS)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" />

  // Affiche l'icone correspondant au theme actif (resolu)
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  // Sauvegarde la position du scroll avant de changer le thème
  function handleSetTheme(next: string) {
    if (typeof window !== 'undefined') {
      window.__themeScrollY = window.scrollY
    }
    setTheme(next)
  }

  // On retire le focus du bouton après ouverture pour éviter le scroll auto
  function handleOpenChange(open: boolean) {
    if (!open && btnRef.current) {
      btnRef.current.blur()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0" aria-label="Choisir le theme" tabIndex={-1}>
          <Icon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleSetTheme('light')} className="gap-2 cursor-pointer">
          <Sun className="w-4 h-4" />
          Jour
          {theme === 'light' && <span className="ml-auto text-blue-500">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSetTheme('dark')} className="gap-2 cursor-pointer">
          <Moon className="w-4 h-4" />
          Nuit
          {theme === 'dark' && <span className="ml-auto text-blue-500">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSetTheme('system')} className="gap-2 cursor-pointer">
          <Monitor className="w-4 h-4" />
          Auto
          {theme === 'system' && <span className="ml-auto text-blue-500">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
