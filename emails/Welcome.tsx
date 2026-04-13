import {
  Body, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from '@react-email/components'

interface WelcomeProps {
  prenom: string
}

// Email de bienvenue envoyé au client après confirmation de son adresse email
export default function Welcome({ prenom }: WelcomeProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.Avisbox.be'

  return (
    <Html lang="fr">
      <Head />
      <Preview>Bienvenue sur Avisbox</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Bienvenue sur Avisbox, {prenom} !
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Votre compte est activé. Vous pouvez maintenant poser votre première question à un expert vérifié et recevoir une réponse en moins de 24h.
          </Text>
          <Link
            href={`${appUrl}/nouvelle-demande`}
            style={{ display: 'inline-block', marginTop: 24, backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
          >
            Poser ma première question
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
