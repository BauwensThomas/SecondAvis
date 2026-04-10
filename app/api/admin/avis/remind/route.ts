import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'

// POST /api/admin/avis/remind - envoie un rappel au client pour qu'il note la réponse
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { answer_id } = await request.json()
    if (!answer_id) return NextResponse.json({ error: 'answer_id manquant.' }, { status: 400 })

    const supabaseAdmin = createAdminClient()

    // Récupère la réponse avec les infos du client et de la demande
    const { data: answer } = await supabaseAdmin
      .from('answers')
      .select('id, delivered_at, requests(id, title, category, users(first_name, last_name, email, id))')
      .eq('id', answer_id)
      .single()

    if (!answer) return NextResponse.json({ error: 'Réponse introuvable.' }, { status: 404 })

    const req       = answer.requests as any
    const client    = req?.users as any
    const titre     = req?.title ?? 'votre demande'
    const prenom    = client?.first_name ?? 'Client'
    const email     = client?.email
    const user_id   = client?.id
    const requestId = req?.id

    if (!email) return NextResponse.json({ error: 'Email client introuvable.' }, { status: 400 })

    const dateReponse = new Date(answer.delivered_at).toLocaleDateString('fr-BE', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    // Envoi du rappel via Resend
    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      email,
      subject: `Votre avis sur le dossier "${titre}" - SecondAvis`,
      html: `
        <p>Bonjour ${prenom},</p>
        <p>Vous avez reçu une réponse professionnelle le <strong>${dateReponse}</strong> pour votre dossier :</p>
        <p><strong>${titre}</strong></p>
        <p>Nous n'avons pas encore reçu votre avis sur cette réponse. Votre retour est précieux pour maintenir la qualité de notre plateforme et aider les autres utilisateurs.</p>
        <p>Cela ne prend que 10 secondes :</p>
        <p style="text-align:center;margin:24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/mes-demandes/${requestId}"
             style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block;">
            Accéder à mon dossier et laisser mon avis →
          </a>
        </p>
        <p>Merci,<br>L'équipe ${process.env.NEXT_PUBLIC_APP_NAME}</p>
        <hr>
        <p style="font-size:11px;color:#999;">
          ${process.env.NEXT_PUBLIC_APP_NAME} est une plateforme d'entraide. Les avis fournis sont des opinions basées sur les informations communiquées et ne constituent pas une consultation professionnelle formelle.
        </p>
      `,
    })

    // Log dans admin_emails
    await supabaseAdmin.from('admin_emails').insert({
      recipient_type:  'client',
      recipient_id:    user_id,
      recipient_email: email,
      related_type:    'avis',
      related_id:      answer_id,
      subject:         `Rappel avis - ${titre}`,
      body:            `Rappel automatique envoyé pour la demande "${titre}"`,
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur POST /api/admin/avis/remind:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
