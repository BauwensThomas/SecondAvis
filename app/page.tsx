import Link from "next/link"
import { Button } from "@/components/ui/button"

// Récupère les prix dynamiques depuis les variables d'environnement
const CATEGORY_PRICES: Record<string, number> = {
  mecanique: Number(process.env.NEXT_PUBLIC_PRICE_MECANIQUE_CENTS) || 900,
  immo: Number(process.env.NEXT_PUBLIC_PRICE_IMMO_CENTS) || 900,
  travaux: Number(process.env.NEXT_PUBLIC_PRICE_TRAVAUX_CENTS) || 900,
  assurance: Number(process.env.NEXT_PUBLIC_PRICE_ASSURANCE_CENTS) || 900,
  travail: Number(process.env.NEXT_PUBLIC_PRICE_TRAVAIL_CENTS) || 900,
  comptabilite: Number(process.env.NEXT_PUBLIC_PRICE_COMPTABILITE_CENTS) || 900,
}
const MIN_PRICE_CENTS = Math.min(...Object.values(CATEGORY_PRICES))
const MIN_PRICE_EUROS = (MIN_PRICE_CENTS / 100).toFixed(2).replace('.', ',')

// Page d'accueil publique de Avisbox
export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">

      {/* ---- Hero ---- */}
      <section className="bg-slate-900 dark:bg-[#181f3a] text-white py-20 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4 max-w-2xl mx-auto leading-tight">
          Un doute sur un devis ou un diagnostic ?
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
          Obtenez un avis professionnel verifié en moins de 24h à partir de {MIN_PRICE_EUROS} euros.<br />
          <span className="block text-lg mt-2">Remboursé automatiquement si personne ne vous repond.</span>
        </p>
        <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8 py-6">
          <Link href="/nouvelle-demande">
            Poser ma question
          </Link>
        </Button>
      </section>

      {/* ---- Bande de reassurance ---- */}
      <section className="bg-blue-50 border-b border-blue-100 py-4 px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-center gap-6 text-sm text-blue-800 text-center">
          <span className="font-medium">Réponse garantie sous 24h</span>
          <span className="hidden sm:block text-blue-300">|</span>
          <span className="font-medium">Experts vérifiés manuellement</span>
          <span className="hidden sm:block text-blue-300">|</span>
          <span className="font-medium">Remboursé si pas de reponse</span>
        </div>
      </section>

      {/* ---- Comment ca marche ---- */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-12">
            Comment ca marche ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-700 dark:text-blue-400 font-bold text-lg">1</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Décrivez votre situation</h3>
              <p className="text-slate-500 text-sm">
                Expliquez votre doute, joignez une photo ou un document si besoin.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-700 dark:text-blue-400 font-bold text-lg">2</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Un expert vous repond</h3>
              <p className="text-slate-500 text-sm">
                Un professionnel vérifié dans votre domaine analyse votre situation et vous repond sous 24h.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-700 dark:text-blue-400 font-bold text-lg">3</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Vous êtes éclairé</h3>
              <p className="text-slate-500 text-sm">
                Vous recevez un avis clair et honnête. Si aucun expert ne répond, vous êtes remboursé.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ---- Categories actives ---- */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-4">
            Domaines disponibles
          </h2>
          <p className="text-center text-slate-500 mb-10 text-sm">
            D'autres categories arrivent prochainement.
          </p>

          <div className="max-w-sm mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-slate-800 text-lg">Mécanique automobile</h3>
                <span className="text-indigo-700 dark:text-blue-400 font-bold">{MIN_PRICE_EUROS} euros</span>
              </div>
              <p className="text-slate-500 text-sm mb-4">
                Devis trop cher, panne incomprise, diagnostic douteux, kilometrage suspect...
              </p>
              <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                <Link href="/nouvelle-demande">
                  Poser ma question
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Temoignages ---- */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-10">
            Ils ont évité une mauvaise surprise
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="bg-slate-50 dark:bg-[#1e293b] rounded-xl p-5 border border-slate-100 dark:border-slate-700">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map((i) => (
                  <span key={i} className="text-yellow-400 text-sm">&#9733;</span>
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-100 text-sm mb-3">
                "Le garage demandait 1 800 € pour changer la boîte de vitesses. L'expert a confirmé que le coût était surévalué de 600 €. J'ai pu négocier un meilleur prix."
              </p>
              <p className="text-slate-400 dark:text-slate-300 text-xs font-medium">Thomas, Liege</p>
            </div>

            <div className="bg-slate-50 dark:bg-[#1e293b] rounded-xl p-5 border border-slate-100 dark:border-slate-700">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map((i) => (
                  <span key={i} className="text-yellow-400 text-sm">&#9733;</span>
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-100 text-sm mb-3">
                "Réponse claire et détaillée en moins de 3 heures. L'expert a validé le diagnostic, et je sais maintenant que je peux pleinement faire confiance à mon garagiste."
              </p>
              <p className="text-slate-400 dark:text-slate-300 text-xs font-medium">Marie, Bruxelles</p>
            </div>

            <div className="bg-slate-50 dark:bg-[#1e293b] rounded-xl p-5 border border-slate-100 dark:border-slate-700">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map((i) => (
                  <span key={i} className="text-yellow-400 text-sm">&#9733;</span>
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-100 text-sm mb-3">
                "Pour seulement 9 €, j'ai eu la tranquillité d'esprit sur une réparation de 900 €. C'est la meilleure dépense que j'ai faite ce mois-ci."
              </p>
              <p className="text-slate-400 dark:text-slate-300 text-xs font-medium">Laurent, Namur</p>
            </div>

          </div>
        </div>
      </section>

      {/* ---- CTA final ---- */}
      <section className="py-16 px-6 bg-indigo-600 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Vous avez un doute ?</h2>
        <p className="text-blue-100 mb-8 max-w-md mx-auto">
          Ne payez pas pour une réparation avant de savoir si le prix est juste.
          Un expert vous apporte une réponse fiable en moins de 24 heures.
        </p>
        <Button asChild size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 text-lg px-8 py-6 font-semibold">
          <Link href="/nouvelle-demande">
            Poser ma question
          </Link>
        </Button>
      </section>

      {/* ---- Mention legale obligatoire ---- */}
      <section className="py-6 px-6 bg-slate-100">
        <p className="text-center text-slate-400 text-xs max-w-2xl mx-auto">
          Avisbox est une plateforme d'entraide. Les avis donnés par nos professionnels 
          représentent leur opinion basée sur les informations que vous avez fournies. 
          Ils ne constituent pas une consultation professionnelle formelle et n'engagent 
          pas la responsabilité de Avisbox ni celle du professionnel. 
          Avisbox décline toute responsabilité concernant les décisions prises 
          sur la base de ces avis.
        </p>
      </section>

    </main>
  )
}
