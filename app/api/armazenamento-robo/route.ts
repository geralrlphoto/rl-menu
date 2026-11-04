import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { sbAdmin } from '@/lib/preparacao'

export const dynamic = 'force-dynamic'

/* Robô dos discos (scripts/indexar-disco.py, tarefa "RL Armazenamento" no PC).
   POST { ligados: [nomes] }  → marca que discos estão ligados e devolve os pedidos
                                do botão Atualizar e os discos já conhecidos.
   POST { novo: {...} }       → regista um disco novo, sem lista (só é lido com clique).
   POST { disco: {...} }      → grava o índice novo de um disco.
   POST { backups: {...} }    → grava, por disco, os casamentos e a % que tem cópia noutro disco.
   Mesmo token do robô das fotos (x-auto-token, ver /api/fotos-auto). */

const TOKEN_HASH = 'f2ce9de66682050f2ba6700743d9cd0426754ec00bea91f06f49d73158071f75'

function autorizado(req: NextRequest) {
  const t = req.headers.get('x-auto-token') || ''
  if (!t) return false
  if (createHash('sha256').update(t).digest('hex') === TOKEN_HASH) return true
  return !!process.env.AUTH_SECRET && t === process.env.AUTH_SECRET
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const sb = sbAdmin()

  if (Array.isArray(body.ligados)) {
    const ligados: string[] = body.ligados.map(String)
    const { data, error } = await sb.from('armazenamento_discos').select('disco, atualizado, pedido_em, ligado, oculto')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // só escreve quando um disco é ligado ou desligado (a volta normal é só uma leitura pequena)
    for (const r of data ?? []) {
      const ligado = ligados.includes(r.disco)
      if (ligado !== !!r.ligado) await sb.from('armazenamento_discos').update(ligado ? { ligado, visto_em: new Date().toISOString() } : { ligado }).eq('disco', r.disco)
    }
    const pedidos = (data ?? []).filter(r => r.pedido_em && (!r.atualizado || Date.parse(r.pedido_em) > Date.parse(r.atualizado))).map(r => r.disco)
    return NextResponse.json({
      pedidos,
      conhecidos: (data ?? []).map(r => r.disco),
      ocultos: (data ?? []).filter(r => r.oculto).map(r => r.disco),
    })
  }

  // Backups calculados no PC: { disco: [casamentos com a % que existe noutro disco] }
  if (body.backups && typeof body.backups === 'object') {
    const agora = new Date().toISOString()
    for (const [disco, lista] of Object.entries(body.backups)) {
      if (!Array.isArray(lista)) continue
      const { error } = await sb.from('armazenamento_discos').update({ backups: lista, backups_em: agora }).eq('disco', disco)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  // Disco novo ligado ao PC: fica registado sem lista, à espera do botão Atualizar
  if (body.novo?.disco) {
    const n = body.novo
    const { error } = await sb.from('armazenamento_discos').upsert({
      disco: String(n.disco), letra: n.letra ?? null, tamanho: n.tamanho ?? null, livre: n.livre ?? null,
      ligado: true, visto_em: new Date().toISOString(),
    }, { onConflict: 'disco', ignoreDuplicates: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const d = body.disco
  if (!d?.disco || !Array.isArray(d.pastas)) return NextResponse.json({ error: 'dados inválidos' }, { status: 400 })
  const agora = new Date().toISOString()
  const { error } = await sb.from('armazenamento_discos').upsert({
    disco: String(d.disco), letra: d.letra ?? null, tamanho: d.tamanho ?? null, livre: d.livre ?? null,
    atualizado: agora, visto_em: agora, ligado: true,
    dados: { pastas: d.pastas, ficheiros: d.ficheiros ?? [], repetidos: d.repetidos ?? null },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
