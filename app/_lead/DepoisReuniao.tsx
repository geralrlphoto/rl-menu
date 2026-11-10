'use client'

// Portais da reunião (/r e /b): quando a reunião acaba, a contagem dá lugar a
// um agradecimento com o caminho para a proposta. Até lá (hora marcada + 2 h)
// ficam visíveis a data, a hora e o botão "Entrar na videochamada", porque os
// noivos costumam abrir o portal à hora certa ou já atrasados.

import { useEffect, useState } from 'react'

const DURACAO_REUNIAO_MS = 2 * 60 * 60 * 1000

/** true quando a data/hora (mais a margem) já passou; atualiza sozinho com a página aberta. */
export function useJaPassou(alvo: string | null, margemMs = 0): boolean {
  const calc = () => !!alvo && new Date(alvo).getTime() + margemMs <= Date.now()
  const [passou, setPassou] = useState(calc)
  useEffect(() => {
    setPassou(calc())
    if (!alvo) return
    const id = setInterval(() => setPassou(calc()), 30_000)
    return () => clearInterval(id)
  }, [alvo, margemMs]) // eslint-disable-line react-hooks/exhaustive-deps
  return passou
}

/** Mostra a contagem e os detalhes da reunião até ela acabar; depois, o agradecimento. */
export function ContagemOuObrigado({ alvo, contagem, onVerProposta, evento }: {
  alvo: string; contagem: React.ReactNode; onVerProposta?: () => void; evento?: string
}) {
  const passou = useJaPassou(alvo, DURACAO_REUNIAO_MS)
  return passou ? <DepoisReuniao onVerProposta={onVerProposta} evento={evento} /> : <>{contagem}</>
}

export default function DepoisReuniao({ onVerProposta, evento = 'o vosso dia' }: {
  onVerProposta?: () => void   // sem proposta publicada, não há botão
  evento?: string
}) {
  return (
    <section id="sec-countdown" className="border-y" style={{ borderColor: 'var(--line-soft)', background: 'var(--ink-2)' }}>
      <div className="rlp-wrap flex flex-col items-center text-center gap-6" style={{ paddingTop: 'clamp(46px,7vh,88px)', paddingBottom: 'clamp(46px,7vh,88px)' }}>
        <span className="rlp-eyebrow c">Depois da nossa conversa</span>
        <h2 className="rlp-h2" style={{ fontSize: 'clamp(34px,5vw,60px)' }}>Obrigado pela <em>conversa</em></h2>
        <p className="rlp-lede" style={{ maxWidth: '46ch' }}>
          Foi um prazer conhecer-vos. Preparámos a nossa proposta para {evento}: vejam com calma e digam-nos o que sentem.
        </p>
        {onVerProposta && (
          <button type="button" onClick={onVerProposta} className="rlp-btn" style={{ marginTop: 8 }}>
            <span className="fill" /><span className="dot" />Ver a nossa proposta
          </button>
        )}
      </div>
    </section>
  )
}
