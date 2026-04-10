import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// PATCH /api/admin/gdpr/[id] - met à jour le statut d'une demande RGPD
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, notes } = body

    const supabaseAdmin = createAdminClient()

    // Récupère l'ancienne valeur pour l'audit
    const { data: avant } = await supabaseAdmin
      .from('gdpr_requests')
      .select('status, requester_id, requester_type')
      .eq('id', id)
      .single()

    const { error } = await supabaseAdmin
      .from('gdpr_requests')
      .update({
        status,
        notes,
        resolved_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', id)

    if (error) throw error

    // Trace dans l'audit
    await supabaseAdmin.from('audit_logs').insert({
      admin_id:    user.id,
      action:      'gdpr_erasure',
      target_type: avant?.requester_type ?? 'user',
      target_id:   avant?.requester_id ?? id,
      old_value:   { status: avant?.status },
      new_value:   { status, notes: notes ?? null },
    }).then(({ error: e }) => { if (e) console.error('audit gdpr:', e) })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
