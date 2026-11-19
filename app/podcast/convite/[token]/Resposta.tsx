'use client'

import { useState } from 'react'

/* Botões de resposta ao convite pessoal. Grava em /api/podcast/convite. */

export default function Resposta({ token, inicial, whatsapp }: {
  token: string
  inicial: 'aceitou' | 'recusou' | null
  whatsapp: string
}) {
  const [resposta, setResposta] = useState(inicial)
  const [aEnviar, setAEnviar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [mudar, setMudar] = useState(false)

  async function responder(r: 'aceitou' | 'recusou') {
    setAEnviar(true); setErro(null)
    try {
      const res = await fetch('/api/podcast/convite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, resposta: r }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setErro(j.erro ?? 'Não foi possível enviar. Tente outra vez.'); return }
      setResposta(r); setMudar(false)
    } catch {
      setErro('Não foi possível enviar. Verifique a ligação e tente outra vez.')
    } finally { setAEnviar(false) }
  }

  if (resposta && !mudar) {
    return (
      <div className="ci-resp-feita">
        {resposta === 'aceitou' ? (
          <>
            <h2>Obrigado. <em>Até já.</em></h2>
            <p>Recebemos o seu sim. Vamos falar consigo para combinar a data e enviar os detalhes da gravação.</p>
          </>
        ) : (
          <>
            <h2>Obrigado <em>pela resposta.</em></h2>
            <p>Fica para outra altura. Se mais à frente fizer sentido, a porta continua aberta.</p>
          </>
        )}
        <div className="ci-botoes">
          <a className="ci-btn ci-btn-linha" href={whatsapp} target="_blank" rel="noopener">Falar no WhatsApp</a>
          <button type="button" className="ci-mudar" onClick={() => setMudar(true)}>Mudar a resposta</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="ci-botoes">
        <button type="button" className="ci-btn ci-btn-ouro" disabled={aEnviar} onClick={() => responder('aceitou')}>
          {aEnviar ? 'A enviar…' : 'Aceito o convite'} <span aria-hidden="true">→</span>
        </button>
        <button type="button" className="ci-btn ci-btn-linha" disabled={aEnviar} onClick={() => responder('recusou')}>Agora não posso</button>
        <a className="ci-btn ci-btn-linha" href={whatsapp} target="_blank" rel="noopener">Prefiro falar primeiro</a>
      </div>
      {erro && <p className="ci-erro" role="alert">{erro}</p>}
    </div>
  )
}
