'use client'

// ─────────────────────────────────────────────────────────────────────────
// Briefing de batizado (/batizado). OPÇÃO 2 — "A pré-produção do vosso filme",
// igual em espírito ao /nova-lead: manifesto da produtora na abertura e
// perguntas em cenas. Só há uma fotografia de batizado, por isso cada cena
// reenquadra a mesma imagem (plano geral, grande plano, pormenor).
// A opção 1 está em design-opcoes/batizado-opcao-1.tsx (etiqueta git
// batizado-opcao-1). Campos e envio (para /api/media-leads) iguais aos da 1.
// ─────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { CSS_BRIEFING as CSS } from '../_briefing/estilo'

// ── Opções ────────────────────────────────────────────────────────────────────
const COMO_CHEGOU = ['Instagram', 'Facebook', 'Google', 'Recomendação de amigos', 'TikTok', 'Pinterest', 'Casamentos.pt', 'Outro']
const ADICIONAIS_FOTO  = ['Álbum Impresso', 'Sessão de Família (pré-batizado)', 'Fotos Padrinhos', 'Galerias Online']
const ADICIONAIS_VIDEO = ['Drone', 'Teaser (1 min)', 'Highlight Film', 'Sessão de Família (pré-batizado)']
const ESTILO = ['Elegante', 'Minimalista', 'Intimista', 'Documental', 'Vibrante']

const FOTO = '/batizado-hero.png'

