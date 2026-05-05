import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_KEY  = process.env.GOOGLE_SEARCH_API_KEY!
const GOOGLE_CX   = process.env.GOOGLE_SEARCH_ENGINE_ID!
const HUNTER_KEY  = process.env.HUNTER_API_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!

// ─── Google Custom Search ─────────────────────────────────────────────────────

async function googleSearch(query: string, num = 10): Promise<{ items: any[]; error?: string }> {
  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', GOOGLE_KEY)
  url.searchParams.set('cx', GOOGLE_CX)
  url.searchParams.set('q', query)
  url.searchParams.set('num', String(num))
  url.searchParams.set('gl', 'pt')
  url.searchParams.set('hl', 'pt')

  const res = await fetch(url.toString())
  const data = await res.json()
  if (!res.ok) return { items: [], error: data?.error?.message ?? `HTTP ${res.status}` }
  return { items: data.items ?? [] }
}

// ─── Hunter.io domain search ──────────────────────────────────────────────────

async function hunterSearch(domain: string): Promise<any[]> {
  if (!domain) return []
  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_KEY}&limit=5`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    const emails = data.data?.emails ?? []
    // Priorizar CEO, Marketing, Director, Founder
    const priority = ['ceo', 'marketing', 'director', 'founder', 'owner', 'manager', 'head']
    return emails
      .filter((e: any) => {
        const pos = (e.position ?? '').toLowerCase()
        const dep = (e.department ?? '').toLowerCase()
        return priority.some(p => pos.includes(p) || dep.includes(p))
      })
      .slice(0, 3)
  } catch {
    return []
  }
}

// ─── Claude análise ───────────────────────────────────────────────────────────

async function claudeAnalise(empresa: string, sector: string, descricao: string, distrito: string): Promise<string> {
  if (!ANTHROPIC_KEY) return ''
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `És um especialista em marketing e produção audiovisual em Portugal.

Analisa esta empresa como potencial cliente para a RL Media (fotografia e vídeo corporativo):

Empresa: ${empresa}
Sector: ${sector}
Distrito: ${distrito}
Descrição: ${descricao}

Responde em português europeu com um relatório estruturado em 4 partes curtas:

**PERFIL:** Uma frase sobre o que a empresa faz.

**DORES:** 2-3 principais problemas que têm sem conteúdo visual de qualidade (sem lista, em texto corrido).

**NECESSIDADE:** Que tipo de fotografia/vídeo precisam especificamente e porquê.

**ABORDAGEM:** Como a RL Media deve contactar esta empresa — ângulo de venda recomendado em 1-2 frases.

Sê direto e prático. Máximo 200 palavras total.`,
        }],
      }),
    })
    const data = await res.json()
    return data.content?.[0]?.text ?? ''
  } catch {
    return ''
  }
}

// ─── extrair domínio ──────────────────────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// ─── estimar faturação ────────────────────────────────────────────────────────

function estimarFaturacao(sector: string): string {
  const ranges: Record<string, string> = {
    'imobiliário':     '€500k – €5M/ano',
    'restauração':     '€200k – €2M/ano',
    'hotelaria':       '€500k – €10M/ano',
    'construção':      '€1M – €20M/ano',
    'moda':            '€300k – €5M/ano',
    'saúde':           '€300k – €3M/ano',
    'tecnologia':      '€500k – €10M/ano',
    'retalho':         '€500k – €5M/ano',
    'indústria':       '€2M – €50M/ano',
    'eventos':         '€200k – €2M/ano',
    'serviços':        '€200k – €3M/ano',
    'alimentar':       '€500k – €10M/ano',
  }
  return ranges[sector.toLowerCase()] ?? '€200k – €5M/ano'
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { sector, distritos, tipoQuery } = await req.json()

    if (!sector) return NextResponse.json({ error: 'Sector obrigatório' }, { status: 400 })

    const distritosAlvo = distritos?.length ? distritos : ['Lisboa', 'Setúbal', 'Évora']

    // Construir queries para cada distrito
    const queries: { query: string; distrito: string }[] = []
    for (const distrito of distritosAlvo) {
      queries.push({
        query: `${tipoQuery ?? sector} empresa ${distrito} Portugal`,
        distrito,
      })
      queries.push({
        query: `${sector} ${distrito} lda contacto site:*.pt`,
        distrito,
      })
    }

    const allResults: any[] = []
    const searchErrors: string[] = []

    // Executar pesquisas (máx 3 queries para poupar quota)
    for (const { query, distrito } of queries.slice(0, 3)) {
      const { items, error } = await googleSearch(query, 5)
      if (error) searchErrors.push(`[${distrito}] ${error}`)
      for (const item of items) {
        // Evitar duplicados
        const domain = extractDomain(item.link)
        if (allResults.find(r => r.domain === domain)) continue
        if (!domain || domain.includes('google') || domain.includes('facebook') ||
            domain.includes('linkedin') || domain.includes('youtube') ||
            domain.includes('wikipedia') || domain.includes('infopedia')) continue

        allResults.push({
          empresa: item.title?.replace(/ [-|–].*/,'').trim() ?? '',
          website: item.link,
          domain,
          descricao: item.snippet ?? '',
          distrito,
        })
      }
    }

    // Se não encontrou nada, devolver erro detalhado
    if (allResults.length === 0) {
      return NextResponse.json({
        prospects: [],
        total: 0,
        debug: {
          searchErrors,
          keys: {
            google: GOOGLE_KEY ? `...${GOOGLE_KEY.slice(-6)}` : 'MISSING',
            cx: GOOGLE_CX ? `...${GOOGLE_CX.slice(-6)}` : 'MISSING',
            hunter: HUNTER_KEY ? 'OK' : 'MISSING',
          }
        }
      })
    }

    // Para cada empresa, buscar contactos + análise IA (máx 6)
    const prospects = await Promise.all(
      allResults.slice(0, 6).map(async (r) => {
        const [contacts, analise] = await Promise.all([
          hunterSearch(r.domain),
          claudeAnalise(r.empresa, sector, r.descricao, r.distrito),
        ])

        const contactoPrincipal = contacts[0] ?? null

        return {
          empresa:          r.empresa,
          website:          r.website,
          domain:           r.domain,
          descricao:        r.descricao,
          distrito:         r.distrito,
          sector,
          faturacaoEstimada: estimarFaturacao(sector),
          contacto: contactoPrincipal ? {
            nome:     `${contactoPrincipal.first_name ?? ''} ${contactoPrincipal.last_name ?? ''}`.trim(),
            email:    contactoPrincipal.value ?? '',
            cargo:    contactoPrincipal.position ?? contactoPrincipal.department ?? '',
            linkedin: contactoPrincipal.linkedin ?? '',
          } : null,
          todosContatos: contacts.map((c: any) => ({
            nome:  `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
            email: c.value ?? '',
            cargo: c.position ?? c.department ?? '',
          })),
          analise,
        }
      })
    )

    return NextResponse.json({ prospects, total: prospects.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
