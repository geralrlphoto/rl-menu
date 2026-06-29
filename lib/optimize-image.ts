import sharp from 'sharp'

// Cache de 1 ano (em segundos). Usar em TODOS os uploads para o bucket
// portal-images — as imagens nunca mudam de conteúdo (o nome é único por
// upload), por isso podem ser cacheadas o máximo possível e poupar egress.
export const IMAGE_CACHE_CONTROL = '31536000'

// Lado maior máximo e qualidade aplicados a todas as imagens da galeria.
const MAX_DIMENSION = 2000
const QUALITY = 80

export type OptimizedImage = { buffer: Buffer; contentType: string }

// Decide o formato de re-codificação a partir do content-type / extensão.
// Formatos não reconhecidos passam intactos (devolvemos null).
function targetFormat(
  contentType: string,
  filename?: string,
): 'jpeg' | 'png' | 'webp' | null {
  const ext = (filename?.split('.').pop() || '').toLowerCase()
  const ct = (contentType || '').toLowerCase()
  if (ct.includes('jpeg') || ct.includes('jpg') || ext === 'jpg' || ext === 'jpeg') return 'jpeg'
  if (ct.includes('png') || ext === 'png') return 'png'
  if (ct.includes('webp') || ext === 'webp') return 'webp'
  return null
}

// Redimensiona para no máximo 2000px no lado maior (nunca aumenta) com
// qualidade 80, mantendo o formato original para preservar o nome/URL.
// Se a optimização não reduzir o tamanho, devolve o buffer original.
export async function optimizeImage(
  input: Buffer,
  contentType: string,
  filename?: string,
): Promise<OptimizedImage> {
  const format = targetFormat(contentType, filename)
  if (!format) return { buffer: input, contentType }

  const pipeline = sharp(input, { failOn: 'none' })
    .rotate() // aplica a orientação EXIF antes de descartar metadata
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })

  let out: Buffer
  let outType: string
  if (format === 'jpeg') {
    out = await pipeline.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer()
    outType = 'image/jpeg'
  } else if (format === 'png') {
    out = await pipeline.png({ quality: QUALITY, compressionLevel: 9, palette: true }).toBuffer()
    outType = 'image/png'
  } else {
    out = await pipeline.webp({ quality: QUALITY }).toBuffer()
    outType = 'image/webp'
  }

  if (out.length >= input.length) return { buffer: input, contentType }
  return { buffer: out, contentType: outType }
}
