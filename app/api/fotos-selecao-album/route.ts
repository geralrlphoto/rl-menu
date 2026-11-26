import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAcessoRef, ehAdmin } from '@/lib/api-guard'
import { ehGaleriaWfolio, lerGaleriaWfolio, WFOLIO_CDN } from '@/lib/wfolioGaleria'
import { registarFoto } from '@/lib/fotografiaHistorico'

// Personalizar o álbum (página /portal-cliente/personalizar-album/?ref=X).
//  GET  ?ref=X → fotografias que os noivos escolheram para o álbum (separador Álbum da
//               galeria; se ainda não escolheram, as da seleção) + o que já montaram
//  POST { ref, acao: 'guardar', estado } → guarda a meio (portais.settings.album_config)
//  POST { ref, acao: 'enviar', estado }  → fecha a escolha e avisa a RL (sino + histórico)
//  POST { ref, acao: 'reabrir' }         → só admin: volta a deixar os noivos mexer

export const dynamic = 'force-dynamic'
export const maxDuration = 30

type Config = { estado: Record<string, unknown> | null; atualizado: string | null; enviado: string | null }

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function lerPortal(ref: string) {
  const { data } = await db()
    .from('portais')
    .select('id, referencia, noiva, noivo, data, settings')
    .eq('referencia', ref.toUpperCase())
    .limit(1)
    .maybeSingle()
  return data as { id: string; referencia: string; noiva: string | null; noivo: string | null; data: string | null; settings: Record<string, any> | null } | null
}

function configDe(settings: Record<string, any> | null): Config {
  const c = settings?.album_config
  return { estado: c?.estado && typeof c.estado === 'object' ? c.estado : null, atualizado: c?.atualizado ?? null, enviado: c?.enviado ?? null }
}

const nomesDe = (v: unknown): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
const absoluto = (u: string) => (u.startsWith('//') ? 'https:' + u : u.startsWith('http') ? u : 'https:' + WFOLIO_CDN + u)

export async function GET(req: Request) {
  const ref = new URL(req.url).searchParams.get('ref')?.trim()
  if (!ref) return NextResponse.json({ error: 'ref' }, { status: 400 })
  const bloqueio = await exigeAcessoRef(req, ref, { equipa: true })
  if (bloqueio) return bloqueio

  const portal = await lerPortal(ref)
  if (!portal) return NextResponse.json({ error: 'portal' }, { status: 404 })
  const s = portal.settings ?? {}

  // as do separador Álbum (só as que continuam na seleção); se ainda não há, as da seleção
  const selecao = nomesDe(s.selecao_galeria?.sel)
  const naSelecao = new Set(selecao)
  const album = nomesDe(s.album_galeria?.sel).filter(n => naSelecao.has(n))
  const nomes = album.length ? album : selecao
  const origem = album.length ? 'album' : selecao.length ? 'selecao' : 'nenhuma'

  let fotos: { id: string; src: string; t: string; w: number; h: number }[] = []
  const url = s.selecao_url as string | undefined
  if (nomes.length && ehGaleriaWfolio(url)) {
    try {
      const g = await lerGaleriaWfolio(url!)
      const porNome = new Map(g.pastas.flatMap(p => p.fotos.map(f => [f.n, f] as const)))
      // pela ordem da galeria (segue o dia), não pela ordem em que foram escolhidas
      const ordem = g.pastas.flatMap(p => p.fotos.map(f => f.n)).filter(n => nomes.includes(n))
      fotos = ordem.map(n => {
        const f = porNome.get(n)!
        return { id: n, src: absoluto(f.g), t: absoluto(f.t), w: Math.round(f.r * 1000), h: 1000 }
      })
    } catch (e) {
      console.error('[fotos-selecao-album] wfolio:', e)
      return NextResponse.json({ ok: false, error: 'wfolio' }, { status: 502 })
    }
  }

  return NextResponse.json({
    ok: true,
    referencia: portal.referencia,
    nomes: [portal.noiva, portal.noivo].filter(Boolean).join(' & '),
    origem,
    fotos,
    config: configDe(s),
    admin: ehAdmin(req),
  })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const ref = typeof body.ref === 'string' ? body.ref.trim() : ''
  if (!ref) return NextResponse.json({ error: 'ref' }, { status: 400 })
  const bloqueio = await exigeAcessoRef(req, ref, { equipa: true })
  if (bloqueio) return bloqueio

  const portal = await lerPortal(ref)
  if (!portal) return NextResponse.json({ error: 'portal' }, { status: 404 })
  const atual = configDe(portal.settings)
  const admin = ehAdmin(req)
  const agora = new Date().toISOString()

  const gravar = async (c: Config) => {
    const { error } = await db().from('portais')
      .update({ settings: { ...(portal.settings ?? {}), album_config: c }, updated_at: agora })
      .eq('id', portal.id)
    return error
  }

  if (body.acao === 'reabrir') {
    if (!admin) return NextResponse.json({ error: 'nao_autorizado' }, { status: 401 })
    const err = await gravar({ ...atual, enviado: null })
    if (err) return NextResponse.json({ error: err.message }, { status: 500 })
    await registarFoto(portal.referencia, 'Álbum personalizado: reaberto para alterações', 'RL')
    return NextResponse.json({ ok: true, config: { ...atual, enviado: null } })
  }

  if (body.acao !== 'guardar' && body.acao !== 'enviar') return NextResponse.json({ error: 'acao' }, { status: 400 })
  if (atual.enviado && !admin) return NextResponse.json({ error: 'O álbum já foi enviado.', config: atual }, { status: 409 })

  const estado = body.estado
  if (!estado || typeof estado !== 'object' || Array.isArray(estado)) return NextResponse.json({ error: 'estado' }, { status: 400 })
  if (JSON.stringify(estado).length > 300_000) return NextResponse.json({ error: 'Demasiado grande' }, { status: 413 })

  const enviar = body.acao === 'enviar'
  const novo: Config = { estado, atualizado: agora, enviado: enviar ? agora : atual.enviado }
  const err = await gravar(novo)
  if (err) return NextResponse.json({ error: err.message }, { status: 500 })
  if (enviar) await registarFoto(portal.referencia, 'Álbum personalizado enviado pelos noivos', 'Noivos')
  return NextResponse.json({ ok: true, config: novo })
}
