import ImageGrid from './ImageGrid'
import PageLinks from './PageLinks'
import { MenuSection as MenuSectionType, SectionImage, Page } from '@/lib/supabase'

type Props = {
  section: MenuSectionType
  images: SectionImage[]
  pages: Page[]
}

export default function MenuSection({ section, images, pages }: Props) {
  return (
    <section className="py-8 border-b border-white/10 last:border-0">
      <h2 className="text-xs font-semibold tracking-[0.3em] text-gold uppercase mb-6">
        {section.name}
      </h2>
      {images.length > 0 && <ImageGrid images={images} />}
      {pages.length > 0 && <PageLinks pages={pages} />}
    </section>
  )
}
