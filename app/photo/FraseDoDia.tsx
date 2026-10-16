'use client'

// Frase do dia no /photo: letra manuscrita sobre fundo pontilhado, aspas a dourado.
// Muda todos os dias (mesma frase o dia inteiro); "Outra frase" passa à seguinte.
// Só frases com autoria conhecida e bem documentada.

import { useEffect, useState } from 'react'

const FRASES: Array<{ texto: string; autor: string; sobre?: string }> = [
  { texto: 'A única maneira de fazer um excelente trabalho é amar aquilo que fazes.', autor: 'Steve Jobs', sobre: 'Discurso em Stanford, 2005' },
  { texto: 'Não consegues ligar os pontos a olhar para a frente; só os ligas a olhar para trás.', autor: 'Steve Jobs', sobre: 'Discurso em Stanford, 2005' },
  { texto: 'Mantém-te faminto. Mantém-te louco.', autor: 'Steve Jobs', sobre: 'Discurso em Stanford, 2005' },
  { texto: 'A melhor forma de prever o futuro é inventá-lo.', autor: 'Alan Kay' },
  { texto: 'O risco vem de não saberes o que estás a fazer.', autor: 'Warren Buffett' },
  { texto: 'Leva vinte anos a construir uma reputação e cinco minutos a arruiná-la.', autor: 'Warren Buffett' },
  { texto: 'Os teus clientes mais insatisfeitos são a tua maior fonte de aprendizagem.', autor: 'Bill Gates' },
  { texto: 'O sucesso é um mau professor: convence pessoas inteligentes de que não podem perder.', autor: 'Bill Gates' },
  { texto: 'Quando algo é importante o suficiente, fazes na mesma, mesmo que as probabilidades não estejam a teu favor.', autor: 'Elon Musk' },
  { texto: 'A tua marca é o que as pessoas dizem de ti quando não estás na sala.', autor: 'Jeff Bezos' },
  { texto: 'A qualidade nunca é um acidente; é sempre o resultado de um esforço inteligente.', autor: 'John Ruskin' },
  { texto: 'Fotografar é pôr na mesma linha de mira a cabeça, o olho e o coração.', autor: 'Henri Cartier-Bresson' },
  { texto: 'Se as tuas fotografias não são boas o suficiente, é porque não estás perto o suficiente.', autor: 'Robert Capa' },
]

export default function FraseDoDia({ dia }: { dia: number }) {
  const [i, setI] = useState(dia % FRASES.length)
  const [visivel, setVisivel] = useState(true)

  // Respeita quem prefere menos animação
  const [semAnim, setSemAnim] = useState(false)
  useEffect(() => { setSemAnim(window.matchMedia('(prefers-reduced-motion: reduce)').matches) }, [])

  function outra() {
    if (semAnim) { setI(x => (x + 1) % FRASES.length); return }
    setVisivel(false)
    setTimeout(() => { setI(x => (x + 1) % FRASES.length); setVisivel(true) }, 280)
  }

  const f = FRASES[i]
  return (
    <figure className="text-center max-w-4xl mx-auto px-2">
      <blockquote
        className="font-[Caveat] font-medium text-white/90 text-[30px] sm:text-[44px] leading-[1.25] transition-all duration-300"
        style={{ opacity: visivel ? 1 : 0, transform: visivel ? 'none' : 'translateY(6px)' }}>
        <span className="text-[#C9A84C]">“</span>{f.texto}<span className="text-[#C9A84C]">”</span>
      </blockquote>
      <figcaption className="mt-6 flex flex-col items-center gap-1 transition-opacity duration-300" style={{ opacity: visivel ? 1 : 0 }}>
        <span className="h-px w-12 bg-[#C9A84C]/50 mb-2" />
        <span className="font-cond text-[13px] font-semibold tracking-[0.2em] uppercase text-[#C9A84C]">{f.autor}</span>
        {f.sobre && <span className="font-cond text-[12px] text-white/35">{f.sobre}</span>}
      </figcaption>
      <button onClick={outra}
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/[0.12] hover:border-[#C9A84C]/45 px-4 py-1.5 font-cond text-[13px] text-white/50 hover:text-[#C9A84C] transition-all">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden><path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5" /></svg>
        Outra frase
      </button>
    </figure>
  )
}
