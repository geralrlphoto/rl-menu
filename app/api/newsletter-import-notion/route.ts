import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Bases de eventos por ano — o Notion tem uma DB separada por ano
const EVENTOS_DBS: { year: number; id: string }[] = [
  { year: 2025, id: '198220116d8a8020ae0ef315dea8e1af' },
  { year: 2026, id: '1ad220116d8a804b839ddc36f1e7ecf1' },
  { year: 2027, id: '2a6220116d8a80b4b439fe091b2ac804' },
]

export async function POST() {
  try {
    const NOTION_TOKEN = process.env.NOTION_TOKEN
    if (!NOTION_TOKEN) {
      return NextResponse.json({ error: 'NOTION_TOKEN não configurado' }, { status: 500 })
    }

    const notionH = {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    }

    // Paginar todas as bases de eventos (2025, 2026, 2027)
    const emails = new Map<string, { nome?: string; data_casamento?: string; year?: number }>()
    let pagesScanned = 0
    const perYear: Record<number, number> = {}

    for (const { year, id: dbId } of EVENTOS_DBS) {
      let cursor: string | undefined
      let yearPages = 0
      do {
        const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
          method: 'POST',
          headers: notionH,
          cache: 'no-store',
          body: JSON.stringify({
            page_size: 100,
            ...(cursor ? { start_cursor: cursor } : {}),
          }),
        })

        if (!res.ok) {
          const text = await res.text()
          console.error(`[import-notion] DB ${year} failed:`, text)
          // Continuar para outros anos mesmo se um falhar
          break
        }

        const data = await res.json()
        pagesScanned += data.results.length
        yearPages += data.results.length

        for (const page of data.results) {
          const props = page.properties || {}
          const nomeNoiva = getText(props['Nome da Noiva'])
          const nomeNoivo = getText(props['nome do noivo'])
          const emailNoiva = getEmail(props['E-mail da noiva'])
          const emailNoivo = getEmail(props['E-mail do noivo'])
          const dataEvento = getDate(props['DATA DO EVENTO'])

          if (emailNoiva && isValidEmail(emailNoiva)) {
            emails.set(emailNoiva.toLowerCase().trim(), {
              nome: nomeNoiva || undefined,
              data_casamento: dataEvento || undefined,
              year,
            })
          }
          if (emailNoivo && isValidEmail(emailNoivo)) {
            emails.set(emailNoivo.toLowerCase().trim(), {
              nome: nomeNoivo || undefined,
              data_casamento: dataEvento || undefined,
              year,
            })
          }
        }

        cursor = data.has_more ? data.next_cursor : undefined
      } while (cursor)
      perYear[year] = yearPages
    }

    if (emails.size === 0) {
      return NextResponse.json({
        ok: true, imported: 0, skipped: 0, total_found: 0, pages_scanned: pagesScanned,
        message: 'Nenhum email válido encontrado nos eventos do Notion.',
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
        data_casamento: info.data_casamento || null,
        source: 'import-notion',
        status: 'active',
        confirmed_at: new Date().toISOString(),
      }))

    if (toInsert.length > 0) {
      // Inserir em lotes (evitar timeout)
      const batchSize = 100
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize)
        const { error } = await supabase.from('newsletter_subscribers').insert(batch)
        if (error) throw error
      }
    }

    return NextResponse.json({
      ok: true,
      imported: toInsert.length,
      skipped: emails.size - toInsert.length,
      total_found: emails.size,
      pages_scanned: pagesScanned,
      per_year: perYear,
    })
  } catch (e: any) {
    console.error('[import-notion]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

function getText(prop: any): string | null {
  if (!prop) return null
  if (prop.title?.length) return prop.title.map((t: any) => t.plain_text).join('')
  if (prop.rich_text?.length) return prop.rich_text.map((t: any) => t.plain_text).join('')
  return null
}
function getEmail(prop: any): string | null {
  if (!prop) return null
  return prop.email || null
}
function getDate(prop: any): string | null {
  if (!prop) return null
  return prop.date?.start || null
}
function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}
