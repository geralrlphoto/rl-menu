'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

// Equipa do projeto, só para o admin: quem vai filmar, editar, etc.
// Grava em media_equipa_projeto via /api/media-equipa.

type Membro = { id: string; nome: string; funcao: string; contacto?: string | null; notas?: string | null }
type Pessoa = { nome: string; funcao: string; contacto?: string | null }

const FUNCOES = ['Realizador', 'Operador de câmara', 'Fotógrafo', 'Drone', 'Som', 'Editor', 'Assistente', 'Produção']

export default function EquipaClient({ portalRef, nome }: { portalRef: string; nome: string }) {
  const [equipa, setEquipa] = useState<Membro[] | null>(null)
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [form, setForm] = useState({ nome: '', funcao: FUNCOES[0], contacto: '', notas: '' })
  const [aGravar, setAGravar] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch(`/api/media-equipa?projeto=${encodeURIComponent(portalRef)}`)
      .then(r => r.json())
      .then(d => { setEquipa(d.equipa ?? []); setPessoas(d.pessoas ?? []) })
      .catch(() => setEquipa([]))
  }, [portalRef])

  // Ao escolher alguém que já trabalhou connosco, preenche a função e o contacto
  function mudarNome(v: string) {
    const p = pessoas.find(x => x.nome.toLowerCase() === v.trim().toLowerCase())
    setForm(f => p ? { ...f, nome: v, funcao: p.funcao || f.funcao, contacto: p.contacto ?? '' } : { ...f, nome: v })
  }

  async function nomear() {
    setErro('')
    if (!form.nome.trim()) { setErro('Escreve o nome da pessoa.'); return }
    setAGravar(true)
    try {
      const r = await fetch('/api/media-equipa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, projeto_ref: portalRef }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setEquipa(e => [...(e ?? []), d.membro])
      setForm({ nome: '', funcao: FUNCOES[0], contacto: '', notas: '' })
    } catch (e) { setErro(e instanceof Error && e.message ? e.message : 'Não foi possível gravar.') }
    setAGravar(false)
  }

  async function remover(m: Membro) {
    if (!confirm(`Tirar ${m.nome} da equipa deste projeto?`)) return
    const r = await fetch(`/api/media-equipa?id=${m.id}`, { method: 'DELETE' })
    if (r.ok) setEquipa(e => (e ?? []).filter(x => x.id !== m.id))
  }

  const chip = (ativo: boolean) => `rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${ativo ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white' : 'border-white/[0.14] text-white/70 hover:text-white hover:border-white/30'}`
  const INPUT = 'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6]'
  const iniciais = (n: string) => n.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const telefone = (c?: string | null) => c && /^[+\d][\d\s]{6,}$/.test(c.trim()) ? c.replace(/\s/g, '') : null

  return (
    <div className="rlp relative z-10 max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <Link href={`/portal-media/${portalRef}`}
        className="rlp-m inline-flex items-center gap-2 text-[11px] text-white/45 hover:text-white/80 transition-colors mb-10 group">
        <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
        Portal {nome}
      </Link>

      <header className="flex items-start justify-between gap-4 mb-8">
        <div className="min-w-0">
          <p className="rlp-m traco text-[11px] text-[#5a8bff] mb-3">RL PROD · {nome}</p>
          <h1 className="rlp-t text-4xl sm:text-5xl text-white leading-none">Equipa</h1>
          <p className="mt-4 text-[15px] text-white/60 leading-relaxed max-w-xl">
            Quem trabalha neste projeto e o que faz. Só a RL PROD vê esta página.
          </p>
        </div>
        <span className="rlp-m shrink-0 inline-flex items-center gap-2 rounded-full border border-[#a9c1ff]/60 px-3 py-1.5 text-[9px] text-[#a9c1ff]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a9c1ff] shrink-0" />
          Interno
        </span>
      </header>

      {/* Equipa nomeada */}
      <section className="mb-8">
        <p className="rlp-m text-[10px] text-white/45 mb-3">Equipa do projeto{equipa ? ` · ${equipa.length}` : ''}</p>
        {equipa === null && <p className="text-[14px] text-white/45">A carregar…</p>}
        {equipa && equipa.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/[0.14] bg-[#00141f]/50 px-6 py-10 text-center text-[14px] text-white/50">
            Ainda ninguém foi nomeado para este projeto.
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {(equipa ?? []).map(m => (
            <div key={m.id} className="group relative rounded-2xl border border-white/[0.1] bg-[#0c2236]/70 p-4 flex gap-3.5">
              <span className="rlp-t w-12 h-12 shrink-0 rounded-full flex items-center justify-center bg-[#2e6cf6] text-[17px] text-white">{iniciais(m.nome)}</span>
              <div className="min-w-0 flex-1">
                <p className="rlp-t text-[19px] leading-tight truncate">{m.nome}</p>
                {m.funcao && <p className="rlp-m mt-1 text-[9px] text-[#a9c1ff]">{m.funcao}</p>}
                {m.contacto && (
                  telefone(m.contacto)
                    ? <a href={`tel:${telefone(m.contacto)}`} className="mt-1.5 block text-[13px] text-white/65 hover:text-white">{m.contacto}</a>
                    : m.contacto.includes('@')
                      ? <a href={`mailto:${m.contacto}`} className="mt-1.5 block truncate text-[13px] text-white/65 hover:text-white">{m.contacto}</a>
                      : <p className="mt-1.5 text-[13px] text-white/65">{m.contacto}</p>
                )}
                {m.notas && <p className="mt-1 text-[12.5px] text-white/45">{m.notas}</p>}
              </div>
              <button type="button" onClick={() => remover(m)} aria-label={`Tirar ${m.nome}`}
                className="absolute top-3 right-3 text-white/30 hover:text-[#ff4747] text-[13px]">✕</button>
            </div>
          ))}
        </div>
      </section>

      {/* Nomear */}
      <section className="rounded-2xl border border-dashed border-[#a9c1ff]/40 bg-[#00141f]/70 p-4 sm:p-6 grid gap-3">
        <h2 className="rlp-t text-[22px]">Nomear pessoa</h2>
        <input className={INPUT} placeholder="Nome" list="equipa-pessoas" value={form.nome} onChange={e => mudarNome(e.target.value)} />
        <datalist id="equipa-pessoas">
          {pessoas.map(p => <option key={p.nome} value={p.nome}>{p.funcao}</option>)}
        </datalist>
        <div className="flex flex-wrap gap-1.5">
          {FUNCOES.map(f => <button key={f} type="button" onClick={() => setForm(x => ({ ...x, funcao: f }))} className={chip(form.funcao === f)}>{f}</button>)}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={INPUT} placeholder="Telemóvel ou email (opcional)" value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))} />
          <input className={INPUT} placeholder="Notas (ex.: só no dia 12)" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
        </div>
        {erro && <p className="text-[13px] text-[#ff8a8a]">{erro}</p>}
        <div className="flex justify-end">
          <button type="button" onClick={nomear} disabled={aGravar}
            className="rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-5 py-2.5 text-[14px] font-medium disabled:opacity-50">
            {aGravar ? 'A gravar…' : 'Nomear'}
          </button>
        </div>
      </section>
    </div>
  )
}
