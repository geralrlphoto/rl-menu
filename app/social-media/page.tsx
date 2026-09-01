import Link from 'next/link'

/* ============================================================
   /social-media — dashboard com cartões internos.
   Por agora 1 cartão: Blog (artigos prontos a copiar).
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
      <header className="sm-head">
        <p className="sm-eyebrow">RL Photo · Video — Back-office</p>
        <h1 className="sm-title">SOCIAL <em>Media</em></h1>
        <hr className="sm-rule" />
        <p className="sm-lede">
          Gestão de Instagram, planeamento editorial e conteúdo para o blog.
        </p>
      </header>

      {/* Cartões */}
      <section className="sm-grid">

        {/* Blog */}
        <Link href="/social-media/blog" className="sm-tile">
          <span className="sm-sweep" />
          <div className="sm-tile-row">
            <span className="sm-num">01</span>
            <span className="sm-tile-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <line x1="9" y1="9" x2="16" y2="9" />
                <line x1="9" y1="13" x2="16" y2="13" />
              </svg>
            </span>
            <div className="sm-tile-body">
              <p className="sm-tile-name">Blog</p>
              <p className="sm-tile-desc">Artigos prontos a copiar para o teu blog</p>
            </div>
            <span className="sm-tile-arrow">→</span>
          </div>
        </Link>

        {/* 12 Meses 12 Vídeos */}
        <Link href="/social-media/12-meses-12-videos" className="sm-tile">
          <span className="sm-sweep" />
          <div className="sm-tile-row">
            <span className="sm-num">02</span>
            <span className="sm-tile-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <polygon points="11,13 15,15.5 11,18" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <div className="sm-tile-body">
              <p className="sm-tile-name">12 Meses 12 Vídeos</p>
              <p className="sm-tile-desc">Guiões prontos, de setembro 2026 a agosto 2027</p>
            </div>
            <span className="sm-tile-arrow">→</span>
          </div>
        </Link>

        {/* Placeholder para Instagram (futuro) */}
        <div className="sm-tile is-soon">
          <span className="sm-soon-badge">Em breve</span>
          <div className="sm-tile-row">
            <span className="sm-num">03</span>
            <span className="sm-tile-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
              </svg>
            </span>
            <div className="sm-tile-body">
              <p className="sm-tile-name">Instagram</p>
              <p className="sm-tile-desc">Calendário editorial e publicações</p>
            </div>
            <span className="sm-tile-arrow">·</span>
          </div>
        </div>

      </section>

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
          --line: rgba(239, 231, 214, 0.10);

          min-height: 100vh;
          background: var(--bg);
          color: var(--ink);
          font-family: 'Hanken Grotesk', system-ui, -apple-system, sans-serif;
          padding: 28px clamp(20px, 4vw, 48px) 80px;
          max-width: 1080px;
          margin: 0 auto;
        }
        .sm-page * { box-sizing: border-box; }

        .sm-back-row { margin-bottom: 32px; }
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

        .sm-head { text-align: center; margin-bottom: 48px; }
        .sm-eyebrow {
          font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.36em; text-transform: uppercase;
          color: var(--gold); margin: 0 0 14px;
        }
        .sm-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: clamp(40px, 7vw, 64px);
          line-height: 1.0;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: var(--ink);
          margin: 0 0 18px;
        }
        .sm-title em {
          font-style: italic; color: var(--gold-soft); font-weight: 400;
        }
        .sm-rule {
          margin: 22px auto 0;
          width: 96px; height: 1px; border: 0;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }
        .sm-lede {
          margin-top: 20px;
          max-width: 460px;
          margin-left: auto; margin-right: auto;
          font-size: 13.5px; color: var(--ink-3);
          line-height: 1.7;
        }

        /* Grid de cartões */
        .sm-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        @media (max-width: 760px) { .sm-grid { grid-template-columns: 1fr; } }

        .sm-tile {
          position: relative; overflow: hidden;
          display: block; text-decoration: none; color: inherit;
          padding: 22px 24px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
          transition: transform 0.35s cubic-bezier(0.2,0.85,0.25,1),
                      border-color 0.3s, background 0.3s, box-shadow 0.4s;
          isolation: isolate;
        }
        .sm-tile::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 2px; background: var(--gold);
          transform: scaleY(0); transform-origin: center;
          transition: transform 0.35s cubic-bezier(0.2,0.85,0.25,1);
        }
        .sm-tile:not(.is-soon):hover {
          transform: translateY(-3px);
          border-color: var(--gold-line);
          background: linear-gradient(180deg, rgba(30,24,18,1), rgba(36,29,21,1));
          box-shadow: 0 22px 44px -28px rgba(200,168,102,0.45), 0 4px 8px rgba(0,0,0,0.35);
        }
        .sm-tile:not(.is-soon):hover::before { transform: scaleY(1); }

        .sm-sweep {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(
            100deg, transparent 0%,
            rgba(200,168,102,0.10) 30%,
            rgba(255,246,224,0.18) 50%,
            rgba(200,168,102,0.10) 70%,
            transparent 100%
          );
          transform: translateX(-130%);
          transition: transform 0.7s cubic-bezier(0.3,0.6,0.3,1);
          opacity: 0;
        }
        .sm-tile:not(.is-soon):hover .sm-sweep {
          transform: translateX(130%); opacity: 1;
        }

        .sm-tile-row {
          position: relative; z-index: 1;
          display: flex; align-items: center; gap: 18px;
        }
        .sm-num {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400; font-style: italic;
          font-size: 26px; line-height: 1;
          color: var(--gold-deep);
          flex: none; min-width: 28px;
        }
        .sm-tile:not(.is-soon):hover .sm-num { color: var(--gold-soft); }

        .sm-tile-icon {
          width: 36px; height: 36px;
          border-radius: 6px;
          border: 1px solid var(--gold-faint);
          background: rgba(200,168,102,0.06);
          color: var(--gold);
          display: flex; align-items: center; justify-content: center;
          flex: none;
          transition: 0.3s;
        }
        .sm-tile-icon svg { width: 18px; height: 18px; }
        .sm-tile:not(.is-soon):hover .sm-tile-icon {
          border-color: var(--gold);
          color: var(--gold-soft);
          background: rgba(200,168,102,0.12);
        }

        .sm-tile-body { flex: 1; min-width: 0; }
        .sm-tile-name {
          font-size: 12.5px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--ink);
          margin: 0 0 4px;
        }
        .sm-tile-desc {
          font-size: 12px; color: var(--ink-3);
          margin: 0;
        }
        .sm-tile-arrow {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; line-height: 1;
          color: var(--ink-4);
          flex: none;
          margin-left: 6px;
          transition: 0.3s cubic-bezier(0.2,0.85,0.25,1);
        }
        .sm-tile:not(.is-soon):hover .sm-tile-arrow {
          color: var(--gold);
          transform: translateX(4px);
        }

        /* Tile placeholder "em breve" */
        .sm-tile.is-soon {
          cursor: default;
          opacity: 0.55;
        }
        .sm-soon-badge {
          position: absolute; top: 14px; right: 14px;
          font-size: 8.5px; font-weight: 700;
          letter-spacing: 0.28em; text-transform: uppercase;
          color: var(--ink-4);
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(255,255,255,0.02);
        }
      `}</style>
    </main>
  )
}
