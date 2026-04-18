import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/marketing - liste des contacts marketing (comptes + newsletter)
// DELETE /api/admin/marketing - supprimer un abonné newsletter ou désinscrire un utilisateur
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const exportJson = searchParams.get('export') === 'true'

    const supabaseAdmin = createAdminClient()

    // Utilisateurs inscrits ayant accepté les emails marketing
    const { data: usersMarketing, error: errUsers } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, created_at')
      .eq('marketing_emails', true)
      .eq('is_blocked', false)
      .order('created_at', { ascending: false })

    if (errUsers) throw errUsers

    // Abonnés newsletter anonymes (visiteurs non inscrits)
    const { data: newsletter, error: errNewsletter } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })

    if (errNewsletter) throw errNewsletter

    // Mode export : retourne un fichier JSON téléchargeable (les deux listes fusionnées)
    if (exportJson) {
      const listeUsers = (usersMarketing ?? []).map((u) => ({
        source:     'compte',
        email:      u.email,
        prenom:     u.first_name,
        nom:        u.last_name,
        inscrit_le: u.created_at,
      }))
      const listeNewsletter = (newsletter ?? []).map((n) => ({
        source:     'newsletter',
        email:      n.email,
        prenom:     '',
        nom:        '',
        inscrit_le: n.created_at,
      }))
      const liste = [...listeUsers, ...listeNewsletter]
      const json = JSON.stringify(liste, null, 2)
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="marketing-emails-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      })
    }

    return NextResponse.json({
      users:       usersMarketing ?? [],
      newsletter:  newsletter ?? [],
      total:       (usersMarketing?.length ?? 0) + (newsletter?.length ?? 0),
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { type, id } = await request.json()
    const supabaseAdmin = createAdminClient()

    if (type === 'newsletter') {
      // Supprimer définitivement l'abonné newsletter
      const { error } = await supabaseAdmin
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id)

      if (error) throw error

    } else if (type === 'user') {
      // Désinscrire l'utilisateur des emails marketing (ne supprime pas le compte)
      const { error } = await supabaseAdmin
        .from('users')
        .update({ marketing_emails: false })
        .eq('id', id)

      if (error) throw error

    } else {
      return NextResponse.json({ error: 'Type invalide.' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
