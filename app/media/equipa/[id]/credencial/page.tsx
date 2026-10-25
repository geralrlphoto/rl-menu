import { notFound, redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// Endereço antigo: a credencial passou a viver no projeto (/media/credenciais/<ref>).
// Reencaminha para o projeto pedido (ou o mais recente) já filtrado neste membro.

export const dynamic = 'force-dynamic'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export default async function CredencialAntiga({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ projeto?: string }> }) {
  const { id } = await params
  const { projeto } = await searchParams
  const { data: ligacoes } = await supabase.from('media_equipa_projeto').select('projeto_ref').eq('membro_id', id).order('criado_em', { ascending: false })
  const refs = (ligacoes ?? []).map(l => l.projeto_ref)
  const ref = projeto && refs.includes(projeto.toUpperCase()) ? projeto.toUpperCase() : refs[0]
  if (!ref) notFound()
  redirect(`/media/credenciais/${encodeURIComponent(ref)}?membro=${id}`)
}
