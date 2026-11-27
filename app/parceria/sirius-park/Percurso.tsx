'use client'

// "O percurso do casal": do primeiro contacto ao dia do casamento, para a Inês ver o que acontece
// a cada casal que fecha connosco. Linha dourada que enche com o scroll, etapas que acendem,
// indicador fixo com a etapa atual e o marcador "Sirius Park" nas etapas em que o espaço entra.
import { useEffect, useRef, useState } from 'react'

type Etapa = { quando: string; t: string; d: string; itens: string[]; sirius?: string }

const ETAPAS: Etapa[] = [
  { quando: 'Dia 1', t: 'Primeiro contacto', d: 'O casal chega até nós: por recomendação do Sirius Park, pelo Instagram ou pelo Casamentos.pt.',
    itens: ['Resposta no próprio dia', 'Mensagem pessoal, nunca automática'], sirius: 'A vossa recomendação começa aqui' },
  { quando: 'No mesmo dia', t: 'Portal da reunião', d: 'Recebem um portal só deles, com um calendário para escolherem o dia e a hora da reunião.',
    itens: ['Calendário com as nossas datas livres', 'Vídeos e testemunhos de outros casais'] },
  { quando: 'Na data que escolhem', t: 'A reunião', d: 'Uma conversa para conhecer o casal e a história deles, antes de falar de pacotes.',
    itens: ['Presencial ou por videochamada', 'Sem pressão para decidir'] },
  { quando: 'Depois da reunião', t: 'Proposta à medida', d: 'A proposta aparece no portal do casal, feita a partir do que conversámos.',
    itens: ['Fotografia, vídeo ou os dois', 'Protegida por password'] },
  { quando: 'Quando decidem', t: 'Contrato e data reservada', d: 'Contrato assinado online e sinal pago: a data fica guardada para eles.',
    itens: ['Assinatura digital', 'Avisamos o Sirius Park'], sirius: 'Sabem logo que o casal fechou connosco' },
  { quando: 'A partir do contrato', t: 'Portal dos noivos', d: 'Tudo num só sítio até ao fim: contrato, pagamentos, guias, cronograma e o estado das entregas.',
    itens: ['Pagamentos com recibo', 'Guias para cada momento do dia'] },
  { quando: 'Nos meses antes', t: 'Sessão pré-wedding', d: 'Uma sessão para o casal se habituar à câmara e a nós, antes do grande dia.',
    itens: ['Local escolhido com o casal', 'Pode ser no próprio Sirius Park'], sirius: 'O espaço como cenário' },
  { quando: '15 dias antes', t: 'Briefing e reunião de preparação', d: 'Uma videochamada com o casal para fechar horários, família, momentos especiais e pedidos.',
    itens: ['Questionário de briefing', 'Lista de fotos de família'] },
  { quando: 'Na última semana', t: 'Cronograma com o espaço', d: 'O plano do dia, minuto a minuto, alinhado com a equipa do Sirius Park.',
    itens: ['Horários da cerimónia ao bolo', 'Regras da casa respeitadas'], sirius: 'Coordenação direta com a vossa equipa' },
  { quando: 'O dia', t: 'O casamento', d: 'Chegamos antes, trabalhamos em silêncio e contamos o dia do primeiro ao último minuto.',
    itens: ['Equipa pontual e discreta', 'Sneak peek em 48 horas'], sirius: 'Imagens do espaço para a vossa biblioteca' },
]

