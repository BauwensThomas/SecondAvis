import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/utilisateurs/[id] - profil complet d'un client avec ses demandes
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient()

    const [{ data: client }, { data: requests }] = await Promise.all([
      supabaseAdmin.from('users').select('*').eq('id', id).single(),
      supabaseAdmin.from('requests')
        .select('id, category, title, status, amount_cents, created_at, expires_at, stripe_payment_intent_id, answers(id, verdict, delivered_at, is_paid, is_contested, contest_decision, experts(display_name))')
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
    ])

    if (!client) return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })

    const totalDepense = (requests ?? [])
      .filter((r) => r.status !== 'refunded')
      .reduce((acc, r) => acc + r.amount_cents, 0)

    const totalRembourse = (requests ?? [])
      .filter((r) => r.status === 'refunded')
      .reduce((acc, r) => acc + r.amount_cents, 0)

    return NextResponse.json({
      user: client,
      requests: requests ?? [],
      total_depense_cents: totalDepense,
      total_rembourse_cents: totalRembourse,
    })

  } catch (error) {
    console.error('Erreur GET /api/admin/utilisateurs/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

// PATCH /api/admin/utilisateurs/[id] - modifier les informations d'un client
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const body = await request.json()
    const { first_name, last_name, email, phone, marketing_emails } = body

    const supabaseAdmin = createAdminClient()

    // Récupère l'ancienne valeur pour l'audit
    const { data: ancien } = await supabaseAdmin.from('users').select('*').eq('id', id).single()
    if (!ancien) return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })

    // Vérifie l'unicité de l'email si modifié
    if (email && email !== ancien.email) {
      const { data: existing } = await supabaseAdmin.from('users').select('id').eq('email', email).neq('id', id).maybeSingle()
      if (existing) return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 409 })
    }

    const updateData: Record<string, unknown> = {}
    if (first_name    !== undefined) updateData.first_name    = first_name
    if (last_name     !== undefined) updateData.last_name     = last_name
    if (email         !== undefined) updateData.email         = email
    if (phone         !== undefined) updateData.phone         = phone || null
    if (marketing_emails !== undefined) updateData.marketing_emails = marketing_emails

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Trace dans l'audit
    await supabaseAdmin.from('audit_logs').insert({
      admin_id:    user.id,
      action:      'update_user',
      target_type: 'user',
      target_id:   id,
      old_value:   { first_name: ancien.first_name, last_name: ancien.last_name, email: ancien.email, phone: ancien.phone, marketing_emails: ancien.marketing_emails },
      new_value:   updateData,
    })

    return NextResponse.json({ user: updated })

  } catch (error) {
    console.error('Erreur PATCH /api/admin/utilisateurs/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
