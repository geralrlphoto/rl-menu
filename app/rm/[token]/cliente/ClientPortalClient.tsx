'use client'

import { useEffect, useState } from 'react'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Fase {
  titulo: string
  concluida: boolean
}
interface LinkEntrega {
  label: string
  url: string
}
interface PortalClienteData {
  fases:    Fase[]
  notas:    string
  links:    LinkEntrega[]
  mensagem: string
}

const DEFAULT_FASES: Fase[] = [
  { titulo: 'Briefing e Contrato Assinado',   concluida: false },
  { titulo: 'Reunião de Pré-Produção',         concluida: false },
  { titulo: 'Dia(s) de Captação',              concluida: false },
  { titulo: 'Edição e Pós-Produção',           concluida: false },
  { titulo: 'Revisão e Aprovação',             concluida: false },
  { titulo: 'Entrega Final',                   concluida: false },
]

const DEFAULT_PORTAL: PortalClienteData = {
  fases:    DEFAULT_FASES,
  notas:    '',
  links:    [],
  mensagem: '',
}

function mergePortal(saved: any): PortalClienteData {
  if (!saved?.portal_cliente) return DEFAULT_PORTAL
  const pc = saved.portal_cliente
  return {
    fases:    pc.fases    || DEFAULT_FASES,
    notas:    pc.notas    || '',
    links:    pc.links    || [],
    mensagem: pc.mensagem || '',
  }
}

// ─── Estilos base ─────────────────────────────────────────────────────────────
const LBL = 'text-[10px] tracking-[0.5em] text-white/35 uppercase mb-1.5 block'
const INP = 'w-full bg-white/[0.04] border border-white/[0.10] px-3 py-2.5 text-[13px] text-white/80 placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors'
const AREA = INP + ' resize-none leading-relaxed'

