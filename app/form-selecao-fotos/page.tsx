'use client'

import { useEffect, useRef, useState } from 'react'

// Página do cliente — "Seleção de Fotografias".
// Mesmo sistema visual das páginas públicas (ver /adquirir-fotografias):
// fundo escuro, grão + vinheta, Jost/Hanken/Space Mono, dourado.

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,200;0,300;0,400;1,200;1,300&family=Hanken+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
.self{
  --ink:#0b0a08; --ink-2:#100e0b;
  --g:#d8be93;
  --tx:rgba(243,237,226,.92); --tx-mid:rgba(243,237,226,.6); --tx-dim:rgba(243,237,226,.4);
  --line:rgba(243,237,226,.14); --line-soft:rgba(243,237,226,.08);
  --fd:'Jost',sans-serif; --fb:'Hanken Grotesk',sans-serif; --fm:'Space Mono',monospace;
  --ease:cubic-bezier(.16,1,.3,1); --pad:clamp(20px,5vw,80px);
}
.self *{margin:0;padding:0;box-sizing:border-box;}
.self{background:var(--ink);color:var(--tx);font-family:var(--fb);line-height:1.5;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column;-webkit-font-smoothing:antialiased;}
.self a{color:inherit;text-decoration:none;}
.self ::selection{background:var(--g);color:var(--ink);}

.self .fx-grain{position:fixed;inset:0;z-index:9000;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");background-size:130px;}
.self .fx-vig{position:fixed;inset:0;z-index:8990;pointer-events:none;box-shadow:inset 0 0 240px 40px rgba(0,0,0,.5);}

.self .back{position:absolute;top:clamp(20px,4vh,34px);left:var(--pad);z-index:20;font-family:var(--fm);font-size:10px;letter-spacing:.35em;text-transform:uppercase;color:var(--tx-dim);transition:color .4s var(--ease);}
.self .back:hover{color:var(--g);}

.self .eyebrow{font-family:var(--fm);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--g);display:inline-flex;gap:.8em;align-items:center;}
.self .eyebrow::before{content:"";width:34px;height:1px;background:var(--g);opacity:.6;}
.self .wrap{width:100%;max-width:900px;margin:0 auto;padding-inline:var(--pad);text-align:center;}
.self h1,.self h2{font-family:var(--fd);font-weight:200;line-height:1.04;letter-spacing:-.02em;}

.self .phero{padding:clamp(90px,15vh,160px) var(--pad) clamp(30px,5vh,50px);text-align:center;}
.self .phero h1{font-size:clamp(38px,6.4vw,88px);}
.self .phero h1 em{font-style:italic;color:var(--g);}
.self .phero__sub{color:var(--tx-mid);max-width:56ch;margin:24px auto 0;line-height:1.7;font-size:clamp(15px,1.15vw,18px);}
.self .phero__sub strong{color:var(--g);font-weight:400;}

.self .info{display:grid;grid-template-columns:1fr;gap:16px;margin:clamp(30px,5vh,50px) 0 0;}
@media(min-width:720px){.self .info{grid-template-columns:repeat(2,1fr);}}
.self .icard{border:1px solid var(--line-soft);border-radius:10px;padding:30px 24px;background:var(--ink-2);text-align:center;}
.self .icard .ic{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);}
.self .icard .iv{font-family:var(--fd);font-weight:200;font-size:clamp(28px,3vw,40px);margin:14px 0 8px;line-height:1;}
.self .icard .id{color:var(--tx-mid);font-size:13.5px;line-height:1.6;max-width:34ch;margin:0 auto;}

