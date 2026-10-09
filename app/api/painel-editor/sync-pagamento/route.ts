import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function addWorkingDays(dateStr: string, days: number): string | null {
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  let count = 0
  while (count < days) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return d.toISOString().split('T')[0]
}

// POST { referencia, editorNome, valor, local, data_casamento }
// Chamado pela ficha do evento quando muda o "Valor Editor Vídeo" ou o editor.
// Cria ou atualiza o pagamento pendente do editor em /painel-editor/pagamentos.
// Pagamentos já pagos ou cancelados não se tocam.
export async function POST(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado
  const { referencia, editorNome, valor, local, data_casamento } = await req.json().catch(() => ({}))
  if (!referencia || !editorNome) return NextResponse.json({ ok: true, skipped: 'sem referencia ou editor' })

  const supabase = db()
  const alvo = String(editorNome).toLowerCase().trim()
  const { data: fls } = await supabase.from('freelancers').select('id, nome')
  const editor = (fls ?? []).find((f: any) => String(f.nome ?? '').toLowerCase().trim() === alvo)
  if (!editor) return NextResponse.json({ error: 'Editor não encontrado na equipa' }, { status: 404 })

  const v = Number(valor) || 0
  const { data: existentes } = await supabase
    .from('freelancer_pagamentos').select('id, status')
    .eq('freelancer_id', editor.id).ilike('descricao', `${referencia}%`)

  if (existentes && existentes.length) {
    const pendentes = existentes.filter((p: any) => !['PAGO', 'CANCELADO'].includes(String(p.status ?? '').toUpperCase()))
    for (const p of pendentes) {
      await supabase.from('freelancer_pagamentos').update({ valor: v }).eq('id', p.id)
    }
    return NextResponse.json({ ok: true, atualizados: pendentes.length })
  }

  if (v <= 0) return NextResponse.json({ ok: true, skipped: 'sem valor' })
  const descricao = [referencia, String(local ?? '').trim()].filter(Boolean).join(' — ')
  const prazo = data_casamento ? addWorkingDays(String(data_casamento).slice(0, 10), 180) : null
  const { error } = await supabase.from('freelancer_pagamentos').insert({
    freelancer_id: editor.id, descricao, valor: v, data_prevista: prazo, status: 'PENDENTE',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, criado: true })
}
