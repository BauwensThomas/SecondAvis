import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/avis - liste des réponses avec/sans avis client, recherche par email
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const email  = (searchParams.get('email') ?? '').trim().toLowerCase()
    const filter = searchParams.get('filter') ?? 'all' // 'all' | 'rated' | 'unrated'

    const supabaseAdmin = createAdminClient()

    // Si recherche par email, trouve les user_ids correspondants
    let userIds: string[] | null = null
    if (email) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id')
        .ilike('email', `%${email}%`)
      userIds = (users ?? []).map((u) => u.id)
      if (userIds.length === 0) {
        return NextResponse.json({ avis: [], stats: { recus: 0, en_attente: 0 } })
      }
    }

    // Récupère les réponses livrées (non refusées, non remboursées)
    let query = supabaseAdmin
      .from('answers')
      .select(`
        id, delivered_at, verdict, is_paid, request_id, expert_id,
        requests!inner(id, title, category, status, user_id,
          users(id, first_name, last_name, email)
        ),
        experts(display_name, email),
        ratings(id, score, comment, created_at)
      `)
      .or('is_contested.eq.false,and(is_contested.eq.true,contest_decision.eq.validate)')
      .order('delivered_at', { ascending: false })

    const { data: answers, error } = await query
    if (error) throw error

    let resultats = (answers ?? []) as any[]

    // Filtre par user_id si recherche email
    if (userIds) {
      resultats = resultats.filter((a) => userIds!.includes(a.requests?.user_id))
    }

    // Filtre rated / unrated
    if (filter === 'rated')   resultats = resultats.filter((a) => a.ratings?.length > 0)
    if (filter === 'unrated') resultats = resultats.filter((a) => !a.ratings?.length)

    // Filtre : ne garder que les avis dont le client et l'expert ne sont pas anonymisés
    resultats = resultats.filter((a) => {
      const userEmail = a.requests?.users?.email || ''
      const expertEmail = a.experts?.email || ''
      return !userEmail.startsWith('effaced_') && !expertEmail.startsWith('effaced_')
    })

    // Stats globales (avant filtre rated/unrated mais après filtre email)
    const tous      = userIds
      ? (answers ?? []).filter((a: any) => userIds!.includes(a.requests?.user_id))
      : (answers ?? [])
    const recus     = tous.filter((a: any) => a.ratings?.length > 0).length
    const en_attente = tous.filter((a: any) => !a.ratings?.length).length

    // Calcule le nombre de jours depuis la livraison pour chaque réponse sans avis
    const avis = resultats.map((a: any) => ({
      id:             a.id,
      delivered_at:   a.delivered_at,
      verdict:        a.verdict,
      is_paid:        a.is_paid,
      request_id:     a.request_id,
      request_title:  a.requests?.title ?? '-',
      request_category: a.requests?.category ?? '-',
      user_id:        a.requests?.user_id,
      user_first_name: a.requests?.users?.first_name ?? '',
      user_last_name:  a.requests?.users?.last_name  ?? '',
      user_email:      a.requests?.users?.email      ?? '',
      expert_name:     a.experts?.display_name ?? '-',
      expert_email:    a.experts?.email        ?? '',
      jours_depuis:   Math.floor((Date.now() - new Date(a.delivered_at).getTime()) / (1000 * 60 * 60 * 24)),
      rated:          (a.ratings?.length ?? 0) > 0,
      rating:         a.ratings?.[0] ?? null,
    }))

    return NextResponse.json({ avis, stats: { recus, en_attente } })

  } catch (error) {
    console.error('Erreur GET /api/admin/avis:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
