import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { ehAdmin, naoAutorizado } from '@/lib/api-guard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = { params: Promise<{ ref: string }> }

/* Admin, ou o cliente com o cookie do portal (pm_<REF>) igual à senha; portal sem senha fica aberto */
function podeAceder(req: NextRequest, ref: string, dados: any): boolean {
  if (ehAdmin(req)) return true
  const senha = dados?.senha
  if (!senha) return true
  return req.cookies.get(`pm_${ref}`)?.value === senha
}

/* A senha nunca sai para quem não é admin */
function semSenha(dados: any) {
  if (!dados || typeof dados !== 'object') return dados
  const { senha: _senha, ...resto } = dados
  return resto
}

export async function GET(req: NextRequest, { params }: Params) {
  const { ref: refRaw } = await params
  const ref = refRaw.toUpperCase()
  const { data, error } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', ref)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!podeAceder(req, ref, data.dados)) return naoAutorizado()
  return NextResponse.json(ehAdmin(req) ? data.dados : semSenha(data.dados))
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { ref: refRaw } = await params
  const ref = refRaw.toUpperCase()
  const admin = ehAdmin(req)
  const body = await req.json()

  const { data: existing } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', ref)
    .single()

  // Criar portais novos é só do admin; o cliente só altera o próprio portal e nunca a senha
  if (!admin && (!existing || !podeAceder(req, ref, existing.dados))) return naoAutorizado()
  const alteracoes = admin ? body : semSenha(body)

  const merged = { ...(existing?.dados ?? {}), ...alteracoes }

  const { error } = await supabase
    .from('media_portais')
    .upsert(
      { ref, dados: merged, updated_at: new Date().toISOString() },
      { onConflict: 'ref' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, dados: admin ? merged : semSenha(merged) })
}
