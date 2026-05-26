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

  // ── Fallback: enriquece casamentos com dados do evento (eventos_2026/2027).
  //    Tenta match por referência primeiro; se não houver, tenta por
  //    local + data_casamento (case-insensitive contains).
  const casamentos = data ?? []
  const needsEnrich = casamentos.filter((c: any) =>
    (!c.servicos_dia || c.servicos_dia.length === 0) ||
    !c.local_cerimonia || !c.hora_inicio
  )
  if (needsEnrich.length > 0) {
    try {
      // Fetch eventos por data_evento (suficiente: depois filtramos em memória por local/ref)
      const datas = Array.from(new Set(needsEnrich.filter((c: any) => c.data_casamento).map((c: any) => c.data_casamento)))
      if (datas.length === 0) return NextResponse.json({ casamentos })
      const { data: events } = await supabase
        .from('eventos_2026')
        .select('referencia, local, data_evento, servicos_dia, local_cerimonia, hora_inicio')
        .in('data_evento', datas)

      const byRef = new Map<string, any>((events ?? []).filter((e: any) => e.referencia).map((e: any) => [e.referencia, e]))
      casamentos.forEach((c: any) => {
        let ev: any = c.referencia ? byRef.get(c.referencia) : null
        // Fallback: match por local (case-insensitive contains) + data
        if (!ev && c.local && c.data_casamento) {
          const localLower = c.local.toLowerCase().trim()
          ev = (events ?? []).find((e: any) =>
            e.data_evento === c.data_casamento &&
            e.local && (e.local.toLowerCase().includes(localLower) || localLower.includes(e.local.toLowerCase()))
          )
        }
        if (!ev) return
        if (!c.servicos_dia    || c.servicos_dia.length === 0) c.servicos_dia    = ev.servicos_dia ?? c.servicos_dia
        if (!c.local_cerimonia) c.local_cerimonia = ev.local_cerimonia ?? c.local_cerimonia
        if (!c.hora_inicio)     c.hora_inicio     = ev.hora_inicio ?? c.hora_inicio
        if (!c.referencia)      c.referencia      = ev.referencia ?? c.referencia
      })
    } catch { /* tabela ou coluna pode não existir; ignora */ }
  }
  return NextResponse.json({ casamentos })
}

const OPTIONAL_COLS = ['servicos_dia', 'referencia', 'local_cerimonia', 'hora_inicio', 'url_selecao', 'url_provas', 'url_editadas', 'url_album'] as const

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

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await db().from('freelancer_casamentos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
