'use client'

/* ============================================================
   AtendimentoThread — conversa do Atendimento organizada por
   TEMAS (assunto), com divisórias por DIA e pesquisa por
   palavra (com destaque). Lê portais.settings.noivos_messages.
   ============================================================ */

import { useEffect, useMemo, useState } from 'react'

type Resposta = { id: string; texto: string; ts: string }
type Msg = {
  id: string; titulo?: string | null; mensagem: string; ts?: string
  respostas?: Resposta[]
}
type Item = { id: string; from: 'vocs' | 'rl'; texto: string; ts: string }
type Tema = { tema: string; items: Item[]; lastTs: string }

function dayLabel(ts: string) {
  try { return new Date(ts).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) }
  catch { return '' }
}
function timeLabel(ts: string) {
  try { return new Date(ts).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}
function dayKey(ts: string) { return (ts || '').slice(0, 10) }

/** Divide o texto destacando ocorrências do termo (case-insensitive). */
function highlight(texto: string, termo: string) {
  if (!termo.trim()) return texto
  const t = termo.trim()
  const parts: Array<{ s: string; hit: boolean }> = []
  const low = texto.toLowerCase(); const tl = t.toLowerCase()
  let i = 0
  while (i < texto.length) {
    const idx = low.indexOf(tl, i)
    if (idx === -1) { parts.push({ s: texto.slice(i), hit: false }); break }
    if (idx > i) parts.push({ s: texto.slice(i, idx), hit: false })
    parts.push({ s: texto.slice(idx, idx + t.length), hit: true })
    i = idx + t.length
  }
  return parts.map((p, k) => p.hit ? <mark key={k}>{p.s}</mark> : <span key={k}>{p.s}</span>)
}

export function AtendimentoThread({ referencia }: { referencia: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [openTemas, setOpenTemas] = useState<Set<string>>(new Set())
  const [replyTema, setReplyTema] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [seenMap, setSeenMap] = useState<Record<string, string>>({})
  const LS_SEEN = `atend_seen_${referencia}`

  useEffect(() => {
    try { const raw = localStorage.getItem(LS_SEEN); if (raw) setSeenMap(JSON.parse(raw)) } catch { /* ignore */ }
  }, [LS_SEEN])

  function marcarTemaVisto(tema: string, lastTs: string) {
    setSeenMap(prev => {
      const next = { ...prev, [tema]: lastTs }
      try { localStorage.setItem(LS_SEEN, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  async function carregar() {
    try {
      const d = await fetch(`/api/portais?ref=${encodeURIComponent(referencia)}`).then(r => r.json())
      setMsgs((d.portal?.settings?.noivos_messages ?? []) as Msg[])
    } catch { /* ignore */ } finally { setLoading(false) }
  }
  useEffect(() => { carregar() }, [referencia])

  // Responder dentro de um tema → cria mensagem com o mesmo assunto (junta-se à conversa).
  async function responderTema(tema: string) {
    if (!replyText.trim()) return
    setSending(true)
    try {
      await fetch('/api/noivos-message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia, titulo: tema, mensagem: replyText.trim() }),
      })
      setReplyText(''); setReplyTema(null)
      marcarTemaVisto(tema, new Date().toISOString())
      await carregar()
    } finally { setSending(false) }
  }

  // Agrupa por TEMA (titulo). Cada tema reúne as suas mensagens + respostas.
  const temas: Tema[] = useMemo(() => {
    const map = new Map<string, Item[]>()
    for (const m of msgs) {
      const tema = (m.titulo || 'Sem assunto').trim()
      const arr = map.get(tema) ?? []
      arr.push({ id: m.id, from: 'vocs', texto: m.mensagem, ts: m.ts ?? '' })
      for (const r of (m.respostas ?? [])) arr.push({ id: r.id, from: 'rl', texto: r.texto, ts: r.ts })
      map.set(tema, arr)
    }
    const out: Tema[] = []
    for (const [tema, items] of map) {
      items.sort((a, b) => (a.ts || '').localeCompare(b.ts || ''))
      out.push({ tema, items, lastTs: items[items.length - 1]?.ts ?? '' })
    }
    out.sort((a, b) => (b.lastTs || '').localeCompare(a.lastTs || ''))
    return out
  }, [msgs])

  // Baseline na 1ª visita: marca todos os temas atuais como vistos, para não
  // brilharem todos. A partir daí só brilha o que for NOVO (ou o tema a que o
  // outro lado respondeu).
  useEffect(() => {
    if (temas.length === 0) return
    try {
      if (localStorage.getItem(`${LS_SEEN}_init`)) return
      const base: Record<string, string> = {}
      for (const t of temas) base[t.tema] = t.lastTs
      localStorage.setItem(LS_SEEN, JSON.stringify(base))
      localStorage.setItem(`${LS_SEEN}_init`, '1')
      setSeenMap(base)
    } catch { /* ignore */ }
  }, [temas, LS_SEEN])

  // Filtro por pesquisa: mostra temas cujo assunto ou alguma mensagem contém o termo.
  const q = query.trim().toLowerCase()
  const temasFiltrados = useMemo(() => {
    if (!q) return temas
    return temas
      .map(t => {
        const temaHit = t.tema.toLowerCase().includes(q)
        const items = temaHit ? t.items : t.items.filter(it => it.texto.toLowerCase().includes(q))
        return items.length ? { ...t, items } : null
      })
      .filter(Boolean) as Tema[]
  }, [temas, q])

  // Quando há pesquisa, abre automaticamente os temas com resultados.
  const isOpen = (tema: string) => q ? true : openTemas.has(tema)
  const isUnread = (t: Tema) => (seenMap[t.tema] ?? '') < (t.lastTs ?? '')
  function toggle(tema: string) {
    setOpenTemas(prev => {
      const n = new Set(prev)
      if (n.has(tema)) { n.delete(tema) }
      else { n.add(tema); const t = temas.find(x => x.tema === tema); if (t) marcarTemaVisto(tema, t.lastTs) }
      return n
    })
  }

  if (loading) return null
  if (msgs.length === 0) return null

  const totalResultados = q ? temasFiltrados.reduce((s, t) => s + t.items.length, 0) : 0

  return (
    <div className="atend-chat">
      <div className="chat-head">
        <span className="dot" /> Conversa · Atendimento
      </div>

      {/* Pesquisa */}
      <div className="chat-search">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Procurar por palavra ou assunto…" />
        {q && <span className="res">{totalResultados} resultado{totalResultados === 1 ? '' : 's'}</span>}
        {q && <button className="clr" onClick={() => setQuery('')} aria-label="Limpar">✕</button>}
      </div>

      <div className="chat-body">
        {temasFiltrados.length === 0 && (
          <p className="vazio">Sem resultados para “{query}”.</p>
        )}
        {temasFiltrados.map(t => {
          const open = isOpen(t.tema)
          const unread = !open && isUnread(t)
          let lastDay = ''
          return (
            <div key={t.tema} className={`tema ${unread ? 'unread' : ''}`}>
              <button className="tema-head" onClick={() => toggle(t.tema)}>
                <span className={`chev ${open ? 'on' : ''}`}>▸</span>
                <span style={{ flex: 1, fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: '#e9dcc2' }}>{highlight(t.tema, q)}</span>
                {unread && <span className="novo">Nova</span>}
                <span style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a6f5e', whiteSpace: 'nowrap' }}>{t.items.length} msg · {dayLabel(t.lastTs).replace(/ de \d{4}$/, '')}</span>
              </button>
              {open && (
                <div className="tema-body">
                  {t.items.map(it => {
                    const dk = dayKey(it.ts)
                    const showDay = dk !== lastDay
                    lastDay = dk
                    return (
                      <div key={it.id}>
                        {showDay && <div style={{ textAlign: 'center', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6f6557', margin: '4px 0 2px' }}>── {dayLabel(it.ts)} ──</div>}
                        <div style={{ display: 'flex', justifyContent: it.from === 'vocs' ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '58%', padding: '4px 8px', borderRadius: 9,
                            background: it.from === 'vocs' ? 'rgba(200,168,102,.14)' : 'rgba(40,60,45,.4)',
                            border: `1px solid ${it.from === 'vocs' ? 'rgba(200,168,102,.25)' : 'rgba(120,200,140,.25)'}`,
                          }}>
                            <div style={{ fontSize: 6, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 1, color: it.from === 'vocs' ? '#d7bd87' : '#84c896' }}>
                              {it.from === 'vocs' ? 'Vocês' : 'RL Photo·Video'}
                            </div>
                            <div style={{ margin: 0, fontSize: 11, lineHeight: 1.4, color: '#cfc6b6', whiteSpace: 'pre-wrap' }}>{highlight(it.texto, q)}</div>
                            <div style={{ fontSize: 6, color: '#7a6f5e', marginTop: 1, textAlign: 'right' }}>{timeLabel(it.ts)}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Responder dentro deste tema (sem abrir nova conversa) */}
                  {replyTema === t.tema ? (
                    <div className="reply-box">
                      <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2} autoFocus
                        placeholder="Escrever resposta…" />
                      <div className="reply-actions">
                        <button className="send" onClick={() => responderTema(t.tema)} disabled={sending || !replyText.trim()}>
                          {sending ? 'A enviar…' : 'Enviar'}
                        </button>
                        <button className="cancel" onClick={() => { setReplyTema(null); setReplyText('') }}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <button className="reply-btn" onClick={() => { setReplyTema(t.tema); setReplyText('') }}>
                      ↩ Responder nesta conversa
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .atend-chat {
          margin: 22px 0 6px; max-width: 100%; width: 100%;
          border: 1px solid rgba(200,168,102,.18); border-radius: 16px;
          background: rgba(0,0,0,.22); overflow: hidden;
        }
        .chat-head {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 16px; border-bottom: 1px solid rgba(200,168,102,.14);
          font-family: 'Hanken Grotesk', sans-serif; font-size: 9px;
          letter-spacing: .38em; text-transform: uppercase; color: #c8a866; font-weight: 600;
          background: rgba(200,168,102,.04);
        }
        .chat-head .dot { width: 6px; height: 6px; border-radius: 50%; background: #84c896; box-shadow: 0 0 6px rgba(132,200,150,.8); }
        .chat-search {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; border-bottom: 1px solid rgba(255,255,255,.05);
          color: #8c8170;
        }
        .chat-search :global(svg) { stroke: #c8a866; flex-shrink: 0; }
        .chat-search input {
          flex: 1; background: transparent; border: 0; outline: none;
          color: #e9dcc2; font-family: 'Hanken Grotesk', sans-serif; font-size: 12px;
        }
        .chat-search input::placeholder { color: #6f6557; }
        .chat-search .res { font-size: 9px; letter-spacing: .1em; color: #c8a866; white-space: nowrap; }
        .chat-search .clr { background: none; border: 0; color: #8c8170; cursor: pointer; font-size: 11px; }
        .chat-body {
          display: flex; flex-direction: column; gap: 6px;
          padding: 10px; max-height: 420px; overflow-y: auto;
        }
        .vazio { font-size: 11px; color: #6f6557; font-style: italic; text-align: center; padding: 14px 0; margin: 0; }
        .tema { border: 1px solid rgba(200,168,102,.12); border-radius: 10px; overflow: hidden; background: rgba(0,0,0,.18); transition: box-shadow .3s; }
        @keyframes temaGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,164,92,0); border-color: rgba(200,168,102,.25); }
          50%      { box-shadow: 0 0 16px 1px rgba(201,164,92,.45); border-color: rgba(232,199,109,.8); }
        }
        .tema.unread { animation: temaGlow 1.8s ease-in-out infinite; }
        .novo {
          font-size: 7px; letter-spacing: .14em; text-transform: uppercase; font-weight: 700;
          color: #1a1306; background: #c9a45c; padding: 2px 6px; border-radius: 999px;
        }
        .tema-head {
          width: 100%; display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; background: rgba(200,168,102,.05); border: 0; cursor: pointer; text-align: left;
        }
        .chev { color: #c8a866; font-size: 9px; transition: transform .2s; }
        .chev.on { transform: rotate(90deg); }
        .tema-nome { flex: 1; font-family: 'Cormorant Garamond', serif; font-size: 14px; color: #e9dcc2; }
        .tema-meta { font-size: 8px; letter-spacing: .12em; text-transform: uppercase; color: #7a6f5e; white-space: nowrap; }
        .tema-body { display: flex; flex-direction: column; gap: 5px; padding: 8px 10px; }
        .day { text-align: center; font-size: 8px; letter-spacing: .2em; text-transform: uppercase; color: #6f6557; margin: 4px 0 2px; }
        .row { display: flex; }
        .row.vocs { justify-content: flex-end; }
        .row.rl   { justify-content: flex-start; }
        .bubble { max-width: 60%; padding: 4px 8px; border-radius: 9px; font-family: 'Hanken Grotesk', sans-serif; }
        .bubble.vocs { background: rgba(200,168,102,.14); border: 1px solid rgba(200,168,102,.25); border-bottom-right-radius: 3px; }
        .bubble.rl { background: rgba(40,60,45,.4); border: 1px solid rgba(120,200,140,.25); border-bottom-left-radius: 3px; }
        .who { font-size: 6px; letter-spacing: .18em; text-transform: uppercase; font-weight: 700; margin-bottom: 1px; }
        .bubble.vocs .who { color: #d7bd87; }
        .bubble.rl .who { color: #84c896; }
        .txt { margin: 0; font-size: 9px; line-height: 1.35; color: #cfc6b6; white-space: pre-wrap; }
        .txt :global(mark) { background: rgba(232,199,109,.5); color: #fff; border-radius: 2px; padding: 0 1px; }
        .tema-nome :global(mark) { background: rgba(232,199,109,.5); color: #fff; border-radius: 2px; padding: 0 1px; }
        .when { font-size: 7px; color: #7a6f5e; margin-top: 2px; text-align: right; }
        .reply-btn {
          align-self: flex-start; margin-top: 4px;
          background: rgba(200,168,102,.1); border: 1px solid rgba(200,168,102,.3);
          color: #c8a866; font-family: 'Hanken Grotesk', sans-serif; font-size: 9px;
          letter-spacing: .12em; text-transform: uppercase; font-weight: 700;
          padding: 5px 10px; border-radius: 8px; cursor: pointer;
        }
        .reply-btn:hover { background: rgba(200,168,102,.2); }
        .reply-box { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
        .reply-box textarea {
          width: 100%; background: rgba(0,0,0,.35); border: 1px solid rgba(200,168,102,.25);
          border-radius: 8px; padding: 8px 10px; color: #e9dcc2;
          font-family: 'Hanken Grotesk', sans-serif; font-size: 12px; line-height: 1.5;
          resize: vertical; outline: none;
        }
        .reply-box textarea:focus { border-color: #c8a866; }
        .reply-actions { display: flex; gap: 8px; }
        .reply-box .send {
          background: linear-gradient(168deg, #efd6a2, #c19a52); color: #1c150b; border: 0;
          font-size: 9px; letter-spacing: .15em; text-transform: uppercase; font-weight: 700;
          padding: 6px 14px; border-radius: 999px; cursor: pointer;
        }
        .reply-box .send:disabled { opacity: .4; cursor: not-allowed; }
        .reply-box .cancel {
          background: transparent; border: 1px solid rgba(239,231,214,.12); color: #8c8170;
          font-size: 9px; letter-spacing: .15em; text-transform: uppercase;
          padding: 6px 12px; border-radius: 999px; cursor: pointer;
        }
      `}</style>
    </div>
  )
}
