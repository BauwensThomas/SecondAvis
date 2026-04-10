import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'

// POST - supprime immédiatement le compte et log dans gdpr_requests pour traçabilité
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name')
      .eq('email', user.email)
      .single()

    if (!userRow) {
      return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 })
    }

    const emailOriginal = userRow.email

    // Vérifie si l'utilisateur est aussi expert
    const { data: expertRow } = await supabaseAdmin
      .from('experts')
      .select('id')
      .eq('user_id', userRow.id)
      .maybeSingle()

    // Anonymise le compte client
    await supabaseAdmin.from('users').update({
      email:              `effaced_${userRow.id}@deleted.secondavis.be`,
      first_name:         'Compte',
      last_name:          'supprimé',
      phone:              null,
      marketing_emails:   false,
      stripe_customer_id: null,
    }).eq('id', userRow.id)

    // Anonymise le profil expert si applicable
    if (expertRow) {
      await supabaseAdmin.from('experts').update({
        display_name:   'Expert supprimé',
        bio:            null,
        first_name:     'Compte',
        last_name:      'supprimé',
        email:          `effaced_${userRow.id}@deleted.secondavis.be`,
        phone:          null,
        address_street: '',
        address_zip:    '',
        photo_url:      null,
        website_url:    null,
        bce_number:     null,
        vat_number:     null,
        company_name:   null,
        is_active:      false,
        is_verified:    false,
      }).eq('user_id', userRow.id)
    }

    // Log dans gdpr_requests pour traçabilité (status completed d'emblée)
    await supabaseAdmin.from('gdpr_requests').insert({
      requester_type:  expertRow ? 'expert' : 'user',
      requester_id:    userRow.id,
      requester_email: emailOriginal,
      request_type:    'erasure',
      status:          'completed',
      resolved_at:     new Date().toISOString(),
      notes:           `Suppression immédiate effectuée par le compte lui-même le ${new Date().toLocaleDateString('fr-BE')}.${expertRow ? ' Compte expert anonymisé aussi.' : ''}`,
    })

    // Supprime le compte Supabase Auth
    await supabaseAdmin.auth.admin.deleteUser(user.id)

    // Email de confirmation (envoyé avant la suppression Auth)
    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      emailOriginal,
      subject: `Votre compte a été supprimé - ${process.env.NEXT_PUBLIC_APP_NAME}`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px">
        <h2 style="color:#0f172a">Compte supprimé</h2>
        <p style="color:#475569">Bonjour ${userRow.first_name},</p>
        <p style="color:#475569">
          Votre compte et vos données personnelles ont été supprimés de ${process.env.NEXT_PUBLIC_APP_NAME}.
        </p>
        <p style="color:#475569">
          Les données liées à vos transactions financières sont conservées pendant 7 ans
          sous forme anonymisée, conformément aux obligations légales belges.
        </p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
        <p style="color:#94a3b8;font-size:12px">${process.env.NEXT_PUBLIC_APP_NAME} · ${process.env.EMAIL_CONTACT}</p>
      </div>`,
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur POST /api/user/delete-account:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
