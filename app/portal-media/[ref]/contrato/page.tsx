import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

type Props = { params: Promise<{ ref: string }> }

export default async function ContratoPage({ params }: Props) {
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
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Contrato & CPS</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {/* Contrato */}
          <div className={`border px-6 py-5 flex items-center justify-between
            ${projeto.contratoUrl ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-white/[0.07] bg-white/[0.02]'}`}>
            <div>
              <p className="text-base tracking-[0.25em] text-white/60 uppercase font-medium">Contrato de Prestação de Serviços</p>
              <p className={`text-xs tracking-[0.3em] uppercase mt-1 ${projeto.contratoUrl ? 'text-emerald-400/60' : 'text-white/20'}`}>
                {projeto.contratoUrl ? 'Assinado' : 'Pendente de envio'}
              </p>
            </div>
            {projeto.contratoUrl ? (
              <a href={projeto.contratoUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm tracking-[0.3em] text-white/35 hover:text-white/60 uppercase transition-colors">Ver →</a>
            ) : (
              <span className="text-sm tracking-[0.3em] text-white/15 uppercase">Em breve</span>
            )}
          </div>

          {/* CPS form */}
          <div className="border border-white/[0.07] bg-white/[0.02] px-6 py-6">
            <p className="text-xs tracking-[0.4em] text-white/25 uppercase mb-2">Dados para CPS</p>
            <p className="text-base text-white/30 leading-relaxed mb-4">
              Para emissão do contrato precisamos dos dados fiscais da tua empresa. Preenche o formulário abaixo.
            </p>
            <button
              className="border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] px-5 py-2.5
                         text-sm tracking-[0.4em] text-white/45 hover:text-white/70 uppercase transition-all">
              Preencher Formulário →
            </button>
          </div>
        </div>

        <div className="border border-white/[0.05] bg-white/[0.01] px-5 py-4">
          <p className="text-base tracking-[0.2em] text-white/20 leading-relaxed">
            Dúvidas sobre o contrato? Contacta <span className="text-white/35">rl@rlmedia.pt</span>
          </p>
        </div>
      </div>
    </main>
  )
}
