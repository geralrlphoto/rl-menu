import Link from 'next/link'
import GuioesClient from './GuioesClient'
import { PLANO } from './_data/guioes'

/* ============================================================
   /social-media/12-meses-12-videos
   Pasta do projecto "12 Meses, 12 Vídeos": um vídeo por mês,
   de setembro de 2026 a agosto de 2027.
   Grelha dos meses + painel com o guião, estado e link.
   ============================================================ */

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
          Um vídeo por mês, de setembro de 2026 a agosto de 2027.
          Clica num mês para abrir o guião, marcar o estado e guardar o link.
        </p>
      </header>

      {/* Grelha + painel (cliente) */}
      <GuioesClient />

      {/* Plano */}
      <section className="mv-plano">
        <h2 className="mv-plano-title">Produção e distribuição</h2>
        <div className="mv-plano-grid">
          <div className="mv-plano-col">
            <h3 className="mv-h3">Produção</h3>
            <ul>{PLANO.producao.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>
          <div className="mv-plano-col">
            <h3 className="mv-h3">Formatos</h3>
            <ul>{PLANO.formatos.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>
          <div className="mv-plano-col">
            <h3 className="mv-h3">Distribuição</h3>
            <ul>{PLANO.distribuicao.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>
        </div>
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
          --verde: #6fbf8f;

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

        .mv-head { text-align: center; margin-bottom: 28px; }
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
        .mv-title em { font-style: italic; color: var(--gold-soft); font-weight: 400; }
        .mv-rule {
          margin: 22px auto 0;
          width: 96px; height: 1px; border: 0;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }
        .mv-lede {
          margin-top: 20px;
          max-width: 480px;
          margin-left: auto; margin-right: auto;
          font-size: 13.5px; color: var(--ink-3);
          line-height: 1.7;
        }

        .mv-contador {
          text-align: center;
          font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.28em; text-transform: uppercase;
          color: var(--ink-4);
          margin: 0 0 26px;
        }
        .mv-contador strong { color: var(--gold); font-weight: 700; }

        .mv-erro {
          text-align: center; font-size: 12px;
          color: #d98b7a; margin: 0 0 18px;
        }

        /* ── Grelha dos meses ── */
        .mv-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 860px) { .mv-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px) { .mv-grid { grid-template-columns: 1fr; } }

        .mv-card {
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          text-align: left; cursor: pointer;
          font-family: inherit;
          min-height: 152px;
          padding: 16px 18px 14px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
          color: inherit;
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
        .mv-card:focus-visible { outline: 1px solid var(--gold); outline-offset: 2px; }

        .mv-card-top {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px;
        }
        .mv-num {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400; font-style: italic;
          font-size: 26px; line-height: 1;
          color: var(--gold-deep);
        }
        .mv-card:hover .mv-num { color: var(--gold-soft); }
        .mv-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--ink-4);
        }
        .mv-card.is-gravado .mv-dot   { background: var(--gold-deep); }
        .mv-card.is-editado .mv-dot   { background: var(--gold); }
        .mv-card.is-publicado .mv-dot { background: var(--verde); }

        .mv-mes {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.28em; text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 6px;
        }
        .mv-titulo {
          font-size: 13.5px; line-height: 1.45;
          color: var(--ink);
          flex: 1;
        }
        .mv-card-foot {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid var(--line);
        }
        .mv-estado {
          font-size: 8.5px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--ink-3);
        }
        .mv-card.is-publicado .mv-estado { color: var(--verde); }
        .mv-tem-link { font-size: 10px; color: var(--gold); }

        /* ── Painel do guião ── */
        .mv-overlay {
          position: fixed; inset: 0; z-index: 60;
          background: rgba(8, 5, 3, 0.78);
          backdrop-filter: blur(3px);
          display: flex; align-items: flex-start; justify-content: center;
          padding: clamp(16px, 5vh, 56px) 16px;
          overflow-y: auto;
          animation: mv-fade 0.2s ease;
        }
        @keyframes mv-fade { from { opacity: 0 } to { opacity: 1 } }

        .mv-painel {
          width: 100%; max-width: 760px;
          border-radius: 14px;
          border: 1px solid var(--gold-line);
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
          padding: 26px clamp(20px, 4vw, 34px) 32px;
          box-shadow: 0 40px 80px -30px rgba(0,0,0,0.8);
          animation: mv-rise 0.25s cubic-bezier(0.2,0.85,0.25,1);
        }
        @keyframes mv-rise { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }

        .mv-painel-head {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--line);
        }
        .mv-painel-mes {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.28em; text-transform: uppercase;
          color: var(--gold);
          margin: 0 0 8px;
        }
        .mv-painel-titulo {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: clamp(22px, 3.4vw, 30px);
          line-height: 1.2;
          color: var(--ink);
          margin: 0;
        }
        .mv-fechar {
          flex: none;
          width: 32px; height: 32px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(255,255,255,0.02);
          color: var(--ink-3);
          font-size: 18px; line-height: 1;
          cursor: pointer;
          transition: 0.25s;
        }
        .mv-fechar:hover { color: var(--ink); border-color: var(--gold-line); }

        /* Campos editáveis */
        .mv-campos {
          display: flex; align-items: flex-end; flex-wrap: wrap;
          gap: 12px;
          padding: 18px 0;
          border-bottom: 1px solid var(--line);
        }
        .mv-campo { display: flex; flex-direction: column; gap: 6px; }
        .mv-campo--link { flex: 1; min-width: 220px; }
        .mv-campo-label {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: var(--gold-deep);
        }
        .mv-select, .mv-input {
          font-family: inherit;
          font-size: 13px;
          color: var(--ink);
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 9px 12px;
          outline: none;
          transition: border-color 0.25s, background 0.25s;
        }
        .mv-select { min-width: 150px; cursor: pointer; }
        .mv-select option { background: var(--surface); color: var(--ink); }
        .mv-input { width: 100%; }
        .mv-input::placeholder { color: var(--ink-4); }
        .mv-select:focus, .mv-input:focus {
          border-color: var(--gold-line);
          background: rgba(200,168,102,0.06);
        }
        .mv-abrir {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--gold);
          text-decoration: none;
          padding: 9px 14px;
          border-radius: 8px;
          border: 1px solid var(--gold-faint);
          background: rgba(200,168,102,0.06);
          transition: 0.25s;
          white-space: nowrap;
        }
        .mv-abrir:hover { border-color: var(--gold); background: rgba(200,168,102,0.12); }
        .mv-guardado {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: var(--verde);
          opacity: 0;
          transition: opacity 0.3s;
          padding-bottom: 11px;
        }
        .mv-guardado.is-on { opacity: 1; }

        .mv-pub {
          margin: 18px 0 0;
          font-size: 12px; color: var(--ink-2);
        }
        .mv-pub-label {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: var(--gold-deep);
          margin-right: 8px;
        }

        .mv-h3 {
          font-size: 9.5px; font-weight: 700;
          letter-spacing: 0.3em; text-transform: uppercase;
          color: var(--gold);
          margin: 24px 0 10px;
        }
        .mv-nota {
          margin: 0;
          font-size: 12.5px; line-height: 1.75;
          color: var(--ink-3);
          padding: 12px 16px;
          border-left: 1px solid var(--gold-faint);
          background: rgba(200,168,102,0.04);
          border-radius: 0 6px 6px 0;
        }
        .mv-tele p {
          margin: 0 0 14px;
          font-size: 14.5px; line-height: 1.85;
          color: var(--ink-2);
          max-width: 62ch;
        }
        .mv-tele p:last-child { margin-bottom: 0; }
        .mv-tele strong { color: var(--gold-soft); font-weight: 600; }

        /* ── Plano ── */
        .mv-plano {
          margin-top: 56px;
          padding-top: 32px;
          border-top: 1px solid var(--line);
        }
        .mv-plano-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400; font-style: italic;
          font-size: 26px; color: var(--gold-soft);
          margin: 0 0 24px; text-align: center;
        }
        .mv-plano-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 800px) { .mv-plano-grid { grid-template-columns: 1fr; } }
        .mv-plano-col {
          padding: 18px 20px 20px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
        }
        .mv-plano-col .mv-h3 { margin-top: 0; }
        .mv-plano-col ul { margin: 0; padding-left: 16px; }
        .mv-plano-col li {
          font-size: 12.5px; line-height: 1.7;
          color: var(--ink-3);
          margin-bottom: 10px;
        }
        .mv-plano-col li:last-child { margin-bottom: 0; }
        .mv-plano-col li::marker { color: var(--gold-deep); }
      `}</style>
    </main>
  )
}
