import { NextRequest, NextResponse } from 'next/server'
import { COMO_CHEGOU_MAIL } from '@/lib/crm'
import { sbAdmin, UUID_RE } from '@/lib/preparacao'

/* Link pessoal do formulário (/nova-lead?lead=<id>), enviado às leads do Casamentos.pt que chegaram
   por email. Devolve só os dados que elas próprias deram, para o formulário vir preenchido. */

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? ''
  if (!UUID_RE.test(id)) return NextResponse.json({ lead: null })
  const { data } = await sbAdmin().from('crm_contacts')
    .select('nome, email, contato, data_casamento, tipo_evento, orcamento')
    .eq('id', id).eq('como_chegou', COMO_CHEGOU_MAIL).maybeSingle()
  if (!data) return NextResponse.json({ lead: null })
  const { orcamento, ...lead } = data
  return NextResponse.json({ lead, respondido: !!orcamento })
}
