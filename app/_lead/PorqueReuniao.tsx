'use client'

import { useState } from 'react'

/* "Uma conversa, não uma proposta": 4 painéis dos portais da reunião (/r casamento,
   /b batizado) que abrem ao passar o rato (ou ao tocar, no telemóvel), como as
   temporadas em /casamentos. Explica que a reunião não serve para apresentar valores
   (para isso bastava um PDF) e sim para nos conhecermos e ganharmos empatia. */

type Tipo = 'casamento' | 'batizado'
type Painel = { n: string; curto: string; titulo: string; em: string; texto: string; img: string; pos: string }

const PAINEIS: Record<Tipo, Painel[]> = {
  casamento: [
    { n: '01', curto: 'Sem tabelas', titulo: 'Não vos vamos mostrar', em: 'uma tabela de preços', img: '/newsletter/casamento-01.jpg', pos: 'center',
      texto: 'Se esta reunião fosse para apresentar valores, enviávamos um PDF, como muitos fazem. Não é isso que queremos convosco.' },
    { n: '02', curto: 'Conhecer-vos', titulo: 'Queremos', em: 'conhecer-vos', img: '/newsletter/casamento-04.jpg', pos: '60% center',
      texto: 'Como se conheceram, o que vos faz rir, quem não pode faltar no vosso dia. É isso que depois se vê em cada fotografia e em cada plano do filme.' },
    { n: '03', curto: 'Conhecer-nos', titulo: 'E que nos', em: 'conheçam a nós', img: '/newsletter/casamento-10.jpg', pos: 'center',
      texto: 'Quem somos, como trabalhamos e como é estar connosco. No grande dia vamos estar ao vosso lado do primeiro ao último minuto.' },
    { n: '04', curto: 'Empatia', titulo: 'Empatia', em: 'antes de tudo', img: '/newsletter/casamento-13.jpg', pos: '40% center',
      texto: 'Um casamento bem contado começa com confiança. Se no fim desta conversa houver empatia entre nós, tudo o resto flui naturalmente.' },
  ],
  batizado: [
    { n: '01', curto: 'Sem tabelas', titulo: 'Não vos vamos mostrar', em: 'uma tabela de preços', img: '/batizado-hero.webp', pos: '10% 20%',
      texto: 'Se esta reunião fosse para apresentar valores, enviávamos um PDF, como muitos fazem. Não é isso que queremos convosco.' },
    { n: '02', curto: 'Conhecer-vos', titulo: 'Queremos conhecer', em: 'a vossa família', img: '/batizado-hero.webp', pos: '55% 45%',
      texto: 'A história da vossa família, o bebé, os padrinhos, os avós. É isso que depois se vê em cada fotografia e em cada plano do filme.' },
    { n: '03', curto: 'Conhecer-nos', titulo: 'E que nos', em: 'conheçam a nós', img: '/batizado-hero.webp', pos: '70% 75%',
      texto: 'Quem somos, como trabalhamos e como é estar connosco. Num dia tão especial para a família, vamos estar ao vosso lado do início ao fim.' },
    { n: '04', curto: 'Empatia', titulo: 'Empatia', em: 'antes de tudo', img: '/batizado-hero.webp', pos: '50% 35%',
      texto: 'Um batizado bem contado começa com confiança. Se no fim desta conversa houver empatia entre nós, tudo o resto flui naturalmente.' },
  ],
}

