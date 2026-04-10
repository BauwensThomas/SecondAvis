import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/signalements - liste de tous les signalements
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const status   = searchParams.get('status')   ?? 'pending'
    const category = searchParams.get('category') ?? ''
    const q        = (searchParams.get('q') ?? '').toLowerCase().trim()

    const supabaseAdmin = createAdminClient()

    let query = supabaseAdmin
      .from('answers')
      .select(`
        id, contest_reason, contest_resolved, contest_decision, delivered_at, created_at, admin_decision_at,
        requests!inner(id, title, category, user_id, users(first_name, last_name, email)),
        experts(id, display_name, email, average_rating)
      `)
      .eq('is_contested', true)
      .order('created_at', { ascending: false })

    if (status === 'pending')  query = query.eq('contest_resolved', false)
    if (status === 'resolved') query = query.eq('contest_resolved', true)

    const { data: signalements, error } = await query
    if (error) throw error

    let resultats = signalements ?? []
    if (category) {
      resultats = resultats.filter((s: any) => s.requests?.category === category)
    }
    // Filtre par titre de demande ou nom de l'expert
    if (q) {
      resultats = resultats.filter((s: any) =>
        s.requests?.title?.toLowerCase().includes(q) ||
        s.experts?.display_name?.toLowerCase().includes(q)
      )
    }

    return NextResponse.json({ signalements: resultats })

  } catch (error) {
    console.error('Erreur GET /api/admin/signalements:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
