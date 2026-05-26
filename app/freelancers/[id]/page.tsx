'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { TasksWidget, MiniCalendar } from '@/app/components/FreelancerWidgets'

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
  data_confirmada_videografo: boolean | null
  indisponivel: boolean | null
  indisponivel_videografo: boolean | null
  servicos_dia?: string[] | null
  referencia?: string | null
  local_cerimonia?: string | null
  hora_inicio?: string | null
  url_selecao?: string | null
  url_provas?: string | null
  url_editadas?: string | null
  url_album?: string | null
  url_selecao_enviado_em?: string | null
  url_provas_enviado_em?: string | null
  url_editadas_enviado_em?: string | null
  url_album_enviado_em?: string | null
  status_editadas?: string | null
  status_selecao?: string | null
  status_provas?: string | null
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

const inputCls = "w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[14px] text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15 [color-scheme:dark]"
const selectCls = "w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-[14px] text-white outline-none focus:border-gold/40 transition-colors cursor-pointer [color-scheme:dark]"
const optStyle = { backgroundColor: '#1a1a1a', color: 'white' }
const labelCls = "block text-[14px] text-white/25 tracking-widest uppercase mb-1"

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
        <span className="text-[14px] tracking-widest text-white/25 uppercase">Password:</span>
        <span className={`text-[14px] font-mono ${show ? 'text-white/70' : 'text-white/20'} transition-colors`}>
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
          className="text-[14px] bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-white/70 outline-none focus:border-gold/30 w-40 placeholder:text-white/15"
        />
        <button onClick={handleTest} disabled={testing || !test.trim()}
          className="text-[14px] px-2.5 py-1.5 rounded-lg border border-white/15 text-white/40 hover:text-white/70 hover:border-white/30 transition-all disabled:opacity-30 uppercase tracking-widest">
          {testing ? '...' : 'Testar'}
        </button>
        {result === true  && <span className="text-[14px] text-emerald-400">✓ Correta</span>}
        {result === false && <span className="text-[14px] text-red-400">✗ Errada</span>}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FreelancerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<'casamentos'|'edicao'|'album'|'valores'|'info'|'notas'|'pagamentos'|'notificacoes'|'mensagens'|'definicoes'|null>(null)
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
      <p className="text-white/20 text-[14px] tracking-widest uppercase">A carregar...</p>
    </main>
  )

  if (!freelancer) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-red-400/50 text-[14px]">Freelancer não encontrado.</p>
    </main>
  )

  // Lista de próximos (ordenados) e o próximo (primeiro da lista)
  const upcomingList = casamentos
    .filter(c => c.data_casamento && (daysUntil(c.data_casamento) ?? -1) >= 0)
    .sort((a,b) => (a.data_casamento ?? '') < (b.data_casamento ?? '') ? -1 : 1)
  const upcoming = upcomingList[0] ?? null
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

  const tabs: { key: 'casamentos'|'edicao'|'album'|'valores'|'info'|'notas'|'pagamentos'|'notificacoes'|'mensagens'|'definicoes'; label: string; count?: number }[] = [
    { key: 'casamentos',   label: 'Casamentos',  count: casamentos.length },
    ...(!isVideografo ? [{ key: 'edicao' as const, label: 'Edição Fotos', count: edicao.length }] : []),
    ...(isFotografo ? [{ key: 'album' as const, label: 'Edição Álbum', count: album.length }] : []),
    { key: 'valores',      label: 'Valores' },
    { key: 'info',         label: 'Info' },
    { key: 'notas',        label: 'Notas' },
    { key: 'pagamentos',   label: 'Pagamentos', count: pagamentos.length },
    { key: 'mensagens',    label: 'Msgs',   count: mensagens.filter(m => m.remetente === 'freelancer' && !m.lida_admin).length },
    { key: 'notificacoes', label: 'Notif.', count: notificacoes.filter(n => !n.lida).length },
    { key: 'definicoes',   label: 'Definições' },
  ]

  return (
    <div className="min-h-screen text-white relative" style={{ background: '#0B0B0B' }}>
      {/* ── Animações premium ─────────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes proxCasamentoGlow {
          0%, 100% { box-shadow: 0 0 24px -4px rgba(201,164,92,0.30), 0 0 60px -10px rgba(201,164,92,0.18), inset 0 0 0 1px rgba(201,164,92,0.30); }
          50%      { box-shadow: 0 0 36px 0 rgba(201,164,92,0.55), 0 0 80px -4px rgba(201,164,92,0.35), inset 0 0 0 1px rgba(201,164,92,0.55); }
        }
        .prox-casamento-glow { animation: proxCasamentoGlow 3s ease-in-out infinite; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.5s ease-out both; }
        .fade-in-1 { animation: fadeInUp 0.5s ease-out 0.05s both; }
        .fade-in-2 { animation: fadeInUp 0.5s ease-out 0.10s both; }
        .fade-in-3 { animation: fadeInUp 0.5s ease-out 0.15s both; }
        .fade-in-4 { animation: fadeInUp 0.5s ease-out 0.20s both; }
        .fade-in-5 { animation: fadeInUp 0.5s ease-out 0.25s both; }
      `}</style>
      {/* ── Background atmosférico (igual ao /painel-fotografo) ───────── */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 20%, rgba(201,164,92,0.06), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 20% 80%, rgba(201,164,92,0.04), transparent 70%)' }} />

      {/* ── Sidebar lateral (desktop) ──────────────────────────────────── */}
      <SidebarNavAdmin
        freelancer={freelancer}
        tab={tab}
        setTab={setTab}
        counts={{
          casamentos: casamentos.length,
          edicao: edicao.length,
          album: album.length,
          pagamentos: pagamentos.length,
          mensagens: mensagens.filter(m => m.remetente === 'freelancer' && !m.lida_admin).length,
          notificacoes: notificacoes.filter(n => !n.lida).length,
        }}
        isVideografo={isVideografo}
        isFotografo={isFotografo}
      />

    <main className={`relative z-10 min-h-screen px-4 sm:px-6 py-6 mx-auto lg:pl-[230px] lg:pr-4 ${
      tab === null ? 'max-w-none'
        : (['casamentos', 'edicao', 'album', 'pagamentos'] as Array<string | null>).includes(tab) ? 'max-w-[1500px]'
        : 'max-w-3xl'
    }`}>
      {/* Tabs — horizontal apenas em mobile (desktop usa sidebar) */}
      <div className="mb-6 relative flex items-center gap-1 lg:hidden">
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
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[14px] tracking-[0.25em] uppercase font-semibold transition-all ${
                tab === t.key
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-white/30 hover:text-white/55 border border-transparent'
              }`}>
              {t.label}
              {t.count != null && t.count > 0 && (
                <span className={`text-[14px] px-1.5 py-0.5 rounded-full font-bold transition-all ${
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

      {/* Home — Dashboard (cópia do portal do freelancer) */}
      {tab === null && (() => {
        const proximoCasamento = upcomingList[0] ?? null
        const dtuProximo = proximoCasamento ? daysUntil(proximoCasamento.data_casamento) : null
        const edicoesEmCurso = edicao.filter(e => e.status === 'EM EDIÇÃO').length
        const edicoesPendentes = edicao.filter(e => e.status === 'NOVO TRABALHO').length
        const albumsEmCurso = album.filter(a => ['EM EDIÇÃO','EM APROVAÇÃO'].includes(a.status)).length
        const pagPendentes = pagamentos.filter(p => p.status !== 'PAGO').length
        const valorPendente = pagamentos.filter(p => p.status !== 'PAGO').reduce((s, p) => s + (Number(p.valor) || 0), 0)
        const mensagensNaoLidas = mensagens.filter(m => m.remetente === 'freelancer' && !m.lida_admin).length
        const primeiroNome = (freelancer?.nome ?? '').split(' ')[0] || ''
        const totalCasamentos = casamentos.length
        const totalEmEdicao = edicao.filter(e => e.status === 'EM EDIÇÃO').length
        const totalConcluidos = edicao.filter(e => e.status === 'CONCLUÍDO').length
        const totalAguardando = edicao.filter(e => e.status === 'NOVO TRABALHO').length
        const totalRecebido = pagamentos
          .filter(p => p.status === 'PAGO')
          .reduce((s, p) => s + (Number(p.valor) || 0), 0)
        const totalRecebidoLabel = totalRecebido.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
        const anoAtual = new Date().getFullYear()

        // ── Performance Stats (on-time / late / em curso / média dias) ──
        const performanceStats = (() => {
          const concluidos = edicao.filter(e => e.status === 'CONCLUÍDO')
          let onTime = 0
          let late = 0
          let somaDias = 0
          let contDias = 0
          concluidos.forEach(e => {
            const dEntrega = e.data_entrega ? new Date(e.data_entrega) : null
            const dFinal = e.data_final_entrega ? new Date(e.data_final_entrega) : null
            const dCasamento = e.data_casamento ? new Date(e.data_casamento) : null
            // on-time se entrega final <= prazo planeado
            if (dFinal && dEntrega) {
              if (dFinal.getTime() <= dEntrega.getTime()) onTime += 1
              else late += 1
            } else {
              onTime += 1
            }
            // média de dias casamento → entrega final
            if (dCasamento && dFinal) {
              somaDias += Math.max(0, Math.round((dFinal.getTime() - dCasamento.getTime()) / 86400000))
              contDias += 1
            }
          })
          const emCurso = edicao.filter(e => e.status !== 'CONCLUÍDO').length
          const mediaDias = contDias > 0 ? Math.round(somaDias / contDias) : 0
          return { total: edicao.length, onTime, late, emCurso, mediaDias }
        })()

        // ── Chart data: receitas cumulativas por dia do mês atual ───────
        const chartPath = (() => {
          const w = 520, h = 120, pad = 8
          const hoje = new Date()
          const ano = hoje.getFullYear()
          const mes = hoje.getMonth()
          const diasNoMes = new Date(ano, mes + 1, 0).getDate()
          // Cumulativo dia-a-dia dentro do mês
          const cumulative: number[] = []
          let running = 0
          for (let d = 1; d <= diasNoMes; d++) {
            pagamentos.forEach(p => {
              if (p.status === 'PAGO' && p.data_pago) {
                const dp = new Date(p.data_pago)
                if (dp.getFullYear() === ano && dp.getMonth() === mes && dp.getDate() === d) {
                  running += Number(p.valor) || 0
                }
              }
            })
            cumulative.push(running)
          }
          const max = Math.max(...cumulative, 1)
          const step = (w - pad*2) / (cumulative.length - 1 || 1)
          const pts = cumulative.map((v, i) => ({ x: pad + i * step, y: h - pad - (v / max) * (h - pad*2) }))
          let d = `M ${pts[0].x} ${pts[0].y}`
          for (let i = 1; i < pts.length; i++) {
            const p0 = pts[i-1], p1 = pts[i]
            const cx = (p0.x + p1.x) / 2
            d += ` Q ${cx} ${p0.y}, ${cx} ${(p0.y + p1.y) / 2}`
            d += ` T ${p1.x} ${p1.y}`
          }
          const last = pts[pts.length - 1]
          return { path: d, last, w, h, totalMes: cumulative[cumulative.length - 1], diasNoMes }
        })()

        const atividades: Array<{ tipo: string; texto: string; data: string }> = []
        mensagens.slice(0, 10).forEach(m => {
          if (m.remetente === 'freelancer') atividades.push({ tipo: 'msg', texto: `Mensagem: ${(m.mensagem ?? '').slice(0, 60)}${(m.mensagem ?? '').length > 60 ? '…' : ''}`, data: m.created_at })
        })
        notificacoes.slice(0, 10).forEach(n => atividades.push({ tipo: 'notif', texto: n.titulo, data: n.created_at }))
        pagamentos.filter(p => p.data_pago).slice(0, 5).forEach(p => atividades.push({ tipo: 'pag', texto: `Pagamento recebido: ${p.descricao}`, data: p.data_pago! }))
        atividades.sort((a, b) => (b.data || '') > (a.data || '') ? 1 : -1)
        const atividadesRecentes = atividades.slice(0, 6)
        const tempoRelativo = (d: string) => {
          const diff = Date.now() - new Date(d).getTime()
          const h = Math.floor(diff / 36e5)
          if (h < 1) return 'agora'; if (h < 24) return `há ${h}h`
          const dias = Math.floor(h / 24); if (dias < 7) return `há ${dias}d`
          return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
        }

        return (
          <>
          {/* ── HERO Card (estilo Painel Criativo) ─────────────────── */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] mb-6 fade-in-up"
            style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5)' }}>
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1600&h=400&fit=crop"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 z-[1]"
              style={{ background: 'linear-gradient(90deg, rgba(11,11,11,0.97) 0%, rgba(11,11,11,0.88) 35%, rgba(11,11,11,0.5) 65%, rgba(11,11,11,0.12) 100%)' }} />
            <div className="relative z-10 flex items-start justify-between gap-6 px-8 sm:px-12 py-12 sm:py-16">
              <div className="max-w-xl flex items-center gap-5">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gold/50 shrink-0"
                  style={{ boxShadow: '0 0 28px -4px rgba(201,164,92,0.4)' }}>
                  {freelancer?.foto_url ? (
                    <img src={freelancer.foto_url} alt={freelancer.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center text-gold text-xl font-bold">
                      {primeiroNome.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                    Olá, <span className="font-semibold italic text-gold">{primeiroNome}</span>
                  </h1>
                  <p className="text-[16px] text-white/65 mt-4 leading-relaxed font-light italic" style={{ fontFamily: 'Georgia, serif' }}>
                    Que hoje seja mais um dia de transformar momentos<br />em memórias inesquecíveis.
                  </p>
                  <div className="mt-5 h-px w-24 bg-gradient-to-r from-gold/80 via-gold/40 to-transparent" />
                  <p className="text-[11px] tracking-[0.5em] text-gold/70 uppercase mt-4 font-light">Painel Criativo · RL Photo.Video</p>
                </div>
              </div>

              {/* Top-right: notif + messages + profile chip */}
              <div className="flex items-center gap-3 shrink-0">
                <button title="Notificações"
                  className="w-10 h-10 rounded-full border border-white/15 bg-black/40 backdrop-blur-md text-white/70 hover:text-gold hover:border-gold/40 transition-all flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                </button>
                <button title="Mensagens"
                  className="w-10 h-10 rounded-full border border-white/15 bg-black/40 backdrop-blur-md text-white/70 hover:text-gold hover:border-gold/40 transition-all flex items-center justify-center relative">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  {mensagensNaoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-gold text-black text-[10px] font-bold flex items-center justify-center px-1">
                      {mensagensNaoLidas}
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-3 px-3 py-2 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-gold/40 shrink-0">
                    {freelancer?.foto_url
                      ? <img src={freelancer.foto_url} alt={freelancer.nome} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center text-gold text-sm font-bold">{primeiroNome.charAt(0).toUpperCase()}</div>
                    }
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate max-w-[140px]">{primeiroNome}</p>
                    <p className="text-[10px] text-white/40 tracking-wide truncate max-w-[140px]">{isFotografo ? 'Fotógrafo' : 'Editor de Vídeo'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Próximo Casamento (destaque com glow gold pulsante) ─ */}
          {proximoCasamento && (
            <div onClick={() => setTab('casamentos')}
              className="cursor-pointer prox-casamento-glow fade-in-1 bg-gradient-to-br from-gold/[0.10] to-gold/[0.02] border border-gold/40 rounded-2xl p-6 sm:p-7 hover:border-gold/60 transition-all mb-6">
              <p className="text-[11px] tracking-[0.5em] text-gold/80 uppercase font-light mb-3">Próximo Casamento</p>
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-light text-white mb-2 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>{proximoCasamento.local}</h2>
                  <p className="text-[13px] text-white/55 italic" style={{ fontFamily: 'Georgia, serif' }}>{fmtDate(proximoCasamento.data_casamento)}</p>
                </div>
                <div className={`text-right ${dtuProximo !== null && dtuProximo <= 15 ? 'text-red-400' : 'text-gold'}`}>
                  <p className="text-5xl font-light leading-none tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>{dtuProximo === 0 ? 'HOJE' : dtuProximo}</p>
                  <p className="text-[11px] tracking-[0.4em] uppercase mt-1.5 font-light">{dtuProximo === 0 ? '' : dtuProximo === 1 ? 'dia' : 'dias'}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── CTAs ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3 mb-6 fade-in-2">
            <button onClick={() => setTab('casamentos')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-black text-[14px] font-semibold tracking-wider hover:bg-gold/90 transition-all"
              style={{ boxShadow: '0 0 20px -4px rgba(201,168,76,0.5)' }}>
              <span className="text-lg leading-none">+</span> Ver Casamentos
            </button>
            <button onClick={() => setTab('casamentos')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/15 text-white/85 text-[14px] font-medium tracking-wider hover:bg-white/[0.05] hover:border-white/30 transition-all">
              <span className="text-base leading-none">◷</span> Confirmar Disponibilidade
            </button>
          </div>

          {/* ── KPI CARDS premium (igual ao /painel-fotografo) ────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 fade-in-3">
            {([
              { label: 'Casamentos',  value: totalCasamentos.toString(),  sub: 'Total atribuídos',  icon: '◫', tab: 'casamentos' as const },
              { label: 'Em Edição',   value: totalEmEdicao.toString(),    sub: 'Em edição ativa',   icon: '✎', tab: 'edicao' as const },
              { label: 'Concluídos',  value: totalConcluidos.toString(),  sub: 'Entregues',         icon: '✓', tab: 'edicao' as const },
              { label: 'Aguardando',  value: totalAguardando.toString(),  sub: 'Por iniciar',       icon: '◷', tab: 'edicao' as const },
              { label: 'Recebimentos', value: totalRecebidoLabel,         sub: `Total ${anoAtual}`,  icon: '€', tab: 'pagamentos' as const },
            ]).map((k, i) => (
              <button key={i} onClick={() => setTab(k.tab)}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] p-5 hover:border-gold/30 transition-all cursor-pointer text-left w-full"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.6), rgba(11,11,11,0.85))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
              >
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.18), transparent 70%)' }} />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl border border-gold/30 flex items-center justify-center text-2xl text-gold"
                      style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.15), rgba(201,164,92,0.04))', boxShadow: '0 0 22px -4px rgba(201,164,92,0.25)' }}>
                      {k.icon}
                    </div>
                    <div>
                      <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-1">{k.label}</p>
                      <p className="text-3xl font-bold text-white leading-none">{k.value}</p>
                      <p className="text-[11px] text-white/35 mt-1.5">{k.sub}</p>
                    </div>
                  </div>
                  <span className="w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center text-gold/60 group-hover:text-gold group-hover:bg-gold/10 transition-all">›</span>
                </div>
              </button>
            ))}
          </div>

          {/* ── 3-COL: Novos Eventos | Calendário | Tarefas ───────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5 fade-in-4">
            {/* Col 1: Novos Eventos */}
            {casamentos.length > 0 ? (
              <div className="rounded-2xl border border-white/[0.08] p-5"
                style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>Novos <span className="italic text-gold">Eventos</span></h3>
                    <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-gold text-black uppercase tracking-widest font-bold"
                      style={{ boxShadow: '0 0 10px rgba(201,164,92,0.7)' }}>
                      <span className="w-1 h-1 rounded-full bg-black animate-pulse" />
                      {Math.min(casamentos.length, 4)} novo{Math.min(casamentos.length, 4) === 1 ? '' : 's'}
                    </span>
                  </div>
                  <button onClick={() => setTab('casamentos')}
                    className="text-[11px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors">
                    Ver todos →
                  </button>
                </div>
                <div className="space-y-3">
                  {(() => {
                    const placeholderImgs = [
                      'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
                      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=300&fit=crop',
                      'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400&h=300&fit=crop',
                      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=300&fit=crop',
                    ]
                    const ultimos = [...casamentos].slice(-4).reverse()
                    return ultimos.map((c, idx) => (
                      <button key={c.id} onClick={() => setTab('casamentos')}
                        className="w-full text-left relative group flex items-center gap-3 p-2 rounded-xl border border-white/[0.04] hover:border-gold/25 hover:bg-white/[0.02] transition-all cursor-pointer">
                        <div className="w-14 h-11 rounded-lg overflow-hidden shrink-0 border border-white/10">
                          <img src={placeholderImgs[idx % placeholderImgs.length]} alt={c.local}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-[12px] font-medium text-white truncate">{c.local}</p>
                            <span className="inline-flex items-center text-[8px] px-1 py-0.5 rounded bg-gold text-black uppercase tracking-wider shrink-0 font-bold"
                              style={{ boxShadow: '0 0 6px rgba(201,164,92,0.6)' }}>
                              Novo
                            </span>
                          </div>
                          <p className="text-[10px] text-white/45 font-semibold text-gold">
                            {c.data_casamento ? fmtDate(c.data_casamento).split(' · ')[0] : '—'}
                          </p>
                        </div>
                      </button>
                    ))
                  })()}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-5 flex flex-col items-center justify-center text-center min-h-[180px]">
                <span className="text-3xl mb-2 opacity-30">💍</span>
                <p className="text-[12px] text-white/40">Sem casamentos atribuídos</p>
              </div>
            )}

            {/* Col 2: Calendário */}
            <MiniCalendar casamentos={casamentos} onClickDate={() => setTab('casamentos')} />

            {/* Col 3: Tarefas */}
            <TasksWidget freelancerId={id} />
          </div>

          {/* ── 3-COL: Casamentos Editados | Performance | Resumo Financeiro ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5 fade-in-5">

            {/* COL 1: Casamentos Editados */}
            {(() => {
              const editados = edicao.filter(e => e.status === 'CONCLUÍDO').slice(0, 4)
              const placeholderImgs = [
                'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&h=400&fit=crop',
                'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop',
                'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&h=400&fit=crop',
                'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&h=400&fit=crop',
              ]
              return (
                <div className="rounded-2xl border border-white/[0.08] p-5"
                  style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>Casamentos <span className="italic text-gold">Editados</span></h3>
                    <button onClick={() => setTab('edicao')}
                      className="text-[11px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors">
                      Ver todos →
                    </button>
                  </div>
                  {editados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-8">
                      <span className="text-3xl mb-2 opacity-30">✓</span>
                      <p className="text-[12px] text-white/40">Sem casamentos editados</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {editados.map((e, idx) => {
                        const dataLabel = e.data_final_entrega || e.data_entrega
                        return (
                          <button key={e.id} onClick={() => setTab('edicao')}
                            className="group cursor-pointer text-left">
                            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/[0.08] mb-2 group-hover:border-gold/30 transition-all">
                              <img src={placeholderImgs[idx % placeholderImgs.length]}
                                alt={e.nome}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500/90 border border-emerald-300 flex items-center justify-center text-[10px] font-bold text-black">
                                ✓
                              </div>
                            </div>
                            <p className="text-[12px] font-medium text-white truncate group-hover:text-gold transition-colors">{e.nome}</p>
                            <p className="text-[10px] text-white/35">
                              {dataLabel ? `Entrega: ${fmtDate(dataLabel).split(' · ')[0]}` : 'Sem data'}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* COL 2: Performance (donut + média + barras) */}
            {(() => {
              const { total, onTime, late, emCurso, mediaDias } = performanceStats
              const totalEntregues = onTime + late
              const pctOn = totalEntregues > 0 ? Math.round((onTime / totalEntregues) * 100) : 0
              const segs = [
                { value: onTime,  color: '#34d399', label: 'No prazo' },
                { value: late,    color: '#ef4444', label: 'Fora prazo' },
                { value: emCurso, color: '#C9A45C', label: 'Em curso' },
              ]
              const sumAll = segs.reduce((s, x) => s + x.value, 0) || 1
              let cumPct = 0
              const radius = 36, cx = 50, cy = 50
              const polar = (deg: number) => {
                const r = (deg - 90) * Math.PI / 180
                return [cx + radius * Math.cos(r), cy + radius * Math.sin(r)] as const
              }
              const arcs = segs.map(s => {
                const pct = s.value / sumAll
                if (pct === 0) return null
                const startDeg = cumPct * 360
                const endDeg = (cumPct + pct) * 360
                cumPct += pct
                const [x1, y1] = polar(startDeg)
                const [x2, y2] = polar(endDeg)
                const largeArc = endDeg - startDeg > 180 ? 1 : 0
                return { path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`, color: s.color }
              }).filter(Boolean) as { path: string; color: string }[]

              return (
                <div className="rounded-2xl border border-white/[0.08] p-5"
                  style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] font-light text-white" style={{ fontFamily: 'Georgia, serif' }}><span className="italic text-gold">Performance</span></h3>
                    <button onClick={() => setTab('edicao')}
                      className="text-[11px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors">
                      Ver →
                    </button>
                  </div>

                  {/* Top: donut + média lado a lado */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative w-[100px] h-[100px] shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="11" />
                        {arcs.map((a, i) => (
                          <path key={i} d={a.path} fill="none" stroke={a.color} strokeWidth="11" strokeLinecap="butt"
                            style={{ filter: `drop-shadow(0 0 4px ${a.color}80)` }} />
                        ))}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-[8px] tracking-widest uppercase text-white/35 leading-none">Total</p>
                        <p className="text-[22px] font-bold text-white leading-none mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>{total}</p>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 border-l border-white/[0.06] pl-4">
                      <p className="text-[9px] tracking-[0.3em] uppercase text-gold/70 font-bold mb-1.5 leading-tight">Tempo médio</p>
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-[36px] font-bold text-gold leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                          {mediaDias}
                        </p>
                        <p className="text-[11px] text-white/55 font-light">{mediaDias === 1 ? 'dia' : 'dias'}</p>
                      </div>
                      <p className="text-[10px] text-white/40 mt-1 leading-snug">
                        Casamento → Entrega
                      </p>
                    </div>
                  </div>

                  {/* Stats verticais com barras */}
                  <div className="space-y-2.5">
                    {segs.map((s, i) => {
                      const pct = sumAll > 0 ? Math.round((s.value / sumAll) * 100) : 0
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="flex items-center gap-1.5 text-white/65">
                              <span className="w-2 h-2 rounded-full" style={{ background: s.color, boxShadow: `0 0 5px ${s.color}99` }} />
                              {s.label}
                            </span>
                            <span className="font-bold tabular-nums" style={{ color: s.color }}>
                              {s.value} <span className="text-white/30 font-normal text-[10px]">· {pct}%</span>
                            </span>
                          </div>
                          <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                            <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: s.color, boxShadow: `0 0 6px ${s.color}80` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {totalEntregues > 0 && (
                    <p className="text-[10px] text-white/40 pt-3 mt-3 border-t border-white/[0.04]">
                      <span className="text-emerald-300 font-bold">{pctOn}%</span> dos entregues no prazo
                    </p>
                  )}
                  {totalEntregues === 0 && (
                    <p className="text-[10px] text-white/25 italic mt-3 text-center">Sem casamentos entregues ainda</p>
                  )}
                </div>
              )
            })()}

            {/* COL 3: Resumo Financeiro (gráfico SVG) */}
            <div className="rounded-2xl border border-white/[0.08] p-5"
              style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>Resumo <span className="italic text-gold">Financeiro</span></h3>
                <button onClick={() => setTab('pagamentos')}
                  className="text-[11px] tracking-wider text-white/40 hover:text-gold transition-colors px-2 py-1 rounded-md border border-white/10 hover:border-gold/30">
                  Este mês ▾
                </button>
              </div>
              <div className="relative">
                <svg viewBox={`0 0 ${chartPath.w} ${chartPath.h}`} className="w-full h-32">
                  <defs>
                    <linearGradient id="goldGradFL" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9A45C" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#C9A45C" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="goldLineFL" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#C9A45C" />
                      <stop offset="50%" stopColor="#E8C76D" />
                      <stop offset="100%" stopColor="#C9A45C" />
                    </linearGradient>
                  </defs>
                  <path d={`${chartPath.path} L ${chartPath.last.x} ${chartPath.h} L 8 ${chartPath.h} Z`} fill="url(#goldGradFL)" />
                  <path d={chartPath.path} fill="none" stroke="url(#goldLineFL)" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx={chartPath.last.x} cy={chartPath.last.y} r="4" fill="#C9A45C" />
                  <circle cx={chartPath.last.x} cy={chartPath.last.y} r="9" fill="#C9A45C" opacity="0.18" />
                </svg>
                <div className="absolute top-1 right-1 px-2.5 py-1.5 rounded-lg bg-black/80 border border-gold/30">
                  <p className="text-[11px] text-gold font-bold leading-none">{totalRecebidoLabel}</p>
                  <p className="text-[9px] text-white/40 mt-0.5">Total {anoAtual}</p>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-white/30 px-1">
                <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>{chartPath.diasNoMes}</span>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Próximos Casamentos — design premium compacto */}
            {upcomingList.length > 1 && (
              <div className="rounded-2xl border border-white/[0.08] p-4"
                style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[12px] tracking-[0.35em] text-gold/85 uppercase font-bold">Próximos Casamentos</h3>
                    <span className="text-[10px] text-white/30">·</span>
                    <span className="text-[10px] tracking-widest uppercase text-white/35">{Math.min(upcomingList.length, 4)} de {upcomingList.length}</span>
                  </div>
                  <button onClick={() => setTab('casamentos')}
                    className="text-[10px] tracking-widest uppercase text-gold/60 hover:text-gold transition-colors">
                    Ver todos →
                  </button>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {upcomingList.slice(0, 4).map(c => {
                    const dtu2 = daysUntil(c.data_casamento)
                    const urgent = dtu2 !== null && dtu2 <= 15
                    return (
                      <div key={c.id} onClick={() => setTab('casamentos')}
                        className="cursor-pointer flex items-center gap-3 px-2 py-2.5 hover:bg-white/[0.02] transition-all group rounded-lg">
                        {/* Counter compacto + linha vertical */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className={`flex flex-col items-center justify-center min-w-[42px] py-1 rounded-md ${urgent ? 'text-red-400' : 'text-gold'}`}>
                            <span className="text-[18px] font-light leading-none tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>
                              {dtu2 === 0 ? '!' : dtu2}
                            </span>
                            <span className="text-[8px] tracking-[0.25em] uppercase opacity-50 mt-0.5">{dtu2 === 0 ? 'hoje' : 'dias'}</span>
                          </div>
                          <div className={`w-px h-8 ${urgent ? 'bg-red-400/30' : 'bg-gold/20'}`} />
                        </div>
                        {/* Info casamento */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-white/90 truncate group-hover:text-gold transition-colors">{c.local}</p>
                          <p className="text-[10px] text-white/35 mt-0.5 tracking-wide">{fmtDate(c.data_casamento).split(' · ')[0]}</p>
                        </div>
                        {/* Badge confirmação */}
                        {c.data_confirmada ? (
                          <span className="text-[8px] tracking-[0.25em] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            ✓ Conf.
                          </span>
                        ) : (
                          <span className="text-[8px] tracking-[0.25em] uppercase font-bold px-1.5 py-0.5 rounded bg-white/[0.04] text-white/40 border border-white/10">
                            Pend.
                          </span>
                        )}
                        <span className="text-white/20 group-hover:text-gold transition-colors text-sm">›</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            </div>

            {/* ── COLUNA LATERAL (1/3) — Alertas ─────────────────────── */}
            <aside className="lg:col-span-1 flex flex-col gap-4">

              {/* Alerta mensagens não lidas */}
              {mensagensNaoLidas > 0 && (
                <button onClick={() => setTab('mensagens')}
                  className="bg-blue-500/[0.06] border border-blue-500/25 hover:bg-blue-500/[0.1] rounded-2xl p-4 text-left transition-all flex items-center gap-3">
                  <span className="text-2xl">💬</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] tracking-widest uppercase font-bold text-blue-300/85">Mensagens</p>
                    <p className="text-[14px] text-white/40 mt-0.5">{mensagensNaoLidas} {mensagensNaoLidas === 1 ? 'nova' : 'novas'}</p>
                  </div>
                  <span className="text-[14px] tracking-widest uppercase font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">{mensagensNaoLidas}</span>
                </button>
              )}
            </aside>
          </div>
          </>
        )
      })()}

      {/* Definições — antigos controlos admin movidos para aqui */}
      {tab === 'definicoes' && (
        <div className="max-w-3xl space-y-4">
          <h2 className="text-[14px] tracking-[0.4em] text-gold uppercase font-bold mb-4">Definições</h2>

          {/* Foto de perfil */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-[14px] tracking-[0.3em] text-white/25 uppercase mb-1">Foto de Perfil / Hero</p>
            <p className="text-[14px] text-white/35 mb-4 italic">Aparece no avatar e como fundo do hero do portal do freelancer.</p>
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
                <label className={`cursor-pointer px-4 py-2 rounded-xl text-[14px] border transition-all inline-block ${uploadingPhoto ? 'border-white/10 text-white/20' : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white/80'}`}>
                  {uploadingPhoto ? 'A enviar...' : freelancer.foto_url ? 'Alterar foto' : 'Carregar foto'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingPhoto}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }} />
                </label>
                {freelancer.foto_url && (
                  <button onClick={async () => {
                    await fetch('/api/freelancers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, foto_url: null }) })
                    await load()
                  }} className="block text-[14px] text-red-400/50 hover:text-red-400 transition-colors">Remover foto</button>
                )}
              </div>
            </div>
          </div>

          {/* Texto da página inicial */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[14px] tracking-[0.3em] text-white/25 uppercase">Texto da página inicial</p>
              <span className={`text-[14px] tracking-widest transition-all ${
                introHomeStatus === 'saving' ? 'text-white/30' : introHomeStatus === 'saved' ? 'text-emerald-400' : 'text-transparent'
              }`}>{introHomeStatus === 'saving' ? 'A guardar...' : '✓ Guardado'}</span>
            </div>
            <input value={introHomeTitle} onChange={e => handleIntroHomeTitleChange(e.target.value)} placeholder="Título de boas-vindas..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white/70 outline-none focus:border-white/20 transition-colors placeholder:text-white/15 mb-2" />
            <textarea value={introHome} onChange={e => handleIntroHomeChange(e.target.value)} rows={5} placeholder="Escreve aqui o texto..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white/70 outline-none focus:border-white/20 transition-colors resize-none placeholder:text-white/15 leading-relaxed" />
          </div>

          {/* Guia de trabalho */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[14px] tracking-[0.3em] text-white/25 uppercase">Guia de Trabalho</p>
              <span className={`text-[14px] tracking-widest transition-all ${
                guiaStatus === 'saving' ? 'text-white/30' : guiaStatus === 'saved' ? 'text-emerald-400' : 'text-transparent'
              }`}>{guiaStatus === 'saving' ? 'A guardar...' : '✓ Guardado'}</span>
            </div>
            <textarea value={guia} onChange={e => handleGuiaChange(e.target.value)} rows={8} placeholder="Regras e guia de trabalho..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white/70 outline-none focus:border-white/20 transition-colors resize-none placeholder:text-white/15 leading-relaxed" />
          </div>

          {/* Dados do freelancer */}
          {editForm ? (
            <div className="bg-white/[0.02] border border-gold/20 rounded-2xl p-5 space-y-3">
              <p className="text-[14px] tracking-[0.3em] text-gold/60 uppercase mb-1">Editar dados</p>
              {[
                { label: 'Nome', key: 'nome', placeholder: 'Nome' },
                { label: 'Contato', key: 'contato', placeholder: '9XX XXX XXX' },
                { label: 'Email', key: 'email', placeholder: 'email@exemplo.com' },
                { label: 'SOS — Nome', key: 'nome_sos', placeholder: 'Nome familiar' },
                { label: 'SOS — Nº', key: 'contato_sos', placeholder: '9XX XXX XXX' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[14px] text-white/25 tracking-widest uppercase mb-1">{f.label}</label>
                  <input value={(editForm as any)[f.key]} onChange={e => setEditForm(prev => ({ ...prev!, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[14px] text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15" />
                </div>
              ))}
              <div>
                <label className="block text-[14px] text-white/25 tracking-widest uppercase mb-1">Função</label>
                <select value={editForm.status} onChange={e => setEditForm(prev => ({ ...prev!, status: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[14px] text-white/80 outline-none focus:border-gold/40 transition-colors cursor-pointer">
                  {['FOTOGRAFO','VIDEOGRAFO','ASSISTENTE','EDITORES','OUTRO'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEditForm(null)} className="px-3 py-1.5 rounded-lg text-[14px] border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
                <button onClick={handleEditSave} disabled={editSaving} className="px-4 py-1.5 rounded-lg text-[14px] bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
                  {editSaving ? 'A guardar...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
              <p className="text-[14px] tracking-[0.3em] text-white/25 uppercase mb-2">Dados do Freelancer</p>
              {[
                ['Nome', freelancer.nome],
                ['Função', freelancer.status],
                ['Contato', freelancer.contato],
                ['Email', freelancer.email],
                ['SOS', freelancer.nome_sos ? `${freelancer.nome_sos}${freelancer.contato_sos ? ` · ${freelancer.contato_sos}` : ''}` : null],
              ].filter(([,v]) => v).map(([label, val]) => (
                <div key={label as string} className="flex items-center gap-3">
                  <span className="text-[14px] text-white/25 tracking-widest uppercase w-16 shrink-0">{label}</span>
                  <span className="text-[14px] text-white/70">{val}</span>
                </div>
              ))}
              <div className="pt-2">
                <button onClick={() => setEditForm({ nome: freelancer.nome, status: freelancer.status ?? '', contato: freelancer.contato ?? '', email: freelancer.email ?? '', nome_sos: freelancer.nome_sos ?? '', contato_sos: freelancer.contato_sos ?? '' })}
                  className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-[14px] font-semibold tracking-widest hover:bg-gold/20 transition-all uppercase">
                  Editar
                </button>
              </div>
            </div>
          )}
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
    </div>
  )
}

// ─── SidebarNavAdmin ───────────────────────────────────────────────────────
type AdminTabKey = 'casamentos'|'edicao'|'album'|'valores'|'info'|'notas'|'pagamentos'|'notificacoes'|'mensagens'|'definicoes'|null

function SidebarNavAdmin({
  freelancer,
  tab,
  setTab,
  counts,
  isVideografo,
  isFotografo,
}: {
  freelancer: Freelancer | null
  tab: AdminTabKey
  setTab: (t: AdminTabKey) => void
  counts: { casamentos: number; edicao: number; album: number; pagamentos: number; mensagens: number; notificacoes: number }
  isVideografo: boolean
  isFotografo: boolean
}) {
  const items: Array<{ key: AdminTabKey; label: string; icon: string; count?: number }> = [
    { key: null,             label: 'Início',         icon: '⌂' },
    { key: 'casamentos',     label: 'Casamentos',     icon: '◆', count: counts.casamentos },
    ...(!isVideografo ? [{ key: 'edicao' as AdminTabKey, label: 'Edição Fotos', icon: '✎', count: counts.edicao }] : []),
    ...(isFotografo ? [{ key: 'album' as AdminTabKey, label: 'Edição Álbum', icon: '◫', count: counts.album }] : []),
    { key: 'valores',        label: 'Valores',        icon: '€' },
    { key: 'info',           label: 'Info',           icon: 'ⓘ' },
    { key: 'notas',          label: 'Notas',          icon: '✦' },
    { key: 'pagamentos',     label: 'Pagamentos',     icon: '$', count: counts.pagamentos },
    { key: 'mensagens',      label: 'Mensagens',      icon: '✉', count: counts.mensagens },
    { key: 'notificacoes',   label: 'Notificações',   icon: '◉', count: counts.notificacoes },
    { key: 'definicoes',     label: 'Definições',     icon: '⚙' },
  ]

  return (
    <aside
      className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[220px] z-20 flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(10,8,5,0.85) 0%, rgba(14,11,7,0.92) 100%)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(201,168,76,0.12)',
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-8 pb-6 border-b border-gold/10">
        <p className="text-[14px] tracking-[0.45em] text-gold/60 uppercase">RL</p>
        <p className="text-[14px] tracking-[0.18em] text-gold font-light uppercase mt-0.5">Photo<span className="text-white/40">.</span>Video</p>
        <p className="text-[14px] tracking-[0.3em] text-white/30 uppercase mt-2">Admin · Edição</p>
        <div className="mt-3 h-px w-8 bg-gold/40" />
      </div>

      {/* User */}
      {freelancer && (
        <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-3">
          {freelancer.foto_url ? (
            <img src={freelancer.foto_url} alt={freelancer.nome} className="w-9 h-9 rounded-full object-cover border border-gold/30" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-gold text-[14px] font-bold">
              {(freelancer.nome ?? '?').charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-white/85 font-medium truncate">{freelancer.nome}</p>
            {freelancer.status && (
              <p className="text-[14px] tracking-[0.25em] uppercase text-gold/60 mt-0.5">{freelancer.status}</p>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {items.map((it, i) => {
          const active = tab === it.key
          return (
            <button
              key={i}
              onClick={() => setTab(it.key)}
              className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                active
                  ? 'bg-gold/10 border border-gold/25 text-gold'
                  : 'border border-transparent text-white/45 hover:text-white/85 hover:bg-white/[0.03]'
              }`}
            >
              <span className={`w-5 text-center text-base ${active ? 'text-gold' : 'text-white/30 group-hover:text-white/60'}`}>{it.icon}</span>
              <span className="flex-1 text-[14px] tracking-[0.2em] uppercase font-medium">{it.label}</span>
              {it.count && it.count > 0 ? (
                <span className={`text-[14px] px-1.5 py-0.5 rounded-full font-bold ${
                  active ? 'bg-gold/20 text-gold' : 'bg-white/[0.06] text-white/40'
                }`}>{it.count}</span>
              ) : null}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.04]">
        <a href={`/freelancer-view/${freelancer?.id ?? ''}`} target="_blank" rel="noopener noreferrer"
          className="block text-[14px] tracking-[0.25em] uppercase text-white/40 hover:text-gold transition-colors mb-2">
          ↗ Ver como freelancer
        </a>
        <p className="text-[14px] text-white/15">© RL Photo.Video</p>
      </div>
    </aside>
  )
}

// ─── Casamentos Tab ───────────────────────────────────────────────────────────

const DEFAULT_INTRO = `Aqui encontras todos os eventos que te foram atribuídos ao longo do ano. Sempre que um novo evento for adicionado, deverás confirmar a tua disponibilidade.\n\nA 3 dias do evento tens acesso ao briefing com toda a informação necessária para o dia — percurso, contactos, detalhes da cerimónia e muito mais.`

function CasamentosTab({ freelancerId, casamentos, onRefresh, freelancerStatus, freelancer }: { freelancerId: string; casamentos: Casamento[]; onRefresh: () => void; freelancerStatus: string | null; freelancer: Freelancer | null }) {
  const [editing, setEditing] = useState<Casamento | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Partial<Casamento>>({})
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
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

  // Filtros e pesquisa (estilo /novos-projetos)
  const FILTER_TABS = ['Todos', 'Próximos', 'Confirmados', 'Pendentes', 'Passados'] as const
  type FilterTab = typeof FILTER_TABS[number]
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Todos')
  const [search, setSearch] = useState('')
  const [sortOption, setSortOption] = useState('Mais próximos')

  // Placeholder wedding images (rotation)
  const placeholderImgs = [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1525258946800-98cfd641d0de?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&h=400&fit=crop',
  ]

  const sortedAll = [...casamentos].sort((a,b) => (a.data_casamento??'') < (b.data_casamento??'') ? -1 : 1)

  // Aplicar filtros + pesquisa
  const filtered = sortedAll.filter(c => {
    const dtu = daysUntil(c.data_casamento)
    const isPast = dtu !== null && dtu < 0
    if (activeFilter === 'Próximos' && isPast) return false
    if (activeFilter === 'Passados' && !isPast) return false
    if (activeFilter === 'Confirmados' && !c.data_confirmada) return false
    if (activeFilter === 'Pendentes' && (c.data_confirmada || isPast || c.indisponivel)) return false
    if (search.trim() && !c.local.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  const sorted = sortOption === 'Mais distantes' ? [...filtered].reverse() : filtered

  // Contadores
  const totalConfirmados = casamentos.filter(c => c.data_confirmada).length
  const totalPendentes = casamentos.filter(c => !c.data_confirmada && !c.indisponivel && (daysUntil(c.data_casamento) ?? -1) >= 0).length

  return (
    <div className="space-y-5 fade-in-up">

      {/* ── HERO PREMIUM (estilo /novos-projetos) ───────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08]"
        style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)' }}>
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1600&h=400&fit=crop"
            alt="" className="w-full h-full object-cover scale-105" style={{ filter: 'blur(2px)' }} />
        </div>
        <div className="absolute inset-0 z-[1]"
          style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.85) 40%, rgba(10,10,10,0.5) 70%, rgba(10,10,10,0.15) 100%)' }} />
        <div className="relative z-10 flex items-start justify-between gap-6 px-8 sm:px-12 py-10 sm:py-12">
          <div className="max-w-xl">
            <p className="text-[12px] tracking-[0.5em] text-gold/70 uppercase mb-2 font-light">Atelier Fotográfico</p>
            <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              CASAMENTOS <span className="italic text-gold">Atribuídos</span>
            </h1>
            <div className="mt-4 h-px w-20 bg-gradient-to-r from-gold/70 to-transparent" />
            <p className="text-[14px] text-white/55 mt-4 leading-relaxed max-w-md italic" style={{ fontFamily: 'Georgia, serif' }}>
              Cada evento, uma história única para capturar. Acompanha aqui todos os casamentos atribuídos ao longo do ano.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => { setShowAdd(true); setEditing(null); setForm({}) }}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-gold text-black text-[13px] font-semibold tracking-wider hover:bg-gold/90 transition-all"
              style={{ boxShadow: '0 0 24px -4px rgba(201,164,92,0.5)' }}>
              <span className="text-lg leading-none">+</span> Novo Evento
            </button>
          </div>
        </div>
      </div>

      {/* ── FILTERS BAR ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] p-4 backdrop-blur-md"
        style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTER_TABS.map(t => (
              <button key={t} onClick={() => setActiveFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-[12px] tracking-wide transition-all ${
                  activeFilter === t
                    ? 'bg-gold/15 text-gold border border-gold/35'
                    : 'border border-white/[0.06] text-white/45 hover:text-white/80 hover:bg-white/[0.03]'
                }`}>
                {t}
                {t === 'Confirmados' && totalConfirmados > 0 && <span className="ml-1.5 text-[10px] opacity-70">{totalConfirmados}</span>}
                {t === 'Pendentes' && totalPendentes > 0 && <span className="ml-1.5 text-[10px] opacity-70">{totalPendentes}</span>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[14px]">⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar local…"
                className="bg-black/30 border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40 w-56" />
            </div>
            <select value={sortOption} onChange={e => setSortOption(e.target.value)}
              className="bg-black/30 border border-white/[0.08] rounded-lg px-3 py-1.5 text-[12px] text-white/70 focus:outline-none focus:border-gold/40 cursor-pointer">
              <option>Mais próximos</option>
              <option>Mais distantes</option>
            </select>
          </div>
        </div>
        <p className="text-[11px] text-white/35 mt-3">{filtered.length} {filtered.length === 1 ? 'evento' : 'eventos'} · {casamentos.length} no total</p>
      </div>

      {/* ── TEXTO INTRO (editável, recolhido) ───────────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] px-5 py-4 space-y-2"
        style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.3), rgba(11,11,11,0.5))' }}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] tracking-[0.4em] text-gold/60 uppercase font-light">Texto Intro · Secção Casamentos</p>
          {!editingIntro && (
            <button onClick={() => setEditingIntro(true)}
              className="px-3 py-1 rounded-lg text-[10px] border border-white/10 text-white/40 hover:text-gold hover:border-gold/30 transition-all tracking-[0.3em] uppercase">
              Editar
            </button>
          )}
        </div>
        {editingIntro ? (
          <div className="space-y-3">
            <textarea value={introValue} onChange={e => setIntroValue(e.target.value)} rows={5}
              className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-4 py-3 text-[14px] text-white/80 outline-none focus:border-white/30 transition-colors resize-none leading-relaxed" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditingIntro(false); setIntroValue(freelancer?.intro_casamentos ?? DEFAULT_INTRO) }}
                className="px-3 py-1.5 rounded-lg text-[14px] border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
              <button onClick={saveIntro} disabled={savingIntro}
                className="px-4 py-1.5 rounded-lg text-[14px] border border-white/20 text-white font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
                style={{ boxShadow: '0 0 8px rgba(255,255,255,0.15)' }}>
                {savingIntro ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-white/60 leading-relaxed whitespace-pre-wrap">{introValue}</p>
        )}
      </div>

      {showAdd && (
        <CasamentoForm form={form} setForm={setForm} saving={saving} onSave={save} onCancel={() => setShowAdd(false)} />
      )}

      {sorted.length === 0 && !showAdd && (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 flex flex-col items-center justify-center text-center">
          <span className="text-5xl mb-3 opacity-30">📷</span>
          <p className="text-[13px] text-white/40 italic">
            {search || activeFilter !== 'Todos' ? 'Nenhum evento corresponde aos filtros' : 'Sem casamentos registados'}
          </p>
        </div>
      )}

      {/* ── LISTA DE CASAMENTOS (cards premium) ─────────────────────── */}
      <div className="space-y-5">
      {sorted.map((c, idx) => {
        const dtu = daysUntil(c.data_casamento)
        const isUrgent = dtu !== null && dtu >= 0 && dtu <= 15
        const isPast = dtu !== null && dtu < 0
        const img = placeholderImgs[idx % placeholderImgs.length]

        // Status label/badge
        let statusBadge: { label: string; cls: string } | null = null
        if (c.indisponivel) statusBadge = { label: '✕ Indisponível', cls: 'bg-red-500/15 text-red-300 border-red-500/30' }
        else if (c.data_confirmada) statusBadge = { label: '✓ Confirmado', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
        else if (!isPast) statusBadge = { label: 'Pendente', cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30' }

        return editing?.id === c.id ? (
          <CasamentoForm key={c.id} form={form} setForm={setForm} saving={saving} onSave={save}
            onCancel={() => setEditing(null)} onDelete={() => del(c.id)} />
        ) : (
          <div key={c.id}
            className={`group relative overflow-hidden rounded-2xl border transition-all ${isPast ? 'opacity-65' : ''}`}
            style={{
              background: isUrgent
                ? 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(11,11,11,0.85))'
                : 'linear-gradient(135deg, rgba(20,15,8,0.5), rgba(11,11,11,0.85))',
              borderColor: isUrgent ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.06)',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
            }}>
            {/* Hover glow sweep */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/[0.04] to-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

            <div className="relative grid grid-cols-1 lg:grid-cols-[280px_1fr_auto] gap-5 p-5">
              {/* THUMB */}
              <button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                className="relative aspect-[16/10] rounded-xl overflow-hidden border border-white/10 group/img cursor-pointer">
                <img src={img} alt={c.local} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {/* Date label top-left */}
                {c.data_casamento && (
                  <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/15 bg-black/50">
                    <p className={`text-[16px] font-light leading-none tabular-nums ${isUrgent ? 'text-red-300' : 'text-gold'}`} style={{ fontFamily: 'Georgia, serif' }}>
                      {c.data_casamento.split('-')[2]} <span className="text-[10px] uppercase tracking-[0.2em] opacity-70">{MESES[parseInt(c.data_casamento.split('-')[1])-1]}</span>
                    </p>
                  </div>
                )}
                {/* Counter dias bottom-right */}
                {dtu !== null && !isPast && (
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/15 bg-black/50">
                    <p className={`text-[11px] font-bold tracking-widest uppercase ${isUrgent ? 'text-red-300' : 'text-white/70'}`}>
                      {dtu === 0 ? 'HOJE' : `${dtu} dias`}
                    </p>
                  </div>
                )}
              </button>

              {/* INFO */}
              <div className="flex flex-col gap-2 min-w-0">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {statusBadge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border tracking-widest uppercase font-bold ${statusBadge.cls}`}>
                        {statusBadge.label}
                      </span>
                    )}
                    {isUrgent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/40 text-red-300 uppercase tracking-widest font-bold animate-pulse">
                        URGENTE
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>{c.local}</h2>
                  {c.data_casamento && (
                    <p className="text-[12px] text-white/45 italic mt-1" style={{ fontFamily: 'Georgia, serif' }}>{fmtDate(c.data_casamento)}</p>
                  )}
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-1">
                  {c.hora_inicio && (
                    <div>
                      <p className="text-[9px] tracking-[0.3em] uppercase text-white/35 mb-0.5">Hora Início</p>
                      <p className="text-[12px] text-white/80 truncate">⏱ {c.hora_inicio}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[9px] tracking-[0.3em] uppercase text-white/35 mb-0.5">Quinta</p>
                    <p className="text-[12px] text-white/80 truncate">🏛 {c.local || '—'}</p>
                  </div>
                  {c.local_cerimonia && (
                    <div>
                      <p className="text-[9px] tracking-[0.3em] uppercase text-white/35 mb-0.5">Cerimónia</p>
                      <p className="text-[12px] text-white/80 truncate">⛪ {c.local_cerimonia}</p>
                    </div>
                  )}
                  {c.equipa_foto && c.equipa_foto.length > 0 && (
                    <div>
                      <p className="text-[9px] tracking-[0.3em] uppercase text-white/35 mb-0.5">Equipa Foto</p>
                      <p className="text-[12px] text-white/80 truncate">📷 {c.equipa_foto.join(', ')}</p>
                    </div>
                  )}
                  {c.videografo && (
                    <div>
                      <p className="text-[9px] tracking-[0.3em] uppercase text-white/35 mb-0.5">Videógrafo</p>
                      <p className="text-[12px] text-white/80 truncate">🎥 {c.videografo}</p>
                    </div>
                  )}
                  {c.briefing_url && (
                    <div>
                      <p className="text-[9px] tracking-[0.3em] uppercase text-white/35 mb-0.5">Briefing</p>
                      <a href={c.briefing_url} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-[12px] text-gold/80 hover:text-gold underline truncate inline-block">📄 Ver briefing</a>
                    </div>
                  )}
                </div>

                {/* Serviços do Dia (badges) — sempre visível */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[9px] tracking-[0.3em] uppercase text-white/35">Serviços do Dia</p>
                    {(!c.servicos_dia || c.servicos_dia.length === 0) && (
                      <button onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          // Procura evento por local+data e copia servicos_dia
                          const res = await fetch(`/api/eventos-supabase?ano=${(c.data_casamento ?? '').slice(0,4)}`).then(r => r.json())
                          const events = (res?.events ?? []) as any[]
                          const ev = events.find((e: any) =>
                            (e.data_evento ?? '').slice(0,10) === (c.data_casamento ?? '').slice(0,10) &&
                            e.local && (
                              String(e.local).toLowerCase().includes(c.local.toLowerCase()) ||
                              c.local.toLowerCase().includes(String(e.local).toLowerCase())
                            )
                          )
                          if (ev && ev.servicos_dia && ev.servicos_dia.length > 0) {
                            await fetch('/api/freelancer-casamentos', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                id: c.id,
                                servicos_dia: ev.servicos_dia,
                                local_cerimonia: ev.local_cerimonia,
                                hora_inicio: ev.hora_inicio,
                                referencia: ev.referencia,
                              }),
                            })
                            onRefresh()
                          } else {
                            alert('Nenhum evento correspondente encontrado em /eventos-2026 com mesmo local + data.')
                          }
                        } catch (err) {
                          alert('Erro ao sincronizar: ' + (err as Error).message)
                        }
                      }}
                        className="text-[9px] px-2 py-0.5 rounded-full border border-gold/30 text-gold/70 hover:text-gold hover:bg-gold/10 transition-all tracking-wider uppercase">
                        ↻ Sincronizar do evento
                      </button>
                    )}
                  </div>
                  {c.servicos_dia && c.servicos_dia.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {c.servicos_dia.map((s, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 border border-gold/25 text-gold/85 tracking-wide">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-white/30 italic">Sem serviços definidos — clica em "Editar" abaixo para adicionar, ou "Sincronizar do evento" se já estiverem definidos em /eventos-2026.</p>
                  )}
                </div>
              </div>

              {/* RIGHT — ACTIONS */}
              <div className="flex flex-col items-end justify-between gap-3">
                <button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gold/30 text-gold text-[12px] tracking-wider uppercase font-semibold hover:bg-gold/10 transition-all whitespace-nowrap"
                  style={{ boxShadow: '0 0 12px -4px rgba(201,164,92,0.3)' }}>
                  {expandedId === c.id ? <>Fechar <span className="text-base">⌃</span></> : <>Abrir Casamento <span className="text-base">⌄</span></>}
                </button>
                <div className="flex items-center gap-1.5">
                  {!isPast && !c.data_confirmada && !c.indisponivel && (
                    <button onClick={async e => { e.stopPropagation(); await fetch('/api/freelancer-casamentos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, data_confirmada: true }) }); onRefresh() }}
                      className="px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-300 text-[10px] tracking-widest uppercase hover:bg-emerald-500/10 transition-all">
                      ✓ Confirmar
                    </button>
                  )}
                  <button onClick={e => { e.stopPropagation(); del(c.id) }}
                    className="w-8 h-8 rounded-lg border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 transition-all flex items-center justify-center"
                    title="Eliminar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ── EXPANDED PANEL (inline accordion) ─────────────────── */}
            {expandedId === c.id && (
              <div className="relative px-5 pb-5 pt-4 border-t border-gold/15 animate-in fade-in slide-in-from-top-1 space-y-4">
                {/* Helper text */}
                <p className="text-[11px] text-white/40 italic leading-relaxed">
                  Sempre que tiveres uma edição pronta, cola aqui o link para ficar guardado. Depois clica em <span className="text-gold/80 font-semibold not-italic">Enviar Notificação</span> para o admin receber um email com o trabalho. A data de envio fica registada e não desaparece.
                </p>

                {/* Grid de URLs do casamento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {([
                    { key: 'url_selecao',  ts: 'url_selecao_enviado_em',  tipo: 'selecao',  label: 'Seleção de Fotos', icon: '◫' },
                    { key: 'url_provas',   ts: 'url_provas_enviado_em',   tipo: 'provas',   label: 'Fotos Prova',      icon: '◧' },
                    { key: 'url_editadas', ts: 'url_editadas_enviado_em', tipo: 'editadas', label: 'Fotos Editadas',   icon: '✓' },
                    { key: 'url_album',    ts: 'url_album_enviado_em',    tipo: 'album',    label: 'Maquete Álbum',    icon: '◐' },
                  ] as const).map(field => (
                    <UrlEntryCard
                      key={field.key}
                      field={field}
                      casamentoId={c.id}
                      casamentoLocal={c.local}
                      casamentoData={c.data_casamento}
                      freelancerNome={freelancer?.nome ?? ''}
                      initialUrl={(c as any)[field.key] ?? ''}
                      initialSentAt={(c as any)[field.ts] ?? null}
                      initialStatus={
                        field.tipo === 'editadas' ? (c.status_editadas ?? 'AGUARDAR') :
                        field.tipo === 'selecao'  ? (c.status_selecao  ?? 'AGUARDAR') :
                        field.tipo === 'provas'   ? (c.status_provas   ?? 'AGUARDAR') :
                        null
                      }
                      onRefresh={onRefresh}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5">
                  {/* LEFT: ações principais */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Briefing */}
                    {c.briefing_url && (
                      <a href={c.briefing_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gold/30 text-gold text-[11px] tracking-widest uppercase font-semibold hover:bg-gold/10 transition-all">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Briefing ↗
                      </a>
                    )}
                    {/* Confirmar fotógrafo */}
                    {!isPast && (c.data_confirmada ? (
                      <button onClick={async () => { await fetch('/api/freelancer-casamentos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, data_confirmada: false }) }); onRefresh() }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-500/30 text-emerald-300 text-[11px] tracking-widest uppercase font-semibold hover:bg-emerald-500/20 transition-all">
                        ✓ Confirmado 📷
                      </button>
                    ) : (
                      <button onClick={async () => { await fetch('/api/freelancer-casamentos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, data_confirmada: true, indisponivel: false }) }); onRefresh() }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gold/30 text-gold text-[11px] tracking-widest uppercase font-semibold hover:bg-gold/10 transition-all">
                        Confirmar 📷
                      </button>
                    ))}
                    {/* Indisponível fotógrafo */}
                    {!isPast && (c.indisponivel ? (
                      <button onClick={async () => { await fetch('/api/freelancer-casamentos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, indisponivel: false }) }); onRefresh() }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] tracking-widest uppercase font-semibold hover:bg-red-500/20 transition-all">
                        ✕ Indisponível 📷
                      </button>
                    ) : (
                      <button onClick={async () => { await fetch('/api/freelancer-casamentos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, indisponivel: true, data_confirmada: false }) }); onRefresh() }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/40 text-[11px] tracking-widest uppercase font-semibold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all">
                        Indisponível 📷
                      </button>
                    ))}
                    {/* Confirmar videógrafo (se existir) */}
                    {c.videografo && !isPast && (c.data_confirmada_videografo ? (
                      <button onClick={async () => { await fetch('/api/freelancer-casamentos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, data_confirmada_videografo: false }) }); onRefresh() }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-500/30 text-emerald-300 text-[11px] tracking-widest uppercase font-semibold hover:bg-emerald-500/20 transition-all">
                        ✓ Confirmado 🎥
                      </button>
                    ) : (
                      <button onClick={async () => { await fetch('/api/freelancer-casamentos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, data_confirmada_videografo: true, indisponivel_videografo: false }) }); onRefresh() }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gold/30 text-gold text-[11px] tracking-widest uppercase font-semibold hover:bg-gold/10 transition-all">
                        Confirmar 🎥
                      </button>
                    ))}
                  </div>

                  {/* RIGHT: editar */}
                  <button onClick={() => {
                    setEditing(c)
                    setForm({ local: c.local, data_casamento: c.data_casamento ?? '', equipa_foto: c.equipa_foto ?? [], videografo: c.videografo ?? '', briefing_url: c.briefing_url ?? '', servicos_dia: c.servicos_dia ?? [], local_cerimonia: c.local_cerimonia ?? '', hora_inicio: c.hora_inicio ?? '' })
                    setShowAdd(false)
                    setExpandedId(null)
                  }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white/50 text-[11px] tracking-widest uppercase font-semibold hover:bg-white/[0.08] hover:text-white/80 transition-all">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    Editar
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
      </div>

    </div>
  )
}

function CasamentoFicha({ casamento: c, onClose, onEdit, onConfirm, onDelete, isVideografo }: { casamento: Casamento; onClose: () => void; onEdit: () => void; onConfirm?: () => void; onDelete?: () => void; isVideografo?: boolean }) {
  const dtu = daysUntil(c.data_casamento)
  const isUrgent = dtu !== null && dtu >= 0 && dtu <= 15
  const isPast = dtu !== null && dtu < 0
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(c.data_confirmada ?? false)
  const [confirmadoVideo, setConfirmadoVideo] = useState(c.data_confirmada_videografo ?? false)
  const [indisponivelFoto, setIndisponivelFoto] = useState(c.indisponivel ?? false)
  const [indisponivelVideo, setIndisponivelVideo] = useState(c.indisponivel_videografo ?? false)

  async function patch(fields: Record<string, any>) {
    await fetch('/api/freelancer-casamentos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, ...fields }) })
    onConfirm?.()
  }

  async function handleConfirmar() {
    setConfirming(true)
    await patch({ data_confirmada: true, indisponivel: false })
    setConfirmed(true); setIndisponivelFoto(false)
    setConfirming(false)
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
                    <span className={`text-[14px] uppercase tracking-wide font-semibold ${isUrgent ? 'text-red-400/60' : isPast ? 'text-white/20' : 'text-gold/60'}`}>
                      {MESES[parseInt(c.data_casamento.split('-')[1])-1]}
                    </span>
                  </>
                ) : <span className="text-white/20 text-[14px]">—</span>}
              </div>
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wide leading-tight">{c.local || '—'}</h2>
                {c.data_casamento && (
                  <p className={`text-[14px] mt-0.5 ${isUrgent ? 'text-red-400/70' : isPast ? 'text-white/30' : 'text-white/45'}`}>
                    {fmtDate(c.data_casamento)}{c.hora_inicio ? ` · ${c.hora_inicio}` : ''}
                  </p>
                )}
                {dtu !== null && dtu >= 0 && (
                  <span className={`inline-block mt-1 text-[14px] font-bold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-white/[0.08] text-white/40'}`}>
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
            <p className="text-[14px] tracking-[0.3em] text-white/25 uppercase mb-2">Equipa Fotografia</p>
            {c.equipa_foto && c.equipa_foto.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {c.equipa_foto.map((name, i) => (
                  <span key={i} className="text-[14px] px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/70">
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-white/20 italic">Não definida</p>
            )}
          </div>

          {/* Local da Cerimónia */}
          {c.local_cerimonia && (
            <div>
              <p className="text-[14px] tracking-[0.3em] text-white/25 uppercase mb-2">Local da Cerimónia</p>
              <p className="text-[14px] text-white/70">⛪ {c.local_cerimonia}</p>
            </div>
          )}

          {/* Videógrafo */}
          <div>
            <p className="text-[14px] tracking-[0.3em] text-white/25 uppercase mb-2">Videógrafo</p>
            <p className="text-[14px] text-white/70">{c.videografo || <span className="text-white/20 italic">Não definido</span>}</p>
          </div>

          {/* Briefing */}
          <div>
            <p className="text-[14px] tracking-[0.3em] text-white/25 uppercase mb-2">Briefing</p>
            {c.briefing_url ? (
              <a href={c.briefing_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] text-gold/70 hover:text-gold transition-colors border border-gold/20 px-3 py-1.5 rounded-lg hover:bg-gold/5">
                Abrir Briefing ↗
              </a>
            ) : (
              <p className="text-[14px] text-white/20 italic">Sem briefing</p>
            )}
          </div>

          {/* Serviços do Dia */}
          <div>
            <p className="text-[14px] tracking-[0.3em] text-white/25 uppercase mb-2">Serviços do Dia</p>
            {c.servicos_dia && c.servicos_dia.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {c.servicos_dia.map((s, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold/85 tracking-wide">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-white/20 italic">Sem serviços definidos</p>
            )}
          </div>

          {/* Relatório — só para videógrafos */}
          {isVideografo && (
            <div>
              <p className="text-[14px] tracking-[0.3em] text-white/25 uppercase mb-2">Relatório</p>
              <a href="https://tally.so/r/np88GE" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[14px] font-semibold tracking-widest uppercase hover:bg-emerald-500/20 transition-all">
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
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[14px] font-semibold tracking-widest uppercase cursor-default">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Confirmado 📷
              </div>
            ) : (
              <button onClick={handleConfirmar} disabled={confirming}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-[14px] font-semibold tracking-widest uppercase hover:bg-gold/20 transition-all disabled:opacity-50">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {confirming ? '...' : 'Confirmar 📷'}
              </button>
            )
          )}
          {/* Indisponível fotógrafo */}
          {!isPast && (indisponivelFoto ? (
            <button onClick={async () => { await patch({ indisponivel: false }); setIndisponivelFoto(false) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[14px] font-semibold tracking-widest uppercase hover:bg-red-500/20 transition-all">
              ✕ Indisponível 📷
            </button>
          ) : (
            <button onClick={async () => { await patch({ indisponivel: true, data_confirmada: false }); setIndisponivelFoto(true); setConfirmed(false) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/30 text-[14px] font-semibold tracking-widest uppercase hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all">
              Indisponível 📷
            </button>
          ))}
          {/* Videógrafo — só se existir */}
          {c.videografo && !isPast && (<>
            {confirmadoVideo ? (
              <button onClick={async () => { await patch({ data_confirmada_videografo: false }); setConfirmadoVideo(false) }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[14px] font-semibold tracking-widest uppercase hover:bg-emerald-500/20 transition-all">
                ✓ Confirmado 🎥
              </button>
            ) : (
              <button onClick={async () => { await patch({ data_confirmada_videografo: true, indisponivel_videografo: false }); setConfirmadoVideo(true); setIndisponivelVideo(false) }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-[14px] font-semibold tracking-widest uppercase hover:bg-gold/20 transition-all">
                Confirmar 🎥
              </button>
            )}
            {indisponivelVideo ? (
              <button onClick={async () => { await patch({ indisponivel_videografo: false }); setIndisponivelVideo(false) }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[14px] font-semibold tracking-widest uppercase hover:bg-red-500/20 transition-all">
                ✕ Indisponível 🎥
              </button>
            ) : (
              <button onClick={async () => { await patch({ indisponivel_videografo: true, data_confirmada_videografo: false }); setIndisponivelVideo(true); setConfirmadoVideo(false) }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/30 text-[14px] font-semibold tracking-widest uppercase hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all">
                Indisponível 🎥
              </button>
            )}
          </>)}
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white/50 text-[14px] font-semibold tracking-widest hover:bg-white/[0.08] hover:text-white/80 transition-all uppercase ml-auto">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            Editar
          </button>
        </div>
      </div>
    </div>
  )
}

const SERVICOS_DIA_CASAMENTO = [
  'Making Off Noiva',
  'Making Off Noivo',
  'Cerimónia Civil',
  'Cerimónia Igreja',
  'Cocktail',
  'Banquete',
  'Corte do Bolo',
  'Dança dos Noivos',
  'Festa',
  'Sessão Noivos',
  'Foto Lembrança',
  'Sneak Peak',
]

function CasamentoForm({ form, setForm, saving, onSave, onCancel, onDelete }: any) {
  const servicos = (form.servicos_dia ?? []) as string[]
  function toggleServico(s: string) {
    setForm((f: any) => {
      const arr = (f.servicos_dia ?? []) as string[]
      return { ...f, servicos_dia: arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s] }
    })
  }

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
          <label className={labelCls}>Hora de Início</label>
          <input type="time" value={form.hora_inicio ?? ''} onChange={e => setForm((f: any) => ({ ...f, hora_inicio: e.target.value }))} className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Local da Cerimónia</label>
          <input value={form.local_cerimonia ?? ''} onChange={e => setForm((f: any) => ({ ...f, local_cerimonia: e.target.value }))} placeholder="Igreja de São Pedro, Lisboa" className={inputCls} />
        </div>
        <div className="col-span-2">
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
        <div className="col-span-2">
          <label className={labelCls}>Serviços do Dia</label>
          <p className="text-[10px] text-white/30 mb-2 italic">O que vai ser fotografado/filmado neste evento</p>
          <div className="flex flex-wrap gap-2">
            {SERVICOS_DIA_CASAMENTO.map(s => (
              <button type="button" key={s} onClick={() => toggleServico(s)}
                className={`px-3 py-1 rounded-full text-[10px] font-medium tracking-wide border transition-all
                  ${servicos.includes(s) ? 'bg-gold/20 border-gold/50 text-gold' : 'bg-white/[0.03] border-white/10 text-white/40 hover:border-white/25'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        {onDelete ? <button onClick={onDelete} className="text-[14px] text-red-400/60 hover:text-red-400 transition-colors tracking-widest">✕ Remover</button> : <span />}
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-[14px] border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.local} className="px-4 py-1.5 rounded-lg text-[14px] bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
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
          className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-[14px] font-semibold tracking-widest hover:bg-gold/20 transition-all uppercase">
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
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[14px] font-bold tracking-widest uppercase bg-white/[0.02] ${style.col}`}>
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
                      <p className="text-[14px] font-semibold text-white/80 leading-tight">{item.nome}</p>
                      <button onClick={() => { setEditing(item); setForm({ ...item }); setShowAdd(false) }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/25 hover:text-white/60 flex-shrink-0 transition-all">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                    </div>
                    {item.data_casamento && <p className="text-[14px] text-white/30">{fmtDate(item.data_casamento).split(' · ')[0]}</p>}
                    {item.local && <p className="text-[14px] text-white/25">📍 {item.local}</p>}
                    {item.data_entrega && <p className="text-[14px] text-white/25">Entrega: {fmtDate(item.data_entrega).split(' · ')[0]}</p>}
                    {item.referencia_album
                      ? <p className="text-[14px] font-mono text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-fit">🔗 {item.referencia_album}</p>
                      : <p className="text-[14px] text-red-400/60 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded w-fit">⚠ sem referência — sync desativado</p>
                    }
                    {item.fotos_album && (
                      <div className="border-t border-white/[0.04] pt-1.5">
                        <p className="text-[14px] text-white/25 uppercase tracking-widest mb-1">Fotos Álbum</p>
                        <p className="text-[14px] text-white/50 whitespace-pre-wrap leading-relaxed">{item.fotos_album}</p>
                      </div>
                    )}
                    {item.texto_album && (
                      <div className="border-t border-white/[0.04] pt-1.5">
                        <p className="text-[14px] text-white/25 uppercase tracking-widest mb-1">Texto Álbum</p>
                        <p className="text-[14px] text-white/50 whitespace-pre-wrap leading-relaxed">{item.texto_album}</p>
                      </div>
                    )}
                    {/* Status dropdown */}
                    <div className="pt-1 border-t border-white/[0.04]">
                      <select
                        value={item.status}
                        disabled={changingId === item.id}
                        onChange={e => changeStatus(item, e.target.value)}
                        className={`w-full text-[14px] font-bold tracking-widest uppercase px-2 py-1.5 rounded-lg border cursor-pointer outline-none transition-all bg-black/40 ${style.badge} disabled:opacity-50`}>
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
            <p className="text-[14px] font-mono text-emerald-400/70 mt-1">🔗 {form.referencia_album} — {form.nome}</p>
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
          <button onClick={onDelete} className="text-[14px] text-red-400/60 hover:text-red-400 transition-colors tracking-widest">✕ Remover</button>
        ) : <span />}
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-[14px] border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.nome} className="px-4 py-1.5 rounded-lg text-[14px] bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
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
          className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-[14px] font-semibold tracking-widest hover:bg-gold/20 transition-all uppercase">
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
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[14px] font-bold tracking-widest uppercase ${STATUS_STYLE[status]}`}>
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
                      <p className="text-[14px] font-semibold text-white/80 leading-tight">{job.nome}</p>
                      <button onClick={() => { setEditing(job); setForm({ ...job }); setShowAdd(false) }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/25 hover:text-white/60 flex-shrink-0 transition-all">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                    </div>
                    {job.data_casamento && <p className="text-[14px] text-white/30">{fmtDate(job.data_casamento).split(' · ')[0]}</p>}
                    {job.local && <p className="text-[14px] text-white/25">📍 {job.local}</p>}
                    {job.data_entrega && <p className="text-[14px] text-white/25">Entrega: {fmtDate(job.data_entrega).split(' · ')[0]}</p>}
                    {job.referencia
                      ? <p className="text-[14px] font-mono text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-fit">🔗 {job.referencia}</p>
                      : <p className="text-[14px] text-red-400/60 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded w-fit">⚠ sem referência — sync desativado</p>
                    }
                    {/* Foto counts */}
                    {[['Convidados', job.convidados],['Cerimónia', job.cerimonia],['Detalhes', job.detalhes],['Sala', job.sala_animacao],['Álbum', job.fotos_album],['Bolo/Bouquet', job.bolo_bouquet],['Noivos', job.sessao_noivos],['Noiva', job.fotos_noiva],['Noivo', job.fotos_noivo]].some(([,v]) => v) && (
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-white/[0.04]">
                        {[['C', job.convidados],['Cer', job.cerimonia],['Det', job.detalhes],['Sala', job.sala_animacao],['Alb', job.fotos_album],['B/B', job.bolo_bouquet],['Nv', job.sessao_noivos],['Noiva', job.fotos_noiva],['Noivo', job.fotos_noivo]].filter(([,v]) => v).map(([k,v]) => (
                          <span key={k as string} className="text-[14px] bg-white/[0.04] text-white/35 px-1.5 py-0.5 rounded">{k}: {v}</span>
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
                          className="appearance-none w-full text-[14px] tracking-[0.2em] uppercase font-semibold px-3 py-2 pr-7 rounded-xl border border-white/20 bg-white/[0.05] text-white outline-none cursor-pointer transition-all hover:border-white/40 hover:bg-white/[0.08] [color-scheme:dark]"
                        >
                          {STATUS_EDICAO.map(s => (
                            <option key={s} value={s} className="bg-zinc-900 text-white">{s}</option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[14px] text-white/50">▾</span>
                      </div>
                      <a
                        href={`/fotos-selecao?ref=${encodeURIComponent(job.nome)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] px-3 py-1.5 rounded-lg border border-gold/30 bg-gold/5 text-gold/70 hover:text-gold hover:border-gold/50 hover:bg-gold/10 transition-all tracking-widest uppercase text-center"
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
            <p className="text-[14px] font-mono text-emerald-400/70 mt-1">🔗 {form.referencia} — {form.nome}</p>
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
      <p className="text-[14px] text-white/25 tracking-widest uppercase pt-1">Contagem de fotos</p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {numInput('convidados','Convidados')}{numInput('cerimonia','Cerimónia')}{numInput('detalhes','Detalhes')}
        {numInput('sala_animacao','Sala/Anim.')}{numInput('fotos_album','Álbum')}{numInput('bolo_bouquet','Bolo/Bouq.')}
        {numInput('sessao_noivos','Sessão Noivos')}{numInput('fotos_noiva','Fotos Noiva')}{numInput('fotos_noivo','Fotos Noivo')}
      </div>
      <div className="flex items-center justify-between pt-1">
        {onDelete ? <button onClick={onDelete} className="text-[14px] text-red-400/60 hover:text-red-400 transition-colors tracking-widest">✕ Remover</button> : <span />}
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-[14px] border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.nome} className="px-4 py-1.5 rounded-lg text-[14px] bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
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
          className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-[14px] font-semibold tracking-widest hover:bg-gold/20 transition-all uppercase">
          + Adicionar
        </button>
      </div>

      {showAdd && <ValorForm form={form} setForm={setForm} saving={saving} onSave={save} onCancel={() => setShowAdd(false)} />}

      <div className="overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Serviço','Unid.','€/Serviço','Kms','€/Km','Total',''].map(h => (
                <th key={h} className="px-3 py-2 text-[14px] text-white/25 tracking-widest uppercase text-left font-normal">{h}</th>
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
                <td colSpan={5} className="px-3 py-2 text-[14px] text-white/25 tracking-widest uppercase">Total</td>
                <td className="px-3 py-2 text-gold font-bold">{totalGeral.toFixed(2)}€</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
        {valores.length === 0 && !showAdd && <p className="text-center py-8 text-white/20 text-[14px] tracking-widest">Sem valores registados.</p>}
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
        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/25 text-[14px]">{suffix}</span>}
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
          <span className="text-[14px] text-gold font-semibold">
            = {((form.total_unidade ?? 0) * (form.valor_servico ?? 0) + (form.kms ?? 0) * (form.valor_ao_km ?? 0)).toFixed(2)}€
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        {onDelete ? <button onClick={onDelete} className="text-[14px] text-red-400/60 hover:text-red-400 transition-colors tracking-widest">✕ Remover</button> : <span />}
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-[14px] border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.servico} className="px-4 py-1.5 rounded-lg text-[14px] bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
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
          className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-[14px] font-semibold tracking-widest hover:bg-gold/20 transition-all uppercase">
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
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-lg text-[14px] border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
            <button onClick={save} disabled={saving} className="px-4 py-1.5 rounded-lg text-[14px] bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {info.length === 0 && !showAdd && <p className="text-center py-10 text-white/20 text-[14px] tracking-widest">Sem informação registada.</p>}

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
              <button onClick={() => del(item.id)} className="text-[14px] text-red-400/60 hover:text-red-400 transition-colors tracking-widest">✕ Remover</button>
              <div className="flex gap-2">
                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-[14px] border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
                <button onClick={save} disabled={saving} className="px-4 py-1.5 rounded-lg text-[14px] bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
                  {saving ? 'A guardar...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div key={item.id} className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] group hover:border-white/[0.12] transition-all">
            <span className="text-[14px] text-white/30 uppercase tracking-widest w-28 flex-shrink-0">{item.label ?? '—'}</span>
            <span className="text-[14px] text-white/75 flex-1">{item.valor ?? '—'}</span>
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
            <p className="text-[14px] tracking-widest uppercase text-white/25 mb-0.5">{label}</p>
            <p className={`text-lg font-light ${cls}`}>{fmtEuro(val)}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={() => { setShowAdd(true); setEditId(null) }}
          className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-[14px] font-semibold tracking-widest hover:bg-gold/20 transition-all uppercase">
          + Pagamento
        </button>
      </div>

      {showAdd && (
        <div className="bg-white/[0.02] border border-gold/20 rounded-2xl p-5 space-y-3">
          <p className="text-[14px] tracking-[0.3em] text-gold/60 uppercase">Novo Pagamento</p>
          <PagaForm f={form} setF={setForm} casamentos={casamentos} />
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-lg text-[14px] border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
            <button onClick={handleAdd} disabled={saving || !form.descricao.trim()}
              className="px-4 py-1.5 rounded-lg text-[14px] bg-gold text-black font-semibold hover:bg-gold/80 disabled:opacity-40 transition-all">
              {saving ? '...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {pagamentos.length === 0 && !showAdd && (
        <p className="text-center py-8 text-white/20 text-[14px] tracking-widest">Sem pagamentos registados.</p>
      )}

      {pagamentos.map(p => (
        editId === p.id && editForm ? (
          <div key={p.id} className="bg-white/[0.02] border border-white/20 rounded-2xl p-5 space-y-3">
            <p className={labelCls}>Editar</p>
            <PagaForm f={editForm} setF={setEditForm as any} casamentos={casamentos} />
            <div className="flex justify-between pt-1">
              <button onClick={() => handleDelete(p.id)} className="text-[14px] text-red-400/50 hover:text-red-400 transition-colors">✕ Remover</button>
              <div className="flex gap-2">
                <button onClick={() => { setEditId(null); setEditForm(null) }} className="px-3 py-1.5 rounded-lg text-[14px] border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
                <button onClick={handleEdit} disabled={saving}
                  className="px-4 py-1.5 rounded-lg text-[14px] bg-gold text-black font-semibold hover:bg-gold/80 disabled:opacity-40 transition-all">
                  {saving ? '...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div key={p.id} className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] group">
            <div className="flex-1 min-w-0">
              {p.casamento_id && (() => { const c = casamentos.find(c => c.id === p.casamento_id); return c ? <p className="text-[14px] tracking-[0.2em] text-gold/50 uppercase mb-0.5">📍 {c.local}{c.data_casamento ? ` · ${c.data_casamento}` : ''}</p> : null })()}
              <p className="text-[14px] text-white/80">{p.descricao}</p>
              <div className="flex flex-wrap gap-x-3 mt-0.5">
                {p.data_prevista && <span className="text-[14px] text-white/30">Previsto: {fmtDate(p.data_prevista).split(' · ')[0]}</span>}
                {p.data_pago && <span className="text-[14px] text-emerald-400/60">Pago: {fmtDate(p.data_pago).split(' · ')[0]}</span>}
                {p.notas && <span className="text-[14px] text-white/20 italic">{p.notas}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-base font-light text-white/70">{p.valor != null ? fmtEuro(p.valor) : '—'}</span>
              {p.status !== 'PAGO' ? (
                <button onClick={() => quickPago(p.id)}
                  className="text-[14px] px-2.5 py-1 rounded-full border bg-yellow-500/15 text-yellow-400 border-yellow-500/30 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/30 tracking-widest uppercase font-medium transition-all">
                  {p.status}
                </button>
              ) : (
                <span className="text-[14px] px-2.5 py-1 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 tracking-widest uppercase font-medium">
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
            <p className="text-white/20 text-[14px] py-6 text-center">Sem eventos disponíveis.</p>
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
                      <p className="text-[14px] text-white/80 truncate">{c.local || '—'}</p>
                      {last ? (
                        <p className="text-[14px] text-white/30 mt-0.5 truncate">
                          {last.remetente === 'admin' ? 'Tu: ' : `${freelancerNome}: `}{last.mensagem}
                        </p>
                      ) : (
                        <p className="text-[14px] text-white/20 mt-0.5 italic">Sem mensagens</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {unread > 0 && (
                        <span className="text-[14px] px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30 font-bold">{unread} nova{unread > 1 ? 's' : ''}</span>
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
            className="flex items-center gap-1.5 text-[14px] text-white/30 hover:text-white/60 transition-colors">
            ← Voltar
          </button>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.01] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <p className="text-[14px] font-semibold text-white/80">{selected?.local || '—'}</p>
              {selected?.data_casamento && <p className="text-[14px] text-white/30 mt-0.5">{selected.data_casamento}</p>}
            </div>

            <div className="px-4 py-4 space-y-3 min-h-[200px] max-h-[420px] overflow-y-auto">
              {thread.length === 0 ? (
                <p className="text-center text-white/20 text-[14px] py-8">Sem mensagens ainda.</p>
              ) : (
                thread.map(m => (
                  <div key={m.id} className={`flex items-end gap-2 group/msg ${m.remetente === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    {m.remetente === 'admin' && (
                      <button onClick={() => handleDelete(m.id)}
                        className="text-[14px] text-white/0 group-hover/msg:text-white/20 hover:!text-red-400 transition-colors shrink-0 mb-1">✕</button>
                    )}
                    <div className={`max-w-[78%] px-4 py-2.5 space-y-1 ${
                      m.remetente === 'admin'
                        ? 'bg-gold/15 border border-gold/25 rounded-2xl rounded-br-sm'
                        : 'bg-white/[0.06] border border-white/[0.09] rounded-2xl rounded-bl-sm'
                    }`}>
                      {m.remetente === 'freelancer' && (
                        <p className="text-[14px] tracking-widest uppercase text-white/30 font-semibold">{freelancerNome}</p>
                      )}
                      <p className="text-[14px] text-white/90 leading-relaxed">{m.mensagem}</p>
                      <p className="text-[14px] text-white/25 text-right">{fmtHora(m.created_at)}</p>
                    </div>
                    {m.remetente === 'freelancer' && (
                      <button onClick={() => handleDelete(m.id)}
                        className="text-[14px] text-white/0 group-hover/msg:text-white/20 hover:!text-red-400 transition-colors shrink-0 mb-1">✕</button>
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
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-[14px] text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15"
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
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[14px] text-white/80 outline-none focus:border-gold/40 transition-colors resize-none placeholder:text-white/15" />
        </div>
        <div className="flex justify-end">
          <button onClick={handleSend} disabled={sending || !form.titulo.trim()}
            className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-[14px] font-semibold tracking-widest hover:bg-gold/20 disabled:opacity-40 transition-all uppercase">
            {sending ? 'A enviar...' : 'Enviar'}
          </button>
        </div>
      </div>

      {notificacoes.length === 0 ? (
        <p className="text-center py-6 text-white/20 text-[14px] tracking-widest">Sem notificações enviadas.</p>
      ) : (
        <div className="space-y-2">
          {notificacoes.map(n => (
            <div key={n.id} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[14px] tracking-widest uppercase text-white/30 font-semibold">{n.tipo}</span>
                  {n.lida
                    ? <span className="text-[14px] text-white/20">✓ lida</span>
                    : <span className="text-[14px] text-gold/50">• não lida</span>
                  }
                </div>
                <p className="text-[14px] text-white/70">{n.titulo}</p>
                {n.mensagem && <p className="text-[14px] text-white/40 mt-0.5">{n.mensagem}</p>}
                <p className="text-[14px] text-white/20 mt-1">{new Date(n.created_at).toLocaleDateString('pt-PT')}</p>
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
        <p className="text-[14px] tracking-[0.35em] text-white/30 uppercase">Notas Internas</p>
        <div className="space-y-3">
      {editing ? (
        <div className="space-y-3">
          <textarea value={value} onChange={e => setValue(e.target.value)} rows={10}
            placeholder="Notas de workflow, instruções especiais, condições..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15 resize-none leading-relaxed" />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setEditing(false); setValue(freelancer.notas ?? '') }}
              className="px-3 py-1.5 rounded-lg text-[14px] border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
            <button onClick={save} disabled={saving}
              className="px-4 py-1.5 rounded-lg text-[14px] bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="relative group">
          {freelancer.notas ? (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-4 text-[14px] text-white/70 leading-relaxed whitespace-pre-wrap">
              {freelancer.notas}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-white/[0.08] text-center">
              <p className="text-white/20 text-[14px] tracking-widest">Sem notas. Clica em editar para adicionar.</p>
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

// ─── UrlEntryCard — card de URL com estado local + botão enviar notificação ───
const STATUS_OPTIONS_BY_TIPO: Record<string, string[]> = {
  selecao:  ['AGUARDAR', 'EM SELEÇÃO', 'SELECIONADAS', 'ENTREGUE'],
  editadas: ['AGUARDAR', 'EM EDIÇÃO',  'EDITADAS',     'ENTREGUE'],
  provas:   ['AGUARDAR', 'GALERIA PUBLICADA'],
}
const STATUS_CLS: Record<string, string> = {
  'AGUARDAR':          'bg-white/[0.06] text-white/55 border-white/15',
  'EM EDIÇÃO':         'bg-amber-500/15 text-amber-300 border-amber-500/40',
  'EM SELEÇÃO':        'bg-amber-500/15 text-amber-300 border-amber-500/40',
  'EDITADAS':          'bg-blue-500/15 text-blue-300 border-blue-500/40',
  'SELECIONADAS':      'bg-blue-500/15 text-blue-300 border-blue-500/40',
  'GALERIA PUBLICADA': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  'ENTREGUE':          'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
}
const STATUS_COL_BY_TIPO: Record<string, string> = {
  selecao:  'status_selecao',
  editadas: 'status_editadas',
  provas:   'status_provas',
}
const STATUS_LABEL_BY_TIPO: Record<string, string> = {
  selecao:  'Estado da Seleção',
  editadas: 'Estado da Edição',
  provas:   'Estado das Provas',
}

function UrlEntryCard({
  field,
  casamentoId,
  casamentoLocal,
  casamentoData,
  freelancerNome,
  initialUrl,
  initialSentAt,
  initialStatus,
  onRefresh,
}: {
  field: { key: string; ts: string; tipo: string; label: string; icon: string }
  casamentoId: string
  casamentoLocal: string
  casamentoData: string | null
  freelancerNome: string
  initialUrl: string
  initialSentAt: string | null
  initialStatus?: string | null
  onRefresh: () => void
}) {
  // Estado LOCAL — não desaparece quando lista re-renderiza
  const [url, setUrl] = useState(initialUrl ?? '')
  const [sentAt, setSentAt] = useState<string | null>(initialSentAt ?? null)
  const [status, setStatus] = useState<string>(initialStatus ?? 'AGUARDAR')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)

  // Sync com props quando refresh externo
  useEffect(() => { setUrl(initialUrl ?? '') }, [initialUrl])
  useEffect(() => { setSentAt(initialSentAt ?? null) }, [initialSentAt])
  useEffect(() => { if (initialStatus) setStatus(initialStatus) }, [initialStatus])

  async function saveStatus(newStatus: string) {
    if (newStatus === status) return
    setStatus(newStatus)
    setSavingStatus(true)
    try {
      const statusCol = STATUS_COL_BY_TIPO[field.tipo]
      if (!statusCol) return
      await fetch('/api/freelancer-casamentos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: casamentoId, [statusCol]: newStatus }),
      })
    } finally { setSavingStatus(false) }
  }

  const sentAtFmt = sentAt
    ? new Date(sentAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null
  const hasUrl = url.trim().length > 0

  async function saveUrl(newVal: string) {
    if (newVal === initialUrl) return
    setSaving(true)
    try {
      await fetch('/api/freelancer-casamentos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: casamentoId, [field.key]: newVal || null }),
      })
    } finally { setSaving(false) }
  }

  async function enviarNotificacao() {
    if (!url.trim()) return
    setSending(true)
    try {
      // 1) Garantir URL guardada
      await saveUrl(url.trim())
      // 2) Guardar timestamp do envio (aparece no sino do admin)
      const now = new Date().toISOString()
      await fetch('/api/freelancer-casamentos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: casamentoId, [field.ts]: now }),
      })
      setSentAt(now)
      onRefresh()
    } catch (err) {
      alert('Erro: ' + (err as Error).message)
    } finally { setSending(false) }
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gold/70 text-base">{field.icon}</span>
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/45 font-light">{field.label}</p>
        </div>
        {hasUrl && (
          <a href={url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[10px] text-gold/70 hover:text-gold tracking-wider uppercase transition-colors">
            Abrir ↗
          </a>
        )}
      </div>
      <input
        type="url"
        value={url}
        placeholder="https://..."
        onClick={e => e.stopPropagation()}
        onChange={e => setUrl(e.target.value)}
        onBlur={e => saveUrl(e.target.value.trim())}
        className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[11px] text-white/85 placeholder:text-white/20 outline-none focus:border-gold/40 transition-colors"
      />
      {sentAtFmt ? (
        <div className="flex items-center justify-between text-[10px]">
          <span className="inline-flex items-center gap-1 text-emerald-400/85 tracking-wider uppercase font-semibold">
            ✓ Enviado · {sentAtFmt}
          </span>
          {hasUrl && (
            <button onClick={e => { e.stopPropagation(); enviarNotificacao() }}
              disabled={sending}
              className="text-white/30 hover:text-gold tracking-wider uppercase transition-colors disabled:opacity-50">
              {sending ? '...' : '↻ Reenviar'}
            </button>
          )}
        </div>
      ) : (
        <button
          disabled={!hasUrl || sending}
          onClick={e => { e.stopPropagation(); enviarNotificacao() }}
          className={`w-full text-[10px] tracking-wider uppercase font-semibold rounded-lg px-2 py-1.5 transition-all ${
            hasUrl
              ? 'bg-gold text-black hover:bg-gold/90'
              : 'bg-white/[0.04] text-white/20 cursor-not-allowed border border-white/[0.06]'
          } ${sending ? 'opacity-50' : ''}`}
          style={hasUrl ? { boxShadow: '0 0 12px -4px rgba(201,164,92,0.5)' } : undefined}>
          {sending ? 'A enviar...' : '✉ Enviar Notificação'}
        </button>
      )}
      {saving && <p className="text-[9px] text-gold/40 italic">A guardar URL...</p>}

      {/* Estado — para Seleção, Provas e Editadas */}
      {STATUS_OPTIONS_BY_TIPO[field.tipo] && (
        <div className="pt-2 mt-1 border-t border-white/[0.04]">
          <p className="text-[9px] tracking-[0.3em] uppercase text-white/35 mb-1.5">
            {STATUS_LABEL_BY_TIPO[field.tipo] ?? 'Estado'}
          </p>
          <div className="grid grid-cols-2 gap-1">
            {STATUS_OPTIONS_BY_TIPO[field.tipo].map(opt => {
              const active = status === opt
              return (
                <button key={opt}
                  onClick={e => { e.stopPropagation(); saveStatus(opt) }}
                  className={`text-[9px] px-2 py-1.5 rounded-md tracking-wider uppercase font-semibold border transition-all ${
                    active ? STATUS_CLS[opt] : 'bg-transparent text-white/35 border-white/[0.06] hover:text-white/70 hover:border-white/15'
                  }`}>
                  {opt}
                </button>
              )
            })}
          </div>
          {savingStatus && <p className="text-[9px] text-gold/40 italic mt-1">A guardar...</p>}
        </div>
      )}
    </div>
  )
}
