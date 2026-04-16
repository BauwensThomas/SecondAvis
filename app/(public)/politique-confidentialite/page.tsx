import type { Metadata } from 'next'
import RgpdForm from '@/components/common/RgpdForm'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
}

// Page politique de confidentialité - obligatoire RGPD
export default function PolitiqueConfidentialitePage() {
  const appName      = process.env.NEXT_PUBLIC_APP_NAME ?? 'Avisbox'
  const emailContact = process.env.EMAIL_CONTACT ?? 'contact@avisbox.be'
  return (
    <main className="page-container">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Politique de confidentialité</h1>
      <p className="text-sm text-slate-400 mb-10">Dernière mise à jour : avril 2026</p>

      <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-slate-700">

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">1. Responsable du traitement</h2>
          <p>
            Le responsable du traitement des données personnelles collectées sur {appName} est
            l'exploitant de la plateforme, joignable à l'adresse :{' '}
            <a
              href={`mailto:${emailContact}`}
              className="text-indigo-600 dark:text-green-400 hover:text-indigo-800 dark:hover:text-green-200 transition-colors"
            >
              {emailContact}
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">2. Données collectées</h2>

          <h3 className="font-medium text-slate-800 mt-4 mb-2">Pour les utilisateurs (clients)</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Nom et prénom - nécessaires pour identifier le compte (base légale : contrat)</li>
            <li>Adresse email - nécessaire pour la connexion et les notifications (base légale : contrat)</li>
            <li>Téléphone - optionnel, fourni volontairement</li>
            <li>Contenu des demandes - nécessaire pour fournir le service (base légale : contrat)</li>
            <li>Identifiant client Stripe - nécessaire pour les paiements (base légale : contrat)</li>
            <li>Adresse IP de connexion - sécurité du compte (base légale : intérêt légitime)</li>
          </ul>

          <h3 className="font-medium text-slate-800 mt-4 mb-2">Pour les professionnels (experts)</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Nom, prénom, bio, ville - affichage du profil public (base légale : consentement)</li>
            <li>Adresse email et téléphone - connexion et notifications (base légale : contrat)</li>
            <li>Adresse postale complète - vérification d'identité (base légale : obligation légale)</li>
            <li>Justificatif professionnel - vérification de l'expertise (base légale : obligation légale)</li>
            <li>Identifiant Stripe Connect - versement des gains (base légale : contrat)</li>
            <li>IP au moment de la signature de la charte - preuve juridique (base légale : intérêt légitime)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">3. Durée de conservation</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Données de compte actif : conservées pendant toute la durée du compte</li>
            <li>Après suppression du compte : anonymisation immédiate des données personnelles</li>
            <li>Données financières (transactions) : conservées 7 ans (obligation comptable belge)</li>
            <li>Logs de signalements : conservés indéfiniment (preuve juridique)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">4. Partage des données</h2>
          <p>Les données sont partagées uniquement avec des prestataires techniques nécessaires au fonctionnement du service, dans les limites strictement indispensables :</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Hébergeur de base de données</strong> - données chiffrées au repos et en transit</li>
            <li><strong>Prestataire de paiement</strong> - données bancaires traitées directement par le prestataire, jamais stockées par {appName}</li>
            <li><strong>Prestataire d'envoi d'emails</strong> - adresse email transmise uniquement pour l'acheminement des messages</li>
            <li><strong>Hébergeur du site</strong> - logs techniques nécessaires au bon fonctionnement</li>
          </ul>
          <li><strong>Google AdSense</strong> - service publicitaire de Google LLC. Des cookies publicitaires sont déposés sur les pages blog uniquement, avec votre consentement. Google peut utiliser ces données pour personnaliser les annonces affichées. Pour en savoir plus : <a href="https://policies.google.com/privacy" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">politique de confidentialité de Google</a>.</li>
          <p className="mt-3">Aucune donnée personnelle identifiante n'est vendue à des tiers.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Vos droits</h2>
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Droit d'accès</strong> - obtenir une copie de toutes vos données (export JSON depuis votre compte)</li>
            <li><strong>Droit de rectification</strong> - corriger vos informations personnelles depuis votre profil</li>
            <li><strong>Droit à l'effacement</strong> - supprimer votre compte (certaines données financières sont conservées par obligation légale)</li>
            <li><strong>Droit à la portabilité</strong> - recevoir vos données dans un format lisible</li>
            <li><strong>Droit d'opposition</strong> - vous opposer à l'utilisation de vos données à des fins marketing</li>
          </ul>
          <p className="mt-3">
            Pour exercer ces droits, utilisez le formulaire ci-dessous. Nous traiterons votre demande dans les meilleurs délais.
          </p>
          <RgpdForm />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">6. Cookies et publicités</h2>
          <p className="mb-3">
            {appName} utilise les types de cookies suivants :
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Cookies essentiels</strong> - nécessaires à la connexion et au fonctionnement du site. Ils ne peuvent pas être refusés.
            </li>
            <li>
              <strong>Cookies publicitaires (Google AdSense)</strong> - présents uniquement sur les pages du blog.
              Google AdSense dépose des cookies pour afficher des publicités personnalisées en fonction de vos centres d'intérêt.
              Ces cookies sont déposés uniquement avec votre consentement (via le bandeau en bas de page).
              En cas de refus, les publicités ne s'affichent pas.
            </li>
          </ul>
          <p className="mt-3">
            Google LLC, en tant que prestataire publicitaire, peut traiter vos données conformément à sa propre politique de confidentialité.
            Vous pouvez gérer vos préférences publicitaires Google sur{' '}
            <a href="https://adssettings.google.com" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">
              adssettings.google.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Sécurité</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Toutes les communications sont chiffrées (HTTPS)</li>
            <li>Les données sont chiffrées au repos sur nos serveurs d'hébergement</li>
            <li>Les mots de passe ne sont jamais stockés en clair</li>
            <li>Les données de carte bancaire ne transitent jamais par nos serveurs. Elles sont traitées directement par notre prestataire de paiement certifié</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">8. Autorité de contrôle</h2>
          <p>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une plainte auprès de l’Autorité de protection des données (APD) :{' '}
              <strong>contact@apd-gba.be</strong> - Rue de la Presse 35, 1000 Bruxelles.
          </p>
        </section>

      </div>
    </main>
  )
}
