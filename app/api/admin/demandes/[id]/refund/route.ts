import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// POST /api/admin/demandes/[id]/refund - remboursement manuel d'une demande via Stripe
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { id } = await params
    const { reason } = await request.json()

    const supabaseAdmin = createAdminClient()

    const { data: req, error } = await supabaseAdmin
      .from('requests')
      .select('id, user_id, status, stripe_payment_intent_id, amount_cents')
      .eq('id', id)
      .single()

    if (error || !req) return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
    if (req.status === 'refunded') return NextResponse.json({ error: 'Déjà remboursé.' }, { status: 400 })

    // Déclenche le remboursement Stripe si un payment intent est disponible
    if (req.stripe_payment_intent_id) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      await stripe.refunds.create({ payment_intent: req.stripe_payment_intent_id })
    }

    // Stocke la raison dans la demande ET met le statut à remboursé
    const { error: updateError } = await supabaseAdmin.from('requests').update({
      status: 'refunded',
      refund_reason: reason ?? 'Remboursement manuel admin',
    }).eq('id', id)

    if (updateError) {
      console.error('Erreur update request:', updateError)
      return NextResponse.json({ error: `Erreur mise à jour : ${updateError.message}` }, { status: 500 })
    }

    // Trace dans audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      admin_id: user.id,
      action: 'refund',
      target_type: 'request',
      target_id: id,
      old_value: { status: req.status },
      new_value: { status: 'refunded' },
      reason: reason ?? 'Remboursement manuel admin',
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
