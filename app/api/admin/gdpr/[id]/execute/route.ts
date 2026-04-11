import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'

// POST /api/admin/gdpr/[id]/execute - exécute la suppression du compte (effacement RGPD)
// Anonymise les données client ET expert, conserve les transactions (obligation légale 7 ans)
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient()

    // Récupère la demande RGPD
    const { data: demande } = await supabaseAdmin
      .from('gdpr_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (!demande) return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
    if (demande.request_type !== 'erasure') {
      return NextResponse.json({ error: 'Cette demande n\'est pas une demande d\'effacement.' }, { status: 400 })
    }

    const emailOriginal = demande.requester_email
    const userId = demande.requester_id

    // Anonymise le compte client dans la table users
    await supabaseAdmin.from('users').update({
      email:               `effaced_${userId}@deleted.Avisbox.be`,
      first_name:          'Compte',
      last_name:           'supprimé',
      phone:               null,
      marketing_emails:    false,
      stripe_customer_id:  null,
    }).eq('id', userId)

    // Anonymise le profil expert si cet utilisateur en avait un
    const { data: expertRow } = await supabaseAdmin
      .from('experts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (expertRow) {
      await supabaseAdmin.from('experts').update({
        display_name:     'Expert supprimé',
        bio:              null,
        first_name:       'Compte',
        last_name:        'supprimé',
        email:            `effaced_${userId}@deleted.Avisbox.be`,
        phone:            null,
        address_street:   '',
        address_zip:      '',
        photo_url:        null,
        website_url:      null,
        bce_number:       null,
        vat_number:       null,
        company_name:     null,
        is_active:        false,
        is_verified:      false,
      }).eq('user_id', userId)
    }

    // Récupère l'auth user id via l'email original pour supprimer le compte Auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authUsers?.users?.find((u) => u.email === emailOriginal)
    if (authUser) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id)
    }

    // Marque la demande RGPD comme traitée
    await supabaseAdmin.from('gdpr_requests').update({
      status:      'completed',
      resolved_at: new Date().toISOString(),
      notes:       (demande.notes ?? '') + `\nSupprimé par l'admin le ${new Date().toLocaleDateString('fr-BE')}.`,
    }).eq('id', id)

    // Trace dans l'audit
    await supabaseAdmin.from('audit_logs').insert({
      admin_id:    user.id,
      action:      'gdpr_erasure',
      target_type: expertRow ? 'expert' : 'user',
      target_id:   userId,
      new_value:   { email_anonymise: `effaced_${userId}@deleted.Avisbox.be`, expert_anonymise: !!expertRow },
    })

    // Email de confirmation au demandeur (envoyé à l'email original avant suppression)
    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      emailOriginal,
      subject: `Votre compte a été supprimé - ${process.env.NEXT_PUBLIC_APP_NAME}`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px">
        <h2 style="color:#0f172a">Compte supprimé</h2>
        <p style="color:#475569">
          Conformément à votre demande et au RGPD, votre compte et vos données personnelles
          ont été supprimés de ${process.env.NEXT_PUBLIC_APP_NAME}.
        </p>
        <p style="color:#475569">
          Les données liées à vos transactions financières sont conservées pendant 7 ans
          conformément aux obligations légales belges, sous forme anonymisée.
        </p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
        <p style="color:#94a3b8;font-size:12px">${process.env.NEXT_PUBLIC_APP_NAME} · ${process.env.EMAIL_CONTACT}</p>
      </div>`,
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur POST /api/admin/gdpr/[id]/execute:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
