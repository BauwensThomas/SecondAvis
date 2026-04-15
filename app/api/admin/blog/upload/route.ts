import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/config'

// POST /api/admin/blog/upload - upload une image dans le bucket blog-images
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 })
    }

    // Vérifie le type MIME - uniquement images
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format non accepté. Utilisez JPG, PNG, WebP ou GIF.' }, { status: 400 })
    }

    // Vérifie la taille - max 5MB pour les images de blog
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image trop lourde. Maximum 5MB.' }, { status: 400 })
    }

    // Nom unique pour éviter les conflits
    const ext = file.name.split('.').pop()
    const nom = `blog-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const supabaseAdmin = createAdminClient()
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabaseAdmin.storage
      .from('blog-images')
      .upload(nom, arrayBuffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('Erreur upload blog image:', uploadError)
      return NextResponse.json({ error: "Erreur lors de l'upload." }, { status: 500 })
    }

    // Génère l'URL publique
    const { data: { publicUrl } } = supabaseAdmin.storage.from('blog-images').getPublicUrl(nom)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Erreur inattendue POST /api/admin/blog/upload:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
