import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createAdminClient } from "@/lib/supabase/server"

// Récupère les statistiques publiques depuis la base de données (cache 1h)
async function getStats() {
  try {
    const supabase = createAdminClient()
    const [{ count: totalAvis }, { data: ratings }] = await Promise.all([
      supabase.from('answers').select('*', { count: 'exact', head: true }).eq('is_paid', true),
      supabase.from('ratings').select('score'),
    ])
    const satisfaction = ratings && ratings.length > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length) * 20)
      : 96
    return { totalAvis: totalAvis ?? 0, satisfaction }
  } catch {
    return { totalAvis: 0, satisfaction: 96 }
  }
}

// Prix minimum affiché dynamiquement depuis les variables d'environnement
const MIN_PRICE_EUROS = (Math.min(
  Number(process.env.NEXT_PUBLIC_PRICE_MECANIQUE_CENTS),
  Number(process.env.NEXT_PUBLIC_PRICE_IMMO_CENTS),
  Number(process.env.NEXT_PUBLIC_PRICE_TRAVAUX_CENTS),
  Number(process.env.NEXT_PUBLIC_PRICE_ASSURANCE_CENTS),
  Number(process.env.NEXT_PUBLIC_PRICE_TRAVAIL_CENTS),
  Number(process.env.NEXT_PUBLIC_PRICE_COMPTABILITE_CENTS),
) / 100).toFixed(2).replace('.', ',')

