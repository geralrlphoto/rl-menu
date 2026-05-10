import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import MagazineViewer from '@/app/secao/[id]/MagazineViewer'

// Secção Supabase exclusiva para a Revista de Batizados (independente de /secao e /apresentacao)
const REVISTA_SECTION_ID = '4eb9eaa9-bebf-4c94-9b64-a8c2f2d39f61'

export const revalidate = 30

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('rl_auth')?.value === process.env.AUTH_SECRET

  const { data: images } = await supabase
    .from('section_images')
    .select('*')
    .eq('section_id', REVISTA_SECTION_ID)
    .order('order_index')

  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#0a0a0a' }}>

      {/* Fundo igual à Proposta Criativa */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'linear-gradient(160deg, #0e0b07 0%, #1a1206 30%, #0e0b07 70%, #060504 100%)',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 75% 65% at 50% 48%, rgba(201,168,76,0.18) 0%, rgba(160,120,40,0.07) 45%, transparent 70%)',
      }} />

      {/* Topo */}
      <div className="relative z-10 py-3 px-6 flex items-center justify-between border-b border-white/[0.04]">
        <Link
          href={`/b/${token}`}
          className="text-[9px] tracking-[0.4em] text-white/25 hover:text-gold/60 uppercase transition-colors"
        >
          ← Voltar
        </Link>
        <span className="text-[8px] tracking-[0.7em] text-white/18 uppercase">
          Revista · RL Photo.Video
        </span>
        <div className="w-16" />
      </div>

      {/* MagazineViewer */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-4 py-8 w-full max-w-5xl mx-auto">
        <MagazineViewer
          images={images ?? []}
          sectionId={REVISTA_SECTION_ID}
          isAdmin={isAdmin}
        />
      </div>

      {/* Rodapé */}
      <div className="relative z-10 py-5 border-t border-white/[0.04] text-center">
        <p className="text-[7px] tracking-[0.55em] text-white/12 uppercase">
          RL PHOTO.VIDEO · Photography &amp; Video
        </p>
      </div>
    </main>
  )
}
