import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { lerData } from '@/app/media/_lib/eventos'
import { singular, type FichaDados } from '@/app/media/equipa/categorias'
import CredencialFaces from '../CredencialFaces'
import BarraCredenciais from './BarraCredenciais'

// Credenciais de um projeto: uma (frente e verso) por cada pessoa do staff nomeada
// na Equipa do projeto. ?membro=<id> mostra só uma. "Descarregar PDF" = impressão A6.

export const dynamic = 'force-dynamic'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export default async function CredenciaisProjeto({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<{ membro?: string }> }) {
  const { ref: refRaw } = await params
  const { membro } = await searchParams
  const ref = refRaw.toUpperCase()

  const [{ data: portal }, { data: ligacoes }] = await Promise.all([
    supabase.from('media_portais').select('nome:dados->>nome, cliente:dados->>cliente, filmagem:dados->>dataFilmagem, local:dados->>local, gestorNome:dados->>gestorNome, gestorTelefone:dados->>gestorTelefone').eq('ref', ref).maybeSingle(),
    supabase.from('media_equipa_projeto').select('membro_id, funcao').eq('projeto_ref', ref).not('membro_id', 'is', null).order('criado_em'),
  ])
  if (!portal) notFound()
  const pj = portal as { nome: string | null; cliente: string | null; filmagem: string | null; local: string | null; gestorNome: string | null; gestorTelefone: string | null }

  const ids = (ligacoes ?? []).map(l => l.membro_id as string)
  const { data: membros } = ids.length
    ? await supabase.from('media_equipa').select('id, nome, categoria, foto_url, dados').in('id', ids)
    : { data: [] as { id: string; nome: string; categoria: string; foto_url: string | null; dados: FichaDados | null }[] }

  const equipa = (ligacoes ?? []).map(l => {
    const m = (membros ?? []).find(x => x.id === l.membro_id)
    return m ? { m, funcao: l.funcao || singular(m.categoria) } : null
  }).filter(Boolean) as { m: { id: string; nome: string; categoria: string; foto_url: string | null; dados: FichaDados | null }; funcao: string }[]

  const visiveis = membro ? equipa.filter(e => e.m.id === membro) : equipa
  const data = lerData(pj.filmagem)
  const projeto = {
    cliente: pj.nome || pj.cliente || '',
    dataTxt: data ? data.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : '',
    local: pj.local, gestorNome: pj.gestorNome, gestorTelefone: pj.gestorTelefone,
  }

  return (
    <main className="rlp min-h-screen bg-[#0a1620] text-white print:bg-white print:min-h-0">
      <style>{`
        @page { size: 105mm 148mm; margin: 0; }
        @media print {
          html, body { background: #fff !important; margin: 0 !important; }
          [data-global-menu] { display: none !important; }
          .faces, .par { display: block !important; gap: 0 !important; padding: 0 !important; }
          .credencial { margin: 0 !important; box-shadow: none !important; break-after: page; page-break-after: always; }
          .par:last-child .face:last-child .credencial { break-after: auto; page-break-after: auto; }
          .rotulo-face { display: none !important; }
        }
        .credencial { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>

      <BarraCredenciais refProjeto={ref} nomeProjeto={projeto.cliente || ref} equipa={equipa.map(e => ({ id: e.m.id, nome: e.m.nome }))} atual={membro ?? null} />

      <div className="faces flex flex-col items-center gap-14 px-4 pb-16 print:p-0">
        {visiveis.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/[0.14] bg-[#00141f]/60 px-6 py-10 text-center text-[14px] text-white/55">
            Ainda não há staff nomeado neste projeto. Nomeia a equipa na página Equipa do projeto.
          </p>
        )}
        {visiveis.map(e => <CredencialFaces key={e.m.id} m={e.m} funcao={e.funcao} p={projeto} />)}
      </div>
    </main>
  )
}
