import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdminOuProprio } from '@/lib/api-guard'
import { faseFoto, ETAPAS_FOTO } from '@/lib/fotografiaFluxo'
import { ROTULO_ALBUM, type EstadoAlbum } from '@/lib/albumEstado'

// Painel do Fotógrafo › Os meus casamentos: os casamentos em que o freelancer está na
// equipa (fotógrafo, editor de fotos ou de álbum), com a fase e o prazo do Departamento
// de Fotografia (lib/fotografiaFluxo.ts) e o estado do álbum (lib/albumEstado.ts).
// Só lê colunas necessárias (egress baixo).

const arr = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.filter(Boolean).map(String)
  if (typeof v === 'string' && v.trim()) return v.split(',').map(x => x.trim()).filter(Boolean)
  return []
}
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export async function GET(req: NextRequest) {
  const freelancer = req.nextUrl.searchParams.get('freelancer')
  if (!freelancer) return NextResponse.json({ error: 'freelancer required' }, { status: 400 })
  const bloqueio = await exigeAdminOuProprio(req, freelancer)
  if (bloqueio) return bloqueio
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: fl } = await sb.from('freelancers').select('nome').eq('id', freelancer).maybeSingle()
  const eu = norm(fl?.nome ?? '')
  if (!eu) return NextResponse.json({ casamentos: [] })

  const { data: eqs } = await sb.from('evento_equipa').select('referencia, fotografo, editor_fotos, editor_album')
  const funcoes = new Map<string, string[]>()
  for (const q of eqs ?? []) {
    if (!q.referencia) continue
    const f: string[] = []
    if (arr(q.fotografo).some(n => norm(n) === eu)) f.push('Fotografia')
    if (arr(q.editor_fotos).some(n => norm(n) === eu)) f.push('Edição de fotos')
    if (arr(q.editor_album).some(n => norm(n) === eu)) f.push('Álbum')
    if (f.length) funcoes.set(q.referencia, f)
  }
  const refs = [...funcoes.keys()]
  if (!refs.length) return NextResponse.json({ casamentos: [] })

  const [e26, e27, { data: ports }, { data: sels }, { data: albs }] = await Promise.all([
    sb.from('eventos_2026').select('referencia, cliente, data_evento, local, sel_fotos_estado').in('referencia', refs),
    sb.from('eventos_2027').select('referencia, cliente, data_evento, local, sel_fotos_estado').in('referencia', refs),
    sb.from('portais').select('referencia, settings').in('referencia', refs),
    sb.from('fotos_selecao').select('referencia, data_entrada').in('referencia', refs),
    sb.from('albuns_casamento').select('ref_evento, status').in('ref_evento', refs),
  ])
  const settingsPorRef = new Map((ports ?? []).map(p => [p.referencia, p.settings ?? {}]))
  const recebidaPorRef = new Map((sels ?? []).filter(s => s.data_entrada).map(s => [s.referencia, String(s.data_entrada).slice(0, 10)]))
  const albumPorRef = new Map((albs ?? []).map(a => [a.ref_evento, a.status as EstadoAlbum]))

  const casamentos = [...(e26.data ?? []), ...(e27.data ?? [])]
    .filter(e => e.data_evento)
    .map(e => {
      const s = settingsPorRef.get(e.referencia) ?? {}
      const realizado = e.data_evento <= new Date().toISOString().slice(0, 10)
      const f = realizado ? faseFoto(e.data_evento, s, recebidaPorRef.get(e.referencia) ?? null, e.sel_fotos_estado) : null
      const etapa = f ? ETAPAS_FOTO.find(x => x.k === f.fase) : null
      const album = albumPorRef.get(e.referencia)
      return {
        referencia: e.referencia,
        noivos: e.cliente,
        data: e.data_evento,
        local: e.local,
        funcoes: funcoes.get(e.referencia) ?? [],
        fase: f?.fase ?? 'agendado',
        faseTitulo: etapa?.titulo ?? 'Por realizar',
        prazo: f?.prazo ?? null,
        album: album ? ROTULO_ALBUM[album] ?? album : null,
      }
    })
    .sort((a, b) => a.data.localeCompare(b.data))
  return NextResponse.json({ casamentos })
}
