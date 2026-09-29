import type { Metadata } from 'next'
import { CSS_BRIEFING } from '@/app/_briefing/estilo'

/* Rollup: página aberta pelo QR code impresso no rollup.
   Só casamentos: abertura em ecrã inteiro e, por baixo, pedir proposta
   (o briefing /nova-lead), WhatsApp, ligar, guardar contacto e o site. */

export const metadata: Metadata = { title: 'RL Photo.Video · Casamentos' }

const TEL = '+351912932768'
const WHATSAPP = `https://wa.me/351912932768?text=${encodeURIComponent('Olá! Vimos o vosso rollup e gostávamos de saber mais sobre fotografia e vídeo para o nosso casamento.')}`

type Contacto = { rotulo: string; valor: string; href: string }

const CONTACTOS: Contacto[] = [
  { rotulo: 'Site', valor: 'rlphotovideo.pt', href: 'https://rlphotovideo.pt' },
  { rotulo: 'Instagram', valor: '@rlphoto_fotografia.video', href: 'https://www.instagram.com/rlphoto_fotografia.video/' },
  { rotulo: 'Email', valor: 'geral.rlphoto@gmail.com', href: 'mailto:geral.rlphoto@gmail.com' },
  { rotulo: 'Contacto', valor: '912 932 768', href: `tel:${TEL}` },
]

const externo = { target: '_blank', rel: 'noopener noreferrer' }

const CSS = `
.ru{overflow-x:hidden;}
/* ── Abertura ── */
.ru .hero{position:relative;height:100svh;min-height:580px;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;text-align:center;padding:0 20px clamp(40px,8vh,72px);}
.ru .hero-img{position:absolute;inset:0;background:url('/newsletter/casamento-03.jpg') center 35%/cover no-repeat;animation:ruKen 16s cubic-bezier(.2,.6,.2,1) both;}
.ru .hero::after{content:"";position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(11,10,8,.35) 0%,rgba(11,10,8,0) 25%,rgba(11,10,8,.4) 48%,rgba(11,10,8,.92) 78%,var(--ink) 100%);}
.ru .hero > *:not(.hero-img){position:relative;z-index:2;}
.ru .mono{position:absolute!important;top:clamp(28px,6vh,56px);left:50%;width:54px;margin-left:-27px;opacity:0;animation:ruFade 1.6s .3s var(--ease) forwards;filter:drop-shadow(0 0 18px rgba(216,190,147,.35));}
.ru .titulo{font-family:var(--fs);font-weight:300;font-size:clamp(58px,17vw,140px);line-height:.9;letter-spacing:-.02em;color:var(--tx);margin:18px 0 0;}
.ru .titulo span{display:inline-block;opacity:0;transform:translateY(.35em);filter:blur(10px);animation:ruLetra 1.3s var(--ease) forwards;}
.ru .titulo em{font-style:italic;color:var(--g);}
.ru .linha{width:64px;height:1px;background:var(--g);margin:26px auto 0;transform:scaleX(0);animation:ruLinha 1.4s 1.9s var(--ease) forwards;}
.ru .frase{font-family:var(--fs);font-style:italic;font-weight:300;font-size:clamp(19px,5vw,24px);color:var(--tx-mid);margin-top:20px;opacity:0;animation:ruSobe 1.4s 2.2s var(--ease) forwards;}
.ru .hero .eyebrow{opacity:0;animation:ruSobe 1.2s .9s var(--ease) forwards;}
.ru .desce{margin-top:clamp(28px,5vh,44px);display:flex;flex-direction:column;align-items:center;gap:12px;text-decoration:none;opacity:0;animation:ruFade 1.2s 2.8s var(--ease) forwards;}
.ru .desce span{font-family:var(--fm);font-size:9.5px;letter-spacing:.34em;text-transform:uppercase;color:var(--tx-dim);}
.ru .desce i{width:1px;height:44px;background:linear-gradient(var(--g),transparent);transform-origin:top;animation:ruGota 2.2s 3s ease-in-out infinite;}

/* ── Corpo ── */
.ru .corpo{max-width:560px;margin:0 auto;padding:clamp(40px,8vh,72px) 20px 40px;}
.ru .intro{font-family:var(--fd);font-weight:300;font-size:clamp(17px,4.4vw,19px);line-height:1.7;color:var(--tx-mid);text-align:center;margin:0 0 clamp(32px,6vh,44px);}
.ru .proposta{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;gap:8px;padding:26px 16px;border-radius:14px;text-decoration:none;
  background:linear-gradient(135deg,#e6d0a6,var(--g) 45%,var(--g-deep));color:var(--ink);box-shadow:0 10px 40px -12px rgba(216,190,147,.55);transition:.4s var(--ease);}
.ru .proposta::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:ruBrilho 4.5s 3.5s ease-in-out infinite;}
.ru .proposta b{font-family:var(--fm);font-weight:400;font-size:11px;letter-spacing:.3em;text-transform:uppercase;}
.ru .proposta small{font-family:var(--fs);font-style:italic;font-size:16px;opacity:.75;}
.ru .acoes{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;}
.ru .btn-g{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:22px 12px;border-radius:14px;text-decoration:none;transition:.4s var(--ease);
  border:1px solid rgba(216,190,147,.5);color:var(--g);background:rgba(216,190,147,.04);}
.ru .btn-g b{font-family:var(--fm);font-weight:400;font-size:10.5px;letter-spacing:.3em;text-transform:uppercase;}
.ru .btn-g svg{width:22px;height:22px;}
.ru .proposta:hover,.ru .btn-g:hover{transform:translateY(-2px);}
.ru .guardar{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px;padding:17px;border:1px dashed var(--line);border-radius:14px;text-decoration:none;
  font-family:var(--fm);font-size:10.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--tx-mid);transition:.4s var(--ease);}
.ru .guardar:hover{border-color:var(--g);color:var(--g);}
.ru .guardar svg{width:16px;height:16px;}

.ru .sec{margin-top:clamp(56px,10vh,84px);}
.ru .sec-t{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:18px;}
.ru .sec-t h2{font-size:clamp(30px,8vw,40px);margin:0;}
.ru .sec-t .hint{white-space:nowrap;}
.ru .row{display:flex;align-items:center;gap:16px;padding:20px 2px;border-top:1px solid var(--line-soft);text-decoration:none;transition:.4s var(--ease);}
.ru .row:last-child{border-bottom:1px solid var(--line-soft);}
.ru .row .n{font-family:var(--fs);font-style:italic;font-size:22px;color:var(--g);width:30px;flex:none;}
.ru .row .t{flex:1;min-width:0;}
.ru .row .r{display:block;font-family:var(--fm);font-size:9.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--tx-dim);}
.ru .row .v{display:block;font-family:var(--fd);font-weight:300;font-size:clamp(16px,4.4vw,19px);color:var(--tx);margin-top:5px;overflow-wrap:anywhere;}
.ru .row .s{color:var(--tx-dim);transition:.4s var(--ease);}
.ru .row:hover{padding-left:10px;}
.ru .row:hover .s,.ru .row:hover .n{color:var(--g);}

.ru .fim{text-align:center;padding:clamp(64px,12vh,110px) 20px 56px;}
.ru .fim p{font-family:var(--fs);font-style:italic;font-weight:300;font-size:clamp(34px,9vw,52px);color:var(--tx);margin:0;}
.ru .fim p em{color:var(--g);}
.ru .fim img{width:34px;margin:26px auto 0;display:block;opacity:.7;}
.ru .fim .hint{margin-top:18px;}

@supports (animation-timeline: view()){
  .ru .rv{animation:ruSobe linear both;animation-timeline:view();animation-range:entry 0% entry 70%;}
}

@keyframes ruKen{from{transform:scale(1.18)}to{transform:scale(1)}}
@keyframes ruFade{to{opacity:1}}
@keyframes ruLetra{to{opacity:1;transform:none;filter:blur(0)}}
@keyframes ruLinha{to{transform:scaleX(1)}}
@keyframes ruSobe{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes ruGota{0%{transform:scaleY(0);opacity:1}60%{transform:scaleY(1);opacity:1}100%{transform:scaleY(1);opacity:0}}
@keyframes ruBrilho{0%{left:-60%}35%,100%{left:130%}}
@media (prefers-reduced-motion:reduce){.ru *,.ru *::before,.ru *::after{animation-duration:.01s!important;animation-delay:0s!important;animation-iteration-count:1!important;}}
`

