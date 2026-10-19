'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

/* Página pública (link enviado aos noivos que não fecharam): uma caixa de
   texto livre para deixarem a opinião. Guarda em crm_opinioes e aparece na
   ficha do contacto no CRM. */

const SERIF = { fontFamily: "'Cormorant Garamond', serif" }
const GOLD = '#C9A84C'
const HERO = '/eventos-hero-2026.webp'

export default function OpiniaoPage() {
  const { id } = useParams<{ id: string }>()
  const [estado, setEstado] = useState<'carregar' | 'erro' | 'ok' | 'enviado'>('carregar')
  const [nome, setNome] = useState('')
  const [texto, setTexto] = useState('')
  const [aEnviar, setAEnviar] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch(`/api/opiniao-publico?c=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => { if (d.ok) { setNome(d.nome); setEstado('ok') } else setEstado('erro') })
      .catch(() => setEstado('erro'))
  }, [id])

  const enviar = async () => {
    if (!texto.trim() || aEnviar) return
    setAEnviar(true); setErro('')
    try {
      const r = await fetch('/api/opiniao-publico', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ c: id, texto }),
      })
      const d = await r.json()
      if (d.ok) setEstado('enviado')
      else setErro(d.error || 'Não foi possível enviar. Tentem de novo.')
    } catch {
      setErro('Não foi possível enviar. Tentem de novo.')
    }
    setAEnviar(false)
  }

  return (
    <main className="relative min-h-screen w-full bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${HERO})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />

      <div className="relative w-full max-w-xl">
        <p className="text-center text-[10px] tracking-[0.4em] uppercase mb-4" style={{ color: GOLD }}>RL PhotoVideo</p>

        {estado === 'carregar' && <p className="text-center text-white/50 text-sm">A carregar…</p>}

        {estado === 'erro' && (
          <p className="text-center text-white/60 text-base" style={SERIF}>Este link não é válido.</p>
        )}

        {estado === 'ok' && (
          <>
            <h1 className="text-center text-4xl sm:text-5xl font-light mb-3" style={{ ...SERIF, color: GOLD }}>A vossa opinião</h1>
            <div className="mx-auto mb-6 h-px w-16" style={{ background: GOLD }} />
            <p className="text-center text-white/75 text-lg italic leading-relaxed mb-8" style={SERIF}>
              {nome ? `${nome}, obrigado` : 'Obrigado'} por terem conversado connosco.
              Gostávamos de saber o que pesou na vossa decisão e o que podíamos ter feito melhor.
              Escrevam à vontade.
            </p>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              rows={8}
              maxLength={5000}
              placeholder="Escrevam aqui…"
              className="w-full rounded-2xl border border-white/80 bg-black/50 p-4 text-base text-white placeholder-white/30 outline-none focus:border-white shadow-[0_0_12px_rgba(255,255,255,0.25)]"
            />
            {erro && <p className="mt-3 text-sm text-red-400 text-center">{erro}</p>}
            <button
              onClick={enviar}
              disabled={!texto.trim() || aEnviar}
              className="mt-6 w-full rounded-xl py-3 text-xs tracking-[0.3em] uppercase text-black disabled:opacity-40"
              style={{ background: GOLD }}
            >
              {aEnviar ? 'A enviar…' : 'Enviar'}
            </button>
          </>
        )}

        {estado === 'enviado' && (
          <>
            <h1 className="text-center text-4xl font-light mb-3" style={{ ...SERIF, color: GOLD }}>Obrigado</h1>
            <div className="mx-auto mb-6 h-px w-16" style={{ background: GOLD }} />
            <p className="text-center text-white/75 text-lg italic" style={SERIF}>
              Recebemos a vossa opinião. Desejamos-vos um casamento muito feliz.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
