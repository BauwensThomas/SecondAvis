import {
  Body, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from '@react-email/components'

interface ExpertPaymentSentProps {
  prenomExpert: string
  titreQuestion: string
  montant: string
}

// Email envoyé à l'expert quand son paiement de 2 € a été viré automatiquement
export default function ExpertPaymentSent({ prenomExpert, titreQuestion, montant }: ExpertPaymentSentProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.Avisbox.be'

  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre paiement a été effectué - Avisbox</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Paiement effectué
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Bonjour {prenomExpert}, votre paiement de <strong>{montant}</strong> vient d'être viré pour votre réponse à :
          </Text>
          <Text style={{ color: '#0f172a', fontWeight: 600, backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: 8 }}>
            {titreQuestion}
          </Text>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Le virement apparaîtra sur votre compte Stripe Connect dans les prochaines heures.
          </Text>
          <Link
            href={`${appUrl}/expert/gains`}
            style={{ display: 'inline-block', marginTop: 24, backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
          >
            Voir mes gains
          </Link>
          <Hr style={{ margin: '32px 0', borderColor: '#e2e8f0' }} />
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            Avisbox - Belgique
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
