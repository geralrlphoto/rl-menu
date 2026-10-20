import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ehAdmin, cabecalhoInterno } from '@/lib/api-guard'
import { enviarTicketFotos, DIAS_DOWNLOAD } from '@/lib/ticketFotos'
import { registarFoto } from '@/lib/fotografiaHistorico'

// Vercel Cron, todos os dias às 9h: avisos automáticos do Departamento de Fotografia
// aos noivos, no Ticket das Fotografias (lib/ticketFotos.ts):
//   · 30 dias depois de recebidas as fotos para seleção, sem seleção → lembrete30
//   · 60 dias depois, ainda sem seleção → lembrete60
//   · 7 dias antes de acabar o download das fotos editadas (30 dias) → download
// Cada aviso sai uma só vez (marca em portais.settings). Só entra quem está dentro
// da janela do aviso: casos muito antigos não recebem lembretes de repente.
// Retirados do departamento e alertas desligados na ficha não recebem nada.

export const maxDuration = 60

const JANELA = 29  // dias depois do marco em que o aviso ainda sai (30→59, 60→89)

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cron = !process.env.CRON_SECRET || auth === `Bearer ${process.env.CRON_SECRET}`
  if (!cron && !ehAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const simular = req.nextUrl.searchParams.get('simular') === '1'   // admin: ver quem receberia, sem enviar

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const dep = await fetch(`${req.nextUrl.origin}/api/edicao-fotografia`, { headers: cabecalhoInterno() }).then(r => r.json()).catch(() => null)
  if (!dep?.ok) return NextResponse.json({ error: 'Sem dados do departamento' }, { status: 500 })
  const hoje = new Date().toISOString().slice(0, 10)
  const dias = (de: string) => Math.round((new Date(hoje + 'T12:00:00Z').getTime() - new Date(String(de).slice(0, 10) + 'T12:00:00Z').getTime()) / 86400000)
  const fmt = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

  const projetos: any[] = dep.projetos ?? []
  const refs = projetos.map(p => p.referencia)
  const { data: ports } = refs.length ? await sb.from('portais').select('id, referencia, settings').in('referencia', refs) : { data: [] as any[] }
  const portalPorRef = new Map((ports ?? []).map(p => [p.referencia, p]))

  const enviados: { referencia: string; cliente: string; aviso: string; ok: boolean }[] = []
  for (const p of projetos) {
    const pt = portalPorRef.get(p.referencia)
    if (!pt) continue
    const s: Record<string, any> = pt.settings ?? {}
    if (s.alertas_fotografia_ativos === false) continue
    let aviso: 'lembrete30' | 'lembrete60' | 'download' | null = null
    let marca = '', url: string | null = null, prazo: string | null = null

    if (p.fase === 'escolha' && p.enviadas?.selecao && !s.selecao_alerta_off) {
      const d = dias(p.enviadas.selecao)
      if (d >= 60 && d <= 60 + JANELA && !s.lembrete_selecao_60) { aviso = 'lembrete60'; marca = 'lembrete_selecao_60' }
      else if (d >= 30 && d <= 30 + JANELA && !s.lembrete_selecao_30) { aviso = 'lembrete30'; marca = 'lembrete_selecao_30' }
      url = p.links?.selecao ?? null
      prazo = fmt(String(p.enviadas.selecao).slice(0, 10))
    }
    if (p.fase === 'entregue' && p.enviadas?.entregue && !s.download_aviso_enviado) {
      const d = dias(p.enviadas.entregue)
      if (d >= DIAS_DOWNLOAD - 7 && d < DIAS_DOWNLOAD) {
        aviso = 'download'; marca = 'download_aviso_enviado'; url = p.links?.entregue ?? null
        const fim = new Date(new Date(String(p.enviadas.entregue).slice(0, 10) + 'T12:00:00Z').getTime() + DIAS_DOWNLOAD * 86400000).toISOString().slice(0, 10)
        prazo = fmt(fim)
      }
    }
    if (!aviso) continue
    if (simular) { enviados.push({ referencia: p.referencia, cliente: p.cliente, aviso, ok: true }); continue }

    const r = await enviarTicketFotos(aviso, p.referencia, { url, prazo })
    if (r.ok) {
      const novo: Record<string, any> = { ...s, [marca]: hoje }
      if (aviso === 'lembrete60') novo.lembrete_selecao_30 = s.lembrete_selecao_30 ?? hoje   // não manda o de 30 depois do de 60
      await sb.from('portais').update({ settings: novo }).eq('id', pt.id)
      await registarFoto(p.referencia, aviso === 'download' ? 'Aviso do fim do download' : `Lembrete da seleção (${aviso === 'lembrete30' ? '30' : '60'} dias)`, 'Automático')
    }
    enviados.push({ referencia: p.referencia, cliente: p.cliente, aviso, ok: r.ok })
  }
  return NextResponse.json({ ok: true, simular, enviados })
}
