import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/audit - journal de toutes les actions admin avec recherche par email
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const limit  = Number(searchParams.get('limit')  ?? 50)
    const offset = Number(searchParams.get('offset') ?? 0)
    const action = searchParams.get('action') ?? ''
    const target = searchParams.get('target') ?? ''
    const email  = searchParams.get('email')  ?? ''

    const supabaseAdmin = createAdminClient()

    // Si recherche par email : trouve les IDs correspondants dans users, experts, et requests
    let targetIds: string[] = []
    if (email) {
      const [{ data: userRows }, { data: expertRows }] = await Promise.all([
        supabaseAdmin.from('users').select('id').ilike('email', `%${email}%`),
        supabaseAdmin.from('experts').select('id').ilike('email', `%${email}%`),
      ])
      const userIds   = (userRows   ?? []).map((r) => r.id)
      const expertIds = (expertRows ?? []).map((r) => r.id)

      // Récupère aussi les request_id des demandes de ces clients (pour les logs de remboursement)
      let requestIds: string[] = []
      if (userIds.length > 0) {
        const { data: reqRows } = await supabaseAdmin
          .from('requests')
          .select('id')
          .in('user_id', userIds)
        requestIds = (reqRows ?? []).map((r) => r.id)
      }

      targetIds = [...userIds, ...expertIds, ...requestIds]

      // Aucun compte trouvé - retourne une liste vide
      if (targetIds.length === 0) {
        return NextResponse.json({ logs: [] })
      }
    }

    let query = supabaseAdmin
      .from('audit_logs')
      .select('id, action, target_type, target_id, reason, old_value, new_value, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (action) query = query.eq('action', action)
    if (target) query = query.eq('target_type', target)
    if (targetIds.length > 0) query = query.in('target_id', targetIds)

    const { data, error } = await query
    if (error) throw error

    // Enrichit chaque log avec l'email de la cible (users ou experts)
    const logs = data ?? []
    const uniqueIds = [...new Set(logs.map((l) => l.target_id))].filter(Boolean)

    // Pas de logs = rien à enrichir
    if (uniqueIds.length === 0) {
      return NextResponse.json({ logs })
    }

    // Sépare les IDs par type de cible pour les requêtes d'enrichissement
    const requestIds = logs.filter((l) => l.target_type === 'request').map((l) => l.target_id)
    const otherIds   = logs.filter((l) => l.target_type !== 'request').map((l) => l.target_id)

    const [{ data: userEmails }, { data: expertEmails }, { data: requestRows }] = await Promise.all([
      otherIds.length > 0
        ? supabaseAdmin.from('users').select('id, email, first_name, last_name').in('id', otherIds)
        : Promise.resolve({ data: [] }),
      otherIds.length > 0
        ? supabaseAdmin.from('experts').select('id, email, display_name').in('id', otherIds)
        : Promise.resolve({ data: [] }),
      // Pour les remboursements : remonte jusqu'à l'email du client via requests → users
      requestIds.length > 0
        ? supabaseAdmin.from('requests').select('id, title, users(email, first_name, last_name)').in('id', requestIds)
        : Promise.resolve({ data: [] }),
    ])

    const emailMap: Record<string, string> = {}
    for (const u of userEmails ?? []) emailMap[u.id] = `${u.first_name} ${u.last_name} (${u.email})`
    for (const e of expertEmails ?? []) emailMap[e.id] = emailMap[e.id] ?? `${e.display_name} (${e.email})`
    for (const r of requestRows ?? []) {
      const u = r.users as any
      const label = u ? `${u.first_name} ${u.last_name} (${u.email})` : r.title
      emailMap[r.id] = `Demande "${r.title}" - ${label}`
    }

    const logsEnrichis = logs.map((l) => ({
      ...l,
      target_label: emailMap[l.target_id] ?? null,
    }))

    return NextResponse.json({ logs: logsEnrichis })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
