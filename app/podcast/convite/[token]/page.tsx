import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { clienteAdmin } from '@/lib/podcast/dados'
import Revelar from '../../convidados/Revelar'
import Resposta from './Resposta'

/* ============================================================
   /podcast/convite/<token> — convite pessoal para o podcast.

   Uma página por pessoa, criada na gestão (/social-media/podcast).
   O token é secreto e longo; a página não é indexada. Ao abrir,
   regista a primeira visita (visto_em), para a gestão mostrar
   "Viu o convite". Lê no servidor só o que a página mostra.
   ============================================================ */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Convite',
  robots: { index: false, follow: false },
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
function dataLonga(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`
}

export default async function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!/^[a-f0-9]{24}$/.test(token)) notFound()

  const sb = clienteAdmin()
  const { data: c } = await sb
    .from('podcast_convites')
    .select('id, nome, nota, visto_em, resposta, podcast_episodios (numero, titulo, gravacao_data, gravacao_hora, gravacao_local)')
    .eq('token', token)
    .maybeSingle()
  if (!c) notFound()

  if (!c.visto_em) {
    await sb.from('podcast_convites').update({ visto_em: new Date().toISOString() }).eq('id', c.id)
  }

  const ep: any = (c as any).podcast_episodios
  const primeiro = c.nome.trim().split(/\s+/)[0]
  const whatsapp = `https://wa.me/351912932768?text=${encodeURIComponent(`Olá Rui, sou ${c.nome} e recebi o convite para o Antes do Sim.`)}`

  return (
    <div className="ci">
      <Revelar />
      <header className="ci-heroi">
        <div className="ci-heroi-foto" aria-hidden="true"><img src="/podcast/convidados/heroi.webp" alt="" /></div>
        <div className="ci-heroi-corpo">
          <p className="ci-eyebrow">Antes do Sim · Convite pessoal</p>
          <h1 className="ci-titulo">Olá, <em>{primeiro}.</em></h1>
          <p className="ci-lede">
            Gostávamos muito de contar consigo no Antes do Sim, o podcast da RL Photo.Video para quem
            está a planear o casamento. Uma conversa com quem faz casamentos por dentro.
          </p>
          {ep && (
            <div className="ci-ep">
              <span>Episódio {String(ep.numero).padStart(2, '0')}</span>
              <strong>{ep.titulo}</strong>
            </div>
          )}
          <a className="ci-desce" href="#responder">Responder ao convite ↓</a>
        </div>
      </header>

      <main className="ci-wrap">
        {c.nota && (
          <section className="ci-nota" data-r>
            <blockquote>{c.nota.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</blockquote>
            <p className="ci-assina">Rui Gonçalves, da RL Photo.Video</p>
          </section>
        )}

        <section className="ci-grelha">
          <article className="ci-bloco" data-r>
            <span className="ci-n">01</span>
            <h2>O que lhe pedimos</h2>
            <ul>
              <li>Cerca de 45 minutos de conversa, gravada em vídeo.</li>
              <li>Meia hora antes para preparar som e luz.</li>
              <li>Nada para decorar: enviamos os temas dois dias antes.</li>
            </ul>
          </article>
          <article className="ci-bloco" data-r style={{ ['--d' as string]: 1 }}>
            <span className="ci-n">02</span>
            <h2>O que recebe</h2>
            <ul>
              <li>O ficheiro do episódio completo, para publicar nos seus canais.</li>
              <li>Não há pagamento de parte a parte. É uma troca.</li>
            </ul>
          </article>
          <article className="ci-bloco" data-r style={{ ['--d' as string]: 2 }}>
            <span className="ci-n">03</span>
            <h2>Quando e onde</h2>
            {ep?.gravacao_data ? (
              <ul>
                <li>{dataLonga(ep.gravacao_data)}{ep.gravacao_hora ? `, às ${ep.gravacao_hora}` : ''}.</li>
                {ep.gravacao_local && <li>{ep.gravacao_local}</li>}
              </ul>
            ) : (
              <ul>
                <li>Combinamos juntos a data, de manhã ou de tarde.</li>
                <li>No nosso espaço em Palmela, ou no seu, se fizer sentido para o tema.</li>
              </ul>
            )}
          </article>
        </section>

        <section className="ci-responder" id="responder" data-r>
          <p className="ci-eyebrow">A sua resposta</p>
          <h2 className="ci-h2">Aceita <em>o convite?</em></h2>
          <Resposta token={token} inicial={(c.resposta as any) ?? null} whatsapp={whatsapp} />
          <p className="ci-mais">Quer saber mais? <a href="/podcast/apresentacao" target="_blank" rel="noopener">Veja a apresentação completa do podcast ↗</a></p>
        </section>
      </main>

      <footer className="ci-rodape">
        <p>Antes do Sim <small>Um podcast RL Photo.Video</small></p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Hanken+Grotesk:wght@300;400&family=Space+Mono&display=swap');
        body{background:#0b0a08}
        .ci{--g:#d8be93;--bg:#0b0a08;--bg2:#100e0b;--tx:rgba(243,237,226,.92);--txm:rgba(243,237,226,.62);--txd:rgba(243,237,226,.4);
          --ln:rgba(243,237,226,.14);--lns:rgba(243,237,226,.07);--fs:'Cormorant Garamond',serif;--fm:'Space Mono',monospace;--fb:'Hanken Grotesk',sans-serif;
          --ease:cubic-bezier(.16,1,.3,1);--pad:clamp(16px,5vw,80px);
          background:var(--bg);color:var(--tx);font-family:var(--fb);font-weight:300;min-height:100vh;overflow-x:hidden}
        .ci *{box-sizing:border-box}
        .ci img{display:block;max-width:100%}
        .ci a{color:inherit;text-decoration:none}
        .cv-js .ci [data-r]{opacity:0;transform:translateY(30px);transition:opacity 1.1s var(--ease),transform 1.1s var(--ease);transition-delay:calc(var(--d,0)*110ms)}
        .cv-js .ci [data-r].is-in{opacity:1;transform:none}
        .ci-eyebrow{display:flex;align-items:center;gap:14px;font-family:var(--fm);font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);margin:0 0 22px}
        .ci-eyebrow::before{content:"";width:36px;height:1px;background:var(--g);opacity:.7}
        .ci-heroi{position:relative;min-height:100svh;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden;isolation:isolate}
        .ci-heroi-foto{position:absolute;inset:0;z-index:-2}
        .ci-heroi-foto img{width:100%;height:100%;object-fit:cover;object-position:60% 50%;filter:grayscale(1) contrast(1.08) brightness(.78);animation:ciZoom 14s var(--ease) both}
        @keyframes ciZoom{from{transform:scale(1.1)}to{transform:scale(1)}}
        .ci-heroi::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(11,10,8,.97),rgba(11,10,8,.84) 38%,rgba(11,10,8,.35)),linear-gradient(0deg,var(--bg),rgba(11,10,8,0) 45%)}
        .ci-heroi-corpo{max-width:1180px;width:100%;margin:0 auto;padding:110px var(--pad) clamp(48px,8vh,88px);animation:ciSobe 1.4s var(--ease) both}
        @keyframes ciSobe{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
        .ci-titulo{font-family:var(--fs);font-weight:300;font-size:clamp(64px,11vw,168px);line-height:.9;letter-spacing:-.02em;margin:0}
        .ci-titulo em,.ci h2 em{font-style:italic;color:var(--g)}
        .ci-lede{max-width:560px;margin:26px 0 0;font-size:clamp(17px,1.6vw,20px);line-height:1.7;color:var(--txm)}
        .ci-ep{margin-top:30px;display:inline-flex;flex-direction:column;gap:8px;padding:18px 24px;border:1px solid rgba(216,190,147,.45);background:rgba(11,10,8,.55);backdrop-filter:blur(6px);max-width:640px}
        .ci-ep span{font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--g)}
        .ci-ep strong{font-family:var(--fs);font-weight:400;font-size:clamp(22px,2.4vw,30px);line-height:1.2}
        .ci-desce{display:block;margin-top:34px;font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--txm)}
        .ci-desce:hover{color:var(--g)}
        .ci-wrap{max-width:1180px;margin:0 auto;padding:clamp(56px,8vw,110px) var(--pad)}
        .ci-nota{max-width:780px;margin:0 0 clamp(56px,8vw,100px);padding-left:28px;border-left:1px solid var(--g)}
        .ci-nota blockquote{margin:0;font-family:var(--fs);font-style:italic;font-weight:300;font-size:clamp(24px,2.6vw,34px);line-height:1.35}
        .ci-nota blockquote p{margin:0 0 12px}
        .ci-assina{margin:14px 0 0;font-family:var(--fm);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--g)}
        .ci-grelha{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .ci-bloco{border:1px solid var(--ln);padding:30px 26px 32px;transition:border-color .5s,transform .6s var(--ease)}
        .ci-bloco:hover{border-color:rgba(216,190,147,.55);transform:translateY(-4px)}
        .ci-n{font-family:var(--fs);font-weight:300;font-size:48px;line-height:1;color:var(--g)}
        .ci-bloco h2{font-family:var(--fs);font-weight:400;font-size:27px;margin:28px 0 14px}
        .ci-bloco ul{list-style:none;margin:0;padding:0}
        .ci-bloco li{position:relative;padding-left:18px;color:var(--txm);font-size:15px;line-height:1.65;margin-bottom:8px}
        .ci-bloco li::before{content:"";position:absolute;left:0;top:11px;width:6px;height:1px;background:var(--g)}
        .ci-responder{margin-top:clamp(64px,9vw,120px);padding:clamp(32px,6vw,72px);border:1px solid rgba(216,190,147,.35);background:linear-gradient(90deg,rgba(216,190,147,.07),transparent)}
        .ci-h2{font-family:var(--fs);font-weight:300;font-size:clamp(40px,5.4vw,72px);line-height:1;margin:0 0 30px}
        .ci-botoes{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
        .ci-btn{display:inline-flex;align-items:center;gap:12px;font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;padding:16px 26px;border-radius:40px;border:1px solid transparent;cursor:pointer;transition:all .4s var(--ease)}
        .ci-btn:disabled{opacity:.5;cursor:default}
        .ci-btn-ouro{background:var(--g);color:var(--bg)}
        .ci-btn-ouro:hover{background:#e7d3ae;transform:translateY(-2px)}
        .ci-btn-linha{background:transparent;border-color:rgba(243,237,226,.28);color:var(--tx)}
        .ci-btn-linha:hover{border-color:var(--g);color:var(--g)}
        .ci-resp-feita h2{font-family:var(--fs);font-weight:300;font-size:clamp(34px,4.4vw,56px);margin:0 0 14px}
        .ci-resp-feita p{color:var(--txm);font-size:17px;line-height:1.7;max-width:560px;margin:0 0 26px}
        .ci-mudar{background:none;border:0;color:var(--txd);font-family:var(--fm);font-size:10px;letter-spacing:.16em;text-transform:uppercase;text-decoration:underline;cursor:pointer}
        .ci-erro{color:#e8a1a1;font-size:14px;margin-top:14px}
        .ci-mais{margin:30px 0 0;color:var(--txm);font-size:15px}
        .ci-mais a{color:var(--g);border-bottom:1px solid rgba(216,190,147,.4)}
        .ci-rodape{border-top:1px solid var(--lns);padding:36px var(--pad) 44px}
        .ci-rodape p{margin:0;font-family:var(--fs);font-size:22px}
        .ci-rodape small{display:block;font-family:var(--fm);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--txd)}
        @media(max-width:860px){
          .ci-grelha{grid-template-columns:1fr}
          .ci-heroi::before{background:linear-gradient(0deg,var(--bg) 6%,rgba(11,10,8,.86) 55%,rgba(11,10,8,.45))}
          .ci-btn{width:100%;justify-content:center}
        }
        @media(prefers-reduced-motion:reduce){.ci *{animation:none!important;transition:none!important}}
      `}</style>
    </div>
  )
}
