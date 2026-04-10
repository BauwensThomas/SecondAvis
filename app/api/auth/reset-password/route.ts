import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})

// Met a jour le mot de passe apres verification du lien recu par email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (error) {
      return NextResponse.json(
        { error: "Lien expiré ou invalide. Redemandez un nouveau lien." },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    )
  }
}
