import { NextRequest, NextResponse } from 'next/server'

const SERPER_KEY    = process.env.SERPER_API_KEY!
const APOLLO_KEY    = process.env.APOLLO_API_KEY!
const HUNTER_KEY    = process.env.HUNTER_API_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!

// ─── Serper.dev (Google Search) ───────────────────────────────────────────────

async function serperSearch(query: string, num = 10): Promise<{ items: any[]; error?: string }> {
  if (!SERPER_KEY) return { items: [], error: 'SERPER_API_KEY não configurada' }
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num, gl: 'pt', hl: 'pt' }),
    })
    const data = await res.json()
    if (!res.ok) return { items: [], error: data?.message ?? `HTTP ${res.status}` }
    const results = data.organic ?? []
    return {
      items: results.map((r: any) => ({ title: r.title, link: r.link, snippet: r.snippet }))
    }
  } catch (e: any) {
    return { items: [], error: e.message }
  }
}

// ─── Apollo.io people search + tamanho da empresa ────────────────────────────

async function apolloSearch(domain: string): Promise<{ contacts: any[]; numFuncionarios: number | null }> {
  if (!domain || !APOLLO_KEY) return { contacts: await hunterSearch(domain), numFuncionarios: null }
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
    if (!res.ok) return { contacts: await hunterSearch(domain), numFuncionarios: null }
    const data = await res.json()
    const people = data.people ?? []

    // Tamanho da empresa a partir do primeiro resultado
    const numFuncionarios: number | null = people[0]?.organization?.estimated_num_employees ?? null

    const contacts = people
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

    return { contacts, numFuncionarios }
  } catch {
    return { contacts: await hunterSearch(domain), numFuncionarios: null }
  }
}

// ─── Hunter.io (fallback) ─────────────────────────────────────────────────────

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

// ─── Enriquecimento completo ──────────────────────────────────────────────────

type Enrichment = {
  instagramUrl:     string | null
  facebookUrl:      string | null
  tiktokUrl:        string | null
  interesseVideo:   boolean
  premios:          string[]
  eventosRecentes:  string[]
  isHiringMarketing: boolean
}

async function enrichProspect(empresa: string): Promise<Enrichment> {
  try {
    // Duas pesquisas em paralelo para poupar tempo
    const [res1, res2] = await Promise.all([
      // Social media + vídeo + prémios
      serperSearch(
        `"${empresa}" (site:instagram.com OR site:facebook.com OR site:tiktok.com OR "vídeo corporativo" OR "fotografia profissional" OR "prémio" OR "award" OR "galardão")`,
        8
      ),
      // Eventos recentes + contratação marketing
      serperSearch(
        `"${empresa}" ("abriu" OR "inaugurou" OR "lançou" OR "expandiu" OR "nova loja" OR "novo espaço" OR "investimento" OR "marketing manager" OR "content creator" OR "procuramos" OR "estamos a recrutar")`,
        6
      ),
    ])

    let instagramUrl:  string | null = null
    let facebookUrl:   string | null = null
    let tiktokUrl:     string | null = null
    let interesseVideo = false
    let isHiringMarketing = false
    const premios:         string[] = []
    const eventosRecentes: string[] = []

    // Processar pesquisa 1
    for (const item of res1.items) {
      const link = item.link ?? ''
      if (!instagramUrl && link.includes('instagram.com')) instagramUrl = link
      if (!facebookUrl  && link.includes('facebook.com'))  facebookUrl  = link
      if (!tiktokUrl    && link.includes('tiktok.com'))    tiktokUrl    = link

      const text    = ((item.title ?? '') + ' ' + (item.snippet ?? '')).toLowerCase()
      const rawText =  (item.title ?? '') + ' ' + (item.snippet ?? '')

      if (/v[íi]deo|fotografia|audiovisual|produ[çc][ãa]o visual|marketing visual|filmagem|fotogr[áa]f/.test(text)) {
        interesseVideo = true
      }

      if (/pr[ée]mio|premiada|premiado|award|melhor empresa|melhor marca|reconhecida|distinção|galardão|certificad/i.test(rawText)) {
        const match = rawText.match(/[^.]*(?:pr[ée]mio|award|galardão|distinção|melhor empresa|melhor marca|reconhecida)[^.]*/i)
        if (match && !premios.includes(match[0].trim())) {
          premios.push(match[0].trim().slice(0, 120))
        }
      }
    }

    // Processar pesquisa 2
    for (const item of res2.items) {
      const text    = ((item.title ?? '') + ' ' + (item.snippet ?? '')).toLowerCase()
      const rawText =  (item.title ?? '') + ' ' + (item.snippet ?? '')

      // Eventos recentes
      if (/abri[uo]|inaugurou|lan[çc]ou|expandiu|nova loja|novo espa[çc]o|investimento|crescimento|abertura/i.test(rawText)) {
        const match = rawText.match(/[^.]*(?:abri[uo]|inaugurou|lan[çc]ou|expandiu|nova loja|novo espa[çc]o|investimento|abertura)[^.]*/i)
        if (match && !eventosRecentes.includes(match[0].trim())) {
          eventosRecentes.push(match[0].trim().slice(0, 120))
        }
      }

      // Contratação para marketing
      if (/marketing manager|content creator|social media manager|gestora? de marketing|procuramos.*marketing|estamos a recrutar.*marketing/i.test(text)) {
        isHiringMarketing = true
      }
    }

    return {
      instagramUrl,
      facebookUrl,
      tiktokUrl,
      interesseVideo,
      premios:         premios.slice(0, 2),
      eventosRecentes: eventosRecentes.slice(0, 2),
      isHiringMarketing,
    }
  } catch {
    return {
      instagramUrl: null, facebookUrl: null, tiktokUrl: null,
      interesseVideo: false, premios: [], eventosRecentes: [], isHiringMarketing: false,
    }
  }
}

