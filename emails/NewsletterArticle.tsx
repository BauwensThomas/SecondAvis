import {
  Body, Container, Head, Heading, Html, Link, Preview, Text, Hr, Img,
} from '@react-email/components'

interface NewsletterArticleProps {
  titre: string
  extrait: string | null
  slug: string
  imageUrl: string | null
  // lienDesabonnement est personnalisé pour chaque destinataire
  lienDesabonnement: string
}

// Email envoyé aux abonnés newsletter et utilisateurs marketing lors de la publication d'un article
export default function NewsletterArticle({ titre, extrait, slug, imageUrl, lienDesabonnement }: NewsletterArticleProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.avisbox.be'
  const lienArticle = `${appUrl}/blog/${slug}`

  return (
    <Html lang="fr">
      <Head />
      <Preview>{titre}</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden' }}>

          {/* En-tête */}
          <div style={{ backgroundColor: '#2563eb', padding: '20px 32px' }}>
            <Text style={{ color: '#ffffff', fontWeight: 700, fontSize: 16, margin: 0 }}>
              Avisbox - Nouveau guide
            </Text>
          </div>

          {/* Corps */}
          <div style={{ padding: '32px' }}>
            {imageUrl && (
              <Img
                src={imageUrl}
                alt={titre}
                style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8, marginBottom: 24 }}
              />
            )}

            <Heading style={{ fontSize: 20, color: '#0f172a', marginTop: 0, marginBottom: 8, lineHeight: 1.3 }}>
              {titre}
            </Heading>

            {extrait && (
              <Text style={{ color: '#475569', lineHeight: 1.6, marginBottom: 24 }}>
                {extrait}
              </Text>
            )}

            <Link
              href={lienArticle}
              style={{ display: 'inline-block', backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}
            >
              Lire l'article
            </Link>

            <Hr style={{ margin: '32px 0', borderColor: '#e2e8f0' }} />

            <Text style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.5 }}>
              Vous recevez cet email car vous êtes abonné à la newsletter Avisbox.{' '}
              <Link href={lienDesabonnement} style={{ color: '#94a3b8' }}>
                Se désabonner
              </Link>
            </Text>
          </div>

        </Container>
      </Body>
    </Html>
  )
}
