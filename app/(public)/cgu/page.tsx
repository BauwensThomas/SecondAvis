import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions générales d\'utilisation',
}

// Page CGU - obligatoire légalement en Belgique
export default function CGUPage() {
  const appName      = process.env.NEXT_PUBLIC_APP_NAME ?? 'SecondAvis'
  const emailContact = process.env.EMAIL_CONTACT ?? 'contact@secondavis.be'
  return (
    <main className="page-container">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Conditions générales d'utilisation</h1>
      <p className="text-sm text-slate-400 mb-10">Dernière mise à jour : avril 2026</p>

      <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-slate-700">

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">1. Présentation de la plateforme</h2>
          <p>
            {appName} est une plateforme d'entraide en ligne qui met en relation des particuliers souhaitant obtenir un avis professionnel sur leur situation
            avec des professionnels vérifiés dans différents domaines (mécanique automobile, immobilier,
            travaux, assurance, droit du travail, comptabilité).
          </p>
          <p className="mt-3">
            Les avis fournis par les professionnels de la plateforme sont des opinions basées sur les
            informations communiquées par l'utilisateur. Ils ne constituent pas une consultation
            professionnelle formelle engageant la responsabilité de {appName} ou du professionnel.
            {appName} décline toute responsabilité quant aux décisions prises sur la base de ces avis.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">2. Accès au service</h2>
          <p>
            L'utilisation de la plateforme est réservée aux personnes majeures (18 ans ou plus).
            En créant un compte, l'utilisateur confirme avoir l'âge requis.
            L'inscription est gratuite. Seule la soumission d'une demande d'avis est payante.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">3. Prix et paiement</h2>
          <p>
            Chaque demande d'avis est facturée <strong>9,00 euros TTC</strong> au moment de la soumission.
            Le paiement est sécurisé par Stripe. {appName} ne stocke aucune donnée de carte bancaire.
          </p>
          <p className="mt-3">
            La mention "TVA non applicable - Article 56bis du Code de la TVA" s'applique tant que
            {appName} opère en dessous du seuil de franchise de TVA.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">4. Politique de remboursement</h2>
          <p>
            Si aucun professionnel ne répond à la demande dans le délai imparti (24 heures en semaine,
            lundi suivant si soumise le vendredi), l'utilisateur est automatiquement remboursé de 9,00 euros.
            Le remboursement est effectué sur la carte bancaire utilisée lors du paiement, dans un délai de
            5 à 10 jours ouvrables selon l'établissement bancaire.
          </p>
          <p className="mt-3">
            En cas de signalement d'une réponse non satisfaisante, {appName} se réserve le droit de
            rembourser l'utilisateur après analyse du dossier. La décision est prise dans les meilleurs délais
            par l'équipe de {appName}. Le remboursement, s'il est accordé, est effectué dans un délai de
            5 jours après la décision.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Obligations des utilisateurs</h2>
          <p>L'utilisateur s'engage à :</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Fournir des informations exactes et complètes lors de sa demande</li>
            <li>Ne pas utiliser la plateforme à des fins frauduleuses ou illégales</li>
            <li>Ne pas tenter de contacter directement les professionnels en dehors de la plateforme avant d'avoir reçu une réponse</li>
            <li>Respecter les professionnels et l'équipe de {appName}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">6. Obligations des professionnels</h2>
          <p>
            Chaque professionnel inscrit sur {appName} a signé une charte de bonne conduite avant activation
            de son compte. Il s'engage notamment à fournir des avis honnêtes, à ne pas solliciter les
            utilisateurs commercialement dans ses réponses, et à ne pas donner de conseils illégaux.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Limitation de responsabilité</h2>
          <p>
            {appName} est une plateforme d'entraide. Les avis fournis sont des opinions professionnelles
            et ne constituent pas des consultations formelles. {appName} ne peut être tenu responsable
            des décisions prises par les utilisateurs sur la base des avis reçus, ni des préjudices
            directs ou indirects qui en résulteraient.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">8. Protection des données personnelles</h2>
          <p>
            {appName} collecte et traite les données personnelles dans le respect du Règlement Général
            sur la Protection des Données (RGPD) et de la loi belge du 30 juillet 2018.
            Pour en savoir plus, consultez notre{' '}
            <a href="/politique-confidentialite" className="text-indigo-600 hover:underline">
              politique de confidentialité
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">9. Loi applicable</h2>
          <p>
            Les présentes conditions générales sont soumises au droit belge.
            Tout litige sera soumis aux tribunaux compétents de Belgique.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">10. Contact</h2>
          <p>
            Pour toute question relative aux présentes CGU, contactez-nous à l'adresse :{' '}
            <a href={`mailto:${emailContact}`} className="text-indigo-600 hover:underline">
              {emailContact}
            </a>
          </p>
        </section>

      </div>
    </main>
  )
}
