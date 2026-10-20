// Estado do vídeo de um casamento: um só sítio que o muda e propaga a tudo.
// Gerido pelo Departamento de Edição de Vídeo:
//   Aguardar    → automático ao nomear o editor (download bloqueado)
//   Em Edição   → o editor, para desbloquear o download (e quando a RL pede alterações)
//   Em Revisão  → o editor, quando envia o link de revisão
//   Finalizado  → só a RL, ao aprovar
//   Entregue    → só a RL, ao enviar o filme aos noivos (departamento)
// Escreve: Notion + eventos_YYYY + evento_equipa (via /api/eventos-notion), portais.settings.video_estado
// (portal dos noivos), a fase do projeto no Painel do Editor (freelancers.editor_workflow)
// e uma linha no histórico do projeto (video_estado_historico). Da primeira vez que o
// vídeo chega a cada passo, os noivos recebem o Ticket do Filme por email.

import { createClient } from '@supabase/supabase-js'
import { cabecalhoInterno } from '@/lib/api-guard'
import { resolveEmailNoiva } from '@/app/api/_lib/emailNoiva'
import { buildTicketFilmeHtml, type PassoFilme } from '@/lib/ticket-filme-html'

export const ESTADOS_VIDEO = ['Aguardar', 'Em Edição', 'Em Revisão', 'Finalizado', 'Entregue'] as const
export type EstadoVideo = typeof ESTADOS_VIDEO[number]
/** O que o editor pode pôr sozinho; o resto é da RL. */
export const ESTADOS_DO_EDITOR: EstadoVideo[] = ['Aguardar', 'Em Edição', 'Em Revisão']

