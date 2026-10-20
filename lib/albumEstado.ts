// Estado do álbum de um casamento: um só sítio que o muda e propaga a tudo
// (Departamento de Fotografia › Álbuns). Como lib/videoEstado.ts para o vídeo.
//
//   NOVO ÁLBUM     → criado ao nomear o editor do álbum
//   EM EDIÇÃO      → o editor a trabalhar (ou a RL pediu alterações à maqueta)
//   REVISÃO RL     → o editor enviou a maqueta (link); a RL vê antes dos noivos
//   PARA APROVAÇÃO → a RL enviou a maqueta aos noivos (email + portal)
//   ALTERAÇÕES     → os noivos pediram alterações; volta ao editor
//   APROVADO       → os noivos aprovaram; produção em 30 dias
//   ENTREGUE       → a RL entregou o álbum
//
// Escreve: albuns_casamento (status e datas), freelancer_album (portal do editor),
// eventos (album_estado, via /api/eventos-notion), portais.settings (maquete_url,
// maquete_enviada), avisos ao editor e aos noivos, e o histórico (fotografia_historico).

import { createClient } from '@supabase/supabase-js'
import { cabecalhoInterno } from '@/lib/api-guard'
import { registarFoto } from '@/lib/fotografiaHistorico'

export const ESTADOS_ALBUM = ['NOVO ÁLBUM', 'EM EDIÇÃO', 'REVISÃO RL', 'PARA APROVAÇÃO', 'ALTERAÇÕES', 'APROVADO', 'ENTREGUE'] as const
export type EstadoAlbum = typeof ESTADOS_ALBUM[number]
export const PRAZO_PRODUCAO_DIAS = 30

