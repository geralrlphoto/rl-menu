import fs from 'fs'
import path from 'path'

// Lê todas as fotos em /public/newsletter/ e devolve URLs completos.
// Adicionar fotos: basta colocar .jpg/.png/.webp nessa pasta e commit.
export function getNewsletterPhotos(): string[] {
  try {
    const dir = path.join(process.cwd(), 'public', 'newsletter')
    if (!fs.existsSync(dir)) return []

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rl-menu-lake.vercel.app'
    return fs.readdirSync(dir)
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map(f => `${baseUrl}/newsletter/${f}`)
  } catch {
    return []
  }
}

// Escolhe uma foto aleatória. Fallback para imagem por omissão se pasta vazia.
export function pickRandomPhoto(fallback?: string | null): string | null {
  const photos = getNewsletterPhotos()
  if (photos.length === 0) return fallback || null
  return photos[Math.floor(Math.random() * photos.length)]
}

// Escolhe N fotos aleatórias (sem repetir).
export function pickRandomPhotos(n: number): string[] {
  const photos = getNewsletterPhotos()
  if (photos.length === 0) return []
  const shuffled = [...photos].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, photos.length))
}
