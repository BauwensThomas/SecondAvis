import { createAdminClient } from '@/lib/supabase/server'

// Loggue un email envoyé dans la table admin_emails pour la page Communications
// Silencieux en cas d'erreur - ne bloque jamais l'envoi de l'email principal
export async function logEmail(params: {
  recipient_type: 'client' | 'expert'
  recipient_id?: string | null
  recipient_email: string
  related_type?: string | null
  related_id?: string | null
  subject: string
  body: string
}) {
  try {
    const supabaseAdmin = createAdminClient()
    await supabaseAdmin.from('admin_emails').insert({
      recipient_type:  params.recipient_type,
      recipient_id:    params.recipient_id   ?? null,
      recipient_email: params.recipient_email,
      related_type:    params.related_type   ?? null,
      related_id:      params.related_id     ?? null,
      subject:         params.subject,
      body:            params.body,
    })
  } catch {
    // Silencieux - ne jamais bloquer l'envoi d'email si le log échoue
  }
}
