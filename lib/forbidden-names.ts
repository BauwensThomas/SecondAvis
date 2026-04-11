// Liste des termes interdits dans les noms affichés des experts
// Empêche toute tentative d'usurpation d'identité (admin, support, équipe...)
const FORBIDDEN_TERMS = [
  'admin', 'administrateur', 'administration',
  'support', 'service client', 'helpdesk',
  'moderateur', 'modérateur', 'modo',
  'Avisbox', 'second avis',
  'officiel', 'official',
  'staff', 'equipe', 'équipe', 'team',
  'webmaster', 'contact',
]

// Retourne true si le nom contient un terme interdit (insensible à la casse)
export function containsForbiddenTerm(name: string): boolean {
  const lower = name.toLowerCase().replace(/\s+/g, ' ').trim()
  return FORBIDDEN_TERMS.some((term) => lower.includes(term))
}
