import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// POST /api/admin/blog/generate-image - génère une image via Pollinations.ai et l'uploade dans Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { prompt } = await request.json()
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Le prompt est obligatoire.' }, { status: 400 })
    }

    // Raccourcit le prompt à 300 caractères max pour éviter les timeouts
    const promptCourt = prompt.trim().slice(0, 300)
    const encodedPrompt = encodeURIComponent(promptCourt)
    const seed = Math.floor(Math.random() * 999999)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux-realism&width=1200&height=630&nologo=true&seed=${seed}`

    const imageRes = await fetch(imageUrl, { signal: AbortSignal.timeout(60000) })

    if (!imageRes.ok) {
      return NextResponse.json({ error: "Erreur lors de la génération de l'image." }, { status: 500 })
    }

    const imageBuffer = await imageRes.arrayBuffer()
    const buffer      = Buffer.from(imageBuffer)
    const mimeType    = imageRes.headers.get('content-type') ?? 'image/jpeg'
    const ext         = mimeType.includes('png') ? 'png' : 'jpg'
    const filename    = `ia-${Date.now()}.${ext}`

    // Upload vers Supabase Storage bucket blog-images
    const supabaseAdmin = createAdminClient()
    const { error: uploadError } = await supabaseAdmin.storage
      .from('blog-images')
      .upload(filename, buffer, { contentType: mimeType, upsert: false })

    if (uploadError) {
      console.error('Erreur upload Supabase:', uploadError)
      return NextResponse.json({ error: "Erreur lors de l'upload de l'image générée." }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('blog-images')
      .getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })

  } catch (error) {
    console.error('Erreur inattendue POST /api/admin/blog/generate-image:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
