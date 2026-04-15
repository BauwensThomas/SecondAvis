import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/config'

// DELETE /api/admin/blog/delete-image - supprime une image du bucket blog-images
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { url } = await request.json()
    if (!url) {
      return NextResponse.json({ error: 'URL manquante.' }, { status: 400 })
    }

    // Extrait le nom du fichier depuis l'URL publique Supabase
    const nom = url.split('/blog-images/').pop()
    if (!nom) {
      return NextResponse.json({ error: 'Nom de fichier invalide.' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin.storage.from('blog-images').remove([nom])

    if (error) {
      console.error('Erreur suppression image:', error)
      return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur inattendue DELETE /api/admin/blog/delete-image:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
