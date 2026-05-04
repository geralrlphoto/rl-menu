'use client'
import { useState } from 'react'
import Link from 'next/link'
import PrintButton from './PrintButton'

interface Props {
  refUp: string
  contrato: { ref?: string; estado?: string; geradoEm?: string }
  fichaInit: Record<string, string>
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
  { key: 'localAssinatura',    label: 'Local de Assinatura',  placeholder: 'Lisboa' },
]

const TEXT_AREAS: { key: string; label: string; placeholder: string; rows: number }[] = [
  { key: 'servicosList',       label: 'Serviços Contratados', placeholder: 'Um serviço por linha\nEx: Fotografia — 8h\nEx: Vídeo Highlights', rows: 5 },
  { key: 'profissionaisList',  label: 'Profissionais',        placeholder: 'Um por linha\nEx: Fotógrafo Principal', rows: 3 },
  { key: 'metodoPagamento',    label: 'Plano de Pagamentos',  placeholder: '80% na assinatura — 2400€\n20% após entrega — 600€', rows: 3 },
]

export default function ContratoEditBar({ refUp, contrato, fichaInit, isAdmin }: Props) {
  const [editing, setEditing] = useState(false)
  const [ficha, setFicha] = useState<Record<string, string>>(fichaInit ?? {})
  const [saving, setSaving] = useState(false)

  const set = (key: string, value: string) => setFicha(f => ({ ...f, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${refUp}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ficha: { ...ficha, ref: refUp } }),
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

  return (
    <>
      {/* ── Barra topo ── */}
      <div className="print:hidden bg-black border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link
          href={`/portal-media/${refUp}/contrato`}
          className="text-[9px] tracking-[0.4em] text-white/30 hover:text-white/60 uppercase transition-colors"
        >
          ‹ Voltar ao Portal
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[8px] tracking-[0.4em] text-white/20 uppercase font-mono">{contrato.ref}</span>
          <span className={`text-[8px] tracking-[0.3em] uppercase px-2 py-1 border ${estadoBadge}`}>
            {estadoLabel}
          </span>
          {isAdmin && (
            <button
              onClick={() => setEditing(true)}
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
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
            onClick={() => !saving && setEditing(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-md flex flex-col"
            style={{ background: '#06090f', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>

            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <p className="text-[9px] tracking-[0.5em] text-white/25 uppercase">Editar Contrato</p>
                <p className="text-[11px] tracking-[0.15em] text-white/45 mt-0.5 font-light">{contrato.ref}</p>
              </div>
              <button
                onClick={() => setEditing(false)}
                className="text-white/20 hover:text-white/60 text-xl transition-colors leading-none"
              >
                ✕
              </button>
            </div>

            {/* Scroll area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">

              {/* ── Dados do cliente ── */}
              <div className="flex flex-col gap-4">
                <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase">Dados do Cliente</p>
                {FIELDS.map(({ key, label, placeholder }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-[9px] tracking-[0.3em] text-white/25 uppercase">{label}</label>
                    <input
                      value={ficha[key] ?? ''}
                      onChange={e => set(key, e.target.value)}
                      placeholder={placeholder}
                      className="bg-white/[0.03] border border-white/[0.08] px-3 py-2
                                 text-[12px] font-light text-white/70 focus:outline-none focus:border-white/20
                                 placeholder:text-white/15 transition-colors w-full"
                    />
                  </div>
                ))}
              </div>

              {/* ── Conteúdo do contrato ── */}
              <div className="flex flex-col gap-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase">Conteúdo do Contrato</p>
                {TEXT_AREAS.map(({ key, label, placeholder, rows }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-[9px] tracking-[0.3em] text-white/25 uppercase">{label}</label>
                    <textarea
                      value={ficha[key] ?? ''}
                      onChange={e => set(key, e.target.value)}
                      placeholder={placeholder}
                      rows={rows}
                      className="bg-white/[0.03] border border-white/[0.08] px-3 py-2
                                 text-[12px] font-light text-white/70 focus:outline-none focus:border-white/20
                                 placeholder:text-white/15 resize-none transition-colors w-full"
                    />
                  </div>
                ))}
              </div>

            </div>

            {/* Drawer footer */}
            <div className="px-6 py-4 flex items-center justify-between gap-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="text-[9px] tracking-[0.3em] text-white/25 hover:text-white/50 uppercase transition-colors disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="border border-white/30 bg-white/[0.04] hover:bg-white/[0.10] px-7 py-2.5
                           text-[9px] tracking-[0.4em] text-white/70 hover:text-white uppercase
                           transition-all duration-200 disabled:opacity-40"
                style={{ boxShadow: '0 0 16px rgba(255,255,255,0.06)' }}
              >
                {saving ? '⏳ A guardar...' : 'Guardar e Atualizar'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
