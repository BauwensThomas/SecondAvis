import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const CATEGORY_LABELS: Record<string, string> = {
  mecanique:    'Mécanique automobile',
  immo:         'Immobilier',
  travaux:      'Travaux',
  assurance:    'Assurance',
  travail:      'Droit du travail',
  comptabilite: 'Comptabilité',
}

// GET - génère un reçu PDF pour une demande payée et le retourne en téléchargement
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    // Récupère la demande en vérifiant que l'utilisateur en est le propriétaire
    const { data: request, error: reqError } = await supabaseAdmin
      .from('requests')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('payment_confirmed', true)
      .single()

    if (reqError || !request) {
      return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
    }

    // Récupère les infos du client
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single()

    // Génère le numéro de reçu à partir de l'ID (format SA-2026-XXXX)
    const annee = new Date(request.created_at).getFullYear()
    const shortId = id.replace(/-/g, '').substring(0, 6).toUpperCase()
    const receiptNumber = `SA-${annee}-${shortId}`

    const dateFormatee = new Date(request.created_at).toLocaleDateString('fr-BE', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    const montant = (request.amount_cents / 100).toFixed(2).replace('.', ',') + ' €'
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'SecondAvis'
    const emailContact = process.env.EMAIL_CONTACT || 'contact@secondavis.be'
    const categorie = CATEGORY_LABELS[request.category] || request.category
    const nomClient = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : ''

    // ---- Création du PDF avec pdf-lib ----

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4
    const { width, height } = page.getSize()

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const noir = rgb(0.1, 0.1, 0.1)
    const gris = rgb(0.5, 0.5, 0.5)
    const bleu = rgb(0.12, 0.35, 0.87)

    let y = height - 60

    // ---- En-tête ----
    page.drawText(appName, { x: 50, y, font: fontBold, size: 24, color: bleu })
    y -= 20
    page.drawText(emailContact, { x: 50, y, font: fontRegular, size: 10, color: gris })
    y -= 10
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) })
    y -= 30

    // ---- Titre ----
    page.drawText('REÇU DE PAIEMENT', { x: 50, y, font: fontBold, size: 18, color: noir })
    y -= 30

    // ---- Infos reçu ----
    const lignes: [string, string][] = [
      ['Numéro de reçu', receiptNumber],
      ['Date', dateFormatee],
      ['Client', nomClient],
      ['Email', userProfile?.email || user.email || ''],
    ]

    for (const [label, valeur] of lignes) {
      page.drawText(label, { x: 50, y, font: fontBold, size: 10, color: gris })
      page.drawText(valeur, { x: 200, y, font: fontRegular, size: 10, color: noir })
      y -= 20
    }

    y -= 20
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) })
    y -= 30

    // ---- Détail de la commande ----
    page.drawText('DÉTAIL', { x: 50, y, font: fontBold, size: 12, color: noir })
    y -= 25

    page.drawText('Description', { x: 50, y, font: fontBold, size: 10, color: gris })
    page.drawText('Montant', { x: width - 100, y, font: fontBold, size: 10, color: gris })
    y -= 15

    const description = `Avis professionnel - ${categorie}`
    page.drawText(description, { x: 50, y, font: fontRegular, size: 10, color: noir })
    page.drawText(montant, { x: width - 100, y, font: fontBold, size: 10, color: noir })
    y -= 12

    page.drawText(request.title, { x: 50, y, font: fontRegular, size: 9, color: gris, maxWidth: 350 })
    y -= 25

    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) })
    y -= 20

    page.drawText('Total payé', { x: width - 200, y, font: fontBold, size: 12, color: noir })
    page.drawText(montant, { x: width - 100, y, font: fontBold, size: 14, color: bleu })
    y -= 40

    // ---- Référence Stripe ----
    if (request.stripe_payment_intent_id) {
      page.drawText('Référence de transaction :', { x: 50, y, font: fontBold, size: 9, color: gris })
      y -= 14
      page.drawText(request.stripe_payment_intent_id, { x: 50, y, font: fontRegular, size: 9, color: gris })
      y -= 30
    }

    // ---- Mention TVA (étudiant, exonéré) ----
    page.drawText('TVA non applicable - Article 56bis du Code de la TVA belge', {
      x: 50, y, font: fontRegular, size: 8, color: gris,
    })
    y -= 40

    // ---- Politique de remboursement ----
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) })
    y -= 20

    page.drawText('Politique de remboursement', { x: 50, y, font: fontBold, size: 9, color: gris })
    y -= 14
    page.drawText(
      'Si aucun expert ne répond dans le délai imparti, vous êtes remboursé automatiquement.',
      { x: 50, y, font: fontRegular, size: 8, color: gris, maxWidth: width - 100 }
    )
    y -= 30

    // ---- Mention légale ----
    page.drawText(
      `${appName} est une plateforme d'entraide. Les avis ne constituent pas une consultation formelle.`,
      { x: 50, y, font: fontRegular, size: 8, color: gris, maxWidth: width - 100 }
    )

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="recu-${receiptNumber}.pdf"`,
      },
    })

  } catch (error) {
    console.error('Erreur inattendue GET /api/requests/[id]/receipt:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
