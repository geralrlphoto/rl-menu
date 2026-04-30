import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

type Props = { params: Promise<{ ref: string }> }

export default async function BriefingPage({ params }: Props) {
  const { ref } = await params
  const projeto = getProjeto(ref)
  if (!projeto) notFound()

  return (
    <main className="min-h-screen bg-[#050507] relative">
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-10">

        <Link href={`/portal-media/${ref}`}
          className="inline-flex items-center gap-2 text-sm tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        <div className="mb-10">
          <p className="text-xs tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · {projeto.nome}</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Briefing</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-emerald-400/40" />
            <span className="text-xs tracking-[0.4em] text-emerald-400/60 uppercase">Concluído</span>
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { label: 'Objetivos do Projeto', desc: 'Vídeo institucional para comunicação digital e presença online da marca Oleobio.' },
            { label: 'Tom e Estilo',          desc: 'Clean, moderno, profissional. Transmitir confiança e qualidade do produto.' },
            { label: 'Público-alvo',          desc: 'Empresas B2B no sector alimentar, retalhistas e distribuidores.' },
            { label: 'Referências Visuais',   desc: '3 referências partilhadas e aprovadas em reunião de 10 Mai 2025.' },
            { label: 'Assets da Marca',       desc: 'Logótipo, guia de cores e fontes entregues em 12 Mai 2025.' },
          ].map((item, i) => (
            <div key={i} className="border border-emerald-400/12 bg-emerald-400/[0.02] px-6 py-5">
              <div className="flex items-start gap-4">
                <span className="text-sm font-mono text-white/15 shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className="text-sm tracking-[0.25em] text-white/55 uppercase font-medium mb-1.5">{item.label}</p>
                  <p className="text-sm text-white/30 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {projeto.briefingUrl && (
          <a href={projeto.briefingUrl} target="_blank" rel="noopener noreferrer"
            className="mt-6 flex items-center justify-between border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] px-6 py-4 transition-colors group">
            <span className="text-sm tracking-[0.3em] text-white/40 uppercase">Ver Briefing Completo</span>
            <span className="text-white/20 group-hover:text-white/50 transition-colors">↗</span>
          </a>
        )}
      </div>
    </main>
  )
}
