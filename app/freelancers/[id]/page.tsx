'use client'

import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
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
  status_album?: string | null
  // Editores atribuídos ao evento (vêm da tabela evento_equipa)
  editor_fotos?: string[] | string | null
  editor_album?: string[] | string | null
  editor_video?: string[] | string | null
  // Noivos (enriquecido pelo backend a partir de eventos_2026.cliente / dados_contrato_cps)
  nome_noivos?: string | null
  nome_noiva?: string | null
  nome_noivo?: string | null
  // Toggle admin: false ⇒ casamento NÃO gera alertas/prazos de fotografia
  alertas_fotografia_ativos?: boolean | null
  // Relatório Diário do videógrafo (o que gravou + tipo de cerimónia + áudio,
  // drone, equipa de animação e máquina utilizada)
  relatorio_diario?: {
    gravado?: string[]
    tipoCerimonia?: string[]
    audio?: string[]
    drone?: string[]
    equipaAnimacao?: string[]
    equipaAnimacaoOutra?: string
    maquina?: string
    audiosNuvem?: string
    vaisFazerBackup?: string
    problemaTecnico?: string
    infoRelevante?: string
    enviado?: boolean
    enviadoEm?: string
  } | null
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

// Acrescenta ?freelancer=1 ao URL do briefing para o portal dos noivos abrir
// em modo bloqueado (só o briefing, sem navegação para o resto do portal).
function withBriefingLock(url: string | null): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    u.searchParams.set('freelancer', '1')
    return u.toString()
  } catch {
    return url + (url.includes('?') ? '&' : '?') + 'freelancer=1'
  }
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

// ─── Palavra-chave (admin reveal + copy) ──────────────────────────────────────

function PalavraChaveCell({ password }: { password: string | null }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)
  if (!password) return <span className="text-white/40 italic text-[13px]">— sem palavra-chave</span>
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`font-mono text-[13px] tracking-wider ${show ? 'text-gold' : 'text-white/30'} transition-colors`}>
        {show ? password : '••••••••'}
      </span>
      <button onClick={() => setShow(v => !v)} title={show ? 'Ocultar' : 'Mostrar'}
        className="text-white/40 hover:text-gold transition-colors">
        {show
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        }
      </button>
      <button onClick={handleCopy} title="Copiar"
        className={`text-[10px] px-2 py-0.5 rounded border tracking-widest uppercase transition-all ${
          copied
            ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
            : 'border-white/15 text-white/45 hover:text-gold hover:border-gold/40'
        }`}>
        {copied ? '✓ Copiada' : 'Copiar'}
      </button>
    </span>
  )
}

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
  // useSearchParams requires Suspense in Next.js 16 — wrap inner component
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#0B0B0B' }} />}>
      <FreelancerDetailInner />
    </Suspense>
  )
}

function FreelancerDetailInner() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const viewAsFreelancer = searchParams?.get('view') === 'freelancer'

  // ── Heartbeat de presença: regista atividade do membro a cada 60s
  //    quando a tab está visível + renova o cookie fl_session (sliding
  //    window). Roda apenas quando viewAsFreelancer.
  //    Se a sessão tiver expirado (401), redirect imediato para /login.
  useEffect(() => {
    if (!viewAsFreelancer || !id) return
    async function ping() {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      try {
        const res = await fetch('/api/freelancer-presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}), // sem freelancer_id — força uso da cookie
          keepalive: true,
        })
        if (res.status === 401) {
          // Sessão expirada → manda para login com next para voltar aqui
          const next = `/freelancers/${id}?view=freelancer`
          window.location.href = `/login?next=${encodeURIComponent(next)}`
        }
      } catch { /* offline silencioso */ }
    }
    ping() // primeiro tick imediato
    const iv = setInterval(ping, 60_000) // 60s
    const onVis = () => { if (document.visibilityState === 'visible') ping() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(iv)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [viewAsFreelancer, id])
  const [tab, setTab] = useState<'casamentos'|'edicao'|'album'|'tarefas'|'calendario'|'info'|'notas'|'pagamentos'|'notificacoes'|'mensagens'|'definicoes'|null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // ID de casamento a abrir expandido quando o utilizador entra na tab Casamentos
  // — usado pelas notificações para abrir directamente o casamento associado.
  const [pendingExpandCasamentoId, setPendingExpandCasamentoId] = useState<string | null>(null)
  // Toggle do card Crítico · Entrega — persistente em localStorage
  const [criticoOpen, setCriticoOpen] = useState(true)
  useEffect(() => {
    try {
      const v = localStorage.getItem('critico_entrega_open')
      if (v !== null) setCriticoOpen(v === '1')
    } catch {}
  }, [])
  function toggleCritico() {
    setCriticoOpen(prev => {
      const next = !prev
      try { localStorage.setItem('critico_entrega_open', next ? '1' : '0') } catch {}
      return next
    })
  }
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
  // Períodos de indisponibilidade declarados pelo membro
  const [disponibilidade, setDisponibilidade] = useState<Array<{ id: string; freelancer_id: string; data_inicio: string; data_fim: string | null; motivo: string | null }>>([])
  // Mapa referencia → data_entrada (quando os noivos enviaram fotos para edição)
  const [fotosSelecaoMap, setFotosSelecaoMap] = useState<Record<string, string>>({})
  // Mapa referencia → { email, ctt, listas, workflows } para "Fotos Convidados"
  const [fotosConvidadosMap, setFotosConvidadosMap] = useState<Record<string, { email: string | null; ctt: string | null; emailLista: string[]; cttLista: string[]; emailWorkflow: string; cttWorkflow: string }>>({})
  // Datas das tarefas (do localStorage) — para marcar no MiniCalendar
  const [taskDates, setTaskDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Lê datas das tarefas do localStorage e refresca em focus
  useEffect(() => {
    if (!id) return
    function loadTaskDates() {
      try {
        const raw = localStorage.getItem(`freelancer_${id}_tasks`)
        const tasks: any[] = raw ? JSON.parse(raw) : []
        const dates = tasks
          .map(t => t?.dueDate)
          .filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d))
          .map(d => d.slice(0, 10))
        setTaskDates(Array.from(new Set(dates)))
      } catch { setTaskDates([]) }
    }
    loadTaskDates()
    const onFocus = () => loadTaskDates()
    const onStorage = (e: StorageEvent) => {
      if (e.key === `freelancer_${id}_tasks`) loadTaskDates()
    }
    window.addEventListener('focus', onFocus)
    window.addEventListener('storage', onStorage)
    // Polling leve para refletir alterações na mesma aba (TarefasTab muda localStorage
    // mas storage event não dispara no mesmo window que escreveu)
    const iv = setInterval(loadTaskDates, 3000)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('storage', onStorage)
      clearInterval(iv)
    }
  }, [id])

  const load = useCallback(async () => {
    setLoading(true)
    const [fRes, cRes, eRes, aRes, vRes, iRes, pRes, nRes, mRes, fsRes, dRes] = await Promise.all([
      fetch(`/api/freelancers`).then(r => r.json()),
      fetch(`/api/freelancer-casamentos?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-edicao?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-album?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-valores?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-info?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-pagamentos?freelancer_id=${id}`).then(r => r.json()).catch(() => ({ pagamentos: [] })),
      fetch(`/api/freelancer-notificacoes?freelancer_id=${id}`).then(r => r.json()).catch(() => ({ notificacoes: [] })),
      fetch(`/api/freelancer-mensagens?freelancer_id=${id}`).then(r => r.json()).catch(() => ({ mensagens: [] })),
      fetch(`/api/fotos-selecao`).then(r => r.json()).catch(() => ({ rows: [] })),
      fetch(`/api/freelancer-disponibilidade?freelancer_id=${id}`).then(r => r.json()).catch(() => ({ periodos: [] })),
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
    setDisponibilidade(dRes.periodos ?? [])
    // Constrói mapa referencia → data_entrada
    const fsMap: Record<string, string> = {}
    for (const row of (fsRes.rows ?? []) as Array<{ referencia?: string | null; data_entrada?: string | null }>) {
      if (row.referencia && row.data_entrada) fsMap[row.referencia] = row.data_entrada
    }
    setFotosSelecaoMap(fsMap)
    setLoading(false)
    // Carrega estado "Fotos Convidados" (email + ctt + listas) em background (não bloqueia o render)
    const refs = Array.from(new Set((cRes.casamentos ?? []).map((c: any) => c.referencia).filter(Boolean))) as string[]
    if (refs.length) {
      ;(async () => {
        const fcMap: Record<string, { email: string | null; ctt: string | null; emailLista: string[]; cttLista: string[]; emailWorkflow: string; cttWorkflow: string }> = {}
        for (const ref of refs) {
          try {
            const p = await fetch(`/api/portais?ref=${encodeURIComponent(ref)}`).then(r => r.json())
            const s = p?.portal?.settings ?? p?.settings ?? {}
            fcMap[ref] = {
              email: s.fotos_convidados_email_enviada ?? null,
              ctt:   s.fotos_convidados_ctt_enviada   ?? null,
              emailLista: Array.isArray(s.fotos_convidados_email_lista) ? s.fotos_convidados_email_lista : [],
              cttLista:   Array.isArray(s.fotos_convidados_ctt_lista)   ? s.fotos_convidados_ctt_lista   : [],
              emailWorkflow: typeof s.fotos_convidados_email_workflow === 'string' ? s.fotos_convidados_email_workflow : '',
              cttWorkflow:   typeof s.fotos_convidados_ctt_workflow   === 'string' ? s.fotos_convidados_ctt_workflow   : '',
            }
          } catch { /* ignore */ }
        }
        setFotosConvidadosMap(fcMap)
      })()
    }
  }, [id])

  useEffect(() => { load() }, [load])

  // ── Prazos de entrega ────────────────────────────────────────────────
  //   Calculado SEMPRE (antes de early returns) para respeitar Rules of Hooks
  //   Seleção de Fotos:   30 dias após o evento
  //   Fotos Editadas:     30 dias após os noivos enviarem fotos (fotos_selecao.data_entrada)
  //   Maquete Álbum:      30 dias após os noivos enviarem fotos (fotos_selecao.data_entrada)
  const PRAZO_SELECAO_DIAS = 30
  const PRAZO_EDICAO_DIAS  = 30
  const PRAZO_ALBUM_DIAS   = 30
  const PRAZO_AVISO_DIAS = 5
  type PrazoEntry = { c: Casamento; deadline: Date; daysLeft: number; tipo: 'selecao' | 'edicao' | 'album' }
  function parseDateLocal(s: string | null | undefined): Date | null {
    if (!s) return null
    const dateStr = String(s).slice(0, 10)
    const parts = dateStr.split('-').map(Number)
    if (parts.length !== 3 || parts.some(n => !Number.isFinite(n))) return null
    const [y, m, d] = parts
    const dt = new Date(y, m - 1, d)
    return isNaN(dt.getTime()) ? null : dt
  }
  const prazosSelecao: PrazoEntry[] = (() => {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const out: PrazoEntry[] = []
      for (const c of casamentos) {
        // Skip casamentos onde o admin desativou os alertas de fotografia
        // (eventos onde a RL não é responsável pela parte fotográfica).
        if (c.alertas_fotografia_ativos === false) continue
        // 1) Seleção de Fotos — prazo conta a partir do evento
        if (c.data_casamento && !c.url_selecao_enviado_em && c.status_selecao !== 'ENTREGUE') {
          const dEvento = parseDateLocal(c.data_casamento)
          if (dEvento && dEvento.getTime() <= today.getTime()) {
            const deadline = new Date(dEvento.getTime() + PRAZO_SELECAO_DIAS * 86400000)
            const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
            out.push({ c, deadline, daysLeft, tipo: 'selecao' })
          }
        }
        // 2) Fotos Editadas — prazo conta a partir do dia em que os noivos
        //    enviaram as fotos selecionadas (fotos_selecao.data_entrada)
        if (c.referencia && !c.url_editadas_enviado_em && c.status_editadas !== 'ENTREGUE') {
          const dataEntrada = fotosSelecaoMap[c.referencia]
          const dEntrada = parseDateLocal(dataEntrada)
          if (dEntrada && dEntrada.getTime() <= today.getTime()) {
            const deadline = new Date(dEntrada.getTime() + PRAZO_EDICAO_DIAS * 86400000)
            const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
            out.push({ c, deadline, daysLeft, tipo: 'edicao' })
          }
        }
        // 3) Maquete Álbum — mesma data de partida que Fotos Editadas (fotos_selecao.data_entrada)
        if (c.referencia && !c.url_album_enviado_em && c.status_album !== 'ENTREGUE') {
          const dataEntrada = fotosSelecaoMap[c.referencia]
          const dEntrada = parseDateLocal(dataEntrada)
          if (dEntrada && dEntrada.getTime() <= today.getTime()) {
            const deadline = new Date(dEntrada.getTime() + PRAZO_ALBUM_DIAS * 86400000)
            const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
            out.push({ c, deadline, daysLeft, tipo: 'album' })
          }
        }
      }
      return out.sort((a, b) => a.daysLeft - b.daysLeft)
    } catch { return [] }
  })()
  const prazosCriticos = prazosSelecao.filter(p => p.daysLeft <= PRAZO_AVISO_DIAS)

  // Criar notificação automática (idempotente) sempre que um prazo entrar em estado crítico
  //   IMPORTANTE: este useEffect TEM de ficar antes das early-returns (loading/!freelancer)
  //   para evitar 'Rendered more hooks than during the previous render'.
  useEffect(() => {
    if (!freelancer?.id || prazosCriticos.length === 0) return
    prazosCriticos.forEach(async (p) => {
      const labelByTipo = {
        selecao: 'Seleção de Fotos',
        edicao:  'Fotos para Edição',
        album:   'Maquete Álbum',
      } as const
      const tipoByPrazo = {
        selecao: 'prazo_selecao',
        edicao:  'prazo_edicao',
        album:   'prazo_album',
      } as const
      const label = labelByTipo[p.tipo]
      const titulo = `⚠ Prazo ${label} · ${p.c.local}`
      const prefix = `⚠ Prazo ${label}`
      const exists = notificacoes.some(n => n.titulo.startsWith(prefix) && n.titulo.includes(p.c.local))
      if (exists) return
      const expired = p.daysLeft < 0
      const referenceText = p.tipo === 'selecao'
        ? '30 dias após o evento'
        : '30 dias após o envio das fotos pelos noivos'
      const mensagem = expired
        ? `O prazo de entrega de ${label} de ${p.c.local} (${referenceText}) expirou há ${Math.abs(p.daysLeft)} dia${Math.abs(p.daysLeft) === 1 ? '' : 's'}.`
        : `Faltam ${p.daysLeft} dia${p.daysLeft === 1 ? '' : 's'} para o prazo de entrega de ${label} de ${p.c.local}. (Prazo: ${referenceText})`
      try {
        await fetch('/api/freelancer-notificacoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            freelancer_id: freelancer.id,
            titulo,
            mensagem,
            tipo: tipoByPrazo[p.tipo],
            lida: false,
          }),
        })
      } catch { /* ignora — re-tenta no próximo render */ }
    })
  }, [prazosCriticos.length, freelancer?.id])

  // Editores têm o seu próprio portal (/painel-editor). Sempre que se acede ao
  // portal de freelancer de um editor (com ou sem ?view), reencaminha-se — exceto
  // com ?admin=1 (escape para gestão pelo admin).
  // (Tem de estar ANTES dos early returns abaixo — regra dos hooks.)
  const adminOverride = searchParams?.get('admin') === '1'
  useEffect(() => {
    if (!adminOverride && freelancer?.status === 'EDITORES' && typeof window !== 'undefined') {
      window.location.replace(`/painel-editor?freelancer=${id}`)
    }
  }, [adminOverride, freelancer?.status, id])

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

  const tabs: { key: 'casamentos'|'edicao'|'album'|'tarefas'|'calendario'|'info'|'notas'|'pagamentos'|'notificacoes'|'mensagens'|'definicoes'; label: string; count?: number }[] = [
    { key: 'casamentos',   label: 'Casamentos',  count: casamentos.length },
    ...(!isVideografo ? [{ key: 'edicao' as const, label: 'Edição Fotos', count: edicao.length }] : []),
    ...(isFotografo ? [{ key: 'album' as const, label: 'Edição Álbum', count: album.length }] : []),
    { key: 'tarefas',      label: 'Tarefas' },
    { key: 'calendario',   label: 'Calendário' },
    { key: 'pagamentos',   label: 'Pagamentos', count: pagamentos.length },
    { key: 'mensagens',    label: 'Msgs',   count: mensagens.filter(m => m.remetente === 'freelancer' && !m.lida_admin).length },
    { key: 'notificacoes', label: 'Notif.', count: notificacoes.filter(n => !n.lida).length },
    { key: 'definicoes' as const, label: 'Dados Pessoais' },
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
        @keyframes prazoCriticoGlow {
          0%, 100% { box-shadow: 0 0 24px -4px rgba(239,68,68,0.32), 0 0 60px -10px rgba(239,68,68,0.20), inset 0 0 0 1px rgba(239,68,68,0.35); }
          50%      { box-shadow: 0 0 40px 0 rgba(239,68,68,0.65), 0 0 90px -4px rgba(239,68,68,0.40), inset 0 0 0 1px rgba(239,68,68,0.65); }
        }
        .prazo-critico-glow { animation: prazoCriticoGlow 2.5s ease-in-out infinite; }
        @keyframes bellRedGlow {
          0%, 100% { box-shadow: 0 0 8px 0 rgba(239,68,68,0.45), 0 0 18px -4px rgba(239,68,68,0.25); }
          50%      { box-shadow: 0 0 14px 2px rgba(239,68,68,0.75), 0 0 26px -2px rgba(239,68,68,0.55); }
        }
        .bell-red-glow { animation: bellRedGlow 1.8s ease-in-out infinite; }
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
        viewAsFreelancer={viewAsFreelancer}
      />

    <main className={`relative z-10 min-h-screen px-4 sm:px-6 py-6 mx-auto lg:pl-[252px] lg:pr-4 ${
      tab === null ? 'max-w-none'
        : (['casamentos', 'edicao', 'album', 'pagamentos', 'tarefas', 'calendario', 'definicoes', 'notificacoes'] as Array<string | null>).includes(tab) ? 'max-w-[1500px]'
        : 'max-w-3xl'
    }`}>
      {/* Hamburguer menu — apenas mobile (desktop usa sidebar) */}
      <div className="mb-6 lg:hidden">
        {/* Barra fixa com botão hamburguer + tab activa */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[13px] tracking-[0.3em] uppercase text-white/40 font-light">
            {tab === null ? 'Início' : (tabs.find(t => t.key === tab)?.label ?? tab)}
          </span>
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="flex flex-col items-center justify-center gap-[5px] w-10 h-10 rounded-xl border border-white/15 bg-black/40 backdrop-blur-md"
          >
            <span className={`block h-[1.5px] bg-white transition-all duration-300 origin-center ${mobileMenuOpen ? 'w-5 rotate-45 translate-y-[6.5px]' : 'w-5'}`} />
            <span className={`block h-[1.5px] bg-white transition-all duration-300 ${mobileMenuOpen ? 'w-0 opacity-0' : 'w-5'}`} />
            <span className={`block h-[1.5px] bg-white transition-all duration-300 origin-center ${mobileMenuOpen ? 'w-5 -rotate-45 -translate-y-[6.5px]' : 'w-5'}`} />
          </button>
        </div>

        {/* Dropdown overlay */}
        {mobileMenuOpen && (
          <div className="mt-2 rounded-2xl border border-white/15 bg-black/90 backdrop-blur-xl overflow-hidden"
            style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7)' }}>
            {/* Início */}
            <button
              onClick={() => { setTab(null); setEditForm(null); setMobileMenuOpen(false) }}
              className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors border-b border-white/[0.06] ${tab === null ? 'text-white bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
              <span className="text-lg">⌂</span>
              <span className="text-[13px] tracking-[0.3em] uppercase font-semibold">Início</span>
            </button>
            {tabs.map((t, i) => (
              <button key={t.key}
                onClick={() => { setTab(t.key); setMobileMenuOpen(false) }}
                className={`w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors border-b border-white/[0.06] ${tab === t.key ? 'text-white bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                <span className="text-[13px] tracking-[0.3em] uppercase font-semibold">{t.label}</span>
                {t.count != null && t.count > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-bold">{t.count}</span>
                )}
              </button>
            ))}
            {/* Sair */}
            <button
              onClick={async () => {
                await fetch('/api/freelancer-auth', { method: 'DELETE' })
                window.location.href = '/login'
              }}
              className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors text-red-400/70 hover:text-red-400 hover:bg-red-500/5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span className="text-[13px] tracking-[0.3em] uppercase font-semibold">Sair</span>
            </button>
          </div>
        )}
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
        // Regra: só contam pagamentos ligados a casamentos atribuídos.
        // 'Se não tem eventos, não houve pagamento.'
        const casamentoIdsSet = new Set(casamentos.map(c => c.id))
        const totalRecebido = pagamentos
          .filter(p => p.status === 'PAGO' && p.casamento_id && casamentoIdsSet.has(p.casamento_id))
          .reduce((s, p) => s + (Number(p.valor) || 0), 0)
        const totalRecebidoLabel = totalRecebido.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
        const anoAtual = new Date().getFullYear()

        // ── Performance Stats — agora baseado nas 4 entregas por casamento ──
        // Regra do utilizador:
        //   • Conta TUDO o que está nos cards (Seleção / Provas / Editadas / Álbum)
        //   • Quando o membro envia uma entrega (url_*_enviado_em), conta como
        //     entregue ('no prazo' se dentro de 30 dias, 'fora prazo' se depois)
        //   • Não enviado e prazo passou → 'fora prazo'
        //   • Não enviado e prazo dentro do limite → 'em curso'
        //   • Só entra o que está atribuído ao membro (todos os casamentos da
        //     lista já estão atribuídos a este freelancer, mas filtramos
        //     entregas que ainda nem têm URL associado — só conta se o membro
        //     tem 'acesso' à entrega através do casamento).
        const performanceStats = (() => {
          let onTime = 0
          let late = 0
          let emCurso = 0
          let total = 0
          let somaDias = 0
          let contDias = 0
          const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0)
          const PRAZO_DIAS = 30

          // Para os 4 tipos de entrega
          const tipos: Array<'selecao' | 'provas' | 'editadas' | 'album'> = ['selecao', 'provas', 'editadas', 'album']

          casamentos.forEach((c: any) => {
            tipos.forEach(tipo => {
              const sentAt = c[`url_${tipo}_enviado_em`]
              const url    = c[`url_${tipo}`]
              // Só conta entregas que estão visíveis ao membro:
              // - Ou já têm timestamp de envio
              // - Ou têm URL preenchido (ainda por enviar mas atribuído)
              // - Ou o casamento já passou (prazo a correr)
              const passou = c.data_casamento ? new Date(c.data_casamento).getTime() < todayMid.getTime() : false
              const conta = !!sentAt || !!url || passou
              if (!conta) return
              total += 1

              // Deadline: 30 dias após a data do casamento
              let deadline: Date | null = null
              if (c.data_casamento) {
                const cas = new Date(c.data_casamento); cas.setHours(0,0,0,0)
                deadline = new Date(cas.getTime() + PRAZO_DIAS * 86400000); deadline.setHours(0,0,0,0)
              }

              if (sentAt) {
                const sentDate = new Date(sentAt)
                if (deadline && sentDate.getTime() <= deadline.getTime() + 86400000) onTime += 1
                else if (deadline) late += 1
                else onTime += 1
                if (c.data_casamento) {
                  const cas = new Date(c.data_casamento)
                  const dias = Math.max(0, Math.round((sentDate.getTime() - cas.getTime()) / 86400000))
                  somaDias += dias
                  contDias += 1
                }
              } else {
                if (deadline && deadline.getTime() < todayMid.getTime()) late += 1
                else emCurso += 1
              }
            })
          })

          const mediaDias = contDias > 0 ? Math.round(somaDias / contDias) : 0
          return { total, onTime, late, emCurso, mediaDias }
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
            <div className="relative z-10 flex items-start justify-between gap-6 px-4 sm:px-12 py-8 sm:py-16">
              <div className="max-w-xl flex items-center gap-5 pr-[120px] sm:pr-0">
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

              {/* Top-right: alerta prazos + notif + messages + profile chip */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0 absolute top-3 right-3 sm:static"  style={{zIndex:20}}>
                {/* Alerta de prazos críticos (Seleção de Fotos a expirar) */}
                {prazosCriticos.length > 0 && (
                  <button title={`${prazosCriticos.length} prazo${prazosCriticos.length === 1 ? '' : 's'} a terminar — Seleção de Fotos`}
                    onClick={() => setTab('casamentos')}
                    className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border bg-black/40 backdrop-blur-md transition-all flex items-center justify-center bell-red-glow border-red-500/60 text-red-300 hover:text-red-200 hover:border-red-400/80">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 border border-red-300"
                      style={{ boxShadow: '0 0 8px rgba(239,68,68,0.8)' }}>
                      {prazosCriticos.length > 9 ? '9+' : prazosCriticos.length}
                    </span>
                  </button>
                )}
                {(() => {
                  const notifNaoLidas = notificacoes.filter(n => !n.lida).length
                  const hasUnread = notifNaoLidas > 0
                  return (
                    <button title={hasUnread ? `${notifNaoLidas} notificação${notifNaoLidas === 1 ? '' : 'ões'} por ler` : 'Notificações'}
                      onClick={() => setTab('notificacoes')}
                      className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border bg-black/40 backdrop-blur-md transition-all flex items-center justify-center ${
                        hasUnread
                          ? 'bell-red-glow border-red-500/55 text-red-300 hover:text-red-200 hover:border-red-400/70'
                          : 'border-white/15 text-white/70 hover:text-gold hover:border-gold/40'
                      }`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 border border-red-300"
                          style={{ boxShadow: '0 0 8px rgba(239,68,68,0.7)' }}>
                          {notifNaoLidas > 9 ? '9+' : notifNaoLidas}
                        </span>
                      )}
                    </button>
                  )
                })()}
                <button title="Mensagens"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/15 bg-black/40 backdrop-blur-md text-white/70 hover:text-gold hover:border-gold/40 transition-all flex items-center justify-center relative">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  {mensagensNaoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-gold text-black text-[10px] font-bold flex items-center justify-center px-1">
                      {mensagensNaoLidas}
                    </span>
                  )}
                </button>
                <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-gold/40 shrink-0">
                    {freelancer?.foto_url
                      ? <img src={freelancer.foto_url} alt={freelancer.nome} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center text-gold text-sm font-bold">{primeiroNome.charAt(0).toUpperCase()}</div>
                    }
                  </div>
                  <div className="block min-w-0">
                    <p className="text-[11px] sm:text-[13px] font-semibold text-white truncate max-w-[80px] sm:max-w-[140px]">{primeiroNome}</p>
                    <p className="hidden sm:block text-[10px] text-white/40 tracking-wide truncate max-w-[140px]">{isFotografo ? 'Fotógrafo' : 'Editor de Vídeo'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CRÍTICO · ENTREGA — sobrepõe canto inferior direito do hero ── */}
          {(() => {
            const atrasados = prazosSelecao.filter(p => p.daysLeft < 0)
            if (atrasados.length === 0) return null

            const MESES_PT_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
            const fmtShortDate = (d: Date) => {
              try { return `até ${String(d.getDate()).padStart(2,'0')} ${MESES_PT_SHORT[d.getMonth()]}` } catch { return '' }
            }
            const KIND_META = {
              edicao:  { label: 'EDIÇÃO',  chipBg: 'bg-blue-500/15',   chipBorder: 'border-blue-500/45',   chipText: 'text-blue-200',   targetTab: 'edicao' as const },
              album:   { label: 'ÁLBUM',   chipBg: 'bg-purple-500/15', chipBorder: 'border-purple-500/45', chipText: 'text-purple-200', targetTab: 'album' as const },
              selecao: { label: 'SELEÇÃO',chipBg: 'bg-gold/15',       chipBorder: 'border-gold/50',       chipText: 'text-gold',       targetTab: 'casamentos' as const },
            } as const

            return (
              <div className={`relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6 ${criticoOpen ? '-mt-24' : '-mt-16'}`}>
                <div className={`lg:col-start-3 rounded-2xl border border-rose-500/35 backdrop-blur-sm transition-all duration-300 ${criticoOpen ? 'p-3.5' : 'p-2.5'}`}
                  style={{
                    background: 'linear-gradient(135deg, rgba(40,8,12,0.85), rgba(20,5,8,0.92))',
                    boxShadow: '0 0 28px -10px rgba(244,63,94,0.55), inset 0 0 0 1px rgba(244,63,94,0.06)',
                  }}>
                  {/* Header — clicável + chevron */}
                  <button onClick={toggleCritico}
                    className={`w-full flex items-center justify-between gap-2 ${criticoOpen ? 'mb-2' : 'mb-0'} group cursor-pointer text-left`}
                    title={criticoOpen ? 'Fechar' : 'Abrir alertas'}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-rose-300 text-sm">⚠</span>
                      <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-rose-300 truncate">Crítico · Entrega</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/40 font-bold tabular-nums shrink-0">
                        {atrasados.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {criticoOpen && <p className="text-[10px] italic text-rose-200/55">30 dias</p>}
                      <span className={`w-6 h-6 rounded-full border border-rose-500/40 bg-rose-500/15 text-rose-300 flex items-center justify-center text-[10px] transition-transform duration-300 group-hover:bg-rose-500/25 group-hover:border-rose-400/60 ${criticoOpen ? 'rotate-180' : 'rotate-0'}`}>
                        ▾
                      </span>
                    </div>
                  </button>

                  {/* Lista — só quando aberto */}
                  {criticoOpen && (
                    <div className="space-y-1.5">
                      {atrasados.map(p => {
                        const m = KIND_META[p.tipo as keyof typeof KIND_META] ?? KIND_META.selecao
                        const diasAtraso = Math.abs(p.daysLeft)
                        return (
                          <button key={`${p.tipo}-${p.c.id}`} onClick={() => setTab(m.targetTab)}
                            className="w-full group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-rose-500/25 bg-rose-500/[0.08] hover:border-rose-500/45 hover:bg-rose-500/[0.12] transition-all text-left">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] tracking-[0.18em] uppercase font-bold border ${m.chipBg} ${m.chipBorder} ${m.chipText} shrink-0 min-w-[56px] text-center`}>
                              {m.label}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] text-white font-semibold tracking-wide truncate leading-tight">{(p.c.local ?? '—').toUpperCase()}</p>
                              <p className="text-[9px] text-rose-200/55 italic leading-tight">{fmtShortDate(p.deadline)}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-rose-300 font-bold tabular-nums leading-none" style={{ fontFamily: 'Georgia, serif', fontSize: '16px' }}>
                                +{diasAtraso}
                                <span className="text-[8px] text-rose-300/75 tracking-[0.2em] uppercase ml-1 font-bold">atr.</span>
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* ── Próximo Casamento (destaque com glow gold pulsante) ─
              Largura alinhada com "Novos Eventos" (col 1 de 3) — em mobile
              ocupa toda a largura, em desktop fica 1/3. */}
          {proximoCasamento && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              <div onClick={() => setTab('casamentos')}
                className="cursor-pointer prox-casamento-glow fade-in-1 bg-gradient-to-br from-gold/[0.10] to-gold/[0.02] border border-gold/40 rounded-2xl p-6 sm:p-7 hover:border-gold/60 transition-all">
                <p className="text-[11px] tracking-[0.5em] text-gold/80 uppercase font-light mb-3">Próximo Casamento</p>
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-light text-white mb-2 tracking-tight truncate" style={{ fontFamily: 'Georgia, serif' }}>{proximoCasamento.local}</h2>
                    <p className="text-[13px] text-white/55 italic" style={{ fontFamily: 'Georgia, serif' }}>{fmtDate(proximoCasamento.data_casamento)}</p>
                  </div>
                  <div className={`text-right shrink-0 ${dtuProximo !== null && dtuProximo <= 15 ? 'text-red-400' : 'text-gold'}`}>
                    <p className="text-5xl font-light leading-none tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>{dtuProximo === 0 ? 'HOJE' : dtuProximo}</p>
                    <p className="text-[11px] tracking-[0.4em] uppercase mt-1.5 font-light">{dtuProximo === 0 ? '' : dtuProximo === 1 ? 'dia' : 'dias'}</p>
                  </div>
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

          {/* ── KPI CARDS premium — layout simétrico vertical ───── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 fade-in-3">
            {([
              { label: 'Casamentos',  value: totalCasamentos.toString(),  sub: 'Total atribuídos',  icon: '◫', tab: 'casamentos' as const, accent: 'gold' },
              { label: 'Em Edição',   value: totalEmEdicao.toString(),    sub: 'Em edição ativa',   icon: '✎', tab: 'edicao' as const,     accent: 'amber' },
              { label: 'Concluídos',  value: totalConcluidos.toString(),  sub: 'Entregues',         icon: '✓', tab: 'edicao' as const,     accent: 'emerald' },
              { label: 'Aguardando',  value: totalAguardando.toString(),  sub: 'Por iniciar',       icon: '◷', tab: 'edicao' as const,     accent: 'blue' },
              { label: 'Recebimentos', value: totalRecebidoLabel,         sub: `Total ${anoAtual}`, icon: '€', tab: 'pagamentos' as const, accent: 'gold' },
            ] as const).map((k, i) => {
              const accents = {
                gold:    { iconBg: 'bg-gold/10',         iconBorder: 'border-gold/35',         iconText: 'text-gold',         arrowText: 'text-gold/60 group-hover:text-gold' },
                amber:   { iconBg: 'bg-amber-500/12',    iconBorder: 'border-amber-500/35',    iconText: 'text-amber-300',    arrowText: 'text-amber-300/55 group-hover:text-amber-300' },
                emerald: { iconBg: 'bg-emerald-500/12',  iconBorder: 'border-emerald-500/35',  iconText: 'text-emerald-300',  arrowText: 'text-emerald-300/55 group-hover:text-emerald-300' },
                blue:    { iconBg: 'bg-blue-500/12',     iconBorder: 'border-blue-500/35',     iconText: 'text-blue-300',     arrowText: 'text-blue-300/55 group-hover:text-blue-300' },
              }[k.accent]
              return (
                <button key={i} onClick={() => setTab(k.tab)}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] p-4 hover:border-gold/30 transition-all cursor-pointer text-left w-full h-full flex flex-col"
                  style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.55), rgba(11,11,11,0.7))', boxShadow: '0 14px 30px -16px rgba(0,0,0,0.5)' }}
                >
                  {/* Glow ao hover */}
                  <span className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.16), transparent 70%)' }} />

                  {/* Top: ícone + setinha — sempre nas mesmas posições */}
                  <div className="relative flex items-start justify-between mb-3">
                    <span className={`w-10 h-10 rounded-xl border ${accents.iconBorder} ${accents.iconBg} ${accents.iconText} flex items-center justify-center text-[16px] shrink-0`}>
                      {k.icon}
                    </span>
                    <span className={`w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-[12px] transition-colors ${accents.arrowText}`}>›</span>
                  </div>

                  {/* Label */}
                  <p className="relative text-[9px] tracking-[0.4em] uppercase text-white/45 font-bold mb-2">{k.label}</p>

                  {/* Valor — Cormorant para coerência com Visão Geral */}
                  <p className="relative leading-none tabular-nums text-white"
                    style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(1.75rem, 2.4vw, 2.25rem)', fontWeight: 300 }}>
                    {k.value}
                  </p>

                  {/* Sub */}
                  <p className="relative text-[10px] text-white/40 mt-auto pt-3 tracking-wide truncate">{k.sub}</p>
                </button>
              )
            })}
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
            <MiniCalendar
              casamentos={casamentos}
              taskDates={taskDates}
              editionDates={edicao.filter(e => e.data_entrega).map(e => (e.data_entrega ?? '').slice(0, 10)).filter(Boolean)}
              albumDates={album.filter(a => a.data_entrega).map(a => (a.data_entrega ?? '').slice(0, 10)).filter(Boolean)}
              notifDates={notificacoes.map(n => (n.created_at ?? '').slice(0, 10)).filter(Boolean)}
              onClickDate={(iso) => {
                // Decide para onde ir com base no que existe nesse dia
                if (casamentos.some(c => c.data_casamento === iso)) { setTab('casamentos'); return }
                if (taskDates.includes(iso)) { setTab('tarefas'); return }
                if (edicao.some(e => (e.data_entrega ?? '').slice(0,10) === iso)) { setTab('edicao'); return }
                if (album.some(a => (a.data_entrega ?? '').slice(0,10) === iso)) { setTab('album'); return }
                if (notificacoes.some(n => (n.created_at ?? '').slice(0,10) === iso)) { setTab('notificacoes'); return }
                setTab('calendario')
              }}
            />

            {/* Col 3: Tarefas */}
            <TasksWidget freelancerId={id} />
          </div>

          {/* ── 3-COL: Casamentos Editados | Performance | Resumo Financeiro ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5 fade-in-5">

            {/* COL 1: Casamentos Editados */}
            {(() => {
              // Regra: 'se o membro enviar a notificação de FOTOS EDITADAS, o
              //         casamento já está editado e aparece aqui'.
              //         Lemos casamentos com url_editadas_enviado_em preenchido,
              //         ordenados pelo timestamp de envio DESC.
              const editados = casamentos
                .filter(c => !!c.url_editadas_enviado_em)
                .sort((a, b) => (b.url_editadas_enviado_em ?? '').localeCompare(a.url_editadas_enviado_em ?? ''))
                .slice(0, 4)
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
                    <button onClick={() => setTab('casamentos')}
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
                      {editados.map((c, idx) => {
                        const enviadoEm = c.url_editadas_enviado_em
                        return (
                          <button key={c.id} onClick={() => setTab('casamentos')}
                            className="group cursor-pointer text-left">
                            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/[0.08] mb-2 group-hover:border-gold/30 transition-all">
                              <img src={placeholderImgs[idx % placeholderImgs.length]}
                                alt={c.local ?? '—'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500/90 border border-emerald-300 flex items-center justify-center text-[10px] font-bold text-black">
                                ✓
                              </div>
                            </div>
                            <p className="text-[12px] font-medium text-white truncate group-hover:text-gold transition-colors">{c.local || '—'}</p>
                            <p className="text-[10px] text-white/35">
                              {enviadoEm ? `Enviado: ${new Date(enviadoEm).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}` : 'Sem data'}
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

          {/* ── (Bloco antigo 'Prazos de Entrega' removido — agora o Crítico · Entrega
                  vive logo a seguir ao Hero, não duplicar aqui) ────────── */}

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

            {/* (Cartão lateral 'Mensagens' removido a pedido do utilizador.) */}
          </div>
          </>
        )
      })()}

      {/* Dados Pessoais — premium design completo */}
      {tab === 'definicoes' && (
        <DadosPessoaisTab
          freelancerId={id}
          freelancer={freelancer}
          casamentos={casamentos}
          edicao={edicao}
          album={album}
          notificacoes={notificacoes}
          editForm={editForm}
          setEditForm={setEditForm}
          editSaving={editSaving}
          handleEditSave={handleEditSave}
          uploadingPhoto={uploadingPhoto}
          handlePhotoUpload={handlePhotoUpload}
          load={load}
          introHome={introHome}
          introHomeTitle={introHomeTitle}
          introHomeStatus={introHomeStatus}
          handleIntroHomeChange={handleIntroHomeChange}
          handleIntroHomeTitleChange={handleIntroHomeTitleChange}
          guia={guia}
          guiaStatus={guiaStatus}
          handleGuiaChange={handleGuiaChange}
        />
      )}
      {/* Bloco antigo removido — substituído por DadosPessoaisTab acima */}
      {false && tab === 'definicoes' && (() => {
        const editingThis = editForm !== null
        // Stats
        const totalCasamentos = casamentos.length
        const casamentosConfirmados = casamentos.filter(c => c.data_confirmada).length
        const totalEdicoes = edicao.length
        const edicoesConcluidas = edicao.filter(e => e.status === 'CONCLUÍDO').length
        const totalAlbuns = album.length
        const albunsEntregues = album.filter(a => a.status === 'ENTREGUE').length
        return (
        <div className="space-y-5">
          {/* HERO */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08]"
            style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)' }}>
            <div className="absolute inset-0 z-0">
              <img src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1600&h=240&fit=crop"
                alt="" className="w-full h-full object-cover" style={{ filter: 'blur(2px)' }} />
            </div>
            <div className="absolute inset-0 z-[1]"
              style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.85) 35%, rgba(10,10,10,0.45) 70%, rgba(10,10,10,0.05) 100%)' }} />
            <div className="relative z-10 flex items-center justify-between gap-6 px-6 sm:px-10 py-7 flex-wrap">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl border border-gold/40 flex items-center justify-center text-2xl text-gold shrink-0"
                  style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.18), rgba(201,164,92,0.04))', boxShadow: '0 0 22px -4px rgba(201,164,92,0.3)' }}>☻</div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Dados Pessoais</h1>
                  <p className="text-[13px] text-white/55 mt-1 leading-relaxed max-w-md">Gere as tuas informações pessoais, fotografia e configurações da conta.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!editingThis ? (
                  <button onClick={() => setEditForm({ nome: freelancer.nome, status: freelancer.status ?? '', contato: freelancer.contato ?? '', email: freelancer.email ?? '', nome_sos: freelancer.nome_sos ?? '', contato_sos: freelancer.contato_sos ?? '' })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-black text-[13px] font-bold tracking-wider hover:bg-gold/90 transition-all"
                    style={{ boxShadow: '0 0 20px -4px rgba(201,164,92,0.5)' }}>
                    ✎ Editar Perfil
                  </button>
                ) : (
                  <>
                    <button onClick={() => setEditForm(null)}
                      className="px-4 py-2.5 rounded-xl border border-white/15 text-white/65 text-[13px] font-bold tracking-wider hover:text-white hover:border-white/30 transition-all">
                      Cancelar
                    </button>
                    <button onClick={handleEditSave} disabled={editSaving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-[13px] font-bold tracking-wider hover:bg-emerald-400 disabled:opacity-50 transition-all"
                      style={{ boxShadow: '0 0 20px -4px rgba(52,211,153,0.5)' }}>
                      {editSaving ? 'A guardar...' : '✓ Guardar Alterações'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* GRID 1/3 (Perfil) + 2/3 (Info/Stats) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* COL 1 — Profile Card */}
            <div className="lg:col-span-1 rounded-2xl border border-white/[0.08] p-5"
              style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
              {/* Avatar */}
              <div className="relative w-28 h-28 mx-auto mb-4">
                <div className="w-full h-full rounded-full border-2 border-gold/40 overflow-hidden"
                  style={{ boxShadow: '0 0 28px -6px rgba(201,164,92,0.4)' }}>
                  {freelancer.foto_url ? (
                    <img src={freelancer.foto_url} alt={freelancer.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center text-gold text-3xl font-bold">
                      {(freelancer.nome ?? '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <label className={`absolute bottom-0 right-0 cursor-pointer w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  uploadingPhoto ? 'bg-white/15 text-white/40' : 'bg-gold text-black hover:bg-gold/90'
                }`} style={{ boxShadow: '0 0 14px rgba(201,164,92,0.55)' }} title="Alterar foto">
                  {uploadingPhoto ? '...' : '📷'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingPhoto}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }} />
                </label>
              </div>

              {/* Nome + Função */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-light text-white tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>{freelancer.nome}</h2>
                <span className="inline-block mt-1.5 text-[10px] px-2.5 py-1 rounded-full bg-gold/15 border border-gold/35 text-gold tracking-widest uppercase font-bold">
                  {freelancer.status || 'Freelancer'}
                </span>
              </div>

              {/* Contactos rápidos */}
              <div className="space-y-2.5 mb-4">
                {freelancer.email && (
                  <div className="flex items-center gap-2.5 text-[12px]">
                    <span className="w-7 h-7 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-gold/70 shrink-0">✉</span>
                    <span className="text-white/75 truncate">{freelancer.email}</span>
                  </div>
                )}
                {freelancer.contato && (
                  <div className="flex items-center gap-2.5 text-[12px]">
                    <span className="w-7 h-7 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-gold/70 shrink-0">✆</span>
                    <span className="text-white/75 truncate">{freelancer.contato}</span>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="pt-4 border-t border-white/[0.05]">
                <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border bg-emerald-500/15 text-emerald-300 border-emerald-500/30 tracking-widest uppercase font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
                  Conta Activa
                </span>
              </div>

              {freelancer.foto_url && (
                <button onClick={async () => {
                  if (!confirm('Remover foto de perfil?')) return
                  await fetch('/api/freelancers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, foto_url: null }) })
                  await load()
                }} className="block w-full text-center mt-4 text-[11px] text-red-400/60 hover:text-red-400 transition-colors tracking-wider uppercase">
                  Remover foto
                </button>
              )}
            </div>

            {/* COL 2 — Info da Conta */}
            <div className="lg:col-span-2 space-y-5">
              {/* Info Card */}
              <div className="rounded-2xl border border-white/[0.08] p-5"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[12px] tracking-[0.35em] uppercase text-gold/75 font-semibold">Informações da Conta</p>
                  {editingThis && (
                    <span className="text-[10px] text-gold/70 tracking-widest uppercase font-bold animate-pulse">Modo Edição</span>
                  )}
                </div>
                <div className="space-y-3">
                  {([
                    { label: 'Nome Completo', key: 'nome',        type: 'text',  value: freelancer.nome },
                    { label: 'Função',        key: 'status',      type: 'select', value: freelancer.status,
                      options: ['FOTOGRAFO','VIDEOGRAFO','ASSISTENTE','EDITORES','OUTRO'] },
                    { label: 'Email',         key: 'email',       type: 'email', value: freelancer.email },
                    { label: 'Telefone',      key: 'contato',     type: 'tel',   value: freelancer.contato },
                    { label: 'SOS — Nome',    key: 'nome_sos',    type: 'text',  value: freelancer.nome_sos },
                    { label: 'SOS — Nº',      key: 'contato_sos', type: 'tel',   value: freelancer.contato_sos },
                  ] as Array<{ label: string; key: keyof NonNullable<typeof editForm>; type: string; value: string | null; options?: string[] }>).map(f => (
                    <div key={f.key} className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
                      <span className="text-[12px] tracking-[0.25em] uppercase text-white/40 shrink-0 w-32">{f.label}</span>
                      {editingThis && editForm ? (
                        f.type === 'select' ? (
                          <select value={(editForm as any)[f.key] ?? ''} onChange={e => setEditForm(prev => ({ ...prev!, [f.key]: e.target.value }))}
                            className="flex-1 ml-3 text-right text-[13px] text-white font-medium bg-black/40 border border-gold/30 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gold/60 cursor-pointer [color-scheme:dark]">
                            {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input type={f.type} value={(editForm as any)[f.key] ?? ''} onChange={e => setEditForm(prev => ({ ...prev!, [f.key]: e.target.value }))}
                            className="flex-1 ml-3 text-right text-[13px] text-white font-medium bg-black/40 border border-gold/30 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gold/60" />
                        )
                      ) : (
                        <span className="text-[13px] text-white/85 font-medium text-right truncate">
                          {f.value || <span className="text-white/25 italic">—</span>}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Resumo */}
              <div className="rounded-2xl border border-white/[0.08] p-5"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
                <p className="text-[12px] tracking-[0.35em] uppercase text-gold/75 font-semibold mb-4">Resumo da Actividade</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {([
                    { label: 'Casamentos',   value: totalCasamentos,       sub: `${casamentosConfirmados} confirmados`,    accent: 'border-gold/25 bg-gold/[0.04] text-gold',                   sub_accent: 'text-gold/55' },
                    { label: 'Edições',      value: totalEdicoes,          sub: `${edicoesConcluidas} concluídas`,         accent: 'border-blue-500/25 bg-blue-500/[0.04] text-blue-300',       sub_accent: 'text-blue-300/55' },
                    { label: 'Álbuns',       value: totalAlbuns,           sub: `${albunsEntregues} entregues`,            accent: 'border-purple-500/25 bg-purple-500/[0.04] text-purple-300', sub_accent: 'text-purple-300/55' },
                  ]).map((s, i) => (
                    <div key={i} className={`rounded-xl border p-3.5 ${s.accent.split(' ').slice(0,2).join(' ')}`}>
                      <p className={`text-[9px] tracking-[0.3em] uppercase mb-1 ${s.sub_accent}`}>{s.label}</p>
                      <p className={`text-2xl font-light leading-none tabular-nums ${s.accent.split(' ')[2]}`} style={{ fontFamily: 'Georgia, serif' }}>{s.value}</p>
                      <p className={`text-[10px] mt-1.5 ${s.sub_accent}`}>{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Texto da página inicial */}
              <div className="rounded-2xl border border-white/[0.08] p-5"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] tracking-[0.35em] uppercase text-gold/75 font-semibold">Texto da Página Inicial</p>
                  <span className={`text-[10px] tracking-wider uppercase transition-all ${
                    introHomeStatus === 'saving' ? 'text-white/30' : introHomeStatus === 'saved' ? 'text-emerald-400' : 'text-transparent'
                  }`}>{introHomeStatus === 'saving' ? 'A guardar...' : '✓ Guardado'}</span>
                </div>
                <input value={introHomeTitle} onChange={e => handleIntroHomeTitleChange(e.target.value)} placeholder="Título de boas-vindas..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white/85 outline-none focus:border-gold/30 transition-colors placeholder:text-white/20 mb-2" />
                <textarea value={introHome} onChange={e => handleIntroHomeChange(e.target.value)} rows={4} placeholder="Texto que aparece como introdução..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white/75 outline-none focus:border-gold/30 transition-colors resize-none placeholder:text-white/20 leading-relaxed" />
              </div>

              {/* Guia de trabalho */}
              <div className="rounded-2xl border border-white/[0.08] p-5"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] tracking-[0.35em] uppercase text-gold/75 font-semibold">Guia de Trabalho</p>
                  <span className={`text-[10px] tracking-wider uppercase transition-all ${
                    guiaStatus === 'saving' ? 'text-white/30' : guiaStatus === 'saved' ? 'text-emerald-400' : 'text-transparent'
                  }`}>{guiaStatus === 'saving' ? 'A guardar...' : '✓ Guardado'}</span>
                </div>
                <textarea value={guia} onChange={e => handleGuiaChange(e.target.value)} rows={6} placeholder="Regras, instruções e guia de trabalho..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white/75 outline-none focus:border-gold/30 transition-colors resize-none placeholder:text-white/20 leading-relaxed" />
              </div>
            </div>
          </div>
        </div>
        )
      })()}

      {/* Tab content */}
      {tab === 'casamentos'   && <CasamentosTab freelancerId={id} casamentos={casamentos} onRefresh={load} freelancerStatus={freelancer?.status ?? null} freelancer={freelancer} viewAsFreelancer={viewAsFreelancer} fotosSelecaoMap={fotosSelecaoMap} fotosConvidadosMap={fotosConvidadosMap} setFotosConvidadosMap={setFotosConvidadosMap} initialExpandedId={pendingExpandCasamentoId} onExpandedHandled={() => setPendingExpandCasamentoId(null)} />}
      {tab === 'edicao'       && <EdicaoTab freelancerId={id} edicao={edicao} onRefresh={load} />}
      {tab === 'album'        && <AlbumTab freelancerId={id} album={album} onRefresh={load} />}
      {tab === 'tarefas'      && <TarefasTab freelancerId={id} viewAsFreelancer={viewAsFreelancer} freelancer={freelancer} notificacoes={notificacoes} onRefresh={load} />}
      {tab === 'calendario'   && <CalendarioTab freelancerId={id} casamentos={casamentos} edicao={edicao} album={album} notificacoes={notificacoes} freelancer={freelancer} disponibilidade={disponibilidade} onRefresh={load} viewAsFreelancer={viewAsFreelancer} />}
      {tab === 'info'         && <InfoTab freelancerId={id} info={info} onRefresh={load} />}
      {tab === 'notas'        && <NotasTab freelancer={freelancer} onRefresh={load} />}
      {tab === 'pagamentos'   && <PagamentosAdminTab freelancerId={id} pagamentos={pagamentos} casamentos={casamentos} onRefresh={load} />}
      {tab === 'mensagens'    && <MensagensAdminTab freelancerId={id} freelancerNome={freelancer?.nome ?? ''} casamentos={casamentos} mensagens={mensagens} onRefresh={load} />}
      {tab === 'notificacoes' && <NotificacoesAdminTab freelancerId={id} notificacoes={notificacoes} casamentos={casamentos} onRefresh={load} viewAsFreelancer={viewAsFreelancer} onOpenCasamento={(cid) => { setPendingExpandCasamentoId(cid); setTab('casamentos') }} />}
    </main>
    </div>
  )
}

// ─── SidebarNavAdmin ───────────────────────────────────────────────────────
type AdminTabKey = 'casamentos'|'edicao'|'album'|'tarefas'|'calendario'|'info'|'notas'|'pagamentos'|'notificacoes'|'mensagens'|'definicoes'|null

function SidebarNavAdmin({
  freelancer,
  tab,
  setTab,
  counts,
  isVideografo,
  isFotografo,
  viewAsFreelancer,
}: {
  freelancer: Freelancer | null
  tab: AdminTabKey
  setTab: (t: AdminTabKey) => void
  counts: { casamentos: number; edicao: number; album: number; pagamentos: number; mensagens: number; notificacoes: number }
  isVideografo: boolean
  isFotografo: boolean
  viewAsFreelancer?: boolean
}) {
  // Sidebar items — sem números/badges à frente (regra do utilizador)
  const items: Array<{ key: AdminTabKey; label: string; icon: string }> = [
    { key: null,             label: 'Início',         icon: '⌂' },
    { key: 'casamentos',     label: 'Casamentos',     icon: '◆' },
    ...(!isVideografo ? [{ key: 'edicao' as AdminTabKey, label: 'Edição Fotos', icon: '✎' }] : []),
    ...(isFotografo ? [{ key: 'album' as AdminTabKey, label: 'Edição Álbum', icon: '◫' }] : []),
    { key: 'tarefas',        label: 'Tarefas',        icon: '◷' },
    { key: 'calendario',     label: 'Calendário',     icon: '◉' },
    { key: 'pagamentos',     label: 'Pagamentos',     icon: '$' },
    { key: 'notificacoes',   label: 'Notificações',   icon: '◉' },
    { key: 'definicoes' as AdminTabKey, label: 'Dados Pessoais', icon: '☻' },
  ]

  return (
    <aside
      className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[240px] z-20 flex-col"
      style={{
        background: 'linear-gradient(180deg, #0a0805 0%, #0e0b07 50%, #0a0805 100%)',
        borderRight: '0.5px solid rgba(201,164,92,0.18)',
        boxShadow: 'inset -1px 0 30px rgba(201,164,92,0.04), 4px 0 24px rgba(0,0,0,0.45)',
      }}
    >
      {/* Top corner ornaments */}
      <div className="absolute top-0 left-0 w-[28px] h-[28px] pointer-events-none" style={{ borderTop: '0.5px solid rgba(201,164,92,0.25)', borderLeft: '0.5px solid rgba(201,164,92,0.25)' }} />
      <div className="absolute top-0 right-0 w-[28px] h-[28px] pointer-events-none" style={{ borderTop: '0.5px solid rgba(201,164,92,0.25)', borderRight: '0.5px solid rgba(201,164,92,0.25)' }} />

      {/* Logo — caixa gold com o logo RL Photo·Video */}
      <div className="px-6 pt-9 pb-6 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl border border-gold/40 flex items-center justify-center overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.18), rgba(201,164,92,0.04))',
            boxShadow: '0 0 22px rgba(201,164,92,0.18)',
          }}>
          <img
            src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
            alt="RL Photo·Video"
            className="w-11 h-11 object-contain"
          />
        </div>
        {!viewAsFreelancer && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-px w-5" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,164,92,0.45))' }} />
            <p className="text-[8px] tracking-[0.45em] uppercase" style={{ color: '#7a6340' }}>Admin</p>
            <span className="text-[7px]" style={{ color: '#7a6340' }}>◆</span>
            <p className="text-[8px] tracking-[0.45em] uppercase" style={{ color: '#7a6340' }}>Edição</p>
            <div className="h-px w-5" style={{ background: 'linear-gradient(90deg, rgba(201,164,92,0.45), transparent)' }} />
          </div>
        )}
      </div>

      <div className="h-px mx-7" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,164,92,0.25), transparent)' }} />

      {/* User */}
      {freelancer && (
        <div className="px-6 py-5 flex items-center gap-4">
          {freelancer.foto_url ? (
            <img src={freelancer.foto_url} alt={freelancer.nome}
              className="w-11 h-11 rounded-full object-cover"
              style={{ border: '0.5px solid #c9a96e', boxShadow: '0 0 14px rgba(201,164,92,0.22)' }} />
          ) : (
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-[14px]"
              style={{ background: 'rgba(201,164,92,0.10)', border: '0.5px solid #c9a96e', color: '#c9a96e', fontStyle: 'italic', boxShadow: '0 0 14px rgba(201,164,92,0.22)' }}>
              {(freelancer.nome ?? '?').charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[15px] truncate font-normal" style={{ color: '#f0e8d8' }}>{freelancer.nome}</p>
            {freelancer.status && (
              <p className="text-[9px] tracking-[0.4em] uppercase mt-1 italic" style={{ color: '#c9a96e', opacity: 0.75 }}>{freelancer.status}</p>
            )}
          </div>
        </div>
      )}

      <div className="h-px mx-7" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,164,92,0.18), transparent)' }} />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-0.5">
        {items.map((it, i) => {
          const active = tab === it.key
          return (
            <button
              key={i}
              onClick={() => setTab(it.key)}
              className="group relative w-full flex items-center gap-3 pl-4 pr-3 py-2.5 text-left transition-all"
              style={{
                background: active ? 'linear-gradient(90deg, rgba(201,164,92,0.10) 0%, rgba(201,164,92,0.02) 60%, transparent 100%)' : 'transparent',
                borderLeft: active ? '1.5px solid #c9a96e' : '1.5px solid transparent',
                boxShadow: active ? 'inset 12px 0 24px -16px rgba(201,164,92,0.5)' : 'none',
              }}
            >
              <span className="w-5 text-center text-[14px] transition-colors"
                style={{ color: active ? '#c9a96e' : 'rgba(255,255,255,0.30)' }}>{it.icon}</span>
              {active ? (
                <span className="flex-1 text-[14px] italic" style={{ color: '#c9a96e' }}>{it.label}</span>
              ) : (
                <span className="flex-1 text-[10px] tracking-[0.3em] uppercase font-light text-white/45 group-hover:text-white/85 transition-colors">{it.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5 mt-auto">
        <div className="h-px mb-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,164,92,0.25), transparent)' }} />
        {!viewAsFreelancer && (
          <a href={`/login?next=${encodeURIComponent(`/freelancers/${freelancer?.id ?? ''}?view=freelancer`)}`} target="_blank" rel="noopener noreferrer"
            className="block text-[9px] tracking-[0.4em] uppercase transition-colors mb-3 text-center"
            style={{ color: '#7a6340' }}
            onMouseEnter={e => e.currentTarget.style.color = '#c9a96e'}
            onMouseLeave={e => e.currentTarget.style.color = '#7a6340'}
            title="Login como o membro (precisa do email + password dele)">
            ↗ Ver como freelancer
          </a>
        )}
        <div className="text-center text-[10px] tracking-[0.4em]" style={{ color: '#5a4828' }}>—&nbsp;·&nbsp;◆&nbsp;·&nbsp;—</div>
        <p className="text-[10px] italic text-center mt-2" style={{ color: '#5a4f3a' }}>© RL Photo · Video</p>
      </div>

      {/* Bottom corner ornaments */}
      <div className="absolute bottom-0 left-0 w-[28px] h-[28px] pointer-events-none" style={{ borderBottom: '0.5px solid rgba(201,164,92,0.25)', borderLeft: '0.5px solid rgba(201,164,92,0.25)' }} />
      <div className="absolute bottom-0 right-0 w-[28px] h-[28px] pointer-events-none" style={{ borderBottom: '0.5px solid rgba(201,164,92,0.25)', borderRight: '0.5px solid rgba(201,164,92,0.25)' }} />
    </aside>
  )
}

// ─── Relatório Diário — secções (gravado, cerimónia, áudio, drone, equipa, máquina) ───
const RD_GRAVADO_OPCOES = ['Making Off Noivo', 'Making Off Noiva', 'Cerimónia', 'Votos dos Noivos', 'Discursos Convidados', 'Dança dos Noivos', 'Corte do Bolo']
const RD_TIPO_CERIMONIA_OPCOES = ['Religiosa', 'Civil', 'Conservador', 'Celebrante']
const RD_AUDIO_OPCOES = ['Lapela no Noivo', 'Áudio da Mesa']
const RD_DRONE_OPCOES = ['Casa do Noivo', 'Casa da Noiva', 'Igreja', 'Quinta']
const RD_EQUIPA_OPCOES = ['MCEventos', 'Elite', 'Paiva Som', 'CrazyDay']

function RelatorioDiarioSecoes({ casamento }: { casamento: Casamento }) {
  const rd = casamento.relatorio_diario ?? {}
  const [gravado, setGravado] = useState<string[]>(rd.gravado ?? [])
  const [tipo, setTipo] = useState<string[]>(rd.tipoCerimonia ?? [])
  const [audio, setAudio] = useState<string[]>(rd.audio ?? [])
  const [drone, setDrone] = useState<string[]>(rd.drone ?? [])
  const [equipa, setEquipa] = useState<string[]>(rd.equipaAnimacao ?? [])
  const [outra, setOutra] = useState<string>(rd.equipaAnimacaoOutra ?? '')
  const [maquina, setMaquina] = useState<string>(rd.maquina ?? '')
  const [audiosNuvem, setAudiosNuvem] = useState<string>(rd.audiosNuvem ?? '')
  const [vaisBackup, setVaisBackup] = useState<string>(rd.vaisFazerBackup ?? '')
  const [problema, setProblema] = useState<string>(rd.problemaTecnico ?? '')
  const [info, setInfo] = useState<string>(rd.infoRelevante ?? '')
  const [enviado, setEnviado] = useState<boolean>(!!rd.enviado)
  const [enviadoEm, setEnviadoEm] = useState<string>(rd.enviadoEm ?? '')
  const [saving, setSaving] = useState(false)

  function snapshot(over: Record<string, any> = {}) {
    return { gravado, tipoCerimonia: tipo, audio, drone, equipaAnimacao: equipa, equipaAnimacaoOutra: outra, maquina, audiosNuvem, vaisFazerBackup: vaisBackup, problemaTecnico: problema, infoRelevante: info, enviado, enviadoEm, ...over }
  }
  async function enviarRelatorio() {
    if (!confirm('Enviar o relatório à RL? Depois de enviado já não poderás editar.')) return
    const now = new Date().toISOString()
    setEnviado(true); setEnviadoEm(now)
    await persist(snapshot({ enviado: true, enviadoEm: now }))
  }
  function setSimNao(key: string, val: string, current: string, setter: (v: string) => void) {
    const next = current === val ? '' : val
    setter(next)
    persist(snapshot({ [key]: next }))
  }
  const simCls = (active: boolean, kind: 'sim' | 'nao') =>
    `px-6 py-2.5 rounded-xl border text-[12px] tracking-wide uppercase font-semibold transition-all ${
      active
        ? (kind === 'sim' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-red-500/20 border-red-500/50 text-red-300')
        : 'bg-white/[0.03] border-white/10 text-white/55 hover:border-white/25 hover:text-white/80'
    }`
  async function persist(payload: Record<string, any>) {
    setSaving(true)
    try {
      await fetch('/api/freelancer-casamentos', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: casamento.id, relatorio_diario: payload }),
      })
    } finally { setSaving(false) }
  }
  function toggle(list: string[], setList: (v: string[]) => void, key: string, opt: string) {
    const next = list.includes(opt) ? list.filter(x => x !== opt) : [...list, opt]
    setList(next)
    persist(snapshot({ [key]: next }))
  }

  const chipCls = (active: boolean) =>
    `px-4 py-2.5 rounded-xl border text-[12px] tracking-wide uppercase font-semibold transition-all inline-flex items-center gap-2 ${
      active
        ? 'bg-gold/20 border-gold/50 text-gold'
        : 'bg-white/[0.03] border-white/10 text-white/55 hover:border-gold/30 hover:text-white/80'
    }`
  const box = (active: boolean) =>
    `w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] shrink-0 ${active ? 'border-gold bg-gold/30 text-gold' : 'border-white/25 text-transparent'}`

  const Chips = ({ titulo, opcoes, list, setList, dataKey }: { titulo: string; opcoes: string[]; list: string[]; setList: (v: string[]) => void; dataKey: string }) => (
    <div>
      <p className="text-[10px] tracking-[0.3em] uppercase text-gold/70 mb-3">{titulo}</p>
      <div className="flex flex-wrap gap-2">
        {opcoes.map(o => (
          <button key={o} onClick={() => toggle(list, setList, dataKey, o)} className={chipCls(list.includes(o))}>
            <span className={box(list.includes(o))}>✓</span>{o}
          </button>
        ))}
      </div>
    </div>
  )

  const inputCls = 'w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white/90 placeholder:text-white/25 outline-none focus:border-gold/40 transition-all'

  return (
    <div className="space-y-6 pt-2">
      {enviado && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-4 py-3 flex items-center gap-2.5">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          <p className="text-[12px] text-emerald-300/90">
            Relatório enviado{enviadoEm ? ` em ${new Date(enviadoEm).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })} às ${new Date(enviadoEm).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}` : ''} — já não é editável.
          </p>
        </div>
      )}
      <fieldset disabled={enviado} className="space-y-6 border-0 p-0 m-0 disabled:opacity-60 disabled:pointer-events-none" style={{ minInlineSize: 'auto' }}>
      <Chips titulo="O que gravaste durante o dia" opcoes={RD_GRAVADO_OPCOES} list={gravado} setList={setGravado} dataKey="gravado" />
      <Chips titulo="Tipo de Cerimónia" opcoes={RD_TIPO_CERIMONIA_OPCOES} list={tipo} setList={setTipo} dataKey="tipoCerimonia" />
      <Chips titulo="Áudio" opcoes={RD_AUDIO_OPCOES} list={audio} setList={setAudio} dataKey="audio" />
      <Chips titulo="Drone" opcoes={RD_DRONE_OPCOES} list={drone} setList={setDrone} dataKey="drone" />

      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-gold/70 mb-3">Equipa de Animação</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {RD_EQUIPA_OPCOES.map(o => (
            <button key={o} onClick={() => toggle(equipa, setEquipa, 'equipaAnimacao', o)} className={chipCls(equipa.includes(o))}>
              <span className={box(equipa.includes(o))}>✓</span>{o}
            </button>
          ))}
        </div>
        <p className="text-[10px] tracking-[0.25em] uppercase text-white/35 mb-1.5">Outra</p>
        <input value={outra} onChange={e => setOutra(e.target.value)} onBlur={() => persist(snapshot())}
          placeholder="Escreve outra equipa de animação…" className={inputCls} />
      </div>

      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-gold/70 mb-3">Máquina Utilizada</p>
        <input value={maquina} onChange={e => setMaquina(e.target.value)} onBlur={() => persist(snapshot())}
          placeholder="Escreve a máquina utilizada…" className={inputCls} />
      </div>

      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-gold/70 mb-3">Backup</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[12px] text-white/70">Áudios na Nuvem</span>
            <div className="flex gap-2">
              <button onClick={() => setSimNao('audiosNuvem', 'sim', audiosNuvem, setAudiosNuvem)} className={simCls(audiosNuvem === 'sim', 'sim')}>Sim</button>
              <button onClick={() => setSimNao('audiosNuvem', 'nao', audiosNuvem, setAudiosNuvem)} className={simCls(audiosNuvem === 'nao', 'nao')}>Não</button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[12px] text-white/70">Vais fazer Backup</span>
            <div className="flex gap-2">
              <button onClick={() => setSimNao('vaisFazerBackup', 'sim', vaisBackup, setVaisBackup)} className={simCls(vaisBackup === 'sim', 'sim')}>Sim</button>
              <button onClick={() => setSimNao('vaisFazerBackup', 'nao', vaisBackup, setVaisBackup)} className={simCls(vaisBackup === 'nao', 'nao')}>Não</button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-gold/70 mb-3">Problema Técnico</p>
        <textarea value={problema} onChange={e => setProblema(e.target.value)} onBlur={() => persist(snapshot())}
          rows={3} placeholder="Descreve algum problema técnico (cartão, bateria, áudio…)…"
          className={`${inputCls} resize-y leading-relaxed`} />
      </div>

      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-gold/70 mb-3">Informação Relevante</p>
        <textarea value={info} onChange={e => setInfo(e.target.value)} onBlur={() => persist(snapshot())}
          rows={4} placeholder="Escreve aqui alguma informação relevante…"
          className={`${inputCls} resize-y leading-relaxed`} />
      </div>
      </fieldset>

      {!enviado && (
        <button onClick={enviarRelatorio} disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[12px] font-bold tracking-widest uppercase hover:bg-emerald-500/25 transition-all disabled:opacity-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Enviar Relatório à RL
        </button>
      )}

      <p className="text-[10px] text-gold/40 h-3">{saving ? 'A guardar…' : ''}</p>
    </div>
  )
}

// ─── Casamentos Tab ───────────────────────────────────────────────────────────

const DEFAULT_INTRO = `Aqui encontras todos os eventos que te foram atribuídos ao longo do ano. Sempre que um novo evento for adicionado, deverás confirmar a tua disponibilidade.\n\nA 3 dias do evento tens acesso ao briefing com toda a informação necessária para o dia — percurso, contactos, detalhes da cerimónia e muito mais.`

function CasamentosTab({ freelancerId, casamentos, onRefresh, freelancerStatus, freelancer, viewAsFreelancer, fotosSelecaoMap, fotosConvidadosMap, setFotosConvidadosMap, initialExpandedId, onExpandedHandled }: { freelancerId: string; casamentos: Casamento[]; onRefresh: () => void; freelancerStatus: string | null; freelancer: Freelancer | null; viewAsFreelancer?: boolean; fotosSelecaoMap: Record<string, string>; fotosConvidadosMap: Record<string, { email: string | null; ctt: string | null; emailLista: string[]; cttLista: string[]; emailWorkflow: string; cttWorkflow: string }>; setFotosConvidadosMap: (updater: (prev: Record<string, { email: string | null; ctt: string | null; emailLista: string[]; cttLista: string[]; emailWorkflow: string; cttWorkflow: string }>) => Record<string, { email: string | null; ctt: string | null; emailLista: string[]; cttLista: string[]; emailWorkflow: string; cttWorkflow: string }>) => void; initialExpandedId?: string | null; onExpandedHandled?: () => void }) {
  const [editing, setEditing] = useState<Casamento | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Partial<Casamento>>({})
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedId ?? null)
  // Quando a notificação manda abrir um casamento específico, sync uma vez
  // e notifica o parent para limpar o pending (evita re-expansão em mudanças
  // posteriores de tab).
  useEffect(() => {
    if (initialExpandedId) {
      setExpandedId(initialExpandedId)
      // Scroll suave para o card depois do render
      requestAnimationFrame(() => {
        const el = typeof document !== 'undefined' ? document.getElementById(`casamento-${initialExpandedId}`) : null
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      onExpandedHandled?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialExpandedId])
  const [editingIntro, setEditingIntro] = useState(false)
  const [introValue, setIntroValue] = useState(freelancer?.intro_casamentos ?? DEFAULT_INTRO)
  const [savingIntro, setSavingIntro] = useState(false)
  // URL do briefing a abrir num modal de preview (null = fechado)
  const [previewBriefingUrl, setPreviewBriefingUrl] = useState<string | null>(null)
  const [previewBriefingTitle, setPreviewBriefingTitle] = useState<string>('')
  // Casamento cujo "Relatório Diário" está aberto na aba lateral (null = fechada).
  // Conteúdo da aba ainda em branco — placeholder por agora.
  const [reportCasamento, setReportCasamento] = useState<Casamento | null>(null)
  // "Ver Encomendas" — modal com as encomendas de fotos enviadas a este membro.
  const [encomendasOpen, setEncomendasOpen] = useState(false)
  const [encomendasList, setEncomendasList] = useState<any[]>([])
  const [encomendasLoading, setEncomendasLoading] = useState(false)
  async function abrirEncomendas() {
    setEncomendasOpen(true); setEncomendasLoading(true)
    try {
      const d = await fetch(`/api/freelancer-encomendas?freelancer_id=${encodeURIComponent(freelancerId)}`).then(r => r.json())
      setEncomendasList(Array.isArray(d?.encomendas) ? d.encomendas : [])
    } catch { setEncomendasList([]) }
    setEncomendasLoading(false)
  }

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
            {!viewAsFreelancer && (
              <button onClick={() => { setShowAdd(true); setEditing(null); setForm({}) }}
                className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-gold text-black text-[13px] font-semibold tracking-wider hover:bg-gold/90 transition-all"
                style={{ boxShadow: '0 0 24px -4px rgba(201,164,92,0.5)' }}>
                <span className="text-lg leading-none">+</span> Novo Evento
              </button>
            )}
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
        <p className="text-[12px] text-white/45 mt-3">{filtered.length} {filtered.length === 1 ? 'evento' : 'eventos'} · {casamentos.length} no total</p>
      </div>

      {/* ── TEXTO INTRO (editável, recolhido) ───────────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] px-5 py-4 space-y-2"
        style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.3), rgba(11,11,11,0.5))' }}>
        <div className="flex items-center justify-between">
          <p className="text-[12px] tracking-[0.4em] text-gold/60 uppercase font-light">Texto Intro · Secção Casamentos</p>
          {!editingIntro && (
            <button onClick={() => setEditingIntro(true)}
              className="px-3 py-1 rounded-lg text-[11px] border border-white/10 text-white/40 hover:text-gold hover:border-gold/30 transition-all tracking-[0.3em] uppercase">
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
          <p className="text-[14px] text-white/60 leading-relaxed whitespace-pre-wrap">{introValue}</p>
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
          <div key={c.id} id={`casamento-${c.id}`}
            className={`group relative overflow-hidden rounded-2xl border transition-all ${isPast ? 'opacity-65' : ''} ${
              expandedId === c.id ? 'scroll-mt-24' : ''
            }`}
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
                    <p className={`text-[18px] font-light leading-none tabular-nums ${isUrgent ? 'text-red-300' : 'text-gold'}`} style={{ fontFamily: 'Georgia, serif' }}>
                      {c.data_casamento.split('-')[2]} <span className="text-[11px] uppercase tracking-[0.2em] opacity-70">{MESES[parseInt(c.data_casamento.split('-')[1])-1]}</span>
                    </p>
                  </div>
                )}
                {/* Counter dias bottom-right */}
                {dtu !== null && !isPast && (
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/15 bg-black/50">
                    <p className={`text-[12px] font-bold tracking-widest uppercase ${isUrgent ? 'text-red-300' : 'text-white/75'}`}>
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
                      <span className={`text-[11px] px-2 py-1 rounded-md border tracking-widest uppercase font-bold ${statusBadge.cls}`}>
                        {statusBadge.label}
                      </span>
                    )}
                    {isUrgent && (
                      <span className="text-[11px] px-2 py-1 rounded-md bg-red-500/15 border border-red-500/40 text-red-300 uppercase tracking-widest font-bold animate-pulse">
                        URGENTE
                      </span>
                    )}
                  </div>
                  {c.nome_noivos && (
                    <h2 className="text-2xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                      {c.nome_noivos}
                    </h2>
                  )}
                  <p className={c.nome_noivos
                    ? 'text-[13px] text-white/55 italic mt-0.5'
                    : 'text-2xl font-light text-white tracking-tight'} style={{ fontFamily: 'Georgia, serif' }}>
                    {c.nome_noivos ? <>📍 {c.local}</> : c.local}
                  </p>
                  {c.data_casamento && (
                    <p className="text-[13px] text-white/55 italic mt-1" style={{ fontFamily: 'Georgia, serif' }}>{fmtDate(c.data_casamento)}</p>
                  )}
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-1">
                  {c.hora_inicio && (
                    <div>
                      <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 mb-0.5">Hora Início</p>
                      <p className="text-[13px] text-white/85 truncate">⏱ {c.hora_inicio}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 mb-0.5">Quinta</p>
                    <p className="text-[13px] text-white/85 truncate">🏛 {c.local || '—'}</p>
                  </div>
                  {c.local_cerimonia && (
                    <div>
                      <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 mb-0.5">Cerimónia</p>
                      <p className="text-[13px] text-white/85 truncate">⛪ {c.local_cerimonia}</p>
                    </div>
                  )}
                  {c.equipa_foto && c.equipa_foto.length > 0 && (
                    <div>
                      <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 mb-0.5">Equipa Foto</p>
                      <p className="text-[13px] text-white/85 truncate">📷 {c.equipa_foto.join(', ')}</p>
                    </div>
                  )}
                  {c.videografo && (
                    <div>
                      <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 mb-0.5">Videógrafo</p>
                      <p className="text-[13px] text-white/85 truncate">🎥 {c.videografo}</p>
                    </div>
                  )}
                  {/* (Removido: bloco 'Briefing · Ver briefing' duplicado — o
                       botão Ver Briefing já existe abaixo nas acções principais
                       e na modal CasamentoFicha.) */}
                </div>

                {/* Serviços do Dia (badges) — sempre visível */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] tracking-[0.3em] uppercase text-white/45">Serviços do Dia</p>
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
                        className="text-[11px] px-2.5 py-1 rounded-full border border-gold/30 text-gold/80 hover:text-gold hover:bg-gold/10 transition-all tracking-wider uppercase">
                        ↻ Sincronizar do evento
                      </button>
                    )}
                  </div>
                  {c.servicos_dia && c.servicos_dia.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {c.servicos_dia.map((s, i) => (
                        <span key={i} className="text-[12px] px-2.5 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold/90 tracking-wide">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-white/40 italic">Sem serviços definidos — clica em "Editar" abaixo para adicionar, ou "Sincronizar do evento" se já estiverem definidos em /eventos-2026.</p>
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
                {/* CTAs principais — Confirmar (verde) sobre Indisponível (vermelho subtil) */}
                {!isPast && !c.data_confirmada && !c.indisponivel && (
                  <div className="flex flex-col items-stretch gap-1.5 w-full max-w-[180px]">
                    <button onClick={async e => { e.stopPropagation(); await fetch('/api/freelancer-casamentos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, data_confirmada: true }) }); onRefresh() }}
                      className="px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-300 text-[10px] tracking-widest uppercase hover:bg-emerald-500/10 transition-all">
                      ✓ Confirmar
                    </button>
                    <button onClick={async e => {
                      e.stopPropagation()
                      if (!confirm('Marcar este casamento como INDISPONÍVEL? O admin será notificado.')) return
                      await fetch('/api/freelancer-casamentos', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: c.id, indisponivel: true }),
                      })
                      onRefresh()
                    }}
                      className="px-3 py-1.5 rounded-lg border border-red-500/25 text-red-300/85 text-[10px] tracking-widest uppercase hover:bg-red-500/10 hover:text-red-300 transition-all">
                      ✕ Indisponível
                    </button>
                  </div>
                )}
                {!viewAsFreelancer && (
                  <button onClick={e => { e.stopPropagation(); del(c.id) }}
                    className="w-8 h-8 rounded-lg border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 transition-all flex items-center justify-center self-end"
                    title="Eliminar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                  </button>
                )}

                {/* ── ADMIN: Toggle alertas de fotografia ──
                     Quando OFF, este casamento NÃO entra nos cards de
                     PRAZOS FOTOS / PRAZOS ÁLBUNS do dashboard /photo.
                     Útil para casamentos onde a RL NÃO é responsável
                     pela parte da fotografia. */}
                {!viewAsFreelancer && (() => {
                  const alertasAtivos = c.alertas_fotografia_ativos !== false
                  return (
                    <button onClick={async e => {
                      e.stopPropagation()
                      if (!c.referencia) {
                        alert('Este casamento ainda não tem referência atribuída. Sincroniza primeiro com o evento.')
                        return
                      }
                      try {
                        // Toggle persistido em portais.settings.alertas_fotografia_ativos
                        // — coluna JSONB já existe, sem necessidade de migração.
                        const res = await fetch('/api/portais', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            referencia: c.referencia,
                            updates: { settings: { alertas_fotografia_ativos: !alertasAtivos } },
                          }),
                        })
                        if (!res.ok) {
                          const j = await res.json().catch(() => ({}))
                          alert('Falha ao gravar alertas: ' + (j.error ?? res.status))
                          return
                        }
                        onRefresh()
                      } catch (err) {
                        alert('Erro ao alterar alertas: ' + (err as Error).message)
                      }
                    }}
                      className={`px-2.5 py-1 rounded-md border text-[10px] tracking-widest uppercase whitespace-nowrap transition-all ${
                        alertasAtivos
                          ? 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
                          : 'border-white/15 text-white/45 hover:bg-white/5'
                      }`}
                      title={alertasAtivos
                        ? 'Alertas de fotografia ATIVOS — clica para desativar (RL não responsável pela fotografia)'
                        : 'Alertas de fotografia DESATIVADOS — clica para reativar'}>
                      {alertasAtivos ? '🔔 Alerta Ativo' : '🔕 Alerta Desativo'}
                    </button>
                  )
                })()}
              </div>
            </div>

            {/* ── EXPANDED PANEL (inline accordion) ─────────────────── */}
            {expandedId === c.id && (
              <div className="relative px-5 pb-5 pt-4 border-t border-gold/15 animate-in fade-in slide-in-from-top-1 space-y-4">
                {/* Secções de fotografia (links de edição + fotos convidados) —
                     escondidas para videógrafos, que não tratam de fotografia. */}
                {freelancerStatus !== 'VIDEOGRAFO' && (<>
                {/* Helper text */}
                <p className="text-[13px] text-white/55 italic leading-relaxed">
                  Sempre que tiveres uma edição pronta, cola aqui o link para ficar guardado. Depois clica em <span className="text-gold/90 font-semibold not-italic">Enviar Notificação</span> para o admin receber um email com o trabalho. A data de envio fica registada e não desaparece.
                </p>

                {/* Grid de URLs do casamento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {([
                    { key: 'url_selecao',  ts: 'url_selecao_enviado_em',  tipo: 'selecao',  label: 'Seleção de Fotos', icon: '◫' },
                    { key: 'url_provas',   ts: 'url_provas_enviado_em',   tipo: 'provas',   label: 'Fotos Prova',      icon: '◧' },
                    { key: 'url_editadas', ts: 'url_editadas_enviado_em', tipo: 'editadas', label: 'Fotos Editadas',   icon: '✓' },
                    { key: 'url_album',    ts: 'url_album_enviado_em',    tipo: 'album',    label: 'Maquete Álbum',    icon: '◐' },
                  ] as const).map(field => {
                    // Lock check: o card só desbloqueia quando o editor correspondente
                    // estiver atribuído na ficha do evento /eventos-2026/[id]
                    const editorFotos = Array.isArray(c.editor_fotos) ? c.editor_fotos : (c.editor_fotos ? [c.editor_fotos] : [])
                    const editorAlbum = Array.isArray(c.editor_album) ? c.editor_album : (c.editor_album ? [c.editor_album] : [])
                    const lockedReason =
                      field.tipo === 'album' && editorAlbum.length === 0
                        ? 'Aguarda atribuição do "Editor de Álbum" na ficha do evento (/eventos-2026)'
                      : (field.tipo === 'selecao' || field.tipo === 'provas' || field.tipo === 'editadas') && editorFotos.length === 0
                        ? 'Aguarda atribuição do "Editor de Fotos" na ficha do evento (/eventos-2026)'
                        : null
                    return (
                      <UrlEntryCard
                        key={field.key}
                        field={field}
                        casamentoId={c.id}
                        casamentoLocal={c.local}
                        casamentoData={c.data_casamento}
                        casamentoReferencia={c.referencia ?? null}
                        fotosDataEntrada={c.referencia ? (fotosSelecaoMap[c.referencia] ?? null) : null}
                        freelancerNome={freelancer?.nome ?? ''}
                        initialUrl={(c as any)[field.key] ?? ''}
                        initialSentAt={(c as any)[field.ts] ?? null}
                        initialStatus={
                          field.tipo === 'editadas' ? (c.status_editadas ?? 'AGUARDAR') :
                          field.tipo === 'selecao'  ? (c.status_selecao  ?? 'AGUARDAR') :
                          field.tipo === 'provas'   ? (c.status_provas   ?? 'AGUARDAR') :
                          field.tipo === 'album'    ? (c.status_album    ?? 'AGUARDAR') :
                          null
                        }
                        lockedReason={lockedReason}
                        isAdmin={!viewAsFreelancer}
                        onRefresh={onRefresh}
                      />
                    )
                  })}
                </div>
                </>)}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5">
                  {/* LEFT: ações principais */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Ticket Fotos/Dia — abre o formulário já com os noivos e a
                         data deste casamento pré-preenchidos (bloqueados), pois o
                         ticket pertence a este casamento. Só para fotógrafos. */}
                    {freelancerStatus !== 'VIDEOGRAFO' && (
                      <a
                        href={`/ticket-fotos-dia?noivos=${encodeURIComponent(c.nome_noivos ?? '')}&data=${encodeURIComponent(c.data_casamento ? (() => { const [y, m, d] = c.data_casamento!.split('-'); return `${d} / ${m} / ${y}` })() : '')}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold text-[11px] tracking-widest uppercase font-bold hover:bg-gold/20 transition-all">
                        <span className="text-[12px]">🎟</span>
                        Ticket Fotos/Dia
                      </a>
                    )}
                    {/* Ver Encomendas — placeholder por agora (sem ação). Funcionalidade
                         a definir mais tarde. Só para fotógrafos. */}
                    {freelancerStatus !== 'VIDEOGRAFO' && (
                      <button onClick={abrirEncomendas}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold text-[11px] tracking-widest uppercase font-bold hover:bg-gold/20 transition-all">
                        <span className="text-[12px]">📦</span>
                        Ver Encomendas
                      </button>
                    )}
                    {/* Relatório Diário — abre aba lateral à direita (conteúdo em branco por agora).
                         Só para videógrafos, tal como o restante fluxo de vídeo. */}
                    {freelancerStatus === 'VIDEOGRAFO' && (
                      <button onClick={() => setReportCasamento(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] tracking-widest uppercase font-bold hover:bg-emerald-500/20 transition-all">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Relatório Diário
                      </button>
                    )}
                    {/* Ver Briefing — desbloqueado quando briefing_url existe (admin enviou em /portal-cliente) */}
                    {c.briefing_url ? (
                      <button onClick={() => { setPreviewBriefingUrl(c.briefing_url!); setPreviewBriefingTitle(c.local || 'Briefing') }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold text-black text-[11px] tracking-widest uppercase font-bold hover:bg-gold/90 transition-all"
                        style={{ boxShadow: '0 0 14px -4px rgba(201,164,92,0.55)' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        Ver Briefing
                      </button>
                    ) : (
                      <button disabled
                        title="Envia o briefing primeiro em /portal-cliente para desbloquear este botão"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-white/30 text-[11px] tracking-widest uppercase font-bold cursor-not-allowed">
                        <span className="text-[12px]">🔒</span>
                        Ver Briefing
                      </button>
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

                  {/* RIGHT: editar (apenas para admin) */}
                  {!viewAsFreelancer && (
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
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
      </div>

      {/* ── Modal · Ver Encomendas (fotos enviadas a este membro) ───────── */}
      {encomendasOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setEncomendasOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-gold/25 overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #100c08, #0b0905)', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.85)' }}
            onClick={e => e.stopPropagation()}>
            <div className="h-0.5 w-full bg-gold/65 shrink-0" />
            <div className="px-6 pt-5 pb-4 border-b border-white/[0.06] flex items-start justify-between gap-3 shrink-0">
              <div>
                <p className="text-[10px] tracking-[0.4em] text-gold/65 uppercase mb-1">Encomendas de Fotos</p>
                <h3 className="text-lg text-white font-light tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                  Enviadas a {freelancer?.nome || 'ti'}{!encomendasLoading && <span className="text-white/35"> · {encomendasList.length}</span>}
                </h3>
              </div>
              <button onClick={() => setEncomendasOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {encomendasLoading ? (
                <p className="text-[13px] text-white/35">A carregar…</p>
              ) : encomendasList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/[0.1] py-12 text-center">
                  <p className="text-[13px] text-white/35">Ainda não tens encomendas enviadas.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {encomendasList.map((e: any) => {
                    const fotos = String(e.fotografias ?? '').split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean)
                    return (
                      <div key={e.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <span className="text-[13px] font-semibold text-gold">{e.pedido}</span>
                            <span className="text-[13px] text-white/80"> · {e.nome}</span>
                            {e.noivos && <span className="block text-[11px] text-white/45 mt-0.5">💍 {e.noivos}{e.data_casamento ? ` · ${e.data_casamento}` : ''}</span>}
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded-md border tracking-widest uppercase font-bold shrink-0 ${e.estado === 'Entregue' ? 'border-emerald-500/35 text-emerald-300 bg-emerald-500/10' : 'border-amber-500/30 text-amber-300 bg-amber-500/10'}`}>
                            {e.estado === 'Entregue' ? 'Entregue' : 'Aguardar'}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-white/60">
                          <span>{e.quantidade} foto(s) · {(e.formato || '').toLowerCase() === 'papel' ? 'Papel' : 'Digital'}</span>
                          <span>{Number(e.total || 0).toFixed(2)} €</span>
                          {e.telefone && <span>☎ {e.telefone}</span>}
                        </div>
                        {fotos.length > 0 && <p className="mt-1.5 text-[11px] text-white/45">Nº fotografias: {fotos.join(', ')}</p>}
                        {e.morada && <p className="mt-1 text-[11px] text-white/45">Morada: {e.morada}</p>}
                        {e.mensagem && <p className="mt-1 text-[11px] text-white/45 italic">“{e.mensagem}”</p>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Aba lateral · Relatório Diário ──────────────────────
           Drawer encostado à direita. Conteúdo ainda em branco
           (placeholder) — será preenchido numa próxima iteração. */}
      {reportCasamento && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex justify-end"
          onClick={() => setReportCasamento(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative z-10 h-full w-full max-w-5xl flex flex-col border-l border-gold/30 animate-in slide-in-from-right duration-300"
            style={{ background: 'linear-gradient(180deg, #100c08, #0b0905)', boxShadow: '-30px 0 70px -10px rgba(0,0,0,0.85)' }}
            onClick={e => e.stopPropagation()}>
            <div className="h-0.5 w-full bg-gold/65 shrink-0" />
            {/* Header */}
            <div className="px-8 pt-5 pb-4 border-b border-white/[0.05] flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <p className="text-[10px] tracking-[0.4em] text-gold/65 uppercase mb-1">Relatório Diário</p>
                <h3 className="text-lg text-white font-light tracking-tight truncate" style={{ fontFamily: 'Georgia, serif' }}>
                  {reportCasamento.local || 'Casamento'}
                </h3>
              </div>
              <button onClick={() => setReportCasamento(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all shrink-0"
                title="Fechar (Esc)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            {/* Corpo */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
              {/* Info do evento: noivos + dia */}
              {(() => {
                const noivos = reportCasamento.nome_noivos
                  || [reportCasamento.nome_noiva, reportCasamento.nome_noivo].filter(Boolean).join(' & ')
                const dia = reportCasamento.data_casamento
                  ? new Date(reportCasamento.data_casamento).toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
                  : null
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-[10px] tracking-[0.3em] uppercase text-white/35 mb-1">Noivos</p>
                      <p className="text-[15px] text-white/90 font-light" style={{ fontFamily: 'Georgia, serif' }}>
                        {noivos || <span className="text-white/25 italic">Por definir</span>}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-[10px] tracking-[0.3em] uppercase text-white/35 mb-1">Dia do Evento</p>
                      <p className="text-[15px] text-white/90 font-light capitalize" style={{ fontFamily: 'Georgia, serif' }}>
                        {dia || <span className="text-white/25 italic">Por definir</span>}
                      </p>
                    </div>
                  </div>
                )
              })()}
              <RelatorioDiarioSecoes casamento={reportCasamento} />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal Preview · Ver Briefing ────────────────────── */}
      {previewBriefingUrl && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={() => setPreviewBriefingUrl(null)}>
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          <div className="relative z-10 w-full max-w-5xl h-[88vh] rounded-3xl overflow-hidden border border-gold/30 flex flex-col"
            style={{ background: 'linear-gradient(180deg, #100c08, #0b0905)', boxShadow: '0 30px 70px -10px rgba(0,0,0,0.85), 0 0 32px -8px rgba(201,164,92,0.35)' }}
            onClick={e => e.stopPropagation()}>
            <div className="h-0.5 w-full bg-gold/65 shrink-0" />
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-white/[0.05] flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl border border-gold/35 bg-gold/[0.08] flex items-center justify-center text-gold text-base shrink-0"
                  style={{ boxShadow: '0 0 18px -6px rgba(201,164,92,0.5)' }}>◧</span>
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.4em] text-gold/65 uppercase mb-1">Briefing do Evento</p>
                  <h3 className="text-lg text-white font-light tracking-tight truncate" style={{ fontFamily: 'Georgia, serif' }}>
                    {previewBriefingTitle}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={withBriefingLock(previewBriefingUrl)} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-[10px] tracking-[0.25em] uppercase font-bold border border-gold/30 bg-gold/[0.06] text-gold hover:bg-gold/15 hover:border-gold/55 transition-all">
                  Abrir em separador ↗
                </a>
                <button onClick={() => setPreviewBriefingUrl(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all"
                  title="Fechar (Esc)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            {/* Iframe do briefing */}
            <div className="flex-1 overflow-hidden bg-black/40">
              <iframe src={withBriefingLock(previewBriefingUrl)} title="Briefing preview"
                className="w-full h-full border-0" />
            </div>
          </div>
        </div>,
        document.body
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
  const [confirmadoVideo, setConfirmadoVideo] = useState(c.data_confirmada_videografo ?? false)
  const [indisponivelFoto, setIndisponivelFoto] = useState(c.indisponivel ?? false)
  const [indisponivelVideo, setIndisponivelVideo] = useState(c.indisponivel_videografo ?? false)
  const [showBriefingPreview, setShowBriefingPreview] = useState(false)

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

          {/* Briefing — bloqueado se ainda não foi enviado */}
          <div>
            <p className="text-[14px] tracking-[0.3em] text-white/25 uppercase mb-2">Briefing</p>
            {c.briefing_url ? (
              <button onClick={() => setShowBriefingPreview(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold text-black text-[12px] tracking-widest uppercase font-bold hover:bg-gold/90 transition-all"
                style={{ boxShadow: '0 0 14px -4px rgba(201,164,92,0.55)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/><circle cx="12" cy="12" r="3"/></svg>
                Ver Briefing
              </button>
            ) : (
              <button disabled
                title="Envia o briefing primeiro em /portal-cliente para desbloquear este botão"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-white/30 text-[12px] tracking-widest uppercase font-bold cursor-not-allowed">
                <span className="text-[13px]">🔒</span>
                Ver Briefing
              </button>
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

      {/* ── Modal Preview · Ver Briefing ────────────────────── */}
      {showBriefingPreview && c.briefing_url && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={() => setShowBriefingPreview(false)}>
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          <div className="relative z-10 w-full max-w-5xl h-[88vh] rounded-3xl overflow-hidden border border-gold/30 flex flex-col"
            style={{ background: 'linear-gradient(180deg, #100c08, #0b0905)', boxShadow: '0 30px 70px -10px rgba(0,0,0,0.85), 0 0 32px -8px rgba(201,164,92,0.35)' }}
            onClick={e => e.stopPropagation()}>
            <div className="h-0.5 w-full bg-gold/65 shrink-0" />
            <div className="px-6 pt-5 pb-4 border-b border-white/[0.05] flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl border border-gold/35 bg-gold/[0.08] flex items-center justify-center text-gold text-base shrink-0"
                  style={{ boxShadow: '0 0 18px -6px rgba(201,164,92,0.5)' }}>◧</span>
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.4em] text-gold/65 uppercase mb-1">Briefing do Evento</p>
                  <h3 className="text-lg text-white font-light tracking-tight truncate" style={{ fontFamily: 'Georgia, serif' }}>
                    {c.local || 'Briefing'}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={c.briefing_url} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-[10px] tracking-[0.25em] uppercase font-bold border border-gold/30 bg-gold/[0.06] text-gold hover:bg-gold/15 hover:border-gold/55 transition-all">
                  Abrir em separador ↗
                </a>
                <button onClick={() => setShowBriefingPreview(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all"
                  title="Fechar (Esc)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-black/40">
              <iframe src={c.briefing_url} title="Briefing preview" className="w-full h-full border-0" />
            </div>
          </div>
        </div>,
        document.body
      )}
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

const ALBUM_STYLE: Record<StatusAlbum, {
  colBorder: string
  colAccent: string
  badge: string
  dot: string
  glow: string
}> = {
  'AGUARDAR':      { colBorder: 'rgba(255,255,255,0.10)',     colAccent: 'rgba(255,255,255,0.40)', badge: 'bg-white/[0.06] text-white/50 border-white/20',          dot: '#a0a0a0', glow: 'rgba(255,255,255,0.06)' },
  'EM EDIÇÃO':     { colBorder: 'rgba(250,204,21,0.30)',      colAccent: 'rgba(250,204,21,0.90)',  badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',   dot: '#facc15', glow: 'rgba(250,204,21,0.12)' },
  'EM APROVAÇÃO':  { colBorder: 'rgba(56,130,246,0.35)',      colAccent: 'rgba(99,165,255,0.90)',  badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',          dot: '#3b82f6', glow: 'rgba(56,130,246,0.14)' },
  'APROVADO':      { colBorder: 'rgba(52,211,153,0.30)',      colAccent: 'rgba(52,211,153,0.90)',  badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: '#34d399', glow: 'rgba(52,211,153,0.12)' },
  'ENTREGUE':      { colBorder: 'rgba(168,85,247,0.35)',      colAccent: 'rgba(192,132,252,0.90)', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',    dot: '#a855f7', glow: 'rgba(168,85,247,0.14)' },
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

  const countByStatus = STATUS_ALBUM.reduce((acc, s) => { acc[s] = album.filter(a => a.status === s).length; return acc }, {} as Record<string, number>)
  const totalAlbuns = album.length

  return (
    <div className="space-y-6">
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08]"
        style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)' }}>
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&h=400&fit=crop"
            alt="" className="w-full h-full object-cover scale-105" style={{ filter: 'blur(2px)' }} />
        </div>
        <div className="absolute inset-0 z-[1]"
          style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.85) 40%, rgba(10,10,10,0.5) 70%, rgba(10,10,10,0.15) 100%)' }} />
        <div className="relative z-10 flex items-start justify-between gap-6 px-8 sm:px-12 py-10">
          <div className="max-w-xl">
            <p className="text-[12px] tracking-[0.5em] text-gold/70 uppercase mb-2">Edição & Aprovação</p>
            <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              ÁL<span className="italic text-gold">buns</span>
            </h1>
            <div className="mt-4 h-px w-16 bg-gradient-to-r from-gold/70 to-transparent" />
            <p className="text-[14px] text-white/55 mt-4 leading-relaxed max-w-md">
              Acompanha o estado dos álbuns deste freelancer — desde a maquete em edição até à entrega final.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {countByStatus['EM EDIÇÃO'] > 0 && (
                <span className="text-[11px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/25 text-yellow-300">
                  {countByStatus['EM EDIÇÃO']} em edição
                </span>
              )}
              {countByStatus['EM APROVAÇÃO'] > 0 && (
                <span className="text-[11px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300">
                  {countByStatus['EM APROVAÇÃO']} a aprovar
                </span>
              )}
              {countByStatus['ENTREGUE'] > 0 && (
                <span className="text-[11px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300">
                  {countByStatus['ENTREGUE']} entregues
                </span>
              )}
            </div>
          </div>
          <button onClick={() => { setShowAdd(true); setEditing(null); setForm({ status: 'AGUARDAR' }) }}
            className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-gold text-black text-[13px] font-semibold tracking-wider hover:bg-gold/90 transition-all shrink-0"
            style={{ boxShadow: '0 0 24px -4px rgba(201,164,92,0.5)' }}>
            <span className="text-lg leading-none">+</span> Adicionar Álbum
          </button>
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: 'Total Álbuns',  value: totalAlbuns,              icon: '◫', sub: 'em todos os estados' },
          { label: 'Em Edição',     value: countByStatus['EM EDIÇÃO'], icon: '✎', sub: 'maquetes em curso' },
          { label: 'Em Aprovação',  value: countByStatus['EM APROVAÇÃO'], icon: '◷', sub: 'aguarda noivos' },
          { label: 'Entregues',     value: countByStatus['ENTREGUE'], icon: '✓', sub: 'finalizados', purple: true },
        ] as const).map(k => (
          <div key={k.label} className="group relative overflow-hidden rounded-2xl border border-white/[0.08] p-5 hover:border-gold/30 transition-all"
            style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.6), rgba(11,11,11,0.85))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.18), transparent 70%)' }} />
            <div className="relative flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl ${(k as any).purple ? 'border-purple-500/30 text-purple-300' : 'border-gold/30 text-gold'}`}
                style={{ background: (k as any).purple
                  ? 'radial-gradient(circle at 30% 30%, rgba(168,85,247,0.15), rgba(168,85,247,0.04))'
                  : 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.15), rgba(201,164,92,0.04))',
                  boxShadow: (k as any).purple ? '0 0 20px -4px rgba(168,85,247,0.25)' : '0 0 22px -4px rgba(201,164,92,0.25)' }}>
                {k.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-1">{k.label}</p>
                <p className="text-2xl font-bold text-white leading-none">{k.value}</p>
                <p className="text-[11px] text-white/35 mt-1.5">{k.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add form (inline) ───────────────────────────────────────────── */}
      {showAdd && (
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: 'linear-gradient(135deg, rgba(201,164,92,0.06), rgba(11,11,11,0.85))', border: '1px solid rgba(201,164,92,0.30)', boxShadow: '0 0 24px -8px rgba(201,164,92,0.30)' }}>
          <p className="text-[12px] tracking-[0.4em] text-gold uppercase">Novo Álbum</p>
          <AlbumForm form={form} setForm={setForm} saving={saving} onSave={save} onCancel={() => setShowAdd(false)} selecaoList={selecaoList} />
        </div>
      )}

      {/* ── Kanban premium ──────────────────────────────────────────────── */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex gap-4 min-w-max">
          {STATUS_ALBUM.map(status => {
            const items = album.filter(a => a.status === status)
            const style = ALBUM_STYLE[status]
            return (
              <div key={status} className="w-[280px] flex-shrink-0 flex flex-col gap-3">
                {/* Column header */}
                <div className="relative overflow-hidden rounded-2xl p-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(20,15,8,0.45), rgba(11,11,11,0.75))',
                    border: `1px solid ${style.colBorder}`,
                    boxShadow: `0 0 24px -10px ${style.glow}`,
                  }}>
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${style.colAccent}, transparent)`, opacity: 0.6 }} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: style.dot, boxShadow: `0 0 8px ${style.dot}` }} />
                      <h3 className="text-[11px] tracking-[0.3em] uppercase font-semibold" style={{ color: style.colAccent }}>{status}</h3>
                    </div>
                    <span className="text-[10px] tracking-widest font-mono px-2 py-0.5 rounded-md border" style={{ color: style.colAccent, borderColor: style.colBorder, background: 'rgba(0,0,0,0.3)' }}>
                      {items.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-3 min-h-[100px]">
                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/[0.08] p-6 text-center">
                      <p className="text-[10px] tracking-[0.3em] uppercase text-white/20">vazio</p>
                    </div>
                  )}
                  {items.map(item => (
                    editing?.id === item.id ? (
                      <div key={item.id} className="rounded-xl p-4 space-y-3"
                        style={{ background: 'linear-gradient(135deg, rgba(201,164,92,0.06), rgba(11,11,11,0.85))', border: '1px solid rgba(201,164,92,0.30)' }}>
                        <p className="text-[10px] tracking-[0.4em] text-gold uppercase">Editar</p>
                        <AlbumForm form={form} setForm={setForm} saving={saving} onSave={save}
                          onCancel={() => setEditing(null)} onDelete={() => del(item.id)} selecaoList={selecaoList} />
                      </div>
                    ) : (
                      <div key={item.id} className="group relative overflow-hidden rounded-xl p-4 flex flex-col gap-2.5 transition-all hover:border-gold/30"
                        style={{
                          background: 'linear-gradient(135deg, rgba(20,15,8,0.35), rgba(11,11,11,0.65))',
                          border: '1px solid rgba(255,255,255,0.06)',
                          boxShadow: '0 4px 14px -4px rgba(0,0,0,0.4)',
                        }}>
                        {/* Vertical accent line */}
                        <div className="absolute top-0 bottom-0 left-0 w-[2px]" style={{ background: `linear-gradient(180deg, ${style.dot}, transparent)`, opacity: 0.5 }} />

                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-semibold text-white/90 leading-tight pr-1">{item.nome}</p>
                          <button onClick={() => { setEditing(item); setForm({ ...item }); setShowAdd(false) }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/30 hover:text-gold flex-shrink-0 transition-all"
                            title="Editar">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                        </div>

                        {item.data_casamento && (
                          <p className="text-[11px] text-white/45 italic" style={{ fontFamily: 'Georgia, serif' }}>{fmtDate(item.data_casamento).split(' · ')[0]}</p>
                        )}

                        {(item.local || item.data_entrega) && (
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            {item.local && <span className="text-white/35">📍 {item.local}</span>}
                            {item.data_entrega && <span className="text-white/35">⏵ {fmtDate(item.data_entrega).split(' · ')[0]}</span>}
                          </div>
                        )}

                        {item.referencia_album
                          ? <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-300/80 bg-emerald-500/10 border border-emerald-500/25 px-2 py-1 rounded-md w-fit">🔗 {item.referencia_album}</span>
                          : <span className="inline-flex items-center gap-1.5 text-[10px] text-red-300/70 bg-red-500/8 border border-red-500/20 px-2 py-1 rounded-md w-fit">⚠ sem referência</span>
                        }

                        {(item.fotos_album || item.texto_album) && (
                          <div className="border-t border-white/[0.04] pt-2 space-y-1.5">
                            {item.fotos_album && (
                              <div>
                                <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] mb-0.5">Fotos</p>
                                <p className="text-[11px] text-white/55 whitespace-pre-wrap leading-snug line-clamp-3">{item.fotos_album}</p>
                              </div>
                            )}
                            {item.texto_album && (
                              <div>
                                <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] mb-0.5">Texto</p>
                                <p className="text-[11px] text-white/55 whitespace-pre-wrap leading-snug line-clamp-3">{item.texto_album}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Status dropdown */}
                        <div className="pt-2 border-t border-white/[0.04]">
                          <select
                            value={item.status}
                            disabled={changingId === item.id}
                            onChange={e => changeStatus(item, e.target.value)}
                            className={`w-full text-[10px] font-bold tracking-[0.25em] uppercase px-3 py-2 rounded-lg border cursor-pointer outline-none transition-all appearance-none pr-7 ${style.badge} disabled:opacity-50`}
                            style={{
                              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c9a96e' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 10px center',
                              backgroundSize: '10px',
                            }}>
                            {STATUS_ALBUM.map(s => (
                              <option key={s} value={s} style={{ background: '#1a1206', color: '#fff' }}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )
          })}
        </div>
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

  // Preview da Seleção dos Noivos (modal inline — sem nova janela)
  const [selecaoPreview, setSelecaoPreview] = useState<any | null>(null)
  const [selecaoError, setSelecaoError]     = useState<string | null>(null)
  const [openingSelecao, setOpeningSelecao] = useState<string | null>(null) // ref ativo
  const [previewLocal, setPreviewLocal]     = useState<string>('')

  async function abrirSelecaoModal(refOrName: string, jobNome: string) {
    if (!refOrName) {
      setPreviewLocal(jobNome)
      setSelecaoError('Este trabalho ainda não tem referência associada — peça ao admin para a definir na ficha do evento.')
      return
    }
    setOpeningSelecao(refOrName); setSelecaoError(null); setPreviewLocal(jobNome)
    try {
      const res = await fetch(`/api/fotos-selecao-by-ref?ref=${encodeURIComponent(refOrName)}`).then(r => r.json())
      const row = res?.row
      if (row?.id) {
        setSelecaoPreview(row)
      } else {
        setSelecaoError('Ainda não existe seleção de fotos para este evento. Os noivos ainda não submeteram.')
      }
    } catch (err: any) {
      setSelecaoError('Erro ao carregar a seleção: ' + (err?.message ?? 'desconhecido'))
    } finally {
      setOpeningSelecao(null)
    }
  }

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

  // KPIs
  const total       = edicao.length
  const novos       = edicao.filter(e => e.status === 'NOVO TRABALHO').length
  const emEdicao    = edicao.filter(e => e.status === 'EM EDIÇÃO').length
  const concluidos  = edicao.filter(e => e.status === 'CONCLUÍDO').length
  const pct         = total > 0 ? Math.round((concluidos / total) * 100) : 0

  // Mapa de estilo premium por estado
  const colMeta: Record<string, { label: string; accent: string; border: string; bg: string; dot: string; iconBg: string; icon: string; chip: string }> = {
    'NOVO TRABALHO': { label: 'Novo Trabalho', accent: 'text-blue-300',    border: 'border-blue-500/30',    bg: 'bg-gradient-to-br from-blue-500/[0.04] to-transparent',    dot: 'bg-blue-400',    iconBg: 'bg-blue-500/15 border-blue-500/35 text-blue-300',    icon: '◷', chip: 'bg-blue-500/20 text-blue-200 border-blue-500/40' },
    'EM EDIÇÃO':     { label: 'Em Edição',     accent: 'text-amber-300',   border: 'border-amber-500/30',   bg: 'bg-gradient-to-br from-amber-500/[0.04] to-transparent',   dot: 'bg-amber-400',   iconBg: 'bg-amber-500/15 border-amber-500/35 text-amber-300', icon: '✎', chip: 'bg-amber-500/20 text-amber-200 border-amber-500/40' },
    'CONCLUÍDO':     { label: 'Concluído',     accent: 'text-emerald-300', border: 'border-emerald-500/30', bg: 'bg-gradient-to-br from-emerald-500/[0.04] to-transparent', dot: 'bg-emerald-400', iconBg: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300', icon: '✓', chip: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40' },
  }

  return (
    <div className="space-y-5">
      {/* HERO premium */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08]"
        style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5)' }}>
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1554080353-a576cf803bda?w=1600&h=380&fit=crop" alt=""
            className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 z-[1]"
          style={{ background: 'linear-gradient(90deg, rgba(11,11,11,0.96) 0%, rgba(11,11,11,0.86) 40%, rgba(11,11,11,0.5) 70%, rgba(11,11,11,0.15) 100%)' }} />
        <div className="relative z-10 flex items-start justify-between gap-4 px-6 sm:px-8 py-7 sm:py-9 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl border border-gold/30 flex items-center justify-center text-2xl text-gold shrink-0"
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.15), rgba(201,164,92,0.04))', boxShadow: '0 0 22px -4px rgba(201,164,92,0.25)' }}>
              ✎
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Edição de <span className="italic text-gold">Fotos</span></h1>
              <p className="text-[13px] text-white/55 mt-1 max-w-md">Gerencia os teus trabalhos de edição. Sincronizado com as seleções de fotos dos noivos.</p>
            </div>
          </div>
          <button onClick={() => { setShowAdd(true); setEditing(null); setForm({ status: 'NOVO TRABALHO' }) }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-black text-[13px] font-bold tracking-wider hover:bg-gold/90 transition-all"
            style={{ boxShadow: '0 0 20px -4px rgba(201,164,92,0.5)' }}>
            <span className="text-lg leading-none">+</span> Adicionar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Jobs',    value: total.toString(),       sub: 'Atribuídos a ti',   color: 'border-white/[0.08] bg-white/[0.02]', text: 'text-white', accent: 'text-white/35' },
          { label: 'Novo Trabalho', value: novos.toString(),       sub: 'Por iniciar',       color: 'border-blue-500/25 bg-blue-500/[0.04]', text: 'text-blue-300', accent: 'text-blue-300/70' },
          { label: 'Em Edição',     value: emEdicao.toString(),    sub: 'Em curso',          color: 'border-amber-500/25 bg-amber-500/[0.04]', text: 'text-amber-300', accent: 'text-amber-300/70' },
          { label: 'Concluídos',    value: concluidos.toString(),  sub: `${pct}% do total`,  color: 'border-emerald-500/25 bg-emerald-500/[0.04]', text: 'text-emerald-300', accent: 'text-emerald-300/70' },
        ].map((k, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${k.color}`}>
            <p className={`text-[10px] tracking-[0.3em] uppercase mb-1 ${k.accent}`}>{k.label}</p>
            <p className={`text-3xl font-light leading-none tabular-nums ${k.text}`} style={{ fontFamily: 'Georgia, serif' }}>{k.value}</p>
            <p className="text-[11px] text-white/35 mt-1.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Barra de progresso (se há trabalhos) */}
      {total > 0 && (
        <div className="rounded-full h-1.5 bg-white/[0.05] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-400 via-amber-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%`, boxShadow: '0 0 12px rgba(52,211,153,0.4)' }} />
        </div>
      )}

      {/* Form Adicionar (inline em cima do kanban) */}
      {showAdd && <EdicaoForm form={form} setForm={setForm} saving={saving} onSave={save} onCancel={() => setShowAdd(false)} selecaoList={selecaoList} />}

      {/* Kanban premium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATUS_EDICAO.map(status => {
          const jobs = edicao.filter(e => e.status === status)
          const cfg = colMeta[status] ?? colMeta['NOVO TRABALHO']
          return (
            <div key={status} className={`rounded-2xl border p-3 ${cfg.border} ${cfg.bg}`}>
              {/* Column header */}
              <div className="flex items-center gap-2 px-2 py-2 mb-2 border-b border-white/[0.05]">
                <span className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[14px] ${cfg.iconBg}`}>{cfg.icon}</span>
                <h3 className={`text-[12px] tracking-[0.3em] uppercase font-bold ${cfg.accent}`}>{cfg.label}</h3>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full border font-bold tracking-wider ${cfg.chip}`}>
                  {jobs.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2.5">
                {jobs.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-white/25 italic">
                    Sem trabalhos
                  </div>
                ) : jobs.map(job => (
                  editing?.id === job.id ? (
                    <EdicaoForm key={job.id} form={form} setForm={setForm} saving={saving} onSave={save}
                      onCancel={() => setEditing(null)} onDelete={() => del(job.id)} selecaoList={selecaoList} />
                  ) : (
                    <div key={job.id}
                      className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-3.5 hover:border-gold/30 hover:from-white/[0.06] transition-all"
                      style={{ boxShadow: '0 6px 16px -8px rgba(0,0,0,0.5)' }}>
                      {/* hover gold sweep */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/[0.04] to-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

                      <div className="relative">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-white leading-tight truncate" style={{ fontFamily: 'Georgia, serif' }}>{job.nome}</p>
                            {job.data_casamento && (
                              <p className="text-[11px] text-white/40 italic mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>
                                {fmtDate(job.data_casamento).split(' · ')[0]}
                              </p>
                            )}
                          </div>
                          <button onClick={() => { setEditing(job); setForm({ ...job }); setShowAdd(false) }}
                            title="Editar"
                            className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-md text-white/30 hover:text-gold hover:bg-gold/10 transition-all">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                        </div>

                        {/* Meta */}
                        {(job.local || job.data_entrega) && (
                          <div className="space-y-0.5 mb-2">
                            {job.local && (
                              <p className="text-[11px] text-white/50 truncate">📍 {job.local}</p>
                            )}
                            {job.data_entrega && (
                              <p className="text-[11px] text-amber-300/70 flex items-center gap-1">
                                <span>📅</span> Entrega: {fmtDate(job.data_entrega).split(' · ')[0]}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Referência */}
                        {job.referencia ? (
                          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/25 text-emerald-300/85 px-2 py-1 rounded-md mb-2">
                            <span>🔗</span> {job.referencia}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-[10px] bg-red-500/10 border border-red-500/25 text-red-300/85 px-2 py-1 rounded-md mb-2">
                            <span>⚠</span> sem referência
                          </div>
                        )}

                        {/* Foto counts (mais elegante) */}
                        {[['Convidados', job.convidados],['Cerimónia', job.cerimonia],['Detalhes', job.detalhes],['Sala', job.sala_animacao],['Álbum', job.fotos_album],['Bolo/Bouquet', job.bolo_bouquet],['Noivos', job.sessao_noivos],['Noiva', job.fotos_noiva],['Noivo', job.fotos_noivo]].some(([,v]) => v) && (
                          <div className="grid grid-cols-3 gap-1 mb-2 pt-2 border-t border-white/[0.04]">
                            {[
                              ['Conv', job.convidados], ['Cer', job.cerimonia], ['Det', job.detalhes],
                              ['Sala', job.sala_animacao], ['Álb', job.fotos_album], ['B/B', job.bolo_bouquet],
                              ['Nv', job.sessao_noivos], ['Noiva', job.fotos_noiva], ['Noivo', job.fotos_noivo],
                            ].filter(([,v]) => v).slice(0, 9).map(([k, v]) => (
                              <div key={k as string} className="bg-white/[0.03] border border-white/[0.06] rounded-md px-1.5 py-1 text-center">
                                <p className="text-[8px] tracking-widest uppercase text-white/30">{k}</p>
                                <p className="text-[12px] font-bold text-gold/85 tabular-nums leading-none mt-0.5">{v}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Estado dropdown + Ver Seleção */}
                        <div className="flex flex-col gap-1.5 mt-2">
                          <div className="relative">
                            <select
                              value={job.status}
                              onChange={ev => changeStatus(job, ev.target.value)}
                              className={`appearance-none w-full text-[10px] tracking-[0.25em] uppercase font-bold px-2.5 py-1.5 pr-7 rounded-md border outline-none cursor-pointer transition-all [color-scheme:dark] ${cfg.chip} hover:opacity-90`}
                            >
                              {STATUS_EDICAO.map(s => (
                                <option key={s} value={s} className="bg-zinc-900 text-white">{s}</option>
                              ))}
                            </select>
                            <span className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] ${cfg.accent}`}>▾</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => abrirSelecaoModal(job.referencia || '', job.nome)}
                            disabled={openingSelecao === (job.referencia || job.nome)}
                            className="text-[10px] px-2.5 py-1.5 rounded-md border border-gold/30 bg-gold/5 text-gold/80 hover:text-gold hover:border-gold/50 hover:bg-gold/10 transition-all tracking-widest uppercase text-center font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            {openingSelecao === (job.referencia || job.nome) ? '⏳ A abrir…' : '👁 Ver Seleção'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Modal Preview: Seleção dos Noivos (inline) ───────────────────── */}
      {(selecaoPreview || selecaoError) && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => { setSelecaoPreview(null); setSelecaoError(null) }}>
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl overflow-hidden border border-gold/25 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #100c08, #0b0905)' }}
            onClick={e => e.stopPropagation()}>
            <div className="h-0.5 w-full bg-gold/60" />

            {/* Header */}
            <div className="px-7 sm:px-8 pt-6 pb-4 border-b border-white/[0.05] flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] tracking-[0.5em] text-gold/65 uppercase mb-1.5">Seleção dos Noivos</p>
                <h2 className="text-2xl sm:text-3xl font-light tracking-[0.12em] text-white uppercase truncate" style={{ fontFamily: 'Georgia, serif' }}>
                  {selecaoPreview?.nome_noivos || previewLocal || '—'}
                </h2>
                {selecaoPreview?.referencia && (
                  <p className="text-[11px] text-white/35 mt-1 tracking-widest">{selecaoPreview.referencia}</p>
                )}
              </div>
              <button onClick={() => { setSelecaoPreview(null); setSelecaoError(null) }}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all shrink-0"
                title="Fechar">✕</button>
            </div>

            {/* Body */}
            <div className="px-7 sm:px-8 py-5 max-h-[70vh] overflow-y-auto">
              {selecaoError ? (
                <div className="py-8 text-center">
                  <p className="text-2xl opacity-30 mb-2">📷</p>
                  <p className="text-[13px] text-white/55 italic leading-relaxed">{selecaoError}</p>
                </div>
              ) : selecaoPreview && (() => {
                const counts: Array<{ label: string; value: string | null }> = [
                  { label: 'Sessão Noivos',  value: selecaoPreview.sessao_noivos },
                  { label: 'Fotos da Noiva', value: selecaoPreview.fotos_noiva },
                  { label: 'Fotos do Noivo', value: selecaoPreview.fotos_noivo },
                  { label: 'Convidados',     value: selecaoPreview.convidados },
                  { label: 'Cerimónia',      value: selecaoPreview.cerimonia },
                  { label: 'Bolo & Bouquet', value: selecaoPreview.bolo_bouquet },
                  { label: 'Sala & Animação',value: selecaoPreview.sala_animacao },
                  { label: 'Fotos p/ Álbum', value: selecaoPreview.fotos_album },
                ]
                const totalFotos = counts.reduce((acc, c) => {
                  const n = Number(c.value); return acc + (Number.isFinite(n) ? n : 0)
                }, 0)
                const fmt = (d: string | null | undefined) => {
                  if (!d) return '—'
                  try {
                    const dt = new Date(d)
                    return dt.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
                  } catch { return d }
                }
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Data do Evento</p>
                        <p className="text-[14px] text-white/85 font-medium">{fmt(selecaoPreview.date)}</p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Data de Entrada</p>
                        <p className="text-[14px] text-white/85 font-medium">{fmt(selecaoPreview.data_entrada)}</p>
                      </div>
                    </div>

                    <div className="mb-5 rounded-2xl border border-gold/30 p-5"
                      style={{
                        background: 'linear-gradient(135deg, rgba(201,164,92,0.10), rgba(201,164,92,0.02))',
                        boxShadow: '0 0 24px -8px rgba(201,164,92,0.3), inset 0 0 0 1px rgba(201,164,92,0.10)',
                      }}>
                      <p className="text-[10px] tracking-[0.4em] text-gold/70 uppercase mb-1.5">Total de Fotos para Edição</p>
                      <p className="text-4xl sm:text-5xl font-light text-gold tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>
                        {totalFotos.toLocaleString('pt-PT')}
                      </p>
                    </div>

                    <p className="text-[10px] tracking-[0.4em] text-white/35 uppercase mb-2">Contagem de Fotos</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                      {counts.map(c => (
                        <div key={c.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                          <p className="text-[9px] tracking-[0.25em] text-white/30 uppercase mb-1 leading-tight">{c.label}</p>
                          <p className="text-xl text-white/90 font-light tabular-nums leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                            {c.value || '—'}
                          </p>
                        </div>
                      ))}
                    </div>

                    {selecaoPreview.detalhes && (
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <p className="text-[10px] tracking-[0.4em] text-white/35 uppercase mb-2">Detalhes & Observações</p>
                        <p className="text-[13px] text-white/75 leading-relaxed whitespace-pre-wrap">{selecaoPreview.detalhes}</p>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            <div className="px-7 sm:px-8 py-3 border-t border-white/[0.05] flex items-center justify-between bg-black/30">
              <p className="text-[9px] tracking-[0.4em] text-white/20 uppercase">RL Photo · Video</p>
              <button onClick={() => { setSelecaoPreview(null); setSelecaoError(null) }}
                className="text-[10px] tracking-widest uppercase text-white/35 hover:text-gold transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
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

// ─── Tarefas Tab ──────────────────────────────────────────────────────────────
// Página de tarefas no mesmo estilo de /painel-editor/tarefas.
// Persistência: localStorage 'freelancer_{id}_tasks' (compatível com TasksWidget)

type TarefaPriority = 'Alta' | 'Média' | 'Baixa'
type TarefaStatus   = 'Pendente' | 'Em andamento' | 'Aguarda Aprovação' | 'Concluída'
type TarefaItem = {
  id: string
  text: string
  done: boolean
  createdAt?: string
  doneAt?: string
  priority?: TarefaPriority
  status?: TarefaStatus
  dueDate?: string                  // ISO YYYY-MM-DD
  project?: string                  // nome livre do projeto/casamento
  description?: string              // descrição livre / notas
  resultado?: string
}

function tarefaStatus(t: TarefaItem): TarefaStatus {
  if (t.status) return t.status
  return t.done ? 'Concluída' : 'Pendente'
}
function tarefaPriority(t: TarefaItem): TarefaPriority { return t.priority ?? 'Média' }
function tarefaPrioCls(p: TarefaPriority) {
  if (p === 'Alta')  return 'bg-red-500/15 text-red-300 border-red-500/30'
  if (p === 'Média') return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
  return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
}
function todayIso(): string {
  const d = new Date(); d.setHours(0,0,0,0)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function deadlineLabel(iso?: string): string {
  if (!iso) return ''
  const today = new Date(); today.setHours(0,0,0,0)
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return ''
  const target = new Date(y, m-1, d)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  if (diff === -1) return 'Ontem'
  if (diff > 1 && diff < 8)  return `${diff} dias`
  if (diff < 0 && diff > -8) return `${Math.abs(diff)} dias atrás`
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${String(d).padStart(2,'0')} ${meses[m-1]}`
}
function isOverdueT(t: TarefaItem): boolean {
  if (!t.dueDate) return false
  if (tarefaStatus(t) === 'Concluída') return false
  return t.dueDate < todayIso()
}

function TarefasTab({ freelancerId, viewAsFreelancer, freelancer, notificacoes, onRefresh }: { freelancerId: string; viewAsFreelancer?: boolean; freelancer: Freelancer | null; notificacoes: Notificacao[]; onRefresh: () => void }) {
  const KEY = `freelancer_${freelancerId}_tasks`
  const [showAdminAssignModal, setShowAdminAssignModal] = useState(false)
  const [tasks, setTasks] = useState<TarefaItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState<'Todas'|'Pendentes'|'Em andamento'|'Concluídas'|'Atrasadas'>('Todas')
  const [search, setSearch] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)                       // modal 'Enviar Tarefa' para outro membro
  const [completingTask, setCompletingTask] = useState<TarefaItem | null>(null)  // tarefa a concluir (precisa de resposta)
  const [viewingTask, setViewingTask] = useState<TarefaItem | null>(null)        // tarefa concluída cujo resultado se quer ver
  const [mainTab, setMainTab] = useState<'minhas'|'enviadas'>('minhas')           // separador no topo da página Tarefas
  const [sentTasks, setSentTasks] = useState<Notificacao[]>([])
  const [loadingSent, setLoadingSent] = useState(false)
  const [viewingThreadTask, setViewingThreadTask] = useState<{ threadId: string; title: string } | null>(null)
  const [respondingNotif, setRespondingNotif] = useState<Notificacao | null>(null)
  const [currentFreelancerName, setCurrentFreelancerName] = useState('')

  // Envia resposta a uma tarefa atribuída — replica a lógica do NotificacoesAdminTab
  async function respondToAssignedTask(notif: Notificacao, resposta: string) {
    const parsedMeta = parseNotifMeta(notif.mensagem)
    const { senderId, threadId, creatorId, creatorName, threadTitle } = parsedMeta
    if (!senderId) {
      alert('Não foi possível identificar quem enviou a tarefa.')
      return
    }
    const tituloOriginal = threadTitle || (notif.titulo ?? '').replace(/^[✈↩✓] (Nova tarefa(?: do| de)? \w+|Resposta de [^—]+)— /, '')
    const respTitulo = `↩ Resposta de ${currentFreelancerName || 'um colega'} — ${tituloOriginal}`
    const newMeta = JSON.stringify({
      senderId: freelancerId, senderName: currentFreelancerName,
      threadId: threadId ?? `t-legacy-${notif.id}`,
      creatorId: creatorId ?? senderId,
      creatorName: creatorName ?? '',
      threadTitle: tituloOriginal,
    })
    const respMensagem = [
      `__META__${newMeta}__/META__`,
      resposta.trim(),
      '',
      `Em resposta a: "${tituloOriginal}"`,
      currentFreelancerName ? `De: ${currentFreelancerName}` : null,
    ].filter(Boolean).join('\n')
    // 1) Notificação para o remetente original
    if (senderId !== 'admin') {
      await fetch('/api/freelancer-notificacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelancer_id: senderId,
          titulo: respTitulo,
          mensagem: respMensagem,
          tipo: 'resposta_tarefa',
          lida: false,
        }),
      })
      try {
        await fetch('/api/send-notif-freelancer-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ freelancer_id: senderId, titulo: respTitulo }),
        })
      } catch {/* opcional */}
    }
    // 2) Marca a original como lida
    await fetch('/api/freelancer-notificacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notif.id, lida: true }),
    })
    setRespondingNotif(null)
    onRefresh()
  }

  // Carrega 'Tarefas Enviadas' (notifs cujo senderId no META sou eu)
  useEffect(() => {
    if (!freelancerId) return
    setLoadingSent(true)
    fetch(`/api/freelancer-notificacoes?sent_by=${encodeURIComponent(freelancerId)}`)
      .then(r => r.json())
      .then(d => setSentTasks((d.notificacoes ?? []) as Notificacao[]))
      .catch(() => setSentTasks([]))
      .finally(() => setLoadingSent(false))
    // Nome do membro actual (para o modal de conversação)
    fetch('/api/freelancers').then(r => r.json()).then(d => {
      const me = (d.freelancers ?? []).find((f: any) => f.id === freelancerId)
      if (me) setCurrentFreelancerName(me.nome ?? '')
    }).catch(() => {})
  }, [freelancerId, mainTab])
  // Calendário
  const today = new Date(); today.setHours(0,0,0,0)
  const [calView, setCalView] = useState({ y: today.getFullYear(), m: today.getMonth() })

  useEffect(() => {
    let cancelled = false
    async function load() {
      // 1) Carrega tarefas locais (criadas pelo membro ou recebidas
      //    via thread de tarefas entre membros)
      let local: TarefaItem[] = []
      try {
        const raw = localStorage.getItem(KEY)
        if (raw) local = JSON.parse(raw)
      } catch {}

      // 2) Carrega tarefas atribuídas pelo admin via /tarefas
      //    (tabela `tarefas` no Supabase com assigned_to[])
      let admin: TarefaItem[] = []
      try {
        const r = await fetch(`/api/freelancer-tarefas?id=${encodeURIComponent(freelancerId)}`, { cache: 'no-store' })
        const d = await r.json()
        if (Array.isArray(d?.tarefas)) admin = d.tarefas
      } catch {}

      if (cancelled) return

      // 3) Merge: tarefas admin sobrescrevem locais com o mesmo id
      //    (caso o membro tenha guardado uma cópia antes). Tarefas
      //    locais que NÃO começam por 'tarefa-supabase:' são preservadas.
      const map = new Map<string, TarefaItem>()
      for (const t of local) {
        if (!t?.id?.startsWith('tarefa-supabase:')) map.set(t.id, t)
      }
      for (const t of admin) map.set(t.id, t)

      const merged = Array.from(map.values()).sort((a, b) => {
        const ad = a.createdAt ?? ''
        const bd = b.createdAt ?? ''
        return bd.localeCompare(ad)
      })
      setTasks(merged)
      setLoaded(true)
    }
    load()
    // Refresh a cada 60s para apanhar novas tarefas enviadas
    const id = setInterval(load, 60_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [KEY, freelancerId])

  useEffect(() => {
    if (!loaded) return
    // Apenas as tarefas locais vão para o localStorage (as do admin
    // ficam só na BD para evitar drift).
    const local = tasks.filter(t => !t?.id?.startsWith('tarefa-supabase:'))
    try { localStorage.setItem(KEY, JSON.stringify(local)) } catch {}
  }, [tasks, KEY, loaded])

  function addTask(t: TarefaItem) {
    setTasks(prev => [t, ...prev])
  }
  function toggleTask(id: string) {
    const t = tasks.find(x => x.id === id)
    if (!t) return
    // Concluída → não permitir voltar atrás (regra de negócio premium)
    if (tarefaStatus(t) === 'Concluída') return
    // Já em Aguarda Aprovação → só o admin é que pode concluir; nada a fazer
    if (tarefaStatus(t) === 'Aguarda Aprovação') return
    // Para concluir, OBRIGA o membro a escrever resposta — abre modal
    setCompletingTask(t)
  }
  function completeWithResponse(id: string, resposta: string) {
    const respStr = resposta.trim()
    // ── Caso 1: tarefa enviada pelo admin (id começa com 'tarefa-supabase:')
    //    A regra de negócio é "membro responde, admin é que conclui".
    //    Localmente fica em 'Aguarda Aprovação' (não-revertível) e a
    //    resposta vai para a DB no array assigned_to[me].resposta.
    if (id.startsWith('tarefa-supabase:')) {
      const supabaseId = id.replace(/^tarefa-supabase:/, '')
      const now = new Date().toISOString()
      // Fire-and-forget: PATCH para gravar a resposta dentro de assigned_to[me]
      ;(async () => {
        try {
          // Buscar estado atual da tarefa para fazer merge correcto
          const r = await fetch(`/api/freelancer-tarefas?id=${encodeURIComponent(freelancerId)}`, { cache: 'no-store' })
          // Não precisamos do GET — mas o PATCH abaixo precisa de saber assigned_to.
          // O endpoint freelancer-tarefas não devolve o array completo, vamos pedir
          // o registo cru via /api/tarefas-by-id (next-best-thing): usar o supabase
          // directamente via PATCH endpoint que aceita "responder" via meta hint.
          await fetch(`/api/tarefas/${encodeURIComponent(supabaseId)}/responder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              freelancer_id: freelancerId,
              freelancer_nome: currentFreelancerName || (freelancer?.nome ?? 'Membro'),
              resposta: respStr,
              respondida_em: now,
            }),
          })
        } catch {/* ignore */}
      })()

      setTasks(prev => prev.map(t => {
        if (t.id !== id) return t
        return {
          ...t,
          done: false,              // só admin marca como done
          status: 'Aguarda Aprovação',
          resultado: respStr,
          doneAt: now,              // usado para "respondeu em"
        }
      }))
      setCompletingTask(null)
      return
    }

    // ── Caso 2: tarefa local — membro conclui normalmente
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      return {
        ...t,
        done: true,
        status: 'Concluída',
        doneAt: new Date().toISOString(),
        resultado: respStr,
      }
    }))
    setCompletingTask(null)
  }
  function setTaskStatus(id: string, status: TarefaStatus) {
    // Se vai para Concluída, força o fluxo do modal
    if (status === 'Concluída') {
      const t = tasks.find(x => x.id === id)
      if (t) setCompletingTask(t)
      return
    }
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      return { ...t, status, done: false, doneAt: undefined }
    }))
  }
  function deleteTask(id: string) {
    if (!confirm('Eliminar esta tarefa?')) return
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  // Counts (sem filtro)
  const counts = {
    total:       tasks.length,
    pendentes:   tasks.filter(t => tarefaStatus(t) === 'Pendente').length,
    emAndamento: tasks.filter(t => tarefaStatus(t) === 'Em andamento').length,
    concluidas:  tasks.filter(t => tarefaStatus(t) === 'Concluída').length,
    atrasadas:   tasks.filter(t => isOverdueT(t)).length,
  }

  // Filtro principal
  let filtered = tasks
  if (filter === 'Pendentes')      filtered = filtered.filter(t => tarefaStatus(t) === 'Pendente')
  else if (filter === 'Em andamento') filtered = filtered.filter(t => tarefaStatus(t) === 'Em andamento')
  else if (filter === 'Concluídas')   filtered = filtered.filter(t => tarefaStatus(t) === 'Concluída')
  else if (filter === 'Atrasadas')    filtered = filtered.filter(t => isOverdueT(t))
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(t => t.text.toLowerCase().includes(q) || (t.project ?? '').toLowerCase().includes(q))
  }

  const todayIsoStr = todayIso()
  const hoje      = filtered.filter(t => t.dueDate === todayIsoStr && (showCompleted || tarefaStatus(t) !== 'Concluída'))
  const atrasadas = filtered.filter(t => isOverdueT(t) && t.dueDate !== todayIsoStr)
  const proximas  = filtered.filter(t => t.dueDate && t.dueDate > todayIsoStr && tarefaStatus(t) !== 'Concluída').sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
  const semData   = filtered.filter(t => !t.dueDate && tarefaStatus(t) !== 'Concluída')
  const concluidas = filtered.filter(t => tarefaStatus(t) === 'Concluída' && t.dueDate !== todayIsoStr)

  // Donut
  const segments = (() => {
    const total = counts.pendentes + counts.emAndamento + counts.concluidas + counts.atrasadas
    if (total === 0) return [] as Array<{ color: string; from: number; to: number }>
    const items = [
      { value: counts.pendentes,   color: '#94a3b8' },
      { value: counts.emAndamento, color: '#facc15' },
      { value: counts.concluidas,  color: '#34d399' },
      { value: counts.atrasadas,   color: '#ef4444' },
    ]
    const segs: Array<{ color: string; from: number; to: number }> = []
    let acc = 0
    items.forEach(it => {
      if (it.value === 0) return
      const from = acc
      const to = acc + (it.value / total) * 360
      segs.push({ color: it.color, from, to })
      acc = to
    })
    return segs
  })()
  const donutTotal = counts.pendentes + counts.emAndamento + counts.concluidas + counts.atrasadas

  // Calendário cells
  const firstDay = new Date(calView.y, calView.m, 1).getDay()
  const lastDate = new Date(calView.y, calView.m + 1, 0).getDate()
  const prevLastDate = new Date(calView.y, calView.m, 0).getDate()
  const markedDays = new Map<number, number>()
  tasks.forEach(t => {
    if (!t.dueDate) return
    const [yy, mm, dd] = t.dueDate.split('-').map(Number)
    if (yy === calView.y && mm - 1 === calView.m && dd) {
      markedDays.set(dd, (markedDays.get(dd) ?? 0) + 1)
    }
  })
  type Cell = { day: number; current: boolean; isToday: boolean; hasTask: boolean }
  const cells: Cell[] = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevLastDate - i, current: false, isToday: false, hasTask: false })
  for (let d = 1; d <= lastDate; d++) {
    const isToday = calView.y === today.getFullYear() && calView.m === today.getMonth() && d === today.getDate()
    cells.push({ day: d, current: true, isToday, hasTask: (markedDays.get(d) ?? 0) > 0 })
  }
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - lastDate - firstDay + 1, current: false, isToday: false, hasTask: false })

  // Próximos prazos (3)
  const proxPrazos = [...proximas, ...atrasadas].sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')).slice(0, 3)

  // ── Componente: TaskRow ─────────────────────────────────────
  function TaskRow({ t }: { t: TarefaItem }) {
    const status = tarefaStatus(t)
    const prio = tarefaPriority(t)
    const overdue = isOverdueT(t)
    const done = status === 'Concluída'
    const isAwaitingApproval = status === 'Aguarda Aprovação'
    // ⚠ Tarefa enviada pelo admin que ainda precisa de resposta
    //    obrigatória. Marca com glow vermelho pulsante.
    const needsResponse = t.id.startsWith('tarefa-supabase:')
      && !done && !isAwaitingApproval
    return (
      <div
        className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
          done ? 'border-white/[0.04] bg-white/[0.01] opacity-70'
               : needsResponse ? 'fl-needs-response border-red-400/45 bg-red-500/[0.04] hover:bg-red-500/[0.07]'
               : isAwaitingApproval ? 'border-amber-400/35 bg-amber-500/[0.04] hover:bg-amber-500/[0.06]'
               : overdue ? 'border-red-500/25 bg-red-500/[0.03] hover:bg-red-500/[0.06]'
                         : 'border-white/[0.07] bg-white/[0.02] hover:border-gold/25 hover:bg-white/[0.04]'
        }`}
      >
        <button onClick={() => toggleTask(t.id)}
          title={needsResponse ? 'Clica para escrever resposta (obrigatório)' : isAwaitingApproval ? 'Aguarda aprovação do admin' : undefined}
          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all relative ${
            done ? 'bg-emerald-500/25 border-emerald-500/55 text-emerald-300'
                 : needsResponse ? 'border-red-400/70 hover:border-red-400 hover:bg-red-400/15 fl-needs-response-dot'
                 : isAwaitingApproval ? 'border-amber-400/60 bg-amber-400/15 text-amber-300'
                 : 'border-white/25 hover:border-gold/60 hover:bg-gold/10'
          }`}>
          {done && <span className="text-[10px] leading-none">✓</span>}
          {isAwaitingApproval && !done && <span className="text-[10px] leading-none">⏳</span>}
          {needsResponse && <span className="text-[10px] leading-none text-red-400">!</span>}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-medium truncate ${done ? 'line-through text-white/40' : needsResponse ? 'text-white' : 'text-white/90'}`}>
            {t.text}
            {t.description && (
              <span title={t.description}
                className="ml-2 text-[10px] text-gold/50 hover:text-gold cursor-help">ⓘ</span>
            )}
          </p>
          {t.description ? (
            <p className="text-[11px] text-white/50 truncate" title={t.description}>{t.description}</p>
          ) : (
            <p className="text-[11px] text-white/35 truncate italic">
              {t.project || 'Sem projeto associado'}
            </p>
          )}
          {t.description && t.project && (
            <p className="text-[10px] text-white/30 truncate italic">{t.project}</p>
          )}
        </div>

        {/* Badge "RESPOSTA OBRIGATÓRIA" pulsando — só admin-sent + pendente */}
        {needsResponse && (
          <button
            onClick={() => toggleTask(t.id)}
            className="fl-needs-response-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] tracking-[0.18em] uppercase font-bold text-red-200 bg-red-500/15 border border-red-400/45 shrink-0 hover:bg-red-500/25 transition-colors"
            title="Esta tarefa exige uma resposta antes de poder ser concluída"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01M10.3 3.86L2 19a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.86a2 2 0 0 0-3.4 0Z" />
            </svg>
            <span className="hidden sm:inline">Resposta Obrigatória</span>
          </button>
        )}

        {/* Badge "AGUARDA APROVAÇÃO" — admin-sent + já respondeu */}
        {isAwaitingApproval && (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9.5px] tracking-widest uppercase font-bold text-amber-200 bg-amber-500/15 border border-amber-400/35 shrink-0"
            title="A tua resposta foi enviada — aguarda aprovação do admin"
          >
            <span>⏳</span>
            <span className="hidden sm:inline">Aguarda Admin</span>
          </span>
        )}

        <span className={`text-[10px] px-2 py-0.5 rounded-md border tracking-widest uppercase font-bold shrink-0 ${tarefaPrioCls(prio)}`}>
          {prio}
        </span>
        {t.dueDate && (
          <span className={`text-[10px] tracking-wider whitespace-nowrap shrink-0 flex items-center gap-1 ${
            overdue ? 'text-red-300' : 'text-white/55'
          }`}>
            <span>📅</span> {deadlineLabel(t.dueDate)}
          </span>
        )}
        {status === 'Em andamento' && (
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0 tracking-widest uppercase font-bold">
            ◷
          </span>
        )}
        {done && t.resultado && (
          <button onClick={() => setViewingTask(t)}
            title="Ver resposta de conclusão"
            className="text-[10px] px-2 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-400/55 shrink-0 tracking-wider uppercase font-bold transition-all flex items-center gap-1">
            <span>✎</span> Ver Resposta
          </button>
        )}
        <div className="relative shrink-0">
          <button onClick={() => deleteTask(t.id)}
            title="Eliminar"
            className="w-6 h-6 flex items-center justify-center rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
            ✕
          </button>
        </div>
      </div>
    )
  }

  // ── Componente: Section ─────────────────────────────────────
  function Section({ title, count, accent, children }: { title: string; count: number; accent?: 'red' | 'emerald'; children: React.ReactNode }) {
    const accentBadgeCls = accent === 'red'
      ? 'bg-red-500/15 text-red-300 border-red-500/30'
      : accent === 'emerald'
        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        : 'bg-gold/15 text-gold border-gold/30'
    return (
      <div className="rounded-2xl border border-white/[0.06] p-4"
        style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-[14px] font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md border tracking-wider font-bold ${accentBadgeCls}`}>{count}</span>
        </div>
        <div className="space-y-1.5">{children}</div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Keyframes do glow vermelho pulsante "Resposta Obrigatória" ── */}
      <style jsx global>{`
        @keyframes flNeedsResponseGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.40),
                        0 0 14px -2px rgba(248, 113, 113, 0.25);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(248, 113, 113, 0),
                        0 0 22px -2px rgba(248, 113, 113, 0.45);
          }
        }
        .fl-needs-response { animation: flNeedsResponseGlow 2.2s ease-in-out infinite; }
        @keyframes flNeedsResponseDot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.55); }
          50%      { box-shadow: 0 0 0 5px rgba(248, 113, 113, 0); }
        }
        .fl-needs-response-dot { animation: flNeedsResponseDot 1.8s ease-in-out infinite; }
        @keyframes flNeedsResponseBadge {
          0%, 100% { opacity: .85; }
          50%      { opacity: 1; }
        }
        .fl-needs-response-badge { animation: flNeedsResponseBadge 1.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .fl-needs-response, .fl-needs-response-dot, .fl-needs-response-badge {
            animation: none !important;
          }
        }
      `}</style>

      {/* HERO da página Tarefas */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08]"
        style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5)' }}>
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&h=380&fit=crop" alt=""
            className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 z-[1]"
          style={{ background: 'linear-gradient(90deg, rgba(11,11,11,0.96) 0%, rgba(11,11,11,0.86) 40%, rgba(11,11,11,0.5) 70%, rgba(11,11,11,0.15) 100%)' }} />
        <div className="relative z-10 flex items-start justify-between gap-4 px-6 sm:px-8 py-7 sm:py-9 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl border border-gold/30 flex items-center justify-center text-2xl text-gold shrink-0"
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.15), rgba(201,164,92,0.04))', boxShadow: '0 0 22px -4px rgba(201,164,92,0.25)' }}>
              ◷
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Tarefas</h1>
              <p className="text-[13px] text-white/55 mt-1 max-w-md">Gerencia todas as tuas tarefas. Sincronizadas com os teus projetos e prazos.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* ADMIN: Atribuir tarefa a este freelancer (visível só quando NÃO é vista 'como freelancer') */}
            {!viewAsFreelancer && (
              <button onClick={() => setShowAdminAssignModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-500/45 bg-purple-500/15 text-purple-200 text-[13px] font-bold tracking-wider hover:bg-purple-500/25 hover:border-purple-400/60 transition-all"
                style={{ boxShadow: '0 0 12px -4px rgba(168,85,247,0.5)' }}>
                ✓ Atribuir Tarefa
              </button>
            )}
            <button onClick={() => setShowSendModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-200 text-[13px] font-bold tracking-wider hover:bg-blue-500/20 hover:border-blue-400/60 transition-all"
              style={{ boxShadow: '0 0 12px -4px rgba(59,130,246,0.45)' }}>
              ✈ Enviar Tarefa
            </button>
            <button onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-black text-[13px] font-bold tracking-wider hover:bg-gold/90 transition-all"
              style={{ boxShadow: '0 0 20px -4px rgba(201,164,92,0.5)' }}>
              <span className="text-lg leading-none">+</span> Nova Tarefa
            </button>
          </div>
        </div>
      </div>

      {/* Separador: Minhas Tarefas | Tarefas Enviadas */}
      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        {([
          { key: 'minhas'   as const, label: 'Minhas Tarefas',    count: tasks.length },
          { key: 'enviadas' as const, label: 'Tarefas Enviadas',  count: sentTasks.length },
        ]).map(t => (
          <button key={t.key} onClick={() => setMainTab(t.key)}
            className={`relative px-4 py-2.5 text-[13px] tracking-[0.2em] uppercase font-semibold transition-all ${
              mainTab === t.key ? 'text-gold' : 'text-white/40 hover:text-white/75'
            }`}>
            {t.label}
            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
              mainTab === t.key ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-white/[0.06] text-white/40'
            }`}>{t.count}</span>
            {mainTab === t.key && <span className="absolute bottom-0 left-3 right-3 h-px bg-gold" />}
          </button>
        ))}
      </div>

      {/* Aviso: regra de conclusão obrigatória (só nas Minhas Tarefas) */}
      {mainTab === 'minhas' && (
      <div className="flex items-start gap-3 px-4 py-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.04]">
        <span className="text-amber-300 text-base shrink-0 mt-0.5">ⓘ</span>
        <p className="text-[12px] text-amber-100/85 leading-relaxed">
          Para marcares uma tarefa como <span className="font-bold not-italic uppercase">Concluída</span> tens de escrever uma <span className="font-bold not-italic">resposta de conclusão</span> a descrever o que foi feito. A resposta fica registada e não pode ser alterada.
        </p>
      </div>
      )}

      {/* Aviso: envio de tarefas entre membros — visível em ambas as abas */}
      <div className="rounded-2xl p-4 sm:p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.10), rgba(168,85,247,0.03))',
          border: '1px solid rgba(168,85,247,0.30)',
          boxShadow: '0 0 18px -6px rgba(168,85,247,0.30)',
        }}>
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0 mt-0.5"
            style={{ background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.42)', color: '#d8b4fe' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] tracking-[0.35em] uppercase font-bold mb-2" style={{ color: '#d8b4fe' }}>
              Enviar tarefa a outro membro
            </p>
            <p className="text-[13px] text-white/80 leading-relaxed mb-2.5">
              Podes enviar uma tarefa a <strong className="text-white">qualquer membro da equipa</strong> — basta clicar em{' '}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] tracking-wider uppercase font-bold mx-0.5"
                style={{ background: 'rgba(168,85,247,0.18)', color: '#d8b4fe', border: '1px solid rgba(168,85,247,0.42)' }}>
                ✈ Enviar Tarefa
              </span>{' '}
              no topo. O membro recebe notificação no sino e por email, e <strong className="text-white">é obrigado a dar uma resposta</strong> ao concluir.
            </p>
            <p className="text-[12px] text-white/55 italic leading-relaxed">
              Assim, as tarefas importantes deixam de se perder em mensagens de WhatsApp — fica tudo registado, com prazo e historial de respostas.
            </p>
          </div>
        </div>
      </div>

      {/* ── Tarefas Atribuídas a Mim (do admin / outros membros) ── */}
      {mainTab === 'minhas' && (() => {
        const tarefasAtribuidas = notificacoes.filter(n =>
          n.tipo === 'nova_tarefa_atribuida' && !n.lida
        )
        if (tarefasAtribuidas.length === 0) return null
        return (
          <div className="rounded-2xl border border-purple-500/30 p-4"
            style={{ background: 'linear-gradient(135deg, rgba(40,15,55,0.4), rgba(11,11,11,0.5))' }}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>
                  Tarefas <span className="italic text-purple-300">Atribuídas a Mim</span>
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-200 font-bold uppercase tracking-wider animate-pulse">
                  {tarefasAtribuidas.length} nova{tarefasAtribuidas.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-[11px] text-white/35 italic">Recebidas via portal · respondem com '↩ Responder'</p>
            </div>
            <div className="space-y-2">
              {tarefasAtribuidas.map(n => {
                const meta = parseNotifMeta(n.mensagem)
                const dt = new Date(n.created_at)
                const dateLabel = `${dt.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}`
                const isAdmin = meta.senderId === 'admin'
                return (
                  <div key={n.id} className="flex items-start gap-3 px-3 py-3 rounded-xl border border-purple-500/20 bg-purple-500/[0.05] hover:bg-purple-500/[0.1] transition-all">
                    <div className="w-10 h-10 rounded-lg border border-purple-500/35 bg-purple-500/15 flex items-center justify-center text-purple-200 text-base shrink-0">
                      {isAdmin ? '✓' : '✈'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-[13px] text-white font-medium truncate">
                          {meta.threadTitle || n.titulo.replace(/^[✈✓] /, '').replace(/^Nova tarefa do? \w+ — /, '')}
                        </p>
                        {isAdmin && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/25 border border-purple-500/40 text-purple-200 tracking-wider uppercase font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      {meta.cleanMensagem && (
                        <p className="text-[11px] text-white/55 leading-relaxed line-clamp-2 whitespace-pre-wrap">
                          {meta.cleanMensagem.split('\n').slice(0, 2).join(' · ')}
                        </p>
                      )}
                      <p className="text-[10px] text-white/30 mt-1">
                        {meta.senderName || 'Sistema'} · {dateLabel}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {/* Responder — sempre disponível para tarefas atribuídas */}
                      <button onClick={() => setRespondingNotif(n)}
                        title="Responder à tarefa"
                        className="px-3 py-1.5 rounded-md text-[10px] tracking-wider uppercase font-bold border border-blue-500/45 bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 hover:border-blue-400/60 transition-all"
                        style={{ boxShadow: '0 0 10px -4px rgba(59,130,246,0.5)' }}>
                        ↩ Responder
                      </button>
                      {meta.threadId && (
                        <button onClick={() => setViewingThreadTask({ threadId: meta.threadId!, title: meta.threadTitle || n.titulo })}
                          title="Ver conversação da tarefa"
                          className="px-3 py-1.5 rounded-md text-[10px] tracking-wider uppercase font-bold border border-purple-500/45 bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 hover:border-purple-400/60 transition-all">
                          💬 Ver
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Tab: Tarefas Enviadas — agrupadas por threadId */}
      {mainTab === 'enviadas' && (
        <div className="space-y-3">
          {loadingSent ? (
            <p className="text-center py-6 text-white/30 text-[13px] italic">A carregar tarefas enviadas…</p>
          ) : sentTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] text-center py-14">
              <span className="text-5xl opacity-20 block mb-3">✈</span>
              <p className="text-[14px] text-white/55 italic mb-1">Ainda não enviaste tarefas a outros membros.</p>
              <p className="text-[12px] text-white/30">
                Carrega em <span className="text-blue-300/85 font-semibold">✈ Enviar Tarefa</span> no topo para começar.
              </p>
            </div>
          ) : (() => {
            const groups = new Map<string, { items: Notificacao[]; firstMeta: ReturnType<typeof parseNotifMeta> | null }>()
            sentTasks.forEach(n => {
              const meta = parseNotifMeta(n.mensagem)
              const key = meta.threadId || `solo-${n.id}`
              if (!groups.has(key)) groups.set(key, { items: [], firstMeta: meta })
              groups.get(key)!.items.push(n)
            })
            const sorted = Array.from(groups.entries()).sort((a, b) => {
              const ta = a[1].items[a[1].items.length - 1].created_at || ''
              const tb = b[1].items[b[1].items.length - 1].created_at || ''
              return tb.localeCompare(ta)
            })
            return sorted.map(([threadId, group]) => {
              const meta = group.firstMeta
              const lastItem = group.items[group.items.length - 1]
              const recipientIds = Array.from(new Set(group.items.map(i => i.freelancer_id)))
              const threadTitle = meta?.threadTitle || lastItem.titulo
              const concluded = group.items.some(i => i.tipo === 'tarefa_concluida')
              const lastDate = new Date(lastItem.created_at)
              const dateLabel = `${lastDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} · ${lastDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
              return (
                <div key={threadId}
                  className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all hover:border-gold/30 hover:bg-white/[0.02] ${
                    concluded ? 'border-emerald-500/25 bg-emerald-500/[0.03]' : 'border-white/[0.08] bg-white/[0.02]'
                  }`}>
                  <div className="w-11 h-11 rounded-lg border border-blue-500/30 bg-blue-500/10 flex items-center justify-center text-blue-300 text-base shrink-0">
                    {concluded ? '✓' : '✈'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[14px] text-white font-medium truncate">{threadTitle}</span>
                      {concluded && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wider uppercase font-bold">
                          Concluída
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-white/50 truncate">
                      Para: <span className="text-white/75">{recipientIds.length > 1 ? `${recipientIds.length} membros` : '1 membro'}</span>
                      <span className="text-white/25"> · </span>
                      {group.items.length} mensagem{group.items.length === 1 ? '' : 's'}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">Última atualização: {dateLabel}</p>
                  </div>
                  {meta?.threadId && (
                    <button onClick={() => setViewingThreadTask({ threadId: meta.threadId!, title: threadTitle })}
                      className="px-3 py-1.5 rounded-md text-[11px] tracking-wider uppercase font-bold border border-gold/35 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold/55 transition-all flex items-center gap-1 shrink-0">
                      💬 Ver Conversação
                    </button>
                  )}
                </div>
              )
            })
          })()}
        </div>
      )}

      {/* GRID 2/3 + 1/3 (só na tab Minhas Tarefas) */}
      {mainTab === 'minhas' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* MAIN — lista */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Filter Bar */}
          <div className="rounded-2xl border border-white/[0.06] p-4"
            style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1">
                {(['Todas','Pendentes','Em andamento','Concluídas','Atrasadas'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`relative px-3 py-2 text-[13px] tracking-wide transition-all ${
                      filter === f ? 'text-gold' : 'text-white/45 hover:text-white/80'
                    }`}>
                    {f}
                    {filter === f && <span className="absolute bottom-0 left-3 right-3 h-px bg-gold" />}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[14px]">⌕</span>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Pesquisar tarefa…"
                    className="bg-black/30 border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40 w-56" />
                </div>
              </div>
            </div>
          </div>

          {/* Secções */}
          {hoje.length > 0 && <Section title="Tarefas de Hoje" count={hoje.length}>{hoje.map(t => <TaskRow key={t.id} t={t} />)}</Section>}
          {atrasadas.length > 0 && <Section title="Atrasadas" count={atrasadas.length} accent="red">{atrasadas.map(t => <TaskRow key={t.id} t={t} />)}</Section>}
          {proximas.length > 0 && <Section title="Próximas Tarefas" count={proximas.length}>{proximas.map(t => <TaskRow key={t.id} t={t} />)}</Section>}
          {semData.length > 0 && filter === 'Todas' && <Section title="Sem prazo" count={semData.length}>{semData.map(t => <TaskRow key={t.id} t={t} />)}</Section>}

          {!showCompleted && concluidas.length > 0 && (
            <button onClick={() => setShowCompleted(true)}
              className="w-full py-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-[12px] tracking-widest uppercase text-white/45 hover:text-gold hover:border-gold/30 transition-all">
              Mostrar concluídas ({concluidas.length}) ⌄
            </button>
          )}
          {showCompleted && concluidas.length > 0 && (
            <Section title="Concluídas" count={concluidas.length} accent="emerald">{concluidas.map(t => <TaskRow key={t.id} t={t} />)}</Section>
          )}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/[0.08] text-center py-16">
              <p className="text-gold/40 text-4xl font-serif leading-none mb-3">∅</p>
              <p className="text-[14px] text-white/35">Sem tarefas com este filtro.</p>
            </div>
          )}
        </div>

        {/* RIGHT — sidebar */}
        <aside className="lg:col-span-1 flex flex-col gap-4">

          {/* Visão Geral (donut) */}
          <div className="rounded-2xl border border-white/[0.06] p-4"
            style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold/70 font-semibold mb-3">Visão Geral</p>
            <div className="flex items-center gap-5">
              <div className="relative w-24 h-24 shrink-0">
                <svg width="96" height="96" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                  {segments.map((s, i) => {
                    const a1 = (s.from - 90) * Math.PI / 180
                    const a2 = (s.to - 90) * Math.PI / 180
                    const x1 = 50 + 40 * Math.cos(a1), y1 = 50 + 40 * Math.sin(a1)
                    const x2 = 50 + 40 * Math.cos(a2), y2 = 50 + 40 * Math.sin(a2)
                    const large = (s.to - s.from) > 180 ? 1 : 0
                    return <path key={i} d={`M ${x1} ${y1} A 40 40 0 ${large} 1 ${x2} ${y2}`} fill="none" stroke={s.color} strokeWidth="10" strokeLinecap="butt" />
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-light text-white tabular-nums leading-none" style={{ fontFamily: 'Georgia, serif' }}>{donutTotal}</p>
                  <p className="text-[8px] tracking-widest uppercase text-white/30">Tarefas</p>
                </div>
              </div>
              <div className="flex-1 space-y-2 text-[12px]">
                {[
                  { color: '#94a3b8', label: 'Pendentes', value: counts.pendentes },
                  { color: '#facc15', label: 'Em andamento', value: counts.emAndamento },
                  { color: '#34d399', label: 'Concluídas', value: counts.concluidas },
                  { color: '#ef4444', label: 'Atrasada', value: counts.atrasadas },
                ].map(it => (
                  <div key={it.label} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: it.color }} />
                    <span className="text-white/85 tabular-nums font-semibold w-5">{it.value}</span>
                    <span className="text-white/55">{it.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sincronização */}
          <div className="rounded-2xl border border-emerald-500/15 p-4"
            style={{ background: 'linear-gradient(135deg, rgba(16,40,28,0.4), rgba(11,11,11,0.5))' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-lg shrink-0">↻</div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-white mb-0.5">Sincronização</p>
                <p className="text-[11px] text-white/50 leading-relaxed">Todas as tarefas estão sincronizadas com os projetos e prazos.</p>
                <p className="text-[11px] text-emerald-300 mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
                  Sincronizado agora
                </p>
              </div>
            </div>
          </div>

          {/* Calendário */}
          <div className="rounded-2xl border border-white/[0.06] p-4"
            style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold/70 font-semibold">Calendário</p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => { const d = new Date(calView.y, calView.m - 1, 1); setCalView({ y: d.getFullYear(), m: d.getMonth() }) }}
                  className="w-6 h-6 rounded-md border border-white/10 text-white/50 hover:text-gold hover:border-gold/30 transition-all text-[12px]">‹</button>
                <button onClick={() => setCalView({ y: today.getFullYear(), m: today.getMonth() })}
                  className="text-[10px] tracking-widest uppercase text-white/45 hover:text-gold transition-colors px-2 py-1 rounded-md border border-white/10">Hoje</button>
                <button onClick={() => { const d = new Date(calView.y, calView.m + 1, 1); setCalView({ y: d.getFullYear(), m: d.getMonth() }) }}
                  className="w-6 h-6 rounded-md border border-white/10 text-white/50 hover:text-gold hover:border-gold/30 transition-all text-[12px]">›</button>
              </div>
            </div>
            <p className="text-center text-[13px] tracking-wider text-white/85 mb-2 font-light">
              {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][calView.m]} {calView.y}
            </p>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['D','S','T','Q','Q','S','S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] tracking-widest uppercase text-white/30 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((c, i) => {
                const cls = `w-full h-full flex items-center justify-center text-[11px] rounded-md transition-all ${
                  c.isToday ? 'bg-gold text-black font-bold'
                    : c.hasTask && c.current ? 'text-gold border border-gold/30 hover:bg-gold/10'
                    : c.current ? 'text-white/65 hover:bg-white/[0.04]'
                    : 'text-white/15'
                }`
                return (
                  <div key={i} className="aspect-square relative">
                    <div className={cls}
                      style={c.isToday ? { boxShadow: '0 0 12px rgba(201,164,92,0.5)' } : {}}>
                      {c.day}
                    </div>
                    {c.hasTask && c.current && !c.isToday && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold pointer-events-none" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Próximos Prazos */}
          {proxPrazos.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] p-4"
              style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold/70 font-semibold mb-3">Próximos Prazos</p>
              <div className="space-y-2">
                {proxPrazos.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-white/[0.06] hover:border-gold/30 hover:bg-white/[0.02] transition-all">
                    <div className="w-9 h-9 rounded-lg border border-gold/30 bg-gold/10 flex items-center justify-center text-gold text-base shrink-0">◷</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-white truncate">{t.text}</p>
                      <p className="text-[11px] text-white/40 truncate">{t.project || 'Sem projeto'}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border tracking-widest uppercase font-bold ${
                      isOverdueT(t) ? 'bg-red-500/15 text-red-300 border-red-500/30' : 'bg-gold/15 text-gold border-gold/30'
                    }`}>
                      {deadlineLabel(t.dueDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
      )}

      {/* Modal Nova Tarefa */}
      {showNewModal && (
        <NovaTarefaModal
          onClose={() => setShowNewModal(false)}
          onCreate={(t) => { addTask(t); setShowNewModal(false) }}
        />
      )}

      {/* Modal Concluir Tarefa — exige resposta de conclusão */}
      {completingTask && (
        <ConcluirTarefaModal
          task={completingTask}
          onClose={() => setCompletingTask(null)}
          onConfirm={(resposta) => completeWithResponse(completingTask.id, resposta)}
        />
      )}

      {/* Modal Ver Resposta (read-only) — tarefas concluídas */}
      {viewingTask && (
        <VerRespostaModal
          task={viewingTask}
          onClose={() => setViewingTask(null)}
        />
      )}

      {/* Modal Enviar Tarefa para outro membro */}
      {showSendModal && (
        <EnviarTarefaModal
          senderId={freelancerId}
          onClose={() => setShowSendModal(false)}
        />
      )}

      {/* Modal ADMIN: Atribuir Tarefa a este freelancer */}
      {showAdminAssignModal && (
        <AtribuirTarefaAdminModal
          freelancerId={freelancerId}
          freelancerNome={freelancer?.nome ?? ''}
          onClose={() => setShowAdminAssignModal(false)}
        />
      )}

      {/* Modal Responder a tarefa atribuída — directo a partir desta página */}
      {respondingNotif && (
        <ResponderTarefaModal
          notif={respondingNotif}
          onClose={() => setRespondingNotif(null)}
          onSend={(resposta) => respondToAssignedTask(respondingNotif, resposta)}
        />
      )}

      {/* Modal Conversação (a partir do tab Tarefas Enviadas) */}
      {viewingThreadTask && (
        <ConversacaoModal
          threadId={viewingThreadTask.threadId}
          title={viewingThreadTask.title}
          currentFreelancerId={freelancerId}
          currentFreelancerName={currentFreelancerName}
          onClose={() => setViewingThreadTask(null)}
          onConcluir={async () => {
            // Conclusão a partir da página Tarefas — envia notif aos participantes
            const threadId = viewingThreadTask.threadId
            const title = viewingThreadTask.title
            const meta = JSON.stringify({
              senderId: freelancerId, senderName: currentFreelancerName,
              threadId, creatorId: freelancerId, creatorName: currentFreelancerName,
              threadTitle: title,
            })
            const msg = [`__META__${meta}__/META__`, `A tarefa foi marcada como concluída por ${currentFreelancerName || 'o criador'}.`].join('\n')
            const res = await fetch(`/api/freelancer-notificacoes?thread_id=${encodeURIComponent(threadId)}`).then(r => r.json())
            const partIds = Array.from(new Set(((res.notificacoes ?? []) as Notificacao[]).map(n => n.freelancer_id))).filter(id => id !== freelancerId)
            await Promise.all(partIds.map(pid =>
              fetch('/api/freelancer-notificacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ freelancer_id: pid, titulo: `✓ Tarefa concluída — ${title}`, mensagem: msg, tipo: 'tarefa_concluida', lida: false }),
              })
            ))
            setViewingThreadTask(null)
            // refrescar sentTasks
            const reloaded = await fetch(`/api/freelancer-notificacoes?sent_by=${encodeURIComponent(freelancerId)}`).then(r => r.json())
            setSentTasks((reloaded.notificacoes ?? []) as Notificacao[])
          }}
          onResponder={() => { /* não aplicável nesta view */ }}
        />
      )}
    </div>
  )
}

// ── Modal Enviar Tarefa — envia tarefa para outro membro da equipa ──
function EnviarTarefaModal({ senderId, onClose }: { senderId: string; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  const [members, setMembers] = useState<Array<{ id: string; nome: string; status: string | null; email: string | null }>>([])
  const [senderName, setSenderName] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [priority, setPriority] = useState<TarefaPriority>('Média')
  const [dueDate, setDueDate] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    fetch('/api/freelancers')
      .then(r => r.json())
      .then(d => {
        const list = (d.freelancers ?? []) as Array<{ id: string; nome: string; status: string | null; email: string | null }>
        // Encontra nome do remetente
        const me = list.find(f => f.id === senderId)
        if (me) setSenderName(me.nome ?? '')
        // Exclui o próprio
        setMembers(list.filter(f => f.id !== senderId).sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '')))
      })
      .catch(() => setMembers([]))
  }, [senderId])

  const recipient = members.find(m => m.id === recipientId)
  const valid = recipientId && titulo.trim().length >= 3

  async function submit() {
    if (!valid) return
    setSending(true); setError(null)
    try {
      const prazoLabel = dueDate ? new Date(dueDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : null
      const titleFull  = `✈ Nova tarefa de ${senderName || 'um colega'} — ${titulo.trim()}`
      // Marker invisível com senderId + threadId para permitir 'Responder' +
      // 'Ver Conversação' depois. __META__{json}__/META__ é removido pelo renderer.
      const threadId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `t-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const meta = JSON.stringify({
        senderId, senderName,
        threadId,
        creatorId: senderId, creatorName: senderName,
        threadTitle: titulo.trim(),
      })
      const mensagem = [
        `__META__${meta}__/META__`,
        descricao.trim() ? descricao.trim() : null,
        `Prioridade: ${priority}`,
        prazoLabel ? `Prazo: ${prazoLabel}` : null,
        senderName ? `Enviada por: ${senderName}` : null,
        'Esta tarefa precisa da tua resposta.',
      ].filter(Boolean).join('\n')

      // 1) Notificação no portal do destinatário (sino vermelho)
      await fetch('/api/freelancer-notificacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelancer_id: recipientId,
          titulo: titleFull,
          mensagem,
          tipo: 'nova_tarefa_atribuida',
          lida: false,
        }),
      })

      // 2) Email para o destinatário (template já existente — texto curto)
      try {
        await fetch('/api/send-notif-freelancer-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ freelancer_id: recipientId, titulo: titleFull }),
        })
      } catch { /* opcional */ }

      setSuccess(true)
      // Fechar após 1.5s
      setTimeout(() => { onClose() }, 1500)
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao enviar tarefa')
    } finally { setSending(false) }
  }

  if (!mounted || typeof document === 'undefined') return null

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden border border-blue-500/30 shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #0a1018, #060810)' }}
        onClick={e => e.stopPropagation()}>
        <div className="h-0.5 w-full bg-blue-500/70" />
        <div className="px-6 pt-5 pb-3 border-b border-white/[0.05] flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[0.5em] text-blue-300/85 uppercase mb-1">Enviar Tarefa</p>
            <h2 className="text-xl font-light tracking-[0.05em] text-white" style={{ fontFamily: 'Georgia, serif' }}>Para a equipa</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all">✕</button>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-2xl mx-auto mb-3"
              style={{ boxShadow: '0 0 24px -4px rgba(52,211,153,0.5)' }}>✓</div>
            <p className="text-[14px] text-white font-medium">Tarefa enviada!</p>
            <p className="text-[12px] text-white/55 mt-1">{recipient?.nome} foi notificado por sino + email.</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 space-y-3">
              {/* Banner azul explicativo */}
              <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl border border-blue-500/25 bg-blue-500/[0.05]">
                <span className="text-blue-300 text-base shrink-0 mt-0.5">ⓘ</span>
                <p className="text-[11px] text-blue-100/85 leading-relaxed">
                  O membro escolhido recebe a tarefa no <span className="font-semibold">sino do portal</span> e por <span className="font-semibold">email</span>. Vai precisar de dar resposta.
                </p>
              </div>

              {/* Destinatário */}
              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 mb-1.5">
                  Destinatário <span className="text-red-300">*</span>
                </label>
                <select value={recipientId} onChange={e => setRecipientId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-400/50 [color-scheme:dark]">
                  <option value="">— Escolhe um membro —</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.nome}{m.status ? ` · ${m.status}` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Título */}
              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 mb-1.5">
                  Título <span className="text-red-300">*</span>
                </label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} autoFocus
                  placeholder="O que precisa de ser feito?"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400/50" />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 mb-1.5">Descrição</label>
                <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3}
                  placeholder="Detalhes, instruções, contexto… (opcional)"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400/50 resize-none leading-relaxed" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 mb-1.5">Prioridade</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as TarefaPriority)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-400/50 [color-scheme:dark]">
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 mb-1.5">Prazo</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-400/50 [color-scheme:dark]" />
                </div>
              </div>

              {error && (
                <p className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
                  ⚠ {error}
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/[0.05] flex items-center justify-end gap-2 bg-black/30">
              <button onClick={onClose}
                className="px-4 py-2 rounded-lg text-[11px] tracking-wider uppercase text-white/55 hover:text-white border border-white/10 hover:border-white/30 transition-all">
                Cancelar
              </button>
              <button onClick={submit} disabled={!valid || sending}
                className={`px-5 py-2 rounded-lg text-[11px] tracking-wider uppercase font-bold transition-all ${
                  valid && !sending
                    ? 'bg-blue-500 text-white hover:bg-blue-400'
                    : 'bg-white/[0.04] text-white/25 cursor-not-allowed border border-white/10'
                }`}
                style={valid && !sending ? { boxShadow: '0 0 14px -4px rgba(59,130,246,0.6)' } : undefined}>
                {sending ? 'A enviar...' : '✈ Enviar Tarefa'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

// ── Modal Ver Resposta — apresenta a resposta de conclusão (read-only) ──
function VerRespostaModal({ task, onClose }: { task: TarefaItem; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!mounted || typeof document === 'undefined') return null

  let doneAtLabel = ''
  if (task.doneAt) {
    try {
      const d = new Date(task.doneAt)
      doneAtLabel = d.toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {/* keep empty */}
  }

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-lg rounded-3xl overflow-hidden border border-emerald-500/30 shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #0a1410, #060b09)' }}
        onClick={e => e.stopPropagation()}>
        <div className="h-0.5 w-full bg-emerald-500/70" />
        <div className="px-6 pt-5 pb-3 border-b border-white/[0.05] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.5em] text-emerald-300/85 uppercase mb-1">Resposta de Conclusão</p>
            <h2 className="text-xl font-light tracking-[0.05em] text-white truncate" style={{ fontFamily: 'Georgia, serif' }}>
              {task.text}
            </h2>
            {doneAtLabel && (
              <p className="text-[11px] text-emerald-400/65 mt-1.5 flex items-center gap-1.5">
                <span>✓</span> Concluída em {doneAtLabel}
              </p>
            )}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all shrink-0">✕</button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {/* Resposta */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 mb-1.5">Resposta do Membro</label>
            <div className="bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-3 text-[14px] text-white/90 leading-relaxed whitespace-pre-wrap min-h-[80px]">
              {task.resultado || <span className="text-white/30 italic">Sem resposta registada.</span>}
            </div>
          </div>

          {/* Descrição original (se existia) */}
          {task.description && (
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-white/35 mb-1.5">Descrição Original</label>
              <div className="bg-black/30 border border-white/[0.06] rounded-lg px-4 py-3 text-[13px] text-white/65 leading-relaxed whitespace-pre-wrap italic">
                {task.description}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-md border tracking-widest uppercase font-bold ${tarefaPrioCls(tarefaPriority(task))}`}>
              {tarefaPriority(task)}
            </span>
            {task.project && (
              <span className="text-[11px] text-white/45 italic">{task.project}</span>
            )}
            {task.dueDate && (
              <span className="text-[11px] text-white/40 ml-auto">
                Prazo: {deadlineLabel(task.dueDate)}
              </span>
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-white/[0.05] flex items-center justify-end bg-black/30">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-[11px] tracking-wider uppercase text-white/65 hover:text-white border border-white/10 hover:border-white/30 transition-all">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

// ── Modal Concluir Tarefa — exige resposta antes de marcar como Concluída ───
function ConcluirTarefaModal({ task, onClose, onConfirm }: { task: TarefaItem; onClose: () => void; onConfirm: (resposta: string) => void }) {
  const [resposta, setResposta] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const minLen = 10
  const valid = resposta.trim().length >= minLen
  function submit() { if (valid) onConfirm(resposta.trim()) }

  if (!mounted || typeof document === 'undefined') return null

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-lg rounded-3xl overflow-hidden border border-emerald-500/30 shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #0a1410, #060b09)' }}
        onClick={e => e.stopPropagation()}>
        <div className="h-0.5 w-full bg-emerald-500/70" />
        <div className="px-6 pt-5 pb-3 border-b border-white/[0.05] flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[0.5em] text-emerald-300/85 uppercase mb-1">Concluir Tarefa</p>
            <h2 className="text-xl font-light tracking-[0.05em] text-white" style={{ fontFamily: 'Georgia, serif' }}>
              {task.text}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all">✕</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Alerta sobre a regra */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06]">
            <span className="text-amber-300 text-xl shrink-0 mt-0.5">⚠</span>
            <div className="text-[12px] text-amber-100/85 leading-relaxed">
              Para marcares esta tarefa como <span className="font-bold not-italic uppercase">Concluída</span>, tens de escrever uma <span className="font-bold not-italic">resposta de conclusão</span> a descrever o que foi feito.
              <br />
              <span className="text-amber-200/65 italic">Esta resposta fica registada e não pode ser alterada depois de submetida.</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 mb-1.5">
              Resposta de conclusão <span className="text-red-300">*</span>
            </label>
            <textarea
              value={resposta}
              onChange={e => setResposta(e.target.value)}
              autoFocus
              rows={5}
              placeholder="Descreve o que foi feito, links/ficheiros entregues, observações…"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40 resize-none leading-relaxed"
            />
            <p className={`text-[11px] mt-1.5 ${valid ? 'text-emerald-400/70' : 'text-white/35'}`}>
              {resposta.trim().length}/{minLen} caracteres mínimos {valid ? '✓' : ''}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.05] flex items-center justify-end gap-2 bg-black/30">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-[11px] tracking-wider uppercase text-white/55 hover:text-white border border-white/10 hover:border-white/30 transition-all">
            Cancelar
          </button>
          <button onClick={submit} disabled={!valid}
            className={`px-5 py-2 rounded-lg text-[11px] tracking-wider uppercase font-bold transition-all ${
              valid
                ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                : 'bg-white/[0.04] text-white/25 cursor-not-allowed border border-white/10'
            }`}
            style={valid ? { boxShadow: '0 0 14px -4px rgba(52,211,153,0.7)' } : undefined}>
            ✓ Concluir Tarefa
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

// ── Modal Nova Tarefa ─────────────────────────────────────
function NovaTarefaModal({ onClose, onCreate }: { onClose: () => void; onCreate: (t: TarefaItem) => void }) {
  const [text, setText] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TarefaPriority>('Média')
  const [dueDate, setDueDate] = useState('')
  const [project, setProject] = useState('')
  const [status, setStatus] = useState<TarefaStatus>('Pendente')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function submit() {
    const t = text.trim()
    if (!t) return
    onCreate({
      id: crypto.randomUUID(),
      text: t,
      description: description.trim() || undefined,
      done: status === 'Concluída',
      status,
      priority,
      dueDate: dueDate || undefined,
      project: project.trim() || undefined,
      createdAt: new Date().toISOString(),
      doneAt: status === 'Concluída' ? new Date().toISOString() : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden border border-gold/25 shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #100c08, #0b0905)' }}
        onClick={e => e.stopPropagation()}>
        <div className="h-0.5 w-full bg-gold/60" />
        <div className="px-6 pt-5 pb-3 border-b border-white/[0.05] flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[0.5em] text-gold/65 uppercase mb-1">Nova Tarefa</p>
            <h2 className="text-xl font-light tracking-[0.05em] text-white" style={{ fontFamily: 'Georgia, serif' }}>Criar tarefa</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all">✕</button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-white/35 mb-1">Título</label>
            <input value={text} onChange={e => setText(e.target.value)} autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
              placeholder="O que precisa de ser feito?"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-gold/40" />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-white/35 mb-1">Descrição</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Detalhes adicionais, instruções, links… (opcional)"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-gold/40 resize-none leading-relaxed" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-white/35 mb-1">Prioridade</label>
              <select value={priority} onChange={e => setPriority(e.target.value as TarefaPriority)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-gold/40 [color-scheme:dark]">
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-white/35 mb-1">Estado</label>
              <select value={status} onChange={e => setStatus(e.target.value as TarefaStatus)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-gold/40 [color-scheme:dark]">
                <option value="Pendente">Pendente</option>
                <option value="Em andamento">Em andamento</option>
                {/* 'Concluída' NÃO está disponível aqui: só pode ser definido via
                    o fluxo de conclusão (com resposta obrigatória). */}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-white/35 mb-1">Prazo</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-gold/40 [color-scheme:dark]" />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-white/35 mb-1">Projeto / Casamento</label>
            <input value={project} onChange={e => setProject(e.target.value)}
              placeholder="Nome do casamento (opcional)"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-gold/40" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/[0.05] flex items-center justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-[11px] tracking-wider uppercase text-white/55 hover:text-white border border-white/10 hover:border-white/30 transition-all">
            Cancelar
          </button>
          <button onClick={submit} disabled={!text.trim()}
            className="px-5 py-2 rounded-lg text-[11px] tracking-wider uppercase font-bold bg-gold text-black hover:bg-gold/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={text.trim() ? { boxShadow: '0 0 12px -4px rgba(201,164,92,0.5)' } : undefined}>
            + Criar tarefa
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Calendário Tab ──────────────────────────────────────────────────────────
// Calendário full-page com todos os eventos: casamentos, edições, álbuns, tarefas.

type CalEvento = {
  id: string
  iso: string          // YYYY-MM-DD
  type: 'casamento' | 'edicao' | 'album' | 'tarefa-pessoal' | 'tarefa-atribuida' | 'prazo-selecao' | 'prazo-edicao' | 'notificacao' | 'pre-wedding'
  title: string
  subtitle?: string
}

function CalendarioTab({ freelancerId, casamentos, edicao, album, notificacoes, freelancer, disponibilidade = [], onRefresh, viewAsFreelancer }: {
  freelancerId: string
  casamentos: Casamento[]
  edicao: Edicao[]
  album: Album[]
  notificacoes: Notificacao[]
  freelancer: Freelancer | null
  disponibilidade?: Array<{ id: string; freelancer_id: string; data_inicio: string; data_fim: string | null; motivo: string | null }>
  onRefresh?: () => void
  viewAsFreelancer?: boolean
}) {
  // ── Modal para informar indisponibilidade ─────────────────────────────
  const [showIndispForm, setShowIndispForm] = useState(false)
  const [indispForm, setIndispForm] = useState<{ data_inicio: string; data_fim: string; motivo: string }>({ data_inicio: '', data_fim: '', motivo: '' })
  const [savingIndisp, setSavingIndisp] = useState(false)
  const [deletingIndisp, setDeletingIndisp] = useState<string | null>(null)

  async function handleSaveIndisp() {
    if (!indispForm.data_inicio) { alert('Indica pelo menos a data de início.'); return }
    if (indispForm.data_fim && indispForm.data_fim < indispForm.data_inicio) {
      alert('A data fim não pode ser anterior à data início.'); return
    }
    setSavingIndisp(true)
    try {
      const res = await fetch('/api/freelancer-disponibilidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelancer_id: freelancerId,
          data_inicio: indispForm.data_inicio,
          data_fim: indispForm.data_fim || indispForm.data_inicio,
          motivo: indispForm.motivo || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert('Falha ao guardar: ' + (j.error ?? res.status))
        return
      }
      setIndispForm({ data_inicio: '', data_fim: '', motivo: '' })
      setShowIndispForm(false)
      onRefresh?.()
    } finally { setSavingIndisp(false) }
  }
  async function handleDeleteIndisp(id: string) {
    if (!confirm('Remover este período de indisponibilidade?')) return
    setDeletingIndisp(id)
    try {
      await fetch(`/api/freelancer-disponibilidade?id=${id}`, { method: 'DELETE' })
      onRefresh?.()
    } finally { setDeletingIndisp(null) }
  }

  // Set de YYYY-MM-DD onde o membro está indisponível
  const indispDays = useMemo(() => {
    const set = new Set<string>()
    for (const p of disponibilidade) {
      const start = p.data_inicio
      const end = p.data_fim || p.data_inicio
      try {
        const d0 = new Date(start + 'T00:00:00')
        const d1 = new Date(end + 'T00:00:00')
        for (let t = d0.getTime(); t <= d1.getTime(); t += 86400000) {
          const d = new Date(t)
          const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
          set.add(iso)
        }
      } catch { /* ignore */ }
    }
    return set
  }, [disponibilidade])
  const today = new Date(); today.setHours(0,0,0,0)
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [selectedIso, setSelectedIso] = useState<string | null>(null)
  const [previewIso, setPreviewIso] = useState<string | null>(null)            // modal de preview do dia
  const [taskDates, setTaskDates] = useState<Array<{ iso: string; text: string; project?: string }>>([])

  // Lê tarefas do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`freelancer_${freelancerId}_tasks`)
      const tasks: any[] = raw ? JSON.parse(raw) : []
      const arr: Array<{ iso: string; text: string; project?: string }> = []
      tasks.forEach(t => {
        if (t?.dueDate && typeof t.dueDate === 'string') {
          const iso = t.dueDate.slice(0, 10)
          if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
            arr.push({ iso, text: t.text || '—', project: t.project })
          }
        }
      })
      setTaskDates(arr)
    } catch { setTaskDates([]) }
  }, [freelancerId])

  // Compila eventos
  const eventos: CalEvento[] = (() => {
    const out: CalEvento[] = []
    // Casamentos
    casamentos.forEach(c => {
      if (c.data_casamento) {
        out.push({ id: `cas-${c.id}`, iso: c.data_casamento.slice(0,10), type: 'casamento', title: c.local, subtitle: 'Casamento' })
      }
      // Prazo seleção (30 dias após evento)
      if (c.data_casamento && !c.url_selecao_enviado_em) {
        try {
          const [y, m, d] = c.data_casamento.slice(0,10).split('-').map(Number)
          const dEvent = new Date(y, m-1, d)
          const dDeadline = new Date(dEvent.getTime() + 30 * 86400000)
          const iso = `${dDeadline.getFullYear()}-${String(dDeadline.getMonth()+1).padStart(2,'0')}-${String(dDeadline.getDate()).padStart(2,'0')}`
          out.push({ id: `psel-${c.id}`, iso, type: 'prazo-selecao', title: c.local, subtitle: 'Prazo Seleção' })
        } catch {}
      }
    })
    // Edições com data_entrega
    edicao.forEach(e => {
      if (e.data_entrega) out.push({ id: `ed-${e.id}`, iso: e.data_entrega.slice(0,10), type: 'edicao', title: e.nome, subtitle: 'Entrega Edição' })
    })
    // Álbuns com data_entrega
    album.forEach(a => {
      if (a.data_entrega) out.push({ id: `alb-${a.id}`, iso: a.data_entrega.slice(0,10), type: 'album', title: a.nome, subtitle: 'Entrega Álbum' })
    })
    // Tarefas do localStorage
    taskDates.forEach((t, i) => {
      out.push({ id: `tk-${i}`, iso: t.iso, type: 'tarefa-pessoal', title: t.text, subtitle: t.project || 'Tarefa pessoal' })
    })
    // Notificações recebidas (data de criação) + extrai PRÉ-WEDDINGS
    notificacoes.forEach(n => {
      // ── Pré-Wedding atribuído ao membro ──
      // O backend insere com tipo='pre_wedding_atribuido' + META JSON
      // contendo { data, hora, local, nomeNoivos, referencia }.
      if (n.tipo === 'pre_wedding_atribuido' && n.mensagem) {
        const m = n.mensagem.match(/^__META__(.+?)__\/META__/)
        if (m) {
          try {
            const meta = JSON.parse(m[1])
            const pwIso = String(meta?.data ?? '').slice(0, 10)
            if (/^\d{4}-\d{2}-\d{2}$/.test(pwIso)) {
              const titulo = meta?.nomeNoivos || meta?.referencia || 'Pré-Wedding'
              const sub = `📷 Pré-Wedding${meta?.hora ? ' · ' + meta.hora : ''}${meta?.local ? ' · ' + meta.local : ''}`
              out.push({
                id: `pw-${n.id}`,
                iso: pwIso,
                type: 'pre-wedding',
                title: String(titulo),
                subtitle: sub,
              })
              return // não duplica abaixo como notificação genérica
            }
          } catch { /* ignore */ }
        }
      }

      if (!n.created_at) return
      const iso = String(n.created_at).slice(0, 10)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return
      out.push({
        id: `notif-${n.id}`,
        iso,
        type: 'notificacao',
        title: n.titulo || 'Notificação',
        subtitle: n.tipo ? `Tipo: ${n.tipo}` : undefined,
      })
    })
    return out
  })()

  // Index por dia
  const byDay = new Map<string, CalEvento[]>()
  eventos.forEach(e => {
    if (!byDay.has(e.iso)) byDay.set(e.iso, [])
    byDay.get(e.iso)!.push(e)
  })

  // Cells do mês
  const firstDay = new Date(view.y, view.m, 1).getDay()
  const lastDate = new Date(view.y, view.m + 1, 0).getDate()
  const prevLastDate = new Date(view.y, view.m, 0).getDate()
  type Cell = { day: number; current: boolean; isToday: boolean; iso?: string; events: CalEvento[] }
  const cells: Cell[] = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevLastDate - i, current: false, isToday: false, events: [] })
  for (let d = 1; d <= lastDate; d++) {
    const iso = `${view.y}-${String(view.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const isToday = view.y === today.getFullYear() && view.m === today.getMonth() && d === today.getDate()
    cells.push({ day: d, current: true, isToday, iso, events: byDay.get(iso) ?? [] })
  }
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - lastDate - firstDay + 1, current: false, isToday: false, events: [] })

  // KPIs
  const kpis = {
    casamentos:    eventos.filter(e => e.type === 'casamento').length,
    tarefas:       eventos.filter(e => e.type === 'tarefa-pessoal' || e.type === 'tarefa-atribuida').length,
    entregas:      eventos.filter(e => e.type === 'edicao' || e.type === 'album').length,
    notificacoes:  eventos.filter(e => e.type === 'notificacao').length,
  }

  // Eventos do dia selecionado
  const todayIsoStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const selIso = selectedIso ?? todayIsoStr
  const selEvents = byDay.get(selIso) ?? []
  const selDate = (() => {
    const [y, m, d] = selIso.split('-').map(Number)
    return new Date(y, m-1, d)
  })()

  // Próximos eventos (futuros, sorted)
  const proximos = eventos
    .filter(e => e.iso >= todayIsoStr)
    .sort((a, b) => a.iso.localeCompare(b.iso))
    .slice(0, 6)

  const typeMeta: Record<CalEvento['type'], { color: string; bg: string; border: string; label: string; icon: string }> = {
    'casamento':         { color: 'text-gold',         bg: 'bg-gold/15',           border: 'border-gold/35',          label: 'Casamento',    icon: '◆' },
    'edicao':            { color: 'text-blue-300',     bg: 'bg-blue-500/15',       border: 'border-blue-500/35',      label: 'Edição',       icon: '✎' },
    'album':             { color: 'text-purple-300',   bg: 'bg-purple-500/15',     border: 'border-purple-500/35',    label: 'Álbum',        icon: '◫' },
    'tarefa-pessoal':    { color: 'text-emerald-300',  bg: 'bg-emerald-500/15',    border: 'border-emerald-500/35',   label: 'Tarefa',       icon: '◷' },
    'tarefa-atribuida':  { color: 'text-violet-300',   bg: 'bg-violet-500/15',     border: 'border-violet-500/35',    label: 'Atribuída',    icon: '✈' },
    'prazo-selecao':     { color: 'text-amber-300',    bg: 'bg-amber-500/15',      border: 'border-amber-500/35',     label: 'Prazo Sel.',   icon: '⏱' },
    'prazo-edicao':      { color: 'text-red-300',      bg: 'bg-red-500/15',        border: 'border-red-500/35',       label: 'Prazo Ed.',    icon: '⏱' },
    'notificacao':       { color: 'text-rose-300',     bg: 'bg-rose-500/15',       border: 'border-rose-500/35',      label: 'Notificação',  icon: '◉' },
    'pre-wedding':       { color: 'text-cyan-300',     bg: 'bg-cyan-500/15',       border: 'border-cyan-500/35',      label: 'Pré-Wedding',  icon: '📷' },
  }

  return (
    <div className="space-y-5">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08]"
        style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5)' }}>
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1600&h=380&fit=crop" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(90deg, rgba(11,11,11,0.96) 0%, rgba(11,11,11,0.86) 40%, rgba(11,11,11,0.5) 70%, rgba(11,11,11,0.15) 100%)' }} />
        <div className="relative z-10 flex items-start justify-between gap-4 px-6 sm:px-8 py-7 sm:py-9 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl border border-gold/30 flex items-center justify-center text-2xl text-gold shrink-0"
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.15), rgba(201,164,92,0.04))', boxShadow: '0 0 22px -4px rgba(201,164,92,0.25)' }}>
              ◉
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Calendário</h1>
              <p className="text-[13px] text-white/55 mt-1 max-w-md">Vista mensal com casamentos, entregas, prazos e tarefas — tudo num só sítio.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button onClick={() => setView({ y: today.getFullYear(), m: today.getMonth() })}
              className="px-4 py-2.5 rounded-xl border border-white/15 text-white/75 hover:text-gold hover:border-gold/40 text-[13px] tracking-wider uppercase font-bold transition-all">
              Hoje
            </button>
            <button onClick={() => setShowIndispForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] tracking-[0.18em] uppercase font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.06))',
                border: '1px solid rgba(239,68,68,0.45)',
                color: '#fca5a5',
                boxShadow: '0 0 18px -4px rgba(239,68,68,0.4)',
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Informar Indisponibilidade
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Casamentos',   value: kpis.casamentos,    accent: 'border-gold/25 bg-gold/[0.04]',           text: 'text-gold',         sub: 'text-gold/60' },
          { label: 'Tarefas',      value: kpis.tarefas,       accent: 'border-emerald-500/25 bg-emerald-500/[0.04]', text: 'text-emerald-300',  sub: 'text-emerald-300/60' },
          { label: 'Entregas',     value: kpis.entregas,      accent: 'border-blue-500/25 bg-blue-500/[0.04]',   text: 'text-blue-300',     sub: 'text-blue-300/60' },
          { label: 'Notificações', value: kpis.notificacoes,  accent: 'border-rose-500/25 bg-rose-500/[0.04]',   text: 'text-rose-300',     sub: 'text-rose-300/60' },
        ].map((k, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${k.accent}`}>
            <p className={`text-[10px] tracking-[0.3em] uppercase mb-1 ${k.sub}`}>{k.label}</p>
            <p className={`text-3xl font-light leading-none tabular-nums ${k.text}`} style={{ fontFamily: 'Georgia, serif' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* GRID 2/3 Calendário + 1/3 Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendário */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.08] p-5"
          style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
          {/* Header navegação */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { const d = new Date(view.y, view.m - 1, 1); setView({ y: d.getFullYear(), m: d.getMonth() }) }}
              className="w-9 h-9 rounded-lg border border-white/15 text-white/55 hover:text-gold hover:border-gold/40 transition-all text-base">‹</button>
            <h2 className="text-2xl font-light text-white tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
              <span className="italic text-gold">{['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][view.m]}</span> {view.y}
            </h2>
            <button onClick={() => { const d = new Date(view.y, view.m + 1, 1); setView({ y: d.getFullYear(), m: d.getMonth() }) }}
              className="w-9 h-9 rounded-lg border border-white/15 text-white/55 hover:text-gold hover:border-gold/40 transition-all text-base">›</button>
          </div>

          {/* Cabeçalhos dos dias */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].map(d => (
              <div key={d} className="text-center text-[10px] tracking-widest uppercase text-white/30 py-1">{d}</div>
            ))}
          </div>

          {/* Células */}
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((c, i) => {
              const selected = c.iso === selIso
              const eventCount = c.events.length
              const isIndisp = !!(c.iso && indispDays.has(c.iso))
              return (
                <button key={i}
                  onClick={() => { if (c.current && c.iso) { setSelectedIso(c.iso); setPreviewIso(c.iso) } }}
                  disabled={!c.current}
                  className={`relative aspect-square sm:min-h-[80px] sm:aspect-auto p-1.5 sm:p-2 rounded-lg border text-left transition-all overflow-hidden ${
                    c.isToday
                      ? 'bg-gold text-black font-bold border-gold'
                      : selected
                        ? 'bg-gold/15 text-gold border-gold/40'
                        : c.current
                          ? eventCount > 0
                            ? 'bg-white/[0.03] border-white/[0.08] text-white/75 hover:border-gold/30 hover:bg-white/[0.06]'
                            : 'bg-white/[0.01] border-white/[0.04] text-white/50 hover:border-white/15'
                          : 'bg-transparent border-transparent text-white/20'
                  }`}
                  style={isIndisp && c.current && !c.isToday ? {
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.05))',
                    borderColor: 'rgba(239,68,68,0.45)',
                    boxShadow: '0 0 12px -4px rgba(239,68,68,0.35)',
                  } : undefined}
                  title={isIndisp ? 'Indisponível' : undefined}>
                  {isIndisp && c.current && (
                    <span className="absolute top-1 right-1 text-[9px] text-red-300 font-bold tracking-widest uppercase">✕</span>
                  )}
                  <p className={`text-[13px] sm:text-[14px] font-semibold leading-none mb-1 ${c.isToday ? 'text-black' : ''}`}>
                    {c.day}
                  </p>
                  {/* Mini-eventos (até 3) */}
                  <div className="hidden sm:flex flex-col gap-0.5 mt-1">
                    {c.events.slice(0, 3).map((e, j) => (
                      <span key={j} className={`text-[8px] px-1 py-px rounded truncate ${
                        c.isToday ? 'bg-black/15 text-black/80' : `${typeMeta[e.type].bg} ${typeMeta[e.type].color}`
                      }`} title={e.title}>
                        {e.title}
                      </span>
                    ))}
                    {eventCount > 3 && (
                      <span className={`text-[8px] ${c.isToday ? 'text-black/60' : 'text-white/40'}`}>+{eventCount - 3}</span>
                    )}
                  </div>
                  {/* Mobile: só pontos */}
                  <div className="sm:hidden flex items-center justify-center gap-0.5 mt-1">
                    {c.events.slice(0, 3).map((e, j) => (
                      <span key={j} className={`w-1 h-1 rounded-full ${typeMeta[e.type].bg.replace('/15', '')}`} />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Legenda */}
          <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-center gap-x-4 gap-y-1.5 flex-wrap text-[10px]">
            {(['casamento','tarefa-pessoal','edicao','album','prazo-selecao','notificacao'] as Array<CalEvento['type']>).map(t => (
              <span key={t} className="flex items-center gap-1.5 text-white/45">
                <span className={`w-2 h-2 rounded-sm border ${typeMeta[t].border} ${typeMeta[t].bg}`} />
                <span className="tracking-wider uppercase">{typeMeta[t].label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Sidebar — eventos do dia + próximos */}
        <aside className="space-y-4">
          {/* Eventos do dia selecionado */}
          <div className="rounded-2xl border border-white/[0.08] p-4"
            style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <p className="text-[11px] tracking-[0.35em] uppercase text-gold/75 font-semibold">Eventos do Dia</p>
                <p className="text-[13px] text-white/85 mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>
                  {selDate.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 tracking-wider uppercase font-bold">
                {selEvents.length}
              </span>
            </div>
            {selEvents.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-3xl opacity-20 block mb-1">∅</span>
                <p className="text-[11px] text-white/30 italic">Sem eventos nesta data.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selEvents.map(e => {
                  const m = typeMeta[e.type]
                  return (
                    <div key={e.id} className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border ${m.border} ${m.bg}/30 hover:${m.bg}/50 transition-all`}>
                      <div className={`w-9 h-9 rounded-lg border ${m.border} ${m.bg} flex items-center justify-center text-base shrink-0 ${m.color}`}>{m.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white truncate">{e.title}</p>
                        <p className={`text-[10px] ${m.color}/75 tracking-wider uppercase mt-0.5`}>{m.label}</p>
                        {e.subtitle && <p className="text-[10px] text-white/40 mt-0.5 truncate italic">{e.subtitle}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Próximos eventos */}
          <div className="rounded-2xl border border-white/[0.08] p-4"
            style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold/75 font-semibold mb-3">Próximos Eventos</p>
            {proximos.length === 0 ? (
              <p className="text-[11px] text-white/30 italic text-center py-6">Sem eventos futuros.</p>
            ) : (
              <div className="space-y-1.5">
                {proximos.map(e => {
                  const m = typeMeta[e.type]
                  const [y, mm, d] = e.iso.split('-').map(Number)
                  const dt = new Date(y, mm-1, d)
                  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
                  const diff = Math.round((dt.getTime() - today.getTime()) / 86400000)
                  const label = diff === 0 ? 'Hoje' : diff === 1 ? 'Amanhã' : `+${diff}d`
                  // Pré-wedding: extrair o id da notificação para permitir delete
                  const isPwEvent = e.type === 'pre-wedding' && e.id.startsWith('pw-')
                  const pwNotifId = isPwEvent ? e.id.slice(3) : null
                  return (
                    <div key={e.id} className="group relative flex items-stretch gap-1.5 rounded-lg border border-white/[0.05] hover:border-gold/25 hover:bg-white/[0.03] transition-all overflow-hidden">
                      <button onClick={() => { setView({ y, m: mm - 1 }); setSelectedIso(e.iso); setPreviewIso(e.iso) }}
                        className="flex-1 min-w-0 flex items-center gap-3 px-2.5 py-2 text-left">
                        <div className="flex flex-col items-center justify-center w-10 shrink-0">
                          <span className={`text-[16px] font-light leading-none ${m.color}`} style={{ fontFamily: 'Georgia, serif' }}>{String(d).padStart(2,'0')}</span>
                          <span className="text-[8px] tracking-widest uppercase text-white/30 mt-0.5">{meses[mm-1]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-white truncate">{e.title}</p>
                          <p className={`text-[10px] ${m.color}/70 tracking-wide`}>{m.icon} {m.label}</p>
                        </div>
                        <span className="text-[9px] text-white/35 tracking-wider uppercase shrink-0">{label}</span>
                      </button>
                      {/* Botão eliminar — só admin, só pré-wedding por agora */}
                      {!viewAsFreelancer && isPwEvent && pwNotifId && (
                        <button onClick={async (ev) => {
                          ev.stopPropagation()
                          const n = notificacoes.find(x => x.id === pwNotifId)
                          if (!n) { alert('Notificação não encontrada.'); return }
                          let referencia: string | null = null
                          let nomes: string | null = null
                          try {
                            const mm2 = (n.mensagem ?? '').match(/^__META__(.+?)__\/META__/)
                            if (mm2) {
                              const meta = JSON.parse(mm2[1])
                              referencia = meta?.referencia ?? null
                              nomes = meta?.nomeNoivos ?? null
                            }
                          } catch { /* ignore */ }
                          if (!referencia) { alert('Não foi possível identificar este Pré-Wedding.'); return }
                          if (!confirm(`Eliminar o Pré-Wedding de ${nomes ?? referencia}?\n\nA notificação e o evento também desaparecem do calendário do membro.`)) return
                          try {
                            const res = await fetch(`/api/calendario-add/pre-wedding?referencia=${encodeURIComponent(referencia)}`, { method: 'DELETE' })
                            if (!res.ok) {
                              const j = await res.json().catch(() => ({}))
                              alert('Falha ao eliminar: ' + (j.error ?? res.status))
                              return
                            }
                            onRefresh?.()
                          } catch (err: any) {
                            alert('Erro: ' + (err?.message ?? 'desconhecido'))
                          }
                        }}
                          title="Eliminar Pré-Wedding"
                          className="shrink-0 w-9 flex items-center justify-center text-white/35 hover:text-red-400 hover:bg-red-500/[0.08] transition-all border-l border-white/[0.05]">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Modal Preview do Dia — abre ao clicar numa célula */}
      {previewIso && (
        <DiaPreviewModal
          iso={previewIso}
          events={byDay.get(previewIso) ?? []}
          typeMeta={typeMeta}
          onClose={() => setPreviewIso(null)}
          allowDelete={!viewAsFreelancer}
          onDeletePreWedding={async (notifId) => {
            // Encontra a notificação para extrair a referência do PW
            const n = notificacoes.find(x => x.id === notifId)
            if (!n) { alert('Notificação não encontrada.'); return }
            const meta = (() => {
              try {
                const m = (n.mensagem ?? '').match(/^__META__(.+?)__\/META__/)
                return m ? JSON.parse(m[1]) : {}
              } catch { return {} }
            })()
            const referencia = meta?.referencia
            if (!referencia) { alert('Não foi possível identificar este Pré-Wedding.'); return }
            const nomes = meta?.nomeNoivos ?? referencia
            if (!confirm(`Eliminar o Pré-Wedding de ${nomes}?\n\nA notificação e o evento também desaparecem do calendário do membro.`)) return
            try {
              const res = await fetch(`/api/calendario-add/pre-wedding?referencia=${encodeURIComponent(referencia)}`, { method: 'DELETE' })
              if (!res.ok) {
                const j = await res.json().catch(() => ({}))
                alert('Falha ao eliminar: ' + (j.error ?? res.status))
                return
              }
              setPreviewIso(null)
              onRefresh?.()
            } catch (err: any) {
              alert('Erro: ' + (err?.message ?? 'desconhecido'))
            }
          }}
        />
      )}

      {/* Lista das indisponibilidades atuais */}
      {disponibilidade.length > 0 && (
        <div className="rounded-2xl border border-red-500/15 p-5"
          style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(11,11,11,0.5))' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] tracking-[0.4em] uppercase font-bold text-red-300/85">
              Períodos Indisponíveis ({disponibilidade.length})
            </p>
            <p className="text-[11px] text-white/35 italic">Visível pelo admin nas atribuições</p>
          </div>
          <div className="space-y-2">
            {disponibilidade.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.04]">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white/85 font-medium">
                    {fmtIsoShort(p.data_inicio)}
                    {p.data_fim && p.data_fim !== p.data_inicio && ` → ${fmtIsoShort(p.data_fim)}`}
                  </p>
                  {p.motivo && (
                    <p className="text-[11px] text-white/55 italic mt-0.5">{p.motivo}</p>
                  )}
                </div>
                <button onClick={() => handleDeleteIndisp(p.id)} disabled={deletingIndisp === p.id}
                  className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-md border border-white/10 text-white/45 hover:text-red-300 hover:border-red-500/40 transition-all disabled:opacity-50">
                  {deletingIndisp === p.id ? '...' : 'Remover'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal — Informar Indisponibilidade */}
      {showIndispForm && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowIndispForm(false)}>
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <div className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden border shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, #1a0808, #0b0505)',
              borderColor: 'rgba(239,68,68,0.4)',
              boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7), 0 0 24px -4px rgba(239,68,68,0.3)',
            }}
            onClick={e => e.stopPropagation()}>
            <div className="h-1 w-full" style={{ background: '#ef4444' }} />

            <div className="px-7 pt-6 pb-4 border-b border-white/[0.05] flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.45)', color: '#fca5a5' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </span>
                <div>
                  <p className="text-[10px] tracking-[0.5em] uppercase font-bold text-red-300/85">Indisponibilidade</p>
                  <h2 className="text-xl font-light tracking-[0.1em] text-white uppercase mt-1" style={{ fontFamily: 'Georgia, serif' }}>
                    Informar período
                  </h2>
                </div>
              </div>
              <button onClick={() => setShowIndispForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all">
                ✕
              </button>
            </div>

            <div className="px-7 py-5 space-y-4">
              <p className="text-[12px] text-white/55 italic leading-relaxed">
                Marca os dias em que <strong className="text-white/85">não estás disponível</strong>. O admin verá um aviso ao tentar atribuir-te a casamentos ou sessões de pré-wedding nessas datas.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[9px] tracking-[0.3em] uppercase text-white/45 block mb-1.5">Início</span>
                  <input type="date" value={indispForm.data_inicio} onChange={e => setIndispForm(f => ({ ...f, data_inicio: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 focus:border-red-500/40 rounded-lg px-3 py-2.5 text-[13px] text-white outline-none [color-scheme:dark] transition-colors" />
                </label>
                <label className="block">
                  <span className="text-[9px] tracking-[0.3em] uppercase text-white/45 block mb-1.5">Fim <span className="opacity-50 normal-case tracking-wide">(opcional)</span></span>
                  <input type="date" value={indispForm.data_fim} onChange={e => setIndispForm(f => ({ ...f, data_fim: e.target.value }))} min={indispForm.data_inicio || undefined}
                    className="w-full bg-black/30 border border-white/10 focus:border-red-500/40 rounded-lg px-3 py-2.5 text-[13px] text-white outline-none [color-scheme:dark] transition-colors" />
                </label>
              </div>

              <label className="block">
                <span className="text-[9px] tracking-[0.3em] uppercase text-white/45 block mb-1.5">Motivo <span className="opacity-50 normal-case tracking-wide">(opcional)</span></span>
                <textarea value={indispForm.motivo} onChange={e => setIndispForm(f => ({ ...f, motivo: e.target.value }))} rows={3}
                  placeholder="Ex: férias, evento próprio, viagem..."
                  className="w-full bg-black/30 border border-white/10 focus:border-red-500/40 rounded-lg px-3 py-2.5 text-[13px] text-white outline-none placeholder:text-white/20 resize-none leading-relaxed transition-colors" />
              </label>
            </div>

            <div className="px-7 py-3 border-t border-white/[0.05] flex items-center justify-end gap-2 bg-black/30">
              <button onClick={() => setShowIndispForm(false)}
                className="text-[10px] tracking-widest uppercase text-white/45 hover:text-white transition-colors px-3 py-1.5">
                Cancelar
              </button>
              <button onClick={handleSaveIndisp} disabled={savingIndisp || !indispForm.data_inicio}
                className="text-[10px] tracking-[0.3em] uppercase font-bold px-4 py-1.5 rounded-md transition-all disabled:opacity-50"
                style={{ background: '#ef4444', color: '#1a0808', boxShadow: '0 0 14px -3px rgba(239,68,68,0.6)' }}>
                {savingIndisp ? 'A guardar…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function fmtIsoShort(iso: string | null) {
  if (!iso) return '—'
  try {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return iso }
}

// ── Modal Preview de Dia — mostra todos os eventos de uma data ────────
function DiaPreviewModal({ iso, events, typeMeta, onClose, onDeletePreWedding, allowDelete }: {
  iso: string
  events: CalEvento[]
  typeMeta: Record<string, { color: string; bg: string; border: string; label: string; icon: string }>
  onClose: () => void
  onDeletePreWedding?: (notifId: string) => void
  allowDelete?: boolean
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!mounted || typeof document === 'undefined') return null

  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = Math.round((dt.getTime() - today.getTime()) / 86400000)
  const diffLabel = diff === 0 ? 'Hoje' : diff === 1 ? 'Amanhã' : diff === -1 ? 'Ontem' : diff > 0 ? `Em ${diff} dias` : `Há ${Math.abs(diff)} dias`
  const weekday = dt.toLocaleDateString('pt-PT', { weekday: 'long' })
  const dateLong = dt.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })

  // Agrupar por tipo
  const byType = new Map<string, CalEvento[]>()
  events.forEach(e => {
    if (!byType.has(e.type)) byType.set(e.type, [])
    byType.get(e.type)!.push(e)
  })
  const typeOrder: CalEvento['type'][] = ['casamento', 'prazo-selecao', 'prazo-edicao', 'edicao', 'album', 'tarefa-atribuida', 'tarefa-pessoal', 'notificacao']

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-xl rounded-3xl overflow-hidden border border-gold/25 shadow-2xl flex flex-col"
        style={{ background: 'linear-gradient(180deg, #100c08, #0a0805)', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}>
        <div className="h-0.5 w-full bg-gold/70" />
        <div className="px-6 pt-5 pb-4 border-b border-white/[0.05] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.5em] text-gold/75 uppercase mb-1">Preview do Dia</p>
            <h2 className="text-2xl font-light text-white tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
              <span className="capitalize italic text-gold">{weekday}</span>
              <span className="text-white/40"> · </span>
              <span>{dateLong}</span>
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-md border tracking-widest uppercase font-bold ${
                diff === 0 ? 'bg-gold text-black border-gold' : diff < 0 ? 'bg-white/[0.06] text-white/50 border-white/15' : 'bg-gold/15 text-gold border-gold/35'
              }`}>{diffLabel}</span>
              <span className="text-[11px] text-white/40">
                {events.length} {events.length === 1 ? 'evento' : 'eventos'}
              </span>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all shrink-0">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {events.length === 0 ? (
            <div className="py-12 text-center">
              <span className="text-5xl opacity-15 block mb-3">∅</span>
              <p className="text-[14px] text-white/45 italic">Nada agendado para este dia.</p>
              <p className="text-[12px] text-white/25 mt-2">Aproveita para descansar ou avançar com tarefas pendentes.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {typeOrder.filter(t => byType.has(t)).map(t => {
                const m = typeMeta[t]
                const arr = byType.get(t)!
                return (
                  <div key={t}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[13px] ${m.border} ${m.bg} ${m.color}`}>{m.icon}</span>
                      <p className={`text-[11px] tracking-[0.35em] uppercase font-bold ${m.color}`}>{m.label}</p>
                      <span className="text-[10px] text-white/30">·</span>
                      <span className="text-[10px] text-white/35">{arr.length}</span>
                    </div>
                    <div className="space-y-2">
                      {arr.map(e => {
                        // Pré-wedding: extrair o id da notificação para permitir delete
                        const isPwEvent = e.type === 'pre-wedding' && e.id.startsWith('pw-')
                        const pwNotifId = isPwEvent ? e.id.slice(3) : null
                        return (
                          <div key={e.id} className={`flex items-start gap-3 px-3.5 py-3 rounded-xl border ${m.border} hover:${m.bg} transition-all`}
                            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.015), transparent)' }}>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] text-white font-medium leading-tight">{e.title}</p>
                              {e.subtitle && (
                                <p className="text-[11px] text-white/45 italic mt-1">{e.subtitle}</p>
                              )}
                            </div>
                            {/* Botão eliminar — apenas admin, apenas Pré-Wedding por agora */}
                            {allowDelete && isPwEvent && pwNotifId && onDeletePreWedding && (
                              <button onClick={(ev) => { ev.stopPropagation(); onDeletePreWedding(pwNotifId) }}
                                title="Eliminar este Pré-Wedding (também remove do calendário do membro)"
                                className="shrink-0 w-8 h-8 rounded-lg border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/[0.06] transition-all flex items-center justify-center">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-white/[0.05] flex items-center justify-end bg-black/30">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-[11px] tracking-wider uppercase text-white/55 hover:text-white border border-white/10 hover:border-white/30 transition-all">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

// ─── Dados Pessoais Tab ──────────────────────────────────────────────────────
// Página completa de perfil — usa Supabase + localStorage para campos extendidos.

type DadosPessoaisExt = {
  username?: string
  dataNascimento?: string
  localizacao?: string
  fusoHorario?: string
  idioma?: string
  sobreMim?: string
  experiencia?: string         // ex: '6+ anos'
  projetosRealizados?: string  // ex: '150+'
  estilo?: string              // ex: 'Cinemático, Emocional, Autêntico'
  skills?: Array<{ label: string; value: number }>
  prefDias?: string
  prefHorario?: string
  prefComunicacao?: string
  prefNotificacoes?: string
  prefDisponibilidade?: string
  payMetodo?: string
  payIban?: string
  payTitular?: string
  payNif?: string
  payMoeda?: string
}

const DEFAULT_DP_EXT: DadosPessoaisExt = {
  username: 'editorpro',
  dataNascimento: '',
  localizacao: 'Setúbal, Portugal',
  fusoHorario: '🇵🇹 (GMT+01:00) Lisboa',
  idioma: '🇵🇹 Português (Portugal)',
  sobreMim: '',
  experiencia: '6+ anos',
  projetosRealizados: '150+',
  estilo: 'Cinemático, Emocional, Autêntico',
  skills: [
    { label: 'Edição de Vídeo',  value: 95 },
    { label: 'Color Grading',    value: 90 },
    { label: 'Motion Graphics',  value: 75 },
    { label: 'Sound Design',     value: 70 },
    { label: 'Direção Criativa', value: 85 },
  ],
  prefDias: 'Segunda a Sábado',
  prefHorario: '09:00 - 18:00',
  prefComunicacao: 'Email, WhatsApp, Slack',
  prefNotificacoes: 'Ativas',
  prefDisponibilidade: 'Disponível para novos projetos',
  payMetodo: 'Transferência Bancária',
  payIban: '',
  payTitular: '',
  payNif: '',
  payMoeda: 'EUR (€)',
}

function DadosPessoaisTab(props: {
  freelancerId: string
  freelancer: Freelancer | null
  casamentos: Casamento[]
  edicao: Edicao[]
  album: Album[]
  notificacoes: Notificacao[]
  editForm: any
  setEditForm: (v: any) => void
  editSaving: boolean
  handleEditSave: () => Promise<void> | void
  uploadingPhoto: boolean
  handlePhotoUpload: (f: File) => void
  load: () => Promise<void> | void
  introHome: string
  introHomeTitle: string
  introHomeStatus: 'idle'|'saving'|'saved'
  handleIntroHomeChange: (v: string) => void
  handleIntroHomeTitleChange: (v: string) => void
  guia: string
  guiaStatus: 'idle'|'saving'|'saved'
  handleGuiaChange: (v: string) => void
}) {
  const { freelancerId, freelancer, casamentos, edicao, album, editForm, setEditForm, editSaving, handleEditSave, uploadingPhoto, handlePhotoUpload, load } = props
  if (!freelancer) return null

  const editingThis = editForm !== null
  const KEY_EXT = `freelancer_${freelancerId}_profile_ext`
  const [ext, setExt] = useState<DadosPessoaisExt>(DEFAULT_DP_EXT)
  const [loaded, setLoaded] = useState(false)
  const [editingSection, setEditingSection] = useState<null | 'sobre' | 'skills' | 'pref' | 'pay'>(null)

  // Load extended profile
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY_EXT)
      if (raw) setExt({ ...DEFAULT_DP_EXT, ...JSON.parse(raw) })
    } catch {}
    setLoaded(true)
  }, [KEY_EXT])
  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(KEY_EXT, JSON.stringify(ext)) } catch {}
  }, [ext, KEY_EXT, loaded])

  function updateExt(patch: Partial<DadosPessoaisExt>) { setExt(prev => ({ ...prev, ...patch })) }

  // Stats
  const projetosEmEdicao = edicao.filter(e => e.status !== 'CONCLUÍDO').length
  const tarefasConcluidasLocal = (() => {
    try {
      const raw = localStorage.getItem(`freelancer_${freelancerId}_tasks`)
      const arr: any[] = raw ? JSON.parse(raw) : []
      return arr.filter(t => t.done || t.status === 'Concluída').length
    } catch { return 0 }
  })()
  const projetosFinalizados = edicao.filter(e => e.status === 'CONCLUÍDO').length + album.filter(a => a.status === 'ENTREGUE').length
  const totalEntregues = edicao.filter(e => e.status === 'CONCLUÍDO').length
  const avaliacaoMedia = totalEntregues > 0 ? '5.0/5' : '—'

  // Member since (created_at do freelancer não temos, usa fallback)
  const memberSince = '12/02/2024'

  return (
    <div className="space-y-5">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08]"
        style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)' }}>
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1600&h=240&fit=crop"
            alt="" className="w-full h-full object-cover" style={{ filter: 'blur(2px)' }} />
        </div>
        <div className="absolute inset-0 z-[1]"
          style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.85) 35%, rgba(10,10,10,0.45) 70%, rgba(10,10,10,0.05) 100%)' }} />
        <div className="relative z-10 flex items-center justify-between gap-6 px-6 sm:px-10 py-6 sm:py-7 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl border border-purple-500/45 flex items-center justify-center text-2xl text-purple-300 shrink-0"
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(168,85,247,0.18), rgba(168,85,247,0.04))', boxShadow: '0 0 22px -4px rgba(168,85,247,0.35)' }}>👤</div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Dados Pessoais</h1>
              <p className="text-[12px] text-white/50 mt-0.5 leading-relaxed max-w-md">Gerencie suas informações pessoais, preferências e configurações da conta.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!editingThis ? (
              <button onClick={() => setEditForm({ nome: freelancer.nome, status: freelancer.status ?? '', contato: freelancer.contato ?? '', email: freelancer.email ?? '', nome_sos: freelancer.nome_sos ?? '', contato_sos: freelancer.contato_sos ?? '' })}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-black text-[12px] font-bold tracking-wider hover:bg-gold/90 transition-all"
                style={{ boxShadow: '0 0 18px -4px rgba(201,164,92,0.5)' }}>
                ✎ Editar Perfil
              </button>
            ) : (
              <>
                <button onClick={() => setEditForm(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-white/65 text-[12px] font-bold tracking-wider hover:text-white hover:border-white/30 transition-all">
                  Cancelar
                </button>
                <button onClick={handleEditSave} disabled={editSaving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-black text-[12px] font-bold tracking-wider hover:bg-emerald-400 disabled:opacity-50 transition-all">
                  {editSaving ? 'A guardar...' : '✓ Guardar'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ROW 1: 3 colunas (Perfil | Informações Conta | Resumo Atividade) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile Card */}
        <Card>
          <div className="flex items-start gap-4 mb-4">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full border-2 border-gold/40 overflow-hidden"
                style={{ boxShadow: '0 0 22px -4px rgba(201,164,92,0.4)' }}>
                {freelancer.foto_url ? (
                  <img src={freelancer.foto_url} alt={freelancer.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center text-gold text-2xl font-bold">
                    {(freelancer.nome ?? '?').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <label className={`absolute -bottom-1 -right-1 cursor-pointer w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 border-[#0e0b07] ${
                uploadingPhoto ? 'bg-white/20 text-white/50' : 'bg-gold text-black hover:bg-gold/90'
              }`} style={{ boxShadow: '0 0 12px rgba(201,164,92,0.5)' }} title="Alterar foto">
                {uploadingPhoto ? '...' : '📷'}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingPhoto}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }} />
              </label>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h2 className="text-xl font-bold text-white uppercase tracking-wide">{freelancer.nome}</h2>
                <span className="text-[9px] px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold uppercase tracking-widest font-bold">Freelancer</span>
              </div>
              <p className="text-[12px] text-white/55 mb-3">{freelancer.status || 'Freelancer'}</p>
              <div className="space-y-1.5 text-[12px]">
                {freelancer.email && (
                  <p className="flex items-center gap-2 text-white/80">
                    <span className="text-gold/70 w-4 text-center text-[11px]">✉</span>
                    <span className="truncate">{freelancer.email}</span>
                  </p>
                )}
                {freelancer.contato && (
                  <p className="flex items-center gap-2 text-white/80">
                    <span className="text-gold/70 w-4 text-center text-[11px]">✆</span>
                    <span>{freelancer.contato}</span>
                  </p>
                )}
                {ext.localizacao && (
                  <p className="flex items-center gap-2 text-white/80">
                    <span className="text-gold/70 w-4 text-center text-[11px]">◉</span>
                    <span>{ext.localizacao}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Palavra-chave / Senha (admin) — reveal + copy rápido */}
          <div className="pt-3 border-t border-white/[0.05] flex items-center gap-2 flex-wrap">
            <span className="text-gold/70 text-[11px] tracking-[0.3em] uppercase">🔑 Palavra-chave ou Senha</span>
            <PalavraChaveCell password={freelancer.password} />
          </div>

          <div className="pt-3 border-t border-white/[0.05] flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-300 border-emerald-500/30 tracking-widest uppercase font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
              Conta Ativa
            </span>
            <p className="text-[11px] text-white/45">Membro desde: <span className="text-white/75 font-medium">{memberSince}</span></p>
          </div>
        </Card>

        {/* Informações da Conta */}
        <Card title="Informações da Conta">
          <div className="space-y-3.5">
            <Row label="Nome Completo" value={editingThis && editForm ? <InpRight value={editForm.nome ?? ''} onChange={v => setEditForm({ ...editForm, nome: v })} /> : freelancer.nome} />
            <Row label="Nome de Usuário" value={editingSection === 'pref' ? <InpRight value={ext.username ?? ''} onChange={v => updateExt({ username: v })} /> : (ext.username ?? '—')} />
            <Row label="Email" value={editingThis && editForm ? <InpRight type="email" value={editForm.email ?? ''} onChange={v => setEditForm({ ...editForm, email: v })} /> : (freelancer.email || '—')} />
            <Row label="Telefone" value={editingThis && editForm ? <InpRight type="tel" value={editForm.contato ?? ''} onChange={v => setEditForm({ ...editForm, contato: v })} /> : (freelancer.contato || '—')} />
            <Row label="Palavra-chave ou Senha" value={<PalavraChaveCell password={freelancer.password} />} />
            <Row label="Data de Nascimento" value={editingSection === 'pref' ? <InpRight type="date" value={ext.dataNascimento ?? ''} onChange={v => updateExt({ dataNascimento: v })} /> : (ext.dataNascimento ? new Date(ext.dataNascimento).toLocaleDateString('pt-PT') : '—')} />
            <Row label="Localização" value={editingSection === 'pref' ? <InpRight value={ext.localizacao ?? ''} onChange={v => updateExt({ localizacao: v })} /> : (ext.localizacao ?? '—')} />
            <Row label="Fuso Horário" value={ext.fusoHorario ?? '—'} />
            <Row label="Idioma" value={ext.idioma ?? '—'} last />
          </div>
        </Card>

        {/* Resumo da Atividade */}
        <Card title="Resumo da Atividade">
          <div className="space-y-3">
            <ActRow icon="◫" label="Projetos em Edição" value={projetosEmEdicao} color="purple" />
            <ActRow icon="✓" label="Tarefas Concluídas" value={tarefasConcluidasLocal} color="emerald" />
            <ActRow icon="◆" label="Projetos Finalizados" value={projetosFinalizados} color="amber" />
            <ActRow icon="★" label="Avaliação Média" value={avaliacaoMedia} color="gold" />
          </div>
        </Card>
      </div>

      {/* ROW 2: Sobre Mim (wide) + Especialidades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sobre Mim */}
        <Card title="Sobre Mim" className="lg:col-span-2" rightAction={
          <EditarChip active={editingSection === 'sobre'} onClick={() => setEditingSection(editingSection === 'sobre' ? null : 'sobre')} />
        }>
          {editingSection === 'sobre' ? (
            <textarea value={ext.sobreMim ?? ''} onChange={e => updateExt({ sobreMim: e.target.value })} rows={3}
              placeholder="Escreve sobre ti — experiência, paixão, abordagem..."
              className="w-full bg-black/30 border border-gold/30 rounded-lg px-3 py-2 text-[13px] text-white/85 focus:outline-none focus:border-gold/60 resize-none leading-relaxed mb-4" />
          ) : (
            <p className="text-[13px] text-white/65 leading-relaxed mb-4">
              {ext.sobreMim || 'Adiciona uma descrição sobre o teu trabalho, experiência e estilo. Clica em Editar para começar.'}
            </p>
          )}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.05]">
            <ExpStatCol label="EXPERIÊNCIA" value={ext.experiencia ?? '—'} editing={editingSection === 'sobre'} onChange={v => updateExt({ experiencia: v })} />
            <ExpStatCol label="PROJETOS REALIZADOS" value={ext.projetosRealizados ?? '—'} editing={editingSection === 'sobre'} onChange={v => updateExt({ projetosRealizados: v })} />
            <ExpStatCol label="ESTILO" value={ext.estilo ?? '—'} editing={editingSection === 'sobre'} onChange={v => updateExt({ estilo: v })} />
          </div>
        </Card>

        {/* Especialidades */}
        <Card title="Especialidades" rightAction={
          <EditarChip active={editingSection === 'skills'} onClick={() => setEditingSection(editingSection === 'skills' ? null : 'skills')} />
        }>
          <div className="space-y-3">
            {(ext.skills ?? []).map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  {editingSection === 'skills' ? (
                    <input value={s.label} onChange={e => { const ns = [...(ext.skills ?? [])]; ns[i] = { ...ns[i], label: e.target.value }; updateExt({ skills: ns }) }}
                      className="text-[12px] text-white bg-black/30 border border-gold/30 rounded px-2 py-0.5 focus:outline-none focus:border-gold/60 flex-1" />
                  ) : (
                    <span className="text-[12px] text-white/85">{s.label}</span>
                  )}
                  {editingSection === 'skills' ? (
                    <input type="number" min={0} max={100} value={s.value} onChange={e => { const ns = [...(ext.skills ?? [])]; ns[i] = { ...ns[i], value: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }; updateExt({ skills: ns }) }}
                      className="text-[12px] text-gold bg-black/30 border border-gold/30 rounded px-1.5 py-0.5 focus:outline-none focus:border-gold/60 w-14 text-right ml-2" />
                  ) : (
                    <span className="text-[12px] text-gold font-bold tabular-nums">{s.value}%</span>
                  )}
                </div>
                <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gold/60 to-gold transition-all duration-500"
                    style={{ width: `${s.value}%`, boxShadow: '0 0 8px rgba(201,164,92,0.4)' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ROW 3: Preferências de Trabalho · Informações de Pagamento · Segurança */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Preferências */}
        <Card title="Preferências de Trabalho" rightAction={
          <EditarChip active={editingSection === 'pref'} onClick={() => setEditingSection(editingSection === 'pref' ? null : 'pref')} />
        }>
          <div className="space-y-3">
            <Row label="Função" value={editingThis && editForm ? (
              <select value={editForm.status ?? ''} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                className="text-[12px] text-gold bg-black/30 border border-gold/30 rounded px-2 py-0.5 focus:outline-none focus:border-gold/60 [color-scheme:dark]">
                {['FOTOGRAFO','VIDEOGRAFO','ASSISTENTE','EDITORES','OUTRO'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : <span className="text-gold font-medium">{freelancer.status || 'Fotógrafo'}</span>} />
            <Row label="Dias de Trabalho" value={editingSection === 'pref' ? <InpRight value={ext.prefDias ?? ''} onChange={v => updateExt({ prefDias: v })} /> : (ext.prefDias ?? '—')} />
            <Row label="Horário Preferencial" value={editingSection === 'pref' ? <InpRight value={ext.prefHorario ?? ''} onChange={v => updateExt({ prefHorario: v })} /> : (ext.prefHorario ?? '—')} />
            <Row label="Comunicação" value={editingSection === 'pref' ? <InpRight value={ext.prefComunicacao ?? ''} onChange={v => updateExt({ prefComunicacao: v })} /> : (ext.prefComunicacao ?? '—')} />
            <Row label="Notificações" value={editingSection === 'pref' ? <InpRight value={ext.prefNotificacoes ?? ''} onChange={v => updateExt({ prefNotificacoes: v })} /> : (ext.prefNotificacoes ?? '—')} />
            <Row label="Disponibilidade" value={
              <span className="inline-flex items-center gap-1.5 text-emerald-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
                {ext.prefDisponibilidade ?? '—'}
              </span>
            } last />
          </div>
        </Card>

        {/* Pagamento */}
        <Card title="Informações de Pagamento" rightAction={
          <EditarChip active={editingSection === 'pay'} onClick={() => setEditingSection(editingSection === 'pay' ? null : 'pay')} />
        }>
          <div className="space-y-3">
            <Row label="Método de Pagamento" value={editingSection === 'pay' ? <InpRight value={ext.payMetodo ?? ''} onChange={v => updateExt({ payMetodo: v })} /> : (ext.payMetodo ?? '—')} />
            <Row label="IBAN" value={editingSection === 'pay' ? <InpRight value={ext.payIban ?? ''} onChange={v => updateExt({ payIban: v })} /> : (ext.payIban || '—')} mono />
            <Row label="Titular da Conta" value={editingSection === 'pay' ? <InpRight value={ext.payTitular ?? ''} onChange={v => updateExt({ payTitular: v })} /> : (ext.payTitular || '—')} />
            <Row label="NIF" value={editingSection === 'pay' ? <InpRight value={ext.payNif ?? ''} onChange={v => updateExt({ payNif: v })} /> : (ext.payNif || '—')} mono />
            <Row label="Moeda" value={editingSection === 'pay' ? <InpRight value={ext.payMoeda ?? ''} onChange={v => updateExt({ payMoeda: v })} /> : (ext.payMoeda ?? '—')} last />
          </div>
        </Card>

        {/* Segurança */}
        <Card title="Segurança da Conta">
          <div className="space-y-3">
            <SecRow icon="🔒" label="Senha" value={<span className="font-mono text-white/85">•••••••••</span>}
              action={<button onClick={() => alert('Para alterar a senha contacta o admin.')} className="text-[10px] px-2 py-0.5 rounded border border-white/15 text-white/60 hover:text-gold hover:border-gold/40 transition-all tracking-widest uppercase font-bold">Alterar</button>} />
            <SecRow icon="🛡" label="Autenticação 2FA" value={<span className="text-emerald-300 font-medium">Ativada</span>} />
            <SecRow icon="◉" label="Sessões Ativas" value={<span className="text-white/85">2 dispositivos</span>}
              action={<button className="w-6 h-6 rounded text-white/40 hover:text-gold transition-colors">→</button>} />
            <SecRow icon="⌚" label="Último Acesso" value={<span className="text-white/85 text-[11px]">{new Date().toLocaleDateString('pt-PT')} às {new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>} last />
          </div>
          <button className="w-full mt-4 py-2.5 rounded-xl text-[10px] tracking-[0.35em] uppercase font-bold border border-red-500/35 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-400/55 transition-all">
            Encerrar Todas as Sessões
          </button>
        </Card>
      </div>
    </div>
  )
}

// Helpers — visual primitives for DadosPessoaisTab
function Card({ title, rightAction, children, className }: { title?: string; rightAction?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.08] p-5 ${className ?? ''}`}
      style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
      {(title || rightAction) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-[15px] font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>}
          {rightAction}
        </div>
      )}
      {children}
    </div>
  )
}
function Row({ label, value, last, mono }: { label: string; value: React.ReactNode; last?: boolean; mono?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${last ? '' : 'pb-3 border-b border-white/[0.04]'}`}>
      <span className="text-[11px] text-white/40 shrink-0">{label}</span>
      <span className={`text-[12px] text-white/85 text-right truncate ${mono ? 'font-mono' : 'font-medium'}`}>{value}</span>
    </div>
  )
}
function InpRight({ value, onChange, type = 'text' }: { value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      className="text-right text-[12px] text-white bg-black/30 border border-gold/30 rounded px-2 py-0.5 focus:outline-none focus:border-gold/60 max-w-[180px]" />
  )
}
function ActRow({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: 'purple'|'emerald'|'amber'|'gold' }) {
  const colorMap = {
    purple: { bg: 'bg-purple-500/15 border-purple-500/30 text-purple-300', val: 'text-white' },
    emerald: { bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300', val: 'text-white' },
    amber: { bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300', val: 'text-white' },
    gold: { bg: 'bg-gold/15 border-gold/35 text-gold', val: 'text-gold' },
  }[color]
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-9 h-9 rounded-lg border flex items-center justify-center text-base shrink-0 ${colorMap.bg}`}>{icon}</span>
        <span className="text-[13px] text-white/85 truncate">{label}</span>
      </div>
      <span className={`text-[15px] font-bold tabular-nums ${colorMap.val}`}>{value}</span>
    </div>
  )
}
function EditarChip({ active, onClick }: { active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`text-[10px] tracking-widest uppercase font-bold px-2.5 py-1 rounded-md border transition-all ${
        active
          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          : 'bg-gold/10 border-gold/30 text-gold hover:bg-gold/20 hover:border-gold/50'
      }`}>
      ✎ {active ? 'Concluir' : 'Editar'}
    </button>
  )
}
function ExpStatCol({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">{label}</p>
      {editing ? (
        <input value={value === '—' ? '' : value} onChange={e => onChange(e.target.value)}
          className="w-full text-[13px] text-white bg-black/30 border border-gold/30 rounded px-2 py-1 focus:outline-none focus:border-gold/60" />
      ) : (
        <p className="text-[13px] text-white/90 font-semibold">{value}</p>
      )}
    </div>
  )
}
function SecRow({ icon, label, value, action, last }: { icon: string; label: string; value: React.ReactNode; action?: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${last ? '' : 'pb-3 border-b border-white/[0.04]'}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center text-[12px] shrink-0">{icon}</span>
        <span className="text-[12px] text-white/85">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {value}
        {action}
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

function PagamentosAdminTab({ freelancerId, pagamentos: pagamentosRaw, casamentos, onRefresh }: { freelancerId: string; pagamentos: Pagamento[]; casamentos: Casamento[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState<PagaFormValues>({ casamento_id: '', descricao: '', valor: '', data_prevista: '', data_pago: '', status: 'PENDENTE', notas: '' })
  const [saving, setSaving]   = useState(false)
  const [editId, setEditId]   = useState<string | null>(null)
  const [editForm, setEditForm] = useState<PagaFormValues | null>(null)
  const [filter, setFilter] = useState<'Todos'|'Recebidos'|'A receber'|'Atrasados'|'Cancelados'>('Todos')

  function fmtEuro(v: number) { return `${v.toFixed(2).replace('.', ',')} €` }

  // ── Regra do utilizador: 'se não tem eventos, não houve pagamento'.
  //    Filtra pagamentos órfãos (sem casamento_id) ou cujo casamento_id
  //    já não existe na lista atual de casamentos atribuídos.
  const casamentoIds = useMemo(() => new Set(casamentos.map(c => c.id)), [casamentos])
  const pagamentos = useMemo(
    () => pagamentosRaw.filter(p => !!p.casamento_id && casamentoIds.has(p.casamento_id)),
    [pagamentosRaw, casamentoIds]
  )

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0,0,0,0)
  const year = today.getFullYear()
  const month = today.getMonth()
  const totalPago = pagamentos.filter(p => p.status === 'PAGO').reduce((s, p) => s + (p.valor ?? 0), 0)
  const aReceber  = pagamentos.filter(p => p.status === 'PENDENTE').reduce((s, p) => s + (p.valor ?? 0), 0)
  const recebidoMes = pagamentos.filter(p => {
    if (p.status !== 'PAGO' || !p.data_pago) return false
    const d = new Date(p.data_pago)
    return d.getFullYear() === year && d.getMonth() === month
  }).reduce((s, p) => s + (p.valor ?? 0), 0)
  const atrasados = pagamentos.filter(p => {
    if (p.status === 'PAGO' || p.status === 'CANCELADO') return false
    if (!p.data_prevista) return false
    return new Date(p.data_prevista) < today
  })
  const atrasadosTotal = atrasados.reduce((s, p) => s + (p.valor ?? 0), 0)
  const totalAnual = pagamentos.filter(p => {
    if (p.status !== 'PAGO' || !p.data_pago) return false
    return new Date(p.data_pago).getFullYear() === year
  }).reduce((s, p) => s + (p.valor ?? 0), 0)
  const isAtrasado = (p: Pagamento) => atrasados.some(a => a.id === p.id)

  // ── Rows: cada casamento → 1 linha (com/sem pagamento associado) ─────────
  type PagaRow = { key: string; casamento: Casamento | null; pagamento: Pagamento | null }
  const rows: PagaRow[] = (() => {
    const out: PagaRow[] = []
    const linkedIds = new Set<string>()
    // Ordena casamentos por data_casamento DESC
    const orderedCasamentos = [...casamentos].sort((a, b) => (b.data_casamento ?? '').localeCompare(a.data_casamento ?? ''))
    for (const c of orderedCasamentos) {
      const linked = pagamentos.filter(p => p.casamento_id === c.id)
      if (linked.length === 0) {
        out.push({ key: `c-${c.id}`, casamento: c, pagamento: null })
      } else {
        for (const p of linked) {
          out.push({ key: `p-${p.id}`, casamento: c, pagamento: p })
          linkedIds.add(p.id)
        }
      }
    }
    // Pagamentos sem casamento_id
    for (const p of pagamentos) {
      if (!linkedIds.has(p.id) && !p.casamento_id) {
        out.push({ key: `p-${p.id}`, casamento: null, pagamento: p })
      }
    }
    return out
  })()

  // ── Filter (aplicado sobre rows) ─────────────────────────────────────────
  const filtered = rows.filter(r => {
    const p = r.pagamento
    if (filter === 'Todos') return true
    if (filter === 'Recebidos') return p?.status === 'PAGO'
    if (filter === 'A receber') return !p || (p.status === 'PENDENTE' && !isAtrasado(p))
    if (filter === 'Atrasados') return p ? isAtrasado(p) : false
    if (filter === 'Cancelados') return p?.status === 'CANCELADO'
    return true
  })

  // ── Workflow status por casamento (NOVO / EM EDIÇÃO / REVISÃO / FINALIZADO)
  function workflowBadge(c: Casamento | null): { label: string; cls: string } | null {
    if (!c) return null
    const statuses = [c.status_selecao, c.status_provas, c.status_editadas, c.status_album].filter(Boolean) as string[]
    if (statuses.length === 0) return { label: 'NOVO', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30' }
    const allFinal = statuses.every(s => s === 'ENTREGUE' || s === 'GALERIA PUBLICADA' || s === 'CONCLUIDO')
    if (allFinal) return { label: 'FINALIZADO', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
    if (statuses.some(s => s === 'EM EDIÇÃO' || s === 'EM SELEÇÃO')) return { label: 'EM EDIÇÃO', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' }
    if (statuses.some(s => s === 'SELECIONADAS' || s === 'EDITADAS' || s === 'GALERIA PUBLICADA')) return { label: 'REVISÃO', cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30' }
    return { label: 'NOVO', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30' }
  }

  // ── Extrair método de pagamento das notas (MBWay / Transferência / Numerário)
  function paymentMethod(p: Pagamento | null): string {
    if (!p?.notas) return p?.status === 'PAGO' ? 'MBWay' : ''
    const n = p.notas.toLowerCase()
    if (n.includes('mbway')) return 'MBWay'
    if (n.includes('transferência') || n.includes('transferencia')) return 'Transferência'
    if (n.includes('numerário') || n.includes('numerario')) return 'Numerário'
    return p.status === 'PAGO' ? 'MBWay' : ''
  }

  // ── Próximos recebimentos (pendentes ordenados por data_prevista) ─────────
  const proximos = pagamentos
    .filter(p => p.status === 'PENDENTE' && p.data_prevista && !isAtrasado(p))
    .sort((a, b) => (a.data_prevista ?? '').localeCompare(b.data_prevista ?? ''))
    .slice(0, 5)

  // ── Distribuição por status ──────────────────────────────────────────────
  const aReceberPuros = pagamentos.filter(p => p.status === 'PENDENTE' && !isAtrasado(p))
  const aReceberTotalPuros = aReceberPuros.reduce((s, p) => s + (p.valor ?? 0), 0)
  const cancelados = pagamentos.filter(p => p.status === 'CANCELADO')
  const canceladosTotal = cancelados.reduce((s, p) => s + (p.valor ?? 0), 0)
  const totalProjetos = totalPago + aReceberTotalPuros + atrasadosTotal + canceladosTotal
  const pct = (v: number) => totalProjetos > 0 ? Math.round((v / totalProjetos) * 100) : 0

  const mesAtualLabel = new Date(year, month, 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
  const MONTH_LABELS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  // ── Receitas Mensais (gráfico) ───────────────────────────────────────────
  const monthlyRevenue = (() => {
    const perMonth = new Array(12).fill(0) as number[]
    pagamentos.forEach(p => {
      if (p.status !== 'PAGO' || !p.data_pago) return
      const d = new Date(p.data_pago)
      if (d.getFullYear() !== year) return
      const idx = d.getMonth()
      if (idx >= 0 && idx < 12) perMonth[idx] += p.valor ?? 0
    })
    const cumulative = new Array(12).fill(0) as number[]
    let acc = 0
    for (let i = 0; i < 12; i++) {
      if (i <= month) { acc += perMonth[i]; cumulative[i] = acc }
      else cumulative[i] = acc
    }
    return cumulative
  })()

  const chartPath = (() => {
    const w = 460, h = 110, pad = 8
    const max = Math.max(1, ...monthlyRevenue)
    const step = (w - pad*2) / (monthlyRevenue.length - 1)
    const pts = monthlyRevenue.map((v, i) => ({ x: pad + i * step, y: h - pad - (v / max) * (h - pad*2) }))
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i-1], p1 = pts[i]
      const cx = (p0.x + p1.x) / 2
      d += ` Q ${cx} ${p0.y}, ${cx} ${(p0.y + p1.y) / 2} T ${p1.x} ${p1.y}`
    }
    const highlight = pts[month]
    return { path: d, last: pts[pts.length-1], highlight, pts, w, h, currentValue: monthlyRevenue[month] }
  })()

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
    setEditId(null); setEditForm(null)
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

  // Define estado + método via dropdown (Aguarda | Pago:Método)
  async function setStatusMethod(p: Pagamento, val: string) {
    const today = new Date().toISOString().split('T')[0]
    if (val === 'Aguarda') {
      await fetch('/api/freelancer-pagamentos', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, status: 'PENDENTE', data_pago: null }),
      })
    } else if (val.startsWith('Pago:')) {
      const method = val.replace('Pago:', '')
      await fetch('/api/freelancer-pagamentos', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, status: 'PAGO', data_pago: p.data_pago ?? today, notas: method }),
      })
    }
    onRefresh()
  }

  return (
    <div className="space-y-6">
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08]"
        style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)' }}>
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1600&h=400&fit=crop"
            alt="" className="w-full h-full object-cover scale-105" style={{ filter: 'blur(2px)' }} />
        </div>
        <div className="absolute inset-0 z-[1]"
          style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.85) 40%, rgba(10,10,10,0.5) 70%, rgba(10,10,10,0.15) 100%)' }} />
        <div className="relative z-10 flex items-start justify-between gap-6 px-8 sm:px-12 py-10">
          <div className="max-w-xl">
            <p className="text-[12px] tracking-[0.5em] text-gold/70 uppercase mb-2">Sincronizado com Casamentos</p>
            <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              PAGA<span className="italic text-gold">mentos</span>
            </h1>
            <div className="mt-4 h-px w-16 bg-gradient-to-r from-gold/70 to-transparent" />
            <p className="text-[14px] text-white/55 mt-4 leading-relaxed max-w-md">
              Acompanha os pagamentos sincronizados com os casamentos atribuídos a este freelancer.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="text-[11px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-white/55">
                {pagamentos.filter(p => p.status === 'PENDENTE').length} faturas pendentes
              </span>
              {atrasados.length > 0 && (
                <span className="text-[11px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-300">
                  {atrasados.length} em atraso
                </span>
              )}
            </div>
          </div>
          <button onClick={() => { setShowAdd(true); setEditId(null) }}
            className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-gold text-black text-[13px] font-semibold tracking-wider hover:bg-gold/90 transition-all shrink-0"
            style={{ boxShadow: '0 0 24px -4px rgba(201,164,92,0.5)' }}>
            <span className="text-lg leading-none">+</span> Novo Pagamento
          </button>
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { label: 'Recebido este Mês', value: fmtEuro(recebidoMes), icon: '↓', sub: mesAtualLabel },
          { label: 'A Receber',         value: fmtEuro(aReceberTotalPuros), icon: '◷', sub: `${aReceberPuros.length} pagamentos` },
          { label: 'Atrasados',         value: fmtEuro(atrasadosTotal),     icon: '!', sub: `${atrasados.length} pagamentos`, red: true },
          { label: 'Total Anual',       value: fmtEuro(totalAnual),         icon: '€', sub: String(year) },
        ] as const).map(k => (
          <div key={k.label} className="group relative overflow-hidden rounded-2xl border border-white/[0.08] p-5 hover:border-gold/30 transition-all"
            style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.6), rgba(11,11,11,0.85))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.18), transparent 70%)' }} />
            <div className="relative flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl ${(k as any).red ? 'border-red-500/30 text-red-300' : 'border-gold/30 text-gold'}`}
                style={{ background: (k as any).red
                  ? 'radial-gradient(circle at 30% 30%, rgba(239,68,68,0.15), rgba(239,68,68,0.04))'
                  : 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.15), rgba(201,164,92,0.04))',
                  boxShadow: (k as any).red ? '0 0 20px -4px rgba(239,68,68,0.25)' : '0 0 22px -4px rgba(201,164,92,0.25)' }}>
                {k.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-1">{k.label}</p>
                <p className="text-2xl font-bold text-white leading-none">{k.value}</p>
                <p className="text-[11px] text-white/35 mt-1.5 capitalize">{k.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add form (inline expansível) ────────────────────────────────── */}
      {showAdd && (
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: 'linear-gradient(135deg, rgba(201,164,92,0.06), rgba(11,11,11,0.85))', border: '1px solid rgba(201,164,92,0.30)', boxShadow: '0 0 24px -8px rgba(201,164,92,0.30)' }}>
          <p className="text-[12px] tracking-[0.4em] text-gold uppercase">Novo Pagamento</p>
          <PagaForm f={form} setF={setForm} casamentos={casamentos} />
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-[12px] tracking-widest uppercase border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
            <button onClick={handleAdd} disabled={saving || !form.descricao.trim()}
              className="px-5 py-2 rounded-lg text-[12px] tracking-widest uppercase bg-gold text-black font-semibold hover:bg-gold/85 disabled:opacity-40 transition-all">
              {saving ? '…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* ── Main grid: tabela + side panels ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
        <div className="space-y-4">
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {(['Todos','Recebidos','A receber','Atrasados','Cancelados'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-[11px] tracking-[0.25em] uppercase border transition-all ${
                  filter === f
                    ? 'bg-gold/15 border-gold/40 text-gold font-semibold'
                    : 'bg-white/[0.02] border-white/10 text-white/50 hover:text-white/85 hover:border-white/25'
                }`}>{f}</button>
            ))}
          </div>

          {/* Tabela */}
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.35), rgba(11,11,11,0.65))' }}>
            {filtered.length === 0 ? (
              <p className="text-center py-12 text-white/30 text-[11px] tracking-[0.3em] uppercase">
                {rows.length === 0 ? 'Sem casamentos nem pagamentos' : 'Sem resultados neste filtro'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-black/20">
                      <th className="text-left px-4 py-3 text-[10px] tracking-[0.3em] uppercase text-white/40 font-medium">Projeto/Casal</th>
                      <th className="text-left px-3 py-3 text-[10px] tracking-[0.3em] uppercase text-white/40 font-medium">Descrição</th>
                      <th className="text-right px-3 py-3 text-[10px] tracking-[0.3em] uppercase text-white/40 font-medium">Valor</th>
                      <th className="text-left px-3 py-3 text-[10px] tracking-[0.3em] uppercase text-white/40 font-medium">Estado</th>
                      <th className="text-left px-3 py-3 text-[10px] tracking-[0.3em] uppercase text-white/40 font-medium">Data</th>
                      <th className="text-left px-3 py-3 text-[10px] tracking-[0.3em] uppercase text-white/40 font-medium">Método</th>
                      <th className="text-left px-3 py-3 text-[10px] tracking-[0.3em] uppercase text-white/40 font-medium">Estado</th>
                      <th className="px-3 py-3 text-[10px] tracking-[0.3em] uppercase text-white/40 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const c = r.casamento
                      const p = r.pagamento
                      const atrasado = p ? isAtrasado(p) : false
                      const wf = workflowBadge(c)
                      const method = paymentMethod(p)
                      return (
                        <tr key={r.key} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                          {/* Projeto/Casal */}
                          <td className="px-4 py-3 max-w-[200px]">
                            {c ? (
                              <div>
                                <p className="text-[13px] text-white/85 font-medium truncate">{c.local}</p>
                                {c.data_casamento && <p className="text-[10px] text-white/35">Casamento {c.data_casamento}</p>}
                              </div>
                            ) : (
                              <p className="text-[12px] text-white/25 italic">—</p>
                            )}
                          </td>
                          {/* Descrição */}
                          <td className="px-3 py-3 text-[13px] whitespace-nowrap">
                            {p ? (
                              <>
                                <span className="text-white/75">{p.descricao}</span>
                                {p.notas && <p className="text-[10px] text-white/30 italic mt-0.5 truncate max-w-[160px]">{p.notas}</p>}
                              </>
                            ) : (
                              <span className="text-white/35 italic">Pagamento Único</span>
                            )}
                          </td>
                          {/* Valor */}
                          <td className="px-3 py-3 text-right text-[13px] text-white/85 font-mono whitespace-nowrap">{p?.valor != null ? fmtEuro(p.valor) : <span className="text-white/25">—</span>}</td>
                          {/* Estado (dropdown: Aguarda / Pago · MBWay/Transferência/Numerário) */}
                          <td className="px-3 py-3">
                            {!p ? (
                              <button onClick={() => {
                                  setShowAdd(true)
                                  setEditId(null)
                                  setForm({ casamento_id: c?.id ?? '', descricao: 'Pagamento Único', valor: '', data_prevista: '', data_pago: '', status: 'PENDENTE', notas: '' })
                                }}
                                className="text-[10px] px-3 py-1 rounded-full border bg-blue-500/10 text-blue-300 border-blue-500/30 tracking-widest uppercase font-semibold hover:bg-blue-500/20 transition-all">
                                + Registar
                              </button>
                            ) : p.status === 'CANCELADO' ? (
                              <span className="text-[10px] px-3 py-1 rounded-full border bg-white/[0.04] text-white/40 border-white/15 tracking-widest uppercase font-semibold">Cancelado</span>
                            ) : (
                              <select
                                value={p.status === 'PAGO' ? `Pago:${method || 'MBWay'}` : 'Aguarda'}
                                onChange={e => setStatusMethod(p, e.target.value)}
                                className={`text-[10px] tracking-widest uppercase font-semibold cursor-pointer focus:outline-none rounded-full border px-3 py-1 appearance-none pr-7 bg-no-repeat bg-right ${
                                  p.status === 'PAGO'
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                                    : atrasado
                                      ? 'bg-red-500/15 text-red-300 border-red-500/40 hover:bg-red-500/25'
                                      : 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/25'
                                }`}
                                style={{
                                  backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c9a96e' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                  backgroundPosition: 'right 8px center',
                                  backgroundSize: '10px',
                                }}
                              >
                                <option value="Aguarda" style={{ background: '#1a1206', color: '#fde68a' }}>⏳ Aguarda</option>
                                <option value="Pago:MBWay" style={{ background: '#1a1206', color: '#6ee7b7' }}>✓ Pago · MBWay</option>
                                <option value="Pago:Transferência" style={{ background: '#1a1206', color: '#6ee7b7' }}>✓ Pago · Transferência</option>
                                <option value="Pago:Numerário" style={{ background: '#1a1206', color: '#6ee7b7' }}>✓ Pago · Numerário</option>
                              </select>
                            )}
                          </td>
                          {/* Data */}
                          <td className="px-3 py-3 text-[12px] whitespace-nowrap">
                            {p?.data_pago ? <span className="text-emerald-400/70">{p.data_pago}</span> :
                              p?.data_prevista ? <span className={atrasado ? 'text-red-400' : 'text-white/50'}>{p.data_prevista}</span> :
                              <span className="text-white/20">—</span>}
                          </td>
                          {/* Método */}
                          <td className="px-3 py-3 text-[12px] whitespace-nowrap">
                            {method ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] text-white/65 px-2 py-1 rounded-md border border-white/[0.08] bg-white/[0.02]">
                                <span className="text-gold/70">▦</span> {method}
                              </span>
                            ) : <span className="text-white/20">—</span>}
                          </td>
                          {/* Workflow */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            {wf ? (
                              <span className={`text-[10px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-semibold ${wf.cls}`}>{wf.label}</span>
                            ) : <span className="text-white/20 text-[11px]">—</span>}
                          </td>
                          {/* Ações */}
                          <td className="px-3 py-3 text-right">
                            {p && (
                              <button onClick={() => {
                                  setEditId(p.id)
                                  setEditForm({ casamento_id: p.casamento_id ?? '', descricao: p.descricao, valor: p.valor?.toString() ?? '', data_prevista: p.data_prevista ?? '', data_pago: p.data_pago ?? '', status: p.status, notas: p.notas ?? '' })
                                  setShowAdd(false)
                                }}
                                className="text-white/25 hover:text-gold transition-colors text-base px-2"
                                title="Editar">⋮</button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Side panels ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.06] p-5"
            style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.35), rgba(11,11,11,0.65))' }}>
            <h3 className="text-[13px] font-semibold text-white mb-4">Próximos Recebimentos</h3>
            {proximos.length === 0 ? (
              <p className="text-[11px] text-white/30 italic text-center py-3">Sem pagamentos a receber.</p>
            ) : (
              <div className="space-y-2">
                {proximos.map(p => {
                  const c = p.casamento_id ? casamentos.find(c => c.id === p.casamento_id) : null
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                      <div className="min-w-0">
                        <p className="text-[12px] text-white/80 truncate">{c?.local ?? p.descricao}</p>
                        <p className="text-[10px] text-white/35">{p.data_prevista}</p>
                      </div>
                      <p className="text-[13px] text-gold font-mono whitespace-nowrap">{fmtEuro(p.valor ?? 0)}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Receitas Mensais (gráfico) */}
          <div className="rounded-2xl border border-white/[0.06] p-5"
            style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.35), rgba(11,11,11,0.65))' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-white">Receitas Mensais</h3>
              <button className="text-[10px] tracking-widest uppercase text-white/35 hover:text-gold transition-colors border border-white/10 px-2 py-1 rounded-md">{year} ▾</button>
            </div>
            <div className="relative">
              <svg viewBox={`0 0 ${chartPath.w} ${chartPath.h}`} className="w-full h-32">
                <defs>
                  <linearGradient id="goldAreaFL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A45C" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#C9A45C" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="goldStrokeFL" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#C9A45C" />
                    <stop offset="50%" stopColor="#E8C76D" />
                    <stop offset="100%" stopColor="#C9A45C" />
                  </linearGradient>
                </defs>
                <path d={`${chartPath.path} L ${chartPath.last.x} ${chartPath.h} L 8 ${chartPath.h} Z`} fill="url(#goldAreaFL)" />
                <path d={chartPath.path} fill="none" stroke="url(#goldStrokeFL)" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx={chartPath.highlight.x} cy={chartPath.highlight.y} r="4" fill="#C9A45C" />
                <circle cx={chartPath.highlight.x} cy={chartPath.highlight.y} r="9" fill="#C9A45C" opacity="0.18" />
              </svg>
              <div className="absolute top-1 right-1 px-2.5 py-1.5 rounded-lg bg-black/80 border border-gold/30">
                <p className="text-[11px] text-gold font-bold leading-none">{fmtEuro(chartPath.currentValue)}</p>
                <p className="text-[9px] text-white/40 mt-0.5 capitalize">{MONTH_LABELS_PT[month]} {year}</p>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-white/30 px-1">
              <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Set</span><span>Out</span><span>Nov</span><span>Dez</span>
            </div>
          </div>

          {/* Distribuição */}
          <div className="rounded-2xl border border-white/[0.06] p-5"
            style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.35), rgba(11,11,11,0.65))' }}>
            <h3 className="text-[13px] font-semibold text-white mb-4">Distribuição</h3>
            <div className="space-y-3">
              {([
                { label: 'Recebidos',  color: '#34d399', value: totalPago,           pctVal: pct(totalPago) },
                { label: 'A receber',  color: '#facc15', value: aReceberTotalPuros,  pctVal: pct(aReceberTotalPuros) },
                { label: 'Atrasados',  color: '#ef4444', value: atrasadosTotal,      pctVal: pct(atrasadosTotal) },
                { label: 'Cancelados', color: '#737373', value: canceladosTotal,     pctVal: pct(canceladosTotal) },
              ] as const).map(d => (
                <div key={d.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }}></span>
                      <span className="text-white/65">{d.label}</span>
                    </span>
                    <span className="text-white/85 font-medium">{fmtEuro(d.value)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${d.pctVal}%`, background: d.color, boxShadow: `0 0 8px ${d.color}80` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit modal ──────────────────────────────────────────────────── */}
      {editId && editForm && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setEditId(null); setEditForm(null) }}>
          <div className="bg-[#0e0b07] border border-gold/20 rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            style={{ boxShadow: '0 30px 60px -10px rgba(0,0,0,0.7), 0 0 40px -10px rgba(201,164,92,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <p className="text-[12px] tracking-[0.4em] text-gold uppercase">Editar Pagamento</p>
              <button onClick={() => { setEditId(null); setEditForm(null) }} className="text-white/40 hover:text-white/85 text-base w-7 h-7 flex items-center justify-center">✕</button>
            </div>
            <PagaForm f={editForm} setF={setEditForm as any} casamentos={casamentos} />
            <div className="flex justify-between pt-4 mt-3 border-t border-white/[0.06]">
              <button onClick={() => handleDelete(editId)} className="text-[11px] text-red-400/60 hover:text-red-400 tracking-widest uppercase transition-colors">✕ Remover</button>
              <div className="flex gap-2">
                <button onClick={() => { setEditId(null); setEditForm(null) }} className="px-4 py-2 rounded-lg text-[12px] tracking-widest uppercase border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
                <button onClick={handleEdit} disabled={saving}
                  className="px-5 py-2 rounded-lg text-[12px] tracking-widest uppercase bg-gold text-black font-semibold hover:bg-gold/85 disabled:opacity-40 transition-all">
                  {saving ? '…' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

// Extrai meta JSON do início da mensagem (__META__{...}__/META__\n)
type NotifMeta = {
  senderId?: string
  senderName?: string
  threadId?: string
  creatorId?: string
  creatorName?: string
  threadTitle?: string
  cleanMensagem: string
}
function parseNotifMeta(mensagem: string | null | undefined): NotifMeta {
  if (!mensagem) return { cleanMensagem: '' }
  const m = mensagem.match(/^__META__(.+?)__\/META__\n?/)
  if (!m) return { cleanMensagem: mensagem }
  try {
    const meta = JSON.parse(m[1])
    return {
      senderId:    meta.senderId,
      senderName:  meta.senderName,
      threadId:    meta.threadId,
      creatorId:   meta.creatorId,
      creatorName: meta.creatorName,
      threadTitle: meta.threadTitle,
      cleanMensagem: mensagem.slice(m[0].length),
    }
  } catch { return { cleanMensagem: mensagem.replace(/^__META__.+?__\/META__\n?/, '') } }
}

// Parse o META específico de 'atribuicao_equipa' (shape diferente do parseNotifMeta genérico)
function parseAtribuicaoEquipaMeta(mensagem: string | null | undefined): {
  referencia?: string | null
  role?: string | null
  local?: string | null
  data_casamento?: string | null
  freelancerNome?: string | null
} {
  if (!mensagem) return {}
  const m = mensagem.match(/^__META__(.+?)__\/META__\n?/)
  if (!m) return {}
  try {
    const parsed = JSON.parse(m[1])
    return {
      referencia:     parsed?.atribuicao?.referencia ?? null,
      role:           parsed?.atribuicao?.role ?? null,
      local:          parsed?.atribuicao?.local ?? null,
      data_casamento: parsed?.atribuicao?.data_casamento ?? null,
      freelancerNome: parsed?.freelancerNome ?? null,
    }
  } catch { return {} }
}

function NotificacoesAdminTab({ freelancerId, notificacoes, casamentos = [], onRefresh, viewAsFreelancer, onOpenCasamento }: { freelancerId: string; notificacoes: Notificacao[]; casamentos?: Casamento[]; onRefresh: () => void; viewAsFreelancer?: boolean; onOpenCasamento?: (casamentoId: string) => void }) {
  const [form, setForm] = useState({ titulo: '', mensagem: '', tipo: 'alerta' })
  const [sending, setSending] = useState(false)
  const [respondingNotif, setRespondingNotif] = useState<Notificacao | null>(null)
  const [viewingThread, setViewingThread] = useState<{ threadId: string; title: string } | null>(null)
  const [freelancerName, setFreelancerName] = useState('')
  const [activeTab, setActiveTab] = useState<'recebidas'|'enviadas'>('recebidas')
  const [sentNotifs, setSentNotifs] = useState<Notificacao[]>([])
  const [loadingSent, setLoadingSent] = useState(false)
  const [respondingAtribuicao, setRespondingAtribuicao] = useState<string | null>(null) // id da notif em curso

  // Mapa rapido referencia → casamento (para resolver noivos + abrir preview)
  const casamentosByRef = useMemo(() => {
    const m = new Map<string, Casamento>()
    for (const c of casamentos) {
      if (c.referencia) m.set(c.referencia, c)
    }
    return m
  }, [casamentos])

  // Mapa local + data → casamento (fallback quando notificação não tem referência)
  function findCasamentoForNotif(n: Notificacao): Casamento | null {
    // ── 1) META específico de atribuicao_equipa (estruturado) ──
    const atrMeta = parseAtribuicaoEquipaMeta(n.mensagem)
    if (atrMeta.referencia && casamentosByRef.has(atrMeta.referencia)) {
      return casamentosByRef.get(atrMeta.referencia)!
    }
    if (atrMeta.local && atrMeta.data_casamento) {
      const localLower = atrMeta.local.toLowerCase()
      const cand = casamentos.find(c =>
        c.data_casamento === atrMeta.data_casamento &&
        c.local && (c.local.toLowerCase().includes(localLower) || localLower.includes(c.local.toLowerCase()))
      )
      if (cand) return cand
    }

    // ── 2) META genérico (referência num campo top-level) ──
    try {
      const m = (n.mensagem ?? '').match(/^__META__(.+?)__\/META__/)
      if (m) {
        const obj = JSON.parse(m[1])
        const ref = obj?.referencia || obj?.ref || obj?.casamento_referencia
        if (ref && casamentosByRef.has(ref)) return casamentosByRef.get(ref)!
      }
    } catch { /* ignore */ }

    // ── 3) Match por nome de local no título/mensagem (heurístico) ──
    //     Ex.: 'Prazo Seleção · QUINTA DAS BISPAS' → procura casamento
    //          cujo c.local case-insensitive include 'QUINTA DAS BISPAS'.
    //     Estratégia: pega tudo a partir do separador '·' ou ':' no título,
    //     ou usa o título inteiro como fallback. Faz o mesmo com a mensagem.
    const haystack = `${n.titulo ?? ''} \n ${n.mensagem ?? ''}`.toLowerCase()
    if (haystack.trim()) {
      // Procura o casamento cujo c.local apareça inteiro como substring
      // do título ou mensagem. Filtra locais muito curtos (<5 chars).
      const matches = casamentos.filter(c => {
        if (!c.local || c.local.length < 5) return false
        return haystack.includes(c.local.toLowerCase())
      })
      // Em caso de match único, devolve-o. Em caso de múltiplos, prefere
      // o que tem nome_noivos preenchido (mais útil ao utilizador).
      if (matches.length === 1) return matches[0]
      if (matches.length > 1) {
        const withNoivos = matches.find(c => c.nome_noivos && c.nome_noivos.trim())
        if (withNoivos) return withNoivos
        return matches[0]
      }
    }

    return null
  }

  // Resposta à atribuição: cria entrada no casamento + envia email ao admin
  async function responderAtribuicao(n: Notificacao, resposta: 'confirmar' | 'indisponivel') {
    const meta = parseAtribuicaoEquipaMeta(n.mensagem)
    setRespondingAtribuicao(n.id)
    try {
      // 1) Atualiza freelancer_casamento (apenas para Fotógrafo/Videógrafo — roles do dia)
      const roleLower = (meta.role || '').toLowerCase()
      const isDayRole = roleLower.includes('fot') || roleLower.includes('vid')
      if (isDayRole && meta.referencia) {
        try {
          const r = await fetch(`/api/freelancer-casamentos?freelancer_id=${encodeURIComponent(n.freelancer_id)}`).then(r => r.json())
          const c = (r.casamentos ?? []).find((c: any) => c.referencia === meta.referencia)
          if (c?.id) {
            const patch = resposta === 'confirmar'
              ? { data_confirmada: true, indisponivel: false }
              : { indisponivel: true, data_confirmada: false }
            await fetch('/api/freelancer-casamentos', {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: c.id, ...patch }),
            })
          }
        } catch { /* não bloqueia */ }
      }
      // 2) Envia email ao admin
      try {
        await fetch('/api/send-admin-notification', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: resposta === 'confirmar' ? 'confirmou' : 'indisponivel',
            freelancer_nome: meta.freelancerNome || freelancerName,
            referencia: meta.referencia,
            data_evento: meta.data_casamento,
            local: meta.local,
          }),
        })
      } catch { /* não bloqueia */ }
      // 3) Cria notificação na lista de Notificações deste freelancer
      //    (visível no admin /freelancers/[id]?tab=notificacoes E no portal do freelancer).
      //    O admin vê assim 'Foto·Vídeo Confirmou atribuição' ou 'Marcou-se indisponível'.
      try {
        const nome = meta.freelancerNome || freelancerName || 'O membro'
        const role = meta.role || ''
        const local = meta.local || ''
        const tituloResp = resposta === 'confirmar'
          ? `✓ ${nome} confirmou · ${role}`
          : `✕ ${nome} marcou-se indisponível · ${role}`
        const corpoResp = resposta === 'confirmar'
          ? `Confirmou a disponibilidade para o evento${local ? ` em ${local}` : ''}.`
          : `Está indisponível para o evento${local ? ` em ${local}` : ''}.`
        await fetch('/api/freelancer-notificacoes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            freelancer_id: n.freelancer_id,
            titulo: tituloResp,
            mensagem: corpoResp,
            tipo: resposta === 'confirmar' ? 'atribuicao_confirmada' : 'atribuicao_indisponivel',
            lida: false,
          }),
        })
      } catch { /* não bloqueia */ }
      // 4) Marca notificação original (a 'Nova atribuição') como lida
      await fetch('/api/freelancer-notificacoes', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id, lida: true }),
      })
      onRefresh()
    } finally { setRespondingAtribuicao(null) }
  }

  // Carrega tarefas enviadas (notifs em que sou o senderId no META)
  useEffect(() => {
    if (!freelancerId) return
    setLoadingSent(true)
    fetch(`/api/freelancer-notificacoes?sent_by=${encodeURIComponent(freelancerId)}`)
      .then(r => r.json())
      .then(d => setSentNotifs((d.notificacoes ?? []) as Notificacao[]))
      .catch(() => setSentNotifs([]))
      .finally(() => setLoadingSent(false))
  }, [freelancerId, notificacoes.length])

  async function concluirTarefaThread(threadId: string) {
    // Marca tarefa como concluída — adiciona nota de conclusão como notif tipo='tarefa_concluida'
    // que aparece em todos os intervenientes (vamos mandar a TODOS os senders da thread).
    const respTitulo = `✓ Tarefa concluída — ${viewingThread?.title || 'Tarefa'}`
    const meta = JSON.stringify({
      senderId: freelancerId,
      senderName: freelancerName,
      threadId,
      creatorId: freelancerId,
      creatorName: freelancerName,
      threadTitle: viewingThread?.title || '',
    })
    const respMensagem = [
      `__META__${meta}__/META__`,
      `A tarefa foi marcada como concluída por ${freelancerName || 'o criador'}.`,
    ].join('\n')
    // Carrega todos os participantes da thread
    const res = await fetch(`/api/freelancer-notificacoes?thread_id=${encodeURIComponent(threadId)}`).then(r => r.json())
    const allNotifs = (res.notificacoes ?? []) as Notificacao[]
    const participantIds = Array.from(new Set(allNotifs.map(n => n.freelancer_id))).filter(id => id !== freelancerId)
    // Notifica cada participante (não o próprio)
    await Promise.all(participantIds.map(pid =>
      fetch('/api/freelancer-notificacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelancer_id: pid,
          titulo: respTitulo,
          mensagem: respMensagem,
          tipo: 'tarefa_concluida',
          lida: false,
        }),
      })
    ))
    setViewingThread(null)
    onRefresh()
  }

  // Buscar o nome do freelancer actual para incluir na resposta
  useEffect(() => {
    fetch('/api/freelancers').then(r => r.json()).then(d => {
      const me = (d.freelancers ?? []).find((f: any) => f.id === freelancerId)
      if (me) setFreelancerName(me.nome ?? '')
    }).catch(() => {})
  }, [freelancerId])

  async function sendResposta(notif: Notificacao, resposta: string) {
    const parsedMeta = parseNotifMeta(notif.mensagem)
    const { senderId, threadId, creatorId, creatorName, threadTitle } = parsedMeta
    if (!senderId) {
      alert('Não foi possível identificar quem enviou a tarefa. Marca como lida e contacta o admin.')
      return
    }
    const tituloOriginal = threadTitle || (notif.titulo ?? '').replace(/^[✈↩] (Nova tarefa|Resposta) de [^—]+— /, '')
    const respTitulo = `↩ Resposta de ${freelancerName || 'um colega'} — ${tituloOriginal}`
    // Mantém threadId + creatorId no META para continuar a conversação
    const newMeta = JSON.stringify({
      senderId: freelancerId,
      senderName: freelancerName,
      threadId: threadId ?? `t-legacy-${notif.id}`,
      creatorId: creatorId ?? senderId,
      creatorName: creatorName ?? '',
      threadTitle: tituloOriginal,
    })
    const respMensagem = [
      `__META__${newMeta}__/META__`,
      resposta.trim(),
      '',
      `Em resposta a: "${tituloOriginal}"`,
      freelancerName ? `De: ${freelancerName}` : null,
    ].filter(Boolean).join('\n')
    // 1) Cria notificação no portal do remetente original
    await fetch('/api/freelancer-notificacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        freelancer_id: senderId,
        titulo: respTitulo,
        mensagem: respMensagem,
        tipo: 'resposta_tarefa',
        lida: false,
      }),
    })
    // 2) Email opcional ao remetente
    try {
      await fetch('/api/send-notif-freelancer-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancer_id: senderId, titulo: respTitulo }),
      })
    } catch { /* não bloqueia */ }
    // 3) Marca a original como lida
    await fetch('/api/freelancer-notificacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notif.id, lida: true }),
    })
    setRespondingNotif(null)
    onRefresh()
  }

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

  async function handleMarkRead(id: string, lida: boolean) {
    await fetch('/api/freelancer-notificacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, lida }),
    })
    onRefresh()
  }

  async function handleMarkAllRead() {
    const naoLidas = notificacoes.filter(n => !n.lida)
    if (naoLidas.length === 0) return
    await Promise.all(naoLidas.map(n =>
      fetch('/api/freelancer-notificacoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id, lida: true }),
      })
    ))
    onRefresh()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/freelancer-notificacoes?id=${id}`, { method: 'DELETE' })
    onRefresh()
  }

  // Estatísticas
  const totalRecebidas = notificacoes.length
  const naoLidas = notificacoes.filter(n => !n.lida).length
  const tarefasAtivas = notificacoes.filter(n => n.tipo === 'nova_tarefa_atribuida' && !n.lida).length
  const respostasPendentes = notificacoes.filter(n => n.tipo === 'resposta_tarefa' && !n.lida).length

  return (
    <div className="space-y-5">
      {/* ── HERO ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08]"
        style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)' }}>
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&h=240&fit=crop"
            alt="" className="w-full h-full object-cover" style={{ filter: 'blur(2px)' }} />
        </div>
        <div className="absolute inset-0 z-[1]"
          style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.85) 35%, rgba(10,10,10,0.45) 70%, rgba(10,10,10,0.05) 100%)' }} />
        <div className="relative z-10 flex items-center justify-between gap-6 px-6 sm:px-10 py-6 sm:py-7 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl border border-rose-500/45 flex items-center justify-center text-2xl text-rose-300 shrink-0"
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(244,63,94,0.18), rgba(244,63,94,0.04))', boxShadow: '0 0 22px -4px rgba(244,63,94,0.35)' }}>◉</div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Notificações</h1>
              <p className="text-[12px] text-white/50 mt-0.5 leading-relaxed max-w-md">Envia alertas e gere a conversação de tarefas com este membro.</p>
            </div>
          </div>
          {/* KPIs no hero */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <NotifHeroKpi label="Não lidas" value={naoLidas} accent="rose" />
            <NotifHeroKpi label="Tarefas" value={tarefasAtivas} accent="blue" />
            <NotifHeroKpi label="Respostas" value={respostasPendentes} accent="indigo" />
            <NotifHeroKpi label="Total" value={totalRecebidas} accent="gold" />
          </div>
        </div>
      </div>

      {/* ── ENVIAR NOTIFICAÇÃO (Card premium) — só admin ─────────── */}
      {!viewAsFreelancer && (
        <div className="rounded-2xl border border-white/[0.08] p-5"
          style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg border border-gold/35 bg-gold/10 flex items-center justify-center text-gold text-sm">✎</span>
              <div>
                <h3 className="text-[15px] font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>Enviar Notificação</h3>
                <p className="text-[11px] text-white/40">Aparece no sino do membro + email opcional.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Tipo */}
            <div className="lg:col-span-3">
              <label className="block text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1.5">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(v => ({ ...v, tipo: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-gold/50 [color-scheme:dark] transition-colors">
                <option value="alerta" style={optStyle}>⚠ Alerta</option>
                <option value="pagamento" style={optStyle}>💰 Pagamento</option>
                <option value="briefing" style={optStyle}>📋 Briefing</option>
              </select>
            </div>
            {/* Título */}
            <div className="lg:col-span-9">
              <label className="block text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1.5">
                Título <span className="text-rose-300">*</span>
              </label>
              <input value={form.titulo} onChange={e => setForm(v => ({ ...v, titulo: e.target.value }))}
                placeholder="Ex: Novo evento adicionado"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-gold/50 transition-colors" />
            </div>
            {/* Mensagem */}
            <div className="lg:col-span-12">
              <label className="block text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1.5">Mensagem</label>
              <textarea value={form.mensagem} onChange={e => setForm(v => ({ ...v, mensagem: e.target.value }))}
                rows={3} placeholder="Mensagem opcional…"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-gold/50 resize-none leading-relaxed transition-colors" />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button onClick={handleSend} disabled={sending || !form.titulo.trim()}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-bold tracking-wider uppercase transition-all ${
                sending || !form.titulo.trim()
                  ? 'bg-white/[0.04] text-white/25 border border-white/10 cursor-not-allowed'
                  : 'bg-gold text-black hover:bg-gold/90'
              }`}
              style={!sending && form.titulo.trim() ? { boxShadow: '0 0 18px -4px rgba(201,164,92,0.5)' } : undefined}>
              {sending ? 'A enviar…' : '✈ Enviar Notificação'}
            </button>
          </div>
        </div>
      )}

      {/* ── TABS Recebidas | Enviadas ────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.08] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-0 flex-wrap">
          <div className="flex items-center gap-1 border-b border-white/[0.06] -mb-px">
            {([
              { key: 'recebidas' as const, label: 'Recebidas', count: notificacoes.length, icon: '◉' },
              { key: 'enviadas'  as const, label: 'Tarefas Enviadas', count: sentNotifs.length, icon: '✈' },
            ]).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`relative px-4 py-2.5 text-[11px] tracking-[0.25em] uppercase font-bold transition-all flex items-center gap-2 ${
                  activeTab === t.key ? 'text-gold' : 'text-white/40 hover:text-white/75'
                }`}>
                <span className="text-[13px]">{t.icon}</span>
                {t.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                  activeTab === t.key ? 'bg-gold/15 text-gold border border-gold/35' : 'bg-white/[0.06] text-white/40 border border-white/10'
                }`}>{t.count}</span>
                {activeTab === t.key && <span className="absolute bottom-0 left-3 right-3 h-px bg-gold" />}
              </button>
            ))}
          </div>
          {activeTab === 'recebidas' && notificacoes.some(n => !n.lida) && (
            <button onClick={handleMarkAllRead}
              className="px-3 py-1.5 rounded-lg text-[10px] tracking-widest uppercase font-bold text-white/55 hover:text-gold border border-white/10 hover:border-gold/40 hover:bg-gold/5 transition-all">
              ✓ Marcar todas como lidas
            </button>
          )}
        </div>

        <div className="px-5 pb-5 pt-4">
          {/* ── RECEBIDAS ──────────────────────────────────────── */}
          {activeTab === 'recebidas' && (notificacoes.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-5xl opacity-15 block mb-3">◉</span>
              <p className="text-[13px] text-white/35 italic">Sem notificações recebidas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* AVISO — marcar como lidas para não ficar pendente */}
              {notificacoes.some(n => !n.lida) && (
                <div className="rounded-xl p-3.5 flex items-start gap-3 mb-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(251,146,60,0.10), rgba(251,146,60,0.03))',
                    border: '1px solid rgba(251,146,60,0.30)',
                  }}>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                    style={{ background: 'rgba(251,146,60,0.18)', color: '#fb923c' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] tracking-[0.25em] uppercase font-bold mb-1" style={{ color: '#fb923c' }}>
                      Atenção · Notificações por ler
                    </p>
                    <p className="text-[12.5px] text-white/75 leading-relaxed">
                      Depois de leres cada notificação, clica em{' '}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase font-bold mx-0.5"
                        style={{ background: 'rgba(110,231,183,0.15)', color: '#6ee7b7', border: '1px solid rgba(110,231,183,0.35)' }}>
                        ✓ Lida
                      </span>{' '}
                      para a remover dos pendentes. Caso contrário, continua a aparecer na sineta global.
                    </p>
                  </div>
                </div>
              )}
              {notificacoes.map(n => {
                const meta = parseNotifMeta(n.mensagem)
                const isTaskAssigned = n.tipo === 'nova_tarefa_atribuida'
                const isTaskResposta = n.tipo === 'resposta_tarefa'
                const isTaskConcluida = n.tipo === 'tarefa_concluida'
                const isTaskMessage  = isTaskAssigned || isTaskResposta || isTaskConcluida
                const isAtribuicao   = n.tipo === 'atribuicao_equipa'

                // Tenta resolver o casamento associado em QUALQUER notificação
                // (atribuição, prazos, briefing, álbum, alertas, etc.). Match
                // por referência → local+data → heurística no texto.
                const casamentoAssoc = findCasamentoForNotif(n)
                const noivosNome = casamentoAssoc?.nome_noivos || null
                const clickable = !!casamentoAssoc

                // Accent visual por tipo
                const accent = isTaskAssigned ? { border: 'border-blue-500/35', bg: 'bg-blue-500/[0.05]', text: 'text-blue-300', glow: 'rgba(59,130,246,0.35)', icon: '✈', badge: '✈ NOVA TAREFA' }
                  : isTaskResposta ? { border: 'border-indigo-500/35', bg: 'bg-indigo-500/[0.05]', text: 'text-indigo-300', glow: 'rgba(99,102,241,0.35)', icon: '↩', badge: '↩ NOVA RESPOSTA' }
                  : isTaskConcluida ? { border: 'border-emerald-500/35', bg: 'bg-emerald-500/[0.05]', text: 'text-emerald-300', glow: 'rgba(52,211,153,0.35)', icon: '✓', badge: '✓ TAREFA CONCLUÍDA' }
                  : isAtribuicao ? { border: 'border-gold/45', bg: 'bg-gold/[0.06]', text: 'text-gold', glow: 'rgba(201,164,92,0.4)', icon: '✨', badge: '✨ NOVA ATRIBUIÇÃO' }
                  : { border: 'border-gold/30', bg: 'bg-gold/[0.04]', text: 'text-gold', glow: 'rgba(201,164,92,0.35)', icon: '◉', badge: '• não lida' }

                return (
                <div key={n.id}
                  onClick={() => {
                    if (clickable && casamentoAssoc && onOpenCasamento) {
                      // Marca como lida ao abrir (UX: deixa de estar pendente)
                      if (!n.lida) { handleMarkRead(n.id, true).catch(() => {}) }
                      onOpenCasamento(casamentoAssoc.id)
                    }
                  }}
                  className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border group transition-all hover:border-white/15 ${
                    n.lida ? 'border-white/[0.06] bg-white/[0.015]' : `${accent.border} ${accent.bg}`
                  } ${clickable ? 'cursor-pointer hover:bg-white/[0.025]' : ''}`}
                  style={!n.lida ? { boxShadow: `0 0 24px -10px ${accent.glow}` } : undefined}>
                  {/* Ícone à esquerda */}
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center text-base shrink-0 ${
                    n.lida ? 'border-white/10 bg-white/[0.03] text-white/35' : `${accent.border} ${accent.bg} ${accent.text}`
                  }`}>
                    {accent.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[9px] tracking-[0.3em] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        n.lida ? 'border-white/10 bg-white/[0.03] text-white/35' : `${accent.border} ${accent.bg} ${accent.text}`
                      }`}>{n.tipo.replace(/_/g, ' ')}</span>
                      {n.lida
                        ? <span className="text-[10px] text-emerald-400/60 inline-flex items-center gap-1 tracking-widest uppercase font-bold">✓ Lida</span>
                        : <span className={`text-[10px] tracking-widest uppercase font-bold ${accent.text}`}>{accent.badge}</span>
                      }
                    </div>
                    <p className={`text-[14px] mb-0.5 leading-snug ${n.lida ? 'text-white/65' : 'text-white font-medium'}`}>{n.titulo}</p>
                    {/* Nome dos noivos + link "Ver Ficha" se houver casamento associado */}
                    {noivosNome && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[11px] tracking-wider text-gold/85 font-semibold">
                          <span className="opacity-65">💍</span> {noivosNome}
                        </span>
                        {clickable && (
                          <span className="text-[9px] tracking-[0.3em] uppercase text-white/30 group-hover:text-gold/80 transition-colors">
                            · Clica para abrir casamento →
                          </span>
                        )}
                      </div>
                    )}
                    {meta.cleanMensagem && (
                      <p className="text-[12px] text-white/50 mt-1 whitespace-pre-wrap leading-relaxed line-clamp-3">{meta.cleanMensagem}</p>
                    )}
                    <p className="text-[10px] text-white/25 mt-1.5 tabular-nums tracking-wider">
                      {new Date(n.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' · '}
                      {new Date(n.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Acções à direita — stopPropagation para não disparar
                      o preview do casamento ao clicar nestes botões. */}
                  <div className="flex flex-col items-end gap-1.5 mt-0.5 flex-shrink-0"
                    onClick={e => e.stopPropagation()}>
                    {/* Confirmar / Indisponível removidos daqui — agora apenas
                        no card do casamento em Casamentos. A página de
                        Notificações fica como histórico/leitura. */}
                    {isTaskMessage && meta.threadId && (
                      <button onClick={() => setViewingThread({ threadId: meta.threadId!, title: meta.threadTitle || n.titulo })}
                        title="Ver toda a conversação desta tarefa"
                        className="px-3 py-1.5 rounded-md text-[9px] tracking-[0.2em] uppercase font-bold border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold/60 transition-all whitespace-nowrap">
                        💬 Ver Conversação
                      </button>
                    )}
                    {!isTaskConcluida && (isTaskAssigned || isTaskResposta) && meta.senderId && meta.senderId !== freelancerId && (
                      <button onClick={() => setRespondingNotif(n)}
                        title="Responder ao remetente"
                        className="px-3 py-1.5 rounded-md text-[9px] tracking-[0.2em] uppercase font-bold border border-blue-500/45 bg-blue-500/20 text-blue-100 hover:bg-blue-500/30 hover:border-blue-400/65 transition-all whitespace-nowrap"
                        style={{ boxShadow: '0 0 10px -4px rgba(59,130,246,0.5)' }}>
                        ↩ Responder
                      </button>
                    )}
                    <div className="flex items-center gap-1.5">
                      {!n.lida ? (
                        <button onClick={() => handleMarkRead(n.id, true)}
                          title="Marcar como lida"
                          className="px-2.5 py-1 rounded-md text-[9px] tracking-[0.15em] uppercase font-bold border border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400/55 transition-all">
                          ✓ Lida
                        </button>
                      ) : (
                        <button onClick={() => handleMarkRead(n.id, false)}
                          title="Marcar como não lida"
                          className="px-2 py-1 rounded-md text-[9px] tracking-[0.15em] uppercase font-bold border border-white/10 bg-white/[0.03] text-white/45 hover:text-gold hover:border-gold/35 transition-all opacity-0 group-hover:opacity-100">
                          ↺ Não lida
                        </button>
                      )}
                      <button onClick={() => handleDelete(n.id)}
                        title="Apagar"
                        className="w-7 h-7 flex items-center justify-center rounded-md text-white/20 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all opacity-0 group-hover:opacity-100">✕</button>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          ))}

          {/* ── ENVIADAS ───────────────────────────────────────── */}
          {activeTab === 'enviadas' && (
            loadingSent ? (
              <div className="text-center py-12">
                <span className="inline-block w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-3" />
                <p className="text-[13px] text-white/35 italic">A carregar tarefas enviadas…</p>
              </div>
            ) : sentNotifs.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-5xl opacity-15 block mb-3">✈</span>
                <p className="text-[13px] text-white/35 italic">Ainda não enviaste tarefas a outros membros.</p>
                <p className="text-[11px] text-white/25 mt-2">Vai a <span className="text-gold/70 font-medium">Tarefas → ✈ Enviar Tarefa</span> para começar.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const groups = new Map<string, { items: Notificacao[]; firstMeta: ReturnType<typeof parseNotifMeta> | null }>()
                  sentNotifs.forEach(n => {
                    const meta = parseNotifMeta(n.mensagem)
                    const key = meta.threadId || `solo-${n.id}`
                    if (!groups.has(key)) groups.set(key, { items: [], firstMeta: meta })
                    groups.get(key)!.items.push(n)
                  })
                  const sorted = Array.from(groups.entries()).sort((a, b) => {
                    const ta = a[1].items[a[1].items.length - 1].created_at || ''
                    const tb = b[1].items[b[1].items.length - 1].created_at || ''
                    return tb.localeCompare(ta)
                  })
                  return sorted.map(([threadId, group]) => {
                    const meta = group.firstMeta
                    const lastItem = group.items[group.items.length - 1]
                    const recipientNames = Array.from(new Set(group.items.map(i => i.freelancer_id)))
                    const threadTitle = meta?.threadTitle || lastItem.titulo
                    const concluded = group.items.some(i => i.tipo === 'tarefa_concluida')
                    const lastDate = new Date(lastItem.created_at)
                    const dateLabel = `${lastDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} · ${lastDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
                    return (
                      <div key={threadId}
                        className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all group hover:border-gold/30 hover:bg-white/[0.025] ${
                          concluded ? 'border-emerald-500/25 bg-emerald-500/[0.04]' : 'border-blue-500/20 bg-blue-500/[0.03]'
                        }`}>
                        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center text-base shrink-0 ${
                          concluded ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                        }`} style={{ boxShadow: concluded ? '0 0 12px -4px rgba(52,211,153,0.4)' : '0 0 12px -4px rgba(59,130,246,0.4)' }}>
                          {concluded ? '✓' : '✈'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[13px] text-white font-medium truncate">{threadTitle}</span>
                            {concluded && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 tracking-[0.2em] uppercase font-bold">
                                Concluída
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/45 truncate">
                            <span className="text-white/65">{recipientNames.length > 1 ? `${recipientNames.length} membros` : '1 membro'}</span>
                            {' · '}{group.items.length} mensagem{group.items.length === 1 ? '' : 's'}
                          </p>
                          <p className="text-[10px] text-white/25 mt-1 tabular-nums tracking-wider">Última atualização · {dateLabel}</p>
                        </div>
                        {meta?.threadId && (
                          <button onClick={() => setViewingThread({ threadId: meta.threadId!, title: threadTitle })}
                            className="px-3 py-1.5 rounded-md text-[9px] tracking-[0.2em] uppercase font-bold border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold/60 transition-all flex items-center gap-1 shrink-0">
                            💬 Ver
                          </button>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal Responder à Tarefa */}
      {respondingNotif && (
        <ResponderTarefaModal
          notif={respondingNotif}
          onClose={() => setRespondingNotif(null)}
          onSend={(resposta) => sendResposta(respondingNotif, resposta)}
        />
      )}

      {/* Modal Conversação da Tarefa */}
      {viewingThread && (
        <ConversacaoModal
          threadId={viewingThread.threadId}
          title={viewingThread.title}
          currentFreelancerId={freelancerId}
          currentFreelancerName={freelancerName}
          onClose={() => setViewingThread(null)}
          onConcluir={() => concluirTarefaThread(viewingThread.threadId)}
          onResponder={(notif) => { setRespondingNotif(notif); setViewingThread(null) }}
        />
      )}

    </div>
  )
}

// KPI pill no hero das Notificações
function NotifHeroKpi({ label, value, accent }: { label: string; value: number; accent: 'rose' | 'blue' | 'indigo' | 'gold' }) {
  const map = {
    rose:   { bg: 'bg-rose-500/15',   border: 'border-rose-500/35',   text: 'text-rose-300',   glow: 'rgba(244,63,94,0.35)' },
    blue:   { bg: 'bg-blue-500/15',   border: 'border-blue-500/35',   text: 'text-blue-300',   glow: 'rgba(59,130,246,0.35)' },
    indigo: { bg: 'bg-indigo-500/15', border: 'border-indigo-500/35', text: 'text-indigo-300', glow: 'rgba(99,102,241,0.35)' },
    gold:   { bg: 'bg-gold/15',       border: 'border-gold/35',       text: 'text-gold',       glow: 'rgba(201,164,92,0.35)' },
  }[accent]
  return (
    <div className={`inline-flex flex-col items-center px-3.5 py-2 rounded-xl border ${map.bg} ${map.border}`}
      style={{ boxShadow: value > 0 ? `0 0 14px -6px ${map.glow}` : undefined }}>
      <span className={`text-[18px] leading-none font-bold tabular-nums ${value > 0 ? map.text : 'text-white/35'}`}>{value}</span>
      <span className={`text-[8px] tracking-[0.25em] uppercase mt-0.5 font-bold ${value > 0 ? map.text + '/85' : 'text-white/30'}`}>{label}</span>
    </div>
  )
}

// ── Modal Atribuir Tarefa (Admin → Freelancer específico) ────────
function AtribuirTarefaAdminModal({ freelancerId, freelancerNome, onClose }: { freelancerId: string; freelancerNome: string; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [priority, setPriority] = useState<TarefaPriority>('Média')
  const [dueDate, setDueDate] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const valid = titulo.trim().length >= 3
  async function submit() {
    if (!valid || sending) return
    setSending(true); setError(null)
    try {
      const prazoLabel = dueDate ? new Date(dueDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : null
      const threadId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `t-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const ADMIN_SENDER = 'admin'
      const ADMIN_NAME   = 'Admin RL Photo·Video'
      const titleFull = `✓ Nova tarefa do Admin — ${titulo.trim()}`
      const meta = JSON.stringify({
        senderId: ADMIN_SENDER, senderName: ADMIN_NAME,
        threadId, creatorId: ADMIN_SENDER, creatorName: ADMIN_NAME,
        threadTitle: titulo.trim(),
      })
      const mensagem = [
        `__META__${meta}__/META__`,
        descricao.trim() || null,
        `Prioridade: ${priority}`,
        prazoLabel ? `Prazo: ${prazoLabel}` : null,
        `Atribuída por: ${ADMIN_NAME}`,
        'Esta tarefa precisa da tua resposta no portal.',
      ].filter(Boolean).join('\n')

      // 1) Notificação no portal (sino vermelho)
      await fetch('/api/freelancer-notificacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelancer_id: freelancerId,
          titulo: titleFull,
          mensagem,
          tipo: 'nova_tarefa_atribuida',
          lida: false,
        }),
      })

      // 2) Email com o card 'Nova tarefa atribuída'
      try {
        await fetch('/api/send-nova-tarefa-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            freelancer_id: freelancerId,
            titulo: titulo.trim(),
            descricao: descricao.trim() || null,
            prazo: prazoLabel,
            prioridade: priority,
          }),
        })
      } catch { /* opcional */ }

      setSuccess(true)
      setTimeout(() => onClose(), 1600)
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao atribuir tarefa')
    } finally { setSending(false) }
  }

  if (!mounted || typeof document === 'undefined') return null

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden border border-purple-500/35 shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #14081a, #0a050e)' }}
        onClick={e => e.stopPropagation()}>
        <div className="h-0.5 w-full bg-purple-500/75" />
        <div className="px-6 pt-5 pb-3 border-b border-white/[0.05] flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[0.5em] text-purple-300/85 uppercase mb-1">Atribuir Tarefa</p>
            <h2 className="text-lg font-light tracking-[0.05em] text-white" style={{ fontFamily: 'Georgia, serif' }}>
              Para <span className="italic text-purple-200">{freelancerNome || 'este membro'}</span>
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all">✕</button>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-2xl mx-auto mb-3"
              style={{ boxShadow: '0 0 24px -4px rgba(52,211,153,0.5)' }}>✓</div>
            <p className="text-[14px] text-white font-medium">Tarefa atribuída!</p>
            <p className="text-[12px] text-white/55 mt-1">{freelancerNome} foi notificado por sino + email com o card.</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 space-y-3">
              {/* Banner explicativo */}
              <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl border border-purple-500/25 bg-purple-500/[0.06]">
                <span className="text-purple-300 text-base shrink-0 mt-0.5">ⓘ</span>
                <p className="text-[11px] text-purple-100/85 leading-relaxed">
                  O membro recebe a tarefa no <span className="font-semibold">sino do portal</span> (em vermelho) e por <span className="font-semibold">email</span> com o card visual. Vai precisar de dar resposta.
                </p>
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 mb-1.5">
                  Título <span className="text-red-300">*</span>
                </label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} autoFocus
                  placeholder="O que precisa de ser feito?"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-purple-400/50" />
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 mb-1.5">Descrição</label>
                <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3}
                  placeholder="Detalhes, instruções, contexto…"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-purple-400/50 resize-none leading-relaxed" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 mb-1.5">Prioridade</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as TarefaPriority)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-purple-400/50 [color-scheme:dark]">
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 mb-1.5">Prazo</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-purple-400/50 [color-scheme:dark]" />
                </div>
              </div>

              {error && (
                <p className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">⚠ {error}</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/[0.05] flex items-center justify-end gap-2 bg-black/30">
              <button onClick={onClose}
                className="px-4 py-2 rounded-lg text-[11px] tracking-wider uppercase text-white/55 hover:text-white border border-white/10 hover:border-white/30 transition-all">
                Cancelar
              </button>
              <button onClick={submit} disabled={!valid || sending}
                className={`px-5 py-2 rounded-lg text-[11px] tracking-wider uppercase font-bold transition-all ${
                  valid && !sending
                    ? 'bg-purple-500 text-white hover:bg-purple-400'
                    : 'bg-white/[0.04] text-white/25 cursor-not-allowed border border-white/10'
                }`}
                style={valid && !sending ? { boxShadow: '0 0 14px -4px rgba(168,85,247,0.6)' } : undefined}>
                {sending ? 'A atribuir...' : '✓ Atribuir Tarefa'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

// ── Modal Conversação — mostra toda a thread de uma tarefa ────────
function ConversacaoModal({ threadId, title, currentFreelancerId, currentFreelancerName, onClose, onConcluir, onResponder }: {
  threadId: string
  title: string
  currentFreelancerId: string
  currentFreelancerName: string
  onClose: () => void
  onConcluir: () => void | Promise<void>
  onResponder: (notif: Notificacao) => void
}) {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Notificacao[]>([])
  const [nomesById, setNomesById] = useState<Record<string, string>>({})
  const [concluindo, setConcluindo] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/freelancer-notificacoes?thread_id=${encodeURIComponent(threadId)}`).then(r => r.json()),
      fetch('/api/freelancers').then(r => r.json()),
    ]).then(([t, f]) => {
      setMessages((t.notificacoes ?? []) as Notificacao[])
      const map: Record<string, string> = {}
      ;(f.freelancers ?? []).forEach((fl: any) => { map[fl.id] = fl.nome })
      setNomesById(map)
    }).finally(() => setLoading(false))
  }, [threadId])

  if (!mounted || typeof document === 'undefined') return null

  // Ordena por data (asc — mais antiga primeiro, conversação natural)
  const sorted = [...messages].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
  // Encontra creator
  const firstMeta = sorted.length > 0 ? parseNotifMeta(sorted[0].mensagem) : null
  const creatorId = firstMeta?.creatorId
  const isCreator = creatorId === currentFreelancerId
  const concluded = sorted.some(m => m.tipo === 'tarefa_concluida')

  // Última mensagem dirigida a mim (que posso responder)
  const lastForMe = [...sorted].reverse().find(m =>
    m.freelancer_id === currentFreelancerId &&
    (m.tipo === 'nova_tarefa_atribuida' || m.tipo === 'resposta_tarefa')
  )

  async function handleConcluir() {
    if (concluded || concluindo) return
    setConcluindo(true)
    try { await onConcluir() }
    finally { setConcluindo(false) }
  }

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl overflow-hidden border border-gold/30 shadow-2xl flex flex-col"
        style={{ background: 'linear-gradient(180deg, #100c08, #0a0805)', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}>
        <div className="h-0.5 w-full bg-gold/70" />
        <div className="px-6 pt-5 pb-3 border-b border-white/[0.05] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.5em] text-gold/75 uppercase mb-1">Conversação da Tarefa</p>
            <h2 className="text-xl font-light tracking-[0.05em] text-white truncate" style={{ fontFamily: 'Georgia, serif' }}>{title}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px]">
              {creatorId && (
                <span className="text-white/40">
                  Criada por <span className="text-gold/85">{nomesById[creatorId] || (firstMeta?.creatorName ?? '—')}</span>
                </span>
              )}
              <span className="text-white/25">·</span>
              <span className="text-white/40">{sorted.length} mensagem{sorted.length === 1 ? '' : 's'}</span>
              {concluded && (
                <>
                  <span className="text-white/25">·</span>
                  <span className="text-emerald-400 font-semibold">✓ Concluída</span>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all shrink-0">✕</button>
        </div>

        {/* Body — chat-like */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-3">
          {loading ? (
            <p className="text-center text-white/35 text-[12px] italic py-8">A carregar conversação…</p>
          ) : sorted.length === 0 ? (
            <p className="text-center text-white/35 text-[12px] italic py-8">Sem mensagens nesta thread.</p>
          ) : (
            sorted.map((m, i) => {
              const meta = parseNotifMeta(m.mensagem)
              const recipientName = nomesById[m.freelancer_id] ?? '—'
              const senderName = meta.senderName || nomesById[meta.senderId ?? ''] || 'Sistema'
              const isOwnSent  = meta.senderId === currentFreelancerId
              const isConcluida = m.tipo === 'tarefa_concluida'
              const dt = new Date(m.created_at)
              const tsLabel = `${dt.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} · ${dt.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
              const bubbleAccent = isConcluida
                ? 'border-emerald-500/30 bg-emerald-500/[0.08]'
                : isOwnSent
                  ? 'border-gold/30 bg-gold/[0.06]'
                  : 'border-blue-500/25 bg-blue-500/[0.05]'
              return (
                <div key={m.id || i} className={`flex ${isOwnSent ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl border px-4 py-3 ${bubbleAccent}`}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] tracking-wider uppercase font-bold ${
                        isConcluida ? 'text-emerald-300' : isOwnSent ? 'text-gold' : 'text-blue-300'
                      }`}>
                        {isConcluida ? '✓ Concluída' : isOwnSent ? `Tu` : senderName}
                      </span>
                      <span className="text-[10px] text-white/25">→ {recipientName}</span>
                      <span className="text-[10px] text-white/25 ml-auto">{tsLabel}</span>
                    </div>
                    <p className="text-[13px] text-white/85 leading-relaxed whitespace-pre-wrap">{meta.cleanMensagem || '—'}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer com ações */}
        <div className="px-6 py-4 border-t border-white/[0.05] flex items-center justify-between gap-2 bg-black/30 flex-wrap">
          <p className="text-[11px] text-white/40 italic">
            {concluded ? 'Esta tarefa já foi concluída.'
              : isCreator ? 'És o/a criador/a — podes concluir esta tarefa.'
              : 'Só quem criou a tarefa pode concluí-la.'}
          </p>
          <div className="flex items-center gap-2">
            {!concluded && lastForMe && (
              <button onClick={() => onResponder(lastForMe)}
                className="px-4 py-2 rounded-lg text-[11px] tracking-wider uppercase font-bold border border-blue-500/45 bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 hover:border-blue-400/60 transition-all"
                style={{ boxShadow: '0 0 12px -4px rgba(59,130,246,0.55)' }}>
                ↩ Responder
              </button>
            )}
            {!concluded && isCreator && (
              <button onClick={handleConcluir} disabled={concluindo}
                className="px-5 py-2 rounded-lg text-[11px] tracking-wider uppercase font-bold bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 transition-all"
                style={{ boxShadow: '0 0 14px -4px rgba(52,211,153,0.6)' }}>
                {concluindo ? 'A concluir...' : '✓ Concluir Tarefa'}
              </button>
            )}
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg text-[11px] tracking-wider uppercase text-white/55 hover:text-white border border-white/10 hover:border-white/30 transition-all">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

// ── Modal Responder à Tarefa atribuída ────────────────────────────
function ResponderTarefaModal({ notif, onClose, onSend }: { notif: Notificacao; onClose: () => void; onSend: (resposta: string) => Promise<void> | void }) {
  const [mounted, setMounted] = useState(false)
  const [resposta, setResposta] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const minLen = 5
  const valid = resposta.trim().length >= minLen
  async function submit() {
    if (!valid || sending) return
    setSending(true)
    try { await onSend(resposta.trim()) }
    finally { setSending(false) }
  }

  if (!mounted || typeof document === 'undefined') return null

  const meta = parseNotifMeta(notif.mensagem)

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-lg rounded-3xl overflow-hidden border border-blue-500/30 shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #0a1018, #060810)' }}
        onClick={e => e.stopPropagation()}>
        <div className="h-0.5 w-full bg-blue-500/70" />
        <div className="px-6 pt-5 pb-3 border-b border-white/[0.05] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.5em] text-blue-300/85 uppercase mb-1">Responder à Tarefa</p>
            <h2 className="text-lg font-light tracking-[0.05em] text-white truncate" style={{ fontFamily: 'Georgia, serif' }}>
              {notif.titulo}
            </h2>
            {meta.senderName && (
              <p className="text-[11px] text-blue-300/60 mt-1">De: {meta.senderName}</p>
            )}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all shrink-0">✕</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Tarefa original em destaque */}
          {meta.cleanMensagem && (
            <div className="bg-black/40 border border-white/[0.06] rounded-lg px-4 py-3 text-[12px] text-white/60 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
              {meta.cleanMensagem}
            </div>
          )}

          {/* Resposta */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 mb-1.5">
              A tua resposta <span className="text-red-300">*</span>
            </label>
            <textarea
              value={resposta}
              onChange={e => setResposta(e.target.value)}
              autoFocus
              rows={5}
              placeholder="Aceito a tarefa, faço até dia X… / Não consigo porque… / Já está feita, link aqui…"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400/50 resize-none leading-relaxed"
            />
            <p className={`text-[11px] mt-1.5 ${valid ? 'text-blue-300/70' : 'text-white/35'}`}>
              {resposta.trim().length}/{minLen} caracteres mínimos {valid ? '✓' : ''}
            </p>
          </div>

          <p className="text-[11px] text-white/40 italic leading-relaxed">
            A tua resposta vai aparecer no sino + email do remetente original. Esta notificação será marcada como lida automaticamente.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.05] flex items-center justify-end gap-2 bg-black/30">
          <button onClick={onClose} disabled={sending}
            className="px-4 py-2 rounded-lg text-[11px] tracking-wider uppercase text-white/55 hover:text-white border border-white/10 hover:border-white/30 transition-all disabled:opacity-40">
            Cancelar
          </button>
          <button onClick={submit} disabled={!valid || sending}
            className={`px-5 py-2 rounded-lg text-[11px] tracking-wider uppercase font-bold transition-all ${
              valid && !sending
                ? 'bg-blue-500 text-white hover:bg-blue-400'
                : 'bg-white/[0.04] text-white/25 cursor-not-allowed border border-white/10'
            }`}
            style={valid && !sending ? { boxShadow: '0 0 14px -4px rgba(59,130,246,0.6)' } : undefined}>
            {sending ? 'A enviar...' : '↩ Enviar Resposta'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
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

// ─── FotosConvidadosBox — 2 secções (Email 15d / CTT 30d) ──────────────────
function FotosConvidadosBox({
  referencia,
  estado,
  onChange,
  dataCasamento,
  isFotografo,
}: {
  referencia: string
  estado: { email: string | null; ctt: string | null; emailLista: string[]; cttLista: string[]; emailWorkflow: string; cttWorkflow: string }
  onChange: (next: { email: string | null; ctt: string | null; emailLista: string[]; cttLista: string[]; emailWorkflow: string; cttWorkflow: string }) => void
  dataCasamento: string | null
  isFotografo?: boolean
}) {
  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : null

  function deadlineInfo(prazoDias: number, enviada: string | null) {
    if (enviada || !dataCasamento) return null
    try {
      const parts = String(dataCasamento).slice(0, 10).split('-').map(Number)
      if (parts.length !== 3 || parts.some(n => !Number.isFinite(n))) return null
      const [y, m, d] = parts
      const dEvento = new Date(y, m - 1, d)
      if (isNaN(dEvento.getTime())) return null
      const deadline = new Date(dEvento.getTime() + prazoDias * 86400000)
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
      const deadlineStr = deadline.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
      return { daysLeft, deadlineStr, expired: daysLeft < 0, critical: daysLeft <= 5 }
    } catch { return null }
  }

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.03] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[11px] tracking-[0.3em] uppercase text-blue-300/80">Fotos Convidados</h3>
        {isFotografo && (
          <a
            href="https://accounts.google.com/v3/signin/accountchooser?continue=https%3A%2F%2Fdrive.google.com%2Fdrive%2Ffolders%2F1cvuMBZHxeA9nA6xC1vb3JjMdXUbevwU1&dsh=S319276986%3A1781711922233136&followup=https%3A%2F%2Fdrive.google.com%2Fdrive%2Ffolders%2F1cvuMBZHxeA9nA6xC1vb3JjMdXUbevwU1&osid=1&passive=1209600&service=wise&flowName=GlifWebSignIn&flowEntry=ServiceLogin&ifkv=AcDsRvzN8h_rmyuhYz1HzfEV5n5NF3Ontyj2K0fORlp7gypQrFtyybatpA-D5g6pnaBc7k5Mv2c3sg"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-end gap-1 group"
          >
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold tracking-[0.2em] uppercase border border-blue-500/30 bg-blue-500/10 text-blue-300 group-hover:bg-blue-500/20 transition-all">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Google Drive
            </span>
            <span className="text-[9px] text-amber-300/90 italic text-right leading-tight max-w-[160px]">Coloca aqui as fotos escolhidas pelos convidados a 70% da qualidade sem marca de água.</span>
          </a>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FotosConvidadosSub
          referencia={referencia}
          listaKey="fotos_convidados_email_lista"
          workflowKey="fotos_convidados_email_workflow"
          label="Fotos via Email"
          prazoLabel="15 dias após o evento"
          enviada={estado.email}
          deadline={deadlineInfo(15, estado.email)}
          lista={estado.emailLista}
          onListaChange={(next) => onChange({ ...estado, emailLista: next })}
          workflow={estado.emailWorkflow}
          onWorkflowChange={(next) => onChange({ ...estado, emailWorkflow: next })}
          onMark={async () => {
            const today = new Date().toISOString().split('T')[0]
            await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia, updates: { settings: { fotos_convidados_email_enviada: today } } }) })
            onChange({ ...estado, email: today })
          }}
          onReset={async () => {
            await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia, updates: { settings: { fotos_convidados_email_enviada: null } } }) })
            onChange({ ...estado, email: null })
          }}
          fmt={fmt}
        />
        <FotosConvidadosSub
          referencia={referencia}
          listaKey="fotos_convidados_ctt_lista"
          workflowKey="fotos_convidados_ctt_workflow"
          label="Fotos via CTT"
          prazoLabel="30 dias após o evento"
          enviada={estado.ctt}
          deadline={deadlineInfo(30, estado.ctt)}
          lista={estado.cttLista}
          onListaChange={(next) => onChange({ ...estado, cttLista: next })}
          workflow={estado.cttWorkflow}
          onWorkflowChange={(next) => onChange({ ...estado, cttWorkflow: next })}
          onMark={async () => {
            const today = new Date().toISOString().split('T')[0]
            await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia, updates: { settings: { fotos_convidados_ctt_enviada: today } } }) })
            onChange({ ...estado, ctt: today })
          }}
          onReset={async () => {
            await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia, updates: { settings: { fotos_convidados_ctt_enviada: null } } }) })
            onChange({ ...estado, ctt: null })
          }}
          fmt={fmt}
        />
      </div>
    </div>
  )
}

function FotosConvidadosSub({
  referencia, listaKey, workflowKey, label, prazoLabel, enviada, deadline, lista, onListaChange, workflow, onWorkflowChange, onMark, onReset, fmt,
}: {
  referencia: string
  listaKey: string
  workflowKey: string
  label: string
  prazoLabel: string
  enviada: string | null
  deadline: { daysLeft: number; deadlineStr: string; expired: boolean; critical: boolean } | null
  lista: string[]
  onListaChange: (next: string[]) => void
  workflow: string
  onWorkflowChange: (next: string) => void
  onMark: () => Promise<void>
  onReset: () => Promise<void>
  fmt: (d: string | null) => string | null
}) {
  const [busy, setBusy] = useState(false)
  const listaVazia = lista.length === 0
  const marcarBloqueado = listaVazia && !enviada
  async function handleMark() {
    if (marcarBloqueado) {
      alert('Adiciona primeiro o nome dos convidados que adquiriram fotografias na "Lista". Só depois podes marcar como enviadas.')
      return
    }
    setBusy(true); try { await onMark() } finally { setBusy(false) }
  }
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] text-white/75 font-semibold">{label}</p>
        {enviada && (
          <button onClick={onReset}
            className="w-5 h-5 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white/60 hover:border-white/30 transition-all text-[10px]"
            title="Repor como pendente">✕</button>
        )}
      </div>
      <p className="text-[10px] text-white/30 italic">Prazo: {prazoLabel}</p>
      <p className="text-[11px] font-mono">
        {enviada
          ? <span className="text-emerald-400/80">Enviadas em {fmt(enviada)}</span>
          : deadline
            ? deadline.expired
              ? <span className="text-red-400">Expirou há {Math.abs(deadline.daysLeft)} dia{Math.abs(deadline.daysLeft) === 1 ? '' : 's'} ({deadline.deadlineStr})</span>
              : deadline.critical
                ? <span className="text-amber-400">Faltam {deadline.daysLeft} dia{deadline.daysLeft === 1 ? '' : 's'} ({deadline.deadlineStr})</span>
                : <span className="text-white/50">Até {deadline.deadlineStr} ({deadline.daysLeft} dias)</span>
            : <span className="text-white/30">Pendente</span>
        }
      </p>
      {marcarBloqueado && (
        <p className="text-[10px] text-amber-300/90 bg-amber-500/[0.06] border border-amber-500/20 rounded-md px-2 py-1.5">
          ⚠ Adiciona na <strong>Lista</strong> os convidados que adquiriram fotografias para desbloquear o botão.
        </p>
      )}
      <div className="flex gap-2 mt-1 flex-wrap">
        <button
          disabled={busy || marcarBloqueado}
          onClick={handleMark}
          title={marcarBloqueado ? 'Adiciona nomes na Lista para desbloquear' : undefined}
          className={`flex-1 min-w-[140px] px-3 py-2 rounded-lg text-[10px] font-semibold tracking-[0.2em] uppercase border transition-all ${
            enviada ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : marcarBloqueado ? 'bg-white/[0.03] text-white/25 border-white/10 cursor-not-allowed'
                    : 'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25'
          } ${busy ? 'opacity-50 cursor-wait' : ''}`}
        >
          {busy ? 'A guardar…' : enviada ? '✓ Fotos Enviadas' : marcarBloqueado ? '🔒 Bloqueado' : 'Marcar Fotos Enviadas'}
        </button>
        <ListaConvidadosButton referencia={referencia} listaKey={listaKey} label={label} lista={lista} onListaChange={onListaChange} />
        <WorkflowButton referencia={referencia} workflowKey={workflowKey} label={label} workflow={workflow} onWorkflowChange={onWorkflowChange} />
      </div>
    </div>
  )
}

// ─── ListaConvidadosButton — botão "LISTA" + modal com nomes (controlado) ──
function ListaConvidadosButton({
  referencia, listaKey, label, lista, onListaChange,
}: { referencia: string; listaKey: string; label: string; lista: string[]; onListaChange: (next: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function guardar(next: string[]) {
    onListaChange(next)
    await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia, updates: { settings: { [listaKey]: next } } }) })
  }

  function adicionar() {
    const t = novoNome.trim()
    if (!t) return
    if (lista.includes(t)) { setNovoNome(''); return }
    guardar([...lista, t])
    setNovoNome('')
  }

  function remover(nome: string) {
    guardar(lista.filter(n => n !== nome))
  }

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`px-3 py-2 rounded-lg text-[10px] font-semibold tracking-[0.2em] uppercase border transition-all ${
          lista.length === 0
            ? 'border-amber-500/40 text-amber-300 bg-amber-500/[0.05] hover:bg-amber-500/[0.12] animate-pulse'
            : 'border-white/15 text-white/60 hover:bg-white/[0.05] hover:text-white/85'
        }`}>
        Lista{lista.length > 0 ? ` (${lista.length})` : ' ⚠'}
      </button>
      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}>
          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto flex flex-col gap-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
              <div>
                <p className="text-[9px] tracking-[0.4em] uppercase text-blue-300/70">Lista de Convidados</p>
                <h3 className="text-sm text-white/85 font-semibold mt-0.5">{label}</h3>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white/80 hover:border-white/30">✕</button>
            </div>

            <p className="text-[11px] text-amber-300/90 bg-amber-500/[0.06] border border-amber-500/20 rounded-md px-3 py-2 leading-snug">
              ⚠ Coloca aqui o nome dos convidados que <strong>adquiriram fotografias</strong>. Só depois consegues marcar como enviadas.
            </p>

            {lista.length === 0 ? (
              <p className="text-xs text-white/40 italic py-4 text-center">Ainda não há nomes adicionados.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {lista.map((n, i) => (
                  <li key={`${n}-${i}`} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-sm text-white/80">{n}</span>
                    <button onClick={() => remover(n)}
                      className="w-5 h-5 flex items-center justify-center rounded-full text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs">✕</button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
              <input
                type="text"
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionar() } }}
                placeholder="Nome do convidado…"
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/85 placeholder-white/25 focus:outline-none focus:border-blue-400/40"
                autoFocus
              />
              <button onClick={adicionar}
                disabled={!novoNome.trim()}
                className="px-4 py-2 rounded-lg text-[11px] font-semibold tracking-[0.2em] uppercase border bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                + Adicionar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ─── Templates predefinidos por canal ───────────────────────────────────────
const WORKFLOW_DEFAULTS: Record<string, string> = {
  fotos_convidados_email_workflow:
    'Enviar todas as fotos sem marca de água com qualidade 70% para fotos.rlphoto@gmail.com.\n\nTodas as fotos por via email são enviadas através do nosso email fotos.rlphoto@gmail.com.',
  fotos_convidados_ctt_workflow: '',
}

// ─── WorkflowButton — botão "+ Workflow" + modal com textarea (controlado) ──
function WorkflowButton({
  referencia, workflowKey, label, workflow, onWorkflowChange,
}: { referencia: string; workflowKey: string; label: string; workflow: string; onWorkflowChange: (next: string) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(workflow)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (open) setDraft(workflow || WORKFLOW_DEFAULTS[workflowKey] || '')
  }, [open, workflow, workflowKey])

  async function guardar() {
    setSaving(true)
    try {
      onWorkflowChange(draft)
      await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia, updates: { settings: { [workflowKey]: draft } } }) })
      setOpen(false)
    } finally { setSaving(false) }
  }

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button onClick={() => setOpen(true)}
        title={workflow ? 'Ver / editar workflow' : 'Adicionar workflow de envio'}
        className={`px-3 py-2 rounded-lg text-[10px] font-semibold tracking-[0.2em] uppercase border transition-all ${
          workflow
            ? 'border-[#c9a96e]/40 text-[#c9a96e] bg-[#c9a96e]/[0.06] hover:bg-[#c9a96e]/[0.12]'
            : 'border-white/15 text-white/60 hover:bg-white/[0.05] hover:text-white/85'
        }`}>
        {workflow ? '✓ Workflow' : '+ Workflow'}
      </button>
      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(14,11,7,0.92)', backdropFilter: 'blur(6px)' }}
          onClick={() => setOpen(false)}>
          <div className="relative max-w-xl w-full max-h-[90vh] overflow-y-auto"
            style={{ background: '#120e09', border: '0.5px solid #4a3a1e', fontFamily: 'Georgia, "Times New Roman", serif' }}
            onClick={e => e.stopPropagation()}>

            {/* Corner ornaments (top) */}
            <div className="absolute top-0 left-0 w-[50px] h-[50px] pointer-events-none" style={{ borderTop: '0.5px solid #3a2a12', borderLeft: '0.5px solid #3a2a12' }} />
            <div className="absolute top-0 right-0 w-[50px] h-[50px] pointer-events-none" style={{ borderTop: '0.5px solid #3a2a12', borderRight: '0.5px solid #3a2a12' }} />

            {/* Close */}
            <button onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#7a6340] hover:text-[#c9a96e] transition-colors text-base z-10"
              title="Fechar (Esc)">✕</button>

            <div className="px-12 pt-12 pb-10 flex flex-col gap-6">
              {/* Header */}
              <div className="text-center">
                <p className="text-[9px] tracking-[0.5em] uppercase mb-3" style={{ color: '#7a6340' }}>Workflow de Envio</p>
                <h2 className="text-[28px] leading-tight" style={{ color: '#f0e8d8', fontWeight: 400 }}>{label.split(' via ')[0]}</h2>
                {label.includes(' via ') && (
                  <p className="text-[22px] italic mt-0.5" style={{ color: '#c9a96e', fontWeight: 300 }}>via {label.split(' via ')[1]}</p>
                )}
                <div className="my-5 text-[12px] tracking-[0.35em]" style={{ color: '#6a5430' }}>&mdash;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&mdash;</div>
              </div>

              {/* Description */}
              <p className="text-[13px] italic leading-relaxed text-center" style={{ color: '#a09070' }}>
                Descreve o procedimento de envio das fotos aos convidados —<br/>passos, contactos e observações.
              </p>

              {/* Textarea */}
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Os passos do envio…"
                rows={10}
                spellCheck={false}
                style={{ fontFamily: 'Georgia, "Times New Roman", serif', background: '#0e0b07', borderColor: '#4a3a1e', color: '#d4c9b0' }}
                className="w-full border px-5 py-4 text-[14px] leading-[1.7] focus:outline-none resize-y min-h-[200px] placeholder:text-[#5a4f3a] placeholder:italic"
                onFocus={e => e.currentTarget.style.borderColor = '#c9a96e'}
                onBlur={e => e.currentTarget.style.borderColor = '#4a3a1e'}
                autoFocus
              />

              {/* Actions */}
              <div className="flex gap-4 pt-2 justify-end items-center">
                <button onClick={() => setOpen(false)}
                  className="px-5 py-3 text-[10px] tracking-[0.4em] uppercase transition-colors"
                  style={{ color: '#7a6340' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#c9a96e'}
                  onMouseLeave={e => e.currentTarget.style.color = '#7a6340'}>
                  Cancelar
                </button>
                <button onClick={guardar} disabled={saving}
                  className="px-8 py-3 text-[10px] tracking-[0.4em] uppercase transition-all disabled:opacity-50 disabled:cursor-wait"
                  style={{ background: 'transparent', color: '#c9a96e', border: '0.5px solid #c9a96e' }}
                  onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = '#c9a96e'; e.currentTarget.style.color = '#0e0b07' } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c9a96e' }}>
                  {saving ? 'A guardar…' : 'Guardar'}
                </button>
              </div>

              {/* Footer mark */}
              <p className="text-[9px] tracking-[0.5em] uppercase text-center mt-2" style={{ color: '#3a2a12' }}>RL Photo · Video</p>
            </div>

            {/* Corner ornaments (bottom) */}
            <div className="absolute bottom-0 left-0 w-[50px] h-[50px] pointer-events-none" style={{ borderBottom: '0.5px solid #3a2a12', borderLeft: '0.5px solid #3a2a12' }} />
            <div className="absolute bottom-0 right-0 w-[50px] h-[50px] pointer-events-none" style={{ borderBottom: '0.5px solid #3a2a12', borderRight: '0.5px solid #3a2a12' }} />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ─── UrlEntryCard — card de URL com estado local + botão enviar notificação ───
const STATUS_OPTIONS_BY_TIPO: Record<string, string[]> = {
  selecao:  ['AGUARDAR', 'EM SELEÇÃO', 'SELECIONADAS', 'ENTREGUE'],
  editadas: ['AGUARDAR', 'EM EDIÇÃO',  'EDITADAS',     'ENTREGUE'],
  provas:   ['AGUARDAR', 'GALERIA PUBLICADA'],
  album:    ['AGUARDAR', 'EM EDIÇÃO',  'CONCLUIDO',    'ENTREGUE'],
}
const STATUS_CLS: Record<string, string> = {
  'AGUARDAR':          'bg-white/[0.06] text-white/55 border-white/15',
  'EM EDIÇÃO':         'bg-amber-500/15 text-amber-300 border-amber-500/40',
  'EM SELEÇÃO':        'bg-amber-500/15 text-amber-300 border-amber-500/40',
  'EDITADAS':          'bg-blue-500/15 text-blue-300 border-blue-500/40',
  'SELECIONADAS':      'bg-blue-500/15 text-blue-300 border-blue-500/40',
  'CONCLUIDO':         'bg-blue-500/15 text-blue-300 border-blue-500/40',
  'GALERIA PUBLICADA': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  'ENTREGUE':          'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
}
const STATUS_COL_BY_TIPO: Record<string, string> = {
  selecao:  'status_selecao',
  editadas: 'status_editadas',
  provas:   'status_provas',
  album:    'status_album',
}
const STATUS_LABEL_BY_TIPO: Record<string, string> = {
  selecao:  'Estado da Seleção',
  editadas: 'Estado da Edição',
  provas:   'Estado das Provas',
  album:    'Estado do Álbum',
}

/** Timeline vertical de passos: bola numerada · traço · bola numerada · ... */
function WorkflowTimeline({ text }: { text: string }) {
  // Cada linha = um passo. Remove prefixos numéricos ("1.", "1)", "1 -")
  // para evitar duplicação com o número da bola.
  const steps = text
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.replace(/^\d+[\.\)\-:\s]+\s*/, '').trim())
    .filter(Boolean)

  if (steps.length === 0) return null
  return (
    <ol className="relative space-y-3 pl-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        return (
          <li key={i} className="relative flex items-start gap-4">
            {/* Bola numerada */}
            <span className="relative shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full font-bold text-[13px] z-10"
              style={{
                background: 'linear-gradient(180deg, #fb923c 0%, #ea7c1f 100%)',
                color: '#1a0f06',
                boxShadow: '0 4px 10px -2px rgba(251,146,60,0.45), inset 0 0 0 1px rgba(255,255,255,0.18)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}>
              {i + 1}
            </span>
            {/* Traço de ligação para a bola seguinte */}
            {!isLast && (
              <span aria-hidden className="absolute pointer-events-none"
                style={{
                  left: '17px',
                  top: '36px',
                  bottom: '-12px',
                  width: '2px',
                  background: 'linear-gradient(180deg, rgba(251,146,60,0.55), rgba(251,146,60,0.18))',
                  borderRadius: '2px',
                }} />
            )}
            {/* Texto do passo */}
            <p className="flex-1 pt-1.5 text-[13.5px] text-white/85 leading-[1.55] whitespace-pre-wrap">
              {step}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

function UrlEntryCard({
  field,
  casamentoId,
  casamentoLocal,
  casamentoData,
  casamentoReferencia,
  fotosDataEntrada,
  freelancerNome,
  initialUrl,
  initialSentAt,
  initialStatus,
  lockedReason,
  isAdmin,
  onRefresh,
}: {
  field: { key: string; ts: string; tipo: string; label: string; icon: string }
  casamentoId: string
  casamentoLocal: string
  casamentoData: string | null
  casamentoReferencia?: string | null
  fotosDataEntrada?: string | null
  freelancerNome: string
  initialUrl: string
  initialSentAt: string | null
  initialStatus?: string | null
  lockedReason?: string | null
  isAdmin?: boolean
  onRefresh: () => void
}) {
  // Admin ignora todos os locks — pode mudar qualquer estado em qualquer altura
  // e atualizar o URL mesmo sem o status ser ENTREGUE.
  const locked = !isAdmin && !!lockedReason
  // Estado LOCAL — não desaparece quando lista re-renderiza
  const [url, setUrl] = useState(initialUrl ?? '')
  const [sentAt, setSentAt] = useState<string | null>(initialSentAt ?? null)
  const [status, setStatus] = useState<string>(initialStatus ?? 'AGUARDAR')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)

  // ── Workflow modal (admin escreve, todos lêem) ─────────────────────────
  //    Persistência: portais.settings.workflow_<tipo> com referencia
  //    especial '__app_workflow__' (linha global, partilhada entre eventos).
  const WORKFLOW_REF = '__app_workflow__'
  const workflowKey = `workflow_${field.tipo}`
  const [workflowOpen, setWorkflowOpen]     = useState(false)
  const [workflowText, setWorkflowText]     = useState<string>('')
  const [workflowDraft, setWorkflowDraft]   = useState<string>('')
  const [workflowSaving, setWorkflowSaving] = useState(false)
  const [workflowLoaded, setWorkflowLoaded] = useState(false)

  // Carrega o texto guardado (uma vez por mount)
  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        const r = await fetch(`/api/portais?ref=${encodeURIComponent(WORKFLOW_REF)}`, { cache: 'no-store' })
        const j = await r.json().catch(() => ({}))
        const txt = j?.portal?.settings?.[workflowKey] ?? ''
        if (!cancel) {
          setWorkflowText(typeof txt === 'string' ? txt : '')
          setWorkflowLoaded(true)
        }
      } catch {
        if (!cancel) setWorkflowLoaded(true)
      }
    })()
    return () => { cancel = true }
  }, [workflowKey])

  async function saveWorkflow() {
    if (!isAdmin) return
    setWorkflowSaving(true)
    try {
      const res = await fetch('/api/portais', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referencia: WORKFLOW_REF,
          updates: { settings: { [workflowKey]: workflowDraft } },
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert('Falha ao guardar workflow: ' + (j.error ?? res.status))
        return
      }
      setWorkflowText(workflowDraft)
      setWorkflowOpen(false)
    } catch (err: any) {
      alert('Erro ao guardar: ' + (err?.message ?? 'desconhecido'))
    } finally {
      setWorkflowSaving(false)
    }
  }

  function openWorkflow() {
    setWorkflowDraft(workflowText)
    setWorkflowOpen(true)
  }

  // Sync com props quando refresh externo
  useEffect(() => { setUrl(initialUrl ?? '') }, [initialUrl])
  useEffect(() => { setSentAt(initialSentAt ?? null) }, [initialSentAt])
  useEffect(() => { if (initialStatus) setStatus(initialStatus) }, [initialStatus])

  async function saveStatus(newStatus: string) {
    if (newStatus === status) return
    const previous = status
    setStatus(newStatus)
    setSavingStatus(true)
    try {
      const statusCol = STATUS_COL_BY_TIPO[field.tipo]
      if (!statusCol) return
      const res = await fetch('/api/freelancer-casamentos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: casamentoId, [statusCol]: newStatus }),
      })
      const data = await res.json().catch(() => ({}))

      // Se a coluna não existir, devolve `failed: { [col]: msg }`
      const columnMissing = !!(data?.failed && data.failed[statusCol])

      if (columnMissing) {
        // ADMIN BYPASS — quando a coluna ainda não foi adicionada à DB,
        // guarda em portais.settings.<statusCol>. Mantém a UI a refletir
        // o novo estado e o portal /photo/admin lê este fallback.
        // (O membro normal não chega aqui porque o backend faz allow
        //  para admin; mas se chegar, mostramos a mensagem clássica.)
        if (isAdmin && casamentoReferencia) {
          try {
            const pRes = await fetch('/api/portais', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                referencia: casamentoReferencia,
                updates: { settings: { [statusCol]: newStatus } },
              }),
            })
            if (pRes.ok) {
              // Sucesso via fallback — mantém UI e sincroniza parent
              onRefresh()
              return
            }
          } catch { /* cai para o alert abaixo */ }
        }
        console.error(`[saveStatus] ${statusCol} falhou:`, data.failed[statusCol])
        // Reverte localmente
        setStatus(previous)
        alert(`Não foi possível guardar o estado.\n\nA coluna "${statusCol}" não existe na base de dados.\n\nPara resolver, corre o seguinte SQL no Supabase:\n\nALTER TABLE freelancer_casamentos\nADD COLUMN IF NOT EXISTS status_selecao TEXT,\nADD COLUMN IF NOT EXISTS status_editadas TEXT,\nADD COLUMN IF NOT EXISTS status_album TEXT,\nADD COLUMN IF NOT EXISTS status_provas TEXT;`)
        return
      }

      // Sucesso → sincroniza dados do parent (cache pode estar stale)
      onRefresh()
    } finally { setSavingStatus(false) }
  }

  const sentAtFmt = sentAt
    ? new Date(sentAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null
  const hasUrl = url.trim().length > 0

  // ── URL apenas editável quando status = ENTREGUE (Seleção & Fotos Editadas) ──
  // O membro só pode colar o link quando marca o trabalho como entregue.
  // ADMIN: bypass total — pode editar o URL em qualquer estado.
  const urlBlockedByStatus = !isAdmin && (field.tipo === 'selecao' || field.tipo === 'editadas') && status !== 'ENTREGUE'
  const urlLocked = locked || urlBlockedByStatus

  // ── 'Ver Fotos Selecionadas pelos Noivos' (Fotos Editadas + Maquete Álbum) ──
  // Botão visível assim que status passa de AGUARDAR (i.e., EM EDIÇÃO em diante).
  // Abre um MODAL inline (não nova janela) com a ficha da seleção.
  const editorTipo = field.tipo === 'editadas' || field.tipo === 'album'
  const editadasUnlocked = editorTipo && status !== 'AGUARDAR'
  const [openingSelecao, setOpeningSelecao] = useState(false)
  const [selecaoPreview, setSelecaoPreview] = useState<any | null>(null)
  const [selecaoError, setSelecaoError] = useState<string | null>(null)

  async function abrirFotosSelecionadas() {
    if (!casamentoReferencia) {
      setSelecaoError('Esta atribuição não tem referência associada — peça ao admin para a definir na ficha do evento.')
      return
    }
    setOpeningSelecao(true); setSelecaoError(null)
    try {
      const res = await fetch(`/api/fotos-selecao-by-ref?ref=${encodeURIComponent(casamentoReferencia)}`).then(r => r.json())
      const row = res?.row
      if (row?.id) {
        setSelecaoPreview(row)
      } else {
        setSelecaoError('Os noivos ainda não submeteram a seleção de fotos para edição. Quando o fizerem aparece aqui.')
      }
    } catch (e) {
      setSelecaoError('Não foi possível abrir a seleção. Tenta de novo dentro de momentos.')
    } finally { setOpeningSelecao(false) }
  }

  // Fechar modal com Escape
  useEffect(() => {
    if (!selecaoPreview && !selecaoError) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setSelecaoPreview(null); setSelecaoError(null) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selecaoPreview, selecaoError])

  // ── Aviso de prazo ────────────────────────────────────────────
  //   - Seleção de Fotos: 30 dias após o evento (casamentoData)
  //   - Fotos Editadas:   30 dias após os noivos enviarem (fotosDataEntrada)
  //   - Maquete Álbum:    30 dias após os noivos enviarem (fotosDataEntrada)
  const deadlineNotice = (() => {
    if (sentAt) return null
    let baseDateStr: string | null = null
    if (field.tipo === 'selecao') baseDateStr = casamentoData
    else if (field.tipo === 'editadas' || field.tipo === 'album') baseDateStr = fotosDataEntrada ?? null
    if (!baseDateStr) return null
    try {
      const dateStr = String(baseDateStr).slice(0, 10)
      const parts = dateStr.split('-').map(Number)
      if (parts.length !== 3 || parts.some(n => !Number.isFinite(n))) return null
      const [y, m, d] = parts
      const dBase = new Date(y, m - 1, d)
      if (isNaN(dBase.getTime())) return null
      const deadline = new Date(dBase.getTime() + 30 * 86400000)
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
      const dd = String(deadline.getDate()).padStart(2, '0')
      const deadlineStr = `${dd} ${MESES[deadline.getMonth()]} ${deadline.getFullYear()}`
      const expired = daysLeft < 0
      const critical = daysLeft <= 5
      const urgent = daysLeft <= 15
      return { daysLeft, deadlineStr, expired, critical, urgent }
    } catch { return null }
  })()

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
    <div className={`relative rounded-xl border bg-black/30 p-3.5 flex flex-col gap-2.5 ${locked ? 'border-white/[0.04] opacity-60' : 'border-white/[0.06]'}`}>
      {/* Lock overlay com ícone + mensagem */}
      {locked && (
        <div className="absolute top-2 right-2 z-10" title={lockedReason ?? ''}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gold/70 text-base">{field.icon}</span>
          <p className="text-[12px] tracking-[0.25em] uppercase text-white/60 font-light">{field.label}</p>
          {/* Botão alerta workflow — laranja pulsante; admin SEMPRE vê,
              freelancer só vê se houver workflow guardado para ler */}
          {(isAdmin || (workflowLoaded && workflowText.trim().length > 0)) && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openWorkflow() }}
              title={workflowText.trim() ? 'Ver workflow' : 'Adicionar workflow'}
              className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full border transition-all"
              style={{
                background: workflowText.trim() ? 'rgba(251,146,60,0.18)' : 'rgba(251,146,60,0.06)',
                borderColor: workflowText.trim() ? 'rgba(251,146,60,0.55)' : 'rgba(251,146,60,0.30)',
                color: '#fb923c',
                animation: workflowText.trim() ? 'workflowPulse 2.4s ease-in-out infinite' : undefined,
                boxShadow: workflowText.trim() ? '0 0 10px -2px rgba(251,146,60,0.45)' : undefined,
              }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </button>
          )}
        </div>
        {hasUrl && !locked && (
          <a href={url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[11px] text-gold/80 hover:text-gold tracking-wider uppercase transition-colors">
            Abrir ↗
          </a>
        )}
      </div>

      {/* Aviso de prazo (Seleção de Fotos: 30 dias após o evento) */}
      {deadlineNotice && (
        <div className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border ${
          deadlineNotice.critical
            ? 'border-red-500/40 bg-red-500/[0.08]'
            : deadlineNotice.urgent
              ? 'border-amber-500/30 bg-amber-500/[0.06]'
              : 'border-gold/20 bg-gold/[0.04]'
        }`}>
          <span className={`text-[11px] tracking-wider uppercase font-semibold ${
            deadlineNotice.critical ? 'text-red-300' : deadlineNotice.urgent ? 'text-amber-300' : 'text-gold/85'
          }`}>
            ⏱ Prazo {deadlineNotice.deadlineStr}
          </span>
          <span className={`text-[11px] font-bold tabular-nums whitespace-nowrap ${
            deadlineNotice.critical ? 'text-red-300' : deadlineNotice.urgent ? 'text-amber-300' : 'text-gold/85'
          }`}>
            {deadlineNotice.expired
              ? `+${Math.abs(deadlineNotice.daysLeft)}d atraso`
              : deadlineNotice.daysLeft === 0
                ? 'HOJE'
                : `${deadlineNotice.daysLeft}d`}
          </span>
        </div>
      )}

      <input
        type="url"
        value={url}
        placeholder={locked ? 'Bloqueado' : urlBlockedByStatus ? 'Disponível ao marcar ENTREGUE' : 'https://...'}
        disabled={urlLocked}
        onClick={e => e.stopPropagation()}
        onChange={e => setUrl(e.target.value)}
        onBlur={e => saveUrl(e.target.value.trim())}
        className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-[13px] outline-none transition-colors ${
          urlLocked ? 'border-white/[0.04] text-white/30 cursor-not-allowed' : 'border-white/[0.06] text-white/90 placeholder:text-white/25 focus:border-gold/40'
        }`}
      />
      {/* Mostra 'Enviado · data' SÓ se o estado actual for um dos estados de entrega
          final ('ENTREGUE' ou 'GALERIA PUBLICADA'). Se o admin reverteu o estado,
          o trabalho deixou de estar entregue → mostra de novo o botão Enviar. */}
      {sentAtFmt && (status === 'ENTREGUE' || status === 'GALERIA PUBLICADA') ? (
        <div className="flex items-center justify-between text-[12px]">
          <span className="inline-flex items-center gap-1 text-emerald-400/90 tracking-wider uppercase font-semibold">
            ✓ Enviado · {sentAtFmt}
          </span>
          {hasUrl && !urlLocked && (
            <button onClick={e => { e.stopPropagation(); enviarNotificacao() }}
              disabled={sending}
              className="text-white/40 hover:text-gold tracking-wider uppercase transition-colors disabled:opacity-50">
              {sending ? '...' : '↻ Reenviar'}
            </button>
          )}
        </div>
      ) : (
        <button
          disabled={urlLocked || !hasUrl || sending}
          onClick={e => { e.stopPropagation(); enviarNotificacao() }}
          className={`w-full text-[12px] tracking-wider uppercase font-semibold rounded-lg px-2.5 py-2 transition-all ${
            !urlLocked && hasUrl
              ? 'bg-gold text-black hover:bg-gold/90'
              : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.06]'
          } ${sending ? 'opacity-50' : ''}`}
          style={!urlLocked && hasUrl ? { boxShadow: '0 0 12px -4px rgba(201,164,92,0.5)' } : undefined}>
          {sending ? 'A enviar...' : sentAtFmt ? '↻ Reenviar Notificação' : '✉ Enviar Notificação'}
        </button>
      )}
      {locked && lockedReason && (
        <p className="text-[11px] text-white/45 italic leading-relaxed mt-1">🔒 {lockedReason}</p>
      )}

      {/* Botão Ver Fotos Selecionadas pelos Noivos (Fotos Editadas + Maquete Álbum, status > AGUARDAR) */}
      {editorTipo && !locked && (
        editadasUnlocked ? (
          <button onClick={e => { e.stopPropagation(); abrirFotosSelecionadas() }}
            disabled={openingSelecao}
            className="w-full text-[12px] tracking-wider uppercase font-semibold rounded-lg px-2.5 py-2 transition-all bg-blue-500/15 border border-blue-500/40 text-blue-200 hover:bg-blue-500/25 hover:border-blue-400/60 disabled:opacity-50 flex items-center justify-center gap-1.5"
            style={{ boxShadow: '0 0 10px -4px rgba(59,130,246,0.5)' }}>
            {openingSelecao
              ? 'A abrir...'
              : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> Ver Fotos Selecionadas pelos Noivos ↗</>
            }
          </button>
        ) : (
          <div className="w-full text-[11px] tracking-wider uppercase font-semibold rounded-lg px-2.5 py-2 bg-white/[0.03] border border-white/10 text-white/30 flex items-center justify-center gap-1.5 cursor-not-allowed">
            🔒 Ver Fotos Selecionadas pelos Noivos
          </div>
        )
      )}

      {/* Notice — diferencia entre Seleção de Fotos e Fotos Editadas */}
      {!locked && urlBlockedByStatus && field.tipo === 'editadas' && (
        <p className="text-[11px] text-amber-300/80 italic leading-relaxed mt-1 px-1">
          ⓘ Muda o estado para <span className="font-bold not-italic uppercase text-amber-200">Em Edição</span> para teres acesso às fotos escolhidas pelos noivos. Prazo de <span className="font-bold not-italic text-amber-200">30 dias</span> após o envio das fotos pelos noivos. O link da pasta editada só fica disponível ao marcar <span className="font-bold not-italic uppercase text-amber-200">Entregue</span>. Cada alteração de estado atualiza automaticamente o portal dos noivos ("Fotos para Edição").
        </p>
      )}
      {!locked && urlBlockedByStatus && field.tipo === 'selecao' && (
        <p className="text-[11px] text-amber-300/80 italic leading-relaxed mt-1 px-1">
          ⓘ O link só fica disponível quando marcares o trabalho como <span className="font-bold not-italic uppercase">Entregue</span> abaixo. Ao mudar para Entregue, o portal dos noivos também é atualizado automaticamente.
        </p>
      )}
      {!locked && field.tipo === 'album' && status === 'AGUARDAR' && (
        <p className="text-[11px] text-amber-300/80 italic leading-relaxed mt-1 px-1">
          ⓘ Muda o estado para <span className="font-bold not-italic uppercase text-amber-200">Em Edição</span> para teres acesso às fotos escolhidas pelos noivos. Prazo de <span className="font-bold not-italic text-amber-200">30 dias</span> após o envio das fotos pelos noivos. Cada alteração de estado atualiza automaticamente o portal dos noivos.
        </p>
      )}
      {saving && <p className="text-[11px] text-gold/50 italic">A guardar URL...</p>}

      {/* Estado — para Seleção, Provas e Editadas */}
      {STATUS_OPTIONS_BY_TIPO[field.tipo] && (() => {
        const options = STATUS_OPTIONS_BY_TIPO[field.tipo]
        const currentIdx = options.indexOf(status)
        return (
          <div className="pt-2.5 mt-1 border-t border-white/[0.04]">
            <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 mb-1.5">
              {STATUS_LABEL_BY_TIPO[field.tipo] ?? 'Estado'}
            </p>
            <div className="grid grid-cols-2 gap-1">
              {options.map((opt, idx) => {
                const active = status === opt
                // Estados anteriores ao atual ficam bloqueados para o freelancer (workflow one-way).
                // Admin pode voltar atrás livremente.
                const isPrevious = !isAdmin && currentIdx >= 0 && idx < currentIdx
                const isDisabled = locked || isPrevious
                return (
                  <button key={opt}
                    disabled={isDisabled}
                    title={isPrevious ? 'Estado anterior bloqueado — não é possível voltar atrás' : isAdmin && currentIdx >= 0 && idx < currentIdx ? 'Admin pode reverter para este estado' : undefined}
                    onClick={e => { e.stopPropagation(); if (!isDisabled) saveStatus(opt) }}
                    className={`relative text-[11px] px-2 py-1.5 rounded-md tracking-wider uppercase font-semibold border transition-all ${
                      locked
                        ? 'opacity-40 cursor-not-allowed'
                        : isPrevious
                          ? 'opacity-35 cursor-not-allowed bg-white/[0.02] text-white/35 border-white/[0.05]'
                          : ''
                    } ${
                      active
                        ? STATUS_CLS[opt]
                        : !isPrevious && !locked
                          ? 'bg-transparent text-white/45 border-white/[0.06] hover:text-white/75 hover:border-white/15'
                          : 'bg-transparent text-white/30 border-white/[0.04]'
                    }`}>
                    {isPrevious && <span className="absolute top-1 right-1.5 text-[8px] opacity-60">🔒</span>}
                    {opt}
                  </button>
                )
              })}
            </div>
            {savingStatus
              ? <p className="text-[10px] text-gold/50 italic mt-1">A guardar...</p>
              : isAdmin && status !== (initialStatus ?? 'AGUARDAR')
                ? <p className="text-[10px] text-emerald-400/85 italic mt-1">✓ Estado atualizado pelo admin</p>
                : null}
          </div>
        )
      })()}

      {/* ── Modal Preview: Seleção dos Noivos (Fotos Editadas) ── */}
      {(selecaoPreview || selecaoError) && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => { setSelecaoPreview(null); setSelecaoError(null) }}>
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl overflow-hidden border border-gold/25 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #100c08, #0b0905)' }}
            onClick={e => e.stopPropagation()}>
            {/* Linha gold no topo */}
            <div className="h-0.5 w-full bg-gold/60" />

            {/* Header */}
            <div className="px-7 sm:px-8 pt-6 pb-4 border-b border-white/[0.05] flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] tracking-[0.5em] text-gold/65 uppercase mb-1.5">Seleção dos Noivos</p>
                <h2 className="text-2xl sm:text-3xl font-light tracking-[0.12em] text-white uppercase truncate" style={{ fontFamily: 'Georgia, serif' }}>
                  {selecaoPreview?.nome_noivos || casamentoLocal || '—'}
                </h2>
                {selecaoPreview?.referencia && (
                  <p className="text-[11px] text-white/35 mt-1 tracking-widest">{selecaoPreview.referencia}</p>
                )}
              </div>
              <button onClick={() => { setSelecaoPreview(null); setSelecaoError(null) }}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all shrink-0"
                title="Fechar (Esc)">✕</button>
            </div>

            {/* Body */}
            <div className="px-7 sm:px-8 py-5 max-h-[70vh] overflow-y-auto">
              {selecaoError ? (
                <div className="py-8 text-center">
                  <p className="text-2xl opacity-30 mb-2">📷</p>
                  <p className="text-[13px] text-white/55 italic leading-relaxed">{selecaoError}</p>
                </div>
              ) : selecaoPreview && (() => {
                const counts: Array<{ label: string; value: string | null }> = [
                  { label: 'Sessão Noivos',  value: selecaoPreview.sessao_noivos },
                  { label: 'Fotos da Noiva', value: selecaoPreview.fotos_noiva },
                  { label: 'Fotos do Noivo', value: selecaoPreview.fotos_noivo },
                  { label: 'Convidados',     value: selecaoPreview.convidados },
                  { label: 'Cerimónia',      value: selecaoPreview.cerimonia },
                  { label: 'Bolo & Bouquet', value: selecaoPreview.bolo_bouquet },
                  { label: 'Sala & Animação',value: selecaoPreview.sala_animacao },
                  { label: 'Fotos p/ Álbum', value: selecaoPreview.fotos_album },
                ]
                const totalFotos = counts.reduce((acc, c) => {
                  const n = Number(c.value); return acc + (Number.isFinite(n) ? n : 0)
                }, 0)
                const fmt = (d: string | null | undefined) => {
                  if (!d) return '—'
                  try {
                    const dt = new Date(d)
                    return dt.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
                  } catch { return d }
                }
                return (
                  <>
                    {/* Datas */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Data do Evento</p>
                        <p className="text-[14px] text-white/85 font-medium">{fmt(selecaoPreview.date)}</p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Data de Entrada</p>
                        <p className="text-[14px] text-white/85 font-medium">{fmt(selecaoPreview.data_entrada)}</p>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="mb-5 rounded-2xl border border-gold/30 p-5"
                      style={{
                        background: 'linear-gradient(135deg, rgba(201,164,92,0.10), rgba(201,164,92,0.02))',
                        boxShadow: '0 0 24px -8px rgba(201,164,92,0.3), inset 0 0 0 1px rgba(201,164,92,0.10)',
                      }}>
                      <p className="text-[10px] tracking-[0.4em] text-gold/70 uppercase mb-1.5">Total de Fotos para Edição</p>
                      <p className="text-4xl sm:text-5xl font-light text-gold tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>
                        {totalFotos.toLocaleString('pt-PT')}
                      </p>
                    </div>

                    {/* Contagens */}
                    <p className="text-[10px] tracking-[0.4em] text-white/35 uppercase mb-2">Contagem de Fotos</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                      {counts.map(c => (
                        <div key={c.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                          <p className="text-[9px] tracking-[0.25em] text-white/30 uppercase mb-1 leading-tight">{c.label}</p>
                          <p className="text-xl text-white/90 font-light tabular-nums leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                            {c.value || '—'}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Detalhes */}
                    {selecaoPreview.detalhes && (
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <p className="text-[10px] tracking-[0.4em] text-white/35 uppercase mb-2">Detalhes & Observações</p>
                        <p className="text-[13px] text-white/75 leading-relaxed whitespace-pre-wrap">{selecaoPreview.detalhes}</p>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Footer */}
            <div className="px-7 sm:px-8 py-3 border-t border-white/[0.05] flex items-center justify-between bg-black/30">
              <p className="text-[9px] tracking-[0.4em] text-white/20 uppercase">RL Photo · Video</p>
              <button onClick={() => { setSelecaoPreview(null); setSelecaoError(null) }}
                className="text-[10px] tracking-widest uppercase text-white/35 hover:text-gold transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal Workflow (alerta laranja) ──────────────────────────── */}
      {workflowOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          onClick={() => setWorkflowOpen(false)}>
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <div className="relative z-10 w-full max-w-xl rounded-3xl overflow-hidden border shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, #1a0f06, #0b0905)',
              borderColor: 'rgba(251,146,60,0.35)',
              boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7), 0 0 24px -4px rgba(251,146,60,0.25)',
            }}
            onClick={e => e.stopPropagation()}>
            <div className="h-1 w-full" style={{ background: '#fb923c' }} />

            {/* Header */}
            <div className="px-7 sm:px-8 pt-6 pb-4 border-b border-white/[0.05] flex items-start justify-between gap-4">
              <div className="min-w-0 flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                  style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.4)', color: '#fb923c' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </span>
                <div>
                  <p className="text-[10px] tracking-[0.5em] uppercase font-bold" style={{ color: '#fb923c' }}>Workflow</p>
                  <h2 className="text-xl font-light tracking-[0.12em] text-white uppercase mt-1" style={{ fontFamily: 'Georgia, serif' }}>
                    {field.label}
                  </h2>
                </div>
              </div>
              <button onClick={() => setWorkflowOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all shrink-0"
                title="Fechar">{'✕'}</button>
            </div>

            {/* Body */}
            <div className="px-7 sm:px-8 py-5 max-h-[65vh] overflow-y-auto">
              {isAdmin ? (
                <>
                  <p className="text-[11px] tracking-widest uppercase font-bold mb-2" style={{ color: 'rgba(251,146,60,0.85)' }}>
                    Modo edição (admin) · uma etapa por linha
                  </p>
                  <p className="text-[12px] text-white/55 italic mb-3 leading-relaxed">
                    Escreve cada passo do workflow numa linha separada. Aparecerá como uma sequência numerada de bolas ligadas por um traço.
                  </p>
                  <textarea
                    value={workflowDraft}
                    onChange={(e) => setWorkflowDraft(e.target.value)}
                    rows={7}
                    placeholder={'Ex:\nConfirma com os noivos que receberam o link\nMarca como ENTREGUE\nAguarda confirmacao para a fase seguinte'}
                    className="w-full bg-black/30 border border-white/10 focus:border-orange-500/40 rounded-lg px-3.5 py-3 text-[13.5px] text-white outline-none placeholder:text-white/20 resize-none leading-relaxed transition-colors"
                  />
                  {workflowDraft.trim().length > 0 && (
                    <div className="mt-5 pt-4 border-t border-white/[0.06]">
                      <p className="text-[10px] tracking-widest uppercase font-bold mb-3" style={{ color: 'rgba(251,146,60,0.7)' }}>
                        Pré-visualização
                      </p>
                      <WorkflowTimeline text={workflowDraft} />
                    </div>
                  )}
                </>
              ) : (
                workflowText.trim().length > 0 ? (
                  <WorkflowTimeline text={workflowText} />
                ) : (
                  <p className="text-[13px] text-white/40 italic leading-relaxed">
                    Ainda nao existe workflow definido para esta seccao.
                  </p>
                )
              )}
            </div>

            {/* Footer */}
            <div className="px-7 sm:px-8 py-3 border-t border-white/[0.05] flex items-center justify-between bg-black/30">
              <p className="text-[9px] tracking-[0.4em] text-white/20 uppercase">Workflow Interno</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setWorkflowOpen(false)}
                  className="text-[10px] tracking-widest uppercase text-white/45 hover:text-white transition-colors">
                  {isAdmin ? 'Cancelar' : 'Fechar'}
                </button>
                {isAdmin && (
                  <button onClick={saveWorkflow} disabled={workflowSaving}
                    className="text-[10px] tracking-[0.3em] uppercase font-bold px-4 py-1.5 rounded-md transition-all disabled:opacity-50"
                    style={{ background: '#fb923c', color: '#1a0f06', boxShadow: '0 0 14px -3px rgba(251,146,60,0.6)' }}>
                    {workflowSaving ? 'A guardar...' : 'Guardar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Pulse keyframes para o botao laranja */}
      <style jsx global>{`
        @keyframes workflowPulse {
          0%, 100% { box-shadow: 0 0 10px -2px rgba(251,146,60,0.4); }
          50%      { box-shadow: 0 0 14px -1px rgba(251,146,60,0.85); }
        }
      `}</style>
    </div>
  )
}
