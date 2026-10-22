import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeSessao, exigeAdmin, exigeAdminOuProprio, ehAdmin, sessaoMembro, naoAutorizado } from '@/lib/api-guard'
import { registarFoto } from '@/lib/fotografiaHistorico'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function GET(req: NextRequest) {
  const barrado = await exigeSessao(req)
  if (barrado) return barrado

  const fid = req.nextUrl.searchParams.get('freelancer_id')
  // Membro da equipa só lê os próprios dados (o admin lê tudo)
  const soProprio = await exigeAdminOuProprio(req, fid)
  if (soProprio) return soProprio
  if (!fid) return NextResponse.json({ error: 'freelancer_id required' }, { status: 400 })
  const supabase = db()
  const { data, error } = await supabase.from('freelancer_edicao').select('*').eq('freelancer_id', fid).order('data_casamento')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data ?? []

  // ── Filtro: só mostra trabalhos onde este freelancer está atribuído
  //          como `editor_fotos` em `evento_equipa` para a referência.
  // Regra do utilizador: "se eu não escolhi ninguém aqui, não pode aparecer
  // nada no portal do membro". Aplica-se SÓ a records que têm `referencia`
  // — records manualmente criados sem referência ficam visíveis.
  try {
    const refs = Array.from(new Set(rows.filter((r: any) => r.referencia).map((r: any) => r.referencia)))
    if (refs.length === 0) return NextResponse.json({ edicao: rows })

    // `editor_fotos` em `evento_equipa` guarda NOMES (ex.: "Patricio Ferreira"),
    // não ids. Buscamos o nome deste freelancer para comparar corretamente.
    const norm = (s: any) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()
    const { data: fl } = await supabase.from('freelancers').select('nome').eq('id', fid).maybeSingle()
    const meuNome = norm(fl?.nome)

    const { data: equipa } = await supabase
      .from('evento_equipa')
      .select('referencia, editor_fotos')
      .in('referencia', refs)

    const editorByRef = new Map<string, string[]>()
    for (const e of (equipa ?? []) as any[]) {
      if (!e.referencia) continue
      const list = Array.isArray(e.editor_fotos) ? e.editor_fotos : (e.editor_fotos ? [e.editor_fotos] : [])
      editorByRef.set(e.referencia, list)
    }

    const filtered = rows.filter((r: any) => {
      // Sem referência → mantém (job manual)
      if (!r.referencia) return true
      const editores = editorByRef.get(r.referencia)
      // Sem entrada em evento_equipa → não há editor atribuído → esconde
      if (!editores) return false
      // Freelancer atribuído? Comparamos por NOME (normalizado) e, por
      // segurança, também pelo id — caso algum evento guarde ids.
      return editores.some(e => norm(e) === meuNome || e === fid)
    })

    return NextResponse.json({ edicao: filtered })
  } catch (err) {
    // Se a tabela evento_equipa não existir ou falhar, devolve tudo (não bloqueia)
    console.warn('[freelancer-edicao GET] filter by evento_equipa failed:', err)
    return NextResponse.json({ edicao: rows })
  }
}

export async function POST(req: NextRequest) {
  const barrado = await exigeSessao(req)
  if (barrado) return barrado

  const body = await req.json()
  const { data, error } = await db().from('freelancer_edicao').insert({ ...body, updated_at: new Date().toISOString() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, edicao: data })
}

export async function PATCH(req: NextRequest) {
  const barrado = await exigeSessao(req)
  if (barrado) return barrado

  const { id, ...fields } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = db()
  // Estado anterior: o formulário de edição manda sempre o status, mesmo sem mudar
  const { data: antes } = await supabase.from('freelancer_edicao').select('status').eq('id', id).maybeSingle()
  const { error } = await supabase.from('freelancer_edicao').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Estado da edição → evento. O editor só vê a seleção dos noivos depois de passar a EM EDIÇÃO,
  // e essa mudança chega à ficha, ao portal dos noivos ("Fotos para Edição"), ao Notion e ao
  // histórico do Departamento de Fotografia. Voltar a NOVO TRABALHO repõe "Enviado".
  // CONCLUÍDO não mexe no evento: a entrega aos noivos é da RL (Departamento de Fotografia).
  if ((fields.status === 'EM EDIÇÃO' || fields.status === 'NOVO TRABALHO') && fields.status !== antes?.status) {
    try {
      const emEdicao = fields.status === 'EM EDIÇÃO'
      const { data: rec } = await supabase.from('freelancer_edicao').select('referencia, freelancer_id').eq('id', id).single()
      const ref = rec?.referencia
      if (ref) {
        const estadoEvento = emEdicao ? 'Em Edição' : 'Enviado'
        for (const t of ['eventos_2026', 'eventos_2027']) {
          const { data: ev } = await supabase.from(t).select('id, notion_id, fotos_edicao_estado').eq('referencia', ref).maybeSingle()
          if (!ev) continue
          const atual = String(ev.fotos_edicao_estado ?? '')
          // Não desfaz uma entrega nem um "sem serviço"; só volta a Enviado se estava Em Edição
          const muda = !/entreg|s\/servi/i.test(atual) && (emEdicao || atual === 'Em Edição')
          if (muda && atual !== estadoEvento) {
            await supabase.from(t).update({ fotos_edicao_estado: estadoEvento }).eq('id', ev.id)
            if (ev.notion_id && process.env.NOTION_TOKEN) {
              await fetch(`https://api.notion.com/v1/pages/${ev.notion_id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${process.env.NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
                body: JSON.stringify({ properties: { 'FOTOS P/ EDIÇÃO': { select: { name: estadoEvento } } } }),
              }).catch(e => console.warn('[freelancer-edicao] Notion:', e))
            }
          }
          break
        }
        if (emEdicao) {
          // Os noivos já escolheram: a "Seleção Fotos Noivos" do portal fica concluída
          const { data: portal } = await supabase.from('portais').select('settings').ilike('referencia', ref).maybeSingle()
          if (portal && !/conclu|entreg/i.test(String(portal.settings?.selecao_fotos_noivos_estado ?? ''))) {
            await supabase.from('portais')
              .update({ settings: { ...(portal.settings ?? {}), selecao_fotos_noivos_estado: 'Concluído' } })
              .ilike('referencia', ref)
          }
          const { data: fl } = rec?.freelancer_id
            ? await supabase.from('freelancers').select('nome').eq('id', rec.freelancer_id).maybeSingle()
            : { data: null }
          await registarFoto(ref, 'Edição começada', fl?.nome ?? 'Editor')
        }
      }
    } catch (e) {
      console.error('[freelancer-edicao] sync estado:', e)
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await db().from('freelancer_edicao').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
