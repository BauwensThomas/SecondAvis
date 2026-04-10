import {
  Body, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from '@react-email/components'

interface RefundedProps {
  prenomClient: string
  titreQuestion: string
  montant: string
}

// Email envoyé au client quand sa demande expire sans réponse - remboursement automatique
export default function Refunded({ prenomClient, titreQuestion, montant }: RefundedProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.secondavis.be'

  return (
    <Html lang="fr">
      <Head />
      <Preview>Vous avez été remboursé - SecondAvis</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Votre remboursement est en cours
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Bonjour {prenomClient}, aucun expert n'a pu répondre à votre question dans les délais impartis :
          </Text>
          <Text style={{ color: '#0f172a', fontWeight: 600, backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: 8 }}>
            {titreQuestion}
          </Text>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Vous serez remboursé de <strong>{montant}</strong> dans un délai de 3 à 5 jours ouvrables sur votre moyen de paiement d'origine.
          </Text>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Vous pouvez soumettre une nouvelle question quand vous le souhaitez - nous ferons tout pour trouver un expert disponible.
          </Text>
          <Link
            href={`${appUrl}/nouvelle-demande`}
            style={{ display: 'inline-block', marginTop: 24, backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
          >
            Poser une nouvelle question
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
