import Link from 'next/link'

/* ============================================================
   /social-media — placeholder "Em breve"
   Página em branco com estilo Atmosphère (tokens do Menu Geral).
   Mantida minimalista até decidirmos o que entra aqui.
   ============================================================ */

export default function SocialMediaPage() {
  return (
    <main className="sm-page">
      {/* Voltar */}
      <div className="sm-back-row">
        <Link href="/secao/490653af-115b-4a9b-9d88-902c1a60f9c1" className="sm-back">
          <span className="chev">‹</span> Voltar ao Menu
        </Link>
      </div>

      {/* Hero */}
      <div className="sm-hero">
        <div className="sm-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
          </svg>
        </div>
        <p className="sm-eyebrow">RL Photo · Video</p>
        <h1 className="sm-title">SOCIAL <em>Media</em></h1>
        <hr className="sm-rule" />
        <p className="sm-tag">Em construção</p>
        <p className="sm-desc">
          Esta área vai concentrar a gestão de Instagram, planeamento
          de publicações, calendário editorial e métricas das redes.
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600&family=Hanken+Grotesk:wght@300;400;500;600;700&display=swap');

        .sm-page {
          --bg: #120d08;
          --surface: #1e1812;
          --surface-2: #181410;
          --gold: #c8a866;
          --gold-soft: #d7bd87;
          --gold-deep: #9c7c47;
          --gold-faint: rgba(200, 168, 102, 0.16);
          --gold-line: rgba(200, 168, 102, 0.22);
          --ink: #efe7d6;
          --ink-2: #c3b8a3;
          --ink-3: #8c8170;
          --ink-4: #5f574b;

          min-height: 100vh;
          background: var(--bg);
          color: var(--ink);
          font-family: 'Hanken Grotesk', system-ui, -apple-system, sans-serif;
          padding: 28px clamp(20px, 4vw, 48px) 80px;
          max-width: 1080px;
          margin: 0 auto;
        }
        .sm-back-row { margin-bottom: 60px; }
        .sm-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.32em; text-transform: uppercase;
          color: var(--ink-4);
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid var(--gold-faint);
          background: rgba(200, 168, 102, 0.04);
          transition: 0.25s;
        }
        .sm-back:hover {
          color: var(--ink);
          border-color: var(--gold-line);
          background: rgba(200, 168, 102, 0.08);
        }
        .sm-back .chev {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px; color: var(--gold); line-height: 1;
        }

        .sm-hero {
          text-align: center;
          padding: 80px 24px;
          border-radius: 20px;
          border: 1px solid rgba(239, 231, 214, 0.06);
          background:
            radial-gradient(80% 60% at 50% 0%, rgba(200, 168, 102, 0.10), transparent 70%),
            linear-gradient(180deg, var(--surface), var(--surface-2));
        }
        .sm-icon {
          width: 96px; height: 96px;
          margin: 0 auto 28px;
          border-radius: 24px;
          border: 1px solid var(--gold-line);
          background: rgba(200, 168, 102, 0.06);
          color: var(--gold-soft);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 12px 28px -16px rgba(0, 0, 0, 0.8);
        }
        .sm-icon svg { width: 40px; height: 40px; }
        .sm-eyebrow {
          font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.36em; text-transform: uppercase;
          color: var(--gold); margin: 0 0 14px;
        }
        .sm-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: clamp(40px, 6vw, 56px);
          line-height: 1.0;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: var(--ink);
          margin: 0 0 20px;
        }
        .sm-title em {
          font-style: italic;
          color: var(--gold-soft);
          font-weight: 400;
        }
        .sm-rule {
          margin: 0 auto 28px;
          width: 80px; height: 1px; border: 0;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }
        .sm-tag {
          font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.4em; text-transform: uppercase;
          color: var(--gold);
          margin: 0 0 16px;
        }
        .sm-desc {
          font-size: 14px;
          color: var(--ink-3);
          max-width: 460px;
          margin: 0 auto;
          line-height: 1.7;
        }
      `}</style>
    </main>
  )
}
