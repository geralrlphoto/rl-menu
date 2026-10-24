import type { Projeto, RegistoPagamento } from './mockProject'

// Conta única do que está pago num projeto, usada no início do portal e na
// página Financeiro. Se há pagamentos registados (comprovativos), conta a soma
// dos registos; se não há, conta as prestações do plano marcadas como "pago".
export function contasPagamento(projeto: Pick<Projeto, 'pagamentos' | 'registosPagamento'>, registos?: RegistoPagamento[]) {
  const plano = projeto.pagamentos ?? []
  const regs = registos ?? projeto.registosPagamento ?? []
  const total = plano.reduce((s, p) => s + (Number(p.valor) || 0), 0)
  const pago = regs.length
    ? regs.reduce((s, r) => s + (Number(r.valor) || 0), 0)
    : plano.filter(p => p.estado === 'pago').reduce((s, p) => s + (Number(p.valor) || 0), 0)
  const emFalta = Math.max(0, total - pago)
  const pct = total > 0 ? Math.min(100, Math.round((pago / total) * 100)) : 0
  return { total, pago, emFalta, pct }
}
