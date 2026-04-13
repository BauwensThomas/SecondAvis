import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Comment bien poser ma question',
  description: 'Conseils pratiques pour rédiger une demande claire et obtenir la meilleure réponse possible de nos experts.',
}

// Page d'aide à la rédaction - guide par catégorie pour bien formuler sa demande
export default function CommentPoserMaQuestionPage() {
  return (
    <main className="page-container bg-white dark:bg-[#0f172a] min-h-screen transition-colors">

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Comment bien poser ma question ?</h1>
      <p className="text-slate-500 dark:text-slate-300 text-base mb-10">
        Plus votre description est précise, meilleure sera la réponse de l'expert.
        Voici nos conseils selon votre situation.
      </p>

      <div className="space-y-8">

        {/* Règle générale */}
        <div className="bg-indigo-50 dark:bg-blue-950 border border-indigo-100 dark:border-blue-900 rounded-xl p-5">
          <p className="text-sm font-semibold text-indigo-800 dark:text-blue-300 mb-2">La règle d'or</p>
          <p className="text-sm text-indigo-700 dark:text-blue-200">
            Imaginez que vous expliquez votre situation à un ami professionnel au téléphone.
            Donnez-lui tout ce dont il a besoin pour vous aider : les faits, les chiffres,
            les documents. Plus c'est précis, plus la réponse est utile.
          </p>
        </div>

        {/* Mécanique */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔧</span>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mécanique automobile</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Mentionnez systématiquement :</p>
          <ul className="text-sm text-slate-700 dark:text-slate-200 space-y-1 list-disc list-inside mb-4">
            <li>La marque, le modèle, l'année et le kilométrage du véhicule</li>
            <li>La description précise du problème (bruit, voyant allumé, comportement anormal)</li>
            <li>Depuis combien de temps le problème est apparu</li>
            <li>Ce que le garage vous dit et le montant du devis</li>
          </ul>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 text-xs text-slate-500 dark:text-slate-300">
            <p className="font-medium text-slate-600 dark:text-slate-200 mb-1">Exemple de bonne description :</p>
            <p className="italic">
              "Peugeot 308, 2018, 95 000 km. Depuis 2 semaines, bruit de ferraille à l'avant droit
              en virant. Le garage dit que les rotules de triangle sont usées et demande 480 euros
              pièces et main-d'oeuvre inclus. Est-ce normal pour ce kilométrage et ce prix ?"
            </p>
          </div>
        </section>

        {/* Immobilier */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🏠</span>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Immobilier</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Précisez :</p>
          <ul className="text-sm text-slate-700 dark:text-slate-200 space-y-1 list-disc list-inside mb-4">
            <li>S'il s'agit d'un achat, d'une vente ou d'une location</li>
            <li>Le type de bien (appartement, maison, terrain) et la commune</li>
            <li>Le montant en jeu et la nature de votre doute</li>
            <li>Joignez le document concerné si possible (mandat, bail, compromis)</li>
          </ul>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 text-xs text-slate-500 dark:text-slate-300">
            <p className="font-medium text-slate-600 dark:text-slate-200 mb-1">Exemple :</p>
            <p className="italic">
              "Je vends mon appartement à Liège (80m²). L'agence me demande 4% d'honoraires
              soit 8 000 euros sur un prix de 200 000 euros. Est-ce normal en Belgique
              et est-ce négociable ?"
            </p>
          </div>
        </section>

        {/* Travaux */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔨</span>
            <h2 className="text-lg font-semibold text-slate-900">Travaux</h2>
          </div>
          <p className="text-sm text-slate-600 mb-3">Joignez idéalement le devis complet et précisez :</p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside mb-4">
            <li>Le type de travaux (plomberie, électricité, toiture, rénovation...)</li>
            <li>La superficie concernée et le type de logement</li>
            <li>Le montant total du devis avec le détail des postes si possible</li>
            <li>Si vous avez d'autres devis et pour quels montants</li>
          </ul>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 text-xs text-slate-500 dark:text-slate-300">
            <p className="font-medium text-slate-600 dark:text-slate-200 mb-1">Exemple :</p>
            <p className="italic">
              "Devis pour remplacement chaudière gaz dans maison de 120m², Namur.
              L'artisan demande 3 800 euros pose incluse pour une Vaillant ecoTEC.
              Un autre propose 2 900 euros pour une De Dietrich. La différence est-elle justifiée ?"
            </p>
          </div>
        </section>

        {/* Assurance */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📋</span>
            <h2 className="text-lg font-semibold text-slate-900">Assurance</h2>
          </div>
          <p className="text-sm text-slate-600 mb-3">Indiquez :</p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside mb-4">
            <li>Le type d'assurance (auto, habitation, vie, hospitalisation...)</li>
            <li>La nature du sinistre ou du litige</li>
            <li>Ce que l'assureur a répondu et pourquoi vous doutez</li>
            <li>Joignez le courrier de refus ou la clause en question si possible</li>
          </ul>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 text-xs text-slate-500 dark:text-slate-300">
            <p className="font-medium text-slate-600 dark:text-slate-200 mb-1">Exemple de bonne description :</p>
            <p className="italic">
              "J'ai déclaré un dégât des eaux à mon assurance habitation. Ils refusent de couvrir les frais
              de réparation en prétextant que le sinistre est dû à un défaut d'entretien de ma part, ce qui
              me semble injustifié. Voici leur courrier de refus et les photos des dégâts. Que puis-je faire ?"
            </p>
          </div>
        </section>

        {/* Droit du travail */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚖️</span>
            <h2 className="text-lg font-semibold text-slate-900">Droit du travail</h2>
          </div>
          <p className="text-sm text-slate-600 mb-3">Précisez :</p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside mb-4">
            <li>Votre type de contrat (CDI, CDD, intérim, indépendant) et votre ancienneté</li>
            <li>Le secteur d'activité (important pour les conventions collectives)</li>
            <li>La nature du problème (licenciement, préavis, heures supplémentaires...)</li>
            <li>Ce que votre employeur a dit ou écrit</li>
          </ul>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 text-xs text-slate-500 dark:text-slate-300">
            <p className="font-medium text-slate-600 dark:text-slate-200 mb-1">Exemple de bonne description :</p>
            <p className="italic">
              "Licenciement pour motif personnel, suite à un incident de comportement. L'employeur affirme
              que je ne respecte pas les règles de l'entreprise, mais je ne comprends pas pourquoi cela
              justifie un licenciement immédiat. Ai-je droit à un préavis ou une indemnité ?"
            </p>
          </div>
        </section>

        {/* Comptabilité */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📊</span>
            <h2 className="text-lg font-semibold text-slate-900">Comptabilité pour indépendants</h2>
          </div>
          <p className="text-sm text-slate-600 mb-3">Indiquez :</p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside mb-4">
            <li>Votre statut (indépendant à titre principal ou complémentaire)</li>
            <li>Depuis combien de temps vous êtes actif</li>
            <li>Le chiffre d'affaires approximatif si pertinent</li>
            <li>La question précise (TVA, cotisations INASTI, facturation, optimisation...)</li>
          </ul>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 text-xs text-slate-500 dark:text-slate-300"> 
            <p className="font-medium text-slate-600 dark:text-slate-200 mb-1">Exemple de bonne description :</p>
            <p className="italic">
              "Je suis indépendant depuis 2 ans et j'ai un chiffre d'affaires annuel d'environ 50 000 euros.
              Je souhaite savoir si je suis concerné par les nouvelles réglementations sur la TVA et les cotisations INASTI. Comment dois-je m'y préparer ? "
            </p> 
          </div>

        </section>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link
            href="/nouvelle-demande"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-xl transition-colors"
          >
            Poser ma question
          </Link>
          <p className="text-xs text-slate-400 dark:text-slate-300 mt-3">Remboursé automatiquement si aucun expert ne répond dans les 24h</p>
        </div>

      </div>
    </main>
  )
}
