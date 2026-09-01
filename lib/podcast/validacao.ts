import { AREAS_CANDIDATURA, type AreaCandidatura } from './tipos'

/* ============================================================
   Validação dos formulários do podcast.

   O briefing pedia Zod. O Zod não está no package.json e não podemos
   acrescentar dependências, por isso está aqui escrito à mão, com a
   mesma forma: uma função por formulário que devolve os dados limpos
   ou a lista de erros. É usada no servidor (obrigatório) e no cliente
   (para o utilizador não esperar por uma ida ao servidor).
   ============================================================ */

/* Um resultado simples em vez de uma união discriminada: o tsconfig do
   projeto não tem o modo estrito ligado e a união não estreitava, o que
   obrigava a conversões de tipo em cada uso. Assim é mais simples de ler. */
export type Resultado<T> = {
  ok: boolean
  dados?: T
  erros?: Record<string, string>
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const RE_TELEFONE = /^[+\d][\d\s().-]{5,20}$/

function texto(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

/** Corta o que vier grande de mais, para não guardar lixo na base de dados. */
function limitar(v: string, max: number): string {
  return v.length > max ? v.slice(0, max) : v
}

export type DadosLead = {
  nome: string
  email: string
  telefone: string | null
  data_casamento: string | null
  local: string | null
  servico_interesse: string | null
  origem_episodio_id: string | null
}

export function validarLead(body: Record<string, any>): Resultado<DadosLead> {
  const erros: Record<string, string> = {}

  const nome = texto(body.nome)
  if (nome.length < 2) erros.nome = 'Escreve o teu nome.'

  const email = texto(body.email).toLowerCase()
  if (!RE_EMAIL.test(email)) erros.email = 'Escreve um email válido.'

  const telefone = texto(body.telefone)
  if (telefone && !RE_TELEFONE.test(telefone)) erros.telefone = 'Número de telefone inválido.'

  const data = texto(body.data_casamento)
  if (data && !/^\d{4}-\d{2}-\d{2}$/.test(data)) erros.data_casamento = 'Data inválida.'

  if (body.consentimento !== true && body.consentimento !== 'on') {
    erros.consentimento = 'Precisamos da tua autorização para te contactarmos.'
  }

  if (Object.keys(erros).length > 0) return { ok: false, erros }

  return {
    ok: true,
    dados: {
      nome: limitar(nome, 120),
      email: limitar(email, 160),
      telefone: telefone ? limitar(telefone, 40) : null,
      data_casamento: data || null,
      local: texto(body.local) ? limitar(texto(body.local), 160) : null,
      servico_interesse: texto(body.servico_interesse) ? limitar(texto(body.servico_interesse), 80) : null,
      origem_episodio_id: texto(body.origem_episodio_id) || null,
    },
  }
}

export type DadosCandidatura = {
  nome: string
  email: string
  telefone: string | null
  empresa: string | null
  area: AreaCandidatura
  zona: string | null
  porque_tema: string | null
  links: string | null
}

export function validarCandidatura(body: Record<string, any>): Resultado<DadosCandidatura> {
  const erros: Record<string, string> = {}

  const nome = texto(body.nome)
  if (nome.length < 2) erros.nome = 'Escreve o teu nome.'

  const email = texto(body.email).toLowerCase()
  if (!RE_EMAIL.test(email)) erros.email = 'Escreve um email válido.'

  const telefone = texto(body.telefone)
  if (telefone && !RE_TELEFONE.test(telefone)) erros.telefone = 'Número de telefone inválido.'

  const area = texto(body.area) as AreaCandidatura
  if (!(AREAS_CANDIDATURA as readonly string[]).includes(area)) {
    erros.area = 'Escolhe a tua área.'
  }

  const porque = texto(body.porque_tema)
  if (porque.length < 20) erros.porque_tema = 'Conta-nos um pouco mais, pelo menos duas linhas.'

  if (body.consentimento !== true && body.consentimento !== 'on') {
    erros.consentimento = 'Precisamos da tua autorização para te contactarmos.'
  }

  if (Object.keys(erros).length > 0) return { ok: false, erros }

  return {
    ok: true,
    dados: {
      nome: limitar(nome, 120),
      email: limitar(email, 160),
      telefone: telefone ? limitar(telefone, 40) : null,
      empresa: texto(body.empresa) ? limitar(texto(body.empresa), 160) : null,
      area,
      zona: texto(body.zona) ? limitar(texto(body.zona), 120) : null,
      porque_tema: limitar(porque, 2000),
      links: texto(body.links) ? limitar(texto(body.links), 500) : null,
    },
  }
}

/* ── Anti-spam ──────────────────────────────────────────────
   Duas barreiras simples, sem CAPTCHA de terceiros:
   o campo-armadilha, invisível para pessoas e apetecível para robôs,
   e o tempo mínimo de preenchimento.
   ─────────────────────────────────────────────────────────── */

export const SEGUNDOS_MINIMOS = 3

export function pareceSpam(body: Record<string, any>): boolean {
  if (texto(body.website_confirmacao)) return true          // campo-armadilha preenchido
  const abertura = Number(body.aberto_em)
  if (!Number.isFinite(abertura)) return true              // sem marca de tempo
  const segundos = (Date.now() - abertura) / 1000
  return segundos < SEGUNDOS_MINIMOS
}

/* ── Limitação de taxa por IP ───────────────────────────────
   Em memória do processo. Não é infalível num ambiente com várias
   instâncias, mas trava o caso real: alguém a submeter o mesmo
   formulário dezenas de vezes seguidas.
   ─────────────────────────────────────────────────────────── */

const JANELA_MS = 10 * 60 * 1000
const MAX_POR_JANELA = 5
const registos = new Map<string, number[]>()

export function excedeuLimite(ip: string): boolean {
  const agora = Date.now()
  const anteriores = (registos.get(ip) ?? []).filter(t => agora - t < JANELA_MS)
  if (anteriores.length >= MAX_POR_JANELA) {
    registos.set(ip, anteriores)
    return true
  }
  anteriores.push(agora)
  registos.set(ip, anteriores)
  return false
}

export function ipDoPedido(req: Request): string {
  const h = req.headers
  return (h.get('x-forwarded-for') ?? '').split(',')[0].trim()
    || h.get('x-real-ip')
    || 'desconhecido'
}
