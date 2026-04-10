import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/config'

// Frais Stripe : 2,9% + 0,25€ par transaction (correspond à ce que Stripe facture réellement)
function fraisStripe(montantCents: number): number {
  return Math.round(montantCents * 0.029 + 25)
}

// GET /api/admin/stats - métriques du dashboard admin
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient()
    const now = new Date()
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Requêtes en parallèle pour les métriques
    const [
      { count: totalDemandes },
      { count: demandesMois },
      { count: signalements },
      { count: expertsActifs },
      { count: remboursements },
      { data: paiementsMois },
      { count: candidatures },
      { count: totalUtilisateurs },
      { count: demandesEnAttente },
      { count: rgpd },
      { data: reponsesAvecAvis },
    ] = await Promise.all([
      supabaseAdmin.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'answered'),
      // Avis vendus = payés ce mois et non remboursés
      supabaseAdmin.from('requests').select('*', { count: 'exact', head: true })
        .gte('created_at', debutMois).eq('payment_confirmed', true).neq('status', 'refunded'),
      supabaseAdmin.from('answers').select('*', { count: 'exact', head: true }).eq('is_contested', true).eq('contest_resolved', false),
      supabaseAdmin.from('experts').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_verified', true),
      supabaseAdmin.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'refunded').gte('created_at', debutMois),
      // CA = paiements confirmés ce mois, remboursés exclus
      supabaseAdmin.from('requests').select('amount_cents')
        .eq('payment_confirmed', true).gte('created_at', debutMois).neq('status', 'refunded'),
      supabaseAdmin.from('expert_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      // Demandes en attente de réponse (payées et non expirées)
      supabaseAdmin.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('payment_confirmed', true),
      supabaseAdmin.from('gdpr_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      // Réponses livrées avec leur notation (pour calculer reçus et en attente exactement)
      supabaseAdmin
        .from('answers')
        .select('id, ratings(id)')
        .or('is_contested.eq.false,and(is_contested.eq.true,contest_decision.eq.validate)')
        .not('delivered_at', 'is', null),
    ])

    const caBrutMois = (paiementsMois ?? []).reduce((acc: number, r: { amount_cents: number }) => acc + r.amount_cents, 0)
    const fraisReels = (paiementsMois ?? []).reduce((acc: number, r: { amount_cents: number }) => acc + fraisStripe(r.amount_cents), 0)
    const caNetMois  = caBrutMois - fraisReels

    // Calcul exact : on regarde chaque réponse si elle a une notation ou non
    const toutesReponses = reponsesAvecAvis ?? []
    const avisRecus      = toutesReponses.filter((a: any) => (a.ratings?.length ?? 0) > 0).length
    const avisEnAttente  = toutesReponses.filter((a: any) => (a.ratings?.length ?? 0) === 0).length

    return NextResponse.json({
      total_demandes:            totalDemandes ?? 0,
      demandes_mois:             demandesMois  ?? 0,
      signalements_en_attente:   signalements  ?? 0,
      candidatures_en_attente:   candidatures  ?? 0,
      experts_actifs:            expertsActifs ?? 0,
      total_utilisateurs:        totalUtilisateurs ?? 0,
      remboursements_mois:       remboursements ?? 0,
      rgpd_en_attente:           rgpd          ?? 0,
      ca_mois_cents:             caBrutMois,
      ca_net_mois_cents:         caNetMois,
      avis_recus:                avisRecus,
      avis_en_attente:           avisEnAttente,
      demandes_en_attente:       demandesEnAttente ?? 0,
    })

  } catch (error) {
    console.error('Erreur GET /api/admin/stats:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
