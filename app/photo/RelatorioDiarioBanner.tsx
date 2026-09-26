'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/* Banner do Relatório Diário no /photo, em forma de primeira página de jornal:
   cabeçalho com a edição do dia, manchetes por secção e faixa de "última hora". */

const MANCHETES = [
  { sec: 'Eventos', t: 'Casamentos, reuniões e a agenda do dia' },
  { sec: 'Leads', t: 'Quem pediu orçamento e quem espera resposta' },
  { sec: 'Portais', t: 'O que os noivos fizeram desde ontem' },
  { sec: 'Prazos', t: 'Entregas a vencer e o que está atrasado' },
]

const ULTIMA_HORA = ['Eventos da semana', 'Novas leads', 'Pagamentos', 'Seleções de fotos', 'Vídeos a entregar', 'Portais dos noivos', 'Reuniões marcadas']

function hoje() {
  const d = new Date()
  const data = d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Lisbon' })
  const lx = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Lisbon' }))
  const edicao = Math.floor((lx.getTime() - new Date(lx.getFullYear(), 0, 0).getTime()) / 86400000)
  return { data: data.charAt(0).toUpperCase() + data.slice(1), edicao }
}

export default function RelatorioDiarioBanner() {
  // Data só no browser: evita diferenças entre servidor e cliente à meia-noite
  const [dia, setDia] = useState<{ data: string; edicao: number } | null>(null)
  useEffect(() => { setDia(hoje()) }, [])

  return (
    <div className="border-t border-white/[0.06] bg-[#060606] px-4 sm:px-10 py-12 sm:py-16">
      {/* O @import do globals.css não chega ao browser; a fonte carrega-se aqui */}
      <link rel="stylesheet" precedence="default"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap" />
      <style>{CSS}</style>
      <Link href="/relatorio-diario" className="rd-jornal group block w-full max-w-6xl mx-auto" aria-label="Abrir o Relatório Diário">
        {/* Linha do topo */}
        <div className="rd-topo">
          <span>RL Photo · Video</span>
          <span className="rd-edicao">{dia ? `Edição nº ${dia.edicao}` : 'Edição de hoje'}</span>
          <span className="rd-data">{dia?.data ?? ''}</span>
        </div>
        <div className="rd-regra-dupla" />

        {/* Cabeçalho do jornal */}
        <div className="rd-cabeca">
          <h2 className="rd-titulo font-cormorant">
            <span className="rd-o">O</span> Relatório <em>Diário</em>
          </h2>
          <p className="rd-lema">Eventos, leads, portais e prazos. Tudo num só lugar, em tempo real.</p>
        </div>
        <div className="rd-regra-dupla" />

        {/* Manchetes */}
        <div className="rd-colunas">
          {MANCHETES.map((m, i) => (
            <div key={m.sec} className="rd-coluna" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
              <span className="rd-sec">{m.sec}</span>
              <p className="rd-manchete font-cormorant">{m.t}</p>
            </div>
          ))}
        </div>

        {/* Última hora + entrar */}
        <div className="rd-rodape">
          <div className="rd-ticker" aria-hidden="true">
            <span className="rd-ticker-tag">Última hora</span>
            <div className="rd-ticker-janela">
              <div className="rd-ticker-faixa">
                {[...ULTIMA_HORA, ...ULTIMA_HORA].map((t, i) => <span key={i}>{t}<i>✦</i></span>)}
              </div>
            </div>
          </div>
          <span className="rd-cta">
            Ler a edição de hoje
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </span>
        </div>
      </Link>
    </div>
  )
}

