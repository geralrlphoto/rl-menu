// Criação e entrega do portal dos noivos (casamento e batizado).
// Usado pelo botão "Criar portal" da ficha (/api/contrato-cps/aprovar) e pela
// entrega automática quando os noivos submetem o formulário do contrato.
import { createClient } from '@supabase/supabase-js'
import { gerarHeroGif, buildPortalEmailV2, primeiroNome } from '@/lib/portalEmail'
export const RESEND_KEY = process.env.RESEND_API_KEY!
export const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const BATIZADO_MASTER_TOKEN = 'batizado-maquete'
export const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'

// PAGE_ID da maquete batizado em portal_template_settings
// e ID da maquete casamento (para herdar pageTitles/hiddenNav nos novos portais)
const BATIZADO_TEMPLATE_PAGE_ID = '35b220116d8a811b99b7f6f26648c017'
const CASAMENTO_TEMPLATE_PAGE_ID = '311220116d8a80d29468e817ae7bb79f'

// Lê settings completas da maquete a partir de portal_template_settings
// (fonte autoritativa, igual ao /api/portais-clientes).
// Retorna TUDO exceto campos específicos do cliente (noiva/noivo/data/local/...)
async function fetchMaqueteSettings(pageId: string): Promise<Record<string, any>> {
  try {
    const sb = db()
    const { data } = await sb
      .from('portal_template_settings')
      .select('settings')
      .eq('page_id', pageId)
      .single()
    const s = data?.settings ?? {}
    // Remove campos que são específicos do cliente (não devem ser herdados)
    const {
      referencia: _r,
      noiva: _n,
      noivo: _o,
      data: _d,
      dataFormatada: _df,
      local: _l,
      nomeCrianca: _nc,
      idadeCrianca: _ic,
      portalPassword: _pw,
      // Específicos do evento da maquete — NÃO copiar para novos portais
      contratoUrl: _cu,
      contratoDisponivel: _cd,
      tasks: _t,
      preWeddingSlots: _pws,
      preWeddingReservedSlotId: _prsid,
      preWeddingReservedAt: _prat,
      // BookingSection — reserva e ativação são específicas de cada portal
      bookingActive: _ba,
      bookingType: _bt,
      bookingSlots: _bs,
      bookingReservedSlotId: _brsid,
      bookingReservedAt: _brat,
      activeNavId: _ani,
      // Valores monetários da maquete (não fazem sentido para outros clientes)
      valorFoto: _vf,
      valorVideo: _vv,
      valorExtras: _ve,
      valorTotal: _vt,
      ...inherited
    } = s
    return inherited
  } catch {
    return {}
  }
}

export function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Um portal só conta como criado quando a row tem mesmo a identidade dos
// noivos. Uma row nascida de um PATCH de settings (ex.: marcar o contrato como
// disponível) existe mas está vazia — e o portal abre sem nomes nem data.
export async function portalCompleto(sb: ReturnType<typeof db>, ref: string): Promise<boolean> {
  const { data } = await sb
    .from('portais')
    .select('noiva, noivo, data')
    .ilike('referencia', ref)
    .maybeSingle()
  if (!data) return false
  return !!((data.noiva || data.noivo) && data.data)
}

export function fmtData(d: string | null | undefined): string {
  if (!d) return ''
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  } catch { return d ?? '' }
}

