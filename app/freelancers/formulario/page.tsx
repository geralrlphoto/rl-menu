'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ── Funções disponíveis (as 3 pedidas) ───────────────────────────────────────
type Funcao = 'FOTOGRAFO' | 'VIDEOGRAFO' | 'EDITOR'

const FUNCOES: { key: Funcao; label: string; desc: string; texto: string; img: string }[] = [
  { key: 'FOTOGRAFO',  label: 'Fotógrafo',  desc: 'Fotografia de eventos', img: '/eventos-hero-2028.webp',
    texto: 'Casamentos e batizados contados em fotografia, do primeiro olhar à última dança.' },
  { key: 'VIDEOGRAFO', label: 'Videógrafo', desc: 'Filmagem e captação',   img: '/eventos-hero-2027.webp',
    texto: 'Captar o dia com cuidado e ritmo, para um filme que os noivos vão rever a vida inteira.' },
  { key: 'EDITOR',     label: 'Editor',     desc: 'Edição de vídeo e foto', img: '/prewedding-hero.webp',
    texto: 'Dar forma às histórias: montagem, cor e som, com entregas a tempo.' },
]

const TIPOS_EVENTO = ['Casamentos', 'Batizados', 'Festas / Aniversários', 'Corporate', 'Moda / Retrato', 'Outros']

// Skills do Editor
const SOFTWARE_EDICAO = ['DaVinci Resolve', 'Adobe Premiere Pro', 'Final Cut Pro', 'Outro']
const SKILLS_EDITOR = ['Motion Graphics', 'VFX', 'Sound Design', 'Color Grading', 'Montagem', 'Legendagem', 'After Effects']
const TIPO_VIDEOS = ['Casamentos', 'Batizados', 'Same Day Edit', 'Trailer / Teaser', 'Filme Completo', 'Corporate', 'Redes Sociais / Reels', 'Outros']
const TEMPO_ENTREGA = ['Até 1 semana', '1–2 semanas', '2–4 semanas', '1–2 meses', 'Mais de 2 meses']

type FormState = {
  nome: string
  funcao: Funcao | ''
  telefone: string
  email: string
  instagram: string
  zona: string
  tipo_eventos: string[]
  servicos_feitos: string
  valor_servico: string
  // condicionais
  link_portfolio: string   // fotografo / editor (link_video)
  link_trailer: string     // videografo / editor (trailer 1)
  link_trailer2: string    // editor (trailer 2)
  link_video: string       // videografo / editor (video completo 1)
  link_video2: string      // editor (video completo 2)
  faz_edicao: string       // videografo
  equipamento_cameras: string // videografo
  captacao_audio: string   // videografo
  drone: string            // fotografo / videografo
  valor_drone: string
  marca_drone: string      // se drone === SIM
  valor_edicao: string     // editor
  tipo_videos: string[]               // editor: que tipo de vídeos edita
  tempo_entrega: string               // editor: tempo médio de entrega
  software_edicao: string[]           // editor
  skills_editor: Record<string, number> // editor: atributo → pontuação 0–5
  mensagem: string
}

const EMPTY: FormState = {
  nome: '', funcao: '', telefone: '', email: '', instagram: '', zona: '', tipo_eventos: [],
  servicos_feitos: '', valor_servico: '', link_portfolio: '', link_trailer: '', link_trailer2: '',
  link_video: '', link_video2: '', faz_edicao: '', equipamento_cameras: '', captacao_audio: '',
  drone: '', valor_drone: '', marca_drone: '', valor_edicao: '',
  tipo_videos: [], tempo_entrega: '', software_edicao: [], skills_editor: {}, mensagem: '',
}

const OURO = '#C9A84C'

// Cartão de secção do formulário: número, título e borda esquerda dourada
function Bloco({ n, titulo, sub, children }: { n: string; titulo: string; sub?: string; children: ReactNode }) {
  return (
  <section className="rounded-[22px] border border-white/[0.08] bg-[#111111]/90 p-5 sm:p-7"
    style={{ borderLeft: `2px solid ${OURO}99` }}>
    <div className="flex items-baseline gap-4 mb-5">
      <span className="font-bold text-[34px] leading-none text-transparent" style={{ WebkitTextStroke: `1px ${OURO}` }}>{n}</span>
      <div>
        <h2 className="font-semibold text-white text-[22px] leading-tight">{titulo}</h2>
        {sub && <p className="text-[13px] text-white/40 mt-0.5">{sub}</p>}
      </div>
    </div>
    {children}
  </section>
  )
}