.self .block{margin:clamp(50px,8vh,90px) 0 clamp(70px,10vh,120px);}
.self .block > .lbl{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);display:block;margin-bottom:20px;text-align:center;}
.self .seg{display:grid;grid-template-columns:1fr;gap:12px;}
@media(min-width:620px){.self .seg{grid-template-columns:1fr 1fr;}}
.self .seg button{display:block;width:100%;text-align:center;cursor:pointer;border:1px solid var(--line-soft);border-radius:10px;padding:30px 28px;background:transparent;transition:border-color .4s var(--ease),background-color .4s var(--ease);}
.self .seg button:hover{border-color:var(--line);}
.self .seg button .t{font-family:var(--fd);font-weight:300;font-size:24px;color:var(--tx);display:block;transition:color .4s var(--ease);}
.self .seg button .d{font-family:var(--fm);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);margin-top:10px;display:block;}
.self .seg button.on{border-color:var(--g);background:rgba(216,190,147,.06);}
.self .seg button.on .t{color:var(--g);}
.self .chosen{font-family:var(--fm);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-mid);margin-top:22px;text-align:center;}
.self .chosen b{color:var(--g);font-weight:400;}

.self .r{opacity:0;transform:translateY(26px);transition:opacity 1s var(--ease),transform 1s var(--ease);}
.self .r.in{opacity:1;transform:none;}
@media(prefers-reduced-motion:reduce){.self .r{opacity:1;transform:none;}}

.self .foot{margin-top:auto;background:var(--ink-2);border-top:1px solid var(--line-soft);padding:clamp(40px,6vh,70px) 0;text-align:center;}
.self .foot .fm{font-family:var(--fm);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);}
.self .foot a{color:var(--g);}
`

type Tipo = 'casamento' | 'batizado'

const OPCOES: { key: Tipo; titulo: string; desc: string }[] = [
  { key: 'casamento', titulo: 'Casamento', desc: 'Seleção das fotografias do casamento' },
  { key: 'batizado',  titulo: 'Batizado',  desc: 'Seleção das fotografias do batizado' },
]

export default function FormSelecaoFotosPage() {
  const [tipo, setTipo] = useState<Tipo | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { (e.target as HTMLElement).classList.add('in'); io.unobserve(e.target) }
      })
    }, { threshold: .12 })
    document.querySelectorAll('.self .r').forEach(el => {
      if (reduce) el.classList.add('in'); else io.observe(el)
    })
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="self">
        <div className="fx-grain" />
        <div className="fx-vig" />

        <section className="phero">
          <div className="r"><span className="eyebrow" style={{ justifyContent: 'center' }}>Seleção de Fotografias</span></div>
          <h1 className="r" style={{ marginTop: 22 }}>Escolham as vossas <em>fotografias.</em></h1>
          <p className="phero__sub r">
            Chegou o momento de escolher as vossas fotografias para as editarmos e entregarmos em alta
            qualidade. Prevemos entregar a seleção em <strong>30 dias úteis</strong> após o vosso envio.
          </p>
        </section>

        <div className="wrap">
          <div className="info">
            <div className="icard r">
              <div className="ic">Edição</div>
              <div className="iv">Alta qualidade</div>
              <div className="id">Cada fotografia escolhida é editada individualmente pela nossa equipa.</div>
            </div>
            <div className="icard r">
              <div className="ic">Entrega</div>
              <div className="iv">30 dias úteis</div>
              <div className="id">Contados a partir do dia em que nos enviam a vossa seleção.</div>
            </div>
          </div>
        </div>

        <section className="wrap block r">
          <span className="lbl">Escolham o vosso evento</span>
          <div className="seg">
            {OPCOES.map(op => (
              <button key={op.key} type="button" onClick={() => setTipo(op.key)}
                className={tipo === op.key ? 'on' : ''}>
                <span className="t">{op.titulo}</span>
                <span className="d">{op.desc}</span>
              </button>
            ))}
          </div>
          {tipo && (
            <p className="chosen">Selecionado: <b>{tipo === 'casamento' ? 'Casamento' : 'Batizado'}</b></p>
          )}
        </section>

        <footer className="foot">
          <div className="fm">RL Photo.Video &nbsp;·&nbsp; <a href="mailto:geral.rlphoto@gmail.com">geral.rlphoto@gmail.com</a> &nbsp;·&nbsp; 912 832 788</div>
        </footer>
      </div>
    </>
  )
}
