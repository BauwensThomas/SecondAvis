import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'
import ExpertSuspended from '@/emails/ExpertSuspended'
import ExpertReactivated from '@/emails/ExpertReactivated'
import React from 'react'

// GET /api/admin/experts/[id] - profil complet d'un expert avec tout son historique
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient()

    const [
      { data: expert },
      { data: answers },
      { data: suspension_logs },
      { data: payouts },
      { data: chartes },
    ] = await Promise.all([
      supabaseAdmin.from('experts').select('*').eq('id', id).single(),
      supabaseAdmin.from('answers').select('id, content, verdict, delivered_at, is_paid, is_contested, contest_decision, contest_resolved, created_at, requests(title, category), ratings(score)').eq('expert_id', id).order('created_at', { ascending: false }),
      supabaseAdmin.from('suspension_logs').select('*').eq('expert_id', id).order('created_at', { ascending: false }),
      supabaseAdmin.from('payouts').select('*').eq('expert_id', id).order('created_at', { ascending: false }),
      supabaseAdmin.from('expert_charters').select('id, charter_version, signed_at, ip_address, pdf_url').eq('expert_id', id).order('signed_at', { ascending: false }),
    ])

    if (!expert) return NextResponse.json({ error: 'Expert introuvable.' }, { status: 404 })

    // Signalements uniquement
    const signalements = (answers ?? []).filter((a) => a.is_contested)

    const total_answers      = answers?.length ?? 0
    const total_signalements = signalements.length
    const signalements_refus = signalements.filter((s) => s.contest_decision === 'refund').length
    const litige_rate = total_answers > 0 ? Math.round((signalements_refus / total_answers) * 100) : 0

    // Dernière charte signée (la plus récente)
    const derniere_charte = chartes?.[0] ?? null

    return NextResponse.json({
      expert,
      answers:         answers ?? [],
      signalements,
      suspension_logs: suspension_logs ?? [],
      payouts:         payouts ?? [],
      charte:          derniere_charte,
      stats: { total_answers, total_signalements, signalements_refus, litige_rate },
    })

  } catch (error) {
    console.error('Erreur GET /api/admin/experts/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

// PATCH /api/admin/experts/[id] - modifier le statut ou les infos d'un expert
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const body = await request.json()
    const supabaseAdmin = createAdminClient()

    const { data: expert } = await supabaseAdmin.from('experts').select('*').eq('id', id).single()
    if (!expert) return NextResponse.json({ error: 'Expert introuvable.' }, { status: 404 })

    let updateData: Record<string, unknown> = { ...body }

    // Désactivation manuelle - raison obligatoire
    if (body.is_active === false && expert.is_active === true) {
      if (!body.suspension_reason?.trim()) {
        return NextResponse.json({ error: 'Veuillez indiquer la raison de la suspension.' }, { status: 400 })
      }
      updateData = {
        ...updateData,
        is_blocked:        true,
        suspension_type:   'manual',
        suspended_at:      new Date().toISOString(),
      }

      // Log de suspension
      await supabaseAdmin.from('suspension_logs').insert({
        expert_id:  id,
        action:     'suspended',
        type:       'manual',
        reason:     body.suspension_reason,
        created_by: 'admin',
      })

      // Email à l'expert
      await resend.emails.send({
        from:    process.env.EMAIL_FROM!,
        to:      expert.email,
        subject: 'Votre compte expert a été suspendu - SecondAvis',
        react:   React.createElement(ExpertSuspended, { prenomExpert: expert.first_name, raison: body.suspension_reason }),
      })
    }

    // Réactivation manuelle
    if (body.is_active === true && expert.is_active === false) {
      updateData = {
        ...updateData,
        is_blocked:        false,
        suspension_reason: null,
        suspension_type:   null,
        suspended_at:      null,
      }

      await supabaseAdmin.from('suspension_logs').insert({
        expert_id:  id,
        action:     'reactivated',
        created_by: 'admin',
      })

      await resend.emails.send({
        from:    process.env.EMAIL_FROM!,
        to:      expert.email,
        subject: 'Votre compte expert est à nouveau actif - SecondAvis',
        react:   React.createElement(ExpertReactivated, { prenomExpert: expert.first_name }),
      })
    }

    // Log d'audit - action précise selon le type de modification
    const actionAudit = body.is_active === false && expert.is_active === true ? 'suspend_expert'
      : body.is_active === true && expert.is_active === false ? 'reactivate_expert'
      : 'update_expert'

    await supabaseAdmin.from('audit_logs').insert({
      admin_id:    user.id,
      action:      actionAudit,
      target_type: 'expert',
      target_id:   id,
      old_value:   { is_active: expert.is_active, suspension_reason: expert.suspension_reason },
      new_value:   updateData,
      reason:      body.suspension_reason ?? null,
    })

    const { data: updated, error } = await supabaseAdmin
      .from('experts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ expert: updated })

  } catch (error) {
    console.error('Erreur PATCH /api/admin/experts/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
