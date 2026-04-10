import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/candidatures - liste des candidatures experts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status') ?? 'pending'
    const q      = searchParams.get('q')      ?? ''

    const supabaseAdmin = createAdminClient()

    let query = supabaseAdmin
      .from('expert_applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (status !== 'all') query = query.eq('status', status)
    if (q) {
      query = query.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,display_name.ilike.%${q}%`
      )
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ candidatures: data ?? [] })

  } catch (error) {
    console.error('Erreur GET /api/admin/candidatures:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
