import type { Metadata } from 'next'
import { CSS_BRIEFING } from '@/app/_briefing/estilo'

/* Boas-vindas: página aberta pelo QR code impresso.
   Abertura em ecrã inteiro (foto + monograma + título letra a letra) e,
   por baixo, ligar, WhatsApp, guardar contacto e as duas marcas, cada uma
   com o seu site e os seus contactos. */

export const metadata: Metadata = { title: 'RL Photo.Video · Bem-vindos' }

const TEL = '+351912932768'
const WHATSAPP = 'https://wa.me/351912932768'

type Contacto = { rotulo: string; valor: string; href: string }
type Marca = { nome: string; sub: string; site: string; href: string; logo: string; contactos: Contacto[] }

const TELEFONE: Contacto = { rotulo: 'Contacto', valor: '912 932 768', href: `tel:${TEL}` }

const MARCAS: Marca[] = [
  {
    nome: 'RL Photo.Video', sub: 'Fotografia · Vídeo', site: 'rlphotovideo.pt', href: 'https://rlphotovideo.pt', logo: '/portal-noivos/logo-gold.png',
    contactos: [
      TELEFONE,
      { rotulo: 'Email', valor: 'geral@rlphotovideo.pt', href: 'mailto:geral@rlphotovideo.pt' },
      { rotulo: 'Instagram', valor: '@rlphoto_fotografia.video', href: 'https://www.instagram.com/rlphoto_fotografia.video/' },
    ],
  },
  {
    nome: 'RL Prod', sub: 'Produção audiovisual', site: 'rlprod.pt', href: 'https://rlprod.pt', logo: '/logo-rl-prod-branco.png',
    contactos: [
      TELEFONE,
      { rotulo: 'Email', valor: 'geral.rlmedia@gmail.com', href: 'mailto:geral.rlmedia@gmail.com' },
      { rotulo: 'Instagram', valor: '@rl_prod_audiovisual', href: 'https://www.instagram.com/rl_prod_audiovisual/' },
    ],
  },
]

const externo = { target: '_blank', rel: 'noopener noreferrer' }

