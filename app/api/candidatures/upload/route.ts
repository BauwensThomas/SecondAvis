import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/candidatures/upload - upload du justificatif pour une candidature expert
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file     = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 })

    const maxMb   = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB ?? 10)
    const allowed = (process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES ?? 'image/jpeg,image/png,image/webp,application/pdf').split(',')

    if (file.size > maxMb * 1024 * 1024) {
      return NextResponse.json({ error: `Fichier trop lourd (max ${maxMb} MB).` }, { status: 400 })
    }
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Format non accepté. Utilisez JPG, PNG ou PDF.' }, { status: 400 })
    }

    const ext      = file.name.split('.').pop() ?? 'bin'
    const nom      = `candidatures/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer   = await file.arrayBuffer()

    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin.storage
      .from('documents')
      .upload(nom, buffer, { contentType: file.type, upsert: false })

    if (error) throw error

    const { data: { publicUrl } } = supabaseAdmin.storage.from('documents').getPublicUrl(nom)

    return NextResponse.json({ url: publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
