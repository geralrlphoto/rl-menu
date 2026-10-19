import { NextRequest, NextResponse } from 'next/server'
import { sbAdmin, UUID_RE } from '@/lib/preparacao'

// Público: /opiniao/<id do contacto do CRM>. Os noivos que não fecharam
// deixam a opinião em texto livre; fica em crm_opinioes e aparece na ficha.

const MAX_TEXTO = 5000
const MAX_POR_CONTACTO = 5

export async function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get('c') ?? ''
  if (!UUID_RE.test(c)) return NextResponse.json({ error: 'Link inválido' }, { status: 400 })
  const { data } = await sbAdmin().from('crm_contacts').select('nome').eq('id', c).maybeSingle()
  if (!data) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
  return NextResponse.json({ ok: true, nome: data.nome ?? '' })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const c = String(body.c ?? '')
  const texto = String(body.texto ?? '').trim().slice(0, MAX_TEXTO)
  if (!UUID_RE.test(c) || !texto) return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })
  const sb = sbAdmin()
  const { data: contacto } = await sb.from('crm_contacts').select('id').eq('id', c).maybeSingle()
  if (!contacto) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
  const { count } = await sb.from('crm_opinioes').select('id', { count: 'exact', head: true }).eq('contact_id', c)
  if ((count ?? 0) >= MAX_POR_CONTACTO) return NextResponse.json({ error: 'Já recebemos a vossa opinião. Obrigado!' }, { status: 429 })
  const { error } = await sb.from('crm_opinioes').insert({ contact_id: c, texto })
  if (error) return NextResponse.json({ error: 'Não foi possível enviar. Tentem de novo.' }, { status: 500 })
  await sb.from('crm_status_history').insert({ contact_id: c, evento: 'Opinião recebida pelo formulário' })
  return NextResponse.json({ ok: true })
}
