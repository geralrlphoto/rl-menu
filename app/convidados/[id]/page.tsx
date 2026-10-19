// Página dos convidados: ver as fotografias do casamento (galeria no Wfolio, que
// gasta o tráfego deles e não o nosso) e adquirir fotografias (formulário de
// compra já com o casamento). O endereço usa o id do portal, que não se adivinha,
// para ninguém chegar às galerias de outros casais a experimentar referências.
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const G = '#d8be93'

const primeiro = (n?: string | null) => {
  const w = String(n ?? '').trim().split(/\s+/)[0] ?? ''
  return w ? w.charAt(0).toLocaleUpperCase('pt-PT') + w.slice(1).toLocaleLowerCase('pt-PT') : ''
}

async function carregar(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await sb.from('portais').select('noiva, noivo, data, settings').eq('id', id).maybeSingle()
  if (!data) return null
  const s: any = data.settings ?? {}
  const a = primeiro(data.noiva ?? s.noiva), b = primeiro(data.noivo ?? s.noivo)
  return {
    nomes: [a, b].filter(Boolean).join(' & '),
    nomesForm: [a, b].filter(Boolean).join(' e '),
    data: String(data.data ?? s.data ?? '').slice(0, 10),
    galeria: String(s.galerias_url ?? '') || null,
    foto: String(s.heroImageUrl ?? '') || null,
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = await carregar((await params).id)
  return { title: c ? `Fotografias · ${c.nomes}` : 'Fotografias', robots: { index: false, follow: false } }
}

export default async function ConvidadosPage({ params }: { params: Promise<{ id: string }> }) {
  const c = await carregar((await params).id)
  if (!c) notFound()

  const dataLonga = /^\d{4}-\d{2}-\d{2}$/.test(c.data)
    ? new Date(c.data + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  const comprar = `/adquirir-fotografias?noivos=${encodeURIComponent(c.nomesForm)}${c.data ? `&data=${c.data}` : ''}`

  const cartao = 'group relative block overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#141414] transition-all duration-300 hover:-translate-y-1 hover:border-[#d8be93]/45 hover:shadow-[0_0_40px_-18px_rgba(216,190,147,0.6)]'

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      {/* ── topo ── */}
      <section className="relative overflow-hidden">
        {c.foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.foto} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_35%] grayscale opacity-30" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0b0b0b 0%, rgba(11,11,11,0.45) 25%, rgba(11,11,11,0.6) 70%, #0b0b0b 100%)' }} />
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, #000 25%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, #000 25%, transparent 75%)',
        }} />
        <div className="relative mx-auto max-w-3xl px-5 pt-20 pb-16 sm:pt-28 sm:pb-20 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/portal-noivos/mono-gold.png" alt="RL Photo Video" className="mx-auto mb-8 h-12 w-auto opacity-90" />
          <p className="font-cond text-[11px] font-medium tracking-[0.25em] uppercase" style={{ color: G }}>As fotografias do casamento</p>
          <h1 className="mt-4 font-cond font-light text-[46px] sm:text-[72px] leading-[1.02]">
            {c.nomes.split(' & ').map((n, i) => (
              <span key={n}>{i > 0 && <span style={{ color: G }}> &amp; </span>}{n}</span>
            ))}
          </h1>
          {dataLonga && <p className="mt-3 font-cond text-[17px] tracking-[0.04em] text-white/60">{dataLonga}</p>}
          <p className="mx-auto mt-6 max-w-[46ch] font-cond text-[16px] leading-relaxed text-white/55">
            Obrigado por fazerem parte deste dia. Aqui podem ver as fotografias e adquirir as vossas preferidas, em digital ou em papel.
          </p>
        </div>
      </section>

      {/* ── os dois caminhos ── */}
      <section className="mx-auto grid max-w-4xl gap-5 px-5 pb-12 sm:grid-cols-2">
        {c.galeria ? (
          <a href={c.galeria} target="_blank" rel="noopener noreferrer" className={cartao} style={{ borderLeft: '2px solid rgba(216,190,147,0.6)' }}>
            {c.foto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.foto} alt="" className="h-48 w-full object-cover grayscale-[60%] opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 group-hover:opacity-100" />
            )}
            <div className="p-6">
              <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase" style={{ color: G }}>01 · Ver</p>
              <h2 className="mt-2 font-cond font-semibold text-[26px]">Ver as fotografias</h2>
              <p className="mt-2 font-cond text-[15px] leading-relaxed text-white/55">Abram a galeria e anotem o número das fotografias de que mais gostam.</p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#d8be93]/60 bg-[#d8be93]/15 px-5 py-2 font-cond font-semibold text-[14px] transition-all group-hover:bg-[#d8be93]/30" style={{ color: G }}>
                Abrir a galeria →
              </span>
            </div>
          </a>
        ) : (
          <div className="rounded-[22px] border border-dashed border-[#d8be93]/25 p-6 text-center">
            <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase" style={{ color: G }}>01 · Ver</p>
            <h2 className="mt-2 font-cond font-semibold text-[24px] text-white/80">A galeria está quase pronta</h2>
            <p className="mt-2 font-cond text-[15px] text-white/45">Assim que estiver disponível, aparece aqui o botão para a abrir.</p>
          </div>
        )}

        <a href={comprar} className={cartao} style={{ borderLeft: '2px solid rgba(216,190,147,0.6)' }}>
          <div className="p-6">
            <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase" style={{ color: G }}>02 · Adquirir</p>
            <h2 className="mt-2 font-cond font-semibold text-[26px]">Adquirir fotografias</h2>
            <p className="mt-2 font-cond text-[15px] leading-relaxed text-white/55">Indiquem os números das fotografias, escolham o formato e enviem o pedido. Recebem um ticket por email.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[16px] border border-white/[0.08] bg-[#111111] p-3">
                <p className="font-cond text-[11px] text-white/45">Digital</p>
                <p className="font-cond font-semibold text-[17px]" style={{ color: G }}>15 dias úteis</p>
              </div>
              <div className="rounded-[16px] border border-white/[0.08] bg-[#111111] p-3">
                <p className="font-cond text-[11px] text-white/45">Papel</p>
                <p className="font-cond font-semibold text-[17px]" style={{ color: G }}>30 dias úteis</p>
                <p className="font-cond text-[10.5px] text-white/35">carta registada</p>
              </div>
            </div>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#d8be93]/60 bg-[#d8be93]/15 px-5 py-2 font-cond font-semibold text-[14px] transition-all group-hover:bg-[#d8be93]/30" style={{ color: G }}>
              Adquirir fotografias →
            </span>
          </div>
        </a>
      </section>

      <footer className="pb-14 text-center">
        <a href="https://www.rlphotovideo.pt" className="font-cond text-[12px] tracking-[0.25em] uppercase text-white/35 hover:text-[#d8be93]">www.rlphotovideo.pt</a>
      </footer>
    </main>
  )
}
