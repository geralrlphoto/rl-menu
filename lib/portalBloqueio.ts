// Portais entregues automaticamente (settings.bloqueioAteAdjudicacao) abrem só com
// Início, Contrato e Pagamentos. O resto desbloqueia sozinho quando a adjudicação
// está paga E os noivos já enviaram o contrato assinado (settings.contratoAssinadoEm).
// Portais antigos (sem a flag) ficam sempre abertos.

export const VALOR_ADJUDICACAO = 400

type Pag = { fase_pagamento?: string[] | string | null; valor_liquidado?: number | null }

export function adjudicacaoPaga(pagamentos: Pag[] | null | undefined): boolean {
  const lista = pagamentos ?? []
  const total = lista.reduce((s, p) => s + Number(p.valor_liquidado ?? 0), 0)
  const temFase = lista.some(p => {
    const fases = Array.isArray(p.fase_pagamento) ? p.fase_pagamento : [p.fase_pagamento ?? '']
    return Number(p.valor_liquidado ?? 0) > 0 && fases.some(f => /ADJUDICA/i.test(String(f)))
  })
  return temFase || total >= VALOR_ADJUDICACAO
}

export function portalBloqueado(settings: any, pagamentos: Pag[] | null | undefined): boolean {
  if (!settings?.bloqueioAteAdjudicacao) return false
  return !(settings.contratoAssinadoEm && adjudicacaoPaga(pagamentos))
}

/* Páginas abertas mesmo com o portal bloqueado */
export function paginaSempreAberta(titulo: string): boolean {
  const t = (titulo || '').toUpperCase()
  return t.includes('CONTRATO') || t.includes('PAGAMENTO')
}

export const TEXTO_BLOQUEIO = 'Disponível depois da adjudicação e do envio do contrato assinado.'

export type FaltaBloqueio = { adjudicacao: boolean; contrato: boolean }

/* O que ainda falta para desbloquear o portal */
export function emFalta(settings: any, pagamentos: Pag[] | null | undefined): FaltaBloqueio {
  return { adjudicacao: !adjudicacaoPaga(pagamentos), contrato: !settings?.contratoAssinadoEm }
}
