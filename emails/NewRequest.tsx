import {
  Body, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from '@react-email/components'

interface NewRequestProps {
  prenomExpert: string
  categorie: string
  titreQuestion: string
  demandeId: string
  expiresAt: string
}

// Email envoyé à l'expert dès qu'une nouvelle demande arrive dans ses catégories
export default function NewRequest({ prenomExpert, categorie, titreQuestion, demandeId, expiresAt }: NewRequestProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.Avisbox.be'

  return (
    <Html lang="fr">
      <Head />
      <Preview>Nouvelle demande dans votre catégorie - Avisbox</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Nouvelle demande - {categorie}
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Bonjour {prenomExpert}, une nouvelle question vient d'être soumise dans votre catégorie.
          </Text>
          <Text style={{ color: '#0f172a', fontWeight: 600, backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: 8 }}>
            {titreQuestion}
          </Text>
          <Text style={{ color: '#ef4444', fontSize: 13 }}>
            Expire le {expiresAt}
          </Text>
          <Link
            href={`${appUrl}/expert/demandes/${demandeId}`}
            style={{ display: 'inline-block', marginTop: 24, backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
          >
            Voir la demande et répondre
          </Link>
          <Hr style={{ margin: '32px 0', borderColor: '#e2e8f0' }} />
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            Vous recevez cet email car cette demande correspond à vos catégories. Gérez vos préférences dans votre profil expert.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
