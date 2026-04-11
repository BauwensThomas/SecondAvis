import {
  Body, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from '@react-email/components'

interface AnswerReceivedProps {
  prenomClient: string
  titreQuestion: string
  nomExpert: string
  demandeId: string
}

// Email envoyé au client quand un expert a répondu à sa demande
export default function AnswerReceived({ prenomClient, titreQuestion, nomExpert, demandeId }: AnswerReceivedProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.Avisbox.be'

  return (
    <Html lang="fr">
      <Head />
      <Preview>Un expert a répondu à votre question - Avisbox</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Votre réponse est arrivée, {prenomClient} !
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            L'expert <strong>{nomExpert}</strong> a répondu à votre question :
          </Text>
          <Text style={{ color: '#0f172a', fontWeight: 600, backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: 8 }}>
            {titreQuestion}
          </Text>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Consultez sa réponse complète en cliquant ci-dessous. Vous disposez de 48h pour signaler un problème si la réponse ne vous convient pas.
          </Text>
          <Link
            href={`${appUrl}/mes-demandes/${demandeId}`}
            style={{ display: 'inline-block', marginTop: 24, backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
          >
            Voir la réponse
          </Link>
          <Hr style={{ margin: '32px 0', borderColor: '#e2e8f0' }} />
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            Avisbox est une plateforme d'entraide. Cet avis ne constitue pas une consultation professionnelle formelle et n'engage pas la responsabilité de Avisbox.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
