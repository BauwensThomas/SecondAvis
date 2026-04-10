import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/utilisateurs - liste des clients avec filtres et recherche
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const q      = searchParams.get('q')      ?? ''
    const status = searchParams.get('status') ?? 'all'

    const supabaseAdmin = createAdminClient()

    let query = supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, phone, is_blocked, created_at, stripe_customer_id')
      .order('created_at', { ascending: false })

    if (status === 'active')  query = query.eq('is_blocked', false)
    if (status === 'blocked') query = query.eq('is_blocked', true)

    const { data: users, error } = await query
    if (error) throw error

    let resultats = users ?? []

    if (q.trim()) {
      const terme = q.toLowerCase()
      resultats = resultats.filter((u) =>
        [u.email, u.first_name, u.last_name, u.phone].some(
          (champ) => champ?.toLowerCase().includes(terme)
        )
      )
    }

    return NextResponse.json({ users: resultats, total: resultats.length })

  } catch (error) {
    console.error('Erreur GET /api/admin/utilisateurs:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
