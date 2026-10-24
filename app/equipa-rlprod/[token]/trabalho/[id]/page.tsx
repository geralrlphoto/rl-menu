import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import EstiloRLProd from '@/app/media/_components/EstiloRLProd'
import { FUNDO } from '@/app/media/_lib/estilo'
import { lerData, hojeLisboa } from '@/app/media/_lib/eventos'
import { singular } from '@/app/media/equipa/categorias'
import type { BriefingSessao, BriefingItem, StoryboardCena, StorytellingSena } from '@/app/portal-media/_data/mockProject'
import EnvioMaterial from './EnvioMaterial'
import { temAcessoStaff } from '../../../_acesso'
import EntradaStaff from '../../../EntradaStaff'

// Ficha de um trabalho no portal do staff: dados do dia, briefing que vem do
// portal do cliente (sessões de briefing + guião da Reprodução) e envio do material.

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Trabalho · RL PROD', robots: { index: false, follow: false } }

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const eur = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)
const CARD = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/75 backdrop-blur-sm'

type Envio = { id: string; link: string; nota: string | null; enviadoEm: string }

// O texto do briefing/guião vem por vezes com marcas de Markdown (**negrito**, - [ ] caixas)
const limpa = (t?: string | null) => (t ?? '').replace(/\*\*/g, '').replace(/^\s*-\s*\[[ xX]\]\s*/gm, '').replace(/^#+\s*/gm, '').trim()

export default async function FichaTrabalho({ params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params
  if (!/^[0-9a-f]{32}$/.test(token)) notFound()

  const { data: m } = await supabase.from('media_equipa').select('id, nome, categoria, ativo, senha').eq('acesso_token', token).maybeSingle()
  if (!m || !m.ativo) notFound()
  if (!(await temAcessoStaff(m, token))) return <EntradaStaff token={token} nome={m.nome.trim().split(/\s+/)[0].charAt(0).toUpperCase() + m.nome.trim().split(/\s+/)[0].slice(1).toLowerCase()} />
  const { data: t } = await supabase.from('media_equipa_projeto')
    .select('id, projeto_ref, funcao, valor, pago, notas, envios, ver_guiao, ver_briefing').eq('id', id).eq('membro_id', m.id).maybeSingle()
  if (!t) notFound()

  // Só o que a equipa precisa do portal do cliente (nada de pagamentos nem contactos do cliente)
  const { data: p } = await supabase.from('media_portais').select(
    'nome:dados->>nome, tipo:dados->>tipo, local:dados->>local, filmagem:dados->>dataFilmagem, entrega:dados->>dataEntrega, ' +
    'gestorNome:dados->>gestorNome, gestorTelefone:dados->>gestorTelefone, ' +
    'briefingItems:dados->briefingItems, briefingSessoes:dados->briefingSessoes, ' +
    'storytelling:dados->>reproducaoStorytelling, palavras:dados->>reproducaoPalavrasChave, tom:dados->>reproducaoTomEmocional, ' +
    'senas:dados->reproducaoSenas, storyboard:dados->reproducaoStoryboard',
  ).eq('ref', t.projeto_ref).maybeSingle()
  const pj = (p ?? {}) as {
    nome?: string; tipo?: string; local?: string; filmagem?: string; entrega?: string; gestorNome?: string; gestorTelefone?: string
    briefingItems?: BriefingItem[]; briefingSessoes?: BriefingSessao[]; storytelling?: string; palavras?: string; tom?: string
    senas?: StorytellingSena[]; storyboard?: StoryboardCena[]
  }

  const filmagem = lerData(pj.filmagem)
  const entrega = lerData(pj.entrega)
  const hoje = hojeLisboa()
  const dias = filmagem ? Math.round((filmagem.getTime() - hoje.getTime()) / 86400000) : null
  const quando = dias === null ? 'Data por marcar' : dias === 0 ? 'Hoje' : dias === 1 ? 'Amanhã' : dias > 1 ? `Daqui a ${dias} dias` : 'Já realizado'
  // O briefing e o guião só aparecem a quem a RL PROD deu acesso na Equipa do projeto
  const verBriefing = !!t.ver_briefing
  const sessoes = (Array.isArray(pj.briefingSessoes) ? pj.briefingSessoes : []).filter(s => s.estado !== 'pendente' && (s.resumo || s.objetivos?.length || s.notas))
  const itens = Array.isArray(pj.briefingItems) ? pj.briefingItems.filter(i => i.label || i.desc) : []
  const senas = Array.isArray(pj.senas) ? pj.senas : []
  const storyboard = Array.isArray(pj.storyboard) ? pj.storyboard : []
  // O guião criativo só aparece a quem a RL PROD deu acesso na Equipa do projeto
  const temGuiao = !!t.ver_guiao && !!(pj.storytelling || pj.palavras || pj.tom || senas.length || storyboard.length)
  const envios: Envio[] = Array.isArray(t.envios) ? t.envios : []
  const fmt = (d: Date) => d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <main className="rlp min-h-screen relative text-white">
      <EstiloRLProd />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 pt-8 pb-16">
        <Link href={`/equipa-rlprod/${token}`} className="rlp-m inline-flex items-center gap-2 text-[11px] text-white/45 hover:text-white">‹ Os meus trabalhos</Link>

        {/* cabeçalho */}
        <header className="mt-8">
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">RL Prod · Ficha de trabalho · {t.funcao || singular(m.categoria)}</p>
          <h1 className="rlp-t mt-3 text-[46px] sm:text-[72px] leading-[0.9]">{pj.nome || t.projeto_ref}.</h1>
          <p className="mt-3 text-[14.5px] text-white/60 first-letter:uppercase">{filmagem ? fmt(filmagem) : 'Data por marcar'}{pj.local ? ` · ${pj.local}` : ''}</p>
        </header>

        {/* dados do trabalho */}
        <section className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            { k: 'Quando', v: quando },
            { k: 'A minha função', v: t.funcao || singular(m.categoria) },
            { k: 'Entrega ao cliente', v: entrega ? entrega.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' }) : '·' },
            { k: 'Valor', v: Number(t.valor) ? `${eur(Number(t.valor))} · ${t.pago ? 'pago' : 'por pagar'}` : '·' },
          ].map(x => (
            <div key={x.k} className={`${CARD} px-4 py-3.5`}>
              <p className="rlp-m text-[8.5px] text-white/45">{x.k}</p>
              <p className="rlp-t mt-1.5 text-[19px] leading-tight">{x.v}</p>
            </div>
          ))}
        </section>
        {(t.notas || pj.gestorNome) && (
          <div className={`${CARD} mt-2.5 px-5 py-4 grid gap-1.5 text-[13.5px] text-white/70`}>
            {t.notas && <p><span className="text-white/45">Nota da RL PROD: </span>{t.notas}</p>}
            {pj.gestorNome && <p><span className="text-white/45">Responsável: </span>{pj.gestorNome}{pj.gestorTelefone && <> · <a href={`tel:${pj.gestorTelefone.replace(/\s/g, '')}`} className="text-[#a9c1ff] hover:text-white">{pj.gestorTelefone}</a></>}</p>}
          </div>
        )}

        {/* enviar material */}
        <EnvioMaterial token={token} trabalho={t.id} inicial={envios} />

        {/* briefing do cliente */}
        {verBriefing && <section className="mt-12">
          <h2 className="rlp-t text-[30px] leading-none border-b border-white/[0.08] pb-3">Briefing do projeto</h2>
          {sessoes.length === 0 && itens.length === 0 && (
            <p className={`${CARD} mt-4 px-6 py-8 text-center text-[14px] text-white/50`}>O briefing ainda não foi preenchido. Assim que a RL PROD reunir com o cliente, aparece aqui.</p>
          )}
          {itens.length > 0 && (
            <div className={`${CARD} mt-4 p-5 grid gap-3`}>
              {itens.map((i, n) => (
                <div key={n}>
                  <p className="rlp-m text-[9px] text-[#a9c1ff]">{i.label}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-white/75 whitespace-pre-line">{limpa(i.desc)}</p>
                </div>
              ))}
            </div>
          )}
          {sessoes.map(s => (
            <article key={s.id} className={`${CARD} mt-3 p-5`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="rlp-t text-[21px] leading-tight">{s.titulo || 'Sessão de briefing'}</h3>
                <span className="rlp-m text-[9px] text-white/45">{s.data ? lerData(s.data)?.toLocaleDateString('pt-PT') ?? s.data : ''}</span>
              </div>
              {s.resumo && <p className="mt-3 text-[14px] leading-relaxed text-white/75 whitespace-pre-line">{limpa(s.resumo)}</p>}
              {!!s.objetivos?.length && (
                <ul className="mt-3 grid gap-1.5">
                  {s.objetivos.map((o, n) => <li key={n} className="flex gap-2 text-[13.5px] text-white/75"><span className="text-[#5a8bff]">›</span>{o}</li>)}
                </ul>
              )}
              {!!s.tom?.length && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.tom.map((x, n) => <span key={n} className="rounded-full border border-[#2e6cf6]/50 px-3 py-1 text-[12px] text-[#a9c1ff]">{x}</span>)}
                </div>
              )}
              {s.notas && <p className="mt-3 text-[13px] text-white/55 whitespace-pre-line">{s.notas}</p>}
            </article>
          ))}
        </section>}

        {/* guião criativo (Reprodução) */}
        {temGuiao && (
          <section className="mt-12">
            <h2 className="rlp-t text-[30px] leading-none border-b border-white/[0.08] pb-3">Guião criativo</h2>
            {(pj.storytelling || pj.palavras || pj.tom) && (
              <div className={`${CARD} mt-4 p-5 grid gap-3`}>
                {pj.storytelling && <p className="text-[14px] leading-relaxed text-white/75 whitespace-pre-line">{limpa(pj.storytelling)}</p>}
                {pj.palavras && <p className="text-[13px] text-white/60"><span className="rlp-m text-[9px] text-[#a9c1ff] mr-2">Palavras-chave</span>{pj.palavras}</p>}
                {pj.tom && <p className="text-[13px] text-white/60"><span className="rlp-m text-[9px] text-[#a9c1ff] mr-2">Tom</span>{pj.tom}</p>}
              </div>
            )}
            {senas.length > 0 && (
              <ol className={`${CARD} mt-3 divide-y divide-white/[0.07]`}>
                {senas.map((s, n) => (
                  <li key={n} className="flex gap-3 px-5 py-3 text-[13.5px] text-white/75">
                    <span className="rlp-m w-6 shrink-0 text-[9px] text-white/40 pt-1">{String(n + 1).padStart(2, '0')}</span>
                    <span>{limpa(s.titulo)}{s.texto && <span className="block text-white/55 whitespace-pre-line">{limpa(s.texto)}</span>}</span>
                  </li>
                ))}
              </ol>
            )}
            {storyboard.length > 0 && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {storyboard.map((c, n) => (
                  <article key={c.id ?? n} className={`${CARD} p-4`}>
                    <p className="rlp-m text-[8.5px] text-white/40">Cena {n + 1}{c.duracao ? ` · ${c.duracao}` : ''}</p>
                    <p className="rlp-t mt-1 text-[17px] leading-tight">{limpa(c.momento) || 'Cena'}</p>
                    {c.descricao && <p className="mt-1.5 text-[13px] text-white/60 whitespace-pre-line">{limpa(c.descricao)}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
