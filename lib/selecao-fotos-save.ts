import { createClient } from '@supabase/supabase-js'

// Gravação de uma seleção de fotos — Supabase + Notion.
// Usada pelo webhook do Tally (/api/webhook-tally-selecao) e pelo formulário
// próprio (/api/selecao-fotos-submit), para os dois seguirem o mesmo fluxo.

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const NOTION_DB_ID = '30d220116d8a80cf8568e19df7af1d7b' // "FOTOS P/SELEÇÃO" database

export type SelecaoFotos = {
  nome_noivos: string
  referencia: string | null
  date: string | null
  data_entrada: string
  sessao_noivos: string | null
  fotos_noiva: string | null
  fotos_noivo: string | null
  convidados: string | null
  cerimonia: string | null
  bolo_bouquet: string | null
  sala_animacao: string | null
  fotos_album: string | null
  detalhes: string | null
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function rt(text: string | null) {
  // Notion rich_text property value
  return { rich_text: [{ text: { content: text ?? '' } }] }
}

export async function saveToNotion(data: SelecaoFotos) {
  const properties: Record<string, any> = {
    'NOME DOS NOIVOS':      { title: [{ text: { content: data.nome_noivos } }] },
    'REFERÊNCIA DO EVENTO': rt(data.referencia),
    'SESSÃO NOIVOS':        rt(data.sessao_noivos),
    'FOTOS DA NOIVA':       rt(data.fotos_noiva),
    'FOTOS DO NOIVO':       rt(data.fotos_noivo),
    'CONVIDADOS':           rt(data.convidados),
    'CERIMÓNIA':            rt(data.cerimonia),
    'BOLO E BOUQUET':       rt(data.bolo_bouquet),
    'SALA E ANIMAÇÃO':      rt(data.sala_animacao),
    'FOTOS P/ÁLBUM':        rt(data.fotos_album),
    'DETALHES':             rt(data.detalhes),
  }

  if (data.date) {
    properties['Date'] = { date: { start: data.date } }
  }
  properties['Data  de Entrada'] = { date: { start: data.data_entrada } }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_DB_ID },
      properties,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[selecao-fotos] Notion error:', err)
  } else {
    const page = await res.json()
    console.log('[selecao-fotos] Notion page created:', page.id)
  }
}

// Grava no Supabase e, sem bloquear, cria a página no Notion.
export async function saveSelecao(mapped: SelecaoFotos, tag = 'selecao-fotos') {
  const { data: saved, error } = await db()
    .from('fotos_selecao')
    .insert(mapped)
    .select()
    .single()

  if (error) {
    console.error(`[${tag}] Supabase error:`, error)
    return { id: null as string | null, error: error.message }
  }
  console.log(`[${tag}] Supabase row saved:`, saved?.id, saved?.nome_noivos)

  saveToNotion(mapped).catch(e =>
    console.error(`[${tag}] Notion save failed:`, e)
  )

  return { id: saved?.id as string | null, error: null as string | null }
}
