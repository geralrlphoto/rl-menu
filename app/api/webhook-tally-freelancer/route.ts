import { NextRequest, NextResponse } from 'next/server'
import { emailCandidatura } from '@/lib/emailsFreelancers'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function getField(fields: any[], label: string): string | null {
  const f = fields.find((f: any) =>
    f.label?.trim().toUpperCase() === label.trim().toUpperCase()
  )
  if (!f) return null
  const v = f.value
  if (v === null || v === undefined) return null
  if (typeof v === 'string') return v.trim() || null
  if (typeof v === 'number') return String(v)
  if (Array.isArray(v)) return v[0]?.trim() || null
  return null
}



export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.eventType !== 'FORM_RESPONSE') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const fields: any[] = body.data?.fields ?? []

    const nome          = getField(fields, 'NOME')

    // Tentar encontrar email por label ou por tipo ou por valor com @
    const emailByLabel  = getField(fields, 'EMAIL') ?? getField(fields, 'E-MAIL') ?? getField(fields, 'EMAIL ADDRESS')
    const emailByType   = fields.find((f: any) => f.type === 'INPUT_EMAIL')?.value ?? null
    const emailByValue  = fields.find((f: any) => typeof f.value === 'string' && f.value.includes('@') && f.value.includes('.'))?.value ?? null
    const emailFromResp = body.data?.respondent?.email ?? null
    const email         = emailByLabel ?? emailByType ?? emailByValue ?? emailFromResp ?? null

    console.log('[webhook-tally-freelancer] email found:', email)
    console.log('[webhook-tally-freelancer] all fields:', JSON.stringify(fields.map((f:any) => ({ label: f.label, type: f.type, value: f.value }))))
    const telefone      = getField(fields, 'CONTATO')
    const funcao        = getField(fields, 'FUNÇÃO')
    const valor_servico = getField(fields, 'VALOR PELO SERVIÇO')
    const drone         = getField(fields, 'DRONE')
    const valor_drone   = getField(fields, 'VALOR COM DRONE (SÓ DRONE)')
    const faz_edicao    = getField(fields, 'FAZES EDIÇÃO ATÉ 20MIN')
    const valor_edicao  = getField(fields, 'VALOR POR EDIÇÃO')
    const zona          = getField(fields, 'ZONA RESIDÊNCIA')
    const link_trailer  = getField(fields, 'LINK DE VIDEO DE CASAMENTO TRAILER')
    const link_video    = getField(fields, 'LINK DE VIDEO DE CASAMENTO COMPLETO')
    const mensagem      = getField(fields, 'SE TIVERES ALGO ACRESCENTAR COLOCA AQUI')

    if (!nome) {
      return NextResponse.json({ error: 'Nome em falta' }, { status: 400 })
    }

    // ── Supabase ──────────────────────────────────────────────────────────
    const supabasePromise = db()
      .from('freelancers_novos')
      .insert({
        tally_response_id: body.data?.responseId ?? null,
        nome, email, funcao, zona, telefone, valor_servico,
        valor_drone, valor_edicao, drone, faz_edicao,
        link_trailer, link_video, mensagem,
        tipo_eventos: [], avaliacao: [], servicos_feitos: null,
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.error('[webhook-tally-freelancer] Supabase error:', error)
      })

    // ── Notion: NÃO escrever aqui ────────────────────────────────────────
    // A integração do próprio Tally já cria a linha na base "Novos Freelancers".
    // Escrever também aqui duplicava cada candidatura (e gravava os dropdowns
    // com o id da opção em vez do texto).

    // ── Email confirmação ao freelancer ───────────────────────────────────
    const emailPromise = email
      ? fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'RL Photo.Video <geral@rlphotovideo.pt>',
            to: [email],
            subject: 'Recebemos a tua candidatura · RL Photo.Video',
            html: emailCandidatura(undefined, nome),
          }),
        }).then(async r => {
          if (!r.ok) {
            const e = await r.json()
            console.error('[webhook-tally-freelancer] Resend error:', e)
          }
        })
      : Promise.resolve()

    await Promise.allSettled([supabasePromise, emailPromise])

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[webhook-tally-freelancer]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
