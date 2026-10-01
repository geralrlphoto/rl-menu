'use client'

// Secção PREVISÃO METEOROLÓGICA do briefing: previsão do IPMA para o dia do
// evento, no concelho do local. Substitui a imagem fixa que vinha do modelo.

import React, { useEffect, useState } from 'react'
import { plainText, type Block } from '../NotionRenderer'

const TIPOS: Record<number, string> = {
  1: 'Céu limpo', 2: 'Céu pouco nublado', 3: 'Céu parcialmente nublado', 4: 'Céu muito nublado',
  5: 'Céu nublado por nuvens altas', 6: 'Aguaceiros', 7: 'Aguaceiros fracos', 8: 'Aguaceiros fortes',
  9: 'Chuva', 10: 'Chuva fraca ou chuvisco', 11: 'Chuva forte', 12: 'Períodos de chuva',
  13: 'Períodos de chuva fraca', 14: 'Períodos de chuva forte', 15: 'Chuvisco', 16: 'Neblina',
  17: 'Nevoeiro ou nuvens baixas', 18: 'Neve', 19: 'Trovoada', 20: 'Aguaceiros e possível trovoada',
  21: 'Granizo', 22: 'Geada', 23: 'Chuva e possível trovoada', 24: 'Nebulosidade convectiva',
  25: 'Períodos de muito nublado', 26: 'Nevoeiro', 27: 'Céu nublado', 28: 'Aguaceiros de neve',
  29: 'Chuva e neve', 30: 'Chuva e neve',
}
const VENTO: Record<number, string> = { 1: 'Fraco', 2: 'Moderado', 3: 'Forte', 4: 'Muito forte' }

const icone = (tipo: number) => `https://www.ipma.pt/bin/icons/svg/weather/w_ic_d_${String(tipo).padStart(2, '0')}anim.svg`

type Resp =
  | { estado: 'ok'; concelho: string; dia: { tMin: number | null; tMax: number | null; tipo: number; chuva: number | null; vento: string; ventoClasse: number | null; uv: number | null }; horas: Array<{ hora: string; temp: number | null; tipo: number; chuva: number | null; vento: string }> }
  | { estado: 'cedo'; concelho: string; ate: string | null }
  | { estado: 'sem-local' | 'passado' | 'sem-dados' | 'erro' }

function dataLonga(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  const s = d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function PrevisaoIPMA({ local, data }: { local?: string | null; data?: string | null }) {
  const [r, setR] = useState<Resp | null>(null)

  useEffect(() => {
    if (!local || !data) { setR({ estado: 'sem-dados' }); return }
    fetch(`/api/previsao-ipma?local=${encodeURIComponent(local)}&data=${encodeURIComponent(data.slice(0, 10))}`)
      .then(res => res.json()).then(setR).catch(() => setR({ estado: 'erro' }))
  }, [local, data])

  const caixa = 'my-5 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-5 sm:px-7 sm:py-6'
  const fonte = <p className="mt-4 text-[9px] tracking-[0.3em] text-white/25 uppercase">Fonte: IPMA · atualiza automaticamente</p>

  if (!r) return <div className={caixa}><p className="text-xs text-white/35">A carregar a previsão…</p></div>
  if (r.estado === 'passado' || r.estado === 'sem-dados') return null

  if (r.estado !== 'ok') {
    const msg = r.estado === 'cedo'
      ? `A previsão do IPMA para ${r.concelho} fica disponível cerca de 10 dias antes do evento.`
      : r.estado === 'sem-local'
        ? 'Não foi possível identificar o concelho do local do evento.'
        : 'Previsão indisponível de momento.'
    return <div className={caixa}><p className="font-cormorant italic text-white/60" style={{ fontSize: '1.05rem' }}>{msg}</p>{fonte}</div>
  }

  const { dia, horas } = r
  return (
    <div className={caixa}>
      <p className="text-[9px] tracking-[0.35em] text-gold/60 uppercase">{r.concelho} · {dataLonga(data!)}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex items-center gap-3">
          <img src={icone(dia.tipo)} alt="" className="w-16 h-16" />
          <div>
            <p className="font-cormorant font-light text-white" style={{ fontSize: '2rem', lineHeight: 1 }}>
              <span className="text-sky-300/80">{dia.tMin ?? '–'}°</span>
              <span className="text-white/25 mx-1.5">/</span>
              <span className="text-gold">{dia.tMax ?? '–'}°</span>
            </p>
            <p className="mt-1 text-[13px] text-white/60">{TIPOS[dia.tipo] ?? ''}</p>
          </div>
        </div>
        <div className="flex gap-5 sm:ml-auto">
          {[
            ['Chuva', dia.chuva != null ? `${dia.chuva}%` : '–'],
            ['Vento', `${dia.vento}${dia.ventoClasse && VENTO[dia.ventoClasse] ? ` · ${VENTO[dia.ventoClasse]}` : ''}`],
            ['UV', dia.uv != null ? String(Math.round(dia.uv)) : '–'],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[8px] tracking-[0.35em] text-white/35 uppercase mb-1">{k}</p>
              <p className="text-[14px] text-white/85">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {horas.length > 0 && (
        <div className="mt-5 flex overflow-x-auto border-t border-white/[0.06] pt-4">
          {horas.map(h => (
            <div key={h.hora} className="flex-1 min-w-[44px] px-0.5 text-center">
              <p className="text-[10px] text-white/40">{Number(h.hora)}h</p>
              <img src={icone(h.tipo)} alt="" className="w-8 h-8 mx-auto my-1" />
              <p className="text-[13px] text-white/85">{h.temp ?? '–'}°</p>
              <p className="text-[10px] text-sky-300/60">{h.chuva != null ? `${h.chuva}%` : ''}</p>
            </div>
          ))}
        </div>
      )}
      {fonte}
    </div>
  )
}

/* Blocos do Notion com a previsão no lugar da imagem que vem a seguir ao título "PREVISÃO METEOROLÓGICA".
   `render` é o renderizador de cada portal (casamento e batizado têm o seu). */
export function BlocosComPrevisao({ blocks, local, data, render }: {
  blocks: Block[]; local?: string | null; data?: string | null; render: (blocks: Block[]) => React.ReactNode
}) {
  const idx = blocks.findIndex(b => {
    if (!['heading_1', 'heading_2', 'heading_3', 'paragraph'].includes(b.type)) return false
    const t = plainText(b[b.type]?.rich_text ?? []).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
    return t.includes('PREVISAO') && t.includes('METEOROL')
  })
  if (idx === -1) return <>{render(blocks)}</>

  // A imagem fixa do modelo (ignora parágrafos vazios pelo meio)
  let fim = idx + 1
  while (fim < blocks.length && blocks[fim].type === 'paragraph' && !plainText(blocks[fim].paragraph?.rich_text ?? []).trim()) fim++
  const resto = blocks[fim]?.type === 'image' ? blocks.slice(fim + 1) : blocks.slice(idx + 1)

  return (
    <>
      {render(blocks.slice(0, idx + 1))}
      <PrevisaoIPMA local={local} data={data} />
      {resto.length > 0 && render(resto)}
    </>
  )
}
