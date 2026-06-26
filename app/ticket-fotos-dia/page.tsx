'use client'

import { useState } from 'react'
import Link from 'next/link'
import TicketForm from './TicketForm'

export default function TicketFotosDiaPage() {
  const [open, setOpen] = useState(false)
  if (open) return <TicketForm />

  return (
    <main className="min-h-screen text-white" style={{ background: '#0b0a08' }}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/secao/c3db95a8-67c5-4339-81c6-891af683f907"
          className="text-[12px] tracking-widest uppercase text-white/30 hover:text-[#c8a866] transition-colors">
          ‹ Voltar
        </Link>

        <div className="mt-24 text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#c8a866]/70 font-semibold">RL Photo · Video</p>
          <h1 className="text-4xl sm:text-5xl font-light mt-3" style={{ fontFamily: 'Georgia, serif' }}>
            Ticket <span className="italic" style={{ color: '#c8a866' }}>Fotos/Dia</span>
          </h1>
          <p className="text-[14px] text-white/45 mt-4 max-w-md mx-auto leading-relaxed">
            Registo de venda de fotografias no dia do evento. Abre um ticket para registar o pedido.
          </p>
          <button onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-xl text-[13px] font-bold tracking-wider uppercase transition-all"
            style={{ background: '#c8a866', color: '#0b0a08', boxShadow: '0 0 28px -6px rgba(200,168,102,0.6)' }}>
            ＋ Abrir Ticket
          </button>
        </div>
      </div>
    </main>
  )
}
