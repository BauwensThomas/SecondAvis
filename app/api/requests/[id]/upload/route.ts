import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const MAX_SIZE_MB = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB) || 10
const ALLOWED_TYPES = (process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,application/pdf').split(',')

// POST - uploade un fichier vers Supabase Storage et l'associe à la demande
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    // Vérifie que la demande appartient bien à cet utilisateur
    const { data: req, error: reqError } = await supabaseAdmin
      .from('requests')
      .select('id, attachments')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (reqError || !req) {
      return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 })
    }

    // Validation de la taille
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Le fichier dépasse la taille maximale de ${MAX_SIZE_MB} MB.` },
        { status: 400 }
      )
    }

    // Validation du type MIME
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format non accepté. Formats autorisés : JPG, PNG, PDF.' },
        { status: 400 }
      )
    }

    // Nom de fichier unique pour éviter les collisions
    const extension = file.name.split('.').pop()
    const fileName = `${id}/${Date.now()}.${extension}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload vers Supabase Storage dans le bucket "documents"
    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('Erreur upload Supabase Storage:', uploadError)
      return NextResponse.json({ error: "Erreur lors de l'upload." }, { status: 500 })
    }

    // Récupère l'URL publique du fichier
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(fileName)

    const url = publicUrlData.publicUrl

    // Ajoute l'URL dans le tableau attachments de la demande
    const attachments = [...(req.attachments ?? []), url]
    await supabaseAdmin
      .from('requests')
      .update({ attachments })
      .eq('id', id)

    return NextResponse.json({ url })

  } catch (error) {
    console.error('Erreur inattendue POST /api/requests/[id]/upload:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
