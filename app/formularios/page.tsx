import Link from 'next/link'
import { CSS_BRIEFING } from '@/app/_briefing/estilo'
import ListaFormularios, { type Entradas } from './ListaFormularios'
import { sbAdmin } from '@/lib/preparacao'

// O contador de entradas do rollup muda a cada visita: sem cache
export const dynamic = 'force-dynamic'

async function entradasRollup(): Promise<Entradas> {
  try {
    const sb = sbAdmin()
    const desde = new Date(Date.now() - 30 * 864e5).toISOString()
    const [t, r] = await Promise.all([
      sb.from('rollup_entradas').select('id', { count: 'exact', head: true }),
      sb.from('rollup_entradas').select('id', { count: 'exact', head: true }).gte('criado_em', desde),
    ])
    if (t.error || r.error) return null
    return { total: t.count ?? 0, ultimos30: r.count ?? 0 }
  } catch { return null }
}

/* Formulários: todos os formulários que os noivos preenchem, num só sítio,
   para abrir e verificar sem andar à procura. Os que são de cada casal
   (briefing, pré-wedding) abrem na simulação /demo, onde nada é gravado. */

export default async function FormulariosPage() {
  const entradas = await entradasRollup()
  return (
    <main className="nlead" style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      <style>{CSS_BRIEFING}</style>
      <div className="fx-grain" aria-hidden="true" />
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: 'clamp(28px,5vh,56px) clamp(20px,4vw,48px) 80px' }}>
        <Link href="/secao/490653af-115b-4a9b-9d88-902c1a60f9c1" className="btn-ghost" style={{ marginBottom: 'clamp(30px,6vh,58px)' }}>
          ‹&nbsp; Voltar ao menu
        </Link>
        <header style={{ marginBottom: 'clamp(28px,5vh,44px)' }}>
          <p className="eyebrow">RL Photo &middot; Video &middot; Noivos</p>
          <h1 style={{ fontSize: 'clamp(42px,6vw,80px)', marginTop: '20px' }}>Formulários</h1>
          <div style={{ width: '48px', height: '1px', background: 'var(--g)', opacity: .6, marginTop: '26px' }} />
          <p className="lead" style={{ marginTop: '22px' }}>Todos os formulários que os noivos preenchem, pela ordem em que os recebem, e os portais que vêem.</p>
        </header>
        <ListaFormularios entradas={entradas} />
      </div>
    </main>
  )
}
