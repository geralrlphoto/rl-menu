import { CSS_BRIEFING } from '@/app/_briefing/estilo'

/* Boas-vindas: primeira página que os noivos recebem depois de fecharem.
   Por agora em branco; o conteúdo entra depois. */

export default function BoasVindasPage() {
  return (
    <main className="nlead" style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      <style>{CSS_BRIEFING}</style>
      <div className="fx-grain" aria-hidden="true" />
    </main>
  )
}
