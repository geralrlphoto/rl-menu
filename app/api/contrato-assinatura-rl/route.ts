import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAcessoRef } from '@/lib/api-guard'

// GET /api/contrato-assinatura-rl?eventoId=xxx
// Devolve a imagem da assinatura da Liliana (bucket privado "contratos",
// assinaturas/liliana.png) para o contrato CPS versão 2. Só para o admin ou para
// os noivos desse evento; a imagem não fica no código nem num endereço público.
export async function GET(req: NextRequest) {
  const eventoId = req.nextUrl.searchParams.get('eventoId') ?? ''
  if (!eventoId) return NextResponse.json({ error: 'eventoId em falta' }, { status: 400 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: ev } = await sb.from('eventos_2026').select('referencia').eq('id', eventoId).maybeSingle()
  const barrado = await exigeAcessoRef(req, ev?.referencia ?? null)
  if (barrado) return barrado

  const { data, error } = await sb.storage.from('contratos').download('assinaturas/liliana.png')
  if (error || !data) return NextResponse.json({ error: 'Assinatura não encontrada.' }, { status: 404 })
  return new NextResponse(Buffer.from(await data.arrayBuffer()), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=3600' },
  })
}
