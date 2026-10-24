import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { SectionLayout, type ImagemSecao } from '@/app/media/_section/MediaSectionTemplate'
import type { PaginaSecao } from '@/app/media/_section/PaginasSecao'

export const revalidate = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Props = {
  params: Promise<{ id: string }>
}

export default async function MediaSecaoPage({ params }: Props) {
  const { id } = await params

  const [{ data: section }, { data: pages }, { data: images }] = await Promise.all([
    supabase.from('media_sections').select('id, name').eq('id', id).single(),
    supabase.from('media_pages').select('id, title, notion_url').eq('section_id', id).order('order_index').then(r => r, () => ({ data: [] })),
    supabase.from('media_section_images').select('id, image_url, link_url').eq('section_id', id).order('order_index').then(r => r, () => ({ data: [] })),
  ])

  if (!section) notFound()

  return (
    <SectionLayout
      nome={section.name ?? ''}
      paginas={(pages ?? []) as PaginaSecao[]}
      imagens={(images ?? []) as ImagemSecao[]}
    />
  )
}
