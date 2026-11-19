import type { Metadata } from 'next'
import { clienteAdmin } from '@/lib/podcast/dados'
import { BASE_URL } from '@/lib/podcast/programa'
import Revelar from '../../convidados/Revelar'

/* ============================================================
   /podcast/apresentacao/convidados — quem se senta à mesa.

   Mostra só os convidados com "publicar_perfil" ligado (interruptor
   na gestão, /social-media/podcast). Lê no servidor só os campos
   públicos: nome, trabalho, texto, foto e redes. Nunca email nem
   telefone. Os episódios ainda em rascunho não são públicos pelo RLS,
   por isso o número e o tema vêm com a chave de serviço, aqui no
   servidor, e só esses dois campos.

   Reconstruída de 5 em 5 minutos (ISR): uma leitura por reconstrução.
   ============================================================ */

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Os convidados',
  description: 'Quem se senta à mesa do Antes do Sim, o podcast da RL Photo.Video sobre casamentos.',
  alternates: { canonical: `${BASE_URL}/podcast/apresentacao/convidados` },
}

type Perfil = {
  id: string; nome: string; profissao: string | null; empresa: string | null; bio: string | null
  foto_url: string | null; instagram: string | null; website: string | null
  episodio: { numero: number; titulo: string } | null
}

async function lerConvidados(): Promise<Perfil[]> {
  const sb = clienteAdmin()
  const { data, error } = await sb
    .from('podcast_convidados')
    .select('id, nome, profissao, empresa, bio, foto_url, instagram, website, podcast_episodio_convidados (podcast_episodios (numero, titulo))')
    .eq('publicar_perfil', true)
  if (error) { console.error('[podcast] convidados públicos', error.message); return [] }
  return (data ?? []).map((c: any) => {
    const ep = (c.podcast_episodio_convidados ?? []).map((l: any) => l.podcast_episodios).filter(Boolean)[0] ?? null
    return { ...c, episodio: ep ? { numero: ep.numero, titulo: ep.titulo } : null }
  }).sort((a, b) => (a.episodio?.numero ?? 99) - (b.episodio?.numero ?? 99))
}

