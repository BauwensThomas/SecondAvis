import { createAdminClient } from '@/lib/supabase/server'
import BlogForm from '@/components/common/BlogForm'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Modifier l\'article' }

// Page admin - modification d'un article existant
export default async function ModifierArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: post } = await supabase.from('posts').select('*').eq('id', id).single()

  if (!post) notFound()

  return <BlogForm postInitial={post} />
}
