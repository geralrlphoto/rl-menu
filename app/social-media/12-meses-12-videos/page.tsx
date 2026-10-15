import Link from 'next/link'
import GuioesClient from './GuioesClient'

/* ============================================================
   /social-media/12-meses-12-videos
   Pasta do projecto "12 Meses, 12 Vídeos": um vídeo por mês,
   de setembro de 2026 a agosto de 2027.
   Película dos meses + palco com guião, estado, link e teleponto.
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
          Escolhe um mês na película, avança o estado e grava com o modo teleponto.
        </p>
      </header>

      {/* Grelha + painel (cliente) */}
      <GuioesClient />


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

        .mv-erro {
          text-align: center; font-size: 12px;
          color: #d98b7a; margin: 0 0 18px;
        }

        /* Cores por estado */
        .is-por-gravar { --st: var(--ink-4); }
        .is-gravado    { --st: var(--gold-deep); }
        .is-editado    { --st: var(--gold); }
        .is-publicado  { --st: var(--verde); }

        @keyframes mv-up { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        @keyframes mv-in-r { from { opacity: 0; transform: translateX(28px) } to { opacity: 1; transform: none } }
        @keyframes mv-in-l { from { opacity: 0; transform: translateX(-28px) } to { opacity: 1; transform: none } }
        @keyframes mv-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.25 } }

        /* ── Painel de topo ── */
        .mv-dash {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 14px;
          margin-bottom: 26px;
        }
        @media (max-width: 820px) { .mv-dash { grid-template-columns: 1fr; } }

        .mv-prog, .mv-agora {
          border-radius: 14px;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
          padding: 18px 20px;
        }
        .mv-prog-head { display: flex; align-items: baseline; gap: 14px; margin-bottom: 14px; }
        .mv-prog-pct {
          font-family: 'Cormorant Garamond', serif;
          font-size: 44px; line-height: 0.9; color: var(--gold-soft);
        }
        .mv-prog-pct small { font-size: 20px; color: var(--gold-deep); margin-left: 2px; }
        .mv-prog-txt {
          font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.24em; text-transform: uppercase; color: var(--ink-3);
        }
        .mv-prog-txt strong { color: var(--verde); }

        .mv-segs { display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px; margin-bottom: 14px; }
        .mv-seg {
          height: 8px; border: 0; padding: 0; cursor: pointer;
          border-radius: 2px;
          background: var(--st);
          opacity: 0.75;
          transition: transform 0.25s, opacity 0.25s, box-shadow 0.25s;
        }
        .mv-seg.is-por-gravar { background: rgba(239,231,214,0.08); }
        .mv-seg:hover { opacity: 1; transform: scaleY(1.6); }
        .mv-seg.is-sel { opacity: 1; transform: scaleY(1.6); box-shadow: 0 0 0 1px var(--gold); }

        .mv-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .mv-chip {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: inherit;
          font-size: 9.5px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--ink-3);
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: transparent;
          cursor: pointer;
          transition: 0.25s;
        }
        .mv-chip i { width: 6px; height: 6px; border-radius: 50%; background: var(--st); }
        .mv-chip b { color: var(--ink); font-weight: 700; }
        .mv-chip:hover { border-color: var(--gold-line); color: var(--ink); }
        .mv-chip.is-on { border-color: var(--gold); background: var(--gold-faint); color: var(--ink); }

        .mv-agora {
          display: flex; flex-direction: column; gap: 10px;
          text-align: left; font-family: inherit; color: inherit; cursor: pointer;
          border-color: var(--gold-line);
          background:
            radial-gradient(120% 140% at 100% 0%, rgba(200,168,102,0.14), transparent 60%),
            linear-gradient(180deg, var(--surface), var(--surface-2));
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .mv-agora:hover { transform: translateY(-2px); box-shadow: 0 20px 40px -28px rgba(200,168,102,0.5); }
        .mv-agora-rec {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 9.5px; font-weight: 700;
          letter-spacing: 0.3em; text-transform: uppercase; color: #e07a6a;
        }
        .mv-agora-rec i {
          width: 7px; height: 7px; border-radius: 50%; background: #e05a4a;
          animation: mv-pulse 1.4s ease-in-out infinite;
        }
        .mv-agora-titulo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 23px; line-height: 1.2; color: var(--ink);
          flex: 1;
        }
        .mv-agora-foot {
          display: flex; justify-content: space-between; align-items: baseline; gap: 10px; flex-wrap: wrap;
          font-size: 9.5px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-3);
        }
        .mv-agora-dias strong {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; letter-spacing: 0; color: var(--gold-soft); margin-right: 4px;
        }

        /* ── Película ── */
        .mv-film { display: flex; align-items: center; gap: 8px; }
        .mv-film-nav {
          flex: none;
          width: 36px; height: 36px; border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(255,255,255,0.02);
          color: var(--gold);
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; line-height: 1;
          cursor: pointer; transition: 0.25s;
        }
        .mv-film-nav:hover:not(:disabled) { border-color: var(--gold); background: var(--gold-faint); }
        .mv-film-nav:disabled { opacity: 0.25; cursor: default; }
        @media (max-width: 600px) { .mv-film-nav { display: none; } }

        .mv-strip {
          flex: 1; min-width: 0;
          display: flex; gap: 6px;
          overflow-x: auto;
          scroll-snap-type: x proximity;
          padding: 22px 6px;
          scrollbar-width: none;
          position: relative;
          background:
            radial-gradient(circle, var(--bg) 3px, transparent 3.5px) 0 7px / 18px 14px repeat-x,
            radial-gradient(circle, var(--bg) 3px, transparent 3.5px) 0 calc(100% - 7px) / 18px 14px repeat-x,
            #0b0805;
          border-radius: 6px;
          border-top: 1px solid rgba(239,231,214,0.06);
          border-bottom: 1px solid rgba(239,231,214,0.06);
        }
        .mv-strip::-webkit-scrollbar { display: none; }

        .mv-frame {
          position: relative;
          flex: 0 0 158px;
          scroll-snap-align: center;
          display: flex; flex-direction: column;
          text-align: left; font-family: inherit; color: inherit;
          min-height: 150px;
          padding: 12px 13px 11px;
          border-radius: 4px;
          border: 1px solid rgba(239,231,214,0.08);
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
          cursor: pointer;
          transition: transform 0.35s cubic-bezier(0.2,0.85,0.25,1), border-color 0.3s,
                      box-shadow 0.35s, opacity 0.3s, filter 0.3s;
        }
        .mv-frame::after {
          content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 2px;
          background: var(--st); opacity: 0.8;
        }
        .mv-frame.is-por-gravar::after { opacity: 0; }
        .mv-frame:hover { transform: translateY(-3px); border-color: var(--gold-line); }
        .mv-frame.is-sel {
          border-color: var(--gold);
          transform: translateY(-4px) scale(1.03);
          box-shadow: 0 0 0 1px var(--gold), 0 18px 36px -18px rgba(200,168,102,0.55);
          background:
            radial-gradient(120% 90% at 50% 0%, rgba(200,168,102,0.16), transparent 70%),
            linear-gradient(180deg, var(--surface), var(--surface-2));
        }
        .mv-frame.is-fora { opacity: 0.22; filter: grayscale(1); }
        .mv-frame.is-fora:hover { opacity: 0.6; }

        .mv-frame-num {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic; font-size: 30px; line-height: 1;
          color: var(--gold-deep);
          transition: color 0.3s;
        }
        .mv-frame.is-sel .mv-frame-num, .mv-frame:hover .mv-frame-num { color: var(--gold-soft); }
        .mv-frame-mes {
          margin: 6px 0 6px;
          font-size: 9.5px; font-weight: 700;
          letter-spacing: 0.26em; text-transform: uppercase; color: var(--gold);
        }
        .mv-frame-mes em { font-style: normal; color: var(--ink-4); }
        .mv-frame-titulo {
          flex: 1;
          font-size: 12px; line-height: 1.4; color: var(--ink-2);
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
        }
        .mv-frame-estado {
          display: flex; align-items: center; gap: 6px;
          margin-top: 10px;
          font-size: 8px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-3);
        }
        .mv-frame-estado i { width: 6px; height: 6px; border-radius: 50%; background: var(--st); }
        .mv-frame.is-publicado .mv-frame-estado { color: var(--verde); }
        .mv-frame-link { margin-left: auto; color: var(--gold); font-size: 9px; }
        .mv-frame-hoje {
          position: absolute; top: 10px; right: 10px;
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 8px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase; color: #e07a6a;
        }
        .mv-frame-hoje::before {
          content: ''; width: 6px; height: 6px; border-radius: 50%; background: #e05a4a;
          animation: mv-pulse 1.4s ease-in-out infinite;
        }

        .mv-dica {
          text-align: center; margin: 10px 0 22px;
          font-size: 9.5px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--ink-4);
        }
        @media (hover: none) { .mv-dica { display: none; } }

        /* ── Palco ── */
        .mv-stage {
          position: relative; overflow: hidden;
          border-radius: 16px;
          border: 1px solid var(--gold-line);
          background:
            radial-gradient(90% 60% at 100% 0%, rgba(200,168,102,0.08), transparent 60%),
            linear-gradient(180deg, var(--surface), var(--surface-2));
          padding: 28px clamp(20px, 4vw, 40px) 26px;
        }
        .mv-stage.from-right { animation: mv-in-r 0.4s cubic-bezier(0.2,0.85,0.25,1); }
        .mv-stage.from-left  { animation: mv-in-l 0.4s cubic-bezier(0.2,0.85,0.25,1); }
        .mv-stage-bignum {
          position: absolute; right: -6px; top: -34px;
          font-family: 'Cormorant Garamond', serif; font-style: italic;
          font-size: clamp(140px, 22vw, 220px); line-height: 1;
          color: rgba(200,168,102,0.07);
          pointer-events: none; user-select: none;
        }
        .mv-stage-head { position: relative; max-width: 620px; margin-bottom: 24px; }
        .mv-stage-meta {
          margin: 0 0 10px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.26em; text-transform: uppercase; color: var(--gold);
        }
        .mv-stage-meta span { color: var(--ink-4); margin: 0 6px; }
        .mv-stage-titulo {
          margin: 0;
          font-family: 'Cormorant Garamond', serif; font-weight: 400;
          font-size: clamp(26px, 4.2vw, 40px); line-height: 1.12; color: var(--ink);
        }

        /* Pipeline de estado */
        .mv-pipe {
          position: relative;
          display: grid; grid-template-columns: repeat(4, 1fr);
          margin-bottom: 20px;
        }
        .mv-pipe-track {
          position: absolute; left: 12.5%; right: 12.5%; top: 15px;
          height: 2px; background: var(--line);
        }
        .mv-pipe-fill {
          height: 100%; width: calc(var(--p) * 100%);
          background: linear-gradient(90deg, var(--gold-deep), var(--gold), var(--verde));
          transition: width 0.5s cubic-bezier(0.2,0.85,0.25,1);
        }
        .mv-pipe-step {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          font-family: inherit; background: none; border: 0; padding: 0; cursor: pointer;
          color: var(--ink-4);
        }
        .mv-pipe-dot {
          width: 32px; height: 32px; border-radius: 50%;
          display: grid; place-items: center;
          font-size: 12px; font-weight: 700;
          border: 1px solid var(--line);
          background: var(--surface-2);
          color: var(--ink-4);
          transition: 0.3s;
        }
        .mv-pipe-step:hover .mv-pipe-dot { border-color: var(--gold); color: var(--gold); transform: scale(1.08); }
        .mv-pipe-step.is-done .mv-pipe-dot { border-color: var(--gold-deep); color: var(--gold); background: #241c13; }
        .mv-pipe-step.is-cur .mv-pipe-dot {
          border-color: var(--gold); background: var(--gold); color: var(--bg);
          box-shadow: 0 0 0 5px var(--gold-faint);
        }
        .mv-pipe-step:last-child.is-cur .mv-pipe-dot {
          border-color: var(--verde); background: var(--verde); box-shadow: 0 0 0 5px rgba(111,191,143,0.16);
        }
        .mv-pipe-label {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
        }
        .mv-pipe-step.is-done .mv-pipe-label { color: var(--ink-2); }
        .mv-pipe-step.is-cur .mv-pipe-label { color: var(--gold-soft); }

        /* Link */
        .mv-linkrow {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          padding-bottom: 20px; margin-bottom: 4px;
          border-bottom: 1px solid var(--line);
        }
        .mv-input {
          flex: 1; min-width: 220px;
          font-family: inherit; font-size: 13px; color: var(--ink);
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 10px 16px;
          outline: none;
          transition: border-color 0.25s, background 0.25s;
        }
        .mv-input::placeholder { color: var(--ink-4); }
        .mv-input:focus { border-color: var(--gold-line); background: rgba(200,168,102,0.06); }
        .mv-abrir {
          font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--gold); text-decoration: none;
          padding: 10px 16px; border-radius: 999px;
          border: 1px solid var(--gold-faint); background: rgba(200,168,102,0.06);
          transition: 0.25s; white-space: nowrap;
        }
        .mv-abrir:hover { border-color: var(--gold); background: rgba(200,168,102,0.12); }
        .mv-guardado {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.24em; text-transform: uppercase; color: var(--verde);
          opacity: 0; transition: opacity 0.3s;
        }
        .mv-guardado.is-on { opacity: 1; }

        /* Abas */
        .mv-tabs {
          display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
          margin: 16px 0 18px;
        }
        .mv-tab {
          font-family: inherit;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: var(--ink-3);
          background: none; border: 0; cursor: pointer;
          padding: 9px 14px; border-radius: 999px;
          transition: 0.25s;
        }
        .mv-tab:hover { color: var(--ink); }
        .mv-tab.is-on { color: var(--bg); background: var(--gold); }
        .mv-tabs-stats {
          margin-left: auto;
          font-size: 9.5px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-4);
        }

        .mv-tele p {
          margin: 0 0 14px;
          font-size: 15px; line-height: 1.85; color: var(--ink-2);
          max-width: 64ch;
          animation: mv-up 0.45s both cubic-bezier(0.2,0.85,0.25,1);
        }
        .mv-tele strong { color: var(--gold-soft); font-weight: 600; }
        .mv-nota {
          margin: 0;
          font-size: 14px; line-height: 1.8; color: var(--ink-2);
          padding: 16px 20px;
          border-left: 2px solid var(--gold);
          background: rgba(200,168,102,0.05);
          border-radius: 0 10px 10px 0;
          max-width: 64ch;
          animation: mv-up 0.4s both;
        }
        .mv-prompter-btn {
          display: inline-flex; align-items: center; gap: 12px;
          margin-top: 8px;
          font-family: inherit;
          font-size: 10.5px; font-weight: 700;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: var(--ink);
          padding: 8px 20px 8px 8px;
          border-radius: 999px;
          border: 1px solid var(--gold-line);
          background: rgba(200,168,102,0.06);
          cursor: pointer; transition: 0.25s;
        }
        .mv-prompter-btn:hover { border-color: var(--gold); background: var(--gold-faint); }
        .mv-play {
          width: 30px; height: 30px; border-radius: 50%;
          display: grid; place-items: center;
          background: var(--gold); color: var(--bg); font-size: 11px; padding-left: 2px;
        }

        .mv-stage-foot {
          display: flex; justify-content: space-between; gap: 12px;
          margin-top: 26px; padding-top: 18px;
          border-top: 1px solid var(--line);
        }
        .mv-next {
          display: flex; flex-direction: column; gap: 3px;
          text-align: left; font-family: 'Cormorant Garamond', serif;
          font-size: 20px; color: var(--ink-2);
          background: none; border: 0; cursor: pointer; padding: 4px 0;
          transition: color 0.25s;
        }
        .mv-next small {
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.26em; text-transform: uppercase; color: var(--gold-deep);
        }
        .mv-next:hover { color: var(--gold-soft); }
        .mv-next--r { text-align: right; align-items: flex-end; }

        /* ── Plano ── */
        .mv-plano {
          margin-top: 48px; padding-top: 32px;
          border-top: 1px solid var(--line);
          text-align: center;
        }
        .mv-plano-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400; font-style: italic;
          font-size: 26px; color: var(--gold-soft);
          margin: 0 0 18px;
        }
        .mv-plano-tabs {
          display: inline-flex; gap: 4px; padding: 4px;
          border-radius: 999px; border: 1px solid var(--line);
          margin-bottom: 22px;
        }
        .mv-plano-tab {
          font-family: inherit;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--ink-3); background: none; border: 0; cursor: pointer;
          padding: 9px 16px; border-radius: 999px; transition: 0.25s;
        }
        .mv-plano-tab:hover { color: var(--ink); }
        .mv-plano-tab.is-on { background: var(--gold); color: var(--bg); }
        .mv-plano-list {
          list-style: none; margin: 0 auto; padding: 0;
          max-width: 680px; text-align: left;
          display: grid; gap: 8px;
        }
        .mv-plano-list li {
          display: flex; gap: 16px; align-items: baseline;
          padding: 14px 18px;
          border-radius: 12px; border: 1px solid var(--line);
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
          font-size: 13px; line-height: 1.65; color: var(--ink-2);
          animation: mv-up 0.4s both cubic-bezier(0.2,0.85,0.25,1);
        }
        .mv-plano-n {
          flex: none;
          font-family: 'Cormorant Garamond', serif; font-style: italic;
          font-size: 20px; color: var(--gold-deep);
        }

        /* ── Modo teleponto ── */
        .mv-pr {
          position: fixed; inset: 0; z-index: 80;
          background: #050403;
          animation: mv-up 0.25s ease;
          font-family: 'Hanken Grotesk', system-ui, sans-serif;
        }
        .mv-pr-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.06); z-index: 2; }
        .mv-pr-bar div { height: 100%; background: #c8a866; transition: width 0.1s linear; }
        .mv-pr-guide {
          position: absolute; left: 0; right: 0; top: 38%; height: 0;
          border-top: 1px dashed rgba(200,168,102,0.35);
          pointer-events: none; z-index: 2;
        }
        .mv-pr-guide::before {
          content: '▶'; position: absolute; left: 12px; top: -9px;
          font-size: 12px; color: #c8a866;
        }
        .mv-pr-box {
          position: absolute; inset: 0;
          overflow-y: auto;
          padding: 0 clamp(24px, 10vw, 160px);
          cursor: pointer;
          scrollbar-width: none;
          -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 22%, #000 70%, transparent 100%);
                  mask-image: linear-gradient(180deg, transparent 0, #000 22%, #000 70%, transparent 100%);
        }
        .mv-pr-box::-webkit-scrollbar { display: none; }
        .mv-pr-box.is-espelho { transform: scaleX(-1); }
        .mv-pr-pad { height: 38vh; }
        .mv-pr-box p {
          margin: 0 auto 0.9em; max-width: 26ch;
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(32px, 5.4vw, 64px); line-height: 1.3;
          color: #efe7d6; text-align: center;
        }
        .mv-pr-box strong { color: #d7bd87; font-weight: 500; }
        .mv-pr-box .mv-pr-fim {
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 14px; letter-spacing: 0.4em; text-transform: uppercase; color: #5f574b;
        }
        .mv-pr-ctrl {
          position: absolute; left: 50%; bottom: 34px; transform: translateX(-50%);
          z-index: 3;
          display: flex; align-items: center; gap: 6px;
          padding: 6px; border-radius: 999px;
          background: rgba(30,24,18,0.92);
          border: 1px solid rgba(200,168,102,0.22);
          backdrop-filter: blur(8px);
          width: max-content; max-width: calc(100vw - 24px);
          flex-wrap: wrap; justify-content: center;
        }
        .mv-pr-b {
          min-width: 38px; height: 38px; border-radius: 999px;
          border: 1px solid rgba(239,231,214,0.1);
          background: transparent; color: #efe7d6;
          font-family: inherit; font-size: 16px; cursor: pointer; transition: 0.2s;
        }
        .mv-pr-b:hover { border-color: #c8a866; color: #c8a866; }
        .mv-pr-play { background: #c8a866; color: #120d08; border-color: #c8a866; font-size: 13px; }
        .mv-pr-play:hover { color: #120d08; filter: brightness(1.1); }
        .mv-pr-txt {
          padding: 0 14px;
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
        }
        .mv-pr-txt.is-on { background: rgba(200,168,102,0.18); border-color: #c8a866; color: #d7bd87; }
        .mv-pr-vel { min-width: 64px; text-align: center; font-size: 14px; color: #d7bd87; }
        .mv-pr-vel small { font-size: 9px; color: #8c8170; }
        .mv-pr-dica {
          position: absolute; left: 0; right: 0; bottom: 10px; margin: 0; z-index: 3;
          text-align: center; font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase; color: #5f574b;
        }
        @media (hover: none) { .mv-pr-dica { display: none; } }
      `}</style>
    </main>
  )
}
