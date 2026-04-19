// Point central de configuration - toutes les variables d'environnement sont lues ici.
// Le reste du code importe depuis ce fichier, jamais depuis process.env directement.

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME!
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
export const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE!

export const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME!
export const COMPANY_STATUS = process.env.NEXT_PUBLIC_COMPANY_STATUS!
export const COMPANY_ADDRESS = process.env.NEXT_PUBLIC_COMPANY_ADDRESS!
export const COMPANY_BCE = process.env.NEXT_PUBLIC_COMPANY_BCE ?? ''
export const COMPANY_TVA = process.env.NEXT_PUBLIC_COMPANY_TVA ?? ''

export const EMAIL_FROM = process.env.EMAIL_FROM!
export const EMAIL_CONTACT = process.env.EMAIL_CONTACT!
export const EMAIL_ADMIN = process.env.EMAIL_ADMIN!
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL!

// Liste des emails admin (séparés par des virgules dans ADMIN_EMAILS ou ADMIN_EMAIL en fallback)
const ADMIN_EMAILS_LIST: string[] = (
  process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? ''
).split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)

// Vérifie si un email appartient à un administrateur
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS_LIST.includes(email.toLowerCase())
}

// Prix dynamiques par catégorie (en centimes)
export const REQUEST_PRICE_CENTS = Number(process.env.NEXT_PUBLIC_REQUEST_PRICE_CENTS!) || 1499
export const CATEGORY_PRICES: Record<string, number> = {
  mecanique: Number(process.env.NEXT_PUBLIC_PRICE_MECANIQUE_CENTS) || 1499,
  immo: Number(process.env.NEXT_PUBLIC_PRICE_IMMO_CENTS) || 1499,
  travaux: Number(process.env.NEXT_PUBLIC_PRICE_TRAVAUX_CENTS) || 1499,
  assurance: Number(process.env.NEXT_PUBLIC_PRICE_ASSURANCE_CENTS) || 1499,
  travail: Number(process.env.NEXT_PUBLIC_PRICE_TRAVAIL_CENTS) || 1499,
  comptabilite: Number(process.env.NEXT_PUBLIC_PRICE_COMPTABILITE_CENTS) || 1499,
}
export const EXPERT_PAYMENT_CENTS = Number(process.env.NEXT_PUBLIC_EXPERT_PAYMENT_CENTS!) || 1000
export const MAX_FILE_SIZE_MB = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB!) || 10
export const ALLOWED_FILE_TYPES = process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES!

export const CGU_VERSION = process.env.NEXT_PUBLIC_CGU_VERSION ?? '1.0'
export const PRIVACY_VERSION = process.env.NEXT_PUBLIC_PRIVACY_VERSION ?? '1.0'
export const EXPERT_CHARTER_VERSION = process.env.NEXT_PUBLIC_EXPERT_CHARTER_VERSION ?? '1.0'

export const CRON_SECRET = process.env.CRON_SECRET!
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
export const RESEND_API_KEY = process.env.RESEND_API_KEY!
