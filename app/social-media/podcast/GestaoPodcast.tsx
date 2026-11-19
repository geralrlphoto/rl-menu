'use client'

import { useEffect, useMemo, useState } from 'react'
import { MODELOS, textoModelo, numeroWhatsapp, type ChaveModelo } from '@/lib/podcast/mensagens'

/* ============================================================
   Painel de gestão do Antes do Sim (topo de /social-media/podcast).

   Por episódio: convidado e contactos, marcação da gravação, estado
   e links do vídeo, e as mensagens do convite já preenchidas, com
   registo do que foi enviado (podcast_mensagens).

   Uma leitura (/api/podcast-gestao) ao abrir a página. Sem polling.
   As mensagens nunca saem sozinhas: abrem o WhatsApp, o email ou vão
   para a área de transferência, e só aí ficam registadas.
   ============================================================ */

type Convidado = { id: string; nome: string; email: string | null; telefone: string | null; instagram: string | null; profissao: string | null; empresa: string | null; bio?: string | null; foto_url?: string | null; website?: string | null; publicar_perfil?: boolean }
type Msg = { id: string; episodio_id: string; convidado_id: string | null; modelo: string; canal: string; enviado_em: string }
type Ep = {
  id: string; numero: number; slug: string; titulo: string; subtitulo: string | null; estado: string
  data_publicacao: string | null; gravacao_data: string | null; gravacao_hora: string | null; gravacao_local: string | null
  video_estado: string; video_bruto_url: string | null; youtube_id: string | null
  convidados: Convidado[]; potenciais: number; mensagens: Msg[]
}

const ESTADOS_VIDEO = [
  { v: 'por_gravar', t: 'Por gravar' },
  { v: 'gravado', t: 'Gravado' },
  { v: 'em_edicao', t: 'Em edição' },
  { v: 'pronto', t: 'Pronto' },
  { v: 'publicado', t: 'Publicado' },
]
const CANAL = { whatsapp: 'WhatsApp', email: 'Email', copiado: 'Copiado' } as Record<string, string>
const LINK_APRESENTACAO = 'https://portal.rlphotovideo.pt/podcast/apresentacao'

