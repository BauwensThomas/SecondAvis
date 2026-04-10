import {
  Body, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from '@react-email/components'

interface ContestResolvedValidateClientProps {
  prenomClient: string
  titreQuestion: string
}

// Email envoyé au client quand l'admin valide la réponse de l'expert (signalement non retenu)
export default function ContestResolvedValidateClient({ prenomClient, titreQuestion }: ContestResolvedValidateClientProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.secondavis.be'

  return (
    <Html lang="fr">
      <Head />
      <Preview>Décision suite à votre signalement - SecondAvis</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Résultat de votre signalement
          </Heading>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Bonjour {prenomClient}, notre équipe a analysé votre signalement concernant :
          </Text>
          <Text style={{ color: '#0f172a', fontWeight: 600, backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: 8 }}>
            {titreQuestion}
          </Text>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Après analyse, votre signalement n'a pas été retenu. La réponse de l'expert a été validée par notre équipe. Aucun remboursement ne sera effectué.
          </Text>
          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Vous pouvez consulter la réponse et laisser une note à l'expert depuis votre espace.
          </Text>
          <Link
            href={`${appUrl}/mes-demandes`}
            style={{ display: 'inline-block', marginTop: 24, backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
          >
            Voir mes demandes
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
