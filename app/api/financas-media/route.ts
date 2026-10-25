import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { contasPagamento } from '@/app/portal-media/_data/contasPagamento'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Só os campos usados (poupar egress); portais de teste ficam de fora
    const { data, error } = await supabase
      .from('media_portais')
      .select('ref, created_at, nome:dados->>nome, cliente:dados->>cliente, tipo:dados->>tipo, status:dados->>status, dataFilmagem:dados->>dataFilmagem, dataEntrega:dados->>dataEntrega, pagamentos:dados->pagamentos, registosPagamento:dados->registosPagamento, teste:dados->>teste')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const projetos = (data ?? []).filter((row: any) => row.teste !== 'true').map((row: any) => {
      const pagamentos: Array<{ descricao: string; valor: number; estado: string; data: string }> =
        Array.isArray(row.pagamentos) ? row.pagamentos : []
      const registos: Array<{ data: string; valor: number; fase?: string; metodo?: string; validado?: boolean; prestacao?: string }> =
        Array.isArray(row.registosPagamento) ? row.registosPagamento : []

      // Mesma conta do portal do cliente (registos, senão as prestações pagas)
      const { total: totalValor, pago: totalPago, emFalta } = contasPagamento({ pagamentos: pagamentos as any, registosPagamento: registos as any })
      const totalAtraso = pagamentos.filter(p => p.estado === 'em_atraso').reduce((s, p) => s + (Number(p.valor) || 0), 0)

      // Recebimentos com data, para o mês a mês da página Finanças
      const recebimentos = registos.length
        ? registos.map(r => ({ data: r.data, valor: Number(r.valor) || 0, descricao: r.prestacao || r.fase || 'Pagamento', validado: !!r.validado }))
        : pagamentos.filter(p => p.estado === 'pago').map(p => ({ data: p.data, valor: Number(p.valor) || 0, descricao: p.descricao, validado: true }))

      return {
        ref:          row.ref ?? '',
        nome:         row.nome ?? row.ref ?? '',
        cliente:      row.cliente ?? '',
        tipo:         row.tipo ?? '',
        status:       row.status ?? '',
        dataFilmagem: row.dataFilmagem ?? '',
        dataEntrega:  row.dataEntrega ?? '',
        pagamentos,
        recebimentos,
        totalValor,
        totalPago,
        totalPendente: Math.max(0, emFalta - totalAtraso),
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

    // Nome de todos os projetos (incluindo os de teste), só para mostrar nos movimentos
    const nomes: Record<string, string> = {}
    for (const row of (data ?? []) as any[]) nomes[String(row.ref).toUpperCase()] = row.nome || row.cliente || row.ref
    return NextResponse.json({ projetos, totais, total: projetos.length, nomes })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
