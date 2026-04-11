import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const CATEGORIES = ['mecanique', 'immo', 'travaux', 'assurance', 'travail', 'comptabilite']
export const revalidate = 300 // Cache 5 minutes

// GET /api/stats/categories - retourne le nombre d'experts actifs et vérifiés par catégorie
export async function GET() {
  try {
    const supabaseAdmin = createAdminClient()

    const { data: experts } = await supabaseAdmin
      .from('experts')
      .select('categories')
      .eq('is_verified', true)
      .eq('is_active', true)

    // Compte le nombre d'experts par catégorie
    const compteurs: Record<string, number> = {}
    for (const cat of CATEGORIES) {
      compteurs[cat] = 0
    }

    for (const expert of experts ?? []) {
      for (const cat of expert.categories ?? []) {
        if (cat in compteurs) compteurs[cat]++
      }
    }

    return NextResponse.json({ categories: compteurs })

  } catch (error) {
    console.error('Erreur GET /api/stats/categories:', error)
    return NextResponse.json({ categories: {} }, { status: 500 })
  }
}
