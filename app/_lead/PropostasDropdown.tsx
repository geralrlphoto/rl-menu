'use client'

import { useMemo, useState } from 'react'
import { DETALHES_PROPOSTAS, nomePropostaPadrao, propostaVisivel } from '@/lib/crm'

/* A proposta no portal da reunião (/r casamento, /b batizado), em vez do PDF:
   desdobra-se para baixo com as 3 propostas do CRM (page_content.propostas),
   cada uma com uma frase a explicá-la (as notas da proposta ou um texto por defeito),
   o que inclui (fotografia / vídeo) ao tocar
   e os extras que somam ao total. */

type Proposta = { nome: string; servicos_foto: string[]; servicos_video: string[]; valor: string; notas?: string; ativa?: boolean }
type Extra = { nome: string; valor: string }

// Texto por defeito quando a proposta não tem notas nem detalhes em DETALHES_PROPOSTAS
const EXPLICACAO = [
  'Fotografia e filme, com a nossa qualidade no vosso dia.',
  'O equilíbrio entre fotografia e filme, para reviverem o dia de várias formas.',
  'A experiência completa: cada detalhe e cada emoção, do primeiro ao último momento.',
]

const num = (v: string) => { const n = Number(String(v ?? '').replace(/[^\d,]/g, '').replace(',', '.')); return isFinite(n) ? n : 0 }
const euros = (n: number) => `${n.toLocaleString('pt-PT', { maximumFractionDigits: 0 })} €`
const mostraValor = (v: string) => num(v) > 0 ? euros(num(v)) : (v || 'Sob consulta')