// Capa estilo cartaz (a mesma do /casamentos)
function Capa({ compacta, children, aside }: { compacta?: boolean; children: ReactNode; aside?: ReactNode }) {
  return (
  <section className={`relative flex flex-col overflow-hidden ${compacta ? 'min-h-[380px]' : 'min-h-[640px] lg:min-h-[86vh]'}`}>
    <div className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/boas-vindas-camera.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-center grayscale opacity-40 lg:opacity-60" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
    </div>
    {/* Traço dourado: objetiva e mira de focagem */}
    <svg className="pointer-events-none absolute right-[6%] top-[14%] w-[360px] max-w-[55vw] opacity-50" viewBox="0 0 360 260" fill="none" stroke={OURO} strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <circle cx="180" cy="130" r="92" opacity="0.7" />
      <circle cx="180" cy="130" r="64" opacity="0.45" />
      <circle cx="180" cy="130" r="30" opacity="0.8" />
      <path d="M180 20 v26 M180 214 v26 M70 130 h26 M264 130 h26" opacity="0.7" />
      <circle cx="320" cy="40" r="10" opacity="0.8" />
      <path d="M320 24 v7 M320 49 v7 M304 40 h7 M329 40 h7" opacity="0.8" />
    </svg>
    <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
    {!compacta && (
      <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
        Palmela · Portugal · Equipa RL
      </p>
    )}
    <div className={`relative flex-1 grid grid-cols-[minmax(0,1fr)] ${aside ? 'lg:grid-cols-[minmax(0,1fr)_340px]' : ''} gap-10 items-end pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-12 lg:pt-8 pb-10 lg:pb-14`}>
      <div className="min-w-0 flex flex-col h-full">{children}</div>
      {aside}
    </div>
  </section>
  )
}

