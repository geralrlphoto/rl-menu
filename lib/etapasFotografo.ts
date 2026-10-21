// Etapas do fotógrafo no portal do membro (/freelancers/[id]), pela ordem da página
// Fluxo de Trabalho (/fluxo-trabalho). Os prazos são os do Departamento de Fotografia
// (lib/fotografiaFluxo.ts), contados em dias corridos:
//   provas (galeria online)  7 dias depois do casamento
//   seleção                 30 dias depois do casamento
//   edição                  30 dias depois de chegar a seleção dos noivos (só para o editor nomeado)

export const PRAZO_CONFIRMAR_HORAS = 48
export const PRAZO_PROVAS_DIAS = 7
export const PRAZO_SELECAO_DIAS = 30
export const PRAZO_EDICAO_DIAS = 30
export const AVISO_DIAS = 5        // laranja nos últimos 5 dias; as provas só ficam vermelhas quando passam
export const BRIEFING_DIAS = 3     // o briefing fica disponível 3 dias antes
const INICIO_PRAZOS = '2026-01-01' // só entram casamentos desde 2026

export type EtapaFotografo = 'confirmar' | 'briefing' | 'dia' | 'provas' | 'selecao' | 'noivos' | 'edicao' | 'concluido'

/** Os 6 passos da barra, iguais aos cartões da página Fluxo de Trabalho */
export const PASSOS_FOTOGRAFO = [
  { n: '01', titulo: 'Novo casamento' },
  { n: '02', titulo: 'Briefing' },
  { n: '03', titulo: 'Dia do casamento' },
  { n: '04', titulo: 'Pós-casamento' },
  { n: '05', titulo: 'Seleção de fotos' },
  { n: '06', titulo: 'Edição de fotos' },
] as const

const PASSO: Record<EtapaFotografo, number> = { confirmar: 1, briefing: 2, dia: 3, provas: 4, selecao: 5, noivos: 6, edicao: 6, concluido: 7 }

const ACAO: Partial<Record<EtapaFotografo, string>> = {
  confirmar: 'Confirmar disponibilidade',
  briefing: 'Ler o briefing',
  dia: 'Dia do casamento',
  provas: 'Enviar as provas',
  selecao: 'Enviar a seleção',
  edicao: 'Enviar as fotos editadas',
}

export type CasamentoEtapa = {
  data_casamento: string | null
  data_confirmada: boolean | null
  indisponivel: boolean | null
  created_at?: string | null
  alertas_fotografia_ativos?: boolean | null
  url_provas_enviado_em?: string | null
  url_selecao_enviado_em?: string | null
  url_editadas_enviado_em?: string | null
  status_provas?: string | null
  status_selecao?: string | null
  status_editadas?: string | null
  editor_fotos?: string[] | string | null
  editor_album?: string[] | string | null
  referencia?: string | null
  // Entregas marcadas pela RL no departamento / ficha (portais.settings e eventos_2026)
  rl_galerias_enviada?: string | null
  rl_selecao_enviada?: string | null
  rl_selecao_recebida?: string | null
  rl_fotos_finais_enviada?: string | null
  rl_sel_fotos_estado?: string | null
}

export type EtapaInfo = {
  etapa: EtapaFotografo
  passo: number              // 1 a 6 (7 = tudo feito)
  acao: string | null        // o que o membro tem de fazer agora (null = nada por agora)
  prazo: string | null       // AAAA-MM-DD
  dias: number | null        // dias até ao prazo (negativo = atraso)
  tom: 'atraso' | 'aviso' | 'normal'
}

const hojeISO = () => new Date().toISOString().slice(0, 10)
const mais = (iso: string, dias: number) => new Date(new Date(iso.slice(0, 10) + 'T12:00:00Z').getTime() + dias * 86400000).toISOString().slice(0, 10)
const diasEntre = (de: string, ate: string) => Math.round((new Date(ate + 'T12:00:00Z').getTime() - new Date(de + 'T12:00:00Z').getTime()) / 86400000)
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** O membro está nomeado neste campo da equipa (editor_fotos / editor_album)? */
export function nomeado(campo: string[] | string | null | undefined, nomeMembro: string): boolean {
  if (!campo || !nomeMembro) return false
  const lista = Array.isArray(campo) ? campo : String(campo).split(/[,;]/)
  return lista.some(n => norm(String(n)) === norm(nomeMembro))
}

const feita = (enviadoEm?: string | null, estado?: string | null) => !!enviadoEm || /entreg/i.test(estado ?? '')

