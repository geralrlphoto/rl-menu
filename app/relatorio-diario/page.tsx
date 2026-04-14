'use client'

import { useState } from 'react'
import Link from 'next/link'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

function fmtShort(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d + 'T00:00:00')
  return `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()].slice(0,3)}`
}
function fmtFull(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d + 'T00:00:00')
  return `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()]} ${dt.getFullYear()}`
}
function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function DiasBadge({ dias }: { dias: number }) {
  const cls = dias < 0
    ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : dias === 0 ? 'bg-gold/20 text-gold border-gold/30'
    : dias <= 3  ? 'bg-red-500/15 text-red-300 border-red-500/25'
    : dias <= 7  ? 'bg-orange-500/15 text-orange-400 border-orange-500/25'
    : 'bg-white/5 text-white/40 border-white/10'
  const label = dias < 0 ? `${Math.abs(dias)}d atraso` : dias === 0 ? 'HOJE' : dias === 1 ? 'Amanhã' : `${dias}d`
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${cls}`}>{label}</span>
}

function Section({ title, count, urgent, children, empty, desc, info }: {
  title: string; count: number; urgent?: boolean
  children: React.ReactNode; empty: string; desc: string; info: string
}) {
  const [open, setOpen]       = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  return (
    <div className="border border-white/[0.08] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center bg-white/[0.02]">

        {/* Botão principal +/− */}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex-1 flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors group text-left"
        >
          <span className={`flex items-center justify-center w-7 h-7 rounded-full border text-base font-bold leading-none transition-all duration-200 shrink-0 ${
            open
              ? 'border-gold/40 text-gold bg-gold/10'
              : 'border-white/20 text-white/40 group-hover:border-gold/30 group-hover:text-gold/60'
          }`}>
            {open ? '−' : '+'}
          </span>
          <div className="flex flex-col items-start gap-1">
            <span className="text-sm tracking-[0.25em] text-gold uppercase font-semibold">{title}</span>
            {!open && (
              <span className="text-xs text-white/30 tracking-wide normal-case font-normal">{desc}</span>
            )}
          </div>
          {count > 0 && (
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
              urgent ? 'bg-red-500/15 text-red-400 border-red-500/25' : 'bg-gold/10 text-gold/80 border-gold/25'
            }`}>{count}</span>
          )}
        </button>

        {/* Lado direito: Em dia + botão ℹ */}
        <div className="flex items-center gap-2 pr-4 shrink-0">
          {count === 0 && <span className="text-xs tracking-widest text-white/15 uppercase">Em dia</span>}
          <button
            onClick={() => setInfoOpen(o => !o)}
            className={`flex items-center justify-center w-6 h-6 rounded-full border text-[11px] font-bold transition-all duration-200 ${
              infoOpen
                ? 'border-white/40 text-white/60 bg-white/10'
                : 'border-white/15 text-white/25 hover:border-white/30 hover:text-white/50'
            }`}
            title="O que mostra esta secção?"
          >
            i
          </button>
        </div>
      </div>

      {/* Painel de info */}
      {infoOpen && (
        <div className="px-5 py-3 bg-white/[0.02] border-t border-white/[0.05]">
          <p className="text-sm text-white/40 leading-relaxed">{info}</p>
        </div>
      )}

      {/* Conteúdo */}
      {open && (
        <div className="px-4 pb-4 pt-2 flex flex-col gap-1.5 border-t border-white/[0.05]">
          {count === 0
            ? <p className="text-white/20 text-sm tracking-widest py-6 text-center border border-dashed border-white/[0.05] rounded-xl">
                {empty}
              </p>
            : children
          }
        </div>
      )}
    </div>
  )
}

