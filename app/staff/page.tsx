'use client'

// Gestão › Staff. As pessoas da RL que aparecem nos emails aos noivos: por cima do
// bilhete, foto redonda, nome e função. Cada pessoa fica "responsável" por alguns
// emails (lib/staff.ts); cada email tem no máximo uma pessoa.
// Dados: /api/staff. Imagem nos emails: /api/staff/cartao?email=<chave>.

import { useEffect, useState } from 'react'
import { EMAILS_NOIVOS } from '@/lib/staff'

const OURO = '#C9A84C'
type Pessoa = { id: string; nome: string; funcao: string; foto_url: string | null; emails: string[]; ordem: number; ativo: boolean }
type Rascunho = Omit<Pessoa, 'id' | 'ordem' | 'ativo'> & { id?: string }
const NOME_EMAIL = Object.fromEntries(EMAILS_NOIVOS.flatMap(g => g.emails.map(e => [e.chave, e.nome])))

function Editor({ p, todos, onFechar, onGuardado }: { p: Rascunho; todos: Pessoa[]; onFechar: () => void; onGuardado: () => void }) {
  const [r, setR] = useState<Rascunho>(p)
  const [aGuardar, setAGuardar] = useState(false)
  const [aCarregar, setACarregar] = useState(false)
  const dono = (chave: string) => todos.find(t => t.id !== r.id && t.emails.includes(chave))
  const alternar = (chave: string) => setR(x => ({ ...x, emails: x.emails.includes(chave) ? x.emails.filter(e => e !== chave) : [...x.emails, chave] }))

  async function carregarFoto(f: File) {
    setACarregar(true)
    const fd = new FormData(); fd.append('file', f)
    const res = await fetch('/api/upload-image', { method: 'POST', body: fd }).then(x => x.json()).catch(() => null)
    setACarregar(false)
    const url = res?.url ?? res?.publicUrl ?? null
    if (url) setR(x => ({ ...x, foto_url: url })); else alert('Não foi possível carregar a foto.')
  }
  async function guardar() {
    if (!r.nome.trim()) { alert('Falta o nome.'); return }
    setAGuardar(true)
    const res = await fetch('/api/staff', { method: r.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) }).catch(() => null)
    setAGuardar(false)
    if (!res?.ok) { alert('Não foi possível guardar.'); return }
    onGuardado()
  }
  async function apagar() {
    if (!r.id || !window.confirm(`Apagar ${r.nome}? Os emails dela ficam sem responsável.`)) return
    await fetch(`/api/staff?id=${r.id}`, { method: 'DELETE' }).catch(() => null)
    onGuardado()
  }

  return (
    <div role="dialog" aria-modal="true" onClick={onFechar} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[22px] border border-[#C9A84C]/35 bg-[#0e0e0e] p-6" style={{ borderLeft: `2px solid ${OURO}` }}>
        <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>{r.id ? 'Editar' : 'Nova pessoa'}</p>
        <div className="mt-4 flex flex-wrap items-center gap-5">
          <label className="relative w-24 h-24 rounded-full border-2 overflow-hidden flex items-center justify-center cursor-pointer bg-[#1a1712]" style={{ borderColor: OURO }}>
            {r.foto_url ? <img src={r.foto_url} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl" style={{ color: OURO }}>{r.nome.trim().charAt(0).toUpperCase() || '+'}</span>}
            <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[9px] tracking-[0.15em] uppercase text-center py-1 text-white/80">{aCarregar ? 'A carregar…' : 'Foto'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) carregarFoto(f) }} />
          </label>
          <div className="flex-1 min-w-[220px] flex flex-col gap-3">
            <input value={r.nome} onChange={e => setR(x => ({ ...x, nome: e.target.value }))} placeholder="Nome (ex.: Rui Lopes)"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[15px] text-white outline-none focus:border-[#C9A84C]/60" />
            <input value={r.funcao} onChange={e => setR(x => ({ ...x, funcao: e.target.value }))} placeholder="Função (ex.: Diretor de Fotografia)"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[14px] text-white outline-none focus:border-[#C9A84C]/60" />
          </div>
        </div>

        <p className="mt-6 text-[11px] font-semibold tracking-[0.25em] uppercase text-white/50">Responsável pelos emails aos noivos</p>
        <p className="mt-1 text-[12px] text-white/40">Nestes emails, por cima do bilhete, aparece esta pessoa. Cada email só tem uma pessoa: se escolheres um que já tem dono, passa para aqui.</p>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          {EMAILS_NOIVOS.map(g => (
            <div key={g.grupo} className="rounded-[14px] border border-white/[0.08] bg-[#141414] p-3">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: OURO }}>{g.grupo}</p>
              <div className="mt-2 flex flex-col gap-1.5">
                {g.emails.map(e => {
                  const d = dono(e.chave)
                  return (
                    <label key={e.chave} className="flex items-start gap-2 text-[13px] text-white/80 cursor-pointer">
                      <input type="checkbox" checked={r.emails.includes(e.chave)} onChange={() => alternar(e.chave)} className="mt-0.5 accent-[#C9A84C]" />
                      <span>{e.nome}{d && !r.emails.includes(e.chave) ? <span className="text-white/35"> · {d.nome}</span> : null}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {r.id && <button type="button" onClick={apagar} className="mr-auto rounded-full border border-red-400/30 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-red-300/80 hover:text-red-300">Apagar</button>}
          <button type="button" onClick={onFechar} className="rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/55 hover:text-white">Cancelar</button>
          <button type="button" disabled={aGuardar} onClick={guardar} className="rounded-full border border-[#4ade80]/50 bg-[#4ade80]/10 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-[#4ade80] hover:bg-[#4ade80]/20 disabled:opacity-40">{aGuardar ? 'A guardar…' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  )
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Pessoa[] | null>(null)
  const [aEditar, setAEditar] = useState<Rascunho | null>(null)
  const [versao, setVersao] = useState(0)   // atualiza a imagem de exemplo depois de guardar
  const carregar = () => { fetch('/api/staff').then(r => r.json()).then(d => { setStaff(d.staff ?? []); setVersao(v => v + 1) }).catch(() => setStaff([])) }
  useEffect(carregar, [])
  const comDono = new Set((staff ?? []).flatMap(s => s.emails))
  const semDono = EMAILS_NOIVOS.flatMap(g => g.emails).filter(e => !comDono.has(e.chave))

  return (
    <main className="min-h-screen bg-[#070707] text-white font-cond overflow-x-clip">
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 70% at 85% 10%, rgba(201,168,76,0.12), transparent 70%)' }} />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-24 pb-12">
          <p className="text-[13px] font-bold tracking-[0.5em] uppercase" style={{ color: OURO }}>Gestão</p>
          <h1 className="mt-3 font-bold uppercase leading-[0.9] text-[52px] sm:text-[88px] lg:text-[110px]">Staff</h1>
          <div className="mt-5 flex items-center gap-4">
            <span className="w-12 h-px" style={{ background: OURO }} />
            <span className="text-sm tracking-[0.22em] uppercase text-white/60">Quem os noivos veem em cada email: várias pessoas, vários departamentos</span>
          </div>
          <button type="button" onClick={() => setAEditar({ nome: '', funcao: '', foto_url: null, emails: [] })}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/45 bg-[#0e0e0e]/90 px-5 py-2.5 text-[15px] font-semibold text-white hover:border-[#C9A84C]/80">
            + Nova pessoa
          </button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 flex flex-col gap-10">
        {staff && !staff.length && <p className="text-white/45">Ainda não há ninguém. Carrega em “Nova pessoa” e escolhe de que emails fica responsável.</p>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(staff ?? []).map(s => (
            <button key={s.id} type="button" onClick={() => setAEditar(s)}
              className="text-left rounded-[22px] border border-white/[0.08] bg-[#111111]/90 p-6 flex flex-col items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#C9A84C]/45" style={{ borderTop: `2px solid ${OURO}` }}>
              <div className="w-24 h-24 rounded-full border-2 overflow-hidden flex items-center justify-center bg-[#1a1712]" style={{ borderColor: OURO }}>
                {s.foto_url ? <img src={s.foto_url} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl" style={{ color: OURO }}>{s.nome.charAt(0).toUpperCase()}</span>}
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold">{s.nome}</p>
                <p className="text-[11px] tracking-[0.25em] uppercase mt-1" style={{ color: OURO }}>{s.funcao || 'Sem função'}</p>
              </div>
              <div className="w-full mt-2 border-t border-white/[0.06] pt-3">
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 text-center">{s.emails.length} email{s.emails.length === 1 ? '' : 's'} aos noivos</p>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {s.emails.map(e => <span key={e} className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] text-white/65">{NOME_EMAIL[e] ?? e}</span>)}
                </div>
              </div>
            </button>
          ))}
        </div>

        {staff && staff.length > 0 && semDono.length > 0 && (
          <div className="rounded-[18px] border border-amber-300/25 bg-amber-300/[0.05] p-4">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-amber-300">Emails ainda sem responsável ({semDono.length})</p>
            <p className="mt-2 text-[13px] text-white/60">{semDono.map(e => e.nome).join(' · ')}</p>
          </div>
        )}

        <section>
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Como aparece</p>
          <p className="mt-1 text-sm text-white/45">Por cima do bilhete, fora da caixa. Exemplo com o email das fotos do dia:</p>
          <img src={`/api/staff/cartao?email=entrega-galerias&v=${versao}`} alt="" className="mt-4 w-full max-w-[520px] rounded-xl border border-white/[0.06]" />
        </section>
      </div>

      {aEditar && <Editor p={aEditar} todos={staff ?? []} onFechar={() => setAEditar(null)} onGuardado={() => { setAEditar(null); carregar() }} />}
    </main>
  )
}
