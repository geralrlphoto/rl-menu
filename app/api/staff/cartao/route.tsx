import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

// A pessoa responsável por um email aos noivos, por cima do bilhete:
// foto redonda, nome e função por baixo (Gestão › Staff, lib/staff.ts).
// GET ?email=<chave> → PNG 1040×250 (aparece a 520 px no email); sem
// responsável → faixa transparente quase sem altura, e o email fica como estava.

export const runtime = 'nodejs'

// Sem responsável: faixa transparente de 1040×2 (no email fica com 1 px de altura)
const vazio = async () => {
  const png = await sharp({ create: { width: 1040, height: 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer()
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=300' } })
}

export async function GET(req: NextRequest) {
  const chave = req.nextUrl.searchParams.get('email') ?? ''
  if (!chave) return vazio()
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await sb.from('staff').select('nome, funcao, foto_url').eq('ativo', true).contains('emails', [chave]).limit(1).maybeSingle()
  if (!data) return vazio()

  // foto em PNG (as fotos guardadas podem ser WebP, que a imagem não lê)
  let foto: string | null = null
  if (data.foto_url) {
    try {
      const r = await fetch(data.foto_url)
      if (r.ok) {
        const png = await sharp(Buffer.from(await r.arrayBuffer()), { failOn: 'none' }).resize(240, 240, { fit: 'cover' }).png().toBuffer()
        foto = `data:image/png;base64,${png.toString('base64')}`
      }
    } catch { /* sem foto: fica a inicial */ }
  }
  const inicial = data.nome.trim().charAt(0).toUpperCase()

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0b0b0b' }}>
        <div style={{ width: 132, height: 132, borderRadius: 66, border: '3px solid #d8be93', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#1a1712' }}>
          {foto
            ? <img src={foto} width={126} height={126} style={{ width: 126, height: 126, borderRadius: 63, objectFit: 'cover' }} />
            : <span style={{ fontSize: 56, color: '#d8be93' }}>{inicial}</span>}
        </div>
        <div style={{ marginTop: 16, fontSize: 38, color: '#ffffff', letterSpacing: 1 }}>{data.nome}</div>
        {data.funcao && <div style={{ marginTop: 6, fontSize: 20, color: '#d8be93', letterSpacing: 6, textTransform: 'uppercase' }}>{data.funcao}</div>}
      </div>
    ),
    { width: 1040, height: 260, headers: { 'Cache-Control': 'public, max-age=300' } },
  )
}
