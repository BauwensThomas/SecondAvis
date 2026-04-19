import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/server'

// Configure les clés VAPID une seule fois au démarrage
webpush.setVapidDetails(
  `mailto:${process.env.EMAIL_ADMIN || 'contact@avisbox.be'}`,
  process.env.VAPID_PUBLIC_KEY  || '',
  process.env.VAPID_PRIVATE_KEY || '',
)

interface PushPayload {
  title: string
  body:  string
  url?:  string
}

// Envoie une notification push à tous les abonnements d'un utilisateur donné
// Supprime silencieusement les abonnements expirés (code 410 = révoqué par le navigateur)
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return

  const supabase = createAdminClient()

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subscriptions?.length) return

  const expiredIds: string[] = []

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ ...payload, icon: '/avisbox-clair.png', badge: '/avisbox-clair.png' }),
        )
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) {
          expiredIds.push(sub.id)
        }
      }
    })
  )

  if (expiredIds.length) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }
}
