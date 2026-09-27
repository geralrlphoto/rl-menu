'use client'

import { useState } from 'react'

/* Botão "Solicitar IBAN" na página de Pagamentos do portal dos noivos.
   Abre o WhatsApp da RL com a mensagem já escrita e, ao mesmo tempo, regista o
   pedido nas mensagens dos noivos (/api/noivos-message): aparece no sino do
   admin, na ficha do evento (Comunicação com os Noivos) e chega por email. */

const WHATSAPP_RL = '351912932768'

export default function SolicitarIbanBtn({ referencia, nomeNoivos }: { referencia: string; nomeNoivos: string }) {
  const [pedido, setPedido] = useState(false)
  const quem = nomeNoivos.trim()
  const texto = [
    `Olá! Somos ${quem || 'os noivos'}${referencia ? ` (${referencia})` : ''}.`,
    'Podem enviar-nos o IBAN para fazermos o pagamento por transferência?',
    'Obrigado!',
  ].join('\n')

  return (
    <a href={`https://wa.me/${WHATSAPP_RL}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener noreferrer"
      onClick={() => {
        setPedido(true)
        if (!referencia) return
        fetch('/api/noivos-message', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referencia, titulo: 'Pedido de IBAN', mensagem: texto, nome_noivos: quem || null }),
        }).catch(() => {})
      }}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gold text-gold font-semibold text-sm tracking-wide hover:bg-gold/10 transition-all">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.4 0 .1 5.3.1 11.9c0 2.1.6 4.1 1.6 5.9L0 24l6.3-1.7c1.7.9 3.7 1.4 5.7 1.4 6.6 0 11.9-5.3 11.9-11.9C23.9 5.3 18.6 0 12 0z" /></svg>
      {pedido ? 'IBAN solicitado' : 'Solicitar IBAN'}
    </a>
  )
}
