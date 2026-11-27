import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAcessoRef } from '@/lib/api-guard'
import { ehGaleriaWfolio, lerGaleriaWfolio, WFOLIO_CDN, type CampoSelecao } from '@/lib/wfolioGaleria'
import { saveSelecao, type SelecaoFotos } from '@/lib/selecao-fotos-save'
import { enviarEmailAdminSelecao } from '@/lib/selecao-fotos-email'
import { enviarTicketFotos } from '@/lib/ticketFotos'
import { registarFoto } from '@/lib/fotografiaHistorico'
import { temAlbumPortal, PAGINA_NOTAS_PRIVADAS, textoEscolhaAlbum, type EscolhaAlbum } from '@/lib/temAlbum'

// Galeria de seleção dentro do portal dos noivos.
//  GET  ?ref=X          → pastas e fotografias da galeria do Wfolio (selecao_url) + escolha guardada
//  GET  ?ref=X&estado=1 → só o estado (para o cartão), sem ler o Wfolio
//  POST { ref, acao: 'guardar', sel }         → guarda a escolha a meio (settings.selecao_galeria)
//  POST { ref, acao: 'enviar', sel, tipo, album? } → album: 'noivos' | 'rl' (quem personaliza o álbum;
//       fica em settings.album_escolha, nas Notas Privadas do portal e no email da seleção). Envia pelo mesmo caminho do formulário da seleção:
//       linha em fotos_selecao + página no Notion + email ao admin + ticket aos noivos.

export const dynamic = 'force-dynamic'
export const maxDuration = 30

type Estado = { sel: string[]; atualizado?: string | null; enviada?: string | null }

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

function estadoDe(settings: Record<string, any> | null): Estado {
  const e = settings?.selecao_galeria
  return { sel: Array.isArray(e?.sel) ? e.sel.filter((x: unknown) => typeof x === 'string') : [], atualizado: e?.atualizado ?? null, enviada: e?.enviada ?? null }
}

function albumDe(settings: Record<string, any> | null): Estado {
  const e = settings?.album_galeria
  return { sel: Array.isArray(e?.sel) ? e.sel.filter((x: unknown) => typeof x === 'string') : [], atualizado: e?.atualizado ?? null, enviada: e?.enviada ?? null }
}

