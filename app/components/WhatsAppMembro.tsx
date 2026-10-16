'use client'

// Botão WhatsApp das gavetas do /photo: abre uma janela ao centro com a
// mensagem já escrita (editável) e a lista da equipa. Escolhe-se o membro e
// "Enviar" abre o WhatsApp (wa.me) com o texto pronto. Sem emojis: chegam como "?".

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type Membro = { id: string; nome: string; status: string | null; contato: string; foto_url: string | null }

const VERDE = '#25D366'
let cacheMembros: Membro[] | null = null

const telefone = (c: string) => {
  const d = c.replace(/\D/g, '').replace(/^00/, '')
  return d.length === 9 ? `351${d}` : d
}
const primeiroNome = (n: string) => (n ?? '').trim().split(/\s+/)[0] ?? ''

export function WhatsAppMembro({ mensagem, titulo = 'Enviar por WhatsApp' }: { mensagem: string; titulo?: string }) {
  const [aberto, setAberto] = useState(false)
  const [montado, setMontado] = useState(false)
  const [membros, setMembros] = useState<Membro[] | null>(cacheMembros)
  const [escolhido, setEscolhido] = useState<Membro | null>(null)
  const [texto, setTexto] = useState(mensagem)

  useEffect(() => { setMontado(true) }, [])

  useEffect(() => {
    if (!aberto) return
    setTexto(mensagem)
    setEscolhido(null)
    if (!cacheMembros) {
      fetch('/api/membros-whatsapp').then(r => r.json())
        .then(d => { cacheMembros = d.membros ?? []; setMembros(cacheMembros) })
        .catch(() => setMembros([]))
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setAberto(false) } }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [aberto, mensagem])

  // Ao escolher o membro, a saudação passa a ter o nome dele
  function escolher(m: Membro) {
    setEscolhido(m)
    setTexto(t => t.replace(/^Olá[^,\n]*,/, `Olá ${primeiroNome(m.nome)},`))
  }

  function enviar() {
    if (!escolhido) return
    window.open(`https://wa.me/${telefone(escolhido.contato)}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
    setAberto(false)
  }

  return (
    <>
      <button onClick={e => { e.preventDefault(); e.stopPropagation(); setAberto(true) }}
        title="Enviar por WhatsApp a um membro da equipa" aria-label="Enviar por WhatsApp"
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background: `${VERDE}1f`, color: VERDE, border: `1px solid ${VERDE}55` }}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
          <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.7.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.7 15.6 2.2 13.8 2.2 12 2.2 6.6 6.6 2.2 12 2.2c2.6 0 5.1 1 6.9 2.9 1.8 1.8 2.9 4.3 2.9 6.9 0 5.4-4.4 9.8-9.8 9.8zM20.5 3.5C18.2 1.2 15.2 0 12 0 5.4 0 .1 5.3.1 11.9c0 2.1.6 4.2 1.6 6L0 24l6.3-1.6c1.8 1 3.7 1.5 5.7 1.5 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.5z" />
        </svg>
      </button>

      {montado && aberto && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setAberto(false)}>
          <div onClick={e => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden rounded-[24px] border border-white/[0.10] bg-[#141414] shadow-[0_0_80px_-20px_rgba(37,211,102,0.35)]"
            style={{ borderLeft: `2px solid ${VERDE}` }}>

            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-white/[0.08]">
              <div>
                <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase" style={{ color: VERDE }}>WhatsApp</p>
                <h3 className="font-cond font-bold text-[30px] leading-none text-white mt-2">{titulo}</h3>
              </div>
              <button onClick={() => setAberto(false)} aria-label="Fechar"
                className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.04] text-white/50 hover:text-white hover:rotate-90 transition-all duration-300 flex items-center justify-center">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
              <div>
                <p className="font-cond text-[12px] font-medium tracking-[0.14em] uppercase text-white/45 mb-2">Mensagem</p>
                <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={7}
                  className="w-full rounded-[16px] border border-white/[0.10] bg-black/30 px-4 py-3 font-cond text-[15px] leading-relaxed text-white/90 focus:outline-none focus:border-white/25 resize-none" />
              </div>

              <div>
                <p className="font-cond text-[12px] font-medium tracking-[0.14em] uppercase text-white/45 mb-2">Enviar para</p>
                {membros === null && <p className="font-cond text-[14px] text-white/35 py-3">A carregar a equipa…</p>}
                {membros?.length === 0 && <p className="font-cond text-[14px] text-white/35 py-3">Ninguém da equipa tem telefone na ficha.</p>}
                <div className="grid grid-cols-2 gap-2">
                  {membros?.map(m => {
                    const on = escolhido?.id === m.id
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
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
              <button onClick={() => setAberto(false)} className="font-cond text-[15px] text-white/50 hover:text-white px-3 py-2 transition-colors">
                Cancelar
              </button>
              <button onClick={enviar} disabled={!escolhido || !texto.trim()}
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-cond text-[16px] font-medium text-black transition-all hover:brightness-110 disabled:opacity-35"
                style={{ background: VERDE }}>
                {escolhido ? `Enviar a ${primeiroNome(escolhido.nome)}` : 'Escolhe o membro'} →
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
