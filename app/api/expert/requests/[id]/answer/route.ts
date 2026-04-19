import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { resend, EMAIL_FROM } from '@/lib/resend'
import { render } from '@react-email/components'
import AnswerReceived from '@/emails/AnswerReceived'
import { logEmail } from '@/lib/log-email'

const answerSchema = z.object({
  content: z.string().min(50, 'La réponse doit faire au moins 50 caractères'),
  verdict: z.string().min(5, 'Le verdict doit faire au moins 5 caractères').max(200, 'Le verdict ne peut pas dépasser 200 caractères'),
})

// POST - soumet une réponse à une demande avec protection contre la double soumission
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

    const supabaseAdmin = createAdminClient()

    // Récupère le profil expert
    const { data: expert, error: expertError } = await supabaseAdmin
      .from('experts')
      .select('id, is_active, is_verified, total_answers, display_name')
      .eq('user_id', user.id)
      .single()

    if (expertError || !expert) {
      return NextResponse.json({ error: 'Profil expert introuvable.' }, { status: 404 })
    }

    if (!expert.is_active || !expert.is_verified) {
      return NextResponse.json({ error: 'Votre compte expert est inactif.' }, { status: 403 })
    }

    const body = await request.json()
    const data = answerSchema.parse(body)

    // Protection contre la double soumission via une fonction PostgreSQL atomique
    // On vérifie que la demande est encore 'pending' avant d'insérer la réponse
    const { data: req, error: reqError } = await supabaseAdmin
      .from('requests')
      .select('id, status')
      .eq('id', id)
      .eq('status', 'pending')
      .single()

    if (reqError || !req) {
      return NextResponse.json(
        { error: 'Cette demande a déjà été prise en charge par un autre expert.' },
        { status: 409 }
      )
    }

    const now = new Date()
    const contestWindowEnds = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    const paymentEligibleAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)

    // Insère la réponse en base de données
    const { data: answer, error: answerError } = await supabaseAdmin
      .from('answers')
      .insert({
        request_id: id,
        expert_id: expert.id,
        content: data.content,
        verdict: data.verdict,
        delivered_at: now.toISOString(),
        contest_window_ends: contestWindowEnds.toISOString(),
        payment_eligible_at: paymentEligibleAt.toISOString(),
        is_contested: false,
        is_paid: false,
      })
      .select()
      .single()

    if (answerError) {
      console.error('Erreur insert answer:', answerError)
      return NextResponse.json({ error: "Erreur lors de l'enregistrement de la réponse." }, { status: 500 })
    }

    // Met à jour le statut de la demande à 'answered' et incrémente le compteur de l'expert
    await Promise.all([
      supabaseAdmin
        .from('requests')
        .update({ status: 'answered' })
        .eq('id', id),
      supabaseAdmin
        .from('experts')
        .update({ total_answers: (expert.total_answers ?? 0) + 1 })
        .eq('id', expert.id),
    ])

    // Récupère les infos du client pour lui envoyer l'email de notification
    const { data: reqData } = await supabaseAdmin
      .from('requests')
      .select('title, users(email, first_name)')
      .eq('id', id)
      .single()

    if (reqData) {
      const clientUser = reqData.users as unknown as { email: string; first_name: string } | null
      if (clientUser?.email) {
        const html = await render(AnswerReceived({
          prenomClient: clientUser.first_name,
          titreQuestion: reqData.title,
          nomExpert:     expert.display_name ?? 'Un expert',
          demandeId:     id,
        }))
        await resend.emails.send({
          from:    EMAIL_FROM,
          to:      clientUser.email,
          subject: 'Un expert a répondu à votre question - Avisbox',
          html,
        })
        await logEmail({ recipient_type: 'client', recipient_email: clientUser.email, related_type: 'reponse', related_id: id, subject: 'Un expert a répondu à votre question - Avisbox', body: `Réponse reçue de ${expert.display_name ?? 'un expert'} pour la demande : "${reqData.title}".` })
      }
    }

    return NextResponse.json({ answer }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Erreur inattendue POST /api/expert/requests/[id]/answer:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
