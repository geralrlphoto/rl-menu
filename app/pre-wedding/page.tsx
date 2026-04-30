'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Slot = { id: string; date: string; time: string; local: string }

type Reservation = {
  referencia: string
  coupleNames: string
  slot: Slot
  reservedAt: string | null
  allSlots: Slot[]
  fullSettings: any
}

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_ABBR  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function fmtDate(ds: string) {
  const [y, m, d] = ds.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return {
    day: String(d).padStart(2, '0'),
    monthShort: MESES_FULL[m - 1].slice(0, 3).toUpperCase(),
    weekday: DIAS_ABBR[dt.getDay()],
    year: y,
  }
}

function daysUntil(ds: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((new Date(ds + 'T00:00:00').getTime() - today.getTime()) / 86400000)
}

function daysSince(iso: string | null) {
  if (!iso) return 0
  return Math.round((Date.now() - new Date(iso).getTime()) / 86400000)
}

export default function PreWeddingPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRef, setEditingRef] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Slot>({ id: '', date: '', time: '', local: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const d = await fetch('/api/portais').then(r => r.json())
      const portais: any[] = d.portais ?? []
      const result: Reservation[] = []
      for (const portal of portais) {
        const ps = portal.settings ?? {}
        const slots: Slot[] = ps.preWeddingSlots ?? []
        const reservedId: string | null = ps.preWeddingReservedSlotId ?? null
        const slot = reservedId ? slots.find(s => s.id === reservedId) ?? null : null
        if (!slot) continue
        const noiva: string = ps.noiva ?? portal.noiva ?? ''
        const noivo: string = ps.noivo ?? portal.noivo ?? ''
        result.push({
          referencia: portal.referencia,
          coupleNames: [noiva, noivo].filter(Boolean).join(' & ') || portal.referencia,
          slot,
          reservedAt: ps.preWeddingReservedAt ?? null,
          allSlots: slots,
          fullSettings: ps,
        })
      }
      result.sort((a, b) => a.slot.date < b.slot.date ? -1 : 1)
      setReservations(result)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function saveSettings(referencia: string, newSettings: any) {
    await fetch('/api/portais', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia, updates: { settings: newSettings } }),
    })
  }

  async function handleSaveEdit(res: Reservation) {
    setSaving(true)
    try {
      const newSlots = res.allSlots.map(s => s.id === res.slot.id ? editForm : s)
      const newSettings = { ...res.fullSettings, preWeddingSlots: newSlots }
      await saveSettings(res.referencia, newSettings)
      setEditingRef(null)
      await load()
    } finally { setSaving(false) }
  }

  async function handleCancel(res: Reservation) {
    if (!confirm(`Cancelar a reserva de ${res.coupleNames}?`)) return
    setSaving(true)
    try {
      const newSettings = { ...res.fullSettings }
      delete newSettings.preWeddingReservedSlotId
      delete newSettings.preWeddingReservedAt
      await saveSettings(res.referencia, newSettings)
      await load()
    } finally { setSaving(false) }
  }

  return (
    <main className="min-h-screen px-4 sm:px-8 py-8 max-w-[820px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/photo" className="text-[10px] tracking-[0.3em] text-white/25 hover:text-white/50 uppercase transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold tracking-widest text-gold uppercase mt-1">Pré-Wedding</h1>
          <div className="mt-2 h-px w-12 bg-gold/40" />
        </div>
        <span className="text-[10px] tracking-[0.3em] text-white/20 uppercase">{reservations.length} reserva{reservations.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="text-center py-24 text-white/20 text-xs tracking-widest uppercase">A carregar...</div>
      ) : reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.01] text-center">
          <svg className="w-8 h-8 text-white/15 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <p className="text-xs text-white/25 tracking-wide">Sem reservas de pré-wedding.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map(res => {
            const d = fmtDate(res.slot.date)
            const dtu = daysUntil(res.slot.date)
            const dsa = daysSince(res.reservedAt)
            const isUrgent = dtu <= 15
            const isEditing = editingRef === res.referencia
            return (
              <div key={res.referencia} className={`rounded-2xl border p-5 sm:p-6 ${isUrgent ? 'border-red-500/30 bg-red-500/5' : 'border-gold/25 bg-gold/5'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] tracking-[0.3em] text-white/25 uppercase mb-0.5">{res.referencia}</p>
                    <h2 className="text-lg font-bold text-white tracking-wide">{res.coupleNames}</h2>
                    <div className="flex items-center gap-3 mt-3">
                      <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border ${isUrgent ? 'bg-red-500/15 border-red-500/30' : 'bg-gold/10 border-gold/25'}`}>
                        <span className={`text-xl font-bold leading-none ${isUrgent ? 'text-red-400' : 'text-gold'}`}>{d.day}</span>
                        <span className={`text-[9px] tracking-wider uppercase ${isUrgent ? 'text-red-400/60' : 'text-gold/60'}`}>{d.monthShort}</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest">{d.weekday} · {d.year}</p>
                        <p className="text-sm font-semibold text-white/80 mt-0.5">{res.slot.time}</p>
                        {res.slot.local && <p className="text-xs text-white/40 mt-0.5">📍 {res.slot.local}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${isUrgent ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                      {dtu === 0 ? 'HOJE' : dtu < 0 ? 'PASSOU' : isUrgent ? `${dtu}d` : '✓'}
                    </span>
                    <span className="text-[10px] text-white/20">Reservado há {dsa}d</span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                    <p className="text-[10px] text-gold/60 tracking-widest uppercase mb-2">Editar Reserva</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Data</label>
                        <input type="date" value={editForm.date}
                          onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Hora</label>
                        <input type="time" value={editForm.time}
                          onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Local</label>
                        <input type="text" value={editForm.local} placeholder="ex: Sintra"
                          onChange={e => setEditForm(f => ({ ...f, local: e.target.value }))}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <button onClick={() => handleCancel(res)} disabled={saving}
                        className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors tracking-widest disabled:opacity-40">
                        ✕ Cancelar reserva
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingRef(null)} disabled={saving}
                          className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">
                          Cancelar
                        </button>
                        <button onClick={() => handleSaveEdit(res)} disabled={saving || !editForm.date}
                          className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
                          {saving ? 'A guardar...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <button
                      onClick={() => { setEditForm({ ...res.slot }); setEditingRef(res.referencia) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-white/40 hover:text-white/70 border border-white/10 hover:border-white/25 transition-all tracking-widest uppercase">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      Editar
                    </button>
                    <button onClick={() => handleCancel(res)} disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-[10px] text-red-400/60 hover:text-red-400 border border-red-400/20 hover:border-red-400/40 transition-all tracking-widest uppercase disabled:opacity-40">
                      Cancelar Reserva
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
