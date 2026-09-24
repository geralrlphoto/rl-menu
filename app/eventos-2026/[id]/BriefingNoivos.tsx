'use client'

import { useEffect, useState } from 'react'
import { camposBriefing, campoAtivo, valorBriefing, type RespostasBriefing } from '@/lib/briefing'

/* Ficha do evento › Comunicação com os Noivos:
   estado do link /preparacao/<id> (ativo/expirado + Reativar) e o briefing
   pré-casamento respondido pelos noivos, que o admin também pode corrigir. */

type Estado = {
  batizado: boolean
  briefing: RespostasBriefing | null
  enviadoEm: string | null
  atualizadoEm: string | null
  link: { expirado: boolean; expiraEm: string | null; reativadoAte: string | null } | null
}

const fmt = (iso: string) => new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const fmtLimite = (s: string) => {
  const [d, h] = s.split(' ')
  return `${new Date(d + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', timeZone: 'UTC' })} às ${h}`
}

export default function BriefingNoivos({ e }: { e: any }) {
  const evId: string = e._supabase_id ?? e.id
  const [st, setSt] = useState<Estado | null>(null)
  const [aberto, setAberto] = useState(false)
  const [editar, setEditar] = useState(false)
  const [draft, setDraft] = useState<RespostasBriefing>({})
  const [aGuardar, setAGuardar] = useState(false)

  const carregar = () =>
    fetch(`/api/preparacao/evento?eventoId=${evId}`).then(r => r.json()).then(d => { if (d.ok) setSt(d) }).catch(() => {})
  useEffect(() => { carregar() }, [evId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!st || !st.link) return null

  async function reativar() {
    await fetch('/api/preparacao/evento', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventoId: evId, reativar: true }),
    }).catch(() => {})
    carregar()
  }
  async function guardar() {
    setAGuardar(true)
    await fetch('/api/preparacao/evento', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventoId: evId, briefing: draft }),
    }).catch(() => {})
    setAGuardar(false); setEditar(false); carregar()
  }

  const { link } = st
  const reativado = link.reativadoAte && new Date(link.reativadoAte).getTime() > Date.now()

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
      {/* Estado do link dos noivos */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] text-white/50">
          <span className="tracking-[0.25em] uppercase text-[10px] text-white/40">Link dos noivos · </span>
          {link.expirado
            ? <span className="text-amber-400">expirado{link.expiraEm ? ` desde ${fmtLimite(link.expiraEm)}` : ''}</span>
            : reativado
              ? <span className="text-green-400">reativado até {fmt(link.reativadoAte!)}</span>
              : <span className="text-green-400">ativo{link.expiraEm ? ` até ${fmtLimite(link.expiraEm)}` : ''}</span>}
        </div>
        {link.expirado && (
          <button onClick={reativar} className="shrink-0 text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10">
            Reativar link (7 dias)
          </button>
        )}
      </div>

      {/* Briefing (casamento ou batizado) */}
      {(
        <div className="border-t border-white/5 pt-3">
          <button onClick={() => setAberto(v => !v)} className="w-full flex items-center justify-between gap-3 text-left">
            <span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-gold/80 font-semibold">{st.batizado ? 'Briefing do batizado' : 'Briefing pré-casamento'}</span>
              <span className="block text-[11px] mt-0.5">
                {st.enviadoEm
                  ? <span className="text-green-400">✓ Preenchido a {fmt(st.enviadoEm)}{st.atualizadoEm && st.atualizadoEm !== st.enviadoEm ? ` · atualizado a ${fmt(st.atualizadoEm)}` : ''}</span>
                  : <span className="text-white/35">{st.batizado ? 'Os pais' : 'Os noivos'} ainda não preencheram (está no mesmo link da reunião)</span>}
              </span>
            </span>
            <span className={`text-white/30 text-xs transition-transform ${aberto ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {aberto && (
            <div className="mt-3 flex flex-col gap-2">
              {camposBriefing(st.batizado).filter(c => campoAtivo(c, editar ? draft : (st.briefing ?? {}))).map(c => editar ? (
                <label key={c.key} className="flex flex-col gap-1">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-white/35">{c.label}</span>
                  {c.tipo === 'longo'
                    ? <textarea rows={2} value={draft[c.key] ?? ''} onChange={ev => setDraft(d => ({ ...d, [c.key]: ev.target.value }))}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold resize-y" />
                    : <input value={draft[c.key] ?? ''} onChange={ev => setDraft(d => ({ ...d, [c.key]: ev.target.value }))}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold" />}
                  {c.tipo === 'simnao' && (
                    <input value={draft[`${c.key}_detalhe`] ?? ''} placeholder={c.detalhe} onChange={ev => setDraft(d => ({ ...d, [`${c.key}_detalhe`]: ev.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold placeholder:text-white/20" />
                  )}
                </label>
              ) : (
                <div key={c.key} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 text-sm border-b border-white/5 pb-2">
                  <span className="text-white/40 text-xs">{c.label}</span>
                  <span className="text-white/85 whitespace-pre-wrap break-words">{st.briefing ? (valorBriefing(c, st.briefing) || <span className="text-white/20">—</span>) : <span className="text-white/20">—</span>}</span>
                </div>
              ))}
              <div className="flex justify-end gap-2 mt-1">
                {editar ? (
                  <>
                    <button onClick={() => setEditar(false)} className="text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 text-white/40 hover:text-white/70">Cancelar</button>
                    <button onClick={guardar} disabled={aGuardar} className="text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg bg-gold text-black disabled:opacity-50">
                      {aGuardar ? 'A guardar…' : 'Guardar'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => { setDraft({ ...(st.briefing ?? {}) }); setEditar(true) }}
                    className="text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-gold hover:border-gold/40">
                    ✎ Editar respostas
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
