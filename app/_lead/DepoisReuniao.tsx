'use client'

// Portais da reunião (/r e /b): quando a hora da reunião passa, a contagem
// (que ficaria a zeros) dá lugar a um agradecimento com o caminho para a proposta.

import { useEffect, useState } from 'react'

/** true quando a data/hora já passou; atualiza sozinho com a página aberta. */
export function useJaPassou(alvo: string | null): boolean {
  const calc = () => !!alvo && new Date(alvo).getTime() <= Date.now()
  const [passou, setPassou] = useState(calc)
  useEffect(() => {
    setPassou(calc())
    if (!alvo) return
    const id = setInterval(() => setPassou(calc()), 30_000)
    return () => clearInterval(id)
  }, [alvo]) // eslint-disable-line react-hooks/exhaustive-deps
  return passou
}

/** Mostra a contagem até à reunião; depois da hora, o agradecimento. */
export function ContagemOuObrigado({ alvo, contagem, onVerProposta, evento }: {
  alvo: string; contagem: React.ReactNode; onVerProposta?: () => void; evento?: string
}) {
  const passou = useJaPassou(alvo)
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
