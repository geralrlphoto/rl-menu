import type { Metadata } from 'next'
import MarcarPublico from './MarcarPublico'

/* Página pública de marcação de reunião (link para qualquer pessoa: Instagram, site,
   mensagens). Mostra logo o calendário com os horários livres (a mesma disponibilidade
   do /rollup e da reunião de preparação). Ao marcar, cria a lead no CRM com
   "Reunião Agendada" e origem "Link de marcação", e o admin recebe email. */

export const metadata: Metadata = { title: 'RL Photo.Video · Marcar reunião' }

export default function ReuniaoPublicaPage() {
  return <MarcarPublico />
}
