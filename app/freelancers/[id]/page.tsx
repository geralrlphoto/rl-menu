'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
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
  const [tab, setTab] = useState<'casamentos'|'edicao'|'album'|'tarefas'|'calendario'|'info'|'notas'|'pagamentos'|'notificacoes'|'mensagens'|'definicoes'|null>(null)
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
    const [fRes, cRes, eRes, aRes, vRes, iRes, pRes, nRes, mRes, fsRes] = await Promise.all([
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
        : (['casamentos', 'edicao', 'album', 'pagamentos', 'tarefas', 'calendario', 'definicoes'] as Array<string | null>).includes(tab) ? 'max-w-[1500px]'
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

              {/* Top-right: alerta prazos + notif + messages + profile chip */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Alerta de prazos críticos (Seleção de Fotos a expirar) */}
                {prazosCriticos.length > 0 && (
                  <button title={`${prazosCriticos.length} prazo${prazosCriticos.length === 1 ? '' : 's'} a terminar — Seleção de Fotos`}
                    onClick={() => setTab('casamentos')}
                    className="relative w-10 h-10 rounded-full border bg-black/40 backdrop-blur-md transition-all flex items-center justify-center bell-red-glow border-red-500/60 text-red-300 hover:text-red-200 hover:border-red-400/80">
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
                      className={`relative w-10 h-10 rounded-full border bg-black/40 backdrop-blur-md transition-all flex items-center justify-center ${
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

          {/* ── Prazos de Entrega · Seleção + Fotos Editadas (30 dias cada) ── */}
          {/*    Largura = mesma de uma coluna do grid acima (Casamentos Editados) */}
          {prazosSelecao.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              <div className={`rounded-xl px-4 py-3 transition-all ${
                prazosCriticos.length > 0
                  ? 'prazo-critico-glow border border-red-500/40 bg-gradient-to-br from-red-500/[0.08] to-red-500/[0.02]'
                  : 'border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.04] to-amber-500/[0.01]'
              }`}>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-x-3 gap-y-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className={`text-[11px] tracking-[0.3em] uppercase font-semibold truncate ${
                      prazosCriticos.length > 0 ? 'text-red-300' : 'text-amber-300/90'
                    }`}>
                      {prazosCriticos.length > 0 ? '⚠ Crítico' : '◷ Prazos'} · Entrega
                    </p>
                    {prazosCriticos.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-200 font-bold uppercase tracking-wider animate-pulse shrink-0">
                        {prazosCriticos.length}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/35 italic" style={{ fontFamily: 'Georgia, serif' }}>30 dias</p>
                </div>
                <div className="space-y-1.5">
                  {prazosSelecao.slice(0, 5).map(p => {
                    const critical = p.daysLeft <= PRAZO_AVISO_DIAS
                    const expired = p.daysLeft < 0
                    let deadlineLabel = '—'
                    try {
                      if (!isNaN(p.deadline.getTime())) {
                        const dd = String(p.deadline.getDate()).padStart(2, '0')
                        deadlineLabel = `${dd} ${MESES[p.deadline.getMonth()]}`
                      }
                    } catch { /* keep '—' */ }
                    const tipoLabel = p.tipo === 'edicao' ? 'Edição' : p.tipo === 'album' ? 'Álbum' : 'Seleção'
                    const tipoCls = p.tipo === 'edicao'
                      ? 'bg-blue-500/20 text-blue-200 border-blue-500/35'
                      : p.tipo === 'album'
                        ? 'bg-purple-500/20 text-purple-200 border-purple-500/35'
                        : 'bg-gold/15 text-gold/90 border-gold/30'
                    return (
                      <button key={`${p.tipo}-${p.c.id}`} onClick={() => setTab('casamentos')}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border transition-all text-left ${
                          critical
                            ? 'border-red-500/35 bg-red-500/[0.05] hover:bg-red-500/[0.1]'
                            : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-[8px] px-1 py-px rounded uppercase tracking-wider font-bold border shrink-0 ${tipoCls}`}>
                              {tipoLabel}
                            </span>
                            <p className="text-[12px] text-white truncate font-medium leading-tight">{p.c.local}</p>
                          </div>
                          <p className="text-[10px] text-white/45 italic leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                            até {deadlineLabel}
                          </p>
                        </div>
                        <div className={`flex items-baseline gap-1 shrink-0 ${critical ? 'text-red-300' : 'text-amber-300/90'}`}>
                          <p className="text-lg font-light leading-none tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>
                            {expired ? `+${Math.abs(p.daysLeft)}` : p.daysLeft}
                          </p>
                          <p className="text-[9px] tracking-[0.2em] uppercase font-semibold">
                            {expired ? 'atr.' : 'd'}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

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

      {/* Dados Pessoais — premium design */}
      {tab === 'definicoes' && (() => {
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
      {tab === 'casamentos'   && <CasamentosTab freelancerId={id} casamentos={casamentos} onRefresh={load} freelancerStatus={freelancer?.status ?? null} freelancer={freelancer} viewAsFreelancer={viewAsFreelancer} fotosSelecaoMap={fotosSelecaoMap} fotosConvidadosMap={fotosConvidadosMap} setFotosConvidadosMap={setFotosConvidadosMap} />}
      {tab === 'edicao'       && <EdicaoTab freelancerId={id} edicao={edicao} onRefresh={load} />}
      {tab === 'album'        && <AlbumTab freelancerId={id} album={album} onRefresh={load} />}
      {tab === 'tarefas'      && <TarefasTab freelancerId={id} viewAsFreelancer={viewAsFreelancer} freelancer={freelancer} notificacoes={notificacoes} onRefresh={load} />}
      {tab === 'calendario'   && <CalendarioTab freelancerId={id} casamentos={casamentos} edicao={edicao} album={album} notificacoes={notificacoes} freelancer={freelancer} />}
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
  const items: Array<{ key: AdminTabKey; label: string; icon: string; count?: number }> = [
    { key: null,             label: 'Início',         icon: '⌂' },
    { key: 'casamentos',     label: 'Casamentos',     icon: '◆', count: counts.casamentos },
    ...(!isVideografo ? [{ key: 'edicao' as AdminTabKey, label: 'Edição Fotos', icon: '✎', count: counts.edicao }] : []),
    ...(isFotografo ? [{ key: 'album' as AdminTabKey, label: 'Edição Álbum', icon: '◫', count: counts.album }] : []),
    { key: 'tarefas',        label: 'Tarefas',        icon: '◷' },
    { key: 'calendario',     label: 'Calendário',     icon: '◉' },
    { key: 'pagamentos',     label: 'Pagamentos',     icon: '$', count: counts.pagamentos },
    { key: 'mensagens',      label: 'Mensagens',      icon: '✉', count: counts.mensagens },
    { key: 'notificacoes',   label: 'Notificações',   icon: '◉', count: counts.notificacoes },
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

      {/* Logo */}
      <div className="px-7 pt-10 pb-6 text-center">
        <p className="text-[10px] tracking-[0.5em] uppercase font-light" style={{ color: '#7a6340' }}>RL</p>
        <p className="text-[22px] leading-tight mt-1" style={{ color: '#f0e8d8', fontWeight: 400 }}>
          Photo<span className="italic" style={{ color: '#c9a96e' }}>.video</span>
        </p>
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
              {it.count && it.count > 0 ? (
                <span className="text-[10px] px-1.5 min-w-[22px] text-center font-mono leading-tight py-0.5 rounded-sm"
                  style={{
                    border: active ? '0.5px solid #c9a96e' : '0.5px solid rgba(255,255,255,0.15)',
                    color: active ? '#c9a96e' : 'rgba(255,255,255,0.40)',
                    background: 'transparent',
                  }}>{it.count}</span>
              ) : null}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5 mt-auto">
        <div className="h-px mb-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,164,92,0.25), transparent)' }} />
        {!viewAsFreelancer && (
          <a href={`/freelancer-view/${freelancer?.id ?? ''}`} target="_blank" rel="noopener noreferrer"
            className="block text-[9px] tracking-[0.4em] uppercase transition-colors mb-3 text-center"
            style={{ color: '#7a6340' }}
            onMouseEnter={e => e.currentTarget.style.color = '#c9a96e'}
            onMouseLeave={e => e.currentTarget.style.color = '#7a6340'}>
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

// ─── Casamentos Tab ───────────────────────────────────────────────────────────

const DEFAULT_INTRO = `Aqui encontras todos os eventos que te foram atribuídos ao longo do ano. Sempre que um novo evento for adicionado, deverás confirmar a tua disponibilidade.\n\nA 3 dias do evento tens acesso ao briefing com toda a informação necessária para o dia — percurso, contactos, detalhes da cerimónia e muito mais.`

function CasamentosTab({ freelancerId, casamentos, onRefresh, freelancerStatus, freelancer, viewAsFreelancer, fotosSelecaoMap, fotosConvidadosMap, setFotosConvidadosMap }: { freelancerId: string; casamentos: Casamento[]; onRefresh: () => void; freelancerStatus: string | null; freelancer: Freelancer | null; viewAsFreelancer?: boolean; fotosSelecaoMap: Record<string, string>; fotosConvidadosMap: Record<string, { email: string | null; ctt: string | null; emailLista: string[]; cttLista: string[]; emailWorkflow: string; cttWorkflow: string }>; setFotosConvidadosMap: (updater: (prev: Record<string, { email: string | null; ctt: string | null; emailLista: string[]; cttLista: string[]; emailWorkflow: string; cttWorkflow: string }>) => Record<string, { email: string | null; ctt: string | null; emailLista: string[]; cttLista: string[]; emailWorkflow: string; cttWorkflow: string }>) => void }) {
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
                  <h2 className="text-2xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>{c.local}</h2>
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
                  {c.briefing_url && (
                    <div>
                      <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 mb-0.5">Briefing</p>
                      <a href={c.briefing_url} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-[13px] text-gold/80 hover:text-gold underline truncate inline-block">📄 Ver briefing</a>
                    </div>
                  )}
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
                <div className="flex items-center gap-1.5">
                  {!isPast && !c.data_confirmada && !c.indisponivel && (
                    <button onClick={async e => { e.stopPropagation(); await fetch('/api/freelancer-casamentos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, data_confirmada: true }) }); onRefresh() }}
                      className="px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-300 text-[10px] tracking-widest uppercase hover:bg-emerald-500/10 transition-all">
                      ✓ Confirmar
                    </button>
                  )}
                  {!viewAsFreelancer && (
                    <button onClick={e => { e.stopPropagation(); del(c.id) }}
                      className="w-8 h-8 rounded-lg border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 transition-all flex items-center justify-center"
                      title="Eliminar">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── EXPANDED PANEL (inline accordion) ─────────────────── */}
            {expandedId === c.id && (
              <div className="relative px-5 pb-5 pt-4 border-t border-gold/15 animate-in fade-in slide-in-from-top-1 space-y-4">
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
                        onRefresh={onRefresh}
                      />
                    )
                  })}
                </div>

                {/* ── Fotos Convidados (Email + CTT) ──────────────────── */}
                {c.referencia && (
                  <FotosConvidadosBox
                    referencia={c.referencia}
                    estado={fotosConvidadosMap[c.referencia] ?? { email: null, ctt: null, emailLista: [], cttLista: [], emailWorkflow: '', cttWorkflow: '' }}
                    onChange={(next) => setFotosConvidadosMap(prev => ({ ...prev, [c.referencia!]: next }))}
                    dataCasamento={c.data_casamento}
                  />
                )}

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
                          <a
                            href={`/fotos-selecao?ref=${encodeURIComponent(job.referencia || job.nome)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] px-2.5 py-1.5 rounded-md border border-gold/30 bg-gold/5 text-gold/80 hover:text-gold hover:border-gold/50 hover:bg-gold/10 transition-all tracking-widest uppercase text-center font-bold flex items-center justify-center gap-1"
                          >
                            👁 Ver Seleção
                          </a>
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
type TarefaStatus   = 'Pendente' | 'Em andamento' | 'Concluída'
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
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setTasks(JSON.parse(raw))
    } catch {}
    setLoaded(true)
  }, [KEY])
  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(KEY, JSON.stringify(tasks)) } catch {}
  }, [tasks, KEY, loaded])

  function addTask(t: TarefaItem) {
    setTasks(prev => [t, ...prev])
  }
  function toggleTask(id: string) {
    const t = tasks.find(x => x.id === id)
    if (!t) return
    // Concluída → não permitir voltar atrás (regra de negócio premium)
    if (tarefaStatus(t) === 'Concluída') return
    // Para concluir, OBRIGA o membro a escrever resposta — abre modal
    setCompletingTask(t)
  }
  function completeWithResponse(id: string, resposta: string) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      return {
        ...t,
        done: true,
        status: 'Concluída',
        doneAt: new Date().toISOString(),
        resultado: resposta.trim(),
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
    return (
      <div className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
        done ? 'border-white/[0.04] bg-white/[0.01] opacity-70'
             : overdue ? 'border-red-500/25 bg-red-500/[0.03] hover:bg-red-500/[0.06]'
                       : 'border-white/[0.07] bg-white/[0.02] hover:border-gold/25 hover:bg-white/[0.04]'
      }`}>
        <button onClick={() => toggleTask(t.id)}
          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
            done ? 'bg-emerald-500/25 border-emerald-500/55 text-emerald-300'
                 : 'border-white/25 hover:border-gold/60 hover:bg-gold/10'
          }`}>
          {done && <span className="text-[10px] leading-none">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-medium truncate ${done ? 'line-through text-white/40' : 'text-white/90'}`}>
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
  type: 'casamento' | 'edicao' | 'album' | 'tarefa-pessoal' | 'tarefa-atribuida' | 'prazo-selecao' | 'prazo-edicao' | 'notificacao'
  title: string
  subtitle?: string
}

function CalendarioTab({ freelancerId, casamentos, edicao, album, notificacoes, freelancer }: {
  freelancerId: string
  casamentos: Casamento[]
  edicao: Edicao[]
  album: Album[]
  notificacoes: Notificacao[]
  freelancer: Freelancer | null
}) {
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
    // Notificações recebidas (data de criação)
    notificacoes.forEach(n => {
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
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setView({ y: today.getFullYear(), m: today.getMonth() })}
              className="px-4 py-2.5 rounded-xl border border-white/15 text-white/75 hover:text-gold hover:border-gold/40 text-[13px] tracking-wider uppercase font-bold transition-all">
              Hoje
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
              return (
                <button key={i}
                  onClick={() => { if (c.current && c.iso) { setSelectedIso(c.iso); setPreviewIso(c.iso) } }}
                  disabled={!c.current}
                  className={`relative aspect-square sm:min-h-[80px] sm:aspect-auto p-1.5 sm:p-2 rounded-lg border text-left transition-all ${
                    c.isToday
                      ? 'bg-gold text-black font-bold border-gold'
                      : selected
                        ? 'bg-gold/15 text-gold border-gold/40'
                        : c.current
                          ? eventCount > 0
                            ? 'bg-white/[0.03] border-white/[0.08] text-white/75 hover:border-gold/30 hover:bg-white/[0.06]'
                            : 'bg-white/[0.01] border-white/[0.04] text-white/50 hover:border-white/15'
                          : 'bg-transparent border-transparent text-white/20'
                  }`}>
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
                  return (
                    <button key={e.id} onClick={() => { setView({ y, m: mm - 1 }); setSelectedIso(e.iso); setPreviewIso(e.iso) }}
                      className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg border border-white/[0.05] hover:border-gold/25 hover:bg-white/[0.03] transition-all text-left">
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
        />
      )}
    </div>
  )
}

// ── Modal Preview de Dia — mostra todos os eventos de uma data ────────
function DiaPreviewModal({ iso, events, typeMeta, onClose }: {
  iso: string
  events: CalEvento[]
  typeMeta: Record<string, { color: string; bg: string; border: string; label: string; icon: string }>
  onClose: () => void
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
                      {arr.map(e => (
                        <div key={e.id} className={`flex items-start gap-3 px-3.5 py-3 rounded-xl border ${m.border} hover:${m.bg} transition-all`}
                          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.015), transparent)' }}>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] text-white font-medium leading-tight">{e.title}</p>
                            {e.subtitle && (
                              <p className="text-[11px] text-white/45 italic mt-1">{e.subtitle}</p>
                            )}
                          </div>
                        </div>
                      ))}
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
  const [filter, setFilter] = useState<'Todos'|'Recebidos'|'A receber'|'Atrasados'|'Cancelados'>('Todos')

  function fmtEuro(v: number) { return `${v.toFixed(2).replace('.', ',')} €` }

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

function NotificacoesAdminTab({ freelancerId, notificacoes, onRefresh }: { freelancerId: string; notificacoes: Notificacao[]; onRefresh: () => void }) {
  const [form, setForm] = useState({ titulo: '', mensagem: '', tipo: 'alerta' })
  const [sending, setSending] = useState(false)
  const [respondingNotif, setRespondingNotif] = useState<Notificacao | null>(null)
  const [viewingThread, setViewingThread] = useState<{ threadId: string; title: string } | null>(null)
  const [freelancerName, setFreelancerName] = useState('')
  const [activeTab, setActiveTab] = useState<'recebidas'|'enviadas'>('recebidas')
  const [sentNotifs, setSentNotifs] = useState<Notificacao[]>([])
  const [loadingSent, setLoadingSent] = useState(false)

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

      {/* Separador: Recebidas | Enviadas */}
      <div className="flex items-center gap-1 mb-3 border-b border-white/[0.06]">
        {([
          { key: 'recebidas' as const, label: 'Recebidas', count: notificacoes.length },
          { key: 'enviadas'  as const, label: 'Tarefas Enviadas', count: sentNotifs.length },
        ]).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`relative px-4 py-2.5 text-[12px] tracking-[0.2em] uppercase font-semibold transition-all ${
              activeTab === t.key
                ? 'text-gold'
                : 'text-white/40 hover:text-white/75'
            }`}>
            {t.label}
            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === t.key ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-white/[0.06] text-white/40'
            }`}>{t.count}</span>
            {activeTab === t.key && <span className="absolute bottom-0 left-3 right-3 h-px bg-gold" />}
          </button>
        ))}
      </div>

      {activeTab === 'recebidas' && (notificacoes.length === 0 ? (
        <p className="text-center py-6 text-white/20 text-[14px] tracking-widest">Sem notificações recebidas.</p>
      ) : (
        <>
          {/* Botão 'Marcar todas como lidas' (só quando há não lidas) */}
          {notificacoes.some(n => !n.lida) && (
            <div className="flex justify-end mb-2">
              <button onClick={handleMarkAllRead}
                className="px-3 py-1.5 rounded-lg text-[11px] tracking-widest uppercase text-white/45 hover:text-gold border border-white/10 hover:border-gold/30 transition-all">
                ✓ Marcar todas como lidas
              </button>
            </div>
          )}
          <div className="space-y-2">
            {notificacoes.map(n => {
              const meta = parseNotifMeta(n.mensagem)
              const isTaskAssigned = n.tipo === 'nova_tarefa_atribuida'
              const isTaskResposta = n.tipo === 'resposta_tarefa'
              const isTaskConcluida = n.tipo === 'tarefa_concluida'
              const isTaskMessage  = isTaskAssigned || isTaskResposta || isTaskConcluida
              const isCreator      = !!meta.creatorId && meta.creatorId === freelancerId
              const isTaskHighlight = isTaskAssigned && !n.lida
              const accentBorder = isTaskAssigned ? 'border-blue-500/35 bg-blue-500/[0.05]'
                : isTaskResposta ? 'border-indigo-500/35 bg-indigo-500/[0.05]'
                : isTaskConcluida ? 'border-emerald-500/35 bg-emerald-500/[0.05]'
                : 'border-gold/20 bg-gold/[0.03]'
              return (
              <div key={n.id}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border group transition-colors ${
                  n.lida ? 'border-white/[0.04] bg-white/[0.01]' : accentBorder
                }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[14px] tracking-widest uppercase font-semibold ${
                      isTaskHighlight ? 'text-blue-300' : 'text-white/30'
                    }`}>{n.tipo}</span>
                    {n.lida
                      ? <span className="text-[14px] text-emerald-400/55">✓ lida</span>
                      : isTaskAssigned
                        ? <span className="text-[14px] text-blue-300 font-bold">✈ NOVA TAREFA</span>
                        : isTaskResposta
                          ? <span className="text-[14px] text-indigo-300 font-bold">↩ NOVA RESPOSTA</span>
                          : isTaskConcluida
                            ? <span className="text-[14px] text-emerald-300 font-bold">✓ TAREFA CONCLUÍDA</span>
                            : <span className="text-[14px] text-gold/70 font-bold">• não lida</span>
                    }
                  </div>
                  <p className={`text-[14px] ${n.lida ? 'text-white/60' : 'text-white/90 font-medium'}`}>{n.titulo}</p>
                  {meta.cleanMensagem && <p className="text-[13px] text-white/55 mt-1 whitespace-pre-wrap leading-relaxed">{meta.cleanMensagem}</p>}
                  <p className="text-[12px] text-white/25 mt-1.5">{new Date(n.created_at).toLocaleDateString('pt-PT')}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 mt-0.5 flex-shrink-0">
                  {/* VER CONVERSAÇÃO — qualquer mensagem de tarefa com threadId */}
                  {isTaskMessage && meta.threadId && (
                    <button onClick={() => setViewingThread({ threadId: meta.threadId!, title: meta.threadTitle || n.titulo })}
                      title="Ver toda a conversação desta tarefa"
                      className="px-3 py-1.5 rounded-md text-[10px] tracking-wider uppercase font-bold border border-gold/35 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold/55 transition-all flex items-center gap-1">
                      💬 Ver Conversação
                    </button>
                  )}
                  {/* RESPONDER — só para tarefas atribuídas/respostas (não concluídas), e não és o próprio remetente */}
                  {!isTaskConcluida && (isTaskAssigned || isTaskResposta) && meta.senderId && meta.senderId !== freelancerId && (
                    <button onClick={() => setRespondingNotif(n)}
                      title="Responder ao remetente"
                      className="px-3 py-1.5 rounded-md text-[10px] tracking-wider uppercase font-bold border border-blue-500/45 bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 hover:border-blue-400/60 transition-all flex items-center gap-1"
                      style={{ boxShadow: '0 0 10px -4px rgba(59,130,246,0.5)' }}>
                      ↩ Responder
                    </button>
                  )}
                  <div className="flex items-center gap-1.5">
                    {!n.lida && (
                      <button onClick={() => handleMarkRead(n.id, true)}
                        title="Marcar como lida"
                        className="px-2 py-1 rounded-md text-[10px] tracking-wider uppercase font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400/50 transition-all">
                        ✓ Lida
                      </button>
                    )}
                    {n.lida && (
                      <button onClick={() => handleMarkRead(n.id, false)}
                        title="Marcar como não lida"
                        className="px-2 py-1 rounded-md text-[10px] tracking-wider uppercase font-semibold border border-white/10 bg-white/[0.03] text-white/40 hover:text-gold hover:border-gold/30 transition-all opacity-0 group-hover:opacity-100">
                        ↺ Não lida
                      </button>
                    )}
                    <button onClick={() => handleDelete(n.id)}
                      title="Apagar"
                      className="w-7 h-7 flex items-center justify-center rounded-md text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">✕</button>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </>
      ))}

      {/* Tab: Tarefas Enviadas — notifs em que o senderId do META sou eu */}
      {activeTab === 'enviadas' && (
        loadingSent ? (
          <p className="text-center py-6 text-white/30 text-[13px] italic">A carregar tarefas enviadas…</p>
        ) : sentNotifs.length === 0 ? (
          <div className="text-center py-10">
            <span className="text-4xl opacity-20 block mb-2">✈</span>
            <p className="text-[13px] text-white/35 italic">Ainda não enviaste tarefas a outros membros.</p>
            <p className="text-[11px] text-white/25 mt-1">Vai a <span className="text-gold/70">Tarefas → ✈ Enviar Tarefa</span> para começar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Agrupa por threadId */}
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
                const lastMeta = parseNotifMeta(lastItem.mensagem)
                // Última msg dirigida a quem
                const recipientNames = Array.from(new Set(group.items.map(i => i.freelancer_id)))
                const threadTitle = meta?.threadTitle || lastItem.titulo
                const concluded = group.items.some(i => i.tipo === 'tarefa_concluida')
                const lastDate = new Date(lastItem.created_at)
                const dateLabel = `${lastDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} · ${lastDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
                return (
                  <div key={threadId}
                    className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-all hover:border-gold/30 hover:bg-white/[0.02] ${
                      concluded ? 'border-emerald-500/25 bg-emerald-500/[0.03]' : 'border-white/[0.07] bg-white/[0.02]'
                    }`}>
                    <div className="w-10 h-10 rounded-lg border border-blue-500/30 bg-blue-500/10 flex items-center justify-center text-blue-300 text-base shrink-0">
                      {concluded ? '✓' : '✈'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[13px] text-white font-medium truncate">{threadTitle}</span>
                        {concluded && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wider uppercase font-bold">
                            Concluída
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/45 truncate">
                        Para: {recipientNames.length > 1 ? `${recipientNames.length} membros` : '1 membro'}
                        {' · '}{group.items.length} mensagem{group.items.length === 1 ? '' : 's'}
                      </p>
                      <p className="text-[10px] text-white/25 mt-0.5">Última atualização: {dateLabel}</p>
                    </div>
                    {meta?.threadId && (
                      <button onClick={() => setViewingThread({ threadId: meta.threadId!, title: threadTitle })}
                        className="px-3 py-1.5 rounded-md text-[10px] tracking-wider uppercase font-bold border border-gold/35 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold/55 transition-all flex items-center gap-1 shrink-0">
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
}: {
  referencia: string
  estado: { email: string | null; ctt: string | null; emailLista: string[]; cttLista: string[]; emailWorkflow: string; cttWorkflow: string }
  onChange: (next: { email: string | null; ctt: string | null; emailLista: string[]; cttLista: string[]; emailWorkflow: string; cttWorkflow: string }) => void
  dataCasamento: string | null
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
      <h3 className="text-[11px] tracking-[0.3em] uppercase text-blue-300/80">Fotos Convidados</h3>
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
  onRefresh: () => void
}) {
  const locked = !!lockedReason
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
      if (data?.failed && data.failed[statusCol]) {
        console.error(`[saveStatus] ${statusCol} falhou:`, data.failed[statusCol])
        // Reverte localmente
        setStatus(previous)
        alert(`Não foi possível guardar o estado.\n\nA coluna "${statusCol}" não existe na base de dados.\n\nPara resolver, corre o seguinte SQL no Supabase:\n\nALTER TABLE freelancer_casamentos\nADD COLUMN IF NOT EXISTS status_selecao TEXT,\nADD COLUMN IF NOT EXISTS status_editadas TEXT,\nADD COLUMN IF NOT EXISTS status_album TEXT,\nADD COLUMN IF NOT EXISTS status_provas TEXT;`)
      }
    } finally { setSavingStatus(false) }
  }

  const sentAtFmt = sentAt
    ? new Date(sentAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null
  const hasUrl = url.trim().length > 0

  // ── URL apenas editável quando status = ENTREGUE (Seleção & Fotos Editadas) ──
  // O membro só pode colar o link quando marca o trabalho como entregue.
  const urlBlockedByStatus = (field.tipo === 'selecao' || field.tipo === 'editadas') && status !== 'ENTREGUE'
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
      {sentAtFmt ? (
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
          {sending ? 'A enviar...' : '✉ Enviar Notificação'}
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
                // Estados anteriores ao atual ficam bloqueados (workflow one-way)
                const isPrevious = currentIdx >= 0 && idx < currentIdx
                const isDisabled = locked || isPrevious
                return (
                  <button key={opt}
                    disabled={isDisabled}
                    title={isPrevious ? 'Estado anterior bloqueado — não é possível voltar atrás' : undefined}
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
            {savingStatus && <p className="text-[10px] text-gold/50 italic mt-1">A guardar...</p>}
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
    </div>
  )
}
