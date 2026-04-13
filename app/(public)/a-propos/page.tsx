import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'À propos',
  description: 'Découvrez l\'histoire et la mission de Avisbox, la plateforme qui démocratise l\'accès aux avis professionnels.',
}

// Page à propos - présentation du projet et de sa mission
export default function AProposPage() {
  const emailContact = process.env.EMAIL_CONTACT ?? 'contact@avisbox.be'

  return (
    <main className="page-container">

      <h1 className="text-3xl font-bold text-slate-900 mb-4">À propos de Avisbox</h1>
      <p className="text-slate-500 text-base mb-12">
        La plateforme qui rend les avis professionnels accessibles à tous.
      </p>

      <div className="space-y-10 text-slate-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">L'idée de départ</h2>
          <p>
            Tout est parti d'une question simple : pourquoi est-ce si difficile de savoir si un devis
            est honnête ou si un diagnostic est correct ? On paie des centaines, parfois des milliers
            d'euros sans vraiment avoir les moyens de vérifier.
          </p>
          <p className="mt-3">
            Avisbox est né de cette frustration. L'idée : créer un endroit où n'importe qui peut
            soumettre sa situation à un vrai professionnel, obtenir un avis indépendant en moins de 24h,
            pour un prix décent. Pas de jargon, pas de frais cachés, juste des conseils clairs et honnêtes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Notre mission</h2>
          <p>
            Démocratiser l'accès aux avis professionnels. Pas besoin de connaître quelqu'un dans
            le secteur, pas besoin de payer une consultation à 150 euros de l'heure. Un avis clair,
            rapide et accessible - c'est tout ce qu'on veut offrir.
          </p>
          <p className="mt-3">
            On croit que chaque personne mérite de pouvoir se défendre face à un devis gonflé,
            un contrat douteux ou un diagnostic incompréhensible. L'information ne devrait pas
            être un privilège.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Nos valeurs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {[
              {
                titre: 'Transparence',
                texte: "Pas de frais cachés. Pas d'abonnement. remboursement automatique si pas de réponse dans les 24h."
              },
              {
                titre: 'Entraide',
                texte: "Des professionnels qui partagent leur expertise pour aider des gens qui en ont besoin."
              },
              {
                titre: 'Protection',
                texte: "Experts vérifiés, charte de bonne conduite, système de signalement intégré."
              }
            ].map(({ titre, texte }) => (
              <div
                key={titre}
                className="bg-green-100 border border-green-200 rounded-xl p-4 flex flex-col items-center justify-center text-center h-full min-h-[120px]
                  dark:bg-[#134e3a] dark:border-green-700"
              >
                <p className="font-semibold text-slate-800 mb-1 dark:text-green-200">{titre}</p>
                <p className="text-sm text-slate-600 dark:text-green-100 dark:opacity-100">
                  {texte}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Qui sommes-nous ?</h2>
          <p>
            Avisbox est développé par un passionné  en informatique, qui a identifié les problèmes concrets
            que rencontrent les gens au quotidien. Ce projet est né de l'envie de construire quelque
            chose d'utile, de concret, qui puisse faire une vraie différence dans la vie des 
            personnes.
          </p>
          <p className="mt-3">
            Le projet est actuellement en phase de test (avril 2026). Si vous avez des retours, des idées ou
            des questions, on est vraiment à l'écoute.
          </p>
        </section>

        <section className="bg-indigo-50 dark:bg-[#162333] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Vous voulez devenir expert ?</h2>
          <p className="text-slate-600 text-sm mb-4">
            Vous êtes professionnel et souhaitez partager votre expertise ? Rejoignez nos experts vérifiés et contribuez à aider des particuliers tout en développant votre visibilité. Chaque réponse validée donne lieu à une rémunération automatique, versée sur votre compte Stripe.
          </p>
          <Link
            href="/devenir-expert"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            En savoir plus
          </Link>
        </section>


        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Contact</h2>
          <p>
            Pour toute question, suggestion ou demande :{' '}
            <a
              href={`mailto:${emailContact}`}
              className="text-indigo-600 dark:text-green-400 hover:text-indigo-800 dark:hover:text-green-200 transition-colors"
            >
              {emailContact}
            </a>
          </p>
          {/* Ancien style ou à compléter selon l'état initial, à remettre si besoin */}
        </section>

      </div>
    </main>
  )
}
