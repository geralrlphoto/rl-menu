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
  drone: string            // fotografo / videografo
  valor_drone: string
  valor_edicao: string     // editor
  mensagem: string
}

const EMPTY: FormState = {
  nome: '', funcao: '', telefone: '', email: '', instagram: '', zona: '', tipo_eventos: [],
  servicos_feitos: '', valor_servico: '', link_portfolio: '', link_trailer: '', link_trailer2: '',
  link_video: '', link_video2: '', faz_edicao: '', drone: '', valor_drone: '', valor_edicao: '', mensagem: '',
}

export default function FreelancerFormularioPage() {
  const [form, setForm]     = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const set = (k: keyof FormState, v: any) => setForm(p => ({ ...p, [k]: v }))
  const toggleEvento = (t: string) =>
    setForm(p => ({ ...p, tipo_eventos: p.tipo_eventos.includes(t) ? p.tipo_eventos.filter(x => x !== t) : [...p.tipo_eventos, t] }))

  const inp = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/85 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20"
  const lbl = "block text-[10px] text-white/35 tracking-widest uppercase mb-1.5"

  const canSubmit = form.nome.trim() && form.funcao && form.telefone.trim()

  async function handleSubmit() {
    if (!canSubmit) { setError('Preenche pelo menos o nome, função e telefone.'); return }
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
          : { link_trailer: form.link_trailer.trim(), link_trailer2: '', link_video: form.link_video.trim(), link_video2: '' }

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
      tipo_eventos:    form.tipo_eventos,
      servicos_feitos: form.servicos_feitos,
      valor_servico:   form.funcao === 'EDITOR' ? '' : form.valor_servico.trim(),
      valor_drone:     form.valor_drone.trim(),
      valor_edicao:    form.valor_edicao.trim(),
      drone:           form.drone,
      faz_edicao:      form.faz_edicao,
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
          Preenche o formulário de recrutamento. Os campos marcados com <span className="text-gold">*</span> são obrigatórios.
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
          <div>
            <label className={lbl}>Nº de eventos já realizados</label>
            <input type="number" min="0" value={form.servicos_feitos} onChange={e => set('servicos_feitos', e.target.value)} placeholder="ex: 30" className={inp} />
          </div>
        </div>

        {/* ── 3. Tipo de eventos ────────────────────────────────────────────── */}
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
            )}

            {isVideo && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Link trailer</label>
                  <input value={form.link_trailer} onChange={e => set('link_trailer', e.target.value)} placeholder="https://..." className={inp} />
                </div>
                <div>
                  <label className={lbl}>Link vídeo completo</label>
                  <input value={form.link_video} onChange={e => set('link_video', e.target.value)} placeholder="https://..." className={inp} />
                </div>
                <div>
                  <label className={lbl}>Fazes edição de vídeo?</label>
                  <select value={form.faz_edicao} onChange={e => set('faz_edicao', e.target.value)} className={inp + ' cursor-pointer'}>
                    <option value="">—</option>
                    <option value="SIM">Sim</option>
                    <option value="NÃO">Não</option>
                  </select>
                </div>
              </div>
            )}

            {showDrone && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Tens drone?</label>
                  <select value={form.drone} onChange={e => set('drone', e.target.value)} className={inp + ' cursor-pointer'}>
                    <option value="">—</option>
                    <option value="SIM">Sim</option>
                    <option value="NÃO">Não</option>
                  </select>
                </div>
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

        <button onClick={handleSubmit} disabled={saving || !canSubmit}
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
