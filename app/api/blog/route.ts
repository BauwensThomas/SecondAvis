import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/blog - retourne tous les articles publiés (page publique)
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, titre, slug, image_url, extrait, created_at')
      .eq('publie', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des articles.' }, { status: 500 })
    }

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Erreur inattendue GET /api/blog:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
