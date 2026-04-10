import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales',
}

// Page mentions légales - obligatoire légalement en Belgique
export default function MentionsLegalesPage() {
  const appName     = process.env.NEXT_PUBLIC_APP_NAME ?? 'SecondAvis'
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME ?? 'SecondAvis'
  const companyStatus = process.env.NEXT_PUBLIC_COMPANY_STATUS ?? 'Projet en cours de création'
  const companyAddress = process.env.NEXT_PUBLIC_COMPANY_ADDRESS ?? 'Belgique'
  const companyCBE  = process.env.NEXT_PUBLIC_COMPANY_BCE
  const companyTVA  = process.env.NEXT_PUBLIC_COMPANY_TVA
  const emailContact = process.env.EMAIL_CONTACT ?? 'contact@secondavis.be'

  return (
    <main className="page-container">
      <h1 className="text-3xl font-bold text-slate-900 mb-10">Mentions légales</h1>

      <div className="space-y-8 text-sm leading-relaxed text-slate-700">

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Éditeur du site</h2>
          <div className="space-y-1">
            <p><span className="text-slate-500">Nom :</span> {companyName}</p>
            {companyStatus && <p><span className="text-slate-500">Statut :</span> {companyStatus}</p>}
            <p><span className="text-slate-500">Adresse :</span> {companyAddress}</p>
            <p>
              <span className="text-slate-500">Email :</span>{' '}
              <a href={`mailto:${emailContact}`} className="text-indigo-600 hover:underline">
                {emailContact}
              </a>
            </p>
            {companyCBE && <p><span className="text-slate-500">Numéro BCE :</span> {companyCBE}</p>}
            {companyTVA && <p><span className="text-slate-500">Numéro TVA :</span> {companyTVA}</p>}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Hébergeur</h2>
          <div className="space-y-1">
            <p><span className="text-slate-500">Société :</span> Vercel Inc.</p>
            <p><span className="text-slate-500">Adresse :</span> 340 Pine Street, Suite 900, San Francisco, CA 94104, États-Unis</p>
            <p>
              <span className="text-slate-500">Site web :</span>{' '}
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                vercel.com
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Propriété intellectuelle</h2>
          <p>
            L'ensemble du contenu de {appName} (textes, images, code, marque) est protégé par le droit
            d'auteur. Toute reproduction ou utilisation sans autorisation préalable est interdite.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Limitation de responsabilité</h2>
          <p>
            {appName} est une plateforme d'entraide. Les avis fournis par les professionnels inscrits
            sont des opinions basées sur les informations communiquées. Ils ne constituent pas des
            consultations professionnelles formelles engageant la responsabilité de {appName} ou des
            professionnels. {appName} décline toute responsabilité quant aux décisions prises sur la
            base de ces avis.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Droit applicable</h2>
          <p>
            Le présent site est soumis au droit belge. Tout litige sera de la compétence exclusive
            des tribunaux belges.
          </p>
        </section>

      </div>
    </main>
  )
}
