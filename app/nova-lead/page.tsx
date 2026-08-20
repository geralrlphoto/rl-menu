'use client'

import { useState, useEffect, useRef } from 'react'


// Sistema de design partilhado com /adquirir-fotografias (.adqf).
// O @import tem de viajar num <style> em runtime: o Turbopack remove os
// @import dos ficheiros .css no build de producao.
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,200;0,300;0,400;1,200;1,300&family=Hanken+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
.nlead{
  --ink:#0b0a08; --ink-2:#100e0b; --ink-3:#16130f;
  --g:#d8be93; --g-deep:#c8a866;
  --tx:rgba(243,237,226,.92); --tx-mid:rgba(243,237,226,.6); --tx-dim:rgba(243,237,226,.4);
  --line:rgba(243,237,226,.14); --line-soft:rgba(243,237,226,.08);
  --fd:'Jost',sans-serif; --fb:'Hanken Grotesk',sans-serif; --fm:'Space Mono',monospace;
  --ease:cubic-bezier(.16,1,.3,1);
  background:var(--ink); color:var(--tx); font-family:var(--fb); line-height:1.5;
  min-height:100vh; -webkit-font-smoothing:antialiased;
}
.nlead ::selection{background:var(--g);color:var(--ink);}

.nlead .fx-grain{position:fixed;inset:0;z-index:40;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");background-size:130px;}
.nlead .fx-vig{position:fixed;inset:0;z-index:39;pointer-events:none;box-shadow:inset 0 0 240px 40px rgba(0,0,0,.5);}

.nlead h1,.nlead h2{font-family:var(--fd);font-weight:200;line-height:1.04;letter-spacing:-.02em;color:var(--tx);}
.nlead h1 em,.nlead h2 em{font-style:italic;color:var(--g);}
.nlead .eyebrow{font-family:var(--fm);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--g);display:inline-flex;gap:.8em;align-items:center;}
.nlead .eyebrow::before{content:"";width:34px;height:1px;background:var(--g);opacity:.6;}
.nlead .rule{width:34px;height:1px;background:var(--g);opacity:.6;}
.nlead .lead{color:var(--tx-mid);line-height:1.7;font-size:clamp(15px,1.15vw,18px);}
.nlead .quest{font-family:var(--fd);font-weight:200;font-size:clamp(21px,2.4vw,28px);line-height:1.2;letter-spacing:-.01em;color:var(--tx);}
.nlead .quest em{font-style:italic;color:var(--g);}
.nlead .hint{font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-dim);}

.nlead .flabel{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);display:block;margin-bottom:12px;}
.nlead .flabel .opt{color:var(--tx-dim);}
.nlead .finput{width:100%;background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--tx);
  font-family:var(--fd);font-weight:300;font-size:clamp(17px,1.6vw,22px);padding:8px 0 13px;outline:none;
  transition:border-color .4s var(--ease);}
.nlead .finput::placeholder{color:var(--tx-dim);}
.nlead .finput:focus{border-color:var(--g);}
.nlead select.finput{appearance:none;cursor:pointer;}
.nlead select.finput option{background:var(--ink-2);color:var(--tx);}
.nlead textarea.finput{resize:none;min-height:74px;font-size:clamp(16px,1.4vw,20px);}

.nlead .pill{font-family:var(--fm);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-mid);
  background:transparent;border:1px solid var(--line-soft);border-radius:40px;padding:11px 20px;cursor:pointer;
  transition:.3s var(--ease);}
.nlead .pill:hover{border-color:var(--line);color:var(--tx);}
.nlead .pill.on{border-color:var(--g);background:rgba(216,190,147,.06);color:var(--g);}

.nlead .seg{display:grid;gap:12px;}
.nlead .segbtn{display:flex;align-items:center;gap:14px;width:100%;text-align:left;border:1px solid var(--line-soft);
  border-radius:10px;padding:16px 20px;background:transparent;cursor:pointer;transition:.4s var(--ease);}