function dataCurta(iso?: string | null) {
  if (!iso) return null
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso)
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}
function dataHora(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

export default function GestaoPodcast() {
  const [eps, setEps] = useState<Ep[] | null>(null)
  const [cand, setCand] = useState({ total: 0, novas: 0 })
  const [erro, setErro] = useState<string | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    fetch('/api/podcast-gestao')
      .then(r => r.json())
      .then(j => {
        if (j.error) throw new Error(j.error)
        setEps(j.episodios); setCand(j.candidaturas)
      })
      .catch(e => setErro('Não foi possível carregar: ' + (e?.message ?? 'erro')))
  }, [])

  const resumo = useMemo(() => {
    const l = eps ?? []
    return {
      convidados: l.filter(e => e.convidados.length > 0).length,
      gravados: l.filter(e => e.video_estado !== 'por_gravar').length,
      publicados: l.filter(e => e.video_estado === 'publicado').length,
      mensagens: l.reduce((n, e) => n + e.mensagens.length, 0),
      total: l.length,
    }
  }, [eps])

  async function guardar(id: string, patch: Partial<Ep>) {
    setEps(l => l?.map(e => (e.id === id ? { ...e, ...patch } : e)) ?? null)
    const r = await fetch('/api/podcast-episodios', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    })
    if (!r.ok) { const j = await r.json().catch(() => ({})); setErro(j.error ?? 'Não foi possível guardar.') }
  }

  async function registar(ep: Ep, convidado: Convidado | null, modelo: ChaveModelo, canal: string, texto: string) {
    const r = await fetch('/api/podcast-mensagens', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ episodio: ep.id, convidado: convidado?.id ?? null, modelo, canal, texto }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { setErro(j.error ?? 'Não foi possível registar a mensagem.'); return }
    setEps(l => l?.map(e => (e.id === ep.id ? { ...e, mensagens: [j.mensagem, ...e.mensagens] } : e)) ?? null)
  }

  async function apagarRegisto(ep: Ep, id: string) {
    setEps(l => l?.map(e => (e.id === ep.id ? { ...e, mensagens: e.mensagens.filter(m => m.id !== id) } : e)) ?? null)
    await fetch('/api/podcast-mensagens?id=' + id, { method: 'DELETE' })
  }

  function copiarLink() {
    navigator.clipboard?.writeText(LINK_APRESENTACAO).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1800) })
  }

  return (
    <section className="gp">
      <header className="gp-cab">
        <a className="gp-voltar" href="/social-media"><span aria-hidden="true">‹</span> Comunicação</a>
        <p className="gp-eyebrow">Podcast · Gestão</p>
        <h1 className="gp-titulo">Antes do <em>Sim</em></h1>
        <p className="gp-lede">Convidados, mensagens e gravações de cada episódio.</p>
        <div className="gp-atalhos">
          <a href="/podcast/apresentacao" target="_blank" rel="noopener">Página de apresentação ↗</a>
          <button type="button" onClick={copiarLink}>{copiado ? 'Link copiado' : 'Copiar link'}</button>
          <a href="/podcast/convidados" target="_blank" rel="noopener">Página de candidatura ↗</a>
          <a href="/social-media/podcast/candidaturas">Candidaturas{cand.novas ? <b>{cand.novas} novas</b> : null}</a>
          <a href="/social-media/podcast/episodios">Editar episódios</a>
          <a href="/social-media/podcast/leads">Leads</a>
        </div>
      </header>

      <div className="gp-resumo">
        <div><strong>{resumo.convidados}<small>/{resumo.total || 12}</small></strong><span>Com convidado</span></div>
        <div><strong>{resumo.gravados}<small>/{resumo.total || 12}</small></strong><span>Gravados</span></div>
        <div><strong>{resumo.publicados}<small>/{resumo.total || 12}</small></strong><span>Publicados</span></div>
        <div><strong>{resumo.mensagens}</strong><span>Mensagens enviadas</span></div>
      </div>

      {erro && <p className="gp-erro" role="alert">{erro} <button onClick={() => setErro(null)}>Fechar</button></p>}
      {!eps && !erro && <p className="gp-vazio">A carregar…</p>}

      {eps && (
        <ul className="gp-lista">
          {eps.map(ep => (
            <Linha key={ep.id} ep={ep} aberto={aberto === ep.id}
              alternar={() => setAberto(a => (a === ep.id ? null : ep.id))}
              guardar={patch => guardar(ep.id, patch)}
              registar={(c, m, canal, t) => registar(ep, c, m, canal, t)}
              apagarRegisto={id => apagarRegisto(ep, id)} />
          ))}
        </ul>
      )}

      <style>{CSS}</style>
    </section>
  )
}

function Linha({ ep, aberto, alternar, guardar, registar, apagarRegisto }: {
  ep: Ep; aberto: boolean; alternar: () => void
  guardar: (p: Partial<Ep>) => void
  registar: (c: Convidado | null, m: ChaveModelo, canal: string, texto: string) => void
  apagarRegisto: (id: string) => void
}) {
  const conv = ep.convidados
  const estado = ESTADOS_VIDEO.find(s => s.v === ep.video_estado)
  const gData = dataCurta(ep.gravacao_data)
  return (
    <li className={'gp-ep' + (aberto ? ' is-aberto' : '')}>
      <button type="button" className="gp-ep-cab" onClick={alternar} aria-expanded={aberto}>
        <span className="gp-n">{String(ep.numero).padStart(2, '0')}</span>
        <span className="gp-ep-t">
          <b>{ep.titulo}</b>
          <small>{conv.length ? conv.map(c => c.nome).join(', ') : (ep.subtitulo ?? 'Sem convidado') + (ep.potenciais ? ` · ${ep.potenciais} potenciais` : '')}</small>
        </span>
        <span className="gp-ep-meta">
          <span className={'gp-tag' + (conv.length ? ' is-ok' : '')}>{conv.length ? 'Convidado' : 'Por convidar'}</span>
          <span className="gp-tag">{gData ? 'Grava ' + gData : 'Sem data'}</span>
          <span className={'gp-tag gp-v-' + ep.video_estado}>{estado?.t}</span>
          <span className="gp-tag">{ep.mensagens.length} msg</span>
        </span>
        <span className="gp-mais" aria-hidden="true" />
      </button>
      {aberto && <Detalhe ep={ep} guardar={guardar} registar={registar} apagarRegisto={apagarRegisto} />}
    </li>
  )
}

