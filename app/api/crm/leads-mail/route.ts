import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { exigeAdmin } from '@/lib/api-guard'
import { sbAdmin, hojeLisboa } from '@/lib/preparacao'
import { COMO_CHEGOU_MAIL, qualificarLead } from '@/lib/crm'
import { chaveTelefone, lerEmailCasamentos, telefoneDuvidoso } from '@/lib/leadsMail'

/* Botão "Leads Mail" do CRM: pede ao script do Gmail (scripts/leads-mail-gmail.gs, endereço em
   LEADS_MAIL_URL) os pedidos do Casamentos.pt e cria as leads que ainda não existem na Nova Entrada.
   Quem já existe, com o mesmo email ou telefone, fica como está. O Gmail só é lido ao carregar. */

type EmailBruto = { data?: string; texto?: string }

export async function POST(req: NextRequest) {
  const negado = exigeAdmin(req)
  if (negado) return negado

  const url = process.env.LEADS_MAIL_URL
  if (!url) return NextResponse.json({ error: 'O Gmail ainda não está ligado à app.' }, { status: 503 })

  const resposta = await fetch(url, { cache: 'no-store', redirect: 'follow' })
    .then(r => r.json()).catch(() => null) as { emails?: EmailBruto[] } | null
  if (!Array.isArray(resposta?.emails)) return NextResponse.json({ error: 'Não foi possível ler o Gmail.' }, { status: 502 })

  const sb = sbAdmin()
  const { data: existentes, error } = await sb.from('crm_contacts').select('email, contato')
  if (error) return NextResponse.json({ error: 'Não foi possível ler o CRM.' }, { status: 500 })
  const emails = new Set((existentes ?? []).map(c => (c.email ?? '').trim().toLowerCase()).filter(Boolean))
  const telefones = new Set((existentes ?? []).map(c => chaveTelefone(c.contato)).filter(t => t.length === 9))

  // Do mais antigo para o mais recente: se a mesma pessoa escreveu duas vezes, fica o 1.º pedido
  const lista = [...resposta.emails].sort((a, b) => String(a.data).localeCompare(String(b.data)))
  const novas: string[] = []
  let repetidas = 0, ilegiveis = 0

  for (const e of lista) {
    const lead = lerEmailCasamentos(e.texto ?? '')
    if (!lead) { ilegiveis++; continue }
    const tel = chaveTelefone(lead.contato)
    if ((lead.email && emails.has(lead.email)) || (tel.length === 9 && telefones.has(tel))) { repetidas++; continue }

    const hoje = hojeLisboa()
    const { error: falhou } = await sb.from('crm_contacts').insert({
      nome:            lead.nome,
      email:           lead.email,
      contato:         lead.contato,
      data_casamento:  lead.dataCasamento,
      tipo_evento:     'Casamento',
      como_chegou:     COMO_CHEGOU_MAIL,
      mensagem:        lead.mensagem,
      status:          'Por Contactar',
      lead_prioridade: qualificarLead('', lead.dataCasamento),
      data_entrada:    /^\d{4}-\d{2}-\d{2}/.test(e.data ?? '') ? e.data!.slice(0, 10) : hoje,
      ...(telefoneDuvidoso(lead.contato) ? { proxima_acao: 'Confirmar o indicativo do telefone antes do WhatsApp', proxima_acao_data: hoje } : {}),
    })
    if (falhou) { ilegiveis++; continue }
    novas.push(lead.nome)
    if (lead.email) emails.add(lead.email)
    if (tel.length === 9) telefones.add(tel)
  }

  if (novas.length) revalidateTag('photo-dashboard', { expire: 0 })
  return NextResponse.json({ ok: true, novas, repetidas, ilegiveis })
}