// ─── Cria portal de casamento (tabela `portais`) ─────────────────────────────
// Herda pageTitles/hiddenNav/etc. da maquete casamento para que sub-páginas
// renomeadas pelo admin e itens escondidos apareçam corretamente.
export async function criarPortalCasamento(ref: string, dados: any, password: string, extra: Record<string, any> = {}) {
  const sb = db()
  const maquete = await fetchMaqueteSettings(CASAMENTO_TEMPLATE_PAGE_ID)
  const valores = await fetchValoresEvento(sb, ref)
  // Settings já guardadas (contratoUrl, tarefas, notificações…) — recriar o
  // portal para o repor não pode apagar o que o admin já tinha configurado.
  const { data: existenteRow } = await sb.from('portais').select('settings').ilike('referencia', ref).maybeSingle()
  const existente = (existenteRow?.settings ?? {}) as Record<string, any>
  const row = {
    referencia: ref,
    noiva: dados.nome_noiva ?? null,
    noivo: dados.nome_noivo ?? null,
    data: dados.data_casamento ?? null,
    data_formatada: fmtData(dados.data_casamento),
    local: dados.local_cerimonia ?? null,
    settings: {
      // PRIMEIRO: tudo herdado da maquete (hero/galeria/parceiros/headers/etc)
      ...maquete,
      // DEPOIS: o que já estava guardado neste portal
      ...existente,
      // POR FIM: campos específicos do cliente (sobrescrevem tudo)
      referencia: ref,
      noiva: dados.nome_noiva ?? '',
      noivo: dados.nome_noivo ?? '',
      data: dados.data_casamento ?? '',
      dataFormatada: fmtData(dados.data_casamento),
      local: dados.local_cerimonia ?? '',
      tipoPortal: 'casamento',
      portalPassword: password,
      // O contrato foi aprovado pelo admin antes deste passo (botão
      // "Criar Portal" só aparece depois do contrato estar aprovado).
      // Marca como disponível para o cliente ver imediatamente.
      contratoDisponivel: true,
      // Valores da ficha do cliente (eventos_YYYY) — para o portal mostrar
      // TOTAL DO SERVIÇO correctamente em vez de €0.
      ...valores,
      // Ajustes de quem cria (ex.: entrega automática deixa o contrato por aprovar)
      ...extra,
    },
    updated_at: new Date().toISOString(),
  }
  const { error } = await sb.from('portais').upsert(row, { onConflict: 'referencia' })
  if (error) throw new Error(`portal casamento: ${error.message}`)
  return `${SITE_BASE}/portal-cliente/ref/${encodeURIComponent(ref)}`
}

// ─── Cria portal de batizado (mesma tabela `portais` que casamento) ──────────
// Estrutura idêntica ao portal de casamento — só muda settings.tipoPortal
// e adiciona dados específicos da criança.
// Copia pageTitles/hiddenNav/guiaLinks/etc. da maquete batizado para que o
// novo portal apareça com a estrutura batizado (GUIA DOS PAIS, CRONOGRAMA
// BATIZADO, etc.) em vez do default casamento.
export async function criarPortalBatizado(ref: string, dados: any, password: string, extra: Record<string, any> = {}) {
  const sb = db()
  const maquete = await fetchMaqueteSettings(BATIZADO_TEMPLATE_PAGE_ID)
  const valores = await fetchValoresEvento(sb, ref)
  // Ver nota em criarPortalCasamento: preserva as settings já guardadas.
  const { data: existenteRow } = await sb.from('portais').select('settings').ilike('referencia', ref).maybeSingle()
  const existente = (existenteRow?.settings ?? {}) as Record<string, any>
  const row = {
    referencia: ref,
    noiva: dados.nome_noiva ?? null,  // mãe — reutiliza campo "noiva"
    noivo: dados.nome_noivo ?? null,  // pai — reutiliza campo "noivo"
    data: dados.data_casamento ?? null,
    data_formatada: fmtData(dados.data_casamento),
    local: dados.local_cerimonia ?? null,
    settings: {
      // PRIMEIRO: tudo herdado da maquete (hero/galeria/parceiros/headers/etc)
      ...maquete,
      // DEPOIS: o que já estava guardado neste portal
      ...existente,
      // POR FIM: campos específicos do cliente (sobrescrevem tudo)
      referencia: ref,
      noiva: dados.nome_noiva ?? '',
      noivo: dados.nome_noivo ?? '',
      data: dados.data_casamento ?? '',
      dataFormatada: fmtData(dados.data_casamento),
      local: dados.local_cerimonia ?? '',
      tipoPortal: 'batizado',
      nomeCrianca:  dados.nome_crianca  ?? '',
      idadeCrianca: dados.idade_crianca ?? '',
      portalPassword: password,
      // O contrato foi aprovado pelo admin antes deste passo. Marca como
      // disponível para os pais verem imediatamente.
      contratoDisponivel: true,
      // Valores da ficha do cliente (eventos_YYYY) — para o portal mostrar
      // TOTAL DO SERVIÇO correctamente em vez de €0.
      ...valores,
      // Ajustes de quem cria (ex.: entrega automática deixa o contrato por aprovar)
      ...extra,
    },
    updated_at: new Date().toISOString(),
  }
  const { error } = await sb.from('portais').upsert(row, { onConflict: 'referencia' })
  if (error) throw new Error(`portal batizado: ${error.message}`)
  return `${SITE_BASE}/portal-batizado/ref/${encodeURIComponent(ref)}`
}

