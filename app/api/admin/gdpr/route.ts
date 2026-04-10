import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/gdpr - liste des demandes RGPD, ou export JSON si ?export=true
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const exportMode   = searchParams.get('export') === 'true'
    const status       = searchParams.get('status') ?? 'pending'
    const requesterId  = searchParams.get('requester_id')
    const requesterType = searchParams.get('requester_type')

    const supabaseAdmin = createAdminClient()

    // Mode export : génère un JSON complet pour une personne
    if (exportMode && requesterId && requesterType) {
      let exportData: any = { requester_id: requesterId, requester_type: requesterType, exported_at: new Date().toISOString() }

      if (requesterType === 'user') {
        const { data: u } = await supabaseAdmin.from('users').select('*').eq('id', requesterId).single()
        const { data: req } = await supabaseAdmin.from('requests').select('id, title, category, status, amount_cents, created_at').eq('user_id', requesterId)
        exportData.user = u
        exportData.requests = req ?? []
      } else {
        const { data: e } = await supabaseAdmin.from('experts').select('id, display_name, first_name, last_name, email, city, categories, bio, created_at').eq('id', requesterId).single()
        const { data: ans } = await supabaseAdmin.from('answers').select('id, content, delivered_at, is_paid, created_at').eq('expert_id', requesterId)
        exportData.expert = e
        exportData.answers = ans ?? []
      }

      const json = JSON.stringify(exportData, null, 2)
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="export-rgpd-${requesterId}.json"`,
        },
      })
    }

    const email = searchParams.get('email') ?? ''

    // Mode liste : retourne les demandes RGPD
    let query = supabaseAdmin
      .from('gdpr_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (status !== 'all') query = query.eq('status', status)
    if (email.trim()) query = query.ilike('requester_email', `%${email.trim()}%`)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ requests: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
