import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/marketing - liste des utilisateurs ayant accepté les emails marketing
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const exportJson = searchParams.get('export') === 'true'

    const supabaseAdmin = createAdminClient()

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, created_at')
      .eq('marketing_emails', true)
      .eq('is_blocked', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Mode export : retourne un fichier JSON téléchargeable
    if (exportJson) {
      const liste = (data ?? []).map((u) => ({
        email:      u.email,
        prenom:     u.first_name,
        nom:        u.last_name,
        inscrit_le: u.created_at,
      }))
      const json = JSON.stringify(liste, null, 2)
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="marketing-emails-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      })
    }

    return NextResponse.json({ users: data ?? [], total: data?.length ?? 0 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
