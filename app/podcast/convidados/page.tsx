import Link from 'next/link'
import type { Metadata } from 'next'
import { PROGRAMA, BASE_URL } from '@/lib/podcast/programa'
import FormularioCandidatura from './FormularioCandidatura'
import Envolvente from '../Envolvente'
import Revelar from './Revelar'

/* ============================================================
   /podcast/convidados — candidatura a convidado.
   Página estática: não lê a base de dados. O formulário grava em
   podcast_candidaturas pela /api/podcast/candidatura.
   Look do Antes do Sim: fundo quase preto, dourado #d8be93,
   Cormorant + Jost + Space Mono, fotos a preto e branco com degradê.
   ============================================================ */

export const metadata: Metadata = {
  title: 'Ser convidado',
  description:
    'O que é o Antes do Sim, quem ouve, o que implica ser convidado e o que recebe. Candidaturas abertas a profissionais de casamentos.',
  alternates: { canonical: `${BASE_URL}/podcast/convidados` },
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    title: `Ser convidado · ${PROGRAMA.nome}`,
    description: 'Candidaturas abertas a profissionais de casamentos.',
    url: `${BASE_URL}/podcast/convidados`,
  },
}

const IMPLICA = [
  { t: '45 minutos de conversa', d: 'Gravada de uma vez, em vídeo e com som de estúdio.' },
  { t: 'Meia hora de preparação', d: 'Sem guião decorado: falamos do que faz todos os dias.' },
  { t: 'Respostas francas', d: 'Incluindo sobre preços e erros comuns. É isso que os noivos procuram.' },
  { t: 'Autorização de publicação', d: 'Para publicarmos a gravação e os excertos nas nossas redes.' },
]

