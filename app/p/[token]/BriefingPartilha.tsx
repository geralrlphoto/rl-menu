'use client'

// Briefing partilhado por link (/p/<token>): só leitura, só esta página.
// Os dados chegam já filtrados do servidor (com as notas internas, sem histórico).
// Desenho igual às páginas novas do menu: capa de cinema, letra condensada e só dourado suave.
// As secções vêm do BriefingExtensions do portal; o estilo novo aplica-se só aqui (classe .partilha-nova).

import '../../portal-cliente/atmosphere/atmosphere.css'
import BriefingExtensions, { type BriefingExt } from '../../portal-cliente/[id]/BriefingExtensions'
import { PrevisaoIPMA } from '../../portal-cliente/atmosphere/PrevisaoIPMA'

type Ficha = { id: string; label: string; value: string }

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
function dataLonga(iso?: string | null) {
  if (!iso) return ''
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d} de ${MESES[m - 1]} de ${a}`
}

// Estilo novo, só dentro desta página (o portal dos noivos não é afetado)
const CSS = `
.partilha-nova, .partilha-nova * { font-family: 'Roboto Condensed', sans-serif !important; }
.partilha-nova h1.capa-titulo { font-weight: 700 !important; letter-spacing: -0.01em !important; }
.partilha-nova .briefing-premium section {
  border-radius: 22px !important; border-color: rgba(201,168,76,0.18) !important;
  background: rgba(17,17,17,0.92) !important; box-shadow: 0 0 44px -26px rgba(201,168,76,0.55) !important;
  border-left: 2px solid rgba(201,168,76,0.6) !important;
}
.partilha-nova .briefing-premium section > header { border-color: rgba(255,255,255,0.06) !important; }
.partilha-nova .briefing-premium section > header h3 { font-size: 20px !important; font-weight: 600 !important; letter-spacing: 0 !important; }
.partilha-nova .briefing-premium section > header span:first-child { border-radius: 9999px !important; }
.partilha-nova .briefing-premium [class*="rounded-xl"], .partilha-nova .briefing-premium [class*="rounded-lg"] { border-radius: 14px !important; }
/* Só dourado: os acentos de outras cores passam a dourado suave */
.partilha-nova [class*="text-rose"], .partilha-nova [class*="text-blue"], .partilha-nova [class*="text-emerald"],
.partilha-nova [class*="text-amber"], .partilha-nova [class*="text-sky"], .partilha-nova [class*="text-green"],
.partilha-nova [class*="text-red"], .partilha-nova [class*="text-violet"], .partilha-nova [class*="text-purple"] { color: #C9A84C !important; }
.partilha-nova [class*="border-rose"], .partilha-nova [class*="border-blue"], .partilha-nova [class*="border-emerald"],
.partilha-nova [class*="border-amber"], .partilha-nova [class*="border-sky"], .partilha-nova [class*="border-green"],
.partilha-nova [class*="border-red"], .partilha-nova [class*="border-violet"] { border-color: rgba(201,168,76,0.35) !important; }
.partilha-nova [class*="bg-rose"], .partilha-nova [class*="bg-blue"], .partilha-nova [class*="bg-emerald"],
.partilha-nova [class*="bg-amber"], .partilha-nova [class*="bg-sky"], .partilha-nova [class*="bg-green"],
.partilha-nova [class*="bg-red"], .partilha-nova [class*="bg-violet"] { background-color: rgba(201,168,76,0.1) !important; }
/* Texto corrido (notas) em branco, para ler bem; o dourado fica para os títulos */
.partilha-nova .briefing-premium .whitespace-pre-wrap { color: rgba(255,255,255,0.88) !important; }
@media print { .partilha-nova .nao-imprimir { display: none !important; } }
`

export default function BriefingPartilha({ info, fichas, equipa, nomes, casal, capa = '' }: {
  info: BriefingExt
  fichas: Record<string, Ficha[]>
  equipa: Array<{ role: string; name: string }>
  nomes: { noivo?: string; noiva?: string }
  casal: { cliente: string; data_evento: string | null; local: string } | null
  capa?: string
}) {
  const tituloFicha = (k: string) => k === 'NOIVO' ? (nomes.noivo || 'Noivo') : k === 'NOIVA' ? (nomes.noiva || 'Noiva') : k
  const fichasVisiveis = Object.entries(fichas).filter(([, campos]) => campos.some(c => (c.value ?? '').trim()))

  const equipaNode = equipa.length > 0 && (
    <div className="rounded-[22px] border border-[#C9A84C]/20 bg-[#111111]/90 px-5 py-5" style={{ borderLeft: '2px solid rgba(201,168,76,0.6)' }}>
      <p className="text-[11px] font-medium tracking-[0.2em] text-[#C9A84C] uppercase mb-3">Equipa atribuída</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {equipa.map((m, i) => (
          <div key={i} className="flex items-center gap-3 px-3.5 py-3 rounded-[14px] bg-white/[0.03] border border-white/[0.07]">
            <span className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[14px] font-semibold text-[#C9A84C]" style={{ background: 'rgba(201,168,76,0.12)' }}>
              {m.name.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] tracking-[0.12em] text-[#C9A84C]/75 uppercase">{m.role}</p>
              <p className="text-[16px] font-semibold text-white truncate">{m.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const fichasNode = fichasVisiveis.length > 0 && (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fichasVisiveis.map(([k, campos]) => (
        <div key={k} className="rounded-[22px] border border-[#C9A84C]/20 bg-[#111111]/90 px-5 py-4" style={{ borderLeft: '2px solid rgba(201,168,76,0.6)' }}>
          <p className="text-[11px] font-medium tracking-[0.2em] text-[#C9A84C] uppercase mb-3">{tituloFicha(k)}</p>
          <dl className="space-y-2.5">
            {campos.filter(c => (c.value ?? '').trim()).map(c => (
              <div key={c.id}>
                <dt className="text-[11px] tracking-[0.12em] text-white/40 uppercase">{c.label}</dt>
                <dd className="text-[15px] text-white/90 break-words">{c.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )

  const dataTxt = dataLonga(casal?.data_evento)

  return (
    <div className="portal-atmosphere partilha-nova min-h-screen overflow-x-clip" style={{ background: '#070707' }}>
      <style>{CSS}</style>

      {/* ── Capa de cinema ── */}
      <section className="relative min-h-[460px] lg:min-h-[64vh] flex flex-col overflow-hidden">
        {capa && (
          <div className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capa} alt="" className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 lg:opacity-55" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 40%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
          </div>
        )}
        <div className="absolute top-0 bottom-0 left-5 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
          Apenas equipa · Documento interno
        </p>

        <div className="relative flex-1 flex flex-col pl-10 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-8 pb-10 lg:pb-14">
          <p className="flex items-center gap-2.5 text-[12px] tracking-[0.25em] uppercase text-white/55">
            <span className="w-2 h-2 rounded-full bg-[#C9A84C] shadow-[0_0_10px_#C9A84C]" />
            Briefing para a equipa
          </p>

          <div className="mt-auto pt-20 min-w-0">
            <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
            <h1 className="capa-titulo font-bold uppercase text-white leading-[0.88] text-[56px] sm:text-[110px] lg:text-[130px] mt-2">Briefing</h1>
            {casal?.cliente && (
              <div className="flex items-center gap-4 mt-5">
                <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
                <p className="text-[15px] sm:text-[19px] tracking-[0.18em] uppercase text-white/80">{casal.cliente}</p>
              </div>
            )}
            {(dataTxt || casal?.local) && (
              <div className="flex flex-wrap gap-2 mt-5">
                {dataTxt && <span className="rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-4 py-1.5 text-[14px] text-[#C9A84C]">{dataTxt}</span>}
                {casal?.local && <span className="rounded-full border border-white/15 bg-black/30 px-4 py-1.5 text-[14px] text-white/75 max-w-full truncate">{casal.local}</span>}
              </div>
            )}
            <div className="nao-imprimir flex flex-wrap items-center gap-3 mt-7">
              <button onClick={() => window.print()}
                className="inline-flex items-center gap-2 border border-[#C9A84C]/70 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/30 px-6 py-3 text-[14px] font-semibold tracking-[0.18em] uppercase text-white transition-all shadow-[0_0_34px_-12px_rgba(201,168,76,0.7)]">
                Guardar PDF <span className="text-[#C9A84C]">↓</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 pt-4 pb-14">
        {/* Previsão do tempo: só aparece (com o título) quando há previsão para mostrar */}
        {casal?.local && casal.data_evento && (
          <PrevisaoIPMA local={casal.local} data={casal.data_evento} ocultarSemPrevisao
            titulo={
              <div className="mt-4 mb-1">
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">No dia</p>
                <h2 className="font-semibold text-white text-[26px] leading-tight mt-1">Previsão meteorológica</h2>
              </div>
            } />
        )}

        <div className="mt-6">
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
