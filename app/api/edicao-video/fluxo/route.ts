import { NextResponse } from 'next/server'
import { sbAdmin } from '@/lib/preparacao'
import { exigeAdmin } from '@/lib/api-guard'

// Mapa do fluxo da Edição de Vídeo (/edicao-video/fluxo). Usa a mesma tabela do
// mapa do Follow Up (jornada_estado) com as chaves prefixadas por "ed:".
// GET devolve o estado sem o prefixo (o mapa é o mesmo componente). POST { chave, valor }.

const PREFIXO = 'ed:'
const CHAVE = /^(t:\d{1,2}-\d{1,2}\.\d{1,2}|s:\d{1,2}-\d{1,2})$/

export async function GET(req: Request) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const { data, error } = await sbAdmin().from('jornada_estado').select('chave, valor').like('chave', `${PREFIXO}%`)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const estado: Record<string, string> = {}
  for (const r of data ?? []) estado[r.chave.slice(PREFIXO.length)] = r.valor
  return NextResponse.json({ estado, stats: null })
}

export async function POST(req: Request) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const b = await req.json().catch(() => ({}))
  const chave = String(b.chave ?? '')
  if (!CHAVE.test(chave)) return NextResponse.json({ error: 'chave_invalida' }, { status: 400 })
  const db = sbAdmin()
  const valor = b.valor == null ? null : String(b.valor).slice(0, 20)
  const { error } = valor == null
    ? await db.from('jornada_estado').delete().eq('chave', PREFIXO + chave)
    : await db.from('jornada_estado').upsert({ chave: PREFIXO + chave, valor, atualizado_em: new Date().toISOString() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
