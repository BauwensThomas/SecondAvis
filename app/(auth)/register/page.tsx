'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

// Schéma de validation du formulaire d'inscription
const schema = z.object({
  first_name: z.string().min(1, 'Le prénom est obligatoire'),
  last_name: z.string().min(1, 'Le nom est obligatoire'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  password_confirm: z.string(),
  is_adult_confirmed: z.boolean().refine((v) => v === true, {
    message: 'Vous devez confirmer avoir 18 ans ou plus',
  }),
  marketing_emails: z.boolean().optional(),
}).refine((data) => data.password === data.password_confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password_confirm'],
})

type FormData = z.infer<typeof schema>

// Page d'inscription - crée un compte client
export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { marketing_emails: false },
  })

  // Envoie le formulaire a l API puis redirige vers la page de confirmation
  async function onSubmit(data: FormData) {
    setLoading(true)
    setServerError(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setServerError(result.error)
        return
      }

      router.push('/auth/confirm')
    } catch {
      setServerError("Une erreur inattendue s'est produite. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* En-tete */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            Avisbox
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-slate-800">
            Créer mon compte
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Déjà inscrit ?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Se connecter
            </Link>
          </p>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4"
        >

          {/* Prenom + Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Prénom
              </label>
              <input
                {...register('first_name')}
                type="text"
                placeholder="Jean"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.first_name && (
                <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nom
              </label>
              <input
                {...register('last_name')}
                type="text"
                placeholder="Dupont"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.last_name && (
                <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="jean@exemple.com"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mot de passe
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="Minimum 8 caractères"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirmation mot de passe */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              {...register('password_confirm')}
              type="password"
              placeholder="Répétez votre mot de passe"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password_confirm && (
              <p className="text-red-500 text-xs mt-1">{errors.password_confirm.message}</p>
            )}
          </div>

          {/* Confirmation majorite - obligatoire */}
          <div className="flex items-start gap-2">
            <input
              {...register('is_adult_confirmed')}
              type="checkbox"
              id="adult"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <label htmlFor="adult" className="text-sm text-slate-600">
              Je confirme avoir 18 ans ou plus
            </label>
          </div>
          {errors.is_adult_confirmed && (
            <p className="text-red-500 text-xs -mt-2">{errors.is_adult_confirmed.message}</p>
          )}

          {/* Emails marketing - optionnel */}
          <div className="flex items-start gap-2">
            <input
              {...register('marketing_emails')}
              type="checkbox"
              id="marketing"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <label htmlFor="marketing" className="text-sm text-slate-600">
              J'accepte de recevoir les offres et nouveautés de Avisbox
            </label>
          </div>

          {/* Erreur serveur */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-red-600 text-sm">{serverError}</p>
            </div>
          )}

          {/* Bouton de soumission */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Création du compte...' : 'Créer mon compte'}
          </Button>

          {/* Lien CGU */}
          <p className="text-xs text-slate-400 text-center">
            En créant un compte, vous acceptez nos{' '}
            <Link href="/cgu" className="underline">
              Conditions Générales d'Utilisation
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}
