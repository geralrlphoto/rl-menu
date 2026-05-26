import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get('freelancer_id')
  if (!fid) return NextResponse.json({ error: 'freelancer_id required' }, { status: 400 })
  const supabase = db()
  const { data, error } = await supabase.from('freelancer_casamentos').select('*').eq('freelancer_id', fid).order('data_casamento')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Fallback: enriquece casamentos com dados do evento (eventos_2026/2027) e equipa.
  const casamentos = data ?? []
  try {
    const datas = Array.from(new Set(casamentos.filter((c: any) => c.data_casamento).map((c: any) => c.data_casamento)))
    if (datas.length > 0) {
      // 1) Buscar eventos por data
      const { data: events } = await supabase
        .from('eventos_2026')
        .select('referencia, local, data_evento, servicos_dia, local_cerimonia, hora_inicio')
        .in('data_evento', datas)

      // 2) Buscar todas as evento_equipa (filtra por referencia/evento_id quando possível)
      const refs = Array.from(new Set(casamentos.filter((c: any) => c.referencia).map((c: any) => c.referencia)))
      let equipa: any[] = []
      if (refs.length > 0) {
        const { data: eq } = await supabase
          .from('evento_equipa')
          .select('referencia, evento_id, local, data_casamento, fotografo, videografo, editor_fotos, editor_album, editor_video')
          .in('referencia', refs)
        equipa = eq ?? []
      }
      // Também procura por local+data para casamentos sem referencia
      const localData = casamentos.filter((c: any) => !c.referencia && c.local && c.data_casamento)
      if (localData.length > 0) {
        const { data: eq2 } = await supabase
          .from('evento_equipa')
          .select('referencia, evento_id, local, data_casamento, fotografo, videografo, editor_fotos, editor_album, editor_video')
          .in('data_casamento', Array.from(new Set(localData.map((c: any) => c.data_casamento))))
        equipa = [...equipa, ...(eq2 ?? [])]
      }

      const byRef = new Map<string, any>((events ?? []).filter((e: any) => e.referencia).map((e: any) => [e.referencia, e]))
      const equipaByRef = new Map<string, any>(equipa.filter((e: any) => e.referencia).map((e: any) => [e.referencia, e]))

      casamentos.forEach((c: any) => {
        // ── EVENTO (servicos_dia, local_cerimonia, hora_inicio) ──
        let ev: any = c.referencia ? byRef.get(c.referencia) : null
        if (!ev && c.local && c.data_casamento) {
          const localLower = c.local.toLowerCase().trim()
          ev = (events ?? []).find((e: any) =>
            e.data_evento === c.data_casamento &&
            e.local && (e.local.toLowerCase().includes(localLower) || localLower.includes(e.local.toLowerCase()))
          )
        }
        if (ev) {
          if (!c.servicos_dia || c.servicos_dia.length === 0) c.servicos_dia = ev.servicos_dia ?? c.servicos_dia
          if (!c.local_cerimonia) c.local_cerimonia = ev.local_cerimonia ?? c.local_cerimonia
          if (!c.hora_inicio)     c.hora_inicio     = ev.hora_inicio ?? c.hora_inicio
          if (!c.referencia)      c.referencia      = ev.referencia ?? c.referencia
        }

        // ── EQUIPA (editor_fotos, editor_album, editor_video) ──
        let eq: any = c.referencia ? equipaByRef.get(c.referencia) : null
        if (!eq && c.local && c.data_casamento) {
          const localLower = c.local.toLowerCase().trim()
          eq = equipa.find((e: any) =>
            e.data_casamento === c.data_casamento &&
            e.local && (e.local.toLowerCase().includes(localLower) || localLower.includes(e.local.toLowerCase()))
          )
        }
        // Expor editores como array (mesmo se text[] ou string) — usado pelo frontend p/ unlock
        c.editor_fotos = eq?.editor_fotos ?? []
        c.editor_album = eq?.editor_album ?? []
        c.editor_video = eq?.editor_video ?? []
      })
    }
  } catch { /* tabela ou coluna pode não existir; ignora */ }
  return NextResponse.json({ casamentos })
}

