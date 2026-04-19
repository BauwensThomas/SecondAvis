import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/config'
import { z } from 'zod'

const updateSchema = z.object({
  titre:     z.string().min(3).max(200).optional(),
  contenu:   z.string().optional(),
  slug:      z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
  image_url:  z.string().nullable().optional(),
  image_ia:   z.boolean().optional(),
  extrait:    z.string().max(160).nullable().optional(),
  categorie:  z.enum(['mecanique', 'immo', 'travaux', 'assurance', 'travail', 'comptabilite']).nullable().optional(),
  publie:     z.boolean().optional(),
})

// Vérifie que l'utilisateur est admin - retourne null si non autorisé
async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return null
  return user
}

// GET /api/admin/blog/[id] - retourne un article complet (avec contenu HTML)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })

  const supabaseAdmin = createAdminClient()
  const { data: post, error } = await supabaseAdmin.from('posts').select('*').eq('id', id).single()

  if (error || !post) return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 })

  return NextResponse.json({ post })
}

// PATCH /api/admin/blog/[id] - modifie un article existant
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await checkAdmin()
    if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })

    const body = await request.json()
    const data = updateSchema.parse(body)

    const supabaseAdmin = createAdminClient()
    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Erreur lors de la modification.' }, { status: 500 })

    return NextResponse.json({ post })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Erreur PATCH /api/admin/blog/[id]:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}

// DELETE /api/admin/blog/[id] - supprime un article et son image dans le Storage
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })

  const supabaseAdmin = createAdminClient()

  // Récupère l'URL de l'image avant de supprimer l'article
  const { data: post } = await supabaseAdmin.from('posts').select('image_url').eq('id', id).single()

  // Supprime l'image du bucket si elle existe
  if (post?.image_url) {
    const nom = post.image_url.split('/blog-images/').pop()
    if (nom) await supabaseAdmin.storage.from('blog-images').remove([nom])
  }

  const { error } = await supabaseAdmin.from('posts').delete().eq('id', id)

  if (error) return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })

  return NextResponse.json({ success: true })
}
