import {
  Body, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from '@react-email/components'

interface EmailConfirmProps {
  prenom: string
  confirmUrl: string
}

// Email de confirmation d'adresse envoyé à l'inscription
export default function EmailConfirm({ prenom, confirmUrl }: EmailConfirmProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Confirmez votre adresse email - SecondAvis</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Confirmez votre adresse, {prenom}
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Cliquez sur le bouton ci-dessous pour activer votre compte SecondAvis. Ce lien est valable 24 heures.
          </Text>
          <Link
            href={confirmUrl}
            style={{ display: 'inline-block', marginTop: 24, backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
          >
            Confirmer mon adresse email
          </Link>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 24 }}>
            Si vous n'avez pas créé de compte, ignorez cet email.
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
