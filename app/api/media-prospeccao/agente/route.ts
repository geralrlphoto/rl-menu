import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'

// Agente de prospeção da RL PROD: procura empresas em Portugal que estejam
// à procura de um PRESTADOR externo de fotografia/vídeo, mede o nível de procura
// e escreve o script de abordagem. Dois passos:
//   1. pesquisa na web (web_search) → notas com sinais e links
//   2. as notas passam para JSON validado (Zod), sem ferramentas

export const maxDuration = 300 // a pesquisa pode levar alguns minutos

const client = new Anthropic()
const MODELO = 'claude-opus-5-5'
// Se o pedido for recusado pelos filtros de segurança, a API tenta outro modelo sozinha
const FALLBACK = { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }

const SISTEMA = `És o especialista de prospeção comercial da RL PROD, produtora de fotografia e vídeo para marcas, sediada em Setúbal (Portugal).

O teu trabalho: encontrar empresas e entidades em Portugal que ESTÃO, neste momento, à procura de alguém externo que lhes faça fotografia ou vídeo, e dizer à equipa como avançar com cada uma.

Conta como sinal de procura (do mais forte para o mais fraco):
- Pedido explícito de orçamento ou de prestador: "procuramos produtora de vídeo / fotógrafo / empresa para filmar", publicações a pedir recomendações, pedidos em plataformas de serviços (Zaask, Fixando, OLX Serviços, grupos de Facebook ou LinkedIn).
- Concursos e consultas públicas para aquisição de serviços de produção audiovisual, vídeo promocional, fotografia ou reportagem (base.gov.pt, Diário da República, plataformas de contratação pública) com prazo ainda aberto ou muito recente.
- Necessidade clara a curto prazo: inauguração, lançamento de produto ou marca, evento, feira, rebranding ou expansão anunciados para as próximas semanas, sem produtora associada.

NÃO conta: anúncios de emprego para contratar um videógrafo, fotógrafo, content creator ou social media como funcionário. A RL PROD presta o serviço; não procura quem vá trabalhar para dentro da empresa.

Regras:
- Concursos e consultas públicas: procura no país inteiro, qualquer que seja a zona pedida (a RL PROD trabalha em todo o país); confirma a entidade, o preço base e o prazo, e só incluis os que ainda aceitam propostas. Para os outros sinais, fica na zona pedida.
- Os pedidos dentro do Zaask, Fixando e grupos fechados não aparecem na pesquisa; não os inventes. Na zona pedida, procura sobretudo notícias locais de aberturas, lançamentos e eventos com data.
- Usa a pesquisa na web; faz várias pesquisas em português de Portugal, com termos diferentes (por exemplo: "aquisição de serviços" + "produção audiovisual" / "vídeo promocional" / "reportagem fotográfica" / "fotografia"; nomes das câmaras e entidades da zona; "inauguração", "abre portas", "lançamento" + concelho).
- Só incluis uma empresa se tiveres pelo menos um sinal com link verificável. Nunca inventes empresas, links, nomes de pessoas, emails ou telefones.
- Prefere sinais dos últimos 90 dias e diz a data quando a souberes.
- Mede o nível de procura: alto (pedido explícito ou concurso aberto), médio (necessidade clara e próxima), baixo (indício indireto).
- Para cada empresa, pensa no serviço da RL PROD que faz sentido propor, em quem decide e no melhor canal.
- Escreve tudo em português de Portugal, com tom profissional e próximo, sem exageros.`

const Sinal = z.object({
  descricao: z.string().describe('O que foi encontrado, numa frase'),
  url: z.string().describe('Link onde se pode confirmar'),
  data: z.string().nullable().describe('Data do sinal, se conhecida (ex.: 2026-10-12)'),
})

const Empresa = z.object({
  nome: z.string(),
  setor: z.string(),
  localizacao: z.string(),
  website: z.string().nullable(),
  instagram: z.string().nullable(),
  nivel_procura: z.enum(['alto', 'medio', 'baixo']),
  score: z.number().int().describe('0 a 100: quão quente está a oportunidade'),
  porque_agora: z.string().describe('Porque é o momento certo para contactar'),
  sinais: z.array(Sinal),
  servico_a_propor: z.string(),
  decisor: z.object({
    cargo: z.string(),
    nome: z.string().nullable(),
    contacto: z.string().nullable().describe('Email ou telefone público, só se aparecer nas fontes'),
  }),
  proximo_passo: z.string(),
  script: z.object({
    email: z.object({ assunto: z.string(), corpo: z.string() }),
    whatsapp: z.string(),
    linkedin: z.string(),
    chamada: z.object({
      abertura: z.string(),
      perguntas: z.array(z.string()),
      objecoes: z.array(z.object({ objecao: z.string(), resposta: z.string() })),
      fecho: z.string(),
    }),
  }),
})

