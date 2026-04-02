import Image from 'next/image'
import { SectionImage } from '@/lib/supabase'

type Props = {
  images: SectionImage[]
}

export default function ImageGrid({ images }: Props) {
  // Agrupa imagens por coluna
  const columns: Record<number, SectionImage[]> = {}
  images.forEach((img) => {
    if (!columns[img.column_index]) columns[img.column_index] = []
    columns[img.column_index].push(img)
  })

  const colKeys = Object.keys(columns).sort()

  if (colKeys.length === 0) return null

  return (
    <div className={`grid gap-4 grid-cols-${Math.min(colKeys.length, 3)}`}>
      {colKeys.map((col) => (
        <div key={col} className="flex flex-col gap-4">
          {columns[Number(col)]
            .sort((a, b) => a.order_index - b.order_index)
            .map((img) => (
              <div key={img.id} className="relative overflow-hidden rounded-lg group">
                {img.link_url ? (
                  <a href={img.link_url} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={img.image_url}
                      alt=""
                      width={600}
                      height={400}
                      className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </a>
                ) : (
                  <Image
                    src={img.image_url}
                    alt=""
                    width={600}
                    height={400}
                    className="w-full object-cover"
                  />
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}