.nlead .segbtn:hover{border-color:var(--line);}
.nlead .segbtn.on{border-color:var(--g);background:rgba(216,190,147,.06);}
.nlead .segbtn .t{font-family:var(--fd);font-weight:300;font-size:18px;color:var(--tx-mid);line-height:1.25;}
.nlead .segbtn.on .t{color:var(--g);}
.nlead .segbtn.sm{padding:12px 14px;gap:11px;border-radius:9px;}
.nlead .segbtn.sm .t{font-size:15px;}
.nlead .mk{width:16px;height:16px;border-radius:50%;border:1px solid var(--line);flex:none;display:grid;place-items:center;transition:.3s;}
.nlead .segbtn.on .mk{border-color:var(--g);}
.nlead .segbtn.on .mk::after{content:"";width:6px;height:6px;border-radius:50%;background:var(--g);}
.nlead .segbtn.sm .mk{width:13px;height:13px;}
.nlead .segbtn.sm.on .mk::after{width:5px;height:5px;}

.nlead .btn{display:inline-flex;align-items:center;justify-content:center;gap:.9em;position:relative;isolation:isolate;
  font-family:var(--fm);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink);
  padding:18px 34px;border:1px solid var(--g);border-radius:40px;overflow:hidden;background:var(--g);cursor:pointer;
  transition:color .5s var(--ease);}
.nlead .btn .fill{position:absolute;inset:0;z-index:-1;background:var(--ink);transform:translateY(101%);transition:transform .6s var(--ease);}
.nlead .btn:hover{color:var(--g);}
.nlead .btn:hover .fill{transform:translateY(0);}
.nlead .btn:disabled{opacity:.4;cursor:not-allowed;}
.nlead .btn:disabled .fill{transform:translateY(101%);}
.nlead .btn-ghost{font-family:var(--fm);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);
  background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:.7em;transition:color .3s;}
.nlead .btn-ghost:hover{color:var(--g);}

