'use client'

import { useEffect, useRef, useState } from 'react'

/* Telemóvel com a conversa de WhatsApp: pré-visualiza a mensagem antes de a enviar
   (mesmo aspeto do /crm/follow-up). */

const iniciais = (nome: string) => {
  const partes = nome.split(/\s+e\s+|\s*&\s*/i).map(p => p.trim()).filter(Boolean)
  return (partes.length > 1 ? partes.slice(0, 2).map(p => p[0]).join('&') : (nome.trim()[0] ?? '?')).toUpperCase()
}

export default function WhatsAppPhone({ texto, nome, altura = 340 }: { texto: string; nome: string; altura?: number }) {
  const conversa = useRef<HTMLDivElement>(null)
  const [hora] = useState(() => new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }))
  // Mostra o início da mensagem sempre que o texto muda
  useEffect(() => { conversa.current?.scrollTo({ top: 0 }) }, [texto])

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="rounded-[2.4rem] border border-white/15 bg-[#0a0a0a] p-2.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
        <div className="rounded-[1.9rem] overflow-hidden bg-[#0b141a]">
          {/* Barra do contacto */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1f2c34]">
            <span className="text-white/50 text-lg leading-none">‹</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/80 to-gold/30 flex items-center justify-center text-[11px] font-bold text-black">{iniciais(nome)}</div>
            <div className="min-w-0">
              <div className="text-white text-sm leading-tight truncate">{nome}</div>
              <div className="text-[11px] text-green-400/80 leading-tight">online</div>
            </div>
          </div>
          {/* Conversa */}
          <div ref={conversa} className="overflow-y-auto px-3 py-4 flex flex-col" style={{
            height: altura,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '14px 14px',
          }}>
            <div className="self-end max-w-[92%] rounded-2xl rounded-tr-sm bg-[#005c4b] px-3 pt-2 pb-1.5 shadow">
              <p className="text-[12.5px] leading-[1.45] text-[#e9edef] whitespace-pre-wrap break-words">{texto}</p>
              <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-white/50">
                {hora} <span className="text-sky-400">✓✓</span>
              </div>
            </div>
          </div>
          {/* Barra de escrever */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#1f2c34]">
            <div className="flex-1 rounded-full bg-[#2a3942] px-4 py-2 text-[12px] text-white/35">Mensagem</div>
            <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center text-black text-sm">➤</div>
          </div>
        </div>
      </div>
    </div>
  )
}
