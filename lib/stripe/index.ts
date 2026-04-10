import Stripe from 'stripe'

// Client Stripe côté serveur - utilisé uniquement dans les routes API
// Ne jamais importer ce fichier dans un composant client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})
