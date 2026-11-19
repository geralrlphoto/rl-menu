import { NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'
import { clienteAdmin } from '@/lib/podcast/dados'

/* ============================================================
   /api/podcast-gestao
   Uma só leitura para o painel de gestão de /social-media/podcast:
   episódios (com marcação e estado do vídeo), convidados ligados,
   número de potenciais, mensagens enviadas e candidaturas.
   Só admin. Lê quando se abre a página, sem polling.
   ============================================================ */

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const sb = clienteAdmin()
  const [eps, liga, pots, msgs, cands, convs] = await Promise.all([
    sb.from('podcast_episodios')
      .select('id, numero, temporada, slug, titulo, subtitulo, estado, data_publicacao, gravacao_data, gravacao_hora, gravacao_local, video_estado, video_bruto_url, youtube_id')
      .order('numero'),
    sb.from('podcast_episodio_convidados')
      .select('episodio_id, ordem, podcast_convidados (id, nome, email, telefone, instagram, profissao, empresa, bio, foto_url, website, publicar_perfil)')
      .order('ordem'),
    sb.from('podcast_potenciais').select('episodio_id'),
    sb.from('podcast_mensagens')
      .select('id, episodio_id, convidado_id, modelo, canal, enviado_em')
      .order('enviado_em', { ascending: false })
      .limit(500),
    sb.from('podcast_candidaturas').select('estado'),
    sb.from('podcast_convites')
      .select('id, token, episodio_id, nome, marca, telefone, email, nota, sobre, importancia, gravacao_data, gravacao_hora, gravacao_local, convidado_id, visto_em, resposta, resposta_em, created_at')
      .order('created_at'),
  ])

  const erro = eps.error || liga.error || pots.error || msgs.error || cands.error || convs.error
  if (erro) return NextResponse.json({ error: erro.message }, { status: 500 })

  const convidados: Record<string, any[]> = {}
  for (const l of liga.data ?? []) {
    const c = (l as any).podcast_convidados
    if (!c) continue
    ;(convidados[(l as any).episodio_id] ??= []).push(c)
  }
  const potenciais: Record<string, number> = {}
  for (const p of pots.data ?? []) potenciais[p.episodio_id] = (potenciais[p.episodio_id] ?? 0) + 1

  const mensagens: Record<string, any[]> = {}
  for (const m of msgs.data ?? []) (mensagens[m.episodio_id] ??= []).push(m)

  const convites: Record<string, any[]> = {}
  for (const c of convs.data ?? []) (convites[c.episodio_id] ??= []).push(c)

  const candidaturas = {
    total: cands.data?.length ?? 0,
    novas: (cands.data ?? []).filter(c => !c.estado || c.estado === 'nova').length,
  }

  return NextResponse.json({
    episodios: (eps.data ?? []).map(e => ({
      ...e,
      convidados: convidados[e.id] ?? [],
      potenciais: potenciais[e.id] ?? 0,
      mensagens: mensagens[e.id] ?? [],
      convites: convites[e.id] ?? [],
    })),
    candidaturas,
  })
}
