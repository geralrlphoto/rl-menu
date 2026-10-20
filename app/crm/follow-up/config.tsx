'use client'

// Configuração do mapa interativo (JornadaMapa + PainelCard). Por defeito é a
// jornada do cliente do /crm/follow-up; o Departamento de Edição de Vídeo usa
// o mesmo mapa com as suas fases (lib/edicaoFluxo.ts) e grava noutro sítio.

import { createContext, useContext } from 'react'
import { FASES, SEPARADORES, type Fase } from '@/lib/jornada'

export type CfgMapa = {
  fases: Fase[]
  separadores: [string, number][]   // [nome, fase onde abre] (-1 = painel dos emails)
  api: string                       // GET { estado, stats } · POST { chave, valor }
  voltar: { href: string; label: string }
  prazos: boolean                   // botão "Prazos" no topo
  nomeTour: string                  // "Percorrer a …"
}

export const CFG_JORNADA: CfgMapa = {
  fases: FASES,
  separadores: SEPARADORES,
  api: '/api/jornada',
  voltar: { href: '/crm', label: '‹ CRM' },
  prazos: true,
  nomeTour: 'Percorrer a jornada',
}

export const CfgCtx = createContext<CfgMapa>(CFG_JORNADA)
export const useCfg = () => useContext(CfgCtx)
