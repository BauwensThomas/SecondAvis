import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from '@react-email/components'

interface ContestCreatedExpertProps {
  prenomExpert: string
  titreQuestion: string
}

// Email envoyé à l'expert pour l'informer qu'un signalement a été déposé sur sa réponse
export default function ContestCreatedExpert({ prenomExpert, titreQuestion }: ContestCreatedExpertProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Un signalement a été déposé sur votre réponse - SecondAvis</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Signalement reçu sur votre réponse
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Bonjour {prenomExpert}, un signalement a été déposé par le client concernant votre réponse à la demande suivante :
          </Text>
          <Text style={{ color: '#0f172a', fontWeight: 600, backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: 8 }}>
            {titreQuestion}
          </Text>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Cette demande est maintenant en cours d'analyse par notre équipe. Tout paiement vous concernant est suspendu jusqu'à notre décision. Votre compte est temporairement désactivé le temps de l'analyse. Vous serez informé du résultat dans les meilleurs délais.
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
