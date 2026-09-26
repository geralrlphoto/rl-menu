import type { Metadata } from 'next'
import { CSS_BRIEFING } from '@/app/_briefing/estilo'
import FunilCrescimento from './FunilCrescimento'

export const metadata: Metadata = { title: 'Funil de Crescimento · RL PHOTO.VIDEO' }

/* Estratégia de crescimento da RL (funil em gravata-borboleta):
   da atração do casal até ele nos recomendar a outros casais. */
export default function CrescimentoPage() {
  return (
    <main className="nlead">
      <style>{CSS_BRIEFING}</style>
      <div className="fx-grain" aria-hidden="true" />
      <FunilCrescimento />
    </main>
  )
}
