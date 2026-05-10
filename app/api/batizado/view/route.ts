import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MASTER_TOKEN, buildSyncedContent } from '../_lib'

// Uses portal_template_settings table with key 'batizado_{token}'
// settings shape: { content: BatizadoContent }

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const pageId = `batizado_${token}`

  // Fetch settings and CRM contact in parallel
  const [{ data, error }, { data: crmContact }] = await Promise.all([
    supabase
      .from('portal_template_settings')
      .select('settings')
      .eq('page_id', pageId)
      .single(),
    supabase
      .from('crm_contacts')
      .select('reuniao_data,reuniao_hora,reuniao_tipo,reuniao_link,nome')
      .eq('page_token', token)
      .maybeSingle(),
  ])

  // CRM meeting data (auto-populates reunião card if admin saved it in CRM)
  const crm_reuniao = crmContact ? {
    data:  crmContact.reuniao_data  || '',
    hora:  crmContact.reuniao_hora  ? String(crmContact.reuniao_hora).slice(0, 5) : '',
    tipo:  crmContact.reuniao_tipo  || 'Presencial',
    link:  crmContact.reuniao_link  || '',
  } : null

  const crm_nome = crmContact?.nome || ''

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Page exists — return it
  if (data?.settings) {
    return NextResponse.json({
      maquete: { token, settings: data.settings },
      page_confirmacao: data.settings.page_confirmacao ?? null,
      proposta_resposta: data.settings.proposta_resposta ?? null,
      crm_reuniao,
      crm_nome,
    })
  }

  // ── New client page — initialise from master template ─────────────────────
  if (token !== MASTER_TOKEN) {
    const { data: master } = await supabase
      .from('portal_template_settings')
      .select('settings')
      .eq('page_id', `batizado_${MASTER_TOKEN}`)
      .single()

    if (master?.settings?.content) {
      const initialContent = buildSyncedContent(master.settings.content, {})
      const initialSettings = { content: initialContent }

      await supabase
        .from('portal_template_settings')
        .insert({ page_id: pageId, settings: initialSettings, updated_at: new Date().toISOString() })

      return NextResponse.json({
        maquete: { token, settings: initialSettings },
        page_confirmacao: null,
        proposta_resposta: null,
        crm_reuniao,
        crm_nome,
      })
    }
  }

  // Master doesn't exist yet
  return NextResponse.json({ maquete: { token, settings: {} }, page_confirmacao: null, proposta_resposta: null, crm_reuniao, crm_nome })
}