// ─── Componente ───────────────────────────────────────────────────────────────
export default function ClientPortalClient({ token, isAdmin }: { token: string; isAdmin: boolean }) {
  const [lead,      setLead]      = useState<Record<string, any> | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)
  const [portal,    setPortal]    = useState<PortalClienteData>(DEFAULT_PORTAL)
  const [rawContent,setRawContent]= useState<any>({})

  // edit
  const [editing,   setEditing]   = useState(false)
  const [draft,     setDraft]     = useState<PortalClienteData>(DEFAULT_PORTAL)
  const [saving,    setSaving]    = useState(false)
  const [savedOk,   setSavedOk]   = useState(false)

  // ── Carregar ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/media-portal/view?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.lead) { setNotFound(true); setLoading(false); return }
        setLead(data.lead)
        const p = mergePortal(data.lead.page_content)
        setPortal(p)
        setRawContent(data.lead.page_content || {})
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token])

  // ── Guardar ─────────────────────────────────────────────────────────────────
  async function savePortal() {
    setSaving(true)
    try {
      const newContent = { ...rawContent, portal_cliente: draft }
      await fetch('/api/media-portal/save-content', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, page_content: newContent }),
      })
      setPortal(draft)
      setRawContent(newContent)
      setSavedOk(true)
      setTimeout(() => { setEditing(false); setSavedOk(false) }, 900)
    } finally { setSaving(false) }
  }

  function startEdit() {
    setDraft(JSON.parse(JSON.stringify(portal)))
    setEditing(true)
    setSavedOk(false)
  }

  function toggleFase(i: number) {
    const fases = draft.fases.map((f, idx) => idx === i ? { ...f, concluida: !f.concluida } : f)
    setDraft({ ...draft, fases })
  }

  function addLink() {
    setDraft({ ...draft, links: [...draft.links, { label: '', url: '' }] })
  }
  function updateLink(i: number, key: 'label' | 'url', val: string) {
    const links = draft.links.map((l, idx) => idx === i ? { ...l, [key]: val } : l)
    setDraft({ ...draft, links })
  }
  function removeLink(i: number) {
    setDraft({ ...draft, links: draft.links.filter((_, idx) => idx !== i) })
  }

  // ── Estados de carregamento ──────────────────────────────────────────────
  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#04080f' }}>
      <p className="text-[12px] tracking-[0.6em] text-white/30 uppercase animate-pulse">A carregar...</p>
    </main>
  )
  if (notFound) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#04080f' }}>
      <p className="text-[12px] tracking-[0.6em] text-white/30 uppercase">Página não disponível</p>
    </main>
  )

  const nome    = lead!.nome    || ''
  const empresa = lead!.empresa || ''
  const conf    = lead!.page_content?.confirmacao_proposta
  const propEsc = conf?.dados?.proposta_escolhida || ''
  const servicos: string[] = (() => {
    if (!conf?.dados?.proposta_escolhida || !lead!.page_content?.propostas) return []
    const idx = (lead!.page_content.propostas as any[]).findIndex((p: any) => p.titulo === propEsc)
    return idx >= 0 ? (lead!.page_content.propostas[idx].servicos || []) : []
  })()
  const valor: string = (() => {
    if (!conf?.dados?.proposta_escolhida || !lead!.page_content?.propostas) return ''
    const idx = (lead!.page_content.propostas as any[]).findIndex((p: any) => p.titulo === propEsc)
    return idx >= 0 ? (lead!.page_content.propostas[idx].valor || '') : ''
  })()

  const fasesAtivas  = portal.fases.filter(f => f.concluida).length
  const fasesTotal   = portal.fases.length
  const pct          = fasesTotal > 0 ? Math.round((fasesAtivas / fasesTotal) * 100) : 0

  // ── PAINEL DE EDIÇÃO (admin) ────────────────────────────────────────────────
  if (editing && isAdmin) return (
    <div className="min-h-screen flex flex-col" style={{ background: '#04080f' }}>
      <div className="pointer-events-none fixed inset-0" style={{ backgroundImage: 'linear-gradient(rgba(70,120,255,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(70,120,255,0.045) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />

      {/* Barra topo */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
        <p className="text-[11px] tracking-[0.5em] text-white/40 uppercase">✎ Editar Portal Cliente</p>
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="px-4 py-2 text-[10px] tracking-[0.4em] text-white/35 hover:text-white/60 border border-white/[0.08] hover:border-white/20 uppercase transition-all">✕ Cancelar</button>
          <button onClick={savePortal} disabled={saving} className={`px-6 py-2 text-[10px] tracking-[0.4em] uppercase transition-all border disabled:opacity-40 ${savedOk ? 'border-emerald-400/50 text-emerald-400/80' : 'border-white/30 text-white/70 hover:border-white/50 bg-white/[0.04]'}`}>
            {savedOk ? '✓ Guardado' : saving ? 'A guardar...' : '✓ Guardar'}
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 px-6 sm:px-16 py-10 max-w-3xl mx-auto w-full flex flex-col gap-8">

        {/* Fases */}
        <div>
          <label className={LBL}>Fases do Projeto</label>
          <div className="flex flex-col gap-2">
            {draft.fases.map((f, i) => (
              <button key={i} onClick={() => toggleFase(i)}
                className={`flex items-center gap-4 px-4 py-3 border text-left transition-all ${f.concluida ? 'border-emerald-400/40 bg-emerald-400/[0.05]' : 'border-white/[0.09] hover:border-white/20'}`}>
                <span className={`w-5 h-5 flex items-center justify-center border text-[11px] shrink-0 ${f.concluida ? 'border-emerald-400/60 text-emerald-400' : 'border-white/20 text-white/20'}`}>
                  {f.concluida ? '✓' : ''}
                </span>
                <span className={`text-[13px] tracking-wide ${f.concluida ? 'text-white/80' : 'text-white/45'}`}>{f.titulo}</span>
                <span className="ml-auto text-[11px] text-white/25">{f.concluida ? 'Concluída' : 'Pendente'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Links de entrega */}
        <div>
          <label className={LBL}>Links de Entrega</label>
          <div className="flex flex-col gap-3">
            {draft.links.map((l, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 flex flex-col gap-2">
                  <input className={INP} placeholder="Etiqueta (ex: Vídeo Final)" value={l.label} onChange={e => updateLink(i, 'label', e.target.value)} />
                  <input className={INP} placeholder="https://..." value={l.url} onChange={e => updateLink(i, 'url', e.target.value)} />
                </div>
                <button onClick={() => removeLink(i)} className="mt-1 w-8 h-8 flex items-center justify-center border border-white/[0.09] text-white/30 hover:text-red-400/60 hover:border-red-400/25 transition-all text-[13px]">✕</button>
              </div>
            ))}
            <button onClick={addLink} className="text-[11px] tracking-[0.35em] uppercase text-white/35 hover:text-white/60 border border-dashed border-white/[0.12] hover:border-white/25 py-3 transition-all">+ Adicionar Link</button>
          </div>
        </div>

        {/* Mensagem ao cliente */}
        <div>
          <label className={LBL}>Mensagem ao Cliente</label>
          <textarea className={AREA} rows={4} placeholder="Nota ou mensagem visível ao cliente..." value={draft.mensagem} onChange={e => setDraft({ ...draft, mensagem: e.target.value })} />
        </div>

        {/* Notas internas */}
        <div>
          <label className={LBL}>Notas Internas (não visíveis ao cliente)</label>
          <textarea className={AREA} rows={3} placeholder="Notas para uso interno..." value={draft.notas} onChange={e => setDraft({ ...draft, notas: e.target.value })} />
        </div>
      </div>
    </div>
  )

  // ── PORTAL DO CLIENTE (view) ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#04080f' }}>
      {/* Background grid */}
      <div className="pointer-events-none fixed inset-0" style={{ backgroundImage: 'linear-gradient(rgba(70,120,255,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(70,120,255,0.045) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 110% 55% at 50% -8%, rgba(50,110,255,0.11) 0%, transparent 65%)' }} />

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
        <a href={`/rm/${token}`} className="text-[11px] tracking-[0.4em] text-white/35 hover:text-white/60 uppercase transition-colors">‹ Portal</a>
        <p className="text-[11px] tracking-[0.5em] text-white/35 uppercase">RL Media · Portal Cliente</p>
        {isAdmin && (
          <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 border border-white/20 hover:border-white/40 text-white/50 hover:text-white/80 text-[10px] tracking-[0.4em] uppercase transition-all">
            <span style={{ fontSize: 14 }}>✎</span> Editar
          </button>
        )}
        {!isAdmin && <div className="w-20" />}
      </div>

      <div className="relative z-10 flex-1 px-6 sm:px-12 py-10 max-w-5xl mx-auto w-full flex flex-col gap-10">

        {/* ── CABEÇALHO DO PROJETO ── */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] tracking-[0.55em] text-white/30 uppercase">Bem-vindo ao vosso portal</p>
          <h1 className="text-[28px] sm:text-[36px] font-extrabold tracking-[0.05em] text-white/90 uppercase leading-tight">
            {empresa || nome}
          </h1>
          {empresa && nome && <p className="text-[14px] text-white/45 tracking-wide">{nome}</p>}
          {propEsc && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] tracking-[0.35em] text-white/30 uppercase">Proposta</span>
              <span className="text-[13px] tracking-[0.2em] text-emerald-400/70 uppercase font-medium border border-emerald-400/25 px-3 py-1">{propEsc}</span>
              {valor && <span className="text-[15px] font-light text-white/60 font-mono">{valor}</span>}
            </div>
          )}
        </div>

        {/* ── BARRA DE PROGRESSO ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] tracking-[0.45em] text-white/35 uppercase">Progresso do Projeto</p>
            <p className="text-[13px] font-mono text-white/50">{fasesAtivas}/{fasesTotal} fases · {pct}%</p>
          </div>
          <div className="h-1 w-full bg-white/[0.07] overflow-hidden">
            <div className="h-full bg-emerald-400/60 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

          {/* ── FASES DO PROJETO ── */}
          <div className="flex flex-col gap-4">
            <p className="text-[11px] tracking-[0.5em] text-white/35 uppercase">Fases do Projeto</p>
            <div className="flex flex-col gap-0">
              {portal.fases.map((f, i) => (
                <div key={i} className={`flex items-center gap-4 py-4 border-b border-white/[0.05] last:border-0`}>
                  <div className={`w-6 h-6 flex items-center justify-center shrink-0 border ${f.concluida ? 'border-emerald-400/60 bg-emerald-400/[0.08]' : 'border-white/[0.12]'}`}>
                    {f.concluida
                      ? <span className="text-emerald-400 text-[12px]">✓</span>
                      : <span className="text-white/15 text-[10px]">{String(i + 1).padStart(2, '0')}</span>}
                  </div>
                  <p className={`text-[14px] leading-snug ${f.concluida ? 'text-white/75' : 'text-white/35'}`}>{f.titulo}</p>
                  {f.concluida && <span className="ml-auto text-[10px] tracking-[0.3em] text-emerald-400/50 uppercase shrink-0">Concluída</span>}
                </div>
              ))}
            </div>
          </div>

          {/* ── LADO DIREITO ── */}
          <div className="flex flex-col gap-6">

            {/* Mensagem ao cliente */}
            {portal.mensagem && (
              <div className="border border-white/[0.08] bg-white/[0.02] px-5 py-4 flex flex-col gap-2">
                <p className="text-[10px] tracking-[0.5em] text-white/30 uppercase">Mensagem</p>
                <p className="text-[14px] font-light text-white/65 leading-relaxed">{portal.mensagem}</p>
              </div>
            )}

            {/* Serviços contratados */}
            {servicos.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-[11px] tracking-[0.5em] text-white/35 uppercase">Serviços Contratados</p>
                <div className="flex flex-col gap-0">
                  {servicos.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
                      <span className="text-[11px] text-white/20 shrink-0 w-5 text-right tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                      <div className="w-px h-3 bg-white/[0.08] shrink-0" />
                      <p className="text-[13px] font-light text-white/60">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links de entrega */}
            {portal.links.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-[11px] tracking-[0.5em] text-white/35 uppercase">Entregas</p>
                <div className="flex flex-col gap-2">
                  {portal.links.map((l, i) => (
                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 border border-white/[0.09] hover:border-white/25 bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
                      <span className="text-[11px] tracking-[0.2em] text-white/50 group-hover:text-white/80 uppercase flex-1">{l.label || 'Ficheiro'}</span>
                      <span className="text-[12px] text-white/25 group-hover:text-white/50">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Contacto */}
            <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-5">
              <p className="text-[11px] tracking-[0.5em] text-white/35 uppercase">Contacto</p>
              <div className="flex flex-col gap-1.5">
                <p className="text-[13px] text-white/50">geral@rlphoto.video</p>
                <p className="text-[13px] text-white/50">+351 912 345 678</p>
                <p className="text-[12px] text-white/30 mt-1">RL Media · Audiovisual</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
