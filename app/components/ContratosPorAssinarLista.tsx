'use client'

import { useState } from 'react'
import Link from 'next/link'
import { WaTarefaChip, type WaTarefa } from './WaTarefaChip'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const fmt = (iso: string) => { const d = new Date(iso + 'T12:00:00Z'); return `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}` }

/* Lista dos contratos por assinar (cartão Tarefas do /photo e página /tarefas):
   cada casal com o botão de WhatsApp (pedir / lembrar) e "Marcar como assinado"
   para os contratos recebidos por email, WhatsApp ou em papel. */
export function ContratosPorAssinarLista({ contratos, onAbrir }: { contratos: WaTarefa[]; onAbrir?: () => void }) {
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const [aMarcar, setAMarcar] = useState<string | null>(null)
  const lista = contratos.filter(c => !marcados.has(c.contactId))

  async function marcar(c: WaTarefa) {
    if (!c.referencia) return
    if (!confirm(`Marcar o contrato de ${c.nome || 'este casal'} como assinado?\n\nUsa isto quando receberes o contrato assinado por email, WhatsApp ou em papel. O portal desbloqueia se a adjudicação estiver paga.`)) return
    setAMarcar(c.contactId)
    try {
      const r = await fetch('/api/contratos-por-assinar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia: c.referencia }),
      })
      if (!r.ok) { const d = await r.json().catch(() => ({})); alert(d.error ?? 'Não foi possível marcar.'); return }
      setMarcados(s => new Set(s).add(c.contactId))
    } finally { setAMarcar(null) }
  }

  if (lista.length === 0) return <p className="text-center font-cond text-[16px] text-white/35 py-16">Nenhum contrato por assinar</p>

  return (
    <div className="flex flex-col gap-3">
      {lista.map(c => (
        <div key={c.contactId} className="rounded-[20px] border border-white/[0.08] bg-[#141414] px-4 py-3.5 flex flex-wrap items-center gap-3.5"
          style={{ borderLeft: `2px solid ${c.atrasoDias > 0 && !c.lembreteEm ? '#f87171' : '#4ade80'}` }}>
          <div className="min-w-0 flex-1">
            <Link href={`/eventos-2026/${c.contactId}`} onClick={onAbrir}
              className="font-cond text-[17px] text-white leading-snug hover:text-[#C9A84C] transition-colors">{c.nome || 'Sem nome'}</Link>
            <p className="font-cond text-[12px] text-white/40 mt-0.5">
              {c.dataCasamento ? `${c.batizado ? 'Batizado' : 'Casamento'} a ${fmt(c.dataCasamento)}` : ''}
              {c.pedidoEm ? ` · pedido a ${fmt(c.pedidoEm)}` : ''}
              {c.lembreteEm ? ` · lembrete a ${fmt(c.lembreteEm)}` : ''}
            </p>
            <button type="button" onClick={() => marcar(c)} disabled={aMarcar === c.contactId}
              className="mt-1.5 font-cond text-[12px] text-[#C9A84C]/80 hover:text-[#C9A84C] underline underline-offset-2 disabled:opacity-40">
              {aMarcar === c.contactId ? 'A marcar…' : 'Marcar como assinado'}
            </button>
          </div>
          <div className="w-[170px] shrink-0">
            {c.lembreteEm
              ? <p className="font-cond text-[12px] text-white/40 text-right">Pedido e lembrete enviados. Ligar aos noivos.</p>
              : <WaTarefaChip t={c} />}
          </div>
        </div>
      ))}
    </div>
  )
}
