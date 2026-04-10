import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ratingSchema = z.object({
  answer_id: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
})

// POST - enregistre la note du client et recalcule la moyenne de l'expert
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const body = await request.json()
    const data = ratingSchema.parse(body)

    const supabaseAdmin = createAdminClient()

    // Vérifie que la réponse existe et que l'utilisateur est bien le propriétaire de la demande
    const { data: answer } = await supabaseAdmin
      .from('answers')
      .select('id, expert_id, request_id, contest_decision, contest_resolved, requests(user_id, status)')
      .eq('id', data.answer_id)
      .single()

    if (!answer) {
      return NextResponse.json({ error: 'Réponse introuvable.' }, { status: 404 })
    }

    const req = answer.requests as unknown as { user_id: string; status: string } | null
    if (!req || req.user_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    // On peut noter si la demande est answered ou closed,
    // ou si l'admin a validé le signalement (contest_decision = 'validate')
    const adminAValide = answer.contest_resolved && answer.contest_decision === 'validate'
    const statutAutorise = req.status === 'answered' || req.status === 'closed'

    if (!statutAutorise && !adminAValide) {
      return NextResponse.json({ error: 'Vous ne pouvez pas noter cette réponse pour le moment.' }, { status: 400 })
    }

    // Vérifie qu'il n'y a pas déjà une note pour cette réponse
    const { data: existante } = await supabaseAdmin
      .from('ratings')
      .select('id')
      .eq('answer_id', data.answer_id)
      .eq('user_id', user.id)
      .single()

    if (existante) {
      return NextResponse.json({ error: 'Vous avez déjà noté cette réponse.' }, { status: 409 })
    }

    // Récupère l'id de l'utilisateur dans la table users
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!userRow) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })
    }

    // Enregistre la note
    await supabaseAdmin.from('ratings').insert({
      answer_id:  data.answer_id,
      user_id:    userRow.id,
      expert_id:  answer.expert_id,
      score:      data.score,
      comment:    data.comment ?? null,
    })

    // Recalcule la note moyenne de l'expert
    const { data: allRatings } = await supabaseAdmin
      .from('ratings')
      .select('score')
      .eq('expert_id', answer.expert_id)

    const scores = (allRatings ?? []).map((r) => r.score)
    const moyenne = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0

    await supabaseAdmin
      .from('experts')
      .update({ average_rating: Math.round(moyenne * 10) / 10 })
      .eq('id', answer.expert_id)

    // ---- Règles de suspension automatique ----

    // Règle 1 : 3 notes de 1 étoile consécutives → suspension
    const { data: dernieres } = await supabaseAdmin
      .from('ratings')
      .select('score')
      .eq('expert_id', answer.expert_id)
      .order('created_at', { ascending: false })
      .limit(3)

    const troisMauvaises = dernieres && dernieres.length === 3 && dernieres.every((r) => r.score === 1)

    // Règle 2 : moyenne < 4.2 après au moins 10 avis → suspension
    const moyenneBasse = scores.length >= 10 && moyenne < 4.2

    if (troisMauvaises || moyenneBasse) {
      const raison = troisMauvaises
        ? '3 notes consécutives de 1 étoile reçues'
        : `Note moyenne de ${moyenne.toFixed(1)} après ${scores.length} avis (seuil : 4.2)`

      await supabaseAdmin
        .from('experts')
        .update({
          is_active: false,
          suspension_reason: raison,
          suspension_type: 'auto_rating',
          suspended_at: new Date().toISOString(),
        })
        .eq('id', answer.expert_id)

      await supabaseAdmin.from('suspension_logs').insert({
        expert_id:  answer.expert_id,
        action:     'suspended',
        type:       'auto_rating',
        reason:     raison,
        created_by: 'system',
      })
    }

    return NextResponse.json({ success: true, average_rating: Math.round(moyenne * 10) / 10 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Erreur inattendue POST /api/ratings:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
