import type { Metadata } from 'next'

/* ============================================================
   Envolvente da secção do podcast.
   Guarda o estilo partilhado pelas três páginas públicas, para não
   estar repetido em cada uma. A paleta e a tipografia são as que o
   site já usa (Cormorant Garamond + Hanken Grotesk, dourado sobre
   fundo escuro): não se inventou linguagem visual nova.
   ============================================================ */

export const metadata: Metadata = {
  title: {
    default: 'Antes do Sim — Podcast RL Photo Video',
    template: '%s · Antes do Sim',
  },
  description:
    'Todos os meses, uma conversa com quem faz casamentos por dentro, para quem está a planear o seu.',
}

export default function PodcastLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pod">
      {children}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Hanken+Grotesk:wght@300;400;500;600;700&display=swap');

        .pod {
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
          font-size: 16px;
          line-height: 1.6;
        }
        .pod * { box-sizing: border-box; }

        .pod-wrap {
          max-width: 940px;
          margin: 0 auto;
          padding: 28px clamp(20px, 5vw, 40px) 96px;
        }

        /* Foco visível em todo o lado, para navegação por teclado */
        .pod a:focus-visible,
        .pod button:focus-visible,
        .pod input:focus-visible,
        .pod select:focus-visible,
        .pod textarea:focus-visible,
        .pod summary:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 3px;
          border-radius: 4px;
        }

        /* ── Tipografia ─────────────────────────────────────── */
        .pod-eyebrow {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.36em; text-transform: uppercase;
          color: var(--gold); margin: 0 0 16px;
        }
        .pod-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: clamp(38px, 8vw, 66px);
          line-height: 1.04;
          letter-spacing: 0.01em;
          color: var(--ink);
          margin: 0 0 20px;
        }
        .pod-h1 em { font-style: italic; color: var(--gold-soft); }
        .pod-h2 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: clamp(26px, 4.5vw, 36px);
          line-height: 1.2;
          color: var(--ink);
          margin: 0 0 20px;
        }
        .pod-h3 {
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: var(--gold); margin: 0 0 14px;
        }
        .pod-lede {
          font-size: clamp(15px, 2.4vw, 17px);
          line-height: 1.75;
          color: var(--ink-2);
          max-width: 60ch;
          margin: 0 0 20px;
        }
        .pod-texto { color: var(--ink-2); max-width: 66ch; }
        .pod-texto p { margin: 0 0 16px; }
        .pod-texto h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 400; color: var(--ink);
          margin: 32px 0 14px;
        }
        .pod-texto h3 {
          font-size: 12px; font-weight: 700; letter-spacing: 0.22em;
          text-transform: uppercase; color: var(--gold); margin: 28px 0 12px;
        }
        .pod-texto ul { margin: 0 0 18px; padding-left: 20px; }
        .pod-texto li { margin-bottom: 8px; }
        .pod-texto strong { color: var(--ink); font-weight: 600; }
        .pod-texto a { color: var(--gold-soft); }

        .pod-rule {
          width: 96px; height: 1px; border: 0; margin: 28px 0;
          background: linear-gradient(90deg, var(--gold), transparent);
        }
        .pod-rule.is-center { margin-left: auto; margin-right: auto;
          background: linear-gradient(90deg, transparent, var(--gold), transparent); }

        /* ── Botões e ligações ──────────────────────────────── */
        .pod-btn, .pod-btn-linha {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; cursor: pointer;
          font-family: inherit; font-size: 12px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          padding: 14px 26px; border-radius: 999px;
          text-decoration: none;
          transition: 0.25s;
          min-height: 48px;
        }
        .pod-btn {
          color: #17110a; background: var(--gold); border: 1px solid var(--gold);
        }
        .pod-btn:hover { background: var(--gold-soft); border-color: var(--gold-soft); }
        .pod-btn-linha {
          color: var(--ink-2); background: transparent; border: 1px solid var(--gold-line);
        }
        .pod-btn-linha:hover { color: var(--ink); border-color: var(--gold); }
        .pod-btn[disabled], .pod-btn-linha[disabled] { opacity: 0.5; cursor: not-allowed; }

        .pod-voltar {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.3em; text-transform: uppercase;
          color: var(--ink-4); text-decoration: none;
          padding: 8px 14px; border-radius: 999px;
          border: 1px solid var(--gold-faint);
          transition: 0.25s;
        }
        .pod-voltar:hover { color: var(--ink); border-color: var(--gold-line); }

        /* ── Blocos ─────────────────────────────────────────── */
        .pod-bloco {
          border-radius: 14px;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
          padding: clamp(24px, 5vw, 40px);
        }
        .pod-bloco.is-destaque { border-color: var(--gold-line); }

        .pod-seccao { margin-top: clamp(56px, 9vw, 88px); }

        /* ── Formulários ────────────────────────────────────── */
        .pod-form { display: flex; flex-direction: column; gap: 18px; }
        .pod-grelha-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        @media (max-width: 640px) { .pod-grelha-2 { grid-template-columns: 1fr; } }

        .pod-campo { display: flex; flex-direction: column; gap: 8px; }
        .pod-label {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-3);
        }
        .pod-input {
          font-family: inherit; font-size: 15px;
          color: var(--ink);
          background: rgba(0, 0, 0, 0.32);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 13px 14px;
          width: 100%;
          min-height: 48px;
          transition: border-color 0.2s;
        }
        .pod-input:focus { outline: none; border-color: var(--gold); }
        .pod-input[aria-invalid="true"] { border-color: #d98a8a; }
        textarea.pod-input { resize: vertical; min-height: 130px; line-height: 1.7; }
        select.pod-input { appearance: none; cursor: pointer; }

        .pod-erro-campo { font-size: 12.5px; color: #e8a1a1; margin: 0; }

        .pod-consent {
          display: flex; align-items: flex-start; gap: 12px;
          font-size: 13.5px; color: var(--ink-3); line-height: 1.6;
        }
        .pod-consent input { width: 20px; height: 20px; margin-top: 2px; flex: none; accent-color: var(--gold); }
        .pod-consent a { color: var(--gold-soft); }

        /* Campo-armadilha: fora do ecrã, invisível para quem usa o site */
        .pod-armadilha {
          position: absolute !important;
          width: 1px; height: 1px; overflow: hidden;
          clip: rect(0 0 0 0); white-space: nowrap;
        }

        .pod-aviso {
          font-size: 14px; padding: 14px 16px; border-radius: 10px; margin: 0;
        }
        .pod-aviso.is-ok {
          color: #a8dcb0; background: rgba(80, 200, 120, 0.08);
          border: 1px solid rgba(80, 200, 120, 0.25);
        }
        .pod-aviso.is-erro {
          color: #e8a1a1; background: rgba(220, 80, 80, 0.08);
          border: 1px solid rgba(220, 80, 80, 0.25);
        }
      `}</style>
    </div>
  )
}
