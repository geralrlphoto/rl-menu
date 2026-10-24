/* ─────────────────────────────────────────────────────────────────────────── *
 *  RL PROD · Orçamentos (B2B / Empresas): tipos, catálogo e contas.
 *
 *  Persistência local (localStorage, chave LS_KEY). A página do PDF
 *  ([id]/pdf) lê a mesma chave com a mesma estrutura: não mudar o formato.
 * ─────────────────────────────────────────────────────────────────────────── */

export type Estado    = 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Expirado'
export type Cobertura = 'Fotografia' | 'Vídeo' | 'Fotografia e Vídeo'

export type ServicoSelected = {
  catalogId: string
  nome: string
  desc: string
  duracao?: string         // só Reportagem
}

export type Proposta = {
  id: string
  titulo: string
  valor: number
  servicos: ServicoSelected[]
  descricao: string | null
}

export type Orcamento = {
  id: string
  cliente: string             // nome da empresa
  contacto: string | null     // pessoa de contacto
  email: string | null
  cobertura: Cobertura | null
  resumo: string | null
  propostas: Proposta[]
  data_inicio: string | null  // YYYY-MM-DD, início do evento
  data_fim: string | null     // YYYY-MM-DD, fim do evento (opcional, multi-dia)
  validade: string | null     // YYYY-MM-DD, validade do orçamento
  estado: Estado
  notas: string | null
  criado_em: string
}

/* ─── Catálogo de Serviços (B2B) ──────────────────────────────────────────── */

export type Categoria = 'Equipa' | 'Cobertura' | 'Entregáveis' | 'Qualidade' | 'Pré-produção' | 'Pós-produção'

export type CatalogItem = {
  id: string
  nome: string
  desc: string
  categoria: Categoria
  hasDuration?: boolean
  durations?: string[]
}

export const CATALOG: CatalogItem[] = [
  // Equipa
  { id: 'videografo_1',     categoria: 'Equipa',         nome: 'Um Videógrafo',                       desc: 'Um profissional dedicado à captação de imagem em movimento. Garante a cobertura essencial do evento e a relação directa com o cliente em terreno.' },
  { id: 'videografo_2',     categoria: 'Equipa',         nome: 'Dois Videógrafos',                    desc: 'Dupla de videógrafos para cobertura simultânea. Planos amplos e planos de detalhe ou locais distintos cobertos ao mesmo tempo.' },
  { id: 'videografo_3',     categoria: 'Equipa',         nome: 'Três Videógrafos',                    desc: 'Cobertura multicâmara completa com três ângulos em simultâneo. Ideal para eventos de grande dimensão ou com vários palcos.' },
  { id: 'editor',           categoria: 'Pós-produção',   nome: 'Um Editor',                           desc: 'Pós produção dedicada por editor sénior. Inclui montagem narrativa, correcção de cor, mistura de áudio e exportação final em formato de entrega.' },
  // Cobertura
  { id: 'reportagem',       categoria: 'Cobertura',      nome: 'Reportagem do Evento',                desc: 'Cobertura contínua durante o período contratado, em formato documental e dinâmico. Captação fluida de momentos, ambiente e interacções.', hasDuration: true, durations: ['4h', '6h', '8h'] },
  { id: 'oradores',         categoria: 'Cobertura',      nome: 'Cobertura dos Oradores',              desc: 'Captação dedicada das intervenções no palco com enquadramento facial constante, áudio de sala em qualidade broadcast e legendas opcionais em pós produção.' },
  { id: 'drone',            categoria: 'Cobertura',      nome: 'Drone',                               desc: 'Imagens aéreas com drone profissional certificado. Planos amplos do espaço, chegada de convidados e vistas exteriores do local.' },
  { id: 'same_day_edit',    categoria: 'Cobertura',      nome: 'Same Day Edit',                       desc: 'Edição expressa entregue no próprio dia do evento. Ideal para projecção em ecrã durante o jantar, encerramento ou momento de partilha.' },
  // Entregáveis
  { id: 'horizontal_3min',  categoria: 'Entregáveis',    nome: 'Vídeo Horizontal até 3 min',          desc: 'Filme principal do evento em formato 16:9 com duração até 3 minutos. Versão pronta para website institucional, apresentações internas e comunicação corporate.' },
  { id: 'vertical_1',       categoria: 'Entregáveis',    nome: 'Um Vídeo Vertical (redes sociais)',   desc: 'Versão optimizada 9:16 para Instagram Reels, TikTok ou Stories. Inclui legendas e ritmo próprio para consumo em mobile.' },
  { id: 'vertical_2',       categoria: 'Entregáveis',    nome: 'Dois Vídeos Verticais (redes sociais)', desc: 'Pack de dois vídeos verticais com cortes distintos. Permite múltiplos posts ao longo da campanha de comunicação.' },
  { id: 'plataforma',       categoria: 'Entregáveis',    nome: 'Acesso à Plataforma do Cliente',      desc: 'Portal privado RL PROD para visualizar, partilhar e descarregar todo o material entregue. Substitui WeTransfer e centraliza acessos da equipa.' },
  // Qualidade
  { id: 'fhd',              categoria: 'Qualidade',      nome: 'Qualidade Full HD',                   desc: 'Captação e entrega em 1920 por 1080 (Full HD). Padrão broadcast, compatível com qualquer ecrã ou plataforma de difusão.' },
  { id: 'uhd_4k',           categoria: 'Qualidade',      nome: 'Qualidade 4K',                        desc: 'Captação e entrega em 4K (3840 por 2160). Máxima resolução para projecção em grande formato e arquivo de longa duração.' },
  // Pré-produção
  { id: 'reuniao_1',        categoria: 'Pré-produção',   nome: '1 Reunião antes do evento',           desc: 'Sessão de briefing prévio para alinhar objectivos, estética visual, mensagem central e logística no terreno.' },
  { id: 'reuniao_2',        categoria: 'Pré-produção',   nome: '2 Reuniões antes do evento',          desc: 'Duas sessões de planeamento. Reunião inicial de alinhamento e revisão técnica final na semana do evento.' },
]

