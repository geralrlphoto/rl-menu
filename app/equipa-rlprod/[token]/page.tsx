import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import EstiloRLProd from '@/app/media/_components/EstiloRLProd'
import { FUNDO } from '@/app/media/_lib/estilo'
import { lerData, hojeLisboa } from '@/app/media/_lib/eventos'
import { singular, type FichaDados } from '@/app/media/equipa/categorias'

// Portal do staff RL PROD: cada membro abre o seu link secreto (/equipa-rlprod/<token>)
// e vê os trabalhos onde foi nomeado, a agenda, quanto vai receber e os seus dados.
// Só leitura: os dados são preenchidos pela RL PROD na ficha do membro.

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Equipa · RL PROD', robots: { index: false, follow: false } }

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const eur = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)
const CARD = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/75 backdrop-blur-sm'
const iniciais = (n: string) => n.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()
const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type Trabalho = {
  id: string; ref: string; funcao: string; valor: number; pago: boolean; pago_em: string | null; notas: string | null
  nome: string; local: string | null; filmagem: Date | null; entrega: Date | null; status: string | null
}

export default async function PortalStaff({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!/^[0-9a-f]{32}$/.test(token)) notFound()

  const { data: m } = await supabase.from('media_equipa')
    .select('id, nome, categoria, telefone, email, instagram, foto_url, ativo, dados, criado_em')
    .eq('acesso_token', token).maybeSingle()
  if (!m || !m.ativo) notFound()
  const d = (m.dados ?? {}) as FichaDados

  const { data: ligacoes } = await supabase.from('media_equipa_projeto')
    .select('id, projeto_ref, funcao, valor, pago, pago_em, notas').eq('membro_id', m.id)
  const refs = [...new Set((ligacoes ?? []).map(l => l.projeto_ref))]
  const { data: portais } = refs.length
    ? await supabase.from('media_portais')
        .select('ref, nome:dados->>nome, local:dados->>local, filmagem:dados->>dataFilmagem, entrega:dados->>dataEntrega, status:dados->>status')
        .in('ref', refs)
    : { data: [] as { ref: string; nome: string | null; local: string | null; filmagem: string | null; entrega: string | null; status: string | null }[] }

  const trabalhos: Trabalho[] = (ligacoes ?? []).map(l => {
    const p = (portais ?? []).find(x => x.ref === l.projeto_ref)
    return {
      id: l.id, ref: l.projeto_ref, funcao: l.funcao || singular(m.categoria), valor: Number(l.valor) || 0,
      pago: !!l.pago, pago_em: l.pago_em, notas: l.notas,
      nome: p?.nome || l.projeto_ref, local: p?.local || null, status: p?.status || null,
      filmagem: lerData(p?.filmagem), entrega: lerData(p?.entrega),
    }
  }).sort((a, b) => (a.filmagem?.getTime() ?? Infinity) - (b.filmagem?.getTime() ?? Infinity))

  const hoje = hojeLisboa()
  const proximos = trabalhos.filter(t => t.filmagem && t.filmagem >= hoje)
  const passados = trabalhos.filter(t => !t.filmagem || t.filmagem < hoje).reverse()
  const proximo = proximos[0]
  const aReceber = trabalhos.filter(t => !t.pago).reduce((s, t) => s + t.valor, 0)
  const recebido = trabalhos.filter(t => t.pago).reduce((s, t) => s + t.valor, 0)
  const diasAte = (dt: Date) => Math.round((dt.getTime() - hoje.getTime()) / 86400000)
  const quando = (dt: Date | null) => {
    if (!dt) return 'Data por marcar'
    const n = diasAte(dt)
    return n === 0 ? 'Hoje' : n === 1 ? 'Amanhã' : n > 1 ? `Daqui a ${n} dias` : dt.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  const dataLonga = hoje.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const primeiro = m.nome.trim().split(/\s+/)[0]
  const nomeProprio = primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase()

  return (
    <main className="rlp min-h-screen relative text-white">
      <EstiloRLProd />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      {/* barra de topo */}
      <header className="relative z-20 px-4 pt-3">
        <nav className="max-w-5xl mx-auto flex items-center justify-between gap-3 rounded-full border border-white/[0.08] bg-[#00141f]/80 backdrop-blur-md pl-4 pr-2 py-2">
          <span className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-rl-prod-branco.png" alt="" className="w-6 h-6 object-contain" />
            <span className="rlp-t text-[16px] tracking-[0.04em]">RL Prod</span>
            <span className="rlp-m hidden sm:inline text-[9px] text-[#5a8bff] ml-2">Portal da equipa</span>
          </span>
          <span className="hidden sm:flex items-center gap-5 text-[12.5px] text-white/60">
            <a href="#agenda" className="hover:text-white">Agenda</a>
            <a href="#trabalhos" className="hover:text-white">Trabalhos</a>
            <a href="#pagamentos" className="hover:text-white">Pagamentos</a>
            <a href="#dados" className="hover:text-white">Os meus dados</a>
          </span>
          <span className="flex items-center gap-2 rounded-full border border-white/[0.12] py-1 pl-1 pr-3">
            {m.foto_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={m.foto_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              : <span className="rlp-t w-7 h-7 rounded-full flex items-center justify-center bg-[#2e6cf6] text-[11px]">{iniciais(m.nome)}</span>}
            <span className="text-[12px] text-white/80">{nomeProprio}</span>
          </span>
        </nav>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 pt-10 pb-16">
        {/* boas-vindas + resumo */}
        <section className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">RL Prod · Equipa · {singular(m.categoria)}</p>
            <h1 className="rlp-t mt-3 text-[56px] sm:text-[84px] leading-[0.88]">Olá, {nomeProprio}.</h1>
            <p className="mt-3 text-[14.5px] capitalize text-white/55">{dataLonga}</p>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/70">
              {proximo
                ? <>O teu próximo trabalho é <span className="text-white">{proximo.nome}</span>, {quando(proximo.filmagem).toLowerCase()}{proximo.local ? `, em ${proximo.local}` : ''}.</>
                : trabalhos.length ? 'Não tens trabalhos marcados para os próximos dias.' : 'Ainda não foste nomeado em nenhum trabalho. Quando fores, aparece aqui.'}
            </p>
          </div>
          <div className={`${CARD} p-5`}>
            <p className="rlp-m text-[9.5px] text-[#a9c1ff]">Resumo</p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {[
                { k: 'Próximos', v: String(proximos.length) },
                { k: 'Trabalhos', v: String(trabalhos.length) },
                { k: 'A receber', v: eur(aReceber), cor: aReceber > 0 ? 'text-[#5a8bff]' : '' },
                { k: 'Recebido', v: eur(recebido) },
              ].map(x => (
                <div key={x.k} className="rounded-xl bg-[#0c2236]/70 px-3.5 py-3">
                  <p className="rlp-m text-[8.5px] text-white/45">{x.k}</p>
                  <p className={`rlp-t mt-1.5 text-[22px] leading-none ${x.cor ?? ''}`}>{x.v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* agenda: próximos trabalhos em deslize */}
        <section id="agenda" className="mt-14 scroll-mt-6">
          <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.08] pb-3">
            <h2 className="rlp-t text-[30px] leading-none">Agenda</h2>
            <span className="rlp-m text-[9.5px] text-white/40">{proximos.length ? 'Desliza →' : ''}</span>
          </div>
          {proximos.length === 0 ? (
            <p className={`${CARD} mt-4 px-6 py-8 text-center text-[14px] text-white/50`}>Sem trabalhos marcados.</p>
          ) : (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 snap-x">
              {proximos.map(t => (
                <article key={t.id} className={`${CARD} snap-start shrink-0 w-[250px] p-4 ${t === proximo ? 'border-[#2e6cf6]' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="rlp-m text-[9px] text-white/45">{t.filmagem ? SEMANA[t.filmagem.getDay()] : ''}</p>
                      <p className="rlp-t text-[40px] leading-none">{t.filmagem?.getDate()}</p>
                      <p className="rlp-m text-[9px] text-[#5a8bff]">{t.filmagem?.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className="rlp-m rounded-full border border-[#2e6cf6]/50 px-2 py-0.5 text-[8px] text-[#a9c1ff]">{quando(t.filmagem)}</span>
                  </div>
                  <p className="rlp-t mt-4 text-[20px] leading-tight">{t.nome}</p>
                  <p className="mt-1 text-[12.5px] text-white/55">{t.funcao}{t.local ? ` · ${t.local}` : ''}</p>
                  {t.notas && <p className="mt-2 text-[12px] text-white/45">{t.notas}</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* trabalhos */}
        <section id="trabalhos" className="mt-14 scroll-mt-6">
          <h2 className="rlp-t text-[30px] leading-none border-b border-white/[0.08] pb-3">Os meus trabalhos</h2>
          {trabalhos.length === 0 ? (
            <p className={`${CARD} mt-4 px-6 py-8 text-center text-[14px] text-white/50`}>Ainda sem trabalhos.</p>
          ) : (
            <ul className={`${CARD} mt-4 divide-y divide-white/[0.07]`}>
              {[...proximos, ...passados].map(t => {
                const feito = !t.filmagem || t.filmagem < hoje
                return (
                  <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 sm:px-5 py-3.5">
                    <span className="rlp-m w-24 shrink-0 text-[9px] text-white/45">{t.filmagem ? t.filmagem.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sem data'}</span>
                    <span className="min-w-0 flex-1 basis-48">
                      <span className="block truncate text-[15px] text-white">{t.nome}</span>
                      <span className="block text-[12px] text-white/45">
                        {t.funcao}{t.local ? ` · ${t.local}` : ''}{t.entrega ? ` · entrega ${t.entrega.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}` : ''}
                      </span>
                    </span>
                    <span className={`rlp-m rounded-full border px-2.5 py-1 text-[8px] ${feito ? 'border-white/20 text-white/50' : 'border-[#2e6cf6]/60 text-[#a9c1ff]'}`}>{feito ? 'Feito' : 'Marcado'}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* pagamentos */}
        <section id="pagamentos" className="mt-14 scroll-mt-6">
          <h2 className="rlp-t text-[30px] leading-none border-b border-white/[0.08] pb-3">Pagamentos</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className={`${CARD} p-5`}>
              <p className="rlp-m text-[9px] text-white/45">A receber</p>
              <p className="rlp-t mt-2 text-[36px] leading-none text-[#5a8bff]">{eur(aReceber)}</p>
              <p className="mt-2 text-[12.5px] text-white/45">{(n => n === 1 ? '1 trabalho por pagar' : `${n} trabalhos por pagar`)(trabalhos.filter(t => !t.pago && t.valor > 0).length)}</p>
            </div>
            <div className={`${CARD} p-5`}>
              <p className="rlp-m text-[9px] text-white/45">Já recebido</p>
              <p className="rlp-t mt-2 text-[36px] leading-none">{eur(recebido)}</p>
              <p className="mt-2 text-[12.5px] text-white/45">{d.metodoPagamento ? `Por ${d.metodoPagamento.toLowerCase()}` : 'Método de pagamento por indicar'}</p>
            </div>
          </div>
          {trabalhos.some(t => t.valor > 0) && (
            <ul className={`${CARD} mt-3 divide-y divide-white/[0.07]`}>
              {trabalhos.filter(t => t.valor > 0).map(t => (
                <li key={t.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-white/90">{t.nome}</span>
                    <span className="block text-[11.5px] text-white/45">{t.funcao}{t.pago && t.pago_em ? ` · pago a ${new Date(t.pago_em + 'T12:00:00').toLocaleDateString('pt-PT')}` : ''}</span>
                  </span>
                  <span className="rlp-t text-[17px]">{eur(t.valor)}</span>
                  <span className={`rlp-m w-[86px] text-center rounded-full border px-2 py-1 text-[8px] ${t.pago ? 'border-[#2e6cf6] bg-[#2e6cf6]/20 text-[#a9c1ff]' : 'border-white/25 text-white/60'}`}>{t.pago ? '✓ Pago' : 'Por pagar'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* dados */}
        <section id="dados" className="mt-14 scroll-mt-6">
          <h2 className="rlp-t text-[30px] leading-none border-b border-white/[0.08] pb-3">Os meus dados</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className={`${CARD} p-5 flex items-center gap-4`}>
              {m.foto_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={m.foto_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-[#2e6cf6]" />
                : <span className="rlp-t w-20 h-20 shrink-0 rounded-full flex items-center justify-center bg-[#2e6cf6] text-[26px]">{iniciais(m.nome)}</span>}
              <div className="min-w-0">
                <p className="rlp-t text-[22px] leading-tight">{m.nome}</p>
                <p className="rlp-m mt-1 text-[9px] text-[#5a8bff]">{singular(m.categoria)}</p>
                <p className="mt-2 text-[12px] text-white/40">Na equipa desde {new Date(m.criado_em).toLocaleDateString('pt-PT')}</p>
              </div>
            </div>
            <Lista titulo="Contactos" linhas={[
              ['Email', m.email], ['Telemóvel', m.telefone], ['Instagram', m.instagram ? `@${m.instagram.replace(/^@/, '')}` : null], ['Localização', d.localizacao],
            ]} />
            <Lista titulo="Pagamento" linhas={[
              ['Método', d.metodoPagamento], ['IBAN', d.iban ? `${d.iban.slice(0, 4)} •••• ${d.iban.slice(-4)}` : null], ['Titular', d.titular], ['NIF', d.nif],
            ]} />
            <Lista titulo="Contacto de urgência" linhas={[
              ['Nome', d.urgenciaNome], ['Relação', d.urgenciaRelacao], ['Telemóvel', d.urgenciaTelefone],
            ]} />
            <Lista titulo="Trabalho" linhas={[
              ['Disponibilidade', d.disponibilidade], ['Dias', d.diasTrabalho], ['Horário', d.horario],
            ]} />
            {d.equipamento ? (
              <div className={`${CARD} p-5`}>
                <p className="rlp-t text-[19px] leading-none mb-3">Equipamento</p>
                <p className="text-[13.5px] leading-relaxed text-white/70 whitespace-pre-line">{d.equipamento}</p>
              </div>
            ) : null}
          </div>
          <p className="mt-4 text-[12.5px] text-white/45">Algum dado errado ou em falta? Fala com a RL PROD para atualizarmos a tua ficha.</p>
        </section>

        <footer className="mt-16 border-t border-white/[0.07] pt-6 text-center">
          <p className="rlp-t text-[18px]">More than a product, <span className="text-[#5a8bff]">an experience.</span></p>
          <p className="rlp-m mt-2 text-[8.5px] text-white/35">RL Prod · Photography & Video · Setúbal</p>
        </footer>
      </div>
    </main>
  )
}

function Lista({ titulo, linhas }: { titulo: string; linhas: [string, string | null | undefined][] }) {
  return (
    <div className={`${CARD} p-5`}>
      <p className="rlp-t text-[19px] leading-none mb-2">{titulo}</p>
      {linhas.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.06] last:border-0">
          <span className="text-[12.5px] text-white/45">{k}</span>
          <span className="text-[13.5px] text-white/90 text-right break-all">{v || <span className="text-white/25">·</span>}</span>
        </div>
      ))}
    </div>
  )
}
