import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/config'

// GET /api/admin/finances - données financières sur les 6 derniers mois
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient()

    // Données des 6 derniers mois
    const sixMoisAvant = new Date()
    sixMoisAvant.setMonth(sixMoisAvant.getMonth() - 6)

    const [{ data: paiements }, { data: remboursements }, { data: virements }] = await Promise.all([
      supabaseAdmin.from('requests').select('amount_cents, created_at').eq('payment_confirmed', true).gte('created_at', sixMoisAvant.toISOString()),
      supabaseAdmin.from('requests').select('amount_cents, created_at').eq('status', 'refunded').gte('created_at', sixMoisAvant.toISOString()),
      supabaseAdmin.from('payouts').select('amount_cents, created_at').eq('status', 'paid').gte('created_at', sixMoisAvant.toISOString()),
    ])

    const totalRevenu        = (paiements ?? []).reduce((a, r) => a + r.amount_cents, 0)
    const totalRembourse     = (remboursements ?? []).reduce((a, r) => a + r.amount_cents, 0)
    const totalVirements     = (virements ?? []).reduce((a, r) => a + r.amount_cents, 0)
    // Stripe : 1,5% (cartes européennes) arrondi au centime supérieur + 0,25€ fixe par transaction
    const fraisStripe        = Math.ceil(totalRevenu * 0.015) + (paiements?.length ?? 0) * 25
    const margeNette         = totalRevenu - totalRembourse - totalVirements - fraisStripe

    // Agrégation par mois - du plus récent au plus ancien
    const parMois: Record<string, { revenus: number; remboursements: number; virements: number }> = {}

    for (let i = 0; i <= 5; i++) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      parMois[cle] = { revenus: 0, remboursements: 0, virements: 0 }
    }

    ;(paiements ?? []).forEach((r) => {
      const cle = r.created_at.slice(0, 7)
      if (parMois[cle]) parMois[cle].revenus += r.amount_cents
    })
    ;(remboursements ?? []).forEach((r) => {
      const cle = r.created_at.slice(0, 7)
      if (parMois[cle]) parMois[cle].remboursements += r.amount_cents
    })
    ;(virements ?? []).forEach((r) => {
      const cle = r.created_at.slice(0, 7)
      if (parMois[cle]) parMois[cle].virements += r.amount_cents
    })

    const monthly_data = Object.entries(parMois).map(([mois, d]) => {
      const nbTransactions = Math.round(d.revenus / 1499)
      // Stripe : 1,5% (cartes européennes, ceil) + 0,25€ fixe par transaction
      const fraisM = Math.ceil(d.revenus * 0.015) + nbTransactions * 25
      return {
        mois,
        avis_vendus:          nbTransactions,
        ca_brut_cents:        d.revenus,
        remboursements_cents: d.remboursements,
        virements_cents:      d.virements,
        marge_cents:          d.revenus - d.remboursements - d.virements - fraisM,
      }
    })

    return NextResponse.json({
      summary: {
        ca_total_cents:           totalRevenu,
        remboursements_cents:     totalRembourse,
        virements_experts_cents:  totalVirements,
        marge_nette_cents:        margeNette,
      },
      monthly_data,
    })

  } catch (error) {
    console.error('Erreur GET /api/admin/finances:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
