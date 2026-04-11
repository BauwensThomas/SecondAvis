import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Row, Column,
} from '@react-email/components'

interface ReceiptClientProps {
  prenomClient: string
  receiptNumber: string
  titreQuestion: string
  categorie: string
  montant: string
  datePaiement: string
  stripePaymentId: string
}

// Reçu de paiement envoyé au client après confirmation du paiement Stripe
export default function ReceiptClient({
  prenomClient, receiptNumber, titreQuestion, categorie, montant, datePaiement, stripePaymentId,
}: ReceiptClientProps) {
  const contactEmail = process.env.EMAIL_CONTACT ?? 'contact@avisbox.be'
  const companyName  = process.env.NEXT_PUBLIC_COMPANY_NAME ?? 'Avisbox'
  const address      = process.env.NEXT_PUBLIC_COMPANY_ADDRESS ?? 'Belgique'

  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre reçu Avisbox - {receiptNumber}</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 12, padding: '40px 32px' }}>
          <Heading style={{ fontSize: 22, color: '#0f172a', marginBottom: 4 }}>
            Reçu de paiement
          </Heading>
          <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24 }}>
            {receiptNumber}
          </Text>

          <Text style={{ color: '#475569', lineHeight: 1.6 }}>
            Bonjour {prenomClient}, merci pour votre confiance. Voici votre reçu.
          </Text>

          {/* Tableau récapitulatif */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px', margin: '24px 0' }}>
            <Row>
              <Column><Text style={{ color: '#64748b', fontSize: 13, margin: '4px 0' }}>Date</Text></Column>
              <Column><Text style={{ color: '#0f172a', fontSize: 13, margin: '4px 0', textAlign: 'right' }}>{datePaiement}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={{ color: '#64748b', fontSize: 13, margin: '4px 0' }}>Catégorie</Text></Column>
              <Column><Text style={{ color: '#0f172a', fontSize: 13, margin: '4px 0', textAlign: 'right' }}>{categorie}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={{ color: '#64748b', fontSize: 13, margin: '4px 0' }}>Question</Text></Column>
              <Column><Text style={{ color: '#0f172a', fontSize: 13, margin: '4px 0', textAlign: 'right' }}>{titreQuestion}</Text></Column>
            </Row>
            <Hr style={{ margin: '12px 0', borderColor: '#e2e8f0' }} />
            <Row>
              <Column><Text style={{ color: '#0f172a', fontSize: 15, fontWeight: 700, margin: '4px 0' }}>Total</Text></Column>
              <Column><Text style={{ color: '#0f172a', fontSize: 15, fontWeight: 700, margin: '4px 0', textAlign: 'right' }}>{montant} TVAC</Text></Column>
            </Row>
          </div>

          <Text style={{ color: '#94a3b8', fontSize: 11 }}>
            TVA non applicable - Article 56bis du Code de la TVA
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 11 }}>
            Référence Stripe : {stripePaymentId}
          </Text>

          <Hr style={{ margin: '32px 0', borderColor: '#e2e8f0' }} />
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            {companyName} - {address} - {contactEmail}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
