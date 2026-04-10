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
    if (type === 'all' || type === 'paiement') {
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
    if (type === 'all' || type === 'remboursement') {
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
    if (type === 'all' || type === 'virement') {
      let q = supabaseAdmin
        .from('payouts')
        .select('id, amount_cents, created_at, status, stripe_transfer_id, experts(id, display_name, email)')
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
        })
      }
    }

    // Trie par date décroissante et filtre par statut
    let resultats = mouvements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    if (status === 'paid')    resultats = resultats.filter((m) => m.statut === 'payé')
    if (status === 'pending') resultats = resultats.filter((m) => m.statut === 'en attente')
    if (status === 'refunded')resultats = resultats.filter((m) => m.statut === 'remboursé')

    return NextResponse.json({ mouvements: resultats })

  } catch (error) {
    console.error('Erreur GET /api/admin/paiements:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
