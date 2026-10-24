import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getProjeto } from '@/app/portal-media/_data/mockProject'
import PagamentosClient from '@/app/portal-media/_components/PagamentosClient'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ ref: string }> }

export default async function PagamentosPage({ params }: Props) {
  const { ref } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: row } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', ref.toUpperCase())
    .single()

  const projeto = row?.dados ?? getProjeto(ref)
  if (!projeto) notFound()

  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('rl_auth')?.value === process.env.AUTH_SECRET

  // Contrato devolvido pelo cliente: bucket privado, link temporário de 1 h
  const assinado = (projeto as any).contratoAssinado as { path?: string } | undefined
  let contratoAssinadoUrl: string | null = null
  if (assinado?.path) {
    const { data } = await supabase.storage.from('contratos-assinados').createSignedUrl(assinado.path, 3600)
    contratoAssinadoUrl = data?.signedUrl ?? null
  }

  return (
    <main className="min-h-screen relative">
      <PagamentosClient projeto={projeto} isAdmin={isAdmin} contratoAssinadoUrl={contratoAssinadoUrl} />
    </main>
  )
}