const CSS = `
.bv{overflow-x:hidden;}
/* ── Abertura ── */
.bv .hero{position:relative;height:100svh;min-height:580px;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;text-align:center;padding:0 20px clamp(40px,8vh,72px);}
.bv .hero-img{position:absolute;inset:0;background:url('/boas-vindas-camera.webp') 40% center/cover no-repeat;transform-origin:40% 50%;animation:bvKen 16s cubic-bezier(.2,.6,.2,1) both;}
@media (max-width:700px){.bv .hero-img{background-image:url('/boas-vindas-camera-m.webp');background-position:center;top:-26%;bottom:auto;height:126%;}}
.bv .hero::after{content:"";position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(11,10,8,.35) 0%,rgba(11,10,8,0) 25%,rgba(11,10,8,.1) 52%,rgba(11,10,8,.9) 80%,var(--ink) 100%);}
.bv .hero > *:not(.hero-img){position:relative;z-index:2;}
.bv .mono{position:absolute!important;top:clamp(28px,6vh,56px);left:50%;width:54px;margin-left:-27px;opacity:0;animation:bvFade 1.6s .3s var(--ease) forwards;filter:drop-shadow(0 0 18px rgba(216,190,147,.35));}
.bv .titulo{font-family:var(--fs);font-weight:300;font-size:clamp(64px,19vw,150px);line-height:.9;letter-spacing:-.02em;color:var(--tx);margin:18px 0 0;}
.bv .titulo span{display:inline-block;opacity:0;transform:translateY(.35em);filter:blur(10px);animation:bvLetra 1.3s var(--ease) forwards;}
.bv .titulo em{font-style:italic;color:var(--g);}
.bv .linha{width:64px;height:1px;background:var(--g);margin:26px auto 0;transform:scaleX(0);animation:bvLinha 1.4s 1.9s var(--ease) forwards;}
.bv .frase{font-family:var(--fs);font-style:italic;font-weight:300;font-size:clamp(19px,5vw,24px);color:var(--tx-mid);margin-top:20px;opacity:0;animation:bvSobe 1.4s 2.2s var(--ease) forwards;}
.bv .hero .eyebrow{opacity:0;animation:bvSobe 1.2s .9s var(--ease) forwards;}
.bv .desce{margin-top:clamp(28px,5vh,44px);display:flex;flex-direction:column;align-items:center;gap:12px;text-decoration:none;opacity:0;animation:bvFade 1.2s 2.8s var(--ease) forwards;}
.bv .desce span{font-family:var(--fm);font-size:9.5px;letter-spacing:.34em;text-transform:uppercase;color:var(--tx-dim);}
.bv .desce i{width:1px;height:44px;background:linear-gradient(var(--g),transparent);transform-origin:top;animation:bvGota 2.2s 3s ease-in-out infinite;}

/* ── Corpo ── */
.bv .corpo{max-width:560px;margin:0 auto;padding:clamp(40px,8vh,72px) 20px 40px;}
.bv .acoes{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.bv .btn-g{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px 12px;border-radius:14px;text-decoration:none;transition:.4s var(--ease);}
.bv .btn-g b{font-family:var(--fm);font-weight:400;font-size:10.5px;letter-spacing:.3em;text-transform:uppercase;}
.bv .btn-g svg{width:22px;height:22px;}
.bv .btn-g.ouro{background:linear-gradient(135deg,#e6d0a6,var(--g) 45%,var(--g-deep));color:var(--ink);box-shadow:0 10px 40px -12px rgba(216,190,147,.55);}
.bv .btn-g.ouro::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:bvBrilho 4.5s 3.5s ease-in-out infinite;}
.bv .btn-g.contorno{border:1px solid rgba(216,190,147,.5);color:var(--g);background:rgba(216,190,147,.04);}
.bv .btn-g:hover{transform:translateY(-2px);}
.bv .guardar{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px;padding:17px;border:1px dashed var(--line);border-radius:14px;text-decoration:none;
  font-family:var(--fm);font-size:10.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--tx-mid);transition:.4s var(--ease);}
.bv .guardar:hover{border-color:var(--g);color:var(--g);}
.bv .guardar svg{width:16px;height:16px;}

.bv .sec{margin-top:clamp(56px,10vh,84px);}
.bv .sec-t{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:18px;}
.bv .sec-t h2{font-size:clamp(30px,8vw,40px);margin:0;}
.bv .sec-t .hint{white-space:nowrap;}
.bv .row{display:flex;align-items:center;gap:16px;padding:20px 2px;border-top:1px solid var(--line-soft);text-decoration:none;transition:.4s var(--ease);}
.bv .row:last-child{border-bottom:1px solid var(--line-soft);}
.bv .row .n{font-family:var(--fs);font-style:italic;font-size:22px;color:var(--g);width:30px;flex:none;}
.bv .row .t{flex:1;min-width:0;}
.bv .row .r{display:block;font-family:var(--fm);font-size:9.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--tx-dim);}
.bv .row .v{display:block;font-family:var(--fd);font-weight:300;font-size:clamp(16px,4.4vw,19px);color:var(--tx);margin-top:5px;overflow-wrap:anywhere;}
.bv .row .s{color:var(--tx-dim);transition:.4s var(--ease);}
.bv .row:hover{padding-left:10px;}
.bv .row:hover .s,.bv .row:hover .n{color:var(--g);}
.bv .row:hover .s{transform:translate(3px,-3px);}

.bv .marcas{display:grid;gap:clamp(40px,7vh,56px);}
.bv .marca-ct{margin-top:6px;padding:0 4px;}
.bv .marca-ct .row:first-child{border-top:none;}
.bv .marca{position:relative;display:flex;align-items:center;gap:20px;padding:22px;border-radius:16px;text-decoration:none;overflow:hidden;
  background:radial-gradient(120% 140% at 0% 0%,rgba(216,190,147,.10),transparent 55%),var(--ink-2);border:1px solid var(--line-soft);transition:.5s var(--ease);}
.bv .marca::before{content:"";position:absolute;inset:-1px;border-radius:16px;padding:1px;background:linear-gradient(120deg,transparent 30%,var(--g),transparent 70%);background-size:250% 100%;
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:.55;animation:bvBorda 6s linear infinite;}
.bv .marca:hover{transform:translateY(-3px);box-shadow:0 20px 50px -20px rgba(216,190,147,.35);}
.bv .marca .lg{width:76px;height:76px;flex:none;display:grid;place-items:center;border-radius:12px;background:rgba(0,0,0,.35);}
.bv .marca .lg img{max-width:58px;max-height:58px;object-fit:contain;}
.bv .marca .nm{font-family:var(--fs);font-weight:300;font-size:26px;color:var(--tx);line-height:1.1;}
.bv .marca .sb{font-family:var(--fm);font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--tx-dim);margin-top:6px;}
.bv .marca .st{font-family:var(--fd);font-weight:300;font-size:15px;color:var(--g);margin-top:10px;}

.bv .fim{text-align:center;padding:clamp(64px,12vh,110px) 20px 56px;}
.bv .fim p{font-family:var(--fs);font-style:italic;font-weight:300;font-size:clamp(34px,9vw,52px);color:var(--tx);margin:0;}
.bv .fim p em{color:var(--g);}
.bv .fim img{width:34px;margin:26px auto 0;display:block;opacity:.7;}
.bv .fim .hint{margin-top:18px;}

/* Aparecer ao fazer scroll (onde o browser suporta) */
@supports (animation-timeline: view()){
  .bv .rv{animation:bvSobe linear both;animation-timeline:view();animation-range:entry 0% entry 70%;}
}

@keyframes bvKen{from{transform:scale(1.18)}to{transform:scale(1)}}
@keyframes bvFade{to{opacity:1}}
@keyframes bvLetra{to{opacity:1;transform:none;filter:blur(0)}}
@keyframes bvLinha{to{transform:scaleX(1)}}
@keyframes bvSobe{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes bvGota{0%{transform:scaleY(0);opacity:1}60%{transform:scaleY(1);opacity:1}100%{transform:scaleY(1);opacity:0}}
@keyframes bvBrilho{0%{left:-60%}35%,100%{left:130%}}
@keyframes bvBorda{from{background-position:250% 0}to{background-position:-250% 0}}
@media (prefers-reduced-motion:reduce){.bv *,.bv *::before,.bv *::after{animation-duration:.01s!important;animation-delay:0s!important;animation-iteration-count:1!important;}}
`