.nlead .err{font-family:var(--fm);font-size:11px;letter-spacing:.1em;color:#d98a7a;}
.nlead .meta{font-family:var(--fm);font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--tx-dim);}
`

// ── Opções ────────────────────────────────────────────────────────────────────
const TIPO_EVENTO   = ['Casamento', 'Batizado', 'Casamento e Batizado']
const TIPO_CERIMONIA = ['Religiosa', 'Civil', 'Outra']
const COMO_CHEGOU  = ['Instagram', 'Facebook', 'Google', 'Recomendação de amigos', 'TikTok', 'Pinterest', 'Casamentos.pt', 'Outro']
const SERVICOS_PRINCIPAIS = ['Fotografia', 'Vídeo']

const ADICIONAIS_FOTO = [
  'Pré-Wedding',
  'Trash the Dress',
  'Álbum Impresso',
  'Sessão de Família',
  'Galerias Abertas',
]

const ADICIONAIS_VIDEO = [
  'Pré-Wedding',
  'Trash the Dress',
  'Drone',
  'Same Day Edit',
  'Vídeos Originais',
  'Sessão de Família',
  'Trailer',
]

const ESTILO = ['Elegante', 'Minimalista', 'Romântico', 'Documental', 'Vibrante']

const STEPS = [
  { num: '01', titulo: '',                          sub: '' },
  { num: '02', titulo: '',                          sub: '' },
  { num: '03', titulo: 'O Vosso Evento',            sub: 'Conte-nos sobre o grande dia' },
  { num: '04', titulo: 'Perguntas que ninguém faz', sub: 'Queremos conhecer-vos melhor' },
  { num: '05', titulo: 'Serviços & Detalhes',       sub: 'O que precisam de nós' },
  { num: '06', titulo: 'Os vossos contactos',       sub: 'Para podermos falar convosco' },
]

// ── Helpers de animação ───────────────────────────────────────────────────────
function useFadeIn(trigger: number) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [trigger])
  return visible
}

// ── Componentes de input ──────────────────────────────────────────────────────
function LeadInput({ label, type = 'text', value, onChange, placeholder, required }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="flabel">
        {label}{required && <span className="opt"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="finput"
      />
    </div>
  )
}

function LeadSelect({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean
}) {
  return (
    <div>
      <label className="flabel">
        {label}{required && <span className="opt"> *</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="finput"
        style={{ color: value ? undefined : 'rgba(243,237,226,.4)' }}
      >
        <option value="" disabled>Selecionar...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function PillToggle({ options, value, onChange, multi = false }: {
  options: string[]; value: string | string[]; onChange: (v: any) => void; multi?: boolean
}) {
  const isActive = (opt: string) => multi ? (value as string[]).includes(opt) : value === opt
  const toggle = (opt: string) => {
    if (multi) {
      const arr = value as string[]
      onChange(arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt])
    } else {
      onChange(value === opt ? '' : opt)
    }
  }
  return (
    <div className="flex flex-wrap gap-2.5 pt-1">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => toggle(opt)}
          className={`pill${isActive(opt) ? ' on' : ''}`}>
          {opt}
        </button>
      ))}
    </div>
  )
}

function ServicoCheck({ options, value, onChange }: {
  options: string[]; value: string[]; onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter(x => x !== opt) : [...value, opt])
  return (
    <div className="seg pt-1">
      {options.map(opt => {
        const active = value.includes(opt)
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className={`segbtn${active ? ' on' : ''}`}>
            <span className="mk" />
            <span className="t">{opt}</span>
          </button>
        )
      })}
    </div>
  )
}

const LS_KEY = 'rl_nova_lead_draft'

const FORM_DEFAULT = {
  tipoEvento:       '',
  nome:             '',
  dataEvento:       '',
  local:            '',
  tipoCerimonia:    [] as string[],
  numConvidados:    '',
  contato:          '',
  email:            '',
  zonaResidencia:   '',
  comoChegou:       '',
  estilo:           [] as string[],
  visao20anos:      '',
  trabalhoFavorito: '',
  servicos:         [] as string[],
  orcamento:        '',
  preocupacoes:     '',
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function NovaLeadPage() {
  const [step, setStep]       = useState(0)
  const [sending, setSending] = useState(false)
  const [done, setDone]       = useState(false)
  const [erro, setErro]       = useState('')
  const visible               = useFadeIn(step)
  const topRef                = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState(FORM_DEFAULT)

  // ── Restaurar rascunho do localStorage ──────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const { step: savedStep, form: savedForm } = JSON.parse(saved)
        if (savedForm) setForm({ ...FORM_DEFAULT, ...savedForm })
        if (typeof savedStep === 'number') setStep(savedStep)
      }
    } catch {}
  }, [])

  // ── Guardar rascunho sempre que muda ────────────────────────────────────────
  useEffect(() => {
    if (done) { localStorage.removeItem(LS_KEY); return }
    try { localStorage.setItem(LS_KEY, JSON.stringify({ step, form })) } catch {}
  }, [step, form, done])

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(p => ({ ...p, [k]: v }))
  }

  // Valida campos obrigatórios do step atual.
  // Retorna string com mensagem de erro, ou null se tudo OK.
  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!form.nome.trim()) return 'Diz-nos o vosso nome.'
    }
    if (s === 2) {
      if (!form.tipoEvento) return 'Escolhe o tipo de evento.'
      if (!form.dataEvento) return 'Data do evento é obrigatória.'
      if (!form.local.trim()) return 'Local do evento é obrigatório.'
      if (form.tipoCerimonia.length === 0) return 'Escolhe pelo menos um tipo de cerimónia.'
      if (!form.numConvidados.trim()) return 'Número de convidados é obrigatório.'
    }
    if (s === 3) {
      if (form.estilo.length === 0) return 'Escolhe pelo menos um estilo.'
      if (!form.visao20anos.trim()) return 'Conta-nos como imaginam olhar para as fotos daqui a 20 anos.'
      if (!form.trabalhoFavorito.trim()) return 'Indica um trabalho nosso que vos emocionou (ou escreve "nenhum").'
      if (!form.preocupacoes.trim()) return 'Conta-nos as vossas preocupações (ou escreve "nenhuma").'
    }
    if (s === 4) {
      if (form.servicos.length === 0) return 'Escolhe pelo menos um serviço.'
      if (!form.orcamento.trim()) return 'Indica um orçamento previsto.'
    }
    if (s === 5) {
      if (!form.contato.trim()) return 'Telemóvel é obrigatório.'
      if (!form.email.trim()) return 'E-mail é obrigatório.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'E-mail inválido.'
      if (!form.zonaResidencia.trim()) return 'Zona de residência é obrigatória.'
      if (!form.comoChegou) return 'Diz-nos como chegaram até nós.'
    }
    return null
  }

  function goNext() {
    const err = validateStep(step)
    if (err) { setErro(err); return }
    setErro('')
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
    setStep(s => s + 1)
  }
  function goBack() {
    setErro('')
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
    setStep(s => s - 1)
  }

  async function handleSubmit() {
    // Valida TODOS os steps (defensivo — se o user saltar steps via back/forward)
    for (const s of [0, 2, 3, 4, 5]) {
      const err = validateStep(s)
      if (err) { setErro(err); setStep(s); return }
    }
    setErro('')
    setSending(true)
    try {
      const res = await fetch('/api/nova-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome:              form.nome,
          email:             form.email,
          contato:           form.contato,
          data_casamento:    form.dataEvento,
          local_casamento:   form.local,
          como_chegou:       form.comoChegou,
          servicos:          form.servicos.join(', '),
          tipo_cerimonia:    form.tipoCerimonia.join(', '),
          tipo_evento:       form.tipoEvento,
          orcamento:         form.orcamento,
          num_convidados:    form.numConvidados,
          zona_residencia:   form.zonaResidencia,
          estilo:            form.estilo.join(', '),
          visao_20anos:      form.visao20anos,
          trabalho_favorito: form.trabalhoFavorito,
          mensagem:          form.preocupacoes,
        }),
      })
      if (!res.ok) { const d = await res.json(); setErro(d.error || 'Erro ao enviar'); return }
      setDone(true)
    } catch { setErro('Erro de ligação. Tente novamente.') }
    finally { setSending(false) }
  }

  const progress = ((step) / STEPS.length) * 100

  // ── Ecrã de sucesso ───────────────────────────────────────────────────────
  if (done) return (
    <div className="nlead relative flex items-center justify-center px-6 py-20">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="fx-grain" />
      <div className="fx-vig" />
      <div className="relative text-center max-w-md space-y-8">
        <div className="flex justify-center">
          <img
            src="/logo_rl_gold.png"
            alt="RL Photo · Video"
            className="w-28 opacity-80"
          />
        </div>
        <div className="flex justify-center">
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="23" stroke="rgba(216,190,147,0.35)" strokeWidth="1"/>
            <path d="M14 24l7 7 13-14" stroke="#d8be93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="space-y-4">
          <h1 style={{ fontSize: 'clamp(34px,5.5vw,58px)' }}>
            Obrigado<br /><em>pelo vosso contacto</em>
          </h1>
          <p className="lead">
            Recebemos a vossa mensagem e entraremos em contacto convosco em breve.
          </p>
        </div>
        <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(216,190,147,0.35),transparent)' }} />
        <p className="meta">www.rlprod.pt</p>
      </div>
    </div>
  )

  const cur = STEPS[step]

  return (
    <div className="nlead relative" ref={topRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Textura — grao + vinheta, iguais a /adquirir-fotografias */}
      <div className="fx-grain" />
      <div className="fx-vig" />

      {/* Barra de progresso */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px]" style={{ background: 'rgba(243,237,226,0.08)' }}>
        <div className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: '#d8be93' }} />
      </div>

      <div className="relative max-w-lg mx-auto px-6 pt-14 pb-16 sm:pt-16 sm:pb-20">

        {/* Logo centrado */}
        <div className="flex justify-center mb-12">
          <img
            src="/logo_rl_gold.png"
            alt="RL Photo · Video"
            className="w-28 sm:w-36 opacity-80"
          />
        </div>

        {/* Contador de step — visível só a partir do step 2 */}
        {step >= 2 && (
          <div className="flex justify-end mb-6">
            <p className="meta">
              {String(step - 1).padStart(2, '0')} / {String(STEPS.length - 2).padStart(2, '0')}
            </p>
          </div>
        )}

        {/* Step content */}
        <div
          className="transition-all duration-500"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          {/* ── STEP 0 — só nome ─── */}
          {step === 0 && (
            <div className="space-y-10">
              <div className="space-y-3">
                <h2 style={{ fontSize: 'clamp(38px,7vw,72px)' }}>
                  Como se <em>chamam?</em>
                </h2>
                <div className="rule" />
              </div>
              <LeadInput label="Nome dos Noivos / Família" value={form.nome} onChange={v => set('nome', v)}
                placeholder="Ex: Ana & João Silva" required />
            </div>
          )}

          {/* ── STEP 1 — Boas-vindas ─── */}
          {step === 1 && (
            <div className="space-y-8">
              {/* Saudação */}
              <div className="space-y-1">
                <p className="eyebrow">Olá</p>
                <h2 className="mt-3" style={{ fontSize: 'clamp(34px,6vw,64px)' }}>
                  {form.nome || 'bem-vindos'}
                </h2>
                <div className="rule mt-4" />
              </div>

              {/* Mensagem */}
              <div className="space-y-5">
                <p className="lead">
                  Queremos que o registo do vosso casamento seja exactamente como sempre imaginaram, cada detalhe, cada emoção, cada momento único.
                </p>
                <p className="lead">
                  Este briefing foi criado para conhecermos melhor o vosso estilo, as vossas preferências e as expectativas para a fotografia e o vídeo do grande dia.
                </p>

                <div className="space-y-2 pl-1">
                  <p className="flabel" style={{ marginBottom: 4 }}>
                    Ao preencherem este questionário, ajudam-nos a
                  </p>
                  {[
                    'Personalizar a nossa abordagem ao vosso dia',
                    'Garantir que captamos o que mais valorizam em cada momento',
                    'Chegar à reunião com uma proposta pensada para vocês',
                  ].map(item => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-2 shrink-0 w-1 h-1 rounded-full" style={{ background: '#d8be93' }} />
                      <p className="lead">{item}</p>
                    </div>
                  ))}
                </div>

                <p className="lead">
                  Quanto mais soubermos agora, mais presentes estaremos no dia, para que possam simplesmente viver cada instante enquanto nós eternizamos tudo.
                </p>

                <p className="lead italic" style={{ color: 'rgba(243,237,226,.4)' }}>
                  Preencham com calma e sinceridade. Tudo o que partilharem será usado para criar um registo fiel e emocionante do vosso casamento.
                </p>
              </div>
            </div>
          )}

          {/* Título dos steps 2–5 */}
          {step >= 2 && (
            <div className="mb-10 space-y-2">
              <p className="eyebrow">{cur.sub}</p>
              <h2 className="mt-3" style={{ fontSize: 'clamp(32px,5.5vw,58px)' }}>
                {cur.titulo}
              </h2>
              <div className="rule mt-4" />
            </div>
          )}

          {/* ── STEP 2 — O Vosso Evento + Local & Cerimónia ─── */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="space-y-2">
                <p className="flabel">Tipo de Evento <span className="opt">*</span></p>
                <PillToggle options={TIPO_EVENTO} value={form.tipoEvento} onChange={v => set('tipoEvento', v)} />
              </div>
              <LeadInput label="Data do Evento" type="date" value={form.dataEvento} onChange={v => set('dataEvento', v)} required />
              <LeadInput label="Local do Evento (Cerimónia + Quinta)" value={form.local} onChange={v => set('local', v)}
                placeholder="Ex: Igreja X + Quinta Y" required />
              <div className="space-y-2">
                <p className="flabel">Tipo de Cerimónia <span className="opt">*</span></p>
                <PillToggle options={TIPO_CERIMONIA} value={form.tipoCerimonia} onChange={v => set('tipoCerimonia', v)} multi />
              </div>
              <LeadInput label="Número de Convidados (sensivelmente)" value={form.numConvidados}
                onChange={v => set('numConvidados', v)} placeholder="Ex: 150" required />
            </div>
          )}

          {/* ── STEP 3 — Perguntas que ninguém faz ─── */}
          {step === 3 && (
            <div className="space-y-10">

              {/* Estilo */}
              <div className="space-y-3">
                <div>
                  <p className="quest"><em>Qual é o vosso estilo?</em> <span className="hint">*</span></p>
                  <p className="hint mt-2">Podem escolher mais do que um</p>
                </div>
                <PillToggle options={ESTILO} value={form.estilo} onChange={v => set('estilo', v)} multi />
              </div>

              {/* Visão 20 anos */}
              <div className="space-y-3">
                <p className="quest"><em>Como imaginam olhar para as fotos e o vídeo daqui a 20 anos?</em> <span className="hint">*</span></p>
                <textarea
                  value={form.visao20anos}
                  onChange={e => set('visao20anos', e.target.value)}
                  rows={3}
                  placeholder="Partilhem o que sentem..."
                  className="finput"
                />
              </div>

              {/* Trabalho favorito */}
              <div className="space-y-3">
                <p className="quest"><em>Já viram algum trabalho nosso que vos emocionou?</em> <span className="hint">*</span></p>
                <LeadInput label="Link ou descrição" value={form.trabalhoFavorito}
                  onChange={v => set('trabalhoFavorito', v)}
                  placeholder="Ex: o vídeo do casamento na Quinta..." required />
              </div>

              {/* Preocupações */}
              <div className="space-y-3">
                <p className="quest"><em>Há algo que não gostam em fotos ou vídeo?</em> <span className="hint">*</span></p>
                <textarea
                  value={form.preocupacoes}
                  onChange={e => set('preocupacoes', e.target.value)}
                  rows={3}
                  placeholder="Poses, ângulos, estilos de edição (ou escreve 'nenhuma')..."
                  className="finput"
                />
              </div>

            </div>
          )}

          {/* ── STEP 4 — Serviços & Detalhes ─── */}
          {step === 4 && (
            <div className="space-y-8">
              {/* Serviço principal */}
              <div className="space-y-3">
                <p className="flabel">O que pretendem? <span className="opt">*</span></p>
                <div className="flex gap-3">
                  {SERVICOS_PRINCIPAIS.map(s => {
                    const active = form.servicos.includes(s)
                    return (
                      <button key={s} type="button"
                        onClick={() => set('servicos', active ? form.servicos.filter(x => x !== s) : [...form.servicos, s])}
                        className={`segbtn${active ? ' on' : ''}`}
                        style={{ flex: 1, justifyContent: 'center' }}>
                        <span className="mk" />
                        <span className="t">{s}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Adicionais — duas colunas */}
              <div className="space-y-3">
                <p className="flabel">Serviços adicionais</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Coluna Fotografia */}
                  <div className="space-y-1.5">
                    <p className="flabel">Fotografia</p>
                    {ADICIONAIS_FOTO.map(s => {
                      const key = `${s} — Fotografia`
                      const active = form.servicos.includes(key)
                      return (
                        <button key={key} type="button"
                          onClick={() => set('servicos', active ? form.servicos.filter(x => x !== key) : [...form.servicos, key])}
                          className={`segbtn sm${active ? ' on' : ''}`}>
                          <span className="mk" />
                          <span className="t">{s}</span>
                        </button>
                      )
                    })}
                  </div>
                  {/* Coluna Vídeo */}
                  <div className="space-y-1.5">
                    <p className="flabel">Vídeo</p>
                    {ADICIONAIS_VIDEO.map(s => {
                      const key = `${s} — Vídeo`
                      const active = form.servicos.includes(key)
                      return (
                        <button key={key} type="button"
                          onClick={() => set('servicos', active ? form.servicos.filter(x => x !== key) : [...form.servicos, key])}
                          className={`segbtn sm${active ? ' on' : ''}`}>
                          <span className="mk" />
                          <span className="t">{s}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              <LeadInput label="Orçamento Previsto (sensivelmente)" value={form.orcamento}
                onChange={v => set('orcamento', v)} placeholder="Ex: 2.000 — 3.000€" required />
            </div>
          )}

          {/* ── STEP 5 — Contactos ─── */}
          {step === 5 && (
            <div className="space-y-8">
              <LeadInput label="Telemóvel" type="tel" value={form.contato}
                onChange={v => set('contato', v)} placeholder="Ex: 912 345 678" required />
              <LeadInput label="E-mail" type="email" value={form.email}
                onChange={v => set('email', v)} placeholder="Ex: ana@email.com" required />
              <LeadInput label="Zona de Residência" value={form.zonaResidencia}
                onChange={v => set('zonaResidencia', v)} placeholder="Ex: Lisboa, Setúbal..." required />
              <LeadSelect label="Como chegaram até nós?" value={form.comoChegou}
                onChange={v => set('comoChegou', v)} options={COMO_CHEGOU} required />
            </div>
          )}

          {/* Erro */}
          {erro && (
            <p className="err mt-6">{erro}</p>
          )}

          {/* Navegação */}
          <div className="mt-12 flex items-center justify-between gap-4">
            {step > 0 ? (
              <button onClick={goBack} type="button" className="btn-ghost">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
                Anterior
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button onClick={goNext} type="button" className="btn">
                <span className="fill" />
                {step === 0 ? 'Começar' : step === 1 ? 'Continuar' : 'Seguinte'}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={sending} type="button" className="btn">
                <span className="fill" />
                {sending ? 'A enviar...' : 'Enviar Pedido'}
                {!sending && (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Dots de progresso */}
          <div className="mt-12 flex items-center justify-center gap-2">
            {STEPS.map((_, i) => (
              <div key={i} className="rounded-full transition-all duration-300"
                style={i === step ? {
                  width: '24px', height: '2px', background: '#d8be93',
                } : i < step ? {
                  width: '8px', height: '2px', background: 'rgba(216,190,147,0.45)',
                } : {
                  width: '8px', height: '2px', background: 'rgba(243,237,226,0.12)',
                }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