const OPTIONAL_COLS = [
  'servicos_dia', 'referencia', 'local_cerimonia', 'hora_inicio',
  'url_selecao', 'url_provas', 'url_editadas', 'url_album',
  'url_selecao_enviado_em', 'url_provas_enviado_em', 'url_editadas_enviado_em', 'url_album_enviado_em',
  'status_editadas', 'status_selecao', 'status_provas', 'status_album',
] as const

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = db()
  // Tentar primeiro com TODAS as colunas opcionais; se falhar por coluna inexistente, retry sem elas
  let { data, error } = await supabase.from('freelancer_casamentos').insert(body).select().single()
  if (error && /column .* of relation/i.test(error.message)) {
    // Retry sem as colunas opcionais
    const core: any = { ...body }
    OPTIONAL_COLS.forEach(c => delete core[c])
    const res2 = await supabase.from('freelancer_casamentos').insert(core).select().single()
    data = res2.data; error = res2.error
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, casamento: data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, confirmado_em, indisponivel_em, confirmado_videografo_em, indisponivel_videografo_em, ...rest } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = db()

  // Separa core (sempre safe) das colunas opcionais (podem não existir)
  const coreFields: Record<string, any> = {}
  const optFields: Record<string, any> = {}
  for (const [k, v] of Object.entries(rest)) {
    if ((OPTIONAL_COLS as readonly string[]).includes(k)) optFields[k] = v
    else coreFields[k] = v
  }

  // 1 — save core fields (always works)
  if (Object.keys(coreFields).length > 0) {
    const { error } = await supabase.from('freelancer_casamentos').update(coreFields).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 2 — save timestamps separately (silently ignored if columns don't exist yet)
  const tsFields: Record<string, string> = {}
  if (confirmado_em)              tsFields.confirmado_em              = confirmado_em
  if (indisponivel_em)            tsFields.indisponivel_em            = indisponivel_em
  if (confirmado_videografo_em)   tsFields.confirmado_videografo_em   = confirmado_videografo_em
  if (indisponivel_videografo_em) tsFields.indisponivel_videografo_em = indisponivel_videografo_em

  if (Object.keys(tsFields).length > 0) {
    await supabase.from('freelancer_casamentos').update(tsFields).eq('id', id).then(() => {}).catch(() => {})
  }

  // 3 — save optional fields — silently ignored se coluna não existir
  if (Object.keys(optFields).length > 0) {
    // Tenta tudo de uma vez primeiro; se falhar, tenta um por um para isolar
    const { error } = await supabase.from('freelancer_casamentos').update(optFields).eq('id', id)
    if (error) {
      // Tenta um por um (degrada gracioso por coluna em falta)
      for (const [k, v] of Object.entries(optFields)) {
        await supabase.from('freelancer_casamentos').update({ [k]: v }).eq('id', id).then(() => {}).catch(() => {})
      }
    }
  }

  // 4 — Sync para portal dos noivos (bidireccional): qualquer alteração de
  //     status_selecao/editadas/album propaga para eventos_2026/2027 e Notion.
  //     O portal lê Notion primeiro → precisamos de atualizar ambos os lados.
  //
  // Mapeamento freelancer (UPPERCASE) → portal (capitalized):
  const FC_TO_PORTAL_STATUS: Record<string, Record<string, string>> = {
    status_selecao: {
      'AGUARDAR':     'Aguardar',
      'EM SELEÇÃO':   'Em Edição',
      'SELECIONADAS': 'Concluído',
      'ENTREGUE':     'Entregue',
    },
    status_editadas: {
      'AGUARDAR':  'Aguardar',
      'EM EDIÇÃO': 'Em Edição',
      'EDITADAS':  'Concluído',
      'ENTREGUE':  'Entregue',
    },
    status_album: {
      'AGUARDAR':  'Aguardar',
      'EM EDIÇÃO': 'Em Edição',
      'CONCLUIDO': 'Aprovado',
      'ENTREGUE':  'Entregue',
    },
  }
  const FC_TO_PORTAL_COL: Record<string, { sb: string; notion: string }> = {
    status_selecao:  { sb: 'sel_fotos_estado',    notion: 'ESTADO SEL. FOTOS' },
    status_editadas: { sb: 'fotos_edicao_estado', notion: 'FOTOS P/ EDIÇÃO' },
    status_album:    { sb: 'album_estado',        notion: 'ESTADO ÁLBUM' },
  }
  // Recolhe todas as alterações de estado nesta request
  const eventStatusSb: Record<string, string> = {}
  const eventStatusNotion: Record<string, any> = {}
  for (const [fcCol, mapping] of Object.entries(FC_TO_PORTAL_STATUS)) {
    if (optFields[fcCol] === undefined) continue
    const fcVal = String(optFields[fcCol] ?? '')
    const portalVal = mapping[fcVal]
    if (!portalVal) continue
    const cols = FC_TO_PORTAL_COL[fcCol]
    eventStatusSb[cols.sb] = portalVal
    eventStatusNotion[cols.notion] = { select: { name: portalVal } }
  }

  if (Object.keys(eventStatusSb).length > 0) {
    try {
      const { data: fc } = await supabase
        .from('freelancer_casamentos')
        .select('referencia, evento_id, local, data_casamento')
        .eq('id', id)
        .maybeSingle()
      if (fc) {
        let notionId: string | null = null
        let matchedTable: string | null = null

        // 1) Procura o evento em Supabase (eventos_2026 ou _2027) — várias estratégias
        for (const t of ['eventos_2026', 'eventos_2027']) {
          if (matchedTable) break
          // a) Por referencia
          if (fc.referencia) {
            const { data } = await supabase.from(t).select('id, notion_id').eq('referencia', fc.referencia).maybeSingle()
            if (data) {
              await supabase.from(t).update(eventStatusSb).eq('id', data.id)
              notionId = data.notion_id ?? null
              matchedTable = t
              continue
            }
          }
          // b) Por evento_id (notion_id) — se for um ID real e não 'ref_XXX'
          if (fc.evento_id && !String(fc.evento_id).startsWith('ref_')) {
            const { data } = await supabase.from(t).select('id, notion_id')
              .or(`notion_id.eq.${fc.evento_id},id.eq.${fc.evento_id}`).maybeSingle()
            if (data) {
              await supabase.from(t).update(eventStatusSb).eq('id', data.id)
              notionId = data.notion_id ?? fc.evento_id
              matchedTable = t
              continue
            }
          }
          // c) Por local + data
          if (fc.local && fc.data_casamento) {
            const { data } = await supabase.from(t).select('id, notion_id')
              .ilike('local', fc.local).eq('data_evento', fc.data_casamento).maybeSingle()
            if (data) {
              await supabase.from(t).update(eventStatusSb).eq('id', data.id)
              notionId = data.notion_id ?? null
              matchedTable = t
              continue
            }
          }
        }

        // 2) Se conseguimos um notion_id real, atualiza também as propriedades
        //    no Notion (que é o que o portal lê primeiro).
        if (notionId && process.env.NOTION_TOKEN) {
          try {
            await fetch(`https://api.notion.com/v1/pages/${notionId}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ properties: eventStatusNotion }),
            })
          } catch (e) {
            console.warn('[freelancer-casamentos sync status] Notion update failed:', e)
          }
        }
      }
    } catch (err) {
      console.error('[freelancer-casamentos sync status]', err)
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await db().from('freelancer_casamentos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
