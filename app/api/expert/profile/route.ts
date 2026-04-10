import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { containsForbiddenTerm } from '@/lib/forbidden-names'

const profileSchema = z.object({
  // Profil public
  display_name:    z.string().min(1, 'Le pseudo est obligatoire').refine(
    (val) => !containsForbiddenTerm(val),
    { message: 'Ce pseudo contient un terme réservé (admin, support, équipe...)' }
  ),
  bio:             z.string().min(1, 'La bio est obligatoire').max(500, 'Max 500 caractères'),
  years_experience: z.number().int().min(0, 'Valeur invalide').optional().default(0),
  city:            z.string().min(1, 'La ville est obligatoire'),
  website_url:     z.string().optional(),
  availabilities:  z.string().optional(),
  languages:       z.array(z.enum(['fr', 'nl', 'en'])).min(1, 'Choisissez au moins une langue'),
  categories:      z.array(z.string()).min(1, 'Choisissez au moins une catégorie'),

  // Contact
  phone:           z.string().min(1, 'Le téléphone est obligatoire'),
  phone_public:    z.boolean(),

  // Adresse
  address_street:  z.string().min(1, "La rue est obligatoire"),
  address_zip:     z.string().min(1, "Le code postal est obligatoire"),
  address_city:    z.string().min(1, "La ville est obligatoire"),
  address_public:  z.boolean(),

  // Informations professionnelles
  entity_type:    z.enum(['individual', 'company']),
  company_name:   z.string().optional(),
  bce_number:     z.string().optional(),
  vat_number:     z.string().optional(),
})

// PATCH - met à jour le profil complet de l'expert connecté
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const body = await request.json()
    const data = profileSchema.parse(body)

    const supabaseAdmin = createAdminClient()

    const { data: expert } = await supabaseAdmin
      .from('experts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!expert) {
      return NextResponse.json({ error: 'Profil expert introuvable.' }, { status: 404 })
    }

    const { error: dbError } = await supabaseAdmin
      .from('experts')
      .update({
        display_name:     data.display_name,
        bio:              data.bio,
        years_experience: data.years_experience,
        city:             data.city,
        website_url:      data.website_url || null,
        availabilities:   data.availabilities ?? null,
        languages:        data.languages,
        categories:       data.categories,
        phone:            data.phone,
        phone_public:     data.phone_public,
        address_street:   data.address_street,
        address_zip:      data.address_zip,
        address_city:     data.address_city,
        address_public:   data.address_public,
        entity_type:      data.entity_type,
        company_name:     data.company_name || null,
        bce_number:       data.bce_number || null,
        vat_number:       data.vat_number || null,
      })
      .eq('id', expert.id)

    if (dbError) {
      console.error('Erreur update expert profile:', dbError)
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Erreur inattendue PATCH /api/expert/profile:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
