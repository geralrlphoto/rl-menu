import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAcessoRef, ehAdmin } from '@/lib/api-guard'
import { ehGaleriaWfolio, lerGaleriaWfolio, WFOLIO_CDN } from '@/lib/wfolioGaleria'
import { registarFoto } from '@/lib/fotografiaHistorico'
import { validarAlbum } from '@/lib/albumPersonalizado'

// Personalizar o álbum (página /portal-cliente/personalizar-album/?ref=X).
//  GET  ?ref=X → fotografias que os noivos escolheram para o álbum (separador Álbum da
//               galeria; se ainda não escolheram, as da seleção) + o que já montaram
//  POST { ref, acao: 'guardar', estado } → guarda a meio (portais.settings.album_config)
//  POST { ref, acao: 'enviar', estado }  → fecha a escolha e avisa a RL (sino + histórico)
//  POST { ref, acao: 'reabrir' }         → só admin: volta a deixar os noivos mexer
//  POST { ref, acao: 'pasta', pasta }     → só admin: onde estão as fotos originais (para o comando "fazer álbum")
//  GET  ?ref=X&validar=1                  → o que falta no álbum personalizado e as fotos do álbum por colocar
//  POST { ref, acao: 'enviar-tudo', semPersonalizar? } → o botão Enviar do separador Álbum: fecha as fotos
//       do álbum e, se não for semPersonalizar, também o álbum personalizado (tem de estar completo)

export const dynamic = 'force-dynamic'
export const maxDuration = 30

type Config = { estado: Record<string, unknown> | null; atualizado: string | null; enviado: string | null; pasta?: string | null }

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
  return { estado: c?.estado && typeof c.estado === 'object' ? c.estado : null, atualizado: c?.atualizado ?? null, enviado: c?.enviado ?? null, pasta: c?.pasta ?? null }
}

