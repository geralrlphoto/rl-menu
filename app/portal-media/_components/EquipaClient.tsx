'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CATEGORIAS } from '@/app/media/equipa/categorias'

// Equipa do projeto, só para o admin. Mostra todo o staff da RL PROD (/media/equipa):
// um clique põe a pessoa no projeto, outro clique tira. Pessoas de fora do staff
// entram pelo formulário. Grava em media_equipa_projeto via /api/media-equipa.

type Membro = { id: string; nome: string; funcao: string; contacto?: string | null; notas?: string | null; membro_id?: string | null }
type Pessoa = { id: string; nome: string; categoria: string; funcao: string; contacto?: string | null; foto_url?: string | null }

const FUNCOES = ['Videógrafo', 'Diretor Criativo', 'Fotógrafo', 'Editor', 'Assistente', 'Drone', 'Som']
const iniciais = (n: string) => n.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()

export default function EquipaClient({ portalRef, nome }: { portalRef: string; nome: string }) {
  const [equipa, setEquipa] = useState<Membro[] | null>(null)
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [aMudar, setAMudar] = useState<string | null>(null)
  const [deFora, setDeFora] = useState(false)
  const [form, setForm] = useState({ nome: '', funcao: FUNCOES[0], contacto: '', notas: '' })
  const [aGravar, setAGravar] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch(`/api/media-equipa?projeto=${encodeURIComponent(portalRef)}`)
      .then(r => r.json())
      .then(d => { setEquipa(d.equipa ?? []); setPessoas(d.pessoas ?? []) })
      .catch(() => setEquipa([]))
  }, [portalRef])

  const ligacao = (p: Pessoa) => (equipa ?? []).find(m => m.membro_id === p.id)

  // Um clique: entra no projeto (ou sai, se já lá estava)
  async function alternar(p: Pessoa) {
    if (aMudar) return
    setAMudar(p.id)
    const atual = ligacao(p)
    try {
      if (atual) {
        const r = await fetch(`/api/media-equipa?id=${atual.id}`, { method: 'DELETE' })
        if (r.ok) setEquipa(e => (e ?? []).filter(x => x.id !== atual.id))
      } else {
        const r = await fetch('/api/media-equipa', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projeto_ref: portalRef, nome: p.nome, funcao: p.funcao, contacto: p.contacto, membro_id: p.id }),
        })
        const d = await r.json()
        if (r.ok) setEquipa(e => [...(e ?? []), d.membro])
        else alert(d.error || 'Não foi possível pôr no projeto.')
      }
    } catch { alert('Erro de ligação.') }
    setAMudar(null)
  }

  async function nomearDeFora() {
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
      setDeFora(false)
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
  const fotoDe = (m: Membro) => pessoas.find(p => p.id === m.membro_id)?.foto_url

  const Avatar = ({ nome, foto, tam = 'w-14 h-14 text-[18px]' }: { nome: string; foto?: string | null; tam?: string }) => foto
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={foto} alt="" className={`${tam} shrink-0 rounded-full object-cover`} />
    : <span className={`rlp-t ${tam} shrink-0 rounded-full flex items-center justify-center bg-[#2e6cf6]/80 text-white`}>{iniciais(nome)}</span>

  return (
    <div className="rlp relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
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
            Clica em quem vai trabalhar neste projeto. Clica outra vez para tirar. Só a RL PROD vê esta página.
          </p>
        </div>
        <span className="rlp-m shrink-0 inline-flex items-center gap-2 rounded-full border border-[#a9c1ff]/60 px-3 py-1.5 text-[9px] text-[#a9c1ff]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a9c1ff] shrink-0" />
          Interno
        </span>
      </header>

      {/* Equipa escolhida */}
      <section className="mb-10 rounded-2xl border border-[#2e6cf6]/40 bg-[#00141f]/75 p-4 sm:p-5">
        <p className="rlp-m text-[10px] text-[#a9c1ff]">No projeto{equipa ? ` · ${equipa.length}` : ''}</p>
        {equipa === null && <p className="mt-3 text-[14px] text-white/45">A carregar…</p>}
        {equipa && equipa.length === 0 && <p className="mt-3 text-[14px] text-white/50">Ainda ninguém. Escolhe abaixo.</p>}
        {equipa && equipa.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {equipa.map(m => (
              <span key={m.id} className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.12] bg-[#0c2236]/80 py-1 pl-1 pr-3">
                <Avatar nome={m.nome} foto={fotoDe(m)} tam="w-8 h-8 text-[11px]" />
                <span className="min-w-0">
                  {m.membro_id
                    ? <Link href={`/media/equipa/${m.membro_id}`} className="block text-[13.5px] leading-tight text-white hover:text-[#a9c1ff]">{m.nome}</Link>
                    : <span className="block text-[13.5px] leading-tight text-white">{m.nome}</span>}
                  <span className="block text-[11px] leading-tight text-white/45">{m.funcao}{m.membro_id ? '' : ' · de fora'}</span>
                </span>
                <button type="button" onClick={() => remover(m)} aria-label={`Tirar ${m.nome}`} className="ml-1 text-white/30 hover:text-[#ff4747] text-[12px]">✕</button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Todo o staff, por categoria */}
      {equipa && pessoas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/[0.14] bg-[#00141f]/50 px-6 py-10 text-center text-[14px] text-white/55">
          Ainda não há staff registado. <Link href="/media/equipa" className="text-[#5a8bff] hover:text-white">Adicionar pessoas à equipa RL PROD ›</Link>
        </div>
      )}
      {equipa && CATEGORIAS.map(c => {
        const lista = pessoas.filter(p => p.categoria === c.id)
        if (lista.length === 0) return null
        return (
          <section key={c.id} className="mb-8">
            <h2 className="rlp-t text-[22px] leading-none border-b border-white/[0.08] pb-2.5 mb-3">{c.nome}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {lista.map(p => {
                const dentro = !!ligacao(p)
                return (
                  <button key={p.id} type="button" onClick={() => alternar(p)} disabled={aMudar === p.id}
                    className={`relative flex flex-col items-center gap-2.5 rounded-2xl border px-3 py-4 text-center transition-colors disabled:opacity-60
                      ${dentro ? 'border-[#2e6cf6] bg-[#2e6cf6]/20' : 'border-white/[0.1] bg-[#0c2236]/70 hover:border-white/30'}`}>
                    <span className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-[12px] border
                      ${dentro ? 'bg-[#2e6cf6] border-[#2e6cf6] text-white' : 'border-white/25 text-transparent'}`}>✓</span>
                    <Avatar nome={p.nome} foto={p.foto_url} />
                    <span className="min-w-0 w-full">
                      <span className="rlp-t block truncate text-[16px] leading-tight">{p.nome}</span>
                      <span className={`rlp-m block mt-1 text-[8.5px] ${dentro ? 'text-[#a9c1ff]' : 'text-white/40'}`}>
                        {aMudar === p.id ? 'A gravar…' : dentro ? 'No projeto' : 'Adicionar'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Pessoa de fora do staff */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setDeFora(a => !a)} className="rlp-m text-[10px] text-[#a9c1ff] hover:text-white">
          {deFora ? '− Fechar' : '+ Pessoa de fora do staff'}
        </button>
        <Link href="/media/equipa" className="text-[12.5px] text-white/50 hover:text-white">Gerir equipa RL PROD ›</Link>
      </div>
      {deFora && (
        <section className="mt-3 rounded-2xl border border-dashed border-[#a9c1ff]/40 bg-[#00141f]/70 p-4 sm:p-6 grid gap-3">
          <input className={INPUT} placeholder="Nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          <div className="flex flex-wrap gap-1.5">
            {FUNCOES.map(f => <button key={f} type="button" onClick={() => setForm(x => ({ ...x, funcao: f }))} className={chip(form.funcao === f)}>{f}</button>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={INPUT} placeholder="Telemóvel ou email (opcional)" value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))} />
            <input className={INPUT} placeholder="Notas (ex.: só no dia 12)" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
          </div>
          {erro && <p className="text-[13px] text-[#ff8a8a]">{erro}</p>}
          <div className="flex justify-end">
            <button type="button" onClick={nomearDeFora} disabled={aGravar}
              className="rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-5 py-2.5 text-[14px] font-medium disabled:opacity-50">
              {aGravar ? 'A gravar…' : 'Pôr no projeto'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
