'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// Opções dos selects (default — o admin pode editar e gravamos em settings se necessário)
const PROPOSTAS_DEFAULT = [
  'Proposta 1',
  'Proposta 2',
  'Proposta 3',
]

type Tipo = 'casamento' | 'batizado'

// ─── DESIGN SYSTEM — RL PHOTO.VIDEO (rlphotovideo.pt) ─────────────────────────
const RLP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400&family=Hanken+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap');

.rl-portal{
  --ink:#0b0a08; --ink-2:#100e0b; --ink-3:#16130f;
  --g:#d8be93; --g-deep:#c8a866;
  --tx:rgba(243,237,226,.92); --tx-mid:rgba(243,237,226,.6); --tx-dim:rgba(243,237,226,.4);
  --line:rgba(243,237,226,.14); --line-soft:rgba(243,237,226,.08);
  --fd:'Jost',sans-serif; --fb:'Hanken Grotesk',sans-serif; --fm:'Space Mono',monospace; --fs:'Cormorant Garamond',serif;
  --ease:cubic-bezier(.16,1,.3,1); --pad:clamp(20px,5vw,80px);
  background:var(--ink); color:var(--tx); font-family:var(--fb);
  -webkit-font-smoothing:antialiased; min-height:100vh;
}
.rl-portal ::selection{background:rgba(216,190,147,.28);color:#0b0a08;}

.rlp-grain{position:fixed;inset:0;z-index:9000;pointer-events:none;opacity:.05;mix-blend-mode:overlay;background-size:130px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");}
.rlp-vig{position:fixed;inset:0;z-index:8990;pointer-events:none;box-shadow:inset 0 0 240px 40px rgba(0,0,0,.5);}
.rlp-prog{position:fixed;top:0;left:0;height:2px;width:0;background:var(--g);z-index:9100;transition:width .1s linear;}

.rlp-bar{position:fixed;top:0;left:0;width:100%;z-index:8000;display:flex;align-items:center;justify-content:space-between;padding:20px var(--pad);border-bottom:1px solid transparent;transition:background .6s var(--ease),padding .6s var(--ease),border-color .6s;}
.rlp-bar.s{background:rgba(11,10,8,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding-top:13px;padding-bottom:13px;border-color:var(--line-soft);}
.rlp-mono{display:inline-flex;align-items:baseline;gap:.6em;text-decoration:none;}
.rlp-mono span{font-family:var(--fd);font-weight:300;letter-spacing:.3em;font-size:16px;color:var(--tx);}
.rlp-mono i{font-family:var(--fm);font-style:normal;font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);opacity:.85;}

.rlp-eyebrow{font-family:var(--fm);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--g);display:inline-flex;gap:.8em;align-items:center;}
.rlp-eyebrow::before{content:"";width:34px;height:1px;background:var(--g);opacity:.6;}
.rlp-eyebrow.c{justify-content:center;}

.rlp-h1{font-family:var(--fd);font-weight:200;line-height:.98;letter-spacing:-.02em;color:var(--tx);}
.rlp-h1 em{font-style:italic;color:var(--g);}
.rlp-h2{font-family:var(--fd);font-weight:200;line-height:1.04;letter-spacing:-.02em;color:var(--tx);}
.rlp-h2 em{font-style:italic;color:var(--g);}
.rlp-lede{font-family:var(--fb);font-weight:300;color:var(--tx-mid);line-height:1.8;font-size:clamp(15px,1.4vw,17px);}
.rlp-ed{font-family:var(--fs);font-weight:300;color:var(--tx-mid);}
.rlp-ed em{font-style:italic;color:var(--g);}

.rlp-btn{display:inline-flex;align-items:center;justify-content:center;gap:.9em;position:relative;isolation:isolate;font-family:var(--fm);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink);padding:18px 38px;border:1px solid var(--g);border-radius:40px;overflow:hidden;background:var(--g);transition:color .5s var(--ease),opacity .3s;cursor:pointer;text-decoration:none;}
.rlp-btn .fill{position:absolute;inset:0;z-index:-1;background:var(--ink);transform:translateY(101%);transition:transform .6s var(--ease);}
.rlp-btn .dot{width:5px;height:5px;border-radius:50%;background:var(--ink);transition:background .5s;flex:none;}
.rlp-btn:hover{color:var(--g);} .rlp-btn:hover .fill{transform:translateY(0);} .rlp-btn:hover .dot{background:var(--g);}
.rlp-btn:disabled{opacity:.45;pointer-events:none;}
.rlp-btn.full{width:100%;}