async function gravarEstado(id: string, settings: Record<string, any> | null, estado: Estado, mais: Record<string, any> = {}) {
  const { error } = await db().from('portais')
    .update({ settings: { ...(settings ?? {}), selecao_galeria: estado, ...mais }, updated_at: new Date().toISOString() })
    .eq('id', id)
  return error
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')?.trim()
  if (!ref) return NextResponse.json({ error: 'ref' }, { status: 400 })
  const bloqueio = await exigeAcessoRef(req, ref, { equipa: true })
  if (bloqueio) return bloqueio

  const portal = await lerPortal(ref)
  if (!portal) return NextResponse.json({ error: 'portal' }, { status: 404 })
  const url = portal.settings?.selecao_url as string | undefined
  const estado = estadoDe(portal.settings)
  const album = albumDe(portal.settings)
  if (searchParams.get('estado')) return NextResponse.json({ ok: true, wfolio: ehGaleriaWfolio(url), estado, album })

  if (!ehGaleriaWfolio(url)) return NextResponse.json({ ok: false, error: 'sem_galeria', estado, album })
  try {
    const [g, temAlbum] = await Promise.all([lerGaleriaWfolio(url!), temAlbumPortal(db(), portal.referencia, portal.settings).catch(() => null)])
    return NextResponse.json({ ok: true, cdn: WFOLIO_CDN, titulo: g.titulo, pastas: g.pastas, estado, album, temAlbum, escolhaAlbum: portal.settings?.album_escolha ?? null })
  } catch (e) {
    console.error('[fotos-selecao-galeria] wfolio:', e)
    return NextResponse.json({ ok: false, error: 'wfolio', estado, album }, { status: 502 })
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const ref = typeof body.ref === 'string' ? body.ref.trim() : ''
  if (!ref) return NextResponse.json({ error: 'ref' }, { status: 400 })
  const bloqueio = await exigeAcessoRef(req, ref, { equipa: true })
  if (bloqueio) return bloqueio

  const portal = await lerPortal(ref)
  if (!portal) return NextResponse.json({ error: 'portal' }, { status: 404 })
  const atual = estadoDe(portal.settings)
  const nomes = (v: unknown): string[] => Array.isArray(v)
    ? [...new Set<string>(v.filter((x: unknown): x is string => typeof x === 'string' && x.length > 0 && x.length < 80))].slice(0, 5000)
    : []
  const agora = new Date().toISOString()

  // ── Álbum: escolhido só entre as fotografias da seleção ──
  //  { acao: 'album', sel }         → guarda a escolha a meio (settings.album_galeria)
  //  { acao: 'enviar-album', sel }  → fecha a escolha e passa-a para fotos_selecao.fotos_album
  if (body.acao === 'album' || body.acao === 'enviar-album') {
    const alb = albumDe(portal.settings)
    if (alb.enviada) return NextResponse.json({ error: 'As fotografias do álbum já foram enviadas.', album: alb }, { status: 409 })
    const daSelecao = new Set(atual.sel)
    const escolha = nomes(body.sel).filter(n => daSelecao.has(n))
    const enviar = body.acao === 'enviar-album'
    if (enviar && escolha.length === 0) return NextResponse.json({ error: 'Escolham pelo menos uma fotografia para o álbum.' }, { status: 400 })
    const novo: Estado = { sel: escolha, atualizado: agora, enviada: enviar ? agora : null }
    const { error } = await db().from('portais')
      .update({ settings: { ...(portal.settings ?? {}), album_galeria: novo }, updated_at: agora })
      .eq('id', portal.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (enviar) {
      // Se a seleção já chegou, o álbum junta-se à mesma linha (é daí que o departamento o lê)
      const ordem = atual.sel.filter(n => escolha.includes(n))
      const { data: linha } = await db().from('fotos_selecao').select('id')
        .eq('referencia', portal.referencia).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (linha) await db().from('fotos_selecao').update({ fotos_album: ordem.join(', ') }).eq('id', linha.id)
      await registarFoto(portal.referencia, `Fotos do álbum recebidas (${escolha.length})`, 'Noivos')
    }
    return NextResponse.json({ ok: true, album: novo })
  }

  if (atual.enviada) return NextResponse.json({ error: 'Esta seleção já foi enviada.', estado: atual }, { status: 409 })

  // Cada aparelho manda só o que juntou e o que tirou: assim os dois noivos podem
  // escolher ao mesmo tempo sem um apagar as escolhas do outro.
  const novas = nomes(body.add), tira = new Set(nomes(body.rem))
  const sel = [...atual.sel.filter(n => !tira.has(n))]
  for (const n of novas) if (!sel.includes(n) && !tira.has(n)) sel.push(n)
  const mudou = novas.length > 0 || tira.size > 0

  if (body.acao === 'alterar') {
    if (mudou) {
      const err = await gravarEstado(portal.id, portal.settings, { sel, atualizado: agora, enviada: null })
      if (err) return NextResponse.json({ error: err.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, estado: { sel, atualizado: mudou ? agora : atual.atualizado, enviada: null } })
  }

  if (body.acao !== 'enviar') return NextResponse.json({ error: 'acao' }, { status: 400 })
  if (sel.length === 0) return NextResponse.json({ error: 'Escolham pelo menos uma fotografia.' }, { status: 400 })

  // Arruma a escolha por pasta, pela ordem da galeria, nos campos do formulário
  const url = portal.settings?.selecao_url as string | undefined
  if (!ehGaleriaWfolio(url)) return NextResponse.json({ error: 'sem_galeria' }, { status: 400 })
  let pastas
  try { pastas = (await lerGaleriaWfolio(url!)).pastas } catch {
    return NextResponse.json({ error: 'Não foi possível ler a galeria. Tentem de novo daqui a pouco.' }, { status: 502 })
  }
  const escolhidas = new Set(sel)
  const campos: Partial<Record<CampoSelecao, string[]>> = {}
  for (const p of pastas) {
    const nomes = p.fotos.map(f => f.n).filter(n => escolhidas.has(n))
    if (!nomes.length) continue
    const lista = (campos[p.campo] ??= [])
    // Pastas que não têm campo próprio vão para Detalhes com o nome da pasta à frente
    if (p.campo === 'detalhes' && !/detal/i.test(p.nome)) lista.push(`${p.nome.toUpperCase()}: ${nomes[0]}`, ...nomes.slice(1))
    else lista.push(...nomes)
  }
  const junta = (c: CampoSelecao) => (campos[c]?.length ? campos[c]!.join(', ') : null)

  const nome = [portal.noiva, portal.noivo].filter(Boolean).join(' & ') || 'Novo Registo'
  const mapped: SelecaoFotos = {
    nome_noivos: nome,
    referencia: portal.referencia,
    date: portal.data ?? null,
    data_entrada: agora.slice(0, 10),
    preparacao: junta('preparacao'),
    sessao_noivos: junta('sessao_noivos'),
    fotos_noiva: junta('fotos_noiva'),
    fotos_noivo: junta('fotos_noivo'),
    convidados: junta('convidados'),
    cerimonia: junta('cerimonia'),
    bolo_bouquet: junta('bolo_bouquet'),
    sala_animacao: junta('sala_animacao'),
    // Fotos do álbum já enviadas pelo separador Álbum têm prioridade sobre a pasta
    fotos_album: (() => { const a = albumDe(portal.settings); const ok = a.enviada ? sel.filter(n => a.sel.includes(n)) : []; return ok.length ? ok.join(', ') : junta('fotos_album') })(),
    detalhes: junta('detalhes'),
  }

  const { id, error } = await saveSelecao(mapped, 'fotos-selecao-galeria')
  if (error) return NextResponse.json({ error }, { status: 500 })
  // Quem personaliza o álbum (perguntado aos noivos ao enviar): settings + Notas Privadas do portal
  const escolha: EscolhaAlbum | null = body.album === 'noivos' || body.album === 'rl' ? { quem: body.album, em: agora } : null
  const mais: Record<string, any> = {}
  if (escolha) {
    mais.album_escolha = escolha
    const bi = portal.settings?.briefingInfo ?? {}, pag = bi[PAGINA_NOTAS_PRIVADAS] ?? {}
    const linha = `ÁLBUM (${new Date(agora).toLocaleDateString('pt-PT', { timeZone: 'Europe/Lisbon' })}): ${textoEscolhaAlbum(escolha)}.`
    const nota = String(pag.notasPrivadas ?? '').trim()
    mais.briefingInfo = { ...bi, [PAGINA_NOTAS_PRIVADAS]: { ...pag, notasPrivadas: nota ? `${nota}

${linha}` : linha } }
  }
  await gravarEstado(portal.id, portal.settings, { sel, atualizado: agora, enviada: agora }, mais)

  const tipo = body.tipo === 'batizado' ? 'batizado' : 'casamento'
  await enviarEmailAdminSelecao(mapped, tipo, escolha ? textoEscolhaAlbum(escolha) : null).catch(e => console.error('[fotos-selecao-galeria] email falhou:', e))
  if (escolha) await registarFoto(portal.referencia, escolha.quem === 'noivos' ? 'Álbum: os noivos vão personalizar' : 'Álbum: personalização deixada à RL', 'Noivos')
  await enviarTicketFotos('recebida', portal.referencia).catch(() => null)
  await registarFoto(portal.referencia, 'Seleção recebida', 'Noivos')

  return NextResponse.json({ ok: true, id, estado: { sel, atualizado: agora, enviada: agora } })
}
