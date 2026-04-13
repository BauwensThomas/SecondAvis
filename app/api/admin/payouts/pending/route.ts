// Route API admin : retourne tous les paiements experts en attente (réponses validées, non contestées, non payées, payment_eligible_at <= NOW, pas encore de ligne dans payouts)
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Retourne tous les paiements experts en attente, même si l'expert n'a pas connecté Stripe
export async function GET() {
  // On utilise le client service_role pour bypasser le RLS
  const supabase = createAdminClient()
  try {
    // On cherche toutes les réponses validées, non contestées, non payées, dont la date de paiement est passée
    // et qui n'ont pas encore de ligne dans payouts
    const { data: pendingAnswers, error } = await supabase
      .from('answers')
      .select(`id, request_id, expert_id, delivered_at, payment_eligible_at, is_paid, is_contested, contest_resolved, contest_decision, expert:expert_id(id, display_name, email, stripe_account_id)`)
      .eq('is_paid', false)
      .eq('is_contested', false)
      .eq('contest_resolved', false)
      .is('contest_decision', null)
      .lte('payment_eligible_at', new Date().toISOString())
    if (error) throw error

    // On filtre pour ne garder que celles qui n'ont pas de ligne dans payouts
    // On récupère tous les payouts existants pour ces answers
    const answerIds = pendingAnswers.map((a: any) => a.id)
    let payouts: any[] = []
    if (answerIds.length > 0) {
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select('answer_id')
        .in('answer_id', answerIds)
      if (payoutsError) throw payoutsError
      payouts = payoutsData
    }
    const payoutsAnswerIds = new Set(payouts.map((p: any) => p.answer_id))
    // On ne garde que les réponses sans payout
    const results = pendingAnswers.filter((a: any) => !payoutsAnswerIds.has(a.id))

    return NextResponse.json({ pending: results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}