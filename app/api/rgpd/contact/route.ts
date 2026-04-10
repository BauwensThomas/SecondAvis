import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'

// POST /api/rgpd/contact - formulaire public pour exercer ses droits RGPD
// Accessible sans compte (pour les personnes qui n'ont plus accès à leur compte)
export async function POST(request: NextRequest) {
  try {
    const { email, nom, type_demande, message } = await request.json()

    if (!email || !nom || !type_demande) {
      return NextResponse.json({ error: 'Email, nom et type de demande sont obligatoires.' }, { status: 400 })
    }

    const types_valides = ['access', 'rectification', 'erasure', 'portability', 'opposition', 'autre']
    if (!types_valides.includes(type_demande)) {
      return NextResponse.json({ error: 'Type de demande invalide.' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Cherche si cet email correspond à un compte existant
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    const { data: expertRow } = await supabaseAdmin
      .from('experts')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    // Crée la demande RGPD dans le dashboard admin
    await supabaseAdmin.from('gdpr_requests').insert({
      requester_type:  expertRow ? 'expert' : 'user',
      requester_id:    userRow?.id ?? expertRow?.id ?? '00000000-0000-0000-0000-000000000000',
      requester_email: email,
      request_type:    type_demande,
      status:          'pending',
      notes:           `Nom : ${nom}. Message : ${message ?? '(aucun)'}. Compte trouvé en BDD : ${userRow || expertRow ? 'oui' : 'non'}.`,
    })

    // Email de confirmation à l'expéditeur
    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      email,
      subject: `Demande RGPD reçue - ${process.env.NEXT_PUBLIC_APP_NAME}`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px">
        <h2 style="color:#0f172a">Demande bien reçue</h2>
        <p style="color:#475569">Bonjour ${nom},</p>
        <p style="color:#475569">
          Nous avons bien reçu votre demande concernant vos données personnelles.
          Notre équipe vous répondra dans les meilleurs délais.
        </p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
        <p style="color:#94a3b8;font-size:12px">${process.env.NEXT_PUBLIC_APP_NAME} · ${process.env.EMAIL_CONTACT}</p>
      </div>`,
    })

    // Alerte admin
    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      process.env.EMAIL_ADMIN!,
      subject: `Nouvelle demande RGPD depuis la politique de confidentialité`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px">
        <p><strong>Nom :</strong> ${nom}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Type :</strong> ${type_demande}</p>
        ${message ? `<p><strong>Message :</strong> ${message}</p>` : ''}
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/rgpd" style="color:#2563eb">Voir dans le dashboard →</a></p>
      </div>`,
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur POST /api/rgpd/contact:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
