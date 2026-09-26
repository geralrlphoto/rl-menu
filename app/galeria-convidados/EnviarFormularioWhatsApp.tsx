'use client'

import { useState } from 'react'
import { whatsappLink } from '@/lib/crm'
import { linkPublico } from '@/lib/site-url'

// Botão "Formulário de Fotos" em dropdown: abrir o formulário ou enviá-lo ao cliente por WhatsApp.
export default function EnviarFormularioWhatsApp() {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [contato, setContato] = useState('')

  const primeiroNome = nome.trim().split(/\s+/)[0] ?? ''
  const texto = [
    `Olá ${primeiroNome}`.trim() + ',',
    '',
    'Já pode fazer o seu pedido de fotografias através do nosso formulário:',
    linkPublico('/adquirir-fotografias'),
    '',
    'Qualquer dúvida, estamos disponíveis.',
    '',
    'Com os melhores cumprimentos,',
    'RL PhotoVideo',
  ].join('\n')
  const href = whatsappLink(contato, texto)

  return (
    <div className="relative">
      <button type="button" onClick={() => setAberto(a => !a)}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[12px] font-bold tracking-wider uppercase transition-all"
        style={{ background: '#c8a866', color: '#0b0a08', boxShadow: '0 0 24px -6px rgba(200,168,102,0.6)' }}>
        ＋ Formulário de Fotos
        <span className={`text-[10px] transition-transform ${aberto ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-72 z-20 rounded-xl p-4 space-y-3"
          style={{ background: '#1a130c', border: '1px solid rgba(200,168,102,0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <a href="/adquirir-fotografias" target="_blank" rel="noopener noreferrer"
            className="block text-center px-4 py-2.5 rounded-lg text-[12px] font-bold tracking-wider uppercase border border-white/15 text-white/70 hover:border-[#c8a866] hover:text-[#c8a866] transition-all">
            Abrir formulário
          </a>

          <div className="h-px bg-white/10" />

          <p className="text-[10px] tracking-[0.3em] uppercase text-[#c8a866]/80 font-semibold">Enviar por WhatsApp</p>
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do cliente"
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-[#c8a866]" />
          <input value={contato} onChange={e => setContato(e.target.value)} placeholder="Contacto (ex: 912345678)" inputMode="tel"
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-[#c8a866]" />
          <a href={href ?? undefined} target="_blank" rel="noopener noreferrer"
            aria-disabled={!href}
            onClick={e => { if (!href) e.preventDefault() }}
            className={`block text-center px-4 py-2.5 rounded-lg text-[12px] font-bold tracking-wider uppercase transition-all ${href ? 'bg-[#25D366] text-black hover:brightness-110' : 'bg-white/5 text-white/25 cursor-not-allowed'}`}>
            Enviar no WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}