/** Cada entrega conta como feita pelo portal do membro ou pelo departamento (a mesma fonte do /photo) */
function estadoEntregas(c: CasamentoEtapa, selecaoRecebida: string | null) {
  const selecao = feita(c.url_selecao_enviado_em, c.status_selecao) || !!c.rl_selecao_enviada || /entreg/i.test(c.rl_sel_fotos_estado ?? '')
  return {
    provas: feita(c.url_provas_enviado_em, c.status_provas) || !!c.rl_galerias_enviada || selecao,
    provasEm: c.url_provas_enviado_em ?? c.rl_galerias_enviada ?? null,
    selecao,
    selecaoEm: c.url_selecao_enviado_em ?? c.rl_selecao_enviada ?? null,
    edicao: feita(c.url_editadas_enviado_em, c.status_editadas) || !!c.rl_fotos_finais_enviada,
    edicaoEm: c.url_editadas_enviado_em ?? c.rl_fotos_finais_enviada ?? null,
    recebida: selecaoRecebida ?? (c.rl_selecao_recebida ? c.rl_selecao_recebida.slice(0, 10) : null),
  }
}

/** Entregas do fotógrafo com o prazo de cada uma (para o cartão Performance) */
export function entregasFotografo(c: CasamentoEtapa, o: { nomeMembro: string; selecaoRecebida: string | null }) {
  const out: { tipo: 'provas' | 'selecao' | 'edicao'; prazo: string; enviadoEm: string | null; feita: boolean }[] = []
  const dia = c.data_casamento?.slice(0, 10)
  if (!dia || dia < INICIO_PRAZOS || !c.referencia || c.alertas_fotografia_ativos === false) return out
  const en = estadoEntregas(c, o.selecaoRecebida)
  out.push({ tipo: 'provas', prazo: mais(dia, PRAZO_PROVAS_DIAS), enviadoEm: en.provasEm, feita: en.provas })
  out.push({ tipo: 'selecao', prazo: mais(dia, PRAZO_SELECAO_DIAS), enviadoEm: en.selecaoEm, feita: en.selecao })
  if (nomeado(c.editor_fotos, o.nomeMembro) && en.recebida) {
    out.push({ tipo: 'edicao', prazo: mais(en.recebida, PRAZO_EDICAO_DIAS), enviadoEm: en.edicaoEm, feita: en.edicao })
  }
  return out
}

/**
 * Em que etapa está um casamento para este membro e o que tem de fazer.
 * Os videógrafos só passam pelas etapas 01 a 03.
 * null = casamento recusado (indisponível).
 */
export function etapaFotografo(
  c: CasamentoEtapa,
  o: { nomeMembro: string; selecaoRecebida: string | null; fotografo: boolean; hoje?: string },
): EtapaInfo | null {
  if (c.indisponivel) return null
  const hoje = o.hoje ?? hojeISO()
  const dia = c.data_casamento?.slice(0, 10) ?? null
  const info = (etapa: EtapaFotografo, prazo: string | null, comAcao = true): EtapaInfo => {
    const dias = prazo ? diasEntre(hoje, prazo) : null
    const tom = dias === null ? 'normal' : dias < 0 ? 'atraso' : (dias <= AVISO_DIAS && etapa !== 'provas') ? 'aviso' : 'normal'
    return { etapa, passo: PASSO[etapa], acao: comAcao ? ACAO[etapa] ?? null : null, prazo, dias, tom }
  }

  // Por confirmar (um casamento que já passou sem confirmação segue para as entregas)
  if (!c.data_confirmada && !(dia && dia < hoje)) {
    const prazo = c.created_at ? mais(c.created_at, PRAZO_CONFIRMAR_HORAS / 24) : null
    return info('confirmar', prazo)
  }
  if (!dia || dia > hoje) {
    const perto = !!dia && diasEntre(hoje, dia) <= BRIEFING_DIAS
    return info('briefing', perto ? dia : null, perto)
  }
  if (dia === hoje) return info('dia', dia)

  // Depois do casamento: só o fotógrafo tem entregas, e só desde 2026, com referência
  // (os registos antigos sem referência não se ligam ao departamento) e fotografia da RL
  if (!o.fotografo || dia < INICIO_PRAZOS || !c.referencia || c.alertas_fotografia_ativos === false) return info('concluido', null, false)
  const en = estadoEntregas(c, o.selecaoRecebida)
  if (!en.provas) return info('provas', mais(dia, PRAZO_PROVAS_DIAS))
  if (!en.selecao) return info('selecao', mais(dia, PRAZO_SELECAO_DIAS))
  if (!nomeado(c.editor_fotos, o.nomeMembro)) return info('concluido', null, false)
  if (!en.recebida) return info('noivos', null, false)
  if (!en.edicao) return info('edicao', mais(en.recebida, PRAZO_EDICAO_DIAS))
  return info('concluido', null, false)
}

/** "Faltam 4 dias" / "Hoje" / "2 dias de atraso" */
export function textoPrazo(e: EtapaInfo): string {
  if (e.dias === null) return ''
  if (e.dias < 0) return `${-e.dias} ${e.dias === -1 ? 'dia' : 'dias'} de atraso`
  if (e.dias === 0) return 'Hoje'
  return `Faltam ${e.dias} ${e.dias === 1 ? 'dia' : 'dias'}`
}
