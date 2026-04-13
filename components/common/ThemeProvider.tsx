'use client'

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import { ReactNode, useRef, useEffect } from 'react'

// Fournit le contexte de theme (jour/nuit/auto) a toute l'application



// Fournit le contexte de thème (jour/nuit/auto) à toute l'application
export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
