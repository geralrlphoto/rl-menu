import Link from 'next/link'

/* ============================================================
   /social-media/podcast — Antes do Sim.
   Página em branco por agora: só a identidade e o espaço onde
   vão entrar os episódios. O nome está no <h1> e no cartão da
   /social-media, e muda nos dois sítios.
   ============================================================ */

export default function PodcastPage() {
  return (
    <main className="pc-page">
      {/* Voltar */}
      <div className="pc-back-row">
        <Link href="/social-media" className="pc-back">
          <span className="chev">‹</span> Social Media
        </Link>
      </div>

      {/* Hero */}
      <header className="pc-head">
        <p className="pc-eyebrow">RL Photo · Video — Podcast</p>
        <h1 className="pc-title">ANTES DO <em>Sim</em></h1>
        <hr className="pc-rule" />
        <p className="pc-lede">
          Conversas sobre casamentos, para quem está a planear o seu.
        </p>
      </header>

      {/* Espaço dos episódios */}
      <section className="pc-empty">
        <span className="pc-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </span>
        <p className="pc-empty-title">Ainda sem episódios</p>
        <p className="pc-empty-desc">
          Este é o espaço onde vão ficar os episódios, os guiões e as notas de cada conversa.
        </p>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600&family=Hanken+Grotesk:wght@300;400;500;600;700&display=swap');

        .pc-page {
          --bg: #120d08;
          --surface: #1e1812;
          --surface-2: #181410;
          --gold: #c8a866;
          --gold-soft: #d7bd87;
          --gold-faint: rgba(200, 168, 102, 0.16);
          --gold-line: rgba(200, 168, 102, 0.22);
          --ink: #efe7d6;
          --ink-3: #8c8170;
          --ink-4: #5f574b;
          --line: rgba(239, 231, 214, 0.10);

          min-height: 100vh;
          background: var(--bg);
          color: var(--ink);
          font-family: 'Hanken Grotesk', system-ui, -apple-system, sans-serif;
          padding: 28px clamp(20px, 4vw, 48px) 80px;
          max-width: 1080px;
          margin: 0 auto;
        }
        .pc-page * { box-sizing: border-box; }

        .pc-back-row { margin-bottom: 32px; }
        .pc-back {
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
        .pc-back:hover {
          color: var(--ink);
          border-color: var(--gold-line);
          background: rgba(200, 168, 102, 0.08);
        }
        .pc-back .chev {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px; color: var(--gold); line-height: 1;
        }

        .pc-head { text-align: center; margin-bottom: 48px; }
        .pc-eyebrow {
          font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.36em; text-transform: uppercase;
          color: var(--gold); margin: 0 0 14px;
        }
        .pc-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: clamp(40px, 7vw, 64px);
          line-height: 1.0;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: var(--ink);
          margin: 0 0 18px;
        }
        .pc-title em {
          font-style: italic; color: var(--gold-soft); font-weight: 400;
        }
        .pc-rule {
          margin: 22px auto 0;
          width: 96px; height: 1px; border: 0;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }
        .pc-lede {
          margin-top: 20px;
          max-width: 460px;
          margin-left: auto; margin-right: auto;
          font-size: 13.5px; color: var(--ink-3);
          line-height: 1.7;
        }

        .pc-empty {
          text-align: center;
          padding: 64px 24px;
          border-radius: 12px;
          border: 1px dashed var(--gold-faint);
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
        }
        .pc-empty-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 52px; height: 52px;
          border-radius: 50%;
          border: 1px solid var(--gold-faint);
          background: rgba(200,168,102,0.06);
          color: var(--gold);
          margin-bottom: 20px;
        }
        .pc-empty-icon svg { width: 24px; height: 24px; }
        .pc-empty-title {
          font-size: 12.5px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--ink);
          margin: 0 0 8px;
        }
        .pc-empty-desc {
          font-size: 12.5px; color: var(--ink-3);
          line-height: 1.7;
          max-width: 380px;
          margin: 0 auto;
        }
      `}</style>
    </main>
  )
}
