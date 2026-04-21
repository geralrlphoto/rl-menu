import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Importa emails de noivos das tabelas do Supabase para subscritores
export async function POST() {
  try {
    const emails = new Map<string, { nome?: string; source: string }>()

    // 1. CRM contacts — excluindo quem explicitamente nao fechou ou cancelou
    try {
      const { data: crm } = await supabase
        .from('crm_contacts')
        .select('email, nome, status')
        .not('email', 'is', null)
        .not('status', 'in', '("NÃO FECHOU","Cancelado","Encerrado","Sem resposta")')
      for (const c of crm || []) {
        if (c.email && isValidEmail(c.email)) {
          emails.set(c.email.toLowerCase().trim(), { nome: c.nome, source: 'crm' })
        }
      }
    } catch {}

    // 2. Portal clientes (noivos com acesso a portal)
    try {
      const { data: portais } = await supabase
        .from('portal_clientes')
        .select('email_noiva, email_noivo, nome_noiva, nome_noivo')
      for (const p of portais || []) {
        if (p.email_noiva && isValidEmail(p.email_noiva)) {
          emails.set(p.email_noiva.toLowerCase().trim(), {
            nome: p.nome_noiva, source: 'portal'
          })
        }
        if (p.email_noivo && isValidEmail(p.email_noivo)) {
          emails.set(p.email_noivo.toLowerCase().trim(), {
            nome: p.nome_noivo, source: 'portal'
          })
        }
      }
    } catch {}

    // 3. Eventos
    try {
      const { data: eventos } = await supabase
        .from('eventos')
        .select('email_noiva, email_noivo, nome_noiva, nome_noivo')
      for (const ev of eventos || []) {
        if (ev.email_noiva && isValidEmail(ev.email_noiva)) {
          emails.set(ev.email_noiva.toLowerCase().trim(), {
            nome: ev.nome_noiva, source: 'evento'
          })
        }
        if (ev.email_noivo && isValidEmail(ev.email_noivo)) {
          emails.set(ev.email_noivo.toLowerCase().trim(), {
            nome: ev.nome_noivo, source: 'evento'
          })
        }
      }
    } catch {}

    if (emails.size === 0) {
      return NextResponse.json({
        ok: true, imported: 0, skipped: 0, total_found: 0,
        message: 'Não foram encontrados emails nas tabelas conhecidas.',
      })
    }

    // Verificar quais já existem
    const allEmails = Array.from(emails.keys())
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .in('email', allEmails)

    const existingSet = new Set((existing || []).map(e => e.email))
    const toInsert = Array.from(emails.entries())
      .filter(([email]) => !existingSet.has(email))
      .map(([email, info]) => ({
        email,
        nome: info.nome || null,
        source: `import-${info.source}`,
        status: 'active',
        confirmed_at: new Date().toISOString(),
      }))

    if (toInsert.length > 0) {
      const { error } = await supabase.from('newsletter_subscribers').insert(toInsert)
      if (error) throw error
    }

    return NextResponse.json({
      ok: true,
      imported: toInsert.length,
      skipped: emails.size - toInsert.length,
      total_found: emails.size,
    })
  } catch (e: any) {
    console.error('[import-noivos]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}