const nomesDe = (v: unknown): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
// WFOLIO_CDN já traz o https: (antes ficava https:https://… e as fotos não carregavam)
const absoluto = (u: string) => (u.startsWith('//') ? 'https:' + u : u.startsWith('http') ? u : WFOLIO_CDN + u)

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
  if (new URL(req.url).searchParams.get('validar')) {
    const v = validarAlbum(configDe(s).estado, album)
    return NextResponse.json({ ok: true, fotosAlbum: album.length, selecaoEnviada: !!s.selecao_galeria?.enviada, albumEnviado: !!configDe(s).enviado, ...v })
  }

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
    config: ehAdmin(req) ? configDe(s) : { ...configDe(s), pasta: null },
    fotosEnviadas: s.album_galeria?.enviada ?? null,
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

  if (body.acao === 'pasta') {
    if (!admin) return NextResponse.json({ error: 'nao_autorizado' }, { status: 401 })
    const pasta = typeof body.pasta === 'string' ? body.pasta.trim().slice(0, 500) : ''
    const err = await gravar({ ...atual, pasta: pasta || null })
    if (err) return NextResponse.json({ error: err.message }, { status: 500 })
    return NextResponse.json({ ok: true, config: { ...atual, pasta: pasta || null } })
  }

  if (body.acao === 'reabrir') {
    if (!admin) return NextResponse.json({ error: 'nao_autorizado' }, { status: 401 })
    // reabre a personalização e a escolha das fotos do álbum
    const s0 = portal.settings ?? {}
    const { error: err } = await db().from('portais')
      .update({ settings: { ...s0, album_config: { ...atual, enviado: null }, ...(s0.album_galeria ? { album_galeria: { ...s0.album_galeria, enviada: null } } : {}) }, updated_at: agora })
      .eq('id', portal.id)
    if (err) return NextResponse.json({ error: err.message }, { status: 500 })
    await registarFoto(portal.referencia, 'Álbum personalizado: reaberto para alterações', 'RL')
    return NextResponse.json({ ok: true, config: { ...atual, enviado: null } })
  }

  if (body.acao === 'enviar-tudo') {
    const s0 = portal.settings ?? {}
    if (s0.album_galeria?.enviada && atual.enviado) return NextResponse.json({ error: 'O álbum já foi enviado.' }, { status: 409 })
    const selecao = nomesDe(s0.selecao_galeria?.sel), naSelecao = new Set(selecao)
    const fotosAlbum = nomesDe(s0.album_galeria?.sel).filter(n => naSelecao.has(n))
    const semPersonalizar = !!body.semPersonalizar
    // sem fotos escolhidas só se deixarem o álbum à RL
    if (!fotosAlbum.length && !semPersonalizar) return NextResponse.json({ error: 'Escolham primeiro as fotografias para o álbum.' }, { status: 400 })
    let config = atual
    if (!semPersonalizar) {
      const v = validarAlbum(atual.estado, fotosAlbum)
      if (!v.iniciado || v.faltas.length || v.porColocar.length) return NextResponse.json({ error: 'incompleto', ...v }, { status: 422 })
      config = { ...atual, enviado: agora, atualizado: agora }
    }
    const { error: err } = await db().from('portais')
      .update({ settings: { ...s0, album_config: config, album_galeria: { ...s0.album_galeria, sel: fotosAlbum, atualizado: agora, enviada: s0.album_galeria?.enviada ?? agora } }, updated_at: agora })
      .eq('id', portal.id)
    if (err) return NextResponse.json({ error: err.message }, { status: 500 })
    if (!s0.album_galeria?.enviada && fotosAlbum.length) {
      // as fotos do álbum passam para fotos_selecao.fotos_album (é daí que o departamento as lê)
      const ordem = selecao.filter(n => fotosAlbum.includes(n))
      const { data: linha } = await db().from('fotos_selecao').select('id')
        .eq('referencia', portal.referencia).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (linha) await db().from('fotos_selecao').update({ fotos_album: ordem.join(', ') }).eq('id', linha.id)
      await registarFoto(portal.referencia, `Fotos do álbum recebidas (${fotosAlbum.length})`, 'Noivos')
    }
    if (!semPersonalizar) await registarFoto(portal.referencia, 'Álbum personalizado enviado pelos noivos', 'Noivos')
    return NextResponse.json({ ok: true, enviada: agora, personalizado: !semPersonalizar })
  }

  if (body.acao !== 'guardar' && body.acao !== 'enviar') return NextResponse.json({ error: 'acao' }, { status: 400 })
  if ((atual.enviado || portal.settings?.album_galeria?.enviada) && !admin) return NextResponse.json({ error: 'O álbum já foi enviado.', config: { ...atual, pasta: null } }, { status: 409 })

  const estado = body.estado
  if (!estado || typeof estado !== 'object' || Array.isArray(estado)) return NextResponse.json({ error: 'estado' }, { status: 400 })
  if (JSON.stringify(estado).length > 300_000) return NextResponse.json({ error: 'Demasiado grande' }, { status: 413 })

  const enviar = body.acao === 'enviar'
  const novo: Config = { estado, atualizado: agora, enviado: enviar ? agora : atual.enviado, pasta: atual.pasta ?? null }
  const s0 = portal.settings ?? {}
  // ao enviar, fecha também a escolha das fotos do álbum (separador Álbum da galeria)
  const selecao = nomesDe(s0.selecao_galeria?.sel), naSelecao = new Set(selecao)
  const fotosAlbum = nomesDe(s0.album_galeria?.sel).filter(n => naSelecao.has(n))
  const fecharFotos = enviar && fotosAlbum.length > 0 && !s0.album_galeria?.enviada
  const { error: err } = await db().from('portais')
    .update({ settings: { ...s0, album_config: novo, ...(fecharFotos ? { album_galeria: { ...s0.album_galeria, sel: fotosAlbum, atualizado: agora, enviada: agora } } : {}) }, updated_at: agora })
    .eq('id', portal.id)
  if (err) return NextResponse.json({ error: err.message }, { status: 500 })
  if (enviar) {
    if (fecharFotos) {
      // como o antigo "Enviar álbum" da galeria: as fotos passam para fotos_selecao.fotos_album
      const ordem = selecao.filter(n => fotosAlbum.includes(n))
      const { data: linha } = await db().from('fotos_selecao').select('id')
        .eq('referencia', portal.referencia).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (linha) await db().from('fotos_selecao').update({ fotos_album: ordem.join(', ') }).eq('id', linha.id)
      await registarFoto(portal.referencia, `Fotos do álbum recebidas (${fotosAlbum.length})`, 'Noivos')
    }
    await registarFoto(portal.referencia, 'Álbum personalizado enviado pelos noivos', 'Noivos')
  }
  return NextResponse.json({ ok: true, config: admin ? novo : { ...novo, pasta: null } })
}