export const LS_KEY = 'rl_orcamentos_v1'
export const ESTADOS:    Estado[]    = ['Pendente', 'Aprovado', 'Rejeitado', 'Expirado']
export const COBERTURAS: Cobertura[] = ['Fotografia', 'Vídeo', 'Fotografia e Vídeo']

/* ─── Cores da RL PROD por estado (mesma lógica do funil do CRM) ──────────── */

export const COR_ESTADO: Record<Estado, string> = {
  Pendente:  '#5a8bff',
  Aprovado:  '#ffffff',
  Rejeitado: '#ff4747',
  Expirado:  '#7c8893',
}
export const estiloEstado = (e: Estado) => {
  const c = COR_ESTADO[e]
  return { color: c, borderColor: `${c}66`, background: `${c}14` }
}

export const ICONE_COBERTURA: Record<Cobertura, string> = {
  'Fotografia':         '◐',
  'Vídeo':              '▶',
  'Fotografia e Vídeo': '◑',
}

/* ─── Classes partilhadas ─────────────────────────────────────────────────── */

export const inputCls = 'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3 text-[14.5px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6] focus:bg-[#00141f] transition-colors'
export const labelCls = 'rlp-m block text-[10px] text-white/55 mb-2'
export const pill = (ativo: boolean) =>
  `rounded-full text-[12px] px-4 py-2 border transition-colors ${
    ativo ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white' : 'border-white/[0.12] text-white/55 hover:border-white/30 hover:text-white'
  }`

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

export function fmtEur(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0)
}
export function fmtData(iso: string | null) {
  if (!iso) return 'Por definir'
  try {
    const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'))
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return iso }
}
export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
function hojeMeiaNoite() {
  const t = new Date(); t.setHours(0, 0, 0, 0); return t
}
export function isExpired(o: Orcamento) {
  if (!o.validade) return false
  return new Date(o.validade + 'T00:00:00').getTime() < hojeMeiaNoite().getTime()
}
/** Dias até ao fim da validade (0 = hoje, negativo = passou). null sem validade. */
export function diasParaValidade(o: Orcamento): number | null {
  if (!o.validade) return null
  return Math.round((new Date(o.validade + 'T00:00:00').getTime() - hojeMeiaNoite().getTime()) / 86400000)
}
/** Valor de referência do orçamento: a proposta mais alta. */
export function valorMax(o: Orcamento): number {
  if (!o.propostas?.length) return 0
  return o.propostas.reduce((m, p) => p.valor > m ? p.valor : m, 0)
}
export function valorRange(propostas: Proposta[]): { min: number; max: number } {
  const valores = (propostas ?? []).map(p => p.valor || 0)
  if (valores.length === 0) return { min: 0, max: 0 }
  return { min: Math.min(...valores), max: Math.max(...valores) }
}
export function fmtRange(propostas: Proposta[]) {
  const r = valorRange(propostas)
  return r.min === r.max ? fmtEur(r.max) : `${fmtEur(r.min)} a ${fmtEur(r.max)}`
}

/** Migra registos antigos (formato v0 / v1) para a estrutura com serviços */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrate(raw: any[]): Orcamento[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (raw ?? []).map((r: any) => {
    const propostasIn = Array.isArray(r.propostas)
      ? r.propostas
      : [{ id: uid(), titulo: r.servico || 'Proposta', valor: r.valor || 0, descricao: null, servicos: [] }]
    return {
      id: r.id ?? uid(),
      cliente: r.cliente ?? '',
      contacto: r.contacto ?? null,
      email: r.email ?? null,
      cobertura: r.cobertura ?? null,
      resumo: r.resumo ?? r.servico ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      propostas: propostasIn.map((p: any) => ({
        id: p.id ?? uid(),
        titulo: p.titulo ?? 'Proposta',
        valor: typeof p.valor === 'number' ? p.valor : parseFloat(p.valor) || 0,
        descricao: p.descricao ?? null,
        servicos: Array.isArray(p.servicos) ? p.servicos : [],
      })),
      data_inicio: r.data_inicio ?? null,
      data_fim: r.data_fim ?? null,
      validade: r.validade ?? null,
      estado: (r.estado as Estado) ?? 'Pendente',
      notas: r.notas ?? null,
      criado_em: r.criado_em ?? new Date().toISOString(),
    }
  })
}

/** Intervalo de datas do evento: dia único, intervalo, ou em falta. */
export function fmtIntervaloEvento(inicio: string | null, fim: string | null): string {
  if (!inicio && !fim) return 'A definir'
  if (inicio && !fim) return fmtData(inicio)
  if (!inicio && fim) return `Até ${fmtData(fim)}`
  if (inicio === fim) return fmtData(inicio)
  return `${fmtData(inicio)} → ${fmtData(fim)}`
}
