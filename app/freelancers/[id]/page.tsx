'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

type Freelancer = {
  id: string; nome: string; status: string | null; contato: string | null
  email: string | null; nome_sos: string | null; contato_sos: string | null; notas: string | null
  password: string | null; intro_casamentos: string | null; intro_home: string | null; intro_home_title: string | null; is_template: boolean | null; foto_url: string | null; guia_trabalho: string | null
}
type Casamento = {
  id: string; freelancer_id: string; local: string; data_casamento: string | null
  equipa_foto: string[] | null; videografo: string | null; briefing_url: string | null
  data_confirmada: boolean | null; order_index: number
}
type Edicao = {
  id: string; freelancer_id: string; nome: string; status: string; local: string | null
  data_casamento: string | null; data_entrega: string | null; data_final_entrega: string | null
  convidados: number | null; cerimonia: number | null; detalhes: number | null
  sala_animacao: number | null; fotos_album: number | null; bolo_bouquet: number | null
  sessao_noivos: number | null; fotos_noiva: number | null; fotos_noivo: number | null
  referencia: string | null
}
type Album = {
  id: string; freelancer_id: string; nome: string; status: string
  local: string | null; data_casamento: string | null; data_entrega: string | null
  fotos_album: string | null; texto_album: string | null; referencia_album: string | null
}
type Valor = {
  id: string; freelancer_id: string; servico: string; total_unidade: number
  valor_servico: number; kms: number; valor_ao_km: number; order_index: number
}
type Info = { id: string; freelancer_id: string; label: string | null; valor: string | null; order_index: number }
type Pagamento   = { id: string; freelancer_id: string; casamento_id: string | null; descricao: string; valor: number | null; data_prevista: string | null; data_pago: string | null; status: string; notas: string | null; created_at: string }
type Notificacao = { id: string; freelancer_id: string; titulo: string; mensagem: string | null; tipo: string; lida: boolean; created_at: string }
type Mensagem    = { id: string; freelancer_id: string; casamento_id: string | null; mensagem: string; remetente: string; lida_admin: boolean; lida_freelancer: boolean; created_at: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function totalValor(v: Valor) {
  return (v.total_unidade * v.valor_servico) + (v.kms * v.valor_ao_km)
}

const STATUS_EDICAO = ['NOVO TRABALHO', 'EM EDIÇÃO', 'CONCLUÍDO']
const STATUS_STYLE: Record<string, string> = {
  'NOVO TRABALHO': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'EM EDIÇÃO':     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'CONCLUÍDO':     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

const inputCls = "w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15 [color-scheme:dark]"
const selectCls = "w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold/40 transition-colors cursor-pointer [color-scheme:dark]"
const optStyle = { backgroundColor: '#1a1a1a', color: 'white' }
const labelCls = "block text-[9px] text-white/25 tracking-widest uppercase mb-1"

// ─── Password Display ─────────────────────────────────────────────────────────

function PasswordDisplay({ password, freelancerId }: { password: string | null; freelancerId: string }) {
  const [show, setShow]       = useState(false)
  const [test, setTest]       = useState('')
  const [result, setResult]   = useState<null | boolean>(null)
  const [testing, setTesting] = useState(false)

  async function handleTest() {
    if (!test.trim()) return
    setTesting(true); setResult(null)
    const d = await fetch('/api/freelancer-auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: freelancerId, password: test }),
    }).then(r => r.json())
    setResult(d.ok)
    setTesting(false)
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[9px] tracking-widest text-white/25 uppercase">Password:</span>
        <span className={`text-xs font-mono ${show ? 'text-white/70' : 'text-white/20'} transition-colors`}>
          {show ? (password ?? '—') : '••••••••'}
        </span>
        <button onClick={() => setShow(v => !v)} className="text-white/20 hover:text-white/60 transition-colors">
          {show
            ? <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            : <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          }
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={test} onChange={e => { setTest(e.target.value); setResult(null) }}
          placeholder="Testar password..."
          className="text-xs bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-white/70 outline-none focus:border-gold/30 w-40 placeholder:text-white/15"
        />
        <button onClick={handleTest} disabled={testing || !test.trim()}
          className="text-[9px] px-2.5 py-1.5 rounded-lg border border-white/15 text-white/40 hover:text-white/70 hover:border-white/30 transition-all disabled:opacity-30 uppercase tracking-widest">
          {testing ? '...' : 'Testar'}
        </button>
        {result === true  && <span className="text-[10px] text-emerald-400">✓ Correta</span>}
        {result === false && <span className="text-[10px] text-red-400">✗ Errada</span>}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FreelancerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<'casamentos'|'edicao'|'album'|'valores'|'info'|'notas'|'pagamentos'|'notificacoes'|'mensagens'|null>(null)
  const [editForm, setEditForm] = useState<{ nome: string; status: string; contato: string; email: string; nome_sos: string; contato_sos: string } | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [introHome, setIntroHome] = useState('')
  const [introHomeTitle, setIntroHomeTitle] = useState('')
  const [introHomeStatus, setIntroHomeStatus] = useState<'idle'|'saving'|'saved'>('idle')
  const introHomeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [guia, setGuia] = useState('')
  const [guiaStatus, setGuiaStatus] = useState<'idle'|'saving'|'saved'>('idle')
  const guiaTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [freelancer, setFreelancer] = useState<Freelancer | null>(null)
  const [casamentos, setCasamentos] = useState<Casamento[]>([])
  const [edicao, setEdicao] = useState<Edicao[]>([])
  const [album, setAlbum] = useState<Album[]>([])
  const [valores, setValores] = useState<Valor[]>([])
  const [info, setInfo] = useState<Info[]>([])
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [fRes, cRes, eRes, aRes, vRes, iRes, pRes, nRes, mRes] = await Promise.all([
      fetch(`/api/freelancers`).then(r => r.json()),
      fetch(`/api/freelancer-casamentos?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-edicao?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-album?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-valores?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-info?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-pagamentos?freelancer_id=${id}`).then(r => r.json()).catch(() => ({ pagamentos: [] })),
      fetch(`/api/freelancer-notificacoes?freelancer_id=${id}`).then(r => r.json()).catch(() => ({ notificacoes: [] })),
      fetch(`/api/freelancer-mensagens?freelancer_id=${id}`).then(r => r.json()).catch(() => ({ mensagens: [] })),
    ])
    const f = (fRes.freelancers ?? []).find((x: Freelancer) => x.id === id) ?? null
    setFreelancer(f)
    setIntroHome(f?.intro_home ?? '')
    setIntroHomeTitle(f?.intro_home_title ?? '')
    setGuia(f?.guia_trabalho ?? '')
    setCasamentos(cRes.casamentos ?? [])
    setEdicao(eRes.edicao ?? [])
    setAlbum(aRes.album ?? [])
    setValores(vRes.valores ?? [])
    setInfo(iRes.info ?? [])
    setPagamentos(pRes.pagamentos ?? [])
    setNotificacoes(nRes.notificacoes ?? [])
    setMensagens(mRes.mensagens ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-white/20 text-xs tracking-widest uppercase">A carregar...</p>
    </main>
  )

  if (!freelancer) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-red-400/50 text-sm">Freelancer não encontrado.</p>
    </main>
  )

  // Próximo casamento
  const upcoming = casamentos
    .filter(c => c.data_casamento && (daysUntil(c.data_casamento) ?? -1) >= 0)
    .sort((a,b) => (a.data_casamento ?? '') < (b.data_casamento ?? '') ? -1 : 1)[0] ?? null
  const dtu = upcoming ? daysUntil(upcoming.data_casamento) : null

  const isVideografo = freelancer?.status === 'VIDEOGRAFO'
  const isFotografo  = freelancer?.status === 'FOTOGRAFO'

  function handleIntroHomeChange(val: string) {
    setIntroHome(val)
    setIntroHomeStatus('saving')
    if (introHomeTimer.current) clearTimeout(introHomeTimer.current)
    introHomeTimer.current = setTimeout(async () => {
      await fetch('/api/freelancers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, intro_home: val }),
      })
      setIntroHomeStatus('saved')
      setTimeout(() => setIntroHomeStatus('idle'), 2000)
    }, 800)
  }

  function handleIntroHomeTitleChange(val: string) {
    setIntroHomeTitle(val)
    setIntroHomeStatus('saving')
    if (introHomeTimer.current) clearTimeout(introHomeTimer.current)
    introHomeTimer.current = setTimeout(async () => {
      await fetch('/api/freelancers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, intro_home_title: val }),
      })
      setIntroHomeStatus('saved')
      setTimeout(() => setIntroHomeStatus('idle'), 2000)
    }, 800)
  }

  function handleGuiaChange(val: string) {
    setGuia(val)
    setGuiaStatus('saving')
    if (guiaTimer.current) clearTimeout(guiaTimer.current)
    guiaTimer.current = setTimeout(async () => {
      await fetch('/api/freelancers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, guia_trabalho: val }),
      })
      setGuiaStatus('saved')
      setTimeout(() => setGuiaStatus('idle'), 2000)
    }, 800)
  }

  async function handlePhotoUpload(file: File) {
    setUploadingPhoto(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload-image', { method: 'POST', body: form }).then(r => r.json())
    if (res.url) {
      await fetch('/api/freelancers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, foto_url: res.url }),
      })
      await load()
    }
    setUploadingPhoto(false)
  }

  async function handleEditSave() {
    if (!editForm) return
    setEditSaving(true)
    await fetch('/api/freelancers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editForm }),
    })
    await load()
    setEditForm(null)
    setEditSaving(false)
  }

  const tabs: { key: 'casamentos'|'edicao'|'album'|'valores'|'info'|'notas'|'pagamentos'|'notificacoes'; label: string; count?: number }[] = [
    { key: 'casamentos',   label: 'Casamentos',  count: casamentos.length },
    ...(!isVideografo ? [{ key: 'edicao' as const, label: 'Edição Fotos', count: edicao.length }] : []),
    ...(isFotografo ? [{ key: 'album' as const, label: 'Edição Álbum', count: album.length }] : []),
    { key: 'valores',      label: 'Valores' },
    { key: 'info',         label: 'Info' },
    { key: 'notas',        label: 'Notas' },
    { key: 'pagamentos',   label: 'Pagamentos', count: pagamentos.length },
    { key: 'mensagens',    label: 'Msgs',   count: mensagens.filter(m => m.remetente === 'freelancer' && !m.lida_admin).length },
    { key: 'notificacoes', label: 'Notif.', count: notificacoes.filter(n => !n.lida).length },
  ]

  return (
    <main className="min-h-screen px-4 sm:px-8 py-8 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/freelancers" className="text-[10px] tracking-[0.3em] text-white/25 hover:text-white/50 uppercase transition-colors">
          ← Freelancers
        </Link>
        <div className="flex items-start justify-between mt-2 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-white uppercase">{freelancer.nome}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {freelancer.status && (
                <span className="text-[9px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-semibold bg-gold/10 text-gold border-gold/30">
                  {freelancer.status}
                </span>
              )}
              {freelancer.is_template && (
                <span className="text-[9px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-semibold bg-white/10 text-white border-white/30">
                  ⌘ Centro de Comando
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              {freelancer.contato && <a href={`tel:${freelancer.contato}`} className="text-xs text-white/40 hover:text-white/70 transition-colors">📞 {freelancer.contato}</a>}
              {freelancer.email && <a href={`mailto:${freelancer.email}`} className="text-xs text-white/40 hover:text-white/70 transition-colors">✉ {freelancer.email}</a>}
              {freelancer.nome_sos && <span className="text-xs text-white/25">SOS: {freelancer.nome_sos}{freelancer.contato_sos ? ` · ${freelancer.contato_sos}` : ''}</span>}
            </div>
            <PasswordDisplay password={freelancer.password} freelancerId={freelancer.id} />
          </div>
          {upcoming && (
            <div className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border ${dtu !== null && dtu <= 15 ? 'border-red-500/30 bg-red-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
              <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl ${dtu !== null && dtu <= 15 ? 'bg-red-500/15 border border-red-500/30' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                <span className={`text-lg font-bold leading-none ${dtu !== null && dtu <= 15 ? 'text-red-400' : 'text-emerald-400'}`}>{dtu === 0 ? '!' : dtu}</span>
                <span className={`text-[8px] uppercase tracking-wide ${dtu !== null && dtu <= 15 ? 'text-red-400/60' : 'text-emerald-400/60'}`}>{dtu === 0 ? 'HOJE' : 'd'}</span>
              </div>
              <div>
                <p className="text-[9px] text-white/25 uppercase tracking-widest mb-0.5">Próximo</p>
                <p className="text-sm font-semibold text-white/80 max-w-[160px] truncate">{upcoming.local}</p>
                <p className="text-[10px] text-white/35">{fmtDate(upcoming.data_casamento).split(' · ')[0]}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 relative flex items-center gap-1">
        <button onClick={() => { const el = document.getElementById('admin-tab-scroll'); if (el) el.scrollBy({ left: -160, behavior: 'smooth' }) }}
          className="flex-shrink-0 w-7 h-8 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors text-base">‹</button>
        <div id="admin-tab-scroll" className="flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-white/30 bg-black w-max min-w-full"
          style={{ boxShadow: '0 0 18px 3px rgba(255,255,255,0.10), 0 0 6px 1px rgba(255,255,255,0.15), inset 0 0 18px 0 rgba(255,255,255,0.03)' }}>
          {/* Botão casa */}
          <button onClick={() => { setTab(null); setEditForm(null) }}
            className={`flex-shrink-0 flex items-center justify-center px-4 py-2.5 rounded-xl text-xl transition-all ${
              tab === null
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-white/40 hover:text-white/70 border border-transparent'
            }`}>
            ⌂
          </button>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[9px] tracking-[0.25em] uppercase font-semibold transition-all ${
                tab === t.key
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-white/30 hover:text-white/55 border border-transparent'
              }`}>
              {t.label}
              {t.count != null && t.count > 0 && (
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold transition-all ${
                  tab === t.key ? 'bg-white/15 text-white/80' : 'bg-white/[0.06] text-white/25'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
        </div>
        <button onClick={() => { const el = document.getElementById('admin-tab-scroll'); if (el) el.scrollBy({ left: 160, behavior: 'smooth' }) }}
          className="flex-shrink-0 w-7 h-8 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors text-base">›</button>
      </div>

      {/* Home */}
      {tab === null && (
        <div className="max-w-2xl">

          {/* ── Pré-visualização igual ao portal ── */}
          {(introHomeTitle || introHome) && (
            <div className="mb-6 px-2 py-6 space-y-2">
              {introHomeTitle && <p className="text-[22px] font-semibold text-white">{introHomeTitle}</p>}
              {introHome && <p className="text-[16px] text-white leading-relaxed whitespace-pre-wrap">{introHome}</p>}
            </div>
          )}

          {/* ── Controlos admin ── */}
          <div className="border-t border-white/[0.06] pt-5 space-y-4">

            {/* Foto de perfil */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-[10px] tracking-[0.3em] text-white/25 uppercase mb-4">Foto de Perfil</p>
              <div className="flex items-center gap-5">
                {freelancer.foto_url ? (
                  <div className="relative w-24 h-28 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10"
                    style={{ boxShadow: '0 0 16px 2px rgba(200,100,50,0.25)' }}>
                    <img src={freelancer.foto_url} alt={freelancer.nome} className="w-full h-full object-cover grayscale" />
                  </div>
                ) : (
                  <div className="w-24 h-28 rounded-2xl border border-dashed border-white/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-white/20 text-2xl">👤</span>
                  </div>
                )}
                <div className="space-y-2">
                  <label className={`cursor-pointer px-4 py-2 rounded-xl text-xs border transition-all inline-block ${uploadingPhoto ? 'border-white/10 text-white/20' : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white/80'}`}>
                    {uploadingPhoto ? 'A enviar...' : freelancer.foto_url ? 'Alterar foto' : 'Carregar foto'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingPhoto}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }} />
                  </label>
                  {freelancer.foto_url && (
                    <button onClick={async () => {
                      await fetch('/api/freelancers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, foto_url: null }) })
                      await load()
                    }} className="block text-[10px] text-red-400/50 hover:text-red-400 transition-colors">
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Texto da página inicial */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] tracking-[0.3em] text-white/25 uppercase">Texto da página inicial</p>
                <span className={`text-[9px] tracking-widest transition-all ${
                  introHomeStatus === 'saving' ? 'text-white/30' :
                  introHomeStatus === 'saved'  ? 'text-emerald-400' : 'text-transparent'
                }`}>
                  {introHomeStatus === 'saving' ? 'A guardar...' : '✓ Guardado'}
                </span>
              </div>
              <input
                value={introHomeTitle}
                onChange={e => handleIntroHomeTitleChange(e.target.value)}
                placeholder="Título de boas-vindas..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 outline-none focus:border-white/20 transition-colors placeholder:text-white/15 mb-2"
              />
              <textarea
                value={introHome}
                onChange={e => handleIntroHomeChange(e.target.value)}
                rows={5}
                placeholder="Escreve aqui o texto que aparece na página inicial do freelancer (⌂)..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 outline-none focus:border-white/20 transition-colors resize-none placeholder:text-white/15 leading-relaxed"
              />
            </div>

            {/* Guia de trabalho */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] tracking-[0.3em] text-white/25 uppercase">Guia de Trabalho</p>
                <span className={`text-[9px] tracking-widest transition-all ${
                  guiaStatus === 'saving' ? 'text-white/30' :
                  guiaStatus === 'saved'  ? 'text-emerald-400' : 'text-transparent'
                }`}>
                  {guiaStatus === 'saving' ? 'A guardar...' : '✓ Guardado'}
                </span>
              </div>
              <textarea
                value={guia}
                onChange={e => handleGuiaChange(e.target.value)}
                rows={8}
                placeholder="Escreve aqui as regras e guia de trabalho para os freelancers (herda para todos via template)..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 outline-none focus:border-white/20 transition-colors resize-none placeholder:text-white/15 leading-relaxed"
              />
            </div>

            {/* Dados do freelancer */}
            {editForm ? (
              <div className="bg-white/[0.02] border border-gold/20 rounded-2xl p-5 space-y-3">
                <p className="text-[10px] tracking-[0.3em] text-gold/60 uppercase mb-1">Editar dados</p>
                {[
                  { label: 'Nome', key: 'nome', placeholder: 'Nome' },
                  { label: 'Contato', key: 'contato', placeholder: '9XX XXX XXX' },
                  { label: 'Email', key: 'email', placeholder: 'email@exemplo.com' },
                  { label: 'SOS — Nome', key: 'nome_sos', placeholder: 'Nome familiar' },
                  { label: 'SOS — Nº', key: 'contato_sos', placeholder: '9XX XXX XXX' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">{f.label}</label>
                    <input value={(editForm as any)[f.key]} onChange={e => setEditForm(prev => ({ ...prev!, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15" />
                  </div>
                ))}
                <div>
                  <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Função</label>
                  <select value={editForm.status} onChange={e => setEditForm(prev => ({ ...prev!, status: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors cursor-pointer">
                    {['FOTOGRAFO','VIDEOGRAFO','ASSISTENTE','EDITORES','OUTRO'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setEditForm(null)} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
                  <button onClick={handleEditSave} disabled={editSaving} className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
                    {editSaving ? 'A guardar...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                <p className="text-[10px] tracking-[0.3em] text-white/25 uppercase mb-2">Dados do Freelancer</p>
                {[
                  ['Nome', freelancer.nome],
                  ['Função', freelancer.status],
                  ['Contato', freelancer.contato],
                  ['Email', freelancer.email],
                  ['SOS', freelancer.nome_sos ? `${freelancer.nome_sos}${freelancer.contato_sos ? ` · ${freelancer.contato_sos}` : ''}` : null],
                ].filter(([,v]) => v).map(([label, val]) => (
                  <div key={label as string} className="flex items-center gap-3">
                    <span className="text-[9px] text-white/25 tracking-widest uppercase w-16 shrink-0">{label}</span>
                    <span className="text-sm text-white/70">{val}</span>
                  </div>
                ))}
                <div className="pt-2">
                  <button onClick={() => setEditForm({ nome: freelancer.nome, status: freelancer.status ?? '', contato: freelancer.contato ?? '', email: freelancer.email ?? '', nome_sos: freelancer.nome_sos ?? '', contato_sos: freelancer.contato_sos ?? '' })}
                    className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-widest hover:bg-gold/20 transition-all uppercase">
                    Editar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab content */}
      {tab === 'casamentos'   && <CasamentosTab freelancerId={id} casamentos={casamentos} onRefresh={load} freelancerStatus={freelancer?.status ?? null} freelancer={freelancer} />}
      {tab === 'edicao'       && <EdicaoTab freelancerId={id} edicao={edicao} onRefresh={load} />}
      {tab === 'album'        && <AlbumTab freelancerId={id} album={album} onRefresh={load} />}
      {tab === 'valores'      && <ValoresTab freelancerId={id} valores={valores} onRefresh={load} />}
      {tab === 'info'         && <InfoTab freelancerId={id} info={info} onRefresh={load} />}
      {tab === 'notas'        && <NotasTab freelancer={freelancer} onRefresh={load} />}
      {tab === 'pagamentos'   && <PagamentosAdminTab freelancerId={id} pagamentos={pagamentos} casamentos={casamentos} onRefresh={load} />}
      {tab === 'mensagens'    && <MensagensAdminTab freelancerId={id} freelancerNome={freelancer?.nome ?? ''} casamentos={casamentos} mensagens={mensagens} onRefresh={load} />}
      {tab === 'notificacoes' && <NotificacoesAdminTab freelancerId={id} notificacoes={notificacoes} onRefresh={load} />}
    </main>
  )
}

// ─── Casamentos Tab ───────────────────────────────────────────────────────────

const DEFAULT_INTRO = `Aqui encontras todos os eventos que te foram atribuídos ao longo do ano. Sempre que um novo evento for adicionado, deverás confirmar a tua disponibilidade.\n\nA 3 dias do evento tens acesso ao briefing com toda a informação necessária para o dia — percurso, contactos, detalhes da cerimónia e muito mais.`

function CasamentosTab({ freelancerId, casamentos, onRefresh, freelancerStatus, freelancer }: { freelancerId: string; casamentos: Casamento[]; onRefresh: () => void; freelancerStatus: string | null; freelancer: Freelancer | null }) {
  const [editing, setEditing] = useState<Casamento | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Partial<Casamento>>({})
  const [saving, setSaving] = useState(false)
  const [ficha, setFicha] = useState<Casamento | null>(null)
  const [editingIntro, setEditingIntro] = useState(false)
  const [introValue, setIntroValue] = useState(freelancer?.intro_casamentos ?? DEFAULT_INTRO)
  const [savingIntro, setSavingIntro] = useState(false)

  async function saveIntro() {
    if (!freelancer) return
    setSavingIntro(true)
    await fetch('/api/freelancers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: freelancer.id, intro_casamentos: introValue }) })
    setSavingIntro(false)
    setEditingIntro(false)
    onRefresh()
  }

  const emptyForm = { freelancer_id: freelancerId, local: '', data_casamento: '', equipa_foto: [], videografo: '', briefing_url: '', order_index: casamentos.length }

  async function save() {
    setSaving(true)
    try {
      if (editing) {
        await fetch('/api/freelancer-casamentos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) })
        setEditing(null)
      } else {
        await fetch('/api/freelancer-casamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...emptyForm, ...form }) })
        setShowAdd(false)
      }
      setForm({})
      onRefresh()
    } finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Remover casamento?')) return
    await fetch(`/api/freelancer-casamentos?id=${id}`, { method: 'DELETE' })
    onRefresh()
  }

  const sorted = [...casamentos].sort((a,b) => (a.data_casamento??'') < (b.data_casamento??'') ? -1 : 1)

  return (
    <div className="space-y-3">

      {/* ── Texto Intro (editável) ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[9px] tracking-[0.35em] text-white/30 uppercase">Texto Intro — Secção Casamentos</p>
          {!editingIntro && (
            <button onClick={() => setEditingIntro(true)}
              className="px-3 py-1 rounded-lg text-[10px] border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all tracking-widest uppercase">
              Editar
            </button>
          )}
        </div>
        {editingIntro ? (
          <div className="space-y-3">
            <textarea value={introValue} onChange={e => setIntroValue(e.target.value)} rows={5}
              className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-4 py-3 text-sm text-white/80 outline-none focus:border-white/30 transition-colors resize-none leading-relaxed" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditingIntro(false); setIntroValue(freelancer?.intro_casamentos ?? DEFAULT_INTRO) }}
                className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
              <button onClick={saveIntro} disabled={savingIntro}
                className="px-4 py-1.5 rounded-lg text-xs border border-white/20 text-white font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
                style={{ boxShadow: '0 0 8px rgba(255,255,255,0.15)' }}>
                {savingIntro ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{introValue}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={() => { setShowAdd(true); setEditing(null); setForm({}) }}
          className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-widest hover:bg-gold/20 transition-all uppercase">
          + Adicionar
        </button>
      </div>

      {showAdd && (
        <CasamentoForm form={form} setForm={setForm} saving={saving} onSave={save} onCancel={() => setShowAdd(false)} />
      )}

      {sorted.length === 0 && !showAdd && (
        <p className="text-center py-10 text-white/20 text-xs tracking-widest">Sem casamentos registados.</p>
      )}

      {sorted.map(c => {
        const dtu = daysUntil(c.data_casamento)
        const isUrgent = dtu !== null && dtu >= 0 && dtu <= 15
        const isPast = dtu !== null && dtu < 0
        return editing?.id === c.id ? (
          <CasamentoForm key={c.id} form={form} setForm={setForm} saving={saving} onSave={save}
            onCancel={() => setEditing(null)} onDelete={() => del(c.id)} />
        ) : (
          <div key={c.id} onClick={() => setFicha(c)}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all group cursor-pointer hover:border-white/20 ${isUrgent ? 'border-red-500/25 bg-red-500/5' : isPast ? 'border-white/[0.04] bg-white/[0.01] opacity-60' : 'border-white/[0.06] bg-white/[0.02]'}`}>
            <div className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl border text-center ${isUrgent ? 'bg-red-500/15 border-red-500/30' : isPast ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-gold/8 border-gold/20'}`}>
              {c.data_casamento ? (
                <>
                  <span className={`text-base font-bold leading-none ${isUrgent ? 'text-red-400' : isPast ? 'text-white/25' : 'text-gold'}`}>
                    {c.data_casamento.split('-')[2]}
                  </span>
                  <span className={`text-[8px] uppercase tracking-wide ${isUrgent ? 'text-red-400/60' : isPast ? 'text-white/15' : 'text-gold/60'}`}>
                    {MESES[parseInt(c.data_casamento.split('-')[1])-1]}
                  </span>
                </>
              ) : <span className="text-white/20 text-xs">—</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white/85 truncate group-hover:text-white transition-colors">{c.local}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                {c.data_casamento && <span className="text-[10px] text-white/35">{fmtDate(c.data_casamento)}</span>}
                {c.videografo && <span className="text-[10px] text-white/30">🎥 {c.videografo}</span>}
              </div>
              {c.equipa_foto && c.equipa_foto.length > 0 && (
                <p className="text-[10px] text-white/25 mt-0.5">📷 {c.equipa_foto.join(', ')}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {dtu !== null && dtu >= 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-red-500/15 text-red-400' : 'bg-white/[0.06] text-white/30'}`}>
                  {dtu === 0 ? 'HOJE' : `${dtu}d`}
                </span>
              )}
              {c.data_confirmada ? (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 tracking-widest uppercase">
                    ✓ Confirmado
                  </span>
                  <button
                    onClick={async e => {
                      e.stopPropagation()
                      await fetch('/api/freelancer-casamentos', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: c.id, data_confirmada: false }),
                      })
                      onRefresh()
                    }}
                    className="text-white/20 hover:text-red-400 transition-colors text-xs leading-none px-1"
                    title="Remover confirmação">
                    ✕
                  </button>
                </div>
              ) : !isPast ? (
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400/70 border border-orange-500/20 tracking-widest uppercase">
                  Pendente
                </span>
              ) : null}
              <button
                onClick={e => { e.stopPropagation(); del(c.id) }}
                className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 p-1 rounded-lg hover:bg-red-500/15 text-white/20 hover:text-red-400"
                title="Eliminar evento">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>
        )
      })}

      {ficha && (
        <CasamentoFicha
          casamento={ficha}
          isVideografo={freelancerStatus === 'VIDEOGRAFO'}
          onClose={() => setFicha(null)}
          onConfirm={() => { onRefresh() }}
          onDelete={async () => { await del(ficha.id); setFicha(null) }}
          onEdit={() => {
            setEditing(ficha)
            setForm({ local: ficha.local, data_casamento: ficha.data_casamento ?? '', equipa_foto: ficha.equipa_foto ?? [], videografo: ficha.videografo ?? '', briefing_url: ficha.briefing_url ?? '' })
            setShowAdd(false)
            setFicha(null)
          }}
        />
      )}
    </div>
  )
}

function CasamentoFicha({ casamento: c, onClose, onEdit, onConfirm, onDelete, isVideografo }: { casamento: Casamento; onClose: () => void; onEdit: () => void; onConfirm?: () => void; onDelete?: () => void; isVideografo?: boolean }) {
  const dtu = daysUntil(c.data_casamento)
  const isUrgent = dtu !== null && dtu >= 0 && dtu <= 15
  const isPast = dtu !== null && dtu < 0
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(c.data_confirmada ?? false)

  async function handleConfirmar() {
    setConfirming(true)
    await fetch('/api/freelancer-casamentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, data_confirmada: true }),
    })
    setConfirmed(true)
    setConfirming(false)
    onConfirm?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-[#0e0e0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header strip */}
        <div className={`px-6 py-5 border-b border-white/[0.06] ${isUrgent ? 'bg-red-500/8' : isPast ? 'bg-white/[0.02]' : 'bg-gold/[0.04]'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl border ${isUrgent ? 'bg-red-500/15 border-red-500/30' : isPast ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-gold/10 border-gold/25'}`}>
                {c.data_casamento ? (
                  <>
                    <span className={`text-xl font-bold leading-none ${isUrgent ? 'text-red-400' : isPast ? 'text-white/30' : 'text-gold'}`}>
                      {c.data_casamento.split('-')[2]}
                    </span>
                    <span className={`text-[9px] uppercase tracking-wide font-semibold ${isUrgent ? 'text-red-400/60' : isPast ? 'text-white/20' : 'text-gold/60'}`}>
                      {MESES[parseInt(c.data_casamento.split('-')[1])-1]}
                    </span>
                  </>
                ) : <span className="text-white/20 text-sm">—</span>}
              </div>
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wide leading-tight">{c.local || '—'}</h2>
                {c.data_casamento && (
                  <p className={`text-xs mt-0.5 ${isUrgent ? 'text-red-400/70' : isPast ? 'text-white/30' : 'text-white/45'}`}>{fmtDate(c.data_casamento)}</p>
                )}
                {dtu !== null && dtu >= 0 && (
                  <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-white/[0.08] text-white/40'}`}>
                    {dtu === 0 ? 'HOJE' : `${dtu} dias`}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="flex-shrink-0 p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Equipa Foto */}
          <div>
            <p className="text-[9px] tracking-[0.3em] text-white/25 uppercase mb-2">Equipa Fotografia</p>
            {c.equipa_foto && c.equipa_foto.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {c.equipa_foto.map((name, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/70">
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/20 italic">Não definida</p>
            )}
          </div>

          {/* Videógrafo */}
          <div>
            <p className="text-[9px] tracking-[0.3em] text-white/25 uppercase mb-2">Videógrafo</p>
            <p className="text-sm text-white/70">{c.videografo || <span className="text-white/20 italic">Não definido</span>}</p>
          </div>

          {/* Briefing */}
          <div>
            <p className="text-[9px] tracking-[0.3em] text-white/25 uppercase mb-2">Briefing</p>
            {c.briefing_url ? (
              <a href={c.briefing_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-gold/70 hover:text-gold transition-colors border border-gold/20 px-3 py-1.5 rounded-lg hover:bg-gold/5">
                Abrir Briefing ↗
              </a>
            ) : (
              <p className="text-xs text-white/20 italic">Sem briefing</p>
            )}
          </div>

          {/* Relatório — só para videógrafos */}
          {isVideografo && (
            <div>
              <p className="text-[9px] tracking-[0.3em] text-white/25 uppercase mb-2">Relatório</p>
              <a href="https://tally.so/r/np88GE" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-widest uppercase hover:bg-emerald-500/20 transition-all">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Relatório
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between gap-3">
          {/* Caixote */}
          {onDelete && (
            <button onClick={onDelete}
              className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Eliminar evento">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          )}
          {/* Confirmar Data */}
          {!isPast && (
            confirmed ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-widest uppercase cursor-default">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Data Confirmada
              </div>
            ) : (
              <button onClick={handleConfirmar} disabled={confirming}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-widest uppercase hover:bg-gold/20 transition-all disabled:opacity-50">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {confirming ? 'A confirmar...' : 'Confirmar Data'}
              </button>
            )
          )}
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white/50 text-xs font-semibold tracking-widest hover:bg-white/[0.08] hover:text-white/80 transition-all uppercase ml-auto">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            Editar
          </button>
        </div>
      </div>
    </div>
  )
}

function CasamentoForm({ form, setForm, saving, onSave, onCancel, onDelete }: any) {
  return (
    <div className="bg-white/[0.02] border border-gold/20 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className={labelCls}>Local do casamento *</label>
          <input value={form.local ?? ''} onChange={e => setForm((f: any) => ({ ...f, local: e.target.value }))} placeholder="Quinta da..." className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Data</label>
          <input type="date" value={form.data_casamento ?? ''} onChange={e => setForm((f: any) => ({ ...f, data_casamento: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Videógrafo</label>
          <input value={form.videografo ?? ''} onChange={e => setForm((f: any) => ({ ...f, videografo: e.target.value }))} placeholder="Nome" className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Equipa Foto (separado por vírgulas)</label>
          <input value={(form.equipa_foto ?? []).join(', ')} onChange={e => setForm((f: any) => ({ ...f, equipa_foto: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) }))} placeholder="Nome1, Nome2" className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>URL Briefing</label>
          <input value={form.briefing_url ?? ''} onChange={e => setForm((f: any) => ({ ...f, briefing_url: e.target.value }))} placeholder="https://..." className={inputCls} />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        {onDelete ? <button onClick={onDelete} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors tracking-widest">✕ Remover</button> : <span />}
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.local} className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edição Álbum Tab ─────────────────────────────────────────────────────────

const STATUS_ALBUM = ['AGUARDAR', 'EM EDIÇÃO', 'EM APROVAÇÃO', 'APROVADO', 'ENTREGUE'] as const
type StatusAlbum = typeof STATUS_ALBUM[number]

const ALBUM_STYLE: Record<StatusAlbum, { col: string; badge: string }> = {
  'AGUARDAR':      { col: 'border-white/20 text-white/40',                                badge: 'bg-white/[0.06] text-white/50 border-white/20' },
  'EM EDIÇÃO':     { col: 'border-yellow-500/30 text-yellow-400',                          badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  'EM APROVAÇÃO':  { col: 'border-blue-500/30 text-blue-400',                              badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  'APROVADO':      { col: 'border-emerald-500/30 text-emerald-400',                        badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  'ENTREGUE':      { col: 'border-purple-500/30 text-purple-400',                          badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
}

function AlbumTab({ freelancerId, album, onRefresh }: { freelancerId: string; album: Album[]; onRefresh: () => void }) {
  const [editing, setEditing] = useState<Album | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Partial<Album>>({})
  const [saving, setSaving] = useState(false)
  const [changingId, setChangingId] = useState<string | null>(null)
  const [selecaoList, setSelecaoList] = useState<{ nome_noivos: string; referencia: string; date: string | null }[]>([])

  useEffect(() => {
    fetch('/api/fotos-selecao')
      .then(r => r.json())
      .then(d => setSelecaoList((d.rows ?? []).filter((r: any) => r.referencia)))
      .catch(() => {})
  }, [])

  async function save() {
    setSaving(true)
    try {
      if (editing) {
        await fetch('/api/freelancer-album', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) })
        setEditing(null)
      } else {
        await fetch('/api/freelancer-album', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ freelancer_id: freelancerId, status: 'AGUARDAR', ...form }) })
        setShowAdd(false)
      }
      setForm({})
      onRefresh()
    } finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Remover álbum?')) return
    await fetch(`/api/freelancer-album?id=${id}`, { method: 'DELETE' })
    onRefresh()
  }

  async function changeStatus(item: Album, newStatus: string) {
    setChangingId(item.id)
    await fetch('/api/freelancer-album', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, status: newStatus }) })
    setChangingId(null)
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setShowAdd(true); setEditing(null); setForm({ status: 'AGUARDAR' }) }}
          className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-widest hover:bg-gold/20 transition-all uppercase">
          + Adicionar
        </button>
      </div>

      {showAdd && <AlbumForm form={form} setForm={setForm} saving={saving} onSave={save} onCancel={() => setShowAdd(false)} selecaoList={selecaoList} />}

      {/* Kanban — scroll horizontal em mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {STATUS_ALBUM.map(status => {
          const items = album.filter(a => a.status === status)
          const style = ALBUM_STYLE[status]
          return (
            <div key={status} className="flex-shrink-0 w-[220px] space-y-2">
              {/* Column header */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-bold tracking-widest uppercase bg-white/[0.02] ${style.col}`}>
                <span>{status}</span>
                <span className="ml-auto opacity-50">({items.length})</span>
              </div>
              {/* Cards */}
              {items.map(item => (
                editing?.id === item.id ? (
                  <AlbumForm key={item.id} form={form} setForm={setForm} saving={saving} onSave={save}
                    onCancel={() => setEditing(null)} onDelete={() => del(item.id)} selecaoList={selecaoList} />
                ) : (
                  <div key={item.id} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-2 group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-white/80 leading-tight">{item.nome}</p>
                      <button onClick={() => { setEditing(item); setForm({ ...item }); setShowAdd(false) }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/25 hover:text-white/60 flex-shrink-0 transition-all">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                    </div>
                    {item.data_casamento && <p className="text-[10px] text-white/30">{fmtDate(item.data_casamento).split(' · ')[0]}</p>}
                    {item.local && <p className="text-[10px] text-white/25">📍 {item.local}</p>}
                    {item.data_entrega && <p className="text-[10px] text-white/25">Entrega: {fmtDate(item.data_entrega).split(' · ')[0]}</p>}
                    {item.referencia_album
                      ? <p className="text-[9px] font-mono text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-fit">🔗 {item.referencia_album}</p>
                      : <p className="text-[9px] text-red-400/60 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded w-fit">⚠ sem referência — sync desativado</p>
                    }
                    {item.fotos_album && (
                      <div className="border-t border-white/[0.04] pt-1.5">
                        <p className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Fotos Álbum</p>
                        <p className="text-[10px] text-white/50 whitespace-pre-wrap leading-relaxed">{item.fotos_album}</p>
                      </div>
                    )}
                    {item.texto_album && (
                      <div className="border-t border-white/[0.04] pt-1.5">
                        <p className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Texto Álbum</p>
                        <p className="text-[10px] text-white/50 whitespace-pre-wrap leading-relaxed">{item.texto_album}</p>
                      </div>
                    )}
                    {/* Status dropdown */}
                    <div className="pt-1 border-t border-white/[0.04]">
                      <select
                        value={item.status}
                        disabled={changingId === item.id}
                        onChange={e => changeStatus(item, e.target.value)}
                        className={`w-full text-[9px] font-bold tracking-widest uppercase px-2 py-1.5 rounded-lg border cursor-pointer outline-none transition-all bg-black/40 ${style.badge} disabled:opacity-50`}>
                        {STATUS_ALBUM.map(s => (
                          <option key={s} value={s} className="bg-neutral-900 text-white">{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AlbumForm({ form, setForm, saving, onSave, onCancel, onDelete, selecaoList = [] }: any) {
  function handleSelecao(referencia: string) {
    const rec = selecaoList.find((r: any) => r.referencia === referencia)
    if (!rec) return
    setForm((f: any) => ({
      ...f,
      nome: rec.nome_noivos,
      referencia_album: rec.referencia,
      data_casamento: rec.date ?? f.data_casamento,
    }))
  }

  return (
    <div className="bg-white/[0.02] border border-gold/20 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className={labelCls}>Casamento <span className="text-white/20 normal-case tracking-normal">(seleciona da Seleção de Fotos)</span></label>
          <select
            value={form.referencia_album ?? ''}
            onChange={e => handleSelecao(e.target.value)}
            className={selectCls}
          >
            <option value="" style={optStyle}>— escolher casamento —</option>
            {selecaoList.map((r: any) => (
              <option key={r.referencia} value={r.referencia} style={optStyle}>
                {r.nome_noivos} · {r.referencia}{r.date ? ` · ${r.date}` : ''}
              </option>
            ))}
          </select>
          {form.referencia_album && (
            <p className="text-[9px] font-mono text-emerald-400/70 mt-1">🔗 {form.referencia_album} — {form.nome}</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Data Casamento</label>
          <input type="date" value={form.data_casamento ?? ''} onChange={e => setForm((f: any) => ({ ...f, data_casamento: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Data Entrega</label>
          <input type="date" value={form.data_entrega ?? ''} onChange={e => setForm((f: any) => ({ ...f, data_entrega: e.target.value }))} className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Local</label>
          <input value={form.local ?? ''} onChange={e => setForm((f: any) => ({ ...f, local: e.target.value }))} placeholder="Quinta da..." className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Fotos para Álbum</label>
          <textarea value={form.fotos_album ?? ''} onChange={e => setForm((f: any) => ({ ...f, fotos_album: e.target.value }))} placeholder="Escreve aqui as fotos para álbum..." rows={4} className={inputCls + ' resize-none'} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Texto para Álbum</label>
          <textarea value={form.texto_album ?? ''} onChange={e => setForm((f: any) => ({ ...f, texto_album: e.target.value }))} placeholder="Texto descritivo para o álbum..." rows={4} className={inputCls + ' resize-none'} />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        {onDelete ? (
          <button onClick={onDelete} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors tracking-widest">✕ Remover</button>
        ) : <span />}
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.nome} className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edição Tab (Kanban) ──────────────────────────────────────────────────────

function EdicaoTab({ freelancerId, edicao, onRefresh }: { freelancerId: string; edicao: Edicao[]; onRefresh: () => void }) {
  const [editing, setEditing] = useState<Edicao | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Partial<Edicao>>({})
  const [saving, setSaving] = useState(false)
  const [selecaoList, setSelecaoList] = useState<{ nome_noivos: string; referencia: string; date: string | null }[]>([])

  useEffect(() => {
    fetch('/api/fotos-selecao')
      .then(r => r.json())
      .then(d => setSelecaoList((d.rows ?? []).filter((r: any) => r.referencia)))
      .catch(() => {})
  }, [])

  async function save() {
    setSaving(true)
    try {
      if (editing) {
        await fetch('/api/freelancer-edicao', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) })
        setEditing(null)
      } else {
        await fetch('/api/freelancer-edicao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ freelancer_id: freelancerId, status: 'NOVO TRABALHO', ...form }) })
        setShowAdd(false)
      }
      setForm({})
      onRefresh()
    } finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Remover job de edição?')) return
    await fetch(`/api/freelancer-edicao?id=${id}`, { method: 'DELETE' })
    onRefresh()
  }

  async function changeStatus(job: Edicao, newStatus: string) {
    await fetch('/api/freelancer-edicao', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: job.id, status: newStatus }) })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setShowAdd(true); setEditing(null); setForm({ status: 'NOVO TRABALHO' }) }}
          className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-widest hover:bg-gold/20 transition-all uppercase">
          + Adicionar
        </button>
      </div>

      {showAdd && <EdicaoForm form={form} setForm={setForm} saving={saving} onSave={save} onCancel={() => setShowAdd(false)} selecaoList={selecaoList} />}

      {/* Kanban columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATUS_EDICAO.map(status => {
          const jobs = edicao.filter(e => e.status === status)
          return (
            <div key={status} className="space-y-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-bold tracking-widest uppercase ${STATUS_STYLE[status]}`}>
                <span>{status}</span>
                <span className="ml-auto opacity-60">({jobs.length})</span>
              </div>
              {jobs.map(job => (
                editing?.id === job.id ? (
                  <EdicaoForm key={job.id} form={form} setForm={setForm} saving={saving} onSave={save}
                    onCancel={() => setEditing(null)} onDelete={() => del(job.id)} selecaoList={selecaoList} />
                ) : (
                  <div key={job.id} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-2 group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-white/80 leading-tight">{job.nome}</p>
                      <button onClick={() => { setEditing(job); setForm({ ...job }); setShowAdd(false) }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/25 hover:text-white/60 flex-shrink-0 transition-all">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                    </div>
                    {job.data_casamento && <p className="text-[10px] text-white/30">{fmtDate(job.data_casamento).split(' · ')[0]}</p>}
                    {job.local && <p className="text-[10px] text-white/25">📍 {job.local}</p>}
                    {job.data_entrega && <p className="text-[10px] text-white/25">Entrega: {fmtDate(job.data_entrega).split(' · ')[0]}</p>}
                    {job.referencia
                      ? <p className="text-[9px] font-mono text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-fit">🔗 {job.referencia}</p>
                      : <p className="text-[9px] text-red-400/60 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded w-fit">⚠ sem referência — sync desativado</p>
                    }
                    {/* Foto counts */}
                    {[['Convidados', job.convidados],['Cerimónia', job.cerimonia],['Detalhes', job.detalhes],['Sala', job.sala_animacao],['Álbum', job.fotos_album],['Bolo/Bouquet', job.bolo_bouquet],['Noivos', job.sessao_noivos],['Noiva', job.fotos_noiva],['Noivo', job.fotos_noivo]].some(([,v]) => v) && (
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-white/[0.04]">
                        {[['C', job.convidados],['Cer', job.cerimonia],['Det', job.detalhes],['Sala', job.sala_animacao],['Alb', job.fotos_album],['B/B', job.bolo_bouquet],['Nv', job.sessao_noivos],['Noiva', job.fotos_noiva],['Noivo', job.fotos_noivo]].filter(([,v]) => v).map(([k,v]) => (
                          <span key={k as string} className="text-[9px] bg-white/[0.04] text-white/35 px-1.5 py-0.5 rounded">{k}: {v}</span>
                        ))}
                      </div>
                    )}
                    {/* Estado dropdown + Ver Seleção */}
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="relative">
                        <select
                          value={job.status}
                          onChange={ev => changeStatus(job, ev.target.value)}
                          style={{ boxShadow: '0 0 14px 2px rgba(255,255,255,0.10), 0 0 5px 1px rgba(255,255,255,0.12), inset 0 0 12px 0 rgba(255,255,255,0.03)' }}
                          className="appearance-none w-full text-[10px] tracking-[0.2em] uppercase font-semibold px-3 py-2 pr-7 rounded-xl border border-white/20 bg-white/[0.05] text-white outline-none cursor-pointer transition-all hover:border-white/40 hover:bg-white/[0.08] [color-scheme:dark]"
                        >
                          {STATUS_EDICAO.map(s => (
                            <option key={s} value={s} className="bg-zinc-900 text-white">{s}</option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-white/50">▾</span>
                      </div>
                      <a
                        href={`/fotos-selecao?ref=${encodeURIComponent(job.nome)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] px-3 py-1.5 rounded-lg border border-gold/30 bg-gold/5 text-gold/70 hover:text-gold hover:border-gold/50 hover:bg-gold/10 transition-all tracking-widest uppercase text-center"
                      >
                        Ver Seleção
                      </a>
                    </div>
                  </div>
                )
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EdicaoForm({ form, setForm, saving, onSave, onCancel, onDelete, selecaoList = [] }: any) {
  const numInput = (field: string, label: string) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input type="number" value={form[field] ?? ''} onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value ? parseInt(e.target.value) : null }))} className={inputCls} />
    </div>
  )

  function handleSelecao(referencia: string) {
    const rec = selecaoList.find((r: any) => r.referencia === referencia)
    if (!rec) return
    setForm((f: any) => ({
      ...f,
      nome: rec.nome_noivos,
      referencia: rec.referencia,
      data_casamento: rec.date ?? f.data_casamento,
    }))
  }

  return (
    <div className="bg-white/[0.02] border border-gold/20 rounded-xl p-4 space-y-3 col-span-full sm:col-span-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className="col-span-2 sm:col-span-3">
          <label className={labelCls}>Casamento <span className="text-white/20 normal-case tracking-normal">(seleciona da Seleção de Fotos)</span></label>
          <select
            value={form.referencia ?? ''}
            onChange={e => handleSelecao(e.target.value)}
            className={selectCls}
          >
            <option value="" style={optStyle}>— escolher casamento —</option>
            {selecaoList.map((r: any) => (
              <option key={r.referencia} value={r.referencia} style={optStyle}>
                {r.nome_noivos} · {r.referencia}{r.date ? ` · ${r.date}` : ''}
              </option>
            ))}
          </select>
          {form.referencia && (
            <p className="text-[9px] font-mono text-emerald-400/70 mt-1">🔗 {form.referencia} — {form.nome}</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Estado</label>
          <select value={form.status ?? 'NOVO TRABALHO'} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))} className={inputCls + ' cursor-pointer'}>
            {STATUS_EDICAO.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Local</label>
          <input value={form.local ?? ''} onChange={e => setForm((f: any) => ({ ...f, local: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Data Casamento</label>
          <input type="date" value={form.data_casamento ?? ''} onChange={e => setForm((f: any) => ({ ...f, data_casamento: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Data Entrega</label>
          <input type="date" value={form.data_entrega ?? ''} onChange={e => setForm((f: any) => ({ ...f, data_entrega: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Data Final Entrega</label>
          <input type="date" value={form.data_final_entrega ?? ''} onChange={e => setForm((f: any) => ({ ...f, data_final_entrega: e.target.value }))} className={inputCls} />
        </div>
      </div>
      <p className="text-[9px] text-white/25 tracking-widest uppercase pt-1">Contagem de fotos</p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {numInput('convidados','Convidados')}{numInput('cerimonia','Cerimónia')}{numInput('detalhes','Detalhes')}
        {numInput('sala_animacao','Sala/Anim.')}{numInput('fotos_album','Álbum')}{numInput('bolo_bouquet','Bolo/Bouq.')}
        {numInput('sessao_noivos','Sessão Noivos')}{numInput('fotos_noiva','Fotos Noiva')}{numInput('fotos_noivo','Fotos Noivo')}
      </div>
      <div className="flex items-center justify-between pt-1">
        {onDelete ? <button onClick={onDelete} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors tracking-widest">✕ Remover</button> : <span />}
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.nome} className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Valores Tab ──────────────────────────────────────────────────────────────

function ValoresTab({ freelancerId, valores, onRefresh }: { freelancerId: string; valores: Valor[]; onRefresh: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Partial<Valor>>({})
  const [saving, setSaving] = useState(false)

  const empty = { freelancer_id: freelancerId, servico: '', total_unidade: 0, valor_servico: 0, kms: 0, valor_ao_km: 0, order_index: valores.length }

  async function save() {
    setSaving(true)
    try {
      if (editingId) {
        await fetch('/api/freelancer-valores', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...form }) })
        setEditingId(null)
      } else {
        await fetch('/api/freelancer-valores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...empty, ...form }) })
        setShowAdd(false)
      }
      setForm({})
      onRefresh()
    } finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Remover linha?')) return
    await fetch(`/api/freelancer-valores?id=${id}`, { method: 'DELETE' })
    onRefresh()
  }

  const totalGeral = valores.reduce((s, v) => s + totalValor(v), 0)

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => { setShowAdd(true); setEditingId(null); setForm({}) }}
          className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-widest hover:bg-gold/20 transition-all uppercase">
          + Adicionar
        </button>
      </div>

      {showAdd && <ValorForm form={form} setForm={setForm} saving={saving} onSave={save} onCancel={() => setShowAdd(false)} />}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Serviço','Unid.','€/Serviço','Kms','€/Km','Total',''].map(h => (
                <th key={h} className="px-3 py-2 text-[9px] text-white/25 tracking-widest uppercase text-left font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {valores.map(v => (
              editingId === v.id ? (
                <tr key={v.id}><td colSpan={7} className="py-2">
                  <ValorForm form={form} setForm={setForm} saving={saving} onSave={save} onCancel={() => setEditingId(null)} onDelete={() => del(v.id)} />
                </td></tr>
              ) : (
                <tr key={v.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] group transition-colors">
                  <td className="px-3 py-2.5 text-white/75 font-medium">{v.servico}</td>
                  <td className="px-3 py-2.5 text-white/40">{v.total_unidade}</td>
                  <td className="px-3 py-2.5 text-white/40">{v.valor_servico}€</td>
                  <td className="px-3 py-2.5 text-white/40">{v.kms}</td>
                  <td className="px-3 py-2.5 text-white/40">{v.valor_ao_km}€</td>
                  <td className="px-3 py-2.5 text-gold font-semibold">{totalValor(v).toFixed(2)}€</td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => { setEditingId(v.id); setForm({ ...v }); setShowAdd(false) }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/25 hover:text-white/60 transition-all">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
          {valores.length > 0 && (
            <tfoot>
              <tr className="border-t border-white/[0.08]">
                <td colSpan={5} className="px-3 py-2 text-[9px] text-white/25 tracking-widest uppercase">Total</td>
                <td className="px-3 py-2 text-gold font-bold">{totalGeral.toFixed(2)}€</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
        {valores.length === 0 && !showAdd && <p className="text-center py-8 text-white/20 text-xs tracking-widest">Sem valores registados.</p>}
      </div>
    </div>
  )
}

function ValorForm({ form, setForm, saving, onSave, onCancel, onDelete }: any) {
  const numInput = (field: string, label: string, suffix = '') => (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input type="number" step="0.01" value={form[field] ?? 0} onChange={e => setForm((f: any) => ({ ...f, [field]: parseFloat(e.target.value) || 0 }))} className={inputCls + (suffix ? ' pr-6' : '')} />
        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/25 text-xs">{suffix}</span>}
      </div>
    </div>
  )
  return (
    <div className="bg-white/[0.02] border border-gold/20 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className="col-span-2 sm:col-span-3">
          <label className={labelCls}>Serviço *</label>
          <input value={form.servico ?? ''} onChange={e => setForm((f: any) => ({ ...f, servico: e.target.value }))} placeholder="Nome do serviço" className={inputCls} />
        </div>
        {numInput('total_unidade','Unidades')}{numInput('valor_servico','€ / Serviço','€')}
        {numInput('kms','Kms')}{numInput('valor_ao_km','€ / Km','€')}
        <div className="flex items-end pb-2">
          <span className="text-xs text-gold font-semibold">
            = {((form.total_unidade ?? 0) * (form.valor_servico ?? 0) + (form.kms ?? 0) * (form.valor_ao_km ?? 0)).toFixed(2)}€
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        {onDelete ? <button onClick={onDelete} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors tracking-widest">✕ Remover</button> : <span />}
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.servico} className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Info Tab ─────────────────────────────────────────────────────────────────

function InfoTab({ freelancerId, info, onRefresh }: { freelancerId: string; info: Info[]; onRefresh: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Partial<Info>>({})
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      if (editingId) {
        await fetch('/api/freelancer-info', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...form }) })
        setEditingId(null)
      } else {
        await fetch('/api/freelancer-info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ freelancer_id: freelancerId, order_index: info.length, ...form }) })
        setShowAdd(false)
      }
      setForm({})
      onRefresh()
    } finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Remover entrada?')) return
    await fetch(`/api/freelancer-info?id=${id}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button onClick={() => { setShowAdd(true); setEditingId(null); setForm({}) }}
          className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-widest hover:bg-gold/20 transition-all uppercase">
          + Adicionar
        </button>
      </div>

      {showAdd && (
        <div className="bg-white/[0.02] border border-gold/20 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Label</label>
              <input value={form.label ?? ''} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="ex: IBAN, NIF..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Valor</label>
              <input value={form.valor ?? ''} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
            <button onClick={save} disabled={saving} className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {info.length === 0 && !showAdd && <p className="text-center py-10 text-white/20 text-xs tracking-widest">Sem informação registada.</p>}

      {info.map(item => (
        editingId === item.id ? (
          <div key={item.id} className="bg-white/[0.02] border border-gold/20 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Label</label>
                <input value={form.label ?? ''} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Valor</label>
                <input value={form.valor ?? ''} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => del(item.id)} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors tracking-widest">✕ Remover</button>
              <div className="flex gap-2">
                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
                <button onClick={save} disabled={saving} className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
                  {saving ? 'A guardar...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div key={item.id} className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] group hover:border-white/[0.12] transition-all">
            <span className="text-[10px] text-white/30 uppercase tracking-widest w-28 flex-shrink-0">{item.label ?? '—'}</span>
            <span className="text-sm text-white/75 flex-1">{item.valor ?? '—'}</span>
            <button onClick={() => { setEditingId(item.id); setForm({ label: item.label ?? '', valor: item.valor ?? '' }); setShowAdd(false) }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all flex-shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
          </div>
        )
      ))}
    </div>
  )
}

// ─── Pagamentos Admin Tab ─────────────────────────────────────────────────────

type PagaFormValues = { casamento_id: string; descricao: string; valor: string; data_prevista: string; data_pago: string; status: string; notas: string }

function PagaForm({ f, setF, casamentos }: { f: PagaFormValues; setF: (v: PagaFormValues) => void; casamentos: Casamento[] }) {
  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Evento (opcional)</label>
        <select value={f.casamento_id} onChange={e => setF({ ...f, casamento_id: e.target.value })} className={selectCls}>
          <option value="" style={optStyle}>— Sem evento associado —</option>
          {casamentos.map(c => (
            <option key={c.id} value={c.id} style={optStyle}>
              {c.local}{c.data_casamento ? ` · ${c.data_casamento}` : ''}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>Descrição *</label>
        <input value={f.descricao} onChange={e => setF({ ...f, descricao: e.target.value })}
          placeholder="Ex: Sinal · Remanescente · Deslocação" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Valor (€)</label>
          <input value={f.valor} onChange={e => setF({ ...f, valor: e.target.value })}
            placeholder="0,00" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Estado</label>
          <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })} className={selectCls}>
            {['PENDENTE','PAGO','PARCIAL'].map(s => <option key={s} value={s} style={optStyle}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Data Prevista</label>
          <input type="date" value={f.data_prevista} onChange={e => setF({ ...f, data_prevista: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Data Pago</label>
          <input type="date" value={f.data_pago} onChange={e => setF({ ...f, data_pago: e.target.value })} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Notas</label>
        <input value={f.notas} onChange={e => setF({ ...f, notas: e.target.value })}
          placeholder="Opcional..." className={inputCls} />
      </div>
    </div>
  )
}

function PagamentosAdminTab({ freelancerId, pagamentos, casamentos, onRefresh }: { freelancerId: string; pagamentos: Pagamento[]; casamentos: Casamento[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState<PagaFormValues>({ casamento_id: '', descricao: '', valor: '', data_prevista: '', data_pago: '', status: 'PENDENTE', notas: '' })
  const [saving, setSaving]   = useState(false)
  const [editId, setEditId]   = useState<string | null>(null)
  const [editForm, setEditForm] = useState<PagaFormValues | null>(null)

  const totalPago     = pagamentos.filter(p => p.status === 'PAGO').reduce((s, p) => s + (p.valor ?? 0), 0)
  const totalPendente = pagamentos.filter(p => p.status !== 'PAGO').reduce((s, p) => s + (p.valor ?? 0), 0)
  const totalGeral    = pagamentos.reduce((s, p) => s + (p.valor ?? 0), 0)

  function fmtEuro(v: number) { return `${v.toFixed(2).replace('.', ',')}€` }

  async function handleAdd() {
    if (!form.descricao.trim()) return
    setSaving(true)
    await fetch('/api/freelancer-pagamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        freelancer_id: freelancerId,
        casamento_id: form.casamento_id || null,
        descricao: form.descricao,
        valor: form.valor ? parseFloat(form.valor.replace(',', '.')) : null,
        data_prevista: form.data_prevista || null,
        data_pago: form.data_pago || null,
        status: form.status,
        notas: form.notas || null,
      }),
    })
    setSaving(false)
    setShowAdd(false)
    setForm({ casamento_id: '', descricao: '', valor: '', data_prevista: '', data_pago: '', status: 'PENDENTE', notas: '' })
    onRefresh()
  }

  async function handleEdit() {
    if (!editId || !editForm) return
    setSaving(true)
    await fetch('/api/freelancer-pagamentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editId,
        casamento_id: editForm.casamento_id || null,
        descricao: editForm.descricao,
        valor: editForm.valor ? parseFloat(editForm.valor.replace(',', '.')) : null,
        data_prevista: editForm.data_prevista || null,
        data_pago: editForm.data_pago || null,
        status: editForm.status,
        notas: editForm.notas || null,
      }),
    })
    setSaving(false)
    setEditId(null)
    setEditForm(null)
    onRefresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover pagamento?')) return
    await fetch(`/api/freelancer-pagamentos?id=${id}`, { method: 'DELETE' })
    onRefresh()
  }

  async function quickPago(id: string) {
    await fetch('/api/freelancer-pagamentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'PAGO', data_pago: new Date().toISOString().split('T')[0] }),
    })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total', val: totalGeral, cls: 'text-white/70' },
          { label: 'Pago', val: totalPago, cls: 'text-emerald-400' },
          { label: 'Pendente', val: totalPendente, cls: 'text-yellow-400' },
        ].map(({ label, val, cls }) => (
          <div key={label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
            <p className="text-[9px] tracking-widest uppercase text-white/25 mb-0.5">{label}</p>
            <p className={`text-lg font-light ${cls}`}>{fmtEuro(val)}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={() => { setShowAdd(true); setEditId(null) }}
          className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-widest hover:bg-gold/20 transition-all uppercase">
          + Pagamento
        </button>
      </div>

      {showAdd && (
        <div className="bg-white/[0.02] border border-gold/20 rounded-2xl p-5 space-y-3">
          <p className="text-[9px] tracking-[0.3em] text-gold/60 uppercase">Novo Pagamento</p>
          <PagaForm f={form} setF={setForm} casamentos={casamentos} />
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
            <button onClick={handleAdd} disabled={saving || !form.descricao.trim()}
              className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 disabled:opacity-40 transition-all">
              {saving ? '...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {pagamentos.length === 0 && !showAdd && (
        <p className="text-center py-8 text-white/20 text-xs tracking-widest">Sem pagamentos registados.</p>
      )}

      {pagamentos.map(p => (
        editId === p.id && editForm ? (
          <div key={p.id} className="bg-white/[0.02] border border-white/20 rounded-2xl p-5 space-y-3">
            <p className={labelCls}>Editar</p>
            <PagaForm f={editForm} setF={setEditForm as any} casamentos={casamentos} />
            <div className="flex justify-between pt-1">
              <button onClick={() => handleDelete(p.id)} className="text-[10px] text-red-400/50 hover:text-red-400 transition-colors">✕ Remover</button>
              <div className="flex gap-2">
                <button onClick={() => { setEditId(null); setEditForm(null) }} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
                <button onClick={handleEdit} disabled={saving}
                  className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 disabled:opacity-40 transition-all">
                  {saving ? '...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div key={p.id} className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] group">
            <div className="flex-1 min-w-0">
              {p.casamento_id && (() => { const c = casamentos.find(c => c.id === p.casamento_id); return c ? <p className="text-[9px] tracking-[0.2em] text-gold/50 uppercase mb-0.5">📍 {c.local}{c.data_casamento ? ` · ${c.data_casamento}` : ''}</p> : null })()}
              <p className="text-sm text-white/80">{p.descricao}</p>
              <div className="flex flex-wrap gap-x-3 mt-0.5">
                {p.data_prevista && <span className="text-[10px] text-white/30">Previsto: {fmtDate(p.data_prevista).split(' · ')[0]}</span>}
                {p.data_pago && <span className="text-[10px] text-emerald-400/60">Pago: {fmtDate(p.data_pago).split(' · ')[0]}</span>}
                {p.notas && <span className="text-[10px] text-white/20 italic">{p.notas}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-base font-light text-white/70">{p.valor != null ? fmtEuro(p.valor) : '—'}</span>
              {p.status !== 'PAGO' ? (
                <button onClick={() => quickPago(p.id)}
                  className="text-[9px] px-2.5 py-1 rounded-full border bg-yellow-500/15 text-yellow-400 border-yellow-500/30 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/30 tracking-widest uppercase font-medium transition-all">
                  {p.status}
                </button>
              ) : (
                <span className="text-[9px] px-2.5 py-1 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 tracking-widest uppercase font-medium">
                  PAGO ✓
                </span>
              )}
              <button
                onClick={() => {
                  setEditId(p.id)
                  setEditForm({ casamento_id: p.casamento_id ?? '', descricao: p.descricao, valor: p.valor?.toString() ?? '', data_prevista: p.data_prevista ?? '', data_pago: p.data_pago ?? '', status: p.status, notas: p.notas ?? '' })
                  setShowAdd(false)
                }}
                className="text-white/20 hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
            </div>
          </div>
        )
      ))}
    </div>
  )
}

// ─── Mensagens Admin Tab ─────────────────────────────────────────────────────

function MensagensAdminTab({ freelancerId, freelancerNome, casamentos, mensagens, onRefresh }: {
  freelancerId: string; freelancerNome: string; casamentos: Casamento[]; mensagens: Mensagem[]; onRefresh: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [texto, setTexto]           = useState('')
  const [sending, setSending]       = useState(false)
  const bottomRef                   = useRef<HTMLDivElement>(null)
  const doneReadRef                 = useRef<string | null>(null)

  useEffect(() => {
    if (!selectedId || doneReadRef.current === selectedId) return
    doneReadRef.current = selectedId
    const unread = mensagens.filter(m => m.casamento_id === selectedId && m.remetente === 'freelancer' && !m.lida_admin)
    if (!unread.length) return
    Promise.all(unread.map(m => fetch('/api/freelancer-mensagens', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, lida_admin: true }),
    }))).then(() => onRefresh())
  }, [selectedId, mensagens, onRefresh])

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [mensagens, selectedId])

  async function handleSend() {
    if (!texto.trim() || !selectedId) return
    setSending(true)
    await fetch('/api/freelancer-mensagens', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freelancer_id: freelancerId, casamento_id: selectedId, mensagem: texto.trim(), remetente: 'admin' }),
    })
    setTexto('')
    setSending(false)
    onRefresh()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/freelancer-mensagens?id=${id}`, { method: 'DELETE' })
    onRefresh()
  }

  function fmtHora(s: string) {
    try {
      const d = new Date(s)
      const hh = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${hh}`
    } catch { return '' }
  }

  const selected = casamentos.find(c => c.id === selectedId)
  const thread   = mensagens.filter(m => m.casamento_id === selectedId)

  return (
    <div className="space-y-3">
      {!selectedId ? (
        <>
          <p className={labelCls}>Conversas por Evento</p>
          {casamentos.length === 0 ? (
            <p className="text-white/20 text-xs py-6 text-center">Sem eventos disponíveis.</p>
          ) : (
            <div className="space-y-2">
              {casamentos.map(c => {
                const msgs   = mensagens.filter(m => m.casamento_id === c.id)
                const unread = msgs.filter(m => m.remetente === 'freelancer' && !m.lida_admin).length
                const last   = msgs[msgs.length - 1]
                return (
                  <button key={c.id} onClick={() => setSelectedId(c.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/15 text-left transition-all group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">{c.local || '—'}</p>
                      {last ? (
                        <p className="text-[10px] text-white/30 mt-0.5 truncate">
                          {last.remetente === 'admin' ? 'Tu: ' : `${freelancerNome}: `}{last.mensagem}
                        </p>
                      ) : (
                        <p className="text-[10px] text-white/20 mt-0.5 italic">Sem mensagens</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {unread > 0 && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30 font-bold">{unread} nova{unread > 1 ? 's' : ''}</span>
                      )}
                      <span className="text-white/20 group-hover:text-white/50 transition-colors">›</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <button onClick={() => { setSelectedId(null); doneReadRef.current = null }}
            className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 transition-colors">
            ← Voltar
          </button>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.01] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <p className="text-sm font-semibold text-white/80">{selected?.local || '—'}</p>
              {selected?.data_casamento && <p className="text-[10px] text-white/30 mt-0.5">{selected.data_casamento}</p>}
            </div>

            <div className="px-4 py-4 space-y-3 min-h-[200px] max-h-[420px] overflow-y-auto">
              {thread.length === 0 ? (
                <p className="text-center text-white/20 text-xs py-8">Sem mensagens ainda.</p>
              ) : (
                thread.map(m => (
                  <div key={m.id} className={`flex items-end gap-2 group/msg ${m.remetente === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    {m.remetente === 'admin' && (
                      <button onClick={() => handleDelete(m.id)}
                        className="text-[10px] text-white/0 group-hover/msg:text-white/20 hover:!text-red-400 transition-colors shrink-0 mb-1">✕</button>
                    )}
                    <div className={`max-w-[78%] px-4 py-2.5 space-y-1 ${
                      m.remetente === 'admin'
                        ? 'bg-gold/15 border border-gold/25 rounded-2xl rounded-br-sm'
                        : 'bg-white/[0.06] border border-white/[0.09] rounded-2xl rounded-bl-sm'
                    }`}>
                      {m.remetente === 'freelancer' && (
                        <p className="text-[8px] tracking-widest uppercase text-white/30 font-semibold">{freelancerNome}</p>
                      )}
                      <p className="text-sm text-white/90 leading-relaxed">{m.mensagem}</p>
                      <p className="text-[9px] text-white/25 text-right">{fmtHora(m.created_at)}</p>
                    </div>
                    {m.remetente === 'freelancer' && (
                      <button onClick={() => handleDelete(m.id)}
                        className="text-[10px] text-white/0 group-hover/msg:text-white/20 hover:!text-red-400 transition-colors shrink-0 mb-1">✕</button>
                    )}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <div className="px-3 py-3 border-t border-white/[0.06] flex gap-2">
              <input
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Responder..."
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15"
              />
              <button onClick={handleSend} disabled={sending || !texto.trim()}
                className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-base font-bold hover:bg-gold/20 disabled:opacity-30 transition-all shrink-0">
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Notificações Admin Tab ───────────────────────────────────────────────────

function NotificacoesAdminTab({ freelancerId, notificacoes, onRefresh }: { freelancerId: string; notificacoes: Notificacao[]; onRefresh: () => void }) {
  const [form, setForm] = useState({ titulo: '', mensagem: '', tipo: 'alerta' })
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!form.titulo.trim()) return
    setSending(true)
    await fetch('/api/freelancer-notificacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freelancer_id: freelancerId, titulo: form.titulo, mensagem: form.mensagem || null, tipo: form.tipo, lida: false }),
    })
    // Enviar email ao freelancer com o design da notificação
    fetch('/api/send-notif-freelancer-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freelancer_id: freelancerId, titulo: form.titulo, mensagem: form.mensagem || null }),
    }).catch(e => console.error('[send-notif-email]', e))
    setSending(false)
    setForm({ titulo: '', mensagem: '', tipo: 'alerta' })
    onRefresh()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/freelancer-notificacoes?id=${id}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
        <p className={labelCls}>Enviar Notificação</p>
        <div>
          <label className={labelCls}>Tipo</label>
          <select value={form.tipo} onChange={e => setForm(v => ({ ...v, tipo: e.target.value }))} className={selectCls}>
            <option value="alerta" style={optStyle}>⚠ Alerta</option>
            <option value="pagamento" style={optStyle}>💰 Pagamento</option>
            <option value="briefing" style={optStyle}>📋 Briefing</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Título *</label>
          <input value={form.titulo} onChange={e => setForm(v => ({ ...v, titulo: e.target.value }))}
            placeholder="Ex: Novo evento adicionado" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Mensagem</label>
          <textarea value={form.mensagem} onChange={e => setForm(v => ({ ...v, mensagem: e.target.value }))}
            rows={3} placeholder="Mensagem opcional..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors resize-none placeholder:text-white/15" />
        </div>
        <div className="flex justify-end">
          <button onClick={handleSend} disabled={sending || !form.titulo.trim()}
            className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-widest hover:bg-gold/20 disabled:opacity-40 transition-all uppercase">
            {sending ? 'A enviar...' : 'Enviar'}
          </button>
        </div>
      </div>

      {notificacoes.length === 0 ? (
        <p className="text-center py-6 text-white/20 text-xs tracking-widest">Sem notificações enviadas.</p>
      ) : (
        <div className="space-y-2">
          {notificacoes.map(n => (
            <div key={n.id} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] tracking-widest uppercase text-white/30 font-semibold">{n.tipo}</span>
                  {n.lida
                    ? <span className="text-[9px] text-white/20">✓ lida</span>
                    : <span className="text-[9px] text-gold/50">• não lida</span>
                  }
                </div>
                <p className="text-sm text-white/70">{n.titulo}</p>
                {n.mensagem && <p className="text-xs text-white/40 mt-0.5">{n.mensagem}</p>}
                <p className="text-[9px] text-white/20 mt-1">{new Date(n.created_at).toLocaleDateString('pt-PT')}</p>
              </div>
              <button onClick={() => handleDelete(n.id)}
                className="text-white/15 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 mt-0.5 flex-shrink-0">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Notas Tab ────────────────────────────────────────────────────────────────

function NotasTab({ freelancer, onRefresh }: { freelancer: Freelancer; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(freelancer.notas ?? '')
  const [saving, setSaving] = useState(false)
  async function save() {
    setSaving(true)
    try {
      await fetch('/api/freelancers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: freelancer.id, notas: value }) })
      setEditing(false)
      onRefresh()
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">

      {/* ── Notas Internas ── */}
      <div className="space-y-2">
        <p className="text-[9px] tracking-[0.35em] text-white/30 uppercase">Notas Internas</p>
        <div className="space-y-3">
      {editing ? (
        <div className="space-y-3">
          <textarea value={value} onChange={e => setValue(e.target.value)} rows={10}
            placeholder="Notas de workflow, instruções especiais, condições..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15 resize-none leading-relaxed" />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setEditing(false); setValue(freelancer.notas ?? '') }}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
            <button onClick={save} disabled={saving}
              className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="relative group">
          {freelancer.notas ? (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-4 text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
              {freelancer.notas}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-white/[0.08] text-center">
              <p className="text-white/20 text-xs tracking-widest">Sem notas. Clica em editar para adicionar.</p>
            </div>
          )}
          <button onClick={() => setEditing(true)}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
        </div>
      )}
      </div>
      </div>
    </div>
  )
}
