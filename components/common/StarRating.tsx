'use client'

// Composant d'affichage et de sélection de notes en étoiles (1 à 5)
interface StarRatingProps {
  score: number
  onChange?: (score: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ score, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={[
            sizes[size],
            'leading-none transition-transform',
            !readonly && 'hover:scale-110 cursor-pointer',
            readonly && 'cursor-default',
            star <= score ? 'text-yellow-400' : 'text-slate-200',
          ].join(' ')}
          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
