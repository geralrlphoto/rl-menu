'use client'

import { useState, useEffect, useRef } from 'react'

// ── Opções ────────────────────────────────────────────────────────────────────
const TIPO_EVENTO   = ['Casamento', 'Batizado', 'Casamento e Batizado']
const TIPO_CERIMONIA = ['Religiosa', 'Civil', 'Outra']
const COMO_CHEGOU  = ['Instagram', 'Facebook', 'Google', 'Recomendação de amigos', 'TikTok', 'Pinterest', 'Casamentos.pt', 'Outro']
const SERVICOS_PRINCIPAIS = ['Fotografia', 'Vídeo']

const SERVICOS_ADICIONAIS = [
  'Pré-Wedding — Fotografia',
  'Pré-Wedding — Vídeo',
  'Trash the Dress — Fotografia',
  'Trash the Dress — Vídeo',
  'Drone',
  'Same Day Edit',
  'Álbum Impresso',
  'Vídeos Originais',
  'Sessão de Família — Fotografia',
  'Sessão de Família — Vídeo',
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
    <div className="space-y-2">
      <label className="block text-[10px] tracking-[0.4em] uppercase font-medium" style={{ color: 'rgba(201,168,76,0.7)' }}>
        {label}{required && <span className="ml-1" style={{ color: 'rgba(201,168,76,0.4)' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none text-white placeholder-white/20 py-3 px-0 text-base font-cormorant tracking-wide transition-all duration-200"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.25)' }}
        onFocus={e => { e.currentTarget.style.borderBottomColor = 'rgba(201,168,76,0.8)' }}
        onBlur={e => { e.currentTarget.style.borderBottomColor = 'rgba(201,168,76,0.25)' }}
      />
    </div>
  )
}

function LeadSelect({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] tracking-[0.4em] uppercase font-medium" style={{ color: 'rgba(201,168,76,0.7)' }}>
        {label}{required && <span className="ml-1" style={{ color: 'rgba(201,168,76,0.4)' }}>*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent outline-none py-3 px-0 text-base font-cormorant tracking-wide transition-all duration-200 appearance-none cursor-pointer"
        style={{
          borderBottom: '1px solid rgba(201,168,76,0.25)',
          color: value ? 'white' : 'rgba(255,255,255,0.25)',
        }}
        onFocus={e => { e.currentTarget.style.borderBottomColor = 'rgba(201,168,76,0.8)' }}
        onBlur={e => { e.currentTarget.style.borderBottomColor = 'rgba(201,168,76,0.25)' }}
      >
        <option value="" disabled style={{ background: '#0a0a0a' }}>Selecionar...</option>
        {options.map(o => <option key={o} value={o} style={{ background: '#0a0a0a' }}>{o}</option>)}
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
    <div className="flex flex-wrap gap-2 pt-1">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => toggle(opt)}
          className="px-4 py-2 rounded-full text-xs tracking-widest uppercase transition-all duration-200 font-medium"
          style={isActive(opt) ? {
            background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.6)',
            color: '#C9A84C', boxShadow: '0 0 12px rgba(201,168,76,0.15)',
          } : {
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)',
          }}>
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
    <div className="grid grid-cols-1 gap-2 pt-1">
      {options.map(opt => {
        const active = value.includes(opt)
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150"
            style={active ? {
              background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.35)',
            } : {
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
            }}>
            <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center transition-all duration-150"
              style={active ? {
                background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.7)',
              } : {
                border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
              }}>
              {active && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A84C' }} />}
            </div>
            <span className="text-sm font-cormorant tracking-wide"
              style={{ color: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)' }}>
              {opt}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function NovaLeadPage() {
  const [step, setStep]       = useState(0)
  const [sending, setSending] = useState(false)
  const [done, setDone]       = useState(false)
  const [erro, setErro]       = useState('')
  const visible               = useFadeIn(step)
  const topRef                = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    tipoEvento:      '',
    nome:            '',
    dataEvento:      '',
    local:           '',
    tipoCerimonia:   [] as string[],
    numConvidados:   '',
    contato:         '',
    email:           '',
    zonaResidencia:  '',
    comoChegou:      '',
    estilo:          [] as string[],
    visao20anos:     '',
    trabalhoFavorito: '',
    servicos:        [] as string[],
    orcamento:       '',
    preocupacoes:    '',
  })

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function goNext() {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
    setStep(s => s + 1)
  }
  function goBack() {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
    setStep(s => s - 1)
  }

  async function handleSubmit() {
    setErro('')
    setSending(true)
    try {
      const res = await fetch('/api/nova-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome:           form.nome,
          email:          form.email,
          contato:        form.contato,
          data_casamento: form.dataEvento,
          local_casamento: form.local,
          como_chegou:    form.comoChegou,
          servicos:       form.servicos.join(', '),
          tipo_cerimonia: form.tipoCerimonia.join(', '),
          tipo_evento:    form.tipoEvento,
          orcamento:      form.orcamento,
          num_convidados: form.numConvidados,
          zona_residencia:  form.zonaResidencia,
          estilo:           form.estilo.join(', '),
          visao_20anos:     form.visao20anos,
          trabalho_favorito: form.trabalhoFavorito,
          mensagem:         form.preocupacoes,
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
    <div className="relative min-h-screen flex items-center justify-center px-6 py-20" style={{ background: '#0a0a0a' }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #0e0b07 0%, #1a1206 30%, #0e0b07 70%, #060504 100%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 75% 65% at 50% 48%, rgba(201,168,76,0.18) 0%, rgba(160,120,40,0.07) 45%, transparent 70%)' }} />
      <div className="relative text-center max-w-md space-y-8">
        <div className="flex justify-center">
          <img
            src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
            alt="RL Photo · Video"
            className="w-28 opacity-80"
          />
        </div>
        <div className="flex justify-center">
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="23" stroke="rgba(201,168,76,0.3)" strokeWidth="1"/>
            <path d="M14 24l7 7 13-14" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="space-y-4">
          <h1 className="font-playfair text-4xl font-light text-white leading-tight">
            Obrigado pela<br />vossa confiança
          </h1>
          <p className="font-cormorant text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Recebemos o vosso pedido e iremos entrar em contacto em breve para começarmos a criar algo especial juntos.
          </p>
        </div>
        <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent)' }} />
        <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
          rlphotovideo.pt
        </p>
      </div>
    </div>
  )

  const cur = STEPS[step]

  return (
    <div className="relative min-h-screen" style={{ background: '#0a0a0a' }} ref={topRef}>

      {/* Background proposta criativa */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'linear-gradient(160deg, #0e0b07 0%, #1a1206 30%, #0e0b07 70%, #060504 100%)' }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 75% 65% at 50% 48%, rgba(201,168,76,0.18) 0%, rgba(160,120,40,0.07) 45%, transparent 70%)' }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 40% 40% at 50% 48%, rgba(232,180,60,0.08) 0%, transparent 60%)' }} />

      {/* Barra de progresso */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg,rgba(201,168,76,0.5),#C9A84C)' }} />
      </div>

      <div className="relative max-w-lg mx-auto px-6 pt-14 pb-16 sm:pt-16 sm:pb-20">

        {/* Logo centrado */}
        <div className="flex justify-center mb-12">
          <img
            src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
            alt="RL Photo · Video"
            className="w-28 sm:w-36 opacity-80"
          />
        </div>

        {/* Contador de step — visível só a partir do step 2 */}
        {step >= 2 && (
          <div className="flex justify-end mb-6">
            <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.15)' }}>
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
                <h2 className="font-playfair text-4xl sm:text-5xl font-light italic text-white leading-tight">
                  Como se chamam?
                </h2>
                <div className="w-8 h-px" style={{ background: 'rgba(201,168,76,0.4)' }} />
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
                <p className="font-playfair text-2xl sm:text-3xl font-light leading-snug" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Olá,
                </p>
                <h2 className="font-playfair text-4xl sm:text-5xl font-light text-white leading-tight">
                  {form.nome || 'bem-vindos'}
                </h2>
                <div className="w-8 h-px mt-3" style={{ background: 'rgba(201,168,76,0.4)' }} />
              </div>

              {/* Mensagem */}
              <div className="space-y-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                <p className="font-cormorant text-xl leading-relaxed">
                  Queremos que o registo do vosso casamento seja exactamente como sempre imaginaram, cada detalhe, cada emoção, cada momento único.
                </p>
                <p className="font-cormorant text-xl leading-relaxed">
                  Este briefing foi criado para conhecermos melhor o vosso estilo, as vossas preferências e as expectativas para a fotografia e o vídeo do grande dia.
                </p>

                <div className="space-y-2 pl-1">
                  <p className="font-cormorant text-base tracking-wide" style={{ color: 'rgba(201,168,76,0.6)' }}>
                    Ao preencherem este questionário, ajudam-nos a:
                  </p>
                  {[
                    'Personalizar a nossa abordagem ao vosso dia',
                    'Garantir que captamos o que mais valorizam em cada momento',
                    'Chegar à reunião com uma proposta pensada para vocês',
                  ].map(item => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full" style={{ background: '#C9A84C' }} />
                      <p className="font-cormorant text-lg leading-snug">{item}</p>
                    </div>
                  ))}
                </div>

                <p className="font-cormorant text-xl leading-relaxed">
                  Quanto mais soubermos agora, mais presentes estaremos no dia, para que possam simplesmente viver cada instante enquanto nós eternizamos tudo.
                </p>

                <p className="font-cormorant text-base italic" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Preencham com calma e sinceridade. Tudo o que partilharem será usado para criar um registo fiel e emocionante do vosso casamento.
                </p>
              </div>
            </div>
          )}

          {/* Título dos steps 2–5 */}
          {step >= 2 && (
            <div className="mb-10 space-y-2">
              <p className="text-[10px] tracking-[0.45em] uppercase font-medium" style={{ color: 'rgba(201,168,76,0.55)' }}>
                {cur.sub}
              </p>
              <h2 className="font-playfair text-4xl sm:text-5xl font-light text-white leading-tight">
                {cur.titulo}
              </h2>
              <div className="w-8 h-px mt-3" style={{ background: 'rgba(201,168,76,0.4)' }} />
            </div>
          )}

          {/* ── STEP 2 — O Vosso Evento + Local & Cerimónia ─── */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] tracking-[0.4em] uppercase font-medium" style={{ color: 'rgba(201,168,76,0.7)' }}>
                  Tipo de Evento <span style={{ color: 'rgba(201,168,76,0.4)' }}>*</span>
                </p>
                <PillToggle options={TIPO_EVENTO} value={form.tipoEvento} onChange={v => set('tipoEvento', v)} />
              </div>
              <LeadInput label="Data do Evento" type="date" value={form.dataEvento} onChange={v => set('dataEvento', v)} required />
              <LeadInput label="Local do Evento (Cerimónia + Quinta)" value={form.local} onChange={v => set('local', v)}
                placeholder="Ex: Igreja X + Quinta Y" />
              <div className="space-y-2">
                <p className="text-[10px] tracking-[0.4em] uppercase font-medium" style={{ color: 'rgba(201,168,76,0.7)' }}>
                  Tipo de Cerimónia
                </p>
                <PillToggle options={TIPO_CERIMONIA} value={form.tipoCerimonia} onChange={v => set('tipoCerimonia', v)} multi />
              </div>
              <LeadInput label="Número de Convidados (sensivelmente)" value={form.numConvidados}
                onChange={v => set('numConvidados', v)} placeholder="Ex: 150" />
            </div>
          )}

          {/* ── STEP 3 — Perguntas que ninguém faz ─── */}
          {step === 3 && (
            <div className="space-y-10">

              {/* Estilo */}
              <div className="space-y-3">
                <div>
                  <p className="font-playfair text-xl italic font-light text-white">"Qual é o vosso estilo?"</p>
                  <p className="text-[11px] tracking-wide mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Podem escolher mais do que um</p>
                </div>
                <PillToggle options={ESTILO} value={form.estilo} onChange={v => set('estilo', v)} multi />
              </div>

              {/* Visão 20 anos */}
              <div className="space-y-3">
                <p className="font-playfair text-xl italic font-light text-white">"Como imaginam olhar para as fotos e o vídeo daqui a 20 anos?"</p>
                <textarea
                  value={form.visao20anos}
                  onChange={e => set('visao20anos', e.target.value)}
                  rows={3}
                  placeholder="Partilhem o que sentem..."
                  className="w-full bg-transparent outline-none text-white placeholder-white/20 py-3 px-0 text-base font-cormorant tracking-wide transition-all duration-200 resize-none"
                  style={{ borderBottom: '1px solid rgba(201,168,76,0.25)' }}
                  onFocus={e => { e.currentTarget.style.borderBottomColor = 'rgba(201,168,76,0.8)' }}
                  onBlur={e => { e.currentTarget.style.borderBottomColor = 'rgba(201,168,76,0.25)' }}
                />
              </div>

              {/* Trabalho favorito */}
              <div className="space-y-3">
                <p className="font-playfair text-xl italic font-light text-white">"Já viram algum trabalho nosso que vos emocionou?"</p>
                <LeadInput label="Link ou descrição" value={form.trabalhoFavorito}
                  onChange={v => set('trabalhoFavorito', v)}
                  placeholder="Ex: o vídeo do casamento na Quinta..." />
              </div>

            </div>
          )}

          {/* ── STEP 4 — Serviços & Detalhes ─── */}
          {step === 4 && (
            <div className="space-y-8">
              {/* Serviço principal */}
              <div className="space-y-3">
                <p className="text-[10px] tracking-[0.4em] uppercase font-medium" style={{ color: 'rgba(201,168,76,0.7)' }}>
                  O que pretendem? <span style={{ color: 'rgba(201,168,76,0.4)' }}>*</span>
                </p>
                <div className="flex gap-3">
                  {SERVICOS_PRINCIPAIS.map(s => {
                    const active = form.servicos.includes(s)
                    return (
                      <button key={s} type="button"
                        onClick={() => set('servicos', active ? form.servicos.filter(x => x !== s) : [...form.servicos, s])}
                        className="flex-1 py-4 rounded-2xl text-sm tracking-widest uppercase font-medium transition-all duration-200"
                        style={active ? {
                          background: 'rgba(201,168,76,0.12)',
                          border: '1px solid rgba(201,168,76,0.6)',
                          color: '#C9A84C',
                          boxShadow: '0 0 20px rgba(201,168,76,0.1)',
                        } : {
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.4)',
                        }}>
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Adicionais */}
              <div className="space-y-2">
                <p className="text-[10px] tracking-[0.4em] uppercase font-medium" style={{ color: 'rgba(201,168,76,0.4)' }}>
                  Serviços adicionais
                </p>
                <ServicoCheck options={SERVICOS_ADICIONAIS} value={form.servicos} onChange={v => {
                  const principais = form.servicos.filter(s => SERVICOS_PRINCIPAIS.includes(s))
                  set('servicos', [...principais, ...v.filter(s => !SERVICOS_PRINCIPAIS.includes(s))])
                }} />
              </div>
              <LeadInput label="Orçamento Previsto (sensivelmente)" value={form.orcamento}
                onChange={v => set('orcamento', v)} placeholder="Ex: 2.000 — 3.000€" />
              <div className="space-y-2">
                <label className="block text-[10px] tracking-[0.4em] uppercase font-medium" style={{ color: 'rgba(201,168,76,0.7)' }}>
                  Alguma preocupação ou algo que não gostam em foto/vídeo?
                </label>
                <textarea
                  value={form.preocupacoes}
                  onChange={e => set('preocupacoes', e.target.value)}
                  rows={4}
                  placeholder="Partilhem connosco qualquer detalhe importante..."
                  className="w-full bg-transparent outline-none text-white placeholder-white/20 py-3 px-0 text-base font-cormorant tracking-wide transition-all duration-200 resize-none"
                  style={{ borderBottom: '1px solid rgba(201,168,76,0.25)' }}
                  onFocus={e => { e.currentTarget.style.borderBottomColor = 'rgba(201,168,76,0.8)' }}
                  onBlur={e => { e.currentTarget.style.borderBottomColor = 'rgba(201,168,76,0.25)' }}
                />
              </div>
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
                onChange={v => set('zonaResidencia', v)} placeholder="Ex: Lisboa, Setúbal..." />
              <LeadSelect label="Como chegaram até nós?" value={form.comoChegou}
                onChange={v => set('comoChegou', v)} options={COMO_CHEGOU} />
            </div>
          )}

          {/* Erro */}
          {erro && (
            <p className="mt-6 text-sm text-red-400/70 font-cormorant">{erro}</p>
          )}

          {/* Navegação */}
          <div className="mt-12 flex items-center justify-between gap-4">
            {step > 0 ? (
              <button onClick={goBack} type="button"
                className="flex items-center gap-2 text-sm tracking-widest uppercase transition-all duration-200"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
                Anterior
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button onClick={goNext} type="button"
                className="flex items-center gap-3 px-8 py-3.5 rounded-full font-semibold text-sm tracking-widest uppercase transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                style={{ background: '#C9A84C', color: '#0a0a0a' }}>
                {step === 0 ? 'Começar' : step === 1 ? 'Continuar' : 'Seguinte'}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={sending} type="button"
                className="flex items-center gap-3 px-8 py-3.5 rounded-full font-semibold text-sm tracking-widest uppercase transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50"
                style={{ background: '#C9A84C', color: '#0a0a0a' }}>
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
                  width: '20px', height: '4px', background: '#C9A84C',
                } : i < step ? {
                  width: '8px', height: '4px', background: 'rgba(201,168,76,0.4)',
                } : {
                  width: '8px', height: '4px', background: 'rgba(255,255,255,0.1)',
                }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
