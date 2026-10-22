'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

/* Chat do Atendimento: noivos ↔ staff RL (tabela noivos_chat, /api/noivos-chat).
   Usado no portal (casamento e batizado) e na ficha do evento.
   Quem consegue ler /api/staff é admin: escolhe o membro do staff que está a falar.
   Egress: só texto, sem polling. Carrega ao abrir e quando a página volta a ficar
   visível, e pede apenas as mensagens a seguir à última que já tem. */

type Msg = { id: number; autor: 'noivos' | 'staff'; staff_nome: string | null; staff_funcao: string | null; texto: string; criado_em: string }
type Staff = { id: string; nome: string; funcao: string; ativo: boolean }

const OURO = '#d8be93'
const iniciais = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
const hora = (iso: string) => new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function ChatAtendimento({ referencia }: { referencia: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [carregado, setCarregado] = useState(false)
  const [staff, setStaff] = useState<Staff[] | null>(null)   // null = noivos
  const [quem, setQuem] = useState('')
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const ultimo = useRef(0)
  const fundo = useRef<HTMLDivElement>(null)
  const LS_QUEM = 'chat_staff_quem'

  const juntar = (novas: Msg[]) => {
    if (!novas.length) return
    ultimo.current = Math.max(ultimo.current, ...novas.map(m => m.id))
    setMsgs(a => [...a, ...novas.filter(n => !a.some(m => m.id === n.id))])
  }

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`/api/noivos-chat?ref=${encodeURIComponent(referencia)}&depois=${ultimo.current}`, { cache: 'no-store' })
      if (r.ok) juntar((await r.json()).mensagens ?? [])
    } catch { /* sem rede: fica o que já há */ }
    setCarregado(true)
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

  useEffect(() => { fundo.current?.scrollTo({ top: fundo.current.scrollHeight }) }, [msgs.length])

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

  return (
    <div className="chat-at">
      <div className="topo">
        <span className="eyebrow">Conversa com a equipa</span>
        <button type="button" className="atualizar" onClick={carregar}>Atualizar ↻</button>
      </div>

      <div className="lista" ref={fundo}>
        {!carregado && <p className="vazio">A carregar…</p>}
        {carregado && !msgs.length && <p className="vazio">{admin ? 'Ainda não há mensagens com estes noivos.' : 'Escrevam-nos aqui. Respondemos pela nossa equipa.'}</p>}
        {msgs.map(m => (
          <div key={m.id} className={`linha ${meu(m) ? 'minha' : ''}`}>
            {m.autor === 'staff' && <span className="avatar" title={m.staff_nome ?? ''}>{iniciais(m.staff_nome || 'RL')}</span>}
            <div className={`bolha ${m.autor}`}>
              <p className="quem">
                {m.autor === 'staff' ? <>{m.staff_nome || 'RL Photo·Video'}{m.staff_funcao ? <span className="funcao"> · {m.staff_funcao}</span> : null}</> : admin ? 'Noivos' : 'Vocês'}
              </p>
              <p className="txt">{m.texto}</p>
              <p className="hora">{hora(m.criado_em)}</p>
            </div>
          </div>
        ))}
      </div>

      {admin && (
        <label className="falar">
          <span>A falar como</span>
          <select value={quem} onChange={e => { setQuem(e.target.value); try { localStorage.setItem(LS_QUEM, e.target.value) } catch {} }}>
            {!staff!.length && <option value="">Sem staff (Gestão › Staff)</option>}
            {staff!.map(s => <option key={s.id} value={s.id}>{s.nome}{s.funcao ? ` · ${s.funcao}` : ''}</option>)}
          </select>
        </label>
      )}
      <div className="escrever">
        <textarea value={texto} maxLength={2000} rows={2} placeholder="Escrever mensagem…"
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }} />
        <button type="button" onClick={enviar} disabled={enviando || !texto.trim()}>{enviando ? '…' : 'Enviar'}</button>
      </div>
      {erro && <p className="erro">{erro}</p>}

      <style jsx>{`
        .chat-at { margin: 28px 0 10px; border: 1px solid rgba(216,190,147,.28); border-radius: 18px; background: rgba(12,12,12,.85); padding: 16px; font-family: 'Hanken Grotesk', sans-serif; color: #f3ede2; }
        .topo { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .eyebrow { font-size: 10px; letter-spacing: .32em; text-transform: uppercase; color: ${OURO}; font-weight: 600; }
        .atualizar { background: none; border: 0; color: #8b877f; font-size: 11px; cursor: pointer; letter-spacing: .08em; }
        .atualizar:hover { color: ${OURO}; }
        .lista { max-height: 420px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 4px 2px; }
        .vazio { font-size: 12px; color: #6b6862; font-style: italic; text-align: center; padding: 18px 0; margin: 0; }
        .linha { display: flex; align-items: flex-end; gap: 8px; }
        .linha.minha { flex-direction: row-reverse; }
        .avatar { flex: none; width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(216,190,147,.5); color: ${OURO}; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; letter-spacing: .04em; }
        .bolha { max-width: 78%; padding: 8px 12px; border-radius: 14px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.07); }
        .bolha.staff { border-color: rgba(216,190,147,.3); background: rgba(216,190,147,.07); }
        .quem { margin: 0 0 3px; font-size: 9px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; color: ${OURO}; }
        .bolha.noivos .quem { color: #c0bbb2; }
        .funcao { font-weight: 500; color: #8b877f; letter-spacing: .1em; }
        .txt { margin: 0; font-size: 14px; line-height: 1.45; color: #e8e2d6; white-space: pre-wrap; word-break: break-word; }
        .hora { margin: 4px 0 0; font-size: 9px; color: #6b6862; text-align: right; }
        .falar { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: #8b877f; }
        .falar select { flex: 1; background: #0b0b0b; color: #f3ede2; border: 1px solid rgba(216,190,147,.35); border-radius: 10px; padding: 7px 10px; font-size: 13px; letter-spacing: 0; text-transform: none; }
        .escrever { display: flex; gap: 8px; margin-top: 10px; }
        .escrever textarea { flex: 1; resize: vertical; min-height: 44px; background: #0b0b0b; color: #f3ede2; border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 10px 12px; font-size: 14px; font-family: inherit; outline: none; }
        .escrever textarea:focus { border-color: ${OURO}; }
        .escrever button { border: 1px solid ${OURO}; color: ${OURO}; background: transparent; border-radius: 999px; padding: 0 18px; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; font-weight: 600; cursor: pointer; }
        .escrever button:disabled { opacity: .4; cursor: default; }
        .erro { color: #f87171; font-size: 12px; margin: 8px 0 0; }
      `}</style>
    </div>
  )
}
