'use client'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/* Chat do Atendimento: noivos ↔ staff RL (tabela noivos_chat, /api/noivos-chat).
   Usado no portal (casamento e batizado) e na ficha do evento.
   Quem consegue ler /api/staff é admin: escolhe o membro do staff que está a falar.
   Egress: só texto, sem polling. Carrega ao abrir e quando a página volta a ficar
   visível, e pede apenas as mensagens a seguir à última que já tem. As fotos do
   staff vêm de /api/staff/foto/<id> (96 px, em cache na CDN da Vercel). */

type Msg = { id: number; autor: 'noivos' | 'staff'; staff_id: string | null; staff_nome: string | null; staff_funcao: string | null; texto: string; criado_em: string }
type Staff = { id: string; nome: string; funcao: string; ativo: boolean; foto_url: string | null }

const iniciais = (n: string) => n.split(/[\s&]+/).filter(w => w.length > 1).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'RL'
const horaDe = (iso: string) => new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
const diaDe = (iso: string) => {
  const d = new Date(iso), hoje = new Date(), ontem = new Date(Date.now() - 864e5)
  if (d.toDateString() === hoje.toDateString()) return 'Hoje'
  if (d.toDateString() === ontem.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
}
// Mensagens seguidas da mesma pessoa (até 5 min) ficam agrupadas, sem repetir foto e nome
const quemE = (m: Msg) => m.autor === 'staff' ? `s:${m.staff_id ?? m.staff_nome}` : 'n'
const continua = (a: Msg | undefined, b: Msg) => !!a && quemE(a) === quemE(b)
  && new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime() < 5 * 60e3
  && diaDe(a.criado_em) === diaDe(b.criado_em)

function Avatar({ m, noivos }: { m: Msg; noivos: string }) {
  const [falhou, setFalhou] = useState(false)
  if (m.autor === 'noivos') return <span className="av av-noivos">{iniciais(noivos)}</span>
  return (
    <span className="av av-staff">
      {m.staff_id && !falhou
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={`/api/staff/foto/${m.staff_id}`} alt="" loading="lazy" onError={() => setFalhou(true)} />
        : iniciais(m.staff_nome || 'RL')}
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
  const ultimo = useRef(0)
  const lista = useRef<HTMLDivElement>(null)
  const caixa = useRef<HTMLTextAreaElement>(null)
  const LS_QUEM = 'chat_staff_quem'
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
    carregar()
    const vis = () => { if (document.visibilityState === 'visible') carregar() }
    document.addEventListener('visibilitychange', vis)
    return () => document.removeEventListener('visibilitychange', vis)
  }, [carregar])

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

  useLayoutEffect(() => { lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: carregado ? 'smooth' : 'auto' }) }, [msgs.length, carregado])

  // Caixa de texto cresce com a mensagem (até 5 linhas)
  useLayoutEffect(() => {
    const t = caixa.current
    if (!t) return
    t.style.height = 'auto'
    t.style.height = `${Math.min(t.scrollHeight, 132)}px`
  }, [texto])

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
      setTexto('')
      await carregar()
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível enviar.') }
    setEnviando(false)
  }

  const admin = !!staff
  // No portal os noivos estão à direita; na vista do admin, o staff
  const meu = (m: Msg) => admin ? m.autor === 'staff' : m.autor === 'noivos'
  // Equipa que já falou nesta conversa (fotos no topo)
  const equipa = [...new Map(msgs.filter(m => m.autor === 'staff').map(m => [m.staff_id ?? m.staff_nome, m])).values()].slice(-4)
  const eu = staff?.find(s => s.id === quem)

  return (
    <section className="chat-rl">
      <header className="cab">
        <div>
          <p className="eyebrow">Atendimento</p>
          <h3 className="titulo">Conversa com a <em>equipa</em></h3>
        </div>
        <div className="cab-dir">
          {!!equipa.length && (
            <div className="pilha" aria-label="Equipa nesta conversa">
              {equipa.map(m => <Avatar key={m.id} m={m} noivos={nomesNoivos} />)}
            </div>
          )}
          <button type="button" className="atualizar" onClick={carregar} aria-label="Atualizar conversa" title="Atualizar">
            <svg viewBox="0 0 24 24" width="15" height="15" className={aAtualizar ? 'gira' : ''}><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </header>

      <div className="lista" ref={lista}>
        {!carregado && <p className="vazio">A carregar a conversa…</p>}
        {carregado && !msgs.length && (
          <div className="vazio-bloco">
            <span className="linha-ouro" />
            <p>{admin ? 'Ainda não há mensagens com estes noivos.' : 'Escrevam-nos aqui. Cada mensagem chega diretamente à nossa equipa.'}</p>
          </div>
        )}
        {msgs.map((m, i) => {
          const ant = msgs[i - 1]
          const novoDia = !ant || diaDe(ant.criado_em) !== diaDe(m.criado_em)
          const agrupa = continua(ant, m)
          const nome = m.autor === 'staff' ? (m.staff_nome || 'RL Photo·Video') : (admin ? nomesNoivos : 'Vocês')
          return (
            <div key={m.id}>
              {novoDia && <div className="dia"><span>{diaDe(m.criado_em)}</span></div>}
              <div className={`msg ${meu(m) ? 'minha' : ''} ${m.autor} ${agrupa ? 'agrupa' : ''} ${novas.has(m.id) ? 'nova' : ''}`}>
                <div className="col-av">{!agrupa && <Avatar m={m} noivos={nomesNoivos} />}</div>
                <div className="corpo">
                  {!agrupa && (
                    <p className="meta">
                      <span className="nome">{nome}</span>
                      {m.autor === 'staff' && m.staff_funcao && <span className="funcao">{m.staff_funcao}</span>}
                      <span className="hora">{horaDe(m.criado_em)}</span>
                    </p>
                  )}
                  <p className="bolha">{m.texto}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <footer className="rodape">
        {admin && (
          <label className="falar">
            <span className="falar-av">
              {eu?.foto_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={`/api/staff/foto/${eu.id}`} alt="" />
                : iniciais(eu?.nome || 'RL')}
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

      <style jsx>{`
        .chat-rl {
          --g: #d8be93; --g2: #c9a84c; --ink: #0b0b0b; --cr: #f3ede2; --mu: #8b877f; --li: rgba(216,190,147,.18);
          margin: 28px 0 12px; border: 1px solid var(--li); border-radius: 22px; overflow: hidden;
          background: radial-gradient(120% 60% at 100% 0%, rgba(216,190,147,.07), transparent 60%), #0d0d0d;
          box-shadow: 0 30px 60px -40px rgba(0,0,0,.9), 0 0 40px -28px rgba(201,168,76,.45);
          font-family: 'Hanken Grotesk', system-ui, sans-serif; color: var(--cr); text-align: left;
        }
        .cab { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; padding: 20px 22px 16px; border-bottom: 1px solid var(--li); }
        .eyebrow { margin: 0; font-size: 9px; letter-spacing: .42em; text-transform: uppercase; color: var(--g); font-weight: 600; }
        .titulo { margin: 6px 0 0; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; font-size: 26px; line-height: 1; color: var(--cr); letter-spacing: .01em; }
        .titulo em { color: var(--g); font-style: italic; }
        .cab-dir { display: flex; align-items: center; gap: 12px; }
        .pilha { display: flex; }
        .pilha :global(.av) { width: 28px; height: 28px; margin-left: -8px; box-shadow: 0 0 0 2px #0d0d0d; font-size: 9px; }
        .pilha :global(.av:first-child) { margin-left: 0; }
        .atualizar { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--li); background: transparent; color: var(--mu); display: grid; place-items: center; cursor: pointer; transition: color .2s, border-color .2s; }
        .atualizar:hover { color: var(--g); border-color: rgba(216,190,147,.5); }
        .gira { animation: gira .8s linear infinite; }
        @keyframes gira { to { transform: rotate(360deg); } }

        .lista { max-height: 460px; min-height: 180px; overflow-y: auto; padding: 8px 18px 16px; scroll-behavior: smooth; scrollbar-width: thin; scrollbar-color: rgba(216,190,147,.25) transparent; }
        .vazio { font-size: 12px; color: var(--mu); font-style: italic; text-align: center; padding: 40px 0; margin: 0; }
        .vazio-bloco { text-align: center; padding: 44px 20px; }
        .vazio-bloco p { margin: 14px auto 0; max-width: 300px; font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 17px; color: #b9b3a8; line-height: 1.4; }
        .linha-ouro { display: inline-block; width: 40px; height: 1px; background: var(--g); opacity: .6; }

        .dia { display: flex; align-items: center; gap: 12px; margin: 18px 0 8px; }
        .dia::before, .dia::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--li), transparent); }
        .dia span { font-size: 9px; letter-spacing: .3em; text-transform: uppercase; color: var(--mu); }

        .msg { display: flex; gap: 10px; margin-top: 14px; align-items: flex-start; }
        .msg.agrupa { margin-top: 4px; }
        .msg.minha { flex-direction: row-reverse; }
        .msg.nova { animation: entra .45s cubic-bezier(.2,.8,.2,1); }
        @keyframes entra { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .col-av { flex: none; width: 36px; }
        .corpo { min-width: 0; max-width: min(78%, 520px); display: flex; flex-direction: column; }
        .msg.minha .corpo { align-items: flex-end; }
        .meta { margin: 0 0 5px; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
        .msg.minha .meta { flex-direction: row-reverse; }
        .nome { font-size: 13px; font-weight: 600; color: var(--cr); letter-spacing: .01em; }
        .msg.staff .nome { color: var(--g); }
        .funcao { font-size: 9px; letter-spacing: .18em; text-transform: uppercase; color: var(--mu); }
        .hora { font-size: 10px; color: #6b6862; font-variant-numeric: tabular-nums; }
        .bolha {
          margin: 0; padding: 10px 14px; border-radius: 4px 16px 16px 16px; font-size: 14px; line-height: 1.5;
          white-space: pre-wrap; word-break: break-word; color: #e6e0d4;
          background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.06);
        }
        .msg.staff .bolha { background: linear-gradient(180deg, rgba(216,190,147,.10), rgba(216,190,147,.05)); border-color: rgba(216,190,147,.22); }
        .msg.minha .bolha { border-radius: 16px 4px 16px 16px; background: linear-gradient(135deg, #d8be93, #b8965a); color: #15120c; border-color: transparent; }
        .msg.agrupa .bolha { border-radius: 16px; }

        .chat-rl :global(.av) {
          width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; overflow: hidden;
          font-size: 11px; font-weight: 700; letter-spacing: .05em; flex: none;
        }
        .chat-rl :global(.av img) { width: 100%; height: 100%; object-fit: cover; display: block; }
        .chat-rl :global(.av-staff) { border: 1px solid rgba(216,190,147,.55); color: var(--g); background: #15130f; }
        .chat-rl :global(.av-noivos) { border: 1px solid rgba(243,237,226,.25); color: var(--cr); background: #1a1a1a; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 14px; font-weight: 500; }

        .rodape { border-top: 1px solid var(--li); padding: 12px 16px 16px; background: rgba(0,0,0,.25); }
        .falar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .falar-av { width: 26px; height: 26px; border-radius: 50%; overflow: hidden; display: grid; place-items: center; border: 1px solid rgba(216,190,147,.55); color: var(--g); font-size: 9px; font-weight: 700; flex: none; }
        .falar-av img { width: 100%; height: 100%; object-fit: cover; }
        .falar-rot { font-size: 9px; letter-spacing: .26em; text-transform: uppercase; color: var(--mu); white-space: nowrap; }
        .falar select { flex: 1; min-width: 0; background: transparent; color: var(--cr); border: 0; border-bottom: 1px solid var(--li); padding: 4px 2px; font-size: 13px; font-family: inherit; outline: none; cursor: pointer; }
        .falar select option { background: #111; }
        .escrever { display: flex; align-items: flex-end; gap: 10px; background: #0a0a0a; border: 1px solid rgba(255,255,255,.1); border-radius: 22px; padding: 6px 6px 6px 16px; transition: border-color .2s, box-shadow .2s; }
        .escrever:focus-within { border-color: rgba(216,190,147,.55); box-shadow: 0 0 0 3px rgba(216,190,147,.08); }
        .escrever textarea { flex: 1; resize: none; border: 0; outline: none; background: transparent; color: var(--cr); font-size: 14px; line-height: 1.45; font-family: inherit; padding: 8px 0; max-height: 132px; }
        .escrever textarea::placeholder { color: #5f5b55; }
        .enviar { flex: none; width: 38px; height: 38px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer; color: #15120c; background: linear-gradient(135deg, #d8be93, #b8965a); transition: transform .15s, opacity .2s; }
        .enviar:hover:not(:disabled) { transform: scale(1.06); }
        .enviar:disabled { opacity: .3; cursor: default; }
        .ponto { width: 6px; height: 6px; border-radius: 50%; background: #15120c; animation: pulsa .9s ease-in-out infinite; }
        @keyframes pulsa { 50% { opacity: .2; } }
        .erro { color: #f87171; font-size: 12px; margin: 8px 4px 0; }

        @media (max-width: 520px) {
          .cab { padding: 16px 16px 12px; }
          .titulo { font-size: 22px; }
          .lista { padding: 6px 12px 14px; }
          .col-av { width: 30px; }
          .chat-rl :global(.av) { width: 30px; height: 30px; }
          .corpo { max-width: 84%; }
        }
      `}</style>
    </section>
  )
}
