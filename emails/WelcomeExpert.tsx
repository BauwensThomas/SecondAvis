import {
  Body, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from '@react-email/components'

interface WelcomeExpertProps {
  prenom: string
  message?: string
}

// Email de bienvenue envoyé à l'expert après validation de sa candidature par l'admin
export default function WelcomeExpert({ prenom, message }: WelcomeExpertProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.Avisbox.be'

  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre compte expert Avisbox est activé</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Bienvenue dans l'équipe, {prenom} !
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Votre candidature a été acceptée. Votre compte expert est désormais actif sur Avisbox.
          </Text>
          {message && (
            <Text style={{ color: '#475569', lineHeight: 1.6, backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: 8 }}>
              {message}
            </Text>
          )}
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Vous recevrez un email dès qu'une nouvelle demande arrive dans vos catégories. Vous avez 24h pour y répondre - chaque réponse validée vous rapporte 2 €.
          </Text>
          <Link
            href={`${appUrl}/expert/dashboard`}
            style={{ display: 'inline-block', marginTop: 24, backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
          >
            Accéder à mon espace expert
          </Link>
          <Hr style={{ margin: '32px 0', borderColor: '#e2e8f0' }} />
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            Avisbox est une plateforme d'entraide. Les avis fournis ne constituent pas une consultation professionnelle formelle.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
