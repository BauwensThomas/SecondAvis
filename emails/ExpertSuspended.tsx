import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from '@react-email/components'

interface ExpertSuspendedProps {
  prenomExpert: string
  raison: string
}

// Email envoyé à l'expert quand son compte est suspendu par l'admin
export default function ExpertSuspended({ prenomExpert, raison }: ExpertSuspendedProps) {
  const contactEmail = process.env.EMAIL_CONTACT ?? 'contact@secondavis.be'

  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre compte expert a été suspendu - SecondAvis</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Compte suspendu
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Bonjour {prenomExpert}, votre compte expert SecondAvis a été suspendu.
          </Text>
          <Text style={{ color: '#0f172a', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: 8 }}>
            Raison : {raison}
          </Text>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Vous ne pouvez plus accéder aux nouvelles demandes ni soumettre de réponses. Si vous pensez qu'il s'agit d'une erreur, contactez-nous à{' '}
            <a href={`mailto:${contactEmail}`} style={{ color: '#2563eb' }}>{contactEmail}</a>.
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
