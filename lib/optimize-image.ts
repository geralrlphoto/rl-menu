import sharp from 'sharp'

// Cache de 1 ano (em segundos). Usar em TODOS os uploads para o bucket
// portal-images — as imagens nunca mudam de conteúdo (o nome é único por
// upload), por isso podem ser cacheadas o máximo possível e poupar egress.
export const IMAGE_CACHE_CONTROL = '31536000'

// Lado maior máximo e qualidade aplicados a todas as imagens da galeria.
// 1400px chega para ecrãs retina a mostrar a imagem a ~700px, que é o máximo
// que qualquer portal usa. Acima disso só se paga egress.
const MAX_DIMENSION = 1400
const QUALITY = 80

export type OptimizedImage = { buffer: Buffer; contentType: string }

// Só re-codificamos o que sabemos ler. Formatos não reconhecidos (SVG, GIF)
// passam intactos.
function reconhecido(contentType: string, filename?: string): boolean {
  const ext = (filename?.split('.').pop() || '').toLowerCase()
  const ct = (contentType || '').toLowerCase()
  return ct.includes('jpeg') || ct.includes('jpg') || ct.includes('png') || ct.includes('webp')
    || ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
}

// Redimensiona para no máximo MAX_DIMENSION no lado maior (nunca aumenta) e
// converte SEMPRE para WebP, que mantém transparência e pesa uma fração do
// PNG. Antes o formato original era preservado, e uma fotografia gravada em
// PNG ficava com centenas de KB para ser mostrada a 330px no telemóvel.
// Se a optimização não reduzir o tamanho, devolve o buffer original.
export async function optimizeImage(
  input: Buffer,
  contentType: string,
  filename?: string,
): Promise<OptimizedImage> {
  if (!reconhecido(contentType, filename)) return { buffer: input, contentType }

  try {
    const out = await sharp(input, { failOn: 'none' })
      .rotate() // aplica a orientação EXIF antes de descartar metadata
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: QUALITY })
      .toBuffer()

    if (out.length >= input.length) return { buffer: input, contentType }
    return { buffer: out, contentType: 'image/webp' }
  } catch {
    return { buffer: input, contentType }
  }
}

// Extensão correspondente ao content-type devolvido pela optimização, para o
// nome do ficheiro não dizer .png quando o conteúdo já é WebP.
export function extensaoPara(contentType: string, fallback = 'jpg'): string {
  const ct = (contentType || '').toLowerCase()
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('png')) return 'png'
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg'
  return fallback
}
