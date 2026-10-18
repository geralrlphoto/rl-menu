import { NextResponse } from 'next/server'
import { sbAdmin } from '@/lib/preparacao'
import { exigeAdmin } from '@/lib/api-guard'
import { canalDaOrigem, type Stats } from '@/lib/jornada'

// Mapa da jornada do cliente (/crm/follow-up).
// GET: estado das tarefas e dos cards + contagens do CRM (uma leitura ao abrir a página, sem polling).
// POST: { chave, valor } grava; valor null apaga.
//   chave "t:<passo>.<i>" = tarefa feita · "s:<passo>" = estado do card (done | miss)

const CHAVE = /^(t:\d{1,2}-\d{1,2}\.\d{1,2}|s:\d{1,2}-\d{1,2})$/

export async function GET(req: Request) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const db = sbAdmin()
  const [est, crm] = await Promise.all([
    db.from('jornada_estado').select('chave, valor'),
    db.from('crm_contacts').select('status, como_chegou'),
  ])
  if (est.error) return NextResponse.json({ error: est.error.message }, { status: 500 })

  const estado: Record<string, string> = {}
  for (const r of est.data ?? []) estado[r.chave] = r.valor

  const stats: Stats = { total: 0, status: {}, origem: {} }
  for (const c of crm.data ?? []) {
    stats.total++
    const st = String(c.status ?? '').trim()
    if (st) stats.status[st] = (stats.status[st] ?? 0) + 1
    for (const o of canalDaOrigem(c.como_chegou)) stats.origem[o] = (stats.origem[o] ?? 0) + 1
  }
  return NextResponse.json({ estado, stats })
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
    ? await db.from('jornada_estado').delete().eq('chave', chave)
    : await db.from('jornada_estado').upsert({ chave, valor, atualizado_em: new Date().toISOString() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