/** Lê os valores do serviço (foto, vídeo, extras, total) da ficha do cliente
 *  em eventos_YYYY (Supabase). Devolve um objecto para fazer ...spread nos
 *  settings do portal. Se o evento não existir ou não tiver valores, devolve
 *  objecto vazio (sem propriedades) — assim não sobrescreve maquete com nulls. */
async function fetchValoresEvento(sb: any, referencia: string): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  for (const t of ['eventos_2026', 'eventos_2027']) {
    try {
      const { data } = await sb.from(t)
        .select('valor_foto, valor_video, valor_liquido, valor_real_foto')
        .eq('referencia', referencia)
        .maybeSingle()
      if (data) {
        const vf = Number(data.valor_foto ?? 0)
        const vv = Number(data.valor_video ?? 0)
        // valor_liquido pode ser o total combinado ou só vídeo (depende do mapeamento)
        // — usamos como fallback se foto+vídeo não dão total
        const vt = vf + vv > 0 ? vf + vv : Number(data.valor_liquido ?? 0)
        if (vf > 0) out.valorFoto = vf
        if (vv > 0) out.valorVideo = vv
        if (vt > 0) out.valorTotal = vt
        return out
      }
    } catch { /* tabela pode não existir */ }
  }
  return out
}

// ─── Email ao cliente com link do portal ──────────────────────────────────────
// Design aprovado a 2026-10-07 (lib/portalEmail.ts): hero animado gerado com
// os nomes e a data de cada casal/criança, guardado em portal-images.
export async function buildPortalEmail(opts: {
  contrato: any
  referencia: string
  tipo: 'casamento' | 'batizado'
  password: string
  emailCliente: string
}): Promise<string> {
  const c = opts.contrato
  let nomes: string
  if (opts.tipo === 'batizado') {
    nomes = primeiroNome(c.nome_crianca) || String(c.nome_noivos || '').trim()
  } else {
    const a = primeiroNome(c.nome_noiva)
    const b = primeiroNome(c.nome_noivo)
    nomes = a && b ? `${a} | ${b}` : String(c.nome_noivos || '').split(/\s*(?:&|e)\s*/i).map(primeiroNome).filter(Boolean).join(' | ')
  }
  if (!nomes) nomes = opts.referencia

  // Hero animado; se falhar, usa a foto de fundo sem nomes
  let heroUrl = `${SITE_BASE}/email/${opts.tipo}-bg.jpg`
  try {
    const gif = await gerarHeroGif({ tipo: opts.tipo, nomes, data: c.data_casamento })
    const file = `email-portal/${opts.referencia}-${Date.now()}.gif`
    const { error } = await db().storage.from('portal-images').upload(file, gif, { contentType: 'image/gif', upsert: true })
    if (error) throw error
    heroUrl = db().storage.from('portal-images').getPublicUrl(file).data.publicUrl
  } catch (e) {
    console.error('[portalCriar] hero gif', e)
  }

  return buildPortalEmailV2({
    tipo: opts.tipo,
    heroUrl,
    nomesAlt: nomes,
    data: c.data_casamento,
    email: opts.emailCliente,
    password: opts.password,
    loginUrl: opts.tipo === 'batizado' ? `${SITE_BASE}/login-batizado` : `${SITE_BASE}/login-noivos`,
    siteBase: SITE_BASE,
  })
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: [to], subject, html,
      }),
    })
    return res.ok
  } catch { return false }
}

