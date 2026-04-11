import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import CookieBanner from "@/components/common/CookieBanner"
import AssistantWidget from "@/components/common/AssistantWidget"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import ThemeProvider from "@/components/common/ThemeProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

// Metadata globale du site - utilise les variables d'environnement pour ne rien mettre en dur
export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_APP_NAME ?? "Avisbox",
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME ?? "Avisbox"}`,
  },
  description: process.env.NEXT_PUBLIC_APP_TAGLINE ?? "Obtenez un avis professionnel en moins de 24h pour 9 euros",
  openGraph: {
    title: process.env.NEXT_PUBLIC_APP_NAME ?? "Avisbox",
    description: process.env.NEXT_PUBLIC_APP_TAGLINE ?? "Obtenez un avis professionnel en moins de 24h pour 9 euros",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    siteName: process.env.NEXT_PUBLIC_APP_NAME ?? "Avisbox",
    locale: "fr_BE",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Header />
          {children}
          <Footer />
          <CookieBanner />
          <AssistantWidget />
        </ThemeProvider>
      </body>
    </html>
  )
}
