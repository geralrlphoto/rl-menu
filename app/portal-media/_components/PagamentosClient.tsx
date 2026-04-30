'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Projeto } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'
import EditableSelect from './EditableSelect'

const PAG_CFG = {
  pago:      { label: 'Pago',      color: 'text-emerald-400/80', border: 'border-emerald-400/20', bg: 'bg-emerald-400/5'  },
  pendente:  { label: 'Pendente',  color: 'text-white/30',       border: 'border-white/[0.06]',   bg: 'bg-white/[0.015]' },
  em_atraso: { label: 'Em Atraso', color: 'text-red-400/80',     border: 'border-red-400/20',     bg: 'bg-red-400/5'     },
}

const ESTADO_OPTIONS = [
  { value: 'pago',      label: 'Pago'      },
  { value: 'pendente',  label: 'Pendente'  },
  { value: 'em_atraso', label: 'Em Atraso' },
]

interface Props { projeto: Projeto; isAdmin: boolean }

export default function PagamentosClient({ projeto: initial, isAdmin }: Props) {
  const [projeto, setProjeto] = useState(initial)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagamentos: projeto.pagamentos }),
      })
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => { setProjeto(initial); setIsEditing(false) }

  const updatePag = (idx: number, field: string, value: string | number) =>
    setProjeto(p => ({
      ...p,
      pagamentos: p.pagamentos.map((pg, i) => i === idx ? { ...pg, [field]: value } : pg),
    }))

  const addPagamento = () =>
    setProjeto(p => ({
      ...p,
      pagamentos: [...p.pagamentos, { descricao: 'Nova Prestação', valor: 0, estado: 'pendente' as const, data: '' }],
    }))

  const removePagamento = (idx: number) =>
    setProjeto(p => ({ ...p, pagamentos: p.pagamentos.filter((_, i) => i !== idx) }))

  const total = projeto.pagamentos.reduce((s, pg) => s + pg.valor, 0)
  const pago  = projeto.pagamentos.filter(pg => pg.estado === 'pago').reduce((s, pg) => s + pg.valor, 0)

  return (
    <>
      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-10">

        <Link href={`/portal-media/${projeto.ref}`}
          className="inline-flex items-center gap-2 text-xs tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        <div className="mb-10">
          <p className="text-xs tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · {projeto.nome}</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Pagamentos</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: 'Total',    value: `${total.toLocaleString('pt-PT')} €`         },
            { label: 'Pago',     value: `${pago.toLocaleString('pt-PT')} €`          },
            { label: 'Restante', value: `${(total - pago).toLocaleString('pt-PT')} €` },
          ].map(s => (
            <div key={s.label} className="border border-white/[0.07] bg-white/[0.02] px-4 py-4 text-center">
              <p className="text-xs tracking-[0.4em] text-white/25 uppercase mb-1">{s.label}</p>
              <p className="text-sm tracking-[0.1em] text-white/65 font-light">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Payments list */}
        <div className="flex flex-col gap-3">
          {projeto.pagamentos.map((pag, i) => {
            const cfg = PAG_CFG[pag.estado]
            return (
              <div key={i} className={`border ${cfg.border} ${cfg.bg} px-6 py-5`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <EditableField
                      value={pag.descricao}
                      isEditing={isEditing}
                      onChange={v => updatePag(i, 'descricao', v)}
                      className="text-xs tracking-[0.2em] text-white/60 uppercase font-medium block"
                      placeholder="Descrição"
                    />
                    <EditableField
                      value={pag.data}
                      isEditing={isEditing}
                      onChange={v => updatePag(i, 'data', v)}
                      className="text-xs tracking-[0.2em] text-white/20 mt-1 block"
                      placeholder="Data"
                    />
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1">
                      <EditableField
                        value={String(pag.valor)}
                        isEditing={isEditing}
                        onChange={v => updatePag(i, 'valor', Number(v) || 0)}
                        type="number"
                        className="text-sm tracking-[0.1em] text-white/60 font-light block text-right"
                      />
                      {!isEditing && <span className="text-sm text-white/60 font-light">€</span>}
                    </div>
                    <div className="mt-1">
                      <EditableSelect
                        value={pag.estado}
                        options={ESTADO_OPTIONS}
                        isEditing={isEditing}
                        onChange={v => updatePag(i, 'estado', v)}
                        className={`text-xs tracking-[0.3em] uppercase ${cfg.color}`}
                      />
                    </div>
                    {isEditing && (
                      <button onClick={() => removePagamento(i)}
                        className="mt-2 text-xs tracking-[0.3em] text-red-400/50 hover:text-red-400/80 uppercase transition-colors">
                        — Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {isEditing && (
          <button onClick={addPagamento}
            className="mt-4 w-full border border-dashed border-white/15 hover:border-white/30 bg-white/[0.01] hover:bg-white/[0.03] py-3
                       text-xs tracking-[0.4em] text-white/30 uppercase transition-colors">
            + Adicionar Pagamento
          </button>
        )}

        <p className="mt-8 text-xs tracking-[0.2em] text-white/15 leading-relaxed">
          Para questões relacionadas com faturação contacta financeiro@rlmedia.pt
        </p>
      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}
