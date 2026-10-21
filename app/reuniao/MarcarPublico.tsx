'use client'

import { useState } from 'react'
import { CSS_BRIEFING } from '@/app/_briefing/estilo'
import MarcarReuniao, { CSS_MARCAR } from '@/app/rollup/MarcarReuniao'

/* Marcação pública: o calendário aparece logo aberto; a data do casamento é opcional. */
export default function MarcarPublico() {
  const [dataCasamento, setDataCasamento] = useState('')
  return (
    <main className="nlead ru" style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      <style>{CSS_BRIEFING + CSS_MARCAR + CSS}</style>
      <div className="fx-grain" aria-hidden="true" />
      <div className="ml">
        <img src="/portal-noivos/mono-gold.png" alt="RL Photo.Video" className="ml-logo" />
        <p className="eyebrow">Marcar reunião</p>
        <h1>Vamos <em>conversar</em></h1>
        <p className="ml-txt">Escolham o dia e a hora que vos dá mais jeito. Conversamos sobre o vosso dia, sem compromisso.</p>
        <label className="ml-data">
          <span>Data do casamento <i>(se já tiverem)</i></span>
          <input type="date" value={dataCasamento} onChange={e => setDataCasamento(e.target.value)} className="finput" />
        </label>
        <MarcarReuniao dataCasamento={dataCasamento} origem="link" abertoInicial />
        <p className="hint ml-fim">RL Photo &middot; Video &middot; Wedding Moments</p>
      </div>
    </main>
  )
}

const CSS = `
.ru .ml{position:relative;max-width:520px;margin:0 auto;padding:56px 16px 48px;}
.ru .ml-logo{display:block;width:56px;margin:0 auto 28px;opacity:.9;}
.ru .ml .eyebrow{text-align:center;}
.ru .ml h1{font-family:var(--fs);font-weight:300;font-size:40px;line-height:1.15;color:var(--tx);text-align:center;margin:12px 0 0;}
.ru .ml h1 em{font-style:italic;color:var(--g);}
.ru .ml-txt{font-family:var(--fd);font-size:16px;line-height:1.7;color:var(--tx-mid);text-align:center;margin:18px 0 0;}
.ru .ml-data{display:block;margin:28px 0 0;}
.ru .ml-data span{display:block;font-family:var(--fm);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);margin-bottom:8px;}
.ru .ml-data i{font-style:normal;color:var(--tx-dim);}
.ru .ml .mr-btn{margin-top:28px;}
.ru .ml-fim{text-align:center;margin-top:40px;}
`
