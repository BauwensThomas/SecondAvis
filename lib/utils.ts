import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Badge = {
  id: 'top_note' | 'rapide' | 'fiable'
  label: string
  couleur: 'yellow' | 'green' | 'blue'
}

// Calcule les badges automatiques d'un expert selon ses statistiques
export function calculerBadges(expert: {
  average_rating: number
  total_answers: number
  total_signals: number
  avg_response_hours?: number
}): Badge[] {
  const badges: Badge[] = []

  if (expert.average_rating >= 4.8 && expert.total_answers >= 5) {
    badges.push({ id: 'top_note', label: 'Top noté', couleur: 'yellow' })
  }

  if (
    expert.avg_response_hours !== undefined &&
    expert.avg_response_hours <= 8 &&
    expert.total_answers >= 3
  ) {
    badges.push({ id: 'rapide', label: 'Réponse rapide', couleur: 'green' })
  }

  if (expert.total_signals === 0 && expert.total_answers >= 3) {
    badges.push({ id: 'fiable', label: 'Fiable', couleur: 'blue' })
  }

  return badges
}
