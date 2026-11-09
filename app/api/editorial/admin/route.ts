import { NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'
import { ehEditorial, lerEditorial, gravarEditorial, normSenha, novaSenhaEditorial } from '@/lib/editorialAcesso'
import { ENTREGAS_EDITORIAL, ehIdExtra, type EntregaLink } from '@/lib/editoriaisEntregas'

// Janela do + em /portais-clientes: senha e vídeos das entregas de um editorial (título, formato, link,
// vídeos acrescentados e removidos). Só admin.

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

  // Ficam os vídeos da lista de partida (com título/formato mudados, link ou removidos)
  // e os acrescentados (id "extra-…", com título). Links só http(s).
  const grupos = ENTREGAS_EDITORIAL[slug] ?? []
  const ids = new Set(grupos.flatMap(g => g.itens.map(i => i.id)))
  const parceiros = new Set(grupos.map(g => g.parceiro))
  const txt = (s: unknown, max: number) => (typeof s === 'string' ? s.trim().slice(0, max) : '')
  const limpas: Record<string, EntregaLink> = {}
  for (const [id, v] of Object.entries(entregas ?? {})) {
    const extra = ehIdExtra(id)
    if (!ids.has(id) && !extra) continue
    const link = txt(v?.link, 1000)
    if (link && !/^https?:\/\//i.test(link)) return NextResponse.json({ error: 'Os links têm de começar por http:// ou https://' }, { status: 400 })
    const nome = txt(v?.nome, 120)
    const formato = typeof v?.formato === 'string' ? txt(v.formato, 60) : undefined
    const e: EntregaLink = {}
    if (link) { e.link = link; e.data = txt(v?.data, 10) || new Date().toISOString().slice(0, 10) }
    if (extra) {
      if (!nome) return NextResponse.json({ error: 'Os vídeos acrescentados precisam de título.' }, { status: 400 })
      Object.assign(e, { extra: true, nome, formato: formato ?? '', grupo: parceiros.has(v?.grupo ?? '') ? v.grupo : grupos[0]?.parceiro, ordem: Number(v?.ordem) || Date.now() })
    } else {
      if (nome) e.nome = nome
      if (formato !== undefined) e.formato = formato
      if (v?.oculto) e.oculto = true
    }
    if (Object.keys(e).length) limpas[id] = e
  }

  try {
    await gravarEditorial(slug, { senha: senha || undefined, entregas: entregas ? limpas : undefined })
  } catch (e) {
    return NextResponse.json({ error: `Não foi possível gravar: ${e instanceof Error ? e.message : 'erro'}` }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
