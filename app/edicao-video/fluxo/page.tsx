/* ──────────────────────────────────────────────────────────────
   EDIÇÃO DE VÍDEO · fluxo de trabalho (mapa interativo)
   Mesmo mapa do /crm/follow-up, com as fases da edição (lib/edicaoFluxo.ts).
   Estado das tarefas em /api/edicao-video/fluxo.
   ────────────────────────────────────────────────────────────── */
import type { Metadata } from 'next'
import FluxoEdicao from './FluxoEdicao'

export const metadata: Metadata = { title: 'Fluxo da edição de vídeo · RL' }

export default function FluxoEdicaoPage() {
  return <FluxoEdicao />
}
