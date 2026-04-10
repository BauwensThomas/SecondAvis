import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Comment ça marche',
  description: 'Découvrez comment obtenir un avis professionnel en moins de 24h pour 9 euros sur SecondAvis.',
}

// Page d'explication du service - processus en étapes et FAQ
export default function CommentCaMarchePage() {
  return (
    <main className="page-container">

      <h1 className="text-3xl font-bold text-slate-900 mb-3">Comment ça marche ?</h1>
      <p className="text-slate-500 text-base mb-12">
        Un avis professionnel vérifié en moins de 24h, pour 9 euros.
        Remboursé automatiquement si personne ne répond.
      </p>

      {/* Étapes */}
      <section className="mb-14">
        <ol className="space-y-8">
          {[
            {
              n: '1',
              titre: 'Décrivez votre situation',
              desc: 'Choisissez une catégorie (mécanique, immobilier, travaux...) et décrivez votre situation en quelques lignes. Joignez des photos ou un document si nécessaire.',
              detail: 'Plus votre description est précise, meilleure sera la réponse.',
            },
            {
              n: '2',
              titre: 'Payez en toute sécurité',
              desc: 'Le paiement de 9 euros est traité de manière sécurisée. Votre argent est réservé, mais ne sera encaissé qu\'après réception d\'une réponse.',
              detail: 'Remboursement automatique si aucun expert ne répond dans les 24 heures.',
            },
            {
              n: '3',
              titre: 'Un expert vérifié vous répond',
              desc: 'Un professionnel vérifié dans votre domaine analyse votre situation et vous apporte un avis clair et honnête, généralement sous quelques heures.',
              detail: 'Tous nos experts ont fourni un justificatif de leur expertise.',
            },
            {
              n: '4',
              titre: 'Vous recevez votre avis',
              desc: 'Vous recevez la réponse de l\'expert directement dans votre espace. Si celui-ci a laissé ses coordonnées, vous pouvez le contacter pour aller plus loin.',
              detail: 'Si la réponse ne vous convient pas, vous pouvez la signaler dans les 48 heures.',
            },
          ].map((etape) => (
            <li key={etape.n} className="flex gap-5">
              <span className="w-10 h-10 rounded-full bg-indigo-600 text-white text-base font-bold flex items-center justify-center shrink-0 mt-0.5">
                {etape.n}
              </span>
              <div>
                <p className="font-semibold text-slate-900 text-lg mb-1">{etape.titre}</p>
                <p className="text-slate-600 text-sm leading-relaxed">{etape.desc}</p>
                <p className="text-indigo-600 text-xs mt-1">{etape.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Garanties */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Nos garanties</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-100 rounded-xl p-5 text-center">
            <p className="text-2xl mb-2">✓</p>
            <p className="font-semibold text-slate-800 text-sm">Remboursé si pas de réponse</p>
            <p className="text-xs text-slate-500 mt-1">Automatiquement, sous 5 jours</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-5 text-center">
            <p className="text-2xl mb-2">✓</p>
            <p className="font-semibold text-slate-800 text-sm">Experts vérifiés</p>
            <p className="text-xs text-slate-500 mt-1">Justificatif professionnel exigé</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-5 text-center">
            <p className="text-2xl mb-2">✓</p>
            <p className="font-semibold text-slate-800 text-sm">Paiement sécurisé</p>
            <p className="text-xs text-slate-500 mt-1">Données bancaires protégées</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Questions fréquentes</h2>
        <div className="space-y-5">
          {[
            {
              q: 'Que se passe-t-il si personne ne répond ?',
              r: 'Si aucun expert ne répond dans les 24 heures (ou le lundi suivant si votre demande est soumise le vendredi), vous êtes automatiquement remboursé de 9 euros. Aucune démarche de votre part n\'est nécessaire.',
            },
            {
              q: 'Est-ce une vraie consultation professionnelle ?',
              r: 'Non. SecondAvis est une plateforme d\'entraide. Les avis fournis sont des opinions professionnelles basées sur les informations communiquées. Ils ne constituent pas des consultations formelles engageant la responsabilité du professionnel.',
            },
            {
              q: 'Comment sont vérifiés les experts ?',
              r: 'Chaque expert doit fournir un justificatif de son expertise (diplôme, numéro BCE, carte professionnelle...). Notre équipe vérifie chaque dossier manuellement avant d\'activer le compte.',
            },
            {
              q: 'La réponse reçue ne me convient pas. Que faire ?',
              r: 'Vous avez 48 heures après réception pour signaler un problème. Si votre signalement est retenu après analyse, vous êtes remboursé intégralement.',
            },
            {
              q: 'Puis-je contacter l\'expert directement ?',
              r: 'Oui. Après avoir reçu une réponse, vous pouvez consulter le profil public de l\'expert. Si celui-ci a laissé ses coordonnées, vous pouvez le contacter directement pour aller plus loin.',
            },
            {
              q: 'Mes informations sont-elles confidentielles ?',
              r: 'Oui. Votre demande n\'est visible que par les experts de la catégorie concernée, et uniquement pour y répondre. Aucune information n\'est partagée à des fins commerciales.',
            },
          ].map((item, i) => (
            <div key={i} className="border-b border-slate-100 pb-5">
              <p className="font-medium text-slate-800 mb-1">{item.q}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{item.r}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/nouvelle-demande"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-3 rounded-xl transition-colors"
        >
          Poser ma question - 9 euros
        </Link>
        <p className="text-xs text-slate-400 mt-3">
          Remboursé automatiquement si aucun expert ne répond dans les 24h
        </p>
      </div>

    </main>
  )
}
