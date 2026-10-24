import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { lerData } from '@/app/media/_lib/eventos'
import { singular } from '@/app/media/equipa/categorias'
import BarraCredencial from './BarraCredencial'

// Credencial do kit RL PROD (fita ao peito): foto, nome, função e o cliente do projeto.
// Tamanho A6 vertical (105 × 148 mm), o das bolsas de credencial com fita.
// "Descarregar PDF" abre a impressão do browser já com o tamanho certo.

export const dynamic = 'force-dynamic'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const iniciais = (n: string) => n.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()

export default async function Credencial({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ projeto?: string }> }) {
  const { id } = await params
  const { projeto } = await searchParams

  const [{ data: m }, { data: ligacoes }] = await Promise.all([
    supabase.from('media_equipa').select('id, nome, categoria, foto_url').eq('id', id).maybeSingle(),
    supabase.from('media_equipa_projeto').select('projeto_ref, funcao').eq('membro_id', id).order('criado_em', { ascending: false }),
  ])
  if (!m) notFound()

  const refs = [...new Set((ligacoes ?? []).map(l => l.projeto_ref))]
  const { data: portais } = refs.length
    ? await supabase.from('media_portais').select('ref, nome:dados->>nome, cliente:dados->>cliente, filmagem:dados->>dataFilmagem').in('ref', refs)
    : { data: [] as { ref: string; nome: string | null; cliente: string | null; filmagem: string | null }[] }
  const opcoes = refs.map(ref => {
    const p = (portais ?? []).find(x => x.ref === ref)
    return { ref, nome: p?.nome || p?.cliente || ref }
  })

  const ref = projeto && refs.includes(projeto.toUpperCase()) ? projeto.toUpperCase() : refs[0] ?? null
  const p = (portais ?? []).find(x => x.ref === ref)
  const funcao = (ligacoes ?? []).find(l => l.projeto_ref === ref)?.funcao || singular(m.categoria)
  const cliente = p?.nome || p?.cliente || ''
  const data = lerData(p?.filmagem)
  const dataTxt = data ? data.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : ''

  return (
    <main className="rlp min-h-screen bg-[#0a1620] text-white print:bg-white print:min-h-0">
      <style>{`
        @page { size: 105mm 148mm; margin: 0; }
        @media print {
          html, body { background: #fff !important; margin: 0 !important; }
          [data-global-menu] { display: none !important; }
          .credencial { margin: 0 !important; box-shadow: none !important; }
        }
        .credencial { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>

      <BarraCredencial id={id} nome={m.nome} opcoes={opcoes} atual={ref} />

      <div className="flex justify-center px-4 pb-16 print:p-0">
        {/* A credencial: 105 × 148 mm */}
        <section className="credencial relative overflow-hidden flex flex-col shadow-2xl"
          style={{ width: '105mm', height: '148mm', background: 'linear-gradient(160deg, #0c2a44 0%, #00141f 55%, #000c13 100%)' }}>
          {/* furo da fita */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '5mm', width: '14mm', height: '3mm', borderRadius: '2mm', background: 'rgba(255,255,255,0.18)' }} />

          {/* topo */}
          <div className="flex items-center justify-between" style={{ padding: '12mm 8mm 0' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-rl-prod-branco.png" alt="RL PROD" style={{ width: '11mm', height: '11mm', objectFit: 'contain' }} />
            <span className="rlp-m" style={{ fontSize: '2.6mm', letterSpacing: '0.35em', color: '#a9c1ff' }}>EQUIPA</span>
          </div>

          {/* foto */}
          <div className="flex justify-center" style={{ marginTop: '7mm' }}>
            {m.foto_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={m.foto_url} alt="" style={{ width: '40mm', height: '40mm', borderRadius: '50%', objectFit: 'cover', border: '1.2mm solid #2e6cf6' }} />
              : <span className="rlp-t flex items-center justify-center" style={{ width: '40mm', height: '40mm', borderRadius: '50%', background: '#2e6cf6', fontSize: '15mm' }}>{iniciais(m.nome)}</span>}
          </div>

          {/* nome e função */}
          <div className="text-center" style={{ padding: '6mm 6mm 0' }}>
            <p className="rlp-t uppercase" style={{ fontSize: m.nome.length > 18 ? '7mm' : '8.5mm', lineHeight: 1 }}>{m.nome}</p>
            <p className="rlp-m uppercase" style={{ marginTop: '2.5mm', fontSize: '2.8mm', letterSpacing: '0.3em', color: '#5a8bff' }}>{funcao}</p>
          </div>

          {/* cliente */}
          <div className="mx-auto text-center" style={{ marginTop: '6mm', width: '85mm', padding: '3.5mm 4mm', borderTop: '0.3mm solid rgba(255,255,255,0.18)', borderBottom: '0.3mm solid rgba(255,255,255,0.18)' }}>
            <p className="rlp-m uppercase" style={{ fontSize: '2.3mm', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.5)' }}>Cliente</p>
            <p className="rlp-t uppercase" style={{ marginTop: '1.2mm', fontSize: cliente.length > 22 ? '4.6mm' : '5.6mm', lineHeight: 1.05 }}>{cliente || '·'}</p>
            {dataTxt && <p style={{ marginTop: '1.2mm', fontSize: '2.8mm', color: 'rgba(255,255,255,0.6)' }}>{dataTxt}</p>}
          </div>

          {/* faixa de baixo */}
          <div className="mt-auto flex items-center justify-between" style={{ background: '#2e6cf6', padding: '4mm 8mm' }}>
            <span className="rlp-t" style={{ fontSize: '5.5mm', letterSpacing: '0.04em' }}>STAFF · RL PROD</span>
            <span className="rlp-m" style={{ fontSize: '2.3mm', letterSpacing: '0.15em' }}>rlprod.pt</span>
          </div>
        </section>
      </div>
    </main>
  )
}