// ─── Entrega automática (formulário do contrato submetido pelos noivos) ──────

/* Password fácil de escrever: palavra + 4 algarismos (o login ignora maiúsculas) */
const PALAVRAS = ['rosa', 'luz', 'mar', 'sol', 'lua', 'flor', 'ouro', 'alma', 'brisa', 'aurora', 'jardim', 'estrela', 'oliva', 'coral', 'linho', 'seda']
export function passwordAleatoria(): string {
  const palavra = PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)]
  return `${palavra}${Math.floor(1000 + Math.random() * 9000)}`
}

/* Escolhe ao acaso uma referência livre (CAS_NNN_AA_RL / BAT_…) e bloqueia-a logo:
   cria a linha em `portais`, cuja referência é única, por isso dois formulários ao
   mesmo tempo nunca ficam com a mesma. Livre = não usada em eventos, portais nem
   contratos, contando o número com qualquer sufixo (_RL, _JR) ou sem zeros. */
export async function reservarReferencia(sb: ReturnType<typeof db>, prefix: string, anoSufixo: string): Promise<string> {
  const [ev, po, cps] = await Promise.all([
    sb.from('eventos_2026').select('referencia').ilike('referencia', `${prefix}_%`),
    sb.from('portais').select('referencia').ilike('referencia', `${prefix}_%`),
    sb.from('dados_contrato_cps').select('referencia_evento').ilike('referencia_evento', `${prefix}_%`).then(r => ({ data: (r.data ?? []).map((x: any) => ({ referencia: x.referencia_evento })) }), () => ({ data: [] })),
  ])
  const usados = new Set<number>()
  for (const r of [...(ev.data ?? []), ...(po.data ?? []), ...(cps.data ?? [])]) {
    const partes = String((r as any).referencia ?? '').toUpperCase().split('_')
    const n = parseInt(partes[1] ?? '', 10)
    if (partes[0] === prefix && partes[2] === anoSufixo && Number.isFinite(n)) usados.add(n)
  }
  const teto = Math.max(0, ...usados) + 20
  const livres: number[] = []
  for (let n = 1; n <= Math.min(teto, 999); n++) if (!usados.has(n)) livres.push(n)
  for (let tentativa = 0; tentativa < 10 && livres.length; tentativa++) {
    const k = Math.floor(Math.random() * livres.length)
    const ref = `${prefix}_${String(livres[k]).padStart(3, '0')}_${anoSufixo}_RL`
    livres.splice(k, 1)
    const { error } = await sb.from('portais').insert({ referencia: ref, settings: { referencia: ref, reservadaEm: new Date().toISOString() } })
    if (!error) return ref
    if (error.code !== '23505') throw new Error(`reservar referência: ${error.message}`)
  }
  throw new Error('Sem referências livres')
}

const numEur = (v: unknown) => { const n = Number(String(v ?? '').replace(/[^\d,]/g, '').replace(',', '.')); return isFinite(n) ? n : 0 }

/* Passa o pacote aceite para a ficha do evento (Supabase + Notion), que é de onde
   o contrato lê serviços, valores e o pacote (o prazo do vídeo segue o pacote).
   O valor do pacote vai inteiro para "valor foto": a proposta não separa foto/vídeo. */
