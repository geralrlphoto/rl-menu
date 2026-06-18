import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET: relatórios diários da equipa para UM evento (para o admin consultar na
// ficha). Devolve, por membro com relatório, o nome/status + relatorio_diario.
export async function GET(req: NextRequest) {
  const ref       = req.nextUrl.searchParams.get('ref')
  const evento_id = req.nextUrl.searchParams.get('evento_id')
  if (!ref && !evento_id) return NextResponse.json({ error: 'ref or evento_id required' }, { status: 400 })

  const supabase = db()

  const { data: fcs } = ref
    ? await supabase.from('freelancer_casamentos').select('id, freelancer_id, relatorio_diario').eq('referencia', ref)
    : await supabase.from('freelancer_casamentos').select('id, freelancer_id, relatorio_diario').eq('evento_id', evento_id!)

  const rows = (fcs ?? []).filter((r: any) => r.freelancer_id && r.relatorio_diario)
  const ids = Array.from(new Set(rows.map((r: any) => r.freelancer_id)))

  let relatorios: any[] = []
  if (ids.length) {
    const { data: fls } = await supabase.from('freelancers').select('id, nome, status').in('id', ids)
    relatorios = rows.map((r: any) => {
      const f = (fls ?? []).find((x: any) => x.id === r.freelancer_id)
      return { casamentoId: r.id, freelancerId: r.freelancer_id, nome: f?.nome ?? '—', status: f?.status ?? null, relatorio: r.relatorio_diario }
    })
  }

  // Lista de editores (para o admin poder enviar-lhes o relatório/conteúdo)
  const { data: eds } = await supabase
    .from('freelancers')
    .select('id, nome, email')
    .eq('status', 'EDITORES')
    .order('nome', { ascending: true })
  const editores = (eds ?? []).map((e: any) => ({ id: e.id, nome: e.nome, email: e.email }))

  return NextResponse.json({ relatorios, editores })
}