export default function Percurso() {
  const secRef = useRef<HTMLElement>(null)
  const trilhoRef = useRef<HTMLDivElement>(null)
  const nos = useRef<(HTMLDivElement | null)[]>([])
  const [prog, setProg] = useState(0)        // 0..1 da linha
  const [ativa, setAtiva] = useState(-1)     // última etapa já alcançada
  const [dentro, setDentro] = useState(false)

  useEffect(() => {
    let raf = 0
    const medir = () => {
      raf = 0
      const tr = trilhoRef.current, sec = secRef.current
      if (!tr || !sec) return
      const alvo = innerHeight * 0.55
      const r = tr.getBoundingClientRect()
      setProg(Math.max(0, Math.min(1, (alvo - r.top) / r.height)))
      let a = -1
      nos.current.forEach((n, i) => { if (n && n.getBoundingClientRect().top < alvo) a = i })
      setAtiva(a)
      const s = sec.getBoundingClientRect()
      setDentro(s.top < innerHeight * 0.4 && s.bottom > innerHeight * 0.6)
    }
    const pedir = () => { if (!raf) raf = requestAnimationFrame(medir) }
    addEventListener('scroll', pedir, { passive: true }); addEventListener('resize', pedir); medir()
    return () => { removeEventListener('scroll', pedir); removeEventListener('resize', pedir); cancelAnimationFrame(raf) }
  }, [])

  const atual = ETAPAS[Math.max(0, ativa)]

  return (
    <section id="percurso" ref={secRef} className="rlp-sec pp-ancora pc">
      <style>{PC_CSS}</style>
      <div className="rlp-wrap" style={{ maxWidth: 1100 }}>
        <div className="pp-cab">
          <span className="rlp-eyebrow">01 · O percurso</span>
          <h2 className="rlp-h2">Do primeiro contacto <em>ao grande dia</em></h2>
          <p className="rlp-lede">O que acontece a cada casal do Sirius Park que fecha connosco, etapa a etapa. Onde vê o marcador dourado, é onde o espaço entra.</p>
        </div>

        {/* indicador fixo com a etapa atual */}
        <div className={`pc-agora${dentro ? ' on' : ''}`} aria-hidden>
          <b>{String(Math.max(1, ativa + 1)).padStart(2, '0')}</b><i>/ {ETAPAS.length}</i>
          <span>{atual.t}</span>
          <div className="pc-agora-barra"><div style={{ width: `${prog * 100}%` }} /></div>
        </div>

        <div className="pc-trilho" ref={trilhoRef}>
          <div className="pc-linha" aria-hidden><div style={{ height: `${prog * 100}%` }} /></div>
          <div className="pc-casal" aria-hidden style={{ top: `${prog * 100}%` }}><span /></div>

          {ETAPAS.map((e, i) => {
            const on = i <= ativa
            return (
              <div key={e.t} ref={el => { nos.current[i] = el }} className={`pc-etapa ${i % 2 ? 'dir' : 'esq'}${on ? ' on' : ''}${i === ETAPAS.length - 1 ? ' fim' : ''}`}>
                <div className="pc-no" aria-hidden><span>{String(i + 1).padStart(2, '0')}</span></div>
                <div className="pc-card">
                  <i className="pc-num" aria-hidden>{String(i + 1).padStart(2, '0')}</i>
                  <span className="pc-quando">{e.quando}</span>
                  <h3>{e.t}</h3>
                  <p>{e.d}</p>
                  <ul>{e.itens.map(x => <li key={x}>{x}</li>)}</ul>
                  {e.sirius && <div className="pc-sirius"><span>✦</span>Sirius Park · {e.sirius}</div>}
                </div>
              </div>
            )
          })}
        </div>

        <div className={`pc-depois${ativa === ETAPAS.length - 1 ? ' on' : ''}`}>
          <span className="rlp-eyebrow c">E depois do dia</span>
          <div className="pc-depois-l">
            <div><b>48 h</b><span>Sneak peek</span></div>
            <div><b>7 dias</b><span>Galeria online</span></div>
            <div><b>Fotos e filme</b><span>Seleção, edição e entrega</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}

const PC_CSS = `
.pc{position:relative;overflow-x:clip}
.pc-agora{position:sticky;top:76px;z-index:20;margin:0 auto 10px;width:max-content;max-width:100%;display:flex;align-items:baseline;gap:10px;padding:10px 18px 14px;border-radius:999px;border:1px solid rgba(216,190,147,.3);background:rgba(11,11,11,.78);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;transform:translateY(-10px) scale(.96);transition:opacity .5s,transform .5s var(--ease);pointer-events:none;position:sticky}
.pc-agora.on{opacity:1;transform:none}
.pc-agora b{font-family:var(--fd);font-weight:200;font-size:26px;color:var(--g);line-height:1}
.pc-agora i{font-style:normal;font-size:11px;color:var(--tx-dim);letter-spacing:.1em}
.pc-agora span{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx);margin-left:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pc-agora-barra{position:absolute;left:18px;right:18px;bottom:6px;height:2px;background:var(--line-soft);border-radius:2px;overflow:hidden}
.pc-agora-barra div{height:100%;background:linear-gradient(90deg,rgba(216,190,147,.4),var(--g))}

.pc-trilho{position:relative;padding:30px 0 10px}
.pc-linha{position:absolute;left:50%;top:0;bottom:0;width:2px;transform:translateX(-50%);background:var(--line-soft)}
.pc-linha div{width:100%;background:linear-gradient(180deg,rgba(216,190,147,.2),var(--g));box-shadow:0 0 14px rgba(216,190,147,.55)}
.pc-casal{position:absolute;left:50%;width:18px;height:18px;margin:-9px 0 0 -9px;z-index:3}
.pc-casal span{display:block;width:100%;height:100%;border-radius:50%;background:var(--g);box-shadow:0 0 0 6px rgba(216,190,147,.15),0 0 26px 4px rgba(216,190,147,.6);animation:pc-pulso 2s ease-in-out infinite}
@keyframes pc-pulso{50%{box-shadow:0 0 0 12px rgba(216,190,147,.05),0 0 34px 8px rgba(216,190,147,.45)}}

.pc-etapa{position:relative;display:grid;grid-template-columns:1fr 64px 1fr;align-items:center;margin-bottom:clamp(28px,5vw,60px)}
.pc-etapa .pc-card{grid-column:1;grid-row:1}
.pc-etapa.dir .pc-card{grid-column:3}
.pc-no{grid-column:2;grid-row:1;justify-self:center;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:var(--ink);border:1px solid var(--line);z-index:2;transition:all .6s var(--ease)}
.pc-no span{font-size:11px;font-weight:600;letter-spacing:.12em;color:var(--tx-dim);transition:color .5s}
.pc-etapa.on .pc-no{border-color:var(--g);background:#1a160f;box-shadow:0 0 0 5px rgba(216,190,147,.08),0 0 22px -4px rgba(216,190,147,.7)}
.pc-etapa.on .pc-no span{color:var(--g)}
.pc-etapa.fim .pc-no{width:58px;height:58px}

.pc-card{position:relative;overflow:hidden;padding:clamp(22px,2.6vw,32px);border-radius:16px;border:1px solid var(--line-soft);background:linear-gradient(160deg,rgba(255,255,255,.03),rgba(255,255,255,.008));opacity:.22;filter:blur(1.5px) grayscale(1);transform:translateX(-36px) scale(.97);transition:opacity .8s var(--ease),transform .9s var(--ease),filter .8s,border-color .8s,box-shadow .8s}
.pc-etapa.dir .pc-card{transform:translateX(36px) scale(.97)}
.pc-etapa.on .pc-card{opacity:1;filter:none;transform:none;border-color:rgba(216,190,147,.22);box-shadow:0 30px 60px -40px rgba(0,0,0,.9),0 0 40px -26px rgba(216,190,147,.55)}
.pc-num{position:absolute;right:-6px;top:-22px;font-family:var(--fd);font-weight:100;font-style:normal;font-size:clamp(90px,11vw,150px);line-height:1;color:rgba(216,190,147,.07);transition:transform 1.2s var(--ease),color .8s;transform:translateY(20px);pointer-events:none}
.pc-etapa.on .pc-num{transform:none;color:rgba(216,190,147,.11)}
.pc-quando{position:relative;display:inline-block;font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);padding:5px 10px;border-radius:999px;border:1px solid rgba(216,190,147,.3);background:rgba(216,190,147,.05)}
.pc-card h3{position:relative;font-family:var(--fd);font-weight:300;font-size:clamp(23px,2.6vw,31px);line-height:1.15;margin:14px 0 8px;color:var(--tx)}
.pc-card p{position:relative;font-size:15.5px;line-height:1.6;color:var(--tx-mid)}
.pc-card ul{position:relative;list-style:none;padding:0;margin:14px 0 0;display:flex;flex-wrap:wrap;gap:8px}
.pc-card li{font-size:12px;letter-spacing:.04em;color:var(--tx);padding:6px 11px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid var(--line-soft);opacity:0;transform:translateY(8px);transition:opacity .5s,transform .5s var(--ease)}
.pc-etapa.on .pc-card li{opacity:1;transform:none}
.pc-etapa.on .pc-card li:nth-child(1){transition-delay:.25s}
.pc-etapa.on .pc-card li:nth-child(2){transition-delay:.4s}
.pc-sirius{position:relative;margin-top:16px;display:flex;align-items:center;gap:10px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#0b0b0b;background:linear-gradient(90deg,var(--g),#e9d6b3);padding:9px 14px;border-radius:10px;font-weight:600;opacity:0;transform:scale(.96);transition:opacity .6s .55s,transform .6s .55s var(--ease)}
.pc-sirius span{font-size:13px}
.pc-etapa.on .pc-sirius{opacity:1;transform:none}

.pc-depois{margin-top:10px;display:flex;flex-direction:column;align-items:center;gap:20px;opacity:.25;transform:translateY(20px);transition:opacity .9s,transform .9s var(--ease)}
.pc-depois.on{opacity:1;transform:none}
.pc-depois-l{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line-soft);border:1px solid var(--line-soft);border-radius:14px;overflow:hidden;width:100%;max-width:760px}
.pc-depois-l div{background:var(--ink);padding:22px 16px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
.pc-depois-l b{font-family:var(--fd);font-weight:200;font-size:clamp(22px,3vw,34px);color:var(--g)}
.pc-depois-l span{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-dim)}

@media(max-width:760px){
  .pc-linha,.pc-casal{left:22px}
  .pc-etapa{grid-template-columns:44px 1fr;gap:12px}
  .pc-etapa .pc-card,.pc-etapa.dir .pc-card{grid-column:2;transform:translateX(24px)}
  .pc-etapa.on .pc-card{transform:none}
  .pc-no{grid-column:1;width:40px;height:40px;justify-self:start;margin-left:2px}
  .pc-etapa.fim .pc-no{width:44px;height:44px;margin-left:0}
  .pc-agora{top:64px}
  .pc-agora span{max-width:52vw}
  .pc-depois-l{grid-template-columns:1fr}
}
@media(prefers-reduced-motion:reduce){.pc-card,.pc-card li,.pc-sirius,.pc-num{transition:none}.pc-casal span{animation:none}}
`
