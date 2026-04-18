import Link from 'next/link'

// Pied de page global - liens légaux et navigation secondaire
export default function Footer() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Avisbox'
  const annee   = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">

          {/* Liens par domaine - utile pour le SEO et la navigation */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Nos domaines</p>
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/mecanique" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
                Mécanique automobile
              </Link>
              <Link href="/immo" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
                Immobilier
              </Link>
              <Link href="/travaux" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
                Travaux
              </Link>
              <Link href="/assurance" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
                Assurance
              </Link>
              <Link href="/travail" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
                Droit du travail
              </Link>
              <Link href="/comptabilite" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
                Comptabilité
              </Link>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4">

            <p className="text-xs text-slate-400">
              © {annee} {appName} - Plateforme d'entraide professionnelle
            </p>

            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link href="/comment-ca-marche" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
                Comment ça marche
              </Link>
              <Link href="/faq" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
                FAQ
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
      </div>
    </footer>
  )
}
