import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// PATCH /api/admin/utilisateurs/[id]/block - bloquer ou débloquer un compte client
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { blocked, reason } = await request.json()

    // Raison obligatoire pour un blocage
    if (blocked && !reason?.trim()) {
      return NextResponse.json({ error: 'La raison du blocage est obligatoire.' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Vérifie que l'utilisateur existe avant la mise à jour
    const { data: avant, error: selectError } = await supabaseAdmin
      .from('users')
      .select('id, is_blocked, email')
      .eq('id', id)
      .single()

    if (selectError || !avant) {
      console.error('Erreur select utilisateur avant blocage:', selectError, '- id:', id)
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })
    }

    // Met à jour le statut de blocage
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ is_blocked: blocked })
      .eq('id', id)

    if (updateError) {
      console.error('Erreur update is_blocked:', updateError, '- id:', id)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour : ' + updateError.message }, { status: 500 })
    }

    // Vérifie que la modification a bien été persistée en DB
    const { data: apres, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('id, is_blocked')
      .eq('id', id)
      .single()

    if (verifyError || !apres) {
      console.error('Erreur vérification après update:', verifyError)
      return NextResponse.json({ error: 'Erreur de vérification.' }, { status: 500 })
    }

    if (apres.is_blocked !== blocked) {
      console.error('Valeur is_blocked incorrecte après update - attendu:', blocked, '- obtenu:', apres.is_blocked)
      return NextResponse.json({ error: 'La mise à jour n\'a pas été persistée.' }, { status: 500 })
    }

    // Trace dans l'audit (await pour catcher les erreurs)
    const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({
      admin_id:    user.id,
      action:      blocked ? 'block_user' : 'unblock_user',
      target_type: 'user',
      target_id:   id,
      old_value:   { is_blocked: avant.is_blocked },
      new_value:   { is_blocked: blocked },
      reason:      reason ?? null,
    })

    if (auditError) {
      console.error('Erreur audit_logs block_user:', auditError)
      // On ne fait pas échouer la requête pour une erreur d'audit, mais on la log
    }

    return NextResponse.json({ success: true, is_blocked: apres.is_blocked })

  } catch (error) {
    console.error('Erreur PATCH /api/admin/utilisateurs/[id]/block:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
