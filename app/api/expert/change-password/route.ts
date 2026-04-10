import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  current_password: z.string().min(1, 'Le mot de passe actuel est obligatoire'),
  new_password: z.string().min(8, 'Minimum 8 caractères'),
})

// POST - change le mot de passe de l'expert connecté après vérification de l'ancien
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const body = await request.json()
    const data = schema.parse(body)

    // Vérifie le mot de passe actuel
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: data.current_password,
    })

    if (signInError) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 401 })
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: data.new_password })

    if (updateError) {
      return NextResponse.json({ error: 'Erreur lors du changement de mot de passe.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Erreur inattendue POST /api/expert/change-password:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
