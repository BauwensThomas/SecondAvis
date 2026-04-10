import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { resend, EMAIL_FROM } from '@/lib/resend'
import { render } from '@react-email/components'
import ContestCreatedClient from '@/emails/ContestCreatedClient'
import ContestCreatedExpert from '@/emails/ContestCreatedExpert'

const contestSchema = z.object({
  reason: z.enum(['vague', 'incorrecte', 'solicitation', 'abusif', 'autre'], {
    message: 'Veuillez choisir une raison.',
  }),
  details: z.string().optional(),
})

// POST - signale une réponse d'expert dans la fenêtre de 48h
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const body = await request.json()
    const data = contestSchema.parse(body)

    const supabaseAdmin = createAdminClient()

    // Récupère la réponse et vérifie que l'utilisateur est bien le propriétaire de la demande
    const { data: answer, error: answerError } = await supabaseAdmin
      .from('answers')
      .select('id, request_id, expert_id, is_contested, contest_window_ends')
      .eq('id', id)
      .single()

    if (answerError || !answer) {
      return NextResponse.json({ error: 'Réponse introuvable.' }, { status: 404 })
    }

    // Vérifie que la demande appartient bien à cet utilisateur
    const { data: req } = await supabaseAdmin
      .from('requests')
      .select('id, user_id')
      .eq('id', answer.request_id)
      .eq('user_id', user.id)
      .single()

    if (!req) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 })
    }

    // Vérifie que la fenêtre de 48h n'est pas expirée
    if (new Date(answer.contest_window_ends) < new Date()) {
      return NextResponse.json(
        { error: 'Le délai de signalement de 48h est dépassé.' },
        { status: 400 }
      )
    }

    // Vérifie que la réponse n'est pas déjà contestée
    if (answer.is_contested) {
      return NextResponse.json(
        { error: 'Cette réponse a déjà été signalée.' },
        { status: 400 }
      )
    }

    // Marque la réponse comme contestée
    await supabaseAdmin
      .from('answers')
      .update({
        is_contested: true,
        contest_reason: data.reason,
      })
      .eq('id', id)

    // Passe le statut de la demande à 'contested'
    await supabaseAdmin
      .from('requests')
      .update({ status: 'contested' })
      .eq('id', answer.request_id)

    // Récupère le titre de la demande pour le message de suspension
    const { data: reqData } = await supabaseAdmin
      .from('requests')
      .select('title, users(email, first_name)')
      .eq('id', answer.request_id)
      .single()

    const dateSignalement = new Date().toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })
    const titredemande    = reqData?.title ?? `#${answer.request_id}`

    // Bloque temporairement le compte de l'expert
    await supabaseAdmin
      .from('experts')
      .update({
        is_active: false,
        suspension_type: 'auto_contest',
        suspension_reason: `Signalement client le ${dateSignalement} sur la demande "${titredemande}"`,
        suspended_at: new Date().toISOString(),
      })
      .eq('id', answer.expert_id)

    const { data: expertData } = await supabaseAdmin
      .from('experts')
      .select('email, first_name')
      .eq('id', answer.expert_id)
      .single()

    const titre = reqData?.title ?? 'Votre demande'
    const clientUser = reqData?.users as unknown as { email: string; first_name: string } | null
    const adminEmail = process.env.EMAIL_ADMIN ?? ''
    const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.secondavis.be'

    // Envoie les emails en parallèle (client + expert + admin)
    await Promise.allSettled([
      clientUser?.email
        ? resend.emails.send({
            from:    EMAIL_FROM,
            to:      clientUser.email,
            subject: 'Votre signalement a été enregistré - SecondAvis',
            html:    await render(ContestCreatedClient({ prenomClient: clientUser.first_name, titreQuestion: titre })),
          })
        : Promise.resolve(),

      expertData?.email
        ? resend.emails.send({
            from:    EMAIL_FROM,
            to:      expertData.email,
            subject: 'Un signalement a été déposé sur votre réponse - SecondAvis',
            html:    await render(ContestCreatedExpert({ prenomExpert: expertData.first_name, titreQuestion: titre })),
          })
        : Promise.resolve(),

      adminEmail
        ? resend.emails.send({
            from:    EMAIL_FROM,
            to:      adminEmail,
            subject: `[Admin] Nouveau signalement - ${titre}`,
            html:    `<p>Nouveau signalement déposé.</p><p><strong>Demande :</strong> ${titre}</p><p><strong>Raison :</strong> ${data.reason}</p><p><a href="${appUrl}/admin/signalements">Traiter le signalement</a></p>`,
          })
        : Promise.resolve(),
    ])

    return NextResponse.json({ success: true })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Erreur inattendue POST /api/answers/[id]/contest:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
