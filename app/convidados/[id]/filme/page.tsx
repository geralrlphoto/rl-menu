// Página dos vídeos do casamento para os convidados (link partilhado pelos noivos).
// Endereço com o id do portal, que não se adivinha. Só mostra o filme do casamento, depois de entregue.
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import VideosConvidados, { type VideoConvidado } from './VideosConvidados'
import CaixasConvidados from './CaixasConvidados'

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
  // Aos convidados só se mostra o filme do casamento (os outros vídeos ficam no portal dos noivos)
  const lista: Array<[string, string, string, unknown]> = [
    ['filme', 'Wedding Film', 'O filme do casamento', s.wedding_film_url],
  ]
  const videos: VideoConvidado[] = lista
    .filter(([, , , url]) => typeof url === 'string' && /^https?:\/\//.test(url))
    .map(([key, titulo, legenda, url]) => ({ key, titulo, legenda, url: url as string }))
  return {
    nomes: [a, b].filter(Boolean).join(' & '),
    data: String(data.data ?? s.data ?? '').slice(0, 10),
    foto: String(s.heroImageUrl ?? '') || null,
    videos,
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = await carregar((await params).id)
  return { title: c ? `O filme · ${c.nomes}` : 'O filme', robots: { index: false, follow: false } }
}

export default async function FilmeConvidadosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await carregar(id)
  if (!c) notFound()

  const dataLonga = /^\d{4}-\d{2}-\d{2}$/.test(c.data)
    ? new Date(c.data + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

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
        <div className="relative mx-auto max-w-3xl px-5 pt-20 pb-14 sm:pt-28 sm:pb-16 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/portal-noivos/logo-gold.png" alt="RL Photo Video · Wedding Moments" className="mx-auto mb-8 h-28 w-auto sm:h-32" />
          <p className="font-cond text-[11px] font-medium tracking-[0.25em] uppercase" style={{ color: G }}>O filme do casamento</p>
          <h1 className="mt-4 font-cond font-light text-[46px] sm:text-[72px] leading-[1.02]">
            {c.nomes.split(' & ').map((n, i) => (
              <span key={n}>{i > 0 && <span style={{ color: G }}> &amp; </span>}{n}</span>
            ))}
          </h1>
          {dataLonga && <p className="mt-3 font-cond text-[17px] tracking-[0.04em] text-white/60">{dataLonga}</p>}
          <p className="mx-auto mt-6 max-w-[46ch] font-cond text-[16px] leading-relaxed text-white/55">
            Obrigado por fazerem parte deste dia. Carreguem no play e revivam-no connosco.
          </p>
        </div>
      </section>

      {/* ── vídeos ── */}
      <section className="mx-auto max-w-4xl px-5 pb-12">
        {c.videos.length > 0 ? (
          <VideosConvidados videos={c.videos} capaFallback={c.foto} />
        ) : (
          <div className="rounded-[22px] border border-dashed border-[#d8be93]/25 px-6 py-14 text-center">
            <h2 className="font-cond font-semibold text-[24px] text-white/80">O filme está quase pronto</h2>
            <p className="mt-2 font-cond text-[15px] text-white/45">Assim que estiver disponível, aparece aqui.</p>
          </div>
        )}
      </section>

      {/* Comentário ao filme e indicação de próximos noivos (depois de o filme estar entregue) */}
      {c.videos.length > 0 && <CaixasConvidados id={id} />}

      <footer className="pb-14 text-center">
        <a href="https://www.rlphotovideo.pt" className="font-cond text-[12px] tracking-[0.25em] uppercase text-white/35 hover:text-[#d8be93]">www.rlphotovideo.pt</a>
      </footer>
    </main>
  )
}
