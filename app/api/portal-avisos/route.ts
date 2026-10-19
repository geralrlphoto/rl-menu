// GET /api/portal-avisos?ref=CAS_… — o que pede atenção no portal (para o menu
// lateral do tema RL): um aviso curto por secção e o próximo passo dos noivos.
// Lê só o portal, os pagamentos confirmados e o evento. Acesso: admin ou os noivos.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAcessoRef } from '@/lib/api-guard'
import { adjudicacaoPaga } from '@/lib/portalBloqueio'

type Aviso = { texto: string; tom: 'alerta' | 'novo' | 'info' }
const variantes = (r: string) => Array.from(new Set([r, r.replace(/_(\d{2})_RL/, '_0$1_RL'), r.replace(/_0(\d{2})_RL/, '_$1_RL')]))

export async function GET(req: NextRequest) {
  const ref = (req.nextUrl.searchParams.get('ref') ?? '').trim()
  if (!ref) return NextResponse.json({ error: 'ref obrigatória' }, { status: 400 })
  const bloqueio = await exigeAcessoRef(req, ref)
  if (bloqueio) return bloqueio

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const [{ data: portal }, { data: pags }, { data: ev }] = await Promise.all([
    sb.from('portais').select('data, settings').ilike('referencia', ref).maybeSingle(),
    sb.from('pagamentos_noivos').select('fase_pagamento, valor_liquidado').in('referencia', variantes(ref)).eq('confirmado', true),
    sb.from('eventos_2026').select('data_evento').eq('referencia', ref).maybeSingle(),
  ])
  const s: any = portal?.settings ?? {}
  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date())
  const casamento = String(ev?.data_evento ?? portal?.data ?? s.data ?? '').slice(0, 10)
  const dias = (iso: string) => Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse(hoje + 'T12:00:00Z')) / 86400000)
  const menos = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10) }
  const dataPt = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })
  const recente = (v: unknown, n: number) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) && dias(v.slice(0, 10)) >= -n
  const faltam = /^\d{4}-\d{2}-\d{2}$/.test(casamento) ? dias(casamento) : null

  const adjOk = adjudicacaoPaga(pags ?? [])
  const reforcoOk = (pags ?? []).some((p: any) => Number(p.valor_liquidado ?? 0) > 0 &&
    (Array.isArray(p.fase_pagamento) ? p.fase_pagamento : [p.fase_pagamento]).some((f: any) => /REFOR|FINAL/i.test(String(f ?? ''))))
  const briefingFeito = Object.values(s.briefingInfo ?? {}).some((b: any) => b && Object.keys(b).some(k => k !== 'historico'))

  // Um aviso por secção (chave = palavra do título da página)
  const avisos: Record<string, Aviso> = {}
  if (s.contratoDisponivel && !s.contratoAssinadoEm) avisos.CONTRATO = { texto: 'Por assinar', tom: 'alerta' }
  if (!adjOk) avisos.PAGAMENTO = { texto: 'Adjudicação em falta', tom: 'alerta' }
  else if (!reforcoOk && faltam !== null && faltam <= 30 && faltam >= 0) avisos.PAGAMENTO = { texto: 'Reforço em falta', tom: 'alerta' }
  if (!briefingFeito && faltam !== null && faltam <= 60 && faltam >= 0) avisos.BRIEFING = { texto: 'Por preencher', tom: 'alerta' }
  if (recente(s.fotos_finais_enviada, 14) || recente(s.selecao_enviada, 14) || recente(s.galerias_enviada, 14)) avisos.FOTOGRAF = { texto: 'Novidade', tom: 'novo' }
  if (recente(s.wedding_film_enviada, 30) || recente(s.teaser_enviada, 14) || recente(s.same_day_edit_enviada, 14)) avisos.FILME = { texto: 'Disponível', tom: 'novo' }

  // Próximo passo (pela ordem do caminho dos noivos)
  let proximo: { titulo: string; quando?: string; chave: string } | null = null
  if (s.contratoDisponivel && !s.contratoAssinadoEm) proximo = { titulo: 'Assinar e enviar o contrato', chave: 'CONTRATO' }
  else if (!adjOk) proximo = { titulo: 'Pagar a adjudicação', quando: 'para reservar o dia', chave: 'PAGAMENTO' }
  else if (faltam !== null && faltam > 15 && faltam <= 60 && !briefingFeito) proximo = { titulo: 'Preencher o briefing', quando: `até ${dataPt(menos(casamento, 15))}`, chave: 'BRIEFING' }
  else if (faltam !== null && faltam >= 2 && faltam <= 30 && !reforcoOk) proximo = { titulo: 'Pagar o reforço', quando: `até ${dataPt(menos(casamento, 2))}`, chave: 'PAGAMENTO' }
  else if (faltam !== null && faltam >= 0) proximo = { titulo: faltam === 0 ? 'É hoje o grande dia' : 'O grande dia', quando: faltam === 0 ? undefined : `${dataPt(casamento)} · faltam ${faltam} dias`, chave: 'INICIO' }
  else if (!s.fotos_finais_url) proximo = { titulo: 'As vossas fotografias', quando: 'a caminho', chave: 'FOTOGRAF' }
  else if (!s.wedding_film_url) proximo = { titulo: 'O vosso filme', quando: 'em edição', chave: 'FILME' }
  else proximo = { titulo: 'A vossa opinião', quando: 'contem-nos como foi', chave: 'SAT' }

  return NextResponse.json({ avisos, proximo }, { headers: { 'Cache-Control': 'private, max-age=60' } })
}
