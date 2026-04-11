import Link from 'next/link'

// Pied de page global - liens légaux et navigation secondaire
export default function Footer() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Avisbox'
  const annee   = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          <p className="text-xs text-slate-400">
            © {annee} {appName} - Plateforme d'entraide professionnelle
          </p>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/comment-ca-marche" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
              Comment ça marche
            </Link>
            <Link href="/devenir-expert" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
              Devenir expert
            </Link>
            <Link href="/a-propos" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
              À propos
            </Link>
            <Link href="/cgu" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
              CGU
            </Link>
            <Link href="/politique-confidentialite" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
              Confidentialité
            </Link>
            <Link href="/mentions-legales" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
              Mentions légales
            </Link>
          </nav>

        </div>
      </div>
    </footer>
  )
}
