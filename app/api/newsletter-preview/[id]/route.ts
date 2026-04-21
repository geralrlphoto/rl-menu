import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildNewsletterHtml } from '../../_lib/newsletterTemplate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

// Devolve o HTML renderizado como vai ser enviado (com rotação de fotos e testemunhos)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: newsletter } = await supabase
    .from('newsletters')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!newsletter) {
    return new NextResponse('Newsletter nao encontrada', { status: 404 })
  }

  const html = buildNewsletterHtml(newsletter)
    .replace(/\{\{unsubscribe_url\}\}/g, '#preview')

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
