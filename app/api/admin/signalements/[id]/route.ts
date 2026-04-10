import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/signalements/[id] - détail complet d'un signalement
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: answer, error } = await supabaseAdmin
      .from('answers')
      .select(`
        *,
        requests(*, users(id, first_name, last_name, email)),
        experts(id, display_name, email, average_rating, total_answers, total_signals)
      `)
      .eq('id', id)
      .single()

    if (error || !answer) return NextResponse.json({ error: 'Signalement introuvable.' }, { status: 404 })

    // Déstructure pour que la page admin reçoive chaque entité séparément
    const { requests: request, experts: expert, ...answerOnly } = answer as any

    // Historique des emails manuels envoyés pour ce signalement
    const { data: emailHistory } = await supabaseAdmin
      .from('admin_emails')
      .select('*')
      .eq('related_type', 'signalement')
      .eq('related_id', id)
      .order('sent_at', { ascending: false })

    return NextResponse.json({
      answer:        answerOnly,
      request:       request,
      expert:        expert,
      user:          request?.users ?? null,
      email_history: emailHistory ?? [],
    })

  } catch (error) {
    console.error('Erreur GET /api/admin/signalements/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
