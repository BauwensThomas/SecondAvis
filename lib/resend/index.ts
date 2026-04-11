import { Resend } from 'resend'

// Client Resend - utilisé dans toutes les routes API pour envoyer des emails
export const resend = new Resend(process.env.RESEND_API_KEY)

// Expediteur par défaut lu depuis le .env
export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Avisbox <noreply@avisbox.be>'
