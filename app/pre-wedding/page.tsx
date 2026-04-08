'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const PORTAL_PAGE_ID   = '311220116d8a80d29468e817ae7bb79f'
const SETTINGS_PREFIX  = '__PORTAL_SETTINGS__:'

type Slot = { id: string; date: string; time: string; local: string }
type Booking = {
  coupleNames: string
  noiva: string
  noivo: string
  slot: Slot
  reservedAt: string | null
}

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_ABBR  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function fmtDate(ds: string) {
  const [y, m, d] = ds.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return {
    day: String(d).padStart(2, '0'),
    month: MESES_FULL[m - 1],
    monthShort: MESES_FULL[m - 1].slice(0, 3).toUpperCase(),
    weekday: DIAS_ABBR[dt.getDay()],
    year: y,
  }
}

function daysUntil(ds: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(ds + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function daysSince(iso: string | null) {
  if (!iso) return 0
  return Math.round((Date.now() - new Date(iso).getTime()) / 86400000)
}

export default function PreWeddingPage() {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [allSlots, setAllSlots] = useState<Slot[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [settingsBlockId, setSettingsBlockId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editingBooking, setEditingBooking] = useState(false)
  const [bookingForm, setBookingForm] = useState<Slot | null>(null)
  const [slotsForm, setSlotsForm] = useState<Slot[]>([])
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const d = await fetch(`/api/portais-clientes?id=${PORTAL_PAGE_ID}&bust=1`).then(r => r.json())
      const ps = d.settings ?? {}
      setSettings(ps)
      setSettingsBlockId(d.settingsBlockId ?? null)

      const slots: Slot[] = ps.preWeddingSlots ?? []
      setAllSlots(slots)

      const reservedId: string | null = ps.preWeddingReservedSlotId ?? null
      const reservedAt: string | null = ps.preWeddingReservedAt ?? null
      const reservedSlot = reservedId ? slots.find(s => s.id === reservedId) ?? null : null

      if (reservedSlot) {
        const noiva: string = ps.noiva ?? ''
        const noivo: string = ps.noivo ?? ''
        setBooking({
          coupleNames: [noiva, noivo].filter(Boolean).join(' & ') || 'Casal',
          noiva,
          noivo,
          slot: reservedSlot,
          reservedAt,
        })
      } else {
        setBooking(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSaveSlots() {
    setSaving(true)
    try {
      const d = await fetch(`/api/portais-clientes?id=${PORTAL_PAGE_ID}`).then(r => r.json())
      const ps = d.settings ?? {}
      const sbId = d.settingsBlockId ?? null
      // If reserved slot was removed, clear reservation
      const newSettings: any = { ...ps, preWeddingSlots: slotsForm }
      const reservedId = ps.preWeddingReservedSlotId
      if (reservedId && !slotsForm.some(s => s.id === reservedId)) {
        delete newSettings.preWeddingReservedSlotId
        delete newSettings.preWeddingReservedAt
      }
      await fetch('/api/portal-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: PORTAL_PAGE_ID, settings: newSettings, settingsBlockId: sbId }),
      })
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 2000)
      setEditing(false)
      await load()
    } finally { setSaving(false) }
  }

  async function handleSaveBookingEdit() {
    if (!bookingForm || !booking) return
    setSaving(true)
    try {
      const d = await fetch(`/api/portais-clientes?id=${PORTAL_PAGE_ID}`).then(r => r.json())
      const ps = d.settings ?? {}
      // Update the slot in the slots array
      const updatedSlots = (ps.preWeddingSlots ?? []).map((s: Slot) =>
        s.id === bookingForm.id ? bookingForm : s
      )
      await fetch('/api/portal-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: PORTAL_PAGE_ID,
          settings: { ...ps, preWeddingSlots: updatedSlots },
          settingsBlockId: d.settingsBlockId ?? null,
        }),
      })
      setEditingBooking(false)
      await load()
    } finally { setSaving(false) }
  }

  async function handleCancelReservation() {
    if (!confirm('Cancelar a reserva do pré-wedding?')) return
    setSaving(true)
    try {
      const d = await fetch(`/api/portais-clientes?id=${PORTAL_PAGE_ID}`).then(r => r.json())
      const ps = { ...d.settings ?? {} }
      delete ps.preWeddingReservedSlotId
      delete ps.preWeddingReservedAt
      await fetch('/api/portal-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: PORTAL_PAGE_ID, settings: ps, settingsBlockId: d.settingsBlockId ?? null }),
      })
      await load()
    } finally { setSaving(false) }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const upcomingSlots = [...allSlots]
    .filter(s => s.date >= todayStr)
    .sort((a, b) => a.date < b.date ? -1 : 1)

  return (
    <main className="min-h-screen px-4 sm:px-8 py-8 max-w-[820px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="text-[10px] tracking-[0.3em] text-white/25 hover:text-white/50 uppercase transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold tracking-widest text-gold uppercase mt-1">Pré-Wedding</h1>
          <div className="mt-2 h-px w-12 bg-gold/40" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setSlotsForm(allSlots.map(s => ({ ...s }))); setEditing(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 border border-white/15 hover:border-white/30 transition-all">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Gerir Slots
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24 text-white/20 text-xs tracking-widest uppercase">A carregar...</div>
      ) : editing ? (
        /* ── Slot editor ── */
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5 sm:p-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] tracking-[0.3em] text-gold uppercase">Gerir Disponibilidade</span>
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)}
                className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">
                Cancelar
              </button>
              <button onClick={handleSaveSlots} disabled={saving}
                className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
                {saving ? 'A guardar...' : saveOk ? '✓ Guardado' : 'Guardar'}
              </button>
            </div>
          </div>
          {slotsForm.map((slot, i) => (
            <div key={slot.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30 tracking-widest uppercase">Slot {i + 1}</span>
                <button onClick={() => setSlotsForm(prev => prev.filter(s => s.id !== slot.id))}
                  className="text-white/20 hover:text-red-400 transition-colors text-sm">✕ Remover</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Data</label>
                  <input type="date" value={slot.date}
                    onChange={e => setSlotsForm(prev => prev.map(s => s.id === slot.id ? { ...s, date: e.target.value } : s))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors" />
                </div>
                <div>
                  <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Hora</label>
                  <input type="time" value={slot.time}
                    onChange={e => setSlotsForm(prev => prev.map(s => s.id === slot.id ? { ...s, time: e.target.value } : s))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors" />
                </div>
                <div>
                  <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Local</label>
                  <input type="text" value={slot.local}
                    onChange={e => setSlotsForm(prev => prev.map(s => s.id === slot.id ? { ...s, local: e.target.value } : s))}
                    placeholder="ex: Sintra"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15" />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => setSlotsForm(prev => [...prev, { id: `slot-${Date.now()}`, date: '', time: '', local: '' }])}
            className="w-full py-3 rounded-xl border border-dashed border-gold/20 text-gold/40 hover:text-gold/70 hover:border-gold/40 text-xs tracking-widest transition-all">
            + ADICIONAR SLOT
          </button>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Reserva confirmada ── */}
          {booking ? (() => {
            const d = fmtDate(booking.slot.date)
            const dtu = daysUntil(booking.slot.date)
            const dsa = daysSince(booking.reservedAt)
            const isUrgent = dtu <= 15
            return (
              <div className={`rounded-2xl border p-5 sm:p-6 ${isUrgent ? 'border-red-500/30 bg-red-500/5' : 'border-gold/25 bg-gold/5'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase mb-1">Reserva Confirmada</p>
                    <h2 className="text-lg font-bold text-white tracking-wide">{booking.coupleNames}</h2>
                    <div className="flex items-center gap-3 mt-3">
                      {/* Date badge */}
                      <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border ${isUrgent ? 'bg-red-500/15 border-red-500/30' : 'bg-gold/10 border-gold/25'}`}>
                        <span className={`text-xl font-bold leading-none ${isUrgent ? 'text-red-400' : 'text-gold'}`}>{d.day}</span>
                        <span className={`text-[9px] tracking-wider uppercase ${isUrgent ? 'text-red-400/60' : 'text-gold/60'}`}>{d.monthShort}</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest">{d.weekday} · {d.year}</p>
                        <p className="text-sm font-semibold text-white/80 mt-0.5">{booking.slot.time}</p>
                        {booking.slot.local && <p className="text-xs text-white/40 mt-0.5">📍 {booking.slot.local}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${isUrgent ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                      {isUrgent ? (dtu === 0 ? 'HOJE' : dtu < 0 ? 'PASSOU' : `${dtu}d`) : '✓ RESERVADO'}
                    </span>
                    <span className="text-[10px] text-white/20">Reservado há {dsa}d</span>
                  </div>
                </div>
                {editingBooking && bookingForm ? (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                    <p className="text-[10px] text-gold/60 tracking-widest uppercase mb-3">Editar Reserva</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Data</label>
                        <input type="date" value={bookingForm.date}
                          onChange={e => setBookingForm(f => f ? { ...f, date: e.target.value } : f)}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Hora</label>
                        <input type="time" value={bookingForm.time}
                          onChange={e => setBookingForm(f => f ? { ...f, time: e.target.value } : f)}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Local</label>
                        <input type="text" value={bookingForm.local}
                          onChange={e => setBookingForm(f => f ? { ...f, local: e.target.value } : f)}
                          placeholder="ex: Sintra"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={() => setEditingBooking(false)}
                        className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">
                        Cancelar
                      </button>
                      <button onClick={handleSaveBookingEdit} disabled={saving}
                        className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
                        {saving ? 'A guardar...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <button onClick={() => { setBookingForm({ ...booking.slot }); setEditingBooking(true) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-white/40 hover:text-white/70 border border-white/10 hover:border-white/25 transition-all tracking-widest uppercase">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      Editar
                    </button>
                    <button onClick={handleCancelReservation} disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-[10px] text-red-400/60 hover:text-red-400 border border-red-400/20 hover:border-red-400/40 transition-all tracking-widest uppercase disabled:opacity-40">
                      Cancelar Reserva
                    </button>
                  </div>
                )}
              </div>
            )
          })() : (
            <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-white/[0.06] bg-white/[0.01] text-center">
              <svg className="w-8 h-8 text-white/15 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p className="text-xs text-white/25 tracking-wide">Sem reservas de pré-wedding.</p>
            </div>
          )}

          {/* ── Slots disponíveis ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] tracking-[0.35em] text-white/25 uppercase">Slots Disponíveis ({upcomingSlots.length})</p>
            </div>
            {upcomingSlots.length === 0 ? (
              <p className="text-xs text-white/20 py-4 text-center">Sem slots configurados. Clica em "Gerir Slots" para adicionar.</p>
            ) : (
              <div className="space-y-2">
                {upcomingSlots.map(slot => {
                  const d = fmtDate(slot.date)
                  const isReserved = booking?.slot.id === slot.id
                  return (
                    <div key={slot.id} className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all
                      ${isReserved ? 'border-gold/20 bg-gold/5' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                      <div className={`flex-shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-lg ${isReserved ? 'bg-gold/15 border border-gold/25' : 'bg-white/[0.04] border border-white/[0.08]'}`}>
                        <span className={`text-sm font-bold leading-none ${isReserved ? 'text-gold' : 'text-white/60'}`}>{d.day}</span>
                        <span className={`text-[8px] tracking-wider uppercase ${isReserved ? 'text-gold/60' : 'text-white/25'}`}>{d.monthShort}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-white/25 uppercase tracking-widest">{d.weekday}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-semibold text-white/70">{slot.time}</span>
                          {slot.local && <span className="text-xs text-white/35">📍 {slot.local}</span>}
                        </div>
                      </div>
                      {isReserved && (
                        <span className="text-[9px] tracking-widest text-gold/70 uppercase bg-gold/10 px-2 py-1 rounded-full">Reservado</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </main>
  )
}