function linkInstagram(v: string) {
  const h = v.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, '')
  return { url: `https://instagram.com/${h}`, texto: '@' + h }
}
function linkSite(v: string) {
  const url = /^https?:\/\//.test(v) ? v : `https://${v}`
  return { url, texto: url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') }
}

export default async function ConvidadosPublicos() {
  const convidados = await lerConvidados()

  return (
    <div className="ac">
      <Revelar />
      <header className="ac-heroi">
        <div className="ac-heroi-foto" aria-hidden="true"><img src="/podcast/apresentacao/img/port/raiz-44.jpg" alt="" /></div>
        <div className="ac-topo">
          <a className="ac-voltar" href="/podcast/apresentacao"><span aria-hidden="true">‹</span> Voltar à apresentação</a>
        </div>
        <div className="ac-heroi-corpo">
          <p className="ac-eyebrow">Antes do Sim · Convidados</p>
          <h1 className="ac-titulo">Quem se senta <em style={{ whiteSpace: 'nowrap' }}>à mesa.</em></h1>
          <p className="ac-lede">
            Cada episódio é uma conversa com quem faz casamentos por dentro. Conheça os profissionais
            que passam pelo Antes do Sim e siga o trabalho deles.
          </p>
        </div>
      </header>

      <main className="ac-wrap">
        {convidados.length === 0 ? (
          <section className="ac-vazio" data-r>
            <p className="ac-eyebrow">Temporada 1</p>
            <h2>Os primeiros convidados <em>chegam em breve.</em></h2>
            <p>Estamos a fechar as conversas da primeira temporada. Os perfis aparecem aqui à medida que cada convidado é anunciado.</p>
            <a className="ac-btn" href="/podcast/apresentacao#temporada">Ver os temas da temporada</a>
          </section>
        ) : (
          <ul className="ac-lista">
            {convidados.map((c, i) => {
              const ig = c.instagram ? linkInstagram(c.instagram) : null
              const site = c.website ? linkSite(c.website) : null
              return (
                <li className="ac-conv" data-r key={c.id} style={{ ['--d' as string]: i % 2 }}>
                  <figure className="ac-foto">
                    {c.foto_url
                      ? <img src={c.foto_url} alt={c.nome} loading="lazy" />
                      : <span className="ac-inicial" aria-hidden="true">{c.nome.charAt(0)}</span>}
                  </figure>
                  <div className="ac-corpo">
                    {c.episodio && (
                      <p className="ac-ep">Episódio {String(c.episodio.numero).padStart(2, '0')} · {c.episodio.titulo}</p>
                    )}
                    <h2>{c.nome}</h2>
                    {(c.profissao || c.empresa) && <p className="ac-trab">{[c.profissao, c.empresa].filter(Boolean).join(' · ')}</p>}
                    {c.bio && <div className="ac-bio">{c.bio.split(/\n+/).map((p, k) => <p key={k}>{p}</p>)}</div>}
                    {(ig || site) && (
                      <div className="ac-redes">
                        {ig && <a href={ig.url} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" /></svg>{ig.texto}</a>}
                        {site && <a href={site.url} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" /></svg>{site.texto}</a>}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>

      <footer className="ac-rodape">
        <p>Antes do Sim <small>Um podcast RL Photo.Video</small></p>
        <a href="/podcast/apresentacao">Voltar à apresentação ›</a>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Hanken+Grotesk:wght@300;400&family=Space+Mono&display=swap');
        body{background:#0b0a08}
        .ac{--g:#d8be93;--bg:#0b0a08;--bg2:#100e0b;--tx:rgba(243,237,226,.92);--txm:rgba(243,237,226,.62);--txd:rgba(243,237,226,.4);
          --ln:rgba(243,237,226,.14);--lns:rgba(243,237,226,.07);--fs:'Cormorant Garamond',serif;--fm:'Space Mono',monospace;--fb:'Hanken Grotesk',sans-serif;
          --ease:cubic-bezier(.16,1,.3,1);--pad:clamp(16px,5vw,80px);
          background:var(--bg);color:var(--tx);font-family:var(--fb);font-weight:300;min-height:100vh;overflow-x:hidden}
        .ac *{box-sizing:border-box}
        .ac img{display:block;max-width:100%}
        .ac a{color:inherit;text-decoration:none}
        .cv-js .ac [data-r]{opacity:0;transform:translateY(30px);transition:opacity 1.1s var(--ease),transform 1.1s var(--ease);transition-delay:calc(var(--d,0)*120ms)}
        .cv-js .ac [data-r].is-in{opacity:1;transform:none}
        .ac-eyebrow{display:flex;align-items:center;gap:14px;font-family:var(--fm);font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);margin:0 0 22px}
        .ac-eyebrow::before{content:"";width:36px;height:1px;background:var(--g);opacity:.7}
        .ac-heroi{position:relative;min-height:78svh;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden;isolation:isolate}
        .ac-heroi-foto{position:absolute;inset:0;z-index:-2}
        .ac-heroi-foto img{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.06) brightness(.75);animation:acZoom 14s var(--ease) both}
        @keyframes acZoom{from{transform:scale(1.1)}to{transform:scale(1)}}
        .ac-heroi::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(11,10,8,.96),rgba(11,10,8,.8) 40%,rgba(11,10,8,.35)),linear-gradient(0deg,var(--bg),rgba(11,10,8,0) 45%)}
        .ac-topo{position:absolute;top:0;left:0;right:0;padding:22px var(--pad)}
        .ac-voltar{display:inline-flex;gap:8px;font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--txm);border:1px solid var(--ln);border-radius:40px;padding:10px 18px;transition:all .3s}
        .ac-voltar:hover{color:var(--g);border-color:var(--g)}
        .ac-heroi-corpo{max-width:1180px;width:100%;margin:0 auto;padding:120px var(--pad) clamp(48px,8vh,88px);animation:acSobe 1.4s var(--ease) both}
        @keyframes acSobe{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
        .ac-titulo{font-family:var(--fs);font-weight:300;font-size:clamp(56px,9vw,136px);line-height:.92;letter-spacing:-.02em;margin:0}
        .ac-titulo em,.ac h2 em{font-style:italic;color:var(--g)}
        .ac-lede{max-width:560px;margin:26px 0 0;font-size:clamp(17px,1.6vw,20px);line-height:1.7;color:var(--txm)}
        .ac-wrap{max-width:1180px;margin:0 auto;padding:clamp(56px,8vw,110px) var(--pad)}
        .ac-vazio{border:1px solid rgba(216,190,147,.3);background:linear-gradient(90deg,rgba(216,190,147,.06),transparent);padding:clamp(32px,6vw,72px)}
        .ac-vazio h2{font-family:var(--fs);font-weight:300;font-size:clamp(34px,4.6vw,60px);line-height:1.05;margin:0 0 18px}
        .ac-vazio p:not(.ac-eyebrow){color:var(--txm);font-size:17px;line-height:1.7;max-width:560px;margin:0 0 28px}
        .ac-btn{display:inline-flex;font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;background:var(--g);color:var(--bg)!important;padding:15px 24px;border-radius:40px;transition:transform .4s var(--ease)}
        .ac-btn:hover{transform:translateY(-2px)}
        .ac-lista{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:clamp(56px,8vw,110px)}
        .ac-conv{display:grid;grid-template-columns:.85fr 1.15fr;gap:clamp(28px,6vw,90px);align-items:center}
        .ac-conv:nth-child(even) .ac-foto{order:2}
        .ac-foto{margin:0;aspect-ratio:4/5;overflow:hidden;border:1px solid rgba(216,190,147,.3);background:var(--bg2);display:grid;place-items:center}
        .ac-foto img{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.05);transition:filter 1.2s,transform 1.6s var(--ease)}
        .ac-conv:hover .ac-foto img{filter:grayscale(0);transform:scale(1.03)}
        .ac-inicial{font-family:var(--fs);font-style:italic;font-size:120px;color:var(--g);opacity:.6}
        .ac-ep{font-family:var(--fm);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--g);margin:0 0 16px;line-height:1.7}
        .ac-corpo h2{font-family:var(--fs);font-weight:300;font-size:clamp(40px,5vw,68px);line-height:1;margin:0}
        .ac-trab{font-family:var(--fm);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--txd);margin:14px 0 0}
        .ac-bio{margin-top:24px;color:var(--txm);font-size:17px;line-height:1.75;max-width:560px}
        .ac-bio p{margin:0 0 14px}
        .ac-redes{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}
        .ac-redes a{display:inline-flex;align-items:center;gap:10px;font-family:var(--fm);font-size:11px;letter-spacing:.08em;color:var(--tx);border:1px solid rgba(216,190,147,.45);border-radius:40px;padding:12px 18px;transition:all .3s}
        .ac-redes a:hover{background:var(--g);color:var(--bg);border-color:var(--g)}
        .ac-redes svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5}
        .ac-rodape{border-top:1px solid var(--lns);padding:40px var(--pad) 48px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:20px;max-width:none}
        .ac-rodape p{margin:0;font-family:var(--fs);font-size:22px}
        .ac-rodape small{display:block;font-family:var(--fm);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--txd)}
        .ac-rodape a{font-family:var(--fm);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--txm)}
        .ac-rodape a:hover{color:var(--g)}
        @media(max-width:860px){
          .ac-conv{grid-template-columns:1fr}.ac-conv:nth-child(even) .ac-foto{order:0}
          .ac-foto{aspect-ratio:4/4.4;max-width:420px}
          .ac-heroi::before{background:linear-gradient(0deg,var(--bg) 6%,rgba(11,10,8,.85) 55%,rgba(11,10,8,.45))}
        }
        @media(prefers-reduced-motion:reduce){.ac *{animation:none!important;transition:none!important}}
      `}</style>
    </div>
  )
}
