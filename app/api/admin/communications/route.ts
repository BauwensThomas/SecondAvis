import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/communications - historique de tous les emails envoyés par l'admin
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const q    = (searchParams.get('q') ?? '').trim().toLowerCase()
    const type = searchParams.get('type') ?? 'all' // 'all' | 'client' | 'expert'

    const supabaseAdmin = createAdminClient()

    let query = supabaseAdmin
      .from('admin_emails')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(200)

    if (type !== 'all') {
      query = query.eq('recipient_type', type)
    }

    if (q) {
      query = query.ilike('recipient_email', `%${q}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur GET /api/admin/communications:', error)
      return NextResponse.json({ error: 'Erreur lors du chargement.' }, { status: 500 })
    }

    return NextResponse.json({ emails: data ?? [] })

  } catch (error) {
    console.error('Erreur inattendue GET /api/admin/communications:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
