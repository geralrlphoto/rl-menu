'use client'

import type { ReactNode } from 'react'
import { CSS_BRIEFING } from '@/app/_briefing/estilo'
import { CSS_MARCAR } from '@/app/rollup/MarcarReuniao'

/* Moldura comum das páginas /reuniao e /reuniao/<id>, com o layout da app:
   letras do relógio do portal (Jost 200 nos títulos, Roboto Condensed nos números),
   dourado #d8be93, foto em cena com eyebrow e o calendário num cartão de vidro
   com a barra de fotogramas a mostrar o passo. */

const PASSOS = ['Horário', 'Os vossos dados', 'Confirmar']

const PILARES = [
  ['Onde preferirem', 'Por videochamada ou no nosso estúdio, como vos der mais jeito.'],
  ['Sem compromisso', 'Saem com tudo o que precisam para decidir com calma.'],
]

export default function CenaReuniao({ titulo, passo, children }: {
  titulo: ReactNode; passo: number; children: ReactNode
}) {
  return (
    <main className="nlead rl-app ru rp">
      <style>{CSS_BRIEFING + CSS_MARCAR + CSS}</style>

      <section className="rp-foto">
        <div className="rp-img hero-img" aria-hidden="true" />
        <div className="rp-veu" aria-hidden="true" />
        <div className="rp-intro">
          <img src="/portal-noivos/logo-gold.png" alt="RL Photo.Video" className="rp-logo" />
          <div className="rp-texto">
            <p className="eyebrow sobe">Marcar reunião</p>
            <h1 className="sobe" style={{ animationDelay: '.12s' }}>{titulo}</h1>
            <p className="lead sobe" style={{ animationDelay: '.24s' }}>
              Escolham o dia e a hora que vos dão mais jeito. Conversamos sobre o vosso dia, sem compromisso.
            </p>
            <div className="rp-valores sobe" style={{ animationDelay: '.3s' }}>
              <p>Não enviamos valores por mensagem nem em PDF. Gostamos sempre de falar com os nossos noivos, criar empatia e ganhar confiança mútua.</p>
              <b>Faz-vos sentido marcarmos uma reunião e conversarmos?</b>
            </div>
            <ol className="rp-pilares">
              {PILARES.map(([t, txt], i) => (
                <li key={t} className="sobe" style={{ animationDelay: `${.36 + i * .1}s` }}>
                  <span className="rp-n">0{i + 1}</span>
                  <div><b>{t}</b><p>{txt}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="rp-cena">
        <div className="rp-card sobe" style={{ animationDelay: '.2s' }}>
          <div className="rp-topo">
            <p className="eyebrow">Escolham o momento</p>
            <span className="rp-passo">{passo >= PASSOS.length ? 'Confirmado' : PASSOS[passo]}</span>
          </div>
          <div className="rp-fotogramas" aria-hidden="true">
            {PASSOS.map((p, i) => (
              <span key={p} className={`fotograma${i < passo ? ' feito' : i === passo ? ' agora' : ''}`} />
            ))}
          </div>
          {children}
        </div>
        <div className="rp-assina">
          <p>Photo · Video · Wedding Moments</p>
        </div>
      </section>
    </main>
  )
}

const CSS = `
.rl-app.rp{
  --ink:#070707; --g:#d8be93; --g-deep:#9c7c47;
  --tx:#fff; --tx-mid:rgba(255,255,255,.6); --tx-dim:rgba(255,255,255,.4);
  --line:rgba(216,190,147,.3); --line-soft:rgba(255,255,255,.08);
  --fs:'Jost',sans-serif; --fd:'Roboto Condensed',sans-serif; --fb:'Roboto Condensed',sans-serif;
  --fm:'Roboto Condensed',sans-serif; --fn:'Roboto Condensed',sans-serif;
  min-height:100vh; background:var(--ink); font-family:var(--fb); font-weight:300;
}
.rp .eyebrow{font-size:11px;font-weight:500;letter-spacing:.2em;color:var(--g);}
.rp .eyebrow::before{width:12px;opacity:1;}
.rp .lead{font-weight:300;font-size:clamp(16px,1.25vw,18px);color:var(--tx-mid);margin:18px 0 0;max-width:460px;}

/* ── Foto em cena ── */
.rp-foto{position:relative;min-height:max(440px,58svh);display:flex;overflow:hidden;}
.rp-img{position:absolute;inset:96px 0 0;-webkit-mask-image:linear-gradient(to bottom,transparent,#000 35%);mask-image:linear-gradient(to bottom,transparent,#000 35%);background:url('/prewedding-hero.webp') center 35%/cover;filter:grayscale(1);opacity:.42;}
.rp-veu{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(7,7,7,.2) 0%,rgba(7,7,7,.35) 28%,rgba(7,7,7,.6) 45%,rgba(7,7,7,.82) 70%,#070707 100%);}
.rp-intro{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:space-between;width:100%;padding:28px 20px 30px;box-sizing:border-box;}
.rp-logo{width:96px;opacity:.8;align-self:center;}
.rp-texto{text-align:center;display:flex;flex-direction:column;align-items:center;margin-top:36px;}
.rp h1{font-family:var(--fs);font-weight:200;font-size:clamp(46px,6vw,84px);line-height:1.02;letter-spacing:0;color:#fff;margin:14px 0 0;}
.rp h1 em{font-style:normal;color:var(--g);}
.rp-pilares{display:none;list-style:none;margin:0;padding:0;}
.rp-valores{max-width:460px;margin:22px 0 0;padding:16px 18px;border-radius:18px;border:1px solid rgba(216,190,147,.3);background:rgba(17,17,17,.6);
  backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-sizing:border-box;}
.rp-valores p{margin:0;font-size:15px;line-height:1.6;color:rgba(255,255,255,.75);}
.rp-valores b{display:block;margin-top:10px;font-family:var(--fs);font-weight:300;font-size:20px;line-height:1.3;color:var(--g);}

/* ── Cartão com o calendário ── */
.rp-cena{position:relative;padding:0 16px 40px;}
.rp-card{max-width:520px;margin:-8px auto 0;padding:24px 20px 26px;box-sizing:border-box;border-radius:22px;border:1px solid rgba(216,190,147,.3);
  background:rgba(17,17,17,.8);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:0 0 48px -22px rgba(216,190,147,.5);}
.rp-topo{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.rp-passo{font-size:11px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);}
.rp-fotogramas{display:flex;gap:6px;margin:14px 0 6px;}
.rp .fotograma.feito{background:rgba(216,190,147,.4);}
.rp-assina{text-align:center;margin-top:44px;}
.rp-assina p{margin:0;font-size:9px;letter-spacing:.45em;text-transform:uppercase;color:rgba(216,190,147,.65);}

/* Campo da data do casamento e aviso de reunião já marcada */
.rp-data{display:block;margin:18px 0 0;}
.rp-data span{display:block;font-size:11px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-dim);margin-bottom:6px;}
.rp-data i{font-style:normal;text-transform:none;letter-spacing:.02em;}
.rp .finput{font-family:var(--fn);font-weight:300;font-size:18px;}
.rp-ja{font-size:15px;line-height:1.55;color:var(--g);margin:16px 0 0;padding:12px 14px;border:1px solid rgba(216,190,147,.35);border-radius:14px;background:rgba(216,190,147,.07);}

/* ── Calendário (MarcarReuniao) com as letras da app ── */
.rp .mr-btn{display:none;}
.rp .mr-painel{border:none;border-radius:0;padding:0;background:none;}
.rp .mr-lbl,.rp .mr-lbl:first-child{font-size:11px;font-weight:500;letter-spacing:.2em;color:var(--tx-dim);margin:22px 0 10px;}
.rp .mr-dias{gap:8px;padding-bottom:4px;}
.rp .mr-dias button{width:62px;padding:10px 0 9px;border-radius:14px;border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.02);}
.rp .mr-dias button span{font-family:var(--fn);font-size:10px;font-weight:500;letter-spacing:.14em;}
.rp .mr-dias button b{font-family:var(--fn);font-weight:100;font-size:34px;line-height:1;margin:2px 0;}
.rp .mr-horas button,.rp .mr-formato button{font-family:var(--fn);font-weight:400;font-size:16px;border-radius:999px;border-color:rgba(255,255,255,.14);padding:10px 18px;}
.rp .mr-formato button{font-weight:500;font-size:15px;}
.rp .mr-dias button.on,.rp .mr-horas button.on,.rp .mr-formato button.on{border-color:rgba(216,190,147,.7);background:rgba(216,190,147,.14);color:#fff;}
.rp .mr-dias button.on b{color:var(--g);}
.rp .mr-outro{font-size:11px;font-weight:500;letter-spacing:.16em;margin-top:14px;}
.rp .mr-nota{font-size:14px;}
.rp .mr-in{border-radius:14px;border-color:rgba(255,255,255,.14);background:rgba(0,0,0,.3);font-family:var(--fn);font-size:16px;}
.rp .mr-in:focus{border-color:rgba(216,190,147,.7);}
.rp .mr-opcoes span{border-radius:14px;font-size:15px;}
.rp .mr-resumo{font-family:var(--fs);font-style:normal;font-weight:200;font-size:22px;margin-top:22px;}
.rp .mr-erro{font-size:15px;}
.rp .mr-conf{margin-top:20px;padding:16px;border-radius:999px;font-family:var(--fn);font-weight:600;font-size:13px;letter-spacing:.18em;
  box-shadow:0 10px 34px -14px rgba(216,190,147,.7);transition:transform .3s var(--ease),box-shadow .3s;}
.rp .mr-conf:not(:disabled):hover{transform:translateY(-1px);box-shadow:0 14px 40px -12px rgba(216,190,147,.8);}
.rp .mr-ok{margin-top:18px;border-radius:18px;border-color:rgba(216,190,147,.45);}
.rp .mr-ok-t{font-family:var(--fs);font-weight:200;font-size:46px;}
.rp .mr-ok-t em{font-style:normal;}
.rp .mr-ok-q{font-family:var(--fn);font-weight:300;}
.rp .mr-ok-l{font-weight:500;font-size:12px;letter-spacing:.16em;}

/* ── Desktop: foto à esquerda fixa, cartão à direita ── */
@media (min-width:980px){
  .rl-app.rp{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,1fr);}
  .rp-foto{min-height:100vh;}
  .rp-img{inset:0;-webkit-mask-image:none;mask-image:none;}
  .rp-veu{background:linear-gradient(90deg,rgba(7,7,7,.35) 0%,rgba(7,7,7,.55) 55%,#070707 100%),linear-gradient(to bottom,rgba(7,7,7,.5),transparent 30%,transparent 70%,rgba(7,7,7,.8));}
  .rp-intro{padding:44px 5vw 52px;}
  .rp-logo{align-self:flex-start;width:120px;}
  .rp-texto{text-align:left;align-items:flex-start;margin-top:36px;}
  .rp-pilares{display:flex;flex-direction:column;gap:18px;margin-top:40px;max-width:440px;}
  .rp-pilares li{display:flex;gap:18px;align-items:flex-start;border-top:1px solid rgba(255,255,255,.1);padding-top:16px;}
  .rp-n{font-family:var(--fn);font-weight:100;font-size:38px;line-height:.8;color:var(--g);min-width:46px;}
  .rp-pilares b{display:block;font-family:var(--fs);font-weight:300;font-size:20px;color:#fff;}
  .rp-pilares p{margin:4px 0 0;font-size:15px;line-height:1.5;color:var(--tx-mid);}
  .rp-cena{display:flex;flex-direction:column;justify-content:center;min-height:100vh;padding:56px 4vw 40px;box-sizing:border-box;}
  .rp-card{margin:0 auto;width:100%;padding:30px 30px 32px;}
  .rp-assina{margin-top:36px;}
}
@media (min-width:980px) and (max-height:820px){
  .rp-pilares{gap:12px;margin-top:28px;}
  .rp-pilares p{display:none;}
}
@media (max-width:380px){
  .rp-card{padding:20px 16px 22px;}
  .rp .mr-dias button{width:56px;}
}
`
