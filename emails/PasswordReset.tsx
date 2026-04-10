import {
  Body, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from '@react-email/components'

interface PasswordResetProps {
  prenom: string
  resetUrl: string
}

// Email de réinitialisation de mot de passe - envoyé au client et à l'expert
export default function PasswordReset({ prenom, resetUrl }: PasswordResetProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Réinitialisez votre mot de passe - SecondAvis</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Réinitialisation de votre mot de passe
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Bonjour {prenom}, vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous - il est valable 1 heure.
          </Text>
          <Link
            href={resetUrl}
            style={{ display: 'inline-block', marginTop: 24, backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
          >
            Réinitialiser mon mot de passe
          </Link>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 24 }}>
            Si vous n'avez pas fait cette demande, ignorez cet email. Votre mot de passe reste inchangé.
          </Text>
          <Hr style={{ margin: '32px 0', borderColor: '#e2e8f0' }} />
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            SecondAvis - Belgique
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
