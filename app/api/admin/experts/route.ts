import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/experts - liste des experts avec filtres et recherche universelle
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const q        = searchParams.get('q')        ?? ''
    const status   = searchParams.get('status')   ?? 'all'
    const category = searchParams.get('category') ?? ''

    const supabaseAdmin = createAdminClient()

    let query = supabaseAdmin
      .from('experts')
      .select('id, display_name, first_name, last_name, email, phone, city, categories, average_rating, total_answers, total_signals, is_verified, is_active, is_blocked, suspension_reason, suspension_type, suspended_at, created_at')
      .order('created_at', { ascending: false })


    // Filtre par statut (corrigé)
    if (status === 'active') {
      query = query.eq('is_active', true).eq('is_verified', true)
    }
    if (status === 'suspended') {
      // Suspendus manuellement ou auto, mais pas supprimés
      query = query.eq('is_active', false).not('suspension_type', 'eq', 'self_delete')
    }
    if (status === 'pending') {
      // Non vérifiés, pas supprimés
      query = query.eq('is_verified', false).not('suspension_type', 'eq', 'self_delete')
    }
    if (status === 'deleted') {
      // Supprimés volontairement
      query = query.eq('suspension_type', 'self_delete')
    }

    // Filtre par catégorie
    if (category) query = query.contains('categories', [category])

    const { data: experts, error } = await query

    if (error) throw error

    // Recherche textuelle côté serveur
    let resultats = experts ?? []
    if (q.trim()) {
      const terme = q.toLowerCase()
      resultats = resultats.filter((e) =>
        [e.email, e.first_name, e.last_name, e.display_name, e.phone, e.city].some(
          (champ) => champ?.toLowerCase().includes(terme)
        )
      )
    }

    // Récupère les IDs des experts qui ont signé la charte
    const expertIds = resultats.map((e) => e.id)
    let charteSignees = new Set<string>()

    if (expertIds.length > 0) {
      const { data: chartes } = await supabaseAdmin
        .from('expert_charters')
        .select('expert_id')
        .in('expert_id', expertIds)

      charteSignees = new Set((chartes ?? []).map((c) => c.expert_id))
    }

    // Ajoute le champ charte_signee sur chaque expert
    const resultatsAvecCharte = resultats.map((e) => ({
      ...e,
      charte_signee: charteSignees.has(e.id),
    }))

    return NextResponse.json({ experts: resultatsAvecCharte, total: resultatsAvecCharte.length })

  } catch (error) {
    console.error('Erreur GET /api/admin/experts:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
