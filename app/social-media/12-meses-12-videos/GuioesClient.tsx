'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GUIOES, PLANO, type Estado, type Guiao } from './_data/guioes'

/* ============================================================
   Película dos 12 meses + palco do mês seleccionado.
   Estado e link do vídeo são guardados em /api/guioes-12meses.
   Modo teleponto em ecrã inteiro com rolagem automática.
   ============================================================ */

const ESTADOS: Estado[] = ['por gravar', 'gravado', 'editado', 'publicado']
const PALAVRAS_POR_SEG = 2.5

type Campos = { estado: Estado; link: string }
type Filtro = Estado | 'todos'

/** Mês do projecto que corresponde a hoje (setembro 2026 = 1). */
function mesAtual(): number | null {
  const d = new Date()
  const n = (d.getFullYear() - 2026) * 12 + d.getMonth() + 1 - 8
  return n >= 1 && n <= 12 ? n : null
}

function diasAteFimDoMes(): number {
  const d = new Date()
  const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return fim.getDate() - d.getDate()
}

function palavras(g: Guiao): number {
  return g.teleponto
    .map(p => `${p.label ?? ''} ${p.text ?? ''}`)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
}

function slug(estado: Estado) {
  return estado.replace(/\s+/g, '-')
}

export default function GuioesClient() {
  const hoje = useMemo(mesAtual, [])
  const [dados, setDados]       = useState<Record<number, Campos>>({})
  const [loading, setLoading]   = useState(true)
  const [sel, setSel]           = useState<number>(hoje ?? 1)
  const [dir, setDir]           = useState<1 | -1>(1)
  const [filtro, setFiltro]     = useState<Filtro>('todos')
  const [aba, setAba]           = useState<'teleponto' | 'nota'>('teleponto')
  const [plano, setPlano]       = useState<'producao' | 'formatos' | 'distribuicao'>('producao')
  const [prompter, setPrompter] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [erro, setErro]         = useState<string | null>(null)
  const stripRef = useRef<HTMLDivElement>(null)

  // Uma leitura por abertura da página
  useEffect(() => {
    fetch('/api/guioes-12meses')
      .then(r => r.json())
      .then(j => {
        const map: Record<number, Campos> = {}
        for (const m of j.meses ?? []) {
          map[m.n] = { estado: (m.estado ?? 'por gravar') as Estado, link: m.link ?? '' }
        }
        setDados(map)
      })
      .catch(() => setErro('Não foi possível carregar o estado dos meses.'))
      .finally(() => setLoading(false))
  }, [])

  const campos = useCallback(
    (n: number): Campos => dados[n] ?? { estado: 'por gravar', link: '' },
    [dados],
  )

  const escolher = useCallback((n: number) => {
    setSel(prev => {
      if (n === prev) return prev
      setDir(n > prev ? 1 : -1)
      return n
    })
  }, [])

  // Setas do teclado para mudar de mês (fora de campos e do teleponto)
  useEffect(() => {
    if (prompter) return
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight') escolher(Math.min(12, sel + 1))
      if (e.key === 'ArrowLeft')  escolher(Math.max(1, sel - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel, prompter, escolher])

  // Manter o fotograma seleccionado visível na película
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-n="${sel}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [sel])

  async function guardar(n: number, patch: Partial<Campos>) {
    setDados(prev => ({ ...prev, [n]: { ...campos(n), ...patch } }))
    setErro(null)
    try {
      const r = await fetch('/api/guioes-12meses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n, ...patch }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? 'erro')
      setGuardado(true)
      setTimeout(() => setGuardado(false), 1800)
    } catch (e: any) {
      setErro(`Não foi possível guardar: ${e.message}`)
    }
  }

  const contagem = useMemo(() => {
    const c: Record<Estado, number> = { 'por gravar': 0, gravado: 0, editado: 0, publicado: 0 }
    for (const g of GUIOES) c[campos(g.n).estado]++
    return c
  }, [campos])

  const guiao = GUIOES.find(g => g.n === sel)!
  const c = campos(sel)
  const nPal = palavras(guiao)
  const segs = Math.round(nPal / PALAVRAS_POR_SEG)
  const passo = ESTADOS.indexOf(c.estado)
  const progresso = Math.round((contagem.publicado / 12) * 100)
  const guiaoHoje = hoje ? GUIOES.find(g => g.n === hoje) : null

  return (
    <>
      {/* ── Painel de topo: progresso + este mês ── */}
      <section className="mv-dash">
        <div className="mv-prog">
          <div className="mv-prog-head">
            <span className="mv-prog-pct">{progresso}<small>%</small></span>
            <span className="mv-prog-txt">
              <strong>{contagem.publicado}</strong> de 12 publicados
            </span>
          </div>
          <div className="mv-segs" role="list">
            {GUIOES.map(g => (
              <button
                key={g.n}
                type="button"
                role="listitem"
                title={`${g.mes} · ${campos(g.n).estado}`}
                className={`mv-seg is-${slug(campos(g.n).estado)} ${g.n === sel ? 'is-sel' : ''}`}
                onClick={() => escolher(g.n)}
              />
            ))}
          </div>
          <div className="mv-chips">
            <button
              type="button"
              className={`mv-chip ${filtro === 'todos' ? 'is-on' : ''}`}
              onClick={() => setFiltro('todos')}
            >
              Todos <b>12</b>
            </button>
            {ESTADOS.map(e => (
              <button
                key={e}
                type="button"
                className={`mv-chip is-${slug(e)} ${filtro === e ? 'is-on' : ''}`}
                onClick={() => setFiltro(filtro === e ? 'todos' : e)}
              >
                <i aria-hidden="true" /> {e} <b>{loading ? '·' : contagem[e]}</b>
              </button>
            ))}
          </div>
        </div>

        {guiaoHoje && (
          <button type="button" className="mv-agora" onClick={() => escolher(guiaoHoje.n)}>
            <span className="mv-agora-rec"><i aria-hidden="true" /> Este mês</span>
            <span className="mv-agora-titulo">{guiaoHoje.titulo}</span>
            <span className="mv-agora-foot">
              <span>{guiaoHoje.mes} · {campos(guiaoHoje.n).estado}</span>
              <span className="mv-agora-dias">
                <strong>{diasAteFimDoMes()}</strong> dias até ao fim do mês
              </span>
            </span>
          </button>
        )}
      </section>

      {erro && <p className="mv-erro">{erro}</p>}

      {/* ── Película dos 12 meses ── */}
      <section className="mv-film">
        <button
          type="button"
          className="mv-film-nav"
          onClick={() => escolher(Math.max(1, sel - 1))}
          disabled={sel === 1}
          aria-label="Mês anterior"
        >‹</button>

        <div className="mv-strip" ref={stripRef}>
          {GUIOES.map(g => {
            const e = campos(g.n).estado
            const fora = filtro !== 'todos' && e !== filtro
            return (
              <button
                key={g.n}
                data-n={g.n}
                type="button"
                className={[
                  'mv-frame',
                  `is-${slug(e)}`,
                  g.n === sel ? 'is-sel' : '',
                  g.n === hoje ? 'is-hoje' : '',
                  fora ? 'is-fora' : '',
                ].join(' ')}
                onClick={() => escolher(g.n)}
              >
                <span className="mv-frame-num">{String(g.n).padStart(2, '0')}</span>
                <span className="mv-frame-mes">{g.mes.slice(0, 3)} <em>{String(g.ano).slice(2)}</em></span>
                <span className="mv-frame-titulo">{g.titulo}</span>
                <span className="mv-frame-estado">
                  <i aria-hidden="true" /> {loading ? '·' : e}
                  {campos(g.n).link && <span className="mv-frame-link">▶</span>}
                </span>
                {g.n === hoje && <span className="mv-frame-hoje">agora</span>}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="mv-film-nav"
          onClick={() => escolher(Math.min(12, sel + 1))}
          disabled={sel === 12}
          aria-label="Mês seguinte"
        >›</button>
      </section>
      <p className="mv-dica">← → para mudar de mês</p>

      {/* ── Palco do mês seleccionado ── */}
      <article key={sel} className={`mv-stage ${dir === 1 ? 'from-right' : 'from-left'}`}>
        <span className="mv-stage-bignum" aria-hidden="true">{String(sel).padStart(2, '0')}</span>

        <header className="mv-stage-head">
          <p className="mv-stage-meta">
            {guiao.mes} {guiao.ano}
            <span>·</span> {guiao.duracao}
            {guiao.publicacao && <><span>·</span> publicar {guiao.publicacao}</>}
          </p>
          <h2 className="mv-stage-titulo">{guiao.titulo}</h2>
        </header>

        {/* Estado em pipeline */}
        <div className="mv-pipe" style={{ ['--p' as any]: passo / (ESTADOS.length - 1) }}>
          <div className="mv-pipe-track"><div className="mv-pipe-fill" /></div>
          {ESTADOS.map((e, i) => (
            <button
              key={e}
              type="button"
              className={`mv-pipe-step ${i <= passo ? 'is-done' : ''} ${i === passo ? 'is-cur' : ''}`}
              onClick={() => guardar(sel, { estado: e })}
            >
              <span className="mv-pipe-dot">{i < passo ? '✓' : i + 1}</span>
              <span className="mv-pipe-label">{e}</span>
            </button>
          ))}
        </div>

        {/* Link */}
        <div className="mv-linkrow">
          <input
            type="url"
            className="mv-input"
            placeholder="Link do vídeo publicado (https://)"
            defaultValue={c.link}
            key={`link-${sel}-${loading}`}
            onBlur={e => {
              const v = e.target.value.trim()
              if (v !== c.link) guardar(sel, { link: v })
            }}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          />
          {c.link && (
            <a className="mv-abrir" href={c.link} target="_blank" rel="noreferrer">Abrir ↗</a>
          )}
          <span className={`mv-guardado ${guardado ? 'is-on' : ''}`}>Guardado</span>
        </div>

        {/* Abas */}
        <div className="mv-tabs" role="tablist">
          <button
            type="button" role="tab" aria-selected={aba === 'teleponto'}
            className={`mv-tab ${aba === 'teleponto' ? 'is-on' : ''}`}
            onClick={() => setAba('teleponto')}
          >Teleponto</button>
          <button
            type="button" role="tab" aria-selected={aba === 'nota'}
            className={`mv-tab ${aba === 'nota' ? 'is-on' : ''}`}
            onClick={() => setAba('nota')}
          >Nota de realização</button>
          <span className="mv-tabs-stats">
            {nPal} palavras · ~{segs}s de leitura
          </span>
        </div>

        {aba === 'teleponto' ? (
          <div className="mv-tele">
            {guiao.teleponto.map((par, i) => (
              <p key={i} style={{ animationDelay: `${i * 45}ms` }}>
                {par.label && <strong>{par.label}</strong>}
                {par.label && par.text ? ' ' : null}
                {par.text}
              </p>
            ))}
            <button type="button" className="mv-prompter-btn" onClick={() => setPrompter(true)}>
              <span className="mv-play" aria-hidden="true">▶</span> Abrir modo teleponto
            </button>
          </div>
        ) : (
          <p className="mv-nota">{guiao.nota}</p>
        )}

        {/* Navegação entre meses */}
        <footer className="mv-stage-foot">
          {sel > 1 ? (
            <button type="button" className="mv-next" onClick={() => escolher(sel - 1)}>
              <small>‹ Anterior</small>
              {GUIOES[sel - 2].mes}
            </button>
          ) : <span />}
          {sel < 12 ? (
            <button type="button" className="mv-next mv-next--r" onClick={() => escolher(sel + 1)}>
              <small>Seguinte ›</small>
              {GUIOES[sel].mes}
            </button>
          ) : <span />}
        </footer>
      </article>

      {/* ── Plano em abas ── */}
      <section className="mv-plano">
        <h2 className="mv-plano-title">Produção e distribuição</h2>
        <div className="mv-plano-tabs">
          {([
            ['producao', 'Produção'],
            ['formatos', 'Formatos'],
            ['distribuicao', 'Distribuição'],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`mv-plano-tab ${plano === k ? 'is-on' : ''}`}
              onClick={() => setPlano(k)}
            >{label}</button>
          ))}
        </div>
        <ol key={plano} className="mv-plano-list">
          {PLANO[plano].map((t, i) => (
            <li key={i} style={{ animationDelay: `${i * 60}ms` }}>
              <span className="mv-plano-n">{String(i + 1).padStart(2, '0')}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </section>

      {prompter && <Prompter guiao={guiao} onClose={() => setPrompter(false)} />}
    </>
  )
}

/* ── Modo teleponto: ecrã inteiro, rolagem automática ── */
function Prompter({ guiao, onClose }: { guiao: Guiao; onClose: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [play, setPlay]   = useState(false)
  const [vel, setVel]     = useState(40) // píxeis por segundo
  const [espelho, setEspelho] = useState(false)
  const [pct, setPct]     = useState(0)
  const pos = useRef(0)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ') { e.preventDefault(); setPlay(p => !p) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setVel(v => Math.min(160, v + 10)) }
      if (e.key === 'ArrowDown') { e.preventDefault(); setVel(v => Math.max(10, v - 10)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (!play) return
    let raf = 0
    let last = performance.now()
    const box = boxRef.current
    if (box) pos.current = box.scrollTop
    function tick(t: number) {
      const b = boxRef.current
      if (!b) return
      pos.current += (vel * (t - last)) / 1000
      last = t
      b.scrollTop = pos.current
      if (b.scrollTop + b.clientHeight >= b.scrollHeight - 1) { setPlay(false); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [play, vel])

  function onScroll() {
    const b = boxRef.current
    if (!b) return
    const max = b.scrollHeight - b.clientHeight
    setPct(max > 0 ? b.scrollTop / max : 0)
    if (!play) pos.current = b.scrollTop
  }

  return (
    <div className="mv-pr">
      <div className="mv-pr-bar"><div style={{ width: `${pct * 100}%` }} /></div>
      <div className="mv-pr-guide" aria-hidden="true" />
      <div
        className={`mv-pr-box ${espelho ? 'is-espelho' : ''}`}
        ref={boxRef}
        onScroll={onScroll}
        onClick={() => setPlay(p => !p)}
      >
        <div className="mv-pr-pad" />
        {guiao.teleponto.map((par, i) => (
          <p key={i}>
            {par.label && <strong>{par.label}</strong>}
            {par.label && par.text ? ' ' : null}
            {par.text}
          </p>
        ))}
        <p className="mv-pr-fim">· fim ·</p>
        <div className="mv-pr-pad" />
      </div>

      <div className="mv-pr-ctrl">
        <button type="button" className="mv-pr-b mv-pr-play" onClick={() => setPlay(p => !p)}>
          {play ? '❚❚' : '▶'}
        </button>
        <button type="button" className="mv-pr-b" onClick={() => setVel(v => Math.max(10, v - 10))}>−</button>
        <span className="mv-pr-vel">{vel}<small> px/s</small></span>
        <button type="button" className="mv-pr-b" onClick={() => setVel(v => Math.min(160, v + 10))}>+</button>
        <button
          type="button"
          className={`mv-pr-b mv-pr-txt ${espelho ? 'is-on' : ''}`}
          onClick={() => setEspelho(e => !e)}
        >Espelho</button>
        <button
          type="button"
          className="mv-pr-b mv-pr-txt"
          onClick={() => { setPlay(false); boxRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }}
        >Início</button>
        <button type="button" className="mv-pr-b mv-pr-txt" onClick={onClose}>Fechar</button>
      </div>
      <p className="mv-pr-dica">espaço: play/pausa · ↑ ↓ velocidade · esc: fechar</p>
    </div>
  )
}
