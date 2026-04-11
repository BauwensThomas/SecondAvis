import { Html, Head, Body, Container, Heading, Text, Hr } from '@react-email/components'

interface Props {
  prenomExpert: string
  raison: string
}

// Email envoyé à l'expert quand son compte est supprimé définitivement par l'admin
export default function ExpertDeleted({ prenomExpert, raison }: Props) {
  return (
    <Html lang="fr">
      <Head />
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '32px 40px' }}>
          <Heading style={{ fontSize: 20, color: '#1e293b', marginBottom: 8 }}>
            Votre compte expert a été supprimé
          </Heading>
          <Text style={{ color: '#475569', fontSize: 15, lineHeight: '1.6' }}>
            Bonjour {prenomExpert},
          </Text>
          <Text style={{ color: '#475569', fontSize: 15, lineHeight: '1.6' }}>
            Nous vous informons que votre compte expert sur SecondAvis a été définitivement supprimé par notre équipe.
          </Text>
          <Hr style={{ borderColor: '#e2e8f0', margin: '20px 0' }} />
          <Text style={{ color: '#475569', fontSize: 14, lineHeight: '1.6' }}>
            <strong>Raison communiquée :</strong>
          </Text>
          <Text style={{ color: '#374151', fontSize: 14, lineHeight: '1.6', backgroundColor: '#f1f5f9', borderRadius: 8, padding: '12px 16px' }}>
            {raison}
          </Text>
          <Hr style={{ borderColor: '#e2e8f0', margin: '20px 0' }} />
          <Text style={{ color: '#94a3b8', fontSize: 12, lineHeight: '1.6' }}>
            Si vous pensez qu'il s'agit d'une erreur, contactez-nous à{' '}
            <a href={`mailto:${process.env.EMAIL_CONTACT}`} style={{ color: '#3b82f6' }}>
              {process.env.EMAIL_CONTACT}
            </a>.
          </Text>
          <Text style={{ color: '#cbd5e1', fontSize: 11 }}>SecondAvis</Text>
        </Container>
      </Body>
    </Html>
  )
}
