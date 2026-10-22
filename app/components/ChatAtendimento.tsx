'use client'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

/* Chat do Atendimento: noivos ↔ staff RL (tabela noivos_chat, /api/noivos-chat).
   Usado no portal (casamento e batizado) e na ficha do evento.
   Layout de caixa de entrada: à esquerda o histórico por dias (com pesquisa por
   palavra), à direita a conversa do dia escolhido e a caixa para escrever.
   Quem consegue ler /api/staff é admin: escolhe o membro do staff que está a falar.
   Egress: só texto, sem polling. Carrega ao abrir e quando a página volta a ficar
   visível, e pede apenas as mensagens a seguir à última que já tem. A pesquisa é
   feita no browser, sobre o que já foi carregado. As fotos do staff vêm de
   /api/staff/foto/<id> (96 px, em cache na CDN da Vercel). */

type Msg = { id: number; autor: 'noivos' | 'staff'; staff_id: string | null; staff_nome: string | null; staff_funcao: string | null; texto: string; criado_em: string }
type Staff = { id: string; nome: string; funcao: string; ativo: boolean; foto_url: string | null }
type Dia = { chave: string; msgs: Msg[] }

const iniciais = (n: string) => n.split(/[\s&]+/).filter(w => w.length > 1).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'RL'
const horaDe = (iso: string) => new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
const chaveDia = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const HOJE = () => chaveDia(new Date())
const rotuloDia = (chave: string, longo = false) => {
  if (chave === HOJE()) return 'Hoje'
  if (chave === chaveDia(new Date(Date.now() - 864e5))) return 'Ontem'
  const d = new Date(`${chave}T12:00:00`)
  const r = d.toLocaleDateString('pt-PT', longo
    ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) })
  return r.charAt(0).toUpperCase() + r.slice(1)
}
// Pesquisa sem acentos nem maiúsculas
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
// Mensagens seguidas da mesma pessoa (até 5 min) ficam agrupadas, sem repetir foto e nome
const quemE = (m: Msg) => m.autor === 'staff' ? `s:${m.staff_id ?? m.staff_nome}` : 'n'
const continua = (a: Msg | undefined, b: Msg) => !!a && quemE(a) === quemE(b)
  && new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime() < 5 * 60e3

/** Realça a palavra pesquisada (ignora acentos e maiúsculas) */
function Realce({ texto, q }: { texto: string; q: string }) {
  const nq = norm(q.trim())
  if (!nq) return <>{texto}</>
  const nt = norm(texto)
  const partes: React.ReactNode[] = []
  let i = 0, k = 0
  for (let j = nt.indexOf(nq); j !== -1; j = nt.indexOf(nq, i)) {
    if (j > i) partes.push(texto.slice(i, j))
    partes.push(<mark key={k++}>{texto.slice(j, j + nq.length)}</mark>)
    i = j + nq.length
  }
  partes.push(texto.slice(i))
  return <>{partes}</>
}

