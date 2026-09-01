import Link from 'next/link'

/* ============================================================
   /social-media/12-meses-12-videos
   Pasta do projecto "12 Meses, 12 Vídeos": um vídeo por mês.
   Por agora só o frame com os 12 meses; conteúdo a preencher.
   ============================================================ */

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function DozeMesesDozeVideosPage() {
  return (
    <main className="mv-page">
      {/* Voltar */}
      <div className="mv-back-row">
        <Link href="/social-media" className="mv-back">
          <span className="chev">‹</span> Voltar a Social Media
        </Link>
      </div>

      {/* Hero */}
      <header className="mv-head">
        <p className="mv-eyebrow">RL Photo · Video — Social Media</p>
        <h1 className="mv-title">12 MESES <em>12 vídeos</em></h1>
        <hr className="mv-rule" />
        <p className="mv-lede">
          Um vídeo por mês, do primeiro ao último. Cada mês tem o seu espaço
          para o tema, o guião e o link do vídeo publicado.
        </p>
      </header>

      {/* Meses */}
      <section className="mv-grid">
        {MESES.map((mes, i) => (
          <article key={mes} className="mv-card">
            <div className="mv-card-top">
              <span className="mv-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="mv-badge">Por definir</span>
            </div>
            <p className="mv-mes">{mes}</p>
            <p className="mv-desc">Tema por definir</p>
          </article>
        ))}
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600&family=Hanken+Grotesk:wght@300;400;500;600;700&display=swap');

        .mv-page {
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
        .mv-page * { box-sizing: border-box; }

        .mv-back-row { margin-bottom: 32px; }
        .mv-back {
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
        .mv-back:hover {
          color: var(--ink);
          border-color: var(--gold-line);
          background: rgba(200, 168, 102, 0.08);
        }
        .mv-back .chev {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px; color: var(--gold); line-height: 1;
        }

        .mv-head { text-align: center; margin-bottom: 48px; }
        .mv-eyebrow {
          font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.36em; text-transform: uppercase;
          color: var(--gold); margin: 0 0 14px;
        }
        .mv-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: clamp(38px, 6.4vw, 60px);
          line-height: 1.0;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: var(--ink);
          margin: 0 0 18px;
        }
        .mv-title em {
          font-style: italic; color: var(--gold-soft); font-weight: 400;
        }
        .mv-rule {
          margin: 22px auto 0;
          width: 96px; height: 1px; border: 0;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }
        .mv-lede {
          margin-top: 20px;
          max-width: 460px;
          margin-left: auto; margin-right: auto;
          font-size: 13.5px; color: var(--ink-3);
          line-height: 1.7;
        }

        .mv-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 900px) { .mv-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px) { .mv-grid { grid-template-columns: 1fr; } }

        .mv-card {
          position: relative; overflow: hidden;
          padding: 18px 20px 20px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
          transition: transform 0.35s cubic-bezier(0.2,0.85,0.25,1),
                      border-color 0.3s, box-shadow 0.4s;
        }
        .mv-card::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 2px; background: var(--gold);
          transform: scaleY(0); transform-origin: center;
          transition: transform 0.35s cubic-bezier(0.2,0.85,0.25,1);
        }
        .mv-card:hover {
          transform: translateY(-3px);
          border-color: var(--gold-line);
          box-shadow: 0 22px 44px -28px rgba(200,168,102,0.45), 0 4px 8px rgba(0,0,0,0.35);
        }
        .mv-card:hover::before { transform: scaleY(1); }

        .mv-card-top {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; margin-bottom: 12px;
        }
        .mv-num {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400; font-style: italic;
          font-size: 26px; line-height: 1;
          color: var(--gold-deep);
        }
        .mv-card:hover .mv-num { color: var(--gold-soft); }
        .mv-badge {
          font-size: 8.5px; font-weight: 700;
          letter-spacing: 0.28em; text-transform: uppercase;
          color: var(--ink-4);
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(255,255,255,0.02);
        }
        .mv-mes {
          font-size: 12.5px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--ink);
          margin: 0 0 4px;
        }
        .mv-desc {
          font-size: 12px; color: var(--ink-3);
          margin: 0;
        }
      `}</style>
    </main>
  )
}
