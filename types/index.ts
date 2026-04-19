// Types TypeScript centraux du projet Avisbox.
// Tous les composants et routes API importent leurs types depuis ce fichier.

// ---- Utilisateur client ----

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  is_adult_confirmed: boolean
  marketing_emails: boolean
  is_blocked: boolean
  stripe_customer_id: string | null
  created_at: string
}

// ---- Expert professionnel ----

export interface Expert {
  id: string
  user_id: string
  display_name: string
  photo_url: string | null
  bio: string | null
  categories: string[]
  years_experience: number
  city: string
  languages: string[]
  availabilities: string | null
  website_url: string | null
  first_name: string
  last_name: string
  email: string
  phone: string
  address_street: string
  address_zip: string
  address_city: string
  address_country: string
  entity_type: 'individual' | 'company'
  company_name: string | null
  bce_number: string | null
  vat_number: string | null
  justification_url: string | null
  is_verified: boolean
  is_active: boolean
  is_blocked: boolean
  suspension_reason: string | null
  suspension_type: 'manual' | 'auto_rating' | 'auto_contest' | null
  suspended_at: string | null
  average_rating: number
  total_answers: number
  total_signals: number
  response_rate: number
  stripe_account_id: string | null
  created_at: string
}

// ---- Candidature expert ----

export interface ExpertApplication {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  display_name: string
  bio: string | null
  categories: string[]
  years_experience: number
  city: string
  languages: string[]
  entity_type: 'individual' | 'company'
  company_name: string | null
  bce_number: string | null
  vat_number: string | null
  motivation: string | null
  document_url: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
}

// ---- Demande d'avis ----

export interface Request {
  id: string
  user_id: string
  category: 'mecanique' | 'immo' | 'travaux' | 'assurance' | 'travail' | 'comptabilite'
  title: string
  description: string
  attachments: string[]
  status: 'pending' | 'answered' | 'contested' | 'refunded' | 'closed'
  amount_cents: number
  stripe_payment_intent_id: string | null
  expires_at: string
  created_at: string
}

// ---- Reponse expert ----

export interface Answer {
  id: string
  request_id: string
  expert_id: string
  content: string
  verdict: string | null
  delivered_at: string
  contest_window_ends: string
  payment_eligible_at: string
  is_contested: boolean
  contest_reason: string | null
  contest_resolved: boolean
  contest_decision: 'validate' | 'refund' | null
  admin_decision_at: string | null
  is_paid: boolean
  created_at: string
}

// ---- Notation ----

export interface Rating {
  id: string
  answer_id: string
  user_id: string
  expert_id: string
  score: number
  comment: string | null
  created_at: string
}

// ---- Historique suspension expert ----

export interface SuspensionLog {
  id: string
  expert_id: string
  action: 'suspended' | 'reactivated'
  type: 'manual' | 'auto_rating' | 'auto_contest' | null
  reason: string | null
  related_answer_id: string | null
  related_signalement_id: string | null
  contest_decision: 'validate' | 'refund' | null
  created_by: 'admin' | 'system'
  created_at: string
}

// ---- Paiement expert ----

export interface Payout {
  id: string
  expert_id: string
  amount_cents: number
  stripe_transfer_id: string | null
  status: 'pending' | 'paid'
  created_at: string
}

// ---- Categories disponibles ----

export type Category = 'mecanique' | 'immo' | 'travaux' | 'assurance' | 'travail' | 'comptabilite'

export const CATEGORY_LABELS: Record<Category, string> = {
  mecanique: 'Mecanique automobile',
  immo: 'Agences immobilieres',
  travaux: 'Devis travaux',
  assurance: 'Assurances',
  travail: 'Droit du travail',
  comptabilite: 'Comptabilite independants',
}

// ---- Statuts d'une demande (labels affichés) ----

export const REQUEST_STATUS_LABELS: Record<Request['status'], string> = {
  pending: 'En attente d\'un expert',
  answered: 'Reponse recue',
  contested: 'Signalement en cours d\'analyse',
  refunded: 'Rembourse',
  closed: 'Termine',
}

// ---- Article de blog ----

export interface Post {
  id: string
  titre: string
  contenu: string | null
  slug: string
  image_url: string | null
  image_ia: boolean
  extrait: string | null
  categorie: 'mecanique' | 'immo' | 'travaux' | 'assurance' | 'travail' | 'comptabilite' | null
  publie: boolean
  created_at: string
}