export default function PorqueReuniao({ tipo }: { tipo: Tipo }) {
  const [aberto, setAberto] = useState(0)
  const paineis = PAINEIS[tipo]

  return (
    <section id="sec-conversa" className="rlp-sec" style={{ paddingLeft: 'var(--pad)', paddingRight: 'var(--pad)', borderTop: '1px solid var(--line-soft)' }}>
      <style>{CSS}</style>
      <div className="pr">
        <div className="pr-cab">
          <span className="rlp-eyebrow c">Antes da reunião</span>
          <h2 className="rlp-h2" style={{ marginTop: 16, textAlign: 'center' }}>Uma conversa, <em>não uma proposta</em></h2>
          <p className="pr-dica"><span className="pr-rato">Passem o rato para abrir</span><span className="pr-dedo">Toquem para abrir</span></p>
        </div>

        <div className="pr-acordeao">
          {paineis.map((p, i) => {
            const ativo = aberto === i
            return (
              <button key={p.n} type="button" className={`pr-painel${ativo ? ' on' : ''}`}
                onMouseEnter={() => setAberto(i)} onFocus={() => setAberto(i)} onClick={() => setAberto(i)}
                aria-expanded={ativo}>
                <span className="pr-img" style={{ backgroundImage: `url(${p.img})`, backgroundPosition: p.pos }} />
                <span className="pr-veu" />

                {/* Fechado: número e título curto (na vertical no computador) */}
                <span className="pr-fechado">
                  <span className="pr-n">{p.n}</span>
                  <span className="pr-curto">{p.curto}</span>
                </span>

                {/* Aberto */}
                <span className="pr-aberto">
                  <span className="pr-n">{p.n}</span>
                  <span className="pr-t">{p.titulo} <em>{p.em}</em></span>
                  <span className="pr-linha" />
                  <span className="pr-txt">{p.texto}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

const CSS = `
.pr{max-width:1080px;margin:0 auto;}
.pr-cab{display:flex;flex-direction:column;align-items:center;margin-bottom:34px;}
.pr-dica{margin-top:14px;font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.3em;text-transform:uppercase;color:var(--tx-dim);}
.pr-dedo{display:none;}
.pr-acordeao{display:flex;gap:12px;height:460px;}
.pr-painel{position:relative;flex:1 1 0%;min-width:0;overflow:hidden;border-radius:22px;border:1px solid rgba(255,255,255,.08);background:#0b0a08;padding:0;cursor:pointer;text-align:left;color:inherit;font:inherit;
  transition:flex .55s cubic-bezier(.2,.7,.2,1),border-color .4s ease;}
.pr-painel.on{flex:4 1 0%;border-color:rgba(216,190,147,.45);cursor:default;}
.pr-img{position:absolute;inset:0;background-size:cover;filter:grayscale(.55) brightness(.6);transform:scale(1);transition:filter .55s ease,transform .9s ease;}
.pr-painel.on .pr-img{filter:saturate(1.02) brightness(.9);transform:scale(1.03);}
.pr-veu{position:absolute;inset:0;background:linear-gradient(to top,rgba(6,5,4,.9),rgba(6,5,4,.55));transition:background .5s ease;}
.pr-painel.on .pr-veu{background:linear-gradient(to top,rgba(6,5,4,.95) 18%,rgba(6,5,4,.55) 60%,rgba(6,5,4,.2) 100%);}
.pr-fechado{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;transition:opacity .3s ease;}
.pr-fechado .pr-curto{writing-mode:vertical-rl;transform:rotate(180deg);font-family:'Cormorant Garamond',serif;font-size:30px;letter-spacing:.12em;color:rgba(243,237,226,.85);white-space:nowrap;}
.pr-painel.on .pr-fechado{opacity:0;}
.pr-n{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.2em;color:var(--g);}
.pr-aberto{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:34px;opacity:0;transition:opacity .4s ease .1s;pointer-events:none;}
.pr-painel.on .pr-aberto{opacity:1;}
.pr-t{display:block;margin-top:12px;font-family:'Cormorant Garamond',serif;font-weight:300;font-size:clamp(32px,3.4vw,46px);line-height:1.05;color:#f3ede2;max-width:16ch;}
.pr-t em{font-style:italic;color:var(--g);white-space:nowrap;}
.pr-linha{display:block;width:56px;height:1px;background:var(--g);opacity:.7;margin:20px 0;}
.pr-txt{display:block;font-size:16px;line-height:1.7;color:rgba(243,237,226,.78);max-width:44ch;}

/* Telemóvel: painéis empilhados, o tocado abre para baixo */
@media (max-width:700px){
  .pr-rato{display:none;} .pr-dedo{display:inline;}
  .pr-acordeao{flex-direction:column;height:auto;gap:10px;}
  .pr-painel{flex:none;height:78px;border-radius:18px;transition:height .55s cubic-bezier(.2,.7,.2,1),border-color .4s ease;}
  .pr-painel.on{flex:none;height:380px;}
  .pr-fechado{flex-direction:row;justify-content:flex-start;padding:0 24px;gap:18px;}
  .pr-fechado .pr-curto{writing-mode:horizontal-tb;transform:none;font-size:24px;letter-spacing:.06em;}
  .pr-aberto{padding:26px 24px;}
  .pr-txt{font-size:15px;}
}
@media (prefers-reduced-motion:reduce){.pr-painel,.pr-img,.pr-aberto,.pr-fechado{transition:none!important;}}
`
