'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FUNDO } from '@/app/media/_lib/estilo'
import { CATEGORIAS, type CategoriaId, type MembroEquipa } from './categorias'

// Equipa da RL PROD separada por categoria. Cada pessoa pode depois ser
// nomeada nos projetos (página Equipa de cada portal).

type Membro = MembroEquipa & { projetos: string[] }
type Form = { id?: string; nome: string; categoria: CategoriaId; telefone: string; email: string; instagram: string; notas: string }

const VAZIO = (categoria: CategoriaId = 'videografo'): Form => ({ nome: '', categoria, telefone: '', email: '', instagram: '', notas: '' })
const iniciais = (n: string) => n.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()
const insta = (v: string) => v.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')

export default function EquipaPage() {
  const router = useRouter()
  const [membros, setMembros] = useState<Membro[] | null>(null)
  const [filtro, setFiltro] = useState<CategoriaId | 'todos'>('todos')
  const [form, setForm] = useState<Form | null>(null)
  const [aGravar, setAGravar] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch('/api/media-equipa/membros').then(r => r.json())
      .then(d => setMembros(d.membros ?? [])).catch(() => setMembros([]))
  }, [])

  async function gravar() {
    if (!form) return
    setErro('')
    if (!form.nome.trim()) { setErro('Escreve o nome.'); return }
    setAGravar(true)
    try {
      const r = await fetch('/api/media-equipa/membros', {
        method: form.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      // Membro novo: abre logo a ficha para completar os dados
      if (!form.id) { router.push(`/media/equipa/${d.membro.id}`); return }
      setMembros(ms => (ms ?? []).map(m => m.id === form.id ? { ...m, ...d.membro } : m))
      setForm(null)
    } catch (e) { setErro(e instanceof Error && e.message ? e.message : 'Não foi possível gravar.') }
    setAGravar(false)
  }

  async function alternarAtivo(m: Membro) {
    const r = await fetch('/api/media-equipa/membros', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, ativo: !m.ativo }),
    })
    if (r.ok) setMembros(ms => (ms ?? []).map(x => x.id === m.id ? { ...x, ativo: !m.ativo } : x))
  }

  async function apagar(m: Membro) {
    if (!confirm(`Apagar ${m.nome} da equipa? Os projetos onde foi nomeado mantêm o nome.`)) return
    const r = await fetch(`/api/media-equipa/membros?id=${m.id}`, { method: 'DELETE' })
    if (r.ok) { setMembros(ms => (ms ?? []).filter(x => x.id !== m.id)); setForm(null) }
  }

  const conta = (c: CategoriaId) => (membros ?? []).filter(m => m.categoria === c && m.ativo).length
  const grupos = CATEGORIAS.filter(c => filtro === 'todos' || c.id === filtro)

  const pill = (ativo: boolean) => `rounded-full px-4 py-2 text-[12.5px] transition-colors ${ativo ? 'bg-[#2e6cf6] text-white' : 'text-white/60 hover:text-white'}`
  const chip = (ativo: boolean) => `rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${ativo ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white' : 'border-white/[0.14] text-white/70 hover:text-white hover:border-white/30'}`
  const INPUT = 'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6]'

  return (
    <main className="rlp min-h-screen relative text-white">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-8 pb-16">
        <Link href="/media" className="text-[12px] text-white/45 hover:text-white transition-colors">‹ RL Prod</Link>

        <header className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">RL Prod · Gestão</p>
            <h1 className="rlp-t text-[52px] sm:text-[72px] leading-[0.9] mt-3">Equipa.</h1>
            <p className="mt-2 text-[15px] text-white/55">Quem trabalha com a RL PROD, por função</p>
          </div>
          <button onClick={() => { setErro(''); setForm(VAZIO(filtro === 'todos' ? 'videografo' : filtro)) }}
            className="self-start sm:self-auto rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-6 py-3 text-[13.5px] font-medium text-white transition-colors">
            + Membro
          </button>
        </header>

        {/* números por categoria */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {CATEGORIAS.map(c => (
            <button key={c.id} onClick={() => setFiltro(f => f === c.id ? 'todos' : c.id)}
              className={`text-left rounded-2xl border px-4 py-4 bg-[#0c2236]/70 transition-colors ${filtro === c.id ? 'border-[#2e6cf6]' : 'border-white/[0.08] hover:border-white/20'}`}>
              <p className="rlp-m text-[9px] tracking-[0.22em] text-white/45">{c.nome}</p>
              <p className="rlp-t text-[30px] leading-none mt-2.5 tabular-nums">{membros ? conta(c.id) : '·'}</p>
            </button>
          ))}
        </div>

        <div className="mt-5 inline-flex flex-wrap gap-1 rounded-full border border-white/[0.1] bg-[#00141f]/70 p-1">
          <button onClick={() => setFiltro('todos')} className={pill(filtro === 'todos')}>Todos</button>
          {CATEGORIAS.map(c => <button key={c.id} onClick={() => setFiltro(c.id)} className={pill(filtro === c.id)}>{c.nome}</button>)}
        </div>

        {membros === null && <p className="mt-10 text-[14px] text-white/45">A carregar…</p>}

        {membros && grupos.map(c => {
          const lista = membros.filter(m => m.categoria === c.id).sort((a, b) => Number(b.ativo) - Number(a.ativo))
          return (
            <section key={c.id} className="mt-10">
              <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.08] pb-3">
                <h2 className="rlp-t text-[28px] leading-none">{c.nome}</h2>
                <button onClick={() => { setErro(''); setForm(VAZIO(c.id)) }} className="rlp-m text-[10px] text-[#a9c1ff] hover:text-white">+ Adicionar</button>
              </div>
              {lista.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-dashed border-white/[0.14] bg-[#00141f]/50 px-6 py-6 text-center text-[13.5px] text-white/45">
                  Ainda ninguém nesta categoria.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {lista.map(m => (
                    <article key={m.id} className={`rounded-2xl border border-white/[0.1] bg-[#0c2236]/70 p-4 flex flex-col gap-3 ${m.ativo ? '' : 'opacity-50'}`}>
                      <div className="flex items-start gap-3.5">
                        <Link href={`/media/equipa/${m.id}`} className="flex min-w-0 flex-1 items-start gap-3.5 group">
                          {m.foto_url
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={m.foto_url} alt="" className="w-12 h-12 shrink-0 rounded-full object-cover" />
                            : <span className="rlp-t w-12 h-12 shrink-0 rounded-full flex items-center justify-center bg-[#2e6cf6] text-[17px]">{iniciais(m.nome)}</span>}
                          <span className="min-w-0 flex-1">
                            <span className="rlp-t block text-[20px] leading-tight truncate group-hover:text-[#a9c1ff]">{m.nome}</span>
                            <span className="rlp-m block mt-1 text-[9px] text-[#a9c1ff]">{m.ativo ? c.singular : 'Inativo'}</span>
                          </span>
                        </Link>
                        <Link href={`/media/equipa/${m.id}`} className="rlp-m shrink-0 text-[9.5px] text-white/45 hover:text-white">Ficha ›</Link>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-white/65">
                        {m.telefone && <a href={`tel:${m.telefone.replace(/\s/g, '')}`} className="hover:text-white">{m.telefone}</a>}
                        {m.email && <a href={`mailto:${m.email}`} className="hover:text-white truncate max-w-full">{m.email}</a>}
                        {m.instagram && <a href={`https://instagram.com/${insta(m.instagram)}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">@{insta(m.instagram)}</a>}
                      </div>
                      {m.notas && <p className="text-[12.5px] text-white/45">{m.notas}</p>}
                      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-white/[0.07] pt-3">
                        <span className="rlp-m text-[8.5px] text-white/35 mr-1">{m.projetos.length === 1 ? '1 projeto' : `${m.projetos.length} projetos`}</span>
                        {m.projetos.slice(0, 4).map(ref => (
                          <Link key={ref} href={`/portal-media/${ref}/equipa`} className="rounded-full border border-white/[0.12] px-2.5 py-0.5 text-[11px] text-white/60 hover:text-white hover:border-[#2e6cf6]">{ref}</Link>
                        ))}
                        {m.projetos.length > 4 && <span className="text-[11px] text-white/40">+{m.projetos.length - 4}</span>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {/* formulário: novo / editar */}
      {form && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-6" onClick={() => setForm(null)}>
          <div onClick={e => e.stopPropagation()}
            className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/[0.12] bg-[#00141f] p-5 sm:p-6 grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="rlp-t text-[26px]">{form.id ? 'Editar membro' : 'Novo membro'}</h2>
              <button onClick={() => setForm(null)} aria-label="Fechar" className="text-white/45 hover:text-white">✕</button>
            </div>
            <input className={INPUT} placeholder="Nome" autoFocus value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIAS.map(c => <button key={c.id} type="button" onClick={() => setForm({ ...form, categoria: c.id })} className={chip(form.categoria === c.id)}>{c.singular}</button>)}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={INPUT} placeholder="Telemóvel" inputMode="tel" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
              <input className={INPUT} placeholder="Email" inputMode="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <input className={INPUT} placeholder="Instagram (opcional)" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} />
            <textarea className={INPUT + ' min-h-[80px]'} placeholder="Notas (equipamento, valor por dia, zona...)" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
            {erro && <p className="text-[13px] text-[#ff8a8a]">{erro}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {form.id ? (
                <span className="flex gap-3">
                  <button type="button" onClick={() => { const m = membros?.find(x => x.id === form.id); if (m) { alternarAtivo(m); setForm(null) } }}
                    className="text-[12.5px] text-white/55 hover:text-white">
                    {membros?.find(x => x.id === form.id)?.ativo ? 'Marcar inativo' : 'Marcar ativo'}
                  </button>
                  <button type="button" onClick={() => { const m = membros?.find(x => x.id === form.id); if (m) apagar(m) }}
                    className="text-[12.5px] text-white/55 hover:text-[#ff4747]">Apagar</button>
                </span>
              ) : <span />}
              <button type="button" onClick={gravar} disabled={aGravar}
                className="rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-6 py-2.5 text-[13.5px] font-medium disabled:opacity-50">
                {aGravar ? 'A gravar…' : form.id ? 'Gravar' : 'Criar e abrir ficha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
