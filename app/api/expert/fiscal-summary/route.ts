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

// GET /api/expert/fiscal-summary?year=2026 - génère un PDF récapitulatif fiscal annuel pour l'expert connecté
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const year = parseInt(request.nextUrl.searchParams.get('year') ?? String(new Date().getFullYear()), 10)
    if (isNaN(year) || year < 2024 || year > 2099) {
      return NextResponse.json({ error: 'Année invalide.' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Récupère le profil expert avec les infos pour le PDF
    const { data: expert } = await supabaseAdmin
      .from('experts')
      .select('id, first_name, last_name, email, city, address_zip, address_city, address_street')
      .eq('user_id', user.id)
      .single()

    if (!expert) {
      return NextResponse.json({ error: 'Profil expert introuvable.' }, { status: 404 })
    }

    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Avisbox'
    const appUrl  = process.env.NEXT_PUBLIC_APP_URL  || 'https://www.avisbox.be'

    // Récupère les paiements effectués cette année-là (is_paid = true)
    const startDate = `${year}-01-01T00:00:00.000Z`
    const endDate   = `${year + 1}-01-01T00:00:00.000Z`

    const { data: payouts } = await supabaseAdmin
      .from('payouts')
      .select('id, amount_cents, created_at, answers(requests(title, category))')
      .eq('expert_id', expert.id)
      .eq('status', 'paid')
      .gte('created_at', startDate)
      .lt('created_at', endDate)
      .order('created_at', { ascending: true })

    const lignes = (payouts ?? []).map((p) => {
      // Supabase retourne un tableau pour les relations - on prend le premier élément
      const answerRaw = Array.isArray(p.answers) ? p.answers[0] : p.answers
      const requestRaw = answerRaw && Array.isArray(answerRaw.requests) ? answerRaw.requests[0] : (answerRaw?.requests ?? null)
      return {
        date:      new Date(p.created_at).toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        categorie: CATEGORY_LABELS[(requestRaw as { category?: string } | null)?.category ?? ''] ?? '',
        titre:     (requestRaw as { title?: string } | null)?.title ?? 'Demande supprimée',
        montant:   p.amount_cents,
      }
    })

    const totalCents = lignes.reduce((acc, l) => acc + l.montant, 0)
    const totalEuros = (totalCents / 100).toFixed(2).replace('.', ',')

    // ---- Génération du PDF avec pdf-lib ----
    const pdfDoc = await PDFDocument.create()
    const fontBold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const page  = pdfDoc.addPage([595, 842]) // A4
    const { width, height } = page.getSize()
    const margin = 50
    let y = height - margin

    const colorDark   = rgb(0.12, 0.12, 0.20)
    const colorIndigo = rgb(0.24, 0.31, 0.78)
    const colorGray   = rgb(0.45, 0.45, 0.50)
    const colorLight  = rgb(0.95, 0.96, 0.99)

    // En-tête fond indigo
    page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: colorIndigo })

    page.drawText(appName, {
      x: margin, y: height - 38,
      font: fontBold, size: 22, color: rgb(1, 1, 1),
    })
    page.drawText(`Récapitulatif fiscal ${year}`, {
      x: margin, y: height - 60,
      font: fontNormal, size: 12, color: rgb(0.85, 0.87, 0.98),
    })
    page.drawText(appUrl, {
      x: width - margin - 160, y: height - 50,
      font: fontNormal, size: 10, color: rgb(0.75, 0.78, 0.96),
    })

    y = height - 120

    // Infos expert
    page.drawText('Expert', { x: margin, y, font: fontBold, size: 11, color: colorIndigo })
    y -= 18
    page.drawText(`${expert.first_name} ${expert.last_name}`, { x: margin, y, font: fontBold, size: 11, color: colorDark })
    y -= 15
    page.drawText(expert.email, { x: margin, y, font: fontNormal, size: 10, color: colorGray })
    y -= 15
    if (expert.address_street) {
      page.drawText(expert.address_street, { x: margin, y, font: fontNormal, size: 10, color: colorGray })
      y -= 15
    }
    if (expert.address_zip && expert.address_city) {
      page.drawText(`${expert.address_zip} ${expert.address_city}`, { x: margin, y, font: fontNormal, size: 10, color: colorGray })
      y -= 15
    }

    y -= 20
    page.drawText(`Période : du 01/01/${year} au 31/12/${year}`, { x: margin, y, font: fontNormal, size: 10, color: colorGray })
    y -= 30

    // Ligne séparatrice
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: colorGray })
    y -= 20

    // En-tête tableau
    const colDate     = margin
    const colCat      = margin + 80
    const colTitre    = margin + 200
    const colMontant  = width - margin - 55

    page.drawRectangle({ x: margin - 5, y: y - 6, width: width - 2 * margin + 10, height: 20, color: colorLight })
    page.drawText('Date',        { x: colDate,    y, font: fontBold, size: 9, color: colorDark })
    page.drawText('Catégorie',   { x: colCat,     y, font: fontBold, size: 9, color: colorDark })
    page.drawText('Demande',     { x: colTitre,   y, font: fontBold, size: 9, color: colorDark })
    page.drawText('Montant',     { x: colMontant, y, font: fontBold, size: 9, color: colorDark })
    y -= 20

    if (lignes.length === 0) {
      page.drawText(`Aucun paiement reçu en ${year}.`, { x: margin, y, font: fontNormal, size: 10, color: colorGray })
      y -= 20
    }

    // Lignes du tableau
    for (let i = 0; i < lignes.length; i++) {
      const ligne = lignes[i]
      if (i % 2 === 1) {
        page.drawRectangle({ x: margin - 5, y: y - 5, width: width - 2 * margin + 10, height: 17, color: rgb(0.97, 0.97, 0.99) })
      }
      const titre = ligne.titre.length > 35 ? ligne.titre.slice(0, 33) + '...' : ligne.titre
      const cat   = ligne.categorie.length > 16 ? ligne.categorie.slice(0, 14) + '.' : ligne.categorie

      page.drawText(ligne.date,  { x: colDate,    y, font: fontNormal, size: 9, color: colorDark })
      page.drawText(cat,         { x: colCat,     y, font: fontNormal, size: 9, color: colorGray })
      page.drawText(titre,       { x: colTitre,   y, font: fontNormal, size: 9, color: colorDark })
      page.drawText(`${(ligne.montant / 100).toFixed(2).replace('.', ',')} €`, { x: colMontant, y, font: fontNormal, size: 9, color: colorDark })
      y -= 17

      // Nouvelle page si on arrive en bas
      if (y < margin + 80) {
        const newPage = pdfDoc.addPage([595, 842])
        Object.assign(page, newPage) // référence mise à jour
        y = 842 - margin
      }
    }

    // Ligne séparatrice total
    y -= 5
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: colorGray })
    y -= 18

    // Total
    page.drawText('Total perçu', { x: colTitre, y, font: fontBold, size: 10, color: colorDark })
    page.drawText(`${totalEuros} €`, { x: colMontant, y, font: fontBold, size: 10, color: colorIndigo })
    y -= 40

    // Mention légale
    const mention = `Document généré par ${appName} le ${new Date().toLocaleDateString('fr-BE')} - À conserver pour votre déclaration fiscale`
    page.drawText(mention, { x: margin, y, font: fontNormal, size: 8, color: colorGray })
    y -= 14
    page.drawText(
      `Les montants indiqués correspondent aux paiements effectivement reçus. ${appName} n'est pas responsable de votre déclaration fiscale.`,
      { x: margin, y, font: fontNormal, size: 8, color: colorGray }
    )

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="avisbox-recapitulatif-fiscal-${year}.pdf"`,
      },
    })

  } catch (error) {
    console.error('Erreur inattendue GET /api/expert/fiscal-summary:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
