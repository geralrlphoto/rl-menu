import Link from 'next/link'
import { CSS_BRIEFING } from '@/app/_briefing/estilo'

export const metadata = { title: 'Armazenamento · RL' }

/* Armazenamento: página da Organização (menu Gestão). Por agora só o título;
   o conteúdo entra quando estiver definido. */

export default function ArmazenamentoPage() {
  return (
    <main className="nlead" style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      <style>{CSS_BRIEFING}</style>
      <div className="fx-grain" aria-hidden="true" />
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: 'clamp(28px,5vh,56px) clamp(20px,4vw,48px) 80px' }}>
        <Link href="/photo" className="btn-ghost" style={{ marginBottom: 'clamp(30px,6vh,58px)' }}>
          ‹&nbsp; Voltar ao menu
        </Link>
        <header>
          <p className="eyebrow">RL Photo &middot; Video &middot; Organização</p>
          <h1 style={{ fontSize: 'clamp(42px,6vw,80px)', marginTop: '20px' }}>Armazenamento</h1>
          <div style={{ width: '48px', height: '1px', background: 'var(--g)', opacity: .6, marginTop: '26px' }} />
        </header>
      </div>
    </main>
  )
}
