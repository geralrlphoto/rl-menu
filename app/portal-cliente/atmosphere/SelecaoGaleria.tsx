'use client'

/* ============================================================
   SelecaoGaleria — galeria de seleção dentro do portal.
   Lê a galeria do Wfolio (pastas + fotos) por /api/fotos-selecao-galeria,
   os noivos tocam numa foto, carregam em Selecionar e no fim em
   Enviar seleção. A escolha fica guardada no portal (dá para continuar
   noutro dispositivo) e chega à RL pelo mesmo caminho do formulário.
   Abre num portal para o <body>, com as variáveis do tema do portal.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './selecao-galeria.css'

type Foto = { n: string; t: string; g: string; r: number }
type Pasta = { nome: string; slug: string; fotos: Foto[] }
export type EstadoSelecao = { sel: string[]; atualizado?: string | null; enviada?: string | null }
type FotoL = Foto & { pasta: string }

const PASSO = 120
/** Escolha do portal + alterações deste aparelho ainda por confirmar */
function juntar(base: string[], d: Record<string, 'add' | 'rem'>): string[] {
  const out = base.filter(n => d[n] !== 'rem')
  for (const n of Object.keys(d)) if (d[n] === 'add' && !out.includes(n)) out.push(n)
  return out
}
const dataPt = (iso: string) => new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })

