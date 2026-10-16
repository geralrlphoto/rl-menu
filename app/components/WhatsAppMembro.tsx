'use client'

// Enviar por WhatsApp a um membro da equipa (ou a outro número).
// JanelaWhatsApp: janela ao centro com a mensagem já escrita (editável), a lista
// da equipa e um campo para outro número. "Enviar" abre o WhatsApp (wa.me) com o
// texto pronto. Sem emojis: chegam como "?".
// WhatsAppMembro: o botão verde das gavetas do /photo, que abre esta janela.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Membro = { id: string; nome: string; status: string | null; contato: string; foto_url: string | null }

const VERDE = '#25D366'
let cacheMembros: Membro[] | null = null

// 912345678 → 351912345678; +44… / 0044… ficam com o indicativo do país
const telefone = (c: string) => {
  const d = c.replace(/\D/g, '').replace(/^00/, '')
  return d.length === 9 ? `351${d}` : d
}
const primeiroNome = (n: string) => (n ?? '').trim().split(/\s+/)[0] ?? ''

const LogoWhatsApp = ({ cls = 'w-4 h-4' }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
    <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.7.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.7 15.6 2.2 13.8 2.2 12 2.2 6.6 6.6 2.2 12 2.2c2.6 0 5.1 1 6.9 2.9 1.8 1.8 2.9 4.3 2.9 6.9 0 5.4-4.4 9.8-9.8 9.8zM20.5 3.5C18.2 1.2 15.2 0 12 0 5.4 0 .1 5.3.1 11.9c0 2.1.6 4.2 1.6 6L0 24l6.3-1.6c1.8 1 3.7 1.5 5.7 1.5 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.5z" />
  </svg>
)

