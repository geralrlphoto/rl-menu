'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DIAS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function fmtDate(d: string | null) {
  if (!d) return '—'
  const [y,m,dd] = d.split('-').map(Number)
  const dt = new Date(y, m-1, dd)
  return `${String(dd).padStart(2,'0')} ${MESES[m-1]} ${y} · ${DIAS[dt.getDay()]}`
}
function daysUntil(d: string | null) {
  if (!d) return null
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.round((new Date(d+'T00:00:00').getTime() - today.getTime()) / 86400000)
}

type Freelancer = { id: string; nome: string; status: string | null }
type Casamento  = { id: string; local: string; data_casamento: string | null; equipa_foto: string[] | null; videografo: string | null; briefing_url: string | null; data_confirmada: boolean | null }
type Edicao     = {
  id: string; nome: string; status: string; data_casamento: string | null
  data_entrega: string | null; data_final_entrega: string | null; local: string | null
  convidados: number | null; cerimonia: number | null; detalhes: number | null
  sala_animacao: number | null; fotos_album: number | null; bolo_bouquet: number | null
  sessao_noivos: number | null; fotos_noiva: number | null; fotos_noivo: number | null
}
type Album      = { id: string; nome: string; status: string; data_casamento: string | null; referencia_album: string | null }

const STATUS_EDICAO_STYLE: Record<string, string> = {
  'NOVO TRABALHO': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'EM EDIÇÃO':     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'CONCLUÍDO':     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}
