import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

// Ficheiros anexados à ficha de uma lead RL PROD (bucket privado, pasta = id da lead).
//   GET    ?lead=ID               → lista
//   GET    ?lead=ID&abrir=PATH    → abre (link temporário de 10 min)
//   POST   { lead, nome }         → prepara o envio direto para o Storage (devolve path + token)
//   DELETE { lead, path }         → apaga
// O nome original fica no próprio caminho: <lead>/<timestamp>-<nome>.

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const BUCKET = 'ficheiros-leads'

const nomeSeguro = (n: string) =>
  n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.\- ]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 120) || 'ficheiro'

const doLead = (lead: string, path: string) => !!lead && path.startsWith(`${lead}/`) && !path.includes('..')

export async function GET(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const lead = req.nextUrl.searchParams.get('lead') ?? ''
  if (!lead) return NextResponse.json({ error: 'Falta a lead.' }, { status: 400 })

  const abrir = req.nextUrl.searchParams.get('abrir')
  if (abrir) {
    if (!doLead(lead, abrir)) return NextResponse.json({ error: 'Ficheiro inválido.' }, { status: 400 })
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(abrir, 600)
    if (!data?.signedUrl) return NextResponse.json({ error: 'Não foi possível abrir.' }, { status: 404 })
    return NextResponse.redirect(data.signedUrl)
  }

  const { data, error } = await supabase.storage.from(BUCKET).list(lead, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ficheiros = (data ?? [])
    .filter(f => f.id)
    .map(f => ({
      path: `${lead}/${f.name}`,
      nome: f.name.replace(/^\d+-/, ''),
      tamanho: (f.metadata as any)?.size ?? 0,
      criado: f.created_at,
    }))
  return NextResponse.json({ ficheiros })
}

export async function POST(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const { lead, nome } = await req.json() as { lead?: string; nome?: string }
  if (!lead || !nome) return NextResponse.json({ error: 'Falta o ficheiro.' }, { status: 400 })
  const path = `${lead}/${Date.now()}-${nomeSeguro(nome)}`
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Não foi possível preparar o envio.' }, { status: 500 })
  return NextResponse.json({ path: data.path, token: data.token })
}

export async function DELETE(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const { lead, path } = await req.json() as { lead?: string; path?: string }
  if (!lead || !path || !doLead(lead, path)) return NextResponse.json({ error: 'Ficheiro inválido.' }, { status: 400 })
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
