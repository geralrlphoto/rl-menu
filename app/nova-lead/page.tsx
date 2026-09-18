'use client'

// ─────────────────────────────────────────────────────────────────────────
// Briefing dos noivos (/nova-lead). OPÇÃO 2 — "A pré-produção do vosso filme".
// Abre com o manifesto da produtora e trata cada passo como uma cena.
// A opção 1 está em design-opcoes/nova-lead-opcao-1.tsx (etiqueta git
// nova-lead-opcao-1). Campos, validações, rascunho e envio iguais aos da 1.
// ─────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'

// O @import tem de viajar num <style> em runtime: o Turbopack remove os
// @import dos ficheiros .css no build de produção.
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:ital,wght@0,200;0,300;0,400;1,200;1,300&family=Hanken+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
.nlead{
  --ink:#0b0a08; --ink-2:#100e0b; --ink-3:#16130f;
  --g:#d8be93; --g-deep:#c8a866;
  --tx:rgba(243,237,226,.94); --tx-mid:rgba(243,237,226,.64); --tx-dim:rgba(243,237,226,.4);
  --line:rgba(243,237,226,.16); --line-soft:rgba(243,237,226,.08);
  --fs:'Cormorant Garamond',serif; --fd:'Jost',sans-serif; --fb:'Hanken Grotesk',sans-serif; --fm:'Space Mono',monospace;
  --ease:cubic-bezier(.16,1,.3,1);
  background:var(--ink); color:var(--tx); font-family:var(--fb); line-height:1.5;
  min-height:100vh; -webkit-font-smoothing:antialiased;
}
.nlead ::selection{background:var(--g);color:var(--ink);}
.nlead .fx-grain{position:fixed;inset:0;z-index:40;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");background-size:130px;}

.nlead h1,.nlead h2{font-family:var(--fs);font-weight:300;line-height:1.02;letter-spacing:-.01em;color:var(--tx);}
.nlead h1 em,.nlead h2 em{font-style:italic;color:var(--g);}
.nlead .eyebrow{font-family:var(--fm);font-size:10.5px;letter-spacing:.34em;text-transform:uppercase;color:var(--g);display:inline-flex;gap:.8em;align-items:center;}
.nlead .eyebrow::before{content:"";width:30px;height:1px;background:var(--g);opacity:.6;}
.nlead .lead{color:var(--tx-mid);line-height:1.75;font-size:clamp(15px,1.12vw,17.5px);}
.nlead .quest{font-family:var(--fs);font-weight:300;font-size:clamp(23px,2.3vw,30px);line-height:1.2;color:var(--tx);}
.nlead .quest em{font-style:italic;color:var(--g);}
.nlead .hint{font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-dim);}

.nlead .flabel{font-family:var(--fm);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);display:block;margin-bottom:12px;}
.nlead .flabel .opt{color:var(--tx-dim);}
.nlead .finput{width:100%;background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--tx);
  font-family:var(--fd);font-weight:300;font-size:clamp(17px,1.5vw,21px);padding:8px 0 13px;outline:none;
  transition:border-color .4s var(--ease);}
.nlead .finput::placeholder{color:var(--tx-dim);}
.nlead .finput:focus{border-color:var(--g);}
.nlead select.finput{appearance:none;cursor:pointer;}
.nlead select.finput option{background:var(--ink-2);color:var(--tx);}
.nlead textarea.finput{resize:none;min-height:74px;font-size:clamp(16px,1.35vw,19px);}
.nlead input[type=date].finput{color-scheme:dark;}

.nlead .pill{font-family:var(--fm);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-mid);
  background:transparent;border:1px solid var(--line-soft);border-radius:40px;padding:11px 20px;cursor:pointer;transition:.3s var(--ease);}
.nlead .pill:hover{border-color:var(--line);color:var(--tx);}
.nlead .pill.on{border-color:var(--g);background:rgba(216,190,147,.07);color:var(--g);}

.nlead .segbtn{display:flex;align-items:center;gap:14px;width:100%;text-align:left;border:1px solid var(--line-soft);
  border-radius:10px;padding:16px 20px;background:transparent;cursor:pointer;transition:.4s var(--ease);}