// Passos 0 e 1 são a abertura; 2 a 5 são as quatro cenas do briefing.
// Cada cena é um enquadramento diferente da mesma fotografia.
const CENAS: Record<number, { cena: string; titulo: string; tituloEm: string; legenda: string; tamanho: string; pos: string }> = {
  1: { cena: 'Antes de rodar', titulo: 'Bem-vindos à',  tituloEm: 'produção',       legenda: 'Pré-produção · onde tudo começa',      tamanho: 'cover', pos: 'center 30%' },
  2: { cena: 'Cena 01',        titulo: 'O dia do',      tituloEm: 'batizado',       legenda: 'Plano geral · o cenário e as pessoas', tamanho: 'cover', pos: 'center 55%' },
  3: { cena: 'Cena 02',        titulo: 'Perguntas que', tituloEm: 'ninguém faz',    legenda: 'Grande plano · o que vos toca',        tamanho: '210%',  pos: '38% 34%' },
  4: { cena: 'Cena 03',        titulo: 'O que vamos',   tituloEm: 'criar juntos',   legenda: 'Pormenor · o que fica para sempre',    tamanho: '260%',  pos: '52% 62%' },
  5: { cena: 'Cena 04',        titulo: 'Onde vos',      tituloEm: 'encontramos',    legenda: 'Falta pouco para a primeira conversa', tamanho: '150%',  pos: '40% 40%' },
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

function LeadInput({ label, type = 'text', value, onChange, placeholder, required, onEnter }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; onEnter?: () => void
}) {
  return (
    <div>
      <label className="flabel">{label}{required && <span className="opt"> *</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="finput"
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

function PillToggle({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5 pt-1">
      {options.map(opt => {
        const on = value.includes(opt)
        return (
          <button key={opt} type="button" onClick={() => onChange(on ? value.filter(x => x !== opt) : [...value, opt])}
            className={`pill${on ? ' on' : ''}`}>{opt}</button>
        )
      })}
    </div>
  )
}

const LS_KEY = 'rl_batizado_draft'

const FORM_DEFAULT = {
  nomePais:         '',
  nomeBebe:         '',
  dataBatizado:     '',
  localCerimonia:   '',
  localFesta:       '',
  padrinhos:        '',
  numConvidados:    '',
  email:            '',
  contato:          '',
  zonaResidencia:   '',
  comoChegou:       '',
  estilo:           [] as string[],
  visao20anos:      '',
  trabalhoFavorito: '',
  preocupacoes:     '',
  servicos:         [] as string[],
  orcamento:        '',
}

const TOTAL_PASSOS = 6

// ── Página principal ──────────────────────────────────────────────────────────
export default function BatizadoPage() {
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
        const { step: s, form: f } = JSON.parse(saved)
        if (f) setForm({ ...FORM_DEFAULT, ...f })
        if (typeof s === 'number') setStep(s)
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

  // Só os campos que o formulário marca como obrigatórios (*)
  function validateStep(s: number): string | null {
    if (s === 0 && !form.nomePais.trim()) return 'Digam-nos como se chamam.'
    if (s === 2) {
      if (!form.nomeBebe.trim()) return 'Digam-nos o nome do bebé ou da criança.'
      if (!form.dataBatizado) return 'A data do batizado é obrigatória.'
    }
    if (s === 4) {
      if (!form.servicos.some(x => x === 'Fotografia' || x === 'Vídeo')) return 'Escolham fotografia, vídeo ou os dois.'
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
    for (const s of [0, 2, 4, 5]) {
      const err = validateStep(s)
      if (err) { setErro(err); setStep(s); return }
    }
    setErro('')
    setSending(true)
    try {
      // Mensagem detalhada (mesmo formato da opção 1)
      const detalhes = [
        form.nomeBebe         && `Bebé/Criança: ${form.nomeBebe}`,
        form.dataBatizado     && `Data: ${form.dataBatizado}`,
        form.localCerimonia   && `Cerimónia: ${form.localCerimonia}`,
        form.localFesta       && `Festa: ${form.localFesta}`,
        form.padrinhos        && `Padrinhos: ${form.padrinhos}`,
        form.numConvidados    && `Convidados: ${form.numConvidados}`,
        form.estilo.length    && `Estilo: ${form.estilo.join(', ')}`,
        form.visao20anos      && `Visão 20 anos: ${form.visao20anos}`,
        form.trabalhoFavorito && `Trabalho favorito: ${form.trabalhoFavorito}`,
        form.preocupacoes     && `Preocupações: ${form.preocupacoes}`,
        form.orcamento        && `Orçamento: ${form.orcamento}`,
        form.zonaResidencia   && `Zona: ${form.zonaResidencia}`,
      ].filter(Boolean).join('\n')

      const res = await fetch('/api/media-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome:     form.nomePais,
          email:    form.email,
          telefone: form.contato,
          tipo:     `Batizado — ${form.servicos.filter(s => s === 'Fotografia' || s === 'Vídeo').join(' & ') || 'Fotografia & Vídeo'}`,
          fonte:    form.comoChegou || 'Website',
          mensagem: detalhes,
          estado:   'Novo',
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
        <div className="hero-img absolute inset-0 bg-cover" style={{ backgroundImage: `url('${FOTO}')`, backgroundPosition: 'center 35%' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(11,10,8,.72) 0%, rgba(11,10,8,.94) 70%)' }} />
      </div>
      <div className="relative text-center max-w-xl">
        <p className="eyebrow sobe" style={{ animationDelay: '.1s' }}>Fim da pré-produção</p>
        <h1 className="sobe mt-6" style={{ fontSize: 'clamp(44px,7vw,86px)', animationDelay: '.25s' }}>
          Está <em>gravado.</em>
        </h1>
        <p className="lead sobe mt-7" style={{ animationDelay: '.45s' }}>
          {form.nomePais ? `${form.nomePais}, obrigado` : 'Obrigado'} por nos contarem a vossa história.
          A partir daqui, a produção do batizado{form.nomeBebe ? ` de ${form.nomeBebe}` : ''} está nas nossas mãos:
          vamos ler tudo com atenção e entramos em contacto em breve para a primeira conversa.
        </p>

        {/* Antes da conversa: conhecerem o nosso trabalho */}
        <div className="sobe mt-10 rounded-2xl p-6 sm:p-7 text-left"
          style={{ animationDelay: '.7s', border: '1px solid rgba(216,190,147,.28)', background: 'rgba(11,10,8,.6)', backdropFilter: 'blur(10px)' }}>
          <p className="eyebrow">Antes da nossa conversa</p>
          <p className="quest mt-4">Vejam o nosso trabalho e <em>sintam se é a vossa história.</em></p>
          <p className="lead mt-3">
            Quem vai guardar este dia para sempre escolhe-se pela forma como vos faz sentir.
            Escolher só pelo preço é o erro de que mais famílias se arrependem. Visitem o nosso site
            e o nosso Instagram: se se reconhecerem no que fazemos, a reunião vai ser o início de algo especial.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="https://www.rlphotovideo.pt" target="_blank" rel="noopener noreferrer" className="btn">
              <span className="fill" />
              Ver o site
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M9 7h8v8" /></svg>
            </a>
            <a href="https://www.instagram.com/rlphoto_fotografia.video/" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full px-7 py-4 transition-all hover:bg-white/5"
              style={{ border: '1px solid rgba(216,190,147,.45)', color: 'var(--g)', fontFamily: 'var(--fm)', fontSize: 11.5, letterSpacing: '.18em', textTransform: 'uppercase' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
              Instagram
            </a>
          </div>
        </div>

        <div className="sobe mt-10 flex items-center justify-center gap-4" style={{ animationDelay: '.9s' }}>
          <span className="h-px w-10" style={{ background: 'rgba(216,190,147,.4)' }} />
          <img src="/logo_rl_gold.png" alt="RL Photo · Video" className="w-16 opacity-80" />
          <span className="h-px w-10" style={{ background: 'rgba(216,190,147,.4)' }} />
        </div>
        <a href="https://www.rlphotovideo.pt" target="_blank" rel="noopener noreferrer"
          className="meta sobe mt-6 inline-block hover:text-[#d8be93] transition-colors" style={{ animationDelay: '1s' }}>
          www.rlphotovideo.pt
        </a>
      </div>
    </div>
  )

  // ── Passo 0: abertura com o manifesto ────────────────────────────────────
  if (step === 0) return (
    <div className="nlead relative min-h-screen overflow-hidden" ref={topRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="fx-grain" />

      <div className="absolute inset-0">
        <div className="hero-img absolute inset-0 bg-cover" style={{ backgroundImage: `url('${FOTO}')`, backgroundPosition: '70% 35%' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(100deg, rgba(11,10,8,.97) 0%, rgba(11,10,8,.86) 42%, rgba(11,10,8,.4) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(11,10,8,1) 0%, transparent 45%)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 sm:px-10 pt-10 pb-16 min-h-screen flex flex-col">
        <div className="flex items-center justify-between sobe" style={{ animationDelay: '.05s' }}>
          <img src="/logo_rl_gold.png" alt="RL Photo · Video" className="w-16 sm:w-20 opacity-85" />
          <p className="meta hidden sm:block">Produtora de casamentos e batizados</p>
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
              do batizado do vosso bebé.
            </span>
          </h1>

          <p className="lead sobe mt-8 max-w-xl" style={{ animationDelay: '2.4s' }}>
            Um batizado passa depressa: a igreja, os padrinhos, a família toda junta por umas horas.
            Nós preparamos cada momento antes de ele acontecer, estamos lá sem nunca atrapalhar e
            contamos esse dia na pós-produção, para o poderem mostrar um dia ao vosso bebé já crescido.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10 max-w-2xl">
            {[
              { n: '01', t: 'Pré-produção', d: 'Conhecemos-vos, a igreja, a festa e quem não pode faltar.' },
              { n: '02', t: 'Rodagem', d: 'Discretos, pacientes com os mais pequenos, sempre no sítio certo.' },
              { n: '03', t: 'Pós-produção', d: 'Fotografia e filme para guardar e mostrar daqui a muitos anos.' },
            ].map((p, i) => (
              <div key={p.n} className="pilar sobe" style={{ animationDelay: `${2.7 + i * 0.15}s` }}>
                <p className="meta" style={{ color: 'var(--g)' }}>{p.n}</p>
                <p className="mt-2" style={{ fontFamily: 'var(--fs)', fontSize: 24, fontWeight: 300 }}>{p.t}</p>
                <p className="text-[13px] mt-1" style={{ color: 'var(--tx-mid)' }}>{p.d}</p>
              </div>
            ))}
          </div>

          <div className="sobe mt-14 max-w-xl rounded-2xl p-6 sm:p-7"
            style={{ animationDelay: '3.2s', border: '1px solid rgba(216,190,147,.28)', background: 'rgba(11,10,8,.55)', backdropFilter: 'blur(10px)' }}>
            <p className="quest">Comecemos pelo início. <em>Como se chamam os pais?</em></p>
            <div className="mt-5">
              <LeadInput label="Nome dos pais" value={form.nomePais} onChange={v => set('nomePais', v)}
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

      <style dangerouslySetInnerHTML={{ __html: `
        .nlead .riscado::after{animation-delay:1.1s}
        .nlead .riscado-2::after{animation-delay:1.55s}
      ` }} />
    </div>
  )

  // ── Passos 1 a 5: imagem da cena ao lado + formulário ────────────────────
  const cena = CENAS[step]
  const numCena = step >= 2 ? step - 1 : 0

  return (
    <div className="nlead relative" ref={topRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="fx-grain" />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] min-h-screen">

        {/* A mesma fotografia, reenquadrada em cada cena */}
        <aside className="relative h-56 sm:h-72 lg:h-screen lg:sticky lg:top-0 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`cena-img${step === i ? ' on' : ''}`}
              style={{ backgroundImage: `url('${FOTO}')`, backgroundSize: CENAS[i].tamanho, backgroundPosition: CENAS[i].pos }} />
          ))}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(11,10,8,.95) 0%, rgba(11,10,8,.2) 55%, rgba(11,10,8,.4) 100%)' }} />
          <div className="absolute inset-0 hidden lg:block" style={{ background: 'linear-gradient(to right, transparent 70%, rgba(11,10,8,1) 100%)' }} />

          <div className="absolute top-6 left-6 sm:left-8">
            <img src="/logo_rl_gold.png" alt="RL Photo · Video" className="w-14 opacity-85" />
          </div>

          <div className="absolute left-6 sm:left-8 right-6 bottom-6 lg:bottom-10">
            <p className="meta" style={{ color: 'var(--g)' }}>{cena.cena}</p>
            <p className="mt-2 hidden sm:block" style={{ fontFamily: 'var(--fs)', fontStyle: 'italic', fontSize: 'clamp(20px,2vw,28px)', color: 'var(--tx-mid)' }}>
              {cena.legenda}
            </p>
            <div className="flex gap-1.5 mt-5 max-w-xs">
              {[1, 2, 3, 4].map(i => (
                <span key={i} className={`fotograma${numCena === i ? ' agora' : numCena > i ? ' feito' : ''}`} />
              ))}
            </div>
          </div>
        </aside>

        <main className="relative px-6 sm:px-10 lg:px-16 pt-10 lg:pt-20 pb-16 max-w-2xl w-full">
          <div className="transition-all duration-500"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}>

            <div className="flex items-center justify-between mb-8">
              <p className="eyebrow">{step === 1 ? 'Pré-produção' : `${cena.cena} de 04`}</p>
              {step >= 2 && <p className="meta">{String(numCena).padStart(2, '0')} / 04</p>}
            </div>

            <h2 style={{ fontSize: 'clamp(38px,4.6vw,62px)' }}>
              {step === 1 && form.nomePais ? <>{form.nomePais},<br /></> : null}
              {step === 1 && form.nomePais ? cena.titulo.toLowerCase() : cena.titulo} <em>{cena.tituloEm}</em>{step === 1 ? '.' : ''}
            </h2>
            <div className="h-px w-10 mt-6 mb-10" style={{ background: 'var(--g)', opacity: .6 }} />

            {/* ── Passo 1: como funciona ─── */}
            {step === 1 && (
              <div className="space-y-8">
                <p className="lead">
                  Numa produtora ninguém chega ao dia de rodagem sem guião. Este briefing é o nosso:
                  ajuda-nos a conhecer a vossa família, o vosso estilo e aquilo que não pode mesmo
                  faltar no registo do batizado.
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

            {/* ── Passo 2: o batizado ─── */}
            {step === 2 && (
              <div className="space-y-8">
                <LeadInput label="Nome do bebé / criança" value={form.nomeBebe} onChange={v => set('nomeBebe', v)}
                  placeholder="Ex: Maria" required />
                <LeadInput label="Data do batizado" type="date" value={form.dataBatizado} onChange={v => set('dataBatizado', v)} required />
                <LeadInput label="Local da cerimónia (igreja / capela)" value={form.localCerimonia} onChange={v => set('localCerimonia', v)}
                  placeholder="Ex: Igreja de São Pedro, Lisboa" />
                <LeadInput label="Local da festa / receção" value={form.localFesta} onChange={v => set('localFesta', v)}
                  placeholder="Ex: Quinta das Flores, Sintra" />
                <LeadInput label="Nome dos padrinhos" value={form.padrinhos} onChange={v => set('padrinhos', v)}
                  placeholder="Ex: Padrinho Rui & Madrinha Sofia" />
                <LeadInput label="Número de convidados (sensivelmente)" value={form.numConvidados} onChange={v => set('numConvidados', v)}
                  placeholder="Ex: 80" />
              </div>
            )}

            {/* ── Passo 3: perguntas que ninguém faz ─── */}
            {step === 3 && (
              <div className="space-y-11">
                <div className="space-y-3">
                  <div>
                    <p className="quest">Qual é o <em>vosso estilo?</em></p>
                    <p className="hint mt-2">Podem escolher mais do que um</p>
                  </div>
                  <PillToggle options={ESTILO} value={form.estilo} onChange={v => set('estilo', v)} />
                </div>
                <div className="space-y-3">
                  <p className="quest">Como imaginam olhar para estas imagens <em>daqui a 20 anos?</em></p>
                  <textarea value={form.visao20anos} onChange={e => set('visao20anos', e.target.value)} rows={3}
                    placeholder="Partilhem o que sentem..." className="finput" />
                </div>
                <div className="space-y-3">
                  <p className="quest">Já viram algum trabalho nosso que <em>vos emocionou?</em></p>
                  <LeadInput label="Link ou descrição" value={form.trabalhoFavorito} onChange={v => set('trabalhoFavorito', v)}
                    placeholder="Ex: o vídeo do batizado partilhado no Instagram..." />
                </div>
                <div className="space-y-3">
                  <p className="quest">Há algo que <em>não gostam</em> em fotos ou vídeo?</p>
                  <textarea value={form.preocupacoes} onChange={e => set('preocupacoes', e.target.value)} rows={3}
                    placeholder="Poses, ângulos, estilos de edição..." className="finput" />
                </div>
              </div>
            )}

            {/* ── Passo 4: serviços ─── */}
            {step === 4 && (
              <div className="space-y-9">
                <div className="space-y-3">
                  <p className="flabel">O que pretendem? <span className="opt">*</span></p>
                  <div className="flex gap-3">
                    {['Fotografia', 'Vídeo'].map(s => {
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
                  <p className="hint pt-1">A maioria das famílias escolhe os dois: uma só equipa, dirigida em conjunto</p>
                </div>
                <div className="space-y-3">
                  <p className="flabel">Serviços adicionais</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[{ nome: 'Fotografia', sufixo: 'Foto', lista: ADICIONAIS_FOTO }, { nome: 'Vídeo', sufixo: 'Vídeo', lista: ADICIONAIS_VIDEO }].map(col => (
                      <div key={col.nome} className="space-y-1.5">
                        <p className="hint mb-2">{col.nome}</p>
                        {col.lista.map(s => {
                          const key = `${s} — ${col.sufixo}`
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
                <LeadInput label="Orçamento previsto (sensivelmente)" value={form.orcamento} onChange={v => set('orcamento', v)}
                  placeholder="Ex: 1.000 a 1.500€" />
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
                  placeholder="Ex: Lisboa, Porto, Setúbal..." required />
                <LeadSelect label="Como chegaram até nós?" value={form.comoChegou} onChange={v => set('comoChegou', v)}
                  options={COMO_CHEGOU} required />
              </div>
            )}

            {erro && <p className="err mt-7">{erro}</p>}

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
