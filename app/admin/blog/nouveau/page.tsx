import BlogForm from '@/components/common/BlogForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nouvel article' }

// Page admin - création d'un nouvel article de blog
export default function NouvelArticlePage() {
  return <BlogForm />
}