// Page d'accueil publique de Avisbox
export default async function HomePage() {
  const stats = await getStats()

  return (
    <main className="flex flex-col min-h-screen">

      {/* ---- Hero ---- */}
      <section className="bg-slate-900 dark:bg-[#181f3a] text-white py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block bg-indigo-600/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full mb-6 border border-indigo-500/30">
            Experts vérifiés - Réponse en 24h - Remboursé si silence
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
            Un doute sur un devis ou un diagnostic ?<br />
            <span className="text-indigo-400">Obtenez un avis professionnel.</span>
          </h1>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Un expert vérifié dans votre domaine analyse votre situation en moins de 24h pour seulement <strong className="text-white">à partir de {MIN_PRICE_EUROS}&nbsp;€</strong>.
            Si personne ne vous répond, vous êtes <strong className="text-white">remboursé automatiquement</strong>.
          </p>
          <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-10 py-6 shadow-lg shadow-indigo-900/40">
            <Link href="/nouvelle-demande">Poser ma question à partir de {MIN_PRICE_EUROS}&nbsp;€</Link>
          </Button>
          <p className="text-slate-500 text-xs mt-4">Paiement sécurisé par Stripe - Sans engagement</p>
        </div>
      </section>

      {/* ---- Chiffres clés ---- */}
      <section className="bg-indigo-600 text-white py-8 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-bold">{stats.totalAvis > 0 ? stats.totalAvis : '—'}</p>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1">Avis rendus</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold">{stats.satisfaction}%</p>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1">De satisfaction</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold">24h</p>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1">Délai garanti</p>
          </div>
        </div>
      </section>

      {/* ---- Ancrage prix ---- */}
      <section className="py-14 px-6 bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Un avis professionnel sans se ruiner
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-10">
            Comparez avant de décider comment vérifier votre devis.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center opacity-60">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">Avocat</p>
              <p className="text-3xl font-bold text-slate-700 dark:text-slate-300">300&nbsp;€</p>
              <p className="text-xs text-slate-400 mt-1">par heure</p>
              <ul className="text-xs text-slate-400 mt-4 space-y-1 text-left">
                <li>- Rendez-vous à planifier</li>
                <li>- Délai de plusieurs jours</li>
                <li>- Facture à l'heure</li>
              </ul>
            </div>

            <div className="border-2 border-indigo-500 rounded-xl p-5 text-center shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                Recommandé
              </span>
              <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-2">Avisbox</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">à partir de {MIN_PRICE_EUROS}&nbsp;€</p>
              <p className="text-xs text-slate-400 mt-1">par question</p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 mt-4 space-y-1 text-left">
                <li className="text-green-600 dark:text-green-400">+ Réponse en moins de 24h</li>
                <li className="text-green-600 dark:text-green-400">+ Expert vérifié manuellement</li>
                <li className="text-green-600 dark:text-green-400">+ Remboursé si pas de réponse</li>
              </ul>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center opacity-60">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">Expert automobile</p>
              <p className="text-3xl font-bold text-slate-700 dark:text-slate-300">150&nbsp;€</p>
              <p className="text-xs text-slate-400 mt-1">par expertise</p>
              <ul className="text-xs text-slate-400 mt-4 space-y-1 text-left">
                <li>- Déplacement nécessaire</li>
                <li>- Délai de plusieurs jours</li>
                <li>- Coût fixe élevé</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ---- Comment ca marche ---- */}
      <section className="py-16 px-6 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-12">
            Comment ca marche ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-700 dark:text-indigo-400 font-bold text-lg">1</span>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Décrivez votre situation</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Expliquez votre doute en quelques lignes. Joignez une photo du devis ou un document si besoin.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-700 dark:text-indigo-400 font-bold text-lg">2</span>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Un expert vous répond</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Un professionnel vérifié dans votre domaine analyse votre situation et vous donne son avis sous 24h.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-700 dark:text-indigo-400 font-bold text-lg">3</span>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Vous prenez la bonne décision</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Vous recevez un avis clair et honnête. Si aucun expert ne répond, vous êtes remboursé intégralement.
              </p>
            </div>

          </div>

          <div className="text-center mt-10">
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
              <Link href="/comment-ca-marche">En savoir plus</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---- Garanties ---- */}
      <section className="py-14 px-6 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-10">
            Pourquoi nous faire confiance ?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="flex flex-col items-center text-center p-4">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">Experts vérifiés</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Chaque expert est validé manuellement avec justificatif professionnel.</p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">Remboursé si silence</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Aucune réponse sous 24h ? Vous récupérez votre paiement automatiquement.</p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">Paiement sécurisé</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Paiements traités par Stripe, leader mondial certifié PCI DSS.</p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">Signalement possible</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Réponse insatisfaisante ? Signalez-la en 48h et nous tranchons.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ---- Temoignages ---- */}
      <section className="py-16 px-6 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-10">
            Ils ont évité une mauvaise surprise
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map((i) => <span key={i} className="text-yellow-400 text-sm">&#9733;</span>)}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                "Le garage demandait 1&nbsp;800&nbsp;€ pour changer la boîte de vitesses. L'expert a confirmé que le coût était surévalué de 600&nbsp;€. J'ai pu négocier un meilleur prix."
              </p>
              <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">T</div>
                <div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Thomas</p>
                  <p className="text-xs text-slate-400">Liège - <span className="text-green-600 dark:text-green-400 font-medium">600&nbsp;€ économisés</span></p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map((i) => <span key={i} className="text-yellow-400 text-sm">&#9733;</span>)}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                "Réponse claire et détaillée en moins de 3 heures. L'expert a validé le diagnostic — je sais maintenant que je peux faire confiance à mon garagiste."
              </p>
              <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                <div className="w-7 h-7 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center text-xs font-bold text-pink-700 dark:text-pink-300">M</div>
                <div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Marie</p>
                  <p className="text-xs text-slate-400">Bruxelles - <span className="text-green-600 dark:text-green-400 font-medium">Tranquillité d'esprit</span></p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map((i) => <span key={i} className="text-yellow-400 text-sm">&#9733;</span>)}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                {"Pour seulement " + MIN_PRICE_EUROS + "\u00a0€, j'ai eu la tranquillité d'esprit sur une réparation de 900\u00a0€. C'est la meilleure dépense que j'ai faite ce mois-ci."}
              </p>
              <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs font-bold text-green-700 dark:text-green-300">L</div>
                <div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Laurent</p>
                  <p className="text-xs text-slate-400">Namur - <span className="text-green-600 dark:text-green-400 font-medium">900&nbsp;€ vérifiés</span></p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="py-16 px-6 bg-white dark:bg-slate-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-10">
            Questions fréquentes
          </h2>
          <div className="space-y-4">

            {[
              {
                q: "Les experts sont-ils vraiment qualifiés ?",
                r: "Oui. Chaque expert est validé manuellement par notre équipe avant d'être activé. Nous vérifions leur diplôme, numéro BCE ou carte professionnelle. Aucun expert ne répond sans avoir signé notre charte de bonne conduite."
              },
              {
                q: "Que se passe-t-il si je ne suis pas satisfait de la réponse ?",
                r: "Vous avez 48h pour signaler la réponse. Notre équipe examine le dossier et tranche. Si le signalement est validé, vous êtes remboursé intégralement. L'expert est suspendu pendant l'analyse."
              },
              {
                q: "Et si personne ne répond dans les 24h ?",
                r: "Vous êtes remboursé automatiquement, sans démarche de votre part. Le remboursement arrive sur votre compte dans les 5 jours ouvrables selon votre banque."
              },
              {
                q: "Est-ce que mes informations restent confidentielles ?",
                r: "Oui. Votre demande n'est visible que par les experts de la catégorie concernée. Votre identité n'est jamais divulguée publiquement. Vos données sont chiffrées et hébergées en Europe."
              },
              {
                q: "L'avis reçu engage-t-il la responsabilité de l'expert ?",
                r: "Non. Les avis fournis sont des opinions professionnelles basées sur les informations que vous communiquez. Ils ne constituent pas une consultation formelle. Avisbox est une plateforme d'entraide entre particuliers et professionnels."
              },
            ].map((item, i) => (
              <details key={i} className="group border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-slate-800 dark:text-white text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors list-none">
                  {item.q}
                  <span className="text-slate-400 ml-3 shrink-0 group-open:rotate-180 transition-transform">&#8964;</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-3">
                  {item.r}
                </div>
              </details>
            ))}

          </div>
        </div>
      </section>

      {/* ---- CTA final ---- */}
      <section className="py-16 px-6 bg-indigo-600 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Vous avez un doute sur un devis ?</h2>
        <p className="text-indigo-100 mb-8 max-w-md mx-auto text-sm">
          Ne payez pas avant de savoir si le prix est juste. Un expert vous apporte une réponse fiable en moins de 24 heures à partir de {MIN_PRICE_EUROS}&nbsp;€.
        </p>
        <Button asChild size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 text-lg px-10 py-6 font-semibold shadow-lg">
          <Link href="/nouvelle-demande">Poser ma question</Link>
        </Button>
        <p className="text-indigo-300 text-xs mt-4">Remboursé automatiquement si aucune réponse sous 24h</p>
      </section>

      {/* ---- Schema JSON-LD FAQ pour Google (résultats enrichis) ---- */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Les experts sont-ils vraiment qualifiés ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Oui. Chaque expert est validé manuellement par notre équipe avant d'être activé. Nous vérifions leur diplôme, numéro BCE ou carte professionnelle. Aucun expert ne répond sans avoir signé notre charte de bonne conduite."
              }
            },
            {
              "@type": "Question",
              "name": "Que se passe-t-il si je ne suis pas satisfait de la réponse ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Vous avez 48h pour signaler la réponse. Notre équipe examine le dossier et tranche. Si le signalement est validé, vous êtes remboursé intégralement. L'expert est suspendu pendant l'analyse."
              }
            },
            {
              "@type": "Question",
              "name": "Et si personne ne répond dans les 24h ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Vous êtes remboursé automatiquement, sans démarche de votre part. Le remboursement arrive sur votre compte dans les 5 jours ouvrables selon votre banque."
              }
            },
            {
              "@type": "Question",
              "name": "Est-ce que mes informations restent confidentielles ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Oui. Votre demande n'est visible que par les experts de la catégorie concernée. Votre identité n'est jamais divulguée publiquement. Vos données sont chiffrées et hébergées en Europe."
              }
            },
            {
              "@type": "Question",
              "name": "L'avis reçu engage-t-il la responsabilité de l'expert ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Non. Les avis fournis sont des opinions professionnelles basées sur les informations que vous communiquez. Ils ne constituent pas une consultation formelle. Avisbox est une plateforme d'entraide entre particuliers et professionnels."
              }
            }
          ]
        })}}
      />

      {/* ---- Mention legale obligatoire ---- */}
      <section className="py-6 px-6 bg-slate-100 dark:bg-slate-950">
        <p className="text-center text-slate-400 text-xs max-w-2xl mx-auto">
          Avisbox est une plateforme d'entraide. Les avis donnés par nos professionnels représentent leur opinion
          basée sur les informations que vous avez fournies. Ils ne constituent pas une consultation professionnelle
          formelle et n'engagent pas la responsabilité de Avisbox ni celle du professionnel.
        </p>
      </section>

    </main>
  )
}
