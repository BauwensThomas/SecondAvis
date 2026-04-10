import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// GET - vérifie si l'expert connecté a déjà signé la charte
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: expert } = await supabaseAdmin
      .from('experts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!expert) {
      return NextResponse.json({ error: 'Profil expert introuvable.' }, { status: 404 })
    }

    const { data: charte } = await supabaseAdmin
      .from('expert_charters')
      .select('id, signed_at, charter_version, pdf_url')
      .eq('expert_id', expert.id)
      .order('signed_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({ signed: !!charte, charte: charte ?? null })

  } catch (error) {
    console.error('Erreur GET /api/expert/charte:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}

// Convertit une image base64 PNG en Uint8Array
function base64ToPng(dataUrl: string): Uint8Array {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  const binaryStr = atob(base64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return bytes
}

// Génère le PDF de la charte avec toutes les informations de signature
async function genererPdfCharte(options: {
  expertNom: string
  expertEmail: string
  charterVersion: string
  signedAt: Date
  ip: string | null
  signatureData: string
}): Promise<Uint8Array> {
  const { expertNom, expertEmail, charterVersion, signedAt, ip, signatureData } = options

  const doc  = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const fontBold   = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontNormal = await doc.embedFont(StandardFonts.Helvetica)

  const MARGE  = 50
  const ROUGE  = rgb(0.7, 0.1, 0.1)
  const NOIR   = rgb(0.07, 0.1, 0.15)
  const GRIS   = rgb(0.4, 0.4, 0.4)
  const INDIGO = rgb(0.24, 0.32, 0.71)

  let y = height - MARGE

  // ---- En-tête ----
  page.drawText('SecondAvis', { x: MARGE, y, font: fontBold, size: 20, color: INDIGO })
  y -= 18
  page.drawText('Charte de bonne conduite - Accord numérique', {
    x: MARGE, y, font: fontNormal, size: 11, color: GRIS,
  })
  y -= 30

  // Ligne de séparation
  page.drawLine({ start: { x: MARGE, y }, end: { x: width - MARGE, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
  y -= 24

  // ---- Informations de signature ----
  const dateFormatee = signedAt.toLocaleDateString('fr-BE', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels',
  })

  const infosLignes = [
    `Expert : ${expertNom}`,
    `Email : ${expertEmail}`,
    `Date de signature : ${dateFormatee}`,
    `Adresse IP : ${ip ?? 'Non disponible'}`,
    `Version de la charte : ${charterVersion}`,
  ]

  for (const ligne of infosLignes) {
    page.drawText(ligne, { x: MARGE, y, font: fontNormal, size: 10, color: NOIR })
    y -= 15
  }
  y -= 15

  // ---- Titre charte ----
  page.drawText('Charte de bonne conduite - Contenu intégral', {
    x: MARGE, y, font: fontBold, size: 13, color: NOIR,
  })
  y -= 20

  // ---- Sections de la charte (7 articles complets) ----
  const sections = [
    {
      titre: 'Article 1 - Qualité et honnêteté des avis',
      items: [
        'Je fournis uniquement des avis basés sur mes compétences professionnelles réelles et vérifiées.',
        'Je réponds exclusivement aux demandes relevant de mon domaine d\'expertise déclaré.',
        'Je traite chaque demande avec sérieux, diligence et dans le délai imparti de 24 heures.',
        'Je m\'engage à signaler tout doute sur ma compétence avant d\'y répondre.',
        'Je ne fournis pas de réponse incomplète ou volontairement vague.',
      ],
    },
    {
      titre: 'Article 2 - Interdictions absolues',
      items: [
        'Sollicitation commerciale interdite : toute tentative de détourner un utilisateur vers mes services personnels.',
        'Travail illégal interdit : tout conseil encourageant du travail non déclaré ou au noir.',
        'Fausses informations interdites : toute information délibérément inexacte ou trompeuse.',
        'Contenu inapproprié interdit : tout propos offensant, discriminatoire, sexiste ou raciste.',
        'Conflit d\'intérêt non déclaré interdit : répondre à une demande dans laquelle j\'ai un intérêt personnel.',
        'Démarchage hors plateforme interdit : tout contact direct sans demande explicite de l\'utilisateur.',
      ],
    },
    {
      titre: 'Article 3 - Confidentialité et protection des données',
      items: [
        'Je traite comme strictement confidentiel tout élément partagé par un utilisateur.',
        'Je ne transmets ni ne publie aucune information d\'un utilisateur à des fins autres que la réponse.',
        'Je respecte le RGPD (UE 2016/679) et la loi belge du 30 juillet 2018 sur la protection des données.',
      ],
    },
    {
      titre: 'Article 4 - Propriété intellectuelle des réponses',
      items: [
        'En soumettant une réponse, je cède à SecondAvis une licence non exclusive d\'utilisation à des fins de modération et de traitement des litiges.',
      ],
    },
    {
      titre: 'Article 5 - Nature des avis et limitation de responsabilité',
      items: [
        'Les avis fournis sont des opinions professionnelles d\'entraide, et non des consultations formelles engageant ma responsabilité civile professionnelle.',
        'En cas de faute grave ou de violation de la charte, ma responsabilité personnelle pourra être engagée conformément au droit belge.',
      ],
    },
    {
      titre: 'Article 6 - Sanctions en cas de violation',
      items: [
        'Suspension immédiate et définitive du compte expert sans possibilité de recours.',
        'Perte de la totalité des paiements en attente non encore virés au moment de la suspension.',
        'Conservation permanente de tous les éléments probatoires dans nos systèmes à des fins de preuve juridique.',
        'En cas de préjudice avéré, signalement possible aux autorités compétentes et/ou engagement de poursuites civiles.',
      ],
      rouge: true,
    },
    {
      titre: 'Article 7 - Droit applicable et juridiction',
      items: [
        'La présente charte est régie par le droit belge.',
        'Tout litige sera soumis à la compétence exclusive des tribunaux de l\'arrondissement judiciaire du siège de SecondAvis.',
      ],
    },
  ]

  for (const section of sections) {
    // Nouvelle page si on manque de place
    if (y < 120) {
      const nouvellePage = doc.addPage([595, 842])
      nouvellePage.drawText('SecondAvis - Charte de bonne conduite (suite)', {
        x: MARGE, y: 842 - MARGE, font: fontNormal, size: 9, color: GRIS,
      })
      y = 842 - MARGE - 30
    }

    page.drawText(section.titre, {
      x: MARGE, y, font: fontBold, size: 10,
      color: section.rouge ? ROUGE : NOIR,
    })
    y -= 14

    for (const item of section.items) {
      // Découpe les longues lignes
      const maxLargeur = width - MARGE * 2 - 16
      const mots = item.split(' ')
      let ligne = '•  '

      for (const mot of mots) {
        const essai = ligne + mot + ' '
        const largeur = fontNormal.widthOfTextAtSize(essai, 9)
        if (largeur > maxLargeur && ligne !== '•  ') {
          page.drawText(ligne.trim(), { x: MARGE + 8, y, font: fontNormal, size: 9, color: section.rouge ? ROUGE : NOIR })
          y -= 12
          ligne = '   ' + mot + ' '
        } else {
          ligne = essai
        }
      }
      if (ligne.trim()) {
        page.drawText(ligne.trim(), { x: MARGE + 8, y, font: fontNormal, size: 9, color: section.rouge ? ROUGE : NOIR })
        y -= 12
      }
    }
    y -= 8
  }

  // Mention légale
  y -= 4
  page.drawLine({ start: { x: MARGE, y }, end: { x: width - MARGE, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
  y -= 12
  page.drawText(
    'SecondAvis est une plateforme d\'entraide. Les avis fournis sont des opinions professionnelles',
    { x: MARGE, y, font: fontNormal, size: 8, color: GRIS }
  )
  y -= 11
  page.drawText(
    'et ne constituent pas des consultations formelles engageant votre responsabilité civile ou pénale.',
    { x: MARGE, y, font: fontNormal, size: 8, color: GRIS }
  )
  y -= 24

  // ---- Zone signature ----
  page.drawLine({ start: { x: MARGE, y }, end: { x: width - MARGE, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
  y -= 18
  page.drawText('Signature numérique de l\'expert', { x: MARGE, y, font: fontBold, size: 10, color: NOIR })
  y -= 12

  // Intègre l'image de la signature dessinée
  try {
    const signatureBytes = base64ToPng(signatureData)
    const signatureImage = await doc.embedPng(signatureBytes)
    const imgDims = signatureImage.scale(0.35)
    page.drawImage(signatureImage, {
      x: MARGE,
      y: y - imgDims.height,
      width:  imgDims.width,
      height: imgDims.height,
    })
    y -= imgDims.height + 10
  } catch {
    page.drawText('[Signature intégrée numériquement]', { x: MARGE, y, font: fontNormal, size: 9, color: GRIS })
    y -= 15
  }

  page.drawText(`Signé le ${dateFormatee} - IP : ${ip ?? 'Non disponible'}`, {
    x: MARGE, y, font: fontNormal, size: 8, color: GRIS,
  })

  const pdfBytes = await doc.save()
  return pdfBytes
}

// POST - enregistre la signature de la charte, génère le PDF et le stocke
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const body = await request.json()
    const { signature } = body

    if (!signature || typeof signature !== 'string') {
      return NextResponse.json({ error: 'La signature est obligatoire.' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Récupère le profil expert avec ses informations de contact
    const { data: expert } = await supabaseAdmin
      .from('experts')
      .select('id, first_name, last_name, email')
      .eq('user_id', user.id)
      .single()

    if (!expert) {
      return NextResponse.json({ error: 'Profil expert introuvable.' }, { status: 404 })
    }

    // Récupère l'IP de la requête - preuve juridique de la signature
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? null

    const charterVersion = process.env.NEXT_PUBLIC_EXPERT_CHARTER_VERSION ?? '1.0'
    const signedAt = new Date()
    const expertNom = `${expert.first_name} ${expert.last_name}`

    // Génère le PDF de la charte avec la signature dessinée
    const pdfBytes = await genererPdfCharte({
      expertNom,
      expertEmail: expert.email,
      charterVersion,
      signedAt,
      ip,
      signatureData: signature,
    })

    // Stocke le PDF dans Supabase Storage (bucket "documents")
    const nomFichier = `chartes/${expert.id}_${Date.now()}.pdf`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(nomFichier, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Erreur upload PDF charte:', uploadError)
      return NextResponse.json({ error: 'Erreur lors de la génération du PDF.' }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(nomFichier)

    const pdfUrl = urlData?.publicUrl ?? null

    // Enregistre la signature en base de données avec toutes les métadonnées
    const { error: dbError } = await supabaseAdmin
      .from('expert_charters')
      .insert({
        expert_id:        expert.id,
        charter_version:  charterVersion,
        ip_address:       ip,
        signature_data:   signature,
        pdf_url:          pdfUrl,
        expert_full_name: expertNom,
        expert_email:     expert.email,
      })

    if (dbError) {
      console.error('Erreur insertion charte:', dbError)
      return NextResponse.json({ error: 'Erreur lors de la signature.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, pdf_url: pdfUrl })

  } catch (error) {
    console.error('Erreur POST /api/expert/charte:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
