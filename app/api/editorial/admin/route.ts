import { NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'
import { ehEditorial, lerEditorial, gravarEditorial, normSenha, novaSenhaEditorial } from '@/lib/editorialAcesso'
import { ENTREGAS_EDITORIAL, type EntregaLink } from '@/lib/editoriaisEntregas'

// Janela do + em /portais-clientes: senha e links das entregas de um editorial. Só admin.

export async function GET(req: Request) {
  const bloqueio = exigeAdmin(req); if (bloqueio) return bloqueio
  const slug = new URL(req.url).searchParams.get('slug') ?? ''
  if (!ehEditorial(slug)) return NextResponse.json({ error: 'Editorial desconhecido' }, { status: 404 })
  const ed = await lerEditorial(slug)
  return NextResponse.json({ grupos: ENTREGAS_EDITORIAL[slug] ?? [], entregas: ed.entregas, temSenha: !!ed.senhaHash, novaSugerida: novaSenhaEditorial() })
}

export async function PATCH(req: Request) {
  const bloqueio = exigeAdmin(req); if (bloqueio) return bloqueio
  const { slug, senha, entregas } = await req.json().catch(() => ({})) as
    { slug?: string; senha?: string; entregas?: Record<string, EntregaLink> }
  if (!slug || !ehEditorial(slug)) return NextResponse.json({ error: 'Editorial desconhecido' }, { status: 404 })
  if (senha && normSenha(senha).length < 8) return NextResponse.json({ error: 'A senha tem de ter pelo menos 8 caracteres.' }, { status: 400 })

  // Só ficam links dos vídeos que existem neste editorial, e só http(s)
  const ids = new Set((ENTREGAS_EDITORIAL[slug] ?? []).flatMap(g => g.itens.map(i => i.id)))
  const limpas: Record<string, EntregaLink> = {}
  for (const [id, v] of Object.entries(entregas ?? {})) {
    const link = (v?.link ?? '').trim()
    if (!ids.has(id) || !link) continue
    if (!/^https?:\/\//i.test(link)) return NextResponse.json({ error: 'Os links têm de começar por http:// ou https://' }, { status: 400 })
    limpas[id] = { link, data: v.data || new Date().toISOString().slice(0, 10) }
  }

  try {
    await gravarEditorial(slug, { senha: senha || undefined, entregas: entregas ? limpas : undefined })
  } catch (e) {
    return NextResponse.json({ error: `Não foi possível gravar: ${e instanceof Error ? e.message : 'erro'}` }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