.nlead .segbtn:hover{border-color:var(--line);}
.nlead .segbtn.on{border-color:var(--g);background:rgba(216,190,147,.07);}
.nlead .segbtn .t{font-family:var(--fd);font-weight:300;font-size:18px;color:var(--tx-mid);line-height:1.25;}
.nlead .segbtn.on .t{color:var(--g);}
.nlead .segbtn.sm{padding:11px 14px;gap:11px;border-radius:9px;}
.nlead .segbtn.sm .t{font-size:15px;}
.nlead .mk{width:16px;height:16px;border-radius:50%;border:1px solid var(--line);flex:none;display:grid;place-items:center;transition:.3s;}
.nlead .segbtn.on .mk{border-color:var(--g);}
.nlead .segbtn.on .mk::after{content:"";width:6px;height:6px;border-radius:50%;background:var(--g);}
.nlead .segbtn.sm .mk{width:13px;height:13px;}
.nlead .segbtn.sm.on .mk::after{width:5px;height:5px;}

.nlead .btn{display:inline-flex;align-items:center;justify-content:center;gap:.9em;position:relative;isolation:isolate;
  font-family:var(--fm);font-size:11.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink);
  padding:18px 34px;border:1px solid var(--g);border-radius:40px;overflow:hidden;background:var(--g);cursor:pointer;transition:color .5s var(--ease);}
.nlead .btn .fill{position:absolute;inset:0;z-index:-1;background:var(--ink);transform:translateY(101%);transition:transform .6s var(--ease);}
.nlead .btn:hover{color:var(--g);}
.nlead .btn:hover .fill{transform:translateY(0);}
.nlead .btn:disabled{opacity:.4;cursor:not-allowed;}
.nlead .btn:disabled .fill{transform:translateY(101%);}
.nlead .btn-ghost{font-family:var(--fm);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);
  background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:.7em;transition:color .3s;}
.nlead .btn-ghost:hover{color:var(--g);}
.nlead .err{font-family:var(--fm);font-size:11px;letter-spacing:.1em;color:#e59a88;}
.nlead .meta{font-family:var(--fm);font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--tx-dim);}

