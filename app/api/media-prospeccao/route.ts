import { NextRequest, NextResponse } from 'next/server'

const SERPER_KEY  = process.env.SERPER_API_KEY!
const APOLLO_KEY  = process.env.APOLLO_API_KEY!
const HUNTER_KEY  = process.env.HUNTER_API_KEY!   // fallback
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!

// ─── Serper.dev (Google Search) ───────────────────────────────────────────────

async function serperSearch(query: string, num = 10): Promise<{ items: any[]; error?: string }> {
  if (!SERPER_KEY) return { items: [], error: 'SERPER_API_KEY não configurada' }
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num, gl: 'pt', hl: 'pt' }),
    })
    const data = await res.json()
    if (!res.ok) return { items: [], error: data?.message ?? `HTTP ${res.status}` }

    const results = data.organic ?? []
    return {
      items: results.map((r: any) => ({
        title:   r.title,
        link:    r.link,
        snippet: r.snippet,
      }))
    }
  } catch (e: any) {
    return { items: [], error: e.message }
  }
}

// ─── Apollo.io people search ──────────────────────────────────────────────────

async function apolloSearch(domain: string): Promise<any[]> {
  if (!domain || !APOLLO_KEY) return hunterSearch(domain)
  try {
    const res = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_KEY,
      },
      body: JSON.stringify({
        q_organization_domains_list: [domain],
        person_titles: [
          'CEO', 'Chief Executive Officer',
          'CMO', 'Chief Marketing Officer',
          'Marketing Director', 'Director of Marketing',
          'Marketing Manager', 'Head of Marketing',
          'Founder', 'Co-Founder', 'Owner',
          'Director Geral', 'Diretor de Marketing',
        ],
        page: 1,
        per_page: 5,
      }),
    })
    if (!res.ok) return hunterSearch(domain)
    const data = await res.json()
    const people = data.people ?? []

    return people
      .filter((p: any) => p.email)
      .slice(0, 3)
      .map((p: any) => ({
        first_name: p.first_name ?? '',
        last_name:  p.last_name ?? '',
        value:      p.email ?? '',
        position:   p.title ?? '',
        department: p.departments?.[0] ?? '',
        linkedin:   p.linkedin_url ?? '',
      }))
  } catch {
    return hunterSearch(domain)
  }
}

// ─── Hunter.io domain search (fallback) ──────────────────────────────────────

async function hunterSearch(domain: string): Promise<any[]> {
  if (!domain || !HUNTER_KEY) return []
  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_KEY}&limit=5`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    const emails = data.data?.emails ?? []
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

// ─── enriquecer prospeto: Instagram + interesse em vídeo ─────────────────────

async function enrichProspect(empresa: string): Promise<{ instagramUrl: string | null; interesseVideo: boolean }> {
  try {
    const query = `"${empresa}" (site:instagram.com OR "vídeo corporativo" OR "fotografia profissional" OR "produção vídeo" OR "conteúdo visual")`
    const { items } = await serperSearch(query, 6)

    let instagramUrl: string | null = null
    let interesseVideo = false

    for (const item of items) {
      // Detectar Instagram
      if (!instagramUrl && item.link?.includes('instagram.com')) {
        instagramUrl = item.link
      }
      // Detectar interesse em vídeo/foto
      const text = ((item.title ?? '') + ' ' + (item.snippet ?? '')).toLowerCase()
      if (/v[íi]deo|fotografia|audiovisual|produ[çc][ãa]o visual|marketing visual|filmagem|fotogr[áa]f/.test(text)) {
        interesseVideo = true
      }
    }

    return { instagramUrl, interesseVideo }
  } catch {
    return { instagramUrl: null, interesseVideo: false }
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

    // Domínios a excluir — diretórios, portais de emprego, agregadores
    const BLACKLIST = [
      'google', 'facebook', 'linkedin', 'youtube', 'wikipedia', 'infopedia',
      'bing.com', 'olx.', 'infoempresas', 'europages', 'listagem.pt',
      'michaelpage', 'racius', 'einforma', 'guiamais', 'paginas-amarelas',
      'sapo.pt', 'dn.pt', 'publico.pt', 'jn.pt', 'rtp.pt', 'sic.pt',
      'record.pt', 'expresso.pt', 'observador.pt', 'idealista', 'imovirtual',
      'net-empregos', 'itjobs', 'glassdoor', 'indeed', 'trovit',
      'tripadvisor', 'booking.com', 'airbnb', 'zomato', 'yelp',
      'pordata', 'ine.pt', 'dgae', 'iapmei', 'gov.pt',
    ]

    // Construir queries específicas por distrito — focadas em empresas individuais
    const queries: { query: string; distrito: string }[] = []
    for (const distrito of distritosAlvo) {
      queries.push({
        query: `${tipoQuery ?? sector} lda ${distrito} -site:infoempresas.com.pt -site:europages.pt -site:racius.com`,
        distrito,
      })
      queries.push({
        query: `empresa ${tipoQuery ?? sector} ${distrito} site:.pt -intitle:"empresas" -intitle:"listagem"`,
        distrito,
      })
    }

    const allResults: any[] = []
    const searchErrors: string[] = []

    // Executar pesquisas (máx 3 queries para poupar quota)
    for (const { query, distrito } of queries.slice(0, 3)) {
      const { items, error } = await serperSearch(query, 6)
      if (error) searchErrors.push(`[${distrito}] ${error}`)
      for (const item of items) {
        const domain = extractDomain(item.link)
        if (allResults.find(r => r.domain === domain)) continue
        if (!domain) continue
        if (BLACKLIST.some(b => domain.includes(b))) continue

        // Filtrar títulos que parecem diretórios ou listas
        const title = item.title ?? ''
        if (/\d+ empresa|zona industrial|maiores empresas|indústrias em |empresas em |listagem/i.test(title)) continue

        allResults.push({
          empresa: title.replace(/ [-|–|·].*/,'').trim(),
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
            serper: SERPER_KEY ? `...${SERPER_KEY.slice(-6)}` : 'MISSING',
            hunter: HUNTER_KEY ? 'OK' : 'MISSING',
            anthropic: ANTHROPIC_KEY ? 'OK' : 'MISSING',
          }
        }
      })
    }

    // Para cada empresa, buscar contactos + análise IA + enriquecimento (máx 6)
    const prospects = await Promise.all(
      allResults.slice(0, 6).map(async (r) => {
        const [contacts, analise, enrichment] = await Promise.all([
          apolloSearch(r.domain),
          claudeAnalise(r.empresa, sector, r.descricao, r.distrito),
          enrichProspect(r.empresa),
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
          instagramUrl:   enrichment.instagramUrl,
          interesseVideo: enrichment.interesseVideo,
        }
      })
    )

    return NextResponse.json({ prospects, total: prospects.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
