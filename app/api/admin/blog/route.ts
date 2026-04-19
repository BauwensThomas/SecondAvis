import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/config'
import { z } from 'zod'

const postSchema = z.object({
  titre:     z.string().min(3, 'Le titre doit faire au moins 3 caractères').max(200),
  contenu:   z.string().optional().default(''),
  slug:      z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug invalide (minuscules, chiffres, tirets)'),
  image_url:  z.string().nullable().optional(),
  image_ia:   z.boolean().optional().default(false),
  extrait:    z.string().max(160, 'L\'extrait ne peut pas dépasser 160 caractères').nullable().optional(),
  categorie:  z.enum(['mecanique', 'immo', 'travaux', 'assurance', 'travail', 'comptabilite']).nullable().optional(),
  publie:     z.boolean().optional().default(false),
})

// GET /api/admin/blog - liste tous les articles (publiés et brouillons)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient()
    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select('id, titre, slug, publie, created_at, extrait, categorie')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des articles.' }, { status: 500 })
    }

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Erreur inattendue GET /api/admin/blog:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}

// POST /api/admin/blog - crée un nouvel article
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const body = await request.json()
    const data = postSchema.parse(body)

    const supabaseAdmin = createAdminClient()

    // Vérifie que le slug est unique, ajoute un suffixe si nécessaire
    let slug = data.slug
    let suffixe = 2
    while (true) {
      const { data: existing } = await supabaseAdmin.from('posts').select('id').eq('slug', slug).maybeSingle()
      if (!existing) break
      slug = `${data.slug}-${suffixe}`
      suffixe++
    }

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({ ...data, slug })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la création de l\'article.' }, { status: 500 })
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Erreur inattendue POST /api/admin/blog:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
