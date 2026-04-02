import { Page } from '@/lib/supabase'

type Props = {
  pages: Page[]
}

export default function PageLinks({ pages }: Props) {
  if (pages.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
      {pages.map((page) => (
        <a
          key={page.id}
          href={page.notion_url ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-gold/50 transition-all duration-200 group"
        >
          <span className="text-gold text-xs">↗</span>
          <span className="text-sm text-white/80 group-hover:text-white truncate">
            {page.title}
          </span>
        </a>
      ))}
    </div>
  )
}
