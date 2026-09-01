import type { MetadataRoute } from 'next'
import { listarSlugs } from '@/lib/podcast/dados'
import { BASE_URL } from '@/lib/podcast/programa'

/* ============================================================
   Mapa do site.

   Só inclui as páginas públicas da secção do podcast. O resto do
   projeto é back-office e portais privados por token, que não devem
   ser indexados, por isso ficam de fora de propósito.
   ============================================================ */

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const episodios = await listarSlugs()

  return [
    {
      url: `${BASE_URL}/podcast`,
      lastModified: episodios[0]?.data_publicacao ? new Date(episodios[0].data_publicacao) : new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/podcast/convidados`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...episodios.map(ep => ({
      url: `${BASE_URL}/podcast/${ep.slug}`,
      lastModified: new Date(ep.data_publicacao),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
