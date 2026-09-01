import Link from 'next/link'
import EpisodiosClient from './EpisodiosClient'

/* ============================================================
   /social-media/podcast — Antes do Sim.
   Cabeçalho + lista de episódios (EpisodiosClient), que vive na
   tabela podcast_episodios via /api/podcast-episodios.
   O nome do podcast está no <h1> e no cartão da /social-media.
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

      {/* Episódios */}
      <EpisodiosClient />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600&family=Hanken+Grotesk:wght@300;400;500;600;700&display=swap');

        .pc-page {
          --bg: #120d08;
          --surface: #1e1812;
          --surface-2: #181410;
          --gold: #c8a866;
          --gold-soft: #d7bd87;
          --gold-deep: #9c7c47;
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

        .pc-head { text-align: center; margin-bottom: 44px; }
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

        .pc-info { text-align: center; color: var(--ink-3); font-size: 13px; }

        /* Barra: contagem + novo episódio */
        .pc-bar {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; margin-bottom: 18px;
        }
        .pc-count {
          margin: 0; font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.28em; text-transform: uppercase; color: var(--ink-4);
        }

        .pc-btn, .pc-btn-ghost, .pc-btn-danger {
          font-family: inherit; cursor: pointer;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          padding: 10px 18px; border-radius: 999px;
          transition: 0.25s;
        }
        .pc-btn { color: #1a1409; background: var(--gold); border: 1px solid var(--gold); }
        .pc-btn:hover { background: var(--gold-soft); }
        .pc-btn-ghost { color: var(--ink-3); background: transparent; border: 1px solid var(--line); }
        .pc-btn-ghost:hover { color: var(--ink); border-color: var(--gold-line); }
        .pc-btn-danger {
          color: #e8a1a1; background: rgba(220,80,80,0.08); border: 1px solid rgba(220,80,80,0.28);
        }
        .pc-btn-danger:hover { background: rgba(220,80,80,0.16); }

        .pc-erro, .pc-ok { margin: 0 0 14px; font-size: 12px; padding: 10px 14px; border-radius: 8px; }
        .pc-erro { color: #e8a1a1; background: rgba(220,80,80,0.08); border: 1px solid rgba(220,80,80,0.25); }
        .pc-ok   { color: #9fd8a8; background: rgba(80,200,120,0.08); border: 1px solid rgba(80,200,120,0.22); }

        /* Lista */
        .pc-list { display: flex; flex-direction: column; gap: 10px; }
        .pc-item {
          display: flex; align-items: center; gap: 18px;
          width: 100%; text-align: left; cursor: pointer;
          font-family: inherit;
          padding: 18px 22px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
          transition: transform 0.3s cubic-bezier(0.2,0.85,0.25,1), border-color 0.3s;
        }
        .pc-item:hover { transform: translateY(-2px); border-color: var(--gold-line); }
        .pc-item-num {
          font-family: 'Cormorant Garamond', serif; font-style: italic;
          font-size: 26px; line-height: 1; color: var(--gold-deep);
          flex: none; min-width: 34px;
        }
        .pc-item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .pc-item-title {
          font-size: 12.5px; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink);
        }
        .pc-item-meta { font-size: 12px; color: var(--ink-3); }

        .pc-badge {
          flex: none;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          padding: 5px 10px; border-radius: 999px;
          border: 1px solid var(--line); color: var(--ink-4);
          background: rgba(255,255,255,0.02);
        }
        .pc-badge.is-guiao     { color: var(--gold-soft); border-color: var(--gold-line); }
        .pc-badge.is-gravado   { color: #9fc8e8; border-color: rgba(120,180,230,0.30); }
        .pc-badge.is-editado   { color: #d3b0e8; border-color: rgba(190,140,230,0.30); }
        .pc-badge.is-publicado { color: #9fd8a8; border-color: rgba(120,210,150,0.35); }

        /* Vazio */
        .pc-empty {
          text-align: center;
          padding: 56px 24px;
          border-radius: 12px;
          border: 1px dashed var(--gold-faint);
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
        }
        .pc-empty-title {
          font-size: 12.5px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--ink); margin: 0 0 8px;
        }
        .pc-empty-desc {
          font-size: 12.5px; color: var(--ink-3); line-height: 1.7;
          max-width: 380px; margin: 0 auto;
        }

        /* Painel */
        .pc-overlay {
          position: fixed; inset: 0; z-index: 60;
          background: rgba(8,6,4,0.82); backdrop-filter: blur(6px);
          display: flex; align-items: flex-start; justify-content: center;
          padding: 40px 16px; overflow-y: auto;
        }
        .pc-panel {
          width: 100%; max-width: 620px;
          border-radius: 14px;
          border: 1px solid var(--gold-line);
          background: linear-gradient(180deg, #1e1812, #141009);
          box-shadow: 0 40px 80px -30px rgba(0,0,0,0.9);
        }
        .pc-panel-head {
          position: relative;
          padding: 24px 26px 18px;
          border-bottom: 1px solid var(--line);
        }
        .pc-panel-eyebrow {
          margin: 0 0 6px; font-size: 10px; font-weight: 600;
          letter-spacing: 0.32em; text-transform: uppercase; color: var(--gold);
        }
        .pc-panel-title {
          margin: 0; font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 400; color: var(--ink);
          padding-right: 40px;
        }
        .pc-close {
          position: absolute; top: 18px; right: 18px;
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid var(--line); background: transparent;
          color: var(--ink-3); font-size: 18px; cursor: pointer;
          transition: 0.25s;
        }
        .pc-close:hover { color: var(--gold); border-color: var(--gold-line); }

        .pc-panel-body { padding: 22px 26px 26px; display: flex; flex-direction: column; gap: 16px; }
        .pc-campo { display: flex; flex-direction: column; gap: 7px; }
        .pc-label {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.26em; text-transform: uppercase; color: var(--ink-4);
        }
        .pc-input {
          font-family: inherit; font-size: 13px;
          color: var(--ink);
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px 12px;
          transition: 0.2s;
          width: 100%;
        }
        .pc-input:focus { outline: none; border-color: var(--gold-line); }
        .pc-area { resize: vertical; line-height: 1.7; min-height: 160px; }

        .pc-estados { display: flex; flex-wrap: wrap; gap: 8px; }
        .pc-estado {
          font-family: inherit; cursor: pointer;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          padding: 8px 14px; border-radius: 999px;
          border: 1px solid var(--line);
          background: transparent; color: var(--ink-4);
          transition: 0.2s;
        }
        .pc-estado:hover { color: var(--ink); border-color: var(--gold-line); }
        .pc-estado.is-on { color: #1a1409; background: var(--gold); border-color: var(--gold); }

        .pc-acoes {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding-top: 8px;
        }
      `}</style>
    </main>
  )
}
