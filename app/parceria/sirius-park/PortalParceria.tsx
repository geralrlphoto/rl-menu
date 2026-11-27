'use client'

// Portal de parceria RL × Sirius Park (ver page.tsx). Tema RL dos portais (RLP_CSS) + estilos próprios (PP_CSS).
import { useEffect, useMemo, useRef, useState } from 'react'
import { RLP_CSS } from '@/app/_lead/rlpCss'
import { supabase } from '@/lib/supabase'
import type { Casamento, DadosPortal, EstadoMood, ItemBib, ItemMood } from './dados'
import { estadoMood, gravarCasamento, juntarBiblioteca, juntarMood, prepararEnvio, tirarBiblioteca, tirarCasamento, tirarMood } from './acoes'

const NOME = 'Inês'
const ESPACO = 'Sirius Park'
const WHATSAPP_RL = 'https://wa.me/351912932768'
const wa = (msg: string) => `${WHATSAPP_RL}?text=${encodeURIComponent(msg)}`

// Fotos do espaço (casamentos.pt do Sirius Park, guardadas no bucket parcerias/sirius-park/espaco)
const HERO = [2, 7, 1, 6, 3]
const FAIXA = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const dataPT = (d: string) => { const [a, m, dia] = d.split('-').map(Number); return `${dia} ${MESES[m - 1]} ${a}` }
const hoje = () => new Date().toISOString().slice(0, 10)
const diasAte = (d: string) => Math.round((new Date(`${d}T12:00:00`).getTime() - Date.now()) / 86400000)

const ESTADOS: { v: EstadoMood; l: string }[] = [
  { v: 'novo', l: 'Recebido' }, { v: 'visto', l: 'Visto pela RL' }, { v: 'producao', l: 'Em produção' }, { v: 'feito', l: 'Feito' },
]

// vimeo.com/<id>[/<hash>] ou youtube → leitor embebido
function player(u: string) {
  const v = u.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([0-9a-f]+))?/i)
  if (v) return `https://player.vimeo.com/video/${v[1]}?${v[2] ? `h=${v[2]}&` : ''}title=0&byline=0&portrait=0&dnt=1`
  const y = u.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/)
  if (y) return `https://www.youtube.com/embed/${y[1]}`
  return null
}
const dominio = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u } }

function FadeIn({ children, delay = 0, className = '', style = {} }: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } }, { threshold: 0.08 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={className} style={{ ...style, opacity: v ? 1 : 0, transform: v ? 'none' : 'translateY(22px)',
      transition: `opacity .8s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .8s cubic-bezier(.22,1,.36,1) ${delay}ms` }}>
      {children}
    </div>
  )
}

