import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/paiements - historique complet des mouvements financiers
// Inclut : paiements clients, remboursements automatiques, remboursements admin, virements experts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const email  = (searchParams.get('email')  ?? '').trim()
    const type   = searchParams.get('type')   ?? 'all'  // 'all' | 'paiement' | 'remboursement' | 'virement'
    const status = searchParams.get('status') ?? 'all'  // 'all' | 'paid' | 'pending' | 'refunded'
    const role   = searchParams.get('role')   ?? 'all'  // 'all' | 'client' | 'expert'

    const supabaseAdmin = createAdminClient()

    // Recherche par email : trouve les user_ids et expert_ids correspondants
    let userIds:   string[] = []
    let expertIds: string[] = []
    if (email) {
      const [{ data: us }, { data: ex }] = await Promise.all([
        supabaseAdmin.from('users').select('id').ilike('email', `%${email}%`),
        supabaseAdmin.from('experts').select('id').ilike('email', `%${email}%`),
      ])
      userIds   = (us ?? []).map((r) => r.id)
      expertIds = (ex ?? []).map((r) => r.id)
    }

    const mouvements: any[] = []

    // ---- Paiements clients (requests confirmées) ----
    if ((type === 'all' || type === 'paiement') && (role === 'all' || role === 'client')) {
      let q = supabaseAdmin
        .from('requests')
        .select('id, title, amount_cents, created_at, status, stripe_payment_intent_id, users(id, first_name, last_name, email)')
        .eq('payment_confirmed', true)
        .order('created_at', { ascending: false })

      if (userIds.length > 0) q = q.in('user_id', userIds)
      else if (email && userIds.length === 0) {
        // Email fourni mais aucun user trouvé - skip
      } else {
        const { data } = await q
        for (const r of data ?? []) {
          const u = r.users as any
          mouvements.push({
            id:          `pay_${r.id}`,
            type:        'paiement',
            label:       `Paiement client — ${r.title}`,
            montant_cents: r.amount_cents,
            statut:      r.status === 'refunded' ? 'remboursé' : 'payé',
            date:        r.created_at,
            stripe_ref:  r.stripe_payment_intent_id ?? null,
            user_email:  u?.email ?? '',
            user_nom:    u ? `${u.first_name} ${u.last_name}` : '',
            request_id:  r.id,
          })
        }
      }

      if (userIds.length > 0) {
        let q2 = supabaseAdmin
          .from('requests')
          .select('id, title, amount_cents, created_at, status, stripe_payment_intent_id, users(id, first_name, last_name, email)')
          .eq('payment_confirmed', true)
          .in('user_id', userIds)
          .order('created_at', { ascending: false })
        const { data } = await q2
        for (const r of data ?? []) {
          const u = r.users as any
          mouvements.push({
            id:          `pay_${r.id}`,
            type:        'paiement',
            label:       `Paiement client — ${r.title}`,
            montant_cents: r.amount_cents,
            statut:      r.status === 'refunded' ? 'remboursé' : 'payé',
            date:        r.created_at,
            stripe_ref:  r.stripe_payment_intent_id ?? null,
            user_email:  u?.email ?? '',
            user_nom:    u ? `${u.first_name} ${u.last_name}` : '',
            request_id:  r.id,
          })
        }
      }
    }

    // ---- Remboursements (automatiques = expiration, manuels = admin) ----
    if ((type === 'all' || type === 'remboursement') && (role === 'all' || role === 'client')) {
      let q = supabaseAdmin
        .from('requests')
        .select('id, title, amount_cents, created_at, status, stripe_payment_intent_id, refund_reason, users(id, first_name, last_name, email)')
        .eq('status', 'refunded')
        .order('created_at', { ascending: false })

      if (userIds.length > 0) q = q.in('user_id', userIds)

      const { data } = email && userIds.length === 0 ? { data: [] } : await q
      for (const r of data ?? []) {
        const u = r.users as any
        mouvements.push({
          id:          `refund_${r.id}`,
          type:        'remboursement',
          label:       (r as any).refund_reason
            ? `Remboursement admin — ${r.title}`
            : `Remboursement automatique — ${r.title}`,
          montant_cents: r.amount_cents,
          statut:      'remboursé',
          date:        r.created_at,
          stripe_ref:  r.stripe_payment_intent_id ?? null,
          user_email:  u?.email ?? '',
          user_nom:    u ? `${u.first_name} ${u.last_name}` : '',
          request_id:  r.id,
          raison:      (r as any).refund_reason ?? null,
        })
      }
    }

    // ---- Virements experts ----
    if ((type === 'all' || type === 'virement') && (role === 'all' || role === 'expert')) {
      // Cas spécial : status=eligible → on retourne les virements à payer (answers prêtes à payer, pas encore de payout)
      // Cas spécial : status=all → on retourne payouts + virements à payer (eligible)
      const wantEligible = status === 'eligible' || status === 'all';
      const wantPayouts = status !== 'eligible';

      // 1. Virements existants (payouts)
      if (wantPayouts) {
        let q = supabaseAdmin
          .from('payouts')
          .select('id, amount_cents, created_at, status, stripe_transfer_id, experts(id, display_name, email, stripe_account_id)')
          .order('created_at', { ascending: false })

        if (expertIds.length > 0) q = q.in('expert_id', expertIds)

        const { data } = email && expertIds.length === 0 ? { data: [] } : await q
        for (const p of data ?? []) {
          const e = p.experts as any
          mouvements.push({
            id:          `payout_${p.id}`,
            type:        'virement',
            label:       `Virement expert — ${e?.display_name ?? 'Expert'}`,
            montant_cents: p.amount_cents,
            statut:      p.status === 'paid' ? 'payé' : 'en attente',
            date:        p.created_at,
            stripe_ref:  p.stripe_transfer_id ?? null,
            user_email:  e?.email ?? '',
            user_nom:    e?.display_name ?? '',
            expert_id:   e?.id ?? null,
            expert_stripe_connected: !!e?.stripe_account_id,
          })
        }
      }

      // 2. Virements à payer (eligible, pas encore payout)
      if (wantEligible) {
        const { data: pendingAnswers, error } = await supabaseAdmin
          .from('answers')
          .select(`id, request_id, expert_id, delivered_at, payment_eligible_at, is_paid, is_contested, contest_resolved, contest_decision, experts(id, display_name, email, stripe_account_id)`)
          .eq('is_paid', false)
          .eq('is_contested', false)
          .eq('contest_resolved', false)
          .is('contest_decision', null)
          .lte('payment_eligible_at', new Date().toISOString())
        if (error) throw error

        // On filtre pour ne garder que celles qui n'ont pas de ligne dans payouts
        const answerIds = pendingAnswers.map((a: any) => a.id)
        let payouts: any[] = []
        if (answerIds.length > 0) {
          const { data: payoutsData, error: payoutsError } = await supabaseAdmin
            .from('payouts')
            .select('answer_id')
            .in('answer_id', answerIds)
          if (payoutsError) throw payoutsError
          payouts = payoutsData
        }
        const payoutsAnswerIds = new Set(payouts.map((p: any) => p.answer_id))
        const results = pendingAnswers.filter((a: any) => !payoutsAnswerIds.has(a.id))

        for (const a of results) {
          const e = a.experts as any
          mouvements.push({
            id:          `eligible_${a.id}`,
            type:        'virement',
            label:       `Virement expert — ${e?.display_name ?? 'Expert'}`,
            montant_cents: Number(process.env.NEXT_PUBLIC_EXPERT_PAYMENT_CENTS) || 1000,
            statut:      'à payer',
            date:        a.delivered_at,
            stripe_ref:  null,
            user_email:  e?.email ?? '',
            user_nom:    e?.display_name ?? '',
            expert_id:   e?.id ?? null,
            payment_eligible_at: a.payment_eligible_at,
            expert_stripe_connected: !!e?.stripe_account_id,
          })
        }
      }
    }

    // Trie par date décroissante et filtre par statut
    let resultats = mouvements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    if (status === 'paid')    resultats = resultats.filter((m) => m.statut === 'payé')
    if (status === 'pending') resultats = resultats.filter((m) => m.statut === 'en attente')
    if (status === 'refunded')resultats = resultats.filter((m) => m.statut === 'remboursé')
    if (status === 'eligible')resultats = resultats.filter((m) => m.statut === 'à payer')

    return NextResponse.json({ mouvements: resultats })

  } catch (error) {
    console.error('Erreur GET /api/admin/paiements:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
