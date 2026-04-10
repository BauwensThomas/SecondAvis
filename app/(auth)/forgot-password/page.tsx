import { redirect } from 'next/navigation'

// Redirection vers la bonne URL
export default function ForgotPasswordRedirect() {
  redirect('/auth/forgot-password')
}