function Avatar({ m, noivos, peq }: { m: Msg; noivos: string; peq?: boolean }) {
  const [falhou, setFalhou] = useState(false)
  if (m.autor === 'noivos') return <span className={`av av-noivos ${peq ? 'peq' : ''}`}>{iniciais(noivos)}</span>
  return (
    <span className={`av av-staff ${peq ? 'peq' : ''}`}>
      {/* iniciais por baixo enquanto a foto carrega (ou se não houver foto) */}
      {iniciais(m.staff_nome || 'RL')}
      {m.staff_id && !falhou && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/staff/foto/${m.staff_id}`} alt="" loading="lazy" onError={() => setFalhou(true)} />
      )}
    </span>
  )
}

export default function ChatAtendimento({ referencia, noivos }: { referencia: string; noivos?: string | null }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [carregado, setCarregado] = useState(false)
  const [staff, setStaff] = useState<Staff[] | null>(null)   // null = noivos
  const [quem, setQuem] = useState('')
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aAtualizar, setAAtualizar] = useState(false)
  const [erro, setErro] = useState('')
  const [novas, setNovas] = useState<Set<number>>(new Set())
  const [q, setQ] = useState('')
  const [diaSel, setDiaSel] = useState(HOJE())
  const [verConversa, setVerConversa] = useState(false)   // ecrã estreito: lista ou conversa
  const [larga, setLarga] = useState(true)
  const [visto, setVisto] = useState(0)
  const ultimo = useRef(0)
  const raiz = useRef<HTMLElement>(null)
  const lista = useRef<HTMLDivElement>(null)
  const caixa = useRef<HTMLTextAreaElement>(null)
  const LS_QUEM = 'chat_staff_quem'
  const LS_VISTO = `chat_visto_${referencia}`
  const nomesNoivos = (noivos ?? '').trim() || 'Noivos'

  const carregar = useCallback(async () => {
    setAAtualizar(true)
    try {
      const r = await fetch(`/api/noivos-chat?ref=${encodeURIComponent(referencia)}&depois=${ultimo.current}`, { cache: 'no-store' })
      const chegadas: Msg[] = r.ok ? ((await r.json()).mensagens ?? []) : []
      if (chegadas.length) {
        const primeira = ultimo.current === 0
        ultimo.current = Math.max(ultimo.current, ...chegadas.map(m => m.id))
        setMsgs(a => [...a, ...chegadas.filter(n => !a.some(m => m.id === n.id))])
        if (!primeira) setNovas(new Set(chegadas.map(m => m.id)))   // só as que chegam depois animam
      }
    } catch { /* sem rede: fica o que já há */ }
    setCarregado(true); setAAtualizar(false)
  }, [referencia])

  useEffect(() => {
    try { setVisto(Number(localStorage.getItem(LS_VISTO) ?? 0) || 0) } catch {}
    carregar()
    const vis = () => { if (document.visibilityState === 'visible') carregar() }
    document.addEventListener('visibilitychange', vis)
    return () => document.removeEventListener('visibilitychange', vis)
  }, [carregar, LS_VISTO])

  // Só o admin consegue ler o staff
  useEffect(() => {
    fetch('/api/staff').then(r => r.ok ? r.json() : null).then(d => {
      if (!d?.staff) return
      const ativos = (d.staff as Staff[]).filter(s => s.ativo)
      setStaff(ativos)
      let guardado = ''
      try { guardado = localStorage.getItem(LS_QUEM) ?? '' } catch {}
      setQuem(ativos.some(s => s.id === guardado) ? guardado : ativos[0]?.id ?? '')
    }).catch(() => {})
  }, [])

  // Duas colunas só quando há espaço (o portal e a ficha têm larguras diferentes)
  useEffect(() => {
    const el = raiz.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setLarga(e.contentRect.width >= 720))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const admin = !!staff
  // No portal os noivos estão à direita; na vista do admin, o staff
  const meu = (m: Msg) => admin ? m.autor === 'staff' : m.autor === 'noivos'

  // Histórico por dias (mais recente primeiro); Hoje está sempre lá para se poder escrever
  const dias: Dia[] = useMemo(() => {
    const mapa = new Map<string, Msg[]>()
    mapa.set(HOJE(), [])
    for (const m of msgs) {
      const k = chaveDia(new Date(m.criado_em))
      mapa.set(k, [...(mapa.get(k) ?? []), m])
    }
    return [...mapa.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([chave, l]) => ({ chave, msgs: l }))
  }, [msgs])

  const nq = norm(q.trim())
  const acerta = (m: Msg) => !!nq && norm(m.texto).includes(nq)
  const filtrados = nq ? dias.filter(d => d.msgs.some(acerta)) : dias
  const totalAcertos = nq ? msgs.filter(acerta).length : 0
  const dia = dias.find(d => d.chave === diaSel) ?? dias[0]

  // Ao pesquisar, abre o primeiro dia com resultados
  useEffect(() => {
    if (nq && filtrados.length && !filtrados.some(d => d.chave === diaSel)) setDiaSel(filtrados[0].chave)
  }, [nq, filtrados, diaSel])

  // Marca como visto o que está aberto
  useEffect(() => {
    const max = Math.max(0, ...(dia?.msgs ?? []).map(m => m.id))
    if (max > visto && (larga || verConversa)) {
      setVisto(max)
      try { localStorage.setItem(LS_VISTO, String(max)) } catch {}
    }
  }, [dia, visto, larga, verConversa, LS_VISTO])

  // Desce até ao fim (ou até ao primeiro resultado da pesquisa)
  useLayoutEffect(() => {
    const l = lista.current
    if (!l) return
    const alvo = nq ? l.querySelector('mark') : null
    if (alvo) (alvo as HTMLElement).scrollIntoView({ block: 'center' })
    else l.scrollTo({ top: l.scrollHeight })
  }, [diaSel, dia?.msgs.length, nq, verConversa])

  // Caixa de texto cresce com a mensagem (até 5 linhas)
  useLayoutEffect(() => {
    const t = caixa.current
    if (!t) return
    t.style.height = 'auto'
    t.style.height = `${Math.min(t.scrollHeight, 132)}px`
  }, [texto, diaSel, verConversa])

  const enviar = async () => {
    const t = texto.trim()
    if (!t || enviando) return
    if (staff && !quem) { setErro('Escolha quem está a falar.'); return }
    setEnviando(true); setErro('')
    try {
      const r = await fetch('/api/noivos-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia, texto: t, staff_id: staff ? quem : undefined }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Não foi possível enviar.')
      setTexto(''); setQ(''); setDiaSel(HOJE())
      await carregar()
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível enviar.') }
    setEnviando(false)
  }

  const abrir = (k: string) => { setDiaSel(k); setVerConversa(true) }
  const idx = filtrados.findIndex(d => d.chave === dia?.chave)
  const mover = (passo: number) => { const d = filtrados[idx + passo]; if (d) setDiaSel(d.chave) }
  const pessoas = (l: Msg[]) => [...new Map(l.map(m => [quemE(m), m])).values()]
  const eu = staff?.find(s => s.id === quem)
  const naoLidas = (d: Dia) => d.msgs.filter(m => !meu(m) && m.id > visto).length

  /* ── Coluna da esquerda: histórico por dias ── */
  const colLista = (
    <aside className="col-lista">
      <div className="lista-cab">
        <div className="lista-tit">
          <span className="t">Conversas</span>
          <span className="s">{dias.filter(d => d.msgs.length).length} {dias.filter(d => d.msgs.length).length === 1 ? 'dia' : 'dias'} · {msgs.length} {msgs.length === 1 ? 'mensagem' : 'mensagens'}</span>
        </div>
        <button type="button" className="atualizar" onClick={carregar} aria-label="Atualizar conversa" title="Atualizar">
          <svg viewBox="0 0 24 24" width="15" height="15" className={aAtualizar ? 'gira' : ''}><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      <label className="pesquisa">
        <svg viewBox="0 0 24 24" width="15" height="15"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Procurar nas conversas…" />
        {q && <button type="button" className="limpar" onClick={() => setQ('')} aria-label="Limpar pesquisa">✕</button>}
      </label>
      {nq && <p className="resultados">{totalAcertos ? `${totalAcertos} ${totalAcertos === 1 ? 'mensagem' : 'mensagens'} em ${filtrados.length} ${filtrados.length === 1 ? 'dia' : 'dias'}` : 'Nada encontrado'}</p>}

      <div className="dias">
        {!carregado && [0, 1, 2].map(i => <div key={i} className="esq"><span className="esq-av" /><span className="esq-l" /></div>)}
        {carregado && filtrados.map(d => {
          const ult = d.msgs[d.msgs.length - 1]
          const mostra = nq ? d.msgs.find(acerta) ?? ult : ult
          const quemFala = mostra ? (mostra.autor === 'staff' ? (mostra.staff_nome || 'RL') : (admin ? nomesNoivos : 'Vocês')) : ''
          const nl = naoLidas(d)
          const ativo = d.chave === dia?.chave && (larga || verConversa)
          return (
            <button type="button" key={d.chave} className={`dia-item ${ativo ? 'ativo' : ''}`} onClick={() => abrir(d.chave)}>
              <span className="dia-av">{ult ? <Avatar m={ult} noivos={nomesNoivos} /> : <span className="av av-novo">+</span>}</span>
              <span className="dia-txt">
                <span className="dia-l1">
                  <span className="dia-nome">{rotuloDia(d.chave)}</span>
                  {!!nl && <span className="dot" aria-label={`${nl} por ler`} />}
                  <span className="dia-hora">{ult ? horaDe(ult.criado_em) : ''}</span>
                </span>
                <span className="dia-prev">
                  {mostra ? <><b>{quemFala}:</b> <Realce texto={mostra.texto.length > 140 ? mostra.texto.slice(0, 140) + '…' : mostra.texto} q={q} /></> : <i>Nova conversa</i>}
                </span>
                {!!d.msgs.length && (
                  <span className="chips">
                    <span className="chip">{nq ? `${d.msgs.filter(acerta).length} com “${q.trim()}”` : `${d.msgs.length} ${d.msgs.length === 1 ? 'mensagem' : 'mensagens'}`}</span>
                    <span className="mini">{pessoas(d.msgs).slice(0, 4).map(m => <Avatar key={m.id} m={m} noivos={nomesNoivos} peq />)}</span>
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )

  /* ── Coluna da direita: conversa do dia ── */
  const colConversa = dia && (
    <div className="col-conversa">
      <div className="conv-cab">
        {!larga && <button type="button" className="voltar" onClick={() => setVerConversa(false)} aria-label="Voltar às conversas">‹</button>}
        <svg className="conv-ic" viewBox="0 0 24 24" width="17" height="17"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
        <div className="conv-tit">
          <span className="t">{rotuloDia(dia.chave, true)}</span>
          <span className="s">{dia.msgs.length ? `${dia.msgs.length} ${dia.msgs.length === 1 ? 'mensagem' : 'mensagens'}` : 'Ainda sem mensagens'}{nq && dia.msgs.some(acerta) ? ` · ${dia.msgs.filter(acerta).length} com “${q.trim()}”` : ''}</span>
        </div>
        <div className="pilha">{pessoas(dia.msgs).slice(0, 4).map(m => <Avatar key={m.id} m={m} noivos={nomesNoivos} />)}</div>
        <div className="setas">
          <button type="button" onClick={() => mover(-1)} disabled={idx <= 0} aria-label="Dia mais recente" title="Dia mais recente">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="m6 15 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" onClick={() => mover(1)} disabled={idx < 0 || idx >= filtrados.length - 1} aria-label="Dia anterior" title="Dia anterior">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      <div className="mensagens" ref={lista}>
        {!carregado && <p className="vazio">A carregar a conversa…</p>}
        {carregado && !dia.msgs.length && (
          <div className="vazio-bloco">
            <span className="linha-ouro" />
            <p>{admin ? 'Ainda não há mensagens hoje com estes noivos.' : 'Escrevam-nos aqui. Cada mensagem chega diretamente à nossa equipa.'}</p>
          </div>
        )}
        {dia.msgs.map((m, i) => {
          const agrupa = continua(dia.msgs[i - 1], m)
          const nome = m.autor === 'staff' ? (m.staff_nome || 'RL Photo·Video') : (admin ? nomesNoivos : 'Vocês')
          return (
            <div key={m.id} className={`msg ${meu(m) ? 'minha' : ''} ${m.autor} ${agrupa ? 'agrupa' : ''} ${novas.has(m.id) ? 'nova' : ''} ${nq && !acerta(m) ? 'apagada' : ''}`}>
              <div className="col-av">{!agrupa && <Avatar m={m} noivos={nomesNoivos} />}</div>
              <div className="corpo">
                {!agrupa && (
                  <p className="meta">
                    <span className="nome">{nome}</span>
                    {m.autor === 'staff' && m.staff_funcao && <span className="funcao">{m.staff_funcao}</span>}
                    <span className="hora">{horaDe(m.criado_em)}</span>
                  </p>
                )}
                <p className="bolha"><Realce texto={m.texto} q={q} /></p>
              </div>
            </div>
          )
        })}
      </div>

      <footer className="rodape">
        {dia.chave !== HOJE() && <p className="aviso-dia">A resposta fica na conversa de hoje.</p>}
        {admin && (
          <label className="falar">
            <span className="falar-av">
              {iniciais(eu?.nome || 'RL')}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {eu?.foto_url && <img src={`/api/staff/foto/${eu.id}`} alt="" />}
            </span>
            <span className="falar-rot">A falar como</span>
            <select value={quem} onChange={e => { setQuem(e.target.value); try { localStorage.setItem(LS_QUEM, e.target.value) } catch {} }}>
              {!staff!.length && <option value="">Sem staff (Gestão › Staff)</option>}
              {staff!.map(s => <option key={s.id} value={s.id}>{s.nome}{s.funcao ? ` · ${s.funcao}` : ''}</option>)}
            </select>
          </label>
        )}
        <div className="escrever">
          <textarea ref={caixa} value={texto} maxLength={2000} rows={1} placeholder="Escrever mensagem…"
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }} />
          <button type="button" className="enviar" onClick={enviar} disabled={enviando || !texto.trim()} aria-label="Enviar">
            {enviando
              ? <span className="ponto" />
              : <svg viewBox="0 0 24 24" width="17" height="17"><path d="M4 12 20 4l-6 16-2.5-6.5L4 12Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>}
          </button>
        </div>
        {erro && <p className="erro">{erro}</p>}
      </footer>
    </div>
  )

  return (
    <section className={`chat-rl ${larga ? 'larga' : 'estreita'}`} ref={raiz}>
      <header className="cab">
        <p className="eyebrow">Atendimento</p>
        <h3 className="titulo">Conversa com a <em>equipa</em></h3>
      </header>
      <div className="corpo-chat">
        {larga ? <>{colLista}{colConversa}</> : verConversa ? colConversa : colLista}
      </div>

      <style jsx global>{`
        .chat-rl {
          --g: #d8be93; --ink: #0b0b0b; --cr: #f3ede2; --mu: #8b877f; --li: rgba(216,190,147,.16);
          margin: 28px 0 12px; border: 1px solid var(--li); border-radius: 22px; overflow: hidden;
          background: radial-gradient(120% 60% at 100% 0%, rgba(216,190,147,.07), transparent 60%), #0d0d0d;
          box-shadow: 0 30px 60px -40px rgba(0,0,0,.9), 0 0 40px -28px rgba(201,168,76,.45);
          font-family: 'Hanken Grotesk', system-ui, sans-serif; color: var(--cr); text-align: left;
        }
        .chat-rl .cab { padding: 20px 22px 16px; border-bottom: 1px solid var(--li); }
        .chat-rl .eyebrow { margin: 0; font-size: 9px; letter-spacing: .42em; text-transform: uppercase; color: var(--g); font-weight: 600; }
        .chat-rl .titulo { margin: 6px 0 0; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; font-size: 26px; line-height: 1; color: var(--cr); }
        .chat-rl .titulo em { color: var(--g); font-style: italic; }

        .chat-rl .corpo-chat { display: flex; }
        .chat-rl.larga .corpo-chat { height: 640px; }
        .chat-rl.estreita .corpo-chat { flex-direction: column; }
        .chat-rl.estreita .col-conversa { height: 620px; }

        /* ── lista de dias ── */
        .chat-rl .col-lista { display: flex; flex-direction: column; min-height: 0; }
        .chat-rl.larga .col-lista { width: 38%; min-width: 280px; max-width: 380px; border-right: 1px solid var(--li); }
        .chat-rl .lista-cab { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 16px 18px 10px; }
        .chat-rl .lista-tit { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
        .chat-rl .lista-tit .t { font-size: 15px; font-weight: 700; }
        .chat-rl .lista-tit .s { font-size: 12px; color: var(--mu); }
        .chat-rl .atualizar { flex: none; width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--li); background: transparent; color: var(--mu); display: grid; place-items: center; cursor: pointer; transition: color .2s, border-color .2s; }
        .chat-rl .atualizar:hover { color: var(--g); border-color: rgba(216,190,147,.5); }
        .chat-rl .gira { animation: chatrl-gira .8s linear infinite; }
       @keyframes chatrl-gira { to { transform: rotate(360deg); } }
        .chat-rl .pesquisa { margin: 0 14px 8px; display: flex; align-items: center; gap: 8px; padding: 0 12px; height: 38px; border-radius: 12px; background: #0a0a0a; border: 1px solid rgba(255,255,255,.08); color: var(--mu); transition: border-color .2s; }
        .chat-rl .pesquisa:focus-within { border-color: rgba(216,190,147,.5); color: var(--g); }
        .chat-rl .pesquisa input { flex: 1; min-width: 0; background: transparent; border: 0; outline: none; color: var(--cr); font-size: 13px; font-family: inherit; }
        .chat-rl .pesquisa input::placeholder { color: #5f5b55; }
        .chat-rl .limpar { background: none; border: 0; color: var(--mu); cursor: pointer; font-size: 11px; }
        .chat-rl .resultados { margin: 0 18px 8px; font-size: 11px; color: var(--g); letter-spacing: .04em; }
        .chat-rl .dias { flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(216,190,147,.2) transparent; }
        .chat-rl.estreita .dias { max-height: 520px; }
        .chat-rl .dia-item { width: 100%; display: flex; gap: 12px; padding: 14px 18px; text-align: left; background: transparent; border: 0; border-top: 1px solid rgba(255,255,255,.04); color: inherit; cursor: pointer; font-family: inherit; transition: background .2s; position: relative; }
        .chat-rl .dia-item:hover { background: rgba(255,255,255,.025); }
        .chat-rl .dia-item.ativo { background: rgba(216,190,147,.06); }
        .chat-rl .dia-item.ativo::before { content: ''; position: absolute; left: 0; top: 12px; bottom: 12px; width: 2px; border-radius: 2px; background: var(--g); }
        .chat-rl .dia-av { flex: none; }
        .chat-rl .dia-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .chat-rl .dia-l1 { display: flex; align-items: center; gap: 8px; }
        .chat-rl .dia-nome { font-size: 14px; font-weight: 700; color: var(--cr); }
        .chat-rl .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--g); box-shadow: 0 0 8px rgba(216,190,147,.8); }
        .chat-rl .dia-hora { margin-left: auto; font-size: 11px; color: var(--mu); font-variant-numeric: tabular-nums; }
        .chat-rl .dia-prev { font-size: 13px; line-height: 1.4; color: #b9b3a8; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .chat-rl .dia-prev b { color: var(--cr); font-weight: 600; }
        .chat-rl .chips { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
        .chat-rl .chip { font-size: 11px; color: var(--mu); padding: 3px 9px; border-radius: 8px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); }
        .chat-rl .mini { display: flex; }
        .chat-rl .mini .av { margin-left: -5px; box-shadow: 0 0 0 2px #0d0d0d; }
        .chat-rl .mini .av:first-child { margin-left: 0; }
        .chat-rl .esq { display: flex; gap: 12px; align-items: center; padding: 16px 18px; }
        .chat-rl .esq-av { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,.05); }
        .chat-rl .esq-l { flex: 1; height: 12px; border-radius: 6px; background: rgba(255,255,255,.05); animation: chatrl-pulsa 1.4s ease-in-out infinite; }

        /* ── conversa ── */
        .chat-rl .col-conversa { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
        .chat-rl .conv-cab { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-bottom: 1px solid var(--li); }
        .chat-rl .voltar { background: none; border: 0; color: var(--g); font-size: 24px; line-height: 1; cursor: pointer; padding: 0 4px 0 0; }
        .chat-rl .conv-ic { color: var(--mu); flex: none; }
        .chat-rl .conv-tit { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .chat-rl .conv-tit .t { font-size: 15px; font-weight: 700; }
        .chat-rl .conv-tit .s { font-size: 11px; color: var(--mu); }
        .chat-rl .pilha { display: flex; }
        .chat-rl .pilha .av { width: 28px; height: 28px; margin-left: -8px; box-shadow: 0 0 0 2px #0d0d0d; font-size: 9px; }
        .chat-rl .pilha .av:first-child { margin-left: 0; }
        .chat-rl .setas { display: flex; gap: 6px; }
        .chat-rl .setas button { width: 32px; height: 32px; border-radius: 10px; border: 1px solid var(--li); background: transparent; color: var(--cr); display: grid; place-items: center; cursor: pointer; }
        .chat-rl .setas button:hover:not(:disabled) { border-color: rgba(216,190,147,.5); color: var(--g); }
        .chat-rl .setas button:disabled { opacity: .3; cursor: default; }

        .chat-rl .mensagens { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 20px 18px; scrollbar-width: thin; scrollbar-color: rgba(216,190,147,.25) transparent; }
        .chat-rl .vazio { font-size: 12px; color: var(--mu); font-style: italic; text-align: center; padding: 40px 0; margin: 0; }
        .chat-rl .vazio-bloco { text-align: center; padding: 70px 20px; }
        .chat-rl .vazio-bloco p { margin: 14px auto 0; max-width: 300px; font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 18px; color: #b9b3a8; line-height: 1.4; }
        .chat-rl .linha-ouro { display: inline-block; width: 40px; height: 1px; background: var(--g); opacity: .6; }

        .chat-rl .msg { display: flex; gap: 10px; margin-top: 16px; align-items: flex-start; transition: opacity .2s; }
        .chat-rl .msg.agrupa { margin-top: 4px; }
        .chat-rl .msg.minha { flex-direction: row-reverse; }
        .chat-rl .msg.apagada { opacity: .35; }
        .chat-rl .msg.nova { animation: chatrl-entra .45s cubic-bezier(.2,.8,.2,1); }
       @keyframes chatrl-entra { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .chat-rl .col-av { flex: none; width: 36px; }
        .chat-rl .corpo { min-width: 0; max-width: min(78%, 520px); display: flex; flex-direction: column; }
        .chat-rl .msg.minha .corpo { align-items: flex-end; }
        .chat-rl .meta { margin: 0 0 5px; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
        .chat-rl .msg.minha .meta { flex-direction: row-reverse; }
        .chat-rl .nome { font-size: 13px; font-weight: 600; color: var(--cr); }
        .chat-rl .msg.staff .nome { color: var(--g); }
        .chat-rl .funcao { font-size: 9px; letter-spacing: .18em; text-transform: uppercase; color: var(--mu); }
        .chat-rl .hora { font-size: 10px; color: #6b6862; font-variant-numeric: tabular-nums; }
        .chat-rl .bolha {
          margin: 0; padding: 10px 14px; border-radius: 4px 16px 16px 16px; font-size: 14px; line-height: 1.5;
          white-space: pre-wrap; word-break: break-word; color: #e6e0d4;
          background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.06);
        }
        .chat-rl .msg.staff .bolha { background: linear-gradient(180deg, rgba(216,190,147,.10), rgba(216,190,147,.05)); border-color: rgba(216,190,147,.22); }
        .chat-rl .msg.minha .bolha { border-radius: 16px 4px 16px 16px; background: linear-gradient(180deg, rgba(216,190,147,.09), rgba(216,190,147,.04)); color: #f3ede2; border-color: rgba(216,190,147,.32); }
        .chat-rl .msg.agrupa .bolha { border-radius: 16px; }
        .chat-rl mark { background: rgba(216,190,147,.35); color: inherit; border-radius: 3px; padding: 0 2px; box-shadow: 0 0 0 1px rgba(216,190,147,.5); }

        .chat-rl .av {
          position: relative; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; overflow: hidden;
          font-size: 11px; font-weight: 700; letter-spacing: .05em; flex: none;
        }
        .chat-rl .av.peq { width: 20px; height: 20px; font-size: 7px; }
        .chat-rl .av img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
        .chat-rl .av-staff { border: 1px solid rgba(216,190,147,.55); color: var(--g); background: #15130f; }
        .chat-rl .av-noivos { border: 1px solid rgba(243,237,226,.25); color: var(--cr); background: #1a1a1a; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 14px; font-weight: 500; }
        .chat-rl .av-noivos.peq { font-size: 8px; }
        .chat-rl .av-novo { border: 1px dashed rgba(216,190,147,.45); color: var(--g); font-size: 16px; font-weight: 300; }

        .chat-rl .rodape { border-top: 1px solid var(--li); padding: 12px 16px 16px; background: rgba(0,0,0,.25); }
        .chat-rl .aviso-dia { margin: 0 4px 8px; font-size: 11px; color: var(--mu); font-style: italic; }
        .chat-rl .falar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .chat-rl .falar-av { position: relative; width: 26px; height: 26px; border-radius: 50%; overflow: hidden; display: grid; place-items: center; border: 1px solid rgba(216,190,147,.55); color: var(--g); font-size: 9px; font-weight: 700; flex: none; }
        .chat-rl .falar-av img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .chat-rl .falar-rot { font-size: 9px; letter-spacing: .26em; text-transform: uppercase; color: var(--mu); white-space: nowrap; }
        .chat-rl .falar select { flex: 1; min-width: 0; background: transparent; color: var(--cr); border: 0; border-bottom: 1px solid var(--li); padding: 4px 2px; font-size: 13px; font-family: inherit; outline: none; cursor: pointer; }
        .chat-rl .falar select option { background: #111; }
        .chat-rl .escrever { display: flex; align-items: flex-end; gap: 10px; background: #0a0a0a; border: 1px solid rgba(255,255,255,.1); border-radius: 22px; padding: 6px 6px 6px 16px; transition: border-color .2s, box-shadow .2s; }
        .chat-rl .escrever:focus-within { border-color: rgba(216,190,147,.55); box-shadow: 0 0 0 3px rgba(216,190,147,.08); }
        .chat-rl .escrever textarea { flex: 1; resize: none; border: 0; outline: none; background: transparent; color: var(--cr); font-size: 14px; line-height: 1.45; font-family: inherit; padding: 8px 0; max-height: 132px; }
        .chat-rl .escrever textarea::placeholder { color: #5f5b55; }
        .chat-rl .enviar { flex: none; width: 38px; height: 38px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer; color: #15120c; background: linear-gradient(135deg, #d8be93, #b8965a); transition: transform .15s, opacity .2s; }
        .chat-rl .enviar:hover:not(:disabled) { transform: scale(1.06); }
        .chat-rl .enviar:disabled { opacity: .3; cursor: default; }
        .chat-rl .ponto { width: 6px; height: 6px; border-radius: 50%; background: #15120c; animation: chatrl-pulsa .9s ease-in-out infinite; }
       @keyframes chatrl-pulsa { 50% { opacity: .2; } }
        .chat-rl .erro { color: #f87171; font-size: 12px; margin: 8px 4px 0; }

       @media (max-width: 520px) {
          .chat-rl .cab { padding: 16px 16px 12px; }
          .chat-rl .titulo { font-size: 22px; }
          .chat-rl .mensagens { padding: 6px 12px 14px; }
          .chat-rl .col-av { width: 30px; }
          .chat-rl .av:not(.peq) { width: 30px; height: 30px; }
          .chat-rl .corpo { max-width: 84%; }
          .chat-rl .pilha { display: none; }
        }
      `}</style>
    </section>
  )
}
