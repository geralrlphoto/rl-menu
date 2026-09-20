import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lista enxuta dos vídeos por estado, de TODOS os anos — usada pela gaveta
// 🎬 Vídeos em /eventos-2026.
//   Só devolve as colunas necessárias e só os eventos em edição ou entregues
//   (o resto fica de fora) para manter o egress baixo: esta rota é chamada
//   uma vez, quando a gaveta abre pela primeira vez.
//   Junta também o editor de vídeo (evento_equipa.editor_video) e, quando o
//   nome bate com um freelancer, o id para abrir o portal dele.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const ESTADOS = ['Em Edição', 'Em Revisão', 'Finalizado', 'Entregue']

const parseArr = (v: any): string[] => {
  if (Array.isArray(v)) return v.filter(Boolean).map(String)
  if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return []
    if (s.startsWith('[')) {
      try { const p = JSON.parse(s); return Array.isArray(p) ? p.map(String) : [] } catch { return [s] }
    }
    return s.split(',').map(x => x.trim()).filter(Boolean)
  }
  return []
}

// "JOSUÉ SANTOS " → "josue santos" (para casar nomes escritos de formas diferentes)
const norm = (s: string) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/\s+/g, ' ').trim()

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('eventos_2026')
      .select('id, notion_id, referencia, cliente, data_evento, local, video_estado')
      .in('video_estado', ESTADOS)
      .order('data_evento', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const rows = data ?? []
    const refs = Array.from(new Set(rows.map((r: any) => r.referencia).filter(Boolean)))

    // Editor de vídeo por referência + freelancers para descobrir o portal
    const [equipaRes, freelancersRes] = await Promise.all([
      refs.length
        ? supabase.from('evento_equipa').select('referencia, editor_video').in('referencia', refs)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from('freelancers').select('id, nome, status'),
    ])
    const editorPorRef = new Map<string, string>()
    for (const row of ((equipaRes as any).data ?? []) as any[]) {
      const nome = parseArr(row.editor_video)[0]
      if (row.referencia && nome) editorPorRef.set(String(row.referencia).toUpperCase(), nome)
    }
    const idPorNome = new Map<string, string>()
    const nomePorId  = new Map<string, string>()
    for (const f of ((freelancersRes as any).data ?? []) as any[]) {
      if (f.nome && f.id) { idPorNome.set(norm(f.nome), f.id); nomePorId.set(f.id, String(f.nome).trim()) }
    }

    // Referências sem editor no evento_equipa: descobre a quem o trabalho foi
    // enviado (notificação 'relatorio_editor' com __META__{referencia}), que é
    // como o painel do editor sabe os projetos dele. Fica o envio mais recente.
    const semEditor = refs.filter(r => !editorPorRef.has(String(r).toUpperCase()))
    const editorIdPorRef = new Map<string, string>()
    if (semEditor.length) {
      const filtro = semEditor.map(r => `mensagem.ilike.%"referencia":"${r}"%`).join(',')
      const { data: notifs } = await supabase
        .from('freelancer_notificacoes')
        .select('freelancer_id, mensagem, created_at')
        .eq('tipo', 'relatorio_editor')
        .or(filtro)
        .order('created_at', { ascending: false })
      for (const n of (notifs ?? []) as any[]) {
        const m = String(n.mensagem ?? '').match(/"referencia":"([^"]+)"/)
        const ref = m?.[1]?.toUpperCase()
        if (!ref || editorIdPorRef.has(ref)) continue   // já tem o mais recente
        if (n.freelancer_id) editorIdPorRef.set(ref, n.freelancer_id)
      }
    }

    const videos = rows.map((row: any) => {
      const ref = row.referencia ? String(row.referencia).toUpperCase() : null
      const nomeEquipa = ref ? editorPorRef.get(ref) ?? null : null
      const idEnvio    = ref ? editorIdPorRef.get(ref) ?? null : null
      const nomeEditor = nomeEquipa ?? (idEnvio ? nomePorId.get(idEnvio) ?? null : null)
      const idEditor   = nomeEquipa ? idPorNome.get(norm(nomeEquipa)) ?? null : idEnvio
      return {
        id:           row.id,
        notion_id:    row.notion_id ?? undefined,
        referencia:   row.referencia ?? '',
        cliente:      row.cliente ?? '',
        data_evento:  row.data_evento ?? '',
        local:        row.local ?? '',
        video_estado: row.video_estado ?? null,
        editor:       nomeEditor ? { nome: nomeEditor.trim(), id: idEditor } : null,
      }
    })

    return NextResponse.json({ videos, total: videos.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