function Detalhe({ ep, guardar, registar, apagarRegisto }: {
  ep: Ep
  guardar: (p: Partial<Ep>) => void
  registar: (c: Convidado | null, m: ChaveModelo, canal: string, texto: string) => void
  apagarRegisto: (id: string) => void
}) {
  const [convId, setConvId] = useState(ep.convidados[0]?.id ?? '')
  const conv = ep.convidados.find(c => c.id === convId) ?? null
  const [modelo, setModelo] = useState<ChaveModelo | null>(null)

  const dados = {
    nome: conv?.nome, tema: ep.titulo, dataPublicacao: ep.data_publicacao,
    gravacaoData: ep.gravacao_data, gravacaoHora: ep.gravacao_hora, gravacaoLocal: ep.gravacao_local,
    linkEpisodio: `https://portal.rlphotovideo.pt/podcast/${ep.slug}`,
    linkYoutube: ep.youtube_id ? `https://youtu.be/${ep.youtube_id}` : null,
  }

  return (
    <div className="gp-det">
      {/* Convidado */}
      <div className="gp-bloco">
        <h3>Convidado</h3>
        {ep.convidados.length === 0 ? (
          <p className="gp-nota">Ainda sem convidado ligado{ep.potenciais ? `, ${ep.potenciais} potenciais na lista` : ''}. Acrescenta-o no plano em baixo (abre o episódio) ou em Editar episódios.</p>
        ) : (
          <>
            {ep.convidados.length > 1 && (
              <select className="gp-input" value={convId} onChange={e => setConvId(e.target.value)}>
                {ep.convidados.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            )}
            {conv && (
              <dl className="gp-dl">
                <dt>Nome</dt><dd>{conv.nome}</dd>
                {(conv.profissao || conv.empresa) && <><dt>Trabalho</dt><dd>{[conv.profissao, conv.empresa].filter(Boolean).join(' · ')}</dd></>}
                <dt>Telefone</dt><dd>{conv.telefone || '—'}</dd>
                <dt>Email</dt><dd>{conv.email || '—'}</dd>
                <dt>Instagram</dt><dd>{conv.instagram || '—'}</dd>
              </dl>
            )}
            {conv && <PerfilPublico key={conv.id} conv={conv} />}
          </>
        )}
      </div>

      {/* Gravação e vídeo */}
      <div className="gp-bloco">
        <h3>Gravação e vídeo</h3>
        <div className="gp-grelha">
          <label>Data<input className="gp-input" type="date" defaultValue={ep.gravacao_data ?? ''} onBlur={e => e.target.value !== (ep.gravacao_data ?? '') && guardar({ gravacao_data: e.target.value || null })} /></label>
          <label>Hora<input className="gp-input" type="time" defaultValue={ep.gravacao_hora ?? ''} onBlur={e => e.target.value !== (ep.gravacao_hora ?? '') && guardar({ gravacao_hora: e.target.value || null })} /></label>
        </div>
        <label>Local<input className="gp-input" defaultValue={ep.gravacao_local ?? ''} placeholder="Morada da gravação" onBlur={e => e.target.value !== (ep.gravacao_local ?? '') && guardar({ gravacao_local: e.target.value || null })} /></label>
        <p className="gp-sub">Estado do vídeo</p>
        <div className="gp-estados">
          {ESTADOS_VIDEO.map(s => (
            <button key={s.v} type="button" className={'gp-estado' + (ep.video_estado === s.v ? ' is-on' : '')} onClick={() => guardar({ video_estado: s.v })}>{s.t}</button>
          ))}
        </div>
        <label>Ficheiro gravado (Drive, WeTransfer, disco)
          <span className="gp-linha">
            <input className="gp-input" defaultValue={ep.video_bruto_url ?? ''} placeholder="Link ou caminho do ficheiro" onBlur={e => e.target.value !== (ep.video_bruto_url ?? '') && guardar({ video_bruto_url: e.target.value || null })} />
            {ep.video_bruto_url?.startsWith('http') && <a href={ep.video_bruto_url} target="_blank" rel="noopener">Abrir ↗</a>}
          </span>
        </label>
        <label>YouTube (ID do vídeo)
          <span className="gp-linha">
            <input className="gp-input" defaultValue={ep.youtube_id ?? ''} placeholder="ex.: dQw4w9WgXcQ" onBlur={e => e.target.value !== (ep.youtube_id ?? '') && guardar({ youtube_id: e.target.value || null })} />
            {ep.youtube_id && <a href={`https://youtu.be/${ep.youtube_id}`} target="_blank" rel="noopener">Ver ↗</a>}
          </span>
        </label>
      </div>

      {/* Mensagens */}
      <div className="gp-bloco gp-msgs">
        <h3>Mensagens</h3>
        <ul className="gp-modelos">
          {MODELOS.map(m => {
            const ultimo = ep.mensagens.find(x => x.modelo === m.chave)
            return (
              <li key={m.chave}>
                <button type="button" className={'gp-modelo' + (modelo === m.chave ? ' is-on' : '') + (ultimo ? ' is-enviado' : '')} onClick={() => setModelo(x => (x === m.chave ? null : m.chave))}>
                  <span>{m.titulo}<small>{m.quando}</small></span>
                  <em>{ultimo ? `${CANAL[ultimo.canal]} · ${dataHora(ultimo.enviado_em)}` : 'Por enviar'}</em>
                </button>
                {modelo === m.chave && <Envio chave={m.chave} dados={dados} conv={conv} registar={(canal, t) => registar(conv, m.chave, canal, t)} />}
              </li>
            )
          })}
        </ul>
        {ep.mensagens.length > 0 && (
          <>
            <p className="gp-sub">Histórico</p>
            <ul className="gp-hist">
              {ep.mensagens.map(x => (
                <li key={x.id}>
                  <span>{dataHora(x.enviado_em)}</span>
                  <b>{MODELOS.find(m => m.chave === x.modelo)?.titulo ?? x.modelo}</b>
                  <span>{CANAL[x.canal]}{x.convidado_id ? ' · ' + (ep.convidados.find(c => c.id === x.convidado_id)?.nome ?? '') : ''}</span>
                  <button type="button" onClick={() => apagarRegisto(x.id)} title="Apagar registo">✕</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

/* Interruptor "mostrar na página dos convidados" (/podcast/apresentacao/convidados). */
function PerfilPublico({ conv }: { conv: Convidado }) {
  const [on, setOn] = useState(!!conv.publicar_perfil)
  const [erro, setErro] = useState<string | null>(null)
  const falta = [!conv.foto_url && 'foto', !conv.bio && 'texto', !conv.instagram && !conv.website && 'redes'].filter(Boolean) as string[]
  async function mudar() {
    const novo = !on; setOn(novo); setErro(null)
    const r = await fetch('/api/podcast-convidados', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: conv.id, publicar_perfil: novo }) })
    if (!r.ok) { setOn(!novo); setErro('Não foi possível guardar.') }
  }
  return (
    <div className="gp-perfil">
      <button type="button" className={'gp-estado' + (on ? ' is-on' : '')} onClick={mudar}>{on ? 'Na página dos convidados' : 'Mostrar na página dos convidados'}</button>
      {falta.length > 0 && <p className="gp-falta">Falta na ficha: {falta.join(', ')}. Edita em <a href="/social-media/podcast/episodios">Editar episódios</a>.</p>}
      {on && <a className="gp-ver" href="/podcast/apresentacao/convidados" target="_blank" rel="noopener">Ver página ↗</a>}
      {erro && <p className="gp-falta">{erro}</p>}
    </div>
  )
}

function Envio({ chave, dados, conv, registar }: {
  chave: ChaveModelo
  dados: Parameters<typeof textoModelo>[1]
  conv: Convidado | null
  registar: (canal: string, texto: string) => void
}) {
  const base = textoModelo(chave, dados)
  const [texto, setTexto] = useState(base.texto)
  const [aviso, setAviso] = useState<string | null>(null)
  const wa = numeroWhatsapp(conv?.telefone)
  const faltam = (texto.match(/\[[^\]]+\]/g) ?? []).length

  function copiar() {
    navigator.clipboard?.writeText((base.assunto ? `Assunto: ${base.assunto}\n\n` : '') + texto)
      .then(() => { registar('copiado', texto); setAviso('Copiado e registado.') })
  }
  function whatsapp() {
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
    registar('whatsapp', texto); setAviso('WhatsApp aberto e registado.')
  }
  function email() {
    window.location.href = `mailto:${conv?.email}?subject=${encodeURIComponent(base.assunto ?? 'Podcast Antes do Sim')}&body=${encodeURIComponent(texto)}`
    registar('email', texto); setAviso('Email aberto e registado.')
  }

  return (
    <div className="gp-envio">
      {base.assunto && <p className="gp-assunto">Assunto: {base.assunto}</p>}
      <textarea className="gp-input" rows={Math.min(16, texto.split('\n').length + 2)} value={texto} onChange={e => setTexto(e.target.value)} />
      {faltam > 0 && <p className="gp-falta">{faltam} {faltam === 1 ? 'campo' : 'campos'} entre [ ] por preencher.</p>}
      <div className="gp-botoes">
        <button type="button" onClick={copiar}>Copiar</button>
        <button type="button" onClick={whatsapp} disabled={!wa} title={wa ? '' : 'O convidado não tem telefone'}>WhatsApp</button>
        <button type="button" onClick={email} disabled={!conv?.email} title={conv?.email ? '' : 'O convidado não tem email'}>Email</button>
        {aviso && <span>{aviso}</span>}
      </div>
    </div>
  )
}

const CSS = `
.gp{--g:#d8be93;--bg:#0b0a08;--bg2:#13110d;--bg3:#1a1712;--tx:rgba(243,237,226,.92);--txm:rgba(243,237,226,.62);--txd:rgba(243,237,226,.4);
  --ln:rgba(243,237,226,.12);--lns:rgba(243,237,226,.07);--fs:'Cormorant Garamond',serif;--fm:'Space Mono',monospace;--fb:'Hanken Grotesk',sans-serif;
  max-width:1180px;margin:0 auto;padding:28px clamp(16px,4vw,48px) 64px;color:var(--tx);font-family:var(--fb);font-weight:300}
.gp *{box-sizing:border-box}
.gp :where(button){font:inherit;cursor:pointer}
.gp-cab{padding:12px 0 36px;border-bottom:1px solid var(--ln)}
.gp-voltar{display:inline-flex;gap:8px;font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--txm);border:1px solid var(--ln);border-radius:40px;padding:8px 14px}
.gp-voltar:hover{color:var(--g);border-color:var(--g)}
.gp-eyebrow{font-family:var(--fm);font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);margin-top:36px}
.gp .gp-titulo{font-family:var(--fs);font-weight:300;font-size:clamp(52px,8vw,104px);line-height:.95;letter-spacing:-.01em;margin-top:12px}
.gp .gp-titulo em{font-style:italic;color:var(--g)}
.gp-lede{color:var(--txm);font-size:17px;margin-top:14px}
.gp-atalhos{display:flex;flex-wrap:wrap;gap:8px;margin-top:26px}
.gp-atalhos a,.gp-atalhos button{display:inline-flex;align-items:center;gap:8px;font-family:var(--fm);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx);background:transparent;border:1px solid var(--ln);border-radius:40px;padding:10px 16px;transition:all .3s}
.gp-atalhos a:hover,.gp-atalhos button:hover{border-color:var(--g);color:var(--g)}
.gp-atalhos a:first-child{background:var(--g);border-color:var(--g);color:var(--bg)}
.gp-atalhos b{font-weight:400;background:var(--g);color:var(--bg);border-radius:20px;padding:2px 8px}
.gp-resumo{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--ln)}
.gp-resumo div{padding:26px 18px 24px 0;border-right:1px solid var(--lns)}
.gp-resumo div+div{padding-left:18px}.gp-resumo div:last-child{border-right:0}
.gp-resumo strong{display:block;font-family:var(--fs);font-weight:300;font-size:46px;line-height:1;color:var(--g)}
.gp-resumo strong small{font-size:20px;color:var(--txd)}
.gp-resumo span{display:block;margin-top:8px;font-family:var(--fm);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--txd)}
.gp-erro{margin-top:18px;padding:12px 16px;border:1px solid rgba(220,80,80,.35);color:#e8a1a1;font-size:14px}
.gp-erro button{margin-left:10px;background:none;border:0;color:inherit;text-decoration:underline}
.gp-vazio{margin-top:24px;color:var(--txm)}
.gp-lista{list-style:none;margin-top:28px;border-top:1px solid var(--ln)}
.gp-ep{border-bottom:1px solid var(--ln)}
.gp-ep.is-aberto{background:linear-gradient(90deg,rgba(216,190,147,.05),transparent 80%)}
.gp-ep-cab{width:100%;display:grid;grid-template-columns:56px 1fr auto 34px;align-items:center;gap:18px;padding:18px 6px;background:none;border:0;color:inherit;text-align:left}
.gp-n{font-family:var(--fs);font-size:36px;font-weight:300;line-height:1;color:var(--txd)}
.gp-ep.is-aberto .gp-n,.gp-ep-cab:hover .gp-n{color:var(--g)}
.gp-ep-t b{display:block;font-family:var(--fs);font-weight:400;font-size:22px;line-height:1.2}
.gp-ep-t small{display:block;margin-top:4px;font-size:13px;color:var(--txm)}
.gp-ep-meta{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;max-width:420px}
.gp-tag{font-family:var(--fm);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--txm);border:1px solid var(--ln);border-radius:30px;padding:5px 10px;white-space:nowrap}
.gp-tag.is-ok{color:var(--g);border-color:rgba(216,190,147,.5)}
.gp-v-gravado,.gp-v-em_edicao{color:#e3c27a;border-color:rgba(227,194,122,.45)}
.gp-v-pronto{color:#a8dcb0;border-color:rgba(120,200,140,.45)}
.gp-v-publicado{color:var(--bg);background:var(--g);border-color:var(--g)}
.gp-mais{width:34px;height:34px;border:1px solid var(--ln);border-radius:50%;position:relative}
.gp-mais::before,.gp-mais::after{content:"";position:absolute;left:50%;top:50%;width:11px;height:1px;background:var(--tx);transform:translate(-50%,-50%)}
.gp-mais::after{transform:translate(-50%,-50%) rotate(90deg);transition:transform .3s}
.gp-ep.is-aberto .gp-mais{background:var(--g);border-color:var(--g)}
.gp-ep.is-aberto .gp-mais::before,.gp-ep.is-aberto .gp-mais::after{background:var(--bg)}
.gp-ep.is-aberto .gp-mais::after{transform:translate(-50%,-50%)}
.gp-det{display:grid;grid-template-columns:.8fr 1fr 1.3fr;gap:16px;padding:6px 6px 28px 80px}
.gp-bloco{border:1px solid var(--ln);background:var(--bg2);padding:20px}
.gp .gp-bloco h3{font-family:var(--fm);font-weight:400;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--g);margin-bottom:14px}
.gp-nota{font-size:14px;color:var(--txm);line-height:1.6}
.gp-dl{display:grid;grid-template-columns:auto 1fr;gap:8px 14px;font-size:14px}
.gp-dl dt{font-family:var(--fm);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--txd);padding-top:3px}
.gp-dl dd{color:var(--tx);word-break:break-word}
.gp-bloco label{display:flex;flex-direction:column;gap:6px;font-family:var(--fm);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--txd);margin-bottom:12px}
.gp-grelha{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.gp-input{width:100%;font-family:var(--fb);font-size:14px;letter-spacing:0;text-transform:none;color:var(--tx);background:rgba(0,0,0,.35);border:1px solid var(--ln);padding:10px 12px;border-radius:0}
.gp-input:focus{outline:none;border-color:var(--g)}
textarea.gp-input{resize:vertical;line-height:1.6}
.gp-linha{display:flex;gap:8px;align-items:center}
.gp-linha a{font-family:var(--fm);font-size:10px;color:var(--g);white-space:nowrap}
.gp-sub{font-family:var(--fm);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--txd);margin:4px 0 8px}
.gp-estados{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.gp-estado{font-family:var(--fm);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--txm);background:none;border:1px solid var(--ln);border-radius:30px;padding:7px 11px}
.gp-estado:hover{border-color:var(--g);color:var(--g)}
.gp-estado.is-on{background:var(--g);border-color:var(--g);color:var(--bg)}
.gp-perfil{margin-top:16px;padding-top:14px;border-top:1px solid var(--lns);display:flex;flex-direction:column;align-items:flex-start;gap:8px}
.gp-perfil a{color:var(--g)}
.gp-ver{font-family:var(--fm);font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.gp-modelos{list-style:none;display:flex;flex-direction:column;gap:6px}
.gp-modelo{width:100%;display:flex;justify-content:space-between;align-items:center;gap:10px;text-align:left;background:var(--bg3);border:1px solid var(--lns);color:var(--tx);padding:10px 12px}
.gp-modelo:hover,.gp-modelo.is-on{border-color:rgba(216,190,147,.5)}
.gp-modelo span{font-size:14px}
.gp-modelo small{display:block;font-family:var(--fm);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--txd);margin-top:2px}
.gp-modelo em{font-style:normal;font-family:var(--fm);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--txd);white-space:nowrap}
.gp-modelo.is-enviado em{color:#a8dcb0}
.gp-envio{border:1px solid rgba(216,190,147,.3);border-top:0;padding:12px;background:rgba(0,0,0,.25)}
.gp-assunto{font-size:13px;color:var(--txm);margin-bottom:8px}
.gp-falta{font-size:12px;color:#e3c27a;margin-top:6px}
.gp-botoes{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px}
.gp-botoes button{font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--bg);background:var(--g);border:1px solid var(--g);border-radius:30px;padding:9px 14px}
.gp-botoes button:disabled{opacity:.35;cursor:not-allowed}
.gp-botoes span{font-size:12px;color:#a8dcb0}
.gp-hist{list-style:none;font-size:13px}
.gp-hist li{display:grid;grid-template-columns:auto 1fr auto auto;gap:10px;align-items:center;padding:7px 0;border-top:1px solid var(--lns);color:var(--txm)}
.gp-hist b{font-weight:400;color:var(--tx)}
.gp-hist button{background:none;border:0;color:var(--txd)}
.gp-hist button:hover{color:#e8a1a1}
@media(max-width:1000px){.gp-det{grid-template-columns:1fr 1fr;padding-left:6px}.gp-msgs{grid-column:1/-1}}
@media(max-width:720px){
  .gp-resumo{grid-template-columns:1fr 1fr}.gp-resumo div{border-bottom:1px solid var(--lns)}.gp-resumo div:nth-child(3){padding-left:0}
  .gp-ep-cab{grid-template-columns:40px 1fr 30px;gap:12px}.gp-n{font-size:28px}
  .gp-ep-meta{grid-column:2/4;grid-row:2;justify-content:flex-start}.gp-mais{grid-column:3;grid-row:1;width:30px;height:30px}
  .gp-det{grid-template-columns:1fr}
}
`
