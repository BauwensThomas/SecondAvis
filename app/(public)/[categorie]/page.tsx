import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

// Contenu spécifique à chaque catégorie
const CATEGORIES: Record<string, {
  slug: string
  titre: string
  sousTitre: string
  descriptionSeo: string
  exemples: string[]
  casTypes: { question: string; detail: string }[]
  faq: { q: string; r: string }[]
  prixEnv: string
}> = {
  mecanique: {
    slug: 'mecanique',
    titre: 'Vérifiez votre devis de garage en Belgique',
    sousTitre: 'Un mécanicien vérifié analyse votre devis ou diagnostic en moins de 24h.',
    descriptionSeo: 'Votre devis de garage vous semble trop cher ? Un mécanicien professionnel vérifié vous répond en moins de 24h. Panne incomprise, diagnostic douteux, kilométrage suspect - obtenez un avis indépendant.',
    exemples: ['Devis freins ou embrayage trop élevé', 'Diagnostic de panne incompris', 'Kilométrage falsifié au compteur', 'Courroie de distribution à 1200€ - est-ce normal ?', 'Mon garagiste insiste pour changer une pièce non défectueuse'],
    casTypes: [
      { question: 'Mon garage me demande 800€ pour une courroie de distribution, c\'est normal ?', detail: 'Un mécanicien vérifié analyse le devis, compare avec les prix du marché belge et vous dit si c\'est justifié.' },
      { question: 'Voyant moteur allumé, le garage dit que ça coûte 1500€ à réparer.', detail: 'Avant de payer, faites vérifier le diagnostic par un professionnel indépendant.' },
      { question: 'Le vendeur dit que la voiture a 80 000 km, mais j\'ai un doute.', detail: 'Un expert peut vous guider sur les signes d\'usure à vérifier et les démarches pour contrôler l\'historique.' },
    ],
    faq: [
      { q: 'Dois-je envoyer le devis en photo ?', r: 'Oui, joindre une photo du devis aide l\'expert à analyser chaque ligne. Vous pouvez aussi décrire les postes par écrit.' },
      { q: 'L\'expert peut-il venir inspecter ma voiture ?', r: 'Non. Avisbox fournit un avis professionnel à distance basé sur les informations que vous transmettez. Ce n\'est pas une inspection physique.' },
      { q: 'Que faire si le devis est effectivement trop cher ?', r: 'L\'expert vous explique pourquoi et vous donne des arguments concrets pour négocier ou aller dans un autre garage.' },
    ],
    prixEnv: 'NEXT_PUBLIC_PRICE_MECANIQUE_CENTS',
  },
  immo: {
    slug: 'immo',
    titre: 'Vérifiez votre contrat immobilier avant de signer',
    sousTitre: 'Un professionnel immobilier vérifié analyse votre document en moins de 24h.',
    descriptionSeo: 'Honoraires d\'agence trop élevés, clause abusive dans un compromis de vente, état des lieux contesté - un professionnel immobilier vérifié vous répond en moins de 24h en Belgique.',
    exemples: ['Honoraires d\'agence excessifs', 'Clause suspecte dans un compromis de vente', 'État des lieux contesté par le propriétaire', 'Estimation biaisée pour forcer la vente', 'Mandat de vente avec conditions abusives'],
    casTypes: [
      { question: 'L\'agence me demande 3% d\'honoraires sur la vente, est-ce légal en Belgique ?', detail: 'Un professionnel immobilier vérifie si les honoraires sont conformes aux pratiques du marché belge et à la réglementation.' },
      { question: 'Mon propriétaire retient ma garantie locative pour des dégâts que je n\'ai pas causés.', detail: 'Un expert analyse l\'état des lieux et vous dit si la retenue est justifiée ou contestable.' },
      { question: 'Le compromis contient une clause que je ne comprends pas. Dois-je signer ?', detail: 'Jamais sans avoir compris. Un professionnel décrypte la clause et vous dit si elle est normale ou problématique.' },
    ],
    faq: [
      { q: 'Puis-je joindre mon document en PDF ?', r: 'Oui, les PDF, photos de documents et Word sont acceptés. Joignez toujours le document complet pour une analyse précise.' },
      { q: 'L\'avis remplace-t-il un notaire ou un avocat ?', r: 'Non. C\'est un avis professionnel indépendant qui vous aide à comprendre votre situation. Pour signer un acte, consultez toujours un notaire.' },
      { q: 'Combien coûtent habituellement les honoraires d\'agence en Belgique ?', r: 'Entre 2% et 4% du prix de vente selon les agences et les régions. Un expert vous dira si le montant demandé est dans la norme.' },
    ],
    prixEnv: 'NEXT_PUBLIC_PRICE_IMMO_CENTS',
  },
  travaux: {
    slug: 'travaux',
    titre: 'Votre devis travaux est-il trop cher ?',
    sousTitre: 'Un expert en bâtiment vérifié analyse votre devis en moins de 24h.',
    descriptionSeo: 'Devis plombier, électricien ou maçon suspect ? Un expert en bâtiment vérifié analyse votre devis et vous dit s\'il est justifié. Évitez les arnaques artisans en Belgique.',
    exemples: ['Devis plombier ou électricien gonflé', 'Artisan qui demande 100% d\'acompte', 'Travaux réalisés sans permis d\'urbanisme', 'Malfaçons non reconnues par l\'entrepreneur', 'Devis de rénovation sans détail des postes'],
    casTypes: [
      { question: 'Un plombier me demande 1800€ pour changer un chauffe-eau. C\'est normal ?', detail: 'Un expert compare votre devis avec les prix du marché belge et analyse si chaque poste est justifié.' },
      { question: 'L\'entrepreneur a posé du carrelage mal aligné et refuse de corriger.', detail: 'Un expert vous explique vos recours légaux et comment faire valoir la garantie décennale en Belgique.' },
      { question: 'On me propose des travaux d\'isolation à 15 000€ avec prime RENOLUTION. Est-ce une arnaque ?', detail: 'Un expert vérifie si le devis est cohérent avec les primes disponibles et les prix du marché.' },
    ],
    faq: [
      { q: 'Dois-je avoir plusieurs devis pour que l\'expert puisse comparer ?', r: 'Non, mais c\'est recommandé. L\'expert peut analyser un seul devis et vous dire s\'il est dans la norme.' },
      { q: 'L\'expert peut-il venir sur chantier ?', r: 'Non, Avisbox fournit un avis à distance. Pour une expertise physique, il faut contacter un expert en bâtiment agréé.' },
      { q: 'Que faire si l\'artisan a déjà commencé les travaux et que le prix a explosé ?', r: 'L\'expert vous explique vos droits et les démarches possibles selon votre contrat.' },
    ],
    prixEnv: 'NEXT_PUBLIC_PRICE_TRAVAUX_CENTS',
  },
  assurance: {
    slug: 'assurance',
    titre: 'Votre assurance refuse de vous rembourser ?',
    sousTitre: 'Un expert en assurance vérifié analyse votre situation en moins de 24h.',
    descriptionSeo: 'Refus de remboursement injustifié, clause cachée dans votre contrat, sinistre mal évalué - un expert en assurance vérifié vous aide à comprendre vos droits en Belgique.',
    exemples: ['Refus de remboursement après sinistre', 'Clause d\'exclusion cachée dans le contrat', 'Indemnisation largement insuffisante', 'Résiliation abusive de votre contrat', 'Franchise appliquée de façon incorrecte'],
    casTypes: [
      { question: 'Mon assurance auto refuse de rembourser mon accident en invoquant une exclusion. Est-ce légal ?', detail: 'Un expert analyse votre contrat et la clause invoquée, et vous dit si le refus est fondé ou contestable.' },
      { question: 'Mon assurance habitation m\'offre 2000€ pour des dégâts des eaux que j\'estime à 8000€.', detail: 'Un expert vérifie si l\'indemnisation proposée correspond à ce que prévoit votre contrat.' },
      { question: 'Mon assureur a résilié mon contrat sans raison valable.', detail: 'Un expert analyse si la résiliation est légale selon les conditions générales et la loi belge.' },
    ],
    faq: [
      { q: 'Puis-je joindre mon contrat d\'assurance en PDF ?', r: 'Oui, et c\'est recommandé. L\'expert a besoin des conditions générales et particulières pour analyser votre situation.' },
      { q: 'L\'expert peut-il contacter mon assureur à ma place ?', r: 'Non. L\'expert vous donne un avis et des arguments. C\'est vous qui contactez votre assureur ou l\'Ombudsman des Assurances.' },
      { q: 'Que faire si l\'expert confirme que le refus est injustifié ?', r: 'Vous disposez d\'arguments écrits pour contester. En dernier recours, l\'Ombudsman des Assurances belge peut intervenir gratuitement.' },
    ],
    prixEnv: 'NEXT_PUBLIC_PRICE_ASSURANCE_CENTS',
  },
  travail: {
    slug: 'travail',
    titre: 'Vos droits au travail sont-ils respectés ?',
    sousTitre: 'Un juriste spécialisé en droit du travail vérifié vous répond en moins de 24h.',
    descriptionSeo: 'Licenciement abusif, heures supplémentaires non payées, clause de non-concurrence abusive - un juriste en droit du travail vérifié analyse votre situation en Belgique.',
    exemples: ['Licenciement dont vous contestez le motif', 'Heures supplémentaires non rémunérées', 'Clause de non-concurrence abusive', 'Rupture de période d\'essai contestable', 'Modification unilatérale de votre contrat'],
    casTypes: [
      { question: 'Mon employeur m\'a licencié pour faute grave, mais je conteste les faits.', detail: 'Un juriste analyse si le motif invoqué constitue bien une faute grave au sens de la loi belge et quels sont vos recours.' },
      { question: 'Je fais régulièrement des heures en plus qui ne sont jamais payées ni récupérées.', detail: 'Un expert vérifie votre situation selon la loi sur le travail belge et vous explique comment régulariser.' },
      { question: 'Mon contrat contient une clause de non-concurrence de 2 ans sur toute la Belgique.', detail: 'Un juriste vérifie si la clause est valide selon les conditions strictes imposées par la loi belge.' },
    ],
    faq: [
      { q: 'L\'avis remplace-t-il un avocat spécialisé ?', r: 'Non. C\'est un premier éclairage professionnel pour comprendre votre situation. Pour une procédure judiciaire, consultez un avocat en droit du travail.' },
      { q: 'Puis-je joindre mon contrat de travail ?', r: 'Oui, et c\'est recommandé pour que l\'expert analyse les clauses spécifiques de votre situation.' },
      { q: 'Quels délais pour contester un licenciement en Belgique ?', r: 'Généralement quelques mois selon le motif. Un expert vous précise les délais applicables à votre cas spécifique.' },
    ],
    prixEnv: 'NEXT_PUBLIC_PRICE_TRAVAIL_CENTS',
  },
  comptabilite: {
    slug: 'comptabilite',
    titre: 'Vos comptes d\'indépendant sont-ils en ordre ?',
    sousTitre: 'Un comptable vérifié analyse votre situation fiscale en moins de 24h.',
    descriptionSeo: 'Déclaration INASTI incorrecte, TVA indépendant, cotisations sociales ONSS - un comptable vérifié répond à vos questions fiscales et comptables en Belgique en moins de 24h.',
    exemples: ['Déclaration INASTI à vérifier', 'Questions sur la TVA en tant qu\'indépendant', 'Cotisations sociales ONSS incomprises', 'Erreur suspectée dans votre déclaration fiscale', 'Optimisation fiscale de base pour indépendant'],
    casTypes: [
      { question: 'Je suis indépendant complémentaire, dois-je payer des cotisations INASTI ?', detail: 'Un comptable vérifie votre situation et vous explique vos obligations exactes selon votre statut.' },
      { question: 'Mon comptable m\'a facturé des frais que je ne comprends pas. Sont-ils normaux ?', detail: 'Un expert analyse la facturation et vous dit si les honoraires correspondent aux prestations décrites.' },
      { question: 'Je viens de lancer mon activité - dois-je m\'assujettir à la TVA ?', detail: 'Un comptable vérifie selon votre activité et votre chiffre d\'affaires estimé si l\'assujettissement est obligatoire ou optionnel.' },
    ],
    faq: [
      { q: 'L\'avis remplace-t-il mon comptable habituel ?', r: 'Non. C\'est un second avis indépendant pour vérifier ou comprendre une situation spécifique. Votre comptable reste votre interlocuteur principal.' },
      { q: 'Puis-je joindre mes documents comptables ?', r: 'Oui, mais masquez les informations très sensibles si nécessaire. L\'expert peut travailler sur des extraits ou des chiffres anonymisés.' },
      { q: 'L\'expert connaît-il la réglementation belge spécifiquement ?', r: 'Oui. Tous nos experts comptables sont actifs en Belgique et maîtrisent l\'INASTI, l\'ONSS et la fiscalité belge.' },
    ],
    prixEnv: 'NEXT_PUBLIC_PRICE_COMPTABILITE_CENTS',
  },
}