export default function FreelancerFormularioPage() {
  const [form, setForm]     = useState<FormState>(EMPTY)
  const [started, setStarted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [abertoFuncao, setAbertoFuncao] = useState<Funcao>('FOTOGRAFO')
  // Em /recrutamento (página pública) não aparece o link para as equipas
  const publica = usePathname()?.startsWith('/recrutamento') ?? false

  const formAtual = form
  const set = (k: keyof FormState, v: any) => setForm(p => ({ ...p, [k]: v }))
  const toggleEvento = (t: string) =>
    setForm(p => ({ ...p, tipo_eventos: p.tipo_eventos.includes(t) ? p.tipo_eventos.filter(x => x !== t) : [...p.tipo_eventos, t] }))
  const toggleArr = (key: 'software_edicao' | 'tipo_videos', v: string) =>
    setForm(p => ({ ...p, [key]: p[key].includes(v) ? p[key].filter(x => x !== v) : [...p[key], v] }))
  // Clicar na mesma bola desliga (volta a 0).
  const setSkillScore = (skill: string, n: number) =>
    setForm(p => ({ ...p, skills_editor: { ...p.skills_editor, [skill]: p.skills_editor[skill] === n ? 0 : n } }))

  // Todos os campos são obrigatórios — valida os que estão visíveis para a função escolhida.
  function getMissing(form: FormState = formAtual): string[] {
    const m: string[] = []
    const req = (cond: boolean, label: string) => { if (cond) m.push(label) }
    const empty = (s: string) => !s.trim()
    const f = form.funcao

    req(empty(form.nome), 'Nome completo')
    req(!f, 'Função pretendida')
    req(empty(form.telefone), 'Telefone / WhatsApp')
    req(empty(form.email), 'Email')
    req(empty(form.instagram), 'Instagram')
    req(empty(form.zona), 'Zona de residência')
    req(f !== 'EDITOR' && empty(form.servicos_feitos), 'Nº de eventos já realizados')
    req(empty(form.mensagem), 'Apresentação / mensagem')

    if (f === 'EDITOR') {
      req(form.tipo_videos.length === 0, 'Que tipo de vídeos editas')
      req(empty(form.valor_edicao), 'Valor edição (20 min)')
      req(empty(form.tempo_entrega), 'Tempo médio de entrega')
      req(empty(form.link_trailer), 'Link trailer 1')
      req(empty(form.link_trailer2), 'Link trailer 2')
      req(empty(form.link_video), 'Link vídeo completo 1')
      req(empty(form.link_video2), 'Link vídeo completo 2')
      req(form.software_edicao.length === 0, 'Programa de edição')
      req(!Object.values(form.skills_editor).some(v => v > 0), 'Atributos (pontuação)')
    } else if (f) {
      req(form.tipo_eventos.length === 0, 'Tipo de eventos que fazes')
      req(empty(form.valor_servico), 'Valor por serviço')
      if (f === 'FOTOGRAFO') req(empty(form.link_portfolio), 'Link portfólio')
      if (f === 'VIDEOGRAFO') {
        // Os 3 links (2 trailers + vídeo de casamento) são opcionais.
        req(empty(form.faz_edicao), 'Fazes edição de vídeo?')
        req(empty(form.equipamento_cameras), 'Máquinas / câmaras')
        req(empty(form.captacao_audio), 'Captação de áudio')
      }
      req(empty(form.drone), 'Tens drone?')
      if (form.drone === 'SIM') {
        req(empty(form.marca_drone), 'Marca do drone')
        req(empty(form.valor_drone), 'Valor do drone')
      }
    }
    return m
  }

  const missing = getMissing()
  // Progresso: campos obrigatórios desta função (com o formulário vazio) contra os que faltam
  const totalCampos = getMissing({ ...EMPTY, funcao: form.funcao, drone: form.drone }).length
  const canSubmit = missing.length === 0

  async function handleSubmit() {
    if (!canSubmit) {
      setError(`Faltam preencher: ${missing.join(', ')}.`)
      return
    }
    setSaving(true); setError(null)

    // Mapeamento dos links por função:
    //   FOTOGRAFO → portfólio no "link_video"
    //   VIDEOGRAFO → 1 trailer + 1 vídeo completo
    //   EDITOR → 2 trailers + 2 vídeos completos
    const links =
      form.funcao === 'FOTOGRAFO'
        ? { link_trailer: '', link_trailer2: '', link_video: form.link_portfolio.trim(), link_video2: '' }
        : form.funcao === 'EDITOR'
          ? { link_trailer: form.link_trailer.trim(), link_trailer2: form.link_trailer2.trim(), link_video: form.link_video.trim(), link_video2: form.link_video2.trim() }
          : { link_trailer: form.link_trailer.trim(), link_trailer2: form.link_trailer2.trim(), link_video: form.link_video.trim(), link_video2: '' }

    // Email vai na mensagem (a base não tem campo próprio de email).
    // Instagram tem agora campo dedicado na base — enviado à parte.
    const notas = [
      form.email.trim()    ? `✉ Email: ${form.email.trim()}` : '',
      form.mensagem.trim() ? `\n${form.mensagem.trim()}` : '',
    ].filter(Boolean).join('\n')

    const payload = {
      nome:            form.nome.trim(),
      funcao:          form.funcao,
      telefone:        form.telefone.trim(),
      instagram:       form.instagram.trim(),
      zona:            form.zona.trim(),
      // Editor → "que tipo de vídeos edita"; restantes → "tipo de eventos".
      tipo_eventos:    form.funcao === 'EDITOR' ? [] : form.tipo_eventos,
      tipo_videos:     form.funcao === 'EDITOR' ? form.tipo_videos : [],
      tempo_entrega:   form.funcao === 'EDITOR' ? form.tempo_entrega : '',
      servicos_feitos: form.funcao === 'EDITOR' ? '' : form.servicos_feitos,
      valor_servico:   form.funcao === 'EDITOR' ? '' : form.valor_servico.trim(),
      valor_drone:     form.valor_drone.trim(),
      valor_edicao:    form.valor_edicao.trim(),
      software_edicao: form.funcao === 'EDITOR' ? form.software_edicao : [],
      skills_editor:   form.funcao === 'EDITOR'
        ? SKILLS_EDITOR.filter(s => (form.skills_editor[s] ?? 0) > 0).map(s => `${s}: ${form.skills_editor[s]}/5`).join(' · ')
        : '',
      drone:           form.drone,
      marca_drone:     form.drone === 'SIM' ? form.marca_drone.trim() : '',
      faz_edicao:      form.faz_edicao,
      equipamento_cameras: form.funcao === 'VIDEOGRAFO' ? form.equipamento_cameras.trim() : '',
      captacao_audio:  form.funcao === 'VIDEOGRAFO' ? form.captacao_audio.trim() : '',
      link_trailer:    links.link_trailer,
      link_trailer2:   links.link_trailer2,
      link_video:      links.link_video,
      link_video2:     links.link_video2,
      mensagem:        notas,
    }

    try {
      const res = await fetch('/api/freelancers-novos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (!res.ok || !d.ok) throw new Error(d.error || 'Erro ao enviar.')

      // Avisa o admin (email + sino) — fire-and-forget, não bloqueia a confirmação.
      fetch('/api/send-admin-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'nova_candidatura',
          freelancer_nome: form.nome.trim(),
          funcao: form.funcao,
          telefone: form.telefone.trim(),
          candidato_email: form.email.trim(),
          instagram: form.instagram.trim(),
          zona: form.zona.trim(),
          mensagem: form.mensagem.trim(),
        }),
      }).catch(() => {})

      setDone(true)
    } catch (e: any) {
      setError(e.message || 'Não foi possível enviar. Tenta novamente.')
    } finally {
      setSaving(false)
    }
  }

  // ── Visual (igual ao /casamentos e /photo): preto, dourado suave, fotos locais ──
  const inp = "w-full bg-black/40 border border-white/[0.10] rounded-[14px] px-4 py-3 text-[15px] text-white/90 outline-none focus:border-[#C9A84C]/60 transition-colors placeholder:text-white/25"
  const lbl = "block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-2"
  const selectCls = inp + ' cursor-pointer [color-scheme:dark]'
  const optStyle = { background: '#141210', color: '#f5f5f5' }
  const chip = (on: boolean) => `px-4 py-2 rounded-full border text-[13px] font-semibold transition-all ${
    on ? 'border-[#C9A84C]/70 bg-[#C9A84C]/15 text-white shadow-[0_0_24px_-10px_rgba(201,168,76,0.8)]' : 'border-white/10 bg-white/[0.02] text-white/45 hover:text-white/80 hover:border-white/25'}`

  // ── Ecrã de confirmação ────────────────────────────────────────────────────
  if (done) {
    return (
      <main className="min-h-screen bg-[#070707] overflow-x-clip font-cond">
        <Capa>
          <div className="mt-auto pt-20">
            <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
            <h1 className="font-bold uppercase text-white leading-[0.88] text-[48px] sm:text-[84px] lg:text-[110px] mt-2">Obrigado</h1>
            <div className="flex items-center gap-4 mt-5">
              <span className="w-12 h-px bg-[#C9A84C]" />
              <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">Candidatura enviada</p>
            </div>
            <p className="font-light text-white/55 text-[16px] sm:text-[18px] leading-relaxed mt-5 max-w-xl">
              Obrigado pelo teu interesse em juntar-te à equipa RL. Vamos analisar a tua candidatura e entramos em contacto em breve.
            </p>
            <button onClick={() => { setForm(EMPTY); setDone(false) }}
              className="mt-8 inline-flex items-center gap-2 border border-white/15 hover:border-white/35 bg-black/30 px-6 py-3.5 text-[15px] font-semibold tracking-[0.18em] uppercase text-white/85 transition-all">
              Enviar outra candidatura
            </button>
          </div>
        </Capa>
      </main>
    )
  }

  // ── Ecrã de apresentação (antes do formulário) ─────────────────────────────
  if (!started) {
    const comecar = (f?: Funcao) => { if (f) set('funcao', f); setStarted(true); window.scrollTo({ top: 0 }) }
    return (
      <main className="min-h-screen bg-[#070707] overflow-x-clip font-cond">
        <Capa aside={
          <aside className="rounded-[22px] border border-[#C9A84C]/30 bg-[#111111]/80 backdrop-blur-xl p-5 shadow-[0_0_48px_-22px_rgba(201,168,76,0.5)]">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/85">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-[0_0_8px_#C9A84C]" />
              Os nossos princípios
            </p>
            <div className="mt-2">
              {[
                ['Especialização', 'A pessoa certa para cada função.'],
                ['Opinião partilhada', 'Ouvimos-te e damos-te a nossa.'],
                ['Rigor e respeito', 'Pelo teu trabalho e pelo cliente.'],
              ].map(([t, d], i) => (
                <div key={t} className={`flex items-start gap-3.5 py-3.5 ${i > 0 ? 'border-t border-white/[0.07]' : ''}`}>
                  <span className="font-bold text-[22px] leading-none text-transparent mt-0.5" style={{ WebkitTextStroke: `1px ${OURO}` }}>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="font-semibold text-[16px] text-white leading-tight">{t}</p>
                    <p className="text-[13px] text-white/45 mt-1">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        }>
          {!publica && <Link href="/freelancers" className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors self-start">‹ Equipas de trabalho</Link>}
          <div className="mt-auto pt-20">
            <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
            <h1 className="font-bold uppercase text-white leading-[0.88] text-[44px] sm:text-[80px] lg:text-[76px] xl:text-[112px] 2xl:text-[132px] mt-2">
              Recrutamento
            </h1>
            <div className="flex items-center gap-4 mt-5">
              <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
              <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">
                Fotógrafo · Videógrafo · <span className="text-[#C9A84C]">Editor</span>
              </p>
            </div>
            <div className="font-light text-white/55 text-[16px] sm:text-[17px] leading-relaxed mt-5 max-w-xl space-y-3">
              <p>Trabalhar connosco é mais do que prestar um serviço. É uma <span className="text-white/90">parceria</span>. Somos uma produtora especializada em <span className="text-white/90">casamentos e batizados</span>, e cada função é entregue a <span className="text-white/90">pessoas especializadas</span>.</p>
              <p>Valorizamos a tua opinião tanto quanto gostamos de dar a nossa. Se procuras uma equipa que respeita o teu talento e cresce contigo, é aqui que começamos.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <button onClick={() => comecar()}
                className="inline-flex items-center gap-2.5 border border-[#C9A84C]/70 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/30 px-7 py-3.5 text-[15px] font-semibold tracking-[0.18em] uppercase text-white transition-all shadow-[0_0_34px_-12px_rgba(201,168,76,0.7)]">
                Candidatar
                <span className="text-[#C9A84C]">→</span>
              </button>
              <a href="#funcoes"
                className="inline-flex items-center gap-2 border border-white/15 hover:border-white/35 bg-black/30 px-6 py-3.5 text-[15px] font-semibold tracking-[0.18em] uppercase text-white/85 transition-all">
                / Ver funções
              </a>
            </div>
          </div>
        </Capa>

        {/* ── FUNÇÕES: o cartão em foco abre, como as temporadas do /casamentos ── */}
        <section id="funcoes" className="max-w-6xl mx-auto px-5 sm:px-10 pt-6 pb-20 scroll-mt-6">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Funções</p>
              <h2 className="font-semibold text-white text-[30px] sm:text-[34px] leading-tight mt-1">Escolhe a tua</h2>
            </div>
            <span className="hidden sm:block text-[13px] text-white/30">Passa o rato para abrir</span>
          </div>

          <div className="hidden sm:flex gap-3 h-[440px]">
            {FUNCOES.map((f, i) => {
              const ativo = abertoFuncao === f.key
              return (
                <button key={f.key} type="button" onClick={() => comecar(f.key)}
                  onMouseEnter={() => setAbertoFuncao(f.key)} onFocus={() => setAbertoFuncao(f.key)}
                  className="group relative rounded-[24px] overflow-hidden border text-left"
                  style={{
                    flex: ativo ? '3 1 0%' : '1 1 0%',
                    transition: 'flex .55s cubic-bezier(.2,.7,.2,1), border-color .4s ease, box-shadow .4s ease',
                    borderColor: ativo ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.12)',
                    boxShadow: ativo ? '0 0 50px -20px rgba(201,168,76,0.6)' : 'none',
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.img} alt="" className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: ativo ? 'grayscale(0.15) brightness(0.85)' : 'grayscale(1) brightness(0.5)', transform: ativo ? 'scale(1.04)' : 'scale(1)', transition: 'filter .55s ease, transform .9s ease' }} />
                  <div className="absolute inset-0" style={{ background: ativo
                    ? 'linear-gradient(to top, rgba(7,7,7,0.95) 15%, rgba(7,7,7,0.35) 55%, rgba(7,7,7,0.1) 100%)'
                    : 'linear-gradient(to top, rgba(7,7,7,0.9), rgba(7,7,7,0.55))' }} />
                  {!ativo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-bold uppercase text-white/75 text-[30px] tracking-[0.15em]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{f.label}</span>
                    </div>
                  )}
                  <div className="relative h-full flex flex-col justify-end p-7"
                    style={{ opacity: ativo ? 1 : 0, transition: 'opacity .4s ease .1s' }}>
                    <span className="absolute top-6 left-7 font-bold text-[52px] leading-none text-transparent" style={{ WebkitTextStroke: `1px ${OURO}` }}>{String(i + 1).padStart(2, '0')}</span>
                    <p className="font-bold uppercase text-white text-[56px] leading-none">{f.label}</p>
                    <div className="w-16 h-px bg-[#C9A84C] my-5" />
                    <p className="text-[16px] text-white/70 max-w-md">{f.texto}</p>
                    <div className="flex items-center justify-between mt-6">
                      <span className="text-[14px] tracking-[0.18em] uppercase text-white/60 group-hover:text-[#C9A84C] transition-colors">Candidatar como {f.label.toLowerCase()}</span>
                      <span className="w-11 h-11 rounded-full border border-[#C9A84C]/45 text-[#C9A84C] flex items-center justify-center group-hover:bg-[#C9A84C]/25 transition-all">→</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Telemóvel: cartões empilhados */}
          <div className="sm:hidden flex flex-col gap-4">
            {FUNCOES.map((f, i) => (
              <button key={f.key} type="button" onClick={() => comecar(f.key)}
                className="relative rounded-[22px] overflow-hidden border h-48 flex items-end text-left"
                style={{ borderColor: 'rgba(201,168,76,0.25)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.img} alt="" className="absolute inset-0 w-full h-full object-cover grayscale-[60%]" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,7,7,0.95), rgba(7,7,7,0.3))' }} />
                <div className="relative w-full p-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[12px] text-[#C9A84C]">{String(i + 1).padStart(2, '0')}</p>
                    <p className="font-bold uppercase text-white text-[34px] leading-none">{f.label}</p>
                    <p className="text-[13px] text-white/55 mt-2">{f.desc}</p>
                  </div>
                  <span className="w-10 h-10 shrink-0 rounded-full border border-[#C9A84C]/45 text-[#C9A84C] flex items-center justify-center">→</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    )
  }

  const isFoto  = form.funcao === 'FOTOGRAFO'
  const isVideo = form.funcao === 'VIDEOGRAFO'
  const isEditor = form.funcao === 'EDITOR'
  const showDrone = isFoto || isVideo
  const feitos = Math.max(0, totalCampos - missing.length)
  const pct = totalCampos ? Math.round((feitos / totalCampos) * 100) : 0

  return (
    <main className="min-h-screen bg-[#070707] overflow-x-clip font-cond">
      <Capa compacta>
        <button onClick={() => setStarted(false)} className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors self-start">‹ Voltar</button>
        <div className="mt-auto pt-12">
          <p className="text-[13px] sm:text-[16px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">Recrutamento</p>
          <h1 className="font-bold uppercase text-white leading-[0.9] text-[40px] sm:text-[64px] lg:text-[76px] mt-2">Candidatura</h1>
          <div className="flex items-center gap-4 mt-4">
            <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
            <p className="text-[13px] sm:text-[15px] tracking-[0.18em] uppercase text-white/65">Todos os campos são obrigatórios</p>
          </div>
        </div>
      </Capa>

      <div className="max-w-6xl mx-auto px-5 sm:px-10 pb-20 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_300px] gap-8 items-start">
        <div className="flex flex-col gap-5">

          {/* ── 1. Função pretendida ── */}
          <Bloco n="01" titulo="Função pretendida" sub="O que queres fazer connosco">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FUNCOES.map(f => {
                const active = form.funcao === f.key
                return (
                  <button key={f.key} type="button" onClick={() => set('funcao', f.key)}
                    className="group relative h-36 rounded-[18px] overflow-hidden border text-left transition-all"
                    style={{ borderColor: active ? OURO : 'rgba(255,255,255,0.08)', boxShadow: active ? '0 0 34px -12px rgba(201,168,76,0.8)' : 'none' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.img} alt="" className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
                      style={{ filter: active ? 'grayscale(0) brightness(0.75)' : 'grayscale(1) brightness(0.45)', transform: active ? 'scale(1.06)' : 'scale(1)' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/50 to-transparent" />
                    {active && <span className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold text-black" style={{ background: OURO }}>✓</span>}
                    <div className="absolute left-4 right-4 bottom-3.5">
                      <p className="font-bold uppercase text-white text-[22px] leading-none">{f.label}</p>
                      <p className="text-[12px] text-white/55 mt-1">{f.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </Bloco>

          {/* ── 2. Dados de contacto ── */}
          <Bloco n="02" titulo="Sobre ti" sub="Como te contactamos">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={lbl}>Nome completo</label>
                <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="O teu nome" className={inp} />
              </div>
              <div>
                <label className={lbl}>Telefone / WhatsApp</label>
                <input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="9xx xxx xxx" className={inp} />
              </div>
              <div>
                <label className={lbl}>Email</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" className={inp} />
              </div>
              <div>
                <label className={lbl}>Instagram</label>
                <input value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@utilizador" className={inp} />
              </div>
              <div>
                <label className={lbl}>Zona de residência</label>
                <input value={form.zona} onChange={e => set('zona', e.target.value)} placeholder="ex: Lisboa" className={inp} />
              </div>
            </div>
          </Bloco>

          {/* ── 3. Experiência e valores ── */}
          <Bloco n="03" titulo="Experiência" sub={isEditor ? 'Os vídeos que editas e os teus valores' : 'Os eventos que fazes e os teus valores'}>
            <div className="flex flex-col gap-5">
              {isEditor ? (
                <div>
                  <label className={lbl}>Que tipo de vídeos editas</label>
                  <div className="flex flex-wrap gap-2">
                    {TIPO_VIDEOS.map(t => (
                      <button key={t} type="button" onClick={() => toggleArr('tipo_videos', t)} className={chip(form.tipo_videos.includes(t))}>{t}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className={lbl}>Tipo de eventos que fazes</label>
                  <div className="flex flex-wrap gap-2">
                    {TIPOS_EVENTO.map(t => (
                      <button key={t} type="button" onClick={() => toggleEvento(t)} className={chip(form.tipo_eventos.includes(t))}>{t}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!isEditor && (
                  <div>
                    <label className={lbl}>Nº de eventos já realizados</label>
                    <input type="number" min="0" value={form.servicos_feitos} onChange={e => set('servicos_feitos', e.target.value)} placeholder="ex: 30" className={inp} />
                  </div>
                )}
                {!isEditor && (
                  <div>
                    <label className={lbl}>Valor por serviço</label>
                    <input value={form.valor_servico} onChange={e => set('valor_servico', e.target.value)} placeholder="ex: 250€" className={inp} />
                  </div>
                )}
                {isEditor && (
                  <div>
                    <label className={lbl}>Valor edição (20 min)</label>
                    <input value={form.valor_edicao} onChange={e => set('valor_edicao', e.target.value)} placeholder="ex: 80€" className={inp} />
                  </div>
                )}
                {isEditor && (
                  <div>
                    <label className={lbl}>Tempo médio de entrega</label>
                    <select value={form.tempo_entrega} onChange={e => set('tempo_entrega', e.target.value)} className={selectCls}>
                      <option value="" style={optStyle}>Escolher</option>
                      {TEMPO_ENTREGA.map(t => <option key={t} value={t} style={optStyle}>{t}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </Bloco>

          {/* ── 4. Detalhes por função ── */}
          {form.funcao && (
            <Bloco n="04" titulo={`Detalhes de ${FUNCOES.find(f => f.key === form.funcao)?.label.toLowerCase()}`} sub="Trabalhos, equipamento e especialidades">
              <div className="flex flex-col gap-5">
                {isFoto && (
                  <div>
                    <label className={lbl}>Link portfólio</label>
                    <input value={form.link_portfolio} onChange={e => set('link_portfolio', e.target.value)} placeholder="https://..." className={inp} />
                  </div>
                )}

                {isEditor && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Link trailer 1</label>
                        <input value={form.link_trailer} onChange={e => set('link_trailer', e.target.value)} placeholder="https://..." className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Link trailer 2</label>
                        <input value={form.link_trailer2} onChange={e => set('link_trailer2', e.target.value)} placeholder="https://..." className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Link vídeo completo 1</label>
                        <input value={form.link_video} onChange={e => set('link_video', e.target.value)} placeholder="https://..." className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Link vídeo completo 2</label>
                        <input value={form.link_video2} onChange={e => set('link_video2', e.target.value)} placeholder="https://..." className={inp} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Programa de edição</label>
                      <div className="flex flex-wrap gap-2">
                        {SOFTWARE_EDICAO.map(s => (
                          <button key={s} type="button" onClick={() => toggleArr('software_edicao', s)} className={chip(form.software_edicao.includes(s))}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Atributos / especialidades <span className="text-white/25 normal-case tracking-normal">· dá a tua pontuação</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SKILLS_EDITOR.map(s => {
                          const score = form.skills_editor[s] ?? 0
                          return (
                            <div key={s} className="flex items-center justify-between gap-4 rounded-[14px] border border-white/[0.07] bg-black/30 px-4 py-2.5">
                              <span className="text-[14px] text-white/75">{s}</span>
                              <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4, 5].map(n => (
                                  <button key={n} type="button" onClick={() => setSkillScore(s, n)} aria-label={`${s}: ${n} de 5`}
                                    className="w-4 h-4 rounded-full border transition-all"
                                    style={{
                                      borderColor: n <= score ? OURO : 'rgba(255,255,255,0.18)',
                                      background: n <= score ? OURO : 'transparent',
                                      boxShadow: n <= score ? '0 0 8px rgba(201,168,76,0.6)' : 'none',
                                    }} />
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                {isVideo && (
                  <>
                    <div>
                      <p className="text-[14px] text-white/55 mb-3">Coloca aqui alguns vídeos que tenhas feito ou participado <span className="text-white/30">(opcional)</span></p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={lbl}>Link trailer 1</label>
                          <input value={form.link_trailer} onChange={e => set('link_trailer', e.target.value)} placeholder="https://..." className={inp} />
                        </div>
                        <div>
                          <label className={lbl}>Link trailer 2</label>
                          <input value={form.link_trailer2} onChange={e => set('link_trailer2', e.target.value)} placeholder="https://..." className={inp} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={lbl}>Link completo de vídeo de casamento</label>
                          <input value={form.link_video} onChange={e => set('link_video', e.target.value)} placeholder="https://..." className={inp} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Fazes edição de vídeo?</label>
                        <div className="flex gap-2">
                          {['SIM', 'NÃO'].map(v => (
                            <button key={v} type="button" onClick={() => set('faz_edicao', v)} className={chip(form.faz_edicao === v)}>{v === 'SIM' ? 'Sim' : 'Não'}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Máquinas / câmaras</label>
                        <input value={form.equipamento_cameras} onChange={e => set('equipamento_cameras', e.target.value)} placeholder="ex: Sony A7 IV, FX3" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Captação de áudio</label>
                        <input value={form.captacao_audio} onChange={e => set('captacao_audio', e.target.value)} placeholder="ex: Rode Wireless, Zoom H6" className={inp} />
                      </div>
                    </div>
                  </>
                )}

                {showDrone && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Tens drone?</label>
                      <div className="flex gap-2">
                        {['SIM', 'NÃO'].map(v => (
                          <button key={v} type="button" onClick={() => set('drone', v)} className={chip(form.drone === v)}>{v === 'SIM' ? 'Sim' : 'Não'}</button>
                        ))}
                      </div>
                    </div>
                    {form.drone === 'SIM' && (
                      <div>
                        <label className={lbl}>Marca do drone</label>
                        <input value={form.marca_drone} onChange={e => set('marca_drone', e.target.value)} placeholder="ex: DJI Mavic 3" className={inp} />
                      </div>
                    )}
                    {form.drone === 'SIM' && (
                      <div>
                        <label className={lbl}>Valor do drone</label>
                        <input value={form.valor_drone} onChange={e => set('valor_drone', e.target.value)} placeholder="ex: 100€" className={inp} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Bloco>
          )}

          {/* ── 5. Mensagem ── */}
          <Bloco n={form.funcao ? '05' : '04'} titulo="Apresentação" sub="Conta-nos um pouco sobre ti">
            <textarea value={form.mensagem} onChange={e => set('mensagem', e.target.value)} rows={5}
              placeholder="A tua experiência, o teu equipamento, o que te faz gostar deste trabalho..."
              className={inp + ' resize-none'} />
          </Bloco>
        </div>

        {/* ── Resumo + enviar (fixo ao lado no computador) ── */}
        <aside className="lg:sticky lg:top-6 rounded-[22px] border border-[#C9A84C]/30 bg-[#111111]/90 backdrop-blur-xl p-5 shadow-[0_0_48px_-22px_rgba(201,168,76,0.5)]">
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/85">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-[0_0_8px_#C9A84C]" />
            A tua candidatura
          </p>
          <div className="grid grid-cols-2 mt-3">
            <div className="py-3 pr-4 border-r border-white/[0.07]">
              <p className="text-[11px] text-white/50">Função</p>
              <p className="font-semibold text-[18px] leading-tight mt-1.5 text-white">{FUNCOES.find(f => f.key === form.funcao)?.label ?? '—'}</p>
            </div>
            <div className="py-3 pl-4">
              <p className="text-[11px] text-white/50">Preenchido</p>
              <p className="font-semibold text-[18px] leading-tight mt-1.5 text-[#C9A84C]">{pct}%</p>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-1">
            <div className="h-full rounded-full bg-gradient-to-r from-[#C9A84C]/50 to-[#C9A84C]" style={{ width: `${pct}%`, transition: 'width .6s ease' }} />
          </div>
          <p className="text-[12px] text-white/40 mt-3">
            {canSubmit ? 'Está tudo preenchido. Já podes enviar.' : `Falta${missing.length > 1 ? 'm' : ''} ${missing.length} campo${missing.length > 1 ? 's' : ''}.`}
          </p>

          {error && (
            <div className="mt-4 text-[13px] text-red-300/90 bg-red-500/10 border border-red-500/25 rounded-[14px] px-4 py-3">{error}</div>
          )}

          <button onClick={handleSubmit} disabled={saving}
            className="mt-5 w-full inline-flex items-center justify-center gap-2.5 border border-[#C9A84C]/70 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/30 px-6 py-3.5 text-[15px] font-semibold tracking-[0.18em] uppercase text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ boxShadow: canSubmit ? '0 0 34px -12px rgba(201,168,76,0.8)' : 'none' }}>
            {saving ? 'A enviar...' : <>Enviar candidatura <span className="text-[#C9A84C]">→</span></>}
          </button>
          <p className="text-center text-[11px] text-white/25 mt-3">Ao enviar, aceitas ser contactado pela equipa RL Photo·Video.</p>
        </aside>
      </div>
    </main>
  )
}
