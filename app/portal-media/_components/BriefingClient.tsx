'use client'
/* ============================================================
   BriefingClient — Briefing fiel ao handoff RL PROD
   Design 1:1 ao briefing.css + Briefing.html do handoff (v5):
   - bg-fx fixed com radial accent breathing
   - Crumb + título "BRIEFING" letter-by-letter + title-rule
   - Head: count de sessões + botões "Resumo" (print) e "+ Sessão" (admin)
   - Next session card (calculado da sessão futura mais próxima)
   - Explainer 4 features
   - Histórico de sessões EXPANSÍVEIS (data lateral, título+tag, descrição,
     chevron, painel detail com Objetivos/Tom/Notas)
   - Empty state
   - Statusbar (Estado da fase) com pulse
   - Footer

   Lógica preservada do legado: addSessao, update, eliminar, notificar,
   handleSave, AdminBar. Tudo "+Sessão"/Notificar/edit/eliminar só
   aparece para isAdmin.
   ============================================================ */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Manrope, Space_Grotesk } from 'next/font/google'
import type { Projeto, BriefingSessao } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import HeroUploadBlock from './HeroUploadBlock'

const manrope = Manrope({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-manrope', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-space-grotesk', display: 'swap' })

const MONTHS = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']
const MONTHS_LONG = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

interface Props { projeto: Projeto; isAdmin: boolean }