// estado → fase guardada em freelancers.editor_workflow (nomes do Painel do Editor)
const FASE_DO_ESTADO: Record<EstadoVideo, string> = {
  'Aguardar': 'Novo', 'Em Edição': 'Em Edição', 'Em Revisão': 'Para Revisão', 'Finalizado': 'Finalizado', 'Entregue': 'Entregue',
}

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export async function aplicarEstadoVideo(origin: string, o: {
  referencia: string | null
  evento_id?: string | null
  estado: EstadoVideo
  freelancerId?: string | null      // editor do projeto (se não vier, procura-se)
  origem?: string                   // para o histórico (por defeito: quem costuma pôr este estado)
}): Promise<{ ok: boolean; eventId: string | null }> {
  const sb = db()
  const { referencia, estado } = o

  // 1) evento (id do Notion ou do Supabase)
  let eventId: string | null = o.evento_id || null
  if (!eventId && referencia) {
    for (const t of ['eventos_2026', 'eventos_2027']) {
      const { data } = await sb.from(t).select('notion_id, id').eq('referencia', referencia).maybeSingle()
      if (data) { eventId = (data as any).notion_id || String((data as any).id); break }
    }
  }

  // 2) Notion + eventos_YYYY + evento_equipa pelo endpoint canónico
  let ok = false
  if (eventId) {
    try {
      const r = await fetch(`${origin}/api/eventos-notion/${eventId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...cabecalhoInterno() },
        body: JSON.stringify({ video_estado: estado }),
      })
      ok = r.ok
    } catch { /* fallback abaixo */ }
  }
  if (!ok && referencia) {
    for (const t of ['eventos_2026', 'eventos_2027']) await sb.from(t).update({ video_estado: estado }).eq('referencia', referencia)
    ok = true
  }

  // 3) portal dos noivos (Estado das Entregas lê também portais.settings.video_estado)
  if (referencia) {
    const { data: p } = await sb.from('portais').select('id, settings').eq('referencia', referencia).maybeSingle()
    if (p) await sb.from('portais').update({ settings: { ...(p.settings ?? {}), video_estado: estado } }).eq('id', p.id)
  }

  // 4) fase do projeto no Painel do Editor
  if (referencia) {
    let ids: string[] = o.freelancerId ? [o.freelancerId] : []
    if (!ids.length) {
      const { data: rv } = await sb.from('video_revisoes').select('freelancer_id').eq('referencia', referencia).maybeSingle()
      if (rv?.freelancer_id) ids = [rv.freelancer_id]
    }
    if (!ids.length) {
      const { data: eq } = await sb.from('evento_equipa').select('editor_video').eq('referencia', referencia).maybeSingle()
      const nomes: string[] = Array.isArray(eq?.editor_video) ? eq!.editor_video : eq?.editor_video ? [String(eq.editor_video)] : []
      if (nomes.length) {
        const { data: eds } = await sb.from('freelancers').select('id, nome').eq('status', 'EDITORES')
        ids = (eds ?? []).filter(e => nomes.some(n => norm(n) === norm(e.nome ?? ''))).map(e => e.id)
      }
    }
    for (const id of ids) {
      const { data: fl } = await sb.from('freelancers').select('editor_workflow').eq('id', id).maybeSingle()
      const wf = (fl?.editor_workflow && typeof fl.editor_workflow === 'object') ? fl.editor_workflow : {}
      await sb.from('freelancers').update({ editor_workflow: { ...wf, [referencia]: FASE_DO_ESTADO[estado] } }).eq('id', id)
    }
  }
  // 5) histórico do projeto (Departamento de Edição de Vídeo) e Ticket do Filme aos noivos
  if (referencia) {
    const { count } = await sb.from('video_estado_historico').select('id', { count: 'exact', head: true })
      .eq('referencia', referencia).eq('estado', estado)
    await registarHistorico(referencia, estado, o.origem ?? ORIGEM_DO_ESTADO[estado])
    // Só da primeira vez em cada passo; o Entregue tem o email do Wedding Film, e as
    // alterações pedidas pela RL não voltam a avisar os noivos.
    if (!count && estado !== 'Entregue' && o.origem !== 'RL (alterações)') {
      await enviarTicketFilme(referencia, estado as PassoFilme)
    }
  }
  return { ok, eventId }
}

const ORIGEM_DO_ESTADO: Record<EstadoVideo, string> = {
  'Aguardar': 'Automático', 'Em Edição': 'Editor', 'Em Revisão': 'Editor', 'Finalizado': 'RL', 'Entregue': 'RL',
}

/** Envia o Ticket do Filme aos noivos (email da noiva). Uma falha nunca estraga a mudança de estado. */
export async function enviarTicketFilme(referencia: string, passo: PassoFilme, estreia: string | null = null): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false
  try {
    const { data: p } = await db().from('portais').select('noiva, noivo, data').eq('referencia', referencia).maybeSingle()
    const email = await resolveEmailNoiva(null, referencia)
    if (!email) return false
    const noivos = [p?.noiva, p?.noivo].filter(Boolean).join(' & ') || 'Noivos'
    const html = buildTicketFilmeHtml({ passo, referencia, noivos, estreia, batizado: referencia.startsWith('BAT_'), data: p?.data ?? null })
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL ?? 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: [email], reply_to: 'geral.rlphoto@gmail.com',
        subject: `Ticket do Filme · ${noivos}`, html,
      }),
    })
    return r.ok
  } catch (e) { console.error('[videoEstado] ticket do filme:', e); return false }
}

/** Acrescenta uma linha ao histórico do projeto, sem repetir o último estado registado. */
export async function registarHistorico(referencia: string, estado: string, origem: string | null = null) {
  try {
    const sb = db()
    const { data: ult } = await sb.from('video_estado_historico').select('estado')
      .eq('referencia', referencia).order('criado_em', { ascending: false }).limit(1).maybeSingle()
    if (ult?.estado === estado) return
    await sb.from('video_estado_historico').insert({ referencia, estado, origem })
  } catch (e) { console.error('[videoEstado] histórico:', e) }
}

/** Fase do Painel do Editor → estado do vídeo (as fases detalhadas contam como Em Edição). */
export function estadoDaFase(fase: string): EstadoVideo {
  const s = (fase || '').trim()
  if (s === '' || s === 'Novo' || s === 'Novo Projeto') return 'Aguardar'
  if (s === 'Entregue') return 'Entregue'
  if (s === 'Finalizado') return 'Finalizado'
  if (s === 'Para Revisão' || s === 'Correções') return 'Em Revisão'
  return 'Em Edição'
}
