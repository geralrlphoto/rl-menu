'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/* Banner do Relatório Diário no /photo: limpo e interativo.
   Luz que segue o rato, relógio de Lisboa ao vivo e as 4 áreas do relatório. */

const AREAS = [
  {
    k: 'Eventos', d: 'Casamentos, reuniões e agenda',
    icon: <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />,
  },
  {
    k: 'Leads', d: 'Pedidos de orçamento e respostas',
    icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>,
  },
  {
    k: 'Portais', d: 'O que os noivos fizeram',
    icon: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v5" /></>,
  },
  {
    k: 'Prazos', d: 'Entregas a vencer e atrasos',
    icon: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></>,
  },
]

const horaLisboa = () => new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Lisbon' })

export default function RelatorioDiarioBanner() {
  const caixa = useRef<HTMLAnchorElement>(null)
  // Relógio só no browser (evita diferenças entre servidor e cliente)
  const [hora, setHora] = useState<string | null>(null)
  useEffect(() => {
    setHora(horaLisboa())
    const t = setInterval(() => setHora(horaLisboa()), 1000)
    return () => clearInterval(t)
  }, [])

  // Luz que segue o rato: só mexe em variáveis CSS, sem re-render
  const mover = (e: React.MouseEvent) => {
    const el = caixa.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <div className="border-t border-white/[0.06] bg-[#060606] px-4 sm:px-10 py-12 sm:py-16">
      <style>{CSS}</style>
      <Link href="/relatorio-diario" ref={caixa} onMouseMove={mover} className="rdx group block w-full max-w-6xl mx-auto" aria-label="Abrir o Relatório Diário">
        <div className="rdx-luz" aria-hidden="true" />
        <div className="rdx-grelha" aria-hidden="true" />

        <div className="rdx-corpo">
          {/* Esquerda: estado, título e botão */}
          <div className="rdx-esq">
            <div className="rdx-vivo">
              <span className="rdx-ponto" />
              Ao vivo
              <span className="rdx-hora">{hora ?? '--:--:--'}</span>
            </div>
            <h2 className="rdx-titulo">
              Relatório<br /><span>Diário</span>
            </h2>
            <p className="rdx-sub">O estado do estúdio num só ecrã, atualizado quando o abres.</p>
            <span className="rdx-cta">
              Abrir relatório
              <span className="rdx-cta-seta">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </span>
            </span>
          </div>

          {/* Direita: as 4 áreas */}
          <ul className="rdx-areas">
            {AREAS.map((a, i) => (
              <li key={a.k} className="rdx-area" style={{ animationDelay: `${0.08 + i * 0.07}s` }}>
                <span className="rdx-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
                </span>
                <span className="rdx-txt">
                  <span className="rdx-k">{a.k}</span>
                  <span className="rdx-d">{a.d}</span>
                </span>
                <span className="rdx-seta">→</span>
              </li>
            ))}
          </ul>
        </div>
      </Link>
    </div>
  )
}

const CSS = `
.rdx{--mx:70%;--my:30%;position:relative;overflow:hidden;border-radius:24px;text-decoration:none;isolation:isolate;
  background:#0b0b0c;border:1px solid rgba(255,255,255,.08);
  transition:border-color .5s cubic-bezier(.16,1,.3,1),box-shadow .5s cubic-bezier(.16,1,.3,1);}
.rdx:hover{border-color:rgba(201,168,76,.35);box-shadow:0 40px 90px -40px rgba(201,168,76,.35);}
.rdx-luz{position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:radial-gradient(520px circle at var(--mx) var(--my),rgba(201,168,76,.16),transparent 55%);
  opacity:.55;transition:opacity .5s;}
.rdx:hover .rdx-luz{opacity:1;}
.rdx-grelha{position:absolute;inset:0;z-index:-1;pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);
  background-size:44px 44px;mask-image:radial-gradient(ellipse 80% 70% at 70% 40%,#000 20%,transparent 75%);}

.rdx-corpo{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:clamp(24px,4vw,56px);padding:clamp(24px,4vw,48px);align-items:center;}

.rdx-esq,.rdx-areas{min-width:0;}
.rdx-vivo{display:inline-flex;align-items:center;gap:10px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  color:rgba(255,255,255,.7);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:40px;padding:7px 14px 7px 12px;}
.rdx-ponto{width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 0 0 rgba(52,211,153,.6);animation:rdxPulso 2s infinite;}
@keyframes rdxPulso{0%{box-shadow:0 0 0 0 rgba(52,211,153,.55)}70%{box-shadow:0 0 0 8px rgba(52,211,153,0)}100%{box-shadow:0 0 0 0 rgba(52,211,153,0)}}
.rdx-hora{font-variant-numeric:tabular-nums;color:rgba(255,255,255,.45);font-weight:500;letter-spacing:.04em;border-left:1px solid rgba(255,255,255,.12);padding-left:10px;}

.rdx-titulo{margin:22px 0 0;font-size:clamp(44px,6.4vw,84px);font-weight:700;line-height:.95;letter-spacing:-.045em;color:#fff;}
.rdx-titulo span{background:linear-gradient(100deg,#f1d98f 0%,#C9A84C 45%,#8a6d2c 100%);-webkit-background-clip:text;background-clip:text;color:transparent;}
.rdx-sub{margin-top:16px;max-width:34ch;font-size:15px;line-height:1.55;color:rgba(255,255,255,.5);}

.rdx-cta{margin-top:28px;display:inline-flex;align-items:center;gap:14px;background:#fff;color:#0b0b0c;border-radius:40px;padding:8px 8px 8px 22px;
  font-size:14px;font-weight:600;letter-spacing:-.01em;transition:background .35s,transform .35s cubic-bezier(.16,1,.3,1);}
.rdx-cta-seta{width:34px;height:34px;border-radius:50%;background:#0b0b0c;color:#fff;display:grid;place-items:center;transition:transform .4s cubic-bezier(.16,1,.3,1),background .35s;}
.rdx:hover .rdx-cta{background:#C9A84C;}
.rdx:hover .rdx-cta-seta{transform:rotate(-45deg);}

.rdx-areas{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;}
@keyframes rdxEntra{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
.rdx-area{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:16px;border:1px solid rgba(255,255,255,.06);
  background:rgba(255,255,255,.02);backdrop-filter:blur(6px);opacity:0;animation:rdxEntra .6s cubic-bezier(.16,1,.3,1) forwards;
  transition:background .3s,border-color .3s,transform .35s cubic-bezier(.16,1,.3,1);}
.rdx-area:hover{background:rgba(201,168,76,.08);border-color:rgba(201,168,76,.35);transform:translateX(-4px);}
.rdx-ico{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:#C9A84C;background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.18);transition:background .3s,color .3s;}
.rdx-ico svg{width:19px;height:19px;}
.rdx-area:hover .rdx-ico{background:#C9A84C;color:#0b0b0c;}
.rdx-txt{flex:1;min-width:0;display:flex;flex-direction:column;}
.rdx-k{font-size:15px;font-weight:600;color:#fff;letter-spacing:-.01em;}
.rdx-d{font-size:13px;color:rgba(255,255,255,.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rdx-seta{color:rgba(255,255,255,.25);transition:color .3s,transform .3s;}
.rdx-area:hover .rdx-seta{color:#C9A84C;transform:translateX(3px);}

@media (max-width:820px){
  .rdx-corpo{grid-template-columns:1fr;}
  .rdx-cta{width:100%;justify-content:space-between;box-sizing:border-box;}
}
@media (prefers-reduced-motion:reduce){
  .rdx-ponto,.rdx-area{animation:none;opacity:1;}
}
`
