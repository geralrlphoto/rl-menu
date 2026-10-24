import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

type Props = { params: Promise<{ ref: string }> }

// Cartão partilhável "o teu portal está pronto". O fundo e as letras (rlp) vêm do layout.
export default async function CardPage({ params }: Props) {
  const { ref } = await params
  const projeto = getProjeto(ref)
  if (!projeto) notFound()

  return (
    <main className="rlp relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-14">
      <div className="w-full max-w-[420px]">

        <p className="rlp-m traco text-[10px] text-[#5a8bff] mb-5 text-center">Portal do cliente</p>

        <div className="rounded-2xl border border-white/[0.1] bg-[#00141f]/70 overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
          <div className="h-1 bg-[#2e6cf6]" />

          {/* Logo */}
          <div className="flex justify-center pt-10 pb-7">
            <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="h-12 w-auto" />
          </div>

          {/* Projeto */}
          <div className="px-6 sm:px-9 text-center mb-8">
            <span className="rlp-m inline-block rounded-full bg-[#2e6cf6]/20 px-3 py-1 text-[9px] tracking-[0.2em] text-[#a9c1ff] mb-4">
              Portal criado
            </span>
            {projeto.tipo && <p className="rlp-m text-[10px] text-[#7c8893] mb-2">{projeto.tipo}</p>}
            <h1 className="rlp-t text-[clamp(28px,7vw,38px)] leading-tight text-white break-words">
              {projeto.nome}
            </h1>
            <p className="mt-1 text-[14px] text-[#a9c1ff] mb-6">{projeto.cliente}</p>

            <div className="rounded-xl bg-[#0c2236]/70 px-5 py-4 text-left">
              <p className="text-[15px] text-white mb-1">O teu portal de projeto está pronto.</p>
              <p className="text-[14px] text-white/60 leading-relaxed">
                Aqui acompanhas em tempo real as fases, os prazos, os pagamentos e as entregas do teu projeto.
              </p>
            </div>
          </div>

          {/* Botão */}
          <div className="px-6 sm:px-9 pb-8">
            <Link
              href={`/portal-media/${projeto.ref}`}
              className="rlp-m block w-full rounded-md bg-[#2e6cf6] hover:bg-[#5a8bff] py-4 text-center text-[11px] tracking-[0.25em] text-white transition-colors"
            >
              Aceder ao portal →
            </Link>
            <p className="mt-3 text-center text-[11px] text-[#7c8893] break-all" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              www.rlprod.pt/portal-media/{projeto.ref.toLowerCase()}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="rlp-m text-[9px] text-white/35">RL PROD · Photo &amp; Video</p>
          <a href="https://www.rlprod.pt" target="_blank" rel="noopener noreferrer"
            className="rlp-m text-[9px] tracking-[0.15em] text-white/35 hover:text-white transition-colors">www.rlprod.pt</a>
        </div>
      </div>
    </main>
  )
}
