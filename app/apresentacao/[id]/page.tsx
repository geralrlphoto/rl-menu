import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import MagazineViewer from '@/app/secao/[id]/MagazineViewer'

export const revalidate = 30

type Props = { params: Promise<{ id: string }> }

export default async function ApresentacaoPage({ params }: Props) {
  const { id } = await params

  const { data: images } = await supabase
    .from('section_images')
    .select('*')
    .eq('section_id', id)
    .order('order_index')

  if (!images || images.length === 0) notFound()

  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#04080f' }}>

      {/* Topo discreto */}
      <div className="py-3 px-6 flex items-center justify-center border-b border-white/[0.04]">
        <span className="text-[8px] tracking-[0.7em] text-white/18 uppercase">
          RL PHOTO.VIDEO
        </span>
      </div>

      {/* Neon topo */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 110% 45% at 50% -5%, rgba(50,110,255,0.08) 0%, transparent 65%)',
      }} />

      {/* Revista */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-4 py-8 w-full max-w-5xl mx-auto">
        <MagazineViewer
          images={images}
          sectionId={id}
          isAdmin={false}
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
