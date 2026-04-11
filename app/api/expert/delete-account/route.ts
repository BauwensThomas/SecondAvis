import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// POST - anonymise les données de l'expert (droit à l'effacement RGPD)
// Les réponses et transactions sont conservées avec un ID anonymisé (obligation légale)
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: expert } = await supabaseAdmin
      .from('experts')
      .select('id, is_active')
      .eq('user_id', user.id)
      .single()

    if (!expert) {
      return NextResponse.json({ error: 'Profil expert introuvable.' }, { status: 404 })
    }

    // Anonymise les données personnelles de l'expert
    await supabaseAdmin
      .from('experts')
      .update({
        display_name:    'Expert supprimé',
        first_name:      'Compte',
        last_name:       'supprimé',
        email:           `effaced_${user.id}@deleted.Avisbox.be`,
        phone:           '',
        bio:             null,
        photo_url:       null,
        website_url:     null,
        address_street:  '',
        address_zip:     '',
        address_city:    '',
        company_name:    null,
        bce_number:      null,
        vat_number:      null,
        stripe_account_id: null,
        is_active:       false,
        is_verified:     false,
      })
      .eq('id', expert.id)

    // Anonymise aussi le compte users lié
    await supabaseAdmin
      .from('users')
      .update({
        email:      `effaced_${user.id}@deleted.Avisbox.be`,
        first_name: 'Compte',
        last_name:  'supprimé',
        phone:      null,
        stripe_customer_id: null,
        registration_ip: null,
      })
      .eq('id', user.id)

    // Supprime le compte dans Supabase Auth
    await supabaseAdmin.auth.admin.deleteUser(user.id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur POST /api/expert/delete-account:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