const Resultado = z.object({
  resumo: z.string().describe('2-3 frases sobre o estado da procura nesta zona/setor'),
  empresas: z.array(Empresa),
})

export type ResultadoAgente = z.infer<typeof Resultado>

export async function POST(req: NextRequest) {
  try {
    const { zona, setor, foco } = await req.json() as { zona?: string; setor?: string; foco?: string }
    const pedido = [
      `Zona: ${zona?.trim() || 'Distrito de Setúbal e Lisboa'}.`,
      setor?.trim() ? `Setor: ${setor.trim()}.` : 'Setor: qualquer.',
      foco?.trim() ? `Indicações da equipa: ${foco.trim()}` : '',
      'Encontra até 6 empresas com procura real. Para cada uma reúne os sinais (com link e data), o nível de procura, porque é agora, o serviço a propor, quem decide e o melhor canal.',
    ].filter(Boolean).join('\n')

    // ── 1. Pesquisa ────────────────────────────────────────────────────────────
    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: pedido }]
    let pesquisa: Anthropic.Beta.BetaMessage | null = null
    for (let i = 0; i < 4; i++) {
      pesquisa = await client.beta.messages.create({
        model: MODELO,
        max_tokens: 16000,
        system: SISTEMA,
        output_config: { effort: 'high' },
        tools: [{
          type: 'web_search_20260209', name: 'web_search', max_uses: 15,
          user_location: { type: 'approximate', country: 'PT', city: 'Setúbal', timezone: 'Europe/Lisbon' },
        }],
        messages,
        ...FALLBACK,
      })
      // A pesquisa no servidor parou a meio: devolve o turno e continua
      if (pesquisa.stop_reason !== 'pause_turn') break
      messages.push({ role: 'assistant', content: pesquisa.content })
    }
    if (!pesquisa) throw new Error('Sem resposta do agente.')
    if (pesquisa.stop_reason === 'refusal') {
      return NextResponse.json({ error: 'O agente recusou este pedido. Tenta reformular a zona ou o setor.' }, { status: 422 })
    }

    // Notas da pesquisa + links realmente devolvidos pela web
    const notas = pesquisa.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map(b => b.text).join('\n')
    const fontes = pesquisa.content.flatMap(b =>
      b.type === 'web_search_tool_result' && Array.isArray(b.content)
        ? b.content.map(r => `- ${r.title} — ${r.url}${r.page_age ? ` (${r.page_age})` : ''}`)
        : [])

    // ── 2. Estruturar + scripts ────────────────────────────────────────────────
    const estruturado = await client.beta.messages.parse({
      model: MODELO,
      max_tokens: 16000,
      system: SISTEMA,
      output_config: { effort: 'medium', format: zodOutputFormat(Resultado) },
      messages: [{
        role: 'user',
        content: `${pedido}

Notas da tua pesquisa:
${notas}

Links encontrados na pesquisa (usa só estes nos sinais):
${fontes.join('\n') || '(nenhum)'}

Passa isto para o formato pedido. Ordena as empresas da procura mais forte para a mais fraca. Deixa de fora as que não tenham sinal com link desta lista. Escreve para cada uma o script de abordagem: email (assunto e corpo, curto e personalizado com o sinal encontrado), mensagem de WhatsApp, mensagem de LinkedIn e guião de chamada (abertura, 3-4 perguntas de descoberta, objeções prováveis com resposta, fecho com proposta de reunião). Assina como "Rui · RL PROD".`,
      }],
      ...FALLBACK,
    })

    if (estruturado.stop_reason === 'refusal' || !estruturado.parsed_output) {
      return NextResponse.json({ error: 'Não consegui organizar os resultados. Tenta outra vez.' }, { status: 502 })
    }

    return NextResponse.json({ ...estruturado.parsed_output, geradoEm: new Date().toISOString() })
  } catch (err: unknown) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Demasiados pedidos ao Claude. Espera um minuto e tenta outra vez.' }, { status: 429 })
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'A chave ANTHROPIC_API_KEY do Vercel não é válida.' }, { status: 500 })
    }
    if (err instanceof Anthropic.APIError && /credit balance/i.test(err.message)) {
      return NextResponse.json({ error: 'A conta da API do Claude está sem crédito. Carrega crédito em console.anthropic.com → Plans & Billing e tenta outra vez.' }, { status: 402 })
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Erro do Claude (${err.status}): ${err.message}` }, { status: 502 })
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro no agente.' }, { status: 500 })
  }
}
