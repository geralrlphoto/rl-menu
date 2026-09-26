'use client'

import { useState } from 'react'
import Link from 'next/link'

/* Funil em gravata-borboleta aplicado à RL PhotoVideo.
   Esquerda: conquistar o casal (até ao contrato). Centro: a experiência.
   Direita: fazer crescer (fidelizar, recomendar, embaixadores). */

type Estado = 'feito' | 'parte' | 'falta'
type Fase = {
  n: number
  nome: string
  en: string
  lado: 'esq' | 'dir'
  objetivo: string
  naRL: string[]
  ferramentas: { label: string; href: string }[]
  medir: string[]
  falta?: string[]
  estado: Estado
}

const FASES: Fase[] = [
  {
    n: 1, nome: 'Atrair', en: 'Attract', lado: 'esq', estado: 'feito',
    objetivo: 'Os casais descobrem a RL pela primeira vez.',
    naRL: ['Instagram e blog com casamentos reais', 'Site e filmes no Vimeo', 'Quintas onde já trabalhámos', 'Convidados que nos viram a trabalhar'],
    ferramentas: [{ label: 'Social Media', href: '/social-media' }, { label: 'Redes', href: '/redes' }],
    medir: ['Leads por mês', 'Origem de cada lead (Instagram, site, recomendação, quinta)'],
  },
  {
    n: 2, nome: 'Nutrir', en: 'Nurture', lado: 'esq', estado: 'feito',
    objetivo: 'Ganham confiança antes de pedirem orçamento.',
    naRL: ['Newsletter com histórias e dicas', 'Portefólio, filmes e testemunhos', 'Resposta rápida e próxima no primeiro contacto'],
    ferramentas: [{ label: 'Newsletter', href: '/newsletter-admin' }, { label: 'Social Media', href: '/social-media' }],
    medir: ['Subscritores da newsletter', 'Taxa de abertura', 'Tempo até à primeira resposta'],
  },
  {
    n: 3, nome: 'Converter', en: 'Convert', lado: 'esq', estado: 'feito',
    objetivo: 'Pedem orçamento, reunimos e enviamos a proposta.',
    naRL: ['Briefing da nova lead', 'Reunião (Meet ou presencial)', 'Proposta no portal da lead', 'Follow up por WhatsApp aos 3 e 8 dias'],
    ferramentas: [{ label: 'CRM', href: '/crm' }, { label: 'Follow Up', href: '/crm/follow-up' }, { label: 'Briefing nova lead', href: '/nova-lead' }],
    medir: ['Leads → reunião', 'Reunião → proposta', 'Motivos de "não fechou"'],
  },
  {
    n: 4, nome: 'Fechar', en: 'Engage', lado: 'esq', estado: 'feito',
    objetivo: 'Assinam o contrato e pagam o sinal.',
    naRL: ['Dados para contrato CPS', 'Plano de pagamentos', 'Boas-vindas e acesso ao portal dos noivos'],
    ferramentas: [{ label: 'Contrato CPS', href: '/contrato-cps' }, { label: 'Pagamentos', href: '/financas' }],
    medir: ['Proposta → contrato (%)', 'Dias entre a lead e o contrato'],
  },
  {
    n: 5, nome: 'Viver', en: 'Adopter', lado: 'dir', estado: 'feito',
    objetivo: 'Vivem a experiência RL até ao grande dia.',
    naRL: ['Portal dos noivos com as 11 sub-páginas', 'Briefing pré-casamento e reunião de preparação', 'Pré-wedding', 'O dia do casamento'],
    ferramentas: [{ label: 'Portais', href: '/portais-clientes' }, { label: 'Casamentos', href: '/casamentos' }],
    medir: ['Briefings preenchidos', 'Reuniões de preparação marcadas', 'Mensagens e dúvidas no portal'],
  },
  {
    n: 6, nome: 'Fidelizar', en: 'Loyalist', lado: 'dir', estado: 'parte',
    objetivo: 'Recebem tudo a tempo e com qualidade, e voltam.',
    naRL: ['Galeria online em 7 dias e seleção em 30 dias', 'Álbum e filme', 'Estado das Entregas sempre visível no portal', 'Batizados e sessões de família'],
    ferramentas: [{ label: 'Seleção de fotos', href: '/fotos-selecao' }, { label: 'Álbuns', href: '/albuns-casamento' }, { label: 'Batizados', href: '/portal-batizado' }],
    medir: ['Entregas dentro do prazo (%)', 'Clientes que voltam (batizado, família)'],
    falta: ['Convite a antigos noivos para batizado ou sessão de família (1 ano depois)'],
  },
  {
    n: 7, nome: 'Recomendar', en: 'Advocate', lado: 'dir', estado: 'parte',
    objetivo: 'Ficam tão satisfeitos que falam de nós.',
    naRL: ['Área de satisfação no portal (DAR SATISFAÇÃO)', 'Filme e álbum partilhados com a família'],
    ferramentas: [{ label: 'Portais · Satisfação', href: '/portais-clientes' }],
    medir: ['Nota média de satisfação', 'Número de reviews no Google'],
    falta: ['Pedido de review no Google, automático, depois da entrega do filme ou do álbum'],
  },
  {
    n: 8, nome: 'Embaixador', en: 'Brand Ambassador', lado: 'dir', estado: 'falta',
    objetivo: 'Trazem-nos novos casais.',
    naRL: ['Fotos dos convidados levam a marca RL a quem esteve no casamento'],
    ferramentas: [{ label: 'Fotos Convidados', href: '/galeria-convidados' }],
    medir: ['Leads que vieram por recomendação', 'Casais que recomendaram alguém'],
    falta: ['Pergunta "Quem vos recomendou?" no CRM, ligada ao casal que recomendou', 'Agradecimento ou oferta a quem recomenda', 'Parcerias com quintas e wedding planners'],
  },
]

