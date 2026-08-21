import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Sem force-dynamic: a cache em memória do servidor gere a frescura dos dados

// ── Supabase ──────────────────────────────────────────────────────────────────
function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ── Notion helpers ────────────────────────────────────────────────────────────
const SETTINGS_PREFIX = '__PORTAL_SETTINGS__:'

// Strips legacy __PORTAL_SETTINGS__ blocks from visible content and extracts
// their JSON as a fallback when Supabase has no record for this page yet.
function extractNotionSettings(blocks: any[]) {
  let notionSettingsBlockId: string | null = null
  let notionSettings: any = { hiddenNav: [] }
  const content = blocks.filter(b => {
    if (b.type !== 'paragraph') return true
    const text: string = b.paragraph?.rich_text?.[0]?.plain_text ?? ''
    if (text.startsWith(SETTINGS_PREFIX)) {
      notionSettingsBlockId = b.id
      try {
        const parsed = JSON.parse(text.slice(SETTINGS_PREFIX.length))
        notionSettings = { ...notionSettings, ...parsed }
      } catch {}
      return false // hide from visible blocks
    }
    return true
  })
  return { content, notionSettings, notionSettingsBlockId }
}

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const PAGE_ID = '311220116d8a80d29468e817ae7bb79f'

const notionHeaders = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
}

// ── In-memory block cache (content only — settings now come from Supabase) ───
declare global {
  var notionBlocksCache: Map<string, { blocks: any[]; notionSettings: any; notionSettingsBlockId: string | null; ts: number }> | undefined
}
if (!global.notionBlocksCache) global.notionBlocksCache = new Map()
const cache = global.notionBlocksCache
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

class NotionFetchError extends Error {
  status: number
  constructor(status: number, msg: string) {
    super(msg)
    this.name = 'NotionFetchError'
    this.status = status
  }
}

const espera = (ms: number) => new Promise(r => setTimeout(r, ms))

/**
 * Pedido ao Notion com repeticao em 429 e 5xx.
 * Antes fazia-se `if (!res.ok) break`, o que devolvia uma pagina vazia sem
 * qualquer sinal e depois ficava 10 minutos em cache. Agora falha alto.
 */
async function pedirNotion(url: string, tentativas = 3): Promise<any> {
  for (let i = 0; i < tentativas; i++) {
    const res = await fetch(url, { headers: notionHeaders, cache: 'no-store' })
    if (res.ok) return res.json()

    const recuperavel = res.status === 429 || res.status >= 500
    if (!recuperavel || i === tentativas - 1) {
      throw new NotionFetchError(res.status, `Notion respondeu ${res.status}`)
    }
    // Retry-After vem em segundos; limitado a 4s para nao prender o pedido
    const ra = Number(res.headers.get('retry-after'))
    const atraso = Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 4000) : 400 * 2 ** i
    console.warn(`[portais-clientes] Notion ${res.status}, repete em ${atraso}ms (${i + 1}/${tentativas})`)
    await espera(atraso)
  }
  throw new NotionFetchError(0, 'inalcancavel')
}

