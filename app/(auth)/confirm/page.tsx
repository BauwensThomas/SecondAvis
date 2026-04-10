import { redirect } from 'next/navigation'

// Redirection vers la bonne URL
export default function ConfirmRedirect() {
  redirect('/auth/confirm')
}
