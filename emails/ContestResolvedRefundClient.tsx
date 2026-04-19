import {
  Body, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from '@react-email/components'

interface ContestResolvedRefundClientProps {
  prenomClient: string
  titreQuestion: string
  montant: string
}

// Email envoyé au client quand l'admin valide son signalement - remboursement dans 5 jours
export default function ContestResolvedRefundClient({ prenomClient, titreQuestion, montant }: ContestResolvedRefundClientProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.Avisbox.be'

  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre signalement a été retenu - Avisbox</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Votre signalement a été retenu
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Bonjour {prenomClient}, notre équipe a analysé votre signalement concernant :
          </Text>
          <Text style={{ color: '#0f172a', fontWeight: 600, backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: 8 }}>
            {titreQuestion}
          </Text>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Votre signalement a été retenu. Vous serez remboursé de <strong>{montant}</strong> dans un délai de 5 jours sur votre moyen de paiement d'origine. Vous pouvez soumettre une nouvelle question quand vous le souhaitez.
          </Text>
          <Link
            href={`${appUrl}/nouvelle-demande`}
            style={{ display: 'inline-block', marginTop: 24, backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
          >
            Soumettre une nouvelle situation
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