const ESTADOS: Record<Estado, { t: string; cor: string }> = {
  feito: { t: 'Já temos', cor: '#8fcf9d' },
  parte: { t: 'Em parte', cor: '#e2b66b' },
  falta: { t: 'Por fazer', cor: '#e59a88' },
}

const PASSOS = [
  { t: 'Pedido de review', d: 'Depois da entrega do filme ou do álbum, uma mensagem com o link direto para a review no Google. É a forma mais barata de chegar a novos casais.', fase: 7 },
  { t: 'Origem das leads', d: 'Registar no CRM de onde veio cada lead e quem a recomendou. Mostra quais os canais que realmente trazem casamentos.', fase: 8 },
  { t: 'Voltar a ser cliente', d: 'Um ano depois do casamento, convite para uma sessão de família ou para o batizado. O casal já confia em nós.', fase: 6 },
]

/* ── Geometria da gravata (viewBox 1000 × 440) ───────────────────── */
const W = 1000, H = 440, CX = 500, CY = 220
const NECK = 52           // meia-altura no nó
const OPEN = 190          // meia-altura nas pontas
const X0 = 30, XN = 430   // lado esquerdo: da ponta ao nó
// meia-altura ao longo do lado esquerdo (t = 0 na ponta, 1 no nó), com curva suave
const meia = (t: number) => NECK + (OPEN - NECK) * Math.pow(1 - t, 1.6)
// 1 casa decimal: evita diferenças de arredondamento entre servidor e browser (hidratação)
const r1 = (v: number) => Math.round(v * 10) / 10

function segmento(i: number, lado: 'esq' | 'dir') {
  const t0 = i / 4, t1 = (i + 1) / 4
  const pts = (a: number, b: number, topo: boolean) => {
    const out: string[] = []
    for (let k = 0; k <= 12; k++) {
      const t = a + (b - a) * (k / 12)
      const x = X0 + (XN - X0) * t
      const y = CY + (topo ? -1 : 1) * meia(t)
      out.push(`${r1(lado === 'esq' ? x : W - x)},${r1(y)}`)
    }
    return out
  }
  const topo = pts(t0, t1, true)
  const baixo = pts(t1, t0, false)
  return `M${topo.join(' L')} L${baixo.join(' L')} Z`
}
// centro horizontal de cada segmento (para a etiqueta)
const centroX = (i: number, lado: 'esq' | 'dir') => {
  const x = X0 + (XN - X0) * ((i + 0.5) / 4)
  return r1(lado === 'esq' ? x : W - x)
}

