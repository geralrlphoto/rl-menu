'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { FASES, SEPARADORES, todosPassos, type Email, type Mensagem, type Passo, type Stats } from '@/lib/jornada'
import { calcularMapa, caminho, PW, KW, GX, type No } from './layout-mapa'
import MensagemModal, { type AlvoModal } from './MensagemModal'
import { PainelPasso, PainelFase, PainelEmails, PainelPrazos, PopPasso, PopFase, type Ctx } from './PainelCard'
import './jornada.css'

const pad = (n: number) => String(n).padStart(2, '0')
const PASSOS = todosPassos()
const passoDe = (id: string) => PASSOS.find(p => p.id === id)
const faseDe = (id: string) => id[0] === 'p' ? +id.slice(1) : +id.split('-')[0]

export default function JornadaMapa() {
  const mapa = useMemo(() => calcularMapa(FASES), [])

  /* estado guardado no Supabase */
  const [estado, setEstadoMap] = useState<Record<string, string>>({})
  const [stats, setStats] = useState<Stats | null>(null)
  const [carga, setCarga] = useState<'a carregar' | 'ok' | 'erro'>('a carregar')
  const [aviso, setAviso] = useState<string | null>(null)

  /* interface */
  const [cur, setCur] = useState(0)
  const [sel, setSel] = useState<string | null>(null) // id do passo, "P<i>", "EMAILS" ou "PRAZOS"
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [hover, setHover] = useState<string | null>(null)
  const [foco, setFoco] = useState(false)
  const [tour, setTour] = useState(false)
  const [intro, setIntro] = useState(true)
  const [modal, setModal] = useState<AlvoModal>(null)
  const [rm, setRm] = useState(false)
  const [, setTick] = useState(0) // redesenha o minimapa

  const stageRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const view = useRef({ tx: 40, ty: 0, sc: 1 })
  const moved = useRef(0)
  const curRef = useRef(0)
  curRef.current = cur
  const railRef = useRef<HTMLDivElement>(null)
  const miniRef = useRef<HTMLDivElement>(null)
  const [miniW, setMiniW] = useState(0)
  const [stageW, setStageW] = useState(0)
  const raf = useRef(0)

  // fase atual sempre à vista no carril
  useEffect(() => {
    const a = railRef.current?.querySelector('[aria-current]') as HTMLElement | null
    const rail = railRef.current
    if (a && rail) rail.scrollTo({ left: a.offsetLeft - rail.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' })
  }, [cur])

  /* ── carregar o estado uma vez (sem polling, para poupar egress) ── */
  useEffect(() => {
    try { setRm(window.matchMedia('(prefers-reduced-motion: reduce)').matches) } catch { /* sem matchMedia */ }
    fetch('/api/jornada', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setEstadoMap(d.estado ?? {}); setStats(d.stats ?? null); setCarga('ok') })
      .catch(() => setCarga('erro'))
    const t = setTimeout(() => setIntro(false), 3600)
    return () => clearTimeout(t)
  }, [])

  const gravar = useCallback((mudancas: Record<string, string | null>) => {
    setEstadoMap(prev => {
      const novo = { ...prev }
      for (const [k, v] of Object.entries(mudancas)) { if (v == null) delete novo[k]; else novo[k] = v }
      return novo
    })
    for (const [chave, valor] of Object.entries(mudancas)) {
      fetch('/api/jornada', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chave, valor }) })
        .then(r => { if (!r.ok) throw new Error() })
        .catch(() => { setAviso('Não foi possível guardar. Recarrega a página.'); setTimeout(() => setAviso(null), 5000) })
    }
  }, [])

  const st = useCallback((id: string) => estado['s:' + id] ?? '', [estado])
  const feita = useCallback((id: string, i: number) => !!estado[`t:${id}.${i}`], [estado])
  const tdone = useCallback((p: Passo) => p.tarefas.filter((_, i) => estado[`t:${p.id}.${i}`]).length, [estado])

  const toggle = useCallback((p: Passo, i: number, v: boolean) => {
    const feitas = p.tarefas.filter((_, k) => k === i ? v : !!estado[`t:${p.id}.${k}`]).length
    const m: Record<string, string | null> = { [`t:${p.id}.${i}`]: v ? '1' : null }
    // todas feitas → card Feito; desmarcar uma tira o Feito
    if (feitas === p.tarefas.length) m['s:' + p.id] = 'done'
    else if (estado['s:' + p.id] === 'done') m['s:' + p.id] = null
    gravar(m)
  }, [estado, gravar])

  /* ── vista: arrastar, zoom, focar fase ── */
  const aplicar = useCallback((anim = false) => {
    const w = worldRef.current
    if (!w) return
    const { tx, ty, sc } = view.current
    w.style.transition = anim ? 'transform .45s cubic-bezier(.2,.7,.2,1)' : ''
    w.style.transform = `translate(${tx}px,${ty}px) scale(${sc})`
    if (anim) setTimeout(() => { if (worldRef.current) worldRef.current.style.transition = '' }, 480)
    // o minimapa redesenha no máximo uma vez por frame
    if (!raf.current) raf.current = requestAnimationFrame(() => { raf.current = 0; setTick(t => t + 1) })
  }, [])

  const focar = useCallback((i: number, anim = true) => {
    const r = stageRef.current?.getBoundingClientRect(), ph = mapa.nos.find(o => o.id === 'p' + i)
    if (!r || !ph) return
    // telemóvel: a fase e a 1.ª coluna de passos; computador: fase, passos e a fase seguinte
    const largura = r.width < 640 ? PW + GX + KW + 40 : PW + KW + GX * 2 + PW + 40
    const sc = Math.min(1.1, Math.max(0.45, r.width / largura))
    view.current = { sc, tx: -ph.x * sc + 24, ty: r.height / 2 }
    setCur(i)
    aplicar(anim)
  }, [mapa, aplicar])

  const zoomEm = useCallback((cx: number, cy: number, ns: number) => {
    const v = view.current
    ns = Math.min(2, Math.max(0.15, ns))
    view.current = { tx: cx - (cx - v.tx) * ns / v.sc, ty: cy - (cy - v.ty) * ns / v.sc, sc: ns }
    aplicar()
  }, [aplicar])

  const verTudo = useCallback(() => {
    const r = stageRef.current?.getBoundingClientRect()
    if (!r) return
    view.current = { sc: Math.max(0.15, (r.width - 40) / mapa.maxX), tx: 20, ty: r.height / 2 }
    aplicar(true)
  }, [mapa, aplicar])

  const centrarNo = useCallback((id: string) => {
    const nd = mapa.nos.find(o => o.id === id), r = stageRef.current?.getBoundingClientRect()
    if (!nd || !r) return
    const { sc } = view.current
    const lateral = r.width > 640
    view.current = { sc, tx: (lateral ? r.width * 0.3 : r.width / 2) - (nd.x + nd.w / 2) * sc, ty: (lateral ? r.height * 0.45 : r.height * 0.22) - (nd.y + nd.h / 2) * sc }
    aplicar(true)
  }, [mapa, aplicar])

  // centra a fase atual sempre que a tela muda de tamanho (inclui a 1.ª medição)
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    let w = 0, h = 0
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      if (!width || !height || (width === w && height === h)) return
      w = width; h = height
      setStageW(width); setMiniW(miniRef.current?.clientWidth ?? 0)
      focar(curRef.current, false)
    })
    ro.observe(stage)
    return () => ro.disconnect()
  }, [focar])

  /* rato e dedos */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const pts = new Map<number, { x: number; y: number }>()
    let last: { x: number; y: number } | null = null, pinch: { d: number; sc: number } | null = null
    const ignorar = (t: EventTarget | null) => !!(t as HTMLElement)?.closest?.('.panel,.zoom,.pop,.plus,.mini,.modal')
    const down = (e: PointerEvent) => {
      if (ignorar(e.target)) return
      setTour(false)
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved.current = 0
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), sc: view.current.sc } }
      else last = { x: e.clientX, y: e.clientY }
    }
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pts.size === 2 && pinch) {
        const [a, b] = [...pts.values()], r = stage.getBoundingClientRect()
        zoomEm((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, pinch.sc * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d)
        moved.current = 9; return
      }
      if (!last) return
      const dx = e.clientX - last.x, dy = e.clientY - last.y
      moved.current += Math.abs(dx) + Math.abs(dy)
      if (moved.current > 4) { stage.classList.add('drag'); if (!stage.hasPointerCapture(e.pointerId)) stage.setPointerCapture(e.pointerId) }
      view.current.tx += dx; view.current.ty += dy; last = { x: e.clientX, y: e.clientY }
      aplicar()
    }
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId)
      if (pts.size < 2) pinch = null
      if (!pts.size) { last = null; stage.classList.remove('drag') }
    }
    const wheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement)?.closest?.('.panel,.modal')) return
      e.preventDefault()
      const r = stage.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) zoomEm(e.clientX - r.left, e.clientY - r.top, view.current.sc * Math.exp(-e.deltaY * 0.01))
      else { view.current.tx -= e.deltaX || (e.shiftKey ? e.deltaY : 0); view.current.ty -= e.shiftKey ? 0 : e.deltaY; aplicar() }
    }
    stage.addEventListener('pointerdown', down)
    stage.addEventListener('pointermove', move)
    stage.addEventListener('pointerup', up)
    stage.addEventListener('pointercancel', up)
    stage.addEventListener('wheel', wheel, { passive: false })
    // ao focar um card fora de vista, o browser faz scroll à tela (overflow hidden) e desalinha tudo
    const semScroll = () => { if (stage.scrollLeft || stage.scrollTop) { stage.scrollLeft = 0; stage.scrollTop = 0 } }
    stage.addEventListener('scroll', semScroll)
    return () => {
      stage.removeEventListener('scroll', semScroll)
      stage.removeEventListener('pointerdown', down); stage.removeEventListener('pointermove', move)
      stage.removeEventListener('pointerup', up); stage.removeEventListener('pointercancel', up)
      stage.removeEventListener('wheel', wheel)
    }
  }, [zoomEm, aplicar])

  /* percorrer a jornada */
  useEffect(() => {
    if (!tour) return
    const iv = setInterval(() => {
      if (curRef.current >= FASES.length - 1) { setTour(false); return }
      focar(curRef.current + 1)
    }, 3400)
    return () => clearInterval(iv)
  }, [tour, focar])
  const alternarTour = () => {
    if (tour) { setTour(false); return }
    setFoco(true); setSel(null); setTour(true)
    focar(cur >= FASES.length - 1 ? 0 : cur)
  }

  /* teclado: setas mudam de fase, Esc fecha o painel */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (modal || (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      if (e.key === 'ArrowRight') { setTour(false); focar(Math.min(FASES.length - 1, curRef.current + 1)) }
      if (e.key === 'ArrowLeft') { setTour(false); focar(Math.max(0, curRef.current - 1)) }
      if (e.key === 'Escape') setSel(null)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [focar, modal])

  /* ── ações ── */
  const clicou = () => { if (moved.current > 4) { moved.current = 0; return false } return true }
  const abrirPasso = useCallback((id: string, centrar = false) => {
    setSel(id); setCur(faseDe(id)); setTour(false)
    if (centrar) centrarNo(id)
  }, [centrarNo])
  const alternarAberto = (id: string) => setAbertos(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const ctx: Ctx = {
    estado, stats, feita, tdone, toggle,
    setEstado: (id, v) => gravar({ ['s:' + id]: v || null }),
    abrirPasso,
    verMsg: (m: Mensagem) => setModal({ tipo: 'wa', m }),
    verMail: (e: Email) => setModal({ tipo: 'mail', e }),
  }

  /* ── ligações acesas ao passar o rato ── */
  const ligAcesas = useMemo(() => new Set(hover ? mapa.lig.filter(l => l.a.id === hover || l.b.id === hover).map(l => l.a.id + '>' + l.b.id) : []), [hover, mapa])
  const nosAcesos = useMemo(() => {
    const s = new Set<string>()
    if (hover) mapa.lig.forEach(l => { if (l.a.id === hover) s.add(l.b.id); if (l.b.id === hover) s.add(l.a.id) })
    return s
  }, [hover, mapa])
  const dimNo = (o: No) => foco && o.fase !== cur && o.id !== 'p' + (cur + 1)

  /* ── contagens ── */
  const feitos = PASSOS.filter(p => st(p.id) === 'done').length
  const emFalta = PASSOS.filter(p => st(p.id) === 'miss').length
  const sepAtivo = sel === 'EMAILS' ? 'Emails' : SEPARADORES.filter(t => t[1] >= 0).reduce((b, t) => t[1] <= cur && t[1] > b[1] ? t : b, SEPARADORES[0])[0]

  /* ── SVG ── */
  const svgTop = mapa.minY - 80, svgH = mapa.maxY - mapa.minY + 160, svgW = mapa.maxX + 40
  const fios: React.ReactElement[] = []
  mapa.lig.forEach((l, i) => {
    const { d, dot, lbl } = caminho(l, mapa)
    const key = l.a.id + '>' + l.b.id
    const hl = ligAcesas.has(key) ? ' hl' : ''
    const dim = foco && l.a.fase !== cur ? ' dim' : ''
    const feitoA = !!l.a.passo && st(l.a.id) === 'done'
    if (l.t === 'baixo') {
      fios.push(<path key={key} className={`w baixo${hl}${dim}`} markerEnd="url(#jr-ar2)" d={d} />)
    } else if (l.t === 'atalho') {
      fios.push(<path key={key} className={`w skip${hl}${dim}`} markerEnd="url(#jr-ar3)" d={d} />)
      if (lbl) fios.push(<text key={key + 't'} className="lbl2" x={lbl[0]} y={lbl[1]} textAnchor="middle">{l.lb}</text>)
    } else {
      const vertical = Math.abs(l.a.x - l.b.x) < 2
      const cls = l.t === 'lead' ? 'w' : l.t === 'seq' || vertical ? (feitoA ? 'w f' : 'w') : (feitoA ? 'w f' : 'w d')
      const seta = l.t === 'seq' || vertical
      fios.push(<path key={key} className={`${cls}${hl}${dim}`} markerEnd={seta ? 'url(#jr-ar)' : undefined} d={d} />)
      if (!rm && !vertical && (l.t !== 'out' || feitoA)) {
        fios.push(
          <circle key={key + 'p'} className={`part${dim}`} r={2.3}>
            <animateMotion dur={`${(2.2 + ((i * 37) % 14) / 10).toFixed(2)}s`} begin={`-${(((i * 53) % 30) / 10).toFixed(2)}s`} repeatCount="indefinite" path={d} />
          </circle>,
        )
      }
    }
    if (dot) fios.push(<circle key={key + 'd'} className={`dot${dim}`} cx={dot[0]} cy={dot[1]} r={l.t === 'baixo' || Math.abs(l.a.x - l.b.x) < 2 ? 4 : 5} />)
  })

  /* ── minimapa ── */
  const fasesNos = mapa.nos.filter(o => o.id[0] === 'p')

  const painel = sel && (
    sel === 'EMAILS' ? <PainelEmails ctx={ctx} />
      : sel === 'PRAZOS' ? <PainelPrazos ctx={ctx} />
        : sel[0] === 'P' ? <PainelFase fi={+sel.slice(1)} ctx={ctx} />
          : passoDe(sel) ? <PainelPasso p={passoDe(sel)!} ctx={ctx} /> : null
  )

  return (
    <div className="jr">
      <header className="top">
        <Link href="/crm" className="voltar">‹ CRM</Link>
        <div className="logo">RL <span>Photo Video</span></div>
        <nav className="tabs" role="tablist" aria-label="Áreas da app">
          {SEPARADORES.map(([nome, fi]) => (
            <button key={nome} type="button" role="tab" className="tab" aria-selected={nome === sepAtivo}
              onClick={() => { setTour(false); if (fi < 0) setSel('EMAILS'); else { setSel(null); focar(fi) } }}>{nome}</button>
          ))}
        </nav>
        <div className="prog">
          <span><b>{feitos}</b>/{PASSOS.length} feitos</span>
          <button type="button" className="prazos" onClick={() => setSel(sel === 'PRAZOS' ? null : 'PRAZOS')}>Prazos</button>
        </div>
      </header>

      <div ref={stageRef} className={`stage${foco ? ' focusing' : ''}`}>
        {emFalta > 0 && <div className="missing">{emFalta} em falta</div>}
        {tour && <div className="tourlbl"><small>Fase {pad(cur + 1)} de {pad(FASES.length)}</small>{FASES[cur].titulo}</div>}
        {carga !== 'ok' && <div className="carregar">{carga === 'erro' ? 'Sem ligação ao estado guardado' : 'A carregar o estado…'}</div>}
        {aviso && <div className="carregar" style={{ color: '#FF5468' }}>{aviso}</div>}

        <div ref={worldRef} className={`world${intro ? ' intro' : ''}`}>
          <svg className="wires" width={svgW} height={svgH} style={{ top: svgTop }} viewBox={`0 ${svgTop} ${svgW} ${svgH}`} aria-hidden="true">
            <defs>
              <marker id="jr-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#E2C27A" /></marker>
              <marker id="jr-ar2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#FFB547" /></marker>
              <marker id="jr-ar3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#3DDC97" /></marker>
            </defs>
            {fios}
          </svg>

          {mapa.nos.map(o => {
            const delay = { ['--d' as any]: `${Math.min(2.2, o.x / 2600).toFixed(2)}s` }
            const pos = { left: o.x, top: o.y, width: o.w, height: o.h, ...delay }
            const aberto = abertos.has(o.id)
            const comum = {
              role: 'button', tabIndex: 0, style: pos,
              onPointerEnter: () => setHover(o.id), onPointerLeave: () => setHover(h => h === o.id ? null : h),
              onKeyDown: (e: React.KeyboardEvent) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); (e.currentTarget as HTMLElement).click() } },
            }
            const plus = (
              <button type="button" className="plus" aria-label={`${aberto ? 'Fechar' : 'Abrir'} ${o.passo?.titulo ?? FASES[o.fase].titulo}`}
                onClick={e => { e.stopPropagation(); alternarAberto(o.id) }}>{aberto ? '−' : '+'}</button>
            )
            const pop = aberto && (
              <div className="pop" style={{ left: o.x, top: o.y + o.h + 8, width: o.w + 40 }} onClick={e => e.stopPropagation()}>
                {o.passo ? <PopPasso p={o.passo} ctx={ctx} /> : <PopFase fi={o.fase} ctx={ctx} />}
              </div>
            )
            const cls = `${dimNo(o) ? ' dim' : ''}${nosAcesos.has(o.id) ? ' lit' : ''}`
            if (!o.passo) {
              const f = FASES[o.fase]
              return (
                <div key={o.id} style={{ display: 'contents' }}>
                  <div {...comum} className={`n p${cls}${sel === 'P' + o.fase ? ' sel' : ''}`}
                    onClick={() => { if (!clicou()) return; setSel('P' + o.fase); setTour(false); focar(o.fase) }}>
                    <span className="code">{pad(o.fase + 1)}</span>
                    <span className="tx"><b style={f.titulo.length > 12 ? { fontSize: 16 } : undefined}>{f.titulo}</b><small>{f.sub}</small></span>
                    <span className="ic">{f.passos.filter(p => st(p.id) === 'done').length}/{f.passos.length}</span>
                    {plus}
                  </div>
                  {pop}
                </div>
              )
            }
            const p = o.passo, s = st(p.id)
            return (
              <div key={o.id} style={{ display: 'contents' }}>
                <div {...comum} className={`n ${s}${o.saida && !s ? ' hot' : ''}${sel === p.id ? ' sel' : ''}${cls}`}
                  onClick={() => { if (clicou()) abrirPasso(p.id, stageW < 640) }}>
                  <span className="tx"><b>{p.titulo}</b><small>{p.sub}</small></span>
                  <span className="ic">{s === 'done' ? '✓' : s === 'miss' ? '!' : `${tdone(p)}/${p.tarefas.length}`}</span>
                  <span className="badges">
                    {!!p.emails?.length && <span className="mb">✉️ {p.emails.length}</span>}
                    {!!p.mensagens?.length && <span className="mb wab">WA {p.mensagens.length}</span>}
                  </span>
                  {plus}
                </div>
                {pop}
              </div>
            )
          })}
        </div>

        <div ref={miniRef} className="mini" aria-label="Mapa geral"
          onClick={e => {
            const m = e.currentTarget, r = stageRef.current!.getBoundingClientRect()
            const x = (e.clientX - m.getBoundingClientRect().left) / m.clientWidth * mapa.maxX
            view.current.tx = r.width / 2 - x * view.current.sc
            const ph = [...fasesNos].reverse().find(o => o.x <= x)
            if (ph) setCur(ph.fase)
            aplicar(true)
          }}>
          {miniW > 0 && fasesNos.map((o, i) => {
            const W = miniW, x2 = fasesNos[i + 1]?.x ?? mapa.maxX
            const ok = FASES[i].passos.every(p => st(p.id) === 'done')
            return <i key={o.id} className={`${ok ? 'ok' : ''} ${i === cur ? 'cur' : ''}`} style={{ left: o.x / mapa.maxX * W + 1, width: Math.max(3, (x2 - o.x) / mapa.maxX * W - 2) }} />
          })}
          {miniW > 0 && stageW > 0 && (() => {
            const W = miniW, { tx, sc } = view.current, vx = -tx / sc, vw = stageW / sc
            return <b style={{ left: Math.max(0, vx / mapa.maxX * W), width: Math.max(8, Math.min(W, vw / mapa.maxX * W)) }} />
          })()}
        </div>

        <div className="zoom">
          <button type="button" className="zb" aria-label="Aproximar" onClick={() => { const r = stageRef.current!.getBoundingClientRect(); zoomEm(r.width / 2, r.height / 2, view.current.sc * 1.25) }}>+</button>
          <button type="button" className="zb" aria-label="Afastar" onClick={() => { const r = stageRef.current!.getBoundingClientRect(); zoomEm(r.width / 2, r.height / 2, view.current.sc / 1.25) }}>−</button>
          <button type="button" className="zb" aria-label="Ver tudo" title="Ver tudo" onClick={verTudo}>⤢</button>
          <button type="button" className={`zb${foco ? ' on' : ''}`} aria-label="Modo foco" title="Foco na fase" aria-pressed={foco} onClick={() => setFoco(f => !f)}>◎</button>
          <button type="button" className={`zb${tour ? ' on' : ''}`} aria-label="Percorrer a jornada" title="Percorrer a jornada" aria-pressed={tour} onClick={alternarTour}>{tour ? '❚❚' : '▶︎'}</button>
        </div>

        {painel && (
          <aside className="panel" aria-label="Detalhe">
            <button type="button" className="x" onClick={() => setSel(null)} aria-label="Fechar">×</button>
            {painel}
          </aside>
        )}
      </div>

      <nav className="rail" aria-label="Fases">
        <div className="rail-in" ref={railRef}>
          {FASES.map((f, i) => {
            const ss = f.passos.map(p => st(p.id))
            const c = ss.includes('miss') ? 'bad' : ss.every(s => s === 'done') ? 'ok' : ''
            return (
              <button key={i} type="button" className={`pill ${c}`} aria-current={i === cur ? 'true' : undefined}
                onClick={() => { setTour(false); setSel(null); focar(i) }}>
                <span className="k">{pad(i + 1)}</span>{f.titulo}
              </button>
            )
          })}
        </div>
      </nav>

      <MensagemModal alvo={modal} onClose={() => setModal(null)} />
    </div>
  )
}
