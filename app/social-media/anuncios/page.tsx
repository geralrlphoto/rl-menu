import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import AnunciosClient, { type Anuncio } from './AnunciosClient'

/* ============================================================
   /social-media/anuncios — anúncios pagos do Instagram/Facebook.
   Os números vêm da tabela social_anuncios (atualizados à mão
   aqui, ou pelo Claude depois de ler as Ferramentas para
   anúncios do Instagram).
   ============================================================ */

export const dynamic = 'force-dynamic'

export default async function AnunciosPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase.from('social_anuncios').select('*')
    .order('fim', { ascending: false, nullsFirst: true })

  return (
    <main className="min-h-screen overflow-x-clip font-cond bg-[#070707] text-white">
      <section className="relative border-b border-white/[0.07]">
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <div className="relative pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-14 pb-10">
          <Link href="/social-media" className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ Social Media</Link>
          <p className="mt-10 text-[13px] sm:text-[16px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">Social Media</p>
          <h1 className="font-bold uppercase leading-[0.9] text-[52px] sm:text-[90px] mt-1">Anúncios</h1>
          <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-4 max-w-2xl">
            Tudo o que se pagou no Instagram e no Facebook, quanto custou e o que trouxe. Serve para decidir o próximo anúncio pelos números e não pelo palpite.
          </p>
        </div>
      </section>

      <AnunciosClient inicial={(data ?? []) as Anuncio[]} />
    </main>
  )
}
