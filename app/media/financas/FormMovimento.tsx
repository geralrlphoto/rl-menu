'use client'

import { useEffect, useState } from 'react'
import { CATS_DESPESA, CATS_RECEITA, type Movimento, type TipoMov } from './categorias'
import CampoDataPT from '@/app/media/_components/CampoDataPT'

// Janela para criar ou editar um movimento manual (despesa ou receita extra).

type ProjetoOpcao = { ref: string; nome: string; cliente: string }

const LABEL = 'rlp-m text-[9.5px] tracking-[0.25em] text-white/45 block mb-2'
const INPUT = 'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:border-[#2e6cf6] focus:outline-none transition-colors [color-scheme:dark]'

export default function FormMovimento({ inicial, projetos, hoje, onFechar, onGuardado }: {
  inicial: Movimento | null
  projetos: ProjetoOpcao[]
  hoje: string
  onFechar: () => void
  onGuardado: () => void
}) {
  const [tipo, setTipo] = useState<TipoMov>(inicial?.tipo ?? 'despesa')
  const [data, setData] = useState(inicial?.data ?? hoje)
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '')
  const [valor, setValor] = useState(inicial ? String(inicial.valor).replace('.', ',') : '')
  const [categoria, setCategoria] = useState(inicial?.categoria ?? '')
  const [projeto, setProjeto] = useState(inicial?.projeto_ref ?? '')
  const [notas, setNotas] = useState(inicial?.notas ?? '')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [aGuardar, setAGuardar] = useState(false)
  const [erroGeral, setErroGeral] = useState('')

  const cats = tipo === 'despesa' ? CATS_DESPESA : CATS_RECEITA

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onFechar])

  const trocarTipo = (t: TipoMov) => {
    setTipo(t)
    if (!(t === 'despesa' ? CATS_DESPESA : CATS_RECEITA).some(c => c.id === categoria)) setCategoria('')
  }

  const guardar = async () => {
    const n = Number(valor.replace(/\s/g, '').replace(',', '.'))
    const e: Record<string, string> = {}
    if (!data) e.data = 'Indica a data.'
    if (!descricao.trim()) e.descricao = 'Escreve uma descrição.'
    if (!valor.trim() || !isFinite(n) || n <= 0) e.valor = 'Indica um valor maior que zero.'
    if (!categoria) e.categoria = 'Escolhe uma categoria.'
    setErros(e)
    if (Object.keys(e).length) return

    setAGuardar(true)
    setErroGeral('')
    try {
      const corpo = { tipo, data, descricao: descricao.trim(), categoria, valor: n, projeto_ref: projeto || null, notas: notas.trim() || null }
      const r = await fetch(inicial ? `/api/financas-media/despesas/${inicial.id}` : '/api/financas-media/despesas', {
        method: inicial ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) throw new Error(j.error || 'Não foi possível guardar.')
      onGuardado()
    } catch (err) {
      setErroGeral(err instanceof Error ? err.message : 'Não foi possível guardar.')
      setAGuardar(false)
    }
  }

  const erro = (k: string) => erros[k] ? <p className="mt-1.5 text-[12px] text-[#ff4747]">{erros[k]}</p> : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#00141f]/85 p-0 sm:p-6" onClick={onFechar}>
      <div onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/[0.12] bg-[#0c2236] px-5 sm:px-7 py-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="rlp-m traco text-[10px] text-[#5a8bff]">{inicial ? 'Editar' : 'Novo'} movimento</p>
            <h2 className="rlp-t text-[28px] leading-none mt-2">{tipo === 'despesa' ? 'Despesa' : 'Receita'}</h2>
          </div>
          <button onClick={onFechar} aria-label="Fechar" className="text-white/40 hover:text-white text-[22px] leading-none px-1">×</button>
        </div>

        {/* tipo */}
        <div className="grid grid-cols-2 gap-1 rounded-full border border-white/[0.12] bg-[#00141f]/60 p-1 mb-6">
          {(['despesa', 'receita'] as TipoMov[]).map(t => (
            <button key={t} onClick={() => trocarTipo(t)}
              className={`rounded-full py-2 text-[13px] transition-colors ${tipo === t ? 'bg-[#2e6cf6] text-white' : 'text-white/55 hover:text-white'}`}>
              {t === 'despesa' ? '− Despesa' : '+ Receita'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Data</label>
            <CampoDataPT value={data} onChange={setData} className={INPUT + ' w-full'} />
            {erro('data')}
          </div>
          <div>
            <label className={LABEL}>Valor (€)</label>
            <input inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" className={`${INPUT} tabular-nums`} />
            {erro('valor')}
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>Descrição</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder={tipo === 'despesa' ? 'Ex.: aluguer de drone' : 'Ex.: horas extra de filmagem'} className={INPUT} />
            {erro('descricao')}
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>Categoria</label>
            <div className="flex flex-wrap gap-1.5">
              {cats.map(c => (
                <button key={c.id} onClick={() => setCategoria(c.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${categoria === c.id ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white' : 'border-white/[0.14] text-white/60 hover:text-white hover:border-white/30'}`}>
                  {c.nome}
                </button>
              ))}
            </div>
            {erro('categoria')}
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>Projeto (opcional)</label>
            <select value={projeto} onChange={e => setProjeto(e.target.value)} className={INPUT}>
              <option value="">Sem projeto</option>
              {projetos.map(p => (
                <option key={p.ref} value={p.ref}>{p.nome}{p.cliente ? ` · ${p.cliente}` : ''}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>Notas</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} placeholder="Opcional" className={`${INPUT} resize-none`} />
          </div>
        </div>

        {erroGeral && <p className="mt-4 text-[12.5px] text-[#ff4747]">{erroGeral}</p>}

        <div className="mt-7 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button onClick={onFechar} className="rounded-full border border-white/25 hover:border-white/50 px-5 py-3 text-[13.5px] text-white/80 hover:text-white transition-colors">Cancelar</button>
          <button onClick={guardar} disabled={aGuardar}
            className="rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-6 py-3 text-[13.5px] font-medium text-white transition-colors disabled:opacity-40">
            {aGuardar ? 'A guardar…' : inicial ? 'Guardar alterações' : `Adicionar ${tipo}`}
          </button>
        </div>
      </div>
    </div>
  )
}