// ─── Score de prioridade ──────────────────────────────────────────────────────

function calcularScore(data: {
  contacto: any; interesseVideo: boolean; eventosRecentes: string[]
  isHiringMarketing: boolean; instagramUrl: string | null
  facebookUrl: string | null; tiktokUrl: string | null
  premios: string[]; numFuncionarios: number | null
}): number {
  let score = 0
  if (data.contacto)                    score += 20  // contacto direto encontrado
  if (data.interesseVideo)              score += 20  // já procurou vídeo/foto
  if (data.eventosRecentes?.length > 0) score += 15  // evento recente = timing perfeito
  if (data.isHiringMarketing)           score += 15  // a investir em marketing
  if (data.premios?.length > 0)         score += 10  // valoriza a sua imagem
  if (data.instagramUrl)                score += 5   // ativa nas redes
  if (data.facebookUrl)                 score += 3
  if (data.tiktokUrl)                   score += 3
  const nf = data.numFuncionarios
  if (nf && nf >= 10 && nf <= 500)     score += 9   // tamanho ideal de cliente
  return Math.min(score, 100)
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
    'imobiliário': '€500k – €5M/ano',   'restauração': '€200k – €2M/ano',
    'hotelaria':   '€500k – €10M/ano',  'construção':  '€1M – €20M/ano',
    'moda':        '€300k – €5M/ano',   'saúde':       '€300k – €3M/ano',
    'tecnologia':  '€500k – €10M/ano',  'retalho':     '€500k – €5M/ano',
    'indústria':   '€2M – €50M/ano',    'eventos':     '€200k – €2M/ano',
    'serviços':    '€200k – €3M/ano',   'alimentar':   '€500k – €10M/ano',
  }
  return ranges[sector.toLowerCase()] ?? '€200k – €5M/ano'
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { sector, distritos, tipoQuery } = await req.json()
    if (!sector) return NextResponse.json({ error: 'Sector obrigatório' }, { status: 400 })

    const distritosAlvo = distritos?.length ? distritos : ['Lisboa', 'Setúbal', 'Évora']

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

    for (const { query, distrito } of queries.slice(0, 3)) {
      const { items, error } = await serperSearch(query, 6)
      if (error) searchErrors.push(`[${distrito}] ${error}`)
      for (const item of items) {
        const domain = extractDomain(item.link)
        if (allResults.find(r => r.domain === domain)) continue
        if (!domain) continue
        if (BLACKLIST.some(b => domain.includes(b))) continue
        const title = item.title ?? ''
        if (/\d+ empresa|zona industrial|maiores empresas|indústrias em |empresas em |listagem/i.test(title)) continue
        allResults.push({
          empresa:  title.replace(/ [-|–|·].*/,'').trim(),
          website:  item.link,
          domain,
          descricao: item.snippet ?? '',
          distrito,
        })
      }
    }

    if (allResults.length === 0) {
      return NextResponse.json({
        prospects: [], total: 0,
        debug: { searchErrors, keys: { serper: SERPER_KEY ? `...${SERPER_KEY.slice(-6)}` : 'MISSING' } }
      })
    }

    // Para cada empresa — tudo em paralelo
    const prospects = await Promise.all(
      allResults.slice(0, 6).map(async (r) => {
        const [apolloResult, analise, enrichment] = await Promise.all([
          apolloSearch(r.domain),
          claudeAnalise(r.empresa, sector, r.descricao, r.distrito),
          enrichProspect(r.empresa),
        ])

        const { contacts, numFuncionarios } = apolloResult
        const contactoPrincipal = contacts[0] ?? null

        const contactoObj = contactoPrincipal ? {
          nome:     `${contactoPrincipal.first_name ?? ''} ${contactoPrincipal.last_name ?? ''}`.trim(),
          email:    contactoPrincipal.value ?? '',
          cargo:    contactoPrincipal.position ?? contactoPrincipal.department ?? '',
          linkedin: contactoPrincipal.linkedin ?? '',
        } : null

        const scoreData = {
          contacto:         contactoObj,
          interesseVideo:   enrichment.interesseVideo,
          eventosRecentes:  enrichment.eventosRecentes,
          isHiringMarketing: enrichment.isHiringMarketing,
          instagramUrl:     enrichment.instagramUrl,
          facebookUrl:      enrichment.facebookUrl,
          tiktokUrl:        enrichment.tiktokUrl,
          premios:          enrichment.premios,
          numFuncionarios,
        }

        return {
          empresa:           r.empresa,
          website:           r.website,
          domain:            r.domain,
          descricao:         r.descricao,
          distrito:          r.distrito,
          sector,
          faturacaoEstimada: estimarFaturacao(sector),
          numFuncionarios,
          contacto:          contactoObj,
          todosContatos: contacts.map((c: any) => ({
            nome:  `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
            email: c.value ?? '',
            cargo: c.position ?? c.department ?? '',
          })),
          analise,
          instagramUrl:      enrichment.instagramUrl,
          facebookUrl:       enrichment.facebookUrl,
          tiktokUrl:         enrichment.tiktokUrl,
          interesseVideo:    enrichment.interesseVideo,
          premios:           enrichment.premios,
          eventosRecentes:   enrichment.eventosRecentes,
          isHiringMarketing: enrichment.isHiringMarketing,
          score:             calcularScore(scoreData),
        }
      })
    )

    // Ordenar por score decrescente
    prospects.sort((a, b) => b.score - a.score)

    return NextResponse.json({ prospects, total: prospects.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
