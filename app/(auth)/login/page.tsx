'use client'

import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

// Schema de validation du formulaire de connexion
const schema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est obligatoire'),
})

type FormData = z.infer<typeof schema>

// Contenu du formulaire - separe pour pouvoir envelopper useSearchParams dans Suspense
function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Envoie les identifiants a l API puis redirige vers le tableau de bord
  async function onSubmit(data: FormData) {
    setLoading(true)
    setServerError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setServerError(result.error)
        return
      }

      // Rechargement complet pour que le Header relise la session
      window.location.href = redirectTo
    } catch {
      setServerError("Une erreur inattendue s'est produite. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4"
    >

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
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-slate-700">
            Mot de passe
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-xs text-blue-600 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <input
          {...register('password')}
          type="password"
          placeholder="Votre mot de passe"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.password && (
          <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Erreur serveur */}
      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-red-600 text-sm">{serverError}</p>
        </div>
      )}

      {/* Bouton de connexion */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </Button>

    </form>
  )
}

// Page de connexion
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* En-tete */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            Avisbox
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-slate-800">
            Se connecter
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              S'inscrire gratuitement
            </Link>
          </p>
        </div>

        {/* Formulaire enveloppe dans Suspense pour useSearchParams */}
        <Suspense fallback={<div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-48" />}>
          <LoginForm />
        </Suspense>

      </div>
    </div>
  )
}
