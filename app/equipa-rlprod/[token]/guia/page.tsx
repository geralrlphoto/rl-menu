import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import EstiloRLProd from '@/app/media/_components/EstiloRLProd'
import { FUNDO } from '@/app/media/_lib/estilo'
import { temAcessoStaff } from '../../_acesso'
import EntradaStaff from '../../EntradaStaff'
import { VALORES, SECOES, NUNCA, CHECKLISTS } from '../../guia'

// Guia de boas práticas da RL PROD no portal da equipa (o texto está em ../../guia.ts)

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Guia da equipa · RL PROD', robots: { index: false, follow: false } }

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const CARD = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/75 backdrop-blur-sm'

export default async function GuiaEquipa({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!/^[0-9a-f]{32}$/.test(token)) notFound()
  const { data: m } = await supabase.from('media_equipa').select('id, nome, ativo, senha').eq('acesso_token', token).maybeSingle()
  if (!m || !m.ativo) notFound()
  const primeiro = m.nome.trim().split(/\s+/)[0]
  const nome = primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase()
  if (!(await temAcessoStaff(m, token))) return <EntradaStaff token={token} nome={nome} />

  return (
    <main className="rlp min-h-screen relative text-white">
      <EstiloRLProd />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 pt-8 pb-16">
        <Link href={`/equipa-rlprod/${token}`} className="rlp-m inline-flex items-center gap-2 text-[11px] text-white/45 hover:text-white">‹ O meu portal</Link>

        <header className="mt-8">
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">RL Prod · Guia da equipa</p>
          <h1 className="rlp-t mt-3 text-[48px] sm:text-[76px] leading-[0.88]">Boas práticas<span className="text-[#5a8bff]">.</span></h1>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-white/70">
            {nome}, este guia reúne as regras e a forma de estar da RL PROD, do primeiro contacto com o projeto à entrega do material.
            Lê-o com calma antes do teu primeiro trabalho e volta a ele sempre que precisares.
          </p>
        </header>

        {/* índice */}
        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Índice do guia">
          {[...SECOES.map(s => ({ id: s.id, t: s.titulo })), { id: 'nunca', t: 'O que nunca fazer' }, { id: 'checklist', t: 'Checklist' }].map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-full border border-white/[0.14] bg-[#00141f]/60 px-3.5 py-1.5 text-[12.5px] text-white/70 hover:border-[#2e6cf6] hover:text-white">
              <span className="text-[#5a8bff] mr-1.5">{String(i + 1).padStart(2, '0')}</span>{s.t}
            </a>
          ))}
        </nav>

        {/* valores */}
        <section className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {VALORES.map(v => (
            <div key={v.t} className={`${CARD} p-4`}>
              <p className="rlp-t text-[20px] text-[#a9c1ff]">{v.t}</p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-white/60">{v.d}</p>
            </div>
          ))}
        </section>

        {/* secções */}
        {SECOES.map((s, i) => (
          <section key={s.id} id={s.id} className="mt-14 scroll-mt-6">
            <div className="flex items-baseline gap-3 border-b border-white/[0.08] pb-3">
              <span className="rlp-m text-[11px] text-[#5a8bff]">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="rlp-t text-[30px] sm:text-[36px] leading-none">{s.titulo}</h2>
            </div>
            {s.intro && <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-white/60">{s.intro}</p>}
            <ol className={`${CARD} mt-4 divide-y divide-white/[0.07]`}>
              {s.regras.map((r, n) => (
                <li key={n} className="flex gap-4 px-5 py-4">
                  <span className="rlp-t mt-0.5 w-7 h-7 shrink-0 rounded-full border border-[#2e6cf6]/50 flex items-center justify-center text-[13px] text-[#a9c1ff]">{n + 1}</span>
                  <span>
                    <span className="block text-[15px] text-white">{r.t}</span>
                    {r.d && <span className="mt-1 block text-[13.5px] leading-relaxed text-white/60">{r.d}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}

        {/* nunca */}
        <section id="nunca" className="mt-14 scroll-mt-6">
          <div className="flex items-baseline gap-3 border-b border-white/[0.08] pb-3">
            <span className="rlp-m text-[11px] text-[#ff4747]">{String(SECOES.length + 1).padStart(2, '0')}</span>
            <h2 className="rlp-t text-[30px] sm:text-[36px] leading-none">O que nunca fazer</h2>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {NUNCA.map(n => (
              <li key={n} className="flex items-center gap-3 rounded-xl border border-[#ff4747]/35 bg-[#ff4747]/[0.06] px-4 py-3 text-[14px] text-white/85">
                <span className="w-6 h-6 shrink-0 rounded-full bg-[#ff4747]/20 flex items-center justify-center text-[12px] text-[#ff8a8a]">✕</span>
                {n}
              </li>
            ))}
          </ul>
        </section>

        {/* checklists */}
        <section id="checklist" className="mt-14 scroll-mt-6">
          <div className="flex items-baseline gap-3 border-b border-white/[0.08] pb-3">
            <span className="rlp-m text-[11px] text-[#5a8bff]">{String(SECOES.length + 2).padStart(2, '0')}</span>
            <h2 className="rlp-t text-[30px] sm:text-[36px] leading-none">Checklist rápida</h2>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {CHECKLISTS.map(c => (
              <div key={c.titulo} className={`${CARD} p-5`}>
                <p className="rlp-t text-[21px] leading-none">{c.titulo}</p>
                <ul className="mt-3 grid gap-2">
                  {c.itens.map(i => (
                    <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-white/75">
                      <span className="mt-0.5 w-4 h-4 shrink-0 rounded border border-[#2e6cf6]/60" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-14 text-center text-[13.5px] text-white/50">
          Obrigado por fazeres parte da equipa. Qualquer dúvida sobre estas regras, fala com a RL PROD.
        </p>
        <footer className="mt-8 border-t border-white/[0.07] pt-6 text-center">
          <p className="rlp-t text-[18px]">More than a product, <span className="text-[#5a8bff]">an experience.</span></p>
        </footer>
      </div>
    </main>
  )
}
