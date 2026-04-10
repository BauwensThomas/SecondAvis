import {
  Body, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from '@react-email/components'

interface ExpertReactivatedProps {
  prenomExpert: string
}

// Email envoyé à l'expert quand son compte est réactivé par l'admin
export default function ExpertReactivated({ prenomExpert }: ExpertReactivatedProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.secondavis.be'

  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre compte expert est à nouveau actif - SecondAvis</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Compte réactivé
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Bonjour {prenomExpert}, votre compte expert SecondAvis est à nouveau actif. Vous pouvez consulter et répondre aux nouvelles demandes dans vos catégories.
          </Text>
          <Link
            href={`${appUrl}/expert/dashboard`}
            style={{ display: 'inline-block', marginTop: 24, backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
          >
            Accéder à mon espace expert
          </Link>
          <Hr style={{ margin: '32px 0', borderColor: '#e2e8f0' }} />
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            SecondAvis - Belgique
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
