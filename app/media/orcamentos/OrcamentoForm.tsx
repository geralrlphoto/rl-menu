'use client'

import { useEffect, useMemo, useState } from 'react'
import CampoDataPT from '@/app/media/_components/CampoDataPT'
import {
  CATALOG, COBERTURAS, ESTADOS, ICONE_COBERTURA, COR_ESTADO,
  fmtEur, fmtIntervaloEvento, fmtRange, inputCls, labelCls, uid,
  type CatalogItem, type Cobertura, type Estado, type Orcamento, type Proposta, type ServicoSelected,
} from './dados'

function emptyProposta(): Proposta {
  return { id: uid(), titulo: '', valor: 0, descricao: null, servicos: [] }
}

function Secao({ n, titulo, extra, children }: { n: string; titulo: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <div className="flex items-baseline gap-3">
          <span className="rlp-t text-[32px] leading-none text-[#2e6cf6]">{n}</span>
          <h3 className="rlp-t text-[20px]">{titulo}</h3>
        </div>
        {extra}
      </div>
      {children}
    </section>
  )
}

export default function OrcamentoForm({
  initial,
  onClose,
  onSave,
}: {
  initial: Orcamento | null
  onClose: () => void
  onSave: (o: Orcamento) => void
}) {
  const [cliente, setCliente]       = useState(initial?.cliente ?? '')
  const [contacto, setContacto]     = useState(initial?.contacto ?? '')
  const [email, setEmail]           = useState(initial?.email ?? '')
  const [cobertura, setCobertura]   = useState<Cobertura | null>(initial?.cobertura ?? null)
  const [resumo, setResumo]         = useState(initial?.resumo ?? '')
  const [dataInicio, setDataInicio] = useState(initial?.data_inicio ?? '')
  const [dataFim, setDataFim]       = useState(initial?.data_fim ?? '')
  const [validade, setValidade]     = useState(initial?.validade ?? '')
  const [estado, setEstado]         = useState<Estado>(initial?.estado ?? 'Pendente')
  const [notas, setNotas]           = useState(initial?.notas ?? '')
  const [propostas, setPropostas]   = useState<Proposta[]>(
    initial?.propostas && initial.propostas.length > 0 ? initial.propostas : [emptyProposta()]
  )
  const [openCatalog, setOpenCatalog] = useState<string | null>(null) // id da proposta
  const [erro, setErro] = useState<string | null>(null)

  // Esc fecha o editor
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function addProposta() {
    setPropostas(prev => prev.length >= 3 ? prev : [...prev, emptyProposta()])
  }
  function removeProposta(id: string) {
    setPropostas(prev => prev.length <= 1 ? prev : prev.filter(p => p.id !== id))
  }
  function updateProposta(id: string, patch: Partial<Proposta>) {
    setPropostas(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }
  function toggleServico(propostaId: string, item: Pick<CatalogItem, 'id' | 'nome' | 'desc' | 'hasDuration' | 'durations'>) {
    setPropostas(prev => prev.map(p => {
      if (p.id !== propostaId) return p
      if (p.servicos.find(s => s.catalogId === item.id)) {
        return { ...p, servicos: p.servicos.filter(s => s.catalogId !== item.id) }
      }
      const novo: ServicoSelected = {
        catalogId: item.id,
        nome: item.nome,
        desc: item.desc,
        ...(item.hasDuration ? { duracao: item.durations?.[0] } : {}),
      }
      return { ...p, servicos: [...p.servicos, novo] }
    }))
  }
  function updateServicoDuracao(propostaId: string, catalogId: string, duracao: string) {
    setPropostas(prev => prev.map(p => p.id !== propostaId ? p : {
      ...p,
      servicos: p.servicos.map(s => s.catalogId === catalogId ? { ...s, duracao } : s),
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cliente.trim()) { setErro('Indica o nome da empresa.'); return }
    if (!cobertura) { setErro('Escolhe a cobertura (Fotografia, Vídeo ou ambos).'); return }
    if (propostas.some(p => !p.titulo.trim())) { setErro('Cada proposta precisa de um título.'); return }
    if (dataInicio && dataFim && dataFim < dataInicio) {
      setErro('A data final do evento não pode ser anterior à data de início.')
      return
    }
    setErro(null)
    const o: Orcamento = {
      id:        initial?.id ?? uid(),
      cliente:   cliente.trim(),
      contacto:  contacto.trim() || null,
      email:     email.trim() || null,
      cobertura,
      resumo:    resumo.trim() || null,
      propostas: propostas.map(p => ({
        ...p,
        titulo: p.titulo.trim(),
        valor: typeof p.valor === 'number' ? p.valor : parseFloat(String(p.valor).replace(',', '.')) || 0,
        descricao: p.descricao?.trim() || null,
      })),
      data_inicio: dataInicio || null,
      data_fim:    dataFim || null,
      validade:    validade || null,
      estado,
      notas:       notas.trim() || null,
      criado_em:   initial?.criado_em ?? new Date().toISOString(),
    }
    onSave(o)
  }

  // Catálogo agrupado por categoria
  const catalogByCat = useMemo(() => {
    const acc: Record<string, CatalogItem[]> = {}
    for (const it of CATALOG) (acc[it.categoria] ||= []).push(it)
    return acc
  }, [])

  const totalServicos = propostas.reduce((s, p) => s + p.servicos.length, 0)

  return (
    <div className="rlp fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-[#00141f]/90" />
      <form onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="relative z-10 w-full max-w-4xl max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col rounded-2xl overflow-hidden border border-white/[0.12] bg-[#0c2236] text-white shadow-2xl">

        {/* Cabeçalho */}
        <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-white/[0.1] flex items-start justify-between gap-4">
          <div>
            <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Orçamento · Empresas</p>
            <h2 className="rlp-t mt-2 text-[30px] sm:text-[36px] leading-none">
              {initial ? <>Editar <span className="text-[#5a8bff]">orçamento.</span></> : <>Novo <span className="text-[#5a8bff]">orçamento.</span></>}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar"
            className="w-9 h-9 shrink-0 rounded-full border border-white/[0.12] text-white/50 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center">
            ✕
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-7 space-y-10">

          <Secao n="01" titulo="Cliente">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Empresa *</label>
                <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nome da empresa"
                  className={inputCls} autoFocus />
              </div>
              <div>
                <label className={labelCls}>Pessoa de contacto</label>
                <input value={contacto} onChange={e => setContacto(e.target.value)} placeholder="Nome do responsável" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contacto@empresa.pt" className={inputCls} />
              </div>
            </div>
          </Secao>

          <Secao n="02" titulo="Evento">
            <label className={labelCls}>Cobertura *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {COBERTURAS.map(c => {
                const ativo = cobertura === c
                return (
                  <button key={c} type="button" onClick={() => setCobertura(c)}
                    className={`rounded-xl border px-4 py-3.5 text-left transition-colors flex items-center gap-3 ${
                      ativo
                        ? 'border-[#2e6cf6] bg-[#2e6cf6]/[0.15] text-white'
                        : 'border-white/[0.12] bg-[#00141f]/50 text-white/55 hover:text-white hover:border-white/30'
                    }`}>
                    <span className={`text-[18px] leading-none ${ativo ? 'text-[#5a8bff]' : ''}`}>{ICONE_COBERTURA[c]}</span>
                    <span className="rlp-t text-[16px] tracking-[0.03em]">{c}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Início do evento</label>
                <CampoDataPT value={dataInicio} onChange={setDataInicio} className={inputCls + ' w-full'} />
              </div>
              <div>
                <label className={labelCls}>Fim <span className="normal-case tracking-normal text-white/35">(opcional, multi-dia)</span></label>
                <CampoDataPT value={dataFim} onChange={setDataFim} min={dataInicio || undefined} className={inputCls + ' w-full'} />
              </div>
            </div>
            {dataInicio && dataFim && (
              <p className="mt-2 text-[12.5px] text-[#a9c1ff]/80">
                {dataInicio === dataFim ? 'Evento de um dia.' : `Evento multi-dia: ${fmtIntervaloEvento(dataInicio, dataFim)}.`}
              </p>
            )}

            <div className="mt-6">
              <label className={labelCls}>Resumo do serviço</label>
              <textarea value={resumo} onChange={e => setResumo(e.target.value)} rows={2}
                placeholder="Objetivo da campanha, contexto do evento…"
                className={inputCls + ' resize-none leading-relaxed'} />
            </div>
          </Secao>

          <Secao n="03" titulo="Propostas"
            extra={
              <button type="button" onClick={addProposta} disabled={propostas.length >= 3}
                className="rounded-full text-[12px] px-4 py-2 border border-white/[0.12] text-white/70 hover:text-white hover:border-[#2e6cf6] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                + Proposta <span className="text-white/40">({propostas.length}/3)</span>
              </button>
            }>
            <div className="space-y-4">
              {propostas.map((p, i) => (
                <div key={p.id} className="rounded-2xl border border-white/[0.1] bg-[#00141f]/60 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <p className="rlp-m text-[10px] text-[#5a8bff]">Proposta {i + 1}</p>
                    <div className="flex items-center gap-4">
                      <span className="rlp-t text-[20px] tabular-nums">{fmtEur(p.valor)}</span>
                      {propostas.length > 1 && (
                        <button type="button" onClick={() => removeProposta(p.id)}
                          className="rlp-m text-[9.5px] text-white/40 hover:text-[#ff4747] transition-colors">
                          Remover
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] gap-3 mb-4">
                    <input value={p.titulo}
                      onChange={e => updateProposta(p.id, { titulo: e.target.value })}
                      placeholder={i === 0 ? 'Ex.: Pacote Standard' : i === 1 ? 'Ex.: Pacote Premium' : 'Ex.: Pacote Executive'}
                      className={inputCls} />
                    <div className="relative">
                      <input type="number" inputMode="decimal" min="0" step="0.01"
                        value={p.valor || ''}
                        onChange={e => updateProposta(p.id, { valor: parseFloat(e.target.value) || 0 })}
                        placeholder="Valor"
                        className={inputCls + ' tabular-nums pr-10'} />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35">€</span>
                    </div>
                  </div>

                  {/* Serviços incluídos */}
                  {p.servicos.length > 0 && (
                    <div className="mb-3">
                      <p className="rlp-m text-[9.5px] text-white/45 mb-2">Incluído ({p.servicos.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.servicos.map(s => {
                          const item = CATALOG.find(c => c.id === s.catalogId)
                          return (
                            <span key={s.catalogId}
                              className="inline-flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-full border border-[#5a8bff]/40 bg-[#2e6cf6]/[0.1] text-[#a9c1ff]">
                              <span>{s.nome}</span>
                              {item?.hasDuration && item.durations && (
                                <select value={s.duracao}
                                  onChange={e => updateServicoDuracao(p.id, s.catalogId, e.target.value)}
                                  className="bg-[#00141f] border border-[#5a8bff]/40 rounded-full px-2 py-0.5 text-[11px] text-white cursor-pointer focus:outline-none [color-scheme:dark]">
                                  {item.durations.map(d => <option key={d} value={d} className="bg-[#00141f] text-white">{d}</option>)}
                                </select>
                              )}
                              <button type="button" aria-label={`Retirar ${s.nome}`}
                                onClick={() => toggleServico(p.id, item ?? { id: s.catalogId, nome: s.nome, desc: s.desc })}
                                className="text-white/45 hover:text-white">✕</button>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Catálogo */}
                  <button type="button" onClick={() => setOpenCatalog(openCatalog === p.id ? null : p.id)}
                    className={`w-full rounded-md border px-4 py-2.5 text-[13px] transition-colors flex items-center justify-center gap-2 ${
                      openCatalog === p.id ? 'border-[#2e6cf6] text-white' : 'border-white/[0.12] text-white/65 hover:text-white hover:border-white/30'
                    }`}>
                    {openCatalog === p.id ? '▴ Fechar catálogo de serviços' : '▾ Adicionar serviços do catálogo'}
                  </button>

                  {openCatalog === p.id && (
                    <div className="mt-3 rounded-xl border border-white/[0.1] bg-[#00141f]/70 p-3 sm:p-4 space-y-4 max-h-[45vh] overflow-y-auto">
                      {Object.entries(catalogByCat).map(([cat, items]) => (
                        <div key={cat}>
                          <p className="rlp-m traco text-[9.5px] text-[#5a8bff] mb-2">{cat}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {items.map(item => {
                              const selected = !!p.servicos.find(s => s.catalogId === item.id)
                              return (
                                <button key={item.id} type="button"
                                  onClick={() => toggleServico(p.id, item)}
                                  title={item.desc}
                                  className={`text-left p-3 rounded-lg border transition-colors ${
                                    selected
                                      ? 'border-[#2e6cf6] bg-[#2e6cf6]/[0.12] text-white'
                                      : 'border-white/[0.08] bg-[#0c2236]/60 text-white/60 hover:text-white hover:border-white/25'
                                  }`}>
                                  <div className="flex items-start gap-2.5">
                                    <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 ${
                                      selected ? 'bg-[#2e6cf6] border-[#2e6cf6] text-white' : 'border-white/25'
                                    }`}>
                                      {selected ? '✓' : ''}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-[13px] font-medium leading-tight">{item.nome}</p>
                                      <p className="text-[11.5px] text-white/45 leading-snug mt-1">{item.desc}</p>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <textarea value={p.descricao ?? ''}
                    onChange={e => updateProposta(p.id, { descricao: e.target.value })}
                    placeholder="Notas adicionais a esta proposta (opcional)…"
                    rows={2}
                    className={inputCls + ' resize-none mt-3 leading-relaxed'} />
                </div>
              ))}
            </div>
          </Secao>

          <Secao n="04" titulo="Fecho">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Validade do orçamento</label>
                <CampoDataPT value={validade} onChange={setValidade} className={inputCls + ' w-full'} />
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <div className="flex flex-wrap gap-2">
                  {ESTADOS.map(s => {
                    const ativo = estado === s
                    const c = COR_ESTADO[s]
                    return (
                      <button key={s} type="button" onClick={() => setEstado(s)}
                        className="rounded-full text-[12px] px-4 py-2 border transition-colors"
                        style={ativo
                          ? { color: c, borderColor: c, background: `${c}1f` }
                          : { color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.12)' }}>
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="mt-5">
              <label className={labelCls}>Notas internas</label>
              <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
                placeholder="Apontamentos sobre o cliente, conversa, follow-ups…"
                className={inputCls + ' resize-none leading-relaxed'} />
            </div>
          </Secao>
        </div>

        {/* Rodapé fixo com totais */}
        <div className="border-t border-white/[0.1] bg-[#00141f] px-6 sm:px-8 py-4">
          {erro && (
            <p className="mb-3 rounded-md border border-[#ff4747]/40 bg-[#ff4747]/[0.08] px-4 py-2.5 text-[13.5px] text-[#ff8a8a]">{erro}</p>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="rlp-m text-[9.5px] text-white/45">
                {propostas.length} proposta{propostas.length === 1 ? '' : 's'} · {totalServicos} serviço{totalServicos === 1 ? '' : 's'}
              </p>
              <div className="mt-1 flex items-baseline gap-3 flex-wrap">
                <span className="rlp-t text-[26px] leading-none tabular-nums">{fmtRange(propostas)}</span>
                <span className="text-[12px] text-white/40 truncate">
                  {propostas.map((p, i) => `P${i + 1} ${fmtEur(p.valor)}`).join(' · ')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={onClose}
                className="rounded-md border border-white/25 hover:border-white/50 px-5 py-3 text-[14px] text-white/80 hover:text-white transition-colors">
                Cancelar
              </button>
              <button type="submit"
                className="rlp-t rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-7 py-3 text-[17px] tracking-[0.06em] text-white transition-colors"
                style={{ boxShadow: '0 10px 30px -10px rgba(46,108,246,0.7)' }}>
                {initial ? 'Guardar' : 'Criar orçamento'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