export default function PropostasDropdown({ aberto, propostas, extras, ativa, tipo, token, isAdmin }: {
  aberto: boolean; propostas: Proposta[]; extras: Extra[]; ativa: number; pdfUrl: string | null; tipo: 'casamento' | 'batizado'
  token: string; isAdmin: boolean
}) {
  const lista = useMemo(() => propostas
    .map((p, i) => ({ ...p, i }))
    .filter(p => propostaVisivel(p, p.i))
    .filter(p => p.valor || p.servicos_foto?.length || p.servicos_video?.length), [propostas])
  const [detalhe, setDetalhe] = useState<number | null>(null)
  const [escolhida, setEscolhida] = useState<number | null>(null)
  const [extrasOn, setExtrasOn] = useState<string[]>([])
  const [aEnviar, setAEnviar] = useState(false)

  // "A nossa escolha": regista a escolha (CRM "Fechou", email ao admin, tarefa de WhatsApp
  // no calendário) e segue para o formulário do contrato. Em modo admin só marca no ecrã.
  async function escolher(i: number, nome: string) {
    setEscolhida(i)
    if (isAdmin || aEnviar) return
    setAEnviar(true)
    try {
      await fetch(tipo === 'batizado' ? '/api/batizado/proposta-response' : '/api/lead-page/proposta-response', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'confirmar', proposta: nome }),
      })
    } catch { /* segue para o contrato na mesma */ }
    window.location.href = `/contrato-cps/${tipo}`
  }
  const somaExtras = extras.filter(e => extrasOn.includes(e.nome)).reduce((a, e) => a + num(e.valor), 0)

  if (!lista.length) return null

  return (
    <div className={`pd${aberto ? ' on' : ''}`} id="sec-propostas" aria-hidden={!aberto}>
      <style>{CSS}</style>
      <div className="pd-in">
        <div className="pd-wrap">
          <div className="pd-cab">
            <span className="rlp-eyebrow c">A vossa proposta</span>
            <h2 className="rlp-h2" style={{ marginTop: 16, textAlign: 'center' }}>
              {lista.length === 1 ? 'A forma de ' : `${lista.length === 2 ? 'Duas' : lista.length === 3 ? 'Três' : 'Quatro'} formas de `}<em>contar o vosso {tipo === 'batizado' ? 'batizado' : 'dia'}</em>
            </h2>
            <p className="pd-lede">Pensadas para vós depois da nossa conversa. Toquem numa proposta para ver tudo o que inclui.</p>
          </div>

          <div className={`pd-grid n${lista.length}`}>
            {lista.map((p, k) => {
              const top = p.i === ativa
              const aberta = detalhe === p.i
              const sel = escolhida === p.i
              const base = num(p.valor)
              const nome = p.nome || nomePropostaPadrao(p.i)
              const det = DETALHES_PROPOSTAS[nome.trim().toUpperCase()]
              return (
                <article key={p.i} className={`pd-card${top ? ' top' : ''}${sel ? ' sel' : ''}`} style={{ animationDelay: `${aberto ? 150 + k * 120 : 0}ms` }}>
                  <span className="pd-n">Proposta {String(k + 1).padStart(2, '0')}</span>
                  <h3 className="pd-nome">{nome}</h3>
                  <p className="pd-exp">{p.notas?.trim() || det?.explicacao || EXPLICACAO[p.i] || EXPLICACAO[0]}</p>
                  {det?.oferta && <p className="pd-oferta"><b>✦ Oferta</b>{det.oferta}</p>}

                  <div className="pd-valor">
                    <b>{base > 0 && somaExtras > 0 ? euros(base + somaExtras) : mostraValor(p.valor)}</b>
                    {base > 0 && somaExtras > 0 && <small>{euros(base)} + extras</small>}
                  </div>

                  <button type="button" className={`pd-ver${aberta ? ' on' : ''}`} onClick={() => setDetalhe(aberta ? null : p.i)} aria-expanded={aberta}>
                    {aberta ? 'Esconder' : 'Ver o que inclui'} <span>⌄</span>
                  </button>
                  <div className={`pd-inclui${aberta ? ' on' : ''}`}>
                    <div>
                      {!!p.servicos_foto?.length && (<>
                        <p className="pd-sub">Fotografia</p>
                        <ul>{p.servicos_foto.map(s => <li key={s}>{s}</li>)}</ul>
                      </>)}
                      {!!p.servicos_video?.length && (<>
                        <p className="pd-sub">Filme</p>
                        <ul>{p.servicos_video.map(s => <li key={s}>{s}</li>)}</ul>
                      </>)}
                    </div>
                  </div>

                  <button type="button" className={`pd-escolher${sel ? ' on' : ''}`} onClick={() => escolher(p.i, nome)} disabled={aEnviar}>
                    {sel ? (aEnviar ? 'A seguir para o contrato…' : '✓ A nossa escolha') : 'A nossa escolha'}
                  </button>
                </article>
              )
            })}
          </div>

          {extras.length > 0 && (
            <div className="pd-extras">
              <p className="pd-sub" style={{ textAlign: 'center' }}>Podem juntar a qualquer proposta</p>
              <div className="pd-chips">
                {extras.map(e => {
                  const on = extrasOn.includes(e.nome)
                  return (
                    <button key={e.nome} type="button" className={on ? 'on' : ''} onClick={() => setExtrasOn(l => on ? l.filter(x => x !== e.nome) : [...l, e.nome])}>
                      {on ? '✓ ' : '+ '}{e.nome}{num(e.valor) > 0 && <span>{euros(num(e.valor))}</span>}
                    </button>
                  )
                })}
              </div>
              {somaExtras > 0 && <p className="pd-nota">Os valores acima já incluem os extras escolhidos.</p>}
            </div>
          )}

          {escolhida !== null && (
            <p className="pd-fim">{isAdmin ? 'Modo admin: a escolha não é gravada nem abre o contrato.' : 'Ótima escolha. Vamos ao contrato.'}</p>
          )}
        </div>
      </div>
    </div>
  )
}

