import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { resend, EMAIL_FROM } from '@/lib/resend'
import { render } from '@react-email/render'
import NewsletterArticle from '@/emails/NewsletterArticle'

// POST /api/admin/blog/[id]/newsletter - envoie la newsletter de l'article à tous les abonnés
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { id } = await params
    const supabaseAdmin = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.avisbox.be'

    // Récupérer l'article (doit être publié)
    const { data: post, error: errPost } = await supabaseAdmin
      .from('posts')
      .select('id, titre, extrait, slug, image_url, publie')
      .eq('id', id)
      .single()

    if (errPost || !post) {
      return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 })
    }

    if (!post.publie) {
      return NextResponse.json({ error: 'Impossible d\'envoyer la newsletter d\'un article non publié.' }, { status: 400 })
    }

    // Récupérer les abonnés newsletter avec leur token de désabonnement
    const { data: newsletterAbonnes, error: errAbonnes } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('email, unsubscribe_token')

    if (errAbonnes) console.error('Erreur newsletter_subscribers:', errAbonnes.message)

    // Récupérer les utilisateurs ayant accepté les emails marketing
    const { data: usersMarketing, error: errMarketing } = await supabaseAdmin
      .from('users')
      .select('email, first_name')
      .eq('marketing_emails', true)
      .eq('is_blocked', false)

    if (errMarketing) console.error('Erreur users marketing:', errMarketing.message)

    let envoyes = 0
    let erreurs = 0

    // Envoyer aux abonnés newsletter anonymes (lien désabonnement par token)
    for (const abonne of (newsletterAbonnes ?? [])) {
      try {
        const lienDesabonnement = `${appUrl}/api/newsletter/unsubscribe?token=${abonne.unsubscribe_token}`
        const html = await render(NewsletterArticle({
          titre:             post.titre,
          extrait:           post.extrait,
          slug:              post.slug,
          imageUrl:          post.image_url,
          lienDesabonnement,
        }))

        await resend.emails.send({
          from:    EMAIL_FROM,
          to:      abonne.email,
          subject: post.titre,
          html,
        })

        envoyes++
      } catch (e) {
        console.error('Erreur envoi newsletter abonné:', e)
        erreurs++
      }
    }

    // Envoyer aux utilisateurs marketing (lien désabonnement vers /mon-compte)
    for (const u of (usersMarketing ?? [])) {
      try {
        const lienDesabonnement = `${appUrl}/mon-compte`
        const html = await render(NewsletterArticle({
          titre:             post.titre,
          extrait:           post.extrait,
          slug:              post.slug,
          imageUrl:          post.image_url,
          lienDesabonnement,
        }))

        await resend.emails.send({
          from:    EMAIL_FROM,
          to:      u.email,
          subject: post.titre,
          html,
        })

        envoyes++
      } catch {
        erreurs++
      }
    }

    return NextResponse.json({ success: true, envoyes, erreurs })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
