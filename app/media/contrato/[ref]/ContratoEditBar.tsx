'use client'
import { useState } from 'react'
import Link from 'next/link'
import PrintButton from './PrintButton'
import { CLAUSULAS_EDITAVEIS, CLAUSULAS_DEFAULT, type ClausulasMap } from './clausulas-defaults'

export interface ClausulaCustom {
  id: string
  titulo: string
  texto: string
}

interface Props {
  refUp: string
  contrato: { ref?: string; estado?: string; geradoEm?: string }
  fichaInit: Record<string, string>
  clausulasInit: ClausulasMap
  removidas_init: string[]
  custom_init: ClausulaCustom[]
  isAdmin: boolean
}

const FIELDS: { key: string; label: string; placeholder?: string }[] = [
  { key: 'nome',               label: 'Nome do Cliente',       placeholder: 'Nome completo' },
  { key: 'empresa',            label: 'Empresa / Marca',       placeholder: 'Nome da empresa' },
  { key: 'nif',                label: 'NIF / NIPC',            placeholder: '000 000 000' },
  { key: 'email',              label: 'Email',                 placeholder: 'email@empresa.pt' },
  { key: 'telefone',           label: 'Telefone',              placeholder: '+351 900 000 000' },
  { key: 'morada',             label: 'Morada',                placeholder: 'Rua, cidade' },
  { key: 'representanteLegal', label: 'Representante Legal',   placeholder: 'Nome do representante' },
  { key: 'localEvento',        label: 'Local do Evento',       placeholder: 'Lisboa' },
  { key: 'orcamento',          label: 'Orçamento (€)',         placeholder: '3000' },
  { key: 'localAssinatura',    label: 'Local de Assinatura',   placeholder: 'Lisboa' },
]

const TEXT_AREAS: { key: string; label: string; placeholder: string; rows: number }[] = [
  { key: 'servicosList',      label: 'Serviços Contratados', placeholder: 'Um serviço por linha\nEx: Fotografia — 8h', rows: 5 },
  { key: 'profissionaisList', label: 'Profissionais',        placeholder: 'Um por linha\nEx: Fotógrafo Principal', rows: 3 },
  { key: 'metodoPagamento',   label: 'Plano de Pagamentos',  placeholder: '80% na assinatura — 2400€\n20% após entrega — 600€', rows: 3 },
]

type Tab = 'dados' | 'conteudo' | 'clausulas'