export function JanelaWhatsApp({ aberto, onFechar, mensagem, titulo = 'Enviar por WhatsApp', etiqueta = 'WhatsApp', extraAcoes }: {
  aberto: boolean
  onFechar: () => void
  mensagem: string
  titulo?: string
  etiqueta?: string
  /** Botões a mais no rodapé, à esquerda (ex.: Copiar link) */
  extraAcoes?: ReactNode
}) {
  const [montado, setMontado] = useState(false)
  const [membros, setMembros] = useState<Membro[] | null>(cacheMembros)
  const [escolhido, setEscolhido] = useState<Membro | null>(null)
  const [outro, setOutro] = useState(false)
  const [numero, setNumero] = useState('')
  const [texto, setTexto] = useState(mensagem)

  useEffect(() => { setMontado(true) }, [])
  // onFechar pode mudar a cada render: guardado numa ref para não reiniciar a janela
  const fecharRef = useRef(onFechar)
  fecharRef.current = onFechar

  useEffect(() => {
    if (!aberto) return
    setTexto(mensagem)
    setEscolhido(null); setOutro(false); setNumero('')
    if (!cacheMembros) {
      fetch('/api/membros-whatsapp').then(r => r.ok ? r.json() : { membros: [] })
        .then(d => { cacheMembros = d.membros ?? []; setMembros(cacheMembros) })
        .catch(() => setMembros([]))
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); fecharRef.current() } }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [aberto, mensagem])

  // Ao escolher o membro, a saudação passa a ter o nome dele
  function escolher(m: Membro) {
    setEscolhido(m); setOutro(false)
    // "Olá boas tudo bem?" passa a "Olá Ana, boas tudo bem?"
    setTexto(t => t.replace(/^Olá[^\n]*?,? (?=boas)/, `Olá ${primeiroNome(m.nome)}, `))
  }

  const numeroValido = telefone(numero).length >= 11
  const destino = outro ? (numeroValido ? telefone(numero) : '') : escolhido ? telefone(escolhido.contato) : ''

  function enviar() {
    if (!destino) return
    window.open(`https://wa.me/${destino}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
    onFechar()
  }

  if (!montado || !aberto) return null
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onFechar}>
      <div onClick={e => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden rounded-[24px] border border-white/[0.10] bg-[#141414] shadow-[0_0_80px_-20px_rgba(37,211,102,0.35)]"
        style={{ borderLeft: `2px solid ${VERDE}`, fontFamily: "'Roboto Condensed', sans-serif" }}>

        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-white/[0.08]">
          <div>
            <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase" style={{ color: VERDE }}>{etiqueta}</p>
            <h3 className="font-cond font-bold text-[30px] leading-none text-white mt-2">{titulo}</h3>
          </div>
          <button onClick={onFechar} aria-label="Fechar"
            className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.04] text-white/50 hover:text-white hover:rotate-90 transition-all duration-300 flex items-center justify-center">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <div>
            <p className="font-cond text-[12px] font-medium tracking-[0.14em] uppercase text-white/45 mb-2">Mensagem</p>
            <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={8}
              className="w-full rounded-[16px] border border-white/[0.10] bg-black/30 px-4 py-3 font-cond text-[15px] leading-relaxed text-white/90 focus:outline-none focus:border-white/25 resize-none" />
          </div>

          <div>
            <p className="font-cond text-[12px] font-medium tracking-[0.14em] uppercase text-white/45 mb-2">Enviar para</p>
            {membros === null && <p className="font-cond text-[14px] text-white/35 py-2">A carregar a equipa…</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {membros?.map(m => {
                const on = !outro && escolhido?.id === m.id
                return (
                  <button key={m.id} onClick={() => escolher(m)}
                    className="flex items-center gap-2.5 rounded-full border pl-1.5 pr-3 py-1.5 text-left transition-all hover:border-white/25"
                    style={{ borderColor: on ? VERDE : 'rgba(255,255,255,0.08)', background: on ? `${VERDE}14` : 'rgba(255,255,255,0.02)' }}>
                    {m.foto_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={m.foto_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      : <span className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-cond font-semibold text-[13px] text-[#C9A84C] bg-[#C9A84C]/10">{m.nome?.charAt(0)}</span>}
                    <span className="min-w-0">
                      <span className="block font-cond text-[14px] text-white truncate">{m.nome}</span>
                      <span className="block font-cond text-[11px] text-white/35 truncate capitalize">{(m.status ?? '').toLowerCase()}</span>
                    </span>
                  </button>
                )
              })}
              {/* Fora da equipa: escreve-se o número à mão */}
              <button onClick={() => { setOutro(true); setEscolhido(null) }}
                className="flex items-center gap-2.5 rounded-full border border-dashed pl-1.5 pr-3 py-1.5 text-left transition-all hover:border-white/30"
                style={{ borderColor: outro ? VERDE : 'rgba(255,255,255,0.15)', background: outro ? `${VERDE}14` : 'transparent' }}>
                <span className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-cond text-[16px] text-white/60 bg-white/[0.05]">+</span>
                <span className="font-cond text-[14px] text-white/80">Outro número</span>
              </button>
            </div>
            {outro && (
              <div className="mt-3">
                <input autoFocus value={numero} onChange={e => setNumero(e.target.value)} inputMode="tel"
                  placeholder="912 345 678 ou +44 7700 900123"
                  className="w-full rounded-full border border-white/[0.12] bg-black/30 px-4 py-3 font-cond text-[16px] text-white placeholder-white/30 focus:outline-none"
                  style={{ borderColor: numero && !numeroValido ? 'rgba(201,168,76,0.6)' : undefined }} />
                <p className="font-cond text-[12px] text-white/35 mt-1.5 pl-2">
                  {numero && !numeroValido ? 'Número incompleto.' : 'Números portugueses podem ir sem o +351.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.08] flex flex-wrap items-center justify-end gap-3">
          {extraAcoes && <div className="mr-auto">{extraAcoes}</div>}
          <button onClick={onFechar} className="font-cond text-[15px] text-white/50 hover:text-white px-3 py-2 transition-colors">
            Cancelar
          </button>
          <button onClick={enviar} disabled={!destino || !texto.trim()}
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-cond text-[16px] font-medium text-black transition-all hover:brightness-110 disabled:opacity-35"
            style={{ background: VERDE }}>
            <LogoWhatsApp />
            {escolhido && !outro ? `Enviar a ${primeiroNome(escolhido.nome)}` : outro ? 'Enviar' : 'Escolhe o destinatário'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function WhatsAppMembro({ mensagem, titulo = 'Enviar por WhatsApp' }: { mensagem: string; titulo?: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button onClick={e => { e.preventDefault(); e.stopPropagation(); setAberto(true) }}
        title="Enviar por WhatsApp a um membro da equipa" aria-label="Enviar por WhatsApp"
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background: `${VERDE}1f`, color: VERDE, border: `1px solid ${VERDE}55` }}>
        <LogoWhatsApp />
      </button>
      <JanelaWhatsApp aberto={aberto} onFechar={() => setAberto(false)} mensagem={mensagem} titulo={titulo} />
    </>
  )
}
