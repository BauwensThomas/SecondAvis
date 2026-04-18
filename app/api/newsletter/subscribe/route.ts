import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schéma de validation de l'email
const schemaInscription = z.object({
  email: z.string().email('Adresse email invalide.'),
})

// POST /api/newsletter/subscribe - inscription à la newsletter blog
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const resultat = schemaInscription.safeParse(body)

    if (!resultat.success) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    }

    const { email } = resultat.data
    const supabase = createAdminClient()

    // Vérifier si l'email est déjà inscrit
    const { data: existant } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existant) {
      // On retourne un succès silencieux pour ne pas révéler les emails déjà inscrits
      return NextResponse.json({ success: true })
    }

    // Insérer le nouvel abonné
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: email.toLowerCase(),
      })

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
