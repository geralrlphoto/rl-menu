'use client'

// Apresentação da RL Photo · Video para a reunião com o Sirius Park (25/11/2026).
// Slides em ecrã inteiro: setas / espaço / clique nas metades do ecrã / deslizar no telemóvel. F = ecrã inteiro.
// Os textos entre [ ] são provisórios e ficam realçados a dourado até serem preenchidos.

import { useCallback, useEffect, useRef, useState } from 'react'
import { RLP_CSS } from '@/app/_lead/rlpCss'
import RodaReels from '@/app/_lead/RodaReels'

const ESPACO = 'Sirius Park'
const NOME = 'Inês'

// Marca texto provisório: tudo o que estiver entre [ ] fica realçado
function T({ children }: { children: string }) {
  const partes = children.split(/(\[[^\]]+\])/g)
  return <>{partes.map((p, i) => p.startsWith('[') ? <span key={i} className="ap-ph">{p}</span> : p)}</>
}

type Slide = { id: string; render: () => React.ReactNode }

const NUMEROS = [
  { v: '[00]', l: 'Casamentos por ano' },
  { v: '[00]', l: 'Anos a contar histórias' },
  { v: '[5,0]', l: 'Avaliação dos noivos' },
  { v: '48 h', l: 'Primeiras fotos (sneak peek)' },
]

const PROCESSO = [
  { n: '01', t: 'Reunião', d: 'Conhecemos o casal e a história deles antes de falar de pacotes.' },
  { n: '02', t: 'Portal dos noivos', d: 'Contrato, pagamentos, guias e cronograma num só sítio.' },
  { n: '03', t: 'Pré-wedding', d: 'Uma sessão para o casal se habituar à câmara e a nós.' },
  { n: '04', t: 'O dia', d: 'Equipa discreta, pontual e coordenada com o espaço.' },
  { n: '05', t: 'Primeiras entregas', d: 'Sneak peek em 48 h e galeria online em 7 dias.' },
  { n: '06', t: 'Fotos e filme', d: 'Seleção pelos noivos, edição e o filme do dia.' },
]

const PERGUNTAS = [
  'Como trabalham hoje com os fornecedores de fotografia e vídeo?',
  'O que os casais mais vos pedem quando visitam o espaço?',
  'O que correu menos bem com fornecedores no passado?',
  'Que imagens do Sirius Park vos fazem falta hoje?',
]

const OFERTA = [
  { t: 'Imagens do espaço', d: '[Sessão de fotografia e vídeo do Sirius Park para o site, redes e materiais.]' },
  { t: 'Conteúdo dos casamentos', d: 'Fotografias e vídeos dos casamentos feitos aí, com autorização dos noivos e crédito ao espaço.' },
  { t: 'Divulgação', d: 'O Sirius Park nas nossas redes, no blog, nas histórias dos casais e no podcast Antes do Sim.' },
  { t: 'No dia', d: 'Respeito pelas regras da casa, horários cumpridos e articulação com a vossa equipa.' },
]

const PARCERIA = [
  { n: '01', t: 'Recomendação mútua', d: 'Vocês recomendam a RL aos casais; nós recomendamos o Sirius Park a quem ainda procura espaço.' },
  { n: '02', t: 'Condição para os vossos casais', d: '[Benefício para os noivos que chegam através do Sirius Park.]' },
  { n: '03', t: 'Material partilhado', d: '[Brochura ou cartão da RL no espaço; imagens do espaço no nosso portal.]' },
]

// Links para mostrar na reunião (abrem noutro separador): portal da reunião = o de exemplo "Liliana e Rui" (CRM);
// portal dos noivos = "Ana e Mário" (CAS_026_26_RL); ?admin=1 só abre com a sessão de admin da RL
const LINKS = [
  { n: '01', t: 'Portal da reunião', d: 'O que cada casal recebe antes de nos conhecer: o calendário, os vídeos e a proposta.', url: 'https://portal.rlphotovideo.pt/r/2272e1a8-6050-4d7f-88be-74d1f45a2b9e' },
  { n: '02', t: 'Portal dos noivos', d: 'Contrato, pagamentos, guias, cronograma e o estado das entregas, num só sítio.', url: 'https://portal.rlphotovideo.pt/portal-cliente/ref/CAS_026_26_RL?admin=1' },
  { n: '03', t: 'Podcast Antes do Sim', d: 'Conversas sobre o que acontece antes do casamento, com quem trabalha neste meio.', url: 'https://portal.rlphotovideo.pt/podcast/apresentacao' },
]

