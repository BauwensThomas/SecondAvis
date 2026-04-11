import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from '@react-email/components'

interface ContestResolvedRefundExpertProps {
  prenomExpert: string
  titreQuestion: string
}

// Email envoyé à l'expert quand l'admin valide le signalement du client - aucun paiement
export default function ContestResolvedRefundExpert({ prenomExpert, titreQuestion }: ContestResolvedRefundExpertProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Décision suite au signalement - Avisbox</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Résultat de l'analyse du signalement
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Bonjour {prenomExpert}, notre équipe a analysé le signalement déposé sur votre réponse à :
          </Text>
          <Text style={{ color: '#0f172a', fontWeight: 600, backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: 8 }}>
            {titreQuestion}
          </Text>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Suite à cette analyse, le signalement a été retenu. Aucun paiement ne vous sera versé pour cette réponse. Votre compte reste suspendu en attendant notre décision finale sur la suite à donner.
          </Text>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Vous serez informé de la décision concernant votre compte dans les prochains jours.
          </Text>
          <Hr style={{ margin: '32px 0', borderColor: '#e2e8f0' }} />
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            Avisbox - Belgique
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
