'use client'

import { useEffect, useState } from 'react'
import { CATS_DESPESA, CATS_RECEITA, normCategoria, nomeCategoria } from '@/app/media/financas/categorias'
import CampoDataPT from '@/app/media/_components/CampoDataPT'

// Receitas e despesas de um projeto, só para o admin, no Financeiro do portal.
// Grava em media_despesas (tipo despesa/receita, projeto_ref) e aparece também
// em /media/financas. Os pagamentos do cliente entram sozinhos como receita.

type Movimento = { id: string; tipo: 'despesa' | 'receita'; data: string; descricao: string; categoria: string; valor: number; notas?: string | null }

// Mesmas categorias da página Finanças (guarda-se o id, mostra-se o nome)
const CAT = { despesa: CATS_DESPESA, receita: CATS_RECEITA }
const eur = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)
const hoje = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Lisbon' })
const fmtData = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })

export default function MovimentosProjeto({ portalRef, recebido }: { portalRef: string; recebido: number }) {
  const [lista, setLista] = useState<Movimento[] | null>(null)
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState({ tipo: 'despesa' as 'despesa' | 'receita', data: hoje(), descricao: '', valor: '', categoria: 'equipamento', notas: '' })
  const [aGravar, setAGravar] = useState(false)
  const [erro, setErro] = useState('')

  async function carregar() {
    try {
      const r = await fetch(`/api/financas-media/despesas?projeto=${encodeURIComponent(portalRef)}`)
      const d = await r.json()
      setLista(d.despesas ?? [])
    } catch { setLista([]) }
  }
  useEffect(() => { carregar() // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portalRef])

  async function gravar() {
    setErro('')
    const valor = Number(String(form.valor).replace(',', '.'))
    if (!form.descricao.trim()) { setErro('Escreve uma descrição.'); return }
    if (!valor || valor <= 0) { setErro('Indica um valor maior que zero.'); return }
    setAGravar(true)
    try {
      const r = await fetch('/api/financas-media/despesas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, valor, projeto_ref: portalRef }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setForm(f => ({ ...f, descricao: '', valor: '', notas: '' }))
      setAberto(false)
      carregar()
    } catch (e) { setErro(e instanceof Error && e.message ? e.message : 'Não foi possível gravar.') }
    setAGravar(false)
  }

  async function apagar(m: Movimento) {
    if (!confirm(`Apagar "${m.descricao}" (${eur(m.valor)})?`)) return
    const r = await fetch(`/api/financas-media/despesas/${m.id}`, { method: 'DELETE' })
    if (r.ok) setLista(l => (l ?? []).filter(x => x.id !== m.id))
  }

  const despesas = (lista ?? []).filter(m => m.tipo !== 'receita').reduce((s, m) => s + Number(m.valor), 0)
  const extras = (lista ?? []).filter(m => m.tipo === 'receita').reduce((s, m) => s + Number(m.valor), 0)
  const balanco = recebido + extras - despesas
  const margem = recebido + extras > 0 ? Math.round((balanco / (recebido + extras)) * 100) : null

  const chip = (ativo: boolean) => `rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${ativo ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white' : 'border-white/[0.14] text-white/70 hover:text-white hover:border-white/30'}`
  const input = 'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6]'

  return (
    <section className="mb-10 rounded-2xl border border-dashed border-[#a9c1ff]/40 bg-[#00141f]/70 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="rlp-m traco text-[10px] text-[#a9c1ff]">Só visível para a RL PROD</p>
          <h2 className="rlp-t mt-1 text-[22px]">Receitas e despesas do projeto</h2>
          <p className="text-[12.5px] text-white/50">Também aparecem em Finanças. Os pagamentos do cliente entram sozinhos como receita e o valor de cada pessoa da <a href={`/portal-media/${portalRef}/equipa`} className="text-[#a9c1ff] hover:text-white">Equipa</a> entra sozinho como despesa.</p>
        </div>
        <button type="button" onClick={() => setAberto(a => !a)}
          className="rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-4 py-2 text-[13.5px] font-medium transition-colors">
          {aberto ? 'Fechar' : '+ Movimento'}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { k: 'Recebido do cliente', v: eur(recebido), cor: 'text-white' },
          { k: 'Receitas extra', v: eur(extras), cor: 'text-white' },
          { k: 'Custo total do projeto', v: eur(despesas), cor: 'text-white' },
          { k: 'Balanço', v: `${eur(balanco)}${margem !== null ? ` · ${margem}%` : ''}`, cor: balanco < 0 ? 'text-[#ff4747]' : 'text-[#5a8bff]' },
        ].map(x => (
          <div key={x.k} className="rounded-xl bg-[#0c2236]/70 px-3.5 py-3">
            <p className="rlp-m text-[8.5px] text-white/45">{x.k}</p>
            <p className={`rlp-t mt-1 text-[18px] ${x.cor}`}>{x.v}</p>
          </div>
        ))}
      </div>

      {aberto && (
        <div className="mt-4 rounded-xl border border-white/[0.1] bg-[#0c2236]/60 p-4 grid gap-3">
          <div className="flex gap-2">
            {(['despesa', 'receita'] as const).map(t => (
              <button key={t} type="button" onClick={() => setForm(f => ({ ...f, tipo: t, categoria: CAT[t][0].id }))} className={chip(form.tipo === t)}>
                {t === 'despesa' ? 'Despesa' : 'Receita'}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px_150px]">
            <input className={input} placeholder="Descrição (ex.: aluguer de drone)" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            <input className={input} placeholder="Valor €" inputMode="decimal" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
            <CampoDataPT value={form.data} onChange={v => setForm(f => ({ ...f, data: v }))} className={input} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CAT[form.tipo].map(c => <button key={c.id} type="button" onClick={() => setForm(f => ({ ...f, categoria: c.id }))} className={chip(form.categoria === c.id)}>{c.nome}</button>)}
          </div>
          <input className={input} placeholder="Notas (opcional)" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
          {erro && <p className="text-[13px] text-[#ff8a8a]">{erro}</p>}
          <div className="flex justify-end">
            <button type="button" onClick={gravar} disabled={aGravar}
              className="rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-5 py-2.5 text-[13.5px] font-medium disabled:opacity-50">
              {aGravar ? 'A gravar…' : `Gravar ${form.tipo}`}
            </button>
          </div>
        </div>
      )}

      <ul className="mt-4 divide-y divide-white/[0.07] rounded-xl border border-white/[0.08] overflow-hidden">
        {lista === null && <li className="px-4 py-3 text-[13px] text-white/45">A carregar…</li>}
        {lista && lista.length === 0 && <li className="px-4 py-3 text-[13px] text-white/45">Ainda sem despesas nem receitas extra neste projeto.</li>}
        {(lista ?? []).map(m => (
          <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className={`rlp-m w-16 shrink-0 text-[8.5px] ${m.tipo === 'receita' ? 'text-[#5a8bff]' : 'text-white/50'}`}>{m.tipo === 'receita' ? 'Receita' : 'Despesa'}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] text-white/90">{m.descricao}</span>
              <span className="block text-[11.5px] text-white/45">{fmtData(m.data)} · {nomeCategoria(normCategoria(m.categoria), m.tipo === 'receita' ? 'receita' : 'despesa')}{m.notas ? ` · ${m.notas}` : ''}</span>
            </span>
            <span className={`shrink-0 text-[14px] ${m.tipo === 'receita' ? 'text-[#5a8bff]' : 'text-white'}`}>{m.tipo === 'receita' ? '+' : '−'}{eur(Number(m.valor))}</span>
            {(m.notas ?? '').startsWith('Equipa do projeto')
              ? <a href={`/portal-media/${portalRef}/equipa`} title="Muda o valor na página Equipa" className="rlp-m shrink-0 rounded-full border border-white/[0.14] px-2 py-0.5 text-[8px] text-white/50 hover:text-white">Equipa</a>
              : <button type="button" onClick={() => apagar(m)} aria-label="Apagar" className="shrink-0 text-white/30 hover:text-[#ff4747] text-[13px]">✕</button>}
          </li>
        ))}
      </ul>
    </section>
  )
}
