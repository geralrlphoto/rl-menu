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

  const estadoBadge = (() => {
    switch (contrato.estado) {
      case 'Assinado':   return 'border-emerald-400/30 text-emerald-400/60'
      case 'disponivel': return 'border-emerald-400/20 text-emerald-400/50'
      case 'rascunho':   return 'border-amber-400/30 text-amber-400/50'
      default:           return 'border-white/10 text-white/25'
    }
  })()

  const estadoLabel = contrato.estado === 'rascunho' ? 'Rascunho'
    : contrato.estado === 'disponivel' ? 'Disponível'
    : contrato.estado ?? '—'

  const TABS: { id: Tab; label: string }[] = [
    { id: 'dados',     label: 'Dados' },
    { id: 'conteudo',  label: 'Conteúdo' },
    { id: 'clausulas', label: 'Cláusulas' },
  ]

  return (
    <>
      {/* ── Barra topo ── */}
      <div className="print:hidden bg-black border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href={`/portal-media/${refUp}/contrato`}
          className="text-[9px] tracking-[0.4em] text-white/30 hover:text-white/60 uppercase transition-colors">
          ‹ Voltar ao Portal
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[8px] tracking-[0.4em] text-white/20 uppercase font-mono">{contrato.ref}</span>
          <span className={`text-[8px] tracking-[0.3em] uppercase px-2 py-1 border ${estadoBadge}`}>{estadoLabel}</span>
          {isAdmin && (
            <button
              onClick={() => { setTab('dados'); setEditing(true) }}
              className="border border-white/20 hover:border-white/40 px-3 py-1.5
                         text-[8px] tracking-[0.35em] text-white/40 hover:text-white/70 uppercase transition-colors"
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
          <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
            onClick={() => !saving && setEditing(false)} />

          <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-lg flex flex-col"
            style={{ background: '#06090f', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <p className="text-[9px] tracking-[0.5em] text-white/25 uppercase">Editar Contrato</p>
                <p className="text-[11px] tracking-[0.15em] text-white/45 mt-0.5 font-light">{contrato.ref}</p>
              </div>
              <button onClick={() => setEditing(false)}
                className="text-white/20 hover:text-white/60 text-xl transition-colors leading-none">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 py-3 text-[9px] tracking-[0.35em] uppercase transition-colors ${
                    tab === t.id ? 'text-white/70 border-b border-white/30' : 'text-white/25 hover:text-white/50'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Scroll */}
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">

              {/* ── Tab Dados ── */}
              {tab === 'dados' && (
                <>
                  <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase">Dados do Cliente</p>
                  {FIELDS.map(({ key, label, placeholder }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-[9px] tracking-[0.3em] text-white/25 uppercase">{label}</label>
                      <input value={ficha[key] ?? ''} onChange={e => setFichaField(key, e.target.value)}
                        placeholder={placeholder}
                        className="bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-[12px] font-light
                                   text-white/70 focus:outline-none focus:border-white/20 placeholder:text-white/15
                                   transition-colors w-full" />
                    </div>
                  ))}
                </>
              )}

              {/* ── Tab Conteúdo ── */}
              {tab === 'conteudo' && (
                <>
                  <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase">Conteúdo do Contrato</p>
                  {TEXT_AREAS.map(({ key, label, placeholder, rows }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-[9px] tracking-[0.3em] text-white/25 uppercase">{label}</label>
                      <textarea value={ficha[key] ?? ''} onChange={e => setFichaField(key, e.target.value)}
                        placeholder={placeholder} rows={rows}
                        className="bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-[12px] font-light
                                   text-white/70 focus:outline-none focus:border-white/20 placeholder:text-white/15
                                   resize-none transition-colors w-full" />
                    </div>
                  ))}
                </>
              )}

              {/* ── Tab Cláusulas ── */}
              {tab === 'clausulas' && (
                <>
                  <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase">Cláusulas Padrão</p>
                  <p className="text-[10px] font-light text-white/20 leading-relaxed -mt-2">
                    Edita o texto, remove ou restaura cada cláusula. Linhas com &quot;1.&quot; ficam a bold no contrato.
                  </p>

                  {/* Default clauses */}
                  {CLAUSULAS_EDITAVEIS.map(({ key, titulo }) => {
                    const isRemovida = removidas.includes(key)
                    return (
                      <div key={key}
                        className={`flex flex-col gap-1.5 pb-4 border-b border-white/[0.05] ${isRemovida ? 'opacity-40' : ''}`}>
                        {/* Title row */}
                        <div className="flex items-center justify-between gap-2">
                          <label className={`text-[9px] tracking-[0.25em] uppercase ${isRemovida ? 'line-through text-white/20' : 'text-white/30'}`}>
                            {titulo}
                          </label>
                          {isRemovida ? (
                            <button onClick={() => restaurar(key)}
                              className="text-[9px] tracking-[0.25em] text-emerald-400/50 hover:text-emerald-400/80 uppercase transition-colors shrink-0">
                              ↺ Restaurar
                            </button>
                          ) : (
                            <button onClick={() => remover(key)}
                              className="text-[9px] tracking-[0.25em] text-white/15 hover:text-red-400/50 uppercase transition-colors shrink-0">
                              Remover
                            </button>
                          )}
                        </div>
                        {/* Textarea only if not removed */}
                        {!isRemovida && (
                          <>
                            <textarea
                              value={clausulas[key] ?? ''}
                              onChange={e => setClausulaVal(key, e.target.value)}
                              placeholder={CLAUSULAS_DEFAULT[key] ?? ''}
                              rows={4}
                              className="bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-[11px] font-light
                                         text-white/65 focus:outline-none focus:border-white/20 placeholder:text-white/10
                                         resize-y transition-colors w-full leading-relaxed"
                            />
                            {clausulas[key] && clausulas[key] !== CLAUSULAS_DEFAULT[key] && (
                              <button onClick={() => setClausulaVal(key, '')}
                                className="self-start text-[9px] text-white/20 hover:text-white/45 tracking-[0.2em] uppercase transition-colors">
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
                    <div className="flex flex-col gap-4 pt-2">
                      <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase">Cláusulas Adicionadas</p>
                      {custom.map(c => (
                        <div key={c.id} className="flex flex-col gap-2 pb-4 border-b border-white/[0.05]">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              value={c.titulo}
                              onChange={e => updateCustom(c.id, 'titulo', e.target.value)}
                              placeholder="Título da cláusula"
                              className="flex-1 bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 text-[11px]
                                         font-light text-white/70 focus:outline-none focus:border-white/20
                                         placeholder:text-white/15 transition-colors"
                            />
                            <button onClick={() => removeCustom(c.id)}
                              className="text-[9px] tracking-[0.25em] text-white/15 hover:text-red-400/60 uppercase transition-colors shrink-0">
                              Eliminar
                            </button>
                          </div>
                          <textarea
                            value={c.texto}
                            onChange={e => updateCustom(c.id, 'texto', e.target.value)}
                            placeholder="Texto da cláusula..."
                            rows={4}
                            className="bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-[11px] font-light
                                       text-white/65 focus:outline-none focus:border-white/20 placeholder:text-white/15
                                       resize-y transition-colors w-full leading-relaxed"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new clause */}
                  <div className="pt-2" style={{ borderTop: custom.length > 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                    {addingNew ? (
                      <div className="flex flex-col gap-3">
                        <p className="text-[8px] tracking-[0.6em] text-white/25 uppercase">Nova Cláusula</p>
                        <input
                          value={novaClausula.titulo}
                          onChange={e => setNovaClausula(n => ({ ...n, titulo: e.target.value }))}
                          placeholder="Título (ex: Décima Terceira Cláusula)"
                          className="bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-[12px] font-light
                                     text-white/70 focus:outline-none focus:border-white/20 placeholder:text-white/15
                                     transition-colors w-full"
                        />
                        <textarea
                          value={novaClausula.texto}
                          onChange={e => setNovaClausula(n => ({ ...n, texto: e.target.value }))}
                          placeholder="Texto da nova cláusula..."
                          rows={5}
                          className="bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-[11px] font-light
                                     text-white/65 focus:outline-none focus:border-white/20 placeholder:text-white/15
                                     resize-none transition-colors w-full leading-relaxed"
                        />
                        <div className="flex items-center gap-3">
                          <button onClick={addClausula}
                            disabled={!novaClausula.titulo.trim()}
                            className="border border-white/25 bg-white/[0.04] hover:bg-white/[0.09] px-5 py-2
                                       text-[9px] tracking-[0.35em] text-white/60 hover:text-white/90 uppercase
                                       transition-all disabled:opacity-30">
                            + Adicionar
                          </button>
                          <button onClick={() => { setAddingNew(false); setNovaClausula({ titulo: '', texto: '' }) }}
                            className="text-[9px] tracking-[0.3em] text-white/25 hover:text-white/50 uppercase transition-colors">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingNew(true)}
                        className="w-full border border-dashed border-white/15 hover:border-white/30 py-3
                                   text-[9px] tracking-[0.4em] text-white/25 hover:text-white/55 uppercase
                                   transition-colors text-center">
                        + Nova Cláusula
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex items-center justify-between gap-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => setEditing(false)} disabled={saving}
                className="text-[9px] tracking-[0.3em] text-white/25 hover:text-white/50 uppercase transition-colors disabled:opacity-40">
                Cancelar
              </button>
              <button onClick={save} disabled={saving}
                className="border border-white/30 bg-white/[0.04] hover:bg-white/[0.10] px-7 py-2.5
                           text-[9px] tracking-[0.4em] text-white/70 hover:text-white uppercase
                           transition-all duration-200 disabled:opacity-40"
                style={{ boxShadow: '0 0 16px rgba(255,255,255,0.06)' }}>
                {saving ? '⏳ A guardar...' : 'Guardar e Atualizar'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
