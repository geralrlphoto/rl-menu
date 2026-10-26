'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Valor do projeto no cartão de Projetos. Ao gravar, cria (ou ajusta) o plano de pagamentos,
// que alimenta o Financeiro do portal, as Finanças e as contas da Equipa do projeto.

const eur = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)

export default function ValorProjetoInput({ portalRef, valorInicial }: { portalRef: string; valorInicial: number }) {
  const router = useRouter()
  const [valor, setValor] = useState(valorInicial > 0 ? String(valorInicial) : '')
  const [editar, setEditar] = useState(!(valorInicial > 0))
  const [aGravar, setAGravar] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)

  async function gravar() {
    setMsg(null); setAGravar(true)
    try {
      const r = await fetch(`/api/media-portal/${encodeURIComponent(portalRef)}/valor`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ valor }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Não foi possível gravar.')
      setMsg({ ok: true, t: `✓ Plano de pagamentos atualizado (${d.pagamentos?.length ?? 0} prestações)` })
      setEditar(false)
      router.refresh()
    } catch (e) { setMsg({ ok: false, t: e instanceof Error ? e.message : 'Erro.' }) }
    setAGravar(false)
  }

  return (
    <div className="mt-3 rounded-xl border border-[#2e6cf6]/30 bg-[#2e6cf6]/[0.06] px-3.5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="rlp-m text-[9px] text-[#a9c1ff]">Valor do projeto</p>
        {!editar ? (
          <span className="flex items-center gap-3">
            <span className="rlp-t text-[20px] leading-none">{eur(Number(valor) || valorInicial)}</span>
            <button type="button" onClick={() => setEditar(true)} className="text-[12px] text-white/50 hover:text-white">Alterar</button>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 rounded-md border border-white/[0.14] bg-[#00141f]/70 px-2.5 py-1.5 focus-within:border-[#2e6cf6]">
              <input inputMode="decimal" placeholder="0" value={valor} onChange={e => setValor(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') gravar() }}
                className="w-24 bg-transparent text-right text-[14px] text-white placeholder:text-white/25 focus:outline-none" aria-label="Valor do projeto em euros" />
              <span className="text-[13px] text-white/45">€</span>
            </label>
            <button type="button" onClick={gravar} disabled={aGravar || !valor.trim()}
              className="rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-4 py-1.5 text-[12.5px] font-medium disabled:opacity-40">
              {aGravar ? 'A gravar…' : 'Gravar'}
            </button>
          </span>
        )}
      </div>
      {editar && !(valorInicial > 0) && <p className="mt-1.5 text-[11.5px] text-white/45">Cria o plano de pagamentos: Adjudicação 50% e Final 50%.</p>}
      {msg && <p className={`mt-1.5 text-[11.5px] ${msg.ok ? 'text-[#a9c1ff]' : 'text-[#ff8a8a]'}`}>{msg.t}</p>}
    </div>
  )
}
