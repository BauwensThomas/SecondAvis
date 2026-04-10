import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Deconnecte l utilisateur en invalidant sa session
export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return NextResponse.json({ success: true }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la deconnexion.' },
      { status: 500 }
    )
  }
}