.rlp-link-u{font-family:var(--fm);font-size:12px;letter-spacing:.16em;text-transform:uppercase;display:inline-flex;gap:.7em;align-items:center;position:relative;color:var(--tx-mid);text-decoration:none;}
.rlp-link-u::after{content:"";position:absolute;left:0;bottom:-5px;width:100%;height:1px;background:var(--g);transform:scaleX(0);transform-origin:right;transition:transform .5s var(--ease);}
.rlp-link-u:hover::after{transform:scaleX(1);transform-origin:left;}
.rlp-link-u .a{color:var(--g);transition:transform .4s var(--ease);}
.rlp-link-u:hover .a{transform:translateX(-5px);}

.rlp-wrap{width:100%;max-width:720px;margin:0 auto;padding-left:var(--pad);padding-right:var(--pad);}

/* Campos de formulário — linha inferior */
.rlp-field{display:block;}
.rlp-field .lab{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);display:block;margin-bottom:12px;}
.rlp-field .req{color:var(--g);margin-left:.35em;opacity:.8;}
.rlp-field input,.rlp-field select{width:100%;background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--tx);font-family:var(--fd);font-weight:300;font-size:clamp(16px,1.6vw,20px);padding:8px 0 13px;outline:none;transition:border-color .4s var(--ease);}
.rlp-field select{-webkit-appearance:none;appearance:none;padding-right:28px;cursor:pointer;}
.rlp-field input:focus,.rlp-field select:focus{border-color:var(--g);}
.rlp-field input::placeholder{color:var(--tx-dim);}
.rlp-field select option{background:var(--ink-2);color:var(--tx);}
.rlp-field .sel{position:relative;}
.rlp-field .sel-arrow{position:absolute;right:0;top:50%;transform:translateY(-50%);color:var(--g);pointer-events:none;font-size:12px;}

