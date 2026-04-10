import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from '@react-email/components'

interface ContestCreatedClientProps {
  prenomClient: string
  titreQuestion: string
}

// Email envoyé au client pour confirmer l'enregistrement de son signalement
export default function ContestCreatedClient({ prenomClient, titreQuestion }: ContestCreatedClientProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre signalement a été enregistré - SecondAvis</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Signalement enregistré
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Bonjour {prenomClient}, votre signalement concernant la question suivante a bien été enregistré :
          </Text>
          <Text style={{ color: '#0f172a', fontWeight: 600, backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: 8 }}>
            {titreQuestion}
          </Text>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Cette demande est maintenant en cours d'analyse par notre équipe. Tout paiement ou remboursement est suspendu jusqu'à notre décision. Nous traitons votre dossier dans les meilleurs délais et vous informerons dès que possible.
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
