'use client'

import { useEffect, useState } from 'react'
import { whatsappLink, nomeNoivos, ASSINATURA } from '@/lib/crm'

/* Ficha › Comunicação com os Noivos › Enviar IBAN.
   Resposta ao botão "Solicitar IBAN" do portal: escreve-se só o IBAN e segue
   pelo WhatsApp uma mensagem pronta, com a referência e a indicação para
   registarem o pagamento no portal. O último IBAN usado fica guardado neste browser. */

const CHAVE_IBAN = 'rl_iban_pagamentos'

// "PT50000201231234567890154" → "PT50 0002 0123 1234 5678 9015 4"
const formatarIban = (v: string) => v.replace(/\s+/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim()

export default function EnviarIbanNoivos({ e }: { e: any }) {
  const [iban, setIban] = useState('')
  const [quem, setQuem] = useState<'noiva' | 'noivo'>(e.tel_noiva ? 'noiva' : 'noivo')
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    try { setIban(localStorage.getItem(CHAVE_IBAN) ?? '') } catch { /* sem storage */ }
  }, [])

  const nome = nomeNoivos(e.cliente, e.nome_noiva, e.nome_noivo)
  const tel = quem === 'noiva' ? e.tel_noiva : e.tel_noivo
  const ibanLimpo = iban.replace(/\s+/g, '')
  const ibanValido = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/i.test(ibanLimpo)
  const ref = e.referencia ?? ''

  const texto = [
    `Olá${nome ? ' ' + nome : ''}!`,
    '',
    'Seguem os dados para o pagamento por transferência:',
    '',
    `IBAN: ${formatarIban(ibanLimpo)}`,
    ...(ref ? [`No descritivo, indiquem a referência ${ref}.`] : []),
    '',
    'Depois da transferência, registem o pagamento com o comprovativo no vosso portal, na página Pagamentos, no botão Registar Pagamento.',
    '',
    ...ASSINATURA,
  ].join('\n')
  const href = ibanValido ? whatsappLink(tel, texto) : null

  const base = 'text-[11px] font-semibold tracking-wider uppercase text-center px-4 py-2.5 rounded-lg border transition-colors'

  return (
    <div className="rounded-xl border border-gold/25 bg-gold/[0.04] p-4 flex flex-col gap-3">
      <div>
        <span className="text-[10px] tracking-[0.3em] uppercase text-gold/85 font-semibold">Enviar IBAN aos noivos</span>
        <p className="text-white/45 text-xs mt-1 leading-relaxed">
          Escreve o IBAN e segue pelo WhatsApp uma mensagem pronta, com a referência e a indicação para registarem o pagamento no portal.
        </p>
      </div>

      <input value={iban} onChange={ev => { setIban(ev.target.value); setEnviado(false) }} placeholder="PT50 0000 0000 0000 0000 0000 0"
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono tracking-wider placeholder:text-white/20 focus:outline-none focus:border-gold" />
      {iban && !ibanValido && <p className="text-[11px] text-amber-300/80 -mt-1">O IBAN parece incompleto.</p>}

      {e.tel_noiva && e.tel_noivo && (
        <div className="flex gap-1.5 text-[10px] tracking-[0.2em] uppercase">
          {(['noiva', 'noivo'] as const).map(q => (
            <button key={q} onClick={() => setQuem(q)}
              className={`px-3 py-1 rounded-md border transition-colors ${quem === q ? 'border-green-500/40 text-green-400 bg-green-500/10' : 'border-white/10 text-white/35 hover:text-white/60'}`}>
              {q === 'noiva' ? 'Noiva / Mãe' : 'Noivo / Pai'}
            </button>
          ))}
        </div>
      )}

      {ibanValido && (
        <pre className="whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-[12px] text-white/70 font-sans leading-relaxed">{texto}</pre>
      )}

      {!tel ? (
        <div className={`${base} border-white/10 text-white/30`}>Sem telemóvel nos Dados do Casal</div>
      ) : href ? (
        <a href={href} target="_blank" rel="noopener noreferrer"
          onClick={() => {
            setEnviado(true)
            try { localStorage.setItem(CHAVE_IBAN, formatarIban(ibanLimpo)) } catch { /* sem storage */ }
            // Os pedidos de IBAN por responder ficam respondidos (Atendimento do portal + sino)
            if (ref) fetch('/api/noivos-message/responder', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ referencia: ref, titulo: 'Pedido de IBAN', texto: 'Enviámos-vos o IBAN por WhatsApp. Depois da transferência, registem o pagamento com o comprovativo na página Pagamentos.' }),
            }).catch(() => {})
          }}
          className={`${base} border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20 hover:border-green-500/50`}>
          {enviado ? '✓ Aberto no WhatsApp · enviar outra vez' : 'Enviar IBAN pelo WhatsApp'}
        </a>
      ) : (
        <div className={`${base} border-white/10 text-white/30`}>Escreve o IBAN</div>
      )}
    </div>
  )
}
