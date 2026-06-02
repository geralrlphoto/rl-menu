/* ============================================================
   /api/media-portal/all-notifications (GET)

   Agrega notificações vindas dos clientes em TODOS os portais
   /media/portal-cliente (tabela media_portais). Fonte:
     - dados.notify_log[]       → genéricos (briefing-pedido,
                                  roadmap-status, etc.)
     - dados.notify_fase_log[]  → Workflow v2 (mudanças de fase
                                  notificadas pelo admin — aqui
                                  servem apenas para auditoria; em
                                  princípio não vêm do cliente, mas
                                  incluem-se na bandeja "tudo")
     - dados.chatMensagens[] com isAdmin === false → mensagens do
                                  cliente que ainda não foram lidas

   Response: { ok: true, items: [...] }
     onde cada item tem:
       kind: 'briefing-pedido' | 'roadmap-status' | 'fase' | 'chat' | 'generic'
       portalRef: string
       portalNome: string
       title: string
       body: string
       at: ISO string
       meta?: any
       href?: string  (link para abrir directamente o sítio relevante)

   Tolerante a falhas: devolve [] em vez de 500.
   ============================================================ */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

type Item = {
  id: string
  kind: 'briefing-pedido' | 'roadmap-status' | 'fase' | 'chat' | 'generic'
  portalRef: string
  portalNome: string
  title: string
  body: string
  at: string
  meta?: any
  href?: string
}

export async function GET() {
  try {
    const { data: rows } = await db()
      .from('media_portais')
      .select('ref,dados')

    const items: Item[] = []
    for (const row of rows ?? []) {
      const ref = String(row.ref ?? '').toUpperCase()
      const dados = (row.dados ?? {}) as Record<string, any>
      const nome = String(dados.nome ?? ref)

      // 1) notify_log (genéricos vindos de várias páginas; inclui
      //    type === 'briefing-pedido' e 'roadmap-status')
      const log: any[] = Array.isArray(dados.notify_log) ? dados.notify_log : []
      for (const n of log) {
        if (!n?.at) continue
        const t = String(n.type ?? 'generic') as Item['kind']
        const kind: Item['kind'] =
          t === 'briefing-pedido' ? 'briefing-pedido' :
          t === 'roadmap-status'  ? 'roadmap-status'  :
          t === 'fase'             ? 'fase'           :
          'generic'
        const href =
          kind === 'briefing-pedido' ? `/portal-media/${ref}/briefing?admin=1` :
          kind === 'roadmap-status'  ? `/portal-media/${ref}/roadmap?admin=1`  :
          kind === 'fase'            ? `/portal-media/${ref}/workflow?admin=1` :
          `/portal-media/${ref}?admin=1`
        items.push({
          id: `${ref}:notify:${n.at}:${Math.random().toString(36).slice(2,6)}`,
          kind,
          portalRef: ref,
          portalNome: nome,
          title: String(n.title ?? '').trim() || 'Atualização',
          body:  String(n.body  ?? '').trim(),
          at: String(n.at),
          meta: n.meta ?? null,
          href,
        })
      }

      // 2) notify_fase_log (Workflow v2 — notificações de fase enviadas
      //    pelo admin ao cliente; aparecem no histórico mas indicam o
      //    fluxo aberto)
      const faseLog: any[] = Array.isArray(dados.notify_fase_log) ? dados.notify_fase_log : []
      for (const n of faseLog) {
        if (!n?.at) continue
        items.push({
          id: `${ref}:fase:${n.at}:${Math.random().toString(36).slice(2,6)}`,
          kind: 'fase',
          portalRef: ref,
          portalNome: nome,
          title: n?.phase?.name
            ? `Fase ${n.phase.n ?? ''} · ${n.phase.name}`.trim()
            : 'Atualização da fase',
          body: n?.phase?.state ? `Estado: ${n.phase.state}` : '',
          at: String(n.at),
          meta: { phase: n?.phase ?? null },
          href: `/portal-media/${ref}/workflow?admin=1`,
        })
      }

      // 3) Mensagens de chat enviadas pelo cliente (!isAdmin)
      const chat: any[] = Array.isArray(dados.chatMensagens) ? dados.chatMensagens : []
      for (const m of chat) {
        if (!m?.criadoEm) continue
        if (m?.isAdmin) continue // só queremos as do cliente
        items.push({
          id: `${ref}:chat:${m.id ?? m.criadoEm}`,
          kind: 'chat',
          portalRef: ref,
          portalNome: nome,
          title: m?.autor ? `Mensagem · ${m.autor}` : 'Nova mensagem',
          body: String(m.texto ?? '').trim().slice(0, 140),
          at: String(m.criadoEm),
          href: `/portal-media/${ref}/atendimento?admin=1`,
        })
      }
    }

    // ordenar desc por data
    items.sort((a, b) => String(b.at).localeCompare(String(a.at)))

    return NextResponse.json({ ok: true, items: items.slice(0, 200) })
  } catch {
    return NextResponse.json({ ok: true, items: [] })
  }
}