const SLUGS_VALIDES = Object.keys(CATEGORIES)

// Tout slug non listé dans generateStaticParams retourne un 404
export const dynamicParams = false

// Génère les 6 pages statiquement au build
export async function generateStaticParams() {
  return SLUGS_VALIDES.map((slug) => ({ categorie: slug }))
}

// Métadonnées SEO dynamiques par catégorie
export async function generateMetadata({ params }: { params: Promise<{ categorie: string }> }): Promise<Metadata> {
  const { categorie } = await params
  const cat = CATEGORIES[categorie]
  if (!cat) return { title: 'Page introuvable' }

  return {
    title: cat.titre,
    description: cat.descriptionSeo,
  }
}

// Page de landing par catégorie - optimisée SEO avec contenu unique
export default async function LandingCategoriePage({ params }: { params: Promise<{ categorie: string }> }) {
  const { categorie } = await params
  const cat = CATEGORIES[categorie]

  if (!cat) notFound()

  const prix = (Number(process.env[cat.prixEnv]) / 100).toFixed(2).replace('.', ',')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  return (
    <main className="page-container py-12">

      {/* En-tête */}
      <div className="text-center mb-14">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
          {cat.titre}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto mb-8">
          {cat.sousTitre}
        </p>
        <Link
          href={`/nouvelle-demande?categorie=${cat.slug}`}
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
        >
          Faire vérifier ma situation
        </Link>
        <p className="text-slate-400 text-sm mt-3">
          Remboursé automatiquement si aucun expert ne répond sous 24h.
        </p>
      </div>

      {/* Exemples de situations */}
      <div className="max-w-3xl mx-auto mb-14">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-5 text-center">
          Situations fréquentes
        </h2>
        <ul className="space-y-2">
          {cat.exemples.map((ex, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm">
              <span className="text-indigo-500 mt-0.5 shrink-0">✓</span>
              {ex}
            </li>
          ))}
        </ul>
      </div>

      {/* Cas types */}
      <div className="max-w-3xl mx-auto mb-14">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 text-center">
          Exemples de questions posées
        </h2>
        <div className="space-y-4">
          {cat.casTypes.map((cas, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <p className="font-medium text-slate-800 dark:text-white text-sm mb-2">"{cas.question}"</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{cas.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comment ça marche */}
      <div className="max-w-3xl mx-auto mb-14">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 text-center">
          Comment ça marche ?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { num: '1', titre: 'Décrivez votre situation', texte: 'En quelques lignes, avec un document ou une photo si disponible.' },
            { num: '2', titre: 'Un expert vous répond', texte: `Paiement sécurisé de ${prix} €, réponse garantie sous 24h.` },
            { num: '3', titre: 'Vous agissez en confiance', texte: 'Avec un avis indépendant, vous négociez ou contestez en connaissance de cause.' },
          ].map((etape) => (
            <div key={etape.num} className="text-center p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center mx-auto mb-3">
                {etape.num}
              </div>
              <p className="font-semibold text-slate-800 dark:text-white text-sm mb-1">{etape.titre}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">{etape.texte}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ catégorie */}
      <div className="max-w-3xl mx-auto mb-14">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-5 text-center">
          Questions fréquentes
        </h2>
        <div className="space-y-3">
          {cat.faq.map((item, i) => (
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

      {/* CTA final */}
      <div className="text-center bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-10 max-w-3xl mx-auto">
        <p className="text-slate-800 dark:text-white font-bold text-xl mb-2">
          Prêt à obtenir un avis indépendant ?
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Un professionnel vérifié vous répond en moins de 24h. Remboursé automatiquement si ce n'est pas le cas.
        </p>
        <Link
          href={`/nouvelle-demande?categorie=${cat.slug}`}
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Faire vérifier ma situation
        </Link>
      </div>

      {/* Schema JSON-LD FAQ pour Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": cat.faq.map((item) => ({
            "@type": "Question",
            "name": item.q,
            "acceptedAnswer": { "@type": "Answer", "text": item.r },
          })),
        })}}
      />

      {/* Schema JSON-LD Service pour Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": cat.titre,
          "description": cat.descriptionSeo,
          "provider": {
            "@type": "Organization",
            "name": "Avisbox",
            "url": appUrl,
          },
          "areaServed": { "@type": "Country", "name": "Belgique" },
          "offers": {
            "@type": "Offer",
            "price": (Number(process.env[cat.prixEnv]) / 100).toFixed(2),
            "priceCurrency": "EUR",
          },
        })}}
      />

    </main>
  )
}
