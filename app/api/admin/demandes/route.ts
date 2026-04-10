import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/demandes - toutes les demandes avec filtres
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const status   = searchParams.get('status')   ?? 'all'
    const category = searchParams.get('category') ?? ''
    const q        = searchParams.get('q')        ?? ''

    const supabaseAdmin = createAdminClient()

    let query = supabaseAdmin
      .from('requests')
      .select('id, category, title, status, amount_cents, created_at, expires_at, users(first_name, last_name, email)')
      .order('created_at', { ascending: false })

    if (status !== 'all') query = query.eq('status', status)
    if (category)         query = query.eq('category', category)

    const { data, error } = await query
    if (error) throw error

    let resultats = data ?? []

    if (q.trim()) {
      const terme = q.toLowerCase()
      resultats = resultats.filter((r: any) =>
        r.title?.toLowerCase().includes(terme) ||
        r.users?.email?.toLowerCase().includes(terme) ||
        r.users?.first_name?.toLowerCase().includes(terme) ||
        r.users?.last_name?.toLowerCase().includes(terme)
      )
    }

    return NextResponse.json({ requests: resultats, total: resultats.length })

  } catch (error) {
    console.error('Erreur GET /api/admin/demandes:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