async function aplicarPropostaAoEvento(sb: ReturnType<typeof db>, ref: string, aceite: any) {
  const { data: ev } = await sb.from('eventos_2026').select('id, notion_id').eq('referencia', ref).maybeSingle()
  if (!ev) return null
  if (!aceite?.nome) return ev
  const valorPacote = numEur(aceite.valor)
  const extras = (aceite.extras || []) as { nome: string; valor: string }[]
  const valorExtras = extras.reduce((a, e) => a + numEur(e.valor), 0)
  await sb.from('eventos_2026').update({
    servico_foto: aceite.servicos_foto || [],
    servico_video: aceite.servicos_video || [],
    ...(valorPacote > 0 ? { valor_foto: valorPacote } : {}),
  }).eq('id', ev.id)

  if (ev.notion_id && process.env.NOTION_TOKEN) {
    const ms = (l: string[]) => ({ multi_select: l.filter(Boolean).map(n => ({ name: String(n).replace(/,/g, ' ').slice(0, 100) })) })
    const props: Record<string, any> = {
      'REFERÊNCIA DO EVENTO': { title: [{ text: { content: ref } }] },
      'PROPOSTA ESCOLHIDA': { select: { name: aceite.nome } },
      'serviço de fotografia': ms(aceite.servicos_foto || []),
      'serviço de video': ms(aceite.servicos_video || []),
      ...(valorPacote > 0 ? { 'VALOR SERVIÇO FOTO': { number: valorPacote } } : {}),
      ...(extras.length ? { 'SERVIÇO EXTRA': ms(extras.map(e => e.nome)), 'VALOR DOS EXTRAS': { number: valorExtras } } : {}),
    }
    const patch = (properties: Record<string, any>) => fetch(`https://api.notion.com/v1/pages/${ev.notion_id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${process.env.NOTION_TOKEN}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
      body: JSON.stringify({ properties }),
    })
    // Se alguma propriedade não existir no Notion, fica pelo menos a referência
    const r = await patch(props).catch(() => null)
    if (!r?.ok) await patch({ 'REFERÊNCIA DO EVENTO': props['REFERÊNCIA DO EVENTO'] }).catch(() => null)
  }
  return ev
}

/* Cria o portal com password ao acaso e envia o email do portal aos noivos.
   O contrato fica logo aprovado e disponível, com os serviços, valores e prazos do
   pacote que os noivos aceitaram no portal da reunião (crmToken). */
export async function entregarPortalAutomatico(ref: string, contrato: any, crmToken: string | null) {
  const sb = db()
  const tipo: 'casamento' | 'batizado' = contrato.tipo_evento === 'batizado' ? 'batizado' : 'casamento'
  const password = passwordAleatoria()

  // bloqueioAteAdjudicacao: só Contrato e Pagamentos abrem até à adjudicação paga + contrato assinado
  const extra: Record<string, any> = { bloqueioAteAdjudicacao: true, entregaAutomatica: new Date().toISOString() }
  let aceite: any = null
  if (crmToken) {
    extra.propostaToken = crmToken
    const { data: c } = await sb.from('crm_contacts').select('page_content').eq('page_token', crmToken).maybeSingle()
    const pc = typeof c?.page_content === 'string' ? JSON.parse(c.page_content || '{}') : (c?.page_content || {})
    aceite = pc.propostaAceite ?? null
    const total = numEur(aceite?.valor) + ((aceite?.extras || []) as { valor: string }[]).reduce((a, e) => a + numEur(e.valor), 0)
    if (total > 0) extra.valorTotal = total
  }

  // Contrato aprovado automaticamente (é sempre o mesmo modelo)
  const ev = await aplicarPropostaAoEvento(sb, ref, aceite)
  if (ev?.id) {
    extra.contratoDisponivel = true
    extra.contratoUrl = `/eventos-2026/${ev.id}/contrato`
    await sb.from('dados_contrato_cps').update({ contrato_aprovado_em: new Date().toISOString() }).eq('referencia_evento', ref)
  } else {
    extra.contratoDisponivel = false
  }

  const portalUrl = tipo === 'batizado'
    ? await criarPortalBatizado(ref, contrato, password, extra)
    : await criarPortalCasamento(ref, contrato, password, extra)
  await sb.from('dados_contrato_cps').update({ aprovado_em: new Date().toISOString() }).eq('referencia_evento', ref)

  const clienteEmail = contrato.email_noiva || contrato.email_noivo
  const enviado = clienteEmail
    ? await sendEmail(
        clienteEmail,
        tipo === 'batizado' ? '👶 O portal do batizado está pronto' : '💍 O portal do casamento está pronto',
        await buildPortalEmail({ contrato, referencia: ref, tipo, password, emailCliente: clienteEmail }),
      )
    : false
  return { portalUrl, password, enviado, clienteEmail: clienteEmail ?? null }
}