// Fotos do portfólio (galeria Wfolio, via /api/portfolio-wfolio): o número é a posição na galeria.
// Cada foto aparece uma só vez na apresentação.
const P = { capa: 14, quem: 7, portal: 16, mosaico: [3, 24, 17, 9, 19, 23], fim: 6 }
let PORT: string[] = []
const f = (n: number) => PORT[n] ? `url(${PORT[n]})` : 'none'

const SLIDES: Slide[] = [
  {
    id: 'capa',
    render: () => (
      <div className="ap-full">
        <div className="ap-bg" style={{ backgroundImage: f(P.capa) }} />
        <div className="ap-shade" />
        <div className="ap-in ap-bottom">
          <span className="rlp-eyebrow">Apresentação · 25 de Novembro de 2026</span>
          <h1 className="ap-h1">RL Photo · Video<br /><em>×</em> {ESPACO}</h1>
          <p className="ap-lede">Uma conversa sobre casamentos, imagens e trabalho em conjunto.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'quem',
    render: () => (
      <div className="ap-split">
        <div className="ap-col">
          <span className="rlp-eyebrow">01 · Quem somos</span>
          <h2 className="ap-h2">Contamos o dia <em>como ele foi</em></h2>
          <p className="ap-lede">Somos especializados em fotografia e vídeo de casamentos, baseados no Pinhal Novo. Preservamos a autenticidade de cada momento: a emoção, os detalhes, as histórias que só acontecem uma vez.</p>
          <p className="ap-lede"><T>{'[Equipa: Rui Gonçalves (direção e vídeo), fotógrafos e editores que trabalham connosco.]'}</T></p>
          <p className="ap-sig">registamos com foco na verdade</p>
        </div>
        <div className="ap-foto" style={{ backgroundImage: f(P.quem) }} />
      </div>
    ),
  },
  {
    id: 'numeros',
    render: () => (
      <div className="ap-in ap-center">
        <span className="rlp-eyebrow c">Em números</span>
        <div className="ap-stats">
          {NUMEROS.map(n => (
            <div key={n.l} className="ap-stat">
              <span className="ap-stat-v"><T>{n.v}</T></span>
              <span className="ap-stat-l">{n.l}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'processo',
    render: () => (
      <div className="ap-in">
        <span className="rlp-eyebrow">02 · Como trabalhamos</span>
        <h2 className="ap-h2">Do primeiro contacto <em>à última entrega</em></h2>
        <div className="ap-grid3">
          {PROCESSO.map(p => {
            // 01 e 02 têm botão para o portal de exemplo (mesmos links do slide "Vejam por vocês")
            const url = p.n === '01' ? LINKS[0].url : p.n === '02' ? LINKS[1].url : ''
            return (
              <div key={p.n} className="ap-card">
                <span className="ap-n">{p.n}</span>
                <p className="ap-card-t">{p.t}</p>
                <p className="ap-card-d">{p.d}</p>
                {url && (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="ap-btn-portal" onClick={e => e.stopPropagation()}>
                    {p.n === '01' ? 'Ver portal da reunião' : 'Ver portal dos noivos'} <span>↗</span>
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </div>
    ),
  },
  {
    id: 'portal',
    render: () => (
      <div className="ap-split rev">
        <div className="ap-foto" style={{ backgroundImage: f(P.portal) }} />
        <div className="ap-col">
          <span className="rlp-eyebrow">O portal dos noivos</span>
          <h2 className="ap-h2">Casais organizados, <em>dia tranquilo</em></h2>
          <p className="ap-lede">Cada casal tem um portal próprio com o contrato, os pagamentos, os guias e o cronograma do casamento. Sabem sempre o que falta e quando chega cada entrega.</p>
          <ul className="ap-list">
            <li>Cronograma do dia preparado com antecedência</li>
            <li>Reunião de preparação antes do casamento</li>
            <li>Estado das entregas sempre visível</li>
          </ul>
          <p className="ap-lede" style={{ color: 'var(--g)' }}>Para o espaço: menos surpresas e horários alinhados.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'trabalho',
    render: () => (
      <div className="ap-in">
        <span className="rlp-eyebrow">03 · O nosso trabalho</span>
        <div className="ap-mosaico">
          {P.mosaico.map((n, i) => <div key={n} className={`ap-m ap-m${i}`} style={{ backgroundImage: f(n) }} />)}
        </div>
        <div className="ap-row">
          <a className="rlp-link-u" href="https://rlphotovideo.pt" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}><span>rlphotovideo.pt</span><span className="a">→</span></a>
          <a className="rlp-link-u" href="https://www.instagram.com/rlphoto_fotografia.video/" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}><span>Instagram</span><span className="a">→</span></a>
        </div>
      </div>
    ),
  },
  {
    id: 'videos',
    // a roda dos portais /r; cliques e arrastos ficam na roda (não mudam de slide)
    render: () => (
      <div className="ap-roda" onClick={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>
        <RodaReels />
      </div>
    ),
  },
  {
    id: 'testemunho',
    render: () => (
      <div className="ap-split">
        <div className="ap-col">
          <span className="rlp-eyebrow">Testemunho Nº 001 · Catarina &amp; Ruben</span>
          <h2 className="ap-h2 ap-quote">Não nos conheciam.<br />Não tinham referências nossas.<br /><em>Mas confiaram.</em></h2>
          <p className="ap-lede">Uma história sobre confiança e a responsabilidade de contar um dos dias mais importantes da vida de um casal.</p>
        </div>
        <div className="ap-foto" style={{ backgroundImage: 'url(/testemunho-catarina-ruben-1200.webp)', backgroundPosition: '62% 45%' }} />
      </div>
    ),
  },
  {
    id: 'ouvir',
    render: () => (
      <div className="ap-in" style={{ maxWidth: 1000 }}>
        <span className="rlp-eyebrow">04 · O vosso espaço</span>
        <h2 className="ap-h2">Agora queremos <em>ouvir-vos</em>, {NOME}</h2>
        <ol className="ap-perg">
          {PERGUNTAS.map((p, i) => <li key={p}><span className="ap-n">{String(i + 1).padStart(2, '0')}</span>{p}</li>)}
        </ol>
      </div>
    ),
  },
  {
    id: 'oferta',
    render: () => (
      <div className="ap-in">
        <span className="rlp-eyebrow">05 · O que trazemos ao {ESPACO}</span>
        <h2 className="ap-h2">Mais do que fotografar <em>casamentos</em></h2>
        <div className="ap-grid2">
          {OFERTA.map(o => (
            <div key={o.t} className="ap-card">
              <p className="ap-card-t">{o.t}</p>
              <p className="ap-card-d"><T>{o.d}</T></p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'parceria',
    render: () => (
      <div className="ap-in">
        <span className="rlp-eyebrow">06 · Como funcionaria</span>
        <h2 className="ap-h2">Uma parceria <em>simples</em></h2>
        <div className="ap-grid3">
          {PARCERIA.map(p => (
            <div key={p.n} className="ap-card">
              <span className="ap-n">{p.n}</span>
              <p className="ap-card-t">{p.t}</p>
              <p className="ap-card-d"><T>{p.d}</T></p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'links',
    render: () => (
      <div className="ap-in">
        <span className="rlp-eyebrow">07 · Vejam por vocês</span>
        <h2 className="ap-h2">O que os casais <em>recebem</em></h2>
        <div className="ap-grid3">
          {LINKS.map(l => {
            const corpo = (
              <>
                <span className="ap-n">{l.n}</span>
                <p className="ap-card-t">{l.t}</p>
                <p className="ap-card-d">{l.d}</p>
                <span className="ap-abrir">{l.url ? 'Abrir →' : <span className="ap-ph">[link por definir]</span>}</span>
              </>
            )
            return l.url
              ? <a key={l.n} href={l.url} target="_blank" rel="noopener noreferrer" className="ap-card ap-link" onClick={e => e.stopPropagation()}>{corpo}</a>
              : <div key={l.n} className="ap-card">{corpo}</div>
          })}
        </div>
      </div>
    ),
  },
  {
    id: 'fim',
    render: () => (
      <div className="ap-full">
        <div className="ap-bg" style={{ backgroundImage: f(P.fim) }} />
        <div className="ap-shade" />
        <div className="ap-in ap-bottom">
          <span className="rlp-eyebrow">Próximos passos</span>
          <h2 className="ap-h1" style={{ fontSize: 'clamp(40px,6.5vw,96px)' }}>Obrigado, <em>{NOME}</em></h2>
          <p className="ap-lede"><T>{'[Combinar a sessão do espaço · enviar a proposta de parceria por escrito · próxima conversa]'}</T></p>
          <div className="ap-contactos">
            <span>Rui Gonçalves</span><span>912 932 768</span><span>geral.rlphoto@gmail.com</span><span>rlphotovideo.pt</span>
          </div>
        </div>
      </div>
    ),
  },
]

export default function ApresentacaoSiriusPark() {
  const [i, setI] = useState(0)
  const toque = useRef<number | null>(null)
  const total = SLIDES.length
  const [fotos, setFotos] = useState<string[]>([])
  PORT = fotos
  useEffect(() => {
    fetch('/api/portfolio-wfolio').then(r => r.json())
      .then(d => setFotos(Array.isArray(d.fotos) ? d.fotos.map((x: { src: string }) => x.src) : []))
      .catch(() => {})
  }, [])
  const ir = useCallback((d: number) => setI(v => Math.min(total - 1, Math.max(0, v + d))), [total])

  useEffect(() => {
    // em captura: as setas mudam de slide e não chegam à roda dos vídeos (salvo com o leitor aberto)
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('.rr-leitor')) return
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter', 'ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) e.stopPropagation()
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); ir(1) }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); ir(-1) }
      else if (e.key === 'Home') setI(0)
      else if (e.key === 'End') setI(total - 1)
      else if (e.key.toLowerCase() === 'f') {
        if (document.fullscreenElement) document.exitFullscreen()
        else document.documentElement.requestFullscreen?.()
      }
    }
    addEventListener('keydown', onKey, true)
    return () => removeEventListener('keydown', onKey, true)
  }, [ir, total])

  return (
    <div
      className="rl-portal ap"
      onClick={e => ir(e.clientX > innerWidth / 3 ? 1 : -1)}
      onTouchStart={e => { toque.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (toque.current == null) return
        const dx = e.changedTouches[0].clientX - toque.current
        toque.current = null
        if (Math.abs(dx) > 50) ir(dx < 0 ? 1 : -1)
      }}
    >
      <style>{RLP_CSS + CSS}</style>
      <div className="rlp-vig" aria-hidden />

      {SLIDES.map((s, k) => (
        <section key={s.id} className={`ap-slide${k === i ? ' on' : ''}${k < i ? ' past' : ''}`} aria-hidden={k !== i}>
          {(s.id !== 'videos' || k === i) && s.render()}
        </section>
      ))}

      <header className="ap-top">
        <span className="rlp-mono"><span>RL</span><i>Photo · Video</i></span>
        <span className="ap-count">{String(i + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
      </header>
      <div className="ap-prog" style={{ width: `${((i + 1) / total) * 100}%` }} />
      <p className="ap-hint">← → para navegar · F ecrã inteiro</p>
      <div className="ap-nav" onClick={e => e.stopPropagation()}>
        <button aria-label="Slide anterior" onClick={() => ir(-1)} disabled={i === 0}>‹</button>
        <button aria-label="Slide seguinte" onClick={() => ir(1)} disabled={i === total - 1}>›</button>
      </div>
    </div>
  )
}

const CSS = `
.ap{position:fixed;inset:0;overflow:hidden;cursor:pointer;user-select:none;}
.ap-slide{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transform:translateX(40px);
  transition:opacity .7s var(--ease),transform .9s var(--ease),visibility 0s linear .7s;}
.ap-slide.past{transform:translateX(-40px);}
.ap-slide.on{opacity:1;visibility:visible;transform:none;transition:opacity .7s var(--ease),transform .9s var(--ease);}
.ap-slide > *{width:100%;}

.ap-top{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;justify-content:space-between;align-items:center;padding:22px var(--pad);pointer-events:none;}
.ap-count{font-family:var(--fb);font-size:12px;letter-spacing:.28em;color:var(--tx-mid);}
.ap-prog{position:fixed;left:0;bottom:0;height:2px;background:linear-gradient(90deg,rgba(216,190,147,.4),var(--g));box-shadow:0 0 12px rgba(216,190,147,.6);transition:width .6s var(--ease);z-index:50;}
.ap-nav{position:fixed;left:var(--pad);bottom:14px;z-index:60;display:flex;gap:8px;}
.ap-nav button{width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:rgba(11,11,11,.5);color:var(--tx-mid);font-size:18px;cursor:pointer;transition:.3s;}
.ap-nav button:hover:not(:disabled){border-color:var(--g);color:var(--g);}
.ap-nav button:disabled{opacity:.25;cursor:default;}
.ap-roda{cursor:default;height:100%;}
.ap-roda .rr-pin{max-height:none;}
.ap-hint{position:fixed;right:var(--pad);bottom:18px;z-index:50;font-family:var(--fb);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--tx-dim);margin:0;}

.ap-in{position:relative;z-index:2;max-width:1240px;margin:0 auto;padding:110px var(--pad) 80px;}
.ap-center{display:flex;flex-direction:column;align-items:center;text-align:center;}
.ap-full{position:relative;height:100%;display:flex;align-items:flex-end;}
.ap-bottom{width:100%;padding-bottom:clamp(60px,11vh,120px);}
.ap-bg{position:absolute;inset:0;background-size:cover;background-position:center;background-color:var(--ink-3);transform:scale(1.04);transition:transform 6s ease-out;}
.ap-slide.on .ap-bg{transform:scale(1);}
.ap-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,10,8,.3) 0%,rgba(11,10,8,.55) 50%,rgba(11,11,11,.96) 100%),linear-gradient(90deg,rgba(11,10,8,.65) 0%,transparent 65%);}

.ap-h1{font-family:var(--fd);font-weight:200;font-size:clamp(44px,7.4vw,112px);line-height:1;letter-spacing:-.01em;margin:18px 0 0;color:var(--tx);}
.ap-h1 em,.ap-h2 em{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;color:var(--g);}
.ap-h2{font-family:var(--fd);font-weight:200;font-size:clamp(32px,4.4vw,64px);line-height:1.05;margin:16px 0 28px;color:var(--tx);max-width:20ch;}
.ap-quote{font-family:'Cormorant Garamond',serif;font-weight:300;max-width:18ch;}
.ap-lede{font-family:var(--fb);font-weight:300;font-size:clamp(16px,1.35vw,20px);line-height:1.6;color:var(--tx-mid);max-width:52ch;margin:0 0 16px;}
.ap-sig{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:clamp(20px,2vw,28px);color:var(--g);margin:14px 0 0;}
.ap-ph{color:var(--g);background:rgba(216,190,147,.08);border:1px dashed rgba(216,190,147,.45);border-radius:4px;padding:0 6px;}

.ap-split{display:grid;grid-template-columns:1fr 1fr;height:100%;}
.ap-split.rev .ap-col{order:2;}
.ap-col{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:center;padding:110px clamp(28px,5vw,90px) 80px var(--pad);}
.ap-split.rev .ap-col{padding:110px var(--pad) 80px clamp(28px,5vw,90px);}
.ap-foto{background-color:var(--ink-3);background-size:cover;background-position:center;position:relative;}
.ap-foto::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,var(--ink) 0%,transparent 30%);}
.ap-split.rev .ap-foto::after{background:linear-gradient(270deg,var(--ink) 0%,transparent 30%);}

.ap-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(16px,3vw,48px);margin-top:48px;width:100%;}
.ap-stat{display:flex;flex-direction:column;align-items:center;gap:14px;padding:28px 10px;border-top:1px solid var(--line);}
.ap-stat-v{font-family:var(--fb);font-weight:100;font-size:clamp(52px,7vw,110px);line-height:.9;color:var(--tx);}
.ap-stat-l{font-family:var(--fb);font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--tx-mid);}

.ap-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.ap-grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
.ap-card{position:relative;padding:clamp(20px,2.2vw,32px);border:1px solid var(--line-soft);border-radius:14px;background:rgba(255,255,255,.025);backdrop-filter:blur(6px);}
.ap-card::before{content:'';position:absolute;left:0;top:18px;bottom:18px;width:2px;background:var(--g);opacity:.7;border-radius:2px;}
.ap-n{font-family:var(--fb);font-weight:600;font-size:12px;letter-spacing:.22em;color:var(--g);}
.ap-card-t{font-family:var(--fd);font-weight:300;font-size:clamp(20px,1.9vw,26px);margin:8px 0 8px;color:var(--tx);}
.ap-card-d{font-family:var(--fb);font-weight:300;font-size:15px;line-height:1.55;color:var(--tx-mid);margin:0;}

.ap-link{display:block;text-decoration:none;cursor:pointer;transition:border-color .35s,background .35s,transform .35s var(--ease);}
.ap-link:hover{border-color:rgba(216,190,147,.5);background:rgba(216,190,147,.05);transform:translateY(-3px);}
.ap-abrir{display:inline-block;margin-top:18px;font-family:var(--fb);font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--g);}
.ap-btn-portal{display:inline-flex;align-items:center;gap:10px;margin-top:18px;padding:10px 18px;border:1px solid rgba(216,190,147,.55);border-radius:40px;
  font-family:var(--fb);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--g);text-decoration:none;cursor:pointer;transition:background .35s,color .35s;}
.ap-btn-portal:hover{background:var(--g);color:var(--ink);}
.ap-list{list-style:none;padding:0;margin:4px 0 22px;display:flex;flex-direction:column;gap:10px;}
.ap-list li{font-family:var(--fb);font-size:16px;color:var(--tx);padding-left:22px;position:relative;}
.ap-list li::before{content:'';position:absolute;left:0;top:.65em;width:10px;height:1px;background:var(--g);}

.ap-perg{list-style:none;padding:0;margin:10px 0 0;display:flex;flex-direction:column;}
.ap-perg li{display:flex;gap:22px;align-items:baseline;padding:22px 0;border-top:1px solid var(--line-soft);font-family:var(--fd);font-weight:200;font-size:clamp(20px,2.3vw,32px);color:var(--tx);}

.ap-mosaico{display:grid;grid-template-columns:1.1fr 1fr 1fr 1fr;grid-template-rows:1fr 1fr;gap:10px;height:min(60vh,580px);margin:22px 0 22px;}
.ap-m{background-color:var(--ink-3);background-size:cover;background-position:center;border-radius:10px;}
.ap-m0{grid-row:1 / 3;}
.ap-m1{grid-column:2 / 4;}
.ap-row{display:flex;gap:36px;}

.ap-contactos{display:flex;flex-wrap:wrap;gap:12px 32px;margin-top:26px;font-family:var(--fb);font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-mid);}

@media (max-width:820px){
  .ap-split{grid-template-columns:1fr;grid-template-rows:38vh 1fr;}
  .ap-split .ap-foto{order:-1;}
  .ap-split.rev .ap-col{order:2;}
  .ap-col,.ap-split.rev .ap-col{padding:24px var(--pad) 60px;justify-content:flex-start;}
  .ap-foto::after,.ap-split.rev .ap-foto::after{background:linear-gradient(0deg,var(--ink) 0%,transparent 40%);}
  .ap-stats{grid-template-columns:repeat(2,1fr);margin-top:24px;}
  .ap-grid3,.ap-grid2{grid-template-columns:1fr;gap:10px;}
  .ap-in{padding-top:80px;overflow-y:auto;max-height:100%;}
  .ap-mosaico{height:46vh;}
  .ap-hint{display:none;}
}
`
