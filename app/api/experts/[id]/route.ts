import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET - profil public complet d'un expert avec ses 10 derniers avis
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabaseAdmin = createAdminClient()

    const { data: expert, error } = await supabaseAdmin
      .from('experts')
      .select('id, display_name, photo_url, bio, categories, years_experience, city, languages, availabilities, website_url, entity_type, company_name, average_rating, total_answers, created_at, phone, phone_public, address_street, address_zip, address_city, address_public')
      .eq('id', id)
      .eq('is_verified', true)
      .eq('is_blocked', false)
      .single()

    if (error || !expert) {
      return NextResponse.json({ error: 'Expert introuvable.' }, { status: 404 })
    }

    // Récupère les 10 derniers avis reçus par cet expert
    const { data: avis } = await supabaseAdmin
      .from('ratings')
      .select('score, comment, created_at')
      .eq('expert_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({ expert, avis: avis ?? [] })

  } catch (error) {
    console.error('Erreur inattendue GET /api/experts/[id]:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