const CSS = `
.pd{display:grid;grid-template-rows:0fr;transition:grid-template-rows .8s cubic-bezier(.2,.7,.2,1);}
.pd.on{grid-template-rows:1fr;}
.pd-in{overflow:hidden;}
.pd-wrap{max-width:1080px;margin:0 auto;padding:clamp(40px,7vh,80px) var(--pad,20px) clamp(50px,8vh,90px);opacity:0;transform:translateY(-16px);transition:opacity .6s ease .15s,transform .8s cubic-bezier(.2,.7,.2,1);}
.pd.on .pd-wrap{opacity:1;transform:none;}
.pd-cab{display:flex;flex-direction:column;align-items:center;margin-bottom:40px;}
.pd-lede{margin-top:14px;text-align:center;color:var(--tx-mid);font-size:15px;line-height:1.7;max-width:48ch;}
.pd-grid{display:grid;gap:18px;align-items:start;}
.pd-grid.n3{grid-template-columns:repeat(3,1fr);}
.pd-grid.n4{grid-template-columns:repeat(2,minmax(0,380px));justify-content:center;}
.pd-grid.n2{grid-template-columns:repeat(2,minmax(0,380px));justify-content:center;}
.pd-grid.n1{grid-template-columns:minmax(0,420px);justify-content:center;}
.pd-card{position:relative;display:flex;flex-direction:column;padding:34px 26px 24px;border-radius:20px;border:1px solid var(--line);background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01));transition:transform .5s cubic-bezier(.2,.7,.2,1),border-color .4s ease,box-shadow .5s ease;}
.pd.on .pd-card{animation:pdSobe .8s cubic-bezier(.2,.7,.2,1) backwards;}
.pd-card:hover{transform:translateY(-4px);border-color:rgba(216,190,147,.35);}
.pd-card.top{border-color:rgba(216,190,147,.55);background:radial-gradient(120% 90% at 50% 0%,rgba(216,190,147,.13),transparent 60%),rgba(255,255,255,.02);box-shadow:0 30px 70px -35px rgba(216,190,147,.5);}
@media (min-width:861px){.pd-grid.n3 .pd-card.top{transform:translateY(-14px);} .pd-grid.n3 .pd-card.top:hover{transform:translateY(-18px);}}
.pd-card.sel{border-color:var(--g);}
.pd-n{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--g);}
.pd-nome{font-family:'Cormorant Garamond',serif;font-weight:300;font-size:clamp(30px,3vw,38px);line-height:1.05;color:var(--tx,#f3ede2);margin:10px 0 0;}
.pd-exp{margin:12px 0 0;color:var(--tx-mid);font-size:14.5px;line-height:1.65;min-height:3.3em;}
.pd-oferta{margin:16px 0 0;padding:12px 14px;border-radius:12px;border:1px dashed rgba(216,190,147,.55);background:rgba(216,190,147,.08);color:var(--tx,#f3ede2);font-size:14px;line-height:1.55;}
.pd-oferta b{display:block;margin-bottom:4px;font-family:'Space Mono',monospace;font-weight:400;font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);}
.pd-valor{margin-top:20px;padding-top:18px;border-top:1px solid var(--line-soft);}
.pd-valor b{display:block;font-family:'Cormorant Garamond',serif;font-weight:400;font-size:40px;line-height:1;color:var(--g);}
.pd-valor small{display:block;margin-top:6px;font-size:12px;color:var(--tx-dim);}
.pd-ver{margin-top:18px;display:flex;align-items:center;justify-content:space-between;width:100%;padding:12px 0;background:none;border:none;border-top:1px solid var(--line-soft);cursor:pointer;color:var(--tx,#f3ede2);font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;}
.pd-ver span{color:var(--g);font-size:16px;transition:transform .4s ease;}
.pd-ver.on span{transform:rotate(180deg);}
.pd-inclui{display:grid;grid-template-rows:0fr;transition:grid-template-rows .5s cubic-bezier(.2,.7,.2,1);}
.pd-inclui.on{grid-template-rows:1fr;}
.pd-inclui > div{overflow:hidden;}
.pd-sub{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--tx-dim);margin:14px 0 8px;}
.pd-inclui ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px;}
.pd-inclui li{position:relative;padding-left:20px;font-size:14px;line-height:1.5;color:var(--tx-mid);}
.pd-inclui li::before{content:"";position:absolute;left:0;top:.55em;width:9px;height:1px;background:var(--g);}
.pd-escolher{margin-top:20px;padding:13px;border-radius:12px;border:1px solid rgba(216,190,147,.45);background:transparent;color:var(--g);cursor:pointer;font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;transition:all .3s ease;}
.pd-escolher:hover{background:rgba(216,190,147,.08);}
.pd-escolher.on{background:var(--g);color:#0b0a08;}
.pd-extras{margin-top:40px;}
.pd-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;}
.pd-chips button{display:inline-flex;align-items:center;gap:8px;padding:10px 15px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--tx-mid);font-size:14px;cursor:pointer;transition:all .25s ease;}
.pd-chips button span{color:var(--tx-dim);font-size:12.5px;}
.pd-chips button.on{border-color:var(--g);background:rgba(216,190,147,.12);color:var(--g);}
.pd-chips button.on span{color:var(--g);}
.pd-nota{text-align:center;margin-top:12px;font-size:12.5px;color:var(--tx-dim);}
.pd-fim{text-align:center;margin-top:34px;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:22px;color:var(--g);animation:pdSobe .6s ease both;}
@keyframes pdSobe{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@media (max-width:860px){
  .pd-grid.n4,.pd-grid.n3,.pd-grid.n2{grid-template-columns:1fr;gap:26px;}
  .pd-card.top{order:-1;}
}
@media (prefers-reduced-motion:reduce){.pd,.pd-wrap,.pd-card,.pd-inclui{transition:none!important;animation:none!important;}}
`
