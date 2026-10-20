'use client'

import JornadaMapa from '@/app/crm/follow-up/JornadaMapa'
import type { CfgMapa } from '@/app/crm/follow-up/config'
import { FASES_EDICAO, SEPARADORES_EDICAO } from '@/lib/edicaoFluxo'

const CFG: CfgMapa = {
  fases: FASES_EDICAO,
  separadores: SEPARADORES_EDICAO,
  api: '/api/edicao-video/fluxo',
  voltar: { href: '/edicao-video', label: '‹ Edição de Vídeo' },
  prazos: false,
  nomeTour: 'Percorrer o fluxo',
}

export default function FluxoEdicao({ embutido = false }: { embutido?: boolean }) {
  return <JornadaMapa cfg={embutido ? { ...CFG, embutido: true } : CFG} />
}