export default function FunilCrescimento() {
  const [sel, setSel] = useState(1)
  const fase = FASES.find(f => f.n === sel)!
  const est = ESTADOS[fase.estado]

  return (
    <div className="fc">
      <style>{CSS}</style>

      <div className="fc-wrap">
        <Link href="/secao/490653af-115b-4a9b-9d88-902c1a60f9c1" className="btn-ghost">‹&nbsp; Voltar ao menu</Link>

        {/* Cabeçalho */}
        <header className="fc-head sobe">
          <p className="eyebrow">Estratégia · Crescimento</p>
          <h1>Funil de <em>crescimento</em></h1>
          <p className="lead fc-lead">
            Um casamento compra-se uma vez, mas um casal feliz traz outros. À esquerda conquistamos o casal até ao contrato.
            No centro está a experiência que lhe damos. À direita, essa experiência transforma-se em recomendações e em novos casais.
          </p>
        </header>

        {/* Gravata-borboleta */}
        <section className="fc-gravata sobe" style={{ animationDelay: '.15s' }}>
          <div className="fc-lados">
            <span>Conquistar o casal</span>
            <span>Fazer crescer</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="fc-svg" role="group" aria-label="Fases do funil de crescimento">
            <defs>
              <radialGradient id="fcNo" cx="50%" cy="45%" r="60%">
                <stop offset="0%" stopColor="#2a2219" />
                <stop offset="100%" stopColor="#120f0b" />
              </radialGradient>
            </defs>

            {FASES.map(f => {
              // i conta da ponta (0) para o nó (3): à direita a fase 5 fica junto ao nó
              const i = f.lado === 'esq' ? f.n - 1 : 8 - f.n
              // Mais intenso junto ao nó, como na gravata original
              const perto = i
              const on = f.n === sel
              return (
                <g key={f.n} className={`fc-seg${on ? ' on' : ''}`} onClick={() => setSel(f.n)}
                  role="button" tabIndex={0} aria-pressed={on} aria-label={`${f.n}. ${f.nome}`}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(f.n) } }}>
                  <path d={segmento(i, f.lado)}
                    fill={on ? 'rgba(216,190,147,.30)' : `rgba(216,190,147,${(0.05 + perto * 0.035).toFixed(3)})`}
                    stroke={on ? '#d8be93' : 'rgba(216,190,147,.28)'} strokeWidth={on ? 1.6 : 1} />
                  <text x={centroX(i, f.lado)} y={CY} className="fc-seg-t"
                    transform={`rotate(-90 ${centroX(i, f.lado)} ${CY})`} textAnchor="middle" dominantBaseline="middle">
                    {f.nome}
                  </text>
                  <text x={centroX(i, f.lado)} y={r1(CY - meia((i + 0.5) / 4) - 16)} className="fc-seg-n" textAnchor="middle">
                    {String(f.n).padStart(2, '0')}
                  </text>
                  <circle cx={centroX(i, f.lado)} cy={r1(CY + meia((i + 0.5) / 4) + 16)} r={3.4} fill={ESTADOS[f.estado].cor} />
                </g>
              )
            })}

            {/* Nó: a experiência do cliente */}
            <g>
              <circle cx={CX} cy={CY} r={70} fill="url(#fcNo)" stroke="#d8be93" strokeWidth={1.2} />
              <circle cx={CX} cy={CY} r={82} fill="none" stroke="rgba(216,190,147,.45)" strokeWidth={1} strokeDasharray="3 6" className="fc-orbita" />
              <text x={CX} y={CY - 14} textAnchor="middle" className="fc-no-t1">A experiência</text>
              <text x={CX} y={CY + 8} textAnchor="middle" className="fc-no-t2">RL</text>
              <text x={CX} y={CY + 30} textAnchor="middle" className="fc-no-t3">aprender · mudar · melhorar</text>
            </g>

            {/* Otimizar: setas por baixo */}
            <path d={`M${X0 + 20},${H - 22} Q${CX},${H + 18} ${W - X0 - 20},${H - 22}`} fill="none" stroke="rgba(216,190,147,.35)" strokeWidth={1} strokeDasharray="2 5" />
            <text x={CX} y={H - 6} textAnchor="middle" className="fc-otimizar">otimizar cada passagem</text>
          </svg>

          <div className="fc-legenda">
            {(Object.keys(ESTADOS) as Estado[]).map(k => (
              <span key={k}><i style={{ background: ESTADOS[k].cor }} />{ESTADOS[k].t}</span>
            ))}
            <span className="fc-dica">Carrega numa fase para ver o detalhe</span>
          </div>
        </section>

        {/* Fases em lista (telemóvel e navegação rápida) */}
        <nav className="fc-chips" aria-label="Fases">
          {FASES.map(f => (
            <button key={f.n} type="button" className={`pill${f.n === sel ? ' on' : ''}`} onClick={() => setSel(f.n)}>
              {String(f.n).padStart(2, '0')} {f.nome}
            </button>
          ))}
        </nav>

        {/* Detalhe da fase */}
        <section key={fase.n} className="fc-detalhe">
          <div className="fc-det-topo">
            <div>
              <p className="meta">{fase.lado === 'esq' ? 'Conquistar o casal' : 'Fazer crescer'} · {fase.en}</p>
              <h2><span className="fc-num">{String(fase.n).padStart(2, '0')}</span> {fase.nome}</h2>
              <p className="fc-obj">{fase.objetivo}</p>
            </div>
            <span className="fc-estado" style={{ color: est.cor, borderColor: est.cor }}>{est.t}</span>
          </div>

          <div className="fc-grelha">
            <div className="fc-bloco">
              <p className="flabel">Na RL</p>
              <ul>{fase.naRL.map(x => <li key={x}>{x}</li>)}</ul>
            </div>
            <div className="fc-bloco">
              <p className="flabel">O que medir</p>
              <ul>{fase.medir.map(x => <li key={x}>{x}</li>)}</ul>
            </div>
            <div className="fc-bloco">
              <p className="flabel">Ferramentas</p>
              <div className="fc-links">
                {fase.ferramentas.map(l => (
                  <Link key={l.href + l.label} href={l.href} className="fc-link">{l.label} <span>→</span></Link>
                ))}
              </div>
            </div>
          </div>

          {fase.falta && (
            <div className="fc-falta">
              <p className="flabel" style={{ color: '#e59a88' }}>Ainda falta</p>
              <ul>{fase.falta.map(x => <li key={x}>{x}</li>)}</ul>
            </div>
          )}

          <div className="fc-nav">
            <button type="button" className="btn-ghost" disabled={sel === 1} onClick={() => setSel(s => Math.max(1, s - 1))}>‹ Anterior</button>
            <button type="button" className="btn-ghost" disabled={sel === 8} onClick={() => setSel(s => Math.min(8, s + 1))}>Seguinte ›</button>
          </div>
        </section>

        {/* Próximos passos */}
        <section className="fc-passos">
          <p className="eyebrow">Próximos passos recomendados</p>
          <h2 className="fc-passos-t">Onde está o <em>crescimento</em> mais barato</h2>
          <div className="fc-passos-g">
            {PASSOS.map((p, i) => (
              <button key={p.t} type="button" className="fc-passo" onClick={() => { setSel(p.fase); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                <span className="fc-passo-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="fc-passo-t">{p.t}</span>
                <span className="fc-passo-d">{p.d}</span>
                <span className="meta">Fase {String(p.fase).padStart(2, '0')} · {FASES[p.fase - 1].nome}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

const CSS = `
.fc .fc-wrap{max-width:1180px;margin:0 auto;padding:clamp(28px,5vh,56px) clamp(16px,4vw,48px) 90px;}
.fc .fc-head{margin:clamp(28px,6vh,56px) 0 clamp(26px,4vh,40px);}
.fc .fc-head h1{font-size:clamp(42px,6vw,86px);margin-top:20px;}
.fc .fc-lead{max-width:62ch;margin-top:22px;}

.fc .fc-gravata{border:1px solid var(--line-soft);border-radius:20px;background:rgba(243,237,226,.012);padding:clamp(14px,2.4vw,30px);}
.fc .fc-lados{display:flex;justify-content:space-between;font-family:var(--fm);font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--tx-dim);padding:0 4px 6px;}
.fc .fc-svg{width:100%;height:auto;display:block;overflow:visible;}
.fc .fc-seg{cursor:pointer;outline:none;}
.fc .fc-seg path{transition:fill .35s var(--ease),stroke .35s var(--ease);}
.fc .fc-seg:hover path{fill:rgba(216,190,147,.2);stroke:rgba(216,190,147,.7);}
.fc .fc-seg:focus-visible path{stroke:#d8be93;stroke-width:2;}
.fc .fc-seg-t{font-family:var(--fs);font-weight:400;font-size:25px;letter-spacing:.04em;fill:rgba(243,237,226,.8);pointer-events:none;}
.fc .fc-seg.on .fc-seg-t{fill:#f3ede2;}
.fc .fc-seg-n{font-family:var(--fm);font-size:11px;letter-spacing:.2em;fill:rgba(216,190,147,.75);pointer-events:none;}
.fc .fc-no-t1{font-family:var(--fs);font-style:italic;font-size:17px;fill:rgba(243,237,226,.75);}
.fc .fc-no-t2{font-family:var(--fs);font-size:30px;fill:#d8be93;letter-spacing:.08em;}
.fc .fc-no-t3{font-family:var(--fm);font-size:7.5px;letter-spacing:.14em;text-transform:uppercase;fill:rgba(243,237,226,.45);}
.fc .fc-otimizar{font-family:var(--fm);font-size:10px;letter-spacing:.3em;text-transform:uppercase;fill:rgba(216,190,147,.55);}
@keyframes fcRoda{to{transform:rotate(360deg)}}
.fc .fc-orbita{transform-origin:500px 220px;animation:fcRoda 40s linear infinite;}
.fc .fc-legenda{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center;margin-top:10px;font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-dim);}
.fc .fc-legenda i{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:8px;vertical-align:middle;}
.fc .fc-dica{margin-left:auto;}

.fc .fc-chips{display:flex;flex-wrap:wrap;gap:8px;margin:26px 0 18px;}
.fc .fc-chips .pill{padding:9px 14px;}

@keyframes fcEntra{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.fc .fc-detalhe{border:1px solid rgba(216,190,147,.3);border-radius:20px;background:rgba(216,190,147,.035);padding:clamp(20px,3vw,38px);animation:fcEntra .5s var(--ease);}
.fc .fc-det-topo{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;}
.fc .fc-detalhe h2{font-size:clamp(38px,4.6vw,64px);margin-top:10px;}
.fc .fc-num{font-family:var(--fm);font-size:.28em;letter-spacing:.2em;color:var(--g);vertical-align:.9em;margin-right:.3em;}
.fc .fc-obj{font-family:var(--fs);font-style:italic;font-size:clamp(19px,1.8vw,24px);color:var(--tx-mid);margin-top:6px;}
.fc .fc-estado{flex:none;font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;border:1px solid;border-radius:30px;padding:7px 14px;}
.fc .fc-grelha{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(18px,2.4vw,34px);margin-top:clamp(22px,3vw,34px);}
.fc .fc-bloco{border-top:1px solid var(--line);padding-top:16px;}
.fc .fc-detalhe ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px;}
.fc .fc-detalhe li{position:relative;padding-left:16px;color:var(--tx-mid);font-size:14.5px;line-height:1.5;}
.fc .fc-detalhe li::before{content:"";position:absolute;left:0;top:.65em;width:6px;height:1px;background:var(--g);}
.fc .fc-links{display:flex;flex-direction:column;gap:8px;}
.fc .fc-link{display:flex;justify-content:space-between;align-items:center;gap:10px;text-decoration:none;color:var(--tx);font-family:var(--fd);font-weight:300;font-size:17px;border:1px solid var(--line-soft);border-radius:10px;padding:10px 14px;transition:.3s var(--ease);}
.fc .fc-link span{color:var(--g);transition:transform .3s var(--ease);}
.fc .fc-link:hover{border-color:var(--g);background:rgba(216,190,147,.07);}
.fc .fc-link:hover span{transform:translateX(3px);}
.fc .fc-falta{margin-top:26px;border:1px dashed rgba(229,154,136,.4);border-radius:14px;padding:16px 20px;background:rgba(229,154,136,.04);}
.fc .fc-falta li::before{background:#e59a88;}
.fc .fc-nav{display:flex;justify-content:space-between;margin-top:26px;}
.fc .fc-nav .btn-ghost:disabled{opacity:.25;cursor:default;}

.fc .fc-passos{margin-top:clamp(50px,8vh,80px);}
.fc .fc-passos-t{font-size:clamp(32px,3.8vw,52px);margin:18px 0 26px;}
.fc .fc-passos-g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;}
.fc .fc-passo{text-align:left;display:flex;flex-direction:column;gap:12px;border:1px solid var(--line-soft);border-radius:16px;padding:22px;background:rgba(243,237,226,.015);cursor:pointer;transition:.4s var(--ease);color:inherit;font:inherit;}
.fc .fc-passo:hover{border-color:rgba(216,190,147,.55);background:rgba(216,190,147,.05);transform:translateY(-2px);}
.fc .fc-passo-n{font-family:var(--fm);font-size:10px;letter-spacing:.28em;color:var(--g);}
.fc .fc-passo-t{font-family:var(--fs);font-weight:300;font-size:28px;line-height:1.1;color:var(--tx);}
.fc .fc-passo-d{color:var(--tx-mid);font-size:14px;line-height:1.6;flex:1;}

@media (max-width:860px){
  .fc .fc-grelha,.fc .fc-passos-g{grid-template-columns:1fr;}
  .fc .fc-seg-t{font-size:30px;}
  .fc .fc-dica{display:none;}
}
@media (prefers-reduced-motion:reduce){
  .fc .fc-orbita,.fc .fc-detalhe{animation:none;}
}
`