export default function BriefingClient({ projeto: initial, isAdmin }: Props) {
  const [sessoes, setSessoes] = useState<BriefingSessao[]>(initial.briefingSessoes ?? [])
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [heroUrl, setHeroUrl] = useState(initial.briefingImageUrl ?? '')
  const [notifying, setNotifying] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  /* Modal de agendamento de nova sessão (admin) */
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [schedDate, setSchedDate]       = useState('')
  const [schedTime, setSchedTime]       = useState('')
  const [schedTitle, setSchedTitle]     = useState('')
  const [schedSaving, setSchedSaving]   = useState(false)

  /* ── Persistência ─────────────────────────────────────────── */
  const saveData = async (updated?: BriefingSessao[]) => {
    await fetch(`/api/media-portal/${initial.ref}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        briefingSessoes: updated ?? sessoes,
        briefingImageUrl: heroUrl,
      }),
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try { await saveData() } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => {
    setSessoes(initial.briefingSessoes ?? [])
    setHeroUrl(initial.briefingImageUrl ?? '')
    setIsEditing(false)
  }

  /* ── Sessões CRUD ────────────────────────────────────────── */
  /** Abre o modal de agendamento de uma nova sessão. Default da
   *  data = hoje; sugere "Sessão de briefing #N" como título. */
  const openSchedule = () => {
    const today = new Date().toISOString().split('T')[0]
    setSchedDate(today)
    setSchedTime('15:00')
    setSchedTitle(`Sessão de briefing #${sessoes.length + 1}`)
    setScheduleOpen(true)
  }

  const closeSchedule = () => {
    if (schedSaving) return
    setScheduleOpen(false)
  }

  /** Cria a sessão com a data + hora escolhidas e persiste imediatamente
   *  no Supabase via PATCH. Não entra em modo edit (o detalhe fica vazio
   *  para ser preenchido depois). */
  const confirmSchedule = async () => {
    if (!schedDate || !schedTitle.trim()) return
    setSchedSaving(true)
    const nova: BriefingSessao = {
      id: Date.now().toString(),
      titulo: schedTitle.trim(),
      data: schedDate,
      hora: schedTime || undefined,
      resumo: '',
      objetivos: [],
      tom: [],
      notas: '',
    }
    const updated = [nova, ...sessoes]
    setSessoes(updated)
    try { await saveData(updated) } catch {}
    setSchedSaving(false)
    setScheduleOpen(false)
  }

  const update = (id: string, field: keyof BriefingSessao, value: any) =>
    setSessoes(s => s.map(ses => ses.id === id ? { ...ses, [field]: value } : ses))

  const eliminar = async (id: string) => {
    const updated = sessoes.filter(s => s.id !== id)
    setSessoes(updated)
    setConfirmDelete(null)
    try { await saveData(updated) } catch {}
  }

  const notificar = async (id: string) => {
    const sessao = sessoes.find(s => s.id === id)
    if (!sessao) return
    const emailCliente = initial.fichaCliente?.email
    if (!emailCliente) {
      alert('Sem email do cliente definido. Adiciona o email na secção Contrato & CPS.')
      return
    }
    setNotifying(id)
    try {
      await fetch('/api/media-portal/notify-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailCliente,
          ref: initial.ref,
          nomeProjeto: initial.nome,
          cliente: initial.cliente,
          sessaoTitulo: sessao.titulo,
          sessaoData: sessao.data,
        }),
      })
      const agora = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
      const updated = sessoes.map(s => s.id === id ? { ...s, notificacaoEnviada: agora } : s)
      setSessoes(updated)
      await saveData(updated)
    } catch {}
    setNotifying(null)
  }

  /* ── Próxima sessão agendada ───────────────────────────── */
  const proximaSessao = useMemo(() => {
    const agora = new Date()
    const futuras = sessoes
      .filter(s => s.data)
      .map(s => {
        const [Y, M, D] = s.data.split('-').map(Number)
        const [hh, mm] = (s.hora ?? '00:00').split(':').map(Number)
        const _dt = new Date(Y, (M ?? 1) - 1, D ?? 1, hh ?? 0, mm ?? 0)
        return { ...s, _dt }
      })
      .filter(s => s._dt.getTime() >= agora.getTime())
      .sort((a, b) => a._dt.getTime() - b._dt.getTime())
    return futuras[0] ?? null
  }, [sessoes])

  /* ── Estado da fase (statusbar) ────────────────────────── */
  const estadoFase = useMemo(() => {
    const f = (initial.fases ?? []).find(x => /briefing/i.test(x.nome))
    if (!f) return { label: 'Aguardar', color: 'wait' as const }
    if (f.estado === 'concluido') return { label: 'Concluído', color: 'done' as const }
    if (f.estado === 'em_curso')  return { label: 'Em curso',  color: 'doing' as const }
    return { label: 'Aguardar', color: 'wait' as const }
  }, [initial.fases])

  /* ── Letra-a-letra do título "BRIEFING" ──────────────── */
  const titleLetters = 'BRIEFING'.split('')

  /* ── Print "Resumo" ─────────────────────────────────── */
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      // expandir todas as sessões para o print mostrar tudo
      setOpenId('__ALL__')
      setTimeout(() => window.print(), 100)
    }
  }

  /* ── Helpers UI ──────────────────────────────────────── */
  const fmtDayMonth = (iso: string) => {
    if (!iso) return { day: '--', mon: '' }
    const d = new Date(iso + 'T00:00:00')
    return {
      day: String(d.getDate()).padStart(2, '0'),
      mon: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    }
  }
  const fmtFullDate = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso + 'T00:00:00')
    return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
  }

  /* Mostrar sessões: mais recentes primeiro */
  const sortedSessoes = useMemo(
    () => [...sessoes].sort((a, b) => (b.data || '').localeCompare(a.data || '')),
    [sessoes]
  )

  return (
    <div className={`rl-briefing ${manrope.variable} ${spaceGrotesk.variable}`}>
      <div className="rl-bg-fx" aria-hidden />
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />

      <div className="rl-page">

        {/* Crumb */}
        <p className="rl-crumb">
          <Link href={`/portal-media/${initial.ref}`}>› Portal · {initial.nome}</Link>
        </p>

        {/* Header */}
        <header className="rl-head">
          <div className="rl-head-l">
            <p className="rl-eyebrow">RL PROD · {initial.nome}</p>
            <h1 className="rl-title" aria-label="Briefing">
              {titleLetters.map((ch, i) => (
                <span key={i} style={{ animationDelay: `${(0.2 + i * 0.06).toFixed(2)}s` }}>{ch}</span>
              ))}
            </h1>
            <div className="rl-title-rule" />
          </div>
          <div className="rl-head-actions">
            <div className="rl-head-count">
              <b>{sessoes.length}</b>
              <span>Sessões</span>
            </div>
            <button onClick={handlePrint} className="rl-btn-ghost" title="Imprimir / PDF">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/>
              </svg>
              Resumo
            </button>
            {isAdmin && (
              <button onClick={openSchedule} className="rl-btn-add">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Agendar Sessão
              </button>
            )}
          </div>
        </header>

        {/* Próxima sessão agendada */}
        {proximaSessao && (
          <div className="rl-next">
            <div className="rl-next-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="5" width="16" height="16" rx="2.5"/>
                <path d="M4 9h16M8 3v4M16 3v4"/>
                <circle cx="12" cy="14" r="1.6" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            <div className="rl-next-txt">
              <p className="rl-next-k">Próxima sessão agendada</p>
              <p className="rl-next-v">
                {fmtFullDate(proximaSessao.data)}
                {proximaSessao.hora && (
                  <> · {proximaSessao.hora.replace(':', 'h')}</>
                )}
                <small>{proximaSessao.titulo}</small>
              </p>
            </div>
          </div>
        )}

        {/* Explainer */}
        <section className="rl-card rl-explain">
          <h2 className="rl-explain-h">O que é o Briefing?</h2>
          <p className="rl-explain-lead">
            O briefing é a base de tudo o que fazemos juntos. É o momento em que nos sentamos contigo, presencialmente ou à distância, para perceber exatamente o que precisas, o que sentes e o que esperas do projeto.
          </p>
          {[
            { n: '01', t: 'Primeira sessão',  d: 'Recolhemos os objetivos, o tom, as referências visuais e tudo o que define a tua visão para o projeto.' },
            { n: '02', t: 'Sessões seguintes', d: 'À medida que o projeto avança, podemos fazer sessões adicionais para afinar detalhes, validar decisões ou ajustar o rumo.' },
            { n: '03', t: 'Resumo registado',  d: 'Cada sessão fica registada aqui com data e resumo. Tens sempre acesso ao histórico completo do que foi discutido.' },
            { n: '04', t: 'Notificação',       d: 'Sempre que adicionarmos um novo registo de briefing, recebes uma notificação por email para ficares a par.' },
          ].map(({ n, t, d }) => (
            <div key={n} className="rl-feat">
              <span className="rl-feat-n">{n}</span>
              <div>
                <p className="rl-feat-t">{t}</p>
                <p className="rl-feat-d">{d}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Histórico de sessões */}
        <div className="rl-section-h">
          <h2>Histórico de sessões</h2>
          {sessoes.length > 0 && <span>Clica numa sessão para ver os detalhes</span>}
        </div>

        {sortedSessoes.length === 0 ? (
          <div className="rl-empty">
            <div className="rl-empty-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="3" width="14" height="18" rx="2.5"/>
                <path d="M9 8h6M9 12h6M9 16h3"/>
              </svg>
            </div>
            <p className="rl-empty-h">Sem briefings registados</p>
            {isAdmin && (
              <p className="rl-empty-p">Clica em <b>&ldquo;+ Sessão&rdquo;</b> para adicionar o primeiro briefing</p>
            )}
          </div>
        ) : (
          <div className="rl-sessions">
            {sortedSessoes.map((sessao) => {
              const isOpen = openId === sessao.id || openId === '__ALL__'
              const { day, mon } = fmtDayMonth(sessao.data)
              const objetivos = sessao.objetivos ?? []
              const tom = sessao.tom ?? []
              const notas = sessao.notas ?? ''

              return (
                <div
                  key={sessao.id}
                  className={`rl-sess${isOpen ? ' rl-sess--open' : ''}${isEditing ? ' rl-sess--edit' : ''}`}
                  onClick={() => !isEditing && setOpenId(p => p === sessao.id ? null : sessao.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="rl-sess-date">
                    <div className="rl-sess-day">{day}</div>
                    <div className="rl-sess-mon">{mon}</div>
                    {sessao.hora && (
                      <div className="rl-sess-hora">{sessao.hora.replace(':', 'h')}</div>
                    )}
                  </div>
                  <div className="rl-sess-body">
                    <div className="rl-sess-top">
                      {isEditing ? (
                        <input
                          value={sessao.titulo}
                          onChange={e => update(sessao.id, 'titulo', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="rl-sess-title rl-input"
                          placeholder="Título da sessão"
                        />
                      ) : (
                        <p className="rl-sess-title">{sessao.titulo}</p>
                      )}
                      <span className="rl-sess-tag">Registado</span>
                    </div>
                    {isEditing ? (
                      <textarea
                        value={sessao.resumo}
                        onChange={e => update(sessao.id, 'resumo', e.target.value)}
                        onClick={e => e.stopPropagation()}
                        rows={2}
                        className="rl-sess-desc rl-input"
                        placeholder="Descrição curta da reunião…"
                      />
                    ) : (
                      <p className="rl-sess-desc">{sessao.resumo || 'Sem descrição registada.'}</p>
                    )}

                    {/* Detail expansível */}
                    <div className="rl-sess-detail">
                      <div className="rl-sess-detail-in">
                        <div className="rl-detail-grid">
                          <div className="rl-dfield">
                            <p className="rl-dfield-k">Objetivos</p>
                            {isEditing ? (
                              <textarea
                                value={(objetivos).join('\n')}
                                onChange={e => update(sessao.id, 'objetivos', e.target.value.split('\n').filter(Boolean))}
                                onClick={e => e.stopPropagation()}
                                rows={3}
                                className="rl-input"
                                placeholder="Um objetivo por linha"
                              />
                            ) : objetivos.length > 0 ? (
                              <ul>{objetivos.map((o, i) => <li key={i}>{o}</li>)}</ul>
                            ) : (
                              <p style={{ color: 'var(--faint)', fontStyle: 'italic' }}>Sem objetivos registados</p>
                            )}
                          </div>
                          <div className="rl-dfield">
                            <p className="rl-dfield-k">Tom</p>
                            {isEditing ? (
                              <input
                                value={(tom).join(', ')}
                                onChange={e => update(sessao.id, 'tom', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                                onClick={e => e.stopPropagation()}
                                className="rl-input"
                                placeholder="Cinematográfico, Próximo, Autêntico"
                              />
                            ) : tom.length > 0 ? (
                              <div className="rl-dchips">
                                {tom.map((t, i) => <span key={i} className="rl-dchip">{t}</span>)}
                              </div>
                            ) : (
                              <p style={{ color: 'var(--faint)', fontStyle: 'italic' }}>Sem tom definido</p>
                            )}
                          </div>
                          <div className="rl-dfield rl-dfield--full">
                            <p className="rl-dfield-k">Notas</p>
                            {isEditing ? (
                              <textarea
                                value={notas}
                                onChange={e => update(sessao.id, 'notas', e.target.value)}
                                onClick={e => e.stopPropagation()}
                                rows={3}
                                className="rl-input"
                                placeholder="Notas finais da sessão…"
                              />
                            ) : notas ? (
                              <p>{notas}</p>
                            ) : (
                              <p style={{ color: 'var(--faint)', fontStyle: 'italic' }}>Sem notas registadas</p>
                            )}
                          </div>
                        </div>

                        {/* Linha admin: notificar + eliminar */}
                        {isAdmin && (
                          <div className="rl-sess-admin">
                            <button
                              onClick={e => { e.stopPropagation(); !sessao.notificacaoEnviada && notificar(sessao.id) }}
                              disabled={!!sessao.notificacaoEnviada || notifying === sessao.id}
                              className={`rl-btn-ghost ${sessao.notificacaoEnviada ? 'rl-btn-ghost--done' : ''}`}
                            >
                              {notifying === sessao.id
                                ? '⏳ A enviar…'
                                : sessao.notificacaoEnviada
                                  ? `✓ Notificado ${sessao.notificacaoEnviada}`
                                  : 'Notificar Cliente'}
                            </button>
                            {confirmDelete === sessao.id ? (
                              <span className="rl-confirm">
                                <span>Tens a certeza?</span>
                                <button onClick={e => { e.stopPropagation(); eliminar(sessao.id) }} className="rl-btn-danger">Eliminar</button>
                                <button onClick={e => { e.stopPropagation(); setConfirmDelete(null) }} className="rl-btn-text">Cancelar</button>
                              </span>
                            ) : (
                              <button onClick={e => { e.stopPropagation(); setConfirmDelete(sessao.id) }} className="rl-btn-text rl-btn-text--danger">
                                Eliminar Sessão
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="rl-sess-chev">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Status bar — estado da fase de Briefing */}
        <div className={`rl-statusbar rl-statusbar--${estadoFase.color}`}>
          <span className="rl-statusbar-dot" />
          <div className="rl-statusbar-txt">
            <p className="rl-statusbar-k">Estado da fase</p>
            <p className="rl-statusbar-v">{estadoFase.label}</p>
          </div>
          {isAdmin && (
            <button className="rl-statusbar-edit" aria-label="Editar estado" onClick={() => setIsEditing(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 5l5 5M4 20l1-4L16 5l3 3L8 19l-4 1Z"/>
              </svg>
            </button>
          )}
        </div>

        {/* Footer */}
        <footer className="rl-foot">
          <p className="rl-foot-tag">More than a product, <b>an experience.</b></p>
          <p className="rl-foot-sub">RL PROD · Photography &amp; Video</p>
        </footer>
      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={handleSave} onCancel={cancel} />
      )}

      {/* ── Modal: Agendar Nova Sessão ─────────────────────── */}
      {scheduleOpen && (
        <div className="rl-modal-backdrop" onClick={closeSchedule}>
          <div className="rl-modal" onClick={e => e.stopPropagation()}>
            <button
              className="rl-modal-close"
              onClick={closeSchedule}
              aria-label="Fechar"
              type="button"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <p className="rl-modal-eyebrow">Nova sessão</p>
            <h3 className="rl-modal-title">Agendar <em>sessão de briefing</em></h3>
            <p className="rl-modal-sub">Escolhe o dia, a hora e o título da próxima sessão. Fica imediatamente registada no histórico.</p>

            <div className="rl-modal-grid">
              <label className="rl-field">
                <span>Data</span>
                <input
                  type="date"
                  value={schedDate}
                  onChange={e => setSchedDate(e.target.value)}
                  className="rl-input"
                  required
                />
              </label>
              <label className="rl-field">
                <span>Hora</span>
                <input
                  type="time"
                  value={schedTime}
                  onChange={e => setSchedTime(e.target.value)}
                  className="rl-input"
                  step={900}
                />
              </label>
              <label className="rl-field rl-field--full">
                <span>Título</span>
                <input
                  type="text"
                  value={schedTitle}
                  onChange={e => setSchedTitle(e.target.value)}
                  className="rl-input"
                  placeholder="Ex.: Sessão de afinação"
                  maxLength={80}
                />
              </label>
            </div>

            <div className="rl-modal-actions">
              <button
                type="button"
                className="rl-btn-text"
                onClick={closeSchedule}
                disabled={schedSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rl-btn-add"
                onClick={confirmSchedule}
                disabled={schedSaving || !schedDate || !schedTitle.trim()}
              >
                {schedSaving ? 'A agendar…' : 'Agendar Sessão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tokens + animations 1:1 ao briefing.css do handoff ── */}
      <style jsx>{`
        .rl-briefing {
          --navy-950: #0e1b27;
          --navy-900: #122230;
          --navy-850: #16293a;
          --navy-800: #1f3647;
          --navy-700: #274458;
          --accent: oklch(0.66 0.13 245);
          --accent-bright: oklch(0.80 0.11 245);
          --done:  oklch(0.72 0.12 165);
          --doing: oklch(0.80 0.12 245);
          --wait:  oklch(0.80 0.13 80);
          --ink:   #eaf1f7;
          --soft:  oklch(0.86 0.025 245);
          --muted: oklch(0.70 0.03 245);
          --faint: oklch(0.56 0.03 245);
          --line:  oklch(0.42 0.03 245 / 0.40);
          --line-soft: oklch(0.50 0.03 245 / 0.18);
          --rl-card-bg: oklch(0.30 0.035 245 / 0.34);
          --rl-r: 16px;
          --rl-r-sm: 12px;
          font-family: var(--font-manrope), Manrope, system-ui, sans-serif;
          color: var(--ink);
          position: relative;
        }
        .rl-bg-fx {
          position: fixed; inset: 0; z-index: -1; pointer-events: none;
          background:
            radial-gradient(120% 70% at 85% -8%, var(--navy-700) 0%, transparent 42%),
            radial-gradient(100% 60% at 0% 0%, var(--navy-800) 0%, transparent 38%),
            linear-gradient(180deg, var(--navy-900), var(--navy-950) 55%);
        }
        .rl-bg-fx::after {
          content: ""; position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 4px 4px; opacity: .5; mix-blend-mode: overlay;
        }
        .rl-bg-fx::before {
          content: ""; position: absolute; left: 50%; top: -10%;
          width: 55vw; height: 55vw; transform: translateX(-50%);
          background: radial-gradient(circle, var(--accent) 0%, transparent 60%);
          opacity: .09; filter: blur(40px);
          animation: rlBreathe 8s ease-in-out infinite;
        }
        @keyframes rlBreathe {
          0%, 100% { opacity: .06; transform: translateX(-50%) scale(1); }
          50%      { opacity: .12; transform: translateX(-50%) scale(1.1); }
        }

        .rl-page {
          max-width: 780px; margin: 0 auto;
          padding: 46px 22px 64px;
          position: relative; z-index: 1;
        }

        .rl-crumb {
          font-size: 11px; letter-spacing: .22em; text-transform: uppercase;
          color: var(--faint); font-weight: 600;
          margin: 0 0 22px;
          opacity: 0; animation: rlFadeUp .6s .05s forwards;
        }
        .rl-briefing :global(.rl-crumb a) {
          color: inherit; text-decoration: none; transition: color .25s;
        }
        .rl-briefing :global(.rl-crumb a:hover) { color: var(--soft); }
        @keyframes rlFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: none; }
        }

        .rl-head {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 20px; flex-wrap: wrap;
        }
        .rl-eyebrow {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          text-transform: uppercase; letter-spacing: .26em;
          font-size: 10.5px; font-weight: 500;
          color: var(--muted);
          margin: 0 0 12px;
          opacity: 0; animation: rlFadeUp .6s .12s forwards;
        }
        .rl-title {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: clamp(32px, 7vw, 52px);
          letter-spacing: .16em; text-transform: uppercase;
          margin: 0; color: #fff;
          display: flex; flex-wrap: wrap; line-height: 1;
        }
        .rl-briefing :global(.rl-title span) {
          display: inline-block;
          opacity: 0; transform: translateY(24px); filter: blur(10px);
          animation: rlFocusIn .6s forwards;
        }
        @keyframes rlFocusIn { to { opacity: 1; transform: none; filter: blur(0); } }
        .rl-title-rule {
          height: 3px; width: 96px; border-radius: 3px;
          margin-top: 16px;
          background: linear-gradient(90deg, var(--accent-bright), transparent);
          transform-origin: left; transform: scaleX(0);
          animation: rlRuleIn .7s .5s cubic-bezier(.3,.05,.2,1) forwards;
        }
        @keyframes rlRuleIn { to { transform: scaleX(1); } }

        .rl-head-actions {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          opacity: 0; animation: rlFadeUp .6s .4s forwards;
        }
        .rl-head-count {
          display: flex; flex-direction: column; gap: 3px;
          padding: 9px 16px;
          border: 1px solid var(--line-soft);
          border-radius: 11px;
          background: oklch(0.30 0.035 245 / .3);
        }
        .rl-head-count b {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 20px; font-weight: 600; color: #fff; line-height: 1;
        }
        .rl-head-count span {
          font-size: 9px; letter-spacing: .18em; text-transform: uppercase;
          color: var(--faint); font-weight: 600;
        }

        .rl-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-manrope), Manrope, sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: .12em; text-transform: uppercase;
          color: var(--muted);
          background: oklch(0.30 0.04 245 / .4);
          border: 1px solid var(--line-soft);
          border-radius: 10px;
          padding: 9px 15px;
          cursor: pointer; transition: all .16s;
        }
        .rl-btn-ghost:hover:not(:disabled) {
          color: #fff; border-color: var(--accent);
        }
        .rl-btn-ghost:disabled { opacity: .55; cursor: default; }
        .rl-btn-ghost.rl-btn-ghost--done {
          color: var(--done);
          border-color: color-mix(in oklch, var(--done) 30%, transparent);
        }
        .rl-btn-ghost :global(svg) { width: 14px; height: 14px; }

        .rl-btn-add {
          display: inline-flex; align-items: center; gap: 9px;
          font-family: var(--font-manrope), Manrope, sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: .14em; text-transform: uppercase;
          color: var(--soft);
          background: oklch(0.30 0.04 245 / .5);
          border: 1px solid var(--line);
          border-radius: 11px;
          padding: 13px 20px;
          cursor: pointer; transition: all .16s;
        }
        .rl-btn-add:hover {
          color: #fff; border-color: var(--accent);
          background: oklch(0.36 0.05 245 / .6);
          box-shadow: 0 0 22px -8px var(--accent);
        }
        .rl-btn-add :global(svg) { width: 15px; height: 15px; }

        .rl-next {
          margin-top: 24px;
          display: flex; align-items: center; gap: 18px;
          padding: 18px 22px;
          border-radius: var(--rl-r);
          border: 1px solid oklch(0.66 0.13 245 / .35);
          background:
            linear-gradient(120deg, oklch(0.34 0.06 245 / .5), oklch(0.26 0.04 245 / .4));
          position: relative; overflow: hidden;
          opacity: 0; animation: rlFadeUp .7s .25s forwards;
        }
        .rl-next::after {
          content: ""; position: absolute; right: -30px; top: -30px;
          width: 120px; height: 120px; border-radius: 50%;
          background: radial-gradient(circle, var(--accent), transparent 70%);
          opacity: .18;
        }
        .rl-next-ic {
          flex: none; width: 46px; height: 46px;
          border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-bright);
          background: oklch(0.66 0.13 245 / .14);
          border: 1px solid oklch(0.66 0.13 245 / .3);
        }
        .rl-next-ic :global(svg) { width: 23px; height: 23px; }
        .rl-next-txt { flex: 1; min-width: 0; position: relative; z-index: 1; }
        .rl-next-k {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 9.5px; font-weight: 600;
          letter-spacing: .2em; text-transform: uppercase;
          color: var(--accent-bright); margin: 0 0 4px;
        }
        .rl-next-v {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 17px; font-weight: 600; letter-spacing: .02em;
          color: #fff; margin: 0;
        }
        .rl-next-v small {
          display: block;
          font-family: var(--font-manrope), Manrope, sans-serif;
          font-size: 12.5px; font-weight: 400; letter-spacing: 0;
          color: var(--muted); margin-top: 3px;
        }

        .rl-card {
          background: var(--rl-card-bg);
          border: 1px solid var(--line-soft);
          border-radius: var(--rl-r);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .rl-explain {
          margin-top: 30px;
          padding: 28px 30px;
          opacity: 0; animation: rlFadeUp .7s .3s forwards;
        }
        .rl-explain-h {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: .2em; text-transform: uppercase;
          color: var(--accent-bright); margin: 0 0 14px;
        }
        .rl-explain-lead {
          font-size: 15.5px; line-height: 1.65;
          color: var(--soft);
          margin: 0 0 24px; max-width: 62ch;
        }
        .rl-feat {
          display: flex; gap: 15px;
          padding: 16px 0;
          border-top: 1px solid var(--line-soft);
        }
        .rl-feat:first-of-type { border-top: 0; padding-top: 0; }
        .rl-feat-n {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 11px; font-weight: 600;
          color: var(--faint);
          padding-top: 3px; flex: none;
          letter-spacing: .1em;
        }
        .rl-feat-t {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 14px; font-weight: 600;
          letter-spacing: .04em; text-transform: uppercase;
          color: var(--ink);
          margin: 0 0 6px;
        }
        .rl-feat-d {
          font-size: 13.5px; line-height: 1.55;
          color: var(--muted);
          margin: 0; max-width: 60ch;
        }

        .rl-section-h {
          display: flex; align-items: baseline; justify-content: space-between;
          gap: 14px; margin: 36px 0 16px;
        }
        .rl-section-h h2 {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 12px; font-weight: 600;
          letter-spacing: .2em; text-transform: uppercase;
          color: var(--accent-bright); margin: 0;
        }
        .rl-section-h span {
          font-size: 11.5px; color: var(--faint); letter-spacing: .02em;
        }

        .rl-sessions {
          margin-top: 0;
          display: flex; flex-direction: column; gap: 13px;
        }

        .rl-sess {
          display: flex; gap: 16px;
          padding: 18px 20px;
          border-radius: var(--rl-r-sm);
          border: 1px solid var(--line-soft);
          background:
            linear-gradient(180deg, oklch(0.30 0.04 245 / .42), oklch(0.22 0.03 245 / .42));
          position: relative; overflow: hidden;
          cursor: pointer;
          animation: rlSessIn .5s cubic-bezier(.2,.7,.2,1);
          transition: border-color .2s, background .2s;
        }
        .rl-sess:not(.rl-sess--edit):hover {
          border-color: oklch(0.55 0.05 245 / 0.55);
        }
        .rl-sess--edit { cursor: default; }
        @keyframes rlSessIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }
        .rl-sess::before {
          content: ""; position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px; background: var(--accent);
        }
        .rl-sess-date {
          flex: none; text-align: center; min-width: 54px;
        }
        .rl-sess-day {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 22px; font-weight: 600;
          color: #fff; line-height: 1;
        }
        .rl-sess-mon {
          font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
          color: var(--faint); font-weight: 600;
          margin-top: 3px;
        }
        .rl-sess-body { flex: 1; min-width: 0; }
        .rl-sess-top {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 6px;
        }
        .rl-sess-title {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 14px; font-weight: 600;
          letter-spacing: .03em;
          color: #fff; margin: 0; flex: 1;
        }
        .rl-sess-tag {
          font-size: 9.5px; font-weight: 700;
          letter-spacing: .1em; text-transform: uppercase;
          color: var(--done);
          background: color-mix(in oklch, var(--done) 14%, transparent);
          border: 1px solid color-mix(in oklch, var(--done) 32%, transparent);
          border-radius: 999px;
          padding: 3px 9px;
          flex: none;
        }
        .rl-sess-desc {
          font-size: 13px; line-height: 1.55;
          color: var(--muted); margin: 0;
        }
        .rl-sess-chev {
          flex: none; color: var(--faint);
          transition: transform .25s;
          align-self: center;
        }
        .rl-sess-chev :global(svg) { width: 18px; height: 18px; display: block; }
        .rl-sess--open .rl-sess-chev { transform: rotate(180deg); }
        .rl-sess-detail {
          display: grid; grid-template-rows: 0fr;
          transition: grid-template-rows .3s ease;
          margin-top: 0;
        }
        .rl-sess--open .rl-sess-detail {
          grid-template-rows: 1fr;
          margin-top: 14px;
        }
        .rl-sess-detail-in { overflow: hidden; min-height: 0; }

        .rl-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 22px;
          padding-top: 14px;
          border-top: 1px solid var(--line-soft);
        }
        .rl-dfield--full { grid-column: 1 / -1; }
        .rl-dfield-k {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 9.5px; font-weight: 600;
          letter-spacing: .16em; text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 6px;
        }
        .rl-briefing :global(.rl-dfield ul) {
          margin: 0; padding-left: 16px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .rl-briefing :global(.rl-dfield li),
        .rl-briefing :global(.rl-dfield p) {
          font-size: 13px; line-height: 1.55;
          color: var(--soft); margin: 0;
        }
        .rl-dchips {
          display: flex; flex-wrap: wrap; gap: 7px;
        }
        .rl-dchip {
          font-size: 11px; font-weight: 600;
          color: var(--soft);
          padding: 5px 11px;
          border-radius: 999px;
          border: 1px solid var(--line-soft);
          background: oklch(0.30 0.04 245 / .4);
        }

        .rl-sess-admin {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid var(--line-soft);
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        }
        .rl-confirm {
          display: inline-flex; align-items: center; gap: 10px;
          font-size: 12.5px; color: var(--muted);
        }
        .rl-btn-danger {
          font-family: var(--font-manrope), Manrope, sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: .18em; text-transform: uppercase;
          padding: 7px 14px;
          border-radius: 8px;
          border: 1px solid oklch(0.65 0.18 25 / .5);
          background: oklch(0.65 0.18 25 / .08);
          color: oklch(0.74 0.16 25);
          cursor: pointer;
          transition: all .16s;
        }
        .rl-btn-danger:hover {
          border-color: oklch(0.74 0.16 25);
          background: oklch(0.65 0.18 25 / .14);
        }
        .rl-btn-text {
          background: transparent; border: 0;
          font-family: var(--font-manrope), Manrope, sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: .2em; text-transform: uppercase;
          color: var(--faint);
          padding: 6px 10px;
          cursor: pointer; transition: color .16s;
        }
        .rl-btn-text:hover { color: var(--soft); }
        .rl-btn-text--danger:hover { color: oklch(0.74 0.16 25); }

        .rl-input {
          background: oklch(0.22 0.03 245 / 0.45);
          border: 1px solid var(--line-soft);
          border-radius: 8px;
          padding: 9px 12px;
          font-family: var(--font-manrope), Manrope, sans-serif;
          font-size: 13.5px;
          color: var(--ink);
          width: 100%;
          outline: none;
          transition: border-color .15s;
          resize: vertical;
        }
        .rl-input:focus { border-color: var(--accent-bright); }
        .rl-sess-title.rl-input {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-weight: 600; letter-spacing: .03em;
        }
        .rl-sess-desc.rl-input {
          font-size: 13px; line-height: 1.55;
        }

        .rl-empty {
          margin-top: 26px;
          border: 1.5px dashed var(--line);
          border-radius: var(--rl-r);
          padding: 52px 24px;
          text-align: center;
          background: oklch(0.26 0.03 245 / .2);
          opacity: 0; animation: rlFadeUp .7s .55s forwards;
        }
        .rl-empty-ic {
          width: 50px; height: 50px; margin: 0 auto 16px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          color: var(--faint);
          background: oklch(0.32 0.04 245 / .5);
          border: 1px solid var(--line-soft);
        }
        .rl-empty-ic :global(svg) { width: 24px; height: 24px; }
        .rl-empty-h {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 12px; font-weight: 600;
          letter-spacing: .2em; text-transform: uppercase;
          color: var(--muted); margin: 0 0 8px;
        }
        .rl-empty-p {
          font-size: 13.5px; color: var(--faint); margin: 0;
        }
        .rl-empty-p b { color: var(--soft); font-weight: 600; }

        .rl-statusbar {
          margin-top: 30px;
          display: flex; align-items: center; gap: 14px;
          padding: 20px 24px;
          border-radius: var(--rl-r);
          border: 1px solid var(--line-soft);
          background: oklch(0.28 0.035 245 / .4);
          opacity: 0; animation: rlFadeUp .7s .65s forwards;
        }
        .rl-statusbar-dot {
          width: 10px; height: 10px; border-radius: 50%;
          flex: none;
          animation: rlPulse 2s infinite;
        }
        .rl-statusbar--wait .rl-statusbar-dot {
          background: var(--wait);
          box-shadow: 0 0 0 0 var(--wait);
        }
        .rl-statusbar--done .rl-statusbar-dot { background: var(--done); }
        .rl-statusbar--doing .rl-statusbar-dot { background: var(--doing); }
        @keyframes rlPulse {
          0%   { box-shadow: 0 0 0 0 oklch(0.80 0.13 80 / .5); }
          70%  { box-shadow: 0 0 0 8px oklch(0.80 0.13 80 / 0); }
          100% { box-shadow: 0 0 0 0 oklch(0.80 0.13 80 / 0); }
        }
        .rl-statusbar-txt { flex: 1; min-width: 0; }
        .rl-statusbar-k {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 9.5px; font-weight: 600;
          letter-spacing: .2em; text-transform: uppercase;
          color: var(--faint); margin: 0 0 3px;
        }
        .rl-statusbar-v {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 16px; font-weight: 600;
          letter-spacing: .16em; text-transform: uppercase;
          margin: 0;
        }
        .rl-statusbar--wait  .rl-statusbar-v { color: var(--wait); }
        .rl-statusbar--done  .rl-statusbar-v { color: var(--done); }
        .rl-statusbar--doing .rl-statusbar-v { color: var(--doing); }
        .rl-statusbar-edit {
          flex: none; width: 40px; height: 40px;
          border-radius: 11px;
          border: 1px solid var(--line-soft);
          background: oklch(0.30 0.04 245 / .4);
          color: var(--muted);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .16s;
        }
        .rl-statusbar-edit:hover {
          color: #fff; border-color: var(--accent);
        }
        .rl-statusbar-edit :global(svg) { width: 16px; height: 16px; }

        .rl-foot {
          margin-top: 42px; text-align: center;
        }
        .rl-foot-tag {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: clamp(15px, 3vw, 19px);
          letter-spacing: .06em;
          color: var(--muted); font-weight: 400;
          margin: 0;
        }
        .rl-foot-tag b { color: #fff; font-weight: 600; }
        .rl-foot-sub {
          margin-top: 9px;
          font-size: 10px; letter-spacing: .24em; text-transform: uppercase;
          color: var(--faint); font-weight: 600;
        }

        /* Hora lateral na data da sessão (debaixo do mês) */
        .rl-sess-hora {
          margin-top: 6px;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: .12em;
          color: var(--accent-bright);
          background: oklch(0.66 0.13 245 / .12);
          border: 1px solid oklch(0.66 0.13 245 / .25);
          border-radius: 999px;
          padding: 2px 7px;
          display: inline-block;
          line-height: 1.2;
        }

        /* ── Modal: Agendar Sessão ─────────────────────────── */
        .rl-modal-backdrop {
          position: fixed; inset: 0; z-index: 1000;
          background: oklch(0.10 0.02 245 / 0.72);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: rlBackdropIn .2s ease forwards;
        }
        @keyframes rlBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .rl-modal {
          position: relative;
          background:
            linear-gradient(180deg, oklch(0.32 0.04 245 / 0.94), oklch(0.20 0.03 245 / 0.96));
          border: 1px solid var(--line);
          border-radius: var(--rl-r);
          padding: 32px 32px 26px;
          max-width: 480px; width: 100%;
          box-shadow:
            0 30px 80px -20px rgba(0,0,0,.6),
            0 0 0 1px oklch(0.66 0.13 245 / 0.10) inset;
          animation: rlModalIn .35s cubic-bezier(.2,.85,.25,1) forwards;
          opacity: 0;
        }
        @keyframes rlModalIn {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }
        .rl-modal-close {
          position: absolute; top: 14px; right: 14px;
          width: 30px; height: 30px;
          border-radius: 8px;
          border: 1px solid var(--line-soft);
          background: oklch(0.30 0.04 245 / 0.5);
          color: var(--muted);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .15s;
        }
        .rl-modal-close:hover {
          color: #fff; border-color: var(--accent);
        }
        .rl-modal-eyebrow {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 10px; font-weight: 600;
          letter-spacing: .28em; text-transform: uppercase;
          color: var(--accent-bright);
          margin: 0 0 10px;
        }
        .rl-modal-title {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 22px; font-weight: 600;
          color: #fff;
          margin: 0 0 8px;
          line-height: 1.18;
        }
        .rl-modal-title em {
          font-style: italic;
          color: var(--accent-bright);
          font-weight: 500;
        }
        .rl-modal-sub {
          font-size: 13px; line-height: 1.6;
          color: var(--muted);
          margin: 0 0 22px;
        }
        .rl-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 16px;
          margin-bottom: 22px;
        }
        .rl-field {
          display: flex; flex-direction: column; gap: 6px;
        }
        .rl-field--full { grid-column: 1 / -1; }
        .rl-field > span {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 9.5px; font-weight: 600;
          letter-spacing: .2em; text-transform: uppercase;
          color: var(--faint);
        }
        .rl-modal :global(input.rl-input) {
          background: oklch(0.20 0.03 245 / 0.6);
          border-color: var(--line);
        }
        .rl-modal :global(input[type="date"].rl-input),
        .rl-modal :global(input[type="time"].rl-input) {
          color-scheme: dark;
        }
        .rl-modal-actions {
          display: flex; align-items: center; justify-content: flex-end;
          gap: 10px;
        }
        .rl-modal-actions :global(.rl-btn-add:disabled) {
          opacity: .5; cursor: not-allowed;
          box-shadow: none;
        }

        @media (max-width: 560px) {
          .rl-head { align-items: flex-start; }
          .rl-btn-add { width: 100%; justify-content: center; }
          .rl-detail-grid { grid-template-columns: 1fr; }
          .rl-modal { padding: 26px 22px 22px; }
          .rl-modal-grid { grid-template-columns: 1fr; }
        }
        @media print {
          .rl-bg-fx,
          .rl-btn-add,
          .rl-head-actions,
          .rl-statusbar-edit,
          .rl-sess-chev,
          .rl-sess-admin { display: none !important; }
          .rl-briefing { background: #fff; color: #111; }
        }
        @media (prefers-reduced-motion: reduce) {
          .rl-briefing,
          .rl-briefing :global(*) {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
            animation-delay: 0s !important;
          }
        }
      `}</style>
    </div>
  )
}
