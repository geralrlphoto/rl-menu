'use client'

// Guia da equipa no briefing partilhado: botão na capa que abre uma janela ao centro
// com as regras do dia (apresentação, material, captação e boas práticas).
// A lista do material dá para ir marcando (fica só neste aparelho, no localStorage).

import { useEffect, useState } from 'react'

const MATERIAL = [
  'Câmaras',
  'Lentes',
  'Baterias carregadas e suplentes',
  'Cartões de memória vazios e formatados',
  'Gravadores de áudio e microfones',
  'Luzes de apoio',
  'Extensão para carregar no local',
  'Carregadores das baterias',
  'Panos de limpeza das lentes',
]

const BLOCOS: Array<{ titulo: string; icone: string; itens: string[]; proibido?: string[] }> = [
  {
    titulo: 'Apresentação',
    icone: '◆',
    itens: [
      'Vestir sempre em conformidade com a restante equipa. Combinem a roupa antes do dia.',
      'Boa apresentação: roupa limpa e cuidada, calçado fechado e confortável.',
      'Usar um perfume suave.',
    ],
    proibido: ['Chinelos', 'Calças de ganga', 'Bonés desadequados'],
  },
  {
    titulo: 'Captação',
    icone: '◉',
    itens: [
      'Capturar toda a zona envolvente: detalhes, decoração da cerimónia e da sala, jardins, animais. Tudo pode ser usado no vídeo final.',
      'Filmar cada espaço à chegada, antes de os convidados entrarem, enquanto está arrumado e com boa luz.',
      'Planos de pormenor: alianças, convites, flores, mesas, sapatos, vestido.',
      'Guardar sempre alguns segundos antes e depois de cada momento importante.',
    ],
  },
  {
    titulo: 'Boas práticas no dia',
    icone: '✓',
    itens: [
      'Chegar 15 minutos antes da hora marcada.',
      'Telemóvel em silêncio e discrição total durante a cerimónia e os discursos.',
      'Não comer nem beber à frente dos convidados; a refeição é no momento indicado.',
      'No fim do dia, copiar os cartões para dois sítios antes de os voltar a formatar.',
      'Em caso de dúvida no dia, falar com o responsável da equipa.',
    ],
  },
]

const CHAVE = 'rl-guia-material'

export default function GuiaEquipa() {
  const [aberto, setAberto] = useState(false)
  const [feitos, setFeitos] = useState<string[]>([])

  useEffect(() => {
    try { const g = JSON.parse(localStorage.getItem(CHAVE) ?? '[]'); if (Array.isArray(g)) setFeitos(g) } catch { /* sem localStorage */ }
  }, [])

  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    window.addEventListener('keydown', onKey)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = antes }
  }, [aberto])

  function alternar(item: string) {
    setFeitos(prev => {
      const n = prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
      try { localStorage.setItem(CHAVE, JSON.stringify(n)) } catch { /* ignora */ }
      return n
    })
  }

  const prontos = MATERIAL.filter(m => feitos.includes(m)).length

  return (
    <>
      <button onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 border border-white/20 hover:border-[#C9A84C]/60 bg-black/30 px-6 py-3 text-[14px] font-semibold tracking-[0.18em] uppercase text-white/90 transition-all">
        Guia da equipa <span className="text-[#C9A84C]">◆</span>
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-3 sm:px-4 py-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setAberto(false)}>
          <div onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[92dvh] flex flex-col overflow-hidden rounded-[24px] border border-[#C9A84C]/30 bg-[#111111] shadow-[0_0_80px_-24px_rgba(201,168,76,0.5)]">

            <div className="flex items-start justify-between gap-4 px-5 sm:px-7 pt-6 pb-4 border-b border-white/[0.08]">
              <div>
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">RL Photo.Video · Equipa</p>
                <h3 className="font-bold text-[30px] sm:text-[36px] leading-none text-white mt-1.5">Guia do dia</h3>
                <p className="text-[14px] text-white/50 mt-2">O que todos na equipa devem cumprir em cada casamento.</p>
              </div>
              <button onClick={() => setAberto(false)} aria-label="Fechar"
                className="shrink-0 w-10 h-10 rounded-full border border-white/10 bg-white/[0.04] text-white/50 hover:text-white hover:rotate-90 transition-all duration-300 flex items-center justify-center">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-4">
              {/* Material: lista para ir marcando antes de sair de casa */}
              <div className="rounded-[18px] border border-[#C9A84C]/20 bg-black/30 p-4 sm:p-5" style={{ borderLeft: '2px solid rgba(201,168,76,0.7)' }}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="flex items-center gap-2.5 text-[20px] font-semibold text-white">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] text-[#C9A84C]" style={{ background: 'rgba(201,168,76,0.12)' }}>▣</span>
                    Material antes de sair de casa
                  </p>
                  <span className="shrink-0 rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/10 px-2.5 py-0.5 text-[12px] text-[#C9A84C]">{prontos}/{MATERIAL.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {MATERIAL.map(m => {
                    const ok = feitos.includes(m)
                    return (
                      <button key={m} onClick={() => alternar(m)}
                        className="flex items-center gap-2.5 rounded-[12px] px-3 py-2 text-left hover:bg-white/[0.04] transition-colors">
                        <span className="w-5 h-5 shrink-0 rounded-full border flex items-center justify-center transition-all"
                          style={{ borderColor: ok ? '#C9A84C' : 'rgba(255,255,255,0.25)', background: ok ? '#C9A84C' : 'transparent' }}>
                          {ok && <svg viewBox="0 0 24 24" fill="none" stroke="#0b0b0b" strokeWidth="3.2" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                        </span>
                        <span className={`text-[15px] ${ok ? 'text-white/45 line-through' : 'text-white/90'}`}>{m}</span>
                      </button>
                    )
                  })}
                </div>
                {prontos === MATERIAL.length && <p className="text-[13px] text-[#C9A84C] mt-3 pl-1">Tudo confirmado. Bom trabalho!</p>}
              </div>

              {BLOCOS.map(b => (
                <div key={b.titulo} className="rounded-[18px] border border-[#C9A84C]/20 bg-black/30 p-4 sm:p-5" style={{ borderLeft: '2px solid rgba(201,168,76,0.7)' }}>
                  <p className="flex items-center gap-2.5 text-[20px] font-semibold text-white mb-3">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] text-[#C9A84C]" style={{ background: 'rgba(201,168,76,0.12)' }}>{b.icone}</span>
                    {b.titulo}
                  </p>
                  <ul className="space-y-2">
                    {b.itens.map(t => (
                      <li key={t} className="flex gap-2.5 text-[15px] leading-relaxed text-white/85">
                        <span className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-[#C9A84C]" />
                        {t}
                      </li>
                    ))}
                  </ul>
                  {b.proibido && (
                    <div className="mt-4">
                      <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]/80 mb-2">Não é permitido</p>
                      <div className="flex flex-wrap gap-2">
                        {b.proibido.map(p => (
                          <span key={p} className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/10 px-3 py-1 text-[13px] text-[#C9A84C]">
                            ✕ {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
