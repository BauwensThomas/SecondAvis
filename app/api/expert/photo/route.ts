import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// POST - upload de la photo de profil de l'expert, stockée dans Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 })
    }

    // Vérifie le type et la taille
    const typesAutorises = ['image/jpeg', 'image/png', 'image/webp']
    if (!typesAutorises.includes(file.type)) {
      return NextResponse.json({ error: 'Format non accepté. Utilisez JPG, PNG ou WebP.' }, { status: 400 })
    }

    const tailleMaxMo = 2
    if (file.size > tailleMaxMo * 1024 * 1024) {
      return NextResponse.json({ error: `La photo ne doit pas dépasser ${tailleMaxMo} Mo.` }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Cherche l'identifiant expert pour nommer le fichier
    const { data: expert } = await supabaseAdmin
      .from('experts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!expert) {
      return NextResponse.json({ error: 'Profil expert introuvable.' }, { status: 404 })
    }

    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const nomFichier = `experts/${expert.id}/photo.${extension}`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(nomFichier, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('Erreur upload photo:', uploadError)
      return NextResponse.json({ error: "Erreur lors de l'upload." }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(nomFichier)

    // Met à jour la photo dans la base de données
    await supabaseAdmin
      .from('experts')
      .update({ photo_url: publicUrl })
      .eq('id', expert.id)

    return NextResponse.json({ photo_url: publicUrl })

  } catch (error) {
    console.error('Erreur inattendue POST /api/expert/photo:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