function Item({ main, sub, right }: { main: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-base text-white/80 truncate">{main}</p>
        {sub && <p className="text-sm text-white/30 truncate mt-0.5">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

function StatCard({ label, val, sub }: { label: string; val: number | string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-4 rounded-xl border border-white/[0.07] bg-white/[0.02]">
      <span className="text-2xl font-bold text-white">{val}</span>
      <span className="text-xs tracking-[0.2em] text-white/30 uppercase">{label}</span>
      {sub && <span className="text-xs text-gold/50">{sub}</span>}
    </div>
  )
}

export default function RelatorioDiarioPage() {
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const now   = new Date()
  const hoje  = `${DIAS_SEMANA[now.getDay()]} · ${String(now.getDate()).padStart(2,'0')} ${MESES[now.getMonth()]} ${now.getFullYear()}`

  async function gerar() {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/relatorio-diario', { cache: 'no-store' })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      setData(json)
    } catch { setError('Erro de ligação') }
    finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10 max-w-3xl mx-auto">

      {/* Voltar */}
      <Link href="/" className="inline-flex items-center gap-2 text-xs tracking-widest text-white/30 hover:text-gold transition-colors uppercase">
        ‹ MENU
      </Link>

      {/* ── HERO (estilo da imagem de referência) ── */}
      <div className="mt-10 mb-12">
        <p className="text-[9px] tracking-[0.55em] text-white/20 uppercase mb-4">RL PHOTO · VIDEO</p>

        {/* Título em bloco bold, como na imagem */}
        <div className="mb-6">
          <p className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.88] text-white uppercase">
            RELATÓRIO
          </p>
          <p className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.88] text-[#C9A84C] uppercase">
            DIÁRIO
          </p>
        </div>

        {/* Descrição + botão em linha, como na imagem */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 mt-6">
          <p className="text-white/30 text-sm leading-relaxed max-w-xs">
            Resumo completo do dia — eventos, leads, portais, prazos e pagamentos num único relatório.
          </p>
          <div className="flex flex-col gap-1 shrink-0">
            <button
              onClick={gerar}
              disabled={loading}
              className="flex items-center gap-3 px-7 py-3.5 rounded-full bg-[#C9A84C] hover:bg-[#e0bb5e] text-black font-black text-sm tracking-[0.2em] uppercase transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  A GERAR...
                </>
              ) : (
                <>
                  GERAR RELATÓRIO
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                  </svg>
                </>
              )}
            </button>
            {data && (
              <p className="text-[9px] tracking-widest text-white/15 uppercase text-center">
                Gerado às {fmtTime(data.gerado_em)}
              </p>
            )}
          </div>
        </div>

        {/* Data de hoje */}
        <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase mt-5">{hoje}</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400/80 text-xs tracking-wider">
          Erro: {error}
        </div>
      )}

      {/* ── ESTADO INICIAL ── */}
      {!data && !loading && (
        <div className="flex flex-col items-center gap-3 py-24 border border-dashed border-white/[0.06] rounded-2xl">
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-gold/30 to-transparent" />
          <p className="text-[10px] tracking-[0.5em] text-white/20 uppercase text-center">
            Carrega em Gerar Relatório<br/>para ver o resumo do dia
          </p>
        </div>
      )}

      {/* ── RELATÓRIO ── */}
      {data && (
        <>
          {/* Linha divisória dourada */}
          <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mb-8" />

          {/* Stats rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
            <StatCard label="Eventos próximos" val={data.resumo.eventos_proximos} sub="14 dias" />
            <StatCard label="Leads urgentes" val={data.resumo.leads_urgentes} sub="0–3 dias" />
            <StatCard label="Atividade portais" val={data.resumo.portal_atividade} sub="7 dias" />
            <StatCard
              label="Prazos"
              val={data.resumo.prazos_fotos + data.resumo.prazos_videos + data.resumo.albuns_prazo}
              sub="fotos · vídeo · álbuns"
            />
          </div>

          <div className="flex flex-col gap-2">

            {/* ── Eventos próximos ── */}
            <Section title="Eventos Próximos" desc="Casamentos e sessões agendados nos próximos 14 dias" info="Retirado das bases Notion de 2026 e 2027. Mostra todos os eventos com data nos próximos 14 dias — cliente, data, local e fotógrafo atribuído." count={data.eventos.length} empty="Sem eventos nos próximos 14 dias">
              {data.eventos.map((e: any) => (
                <Link key={e.id} href={`/eventos-2026/${e.id}`}>
                  <Item
                    main={e.cliente !== '—' ? e.cliente : e.referencia}
                    sub={[fmtShort(e.data_evento), e.local !== '—' ? e.local : null, e.fotografo?.join(', ')].filter(Boolean).join(' · ')}
                    right={<DiasBadge dias={e.dias} />}
                  />
                </Link>
              ))}
            </Section>

            {/* ── Leads urgentes ── */}
            <Section
              title="Leads CRM"
              desc="Contactos quentes (0–3 dias) e mornos (4–10 dias) ainda em aberto"
              info="Leads ativas no CRM que ainda não fecharam nem foram descartadas. 🔥 Quente = entraram há 0–3 dias (resposta urgente). 🌡 Morno = entraram há 4–10 dias. Não inclui estados: Fechou, Não Fechou, Sem resposta, Encerrado, Cancelado."
              count={data.leads_urgentes.length + data.leads_morno.length}
              urgent={data.leads_urgentes.length > 0}
              empty="Sem leads activas para contactar"
            >
              {data.leads_urgentes.map((l: any) => (
                <Link key={l.id} href={`/crm/${l.id}`}>
                  <Item
                    main={l.nome || '—'}
                    sub={[l.tipo_evento, l.como_chegou].filter(Boolean).join(' · ')}
                    right={<span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-red-500/15 text-red-400 border-red-500/25">🔥 Quente</span>}
                  />
                </Link>
              ))}
              {data.leads_morno.map((l: any) => (
                <Link key={l.id} href={`/crm/${l.id}`}>
                  <Item
                    main={l.nome || '—'}
                    sub={[l.tipo_evento, l.como_chegou].filter(Boolean).join(' · ')}
                    right={<span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-orange-500/15 text-orange-400 border-orange-500/25">🌡 Morno</span>}
                  />
                </Link>
              ))}
            </Section>

            {/* ── Portais — Noivos ── */}
            <Section
              title="Portais Noivos — Atividade"
              desc="Entregas enviadas aos noivos nos últimos 7 dias (portal, fotos, filme, álbum…)"
              info="Regista tudo o que foi enviado aos noivos via portal nos últimos 7 dias: portal enviado, seleção de fotos, fotos finais, pré-wedding, maquete do álbum, wedding film, same day edit, teaser e galerias online."
              count={data.portal_atividade.filter((a: any) => a.categoria === 'noivos').length}
              empty="Sem atividade nos portais dos noivos nos últimos 7 dias"
            >
              {data.portal_atividade
                .filter((a: any) => a.categoria === 'noivos')
                .map((a: any, i: number) => (
                  <Item
                    key={i}
                    main={a.label}
                    sub={`${a.nomes} · ${a.referencia}`}
                    right={
                      <span className="text-sm text-white/30">
                        {a.diasAtras === 0 ? 'Hoje' : a.diasAtras === 1 ? 'Ontem' : `há ${a.diasAtras} dias`}
                      </span>
                    }
                  />
                ))}
            </Section>

            {/* ── Portais — Equipa ── */}
            <Section
              title="Equipa — Notificações"
              desc="Notificações enviadas ao fotógrafo e videógrafo nos últimos 7 dias"
              info="Mostra as notificações enviadas à equipa através do portal nos últimos 7 dias — notificação ao fotógrafo e notificação ao videógrafo."
              count={data.portal_atividade.filter((a: any) => a.categoria === 'equipa').length}
              empty="Sem notificações à equipa nos últimos 7 dias"
            >
              {data.portal_atividade
                .filter((a: any) => a.categoria === 'equipa')
                .map((a: any, i: number) => (
                  <Item
                    key={i}
                    main={a.label}
                    sub={`${a.nomes} · ${a.referencia}`}
                    right={
                      <span className="text-sm text-white/30">
                        {a.diasAtras === 0 ? 'Hoje' : a.diasAtras === 1 ? 'Ontem' : `há ${a.diasAtras} dias`}
                      </span>
                    }
                  />
                ))}
            </Section>

            {/* ── Prazos Fotos ── */}
            <Section
              title="Prazos Fotos"
              desc="Prazo Sel. Fotos (evento +30 dias) e Sel. Fotos Noivos (envio +30 dias)"
              info="Dois prazos combinados: (1) Sel. Fotos — eventos dos últimos 30 dias onde ESTADO SEL. FOTOS no Notion ainda não é Entregue, prazo = data do evento + 30 dias. (2) Sel. Fotos Noivos — portais onde a seleção foi enviada ao casal mas ainda não está Entregue/Concluída, prazo = data de envio + 30 dias. Só aparecem os que têm 15 dias ou menos."
              count={data.fotos_alerta.length}
              urgent={data.fotos_alerta.some((f: any) => f.dias <= 3)}
              empty="Todos os prazos de seleção em dia"
            >
              {data.fotos_alerta.map((f: any, i: number) => (
                <Item key={i} main={f.nome} sub={`${f.tipo} · ${f.ref}`} right={<DiasBadge dias={f.dias} />} />
              ))}
            </Section>

            {/* ── Prazos Vídeo ── */}
            <Section
              title="Prazos Vídeo"
              desc="Filmes em produção com entrega prevista nos próximos 15 dias ou em atraso"
              info="Filmes ainda não entregues (estado ≠ Entregue no Notion) cujo prazo calculado está a 15 dias ou menos, ou já em atraso. O prazo é lido de uma fórmula da base de dados do Notion."
              count={data.videos_alerta.length}
              urgent={data.videos_alerta.some((v: any) => v.dias <= 3)}
              empty="Todos os prazos de vídeo em dia"
            >
              {data.videos_alerta.map((v: any, i: number) => (
                <Item key={i} main={v.cliente} sub={v.ref} right={<DiasBadge dias={v.dias} />} />
              ))}
            </Section>

            {/* ── Álbuns ── */}
            <Section
              title="Álbuns"
              desc="Álbuns com entrega prevista nos próximos 14 dias e maquetes para aprovação"
              info="Dois grupos: (1) álbuns com data prevista de entrega nos próximos 14 dias ordenados por urgência, (2) álbuns com estado 'PARA APROVAÇÃO' no Notion — maquetes enviadas a aguardar resposta."
              count={data.albuns.length + data.albuns_aprovacao.length}
              empty="Sem álbuns com prazo próximo ou para aprovação"
            >
              {data.albuns.map((a: any, i: number) => (
                <Item
                  key={i}
                  main={a.nome}
                  sub={[a.ref, a.data ? fmtShort(a.data) : null].filter(Boolean).join(' · ')}
                  right={<DiasBadge dias={a.dias} />}
                />
              ))}
              {data.albuns_aprovacao.map((a: any, i: number) => (
                <Item
                  key={`ap-${i}`}
                  main={a.nome}
                  sub={a.ref}
                  right={<span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-gold/10 text-gold border-gold/25">Para Aprovação</span>}
                />
              ))}
            </Section>

            {/* ── Pagamentos Recentes ── */}
            <Section
              title="Pagamentos Recentes"
              desc="Pagamentos registados nos últimos 7 dias com valor e fase"
              info="Pagamentos lançados na tabela de pagamentos dos noivos nos últimos 7 dias. Mostra referência do evento, fase do pagamento (sinal, restante, etc.), valor liquidado e data de pagamento."
              count={data.pagamentos_recentes.length}
              empty="Sem pagamentos registados nos últimos 7 dias"
            >
              {data.pagamentos_recentes.map((p: any, i: number) => (
                <Item
                  key={i}
                  main={`${p.referencia} · ${p.fase_pagamento}`}
                  sub={p.data_pagamento ? fmtFull(p.data_pagamento) : '—'}
                  right={
                    p.valor_liquidado
                      ? <span className="text-base font-semibold text-white/70">{Number(p.valor_liquidado).toLocaleString('pt-PT')} €</span>
                      : <span className="text-sm text-white/20">Pendente</span>
                  }
                />
              ))}
            </Section>

          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-[9px] tracking-[0.4em] text-white/15 uppercase">
              Gerado às {fmtTime(data.gerado_em)} · {hoje}
            </p>
            <button
              onClick={gerar}
              disabled={loading}
              className="text-[10px] tracking-widest text-gold/40 hover:text-gold transition-colors uppercase flex items-center gap-1.5"
            >
              ↻ Atualizar
            </button>
          </div>
        </>
      )}
    </main>
  )
}
