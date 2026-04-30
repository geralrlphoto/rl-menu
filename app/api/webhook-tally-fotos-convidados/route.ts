import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Webhook Tally — Fotografias Convidados (https://tally.so/r/w56N86)

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getField(fields: any[], ...labels: string[]): string | null {
  for (const label of labels) {
    const f = fields.find(
      (f: any) => f.label?.trim().toLowerCase() === label.trim().toLowerCase()
    )
    if (f && f.value !== null && f.value !== undefined) {
      const v = String(f.value).trim()
      if (v) return v
    }
  }
  return null
}

function getChoiceLabel(fields: any[], ...labels: string[]): string | null {
  for (const label of labels) {
    const f = fields.find(
      (f: any) => f.label?.trim().toLowerCase() === label.trim().toLowerCase()
    )
    if (!f) continue
    const options: any[] = f.options ?? []
    const value = Array.isArray(f.value) ? f.value[0] : f.value
    if (!value) continue
    if (options.length > 0) {
      const opt = options.find((o: any) => o.id === value || o.text === value)
      if (opt?.text) return opt.text
    }
    return String(value)
  }
  return null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const fields: any[] = body?.data?.fields ?? []

    const tipo_pedido       = getChoiceLabel(fields, 'Tipo de Pedido', 'tipo de pedido')
    const data_casamento    = getField(fields, 'Data do Casamento', 'data do casamento')
    const nome_noivos       = getField(fields, 'Nome dos Noivos', 'nome dos noivos')
    const nome_convidado    = getField(fields, 'Nome do Convidado', 'nome do convidado')
    const contato           = getField(fields, 'Contato', 'contacto', 'telefone')
    const email             = getField(fields, 'Email', 'e-mail')
    const morada            = getField(fields, 'Morada', 'morada')
    const tipo_entrega      = getChoiceLabel(fields, 'Tipo de Entrega', 'tipo de entrega')
    const numero_fotografias = getField(fields, 'N.º das Fotografias', 'numero das fotografias', 'nº das fotografias', 'número das fotografias')
    const mensagem          = getField(fields, 'Mensagem', 'mensagem')

    const { error } = await db().from('fotos_convidados').insert({
      tipo_pedido,
      data_casamento,
      nome_noivos,
      nome_convidado,
      contato,
      email,
      morada,
      tipo_entrega,
      numero_fotografias,
      mensagem,
      status: 'NOVO',
    })

    if (error) {
      console.error('[fotos-convidados webhook]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[fotos-convidados webhook]', err)
    return NextResponse.json({ error: err?.message ?? 'erro' }, { status: 500 })
  }
}