const Seta = () => <span className="s" aria-hidden="true">↗</span>

function Titulo() {
  const letras = ['B', 'e', 'm', '-']
  const italico = ['v', 'i', 'n', 'd', 'o', 's']
  let i = 0
  const span = (c: string) => <span key={i} style={{ animationDelay: `${1.1 + (i++) * 0.07}s` }}>{c}</span>
  return (
    <h1 className="titulo" aria-label="Bem-vindos">
      {letras.map(span)}
      <em>{italico.map(span)}</em>
    </h1>
  )
}

export default function BoasVindasPage() {
  return (
    <main className="nlead bv" style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      <style>{CSS_BRIEFING + CSS}</style>
      <div className="fx-grain" aria-hidden="true" />

      <section className="hero">
        <div className="hero-img" aria-hidden="true" />
        <img className="mono" src="/portal-noivos/mono-gold.png" alt="RL" />
        <p className="eyebrow">RL Photo &middot; Video</p>
        <Titulo />
        <div className="linha" />
        <p className="frase">Que bom ter-vos por aqui.</p>
        <a href="#contactos" className="desce"><span>Os nossos contactos</span><i /></a>
      </section>

      <div className="corpo" id="contactos">
        <div className="acoes rv">
          <a href={`tel:${TEL}`} className="btn-g ouro">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" /></svg>
            <b>Ligar</b>
          </a>
          <a href={WHATSAPP} className="btn-g contorno" {...externo}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3.5 20.5l1.3-4.3A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4.2-1.1z" /><path d="M9 8.5c0 3.5 2.5 6.5 6.5 6.5l1-1.5-2-1-1 1c-1.2-.5-2.5-1.8-3-3l1-1-1-2z" /></svg>
            <b>WhatsApp</b>
          </a>
        </div>
        <a href="/boas-vindas/rl.vcf" className="guardar rv">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" /></svg>
          Guardar contacto
        </a>

        <section className="sec">
          <div className="sec-t rv"><h2>As nossas <em>marcas</em></h2><span className="hint">Visitem-nos</span></div>
          <div className="marcas">
            {MARCAS.map(m => (
              <div key={m.href}>
                <a href={m.href} className="marca rv" {...externo}>
                  <span className="lg"><img src={m.logo} alt="" /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="nm" style={{ display: 'block' }}>{m.nome}</span>
                    <span className="sb" style={{ display: 'block' }}>{m.sub}</span>
                    <span className="st" style={{ display: 'block' }}>{m.site} ↗</span>
                  </span>
                </a>
                <nav className="marca-ct">
                  {m.contactos.map((c, i) => (
                    <a key={c.href} href={c.href} className="row rv" {...(c.href.startsWith('http') ? externo : {})}>
                      <span className="n">{String(i + 1).padStart(2, '0')}</span>
                      <span className="t"><span className="r">{c.rotulo}</span><span className="v">{c.valor}</span></span>
                      <Seta />
                    </a>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="fim rv">
        <p>Até <em>já.</em></p>
        <img src="/portal-noivos/mono-gold.png" alt="" />
        <div className="hint">RL Photo &middot; Video &middot; Wedding Moments</div>
      </footer>
    </main>
  )
}
