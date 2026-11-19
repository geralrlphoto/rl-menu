'use client'

import { useEffect, useMemo, useState } from 'react'
import { PLANO, POSTS, STORIES, type Post } from './_data/plano'

// Séries que se publicam como colaboração com a conta da empresa
const COLAB = ['Para noivos', 'Contador 2027', 'Mesmos Noivos, 3 Editores', 'Telemóvel vs. Cinema']
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const D = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)) }
const iso = (d: Date) => d.toISOString().slice(0, 10)
const CHAVE = 'rl-instagram-publicados'

export default function PlanoClient() {
  const [feitos, setFeitos] = useState<Record<string, boolean>>({})
  const [filtro, setFiltro] = useState<string | null>(null)
  const [hoje, setHoje] = useState('')
  const [copiado, setCopiado] = useState('')

  useEffect(() => {
    try { setFeitos(JSON.parse(localStorage.getItem(CHAVE) || '{}')) } catch {}
    const n = new Date(); setHoje(iso(new Date(n.getTime() - n.getTimezoneOffset() * 60000)))
  }, [])
  const marca = (data: string, v: boolean) => {
    const f = { ...feitos, [data]: v }; setFeitos(f)
    try { localStorage.setItem(CHAVE, JSON.stringify(f)) } catch {}
  }
  const copiar = async (p: Post) => {
    try { await navigator.clipboard.writeText(p.legenda); setCopiado(p.data) } catch { setCopiado('erro') }
    setTimeout(() => setCopiado(''), 1500)
  }
  const ir = (data: string) => document.getElementById('p' + data)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const proximo = POSTS.find(p => hoje && p.data >= hoje)
  const lista = POSTS.filter(p => !filtro || (filtro.startsWith('f:') ? p.apareces === filtro.slice(2) : p.tipo === filtro))
  const resumo: [number, string][] = [
    [POSTS.length, 'publicações'], [POSTS.filter(p => p.tipo === 'reel').length, 'reels'],
    [POSTS.filter(p => p.tipo === 'carrossel').length, 'carrosséis'], [POSTS.filter(p => p.tipo === 'foto').length, 'fotos'],
    [POSTS.filter(p => p.apareces === 'a falar').length, 'em que falas para a câmara'], [Object.values(feitos).filter(Boolean).length, 'já publicadas'],
  ]

  // calendário por semanas (segunda a domingo), com separador de mês
  const celulas = useMemo(() => {
    const byData = Object.fromEntries(POSTS.map(p => [p.data, p]))
    const out: ({ tipo: 'mes'; m: number } | { tipo: 'vazio' } | { tipo: 'dia'; data: string; p?: Post })[] = []
    let cur = D(PLANO.inicio); const fim = D(PLANO.fim); let mes = -1
    while (cur <= fim) {
      if (cur.getUTCMonth() !== mes) {
        if (mes !== -1) { const ult = out.filter(c => c.tipo !== 'mes').length % 7; for (let k = ult ? 7 - ult : 0; k > 0; k--) out.push({ tipo: 'vazio' }) }
        mes = cur.getUTCMonth(); out.push({ tipo: 'mes', m: mes })
        for (let k = 0; k < (cur.getUTCDay() + 6) % 7; k++) out.push({ tipo: 'vazio' })
      }
      const k = iso(cur); out.push({ tipo: 'dia', data: k, p: byData[k] })
      cur = new Date(cur.getTime() + 864e5)
    }
    return out
  }, [])

  return (
    <div className="ig">
      <p className="ig-lead">{PLANO.ideia}</p>

      {proximo && (
        <button className="ig-hoje" onClick={() => ir(proximo.data)}>
          <span className="ig-hoje-k">{proximo.data === hoje ? 'HOJE' : 'PRÓXIMO'}</span>
          <span><b>{D(proximo.data).getUTCDate()} {MESES[D(proximo.data).getUTCMonth()]}</b> · {proximo.tipo} · {proximo.titulo}{proximo.pronto && <b> · já está feito</b>}</span>
        </button>
      )}

      <div className="ig-resumo">{resumo.map(([n, t]) => <div key={t}><b>{n}</b><span>{t}</span></div>)}</div>
      <p className="ig-legenda-tipos"><b>a falar</b> = cara e voz · <b>voz off</b> = só a tua voz · <b>não</b> = só imagens e texto · <b>em foto</b> = numa fotografia · <b>colab</b> = publicar em colaboração com @rlphoto_fotografia.video</p>

      <h2 className="ig-h2">dias de <b>gravação</b></h2>
      <div className="ig-grav">{PLANO.gravacoes.map(([q, o]) => <div key={q}><b>{q}</b><span>{o}</span></div>)}</div>

      <h2 className="ig-h2">o <b>calendário</b></h2>
      <div className="ig-cal">
        {['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map(d => <div key={d} className="ig-cal-h">{d}</div>)}
        {celulas.map((c, i) => c.tipo === 'mes' ? <div key={i} className="ig-cal-mes">{MESES[c.m]}</div>
          : c.tipo === 'vazio' ? <div key={i} className="ig-d vazio" />
          : <div key={i} className={`ig-d ${c.p ? 'post' : ''} ${c.data === hoje ? 'hj' : ''} ${c.p && feitos[c.data] ? 'feito' : ''}`} onClick={() => c.p && ir(c.data)}>
              <span className="n">{D(c.data).getUTCDate()}</span>
              {c.p && <><span className="ic">{c.p.tipo}</span><span className="ti">{c.p.titulo}</span></>}
            </div>)}
      </div>

      <h2 className="ig-h2">cada <b>publicação</b></h2>
      <div className="ig-filtros">
        {([[null, 'tudo'], ['reel', 'reels'], ['carrossel', 'carrosséis'], ['foto', 'fotos'], ['f:a falar', 'em que falo'], ['f:voz off', 'voz off'], ['f:não', 'sem aparecer']] as [string | null, string][]).map(([k, t]) =>
          <button key={t} className={filtro === k ? 'on' : ''} onClick={() => setFiltro(k)}>{t}</button>)}
      </div>

      {lista.map(p => {
        const d = D(p.data)
        return (
          <article key={p.data} id={'p' + p.data} className={`ig-post ${feitos[p.data] ? 'feito' : ''}`}>
            <div className="ig-data"><b>{d.getUTCDate()}</b><span>{SEMANA[d.getUTCDay()]} · {MESES[d.getUTCMonth()].slice(0, 3)}</span></div>
            <div>
              <div className="ig-tags">
                <span className="t tipo">{p.tipo}</span>
                <span className="t ap">{p.apareces === 'não' ? 'não apareces' : p.apareces}</span>
                <span className="t">{p.serie}{p.ep ? ' · ' + p.ep : ''}</span>
                <span className="t">{p.duracao}</span>
                {COLAB.includes(p.serie) && <span className="t colab">colab</span>}
                {p.pronto && <span className="t ok">pronto</span>}
              </div>
              <h3>{p.titulo}</h3>
              <p className="ig-gancho">{p.gancho}</p>
              <div className="ig-bloco"><h5>{p.tipo === 'carrossel' ? 'slides' : p.tipo === 'foto' ? 'texto' : 'o que dizes / o que se vê'}</h5><ol>{p.guiao.map((g, i) => <li key={i}>{g}</li>)}</ol></div>
              {p.ficheiros && (
                <div className="ig-bloco"><h5>imagens prontas</h5>
                  <div className="ig-fich">{p.ficheiros.map((f, i) => <a key={f} href={f} download><img src={f} alt={`slide ${i + 1}`} /></a>)}</div>
                </div>
              )}
              <div className="ig-duas">
                <div className="ig-bloco"><h5>imagem</h5><p>{p.visual}</p></div>
                <div className="ig-bloco"><h5>stories do dia</h5><p>{p.stories}</p></div>
              </div>
              <div className="ig-bloco"><h5>legenda</h5>
                <div className="ig-leg"><button onClick={() => copiar(p)}>{copiado === p.data ? 'copiado' : 'copiar'}</button>{p.legenda}</div>
              </div>
              <div className="ig-duas">
                <div className="ig-bloco"><h5>fecho</h5><p>{p.cta}</p></div>
                {p.nota && <div className="ig-bloco"><h5>nota</h5><p>{p.nota}</p></div>}
              </div>
              <label className="ig-feito"><input type="checkbox" checked={!!feitos[p.data]} onChange={e => marca(p.data, e.target.checked)} /> publicado</label>
            </div>
          </article>
        )
      })}

      <h2 className="ig-h2"><b>stories</b> fixas da semana</h2>
      <div className="ig-grav">{STORIES.map(([q, o]) => <div key={q}><b>{q}</b><span>{o}</span></div>)}</div>

      <style>{`
        .ig{--gold:#C9A84C;--ink:#efe7d6;--mut:#9a8f7e;--card:#141210;--card2:#1c1712;--line:rgba(201,168,76,.18);
          max-width:1080px;margin:0 auto;padding:10px clamp(20px,4vw,48px) 90px;color:var(--ink);font-family:'Hanken Grotesk',system-ui,sans-serif}
        .ig *{box-sizing:border-box}
        .ig-lead{color:var(--mut);font-size:15px;line-height:1.7;max-width:760px;margin:0 0 18px}
        .ig-hoje{width:100%;display:flex;gap:16px;align-items:center;text-align:left;background:linear-gradient(135deg,#2e2416,#141210);border:1px solid var(--gold);border-radius:14px;padding:14px 18px;color:var(--ink);font:inherit;font-size:15px;cursor:pointer;margin-bottom:18px}
        .ig-hoje b{color:var(--gold)} .ig-hoje-k{font-size:12px;letter-spacing:.18em;color:var(--gold);font-weight:700}
        .ig-resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}
        .ig-resumo div{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
        .ig-resumo b{display:block;font-size:28px;color:var(--gold);line-height:1} .ig-resumo span{font-size:12px;color:var(--mut)}
        .ig-legenda-tipos{font-size:12px;color:var(--mut);margin:12px 0 0;line-height:1.7} .ig-legenda-tipos b{color:var(--gold)}
        .ig-h2{font-weight:300;font-size:24px;text-transform:lowercase;margin:44px 0 14px;display:flex;align-items:center;gap:14px}
        .ig-h2::after{content:"";flex:1;height:1px;background:var(--line)} .ig-h2 b{font-weight:700}
        .ig-grav{display:grid;gap:8px} .ig-grav div{background:var(--card2);border-radius:10px;padding:11px 15px;font-size:14px;display:grid;grid-template-columns:180px 1fr;gap:12px} .ig-grav b{color:var(--gold);font-weight:600}
        .ig-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
        .ig-cal-h{font-size:11px;color:var(--mut);text-align:center;text-transform:uppercase;letter-spacing:.1em}
        .ig-cal-mes{grid-column:1/-1;font-size:12px;color:var(--gold);letter-spacing:.16em;font-weight:600;margin-top:8px;text-transform:uppercase}
        .ig-d{min-height:72px;background:var(--card);border-radius:9px;padding:6px 7px;font-size:11px;color:var(--mut);position:relative}
        .ig-d.vazio{background:transparent} .ig-d.post{cursor:pointer;border:1px solid var(--line);color:var(--ink)} .ig-d.post:hover{border-color:var(--gold)}
        .ig-d.hj{box-shadow:0 0 0 2px var(--gold)} .ig-d.feito{opacity:.45}
        .ig-d .n{font-weight:700;font-size:13px} .ig-d.post .n{color:var(--gold)}
        .ig-d .ic{position:absolute;top:6px;right:7px;font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:var(--mut)}
        .ig-d .ti{display:block;margin-top:3px;line-height:1.25}
        .ig-filtros{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}
        .ig-filtros button{border:1px solid var(--line);background:transparent;color:var(--ink);border-radius:999px;padding:7px 14px;font:inherit;font-size:13px;cursor:pointer}
        .ig-filtros button.on{background:var(--gold);color:#140f08;border-color:var(--gold);font-weight:600}
        .ig-post{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;margin-bottom:14px;display:grid;grid-template-columns:90px 1fr;gap:18px;scroll-margin-top:20px}
        .ig-post.feito{opacity:.5}
        .ig-data b{display:block;font-size:40px;color:var(--gold);line-height:1;font-weight:700} .ig-data span{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.12em}
        .ig-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}
        .ig-tags .t{border-radius:999px;padding:3px 10px;background:rgba(255,255,255,.07);color:var(--mut);font-size:11px}
        .ig-tags .tipo{background:var(--gold);color:#140f08;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
        .ig-tags .ap{border:1px solid var(--gold);color:var(--gold);background:transparent}
        .ig-tags .colab{border:1px dashed var(--gold);color:var(--gold);background:transparent}
        .ig-tags .ok{background:#5d8a6a;color:#fff;font-weight:700}
        .ig-post h3{margin:2px 0 4px;font-size:22px;font-weight:700;text-transform:lowercase}
        .ig-gancho{color:var(--gold);font-size:15px;margin:0 0 6px}
        .ig-bloco{margin-top:10px} .ig-bloco h5{margin:0 0 4px;font-size:10.5px;letter-spacing:.16em;color:var(--mut);text-transform:uppercase;font-weight:600}
        .ig-bloco ol{margin:0;padding-left:20px;font-size:14px;line-height:1.55} .ig-bloco li{margin:3px 0} .ig-bloco p{margin:0;font-size:14px;line-height:1.55}
        .ig-leg{background:rgba(201,168,76,.07);border-left:2px solid var(--gold);padding:10px 80px 10px 12px;border-radius:6px;font-size:14px;position:relative}
        .ig-leg button{position:absolute;top:6px;right:8px;background:transparent;border:1px solid var(--line);color:var(--mut);border-radius:6px;font:inherit;font-size:11px;padding:2px 8px;cursor:pointer}
        .ig-fich{display:grid;grid-template-columns:repeat(8,1fr);gap:6px} .ig-fich img{width:100%;border-radius:6px;display:block}
        .ig-duas{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .ig-feito{display:flex;gap:6px;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid var(--line);font-size:12px;color:var(--mut);cursor:pointer}
        .ig-feito input{accent-color:var(--gold)}
        @media (max-width:640px){.ig-post{grid-template-columns:1fr}.ig-duas,.ig-grav div{grid-template-columns:1fr}.ig-d .ti{display:none}.ig-d{min-height:44px}.ig-fich{grid-template-columns:repeat(4,1fr)}}
      `}</style>
    </div>
  )
}
