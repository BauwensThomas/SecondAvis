import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'

// POST /api/candidatures - soumet une candidature expert (utilisateur connecté obligatoire)
export async function POST(request: NextRequest) {
  try {
    // Récupère l'utilisateur connecté - la candidature est liée à son compte
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Vous devez être connecté pour postuler.' }, { status: 401 })
    }

    const body = await request.json()

    const {
      first_name, last_name, email, phone,
      display_name, bio, categories, years_experience, city, languages,
      entity_type, company_name, bce_number, vat_number,
      motivation, document_url,
    } = body

    // Validation des champs obligatoires
    if (!first_name || !last_name || !email || !phone || !display_name ||
        !categories?.length || !years_experience || !city || !entity_type || !document_url) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Récupère l'ID interne de l'utilisateur dans la table users
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!userRow) {
      return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 })
    }

    // Vérifie qu'une candidature n'existe pas déjà avec cet email (status pending)
    const { data: existante } = await supabaseAdmin
      .from('expert_applications')
      .select('id, status')
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existante) {
      return NextResponse.json({ error: 'Une candidature est déjà en cours pour cet email.' }, { status: 409 })
    }

    // Vérifie que cet utilisateur n'est pas déjà expert
    const { data: expertExistant } = await supabaseAdmin
      .from('experts')
      .select('id')
      .eq('user_id', userRow.id)
      .single()

    if (expertExistant) {
      return NextResponse.json({ error: 'Vous êtes déjà enregistré comme expert.' }, { status: 409 })
    }

    // Insère la candidature avec le user_id du compte connecté
    const { data: candidature, error } = await supabaseAdmin
      .from('expert_applications')
      .insert({
        user_id:      userRow.id,
        first_name, last_name, email, phone,
        display_name, bio: bio ?? null,
        categories, years_experience: Number(years_experience),
        city, languages: languages ?? ['fr'],
        entity_type,
        company_name: company_name ?? null,
        bce_number:   bce_number   ?? null,
        vat_number:   vat_number   ?? null,
        motivation:   motivation   ?? null,
        document_url,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    // Email de confirmation au candidat
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `Candidature reçue - ${process.env.NEXT_PUBLIC_APP_NAME}`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px">
        <h2 style="color:#0f172a">Candidature bien reçue</h2>
        <p style="color:#475569">Bonjour ${first_name},</p>
        <p style="color:#475569">Nous avons bien reçu votre candidature pour rejoindre ${process.env.NEXT_PUBLIC_APP_NAME} en tant qu'expert.</p>
        <p style="color:#475569">Notre équipe examinera votre dossier et reviendra vers vous dès que possible.</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
        <p style="color:#94a3b8;font-size:12px">${process.env.NEXT_PUBLIC_APP_NAME} · ${process.env.EMAIL_CONTACT}</p>
      </div>`,
    })

    // Alerte email à l'admin
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: process.env.EMAIL_ADMIN!,
      subject: `Nouvelle candidature expert - ${first_name} ${last_name}`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px">
        <h2 style="color:#0f172a">Nouvelle candidature expert</h2>
        <p><strong>Nom :</strong> ${first_name} ${last_name} (${display_name})</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Catégories :</strong> ${categories.join(', ')}</p>
        <p><strong>Ville :</strong> ${city} · ${years_experience} ans d'expérience</p>
        ${motivation ? `<p><strong>Motivation :</strong> ${motivation}</p>` : ''}
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/candidatures" style="color:#2563eb">Traiter la candidature →</a></p>
      </div>`,
    })

    return NextResponse.json({ success: true, id: candidature.id })
  } catch (err: any) {
    console.error('Erreur POST /api/candidatures:', err)
    return NextResponse.json({ error: err.message ?? 'Erreur serveur.' }, { status: 500 })
  }
}
