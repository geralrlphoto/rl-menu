import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CSS_BRIEFING } from '@/app/_briefing/estilo'
import ListaFormularios from './ListaFormularios'

/* Formulários: todos os formulários que os noivos preenchem, num só sítio,
   para abrir e verificar sem andar à procura. Os que dependem do casamento
   (briefing, pré-wedding) abrem com o casamento escolhido no topo. */

export const revalidate = 1800

export default async function FormulariosPage() {
  const hoje = new Date().toISOString().slice(0, 10)
  const { data } = await supabase.from('eventos_2026')
    .select('id, cliente, data_evento')
    .gte('data_evento', hoje)
    .order('data_evento', { ascending: true })
    .limit(80)

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
          <p className="lead" style={{ marginTop: '22px' }}>Todos os formulários que os noivos preenchem, pela ordem em que os recebem.</p>
        </header>
        <ListaFormularios eventos={(data ?? []).map((e: any) => ({ id: e.id, nome: e.cliente ?? '', data: e.data_evento }))} />
      </div>
    </main>
  )
}
