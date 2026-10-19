'use client'

/* ============================================================
   ContratoView — render Atmosphère da página Contrato · CPS.
   Só apresentação. Toda a lógica/data vem por props.
   ============================================================ */

import { useRef, useState, type ReactNode } from 'react'
import './contrato.css'
import { useTemaRL } from './PortalShell'

const fmtEur = (n: number | null | undefined): string => {
  if (n === null || n === undefined || isNaN(Number(n))) return '—'
  return Number(n).toLocaleString('pt-PT', { maximumFractionDigits: 0 })
}

const G = '#d8be93'
const BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, border: '1px solid',
  padding: '12px 22px', fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', fontWeight: 600, textDecoration: 'none',
}

export type ContratoViewProps = {
  // Hero
  title: string
  heroImageUrl?: string | null
  backHref: string

  // Status + acções
  contratoDisponivel: boolean
  contratoUrl?: string | null
  onPrint: () => void

  // Texto editorial
  investParagraphs?: string[]    // parágrafos da secção "Mais do que um serviço…"

  // Serviços
  servicosFoto: string[]
  servicosVideo: string[]

  // Totais e planos
  totalEur: number
  pagamentos: Array<{
    label: string         // ex: 'Assinatura', 'Entrada', 'Final'
    roman?: string        // ex: 'I', 'II', 'III'
    valor: number
    paid: boolean
    when?: string         // ex: 'há 1 mês', 'previsto em mar 2026'
  }>

  // Admin actions (top right)
  isAdmin: boolean
  adminActions?: ReactNode

  // Edit pencil junto ao título do hero (se admin)
  onEditTitle?: () => void

  /** Nó já renderizado da secção de Fases de Pagamento — se passado
   * substitui o grid .planscards default. Usar para passar o
   * <PaymentPhasesSection /> existente sem perder funcionalidade. */
  paymentPhasesNode?: ReactNode

  /** Envio do contrato assinado (vai por email ao admin, não fica guardado) */
  referencia?: string | null
  contratoAssinadoEm?: string | null
  onContratoAssinado?: (iso: string) => void
}

/* Botão para os noivos enviarem o contrato assinado (PDF ou fotografia) */
function EnviarContratoAssinado({ referencia, enviadoEm, onEnviado, rl }: {
  referencia: string; enviadoEm?: string | null; onEnviado?: (iso: string) => void; rl?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<'idle' | 'a-enviar' | 'erro'>('idle')
  const [erro, setErro] = useState('')
  const [feito, setFeito] = useState<string | null>(enviadoEm ?? null)

  async function enviar(f: File) {
    setEstado('a-enviar'); setErro('')
    const fd = new FormData()
    fd.append('referencia', referencia)
    fd.append('ficheiro', f)
    try {
      const r = await fetch('/api/portais-contrato-assinado', { method: 'POST', body: fd })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Não foi possível enviar.')
      setFeito(d.contratoAssinadoEm); setEstado('idle'); onEnviado?.(d.contratoAssinadoEm)
    } catch (e: any) {
      setErro(e.message || 'Não foi possível enviar.'); setEstado('erro')
    }
  }

  if (rl) return (
    <div>
      <input ref={input} type="file" accept="application/pdf,image/*" hidden
        onChange={e => { const f = e.target.files?.[0]; if (f) enviar(f); e.target.value = '' }} />
      {feito ? (
        <span style={{ ...BTN, borderColor: 'rgba(74,222,128,.45)', color: '#86efac', background: 'rgba(74,222,128,.08)', cursor: 'default' }}>
          ✓ Recebido a {new Date(feito).toLocaleDateString('pt-PT')}
        </span>
      ) : (
        <button type="button" disabled={estado === 'a-enviar'} onClick={() => input.current?.click()}
          style={{ ...BTN, borderColor: 'rgba(255,255,255,.6)', color: '#fff', background: 'rgba(255,255,255,.06)', boxShadow: '0 0 18px rgba(255,255,255,.12)', cursor: estado === 'a-enviar' ? 'wait' : 'pointer' }}>
          {estado === 'a-enviar' ? 'A enviar…' : 'Enviar contrato assinado'}
        </button>
      )}
      {estado === 'erro' && <div style={{ color: '#f87171', fontSize: 12.5, marginTop: 8 }}>{erro}</div>}
      {!feito && estado !== 'erro' && <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, marginTop: 8 }}>PDF ou fotografia, até 4 MB</div>}
    </div>
  )

  return (
    <div className="downloadblock" style={{ cursor: estado === 'a-enviar' ? 'wait' : 'pointer', borderColor: 'rgba(255,255,255,.55)', boxShadow: '0 0 18px rgba(255,255,255,.12)' }}
      onClick={() => estado !== 'a-enviar' && input.current?.click()} role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') input.current?.click() }}>
      <input ref={input} type="file" accept="application/pdf,image/*" hidden
        onChange={e => { const f = e.target.files?.[0]; if (f) enviar(f); e.target.value = '' }} />
      <span className="ic">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V4M6 10l6-6 6 6" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </svg>
      </span>
      <div className="meta">
        <div className="lab">{feito ? `Enviado a ${new Date(feito).toLocaleDateString('pt-PT')}` : 'Contrato assinado'}</div>
        <div className="t">
          {estado === 'a-enviar' ? 'A enviar…' : feito ? 'Contrato assinado recebido ✓' : 'Enviar contrato assinado'}
        </div>
        {estado === 'erro' && <div className="lab" style={{ color: '#e79b9b', marginTop: 6 }}>{erro}</div>}
        {!feito && estado !== 'erro' && <div className="lab" style={{ marginTop: 6, opacity: .7 }}>PDF ou fotografia, até 4 MB</div>}
      </div>
    </div>
  )
}