export function SelecaoGaleria({ portalRef, tipo, temaRL, onClose, onEstado, fonteUrl, convidados }: {
  /** Noivos: referência do portal. Convidados: id do portal. */
  portalRef: string
  tipo: 'casamento' | 'batizado'
  temaRL: boolean
  onClose: () => void
  onEstado?: (e: EstadoSelecao) => void
  /** De onde vêm as fotografias (por omissão, a galeria de seleção dos noivos) */
  fonteUrl?: string
  /** Modo convidados: a escolha fica só neste dispositivo e o fim é "Continuar"
   *  para o formulário de compra, em vez de enviar a seleção. */
  convidados?: { onContinuar: (sel: string[]) => void }
}) {
  const conv = !!convidados
  const [pastas, setPastas] = useState<Pasta[] | null>(null)
  const [cdn, setCdn] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sel, setSel] = useState<string[]>([])
  const [enviada, setEnviada] = useState<string | null>(null)
  const [guardado, setGuardado] = useState<'ok' | 'a-guardar' | 'erro'>('ok')
  const [pasta, setPasta] = useState<string>('todas')
  const [filtro, setFiltro] = useState<'todas' | 'sel'>('todas')
  const [mostrar, setMostrar] = useState(PASSO)
  const [aberta, setAberta] = useState<number | null>(null)
  const [confirmar, setConfirmar] = useState(false)
  const [aEnviar, setAEnviar] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const maisRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const carregado = useRef(false)
  const selRef = useRef<string[]>([])
  const guardarRef = useRef<(() => void) | null>(null)
  // alterações ainda por confirmar pelo portal: nome → juntar/tirar
  const delta = useRef<Record<string, 'add' | 'rem'>>({})
  useEffect(() => { selRef.current = sel }, [sel])

  // ── carregar a galeria e a escolha guardada ──
  useEffect(() => {
    let vivo = true
    fetch(fonteUrl ?? `/api/fotos-selecao-galeria?ref=${encodeURIComponent(portalRef)}`)
      .then(r => r.json())
      .then(d => {
        if (!vivo) return
        if (conv) {
          // Convidados: a escolha vive só neste dispositivo
          try {
            const local = JSON.parse(localStorage.getItem(`rl_conv_${portalRef}`) || 'null')
            if (local && Array.isArray(local.sel)) { setSel(local.sel); selRef.current = local.sel }
          } catch {}
        } else if (d?.estado) {
          setEnviada(d.estado.enviada ?? null)
          // Alterações que ficaram só neste aparelho (a internet falhou ao sair): juntam-se e seguem
          if (!d.estado.enviada) {
            try {
              const local = JSON.parse(localStorage.getItem(`rl_selecao_${portalRef}`) || 'null')
              if (local?.delta && typeof local.delta === 'object') delta.current = { ...local.delta, ...delta.current }
            } catch {}
          }
          const base = juntar(d.estado.sel ?? [], delta.current)
          setSel(base); selRef.current = base
          if (Object.keys(delta.current).length) guardarRef.current?.()
        }
        if (!d?.ok) { setErro(d?.error === 'wfolio' ? 'A galeria está a demorar a responder. Tentem de novo daqui a pouco.' : 'A galeria ainda não está disponível.'); return }
        setCdn(d.cdn)
        setPastas(d.pastas)
        carregado.current = true
      })
      .catch(() => vivo && setErro('Não foi possível abrir a galeria. Verifiquem a ligação à internet.'))
    return () => { vivo = false }
  }, [portalRef, fonteUrl, conv])

  // ── bloquear o scroll da página por baixo ──
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const src = useCallback((u: string) => (u.startsWith('//') ? 'https:' + u : u.startsWith('http') ? u : cdn + u), [cdn])
  const selSet = useMemo(() => new Set(sel), [sel])

  const todas: FotoL[] = useMemo(() => (pastas ?? []).flatMap(p => p.fotos.map(f => ({ ...f, pasta: p.nome }))), [pastas])
  const lista: FotoL[] = useMemo(
    () => todas.filter(f => (pasta === 'todas' || f.pasta === pasta) && (filtro === 'todas' || selSet.has(f.n))),
    [todas, pasta, filtro, selSet],
  )
  const porPasta = useMemo(() => {
    const m: Record<string, number> = {}
    for (const f of todas) if (selSet.has(f.n)) m[f.pasta] = (m[f.pasta] ?? 0) + 1
    return m
  }, [todas, selSet])

  // ── guardar a escolha ──
  // Cada toque é uma alteração ("juntar" ou "tirar"). Seguem para o portal pouco
  // depois e, se ainda faltar, logo que fecham a galeria ou saem do portal. O portal
  // junta as alterações dos dois aparelhos, por isso os noivos podem escolher ao
  // mesmo tempo. Até o portal confirmar, as alterações ficam também neste aparelho.
  const chaveLocal = conv ? `rl_conv_${portalRef}` : `rl_selecao_${portalRef}`
  const onEstadoRef = useRef(onEstado)
  useEffect(() => { onEstadoRef.current = onEstado }, [onEstado])

  const guardarLocal = useCallback(() => {
    try {
      if (Object.keys(delta.current).length) localStorage.setItem(chaveLocal, JSON.stringify({ delta: delta.current, em: Date.now() }))
      else localStorage.removeItem(chaveLocal)
    } catch {}
  }, [chaveLocal])

  const mostrarServidor = useCallback((estado: EstadoSelecao) => {
    if (estado.enviada) { setEnviada(estado.enviada); delta.current = {}; guardarLocal() }
    const nova = juntar(estado.sel ?? [], delta.current)
    selRef.current = nova
    setSel(nova)
  }, [guardarLocal])

  const enviarAlteracoes = useCallback((aSair = false) => {
    const envio = { ...delta.current }
    const nomes = Object.keys(envio)
    if (!nomes.length) return
    fetch('/api/fotos-selecao-galeria', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: portalRef, acao: 'alterar',
        add: nomes.filter(n => envio[n] === 'add'),
        rem: nomes.filter(n => envio[n] === 'rem'),
      }),
      keepalive: aSair,
    }).then(async r => {
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setGuardado('erro'); if (d?.estado?.enviada) mostrarServidor(d.estado); return }
      // o que já chegou ao portal sai da lista de alterações por enviar
      for (const n of nomes) if (delta.current[n] === envio[n]) delete delta.current[n]
      guardarLocal()
      if (d?.estado) { mostrarServidor(d.estado); onEstadoRef.current?.(d.estado) }
      setGuardado(Object.keys(delta.current).length ? 'a-guardar' : 'ok')
    }).catch(() => setGuardado('erro'))
  }, [portalRef, guardarLocal, mostrarServidor])

  const guardar = useCallback(() => {
    guardarLocal()
    if (timer.current) clearTimeout(timer.current)
    setGuardado('a-guardar')
    timer.current = setTimeout(() => enviarAlteracoes(), 700)
  }, [guardarLocal, enviarAlteracoes])

  useEffect(() => { guardarRef.current = guardar }, [guardar])

  // Vai buscar ao portal as escolhas feitas noutro aparelho (sem polling: só quando voltam à galeria)
  const atualizar = useCallback(async () => {
    if (conv) return
    try {
      const r = await fetch(`/api/fotos-selecao-galeria?ref=${encodeURIComponent(portalRef)}&estado=1`)
      const d = await r.json()
      if (d?.estado) mostrarServidor(d.estado)
    } catch {}
  }, [conv, portalRef, mostrarServidor])

  // ao fechar a galeria, mudar de separador ou sair do portal: guarda já o que faltar;
  // ao voltar ao separador: atualiza com as escolhas do outro aparelho
  useEffect(() => {
    if (conv) return
    const despachar = () => {
      if (!Object.keys(delta.current).length) return
      if (timer.current) clearTimeout(timer.current)
      enviarAlteracoes(true)
    }
    const aoMudar = () => { if (document.visibilityState === 'hidden') despachar(); else atualizar() }
    window.addEventListener('pagehide', despachar)
    document.addEventListener('visibilitychange', aoMudar)
    return () => {
      window.removeEventListener('pagehide', despachar)
      document.removeEventListener('visibilitychange', aoMudar)
      despachar()
    }
  }, [conv, enviarAlteracoes, atualizar])

  const toast = (t: string) => { setAviso(t); setTimeout(() => setAviso(a => (a === t ? null : a)), 1800) }

  const alternar = useCallback((n: string) => {
    if (enviada) { toast('A seleção já foi enviada'); return }
    const prev = selRef.current
    const tirar = prev.includes(n)
    const nova = tirar ? prev.filter(x => x !== n) : [...prev, n]
    selRef.current = nova
    setSel(nova)
    if (conv) {   // convidados: só neste dispositivo
      try { localStorage.setItem(chaveLocal, JSON.stringify({ sel: nova, em: Date.now() })) } catch {}
      return
    }
    delta.current[n] = tirar ? 'rem' : 'add'
    guardar()
  }, [enviada, guardar, conv, chaveLocal])

  // ── carregar mais fotografias ao descer ──
  useEffect(() => { setMostrar(PASSO) }, [pasta, filtro])
  useEffect(() => {
    const el = maisRef.current
    const root = rootRef.current
    if (!el || !root) return
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) setMostrar(m => m + PASSO)
    }, { root, rootMargin: '900px' })
    io.observe(el)
    return () => io.disconnect()
  }, [lista.length, mostrar])

  // ── teclado ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (confirmar) { if (e.key === 'Escape') setConfirmar(false); return }
      if (aberta === null) { if (e.key === 'Escape') onClose(); return }
      if (e.key === 'Escape') setAberta(null)
      else if (e.key === 'ArrowRight') setAberta(i => (i === null ? i : (i + 1) % lista.length))
      else if (e.key === 'ArrowLeft') setAberta(i => (i === null ? i : (i - 1 + lista.length) % lista.length))
      else if (e.key.toLowerCase() === 's' && lista[aberta]) alternar(lista[aberta].n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberta, lista, alternar, confirmar, onClose])

  // se a foto aberta deixar de estar na lista (ex.: tirada em "A minha seleção")
  useEffect(() => {
    if (aberta !== null && aberta >= lista.length) setAberta(lista.length ? lista.length - 1 : null)
  }, [aberta, lista.length])

  const toque = useRef<number | null>(null)

  async function enviar() {
    setAEnviar(true)
    if (timer.current) clearTimeout(timer.current)
    try {
      const r = await fetch('/api/fotos-selecao-galeria', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ref: portalRef, acao: 'enviar', tipo,
          add: Object.keys(delta.current).filter(n => delta.current[n] === 'add'),
          rem: Object.keys(delta.current).filter(n => delta.current[n] === 'rem'),
        }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { toast(d?.error || 'Não foi possível enviar. Tentem de novo.'); if (d?.estado?.enviada) mostrarServidor(d.estado); return }
      delta.current = {}
      guardarLocal()
      mostrarServidor(d.estado)
      onEstado?.(d.estado)
      setConfirmar(false)
      rootRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    } finally { setAEnviar(false) }
  }

  const foto = aberta !== null ? lista[aberta] : null
  const seguinte = aberta !== null && lista.length ? lista[(aberta + 1) % lista.length] : null
  const nomesPastas = (pastas ?? []).map(p => p.nome)
  const variasPastas = nomesPastas.length > 1

  // grelha com títulos de pasta
  const celulas: ReactNode[] = []
  let ultima: string | null = null
  lista.slice(0, mostrar).forEach((f, i) => {
    if (pasta === 'todas' && variasPastas && f.pasta !== ultima) {
      ultima = f.pasta
      const k = porPasta[f.pasta] ?? 0
      celulas.push(
        <h3 key={`h-${f.pasta}`} className="sg-sep">
          <span>{f.pasta}</span>
          {k > 0 && <i>{k} {k === 1 ? 'escolhida' : 'escolhidas'}</i>}
        </h3>,
      )
    }
    const on = selSet.has(f.n)
    celulas.push(
      <div key={f.n} className={`sg-cel${on ? ' on' : ''}`} onClick={() => setAberta(i)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src(f.t)} alt={f.n} loading="lazy" referrerPolicy="no-referrer" />
        <span className="sg-num">{f.n}</span>
        <button
          type="button"
          className="sg-chk"
          aria-label={on ? 'Tirar da seleção' : 'Selecionar'}
          onClick={e => { e.stopPropagation(); alternar(f.n) }}
        >✓</button>
      </div>,
    )
  })

  const total = sel.length
  const titulo = conv ? `Fotografias do ${tipo}` : 'Galeria para Seleção'

  return createPortal(
    <div className={`portal-atmosphere fp-modal-root sg-root${temaRL ? ' tema-rl' : ''}`} ref={rootRef}>
      {/* ── barra do topo ── */}
      <header className="sg-top">
        <button type="button" className="sg-voltar" onClick={onClose}>‹ Voltar</button>
        <span className="sg-top-t">{titulo}</span>
        <span className="sg-top-n">{total} {total === 1 ? 'escolhida' : 'escolhidas'}</span>
      </header>

      <div className="sg-wrap">
        <div className="sg-hero">
          <div className="eyebrow">{titulo}</div>
          <h2>Escolham as vossas <em>fotografias.</em></h2>
          <hr className="lede-rule" />
          <p>
            {todas.length > 0
              ? conv
                ? <>São <strong>{todas.length.toLocaleString('pt-PT')} fotografias</strong>. Toquem numa para a verem em grande e carreguem em <strong>Selecionar</strong>. Quando terminarem, carreguem em <strong>Continuar</strong> para indicarem os vossos dados e o formato, digital ou papel.</>
                : <>São <strong>{todas.length.toLocaleString('pt-PT')} fotografias</strong>, arrumadas em {nomesPastas.length} pastas. Toquem numa para a verem em grande e carreguem em <strong>Selecionar</strong>. A escolha fica guardada: podem voltar quando quiserem, também noutro telemóvel ou computador.</>
              : 'A abrir a vossa galeria…'}
          </p>
          <div className="sg-qualidade">
            <span className="eyebrow">Nota sobre a qualidade</span>
            <p>As fotografias desta galeria estão em <strong>baixa qualidade</strong>, só para escolherem. As que {conv ? 'adquirirem' : 'escolherem'} são {conv ? 'entregues' : 'editadas e entregues no final'} em <strong>alta qualidade</strong>.</p>
          </div>
        </div>

        {enviada && (
          <div className="sg-enviada">
            <span className="eyebrow">Seleção enviada</span>
            <p>Recebemos a vossa escolha de <strong>{total} fotografias</strong> a {dataPt(enviada)}. Obrigado! A partir daqui é connosco.</p>
          </div>
        )}

        {erro && <div className="sg-erro">{erro}</div>}

        {pastas && (
          <>
            {variasPastas && <nav className="sg-pastas">
              {['todas', ...nomesPastas].map(p => {
                const n = p === 'todas' ? todas.length : (pastas.find(x => x.nome === p)?.fotos.length ?? 0)
                const k = p === 'todas' ? total : (porPasta[p] ?? 0)
                return (
                  <button key={p} type="button" className={`sg-pasta${pasta === p ? ' on' : ''}`} onClick={() => { setPasta(p); rootRef.current?.scrollTo({ top: (rootRef.current.querySelector('.sg-pastas') as HTMLElement)?.offsetTop - 70, behavior: 'smooth' }) }}>
                    <span className="pn">{p === 'todas' ? 'Todas as pastas' : p}</span>
                    <span className="pc">{n} fotos{k > 0 && <b> · {k} ✓</b>}</span>
                  </button>
                )
              })}
            </nav>}

            <div className="sg-tabs">
              <button type="button" className={filtro === 'todas' ? 'on' : ''} onClick={() => setFiltro('todas')}>Todas</button>
              <button type="button" className={filtro === 'sel' ? 'on' : ''} onClick={() => setFiltro('sel')}>A minha seleção · {pasta === 'todas' ? total : (porPasta[pasta] ?? 0)}</button>
            </div>

            {filtro === 'sel' && variasPastas && (
              <div className="sg-resumo">
                <div className="sg-resumo-head">
                  <span className="eyebrow">A vossa seleção por pasta</span>
                  <span className="sg-resumo-total">{total} {total === 1 ? 'fotografia' : 'fotografias'}</span>
                </div>
                <div className="sg-resumo-grid">
                  {nomesPastas.map(p => {
                    const k = porPasta[p] ?? 0
                    return (
                      <button key={p} type="button" className={`sg-resumo-item${k ? '' : ' zero'}${pasta === p ? ' on' : ''}`} onClick={() => setPasta(pasta === p ? 'todas' : p)}>
                        <span className="t">{p}</span>
                        <span className="n">{k}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="sg-grelha">
              {celulas.length ? celulas : (
                <div className="sg-vazio">{filtro === 'sel' ? 'Ainda não escolheram nenhuma fotografia' + (pasta !== 'todas' ? ' nesta pasta.' : '.') : 'Esta pasta não tem fotografias.'}</div>
              )}
              {lista.length > mostrar && <div ref={maisRef} className="sg-mais">A carregar mais fotografias…</div>}
            </div>
          </>
        )}
      </div>

      {/* ── barra de envio ── */}
      {pastas && (
        <footer className="sg-rodape">
          <div className="sg-rodape-in">
            <div className="sg-rodape-info">
              <span><strong>{total}</strong> {total === 1 ? 'fotografia escolhida' : 'fotografias escolhidas'}</span>
              <span className={`sg-guardado ${guardado}`}>
                {conv ? 'Guardado neste dispositivo' : enviada ? 'Enviada' : guardado === 'a-guardar' ? 'A guardar…' : guardado === 'erro' ? 'Não guardou, verifiquem a internet' : 'Guardado'}
              </span>
            </div>
            {conv ? (
              <button type="button" className="fp-btn available sg-enviar" disabled={total === 0} onClick={() => convidados!.onContinuar(todas.filter(f => selSet.has(f.n)).map(f => f.n))}>
                Continuar →
              </button>
            ) : (
              <button type="button" className="fp-btn available sg-enviar" disabled={!!enviada || total === 0} onClick={async () => { await atualizar(); setConfirmar(true) }}>
                {enviada ? 'Seleção enviada' : 'Enviar seleção'}
              </button>
            )}
          </div>
        </footer>
      )}

      {/* ── fotografia em grande ── */}
      {foto && (
        <div
          className="sg-lb"
          onTouchStart={e => { toque.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            if (toque.current === null) return
            const dx = e.changedTouches[0].clientX - toque.current
            toque.current = null
            if (Math.abs(dx) > 50) setAberta(i => (i === null ? i : (i + (dx < 0 ? 1 : -1) + lista.length) % lista.length))
          }}
        >
          <div className="sg-lb-top">
            <span>{foto.n} · {foto.pasta}</span>
            <span>{(aberta ?? 0) + 1} / {lista.length}</span>
            <button type="button" className="fp-modal-close" onClick={() => setAberta(null)} aria-label="Fechar">×</button>
          </div>
          <div className="sg-lb-palco">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={foto.n} src={src(foto.g)} alt={foto.n} referrerPolicy="no-referrer" />
            {seguinte && (
              // pré-carrega a seguinte para passar sem esperar
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src(seguinte.g)} alt="" className="sg-pre" referrerPolicy="no-referrer" />
            )}
            <button type="button" className="sg-seta esq" aria-label="Anterior" onClick={() => setAberta(i => (i === null ? i : (i - 1 + lista.length) % lista.length))}>‹</button>
            <button type="button" className="sg-seta dir" aria-label="Seguinte" onClick={() => setAberta(i => (i === null ? i : (i + 1) % lista.length))}>›</button>
          </div>
          <div className="sg-lb-base">
            <button
              type="button"
              className={`fp-btn ${selSet.has(foto.n) ? 'available' : 'ghost'} sg-lb-sel`}
              disabled={!!enviada}
              onClick={() => alternar(foto.n)}
            >
              {enviada ? (selSet.has(foto.n) ? 'Escolhida ✓' : 'Seleção fechada') : selSet.has(foto.n) ? 'Selecionada ✓ · tirar' : 'Selecionar'}
            </button>
            <span className="sg-lb-dica">{total} {total === 1 ? 'escolhida' : 'escolhidas'} · pré-visualização em baixa qualidade, entregamos em alta</span>
          </div>
        </div>
      )}

      {/* ── confirmar o envio ── */}
      {confirmar && (
        <div className="fp-modal-backdrop" onClick={() => setConfirmar(false)}>
          <div className="fp-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <button type="button" className="fp-modal-close" onClick={() => setConfirmar(false)} aria-label="Fechar">×</button>
            <div className="eyebrow">Seleção</div>
            <h3>Enviar a vossa <em>escolha?</em></h3>
            <div className="fp-modal-example">
              <div className="lbl">{total} fotografias</div>
              {nomesPastas.filter(p => porPasta[p]).map(p => (
                <div key={p} className="sg-conf-linha"><span>{p}</span><b>{porPasta[p]}</b></div>
              ))}
            </div>
            <p className="sg-conf-txt">Depois de enviada, a seleção fica fechada e passamos à edição.</p>
            <div className="fp-modal-actions">
              <button type="button" className="fp-btn available" disabled={aEnviar} onClick={enviar}>{aEnviar ? 'A enviar…' : 'Sim, enviar'}</button>
              <button type="button" className="fp-btn ghost" onClick={() => setConfirmar(false)}>Voltar à galeria</button>
            </div>
          </div>
        </div>
      )}

      {aviso && <div className="sg-aviso">{aviso}</div>}
    </div>,
    document.body,
  )
}

export default SelecaoGaleria
