import { redirect } from 'next/navigation'

// Redirection vers la bonne URL
export default function ResetPasswordRedirect() {
  redirect('/auth/reset-password')
}
