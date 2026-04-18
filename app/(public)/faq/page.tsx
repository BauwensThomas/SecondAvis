import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Questions fréquentes',
  description: 'Toutes les réponses à vos questions sur Avisbox : fonctionnement, experts, paiement, remboursement et confidentialité.',
}

// Questions regroupées par thème
const sections = [
  {
    theme: 'Fonctionnement',
    questions: [
      {
        q: 'Comment fonctionne Avisbox ?',
        r: 'Vous décrivez votre situation (devis douteux, diagnostic incompris, document à vérifier), vous payez un petit montant, et un expert vérifié dans votre domaine vous répond en moins de 24h. Si personne ne répond, vous êtes remboursé automatiquement.',
      },
      {
        q: 'Combien coûte une question ?',
        r: `Le tarif commence à partir de ${(Number(process.env.NEXT_PUBLIC_PRICE_MECANIQUE_CENTS) / 100).toFixed(2).replace('.', ',')} €. Le prix exact dépend de la catégorie choisie. Il est affiché clairement avant tout paiement.`,
      },
      {
        q: 'Dans quels domaines puis-je poser une question ?',
        r: 'Avisbox couvre la mécanique automobile, l\'immobilier, les devis travaux, les assurances, le droit du travail et la comptabilité pour indépendants.',
      },
      {
        q: 'Combien de temps faut-il pour recevoir une réponse ?',
        r: 'La réponse est garantie en moins de 24 heures les jours ouvrables. Si votre demande est soumise un vendredi, le délai court jusqu\'au lundi suivant à la même heure.',
      },
    ],
  },
  {
    theme: 'Experts',
    questions: [
      {
        q: 'Les experts sont-ils vraiment qualifiés ?',
        r: 'Oui. Chaque expert est vérifié manuellement par notre équipe avant d\'être activé. Nous contrôlons leur diplôme, leur numéro BCE belge ou leur carte professionnelle. Aucun expert ne peut répondre sans avoir signé notre charte de bonne conduite.',
      },
      {
        q: 'Qui sont les experts sur Avisbox ?',
        r: 'Ce sont des professionnels actifs ou retraités dans leur domaine : mécaniciens, agents immobiliers, experts en bâtiment, juristes, comptables. Leurs profils sont vérifiés et leurs réponses évaluées par les utilisateurs.',
      },
      {
        q: 'Puis-je choisir mon expert ?',
        r: 'Non. Votre demande est visible par tous les experts actifs dans la catégorie concernée. Le premier expert disponible et compétent vous répond. Cela garantit la rapidité de la réponse.',
      },
    ],
  },
  {
    theme: 'Paiement et remboursement',
    questions: [
      {
        q: 'Comment fonctionne le paiement ?',
        r: 'Le paiement est sécurisé par Stripe, leader mondial certifié PCI DSS. Vous payez par carte bancaire. Vos données de carte ne transitent jamais par nos serveurs.',
      },
      {
        q: 'Que se passe-t-il si personne ne répond dans les 24h ?',
        r: 'Vous êtes remboursé automatiquement et intégralement, sans aucune démarche de votre part. Le remboursement apparaît sur votre compte dans les 5 jours ouvrables selon votre banque.',
      },
      {
        q: 'Que se passe-t-il si je ne suis pas satisfait de la réponse ?',
        r: 'Vous disposez de 48h après réception pour signaler la réponse. Notre équipe examine le dossier et tranche. Si votre signalement est validé, vous êtes remboursé intégralement. Si la réponse est confirmée correcte, aucun remboursement n\'est effectué.',
      },
      {
        q: 'Puis-je demander un remboursement après les 48h ?',
        r: 'Non. La fenêtre de signalement est de 48h après réception de la réponse. Passé ce délai, le dossier est considéré comme clôturé et l\'expert est payé automatiquement.',
      },
    ],
  },
  {
    theme: 'Confidentialité et sécurité',
    questions: [
      {
        q: 'Mes informations sont-elles confidentielles ?',
        r: 'Oui. Votre demande est visible uniquement par les experts de la catégorie concernée. Votre identité complète n\'est jamais divulguée. Vos données sont chiffrées et hébergées en Europe.',
      },
      {
        q: 'L\'avis reçu engage-t-il la responsabilité de l\'expert ?',
        r: 'Non. Les avis fournis sur Avisbox sont des opinions professionnelles basées sur les informations que vous communiquez. Ils ne constituent pas une consultation professionnelle formelle et n\'engagent pas la responsabilité d\'Avisbox ni celle du professionnel.',
      },
      {
        q: 'Comment exercer mes droits RGPD ?',
        r: 'Vous pouvez accéder à vos données, les corriger ou demander leur suppression depuis votre espace "Mon compte". Vous pouvez aussi nous contacter directement via notre page Politique de confidentialité.',
      },
    ],
  },
]

// Page FAQ dédiée avec schema JSON-LD pour les résultats enrichis Google
export default function FaqPage() {
  const toutesLesQuestions = sections.flatMap((s) => s.questions)

  return (
    <main className="page-container py-12">

      {/* En-tête */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Questions fréquentes</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm">
          Vous ne trouvez pas la réponse ?{' '}
          <Link href="/comment-ca-marche" className="text-indigo-600 hover:underline">
            Consultez notre guide complet
          </Link>{' '}
          ou{' '}
          <Link href={`mailto:${process.env.EMAIL_CONTACT ?? 'contact@avisbox.be'}`} className="text-indigo-600 hover:underline">
            contactez-nous
          </Link>.
        </p>
      </div>

      {/* Questions par thème */}
      <div className="max-w-2xl mx-auto space-y-10">
        {sections.map((section) => (
          <div key={section.theme}>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
              {section.theme}
            </h2>
            <div className="space-y-3">
              {section.questions.map((item, i) => (
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
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-14">
        <p className="text-slate-600 dark:text-slate-300 font-medium mb-4">Prêt à poser votre question ?</p>
        <Link href="/nouvelle-demande" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors">
          Poser ma question
        </Link>
      </div>

      {/* Schema JSON-LD FAQ pour Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": toutesLesQuestions.map((item) => ({
            "@type": "Question",
            "name": item.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.r,
            },
          })),
        })}}
      />

    </main>
  )
}