// Número que sobe quando entra no ecrã
function Conta({ v }: { v: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      const t0 = performance.now()
      const passo = (t: number) => { const p = Math.min(1, (t - t0) / 1200); setN(Math.round(v * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(passo) }
      requestAnimationFrame(passo)
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [v])
  return <span ref={ref}>{n}</span>
}

async function enviar(f: File, pasta: 'biblioteca' | 'moodboard') {
  const s = await prepararEnvio(f.name, pasta)
  if (!s) throw new Error('sem acesso')
  const { error } = await supabase.storage.from('parcerias').uploadToSignedUrl(s.path, s.token, f, { contentType: f.type || 'application/octet-stream' })
  if (error) throw error
  return s.url
}

export default function PortalParceria({ dados: inicial, admin, fotosEspaco }: { dados: DadosPortal; admin: boolean; fotosEspaco: string }) {
  const [dados, setDados] = useState(inicial)
  const foto = (n: number) => `${fotosEspaco}sirius-${n}.jpg`
  const atualizar = (d: DadosPortal | null) => { if (d) setDados(d); else alert('Não foi possível gravar. Tente outra vez.') }

  // barra + progresso
  useEffect(() => {
    const onScroll = () => {
      const st = window.scrollY
      const h = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const prog = document.getElementById('rlp-prog')
      if (prog) prog.style.width = `${h > 0 ? (st / h) * 100 : 0}%`
      document.getElementById('rlp-bar')?.classList.toggle('s', st > 40)
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll()
    return () => removeEventListener('scroll', onScroll)
  }, [])

  // capa com fotos a passar
  const [h, setH] = useState(0)
  useEffect(() => { const t = setInterval(() => setH(v => (v + 1) % HERO.length), 6000); return () => clearInterval(t) }, [])

  return (
    <div className="rl-portal pp min-h-screen">
      <style>{RLP_CSS}</style>
      <style>{PP_CSS}</style>
      <div className="rlp-vig" aria-hidden />
      <div id="rlp-prog" className="rlp-prog" aria-hidden />

      <header id="rlp-bar" className="rlp-bar" style={{ top: 0 }}>
        <a href="/parceria/sirius-park" className="rlp-mono" aria-label="RL Photo · Video"><span>RL</span><i>× {ESPACO}</i></a>
        <nav className="pp-nav">
          <a href="#numeros">Números</a><a href="#biblioteca">Biblioteca</a><a href="#moodboard">Mood board</a>
        </nav>
      </header>

      {/* ── CAPA ── */}
      <section className="pp-hero">
        {HERO.map((n, i) => (
          <div key={n} className={`pp-hero-img${i === h ? ' on' : ''}`} style={{ backgroundImage: `url(${foto(n)})` }} aria-hidden />
        ))}
        <div className="pp-hero-veu" aria-hidden />
        <div className="rlp-wrap pp-hero-in">
          <FadeIn delay={80}><span className="rlp-eyebrow">Portal de parceria · {ESPACO}</span></FadeIn>
          <FadeIn delay={220}>
            <h1 className="rlp-h1 pp-h1">{ESPACO} <em>×</em><br />RL Photo · Video</h1>
          </FadeIn>
          <FadeIn delay={380}>
            <p className="rlp-ed pp-ola"><em>Olá, {NOME}.</em> Tudo o que fazemos juntos, num só sítio.</p>
          </FadeIn>
          <FadeIn delay={520} className="pp-atalhos">
            <a href="#numeros"><b>{dados.casamentos.length}</b><span>Casamentos connosco</span></a>
            <a href="#biblioteca"><b>{dados.biblioteca.length}</b><span>Ficheiros na biblioteca</span></a>
            <a href="#moodboard"><b>{dados.moodboard.length}</b><span>Referências enviadas</span></a>
          </FadeIn>
        </div>
        <div className="pp-hero-pontos" aria-hidden>{HERO.map((n, i) => <i key={n} className={i === h ? 'on' : ''} />)}</div>
      </section>

      {/* ── FAIXA DE FOTOS ── */}
      <div className="pp-faixa" aria-hidden>
        <div className="pp-faixa-in">
          {[...FAIXA, ...FAIXA].map((n, i) => <img key={i} src={foto(n)} alt="" loading="lazy" />)}
        </div>
      </div>

      <Numeros casamentos={dados.casamentos} admin={admin} atualizar={atualizar} />
      <div className="rlp-div" />
      <Biblioteca itens={dados.biblioteca} admin={admin} atualizar={atualizar} fotoVazia={foto} />
      <div className="rlp-div" />
      <MoodBoard itens={dados.moodboard} admin={admin} atualizar={atualizar} />

      {/* ── FOOTER ── */}
      <footer className="rlp-foot">
        <div className="rlp-wrap">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.5fr_1fr_1fr] md:gap-8">
            <FadeIn>
              <h2 className="rlp-h2" style={{ fontSize: 'clamp(28px,3.4vw,44px)', maxWidth: '16ch' }}>Juntos, cada casamento <em>conta</em></h2>
              <a href={wa(`Olá Rui! Sou a ${NOME} do ${ESPACO}.`)} target="_blank" rel="noopener noreferrer" className="rlp-btn" style={{ marginTop: 28 }}><span className="fill" /><span className="dot" />Falar connosco</a>
            </FadeIn>
            <FadeIn delay={100} className="flex flex-col gap-3">
              <h5>Contactos</h5>
              <a href="mailto:geral.rlphoto@gmail.com">geral.rlphoto@gmail.com</a>
              <a href="tel:+351912932768">912 932 768</a>
              <span style={{ color: 'var(--tx-mid)' }}>Pinhal Novo, Palmela</span>
            </FadeIn>
            <FadeIn delay={180} className="flex flex-col gap-3">
              <h5>Também aqui</h5>
              <a href="/parceria/sirius-park/apresentacao">A nossa apresentação</a>
              <a href="https://www.instagram.com/rlphoto_fotografia.video/" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://rlphotovideo.pt" target="_blank" rel="noopener noreferrer">rlphotovideo.pt</a>
            </FadeIn>
          </div>
        </div>
        <div className="end"><span>© RL Photo · Video</span><span>registamos com foco na verdade</span></div>
      </footer>

      <a href={wa(`Olá Rui! Sou a ${NOME} do ${ESPACO} e estou no portal da parceria.`)} target="_blank" rel="noopener noreferrer" className="rlp-wa" aria-label="WhatsApp">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0012.05 0zm0 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 5.45 0 9.884 4.434 9.881 9.892-.003 5.45-4.437 9.884-9.885 9.884zm5.422-7.403c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
      </a>
    </div>
  )
}

type Atualizar = (d: DadosPortal | null) => void

/* ───────────────────────── NÚMEROS ───────────────────────── */
function Numeros({ casamentos, admin, atualizar }: { casamentos: Casamento[]; admin: boolean; atualizar: Atualizar }) {
  const lista = useMemo(() => [...casamentos].sort((a, b) => a.data.localeCompare(b.data)), [casamentos])
  const ano = new Date().getFullYear()
  const h = hoje()
  const realizados = lista.filter(c => c.data < h).length
  const proximo = lista.find(c => c.data >= h)
  const convidados = lista.reduce((s, c) => s + (c.convidados ?? 0), 0)
  const kpis = [
    { v: lista.length, l: 'Casamentos fechados connosco' },
    { v: lista.filter(c => c.data.startsWith(String(ano + 1))).length, l: `Em ${ano + 1}` },
    { v: realizados, l: 'Já realizados' },
    convidados ? { v: convidados, l: 'Convidados no espaço' } : { v: lista.filter(c => c.data.startsWith(String(ano + 2))).length, l: `Em ${ano + 2}` },
  ]
  const [novo, setNovo] = useState({ noivos: '', data: '', convidados: '' })
  const [aGravar, setAGravar] = useState(false)
  const juntar = async (e: React.FormEvent) => {
    e.preventDefault()
    setAGravar(true)
    atualizar(await gravarCasamento({ noivos: novo.noivos, data: novo.data, convidados: Number(novo.convidados) || undefined }))
    setNovo({ noivos: '', data: '', convidados: '' }); setAGravar(false)
  }

  return (
    <section id="numeros" className="rlp-sec pp-ancora">
      <div className="rlp-wrap" style={{ maxWidth: 1100 }}>
        <FadeIn className="pp-cab">
          <span className="rlp-eyebrow">01 · Números</span>
          <h2 className="rlp-h2">Os casais que fecham <em>connosco</em></h2>
          <p className="rlp-lede">Cada casal do {ESPACO} que escolhe a RL aparece aqui, com a data do casamento. Atualizamos sempre que um contrato fecha.</p>
        </FadeIn>

        <div className="pp-kpis">
          {kpis.map((k, i) => (
            <FadeIn key={k.l} delay={i * 90} className="pp-kpi">
              <b><Conta v={k.v} /></b><span>{k.l}</span>
            </FadeIn>
          ))}
        </div>

        {proximo && (
          <FadeIn className="pp-prox">
            <span className="rlp-eyebrow">Próximo casamento</span>
            <p><em>{proximo.noivos}</em> · {dataPT(proximo.data)}</p>
            <b>{diasAte(proximo.data) === 0 ? 'É hoje' : `daqui a ${diasAte(proximo.data)} dias`}</b>
          </FadeIn>
        )}

        <FadeIn className="pp-lista">
          {lista.length === 0 && (
            <div className="pp-vazio">
              <p className="rlp-ed"><em>Ainda sem casamentos fechados.</em></p>
              <p className="rlp-lede">Assim que o primeiro casal do {ESPACO} fechar connosco, aparece aqui.</p>
            </div>
          )}
          {lista.map((c, i) => {
            const feito = c.data < h
            return (
              <div key={c.id} className="pp-linha">
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <span className="d">{dataPT(c.data)}</span>
                <span className="nm">{c.noivos}</span>
                <span className="cv">{c.convidados ? `${c.convidados} convidados` : ''}</span>
                <span className={`pp-tag${feito ? ' ok' : ''}`}>{feito ? 'Realizado' : 'Fechado'}</span>
                {admin && <button className="pp-x" aria-label="Tirar" onClick={async () => { if (confirm(`Tirar ${c.noivos}?`)) atualizar(await tirarCasamento(c.id)) }}>×</button>}
              </div>
            )
          })}
          {admin && (
            <form onSubmit={juntar} className="pp-form-linha">
              <span className="pp-admin">Só a RL vê</span>
              <input required placeholder="Noivos (ex. Ana e Mário)" value={novo.noivos} onChange={e => setNovo({ ...novo, noivos: e.target.value })} />
              <input required type="date" value={novo.data} onChange={e => setNovo({ ...novo, data: e.target.value })} />
              <input type="number" min={0} placeholder="Convidados" value={novo.convidados} onChange={e => setNovo({ ...novo, convidados: e.target.value })} />
              <button className="rlp-btn" disabled={aGravar}><span className="fill" /><span className="dot" />{aGravar ? 'A gravar…' : 'Juntar casamento'}</button>
            </form>
          )}
        </FadeIn>
      </div>
    </section>
  )
}

/* ───────────────────────── BIBLIOTECA ───────────────────────── */
function Biblioteca({ itens, admin, atualizar, fotoVazia }: { itens: ItemBib[]; admin: boolean; atualizar: Atualizar; fotoVazia: (n: number) => string }) {
  const [filtro, setFiltro] = useState<'todos' | 'foto' | 'video'>('todos')
  const [aberto, setAberto] = useState<ItemBib | null>(null)
  const [aEnviar, setAEnviar] = useState('')
  const [link, setLink] = useState('')
  const vistos = itens.filter(i => filtro === 'todos' || i.tipo === filtro)
  const nFotos = itens.filter(i => i.tipo === 'foto').length

  useEffect(() => {
    if (!aberto) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(null) }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [aberto])

  const carregar = async (fs: FileList | null) => {
    if (!fs?.length) return
    const novos: Omit<ItemBib, 'id' | 'criado'>[] = []
    try {
      for (let i = 0; i < fs.length; i++) {
        setAEnviar(`A enviar ${i + 1} de ${fs.length}…`)
        const f = fs[i]
        novos.push({ tipo: f.type.startsWith('video') ? 'video' : 'foto', url: await enviar(f, 'biblioteca'), titulo: f.name.replace(/\.[^.]+$/, '') })
      }
      atualizar(await juntarBiblioteca(novos))
    } catch { alert('Falhou o envio de um ficheiro.') }
    setAEnviar('')
  }
  const juntarLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!player(link)) return alert('Cole um link do Vimeo ou do YouTube.')
    atualizar(await juntarBiblioteca([{ tipo: 'video', url: link.trim(), titulo: 'Vídeo' }])); setLink('')
  }

  return (
    <section id="biblioteca" className="rlp-sec pp-ancora" style={{ background: 'var(--ink-2)' }}>
      <div className="rlp-wrap" style={{ maxWidth: 1200 }}>
        <FadeIn className="pp-cab">
          <span className="rlp-eyebrow">02 · Biblioteca</span>
          <h2 className="rlp-h2">Imagens para as vossas <em>redes</em></h2>
          <p className="rlp-lede">Fotografias e vídeos dos casamentos no {ESPACO}, prontos a descarregar e publicar. Pedimos só que identifiquem <b style={{ color: 'var(--g)', fontWeight: 500 }}>@rlphoto_fotografia.video</b>.</p>
        </FadeIn>

        {admin && (
          <FadeIn className="pp-admin-bar">
            <span className="pp-admin">Só a RL vê</span>
            <label className="rlp-btn" style={{ cursor: 'pointer' }}>
              <span className="fill" /><span className="dot" />{aEnviar || 'Carregar fotos ou vídeos'}
              <input type="file" multiple accept="image/*,video/*" hidden disabled={!!aEnviar} onChange={e => { carregar(e.target.files); e.target.value = '' }} />
            </label>
            <form onSubmit={juntarLink} className="pp-link-form">
              <input placeholder="ou link do Vimeo / YouTube" value={link} onChange={e => setLink(e.target.value)} />
              <button className="rlp-calbtn">Juntar</button>
            </form>
          </FadeIn>
        )}

        {itens.length > 0 ? (
          <>
            <div className="pp-filtros">
              {([['todos', `Tudo · ${itens.length}`], ['foto', `Fotografias · ${nFotos}`], ['video', `Vídeos · ${itens.length - nFotos}`]] as const).map(([v, l]) => (
                <button key={v} className={filtro === v ? 'on' : ''} onClick={() => setFiltro(v)}>{l}</button>
              ))}
            </div>
            <div className="pp-masonry">
              {vistos.map((it, i) => (
                <FadeIn key={it.id} delay={(i % 6) * 60} className="pp-bib">
                  <button className="pp-bib-btn" onClick={() => setAberto(it)} aria-label={`Abrir ${it.titulo}`}>
                    {it.tipo === 'foto'
                      ? <img src={it.url} alt={it.titulo} loading="lazy" />
                      : player(it.url)
                        ? <div className="pp-bib-vid"><span>▶</span><small>{dominio(it.url)}</small></div>
                        : <video src={`${it.url}#t=0.5`} muted playsInline preload="metadata" />}
                    {it.tipo === 'video' && <i className="pp-play">▶</i>}
                  </button>
                  {admin && <button className="pp-x pp-x-canto" aria-label="Tirar" onClick={async () => { if (confirm('Tirar da biblioteca?')) atualizar(await tirarBiblioteca(it.id)) }}>×</button>}
                </FadeIn>
              ))}
            </div>
          </>
        ) : (
          <FadeIn className="pp-embreve">
            <div className="pp-embreve-fotos" aria-hidden>
              {[8, 5, 4].map(n => <div key={n} style={{ backgroundImage: `url(${fotoVazia(n)})` }} />)}
            </div>
            <div className="pp-embreve-txt">
              <span className="rlp-eyebrow c">Em breve</span>
              <p className="rlp-ed"><em>A biblioteca está a ser preparada.</em></p>
              <p className="rlp-lede">Depois de cada casamento no {ESPACO}, deixamos aqui uma seleção de fotografias e vídeos para usarem à vontade.</p>
            </div>
          </FadeIn>
        )}
      </div>

      {aberto && (
        <div className="pp-lb" onClick={() => setAberto(null)}>
          <div className="pp-lb-in" onClick={e => e.stopPropagation()}>
            {aberto.tipo === 'foto' && <img src={aberto.url} alt={aberto.titulo} />}
            {aberto.tipo === 'video' && (player(aberto.url)
              ? <iframe src={player(aberto.url)!} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={aberto.titulo} />
              : <video src={aberto.url} controls autoPlay playsInline />)}
            <div className="pp-lb-pe">
              <span>{aberto.titulo}</span>
              {player(aberto.url)
                ? <a href={aberto.url} target="_blank" rel="noopener noreferrer" className="rlp-calbtn">Abrir no {dominio(aberto.url).split('.')[0]}</a>
                : <a href={`${aberto.url}?download=${encodeURIComponent(aberto.url.split('/').pop()!.replace(/^\d+-/, ''))}`} className="rlp-btn"><span className="fill" /><span className="dot" />Descarregar</a>}
              <button className="rlp-calbtn" onClick={() => setAberto(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

/* ───────────────────────── MOOD BOARD ───────────────────────── */
function MoodBoard({ itens, admin, atualizar }: { itens: ItemMood[]; admin: boolean; atualizar: Atualizar }) {
  const [ficheiros, setFicheiros] = useState<File[]>([])
  const [link, setLink] = useState('')
  const [nota, setNota] = useState('')
  const [aEnviar, setAEnviar] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [arrastar, setArrastar] = useState(false)
  const previews = useMemo(() => ficheiros.map(f => URL.createObjectURL(f)), [ficheiros])
  useEffect(() => () => previews.forEach(u => URL.revokeObjectURL(u)), [previews])

  const juntarFicheiros = (fs: FileList | null) => {
    if (!fs) return
    setFicheiros(v => [...v, ...Array.from(fs).filter(f => f.type.startsWith('image'))].slice(0, 20))
  }
  const submeter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (link && !/^https:\/\//.test(link.trim())) return alert('O link tem de começar por https://')
    try {
      const imgs: string[] = []
      for (let i = 0; i < ficheiros.length; i++) { setAEnviar(`A enviar ${i + 1} de ${ficheiros.length}…`); imgs.push(await enviar(ficheiros[i], 'moodboard')) }
      setAEnviar('A guardar…')
      const d = await juntarMood({ imgs, link, nota })
      atualizar(d)
      if (d) { setFicheiros([]); setLink(''); setNota(''); setEnviado(true); setTimeout(() => setEnviado(false), 4000) }
    } catch { alert('Falhou o envio. Tente outra vez.') }
    setAEnviar('')
  }
  const vazio = !ficheiros.length && !link.trim() && !nota.trim()

  return (
    <section id="moodboard" className="rlp-sec pp-ancora">
      <div className="rlp-wrap" style={{ maxWidth: 1200 }}>
        <FadeIn className="pp-cab">
          <span className="rlp-eyebrow">03 · Mood board</span>
          <h2 className="rlp-h2">O que querem que <em>façamos</em></h2>
          <p className="rlp-lede">Viram um vídeo, uma foto ou um estilo de que gostaram? Mandem-nos aqui. Imagens, links do Instagram ou do Pinterest e uma nota com a ideia. Nós produzimos.</p>
        </FadeIn>

        <FadeIn>
          <form onSubmit={submeter} className="pp-mood-form rlp-card">
            <label
              className={`pp-drop${arrastar ? ' on' : ''}`}
              onDragOver={e => { e.preventDefault(); setArrastar(true) }}
              onDragLeave={() => setArrastar(false)}
              onDrop={e => { e.preventDefault(); setArrastar(false); juntarFicheiros(e.dataTransfer.files) }}
            >
              <input type="file" accept="image/*" multiple hidden onChange={e => { juntarFicheiros(e.target.files); e.target.value = '' }} />
              {previews.length ? (
                <div className="pp-drop-prev">
                  {previews.map((u, i) => (
                    <div key={u} style={{ backgroundImage: `url(${u})` }}>
                      <button type="button" aria-label="Tirar" onClick={e => { e.preventDefault(); setFicheiros(v => v.filter((_, k) => k !== i)) }}>×</button>
                    </div>
                  ))}
                  <span className="mais">+</span>
                </div>
              ) : (
                <>
                  <span className="pp-drop-ic">＋</span>
                  <b>Arrastar imagens para aqui</b>
                  <small>ou clicar para escolher (capturas de ecrã também servem)</small>
                </>
              )}
            </label>
            <div className="pp-mood-campos">
              <input placeholder="Link (Instagram, Pinterest, TikTok, YouTube…)" value={link} onChange={e => setLink(e.target.value)} inputMode="url" />
              <textarea placeholder="Qual é a ideia? Ex.: um reel da entrada dos noivos ao pôr do sol, para a primavera." rows={4} value={nota} onChange={e => setNota(e.target.value)} />
              <button className="rlp-btn full" disabled={vazio || !!aEnviar} style={{ opacity: vazio || aEnviar ? .55 : 1 }}>
                <span className="fill" /><span className="dot" />{aEnviar || (enviado ? 'Recebido, obrigado!' : 'Enviar referência')}
              </button>
            </div>
          </form>
        </FadeIn>

        {itens.length > 0 ? (
          <div className="pp-masonry pp-mood">
            {itens.map((m, i) => (
              <FadeIn key={m.id} delay={(i % 6) * 60} className="pp-mcard">
                {m.img && <a href={m.img} target="_blank" rel="noopener noreferrer"><img src={m.img} alt="" loading="lazy" /></a>}
                {!m.img && m.link && (
                  <a href={m.link} target="_blank" rel="noopener noreferrer" className="pp-mlink">
                    <span>↗</span><b>{dominio(m.link)}</b>
                  </a>
                )}
                <div className="pp-mcard-c">
                  {m.nota && <p>{m.nota}</p>}
                  {m.img && m.link && <a href={m.link} target="_blank" rel="noopener noreferrer" className="pp-mlink-s">↗ {dominio(m.link)}</a>}
                  <div className="pp-mcard-pe">
                    <small>{m.autor === 'rl' ? 'RL' : NOME} · {dataPT(m.criado.slice(0, 10))}</small>
                    {admin ? (
                      <select value={m.estado} onChange={async e => atualizar(await estadoMood(m.id, e.target.value as EstadoMood))} className={`pp-tag e-${m.estado}`}>
                        {ESTADOS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                      </select>
                    ) : <span className={`pp-tag e-${m.estado}`}>{ESTADOS.find(s => s.v === m.estado)?.l}</span>}
                  </div>
                </div>
                <button className="pp-x pp-x-canto" aria-label="Apagar" onClick={async () => { if (confirm('Apagar esta referência?')) atualizar(await tirarMood(m.id)) }}>×</button>
              </FadeIn>
            ))}
          </div>
        ) : (
          <FadeIn className="pp-vazio" style={{ marginTop: 36 }}>
            <p className="rlp-ed"><em>O quadro ainda está em branco.</em></p>
            <p className="rlp-lede">A primeira referência que enviarem aparece aqui, e vão vendo em que ponto está.</p>
          </FadeIn>
        )}
      </div>
    </section>
  )
}

const PP_CSS = `
.pp .pp-ancora{scroll-margin-top:70px}
.pp-nav{display:flex;gap:clamp(14px,2.4vw,32px)}
.pp-nav a{font-family:var(--fb);font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--tx-mid);text-decoration:none;transition:color .3s}
.pp-nav a:hover{color:var(--g)}
@media(max-width:560px){.pp-nav{gap:12px}.pp-nav a{font-size:9.5px;letter-spacing:.14em}.rlp-mono i{display:none}}

/* capa */
.pp-hero{position:relative;min-height:100svh;display:flex;align-items:flex-end;overflow:hidden}
.pp-hero-img{position:absolute;inset:-4%;background-size:cover;background-position:center;opacity:0;transform:scale(1.08);transition:opacity 1.8s ease,transform 7.5s linear}
.pp-hero-img.on{opacity:1;transform:scale(1)}
.pp-hero-veu{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,11,.45) 0%,rgba(11,11,11,.25) 35%,rgba(11,11,11,.7) 75%,var(--ink) 100%),linear-gradient(90deg,rgba(11,11,11,.7) 0%,rgba(11,11,11,.1) 60%,transparent)}
.pp-hero-in{position:relative;z-index:2;width:100%;padding-bottom:clamp(56px,10vh,120px)}
.pp-h1{font-size:clamp(44px,8.4vw,124px)!important;margin:18px 0 0;line-height:.95}
.pp-h1 em{color:var(--g);font-style:normal;font-weight:200}
.pp-ola{font-size:clamp(19px,2.3vw,28px);line-height:1.3;margin-top:22px;max-width:40ch;color:var(--tx-mid)}
.pp-ola em{color:var(--tx)}
.pp-atalhos{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px}
.pp-atalhos a{display:flex;align-items:center;gap:12px;padding:12px 18px 12px 14px;border:1px solid var(--line);border-radius:999px;background:rgba(11,11,11,.45);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);text-decoration:none;transition:border-color .3s,background .3s}
.pp-atalhos a:hover{border-color:var(--g);background:rgba(216,190,147,.08)}
.pp-atalhos b{font-family:var(--fd);font-weight:200;font-size:26px;color:var(--g);min-width:1.2em;text-align:center}
.pp-atalhos a>span{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-mid)}
.pp-hero-pontos{position:absolute;right:var(--pad);bottom:clamp(56px,10vh,120px);z-index:2;display:flex;flex-direction:column;gap:8px}
.pp-hero-pontos i{width:2px;height:18px;background:var(--line);transition:background .6s,height .6s}
.pp-hero-pontos i.on{background:var(--g);height:34px}
@media(max-width:640px){.pp-hero-pontos{display:none}}

/* faixa */
.pp-faixa{overflow:hidden;border-block:1px solid var(--line-soft);padding:14px 0;background:var(--ink)}
.pp-faixa-in{display:flex;gap:14px;width:max-content;animation:pp-faixa 60s linear infinite}
.pp-faixa img{height:clamp(120px,16vw,200px);width:auto;border-radius:6px;filter:grayscale(.25) brightness(.9);transition:filter .4s}
.pp-faixa img:hover{filter:none}
@keyframes pp-faixa{to{transform:translateX(-50%)}}

/* cabeçalhos */
.pp-cab{display:flex;flex-direction:column;gap:14px;max-width:62ch;margin-bottom:clamp(32px,5vw,56px)}
.pp-cab .rlp-lede{font-size:16px}

/* números */
.pp-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line-soft);border:1px solid var(--line-soft);border-radius:14px;overflow:hidden}
.pp-kpi{background:var(--ink);padding:clamp(22px,3vw,38px) clamp(18px,2.4vw,30px);display:flex;flex-direction:column;gap:10px}
.pp-kpi b{font-family:var(--fd);font-weight:100;font-size:clamp(52px,7vw,92px);line-height:.9;color:var(--tx)}
.pp-kpi:first-child b{color:var(--g)}
.pp-kpi>span{font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--tx-dim)}
@media(max-width:760px){.pp-kpis{grid-template-columns:1fr 1fr}}
.pp-prox{margin-top:18px;display:flex;flex-wrap:wrap;align-items:center;gap:10px 24px;padding:18px 24px;border:1px solid rgba(216,190,147,.35);border-radius:14px;background:linear-gradient(90deg,rgba(216,190,147,.09),transparent)}
.pp-prox p{font-family:var(--fd);font-weight:300;font-size:20px}
.pp-prox p em{color:var(--g);font-style:normal}
.pp-prox b{margin-left:auto;font-weight:400;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--g)}
.pp-lista{margin-top:28px;border-top:1px solid var(--line-soft)}
.pp-linha{display:grid;grid-template-columns:44px 130px 1fr auto auto 28px;align-items:center;gap:16px;padding:18px 4px;border-bottom:1px solid var(--line-soft);transition:background .3s}
.pp-linha:hover{background:rgba(216,190,147,.035)}
.pp-linha .n{font-weight:600;font-size:11px;letter-spacing:.2em;color:var(--g)}
.pp-linha .d{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-mid)}
.pp-linha .nm{font-family:var(--fd);font-weight:300;font-size:clamp(18px,2vw,23px)}
.pp-linha .cv{font-size:12px;color:var(--tx-dim)}
@media(max-width:640px){.pp-linha{grid-template-columns:30px 1fr auto 24px;row-gap:4px}.pp-linha .d{grid-column:2;grid-row:2}.pp-linha .cv{display:none}.pp-linha .nm{grid-column:2;grid-row:1}.pp-linha .pp-tag{grid-column:3;grid-row:1/3}.pp-linha .pp-x{grid-column:4;grid-row:1/3}}
.pp-tag{justify-self:end;font-family:var(--fb);font-size:10px;letter-spacing:.18em;text-transform:uppercase;padding:6px 11px;border-radius:999px;border:1px solid rgba(216,190,147,.4);color:var(--g);background:rgba(216,190,147,.06);white-space:nowrap}
.pp-tag.ok,.pp-tag.e-feito{border-color:rgba(120,190,140,.45);color:#9fd3ae;background:rgba(120,190,140,.07)}
.pp-tag.e-visto{border-color:var(--line);color:var(--tx-mid);background:transparent}
.pp-tag.e-producao{border-color:rgba(110,160,230,.45);color:#a8c6f0;background:rgba(110,160,230,.07)}
select.pp-tag{appearance:none;cursor:pointer;outline:none}
select.pp-tag option{background:#111;color:#eee}
.pp-x{width:26px;height:26px;border-radius:50%;border:1px solid var(--line);background:rgba(11,11,11,.6);color:var(--tx-mid);font-size:15px;line-height:1;cursor:pointer;transition:all .25s}
.pp-x:hover{border-color:#c0605a;color:#e59a94}
.pp-vazio{padding:40px 8px;text-align:center;display:flex;flex-direction:column;gap:8px;align-items:center}
.pp-vazio .rlp-ed{font-size:clamp(20px,2.4vw,26px)}
.pp-vazio .rlp-lede{font-size:15px;max-width:48ch}

/* admin */
.pp-admin{font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:#e0b46a;border:1px dashed rgba(224,180,106,.5);padding:5px 9px;border-radius:6px;white-space:nowrap}
.pp input,.pp textarea{background:rgba(255,255,255,.035);border:1px solid var(--line);border-radius:8px;padding:12px 14px;color:var(--tx);font-family:var(--fb);font-size:15px;outline:none;transition:border-color .3s;width:100%;color-scheme:dark}
.pp input:focus,.pp textarea:focus{border-color:var(--g)}
.pp textarea{resize:vertical;min-height:100px}
.pp-form-linha{display:grid;grid-template-columns:auto 1fr 170px 130px auto;gap:10px;align-items:center;padding:18px 0}
@media(max-width:860px){.pp-form-linha{grid-template-columns:1fr 1fr}.pp-form-linha .pp-admin{grid-column:1/-1;justify-self:start}}
.pp-admin-bar{display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-bottom:26px;padding:16px;border:1px dashed rgba(224,180,106,.35);border-radius:12px}
.pp-link-form{display:flex;gap:8px;flex:1;min-width:260px}

/* biblioteca */
.pp-filtros{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px}
.pp-filtros button{font-family:var(--fb);font-size:11px;letter-spacing:.18em;text-transform:uppercase;padding:9px 16px;border-radius:999px;border:1px solid var(--line);color:var(--tx-mid);background:transparent;cursor:pointer;transition:all .3s}
.pp-filtros button.on,.pp-filtros button:hover{border-color:var(--g);color:var(--g);background:rgba(216,190,147,.07)}
.pp-masonry{columns:3 280px;column-gap:14px}
.pp-bib,.pp-mcard{break-inside:avoid;margin-bottom:14px;position:relative;border-radius:10px;overflow:hidden}
.pp-bib-btn{display:block;width:100%;padding:0;border:0;background:#000;cursor:zoom-in;position:relative}
.pp-bib-btn img,.pp-bib-btn video{display:block;width:100%;height:auto;transition:transform .8s var(--ease),filter .5s}
.pp-bib:hover img,.pp-bib:hover video{transform:scale(1.035);filter:brightness(1.08)}
.pp-bib-vid{aspect-ratio:16/9;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:radial-gradient(circle at 50% 40%,rgba(216,190,147,.15),#0b0b0b 70%);color:var(--g);font-size:30px}
.pp-bib-vid small{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-dim)}
.pp-play{position:absolute;left:12px;bottom:12px;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:12px;background:rgba(11,11,11,.6);border:1px solid rgba(216,190,147,.6);color:var(--g);backdrop-filter:blur(6px)}
.pp-x-canto{position:absolute;top:10px;right:10px;opacity:0;transition:opacity .25s}
.pp-bib:hover .pp-x-canto,.pp-mcard:hover .pp-x-canto{opacity:1}
@media(hover:none){.pp-x-canto{opacity:1}}
.pp-embreve{position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--line-soft);min-height:clamp(320px,40vw,460px);display:flex;align-items:center;justify-content:center}
.pp-embreve-fotos{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1.3fr 1fr;gap:3px}
.pp-embreve-fotos div{background-size:cover;background-position:center;filter:blur(3px) grayscale(.4) brightness(.45);transform:scale(1.05)}
.pp-embreve-txt{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:32px;max-width:520px}
.pp-embreve-txt .rlp-ed{font-size:clamp(22px,2.8vw,32px)}
.pp-embreve-txt .rlp-lede{font-size:15px}
.pp-lb{position:fixed;inset:0;z-index:9500;background:rgba(5,5,5,.92);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:clamp(12px,3vw,40px);animation:pp-in .3s ease}
@keyframes pp-in{from{opacity:0}}
.pp-lb-in{display:flex;flex-direction:column;gap:14px;max-width:min(1200px,100%);width:100%;align-items:center}
.pp-lb-in img,.pp-lb-in video{max-width:100%;max-height:78vh;border-radius:8px}
.pp-lb-in iframe{width:100%;aspect-ratio:16/9;max-height:78vh;border:0;border-radius:8px;background:#000}
.pp-lb-pe{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;color:var(--tx-mid);font-size:13px;letter-spacing:.08em}
.pp-lb-pe span{margin-right:8px}

/* mood board */
.pp-mood-form{display:grid;grid-template-columns:1.1fr 1fr;gap:clamp(16px,2.4vw,28px);padding:clamp(18px,2.6vw,30px)!important}
@media(max-width:820px){.pp-mood-form{grid-template-columns:1fr}}
.pp-drop{position:relative;z-index:1;min-height:240px;border:1.5px dashed rgba(216,190,147,.35);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:20px;cursor:pointer;transition:all .3s;background:rgba(216,190,147,.025)}
.pp-drop:hover,.pp-drop.on{border-color:var(--g);background:rgba(216,190,147,.07)}
.pp-drop-ic{font-size:30px;color:var(--g);font-weight:200;width:56px;height:56px;border-radius:50%;border:1px solid rgba(216,190,147,.4);display:grid;place-items:center;margin-bottom:6px}
.pp-drop b{font-family:var(--fd);font-weight:300;font-size:19px}
.pp-drop small{font-size:12px;color:var(--tx-dim)}
.pp-drop-prev{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px;width:100%}
.pp-drop-prev div{aspect-ratio:1;border-radius:8px;background-size:cover;background-position:center;position:relative}
.pp-drop-prev div button{position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;border:0;background:rgba(0,0,0,.7);color:#fff;cursor:pointer;line-height:1}
.pp-drop-prev .mais{aspect-ratio:1;border-radius:8px;border:1px dashed var(--line);display:grid;place-items:center;color:var(--g);font-size:24px}
.pp-mood-campos{position:relative;z-index:1;display:flex;flex-direction:column;gap:12px}
.pp-mood{margin-top:clamp(30px,4vw,48px)}
.pp-mcard{background:var(--ink-2);border:1px solid var(--line-soft)}
.pp-mcard img{display:block;width:100%;height:auto}
.pp-mcard-c{padding:14px 16px 14px;display:flex;flex-direction:column;gap:10px}
.pp-mcard-c p{font-family:var(--fd);font-weight:300;font-size:16px;line-height:1.45;color:var(--tx);white-space:pre-wrap}
.pp-mcard-pe{display:flex;align-items:center;justify-content:space-between;gap:10px}
.pp-mcard-pe small{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim)}
.pp-mlink{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;aspect-ratio:4/3;text-decoration:none;background:radial-gradient(circle at 50% 30%,rgba(216,190,147,.14),transparent 70%)}
.pp-mlink span{font-size:28px;color:var(--g)}
.pp-mlink b{font-weight:400;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-mid)}
.pp-mlink-s{font-size:12px;letter-spacing:.1em;color:var(--g);text-decoration:none}
`