const STATUS_ALBUM_STYLE: Record<string, string> = {
  'AGUARDAR':      'bg-white/10 text-white/40 border-white/20',
  'EM EDIÇÃO':     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'EM APROVAÇÃO':  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'APROVADO':      'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'ENTREGUE':      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

// ── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ id, onAuth }: { id: string; onAuth: () => void }) {
  const [pw, setPw]       = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pw.trim()) return
    setLoading(true); setError('')
    const d = await fetch('/api/freelancer-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password: pw.trim() }),
    }).then(r => r.json())
    setLoading(false)
    if (d.ok) {
      sessionStorage.setItem(`freelancerAuth_${id}`, 'true')
      onAuth()
    } else {
      setError('Password incorreta. Tenta novamente.')
      setPw('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0a]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-3">RL PHOTO.VIDEO</p>
          <h1 className="text-2xl font-light tracking-[0.2em] text-white uppercase">Área do Freelancer</h1>
          <div className="mt-4 h-px w-8 bg-gold/50 mx-auto" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-2">Password de Acesso</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              autoFocus
              placeholder="••••••••"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-gold/40 transition-colors placeholder:text-white/15"
            />
          </div>
          {error && <p className="text-xs text-red-400/80">{error}</p>}
          <button
            type="submit"
            disabled={loading || !pw.trim()}
            className="w-full py-3 rounded-xl bg-gold text-black font-bold text-sm tracking-widest hover:bg-gold/80 transition-all disabled:opacity-40 uppercase"
          >
            {loading ? 'A verificar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Edicao Modal ──────────────────────────────────────────────────────────────
const FOTO_FIELDS: { key: keyof Edicao; label: string }[] = [
  { key: 'convidados',    label: 'Convidados' },
  { key: 'cerimonia',     label: 'Cerimónia' },
  { key: 'detalhes',      label: 'Detalhes' },
  { key: 'sala_animacao', label: 'Sala/Animação' },
  { key: 'fotos_album',   label: 'Álbum' },
  { key: 'bolo_bouquet',  label: 'Bolo/Bouquet' },
  { key: 'sessao_noivos', label: 'Sessão Noivos' },
  { key: 'fotos_noiva',   label: 'Fotos Noiva' },
  { key: 'fotos_noivo',   label: 'Fotos Noivo' },
]

function EdicaoModal({ e, onClose }: { e: Edicao; onClose: () => void }) {
  const hasCounts = FOTO_FIELDS.some(f => e[f.key] != null)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative z-10 bg-[#111] border border-white/[0.08] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="h-0.5 w-full bg-gold/60" />
        {/* Header */}
        <div className="px-7 pt-6 pb-5 border-b border-white/[0.05] flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] tracking-[0.4em] text-white/20 uppercase mb-1">Edição de Fotos</p>
            <h2 className="text-xl font-light tracking-[0.1em] text-white uppercase">{e.nome}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {e.data_casamento && <p className="text-xs text-white/35">{fmtDate(e.data_casamento).split(' · ')[0]}</p>}
              {e.local && <p className="text-xs text-white/25">📍 {e.local}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[9px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-medium ${STATUS_EDICAO_STYLE[e.status] ?? 'bg-white/5 text-white/30 border-white/10'}`}>
              {e.status}
            </span>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-all text-sm">✕</button>
          </div>
        </div>
        {/* Body */}
        <div className="px-7 py-5 space-y-5">
          {/* Datas */}
          {(e.data_entrega || e.data_final_entrega) && (
            <div className="grid grid-cols-2 gap-3">
              {e.data_entrega && (
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl px-4 py-3">
                  <p className="text-[8px] tracking-[0.3em] text-white/20 uppercase mb-1">Data Entrega</p>
                  <p className="text-sm text-white/70">{fmtDate(e.data_entrega).split(' · ')[0]}</p>
                </div>
              )}
              {e.data_final_entrega && (
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl px-4 py-3">
                  <p className="text-[8px] tracking-[0.3em] text-white/20 uppercase mb-1">Entrega Final</p>
                  <p className="text-sm text-white/70">{fmtDate(e.data_final_entrega).split(' · ')[0]}</p>
                </div>
              )}
            </div>
          )}
          {/* Contagem de fotos */}
          <div>
            <p className="text-[9px] tracking-[0.35em] text-white/20 uppercase mb-3">Contagem de Fotos</p>
            <div className="grid grid-cols-3 gap-2">
              {FOTO_FIELDS.map(({ key, label }) => (
                <div key={key} className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-2.5">
                  <p className="text-[8px] tracking-[0.2em] text-white/20 uppercase mb-1">{label}</p>
                  <p className="text-xl font-light text-white/80">{e[key] != null ? String(e[key]) : <span className="text-white/15 text-sm">—</span>}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const STATUS_EDICAO_ORDER = ['NOVO TRABALHO', 'EM EDIÇÃO', 'CONCLUÍDO']

function EdicaoCard({ e }: { e: Edicao }) {
  const [open, setOpen] = useState(false)
  const hasCounts = FOTO_FIELDS.some(f => e[f.key] != null)
  return (
    <>
      <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-2">
        <p className="text-xs font-semibold text-white/80 leading-tight">{e.nome}</p>
        {e.data_casamento && <p className="text-[10px] text-white/30">{fmtDate(e.data_casamento).split(' · ')[0]}</p>}
        {e.local && <p className="text-[10px] text-white/25">📍 {e.local}</p>}
        {e.data_entrega && <p className="text-[10px] text-white/25">Entrega: {fmtDate(e.data_entrega).split(' · ')[0]}</p>}
        {hasCounts && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-white/[0.04]">
            {FOTO_FIELDS.filter(f => e[f.key] != null).map(({ key, label }) => (
              <span key={key} className="text-[9px] bg-white/[0.04] text-white/35 px-1.5 py-0.5 rounded">
                {label.split('/')[0].trim().slice(0,3)}: {e[key] as number}
              </span>
            ))}
          </div>
        )}
        <div className="pt-1">
          <button onClick={() => setOpen(true)}
            className="text-[9px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-lg border border-gold/30 bg-gold/5 text-gold/70 hover:text-gold hover:border-gold/50 hover:bg-gold/10 transition-all">
            Ver Mais
          </button>
        </div>
      </div>
      {open && <EdicaoModal e={e} onClose={() => setOpen(false)} />}
    </>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function FreelancerViewPage() {
  const { id } = useParams<{ id: string }>()
  const [authed, setAuthed]         = useState(false)
  const [checkingAuth, setChecking] = useState(true)
  const [freelancer, setFreelancer] = useState<Freelancer | null>(null)
  const [casamentos, setCasamentos] = useState<Casamento[]>([])
  const [edicao, setEdicao]         = useState<Edicao[]>([])
  const [album, setAlbum]           = useState<Album[]>([])
  const [loading, setLoading]       = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  // Check session
  useEffect(() => {
    const ok = sessionStorage.getItem(`freelancerAuth_${id}`) === 'true'
    setAuthed(ok)
    setChecking(false)
  }, [id])

  const loadData = useCallback(async () => {
    setLoading(true)
    const [fRes, cRes, eRes, aRes] = await Promise.all([
      fetch(`/api/freelancers`).then(r => r.json()),
      fetch(`/api/freelancer-casamentos?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-edicao?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-album?freelancer_id=${id}`).then(r => r.json()),
    ])
    const f = (fRes.freelancers ?? []).find((x: Freelancer) => x.id === id) ?? null
    setFreelancer(f)
    setCasamentos(cRes.casamentos ?? [])
    setEdicao(eRes.edicao ?? [])
    setAlbum(aRes.album ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { if (authed) loadData() }, [authed, loadData])

  async function handleConfirmar(casamentoId: string) {
    setConfirmingId(casamentoId)
    await fetch('/api/freelancer-casamentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: casamentoId, data_confirmada: true }),
    })
    setCasamentos(prev => prev.map(c => c.id === casamentoId ? { ...c, data_confirmada: true } : c))
    setConfirmingId(null)
  }

  if (checkingAuth) return null
  if (!authed) return <PasswordGate id={id} onAuth={() => { setAuthed(true) }} />

  const isFotografo = freelancer?.status === 'FOTOGRAFO'
  const upcoming = casamentos
    .filter(c => c.data_casamento && (daysUntil(c.data_casamento) ?? -1) >= 0)
    .sort((a,b) => (a.data_casamento ?? '') < (b.data_casamento ?? '') ? -1 : 1)
  const past = casamentos
    .filter(c => !c.data_casamento || (daysUntil(c.data_casamento) ?? 1) < 0)
    .sort((a,b) => (a.data_casamento ?? '') > (b.data_casamento ?? '') ? -1 : 1)

  return (
    <main className="min-h-screen px-4 py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-3">RL PHOTO.VIDEO · Área do Freelancer</p>
        {loading ? (
          <p className="text-white/20 text-xs tracking-widest uppercase">A carregar...</p>
        ) : (
          <>
            <h1 className="text-3xl font-light tracking-[0.15em] text-white uppercase">{freelancer?.nome ?? '—'}</h1>
            {freelancer?.status && (
              <span className="inline-block mt-2 text-[9px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-semibold bg-gold/10 text-gold border-gold/30">
                {freelancer.status}
              </span>
            )}
            <div className="mt-4 h-px w-12 bg-gold/50" />
          </>
        )}
      </div>

      {!loading && (
        <div className="space-y-10">

          {/* ── Próximos Casamentos ── */}
          <section>
            <p className="text-[9px] tracking-[0.4em] text-white/25 uppercase mb-4">Próximos Casamentos ({upcoming.length})</p>
            {upcoming.length === 0 ? (
              <p className="text-white/15 text-xs tracking-widest">Sem casamentos futuros.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map(c => {
                  const days = daysUntil(c.data_casamento)
                  return (
                    <div key={c.id} className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-base font-light tracking-wider text-white uppercase">{c.local || '—'}</p>
                          <p className="text-xs text-white/40 mt-0.5">{fmtDate(c.data_casamento)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {days !== null && (
                            <span className={`text-[10px] px-2.5 py-1 rounded-full border tracking-widest font-medium ${days <= 7 ? 'bg-red-500/15 text-red-400 border-red-500/30' : days <= 30 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' : 'bg-white/5 text-white/30 border-white/10'}`}>
                              {days === 0 ? 'HOJE' : `${days}d`}
                            </span>
                          )}
                          {c.data_confirmada ? (
                            <span className="text-[10px] px-2.5 py-1 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 tracking-widest">
                              ✓ Confirmado
                            </span>
                          ) : (
                            <button
                              onClick={() => handleConfirmar(c.id)}
                              disabled={confirmingId === c.id}
                              className="text-[10px] px-2.5 py-1 rounded-full border border-gold/30 bg-gold/10 text-gold tracking-widest hover:bg-gold/20 transition-all disabled:opacity-40 uppercase"
                            >
                              {confirmingId === c.id ? '...' : 'Confirmar Data'}
                            </button>
                          )}
                        </div>
                      </div>
                      {(c.equipa_foto?.length || c.videografo) && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.05]">
                          {c.equipa_foto?.map((m,i) => (
                            <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400/70 border border-yellow-500/20">📷 {m}</span>
                          ))}
                          {c.videografo && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20">🎥 {c.videografo}</span>
                          )}
                        </div>
                      )}
                      {c.briefing_url && (
                        <a href={c.briefing_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all tracking-widest uppercase">
                          Ver Briefing ›
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* ── Edição de Fotos — kanban read-only ── */}
          {edicao.length > 0 && (
            <section>
              <p className="text-[9px] tracking-[0.4em] text-white/25 uppercase mb-4">Edição de Fotos ({edicao.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {STATUS_EDICAO_ORDER.map(status => {
                  const jobs = edicao.filter(e => e.status === status)
                  return (
                    <div key={status} className="space-y-2">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-bold tracking-widest uppercase ${STATUS_EDICAO_STYLE[status] ?? 'bg-white/5 text-white/30 border-white/10'}`}>
                        <span>{status}</span>
                        <span className="ml-auto opacity-60">({jobs.length})</span>
                      </div>
                      {jobs.map(e => <EdicaoCard key={e.id} e={e} />)}
                      {jobs.length === 0 && (
                        <p className="text-[9px] text-white/15 text-center py-4 tracking-widest">—</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Edição de Álbum (fotografos) ── */}
          {isFotografo && album.length > 0 && (
            <section>
              <p className="text-[9px] tracking-[0.4em] text-white/25 uppercase mb-4">Edição de Álbum ({album.length})</p>
              <div className="space-y-2">
                {album.map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div>
                      <p className="text-sm text-white/80">{a.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {a.data_casamento && <p className="text-[10px] text-white/30">{fmtDate(a.data_casamento).split(' · ')[0]}</p>}
                        {a.referencia_album && <span className="text-[9px] text-gold/50 font-mono">{a.referencia_album}</span>}
                      </div>
                    </div>
                    <span className={`text-[9px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-medium shrink-0 ${STATUS_ALBUM_STYLE[a.status] ?? 'bg-white/5 text-white/30 border-white/10'}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Casamentos Passados ── */}
          {past.length > 0 && (
            <section>
              <p className="text-[9px] tracking-[0.4em] text-white/25 uppercase mb-4">Casamentos Anteriores ({past.length})</p>
              <div className="space-y-2">
                {past.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/[0.04] bg-white/[0.01] opacity-60">
                    <div>
                      <p className="text-sm text-white/60">{c.local || '—'}</p>
                      <p className="text-[10px] text-white/25 mt-0.5">{fmtDate(c.data_casamento).split(' · ')[0]}</p>
                    </div>
                    {c.data_confirmada && (
                      <span className="text-[9px] text-emerald-400/50">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </main>
  )
}
