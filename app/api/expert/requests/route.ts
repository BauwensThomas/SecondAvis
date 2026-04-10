import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET - retourne les demandes disponibles pour l'expert connecté (selon ses catégories)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    // Récupère le profil expert pour avoir ses catégories
    const { data: expert, error: expertError } = await supabaseAdmin
      .from('experts')
      .select('id, categories, is_active, is_verified')
      .eq('user_id', user.id)
      .single()

    if (expertError || !expert) {
      return NextResponse.json({ error: 'Profil expert introuvable.' }, { status: 404 })
    }

    if (!expert.is_active || !expert.is_verified) {
      return NextResponse.json({ error: 'Votre compte expert est inactif ou non vérifié.' }, { status: 403 })
    }

    // Récupère les IDs des demandes auxquelles cet expert a déjà répondu
    const { data: dejaRepondues } = await supabaseAdmin
      .from('answers')
      .select('request_id')
      .eq('expert_id', expert.id)

    const idsExclus = (dejaRepondues ?? []).map((a) => a.request_id).filter(Boolean)

    // Récupère les demandes en attente dans les catégories de l'expert
    // Exclut les demandes verrouillées par un autre expert depuis moins de 10 minutes
    const lockCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    let query = supabaseAdmin
      .from('requests')
      .select('id, category, title, description, attachments, created_at, expires_at, amount_cents, locked_by, locked_at')
      .eq('status', 'pending')
      .eq('payment_confirmed', true)
      .in('category', expert.categories)
      .or(`locked_by.is.null,locked_by.eq.${expert.id},locked_at.lt.${lockCutoff}`)
      .order('created_at', { ascending: false })

    // Exclut les demandes déjà répondues si nécessaire
    if (idsExclus.length > 0) {
      query = query.not('id', 'in', `(${idsExclus.map((id) => `"${id}"`).join(',')})`)
    }

    const { data: requests, error: reqError } = await query

    if (reqError) {
      console.error('Erreur fetch requests expert:', reqError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des demandes.' }, { status: 500 })
    }

    return NextResponse.json({ requests: requests ?? [], expert_id: expert.id })

  } catch (error) {
    console.error('Erreur inattendue GET /api/expert/requests:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
