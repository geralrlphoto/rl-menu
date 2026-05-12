import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MASTER_TOKEN, buildSyncedContent } from '../_lib'

// Uses portal_template_settings table with key 'batizado_{token}'
// settings shape: { content: BatizadoContent }

// Defaults usados quando o admin marcou data/hora/tipo mas não preencheu link
const MEET_LINK = 'https://meet.google.com/dih-etvh-xkh'
const MAPS_LINK = 'https://www.google.com/maps/place/RL+Photo.Video+(Casamentos,Batizados,Eventos)/@38.634382,-8.9147077,212m/data=!3m2!1e3!4b1!4m6!3m5!1s0xd19414ebaa9e467:0x1d9b63c70ffe06a!8m2!3d38.634381!4d-8.914064!16s%2Fg%2F11w219lx62?authuser=0&entry=ttu&g_ep=EgoyMDI2MDQxMi4wIKXMDSoASAFQAw%3D%3D'

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
      .select('reuniao_data,reuniao_hora,reuniao_tipo,reuniao_link,nome,page_content,proposta_pdf_url')
      .eq('page_token', token)
      .maybeSingle(),
  ])

  const crm_proposta_pdf_url = crmContact?.proposta_pdf_url || null

  // CRM meeting data (auto-populates reunião card if admin saved it in CRM)
  // Se o admin marcou data/hora/tipo mas deixou o link em branco, usar o
  // default consoante o tipo (Videochamada → Meet, Presencial → Maps) para
  // o cliente ver sempre o botão "Entrar na videochamada" / "Ver localização".
  const linkFallback = (tipo: string | null) => tipo === 'Videochamada' ? MEET_LINK : MAPS_LINK
  const crm_reuniao = crmContact ? {
    data:  crmContact.reuniao_data  || '',
    hora:  crmContact.reuniao_hora  ? String(crmContact.reuniao_hora).slice(0, 5) : '',
    tipo:  crmContact.reuniao_tipo  || 'Presencial',
    link:  crmContact.reuniao_link
      || (crmContact.reuniao_data && crmContact.reuniao_hora ? linkFallback(crmContact.reuniao_tipo) : ''),
  } : null

  const crm_nome = crmContact?.nome || ''

  // ── CRM page_content é a fonte autoritária dos propostas ──────────────────
  // O admin edita propostas em /crm/[id] e a edição é guardada em
  // crm_contacts.page_content. Aqui injectamos esses propostas no settings
  // do batizado para que o portal mostre o que o admin selecionou no CRM.
  const crmPc = typeof crmContact?.page_content === 'string'
    ? JSON.parse(crmContact.page_content || '{}')
    : (crmContact?.page_content || {})
  const crmPropostas = Array.isArray(crmPc?.propostas) ? crmPc.propostas : null
  const crmExtras    = Array.isArray(crmPc?.extras_proposta) ? crmPc.extras_proposta : null
  const crmPropostaCfg = crmPc?.proposta || null  // password + buttonLabel
  const crmPropostaAtiva = crmPc?.propostaPage?.propostaAtiva ?? crmPc?.proposta?.propostaAtiva

  function injectCrmIntoSettings(settings: any) {
    const s = settings || {}
    const content = s.content || {}
    const propostaPage = content.propostaPage || {}
    const merged = {
      ...s,
      content: {
        ...content,
        ...(crmPropostas    ? { propostas: crmPropostas }            : {}),
        ...(crmExtras       ? { extras_proposta: crmExtras }         : {}),
        proposta: { ...(content.proposta || {}), ...(crmPropostaCfg || {}) },
        propostaPage: {
          ...propostaPage,
          ...(crmPropostaAtiva !== undefined ? { propostaAtiva: crmPropostaAtiva } : {}),
        },
      },
    }
    return merged
  }

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Page exists — return it
  if (data?.settings) {
    const settings = injectCrmIntoSettings(data.settings)
    return NextResponse.json({
      maquete: { token, settings },
      page_confirmacao: settings.page_confirmacao ?? null,
      proposta_resposta: settings.proposta_resposta ?? null,
      crm_reuniao,
      crm_nome,
      crm_proposta_pdf_url,
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

      const settings = injectCrmIntoSettings(initialSettings)
      return NextResponse.json({
        maquete: { token, settings },
        page_confirmacao: null,
        proposta_resposta: null,
        crm_reuniao,
        crm_nome,
      })
    }
  }

  // Master doesn't exist yet — return empty settings but still inject CRM propostas if any
  const fallback = injectCrmIntoSettings({ content: {} })
  return NextResponse.json({ maquete: { token, settings: fallback }, page_confirmacao: null, proposta_resposta: null, crm_reuniao, crm_nome, crm_proposta_pdf_url })
}
