'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FUNDO } from '@/app/media/_lib/estilo'
import type { ResultadoAgente } from '@/app/api/media-prospeccao/agente/route'

// Agente de prospeção: empresas à procura de quem lhes faça fotografia/vídeo,
// com nível de procura, sinais (links) e script de abordagem

type Empresa = ResultadoAgente['empresas'][number]
type Guardado = ResultadoAgente & { geradoEm: string; zona: string; setor: string }

const ZONAS = ['Setúbal', 'Lisboa', 'Évora', 'Porto', 'Todo o país']
const SETORES = ['Qualquer', 'Hotelaria e turismo', 'Restauração', 'Imobiliário', 'Indústria', 'Saúde e clínicas', 'Moda e retalho', 'Eventos', 'Autarquias e entidades públicas', 'Tecnologia']
const PASSOS = ['A pesquisar pedidos de orçamento e concursos…', 'A ler publicações e anúncios de eventos…', 'A confirmar os sinais e as datas…', 'A medir o nível de procura…', 'A escrever os scripts de abordagem…']
const NIVEL: Record<Empresa['nivel_procura'], { nome: string; cor: string }> = {
  alto:  { nome: 'Procura alta',  cor: '#2e6cf6' },
  medio: { nome: 'Procura média', cor: '#5a8bff' },
  baixo: { nome: 'Procura baixa', cor: '#7c8893' },
}
const CHAVE = 'rlprod-agente-ultimo'

