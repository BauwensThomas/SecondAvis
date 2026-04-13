import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'
import WelcomeExpert from '@/emails/WelcomeExpert'
import { render } from '@react-email/render'
import React from 'react'

// POST /api/admin/candidatures/[id]/decide - approuver ou refuser une candidature expert
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { approved, message } = await request.json()
    const supabaseAdmin = createAdminClient()

    const { data: candidature } = await supabaseAdmin
      .from('expert_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (!candidature) return NextResponse.json({ error: 'Candidature introuvable.' }, { status: 404 })

    if (approved) {
      // Le candidat a forcément un compte (login requis avant de postuler)
      // On utilise le user_id stocké dans la candidature directement
      const authUserId: string = candidature.user_id

      if (!authUserId) {
        return NextResponse.json(
          { error: 'Cette candidature ne contient pas de user_id. Le candidat doit repostuler en étant connecté.' },
          { status: 400 }
        )
      }

      // Crée le profil expert lié au compte existant
      const { error: expertError } = await supabaseAdmin.from('experts').insert({
        user_id:           authUserId,
        display_name:      candidature.display_name,
        bio:               candidature.bio,
        categories:        candidature.categories,
        years_experience:  candidature.years_experience,
        city:              candidature.city,
        languages:         candidature.languages,
        first_name:        candidature.first_name,
        last_name:         candidature.last_name,
        email:             candidature.email,
        phone:             candidature.phone,
        address_street:    '',
        address_zip:       '',
        address_city:      candidature.city,
        entity_type:       candidature.entity_type,
        company_name:      candidature.company_name,
        bce_number:        candidature.bce_number,
        vat_number:        candidature.vat_number,
        justification_url: candidature.document_url,
        is_verified:       true,
        is_active:         true,
      })

      if (expertError) throw expertError

      // Met à jour le statut de la candidature
      await supabaseAdmin.from('expert_applications')
        .update({ status: 'approved', admin_notes: message })
        .eq('id', id)

      // Trace l'approbation dans l'audit
      await supabaseAdmin.from('audit_logs').insert({
        admin_id:    user.id,
        action:      'approve_candidature',
        target_type: 'expert',
        target_id:   authUserId,
        new_value:   {
          candidature_id:   id,
          email:            candidature.email,
          display_name:     candidature.display_name,
          categories:       candidature.categories,
        },
      })

      // Génère le lien de définition du mot de passe
      const { data: resetLink } = await supabaseAdmin.auth.admin.generateLink({
        type:  'recovery',
        email: candidature.email,
      })
      const loginUrl = resetLink?.properties?.action_link ?? `${process.env.NEXT_PUBLIC_APP_URL}/login`

      // Email de bienvenue
      await resend.emails.send({
        from:    process.env.EMAIL_FROM!,
        to:      candidature.email,
        subject: 'Bienvenue chez Avisbox ! Votre compte expert est activé',
        html:    await render(
          React.createElement(WelcomeExpert, {
            prenom: candidature.first_name,
            message: message
              ? `${message}\n\nCliquez ici pour accéder à votre espace expert : ${loginUrl}`
              : `Cliquez ici pour accéder à votre espace expert : ${loginUrl}`,
          })
        ),
      })

    } else {
      // Refus de la candidature
      await supabaseAdmin.from('expert_applications')
        .update({ status: 'rejected', admin_notes: message })
        .eq('id', id)

      // Trace le refus dans l'audit
      await supabaseAdmin.from('audit_logs').insert({
        admin_id:    user.id,
        action:      'reject_candidature',
        target_type: 'expert',
        target_id:   candidature.user_id ?? id,
        new_value:   {
          candidature_id: id,
          email:          candidature.email,
          admin_notes:    message,
        },
      })

      await resend.emails.send({
        from:    process.env.EMAIL_FROM!,
        to:      candidature.email,
        subject: 'Votre candidature Avisbox - Réponse',
        react:   React.createElement(WelcomeExpert, {
          prenom:  candidature.first_name,
          message: message || 'Nous ne pouvons pas donner suite à votre candidature pour le moment. N\'hésitez pas à repostuler ultérieurement.',
        }),
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur POST /api/admin/candidatures/[id]/decide:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
