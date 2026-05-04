import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('media_portais')
      .select('ref, dados, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const projetos = (data ?? []).map((row: any) => {
      const d = row.dados ?? {}
      const pagamentos: Array<{ descricao: string; valor: number; estado: string; data: string }> =
        Array.isArray(d.pagamentos) ? d.pagamentos : []

      const totalValor    = pagamentos.reduce((s, p) => s + (Number(p.valor) || 0), 0)
      const totalPago     = pagamentos.filter(p => p.estado === 'pago').reduce((s, p) => s + (Number(p.valor) || 0), 0)
      const totalPendente = pagamentos.filter(p => p.estado === 'pendente').reduce((s, p) => s + (Number(p.valor) || 0), 0)
      const totalAtraso   = pagamentos.filter(p => p.estado === 'em_atraso').reduce((s, p) => s + (Number(p.valor) || 0), 0)

      return {
        ref:          row.ref ?? d.ref ?? '',
        nome:         d.nome ?? row.ref ?? '',
        cliente:      d.cliente ?? '',
        tipo:         d.tipo ?? '',
        status:       d.status ?? '',
        dataFilmagem: d.dataFilmagem ?? '',
        dataEntrega:  d.dataEntrega ?? '',
        pagamentos,
        totalValor,
        totalPago,
        totalPendente,
        totalAtraso,
        createdAt:    row.created_at,
      }
    })

    const totais = projetos.reduce(
      (acc, p) => {
        acc.faturado  += p.totalValor
        acc.recebido  += p.totalPago
        acc.pendente  += p.totalPendente
        acc.atraso    += p.totalAtraso
        return acc
      },
      { faturado: 0, recebido: 0, pendente: 0, atraso: 0 }
    )

    return NextResponse.json({ projetos, totais, total: projetos.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
