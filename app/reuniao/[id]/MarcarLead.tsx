'use client'

import { CSS_BRIEFING } from '@/app/_briefing/estilo'
import MarcarReuniao, { CSS_MARCAR } from '@/app/rollup/MarcarReuniao'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export default function MarcarLead({ leadId, nome, dataCasamento, reuniaoData, reuniaoHora }: {
  leadId: string; nome: string; dataCasamento: string; reuniaoData: string; reuniaoHora: string
}) {
  const hoje = new Date().toISOString().slice(0, 10)
  const jaMarcada = reuniaoData && reuniaoData >= hoje && reuniaoHora
  const x = reuniaoData ? new Date(reuniaoData + 'T12:00:00') : null

  return (
    <main className="nlead ru" style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      <style>{CSS_BRIEFING + CSS_MARCAR + CSS}</style>
      <div className="fx-grain" aria-hidden="true" />
      <div className="ml">
        <img src="/portal-noivos/mono-gold.png" alt="RL Photo.Video" className="ml-logo" />
        <p className="eyebrow">Marcar reunião</p>
        <h1>Vamos <em>conversar</em>{nome ? <>,<br />{nome}</> : null}</h1>
        <p className="ml-txt">Escolham o dia e a hora que vos dá mais jeito. Conversamos sobre o vosso dia, sem compromisso.</p>
        {jaMarcada && x && (
          <p className="ml-ja">Já têm reunião marcada para {x.getDate()} de {MESES[x.getMonth()]} às {reuniaoHora}. Só precisam de escolher outro horário se quiserem alterar.</p>
        )}
        <MarcarReuniao dataCasamento={dataCasamento} leadId={leadId} />
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
.ru .ml-ja{font-family:var(--fd);font-size:14px;line-height:1.6;color:var(--g);text-align:center;margin:18px 0 0;padding:12px 14px;border:1px solid rgba(216,190,147,.35);border-radius:12px;}
.ru .ml .mr-btn{margin-top:32px;}
.ru .ml-fim{text-align:center;margin-top:40px;}
`