function Titulo() {
  const letras = ['O', ' ', 'v', 'o', 's', 's', 'o']
  const italico = ['c', 'a', 's', 'a', 'm', 'e', 'n', 't', 'o']
  let i = 0
  const span = (c: string) => <span key={i} style={{ animationDelay: `${1.1 + (i++) * 0.06}s` }}>{c === ' ' ? ' ' : c}</span>
  return (
    <h1 className="titulo" aria-label="O vosso casamento">
      {letras.map(span)}
      <br />
      <em>{italico.map(span)}</em>
    </h1>
  )
}

export default function RollupPage() {
  return (
    <main className="nlead ru" style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      <style>{CSS_BRIEFING + CSS}</style>
      <div className="fx-grain" aria-hidden="true" />

      <section className="hero">
        <div className="hero-img" aria-hidden="true" />
        <img className="mono" src="/portal-noivos/mono-gold.png" alt="RL" />
        <p className="eyebrow">RL Photo &middot; Video &middot; Casamentos</p>
        <Titulo />
        <div className="linha" />
        <p className="frase">Fotografia e filme para o dia mais vosso.</p>
        <a href="#contactos" className="desce"><span>Falem connosco</span><i /></a>
      </section>

      <div className="corpo" id="contactos">
        <p className="intro rv">Contem-nos como imaginam o vosso dia. Respondemos com uma proposta feita à vossa medida.</p>

        <a href="/nova-lead" className="proposta rv">
          <b>Pedir proposta</b>
          <small>Leva só alguns minutos</small>
        </a>
        <div className="acoes rv">
          <a href={WHATSAPP} className="btn-g" {...externo}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3.5 20.5l1.3-4.3A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4.2-1.1z" /><path d="M9 8.5c0 3.5 2.5 6.5 6.5 6.5l1-1.5-2-1-1 1c-1.2-.5-2.5-1.8-3-3l1-1-1-2z" /></svg>
            <b>WhatsApp</b>
          </a>
          <a href={`tel:${TEL}`} className="btn-g">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" /></svg>
            <b>Ligar</b>
          </a>
        </div>
        <a href="/boas-vindas/rl.vcf" className="guardar rv">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" /></svg>
          Guardar contacto
        </a>

        <section className="sec">
          <div className="sec-t rv"><h2>Visite-<em>nos</em></h2><span className="hint">RL Photo.Video</span></div>
          <nav>
            {CONTACTOS.map((c, i) => (
              <a key={c.href} href={c.href} className="row rv" {...(c.href.startsWith('http') ? externo : {})}>
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <span className="t"><span className="r">{c.rotulo}</span><span className="v">{c.valor}</span></span>
                <span className="s" aria-hidden="true">↗</span>
              </a>
            ))}
          </nav>
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
