import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { limparRespostas, prioridadeBase, ajustarPrioridade, rotuloFase, rotuloDecisao, type Tipo } from '@/lib/qualificacao'

// Portais da reunião (/r casamento, /b batizado): bloco "Preparem a reunião".
// GET  ?token=  → respostas já dadas
// POST { token, tipo, respostas } → guarda em crm_contacts.qualificacao, ajusta
//      lead_prioridade e avisa o admin por email. Em modo admin não grava.

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''
  if (!token) return NextResponse.json({ error: 'token em falta' }, { status: 400 })
  const { data } = await db().from('crm_contacts').select('qualificacao, qualificacao_em').eq('page_token', token).maybeSingle()
  if (!data) return NextResponse.json({ error: 'não encontrado' }, { status: 404 })
  const { prioridade_base, ...respostas } = (data.qualificacao ?? {}) as Record<string, unknown>
  return NextResponse.json({ ok: true, respostas: data.qualificacao ? respostas : null, enviadoEm: data.qualificacao_em })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const token = String(b.token ?? '')
  const tipo: Tipo = b.tipo === 'batizado' ? 'batizado' : 'casamento'
  if (!token) return NextResponse.json({ error: 'token em falta' }, { status: 400 })
  const auth = (await cookies()).get('rl_auth')?.value
  if (auth && auth === process.env.AUTH_SECRET) return NextResponse.json({ error: 'Em modo admin não se grava.' }, { status: 403 })

  const r = limparRespostas(b.respostas, tipo)
  if (!r.fase || !r.decisao) return NextResponse.json({ error: 'Respondam às duas primeiras perguntas, por favor.' }, { status: 400 })

  const sb = db()
  const { data: c } = await sb.from('crm_contacts')
    .select('id, nome, lead_prioridade, orcamento, data_casamento, qualificacao')
    .eq('page_token', token).maybeSingle()
  if (!c) return NextResponse.json({ error: 'Portal não encontrado.' }, { status: 404 })

  // A base fica guardada na 1.ª resposta: se mudarem as respostas, recalcula-se a partir dela
  const base = (c.qualificacao as any)?.prioridade_base ?? prioridadeBase(c.lead_prioridade, c.orcamento, c.data_casamento)
  const { nivel } = ajustarPrioridade(base, r)
  const primeira = !c.qualificacao
  const { error } = await sb.from('crm_contacts').update({
    qualificacao: { ...r, prioridade_base: base },
    qualificacao_em: new Date().toISOString(),
    lead_prioridade: nivel,
  }).eq('id', c.id)
  if (error) return NextResponse.json({ error: 'Não foi possível guardar. Tentem outra vez.' }, { status: 500 })

  // Email ao admin (não bloqueia a resposta se falhar)
  const linha = (k: string, v?: string) => v ? `<tr><td style="padding:7px 0;color:#8a7a5a;font-size:11px;letter-spacing:2px;text-transform:uppercase;width:130px;vertical-align:top">${k}</td><td style="padding:7px 0;color:#eee;font-size:15px">${esc(v)}</td></tr>` : ''
  const html = `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 12px"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111;border:1px solid rgba(201,168,76,.35);border-radius:14px">
<tr><td style="padding:28px 32px 8px;color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase">Preparem a reunião · ${primeira ? 'respostas' : 'respostas alteradas'}</td></tr>
<tr><td style="padding:4px 32px 0;color:#fff;font-size:28px;font-family:Georgia,serif">${esc(c.nome ?? '')}</td></tr>
<tr><td style="padding:16px 32px 8px"><table width="100%" cellpadding="0" cellspacing="0">
${linha('Em que ponto', rotuloFase(tipo, r.fase))}${linha('Decisão', rotuloDecisao(r.decisao))}${linha('Momentos', r.momentos?.join(', '))}${linha('Valorizam', r.valorizam?.join(', '))}${linha('Sobre eles', r.historia)}
${linha('Lead', base === nivel ? nivel : `${base} → ${nivel}`)}
</table></td></tr>
<tr><td style="padding:12px 32px 30px"><a href="${SITE_BASE}/crm/${c.id}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 20px;border-radius:8px">Abrir ficha CRM</a></td></tr>
</table></td></tr></table></body></html>`
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'RL Photo.Video <geral@rlphotovideo.pt>', to: [ADMIN_EMAIL], subject: `Preparem a reunião: ${c.nome} (lead ${nivel})`, html }),
    })
  } catch { /* fica guardado na mesma */ }

  return NextResponse.json({ ok: true, respostas: r })
}

function esc(s: string) {
  return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]!))
}
