import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ADMIN_EMAIL } from '@/lib/config'
import { calculerBadges } from '@/lib/utils'

// GET - liste publique des experts vérifiés et actifs, filtrables par catégorie
// Les comptes admin sont exclus même s'ils ont un compte expert associé
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const supabaseAdmin = createAdminClient()

    // Liste des emails admin à exclure de la liste publique
    const adminEmails = (process.env.ADMIN_EMAILS ?? ADMIN_EMAIL ?? '')
      .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)

    let query = supabaseAdmin
      .from('experts')
      .select('id, display_name, photo_url, bio, categories, years_experience, city, languages, average_rating, total_answers, total_signals, email')
      .eq('is_verified', true)
      .eq('is_active', true)
      .eq('is_blocked', false)
      .order('average_rating', { ascending: false })

    if (category) {
      query = query.contains('categories', [category])
    }

    const { data: experts, error } = await query

    if (error) {
      console.error('Erreur GET /api/experts:', error)
      return NextResponse.json({ error: 'Erreur lors du chargement.' }, { status: 500 })
    }

    // Exclure les experts dont l'email correspond à un compte admin
    const filtered = (experts ?? [])
      .filter((e) => !adminEmails.includes((e.email ?? '').toLowerCase()))
      .map(({ email: _email, ...rest }) => ({
        ...rest,
        badges: calculerBadges({ average_rating: rest.average_rating, total_answers: rest.total_answers, total_signals: rest.total_signals }),
      }))

    return NextResponse.json({ experts: filtered })

  } catch (error) {
    console.error('Erreur inattendue GET /api/experts:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
