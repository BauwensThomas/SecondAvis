import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'

// POST /api/admin/email/send - envoie un email manuel à un client ou expert, loggué en base
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const body = await request.json()
    const { recipient_type, recipient_id, related_type, related_id, subject, body: emailBody } = body

    if (!recipient_type || !recipient_id || !subject || !emailBody) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Récupère l'email et le nom du destinataire
    let recipientEmail  = ''
    let recipientNom    = ''
    let recipientPrenom = ''

    if (recipient_type === 'client') {
      const { data } = await supabaseAdmin
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', recipient_id)
        .single()
      recipientEmail  = data?.email ?? ''
      recipientPrenom = data?.first_name ?? ''
      recipientNom    = data?.last_name ?? ''
    } else {
      const { data } = await supabaseAdmin
        .from('experts')
        .select('email, first_name, last_name')
        .eq('id', recipient_id)
        .single()
      recipientEmail  = data?.email ?? ''
      recipientPrenom = data?.first_name ?? ''
      recipientNom    = data?.last_name ?? ''
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Destinataire introuvable.' }, { status: 404 })
    }

    // Salutation personnalisée (Madame/Monsieur selon les données disponibles)
    const salutation = recipientPrenom
      ? `Madame, Monsieur ${recipientPrenom} ${recipientNom}`.trim()
      : 'Madame, Monsieur'

    // Récupère le titre et l'ID de la demande liée pour construire le bon lien
    let titreDossier  = ''
    let lienClient    = ''
    let lienExpert    = ''

    if (related_type === 'signalement' && related_id) {
      // L'ID du signalement = l'ID de la réponse (answer.id)
      // On remonte jusqu'à la demande pour avoir l'ID de request
      const { data: ans } = await supabaseAdmin
        .from('answers')
        .select('request_id, requests(id, title)')
        .eq('id', related_id)
        .single()

      titreDossier = (ans?.requests as any)?.title ?? ''
      const requestId = (ans?.requests as any)?.id ?? ''

      if (requestId) {
        lienClient = `${process.env.NEXT_PUBLIC_APP_URL}/mes-demandes/${requestId}`
        lienExpert = `${process.env.NEXT_PUBLIC_APP_URL}/expert/demandes/${requestId}`
      }
    }

    // Lien vers la bonne page selon le type de destinataire
    const lienDossier = recipient_type === 'client' ? lienClient : lienExpert

    const contextBlock = titreDossier
      ? `<div style="background:#f1f5f9;border-left:4px solid #6366f1;padding:12px 16px;margin-bottom:20px;border-radius:4px">
          <p style="margin:0;font-size:13px;color:#475569">Concernant le dossier :</p>
          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1e293b">${titreDossier}</p>
          ${lienDossier ? `<a href="${lienDossier}" style="font-size:12px;color:#6366f1">Accéder à mon dossier →</a>` : ''}
        </div>`
      : ''

    // Envoie l'email via Resend
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: recipientEmail,
      subject,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
        <p style="color:#64748b;font-size:12px;margin-bottom:16px">
          ${process.env.NEXT_PUBLIC_APP_NAME} - Message de l'équipe
        </p>
        ${contextBlock}
        <p style="font-size:15px;color:#1e293b;margin-bottom:16px">${salutation},</p>
        <div style="white-space:pre-wrap;font-size:15px;color:#1e293b;line-height:1.6">${emailBody}</div>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
        <p style="color:#94a3b8;font-size:12px">
          ${process.env.NEXT_PUBLIC_APP_NAME} · ${process.env.EMAIL_CONTACT}
        </p>
      </div>`,
    })

    // Loggue l'email en base
    await supabaseAdmin.from('admin_emails').insert({
      recipient_type,
      recipient_id,
      recipient_email: recipientEmail,
      related_type: related_type ?? null,
      related_id:   related_id   ?? null,
      subject,
      body: emailBody,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
