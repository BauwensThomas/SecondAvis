'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import ExpertGuard from '@/components/layout/ExpertGuard'
import SignaturePad from '@/components/common/SignaturePad'

// Page de la charte expert - signature si pas encore signée, lecture seule sinon
function ChartePage() {
  const router = useRouter()
  const [dejaSigne, setDejaSigne]       = useState<boolean | null>(null)
  const [signedAt, setSignedAt]         = useState<string | null>(null)
  const [pdfUrl, setPdfUrl]             = useState<string | null>(null)
  const [accepte, setAccepte]           = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [envoi, setEnvoi]               = useState(false)
  const [erreur, setErreur]             = useState('')

  // Vérifie si la charte a déjà été signée
  useEffect(() => {
    fetch('/api/expert/charte')
      .then((r) => r.json())
      .then((data) => {
        setDejaSigne(data.signed ?? false)
        setSignedAt(data.charte?.signed_at ?? null)
        setPdfUrl(data.charte?.pdf_url ?? null)
      })
      .catch(() => setDejaSigne(false))
  }, [])

  // Mémoïse le callback pour éviter les re-rendus du SignaturePad
  const onSignatureChange = useCallback((dataUrl: string | null) => {
    setSignatureData(dataUrl)
  }, [])

  // Soumet la signature avec enregistrement de l'IP côté serveur
  async function signer() {
    if (!accepte) return
    if (!signatureData) {
      setErreur('Veuillez apposer votre signature dans le cadre prévu.')
      return
    }
    setEnvoi(true)
    setErreur('')

    const res  = await fetch('/api/expert/charte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature: signatureData }),
    })
    const json = await res.json()

    if (!res.ok) {
      setErreur(json.error || 'Erreur lors de la signature.')
      setEnvoi(false)
      return
    }

    router.replace('/expert/profil')
  }

  if (dejaSigne === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="page-container">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-slate-900">Charte de bonne conduite</h1>
        {dejaSigne && (
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
            Signée
          </span>
        )}
      </div>

      {dejaSigne && signedAt && (
        <p className="text-sm text-slate-400 mb-8">
          Signée le {new Date(signedAt).toLocaleDateString('fr-BE', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      )}

      {!dejaSigne && (
        <p className="text-sm text-slate-500 mb-8">
          Avant d'accéder à votre espace expert, vous devez lire et accepter la charte suivante.
          Votre signature est enregistrée avec la date, l'heure et votre adresse IP.
        </p>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 text-sm text-slate-700 mb-8">

        {/* Préambule */}
        <section>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Préambule</p>
          <p className="text-slate-600 leading-relaxed">
            La présente charte constitue un accord contraignant entre l'expert (ci-après "vous") et Avisbox
            (ci-après "la plateforme"). En apposant votre signature numérique, vous reconnaissez avoir lu,
            compris et accepté l'intégralité des conditions ci-dessous. Cette signature est enregistrée avec
            horodatage, adresse IP et génération d'un document PDF probatoire, conformément aux dispositions
            du Règlement eIDAS (UE) n°910/2014 sur la signature électronique.
          </p>
        </section>

        {/* Article 1 */}
        <section>
          <p className="font-semibold text-slate-900 mb-2">Article 1 - Qualité et honnêteté des avis</p>
          <ul className="space-y-1.5 list-disc list-outside ml-5 text-slate-600">
            <li>Je fournis uniquement des avis basés sur mes compétences professionnelles réelles et vérifiées.</li>
            <li>Je réponds exclusivement aux demandes relevant de mon domaine d'expertise déclaré.</li>
            <li>Je traite chaque demande avec sérieux, diligence et dans le délai imparti de 24 heures.</li>
            <li>Je m'engage à signaler tout doute sur ma compétence à traiter une demande spécifique avant d'y répondre.</li>
            <li>Je ne fournis pas de réponse incomplète, volontairement vague ou destinée à induire l'utilisateur en erreur.</li>
          </ul>
        </section>

        {/* Article 2 */}
        <section>
          <p className="font-semibold text-slate-900 mb-2">Article 2 - Interdictions absolues</p>
          <ul className="space-y-2 list-disc list-outside ml-5 text-slate-600">
            <li>
              <span className="font-medium text-slate-800">Sollicitation commerciale interdite</span> - toute tentative de détourner un utilisateur vers mes services personnels, directement ou indirectement.
              <br /><em className="text-xs text-slate-400 italic">ex. : "Venez chez moi, je vous ferai ça moins cher", partager mes coordonnées sans demande explicite</em>
            </li>
            <li>
              <span className="font-medium text-slate-800">Travail illégal interdit</span> - tout conseil encourageant, facilitant ou cautionnant du travail non déclaré, au noir, ou en violation du droit belge.
            </li>
            <li>
              <span className="font-medium text-slate-800">Fausses informations interdites</span> - toute information délibérément inexacte, trompeuse ou susceptible de causer un préjudice financier ou moral à l'utilisateur.
            </li>
            <li>
              <span className="font-medium text-slate-800">Contenu inapproprié interdit</span> - tout propos offensant, discriminatoire, sexiste, raciste, menaçant ou contraire à la dignité humaine.
            </li>
            <li>
              <span className="font-medium text-slate-800">Conflit d'intérêt non déclaré interdit</span> - répondre à une demande dans laquelle j'ai un intérêt personnel ou commercial non divulgué.
              <br /><em className="text-xs text-slate-400 italic">ex. : évaluer un produit ou service que je commercialise moi-même</em>
            </li>
            <li>
              <span className="font-medium text-slate-800">Démarchage hors plateforme interdit</span> - tout contact direct avec un utilisateur en dehors de la plateforme, sauf si celui-ci en fait la demande explicite après réception de ma réponse.
            </li>
          </ul>
        </section>

        {/* Article 3 */}
        <section>
          <p className="font-semibold text-slate-900 mb-2">Article 3 - Confidentialité et protection des données</p>
          <ul className="space-y-1.5 list-disc list-outside ml-5 text-slate-600">
            <li>Je traite comme strictement confidentiel tout élément partagé par un utilisateur dans le cadre d'une demande (documents, photos, descriptions, situation personnelle).</li>
            <li>Je n'utilise, ne transmets, ni ne publie aucune information d'un utilisateur à des fins autres que la réponse à sa demande.</li>
            <li>Je respecte le Règlement Général sur la Protection des Données (RGPD - UE 2016/679) et la loi belge du 30 juillet 2018 relative à la protection des données personnelles.</li>
          </ul>
        </section>

        {/* Article 4 */}
        <section>
          <p className="font-semibold text-slate-900 mb-2">Article 4 - Propriété intellectuelle des réponses</p>
          <p className="text-slate-600 leading-relaxed">
            En soumettant une réponse sur la plateforme, je cède à Avisbox une licence non exclusive,
            mondiale et gratuite d'utilisation de cette réponse à des fins d'amélioration du service,
            de modération et de traitement des litiges. Je reste l'auteur de ma réponse et conserve mes
            droits moraux sur celle-ci.
          </p>
        </section>

        {/* Article 5 */}
        <section>
          <p className="font-semibold text-slate-900 mb-2">Article 5 - Nature des avis et limitation de responsabilité</p>
          <p className="text-slate-600 leading-relaxed">
            Je reconnais et accepte que les avis fournis via Avisbox constituent des opinions professionnelles
            d'entraide et non des consultations formelles engageant ma responsabilité civile professionnelle.
            Avisbox décline toute responsabilité quant aux décisions prises par les utilisateurs sur la base
            de mes avis. En cas de faute grave, de tromperie délibérée ou de violation de la présente charte,
            ma responsabilité personnelle pourra être engagée conformément au droit belge.
          </p>
        </section>

        {/* Article 6 - Conséquences */}
        <section className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900 rounded-lg p-4">
          <p className="font-semibold text-red-800 mb-2">Article 6 - Sanctions en cas de violation ou de suppression volontaire</p>
          <p className="text-red-700 text-xs mb-3 leading-relaxed">
            Toute violation de la présente charte, constatée par Avisbox à la suite d'un signalement ou
            d'une vérification interne, entraîne les sanctions suivantes, applicables immédiatement et sans
            préavis. <span className="font-semibold">En cas de suppression volontaire de mon compte expert, je perds également le droit à tout paiement en attente non encore viré.</span>
          </p>
          <ul className="text-sm text-red-700 space-y-1.5 list-disc list-outside ml-4">
            <li>Suspension immédiate et définitive du compte expert sans possibilité de recours.</li>
            <li>Perte de la totalité des paiements en attente non encore virés au moment de la suspension ou de la suppression volontaire du compte.</li>
            <li>Conservation permanente de tous les éléments probatoires (réponse, signalement, IP, date) dans nos systèmes à des fins de preuve juridique.</li>
            <li>En cas de préjudice avéré causé à un utilisateur, signalement possible aux autorités compétentes et/ou engagement de poursuites civiles.</li>
          </ul>
        </section>

        {/* Article 7 */}
        <section>
          <p className="font-semibold text-slate-900 mb-2">Article 7 - Droit applicable et juridiction</p>
          <p className="text-slate-600 leading-relaxed">
            La présente charte est régie par le droit belge. Tout litige relatif à son interprétation ou
            à son exécution sera soumis à la compétence exclusive des tribunaux de l'arrondissement judiciaire
            du siège de Avisbox, sans préjudice du droit de Avisbox de saisir toute autre juridiction
            compétente.
          </p>
        </section>

        {/* Bas de page */}
        <section className="text-xs text-slate-400 border-t border-slate-100 pt-4 leading-relaxed">
          <p>
            <span className="font-medium">Charte de bonne conduite Avisbox</span> - Version {process.env.NEXT_PUBLIC_EXPERT_CHARTER_VERSION ?? '1.0'}.
            La signature numérique apposée ci-dessous a la même valeur juridique qu'une signature manuscrite
            conformément au Règlement eIDAS (UE) n°910/2014. Une copie PDF horodatée est générée et conservée
            par Avisbox. Vous pouvez en télécharger un exemplaire depuis votre espace expert.
          </p>
        </section>

      </div>

      {/* Mode signature */}
      {!dejaSigne && (
        <div className="space-y-6">

          {/* Pad de signature numérique */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Votre signature</p>
            <SignaturePad onChange={onSignatureChange} />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepte}
              onChange={(e) => setAccepte(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
            />
            <span className="text-sm text-slate-700">
              J'ai lu et j'accepte intégralement la charte de bonne conduite Avisbox.
              Je comprends que ma signature est enregistrée avec la date, l'heure et mon adresse IP.
            </span>
          </label>

          {erreur && <p className="text-red-500 text-sm">{erreur}</p>}

          <Button
            onClick={signer}
            disabled={!accepte || !signatureData || envoi}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {envoi ? 'Signature en cours...' : 'Signer et accéder à mon espace expert'}
          </Button>
        </div>
      )}

      {/* Mode consultation */}
      {dejaSigne && (
        <div className="space-y-4">
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 underline"
            >
              Télécharger le PDF de ma charte signée
            </a>
          )}
          <Button
            onClick={() => router.push('/expert/profil')}
            variant="outline"
            className="w-full"
          >
            Retour au profil
          </Button>
        </div>
      )}
    </main>
  )
}

export default function ChartePageGuarded() {
  return <ExpertGuard><ChartePage /></ExpertGuard>
}
