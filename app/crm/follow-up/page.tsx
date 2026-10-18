/* ──────────────────────────────────────────────────────────────
   FOLLOW UP · mapa interativo da jornada do cliente
   Dados do fluxo em lib/jornada.ts; parte visual em JornadaMapa.tsx.
   O estado das tarefas fica no Supabase (/api/jornada).
   ────────────────────────────────────────────────────────────── */
import type { Metadata } from 'next'
import JornadaMapa from './JornadaMapa'

export const metadata: Metadata = { title: 'Jornada do cliente · RL' }

export default function FollowUpPage() {
  return <JornadaMapa />
}