export default function ContratoEditBar({
  refUp, contrato, fichaInit, clausulasInit, removidas_init, custom_init, isAdmin,
}: Props) {
  const [editing, setEditing]   = useState(false)
  const [tab, setTab]           = useState<Tab>('dados')
  const [ficha, setFicha]       = useState<Record<string, string>>(fichaInit ?? {})
  const [clausulas, setClausulas] = useState<ClausulasMap>(clausulasInit ?? {})
  const [removidas, setRemovidas] = useState<string[]>(removidas_init ?? [])
  const [custom, setCustom]     = useState<ClausulaCustom[]>(custom_init ?? [])
  const [saving, setSaving]     = useState(false)
  const [marcandoAssinado, setMarcandoAssinado] = useState(false)

  // Nova cláusula
  const [addingNew, setAddingNew] = useState(false)
  const [novaClausula, setNovaClausula] = useState({ titulo: '', texto: '' })

  const setFichaField  = (k: string, v: string) => setFicha(f => ({ ...f, [k]: v }))
  const setClausulaVal = (k: string, v: string) => setClausulas(c => ({ ...c, [k]: v }))
  const remover        = (k: string) => setRemovidas(r => [...r, k])
  const restaurar      = (k: string) => setRemovidas(r => r.filter(x => x !== k))
  const removeCustom   = (id: string) => setCustom(c => c.filter(x => x.id !== id))
  const updateCustom   = (id: string, field: 'titulo' | 'texto', v: string) =>
    setCustom(c => c.map(x => x.id === id ? { ...x, [field]: v } : x))

  const addClausula = () => {
    if (!novaClausula.titulo.trim()) return
    setCustom(c => [...c, { id: `custom_${Date.now()}`, titulo: novaClausula.titulo, texto: novaClausula.texto }])
    setNovaClausula({ titulo: '', texto: '' })
    setAddingNew(false)
  }

  const marcarAssinado = async () => {
    setMarcandoAssinado(true)
    try {
      await fetch(`/api/media-portal/${refUp}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contrato: { ...contrato, estado: 'Assinado' } }),
      })
      window.location.reload()
    } catch {}
    setMarcandoAssinado(false)
  }

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${refUp}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ficha: { ...ficha, ref: refUp },
          clausulas,
          clausulasRemovidas: removidas,
          clausulasCustom: custom,
        }),
      })
      setEditing(false)
      window.location.reload()
    } catch {}
    setSaving(false)
  }

  // Estado do contrato com as cores da RL PROD
  const estadoBadge = (() => {
    switch (contrato.estado) {
      case 'Assinado':   return 'border-[#2e6cf6] bg-[#2e6cf6]/25 text-[#a9c1ff]'
      case 'disponivel': return 'border-[#5a8bff]/60 text-[#a9c1ff]'
      case 'rascunho':   return 'border-white/25 text-white/60'
      default:           return 'border-white/15 text-white/40'
    }
  })()

  const estadoLabel = contrato.estado === 'rascunho' ? 'Rascunho'
    : contrato.estado === 'disponivel' ? 'Disponível'
    : contrato.estado ?? 'Sem estado'

  const TABS: { id: Tab; label: string }[] = [
    { id: 'dados',     label: 'Dados' },
    { id: 'conteudo',  label: 'Conteúdo' },
    { id: 'clausulas', label: 'Cláusulas' },
  ]

  const INPUT = 'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#2e6cf6] transition-colors'
  const ROTULO = 'rlp-m text-[9px] text-white/50'
  const SECAO = 'rlp-m traco text-[9.5px] text-[#5a8bff]'

  return (
    <>
      {/* ── Barra topo ── */}
      <div className="rlp print:hidden sticky top-0 z-50 border-b border-white/[0.08] bg-[#00141f]/90 backdrop-blur-md px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-white">
        <Link href={`/portal-media/${refUp}/contrato`}
          className="rlp-m text-[10px] text-white/50 hover:text-white transition-colors">
          ‹ Voltar ao portal
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rlp-m text-[9px] text-white/40">{contrato.ref}</span>
          <span className={`rlp-m rounded-full border px-2.5 py-1 text-[8.5px] ${estadoBadge}`}>{estadoLabel}</span>
          {isAdmin && contrato.estado === 'disponivel' && (
            <button
              onClick={marcarAssinado}
              disabled={marcandoAssinado}
              className="rounded-full border border-[#2e6cf6] bg-[#2e6cf6]/15 hover:bg-[#2e6cf6]/30 px-4 py-2 text-[12.5px] text-[#a9c1ff] hover:text-white transition-colors disabled:opacity-40"
            >
              {marcandoAssinado ? 'A marcar…' : '✓ Marcar assinado'}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => { setTab('dados'); setEditing(true) }}
              className="rounded-full border border-white/[0.16] hover:border-white/40 px-4 py-2 text-[12.5px] text-white/80 hover:text-white transition-colors"
            >
              ✎ Editar
            </button>
          )}
          <PrintButton />
        </div>
      </div>

      {/* ── Gaveta de edição ── */}
      {editing && (
        <>
          <div className="print:hidden fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
            onClick={() => !saving && setEditing(false)} />

          <div className="rlp print:hidden fixed inset-y-0 right-0 z-[100] w-full max-w-lg flex flex-col border-l border-white/[0.08] bg-[#00141f] text-white">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
              <div>
                <p className={SECAO}>Editar contrato</p>
                <p className="rlp-t mt-1.5 text-[24px] leading-none">{contrato.ref}</p>
              </div>
              <button onClick={() => setEditing(false)} aria-label="Fechar"
                className="text-white/40 hover:text-white text-xl transition-colors leading-none">✕</button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4">
              <div className="grid grid-cols-3 gap-1 rounded-full border border-white/[0.1] bg-[#0c2236]/60 p-1">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`rounded-full py-2 text-[12.5px] transition-colors ${
                      tab === t.id ? 'bg-[#2e6cf6] text-white' : 'text-white/55 hover:text-white'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scroll */}
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">

              {/* ── Tab Dados ── */}
              {tab === 'dados' && (
                <>
                  <p className={SECAO}>Dados do cliente</p>
                  {FIELDS.map(({ key, label, placeholder }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className={ROTULO}>{label}</label>
                      <input value={ficha[key] ?? ''} onChange={e => setFichaField(key, e.target.value)}
                        placeholder={placeholder} className={INPUT} />
                    </div>
                  ))}
                </>
              )}

              {/* ── Tab Conteúdo ── */}
              {tab === 'conteudo' && (
                <>
                  <p className={SECAO}>Conteúdo do contrato</p>
                  {TEXT_AREAS.map(({ key, label, placeholder, rows }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className={ROTULO}>{label}</label>
                      <textarea value={ficha[key] ?? ''} onChange={e => setFichaField(key, e.target.value)}
                        placeholder={placeholder} rows={rows} className={`${INPUT} resize-none leading-relaxed`} />
                    </div>
                  ))}
                </>
              )}

              {/* ── Tab Cláusulas ── */}
              {tab === 'clausulas' && (
                <>
                  <p className={SECAO}>Cláusulas padrão</p>
                  <p className="text-[12.5px] text-white/50 leading-relaxed -mt-1">
                    Edita o texto, remove ou restaura cada cláusula. Linhas com &quot;1.&quot; ficam a negrito no contrato.
                  </p>

                  {/* Default clauses */}
                  {CLAUSULAS_EDITAVEIS.map(({ key, titulo }) => {
                    const isRemovida = removidas.includes(key)
                    return (
                      <div key={key}
                        className={`flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-[#0c2236]/50 p-3.5 ${isRemovida ? 'opacity-50' : ''}`}>
                        <div className="flex items-center justify-between gap-2">
                          <label className={`rlp-t text-[16px] leading-tight ${isRemovida ? 'line-through text-white/40' : 'text-white'}`}>
                            {titulo}
                          </label>
                          {isRemovida ? (
                            <button onClick={() => restaurar(key)}
                              className="shrink-0 text-[12px] text-[#a9c1ff] hover:text-white transition-colors">
                              ↺ Restaurar
                            </button>
                          ) : (
                            <button onClick={() => remover(key)}
                              className="shrink-0 text-[12px] text-white/40 hover:text-[#ff4747] transition-colors">
                              Remover
                            </button>
                          )}
                        </div>
                        {!isRemovida && (
                          <>
                            <textarea
                              value={clausulas[key] ?? ''}
                              onChange={e => setClausulaVal(key, e.target.value)}
                              placeholder={CLAUSULAS_DEFAULT[key] ?? ''}
                              rows={4}
                              className={`${INPUT} text-[13px] resize-y leading-relaxed`}
                            />
                            {clausulas[key] && clausulas[key] !== CLAUSULAS_DEFAULT[key] && (
                              <button onClick={() => setClausulaVal(key, '')}
                                className="self-start text-[12px] text-white/45 hover:text-white transition-colors">
                                ↺ Repor padrão
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}

                  {/* Custom clauses */}
                  {custom.length > 0 && (
                    <div className="flex flex-col gap-3 pt-2">
                      <p className={SECAO}>Cláusulas adicionadas</p>
                      {custom.map(c => (
                        <div key={c.id} className="flex flex-col gap-2 rounded-xl border border-[#2e6cf6]/30 bg-[#0c2236]/50 p-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              value={c.titulo}
                              onChange={e => updateCustom(c.id, 'titulo', e.target.value)}
                              placeholder="Título da cláusula"
                              className={`${INPUT} flex-1`}
                            />
                            <button onClick={() => removeCustom(c.id)}
                              className="shrink-0 text-[12px] text-white/40 hover:text-[#ff4747] transition-colors">
                              Eliminar
                            </button>
                          </div>
                          <textarea
                            value={c.texto}
                            onChange={e => updateCustom(c.id, 'texto', e.target.value)}
                            placeholder="Texto da cláusula..."
                            rows={4}
                            className={`${INPUT} text-[13px] resize-y leading-relaxed`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new clause */}
                  <div className="pt-2">
                    {addingNew ? (
                      <div className="flex flex-col gap-3 rounded-xl border border-dashed border-[#2e6cf6]/50 p-3.5">
                        <p className={SECAO}>Nova cláusula</p>
                        <input
                          value={novaClausula.titulo}
                          onChange={e => setNovaClausula(n => ({ ...n, titulo: e.target.value }))}
                          placeholder="Título (ex: Décima Terceira Cláusula)"
                          className={INPUT}
                        />
                        <textarea
                          value={novaClausula.texto}
                          onChange={e => setNovaClausula(n => ({ ...n, texto: e.target.value }))}
                          placeholder="Texto da nova cláusula..."
                          rows={5}
                          className={`${INPUT} text-[13px] resize-none leading-relaxed`}
                        />
                        <div className="flex items-center gap-3">
                          <button onClick={addClausula}
                            disabled={!novaClausula.titulo.trim()}
                            className="rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-5 py-2 text-[13px] font-medium transition-colors disabled:opacity-40">
                            + Adicionar
                          </button>
                          <button onClick={() => { setAddingNew(false); setNovaClausula({ titulo: '', texto: '' }) }}
                            className="text-[13px] text-white/50 hover:text-white transition-colors">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingNew(true)}
                        className="w-full rounded-xl border border-dashed border-white/20 hover:border-[#2e6cf6] py-3 text-[13px] text-white/55 hover:text-white transition-colors">
                        + Nova cláusula
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex items-center justify-between gap-3 border-t border-white/[0.08]">
              <button onClick={() => setEditing(false)} disabled={saving}
                className="text-[13px] text-white/50 hover:text-white transition-colors disabled:opacity-40">
                Cancelar
              </button>
              <button onClick={save} disabled={saving}
                className="rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-6 py-2.5 text-[13.5px] font-medium transition-colors disabled:opacity-40">
                {saving ? 'A guardar…' : 'Guardar e atualizar'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