/** Nome de cada estado no histórico e no quadro */
export const ROTULO_ALBUM: Record<EstadoAlbum, string> = {
  'NOVO ÁLBUM': 'Por começar', 'EM EDIÇÃO': 'Em edição', 'REVISÃO RL': 'Revisão RL', 'PARA APROVAÇÃO': 'Com os noivos',
  'ALTERAÇÕES': 'Alterações', 'APROVADO': 'Aprovado', 'ENTREGUE': 'Entregue',
}
// estado → portal do editor (freelancer_album.status)
const PARA_EDITOR: Record<EstadoAlbum, string> = {
  'NOVO ÁLBUM': 'AGUARDAR', 'EM EDIÇÃO': 'EM EDIÇÃO', 'REVISÃO RL': 'EM APROVAÇÃO', 'PARA APROVAÇÃO': 'EM APROVAÇÃO',
  'ALTERAÇÕES': 'EM EDIÇÃO', 'APROVADO': 'APROVADO', 'ENTREGUE': 'ENTREGUE',
}
// estado → ficha do evento (album_estado)
const PARA_EVENTO: Record<EstadoAlbum, string> = {
  'NOVO ÁLBUM': 'Aguardar', 'EM EDIÇÃO': 'Em Edição', 'REVISÃO RL': 'Em Edição', 'PARA APROVAÇÃO': 'Em Aprovação',
  'ALTERAÇÕES': 'Em Edição', 'APROVADO': 'Aprovado', 'ENTREGUE': 'Entregue',
}

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const hoje = () => new Date().toISOString().slice(0, 10)
const maisDias = (iso: string, n: number) => new Date(new Date(iso + 'T12:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10)
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

/** Avisa o(s) editor(es) do álbum: sino do portal do editor + email. */
export async function avisarEditorAlbum(referencia: string, titulo: string, texto: string) {
  try {
    const sb = db()
    const { data: eq } = await sb.from('evento_equipa').select('editor_album').eq('referencia', referencia).maybeSingle()
    const nomes: string[] = Array.isArray(eq?.editor_album) ? eq!.editor_album : eq?.editor_album ? [String(eq.editor_album)] : []
    if (!nomes.length) return
    const { data: fls } = await sb.from('freelancers').select('id, nome, email')
    const editores = (fls ?? []).filter(f => nomes.some(n => norm(n) === norm(f.nome ?? '')))
    for (const f of editores) {
      const meta = JSON.stringify({ referencia })
      await sb.from('freelancer_notificacoes').insert({ freelancer_id: f.id, titulo, mensagem: `__META__${meta}__/META__\n${texto}`, tipo: 'album_estado', lida: false })
      const email = String(f.email ?? '').trim()
      if (email.includes('@') && process.env.RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: process.env.FROM_EMAIL ?? 'RL Photo.Video <geral@rlphotovideo.pt>', to: [email], reply_to: 'geral.rlphoto@gmail.com',
            subject: titulo,
            html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:40px 32px;background:#0b0a08;color:#f0e8d8;">
              <p style="font-size:10px;letter-spacing:.45em;color:#d8be93;text-transform:uppercase;margin:0 0 24px;">RL Photo · Video · Álbum</p>
              <p style="font-size:20px;font-style:italic;margin:0 0 16px;">${esc(titulo)}</p>
              <p style="font-size:14px;color:#c9b88a;line-height:1.7;white-space:pre-line;margin:0 0 28px;">${esc(texto)}</p>
              <a href="https://portal.rlphotovideo.pt/freelancer-view/${f.id}" style="display:inline-block;padding:12px 26px;background:#d8be93;color:#0b0a08;border-radius:40px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;font-weight:700;font-family:Arial,sans-serif;">Abrir o meu portal</a>
              <p style="font-size:11px;color:#8c8170;margin:32px 0 0;">(Mensagem automática)</p>
            </div>`,
          }),
        }).catch(() => {})
      }
    }
  } catch (e) { console.error('[albumEstado] avisar editor:', e) }
}

export async function aplicarEstadoAlbum(origin: string, o: {
  referencia: string
  estado: EstadoAlbum
  origem: string                // RL, Noivos, nome do editor…
  maqueteUrl?: string | null    // link da maqueta (REVISÃO RL)
  nota?: string | null          // alterações pedidas (EM EDIÇÃO pela RL / ALTERAÇÕES pelos noivos)
}): Promise<{ ok: boolean; erro?: string }> {
  const sb = db()
  const { referencia, estado } = o
  const { data: alb } = await sb.from('albuns_casamento').select('id, nome, status').eq('ref_evento', referencia).maybeSingle()
  if (!alb) return { ok: false, erro: 'Este casamento ainda não tem álbum (nomeia primeiro o editor do álbum).' }

  // 1) álbum (estado e datas)
  const upd: Record<string, any> = { status: estado, updated_at: new Date().toISOString() }
  if (estado === 'APROVADO') { upd.data_aprovacao = hoje(); upd.data_prevista_entrega = maisDias(hoje(), PRAZO_PRODUCAO_DIAS) }
  if (estado === 'ENTREGUE') upd.entrega_album = hoje()
  await sb.from('albuns_casamento').update(upd).eq('id', alb.id)

  // 2) portal do editor
  await sb.from('freelancer_album').update({ status: PARA_EDITOR[estado], updated_at: new Date().toISOString() }).eq('referencia_album', referencia)

  // 3) ficha do evento (Notion + eventos_YYYY)
  try {
    const { data: ev } = await sb.from('eventos_2026').select('notion_id, id').eq('referencia', referencia).maybeSingle()
    const id = ev?.notion_id || (ev?.id ? String(ev.id) : null)
    if (id) await fetch(`${origin}/api/eventos-notion/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...cabecalhoInterno() }, body: JSON.stringify({ album_estado: PARA_EVENTO[estado] }),
    })
  } catch { /* não bloqueia */ }

  // 4) portal dos noivos (link da maqueta)
  const { data: pt } = await sb.from('portais').select('id, noiva, noivo, settings').eq('referencia', referencia).maybeSingle()
  const settings: Record<string, any> = { ...(pt?.settings ?? {}) }
  if (pt && (o.maqueteUrl || estado === 'PARA APROVAÇÃO')) {
    if (o.maqueteUrl) settings.maquete_url = o.maqueteUrl
    if (estado === 'PARA APROVAÇÃO') settings.maquete_enviada = hoje()
    await sb.from('portais').update({ settings }).eq('id', pt.id)
  }
  const nomes = [pt?.noiva, pt?.noivo].filter(Boolean).join(' & ') || alb.nome || referencia

  // 5) avisos
  if (estado === 'PARA APROVAÇÃO' && settings.maquete_url) {
    await fetch(`${origin}/api/send-maquete-email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...cabecalhoInterno() },
      body: JSON.stringify({ email_noiva: null, nome_noiva: pt?.noiva ?? null, nome_noivo: pt?.noivo ?? null, url: settings.maquete_url, referencia }),
    }).catch(() => {})
  }
  if (estado === 'EM EDIÇÃO' && o.origem === 'RL' && o.nota) {
    await avisarEditorAlbum(referencia, `Álbum · alterações da RL · ${nomes}`, `A RL reviu a maqueta do álbum de ${nomes} e pediu estas alterações:\n\n${o.nota}`)
  }
  if (estado === 'ALTERAÇÕES') {
    await avisarEditorAlbum(referencia, `Álbum · os noivos pediram alterações · ${nomes}`, `Os noivos ${nomes} pediram alterações à maqueta do álbum.${o.nota ? `\n\n${o.nota}` : ''}\n\nVê o pedido completo no teu portal.`)
  }
  if (estado === 'APROVADO') {
    const entrega = new Date(maisDias(hoje(), PRAZO_PRODUCAO_DIAS) + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })
    await avisarEditorAlbum(referencia, `Álbum aprovado · ${nomes}`, `Os noivos ${nomes} aprovaram a maqueta do álbum. Podes avançar com a produção.\n\nEntrega prevista: ${entrega} (${PRAZO_PRODUCAO_DIAS} dias).`)
    await fetch(`${origin}/api/send-admin-notification`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...cabecalhoInterno() },
      body: JSON.stringify({ tipo: 'album_aprovado', nome_noivos: nomes, referencia }),
    }).catch(() => {})
  }
  if (estado === 'ENTREGUE') {
    await sb.from('album_alteracoes').delete().eq('ref_evento', referencia)
    await fetch(`${origin}/api/notificacao-noivos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...cabecalhoInterno() },
      body: JSON.stringify({ referencia, titulo: 'O vosso álbum está pronto', texto: 'O vosso álbum de casamento está pronto. Entraremos em contacto para combinar a entrega.' }),
    }).catch(() => {})
  }

  // 6) histórico
  await registarFoto(referencia, `Álbum: ${ROTULO_ALBUM[estado]}`, o.origem)
  return { ok: true }
}