/** Corre `fn` sobre `itens` com no maximo `limite` pedidos simultaneos. */
async function mapaLimitado<T, R>(itens: T[], limite: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const saida = new Array<R>(itens.length)
  let proximo = 0
  const obreiro = async () => {
    while (proximo < itens.length) {
      const i = proximo++
      saida[i] = await fn(itens[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, obreiro))
  return saida
}

async function getBlocks(blockId: string): Promise<any[]> {
  const all: any[] = []
  let cursor: string | undefined

  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`)
    url.searchParams.set('page_size', '100')
    if (cursor) url.searchParams.set('start_cursor', cursor)

    const data = await pedirNotion(url.toString())
    all.push(...(data.results ?? []))
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  // Antes era Promise.all sobre todos os filhos, o que disparava dezenas de
  // pedidos ao mesmo tempo e era a propria causa dos 429. Agora vao a 3.
  const withChildren = all.filter(b => b.has_children)
  const childResults = await mapaLimitado(withChildren, 3, (b: any) => getBlocks(b.id))
  withChildren.forEach((b, i) => { b.children = childResults[i] })

  return all
}

// ── Content override helpers ──────────────────────────────────────────────────
// Applies admin text edits (stored in Supabase settings.contentOverrides) onto
// the Notion blocks so the rendered page reflects edits without touching Notion.
function applyContentOverrides(blocks: any[], overrides: Record<string, string>): any[] {
  return blocks.map(b => {
    let updated = { ...b }
    if (overrides[b.id] !== undefined) {
      const text = overrides[b.id]
      const rt = [{ type: 'text', text: { content: text }, plain_text: text,
        annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
        href: null }]
      updated = { ...updated, [b.type]: { ...(b[b.type] ?? {}), rich_text: rt } }
    }
    if (b.children && Array.isArray(b.children)) {
      updated = { ...updated, children: applyContentOverrides(b.children, overrides) }
    }
    return updated
  })
}

// ── GET handler ───────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') || PAGE_ID

    // Check if request comes from an authenticated admin
    const cookieHeader = (req as any).headers?.get?.('cookie') ?? ''
    const rlAuth = cookieHeader.split(';').map((c: string) => c.trim()).find((c: string) => c.startsWith('rl_auth='))?.split('=')?.[1]
    const isAdmin = !!rlAuth && rlAuth === process.env.AUTH_SECRET
    const bust = searchParams.get('bust') === '1'

    // ── 1. Fetch Notion blocks (cached, busted when requested) ────────────────
    let blocks: any[]
    let notionSettings: any = { hiddenNav: [] }
    let notionSettingsBlockId: string | null = null

    const cached = cache.get(id)
    if (!bust && cached && Date.now() - cached.ts < CACHE_TTL) {
      blocks = cached.blocks
      notionSettings = cached.notionSettings
      notionSettingsBlockId = cached.notionSettingsBlockId
    } else {
      try {
        const raw = await getBlocks(id)
        ;({ content: blocks, notionSettings, notionSettingsBlockId } = extractNotionSettings(raw))
        // So se guarda em cache o que veio bem: um resultado falhado ficava
        // 10 minutos a servir uma pagina em branco aos noivos.
        cache.set(id, { blocks, notionSettings, notionSettingsBlockId, ts: Date.now() })
      } catch (e: any) {
        console.error(`[portais-clientes] Notion falhou para ${id}: ${e?.status ?? '?'} ${e?.message ?? e}`)
        if (cached) {
          // Serve o ultimo conteudo bom, mesmo fora de validade. Melhor um
          // portal ligeiramente desactualizado do que um portal vazio.
          console.warn(`[portais-clientes] a servir cache expirada para ${id}`)
          blocks = cached.blocks
          notionSettings = cached.notionSettings
          notionSettingsBlockId = cached.notionSettingsBlockId
        } else {
          return NextResponse.json(
            { blocks: [], settings: { hiddenNav: [] }, settingsBlockId: null,
              error: 'notion_indisponivel', notionStatus: e?.status ?? 0 },
            { status: 503, headers: { 'Cache-Control': 'no-store' } }
          )
        }
      }
    }

    // ── 2. Fetch settings from Supabase (authoritative source) ────────────────
    let settings: any = notionSettings
    let settingsBlockId: string | null = notionSettingsBlockId

    try {
      const db = supabase()
      const { data: row } = await db
        .from('portal_template_settings')
        .select('settings')
        .eq('page_id', id)
        .single()

      if (row?.settings) {
        settings = row.settings
        settingsBlockId = null
      }
    } catch {
      // Supabase unavailable — fall back to Notion settings silently
    }

    // ── 3. Apply content overrides saved by admin (Supabase-first edits) ──────
    // Text edits made via BlockEditor are stored in contentOverrides rather than
    // written back to Notion, so they're applied here before serving to the client.
    if (settings.contentOverrides && typeof settings.contentOverrides === 'object') {
      blocks = applyContentOverrides(blocks, settings.contentOverrides)
    }

    // Strip password before sending to client
    const { portalPassword, ...safeSettings } = settings as any
    // Uma resposta sem blocos nunca deve ficar em cache no browser: era assim
    // que um erro passageiro do Notion deixava a pagina em branco 5 minutos.
    const cacheHeader = blocks.length > 0
      ? 'private, max-age=300, stale-while-revalidate=300'
      : 'no-store'
    return NextResponse.json(
      { blocks, settings: safeSettings, settingsBlockId, hasPassword: !!(portalPassword), isAdmin },
      { headers: { 'Cache-Control': cacheHeader } }
    )
  } catch (e: any) {
    console.error('[portais-clientes] Error:', e.message)
    return NextResponse.json(
      { blocks: [], settings: { hiddenNav: [] }, settingsBlockId: null },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
