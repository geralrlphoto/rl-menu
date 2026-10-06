import { NextResponse } from 'next/server'
import { sbAdmin } from '@/lib/preparacao'
import { exigeAdmin } from '@/lib/api-guard'

// Lista de serviços (fotografia / vídeo) que aparece nas propostas de /crm/[id].
// Uma só lista para todas as leads, editável no próprio CRM (botão "Editar").

const limpar = (v: unknown): string[] => Array.isArray(v)
  ? [...new Set(v.map(s => String(s ?? '').trim().slice(0, 120)).filter(Boolean))].slice(0, 80)
  : []

export async function GET(req: Request) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const { data, error } = await sbAdmin().from('crm_servicos_catalogo').select('foto, video').eq('id', 1).maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'sem_catalogo' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const b = await req.json().catch(() => ({}))
  const foto = limpar(b.foto)
  const video = limpar(b.video)
  const { error } = await sbAdmin().from('crm_servicos_catalogo')
    .upsert({ id: 1, foto, video, updated_at: new Date().toISOString() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, foto, video })
}
