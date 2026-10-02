'use client'

// Briefing partilhado por link (/p/<token>): só leitura, só esta página.
// Os dados chegam já filtrados do servidor (sem notas privadas nem histórico).

import '../../portal-cliente/atmosphere/atmosphere.css'
import BriefingExtensions, { type BriefingExt } from '../../portal-cliente/[id]/BriefingExtensions'
import { PrevisaoIPMA } from '../../portal-cliente/atmosphere/PrevisaoIPMA'

type Ficha = { id: string; label: string; value: string }

export default function BriefingPartilha({ info, fichas, equipa, nomes, casal }: {
  info: BriefingExt
  fichas: Record<string, Ficha[]>
  equipa: Array<{ role: string; name: string }>
  nomes: { noivo?: string; noiva?: string }
  casal: { cliente: string; data_evento: string | null; local: string } | null
}) {
  const tituloFicha = (k: string) => k === 'NOIVO' ? (nomes.noivo || 'Noivo') : k === 'NOIVA' ? (nomes.noiva || 'Noiva') : k
  const fichasVisiveis = Object.entries(fichas).filter(([, campos]) => campos.some(c => (c.value ?? '').trim()))

  const equipaNode = equipa.length > 0 && (
    <div className="mb-6 rounded-2xl border border-white/[0.08] px-5 py-4" style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.45), rgba(11,11,11,0.55))' }}>
      <p className="text-[10px] tracking-[0.4em] text-gold/70 uppercase mb-3">Equipa atribuída</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {equipa.map((m, i) => (
          <div key={i} className="px-3.5 py-3 rounded-xl bg-white/[0.025] border border-white/[0.06]">
            <p className="text-[9px] tracking-[0.3em] text-gold/60 uppercase">{m.role}</p>
            <p className="text-[13px] text-white/90 mt-0.5">{m.name}</p>
          </div>
        ))}
      </div>
    </div>
  )

  const fichasNode = fichasVisiveis.length > 0 && (
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fichasVisiveis.map(([k, campos]) => (
        <div key={k} className="rounded-2xl border border-white/[0.08] px-5 py-4 bg-white/[0.02]">
          <p className="text-[10px] tracking-[0.35em] text-gold/65 uppercase mb-3">{tituloFicha(k)}</p>
          <dl className="space-y-2">
            {campos.filter(c => (c.value ?? '').trim()).map(c => (
              <div key={c.id}>
                <dt className="text-[9px] tracking-[0.25em] text-white/35 uppercase">{c.label}</dt>
                <dd className="text-[13px] text-white/85 break-words">{c.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )

  return (
    <div className="portal-atmosphere min-h-screen" style={{ background: '#0a0806' }}>
      <main className="max-w-[920px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <p className="text-[9px] tracking-[0.5em] text-white/30 uppercase">RL Photo.Video</p>
        <h1 className="font-cormorant font-light uppercase text-gold mt-2" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', letterSpacing: '0.16em' }}>
          Briefing
        </h1>
        {casal?.cliente && <p className="text-white/60 mt-1">{casal.cliente}</p>}

        {casal?.local && casal.data_evento && (
          <>
            <h2 className="font-cormorant font-light uppercase text-white mt-10 mb-2" style={{ fontSize: '1.5rem', letterSpacing: '0.12em' }}>
              Previsão meteorológica
            </h2>
            <PrevisaoIPMA local={casal.local} data={casal.data_evento} />
          </>
        )}

        <div className="mt-8">
          <BriefingExtensions
            info={info}
            isAdmin={false}
            onSave={() => {}}
            pageTitle="Briefing"
            dataEvento={casal?.data_evento ?? null}
            local={casal?.local ?? null}
            nomes={nomes}
            equipaNode={equipaNode}
            fichasNode={fichasNode}
            partilhada
          />
        </div>
      </main>
    </div>
  )
}
