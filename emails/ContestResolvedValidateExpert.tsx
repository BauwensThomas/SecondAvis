import {
  Body, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from '@react-email/components'

interface ContestResolvedValidateExpertProps {
  prenomExpert: string
  titreQuestion: string
  montant: string
}

// Email envoyé à l'expert quand l'admin valide sa réponse - paiement prévu dans 5 jours
export default function ContestResolvedValidateExpert({ prenomExpert, titreQuestion, montant }: ContestResolvedValidateExpertProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.secondavis.be'

  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre réponse a été validée - SecondAvis</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Votre réponse a été validée
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Bonjour {prenomExpert}, notre équipe a analysé le signalement déposé sur votre réponse à :
          </Text>
          <Text style={{ color: '#0f172a', fontWeight: 600, backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: 8 }}>
            {titreQuestion}
          </Text>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Le signalement n'a pas été retenu. Votre réponse a été validée. Votre paiement de <strong>{montant}</strong> sera effectué dans un délai de 5 jours. Votre compte est à nouveau actif.
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