const CSS = `
.rd-jornal{position:relative;border:1px solid rgba(201,168,76,.22);border-radius:18px;padding:clamp(18px,3vw,34px) clamp(18px,3.4vw,44px);
  background:radial-gradient(120% 90% at 50% 0%,rgba(201,168,76,.07),transparent 60%),#0c0b09;overflow:hidden;text-decoration:none;
  transition:border-color .5s,transform .5s cubic-bezier(.16,1,.3,1),box-shadow .5s;}
.rd-jornal::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.06;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");}
.rd-jornal:hover{border-color:rgba(201,168,76,.55);transform:translateY(-3px);box-shadow:0 30px 70px -30px rgba(201,168,76,.35);}
.rd-topo{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;font-size:9.5px;letter-spacing:.32em;text-transform:uppercase;color:rgba(255,255,255,.38);}
.rd-topo .rd-edicao{color:#C9A84C;}
.rd-topo .rd-data{text-align:right;letter-spacing:.18em;}
.rd-regra-dupla{height:5px;margin:12px 0;border-top:1px solid rgba(201,168,76,.55);border-bottom:1px solid rgba(201,168,76,.25);}
.rd-cabeca{text-align:center;padding:clamp(6px,1.4vw,14px) 0 clamp(4px,1vw,10px);}
.rd-titulo{font-weight:300;font-size:clamp(46px,9vw,112px);line-height:.95;letter-spacing:-.015em;color:#f3ede2;margin:0;}
.rd-titulo em{font-style:italic;color:#C9A84C;}
.rd-titulo .rd-o{font-style:italic;color:rgba(243,237,226,.45);font-size:.62em;vertical-align:.18em;}
.rd-lema{margin-top:10px;font-size:10.5px;letter-spacing:.3em;text-transform:uppercase;color:rgba(255,255,255,.34);}
@keyframes rdSobe{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.rd-colunas{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));}
.rd-coluna{padding:14px 18px 16px;border-left:1px solid rgba(255,255,255,.08);opacity:0;animation:rdSobe .8s cubic-bezier(.16,1,.3,1) forwards;}
.rd-coluna:first-child{border-left:none;padding-left:0;}
.rd-sec{display:inline-block;font-size:9px;letter-spacing:.34em;text-transform:uppercase;color:#C9A84C;border-bottom:1px solid rgba(201,168,76,.4);padding-bottom:4px;}
.rd-manchete{margin-top:10px;font-size:clamp(18px,1.7vw,23px);line-height:1.2;color:rgba(243,237,226,.82);transition:color .4s;}
.rd-jornal:hover .rd-manchete{color:#f3ede2;}
.rd-rodape{display:flex;align-items:center;gap:18px;margin-top:10px;padding-top:14px;border-top:1px solid rgba(255,255,255,.08);}
.rd-ticker{flex:1;min-width:0;display:flex;align-items:center;gap:12px;}
.rd-ticker-tag{flex:none;font-size:9px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:#0c0b09;background:#C9A84C;border-radius:4px;padding:4px 8px;}
.rd-ticker-janela{flex:1;min-width:0;overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);}
@keyframes rdCorre{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.rd-ticker-faixa{display:flex;width:max-content;animation:rdCorre 38s linear infinite;}
.rd-jornal:hover .rd-ticker-faixa{animation-duration:16s;}
.rd-ticker-faixa span{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.5);white-space:nowrap;padding-right:18px;}
.rd-ticker-faixa i{font-style:normal;color:#C9A84C;margin-left:18px;font-size:9px;}
.rd-cta{flex:none;display:inline-flex;align-items:center;gap:10px;border:1px solid #C9A84C;color:#C9A84C;border-radius:40px;padding:11px 20px;
  font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;transition:background .4s,color .4s;}
.rd-jornal:hover .rd-cta{background:#C9A84C;color:#0c0b09;}
.rd-cta svg{transition:transform .4s;}
.rd-jornal:hover .rd-cta svg{transform:translateX(3px);}
@media (max-width:760px){
  .rd-topo{grid-template-columns:1fr auto;}
  .rd-topo .rd-data{display:none;}
  .rd-colunas{grid-template-columns:repeat(2,minmax(0,1fr));}
  .rd-coluna:nth-child(3){border-left:none;padding-left:0;}
  .rd-coluna:nth-child(n+3){border-top:1px solid rgba(255,255,255,.08);}
  .rd-rodape{flex-direction:column;align-items:stretch;}
  .rd-cta{justify-content:center;}
}
@media (prefers-reduced-motion:reduce){
  .rd-ticker-faixa,.rd-coluna{animation:none;opacity:1;}
}
`