@media (prefers-reduced-motion:reduce){ * { scroll-behavior:auto; } }
`

type Form = {
  referencia_evento: string
  nome_noivos: string
  data_casamento: string
  local_cerimonia: string
  proposta: string
  // Noiva/Mãe
  nome_noiva: string
  morada_noiva: string
  tel_noiva: string
  cc_noiva: string
  nif_noiva: string
  email_noiva: string
  // Noivo/Pai
  nome_noivo: string
  morada_noivo: string
  tel_noivo: string
  cc_noivo: string
  nif_noivo: string
  email_noivo: string
  // Serviço
  servico: string
  // Batizado — Criança (só usado quando tipo='batizado')
  nome_crianca: string
  idade_crianca: string
}

const EMPTY: Form = {
  referencia_evento: '',
  nome_noivos: '', data_casamento: '', local_cerimonia: '', proposta: '',
  nome_noiva: '', morada_noiva: '', tel_noiva: '', cc_noiva: '', nif_noiva: '', email_noiva: '',
  nome_noivo: '', morada_noivo: '', tel_noivo: '', cc_noivo: '', nif_noivo: '', email_noivo: '',
  servico: '',
  nome_crianca: '', idade_crianca: '',
}

// ─── Labels condicionais por tipo ─────────────────────────────────────────────
function getLabels(tipo: Tipo) {
  if (tipo === 'batizado') {
    return {
      heroTitle: { line1: 'Dados para', line2: 'Contrato — Batizado' },
      heroIntro: 'Caros pais,',
      sec01Label: 'Dados Gerais',
      sec02Label: 'Dados da Criança',
      sec03Label: 'Dados da Mãe',
      sec04Label: 'Dados do Pai',
      nome_noivos: 'Nome dos Pais',
      nome_noivos_placeholder: 'Ex.: Ana e João',
      data_evento: 'Data do Batizado',
      local_evento: 'Local da Cerimónia (Igreja)',
      local_evento_placeholder: 'Ex.: Igreja de São José',
      nome_noiva: 'Nome da Mãe',
      morada_noiva: 'Morada Completa da Mãe',
      tel_noiva: 'Contato da Mãe',
      cc_noiva: 'N.º C. de Cidadão da Mãe',
      nif_noiva: 'N.º Iden. Fiscal da Mãe',
      email_noiva: 'E-mail da Mãe',
      nome_noivo: 'Nome do Pai',
      morada_noivo: 'Morada Completa do Pai',
      tel_noivo: 'Contato do Pai',
      cc_noivo: 'N.º C. de Cidadão do Pai',
      nif_noivo: 'N.º Iden. Fiscal do Pai',
      email_noivo: 'E-mail do Pai',
    }
  }
  // casamento (default)
  return {
    heroTitle: { line1: 'Dados para', line2: 'Contrato CPS' },
    heroIntro: 'Caros noivos,',
    sec01Label: 'Dados Gerais',
    sec02Label: 'Dados da Noiva',
    sec03Label: 'Dados do Noivo',
    sec04Label: '', // não usado
    nome_noivos: 'Nome dos Noivos',
    nome_noivos_placeholder: 'Ex.: Ana e João',
    data_evento: 'Data do Casamento',
    local_evento: 'Local da Cerimónia (Igreja + Quinta)',
    local_evento_placeholder: 'Ex.: Igreja de São José + Quinta dos Lagos',
    nome_noiva: 'Nome da Noiva',
    morada_noiva: 'Morada Completa da Noiva',
    tel_noiva: 'Contato Noiva',
    cc_noiva: 'N.º C. de Cidadão Noiva',
    nif_noiva: 'N.º Iden. Fiscal Noiva',
    email_noiva: 'E-mail Noiva',
    nome_noivo: 'Nome do Noivo',
    morada_noivo: 'Morada Completa do Noivo',
    tel_noivo: 'Contato do Noivo',
    cc_noivo: 'N.º C. Cidadão Noivo',
    nif_noivo: 'N.º Ide. Fiscal Noivo',
    email_noivo: 'E-mail do Noivo',
  }
}

// ─── Field wrapper (design system) ────────────────────────────────────────────
function Field({
  label, name, value, onChange, type = 'text', required, placeholder,
}: {
  label: string
  name: keyof Form
  value: string
  onChange: (k: keyof Form, v: string) => void
  type?: 'text' | 'email' | 'tel' | 'date' | 'number'
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="rlp-field">
      <span className="lab">{label}{required && <span className="req">*</span>}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        required={required}
        placeholder={placeholder}
      />
    </label>
  )
}

function Select({
  label, name, value, onChange, options, required,
}: {
  label: string
  name: keyof Form
  value: string
  onChange: (k: keyof Form, v: string) => void
  options: string[]
  required?: boolean
}) {
  return (
    <label className="rlp-field">
      <span className="lab">{label}{required && <span className="req">*</span>}</span>
      <div className="sel">
        <select value={value} onChange={e => onChange(name, e.target.value)} required={required}>
          <option value="">— Seleciona —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="sel-arrow">▾</span>
      </div>
    </label>
  )
}

// ─── Section divider (design system) ──────────────────────────────────────────
function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-9 mt-16 first:mt-0">
      <span className="rlp-eyebrow">{kicker}</span>
      <h2 className="rlp-h2" style={{ fontSize: 'clamp(26px,4vw,42px)', marginTop: 16 }}>{title}</h2>
    </div>
  )
}

export default function FormularioCPS({
  sectionName,
  backHref = '/contrato-cps',
  tipo = 'casamento',
}: {
  sectionName?: string
  backHref?: string
  tipo?: Tipo
}) {
  const [form, setForm] = useState<Form>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const L = getLabels(tipo)
  const isBatizado = tipo === 'batizado'

  // Pre-fill da referência via ?ref=XXX (vinda do portal ou link da proposta)
  const searchParams = useSearchParams()
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      setForm(prev => prev.referencia_evento ? prev : { ...prev, referencia_evento: ref })
    }
  }, [searchParams])

  // Barra de progresso + estado da nav
  useEffect(() => {
    const onScroll = () => {
      const st = window.scrollY || document.documentElement.scrollTop
      const h = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const prog = document.getElementById('rlp-prog')
      if (prog) prog.style.width = `${h > 0 ? (st / h) * 100 : 0}%`
      const bar = document.getElementById('rlp-bar')
      if (bar) bar.classList.toggle('s', st > 40)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function update(k: keyof Form, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/contrato-cps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tipo_evento: tipo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e: any) {
      setError(e.message ?? 'Erro ao enviar')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Pós-submit: thank you ──────────────────────────────────────────────────
  if (success) {
    return (
      <main className="rl-portal flex items-center justify-center px-4 py-12">
        <style>{RLP_CSS}</style>
        <div className="rlp-grain" aria-hidden />
        <div className="rlp-vig" aria-hidden />
        <div className="w-full text-center flex flex-col items-center" style={{ maxWidth: 560 }}>
          <div className="mb-8 flex items-center justify-center" style={{ width: 60, height: 60, borderRadius: '50%', border: '1px solid var(--g)' }}>
            <span style={{ color: 'var(--g)', fontSize: 22 }}>✦</span>
          </div>
          <span className="rlp-eyebrow c" style={{ marginBottom: 22 }}>Confirmado</span>
          <h1 className="rlp-h1" style={{ fontSize: 'clamp(40px,7vw,80px)', marginBottom: 14 }}>Dados <em>recebidos</em></h1>
          <p className="rlp-ed" style={{ fontSize: 'clamp(18px,2.2vw,24px)', fontStyle: 'italic', color: 'var(--g)', marginBottom: 26 }}>
            Obrigado pela vossa confiança
          </p>
          <p className="rlp-lede" style={{ maxWidth: '44ch', marginBottom: 34 }}>
            Recebemos os vossos dados para o contrato. Em breve entraremos em contacto para os próximos passos.
          </p>
          <Link href={backHref} className="rlp-link-u"><span className="a">‹</span><span>Voltar</span></Link>
        </div>
      </main>
    )
  }

  // ─── Form principal ────────────────────────────────────────────────────────
  return (
    <main className="rl-portal">
      <style>{RLP_CSS}</style>

      {/* Atmosfera */}
      <div className="rlp-grain" aria-hidden />
      <div className="rlp-vig" aria-hidden />
      <div id="rlp-prog" className="rlp-prog" aria-hidden />

      {/* Barra fixa */}
      <header id="rlp-bar" className="rlp-bar">
        <Link href="/" className="rlp-mono" aria-label="RL Photo · Video">
          <span>RL</span><i>Photo · Video</i>
        </Link>
        <Link href={backHref} className="rlp-link-u"><span className="a">‹</span><span>Voltar</span></Link>
      </header>

      <div className="rlp-wrap" style={{ paddingTop: 'clamp(120px,18vh,200px)', paddingBottom: 'clamp(60px,10vh,120px)' }}>

        {/* Hero */}
        <header className="text-center flex flex-col items-center" style={{ marginBottom: 'clamp(48px,8vh,90px)' }}>
          <span className="rlp-eyebrow c" style={{ marginBottom: 24 }}>RL Photo · Video</span>
          <h1 className="rlp-h1" style={{ fontSize: 'clamp(40px,8vw,92px)' }}>
            {L.heroTitle.line1}<br /><em>{L.heroTitle.line2}</em>
          </h1>
          <div style={{ width: 60, height: 1, background: 'var(--g)', opacity: .5, margin: '32px 0' }} />
          <p className="rlp-ed" style={{ fontSize: 'clamp(18px,2.2vw,23px)', lineHeight: 1.6, maxWidth: '40ch' }}>
            <em>{L.heroIntro}</em> espero que se encontrem bem. Quero expressar o nosso sincero <em>muito obrigado</em> pela confiança que depositaram na nossa equipa ao escolher os nossos serviços.
          </p>
          <p className="rlp-lede" style={{ marginTop: 24, maxWidth: '52ch' }}>
            Para preparar o contrato, precisamos de alguns dados. Preencham o formulário abaixo da forma mais completa possível — nomes completos, moradas com código postal e quaisquer serviços extras pretendidos.
          </p>
          {sectionName && (
            <p style={{ marginTop: 28, fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--tx-dim)' }}>
              {sectionName}
            </p>
          )}
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-7">

          {/* ── Dados Gerais ── */}
          {/* Referência do evento: capturada automaticamente via ?ref= (não visível) */}
          <SectionTitle kicker="Secção 01" title={L.sec01Label} />
          <Field label={L.nome_noivos} name="nome_noivos" value={form.nome_noivos} onChange={update} required placeholder={L.nome_noivos_placeholder} />
          <Field label={L.data_evento} name="data_casamento" value={form.data_casamento} onChange={update} type="date" required />
          <Field label={L.local_evento} name="local_cerimonia" value={form.local_cerimonia} onChange={update} required placeholder={L.local_evento_placeholder} />
          <Select label="Proposta Escolhida" name="proposta" value={form.proposta} onChange={update} options={PROPOSTAS_DEFAULT} required />

          {/* ── Secção 02: Dados da Criança (só batizado) ── */}
          {isBatizado && (
            <>
              <SectionTitle kicker="Secção 02" title={L.sec02Label} />
              <Field label="Nome da Criança" name="nome_crianca" value={form.nome_crianca} onChange={update} required placeholder="Nome completo" />
              <Field label="Idade da Criança" name="idade_crianca" value={form.idade_crianca} onChange={update} required placeholder="Ex.: 6 meses, 2 anos" />
            </>
          )}

          {/* ── Noiva/Mãe ── */}
          <SectionTitle kicker={isBatizado ? 'Secção 03' : 'Secção 02'} title={isBatizado ? L.sec03Label : L.sec02Label} />
          <Field label={L.nome_noiva} name="nome_noiva" value={form.nome_noiva} onChange={update} required />
          <Field label={L.morada_noiva} name="morada_noiva" value={form.morada_noiva} onChange={update} required placeholder="Rua, número, código postal, localidade" />
          <Field label={L.tel_noiva} name="tel_noiva" value={form.tel_noiva} onChange={update} type="tel" required placeholder="+351 9XX XXX XXX" />
          <Field label={L.cc_noiva} name="cc_noiva" value={form.cc_noiva} onChange={update} required />
          <Field label={L.nif_noiva} name="nif_noiva" value={form.nif_noiva} onChange={update} required />
          <Field label={L.email_noiva} name="email_noiva" value={form.email_noiva} onChange={update} type="email" required />

          {/* ── Noivo/Pai ── */}
          <SectionTitle kicker={isBatizado ? 'Secção 04' : 'Secção 03'} title={isBatizado ? L.sec04Label : L.sec03Label} />
          <Field label={L.nome_noivo} name="nome_noivo" value={form.nome_noivo} onChange={update} required />
          <Field label={L.morada_noivo} name="morada_noivo" value={form.morada_noivo} onChange={update} required placeholder="Rua, número, código postal, localidade" />
          <Field label={L.tel_noivo} name="tel_noivo" value={form.tel_noivo} onChange={update} type="tel" required placeholder="+351 9XX XXX XXX" />
          <Field label={L.cc_noivo} name="cc_noivo" value={form.cc_noivo} onChange={update} required />
          <Field label={L.nif_noivo} name="nif_noivo" value={form.nif_noivo} onChange={update} required />
          <Field label={L.email_noivo} name="email_noivo" value={form.email_noivo} onChange={update} type="email" required />

          {/* ── Submit ── */}
          <div className="pt-14 pb-6 flex flex-col items-center gap-6">
            {error && (
              <div className="w-full text-center" style={{ padding: '14px 20px', borderRadius: 8, border: '1px solid rgba(231,155,155,.4)', background: 'rgba(231,155,155,.06)', color: '#e79b9b', fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: '.06em' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={submitting} className="rlp-btn full">
              <span className="fill" /><span className="dot" />{submitting ? 'A enviar…' : 'Enviar Dados'}
            </button>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--tx-dim)' }}>
              Os vossos dados são tratados com confidencialidade
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}
