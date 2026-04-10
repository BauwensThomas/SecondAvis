import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET - retourne le résumé des gains de l'expert connecté
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: expert } = await supabaseAdmin
      .from('experts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!expert) {
      return NextResponse.json({ error: 'Profil expert introuvable.' }, { status: 404 })
    }

    const expertPaymentCents = Number(process.env.NEXT_PUBLIC_EXPERT_PAYMENT_CENTS) || 200

    // Récupère toutes les réponses pour calculer les montants
    const { data: answers } = await supabaseAdmin
      .from('answers')
      .select('id, is_paid, is_contested, contest_decision, contest_window_ends, payment_eligible_at, delivered_at, requests(title, category)')
      .eq('expert_id', expert.id)
      .order('delivered_at', { ascending: false })

    let total_earned = 0
    let total_pending = 0
    let total_contested = 0

    for (const answer of answers ?? []) {
      if (answer.is_paid) {
        // Déjà payé
        total_earned += expertPaymentCents
      } else if (answer.is_contested && answer.contest_decision === null) {
        // Signalement en cours, décision admin pas encore rendue - montant gelé
        total_contested += expertPaymentCents
      } else if (answer.contest_decision !== 'refund') {
        // Pas encore payé mais pas refusé - en attente (qu'on soit dans les 48h ou pas)
        total_pending += expertPaymentCents
      }
      // contest_decision === 'refund' → rien à comptabiliser
    }

    return NextResponse.json({
      total_earned,
      total_pending,
      total_contested,
      expert_payment_cents: expertPaymentCents,
      answers: answers ?? [],
    })

  } catch (error) {
    console.error('Erreur inattendue GET /api/expert/balance:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
