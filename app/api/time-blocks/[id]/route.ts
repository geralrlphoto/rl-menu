import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * PATCH /api/time-blocks/[id]
 *
 * Supports two modes:
 *
 * 1. Field edits — pass any of: categoria, titulo, cor, duracao_minutos, ordem.
 *
 * 2. Timer actions — pass `action: 'start' | 'pause' | 'stop' | 'complete'`.
 *    When `action: 'start'`, all other currently-running blocks are paused first
 *    (only one timer runs at a time).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const supabase = db()

  // ── Field edits ─────────────────────────────────────────────────────────
  if (!body.action) {
    const allowed = ['categoria', 'titulo', 'cor', 'duracao_minutos', 'ordem']
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const [k, v] of Object.entries(body)) {
      if (allowed.includes(k)) updates[k] = v
    }
    const { error } = await supabase.from('time_blocks').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── Timer actions ───────────────────────────────────────────────────────
  const action = body.action as 'start' | 'pause' | 'stop' | 'complete'

  // Fetch current block
  const { data: current, error: fetchErr } = await supabase
    .from('time_blocks').select('*').eq('id', id).single()
  if (fetchErr || !current) {
    return NextResponse.json({ error: 'block não encontrado' }, { status: 404 })
  }

  const now = new Date().toISOString()
  let nextElapsed = current.timer_elapsed_seconds ?? 0

  // If currently running, add seconds since started_at to elapsed.
  if (current.timer_state === 'running' && current.timer_started_at) {
    const startedMs = new Date(current.timer_started_at).getTime()
    nextElapsed += Math.max(0, Math.floor((Date.now() - startedMs) / 1000))
  }

  let updates: Record<string, any> = { updated_at: now }

  if (action === 'start') {
    // Pause all other running blocks first (enforce single-runner)
    const { data: running } = await supabase
      .from('time_blocks').select('id, timer_started_at, timer_elapsed_seconds')
      .eq('timer_state', 'running').neq('id', id)
    for (const r of running ?? []) {
      const sec = r.timer_started_at
        ? Math.max(0, Math.floor((Date.now() - new Date(r.timer_started_at).getTime()) / 1000))
        : 0
      await supabase.from('time_blocks').update({
        timer_state: 'paused',
        timer_started_at: null,
        timer_elapsed_seconds: (r.timer_elapsed_seconds ?? 0) + sec,
        updated_at: now,
      }).eq('id', r.id)
    }

    updates = {
      ...updates,
      timer_state: 'running',
      timer_started_at: now,
      // keep existing elapsed (resume) — don't reset
      timer_elapsed_seconds: current.timer_state === 'idle' || current.timer_state === 'completed'
        ? 0
        : current.timer_elapsed_seconds,
    }
  } else if (action === 'pause') {
    updates = {
      ...updates,
      timer_state: 'paused',
      timer_started_at: null,
      timer_elapsed_seconds: nextElapsed,
    }
  } else if (action === 'stop') {
    updates = {
      ...updates,
      timer_state: 'idle',
      timer_started_at: null,
      timer_elapsed_seconds: 0,
    }
  } else if (action === 'complete') {
    updates = {
      ...updates,
      timer_state: 'completed',
      timer_started_at: null,
      timer_elapsed_seconds: (current.duracao_minutos ?? 0) * 60,
    }
  } else {
    return NextResponse.json({ error: 'action inválida' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('time_blocks').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ block: updated })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await db().from('time_blocks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