/* ── Abertura: manifesto ─────────────────────────────────────────────── */
@keyframes nlSobe{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@keyframes nlRisca{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes nlZoom{from{transform:scale(1.12)}to{transform:scale(1)}}
.nlead .sobe{opacity:0;animation:nlSobe 1.1s var(--ease) forwards;}
.nlead .riscado{position:relative;display:inline-block;color:var(--tx-dim);}
.nlead .riscado::after{content:"";position:absolute;left:-2%;right:-2%;top:54%;height:2px;background:var(--g);
  transform:scaleX(0);transform-origin:left;animation:nlRisca .7s var(--ease) forwards;}
.nlead .hero-img{animation:nlZoom 9s ease-out forwards;}
.nlead .pilar{border-top:1px solid var(--line);padding-top:16px;}

/* ── Cenas: imagem ao lado + formulário ──────────────────────────────── */
.nlead .cena-img{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transform:scale(1.06);
  transition:opacity 1.1s ease, transform 6s ease-out;}
.nlead .cena-img.on{opacity:1;transform:scale(1);}
.nlead .fotograma{height:3px;flex:1;border-radius:2px;background:var(--line-soft);transition:background .6s var(--ease);}
.nlead .fotograma.feito{background:rgba(216,190,147,.45);}
.nlead .fotograma.agora{background:var(--g);}

@media (prefers-reduced-motion: reduce){
  .nlead .sobe{animation:none;opacity:1}
  .nlead .riscado::after{animation:none;transform:scaleX(1)}
  .nlead .hero-img{animation:none}
  .nlead .cena-img{transition:opacity .3s}
}
`

// ── Opções ────────────────────────────────────────────────────────────────────
const TIPO_EVENTO    = ['Casamento', 'Batizado', 'Casamento e Batizado']
const TIPO_CERIMONIA = ['Religiosa', 'Civil', 'Outra']
const COMO_CHEGOU    = ['Instagram', 'Facebook', 'Google', 'Recomendação de amigos', 'TikTok', 'Pinterest', 'Casamentos.pt', 'Outro']
const SERVICOS_PRINCIPAIS = ['Fotografia', 'Vídeo']
const ADICIONAIS_FOTO  = ['Pré-Wedding', 'Trash the Dress', 'Álbum Impresso', 'Sessão de Família', 'Galerias Abertas']
const ADICIONAIS_VIDEO = ['Pré-Wedding', 'Trash the Dress', 'Drone', 'Same Day Edit', 'Vídeos Originais', 'Sessão de Família', 'Trailer']
const ESTILO = ['Elegante', 'Minimalista', 'Romântico', 'Documental', 'Vibrante']

// Passos 0 e 1 são a abertura; 2 a 5 são as quatro cenas do briefing
const CENAS: Record<number, { cena: string; titulo: string; tituloEm: string; legenda: string; img: string; pos?: string }> = {
  1: { cena: 'Antes de rodar',   titulo: 'Bem-vindos à',        tituloEm: 'produção',       legenda: 'Pré-produção · onde tudo começa',        img: '/casamentos-2027.jpg' },
  2: { cena: 'Cena 01',          titulo: 'O vosso',             tituloEm: 'grande dia',     legenda: 'O cenário, a data, as pessoas',          img: '/newsletter/casamento-03.jpg', pos: 'center 35%' },
  3: { cena: 'Cena 02',          titulo: 'Perguntas que',       tituloEm: 'ninguém faz',    legenda: 'Porque cada história tem outro tom',      img: '/eventos-hero-2026.webp', pos: 'center 40%' },
  4: { cena: 'Cena 03',          titulo: 'O que vamos',         tituloEm: 'criar juntos',   legenda: 'Fotografia, filme e os detalhes que fazem a diferença', img: '/newsletter/casamento-09.jpg', pos: 'center 45%' },
  5: { cena: 'Cena 04',          titulo: 'Onde vos',            tituloEm: 'encontramos',    legenda: 'Falta pouco para a primeira conversa',   img: '/casamentos-2026.jpg', pos: 'center 40%' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function useFadeIn(trigger: number) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [trigger])
  return visible
}

function LeadInput({ label, type = 'text', value, onChange, placeholder, required, autoFocus, onEnter }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
  autoFocus?: boolean; onEnter?: () => void
}) {
  return (
    <div>
      <label className="flabel">{label}{required && <span className="opt"> *</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="finput" autoFocus={autoFocus}
        onKeyDown={e => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter() } }} />
    </div>
  )
}

function LeadSelect({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean
}) {
  return (
    <div>
      <label className="flabel">{label}{required && <span className="opt"> *</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="finput"
        style={{ color: value ? undefined : 'rgba(243,237,226,.4)' }}>
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
    } else onChange(value === opt ? '' : opt)
  }
  return (
    <div className="flex flex-wrap gap-2.5 pt-1">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => toggle(opt)} className={`pill${isActive(opt) ? ' on' : ''}`}>{opt}</button>
      ))}
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

const TOTAL_PASSOS = 6

// ── Página principal ──────────────────────────────────────────────────────────
export default function NovaLeadPage() {
  const [step, setStep]       = useState(0)
  const [sending, setSending] = useState(false)
  const [done, setDone]       = useState(false)
  const [erro, setErro]       = useState('')
  const visible               = useFadeIn(step)
  const topRef                = useRef<HTMLDivElement>(null)
  const [form, setForm]       = useState(FORM_DEFAULT)

  // Rascunho guardado no browser (retoma onde ficaram)
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

  useEffect(() => {
    if (done) { localStorage.removeItem(LS_KEY); return }
    try { localStorage.setItem(LS_KEY, JSON.stringify({ step, form })) } catch {}
  }, [step, form, done])

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!form.nome.trim()) return 'Digam-nos como se chamam.'
    }
    if (s === 2) {
      if (!form.tipoEvento) return 'Escolham o tipo de evento.'
      if (!form.dataEvento) return 'A data do evento é obrigatória.'
      if (!form.local.trim()) return 'O local do evento é obrigatório.'
      if (form.tipoCerimonia.length === 0) return 'Escolham pelo menos um tipo de cerimónia.'
      if (!form.numConvidados.trim()) return 'O número de convidados é obrigatório.'
    }
    if (s === 3) {
      if (form.estilo.length === 0) return 'Escolham pelo menos um estilo.'
      if (!form.visao20anos.trim()) return 'Contem-nos como imaginam olhar para as fotos daqui a 20 anos.'
      if (!form.trabalhoFavorito.trim()) return 'Indiquem um trabalho nosso que vos emocionou (ou escrevam "nenhum").'
      if (!form.preocupacoes.trim()) return 'Contem-nos o que não gostam (ou escrevam "nada").'
    }
    if (s === 4) {
      if (form.servicos.length === 0) return 'Escolham pelo menos um serviço.'
      if (!form.orcamento.trim()) return 'Indiquem um orçamento previsto.'
    }
    if (s === 5) {
      if (!form.contato.trim()) return 'O telemóvel é obrigatório.'
      if (!form.email.trim()) return 'O e-mail é obrigatório.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'O e-mail parece estar incompleto.'
      if (!form.zonaResidencia.trim()) return 'A zona de residência é obrigatória.'
      if (!form.comoChegou) return 'Digam-nos como chegaram até nós.'
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
    } catch { setErro('Erro de ligação. Tentem novamente.') }
    finally { setSending(false) }
  }

  // ── Fim: "está gravado" ──────────────────────────────────────────────────
  if (done) return (
    <div className="nlead relative min-h-screen flex items-center justify-center overflow-hidden px-6 py-20">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="fx-grain" />
      <div className="absolute inset-0">
        <div className="hero-img absolute inset-0 bg-cover" style={{ backgroundImage: "url('/eventos-hero-2026.webp')", backgroundPosition: 'center 40%' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(11,10,8,.72) 0%, rgba(11,10,8,.94) 70%)' }} />
      </div>
      <div className="relative text-center max-w-xl">
        <p className="eyebrow sobe" style={{ animationDelay: '.1s' }}>Fim da pré-produção</p>
        <h1 className="sobe mt-6" style={{ fontSize: 'clamp(44px,7vw,86px)', animationDelay: '.25s' }}>
          Está <em>gravado.</em>
        </h1>
        <p className="lead sobe mt-7" style={{ animationDelay: '.45s' }}>
          {form.nome ? `${form.nome}, obrigado` : 'Obrigado'} por nos contarem a vossa história.
          A partir daqui, a produção do vosso casamento está nas nossas mãos: vamos ler tudo com atenção
          e entramos em contacto em breve para a primeira conversa.
        </p>
        <div className="sobe mt-10 flex items-center justify-center gap-4" style={{ animationDelay: '.65s' }}>
          <span className="h-px w-10" style={{ background: 'rgba(216,190,147,.4)' }} />
          <img src="/logo_rl_gold.png" alt="RL Photo · Video" className="w-16 opacity-80" />
          <span className="h-px w-10" style={{ background: 'rgba(216,190,147,.4)' }} />
        </div>
        <p className="meta sobe mt-6" style={{ animationDelay: '.8s' }}>www.rlprod.pt</p>
      </div>
    </div>
  )

  // ── Passo 0: abertura com o manifesto da produtora ───────────────────────
  if (step === 0) return (
    <div className="nlead relative min-h-screen overflow-hidden" ref={topRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="fx-grain" />

      <div className="absolute inset-0">
        <div className="hero-img absolute inset-0 bg-cover" style={{ backgroundImage: "url('/eventos-hero-2026.webp')", backgroundPosition: 'center 40%' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(100deg, rgba(11,10,8,.97) 0%, rgba(11,10,8,.86) 42%, rgba(11,10,8,.45) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(11,10,8,1) 0%, transparent 45%)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 sm:px-10 pt-10 pb-16 min-h-screen flex flex-col">
        <div className="flex items-center justify-between sobe" style={{ animationDelay: '.05s' }}>
          <img src="/logo_rl_gold.png" alt="RL Photo · Video" className="w-16 sm:w-20 opacity-85" />
          <p className="meta hidden sm:block">Produtora de casamentos</p>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-3xl py-12">
          <p className="eyebrow sobe" style={{ animationDelay: '.15s' }}>Antes de mais nada</p>

          <h1 className="mt-7" style={{ fontSize: 'clamp(42px,7.2vw,96px)' }}>
            <span className="block sobe" style={{ animationDelay: '.3s' }}>
              Não somos <span className="riscado"><span>fotógrafos.</span></span>
            </span>
            <span className="block sobe" style={{ animationDelay: '.55s' }}>
              Nem <span className="riscado riscado-2"><span>videógrafos.</span></span>
            </span>
            <span className="block sobe mt-2" style={{ animationDelay: '1.9s' }}>
              Somos a <em>produtora</em>
            </span>
            <span className="block sobe" style={{ animationDelay: '2.05s' }}>
              do vosso casamento.
            </span>
          </h1>

          <p className="lead sobe mt-8 max-w-xl" style={{ animationDelay: '2.4s' }}>
            Tratamos o vosso dia como uma produção de cinema. Preparamos cada momento antes de ele
            acontecer, dirigimos a equipa no terreno e contamos a vossa história na pós-produção.
            Vocês só têm de fazer uma coisa: viver o dia.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10 max-w-2xl">
            {[
              { n: '01', t: 'Pré-produção', d: 'Conhecemos-vos, o local e o guião do dia.' },
              { n: '02', t: 'Rodagem', d: 'Uma equipa dirigida, discreta, sempre no sítio certo.' },
              { n: '03', t: 'Pós-produção', d: 'Fotografia e filme que contam a vossa história.' },
            ].map((p, i) => (
              <div key={p.n} className="pilar sobe" style={{ animationDelay: `${2.7 + i * 0.15}s` }}>
                <p className="meta" style={{ color: 'var(--g)' }}>{p.n}</p>
                <p className="mt-2" style={{ fontFamily: 'var(--fs)', fontSize: 24, fontWeight: 300 }}>{p.t}</p>
                <p className="text-[13px] mt-1" style={{ color: 'var(--tx-mid)' }}>{p.d}</p>
              </div>
            ))}
          </div>

          {/* A primeira pergunta já está aqui */}
          <div className="sobe mt-14 max-w-xl rounded-2xl p-6 sm:p-7"
            style={{ animationDelay: '3.2s', border: '1px solid rgba(216,190,147,.28)', background: 'rgba(11,10,8,.55)', backdropFilter: 'blur(10px)' }}>
            <p className="quest">Comecemos pelo início. <em>Como se chamam?</em></p>
            <div className="mt-5">
              <LeadInput label="Nome dos noivos / família" value={form.nome} onChange={v => set('nome', v)}
                placeholder="Ex: Ana & João Silva" required onEnter={goNext} />
            </div>
            {erro && <p className="err mt-4">{erro}</p>}
            <div className="mt-7 flex items-center justify-between gap-4 flex-wrap">
              <p className="hint">5 minutos · quatro cenas</p>
              <button onClick={goNext} type="button" className="btn">
                <span className="fill" />
                Começar o nosso filme
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* O segundo risco começa depois do primeiro */}
      <style dangerouslySetInnerHTML={{ __html: `
        .nlead .riscado::after{animation-delay:1.1s}
        .nlead .riscado-2::after{animation-delay:1.55s}
      ` }} />
    </div>
  )

  // ── Passos 1 a 5: imagem da cena ao lado + formulário ────────────────────
  const cena = CENAS[step]
  const numCena = step >= 2 ? step - 1 : 0   // 1 a 4

  return (
    <div className="nlead relative" ref={topRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="fx-grain" />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] min-h-screen">

        {/* Imagem da cena — fixa no computador, faixa no topo no telemóvel */}
        <aside className="relative h-56 sm:h-72 lg:h-screen lg:sticky lg:top-0 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`cena-img${step === i ? ' on' : ''}`}
              style={{ backgroundImage: `url('${CENAS[i].img}')`, backgroundPosition: CENAS[i].pos ?? 'center' }} />
          ))}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(11,10,8,.95) 0%, rgba(11,10,8,.25) 55%, rgba(11,10,8,.45) 100%)' }} />
          <div className="absolute inset-0 hidden lg:block" style={{ background: 'linear-gradient(to right, transparent 70%, rgba(11,10,8,1) 100%)' }} />

          <div className="absolute top-6 left-6 sm:left-8">
            <img src="/logo_rl_gold.png" alt="RL Photo · Video" className="w-14 opacity-85" />
          </div>

          <div className="absolute left-6 sm:left-8 right-6 bottom-6 lg:bottom-10">
            <p className="meta" style={{ color: 'var(--g)' }}>{cena.cena}</p>
            <p className="mt-2 hidden sm:block" style={{ fontFamily: 'var(--fs)', fontStyle: 'italic', fontSize: 'clamp(20px,2vw,28px)', color: 'var(--tx-mid)' }}>
              {cena.legenda}
            </p>
            {/* Fotogramas: um por cena */}
            <div className="flex gap-1.5 mt-5 max-w-xs">
              {[1, 2, 3, 4].map(i => (
                <span key={i} className={`fotograma${numCena === i ? ' agora' : numCena > i ? ' feito' : ''}`} />
              ))}
            </div>
          </div>
        </aside>

        {/* Formulário */}
        <main className="relative px-6 sm:px-10 lg:px-16 pt-10 lg:pt-20 pb-16 max-w-2xl w-full">
          <div className="transition-all duration-500"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}>

            <div className="flex items-center justify-between mb-8">
              <p className="eyebrow">{step === 1 ? 'Pré-produção' : `${cena.cena} de 04`}</p>
              {step >= 2 && <p className="meta">{String(numCena).padStart(2, '0')} / 04</p>}
            </div>

            <h2 style={{ fontSize: 'clamp(38px,4.6vw,62px)' }}>
              {step === 1 && form.nome ? <>{form.nome},<br /></> : null}
              {step === 1 && form.nome ? cena.titulo.toLowerCase() : cena.titulo} <em>{cena.tituloEm}</em>{step === 1 ? '.' : ''}
            </h2>
            <div className="h-px w-10 mt-6 mb-10" style={{ background: 'var(--g)', opacity: .6 }} />

            {/* ── Passo 1: como funciona ─── */}
            {step === 1 && (
              <div className="space-y-8">
                <p className="lead">
                  Numa produtora ninguém chega ao dia de rodagem sem guião. Este briefing é o nosso:
                  ajuda-nos a conhecer o vosso estilo, as pessoas que importam e aquilo que não pode
                  mesmo faltar no registo do vosso casamento.
                </p>
                <div className="space-y-5">
                  {[
                    { n: '01', t: 'Este briefing', d: 'Cerca de 5 minutos. Fica guardado neste browser, podem parar e voltar.' },
                    { n: '02', t: 'Uma conversa connosco', d: 'Lemos tudo antes, para a reunião ser sobre vocês e não sobre formulários.' },
                    { n: '03', t: 'Uma proposta à vossa medida', d: 'Pensada a partir do que nos contarem aqui, sem pacotes genéricos.' },
                  ].map(p => (
                    <div key={p.n} className="flex gap-5 items-start">
                      <span className="meta pt-1.5" style={{ color: 'var(--g)' }}>{p.n}</span>
                      <div>
                        <p style={{ fontFamily: 'var(--fs)', fontSize: 23, fontWeight: 300 }}>{p.t}</p>
                        <p className="text-[14px] mt-0.5" style={{ color: 'var(--tx-mid)' }}>{p.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="lead italic" style={{ color: 'var(--tx-dim)' }}>
                  Quanto mais soubermos agora, mais invisíveis seremos no dia. E é aí que as melhores imagens acontecem.
                </p>
              </div>
            )}

            {/* ── Passo 2: o evento ─── */}
            {step === 2 && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <p className="flabel">Tipo de evento <span className="opt">*</span></p>
                  <PillToggle options={TIPO_EVENTO} value={form.tipoEvento} onChange={v => set('tipoEvento', v)} />
                </div>
                <LeadInput label="Data do evento" type="date" value={form.dataEvento} onChange={v => set('dataEvento', v)} required />
                <LeadInput label="Local do evento (cerimónia + quinta)" value={form.local} onChange={v => set('local', v)}
                  placeholder="Ex: Igreja X + Quinta Y" required />
                <div className="space-y-2">
                  <p className="flabel">Tipo de cerimónia <span className="opt">*</span></p>
                  <PillToggle options={TIPO_CERIMONIA} value={form.tipoCerimonia} onChange={v => set('tipoCerimonia', v)} multi />
                </div>
                <LeadInput label="Número de convidados (sensivelmente)" value={form.numConvidados}
                  onChange={v => set('numConvidados', v)} placeholder="Ex: 150" required />
              </div>
            )}

            {/* ── Passo 3: perguntas que ninguém faz ─── */}
            {step === 3 && (
              <div className="space-y-11">
                <div className="space-y-3">
                  <div>
                    <p className="quest">Qual é o <em>vosso estilo?</em> <span className="hint">*</span></p>
                    <p className="hint mt-2">Podem escolher mais do que um</p>
                  </div>
                  <PillToggle options={ESTILO} value={form.estilo} onChange={v => set('estilo', v)} multi />
                </div>
                <div className="space-y-3">
                  <p className="quest">Como imaginam olhar para as fotos e o filme <em>daqui a 20 anos?</em> <span className="hint">*</span></p>
                  <textarea value={form.visao20anos} onChange={e => set('visao20anos', e.target.value)} rows={3}
                    placeholder="Partilhem o que sentem..." className="finput" />
                </div>
                <div className="space-y-3">
                  <p className="quest">Já viram algum trabalho nosso que <em>vos emocionou?</em> <span className="hint">*</span></p>
                  <LeadInput label="Link ou descrição" value={form.trabalhoFavorito} onChange={v => set('trabalhoFavorito', v)}
                    placeholder="Ex: o filme do casamento na Quinta..." required />
                </div>
                <div className="space-y-3">
                  <p className="quest">Há algo que <em>não gostam</em> em fotos ou vídeo? <span className="hint">*</span></p>
                  <textarea value={form.preocupacoes} onChange={e => set('preocupacoes', e.target.value)} rows={3}
                    placeholder="Poses, ângulos, estilos de edição (ou escrevam 'nada')..." className="finput" />
                </div>
              </div>
            )}

            {/* ── Passo 4: serviços ─── */}
            {step === 4 && (
              <div className="space-y-9">
                <div className="space-y-3">
                  <p className="flabel">O que pretendem? <span className="opt">*</span></p>
                  <div className="flex gap-3">
                    {SERVICOS_PRINCIPAIS.map(s => {
                      const active = form.servicos.includes(s)
                      return (
                        <button key={s} type="button"
                          onClick={() => set('servicos', active ? form.servicos.filter(x => x !== s) : [...form.servicos, s])}
                          className={`segbtn${active ? ' on' : ''}`} style={{ flex: 1, justifyContent: 'center' }}>
                          <span className="mk" /><span className="t">{s}</span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="hint pt-1">A maioria dos casais escolhe os dois: uma só equipa, dirigida em conjunto</p>
                </div>
                <div className="space-y-3">
                  <p className="flabel">Serviços adicionais</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[{ nome: 'Fotografia', lista: ADICIONAIS_FOTO }, { nome: 'Vídeo', lista: ADICIONAIS_VIDEO }].map(col => (
                      <div key={col.nome} className="space-y-1.5">
                        <p className="hint mb-2">{col.nome}</p>
                        {col.lista.map(s => {
                          const key = `${s} — ${col.nome}`
                          const active = form.servicos.includes(key)
                          return (
                            <button key={key} type="button"
                              onClick={() => set('servicos', active ? form.servicos.filter(x => x !== key) : [...form.servicos, key])}
                              className={`segbtn sm${active ? ' on' : ''}`}>
                              <span className="mk" /><span className="t">{s}</span>
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <LeadInput label="Orçamento previsto (sensivelmente)" value={form.orcamento}
                  onChange={v => set('orcamento', v)} placeholder="Ex: 2.000 a 3.000€" required />
              </div>
            )}

            {/* ── Passo 5: contactos ─── */}
            {step === 5 && (
              <div className="space-y-8">
                <LeadInput label="Telemóvel" type="tel" value={form.contato} onChange={v => set('contato', v)}
                  placeholder="Ex: 912 345 678" required />
                <LeadInput label="E-mail" type="email" value={form.email} onChange={v => set('email', v)}
                  placeholder="Ex: ana@email.com" required />
                <LeadInput label="Zona de residência" value={form.zonaResidencia} onChange={v => set('zonaResidencia', v)}
                  placeholder="Ex: Lisboa, Setúbal..." required />
                <LeadSelect label="Como chegaram até nós?" value={form.comoChegou} onChange={v => set('comoChegou', v)}
                  options={COMO_CHEGOU} required />
              </div>
            )}

            {erro && <p className="err mt-7">{erro}</p>}

            {/* Navegação */}
            <div className="mt-12 flex items-center justify-between gap-4">
              <button onClick={goBack} type="button" className="btn-ghost">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Anterior
              </button>
              {step < TOTAL_PASSOS - 1 ? (
                <button onClick={goNext} type="button" className="btn">
                  <span className="fill" />
                  {step === 1 ? 'Entrar na primeira cena' : 'Próxima cena'}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={sending} type="button" className="btn">
                  <span className="fill" />
                  {sending ? 'A enviar...' : 'Enviar o nosso briefing'}
                  {!sending && (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