export function ContratoView(props: ContratoViewProps) {
  const fotoItems = props.servicosFoto.filter(Boolean)
  const videoItems = props.servicosVideo.filter(Boolean)
  const temaRL = useTemaRL()
  if (temaRL) return <ContratoRL {...props} fotoItems={fotoItems} videoItems={videoItems} />

  return (
    <>
      {/* Admin actions bar */}
      {props.isAdmin && props.adminActions && (
        <div className="abar">{props.adminActions}</div>
      )}

      {/* Hero */}
      <header className="subhero">
        {props.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.heroImageUrl} alt="" className="img" />
        ) : (
          <div className="ph img" />
        )}
        <div className="scrim" />
        <a className="back back-hero" href={props.backHref}>
          <span className="chev">‹</span> Voltar
        </a>
        <div className="cap">
          <div className="eyebrow e">RL Photo · Video</div>
          <div className="title">
            <h1>{props.title || 'Contrato · CPS'}</h1>
            {props.isAdmin && props.onEditTitle && (
              <span className="pencil" onClick={props.onEditTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 19l1-4L16 5l3 3L9 18l-4 1Z" /><path d="M14 7l3 3" />
                </svg>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Sub-barra: chip + Imprimir */}
      <div className="subbar">
        <div className="left">
          <span className={`statuschip ${props.contratoDisponivel ? 'ok' : 'wait'}`}>
            <span className="pip" />
            {props.contratoDisponivel ? 'Contrato Disponível' : 'Em Preparação'}
          </span>
        </div>
        <div className="right">
          <button type="button" className="printbtn" onClick={props.onPrint}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9V4h12v5M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" rx="1" />
            </svg>
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Bloco download */}
      {props.contratoDisponivel && props.contratoUrl ? (
        <a className="downloadblock" href={props.contratoUrl} target="_blank" rel="noopener noreferrer">
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3h9l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
              <path d="M15 3v5h5" />
              <path d="M9 13h6M9 17h6" />
            </svg>
          </span>
          <div className="meta">
            <div className="lab">Documento</div>
            <div className="t">Contrato Prestação de Serviços</div>
          </div>
          <span className="arr">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v12M6 12l6 6 6-6" />
            </svg>
          </span>
        </a>
      ) : (
        <div className="downloadblock" style={{ cursor: 'default', opacity: .65 }}>
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3h9l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
              <path d="M15 3v5h5" />
            </svg>
          </span>
          <div className="meta">
            <div className="lab">Documento</div>
            <div className="t">Contrato Prestação de Serviços</div>
          </div>
        </div>
      )}

      {/* Envio do contrato assinado (só depois de o contrato estar disponível) */}
      {props.contratoDisponivel && props.referencia && (
        <EnviarContratoAssinado referencia={props.referencia} enviadoEm={props.contratoAssinadoEm} onEnviado={props.onContratoAssinado} />
      )}

      {/* Nota verde-sálvia */}
      <div className="note">
        <span className="ic">✓</span>
        <div>
          {props.contratoDisponivel ? (
            <>
              O contrato está <strong>disponível para descarregar</strong>. Façam o download,
              revejam, assinem e enviem-no pelo botão acima. Caso queiram pedir alguma
              alteração, contactem-nos diretamente.
            </>
          ) : (
            <>
              O contrato fica <strong>disponível em 7 dias úteis</strong> após a vossa adesão.
              Quando estiver pronto vão receber notificação por e-mail e o documento aparecerá
              aqui para download.
            </>
          )}
        </div>
      </div>

      {/* Secção investimento */}
      {props.investParagraphs && props.investParagraphs.length > 0 && (
        <section className="invest">
          <div className="eyebrow">O Vosso Investimento</div>
          <h2>{props.investParagraphs[0]}</h2>
          {props.investParagraphs.slice(1).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
      )}

      {/* A Vossa Proposta */}
      <div className="proposeh">
        <div className="eyebrow">A Vossa Proposta</div>
        <h2>Serviços contratados</h2>
      </div>

      <div className="propcards">
        <div className="servicecard">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
              <circle cx="12" cy="13" r="3.2" />
            </svg>
            Serviços de Fotografia
          </h3>
          {fotoItems.length > 0 ? (
            <ul className="checklist">
              {fotoItems.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          ) : (
            <p className="empty">Sem itens contratados para fotografia.</p>
          )}
        </div>
        <div className="servicecard">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="14" height="12" rx="2" />
              <path d="M17 10l4-2v8l-4-2z" />
            </svg>
            Serviços de Vídeo
          </h3>
          {videoItems.length > 0 ? (
            <ul className="checklist">
              {videoItems.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          ) : (
            <p className="empty">Sem itens contratados para vídeo.</p>
          )}
        </div>
      </div>

      {/* Total bar dourada */}
      <div className="totalbar">
        <span className="lab">Total do Serviço</span>
        <span className="val"><em>€</em>{fmtEur(props.totalEur)}</span>
      </div>

      <div className="logocard">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/portal-noivos/logo-ink.png" alt="RL Photo Video" />
        <div className="url">www.rlphotovideo.pt</div>
      </div>
    </>
  )
}

function toRoman(n: number): string {
  const map = ['I', 'II', 'III', 'IV', 'V', 'VI']
  return map[n - 1] ?? String(n)
}

/* Contrato no novo design (tema RL): topo com foto esbatida, os 3 passos do contrato
   (descarregar, assinar, enviar), os serviços contratados e o total. */
function ContratoRL(props: ContratoViewProps & { fotoItems: string[]; videoItems: string[] }) {
  const disponivel = props.contratoDisponivel && !!props.contratoUrl
  const enviado = !!props.contratoAssinadoEm
  const caixa: React.CSSProperties = { borderRadius: 22, border: '1px solid rgba(216,190,147,.18)', background: 'rgba(17,17,17,.85)', padding: 'clamp(20px, 3.5vw, 30px)' }
  const passos: Array<{ n: string; t: string; d: string; feito: boolean; acao?: ReactNode }> = [
    {
      n: 'I', t: 'Descarregar', feito: disponivel,
      d: disponivel ? 'O contrato está pronto. Descarreguem e leiam com calma.' : 'Fica disponível em 7 dias úteis após a vossa adesão. Avisamos por e-mail.',
      acao: disponivel ? (
        <a href={props.contratoUrl!} target="_blank" rel="noopener noreferrer" style={{ ...BTN, borderColor: G, background: G, color: '#0b0b0b' }}>Descarregar contrato</a>
      ) : undefined,
    },
    { n: 'II', t: 'Assinar', feito: enviado, d: 'Assinem os dois, à mão ou com assinatura digital. Alguma dúvida? Falem connosco antes de assinar.' },
    {
      n: 'III', t: 'Enviar', feito: enviado,
      d: enviado ? 'Recebemos o vosso contrato assinado. Obrigado!' : 'Enviem o contrato assinado por aqui. Chega-nos diretamente por e-mail.',
      acao: disponivel && props.referencia
        ? <EnviarContratoAssinado rl referencia={props.referencia} enviadoEm={props.contratoAssinadoEm} onEnviado={props.onContratoAssinado} />
        : undefined,
    },
  ]
  const servico = (titulo: string, itens: string[], vazio: string) => (
    <div style={caixa}>
      <div className="eyebrow">{titulo}</div>
      {itens.length > 0 ? (
        <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {itens.map((s, i) => (
            <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: 'rgba(255,255,255,.78)', lineHeight: 1.55, fontSize: 14.5 }}>
              <span style={{ flex: 'none', marginTop: 7, width: 6, height: 6, borderRadius: '50%', background: G, boxShadow: `0 0 8px ${G}` }} />{s}
            </li>
          ))}
        </ul>
      ) : <p style={{ margin: '16px 0 0', color: 'rgba(255,255,255,.4)', fontSize: 14 }}>{vazio}</p>}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      {props.isAdmin && props.adminActions && <div className="abar">{props.adminActions}</div>}

      {/* ── topo ── */}
      <section style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, border: '1px solid rgba(216,190,147,.2)', background: '#0b0b0b', padding: 'clamp(28px, 5vw, 48px)' }}>
        {props.heroImageUrl && <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: `url('${props.heroImageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center 35%', filter: 'grayscale(1)', opacity: .28 }} />}
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(11,11,11,.97) 0%, rgba(11,11,11,.78) 58%, rgba(11,11,11,.5) 100%)' }} />
        <div aria-hidden style={{
          position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(216,190,147,0.18) 1px, transparent 1px)', backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at 80% 40%, #000 0%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at 80% 40%, #000 0%, transparent 70%)',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <a href={props.backHref} style={{ fontSize: 14, color: 'rgba(255,255,255,.5)' }}>‹ Voltar</a>
            <button type="button" onClick={props.onPrint} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)' }}>Imprimir / PDF</button>
          </div>
          <div className="eyebrow" style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
            {props.title || 'Contrato · CPS'}
            {props.isAdmin && props.onEditTitle && <span onClick={props.onEditTitle} style={{ cursor: 'pointer', opacity: .6 }}>✎</span>}
          </div>
          <h1 style={{ margin: '12px 0 0', fontSize: 'clamp(36px, 5vw, 58px)', color: '#fff' }}>
            O vosso <em style={{ fontStyle: 'normal', color: G }}>contrato</em>
          </h1>
          <p style={{ margin: '14px 0 0', color: 'rgba(255,255,255,.55)', maxWidth: '52ch', lineHeight: 1.7 }}>
            Tudo o que combinámos, por escrito. Três passos simples e o vosso dia fica oficialmente nas nossas mãos.
          </p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, borderRadius: 999, padding: '7px 14px', fontSize: 10.5, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 600,
            border: `1px solid ${enviado ? 'rgba(74,222,128,.4)' : disponivel ? 'rgba(216,190,147,.45)' : 'rgba(255,255,255,.18)'}`,
            color: enviado ? '#86efac' : disponivel ? G : 'rgba(255,255,255,.55)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 8px currentColor' }} />
            {enviado ? 'Contrato assinado' : disponivel ? 'Pronto a assinar' : 'Em preparação'}
          </span>
        </div>
      </section>

      {/* ── os 3 passos ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {passos.map(p => (
          <div key={p.n} style={{ ...caixa, display: 'flex', flexDirection: 'column', gap: 12, borderColor: p.feito ? 'rgba(74,222,128,.3)' : 'rgba(216,190,147,.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 26, color: G }}>{p.n}</span>
              {p.feito && <span style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: '#86efac' }}>✓ Feito</span>}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{p.t}</div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,.55)', lineHeight: 1.6, fontSize: 14 }}>{p.d}</p>
            {p.acao && <div style={{ marginTop: 'auto', paddingTop: 6 }}>{p.acao}</div>}
          </div>
        ))}
      </section>

      {/* ── texto do investimento (se houver) ── */}
      {props.investParagraphs && props.investParagraphs.length > 0 && (
        <section style={{ ...caixa, textAlign: 'center' }}>
          <div className="eyebrow">O vosso investimento</div>
          <h2 style={{ margin: '12px auto 0', maxWidth: '30ch', fontSize: 'clamp(22px, 3vw, 30px)', color: '#fff', fontWeight: 400 }}>{props.investParagraphs[0]}</h2>
          {props.investParagraphs.slice(1).map((t, i) => (
            <p key={i} style={{ margin: '12px auto 0', maxWidth: '60ch', color: 'rgba(255,255,255,.55)', lineHeight: 1.7 }}>{t}</p>
          ))}
        </section>
      )}

      {/* ── serviços + total ── */}
      <section>
        <div className="eyebrow">A vossa proposta</div>
        <h2 style={{ margin: '10px 0 16px', fontSize: 'clamp(24px, 3vw, 32px)', color: '#fff', fontWeight: 400 }}>Serviços contratados</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {servico('Fotografia', props.fotoItems, 'Sem itens contratados para fotografia.')}
          {servico('Vídeo', props.videoItems, 'Sem itens contratados para vídeo.')}
        </div>
        <div style={{
          marginTop: 12, borderRadius: 22, border: '1px solid rgba(216,190,147,.35)', background: 'linear-gradient(100deg, rgba(216,190,147,.12), rgba(216,190,147,.03))',
          padding: '20px clamp(20px, 3.5vw, 30px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', boxShadow: '0 0 40px -24px rgba(216,190,147,.7)',
        }}>
          <span className="eyebrow">Total do serviço</span>
          <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(32px, 4vw, 44px)', color: G, lineHeight: 1 }}>{fmtEur(props.totalEur)} €</span>
        </div>
      </section>

      {/* ── assinatura ── */}
      <div style={{ marginTop: 24, marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: 64, height: 1, marginBottom: 24, background: 'linear-gradient(90deg, transparent, rgba(216,190,147,0.6), transparent)' }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/portal-noivos/logo-gold.png" alt="RL Photo Video" style={{ height: 48, width: 'auto', objectFit: 'contain', opacity: 0.9 }} />
        <p style={{ marginTop: 12, fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(216,190,147,0.65)' }}>Photo · Video · Wedding Moments</p>
      </div>
    </div>
  )
}
