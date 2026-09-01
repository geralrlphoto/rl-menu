import Link from 'next/link'
import { GUIOES, PLANO } from './_data/guioes'

/* ============================================================
   /social-media/12-meses-12-videos
   Pasta do projecto "12 Meses, 12 Vídeos": um vídeo por mês,
   de setembro de 2026 a agosto de 2027. Cada mês abre com a
   nota de realização e o teleponto completo.
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
          Público: noivos. Objectivo: autoridade e captação de leads.
          Clica num mês para abrir a nota de realização e o teleponto.
        </p>
      </header>

      {/* Meses */}
      <section className="mv-list">
        {GUIOES.map(g => (
          <details key={g.n} className="mv-card">
            <summary className="mv-sum">
              <span className="mv-num">{String(g.n).padStart(2, '0')}</span>
              <span className="mv-sum-body">
                <span className="mv-mes">{g.mes} {g.ano}</span>
                <span className="mv-titulo">{g.titulo}</span>
              </span>
              <span className="mv-meta">
                <span className="mv-dur">{g.duracao}</span>
                <span className="mv-badge">{g.estado}</span>
              </span>
              <span className="mv-chev">›</span>
            </summary>

            <div className="mv-body">
              {g.publicacao && (
                <p className="mv-pub">
                  <span className="mv-pub-label">Publicação</span> {g.publicacao}
                </p>
              )}

              <h3 className="mv-h3">Nota de realização</h3>
              <p className="mv-nota">{g.nota}</p>

              <h3 className="mv-h3">Teleponto</h3>
              <div className="mv-tele">
                {g.teleponto.map((par, i) => (
                  <p key={i}>
                    {par.label && <strong>{par.label}</strong>}
                    {par.label && par.text ? ' ' : null}
                    {par.text}
                  </p>
                ))}
              </div>
            </div>
          </details>
        ))}
      </section>

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
          max-width: 520px;
          margin-left: auto; margin-right: auto;
          font-size: 13.5px; color: var(--ink-3);
          line-height: 1.7;
        }

        /* ── Lista de meses ── */
        .mv-list { display: flex; flex-direction: column; gap: 10px; }

        .mv-card {
          position: relative; overflow: hidden;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
          transition: border-color 0.3s, box-shadow 0.4s;
        }
        .mv-card::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 2px; background: var(--gold);
          transform: scaleY(0); transform-origin: center;
          transition: transform 0.35s cubic-bezier(0.2,0.85,0.25,1);
        }
        .mv-card:hover {
          border-color: var(--gold-line);
          box-shadow: 0 22px 44px -30px rgba(200,168,102,0.4);
        }
        .mv-card:hover::before, .mv-card[open]::before { transform: scaleY(1); }
        .mv-card[open] { border-color: var(--gold-line); }

        .mv-sum {
          list-style: none; cursor: pointer;
          display: flex; align-items: center; gap: 16px;
          padding: 18px 22px;
        }
        .mv-sum::-webkit-details-marker { display: none; }

        .mv-num {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400; font-style: italic;
          font-size: 26px; line-height: 1;
          color: var(--gold-deep);
          flex: none; min-width: 28px;
        }
        .mv-card:hover .mv-num, .mv-card[open] .mv-num { color: var(--gold-soft); }

        .mv-sum-body { flex: 1; min-width: 0; }
        .mv-mes {
          display: block;
          font-size: 10.5px; font-weight: 700;
          letter-spacing: 0.28em; text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 5px;
        }
        .mv-titulo {
          display: block;
          font-size: 14px; color: var(--ink);
          line-height: 1.4;
        }

        .mv-meta {
          display: flex; align-items: center; gap: 8px;
          flex: none;
        }
        .mv-dur {
          font-size: 11px; color: var(--ink-4);
          white-space: nowrap;
        }
        .mv-badge {
          font-size: 8.5px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--ink-3);
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(255,255,255,0.02);
          white-space: nowrap;
        }
        .mv-chev {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px; line-height: 1;
          color: var(--ink-4);
          flex: none;
          transition: transform 0.3s cubic-bezier(0.2,0.85,0.25,1), color 0.3s;
        }
        .mv-card:hover .mv-chev { color: var(--gold); }
        .mv-card[open] .mv-chev { transform: rotate(90deg); color: var(--gold); }

        @media (max-width: 640px) {
          .mv-sum { flex-wrap: wrap; gap: 12px; padding: 16px 18px; }
          .mv-sum-body { flex: 1 1 100%; order: 2; }
          .mv-meta { order: 3; }
          .mv-chev { order: 4; margin-left: auto; }
        }

        /* ── Corpo do guião ── */
        .mv-body {
          padding: 4px 22px 24px 66px;
          border-top: 1px solid var(--line);
          margin-top: 2px;
        }
        @media (max-width: 640px) { .mv-body { padding: 4px 18px 22px; } }

        .mv-pub {
          margin: 16px 0 0;
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
          margin: 22px 0 10px;
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