export default function ConvidadosPage() {
  return (
    <Envolvente>
      <Revelar />
      <div className="cv">

        {/* ── Herói ─────────────────────────────────────── */}
        <header className="cv-heroi">
          <div className="cv-heroi-foto" aria-hidden="true">
            <img src="/podcast/convidados/heroi.webp" alt="" />
          </div>
          <div className="cv-topo">
            <a className="cv-voltar" href="/podcast/apresentacao"><span aria-hidden="true">‹</span> Voltar à apresentação</a>
            <a className="cv-topo-cta" href="#candidatura">Candidatar-me</a>
          </div>
          <div className="cv-heroi-corpo">
            <p className="cv-eyebrow">Antes do Sim · Para profissionais</p>
            <h1 className="cv-titulo">Ser <em>convidado</em></h1>
            <p className="cv-heroi-lede">
              O Antes do Sim é uma conversa por mês com quem faz casamentos por dentro. Se trabalha
              no setor e tem alguma coisa útil para dizer a quem está a planear, queremos falar consigo.
            </p>
            <div className="cv-chips">
              <span>≈ 45 minutos</span><span>Gravado em vídeo</span><span>Sem custos</span>
            </div>
            <div className="cv-acoes">
              <a className="cv-btn cv-btn-ouro" href="#candidatura">Candidatar-me <span aria-hidden="true">→</span></a>
              <a className="cv-btn cv-btn-linha" href="#programa">Saber mais</a>
            </div>
          </div>
        </header>

        {/* ── O programa ────────────────────────────────── */}
        <section className="cv-sec" id="programa">
          <div className="cv-wrap cv-duas">
            <div>
              <p className="cv-eyebrow" data-r>O programa <b>/ 01</b></p>
              <h2 className="cv-h2" data-r>Uma conversa por mês, <em>para quem está a planear.</em></h2>
            </div>
            <div className="cv-texto" data-r>
              <p>{PROGRAMA.descricao}</p>
              <p>São doze episódios por ano, um por mês, publicados na primeira terça-feira. Cada episódio dura cerca de 45 minutos e sai em áudio e em vídeo.</p>
            </div>
          </div>
          <div className="cv-wrap">
            <div className="cv-numeros">
              <div data-r><strong>12</strong><small>Episódios por ano</small></div>
              <div data-r><strong>45</strong><small>Minutos de conversa</small></div>
              <div data-r><strong>1.ª</strong><small>Terça de cada mês</small></div>
            </div>
          </div>
        </section>

        {/* ── Quem ouve ─────────────────────────────────── */}
        <section className="cv-sec cv-escuro">
          <div className="cv-wrap cv-quem">
            <figure className="cv-quem-foto" data-r>
              <img src="/podcast/convidados/quem-ouve.webp" alt="Convidados sentados numa cerimónia ao ar livre" loading="lazy" />
            </figure>
            <div>
              <p className="cv-eyebrow" data-r>Quem ouve <b>/ 02</b></p>
              <h2 className="cv-h2" data-r>Casais a decidir <em>o seu dia.</em></h2>
              <div className="cv-texto" data-r>
                <p>Casais em fase de planeamento, na sua maioria a casar na Margem Sul, em Setúbal, Palmela e arredores. Chegam pelo Instagram e pela pesquisa, quase sempre no telemóvel, e ouvem enquanto conduzem ou tratam da casa.</p>
                <p>Não é um público de profissionais. É gente a decidir onde gastar o dinheiro do casamento, o que torna as respostas concretas muito mais valiosas do que as vagas.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── O que implica ─────────────────────────────── */}
        <section className="cv-sec">
          <div className="cv-wrap">
            <p className="cv-eyebrow" data-r>O que implica <b>/ 03</b></p>
            <h2 className="cv-h2" data-r>Da sua parte, <em>só a conversa.</em></h2>
            <div className="cv-cartoes">
              {IMPLICA.map((c, i) => (
                <article className="cv-cartao" data-r key={c.t} style={{ ['--d' as string]: i }}>
                  <span className="cv-cartao-n">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{c.t}</h3>
                  <p>{c.d}</p>
                </article>
              ))}
            </div>
            <p className="cv-nota" data-r>Não é preciso ter experiência em podcasts, nem saber falar para câmara.</p>
          </div>
        </section>

        {/* ── O que recebe ──────────────────────────────── */}
        <section className="cv-sec cv-escuro">
          <div className="cv-wrap">
            <p className="cv-eyebrow" data-r>O que recebe <b>/ 04</b></p>
            <div className="cv-recebe" data-r>
              <figure className="cv-recebe-foto">
                <img src="/podcast/convidados/episodio.webp" alt="" loading="lazy" />
              </figure>
              <div className="cv-recebe-corpo">
                <h2 className="cv-h2">O ficheiro <em>do episódio.</em></h2>
                <p>O episódio completo é seu, para publicar nos seus canais.</p>
                <p className="cv-troca">Não há pagamento de parte a parte. É uma troca.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Como decorre o dia ────────────────────────── */}
        <section className="cv-sec">
          <div className="cv-wrap cv-duas cv-topo-alinhado">
            <div>
              <p className="cv-eyebrow" data-r>Como decorre o dia <b>/ 05</b></p>
              <h2 className="cv-h2" data-r>Uma manhã <em>ou uma tarde.</em></h2>
            </div>
            <ol className="cv-passos" data-r>
              <li><span>01</span><div><h3>Chegamos meia hora antes</h3><p>Para montar som, luz e câmaras.</p></div></li>
              <li><span>02</span><div><h3>Gravamos de seguida</h3><p>A conversa é gravada sem cortes, com naturalidade.</p></div></li>
              <li><span>03</span><div><h3>No nosso espaço ou no seu</h3><p>Gravamos no nosso estúdio em Palmela, ou no seu espaço se fizer sentido para o tema: uma quinta, uma loja, um atelier. Também podemos gravar numa quinta parceira, quando o episódio é sobre espaços.</p></div></li>
            </ol>
          </div>
        </section>

        {/* ── Candidatura ───────────────────────────────── */}
        <section className="cv-candidatura" id="candidatura">
          <div className="cv-candidatura-foto" aria-hidden="true">
            <img src="/podcast/convidados/candidatura.webp" alt="" loading="lazy" />
          </div>
          <div className="cv-wrap cv-cand-grid">
            <div className="cv-cand-intro">
              <p className="cv-eyebrow" data-r>Candidatura <b>/ 06</b></p>
              <h2 className="cv-h2" data-r>Quer ser <em>convidado?</em></h2>
              <p className="cv-texto" data-r>
                Conte-nos quem é e sobre o que gostaria de falar. Lemos todas as candidaturas e
                respondemos, mesmo que seja para dizer que ainda não é desta.
              </p>
            </div>
            <div className="cv-form" data-r>
              <FormularioCandidatura />
            </div>
          </div>
        </section>

        <footer className="cv-rodape">
          <div className="cv-wrap">
            <p>Antes do Sim <small>Um podcast RL Photo.Video</small></p>
            <Link href="/podcast">Ouvir o podcast ›</Link>
          </div>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400&family=Space+Mono&display=swap');
        .pod{background:#0b0a08}
        .cv{--g:#d8be93;--g2:#c9a84c;--ink:#0b0a08;--ink2:#100e0b;--ink3:#16130f;
          --tx:rgba(243,237,226,.92);--txm:rgba(243,237,226,.62);--txd:rgba(243,237,226,.4);
          --ln:rgba(243,237,226,.14);--lns:rgba(243,237,226,.07);
          --fs:'Cormorant Garamond',serif;--fm:'Space Mono',monospace;--fd:'Jost',sans-serif;
          --ease:cubic-bezier(.16,1,.3,1);--pad:clamp(16px,5vw,80px);
          background:var(--ink);color:var(--tx);font-weight:300;overflow-x:hidden}
        .cv img{display:block;max-width:100%}
        .cv-wrap{max-width:1180px;margin:0 auto;padding:0 var(--pad)}
        .cv-sec{padding:clamp(88px,12vw,150px) 0}
        .cv-escuro{background:var(--ink2)}
        .cv-eyebrow{display:flex;align-items:center;gap:14px;font-family:var(--fm);font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);margin:0 0 24px}
        .cv-eyebrow::before{content:"";width:36px;height:1px;background:var(--g);opacity:.7}
        .cv-eyebrow b{font-weight:400;color:var(--txd)}
        .cv-h2{font-family:var(--fs);font-weight:300;font-size:clamp(38px,5.6vw,76px);line-height:1.04;margin:0;color:var(--tx)}
        .cv-h2 em{font-style:italic;color:var(--g)}
        .cv-texto{color:var(--txm);font-size:17px;line-height:1.75;max-width:560px}
        .cv-texto p{margin:0 0 16px}
        .cv-duas{display:grid;grid-template-columns:1.1fr 1fr;gap:clamp(36px,7vw,100px);align-items:end}
        .cv-topo-alinhado{align-items:start}

        /* revelações */
        .cv-js .cv [data-r]{opacity:0;transform:translateY(30px);transition:opacity 1.1s var(--ease),transform 1.1s var(--ease);transition-delay:calc(var(--d,0)*90ms)}
        .cv-js .cv [data-r].is-in{opacity:1;transform:none}

        /* herói */
        .cv-heroi{position:relative;min-height:100svh;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden;isolation:isolate}
        .cv-heroi-foto{position:absolute;inset:0;z-index:-2}
        .cv-heroi-foto img{width:100%;height:100%;object-fit:cover;object-position:60% 50%;filter:grayscale(1) contrast(1.08) brightness(.8);animation:cvZoom 14s var(--ease) both}
        @keyframes cvZoom{from{transform:scale(1.12)}to{transform:scale(1)}}
        .cv-heroi::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(11,10,8,.97) 0%,rgba(11,10,8,.85) 34%,rgba(11,10,8,.35) 68%,rgba(11,10,8,.2)),linear-gradient(0deg,var(--ink),rgba(11,10,8,0) 40%)}
        .cv-topo{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:22px var(--pad)}
        .cv-voltar,.cv-topo-cta{font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;border-radius:40px;padding:10px 18px;transition:all .3s}
        .cv-voltar{color:var(--txm);border:1px solid var(--ln)}
        .cv-voltar:hover{color:var(--g);border-color:var(--g)}
        .cv-topo-cta{color:var(--g);border:1px solid rgba(216,190,147,.5)}
        .cv-topo-cta:hover{background:var(--g);color:var(--ink)}
        .cv-heroi-corpo{max-width:1180px;width:100%;margin:0 auto;padding:130px var(--pad) clamp(56px,9vh,96px);animation:cvSobe 1.4s var(--ease) both}
        @keyframes cvSobe{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
        .cv-titulo{font-family:var(--fs);font-weight:300;font-size:clamp(64px,11vw,164px);line-height:.9;letter-spacing:-.02em;margin:0}
        .cv-titulo em{font-style:italic;color:var(--g)}
        .cv-heroi-lede{max-width:540px;margin:28px 0 0;font-size:clamp(17px,1.6vw,20px);line-height:1.7;color:var(--txm)}
        .cv-chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
        .cv-chips span{font-family:var(--fm);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--txm);border:1px solid var(--ln);border-radius:40px;padding:9px 14px;background:rgba(11,10,8,.35)}
        .cv-acoes{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px}
        .cv-btn{display:inline-flex;align-items:center;gap:12px;font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;padding:16px 26px;border-radius:40px;transition:all .4s var(--ease);border:1px solid transparent}
        .cv-btn-ouro{background:var(--g);color:var(--ink)}
        .cv-btn-ouro:hover{background:#e7d3ae;transform:translateY(-2px)}
        .cv-btn-linha{border-color:rgba(243,237,226,.28);color:var(--tx)}
        .cv-btn-linha:hover{border-color:var(--g);color:var(--g)}

        /* números */
        .cv-numeros{display:grid;grid-template-columns:repeat(3,1fr);margin-top:clamp(56px,7vw,96px);border-top:1px solid var(--ln)}
        .cv-numeros div{padding:32px 24px 0;border-right:1px solid var(--lns)}
        .cv-numeros div:first-child{padding-left:0}.cv-numeros div:last-child{border-right:0}
        .cv-numeros strong{display:block;font-family:var(--fs);font-weight:300;font-size:clamp(50px,6vw,80px);line-height:1;color:var(--g)}
        .cv-numeros small{display:block;margin-top:12px;font-family:var(--fm);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--txd)}

        /* quem ouve */
        .cv-quem{display:grid;grid-template-columns:.9fr 1.1fr;gap:clamp(36px,7vw,100px);align-items:center}
        .cv-quem .cv-h2{margin-bottom:28px}
        .cv-quem-foto{margin:0;aspect-ratio:4/5;overflow:hidden}
        .cv-quem-foto img{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.05) brightness(.85);transition:filter 1.2s,transform 1.6s var(--ease)}
        .cv-quem-foto:hover img{filter:grayscale(0);transform:scale(1.03)}

        /* cartões */
        .cv-cartoes{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:clamp(48px,6vw,80px)}
        .cv-cartao{border:1px solid var(--ln);padding:30px 24px 32px;min-height:260px;display:flex;flex-direction:column;transition:border-color .5s,transform .6s var(--ease)}
        .cv-cartao:hover{border-color:rgba(216,190,147,.55);transform:translateY(-6px)}
        .cv-cartao-n{font-family:var(--fs);font-weight:300;font-size:52px;line-height:1;color:var(--g)}
        .cv-cartao h3{font-family:var(--fs);font-weight:400;font-size:25px;line-height:1.1;margin:auto 0 10px;padding-top:36px;color:var(--tx)}
        .cv-cartao p{color:var(--txm);font-size:15px;margin:0;line-height:1.6}
        .cv-nota{margin:32px 0 0;font-family:var(--fs);font-style:italic;font-size:clamp(20px,2vw,25px);color:var(--txm)}

        /* o que recebe */
        .cv-recebe{display:grid;grid-template-columns:1fr 1.1fr;border:1px solid rgba(216,190,147,.3);background:linear-gradient(90deg,rgba(216,190,147,.06),transparent);margin-top:8px}
        .cv-recebe-foto{margin:0;min-height:380px;overflow:hidden}
        .cv-recebe-foto img{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.05) brightness(.85)}
        .cv-recebe-corpo{padding:clamp(32px,5vw,64px);display:flex;flex-direction:column;justify-content:center}
        .cv-recebe-corpo .cv-h2{margin:18px 0 18px}
        .cv-recebe-corpo p{color:var(--txm);font-size:17px;margin:0 0 12px}
        .cv-troca{margin-top:18px!important;padding-top:18px;border-top:1px solid var(--lns);font-family:var(--fm);font-size:11px!important;letter-spacing:.16em;text-transform:uppercase;color:var(--g)!important}

        /* passos */
        .cv-passos{list-style:none;margin:0;padding:0}
        .cv-passos li{display:grid;grid-template-columns:52px 1fr;gap:18px;padding:22px 0;border-top:1px solid var(--ln)}
        .cv-passos li:last-child{border-bottom:1px solid var(--ln)}
        .cv-passos span{font-family:var(--fm);font-size:11px;color:var(--g);padding-top:8px}
        .cv-passos h3{font-family:var(--fs);font-weight:400;font-size:26px;margin:0 0 6px;color:var(--tx)}
        .cv-passos p{margin:0;color:var(--txm);font-size:15px;line-height:1.65}

        /* candidatura */
        .cv-candidatura{position:relative;overflow:hidden;isolation:isolate;padding:clamp(96px,12vw,160px) 0}
        .cv-candidatura-foto{position:absolute;inset:0;z-index:-2}
        .cv-candidatura-foto img{width:100%;height:100%;object-fit:cover;object-position:50% 70%;filter:grayscale(1) brightness(.35)}
        .cv-candidatura::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(11,10,8,.92),rgba(11,10,8,.8) 45%,rgba(11,10,8,.94)),linear-gradient(0deg,var(--ink),transparent 20%,transparent 80%,var(--ink))}
        .cv-cand-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:clamp(36px,6vw,90px);align-items:start}
        .cv-cand-intro{position:sticky;top:60px}
        .cv-cand-intro .cv-h2{margin-bottom:24px}
        .cv-form{--ink:#efe7d6}
        .cv-form .pod-bloco{border-radius:0;background:rgba(11,10,8,.72);backdrop-filter:blur(10px);border:1px solid rgba(216,190,147,.3)}
        .cv-form .pod-h2{font-family:var(--fs);font-weight:300;font-size:32px}
        .cv-form .pod-label{font-family:var(--fm);font-weight:400;font-size:10px;letter-spacing:.2em;color:var(--txd)}
        .cv-form .pod-input{border-radius:0;background:rgba(0,0,0,.35);border-color:var(--ln)}
        .cv-form .pod-input:focus{border-color:var(--g)}
        .cv-form .pod-btn{font-family:var(--fm);font-weight:400;font-size:11px;background:var(--g);border-color:var(--g);color:var(--ink)}
        .cv-form .pod-consent a{color:var(--g)}

        /* rodapé */
        .cv-rodape{border-top:1px solid var(--lns);padding:40px 0 48px}
        .cv-rodape .cv-wrap{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:20px}
        .cv-rodape p{margin:0;font-family:var(--fs);font-size:22px}
        .cv-rodape small{display:block;font-family:var(--fm);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--txd)}
        .cv-rodape a{font-family:var(--fm);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--txm);text-decoration:none}
        .cv-rodape a:hover{color:var(--g)}

        @media(max-width:900px){
          .cv-duas,.cv-quem,.cv-cand-grid,.cv-recebe{grid-template-columns:1fr}
          .cv-cartoes{grid-template-columns:1fr 1fr}
          .cv-cand-intro{position:static}
          .cv-quem-foto{aspect-ratio:16/11}
          .cv-recebe-foto{min-height:260px;aspect-ratio:16/10}
          .cv-heroi::before{background:linear-gradient(0deg,var(--ink) 6%,rgba(11,10,8,.85) 50%,rgba(11,10,8,.4))}
        }
        @media(max-width:560px){
          .cv-cartoes{grid-template-columns:1fr}.cv-cartao{min-height:0}
          .cv-numeros div{padding:24px 10px 0}
          .cv-topo-cta{display:none}
        }
        @media(prefers-reduced-motion:reduce){
          .cv *{animation:none!important;transition:none!important}
        }
      `}</style>
    </Envolvente>
  )
}
