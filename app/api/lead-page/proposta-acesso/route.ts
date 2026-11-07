import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { portalFechado } from '@/lib/crm'

/* Proposta criativa (/r e /b): a password confere-se aqui e só depois saem as propostas e os valores.
   POST { token, password }. Sem password definida (portais antigos) abre com password vazia.
   A password tem 4 algarismos: 8 tentativas erradas em 15 minutos bloqueiam a seguinte. */

const EVENTO_PW_ERRADA = 'Password da proposta errada'
const MAX_ERROS = 8
const JANELA_MS = 15 * 60 * 1000

export async function POST(req: NextRequest) {
  const { token, password } = await req.json().catch(() => ({}))
  if (typeof token !== 'string' || !token) return NextResponse.json({ error: 'token required' }, { status: 400 })
  const tentativa = typeof password === 'string' ? password : ''

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const [{ data: c }, { data: bat }] = await Promise.all([
    sb.from('crm_contacts').select('id, status, reuniao_data, page_publicada, page_content').eq('page_token', token).maybeSingle(),
    sb.from('portal_template_settings').select('settings').eq('page_id', `batizado_${token}`).maybeSingle(),
  ])
  if (!c && !bat) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (c && (c.page_publicada === false || portalFechado(c))) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Como no portal: o que está no CRM manda; os batizados sem CRM usam a página deles
  const pc = (typeof c?.page_content === 'string' ? JSON.parse(c.page_content || '{}') : c?.page_content) ?? {}
  const conteudo = bat?.settings?.content ?? {}
  const certa = { ...(conteudo.proposta ?? {}), ...(pc.proposta ?? {}) }.password || ''

  if (c && certa) {
    const desde = new Date(Date.now() - JANELA_MS).toISOString()
    const { count } = await sb.from('crm_status_history').select('id', { count: 'exact', head: true })
      .eq('contact_id', c.id).eq('evento', EVENTO_PW_ERRADA).gte('created_at', desde)
    if ((count ?? 0) >= MAX_ERROS) return NextResponse.json({ error: 'Demasiadas tentativas. Tentem daqui a 15 minutos.' }, { status: 429 })
  }

  if (certa && tentativa !== certa) {
    if (c) await sb.from('crm_status_history').insert({ contact_id: c.id, evento: EVENTO_PW_ERRADA })
    return NextResponse.json({ error: 'Password incorreta' }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    propostas: Array.isArray(pc.propostas) ? pc.propostas : conteudo.propostas ?? null,
    extras_proposta: Array.isArray(pc.extras_proposta) ? pc.extras_proposta : conteudo.extras_proposta ?? null,
  })
}