export default function AgentePage() {
  const [zonas, setZonas]       = useState<string[]>(['Setúbal', 'Lisboa'])
  const [setor, setSetor]       = useState('Qualquer')
  const [foco, setFoco]         = useState('')
  const [aCorrer, setACorrer]   = useState(false)
  const [passo, setPasso]       = useState(0)
  const [erro, setErro]         = useState('')
  const [res, setRes]           = useState<Guardado | null>(null)
  const [aberta, setAberta]     = useState<number | null>(0)
  const [aba, setAba]           = useState<Record<number, 'email' | 'whatsapp' | 'linkedin' | 'chamada'>>({})
  const [copiado, setCopiado]   = useState('')
  const [guardadas, setGuardadas] = useState<Record<number, 'a guardar' | 'guardada'>>({})

  // Último resultado fica no browser (não se perde ao recarregar)
  useEffect(() => {
    try { const s = localStorage.getItem(CHAVE); if (s) setRes(JSON.parse(s)) } catch {}
  }, [])

  useEffect(() => {
    if (!aCorrer) return
    const t = setInterval(() => setPasso(p => Math.min(p + 1, PASSOS.length - 1)), 25000)
    return () => clearInterval(t)
  }, [aCorrer])

  async function chamar() {
    if (!zonas.length) { setErro('Escolhe pelo menos uma zona.'); return }
    setErro(''); setACorrer(true); setPasso(0); setGuardadas({}); setAberta(0)
    try {
      const r = await fetch('/api/media-prospeccao/agente', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zona: zonas.join(', '), setor: setor === 'Qualquer' ? '' : setor, foco }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro no agente.')
      const novo: Guardado = { ...d, zona: zonas.join(', '), setor }
      setRes(novo)
      try { localStorage.setItem(CHAVE, JSON.stringify(novo)) } catch {}
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro no agente.')
    } finally { setACorrer(false) }
  }

  function copiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto); setCopiado(id); setTimeout(() => setCopiado(''), 1800)
  }

  const textoScript = (e: Empresa, a: string) => {
    const s = e.script
    if (a === 'email') return `Assunto: ${s.email.assunto}\n\n${s.email.corpo}`
    if (a === 'whatsapp') return s.whatsapp
    if (a === 'linkedin') return s.linkedin
    return [
      `ABERTURA\n${s.chamada.abertura}`,
      `PERGUNTAS\n${s.chamada.perguntas.map(p => `• ${p}`).join('\n')}`,
      `OBJEÇÕES\n${s.chamada.objecoes.map(o => `• "${o.objecao}"\n  → ${o.resposta}`).join('\n')}`,
      `FECHO\n${s.chamada.fecho}`,
    ].join('\n\n')
  }

  async function guardar(e: Empresa, i: number) {
    setGuardadas(g => ({ ...g, [i]: 'a guardar' }))
    const mensagem = [
      `${NIVEL[e.nivel_procura].nome} (${e.score}/100) · Agente de prospeção`,
      `Porquê agora: ${e.porque_agora}`,
      `Serviço a propor: ${e.servico_a_propor}`,
      `Decisor: ${e.decisor.cargo}${e.decisor.nome ? ` · ${e.decisor.nome}` : ''}${e.decisor.contacto ? ` · ${e.decisor.contacto}` : ''}`,
      `Próximo passo: ${e.proximo_passo}`,
      `Sinais:\n${e.sinais.map(s => `- ${s.descricao}${s.data ? ` (${s.data})` : ''}: ${s.url}`).join('\n')}`,
      `Script (email):\n${textoScript(e, 'email')}`,
      `Script (chamada):\n${textoScript(e, 'chamada')}`,
    ].join('\n\n')
    const contactoEmail = e.decisor.contacto?.includes('@') ? e.decisor.contacto : ''
    const contactoTel = e.decisor.contacto && !e.decisor.contacto.includes('@') ? e.decisor.contacto : ''
    const r = await fetch('/api/media-leads', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interno: true, estado: 'Novo', fonte: 'Agente IA',
        nome: e.decisor.nome || e.nome, empresa: e.nome,
        email: contactoEmail, telefone: contactoTel,
        ramo: e.setor, website: e.website || '', instagram: e.instagram || '',
        tipo: e.servico_a_propor, mensagem,
      }),
    })
    setGuardadas(g => ({ ...g, [i]: r.ok ? 'guardada' : undefined as never }))
    if (!r.ok) alert('Não foi possível guardar no CRM.')
  }

  const chip = (ativo: boolean) =>
    `rounded-full border px-4 py-2 text-[13px] transition-colors ${ativo ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white' : 'border-white/[0.14] bg-white/[0.03] text-white/70 hover:border-[#5a8bff]/70 hover:text-white'}`

  return (
    <main className="rlp min-h-screen relative text-white">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 pt-8 pb-20">
        <Link href="/media/crm" className="text-[12px] text-white/45 hover:text-white transition-colors">‹ CRM</Link>

        <p className="rlp-m traco mt-6 text-[11px] text-[#5a8bff]">Agente IA · Prospeção</p>
        <h1 className="rlp-t mt-3 text-[48px] sm:text-[68px] leading-[0.95]">
          Quem precisa<br /><span className="text-[#5a8bff]">de nós agora.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] text-white/65 leading-relaxed">
          O agente procura na internet empresas à procura de quem lhes faça fotografia ou vídeo: pedidos de orçamento, concursos públicos, publicações a pedir produtora, lançamentos e eventos próximos. Mede o nível de procura e dá-te o script para avançar. Anúncios de emprego ficam de fora.
        </p>

        {/* ── Pedido ─────────────────────────────────────────────────────── */}
        <section className="mt-10 rounded-2xl border border-white/[0.1] bg-[#00141f]/70 p-6">
          <p className="rlp-m text-[10px] text-white/50 mb-3">Zona</p>
          <div className="flex flex-wrap gap-2">
            {ZONAS.map(z => (
              <button key={z} onClick={() => setZonas(s => s.includes(z) ? s.filter(x => x !== z) : [...s, z])} className={chip(zonas.includes(z))}>{z}</button>
            ))}
          </div>
          <p className="rlp-m text-[10px] text-white/50 mt-6 mb-3">Setor</p>
          <div className="flex flex-wrap gap-2">
            {SETORES.map(s => <button key={s} onClick={() => setSetor(s)} className={chip(setor === s)}>{s}</button>)}
          </div>
          <p className="rlp-m text-[10px] text-white/50 mt-6 mb-3">Indicações para o agente (opcional)</p>
          <input value={foco} onChange={e => setFoco(e.target.value)}
            placeholder="Ex.: dar prioridade a hotéis com abertura este ano, evitar empresas com produtora fixa…"
            className="w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3 text-[15px] placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6]" />

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button onClick={chamar} disabled={aCorrer}
              className="rlp-t rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-8 py-3.5 text-[19px] tracking-[0.05em] disabled:opacity-60 transition-colors"
              style={{ boxShadow: '0 10px 30px -10px rgba(46,108,246,0.7)' }}>
              {aCorrer ? 'O agente está a trabalhar…' : 'Chamar o agente →'}
            </button>
            <span className="text-[12.5px] text-white/45">Demora 1 a 4 minutos. Cada pesquisa custa alguns cêntimos.</span>
          </div>
          {aCorrer && (
            <div className="mt-5 flex items-center gap-3 text-[14px] text-[#a9c1ff]">
              <span className="w-2 h-2 rounded-full bg-[#5a8bff] animate-pulse" />{PASSOS[passo]}
            </div>
          )}
          {erro && <p className="mt-4 rounded-md border border-[#ff4747]/40 bg-[#ff4747]/[0.08] px-4 py-3 text-[14px] text-[#ff8a8a]">{erro}</p>}
        </section>

        {/* ── Resultados ─────────────────────────────────────────────────── */}
        {res && !aCorrer && (
          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Resultado</p>
                <h2 className="rlp-t mt-2 text-[30px]">{res.empresas.length} {res.empresas.length === 1 ? 'oportunidade' : 'oportunidades'}</h2>
              </div>
              <p className="text-[12px] text-white/40">
                {res.zona} · {res.setor} · {new Date(res.geradoEm).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <p className="mt-3 max-w-3xl text-[14.5px] text-white/70 leading-relaxed">{res.resumo}</p>

            <div className="mt-6 flex flex-col gap-4">
              {res.empresas.map((e, i) => {
                const n = NIVEL[e.nivel_procura]
                const a = aba[i] ?? 'email'
                const txt = textoScript(e, a)
                return (
                  <article key={i} className="rounded-2xl border border-white/[0.1] bg-[#00141f]/75 overflow-hidden">
                    <button onClick={() => setAberta(aberta === i ? null : i)} className="w-full text-left px-6 py-5 flex flex-wrap items-center gap-4">
                      <span className="rlp-t text-[34px] leading-none w-14 text-center" style={{ color: n.cor }}>{e.score}</span>
                      <span className="flex-1 min-w-[200px]">
                        <span className="block rlp-t text-[22px] leading-tight">{e.nome}</span>
                        <span className="block text-[12.5px] text-white/50">{e.setor} · {e.localizacao}</span>
                      </span>
                      <span className="rlp-m rounded-full border px-3 py-1.5 text-[9.5px]" style={{ color: n.cor, borderColor: `${n.cor}88`, background: `${n.cor}1a` }}>{n.nome}</span>
                      <span className="text-white/40 text-[12px]">{aberta === i ? '▲' : '▼'}</span>
                    </button>
                    <div className="h-1 bg-white/[0.05]"><div className="h-full" style={{ width: `${e.score}%`, background: n.cor }} /></div>

                    {aberta === i && (
                      <div className="px-6 py-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                        <div className="space-y-5">
                          <div>
                            <p className="rlp-m text-[9.5px] text-[#5a8bff] mb-1.5">Porquê agora</p>
                            <p className="text-[14px] text-white/80 leading-relaxed">{e.porque_agora}</p>
                          </div>
                          <div>
                            <p className="rlp-m text-[9.5px] text-[#5a8bff] mb-2">Sinais encontrados</p>
                            <ul className="space-y-2">
                              {e.sinais.map((s, j) => (
                                <li key={j} className="text-[13.5px] text-white/75 leading-snug">
                                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                                    {s.descricao}{s.data && <span className="text-white/40"> · {s.data}</span>} <span className="text-[#5a8bff]">↗</span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="rlp-m text-[9.5px] text-[#5a8bff] mb-1.5">Serviço a propor</p>
                              <p className="text-[13.5px] text-white/80">{e.servico_a_propor}</p>
                            </div>
                            <div>
                              <p className="rlp-m text-[9.5px] text-[#5a8bff] mb-1.5">Quem decide</p>
                              <p className="text-[13.5px] text-white/80">{e.decisor.cargo}{e.decisor.nome && ` · ${e.decisor.nome}`}</p>
                              {e.decisor.contacto && <p className="text-[12.5px] text-white/55">{e.decisor.contacto}</p>}
                            </div>
                          </div>
                          <div className="rounded-xl border border-[#2e6cf6]/40 bg-[#2e6cf6]/[0.08] px-4 py-3">
                            <p className="rlp-m text-[9.5px] text-[#a9c1ff] mb-1">Próximo passo</p>
                            <p className="text-[14px] text-white/90">{e.proximo_passo}</p>
                          </div>
                          <div className="flex flex-wrap gap-3 text-[12.5px]">
                            {e.website && <a href={/^https?:/.test(e.website) ? e.website : `https://${e.website}`} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white">Site ↗</a>}
                            {e.instagram && <a href={/^https?:/.test(e.instagram) ? e.instagram : `https://instagram.com/${e.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white">Instagram ↗</a>}
                          </div>
                          <button onClick={() => guardar(e, i)} disabled={!!guardadas[i]}
                            className={`w-full rounded-md px-5 py-3 text-[14px] font-medium transition-colors ${guardadas[i] === 'guardada' ? 'border border-[#5a8bff]/60 text-[#a9c1ff]' : 'bg-white text-[#00141f] hover:bg-white/90'} disabled:cursor-default`}>
                            {guardadas[i] === 'guardada' ? '✓ Guardada no CRM (Novo)' : guardadas[i] === 'a guardar' ? 'A guardar…' : '+ Guardar no CRM'}
                          </button>
                        </div>

                        {/* Script */}
                        <div className="rounded-xl border border-white/[0.1] bg-[#0c2236]/70 p-4">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex gap-1 rounded-full border border-white/[0.12] p-1">
                              {(['email', 'whatsapp', 'linkedin', 'chamada'] as const).map(x => (
                                <button key={x} onClick={() => setAba(s => ({ ...s, [i]: x }))}
                                  className={`rounded-full px-3 py-1.5 text-[12px] capitalize transition-colors ${a === x ? 'bg-[#2e6cf6] text-white' : 'text-white/55 hover:text-white'}`}>
                                  {x === 'whatsapp' ? 'WhatsApp' : x === 'linkedin' ? 'LinkedIn' : x}
                                </button>
                              ))}
                            </div>
                            <button onClick={() => copiar(txt, `${i}-${a}`)} className="text-[12px] text-[#5a8bff] hover:text-white">
                              {copiado === `${i}-${a}` ? '✓ Copiado' : 'Copiar'}
                            </button>
                          </div>
                          <pre className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-white/85 font-[inherit] max-h-[460px] overflow-y-auto">{txt}</pre>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
              {res.empresas.length === 0 && (
                <p className="rounded-2xl border border-white/[0.1] bg-[#00141f]/70 px-6 py-8 text-[14px] text-white/60">
                  O agente não encontrou procura com sinais confirmados. Experimenta outra zona ou outro setor.
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
