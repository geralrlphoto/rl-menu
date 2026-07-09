'use client'

import { useState } from 'react'
import Link from 'next/link'

// ── Funções disponíveis (as 3 pedidas) ───────────────────────────────────────
type Funcao = 'FOTOGRAFO' | 'VIDEOGRAFO' | 'EDITOR'

const FUNCOES: { key: Funcao; label: string; desc: string; color: string; glow: string }[] = [
  { key: 'FOTOGRAFO',  label: 'Fotógrafo',  desc: 'Fotografia de eventos', color: '#facc15', glow: 'rgba(250,204,21,' },
  { key: 'VIDEOGRAFO', label: 'Videógrafo', desc: 'Filmagem e captação',   color: '#34d399', glow: 'rgba(52,211,153,' },
  { key: 'EDITOR',     label: 'Editor',     desc: 'Edição de vídeo/foto',  color: '#a78bfa', glow: 'rgba(167,139,250,' },
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

export default function FreelancerFormularioPage() {
  const [form, setForm]     = useState<FormState>(EMPTY)
  const [started, setStarted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const set = (k: keyof FormState, v: any) => setForm(p => ({ ...p, [k]: v }))
  const toggleEvento = (t: string) =>
    setForm(p => ({ ...p, tipo_eventos: p.tipo_eventos.includes(t) ? p.tipo_eventos.filter(x => x !== t) : [...p.tipo_eventos, t] }))
  const toggleArr = (key: 'software_edicao' | 'tipo_videos', v: string) =>
    setForm(p => ({ ...p, [key]: p[key].includes(v) ? p[key].filter(x => x !== v) : [...p[key], v] }))
  // Clicar na mesma bola desliga (volta a 0).
  const setSkillScore = (skill: string, n: number) =>
    setForm(p => ({ ...p, skills_editor: { ...p.skills_editor, [skill]: p.skills_editor[skill] === n ? 0 : n } }))

  const inp = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/85 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20"
  const lbl = "block text-[10px] text-white/35 tracking-widest uppercase mb-1.5"
  // Menu nativo escuro (Chromium) — sem isto as opções ficavam texto branco em fundo branco.
  const selectCls = inp + ' cursor-pointer [color-scheme:dark]'
  const optStyle = { background: '#141210', color: '#f5f5f5' }

  // Todos os campos são obrigatórios — valida os que estão visíveis para a função escolhida.
  function getMissing(): string[] {
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

  // ── Ecrã de confirmação ────────────────────────────────────────────────────
  if (done) {
    return (
      <main className="min-h-screen px-4 sm:px-8 py-8 max-w-[720px] mx-auto flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center mb-6"
          style={{ boxShadow: '0 0 30px rgba(52,211,153,0.25)' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
          Candidatura <span className="italic text-gold">enviada</span>
        </h1>
        <p className="text-sm text-white/50 mt-3 max-w-md leading-relaxed">
          Obrigado pelo teu interesse em juntar-te à equipa RL. Vamos analisar a tua candidatura e entramos em contacto em breve.
        </p>
        <button onClick={() => { setForm(EMPTY); setDone(false) }}
          className="mt-8 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/50 text-xs font-semibold tracking-widest hover:bg-white/[0.06] hover:text-white/80 transition-all uppercase">
          Enviar outra candidatura
        </button>
      </main>
    )
  }

  // ── Ecrã de apresentação (antes do formulário) ─────────────────────────────
  if (!started) {
    return (
      <main className="min-h-screen px-4 sm:px-8 py-12 max-w-[680px] mx-auto flex flex-col justify-center">
        <div>
          <Link href="/freelancers" className="text-[10px] tracking-[0.3em] text-white/25 hover:text-white/50 uppercase transition-colors">
            ← Equipas de Trabalho
          </Link>
          <p className="text-[10px] tracking-[0.5em] uppercase text-gold/70 font-bold mt-6">Recrutamento</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide text-white mt-2 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Colaborar com a <span className="italic text-gold">RL Photo·Video</span>
          </h1>
          <div className="mt-5 h-px w-16 bg-gold/40" />

          <div className="mt-7 space-y-5 text-[15px] leading-relaxed text-white/60">
            <p>
              Trabalhar connosco é mais do que prestar um serviço. É uma <span className="text-white/85">parceria</span>.
              Somos uma produtora especializada em <span className="text-white/85">casamentos e batizados</span> e atuamos
              também noutras áreas, sempre com uma regra que não muda: cada função é entregue a
              <span className="text-white/85"> pessoas especializadas</span>, para que o resultado esteja à altura de quem confia em nós.
            </p>
            <p>
              Temos <span className="text-white/85">princípios</span> e gostamos de os partilhar. Valorizamos a tua opinião
              tanto quanto gostamos de dar a nossa. É dessa troca honesta que nascem os melhores trabalhos.
            </p>
            <p>
              Se procuras uma equipa que respeita o teu talento e cresce contigo, é aqui que começamos.
            </p>
          </div>

          {/* Princípios */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              ['✦', 'Especialização', 'A pessoa certa para cada função.'],
              ['✦', 'Opinião partilhada', 'Ouvimos-te e damos-te a nossa.'],
              ['✦', 'Rigor & respeito', 'Pelo teu trabalho e pelo cliente.'],
            ].map(([icon, titulo, desc]) => (
              <div key={titulo} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <span className="text-gold text-sm">{icon}</span>
                <p className="text-[13px] font-semibold text-white/80 mt-1.5" style={{ fontFamily: 'Georgia, serif' }}>{titulo}</p>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <button onClick={() => setStarted(true)}
            className="mt-9 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gold text-black font-bold text-sm tracking-widest uppercase hover:bg-gold/85 transition-all group"
            style={{ boxShadow: '0 0 20px rgba(201,164,92,0.25)' }}>
            Avançar
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>
      </main>
    )
  }

  const isFoto  = form.funcao === 'FOTOGRAFO'
  const isVideo = form.funcao === 'VIDEOGRAFO'
  const isEditor = form.funcao === 'EDITOR'
  const showDrone = isFoto || isVideo

  return (
    <main className="min-h-screen px-4 sm:px-8 py-8 max-w-[720px] mx-auto">

      {/* Header */}
      <div className="mb-8">
        <Link href="/freelancers" className="text-[10px] tracking-[0.3em] text-white/25 hover:text-white/50 uppercase transition-colors">
          ← Equipas de Trabalho
        </Link>
        <h1 className="text-2xl font-bold tracking-wide text-white mt-2" style={{ fontFamily: 'Georgia, serif' }}>
          Junta-te à <span className="italic text-gold">equipa RL</span>
        </h1>
        <p className="text-sm text-white/45 mt-2 leading-relaxed max-w-lg">
          Preenche o formulário de recrutamento. <span className="text-gold">Todos os campos são obrigatórios.</span>
        </p>
        <div className="mt-4 h-px w-16 bg-gold/40" />
      </div>

      <div className="space-y-7">

        {/* ── 1. Função pretendida ──────────────────────────────────────────── */}
        <div>
          <label className={lbl}>Função pretendida *</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
            {FUNCOES.map(f => {
              const active = form.funcao === f.key
              return (
                <button key={f.key} type="button" onClick={() => set('funcao', f.key)}
                  className="relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border transition-all duration-300"
                  style={{
                    borderColor: active ? f.color : 'rgba(255,255,255,0.08)',
                    background: active ? `${f.glow}0.08)` : 'rgba(255,255,255,0.02)',
                    boxShadow: active ? `0 0 14px ${f.glow}0.3), inset 0 0 18px ${f.glow}0.05)` : 'none',
                  }}>
                  <span className="text-sm font-bold tracking-widest uppercase transition-colors"
                    style={{ color: active ? f.color : 'rgba(255,255,255,0.45)' }}>
                    {f.label}
                  </span>
                  <span className="text-[10px] text-white/30">{f.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── 2. Dados de contacto ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={lbl}>Nome completo *</label>
            <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="O teu nome" className={inp} />
          </div>
          <div>
            <label className={lbl}>Telefone / WhatsApp *</label>
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
          {!isEditor && (
            <div>
              <label className={lbl}>Nº de eventos já realizados</label>
              <input type="number" min="0" value={form.servicos_feitos} onChange={e => set('servicos_feitos', e.target.value)} placeholder="ex: 30" className={inp} />
            </div>
          )}
        </div>

        {/* ── 3. Tipo de eventos / vídeos ───────────────────────────────────── */}
        {isEditor ? (
          <div>
            <label className={lbl}>Que tipo de vídeos editas</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {TIPO_VIDEOS.map(t => {
                const on = form.tipo_videos.includes(t)
                return (
                  <button key={t} type="button" onClick={() => toggleArr('tipo_videos', t)}
                    className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-semibold tracking-wide transition-all ${
                      on ? 'border-gold/50 bg-gold/10 text-gold' : 'border-white/10 bg-white/[0.02] text-white/40 hover:text-white/70 hover:border-white/25'
                    }`}>
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div>
            <label className={lbl}>Tipo de eventos que fazes</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {TIPOS_EVENTO.map(t => {
                const on = form.tipo_eventos.includes(t)
                return (
                  <button key={t} type="button" onClick={() => toggleEvento(t)}
                    className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-semibold tracking-wide transition-all ${
                      on ? 'border-gold/50 bg-gold/10 text-gold' : 'border-white/10 bg-white/[0.02] text-white/40 hover:text-white/70 hover:border-white/25'
                    }`}>
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 4. Valores ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Editor cobra por edição, não por serviço. */}
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
                <option value="" style={optStyle}>—</option>
                {TEMPO_ENTREGA.map(t => <option key={t} value={t} style={optStyle}>{t}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* ── 5. Campos condicionais por função ─────────────────────────────── */}
        {form.funcao && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 space-y-4">
            <p className="text-[10px] tracking-[0.3em] text-gold/70 uppercase">
              Detalhes — {FUNCOES.find(f => f.key === form.funcao)?.label}
            </p>

            {isFoto && (
              <div>
                <label className={lbl}>Link portfólio</label>
                <input value={form.link_portfolio} onChange={e => set('link_portfolio', e.target.value)} placeholder="https://..." className={inp} />
              </div>
            )}

            {isEditor && (
              <div className="space-y-4">
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

                {/* Skills — programa de edição */}
                <div>
                  <label className={lbl}>Programa de edição</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {SOFTWARE_EDICAO.map(s => {
                      const on = form.software_edicao.includes(s)
                      return (
                        <button key={s} type="button" onClick={() => toggleArr('software_edicao', s)}
                          className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-semibold tracking-wide transition-all ${
                            on ? 'border-violet-400/60 bg-violet-500/10 text-violet-300' : 'border-white/10 bg-white/[0.02] text-white/40 hover:text-white/70 hover:border-white/25'
                          }`}>
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Skills — atributos com pontuação (bolas 1–5) */}
                <div>
                  <label className={lbl}>Atributos / especialidades <span className="text-white/20 normal-case tracking-normal">— dá a tua pontuação</span></label>
                  <div className="space-y-2 mt-1">
                    {SKILLS_EDITOR.map(s => {
                      const score = form.skills_editor[s] ?? 0
                      return (
                        <div key={s} className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2">
                          <span className="text-[13px] text-white/70">{s}</span>
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map(n => (
                              <button key={n} type="button" onClick={() => setSkillScore(s, n)}
                                aria-label={`${s}: ${n} de 5`}
                                className="w-4 h-4 rounded-full border transition-all"
                                style={{
                                  borderColor: n <= score ? '#a78bfa' : 'rgba(255,255,255,0.18)',
                                  background: n <= score ? '#a78bfa' : 'transparent',
                                  boxShadow: n <= score ? '0 0 6px rgba(167,139,250,0.5)' : 'none',
                                }} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {isVideo && (
              <div className="space-y-4">
                {/* Links opcionais — trabalhos do videógrafo */}
                <div>
                  <p className="text-[12px] text-white/50 mb-2">Coloca aqui alguns vídeos que tenhas feito ou participado <span className="text-white/25">(opcional)</span></p>
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
                    <select value={form.faz_edicao} onChange={e => set('faz_edicao', e.target.value)} className={selectCls}>
                      <option value="" style={optStyle}>—</option>
                      <option value="SIM" style={optStyle}>Sim</option>
                      <option value="NÃO" style={optStyle}>Não</option>
                    </select>
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
              </div>
            )}

            {showDrone && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Tens drone?</label>
                  <select value={form.drone} onChange={e => set('drone', e.target.value)} className={selectCls}>
                    <option value="" style={optStyle}>—</option>
                    <option value="SIM" style={optStyle}>Sim</option>
                    <option value="NÃO" style={optStyle}>Não</option>
                  </select>
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
        )}

        {/* ── 6. Mensagem ───────────────────────────────────────────────────── */}
        <div>
          <label className={lbl}>Apresentação / mensagem</label>
          <textarea value={form.mensagem} onChange={e => set('mensagem', e.target.value)} rows={4}
            placeholder="Conta-nos um pouco sobre ti, a tua experiência e o teu equipamento..."
            className={inp + ' resize-none'} />
        </div>

        {/* ── Erro + Submit ─────────────────────────────────────────────────── */}
        {error && (
          <div className="text-xs text-red-400/80 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={saving}
          className="w-full py-3.5 rounded-xl bg-gold text-black font-bold text-sm tracking-widest uppercase hover:bg-gold/85 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ boxShadow: canSubmit ? '0 0 20px rgba(201,164,92,0.25)' : 'none' }}>
          {saving ? 'A enviar...' : 'Enviar candidatura'}
        </button>

        <p className="text-center text-[10px] text-white/20 tracking-wide pb-4">
          Ao enviar, aceitas ser contactado pela equipa RL Photo·Video.
        </p>
      </div>
    </main>
  )
}
