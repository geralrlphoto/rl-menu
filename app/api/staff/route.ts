import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'
import { TODAS_CHAVES } from '@/lib/staff'

// Gestão › Staff. GET lista; POST cria; PATCH { id, ...campos }; DELETE ?id=.
// Cada email aos noivos tem no máximo um responsável: ao dar um email a alguém,
// sai de quem o tinha.

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const limpar = (v: unknown) => Array.isArray(v) ? [...new Set(v.map(String).filter(c => TODAS_CHAVES.includes(c)))] : []

async function tirarDosOutros(id: string, emails: string[]) {
  if (!emails.length) return
  const sb = db()
  const { data } = await sb.from('staff').select('id, emails').neq('id', id).overlaps('emails', emails)
  for (const s of data ?? []) {
    await sb.from('staff').update({ emails: (s.emails ?? []).filter((e: string) => !emails.includes(e)) }).eq('id', s.id)
  }
}

export async function GET(req: NextRequest) {
  const b = exigeAdmin(req); if (b) return b
  const { data, error } = await db().from('staff').select('*').order('ordem').order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staff: data ?? [] })
}

export async function POST(req: NextRequest) {
  const b = exigeAdmin(req); if (b) return b
  const body = await req.json().catch(() => ({}))
  const nome = String(body.nome ?? '').trim()
  if (!nome) return NextResponse.json({ error: 'Falta o nome.' }, { status: 400 })
  const emails = limpar(body.emails)
  const { data, error } = await db().from('staff').insert({ nome, funcao: String(body.funcao ?? '').trim(), foto_url: body.foto_url || null, emails, ordem: Number(body.ordem) || 0 }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await tirarDosOutros(data.id, emails)
  return NextResponse.json({ pessoa: data })
}

export async function PATCH(req: NextRequest) {
  const b = exigeAdmin(req); if (b) return b
  const { id, ...body } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'id em falta' }, { status: 400 })
  const upd: Record<string, any> = {}
  if (body.nome !== undefined) upd.nome = String(body.nome).trim()
  if (body.funcao !== undefined) upd.funcao = String(body.funcao).trim()
  if (body.foto_url !== undefined) upd.foto_url = body.foto_url || null
  if (body.ordem !== undefined) upd.ordem = Number(body.ordem) || 0
  if (body.ativo !== undefined) upd.ativo = !!body.ativo
  if (body.emails !== undefined) upd.emails = limpar(body.emails)
  const { data, error } = await db().from('staff').update(upd).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (upd.emails) await tirarDosOutros(id, upd.emails)
  return NextResponse.json({ pessoa: data })
}

export async function DELETE(req: NextRequest) {
  const b = exigeAdmin(req); if (b) return b
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id em falta' }, { status: 400 })
  const { error } = await db().from('staff').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
