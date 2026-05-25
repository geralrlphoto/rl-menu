'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { loadFreelancerProfile, saveFreelancerProfile, type FreelancerProfile, DEFAULT_FREELANCER_PROFILE } from '../_data/freelancer-profile'
import { PROJECTS as MOCK_PROJECTS, TASKS as MOCK_TASKS } from '../_data/projects'
import { NotificationBell } from '../_components/NotificationBell'
import { MessagesBell } from '../_components/MessagesBell'
import { BrandLogo } from '../_components/BrandLogo'

// ────────────────────────────────────────────────────────────────────────
//  DADOS PESSOAIS — Wedding Moments Films
//  Freelancer profile center
// ────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',           icon: '⌂', href: '/painel-fotografo' },
  { key: 'novos',       label: 'Novos Eventos',       icon: '+', href: '/painel-fotografo/novos-projetos' },
  { key: 'pagamentos',  label: 'Pagamentos',          icon: '€', href: '/painel-fotografo/pagamentos' },
  { key: 'tarefas',     label: 'Tarefas',             icon: '◷', href: '/painel-fotografo/tarefas' },
  { key: 'calendario',  label: 'Calendário',          icon: '◉', href: '/painel-fotografo/calendario' },
  { key: 'workflow',    label: 'Workflow',            icon: '☰', href: '/painel-fotografo/workflow' },
  { key: 'edicao',      label: 'Edição Fotos',        icon: '◐', href: '/painel-fotografo/edicao-fotos' },
  { key: 'dados',       label: 'Dados Pessoais',      icon: '☻', href: '/painel-fotografo/dados-pessoais', active: true },
]

const SKILLS = [
  { label: 'Edição de Vídeo',   value: 95 },
  { label: 'Color Grading',     value: 90 },
  { label: 'Motion Graphics',   value: 75 },
  { label: 'Sound Design',      value: 70 },
  { label: 'Direção Criativa',  value: 85 },
]

const RECENT_ACTIVITY = [
  { ico: '+', titulo: 'Projeto criado',       sub: 'Amanda & Lucas',    quando: 'Hoje, 14:32', cor: '#a78bfa' },
  { ico: '↓', titulo: 'Material recebido',    sub: 'Beatriz & Gabriel', quando: 'Hoje, 11:15', cor: '#60a5fa' },
  { ico: '↗', titulo: 'Revisão enviada',      sub: 'Juliana & Mateus',  quando: 'Ontem, 16:40', cor: '#facc15' },
  { ico: '✓', titulo: 'Entrega concluída',    sub: 'Carolina & Felipe', quando: 'Ontem, 10:22', cor: '#10b981' },
  { ico: '€', titulo: 'Pagamento recebido',   sub: 'Sofia & Ricardo',   quando: '18/05/2026',  cor: '#C9A45C' },
]

export default function DadosPessoaisPage() {
  const [editMode, setEditMode] = useState(false)
  const [theme, setTheme] = useState<'dark'|'light'>('dark')
  const [profile, setProfile] = useState<FreelancerProfile>(DEFAULT_FREELANCER_PROFILE)

  // Carrega perfil de localStorage no mount
  useEffect(() => {
    setProfile(loadFreelancerProfile())
  }, [])

  function updateProfile(patch: Partial<FreelancerProfile>) {
    const next = { ...profile, ...patch }
    setProfile(next)
    saveFreelancerProfile(next)
  }

  // Stats agregados (Resumo da Atividade) — sincronizados com localStorage + mocks
  const [activityStats, setActivityStats] = useState({
    projetosEmEdicao: 0,
    tarefasConcluidas: 0,
    projetosFinalizados: 0,
    avaliacaoMedia: '—',         // baseada em entregas no prazo
    avaliacaoCor: '#facc15',     // amber default
  })
  useEffect(() => {
    function refresh() {
      try {
        // Projetos: user-projects + mocks com patches (filtra archived/cancelled)
        const userRaw = localStorage.getItem('painel-fotografo-user-projects')
        const userProjects: any[] = userRaw ? JSON.parse(userRaw) : []
        const patchesRaw = localStorage.getItem('painel-fotografo-project-patches')
        const patches: Record<string, any> = patchesRaw ? JSON.parse(patchesRaw) : {}
        const mocksApplied = MOCK_PROJECTS
          .map(p => patches[p.id] ? { ...p, ...patches[p.id] } : p)
          .filter(p => !(p as any).archived && !(p as any).cancelled)
        const allProjects = [
          ...userProjects.filter(p => !p.archived && !p.cancelled),
          ...mocksApplied,
        ]
        const EDITING = ['Em Edição','Color Grading','Trailer em Produção','Áudio / Sincronização','Para Revisão','Correções','Finalizado']
        const projetosEmEdicao = allProjects.filter(p => EDITING.includes(p.stage)).length
        const projetosFinalizados = allProjects.filter(p => p.stage === 'Entregue').length

        // Tarefas: user-tasks (concluídas) + mocks TASKS concluídas (filtra eliminadas)
        const userTasksRaw = localStorage.getItem('painel-fotografo-user-tasks')
        const userTasks: any[] = userTasksRaw ? JSON.parse(userTasksRaw) : []
        const delRaw = localStorage.getItem('painel-fotografo-deleted-tasks')
        const deleted = new Set<string>(delRaw ? JSON.parse(delRaw) : [])
        const userConcluidas = userTasks.filter(t => !deleted.has(t.id) && t.status === 'Concluída').length
        const mockConcluidas = MOCK_TASKS.filter(t => !deleted.has(t.id) && t.status === 'Concluída').length
        const tarefasConcluidas = userConcluidas + mockConcluidas

        // Avaliação Média baseada em pontualidade dos projetos entregues
        // Para cada Entregue: verifica se entregueEm <= entregaPrevista (no prazo) ou depois (atrasado)
        const parse = (s?: string): Date | null => {
          if (!s) return null
          const cleaned = s.split('—')[0].trim()
          const [d, m, y] = cleaned.split('/').map(Number)
          if (!d || !m || !y) return null
          return new Date(y, m-1, d)
        }
        let onTime = 0
        let late = 0
        allProjects.forEach(p => {
          if (p.stage !== 'Entregue') return
          const prazo = parse(p.entregaPrevista)
          const entregueEm = parse(p.entregueEm) || prazo
          if (!entregueEm) return
          if (!prazo) { onTime += 1; return }
          if (entregueEm.getTime() <= prazo.getTime()) onTime += 1
          else late += 1
        })
        const totalEntregues = onTime + late
        let avaliacaoMedia = '—'
        let avaliacaoCor = '#facc15'
        if (totalEntregues > 0) {
          // 100% no prazo → 5.0   |   0% no prazo → 1.0   (range 1.0–5.0)
          const ratio = onTime / totalEntregues
          const rating = 1 + ratio * 4
          avaliacaoMedia = `${rating.toFixed(1)}/5`
          // Cor: >=4.5 emerald · >=3.5 yellow · senão red
          avaliacaoCor = rating >= 4.5 ? '#34d399' : rating >= 3.5 ? '#facc15' : '#ef4444'
        }

        setActivityStats({ projetosEmEdicao, tarefasConcluidas, projetosFinalizados, avaliacaoMedia, avaliacaoCor })
      } catch {}
    }
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    window.addEventListener('storage', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('storage', onFocus)
    }
  }, [])

  return (
    <div className="min-h-screen text-white relative" style={{ background: '#0A0A0A' }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 15%, rgba(201,164,92,0.07), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 15% 85%, rgba(201,164,92,0.05), transparent 70%)' }} />

      <Sidebar profile={profile} />

      <main className="relative z-10 pl-[250px]">
        <div className="px-6 sm:px-8 py-6 max-w-[1700px] mx-auto">

          <Hero theme={theme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} onEdit={() => setEditMode(!editMode)} editMode={editMode} />

          {/* 3-column row: Profile | Conta | Resumo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
            <ProfileCard profile={profile} editMode={editMode} onChange={updateProfile} />
            <AccountInfoCard profile={profile} editMode={editMode} onChange={updateProfile} />
            <ActivitySummaryCard stats={activityStats} />
          </div>

          {/* Sobre Mim + Especialidades */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
            <div className="lg:col-span-2">
              <AboutCard editMode={editMode} onToggle={() => setEditMode(!editMode)} profile={profile} onChange={updateProfile} />
            </div>
            <SkillsCard editMode={editMode} onToggle={() => setEditMode(!editMode)} profile={profile} onChange={updateProfile} />
          </div>

          {/* Preferências + Pagamento + Segurança */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
            <WorkPreferencesCard editMode={editMode} onToggle={() => setEditMode(!editMode)} profile={profile} onChange={updateProfile} />
            <PaymentInfoCard editMode={editMode} onToggle={() => setEditMode(!editMode)} profile={profile} onChange={updateProfile} />
            <SecurityCard />
          </div>

          <p className="text-center text-[10px] tracking-[0.4em] uppercase text-white/15 mt-12 mb-4">RL Photo.Video · Perfil do Editor</p>
        </div>
      </main>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  SIDEBAR
// ────────────────────────────────────────────────────────────────────────

function Sidebar({ profile }: { profile: FreelancerProfile }) {
  return (
    <aside
      className="flex fixed top-0 left-0 bottom-0 w-[250px] z-30 flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(15,12,8,0.96) 0%, rgba(11,9,5,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(201,164,92,0.12)',
      }}>
      <BrandLogo />
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
        {NAV_ITEMS.map(it => {
          const isActive = !!it.active
          const cls = `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all group ${
            isActive ? 'bg-gold/10 border border-gold/30 text-gold' : 'border border-transparent text-white/45 hover:text-white/90 hover:bg-white/[0.03]'
          }`
          const inner = (
            <>
              <span className={`w-5 text-center text-base ${isActive ? 'text-gold' : 'text-white/35 group-hover:text-white/70'}`}>{it.icon}</span>
              <span className="text-[13px] font-medium tracking-wide">{it.label}</span>
            </>
          )
          return it.href
            ? <Link key={it.key} href={it.href} className={cls} style={isActive ? { boxShadow: '0 0 18px -4px rgba(201,164,92,0.35)' } : {}}>{inner}</Link>
            : <button key={it.key} className={cls}>{inner}</button>
        })}
      </nav>
      <div className="px-4 pb-3">
        <div className="rounded-xl border border-gold/15 p-3"
          style={{ background: 'linear-gradient(135deg, rgba(201,164,92,0.06), transparent)' }}>
          <p className="text-gold/40 text-xl font-serif leading-none mb-1.5">&ldquo;</p>
          <p className="text-[11px] text-white/55 italic leading-relaxed">O talento vence jogos, mas só o trabalho em equipa vence campeonatos.</p>
          <p className="text-[10px] text-gold/70 italic mt-2">— Wedding Moments Films</p>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gold/40 shrink-0">
            <img src={profile.foto} alt={profile.nome} className="w-full h-full object-cover" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-white truncate">{profile.nome}</p>
            <p className="text-[10px] text-white/35 truncate">editorpro@mail.com</p>
            <p className="text-[9px] text-emerald-400 mt-0.5">● Online</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  HERO
// ────────────────────────────────────────────────────────────────────────

function Hero({ theme, onToggleTheme, onEdit, editMode }: { theme: 'dark'|'light'; onToggleTheme: () => void; onEdit: () => void; editMode: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08]"
      style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)' }}>
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1600&h=240&fit=crop"
          alt="" className="w-full h-full object-cover" style={{ filter: 'blur(2px)' }} />
      </div>
      <div className="absolute inset-0 z-[1]"
        style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.85) 35%, rgba(10,10,10,0.45) 70%, rgba(10,10,10,0.05) 100%)' }} />
      <div className="relative z-10 flex items-center justify-between gap-6 px-8 sm:px-12 py-7">
        <div className="flex items-center gap-5 max-w-xl">
          <div className="w-16 h-16 rounded-2xl border border-gold/40 flex items-center justify-center text-3xl text-gold shrink-0"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.18), rgba(201,164,92,0.04))', boxShadow: '0 0 22px -4px rgba(201,164,92,0.3)' }}>👤</div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Dados Pessoais</h1>
            <p className="text-[13px] text-white/55 mt-1 leading-relaxed">Gerencie suas informações pessoais, preferências e configurações da conta.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <NotificationBell />
          <MessagesBell />
          <button onClick={onToggleTheme}
            className="w-11 h-11 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-gold/40 transition-all flex items-center justify-center text-white/75 hover:text-gold">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button onClick={onEdit}
            className={`inline-flex items-center gap-2 px-5 h-11 rounded-xl text-[13px] font-semibold tracking-wider transition-all ${
              editMode
                ? 'bg-emerald-500 text-black hover:bg-emerald-500/90'
                : 'bg-gold text-black hover:bg-gold/90'
            }`}
            style={{ boxShadow: editMode ? '0 0 24px -4px rgba(52,211,153,0.5)' : '0 0 24px -4px rgba(201,164,92,0.5)' }}>
            {editMode ? '✓ Concluir Edição' : '✎ Editar Perfil'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  PROFILE CARD
// ────────────────────────────────────────────────────────────────────────

function ProfileCard({ profile, editMode, onChange }: { profile: FreelancerProfile; editMode: boolean; onChange: (patch: Partial<FreelancerProfile>) => void }) {
  const [editingFoto, setEditingFoto] = useState(false)
  return (
    <Card>
      <div className="flex items-start gap-5">
        {/* Photo */}
        <div className="relative shrink-0">
          <div className="w-32 h-32 rounded-full border-2 border-gold/40 overflow-hidden"
            style={{ boxShadow: '0 0 28px -6px rgba(201,164,92,0.3)' }}>
            <img src={profile.foto || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300&h=300&fit=crop&crop=face'}
              alt={profile.nome} className="w-full h-full object-cover" />
          </div>
          <button onClick={() => setEditingFoto(true)}
            className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-gold text-black flex items-center justify-center hover:bg-gold/90 transition-all"
            style={{ boxShadow: '0 0 14px rgba(201,164,92,0.5)' }} title="Alterar foto">
            <span className="text-sm">📷</span>
          </button>
        </div>

        {editingFoto && (
          <EditFotoModal
            currentFoto={profile.foto}
            onClose={() => setEditingFoto(false)}
            onSave={(url) => { onChange({ foto: url }); setEditingFoto(false) }}
          />
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {editMode ? (
              <input value={profile.nome} onChange={e => onChange({ nome: e.target.value })}
                className="text-2xl font-light text-white bg-black/40 border border-gold/30 rounded-md px-2 py-0.5 focus:outline-none focus:border-gold/60" style={{ fontFamily: 'Georgia, serif' }} />
            ) : (
              <h2 className="text-2xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>{profile.nome}</h2>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold uppercase tracking-widest font-bold">Freelancer</span>
          </div>
          <p className="text-[13px] text-white/55 mb-4">{profile.funcao}</p>

          <div className="space-y-2 text-[13px]">
            <ContactLine ico="✉" value={profile.email} editable={editMode} onChange={(v) => onChange({ email: v })} />
            <ContactLine ico="✆" value={profile.telefone} editable={editMode} onChange={(v) => onChange({ telefone: v })} />
            <ContactLine ico="◉" value={profile.localizacao} editable={editMode} onChange={(v) => onChange({ localizacao: v })} />
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border bg-emerald-500/15 text-emerald-300 border-emerald-500/30 tracking-widest uppercase font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
          Conta Ativa
        </span>
        <p className="text-[11px] text-white/45">Membro desde: <span className="text-white/75 font-medium">12/02/2024</span></p>
      </div>
    </Card>
  )
}

function ContactLine({ ico, value, editable, onChange }: { ico: string; value: string; editable?: boolean; onChange?: (v: string) => void }) {
  return (
    <p className="flex items-center gap-2 text-white/80">
      <span className="text-gold/70 w-4 text-center">{ico}</span>
      {editable && onChange ? (
        <input value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 text-[13px] text-white bg-black/40 border border-gold/30 rounded-md px-2 py-0.5 focus:outline-none focus:border-gold/60" />
      ) : (
        <span>{value}</span>
      )}
    </p>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  ACCOUNT INFO
// ────────────────────────────────────────────────────────────────────────

function AccountInfoCard({ profile, editMode, onChange }: { profile: FreelancerProfile; editMode: boolean; onChange: (patch: Partial<FreelancerProfile>) => void }) {
  const rows: { label: string; key: keyof FreelancerProfile; type?: string; editable: boolean }[] = [
    { label: 'Nome Completo',     key: 'nome',          editable: true },
    { label: 'Nome de Usuário',   key: 'username',      editable: true },
    { label: 'Email',             key: 'email',         type: 'email', editable: true },
    { label: 'Telefone',          key: 'telefone',      type: 'tel',   editable: true },
    { label: 'Data de Nascimento',key: 'dataNascimento',editable: true },
    { label: 'Localização',       key: 'localizacao',   editable: true },
    { label: 'Fuso Horário',      key: 'fusoHorario',   editable: false },
    { label: 'Idioma',            key: 'idioma',        editable: false },
  ]
  return (
    <Card>
      <CardHeader title="Informações da Conta" right={editMode ? <span className="text-[10px] text-gold/70 tracking-widest uppercase font-bold">Modo Edição</span> : undefined} />
      <div className="space-y-3.5">
        {rows.map(({ label, key, type, editable }) => (
          <div key={label} className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
            <span className="text-[12px] text-white/45 shrink-0">{label}</span>
            {editMode && editable ? (
              <input
                type={type ?? 'text'}
                value={profile[key]}
                onChange={(e) => onChange({ [key]: e.target.value } as Partial<FreelancerProfile>)}
                className="flex-1 ml-3 text-right text-[13px] text-white font-medium bg-black/40 border border-gold/30 rounded-md px-2 py-1 focus:outline-none focus:border-gold/60"
              />
            ) : (
              <span className="text-[13px] text-white font-medium text-right truncate">{profile[key]}</span>
            )}
          </div>
        ))}
        {editMode && (
          <p className="text-[10px] text-emerald-400/70 italic pt-2">✓ Alterações guardadas automaticamente.</p>
        )}
      </div>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  ACTIVITY SUMMARY
// ────────────────────────────────────────────────────────────────────────

function ActivitySummaryCard({ stats }: {
  stats: {
    projetosEmEdicao: number
    tarefasConcluidas: number
    projetosFinalizados: number
    avaliacaoMedia: string
    avaliacaoCor: string
  }
}) {
  const rows = [
    { ico: '◫', label: 'Projetos em Edição',     value: String(stats.projetosEmEdicao),    color: '#a78bfa', valueColor: '#ffffff' },
    { ico: '✓', label: 'Tarefas Concluídas',     value: String(stats.tarefasConcluidas),   color: '#10b981', valueColor: '#ffffff' },
    { ico: '◇', label: 'Projetos Finalizados',   value: String(stats.projetosFinalizados), color: '#C9A45C', valueColor: '#ffffff' },
    { ico: '★', label: 'Avaliação Média',        value: stats.avaliacaoMedia,              color: stats.avaliacaoCor, valueColor: stats.avaliacaoCor, tip: 'Baseada em % de entregas dentro do prazo' },
  ]
  return (
    <Card>
      <CardHeader title="Resumo da Atividade" />
      <div className="space-y-3.5">
        {rows.map(s => (
          <div key={s.label} className="flex items-center gap-3 pb-3 border-b border-white/[0.04] last:border-0 last:pb-0"
            title={s.tip}>
            <div className="w-9 h-9 rounded-lg border flex items-center justify-center text-base shrink-0"
              style={{ background: `${s.color}1a`, borderColor: `${s.color}55`, color: s.color }}>
              {s.ico}
            </div>
            <p className="flex-1 text-[13px] text-white/85">{s.label}</p>
            <p className="text-[15px] font-bold tabular-nums" style={{ color: s.valueColor }}>{s.value}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  ABOUT
// ────────────────────────────────────────────────────────────────────────

function AboutCard({ editMode, onToggle, profile, onChange }: {
  editMode?: boolean
  onToggle?: () => void
  profile: FreelancerProfile
  onChange: (patch: Partial<FreelancerProfile>) => void
}) {
  return (
    <Card>
      <CardHeader title="Sobre Mim" right={<EditButton editMode={editMode} onToggle={onToggle} />} />
      {editMode ? (
        <textarea
          value={profile.sobre}
          onChange={e => onChange({ sobre: e.target.value })}
          rows={4}
          className="w-full bg-black/40 border border-gold/30 rounded-lg px-3 py-2.5 text-[13px] text-white/85 placeholder:text-white/30 focus:outline-none focus:border-gold/60 resize-none leading-relaxed" />
      ) : (
        <p className="text-[13px] text-white/65 leading-relaxed whitespace-pre-wrap">{profile.sobre}</p>
      )}

      <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/[0.05]">
        <AboutStat label="Experiência" value={profile.experiencia} editMode={editMode}
          onChange={v => onChange({ experiencia: v })} />
        <AboutStat label="Projetos Realizados" value={profile.projetosRealizados} editMode={editMode}
          onChange={v => onChange({ projetosRealizados: v })} />
        <AboutStat label="Estilo" value={profile.estilo} small editMode={editMode}
          onChange={v => onChange({ estilo: v })} />
      </div>
    </Card>
  )
}

function AboutStat({ label, value, small, editMode, onChange }: {
  label: string; value: string; small?: boolean
  editMode?: boolean; onChange?: (v: string) => void
}) {
  return (
    <div>
      <p className="text-[10px] tracking-widest uppercase text-white/35 mb-1">{label}</p>
      {editMode && onChange ? (
        <input value={value} onChange={e => onChange(e.target.value)}
          className={`w-full bg-black/40 border border-gold/30 rounded-md px-2 py-1 ${small ? 'text-[12px]' : 'text-[14px]'} font-semibold text-white focus:outline-none focus:border-gold/60`} />
      ) : (
        <p className={`${small ? 'text-[12px]' : 'text-[15px]'} font-semibold text-white leading-tight`}>{value}</p>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  SKILLS
// ────────────────────────────────────────────────────────────────────────

function SkillsCard({ editMode, onToggle, profile, onChange }: {
  editMode?: boolean
  onToggle?: () => void
  profile: FreelancerProfile
  onChange: (patch: Partial<FreelancerProfile>) => void
}) {
  function updateSkill(idx: number, patch: Partial<{ label: string; value: number }>) {
    const next = profile.skills.map((s, i) => i === idx ? { ...s, ...patch } : s)
    onChange({ skills: next })
  }
  function addSkill() {
    onChange({ skills: [...profile.skills, { label: 'Nova competência', value: 50 }] })
  }
  function removeSkill(idx: number) {
    onChange({ skills: profile.skills.filter((_, i) => i !== idx) })
  }
  return (
    <Card>
      <CardHeader title="Especialidades" right={<EditButton editMode={editMode} onToggle={onToggle} />} />
      <div className="space-y-4">
        {profile.skills.map((s, i) => (
          <div key={i}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              {editMode ? (
                <input value={s.label} onChange={e => updateSkill(i, { label: e.target.value })}
                  className="flex-1 bg-black/40 border border-gold/30 rounded-md px-2 py-1 text-[12px] text-white/85 focus:outline-none focus:border-gold/60" />
              ) : (
                <span className="text-[12px] text-white/75">{s.label}</span>
              )}
              {editMode ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <input type="number" min={0} max={100} value={s.value}
                    onChange={e => updateSkill(i, { value: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                    className="w-14 bg-black/40 border border-gold/30 rounded-md px-2 py-1 text-[12px] text-gold font-bold focus:outline-none focus:border-gold/60 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  <span className="text-[12px] font-bold text-gold/70">%</span>
                  <button onClick={() => removeSkill(i)} title="Remover"
                    className="ml-1 text-red-300/60 hover:text-red-300 text-[14px]">×</button>
                </div>
              ) : (
                <span className="text-[12px] font-bold text-gold">{s.value}%</span>
              )}
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${s.value}%`,
                  background: 'linear-gradient(90deg, #C9A45C, #E8C76D, #C9A45C)',
                  boxShadow: '0 0 8px rgba(201,164,92,0.5)',
                }} />
            </div>
          </div>
        ))}
        {editMode && (
          <button onClick={addSkill}
            className="w-full text-[11px] tracking-widest uppercase text-gold/70 hover:text-gold py-2 rounded-lg border border-dashed border-gold/30 hover:bg-gold/[0.04] transition-all">
            + Adicionar competência
          </button>
        )}
      </div>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  WORK PREFERENCES
// ────────────────────────────────────────────────────────────────────────

function WorkPreferencesCard({ editMode, onToggle, profile, onChange }: {
  editMode?: boolean
  onToggle?: () => void
  profile: FreelancerProfile
  onChange: (patch: Partial<FreelancerProfile>) => void
}) {
  const FUNCAO_OPTIONS: FreelancerProfile['funcao'][] = ['Videógrafo', 'Fotógrafo', 'Editor de Foto', 'Editor de Vídeo', 'Assistente']
  const rows: { label: string; key: keyof FreelancerProfile }[] = [
    { label: 'Dias de Trabalho',     key: 'diasTrabalho' },
    { label: 'Horário Preferencial', key: 'horarioPreferencial' },
    { label: 'Comunicação',          key: 'comunicacao' },
  ]
  return (
    <Card>
      <CardHeader title="Preferências de Trabalho" right={<EditButton editMode={editMode} onToggle={onToggle} />} />
      <div className="space-y-3.5">
        {/* Função (dropdown) */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.04]">
          <span className="text-[12px] text-white/45 shrink-0">Função</span>
          {editMode ? (
            <select value={profile.funcao}
              onChange={e => onChange({ funcao: e.target.value as FreelancerProfile['funcao'] })}
              className="flex-1 ml-3 text-right text-[13px] text-white font-medium bg-black/40 border border-gold/30 rounded-md px-2 py-1 focus:outline-none focus:border-gold/60 cursor-pointer">
              {FUNCAO_OPTIONS.map(f => (
                <option key={f} value={f} style={{ background: '#1a1206' }}>{f}</option>
              ))}
            </select>
          ) : (
            <span className="text-[13px] text-gold font-medium text-right truncate">{profile.funcao}</span>
          )}
        </div>
        {rows.map(({ label, key }) => (
          <div key={label} className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.04]">
            <span className="text-[12px] text-white/45 shrink-0">{label}</span>
            {editMode ? (
              <input value={String(profile[key])} onChange={e => onChange({ [key]: e.target.value } as any)}
                className="flex-1 ml-3 text-right text-[13px] text-white font-medium bg-black/40 border border-gold/30 rounded-md px-2 py-1 focus:outline-none focus:border-gold/60" />
            ) : (
              <span className="text-[13px] text-white font-medium text-right truncate">{String(profile[key])}</span>
            )}
          </div>
        ))}
        {/* Notificações toggle */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.04]">
          <span className="text-[12px] text-white/45">Notificações</span>
          {editMode ? (
            <button onClick={() => onChange({ notificacoesAtivas: !profile.notificacoesAtivas })}
              className={`px-3 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase transition-all ${
                profile.notificacoesAtivas
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                  : 'bg-white/[0.04] border border-white/15 text-white/55'
              }`}>
              {profile.notificacoesAtivas ? '✓ Ativas' : '○ Inativas'}
            </button>
          ) : (
            <span className="text-[13px] text-white font-medium">{profile.notificacoesAtivas ? 'Ativas' : 'Inativas'}</span>
          )}
        </div>
        {/* Disponibilidade toggle */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-white/45">Disponibilidade</span>
          {editMode ? (
            <button onClick={() => onChange({ disponivelNovosProjetos: !profile.disponivelNovosProjetos })}
              className={`px-3 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase transition-all ${
                profile.disponivelNovosProjetos
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                  : 'bg-white/[0.04] border border-white/15 text-white/55'
              }`}>
              {profile.disponivelNovosProjetos ? '✓ Disponível' : '○ Indisponível'}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium">
              <span className={`w-1.5 h-1.5 rounded-full ${profile.disponivelNovosProjetos ? 'bg-emerald-400' : 'bg-white/30'}`}
                style={profile.disponivelNovosProjetos ? { boxShadow: '0 0 6px rgba(52,211,153,0.7)' } : {}} />
              <span className={profile.disponivelNovosProjetos ? 'text-emerald-300' : 'text-white/55'}>
                {profile.disponivelNovosProjetos ? 'Disponível para novos projetos' : 'Indisponível de momento'}
              </span>
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  PAYMENT INFO
// ────────────────────────────────────────────────────────────────────────

function PaymentInfoCard({ editMode, onToggle, profile, onChange }: {
  editMode?: boolean
  onToggle?: () => void
  profile: FreelancerProfile
  onChange: (patch: Partial<FreelancerProfile>) => void
}) {
  const rows: { label: string; key: keyof FreelancerProfile; mono?: boolean }[] = [
    { label: 'Método de Pagamento', key: 'metodoPagamento' },
    { label: 'IBAN',                key: 'iban', mono: true },
    { label: 'Titular da Conta',    key: 'titularConta' },
    { label: 'NIF',                 key: 'nif', mono: true },
    { label: 'Moeda',               key: 'moeda' },
  ]
  return (
    <Card>
      <CardHeader title="Informações de Pagamento" right={<EditButton editMode={editMode} onToggle={onToggle} />} />
      <div className="space-y-3.5">
        {rows.map(({ label, key, mono }) => (
          <div key={label} className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
            <span className="text-[12px] text-white/45 shrink-0">{label}</span>
            {editMode ? (
              <input value={String(profile[key])} onChange={e => onChange({ [key]: e.target.value } as any)}
                className={`flex-1 ml-3 text-right text-[13px] text-white font-medium bg-black/40 border border-gold/30 rounded-md px-2 py-1 focus:outline-none focus:border-gold/60 ${mono ? 'font-mono' : ''}`} />
            ) : (
              <span className={`text-[13px] text-white font-medium text-right truncate ${mono ? 'font-mono' : ''}`}>{String(profile[key])}</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  SECURITY
// ────────────────────────────────────────────────────────────────────────

function SecurityCard() {
  return (
    <Card>
      <CardHeader title="Segurança da Conta" />
      <div className="space-y-3">
        <SecRow ico="🔒" label="Senha" value="••••••••" action="Alterar" />
        <SecRow ico="🛡" label="Autenticação 2FA" value="Ativada" valueClass="text-emerald-300" />
        <SecRow ico="◫" label="Sessões Ativas" value="2 dispositivos" action="→" />
        <SecRow ico="◷" label="Último Acesso" value="19/05/2026 às 14:32" small />
      </div>
      <button className="mt-4 w-full py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-[12px] font-semibold tracking-widest uppercase hover:bg-red-500/20 transition-all">
        Encerrar Todas as Sessões
      </button>
    </Card>
  )
}

function SecRow({ ico, label, value, action, valueClass, small }: { ico: string; label: string; value: string; action?: string; valueClass?: string; small?: boolean }) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
      <span className="w-6 text-center text-base text-white/40">{ico}</span>
      <span className="flex-1 text-[12px] text-white/75">{label}</span>
      <span className={`${small ? 'text-[11px]' : 'text-[12px]'} font-medium ${valueClass ?? 'text-white/85'}`}>{value}</span>
      {action && (
        <button className="text-[11px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors border border-gold/20 px-2 py-1 rounded-md">
          {action}
        </button>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  DEVICES
// ────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────
//  HELPERS
// ────────────────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] p-6 backdrop-blur-md"
      style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.65))', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.6)' }}>
      {children}
    </div>
  )
}

function CardHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-[18px] font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
      {right}
    </div>
  )
}

function EditButton({ editMode, onToggle }: { editMode?: boolean; onToggle?: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] tracking-widest uppercase font-bold transition-all ${
        editMode
          ? 'border-emerald-500/45 bg-emerald-500/[0.08] text-emerald-300 hover:bg-emerald-500/15'
          : 'border-gold/30 bg-gold/[0.06] text-gold hover:bg-gold/15'
      }`}>
      {editMode ? '✓ Concluir' : '✎ Editar'}
    </button>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  MODAL: ALTERAR FOTO DE PERFIL
// ────────────────────────────────────────────────────────────────────────
function EditFotoModal({
  currentFoto,
  onClose,
  onSave,
}: {
  currentFoto: string
  onClose: () => void
  onSave: (urlOrDataUrl: string) => void
}) {
  const [url, setUrl] = useState('')
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('Selecciona uma imagem.'); return }
    if (f.size > 2 * 1024 * 1024) { setError('Imagem demasiado grande (máx 2 MB).'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        setFilePreview(result)
        setUrl('')
      }
    }
    reader.readAsDataURL(f)
  }

  function submit() {
    const value = filePreview || url.trim()
    if (!value) { setError('Selecciona um ficheiro ou cola um URL.'); return }
    onSave(value)
  }

  const previewSrc = filePreview || (url.trim() && /^https?:\/\//.test(url.trim()) ? url.trim() : currentFoto)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="relative w-full max-w-md rounded-2xl border border-gold/30 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.98), rgba(11,9,5,0.99))', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.8), 0 0 40px -10px rgba(201,164,92,0.35)' }}>
        <button onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg border border-white/10 text-white/55 hover:text-gold hover:border-gold/30 flex items-center justify-center text-lg z-10">×</button>

        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold/70 font-bold mb-2">Perfil</p>
          <h2 className="text-2xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>
            Alterar <span className="italic text-gold">foto</span>
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Preview circular */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32 rounded-full border-2 border-gold/40 overflow-hidden"
              style={{ boxShadow: '0 0 28px -6px rgba(201,164,92,0.3)' }}>
              {previewSrc ? (
                <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/30 text-[12px]">Sem foto</div>
              )}
            </div>
          </div>

          {/* Upload ficheiro */}
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-2">Carregar do computador</p>
            <label className="block w-full cursor-pointer">
              <input type="file" accept="image/*" onChange={onFile} className="hidden" />
              <div className="rounded-lg border border-dashed border-white/15 hover:border-gold/40 px-4 py-3 text-center transition-all">
                <p className="text-[13px] text-white/65">📤 Escolher imagem</p>
                <p className="text-[10px] text-white/30 mt-0.5">PNG, JPG · máx 2 MB</p>
              </div>
            </label>
          </div>

          {/* OU URL */}
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-2">Ou colar URL</p>
            <input value={url} onChange={e => { setUrl(e.target.value); setFilePreview(null) }}
              placeholder="https://..."
              className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2.5 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 font-mono" />
          </div>

          {error && (
            <p className="text-[12px] text-red-300 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">⚠ {error}</p>
          )}

          {/* Botões */}
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-white/65 text-[12px] font-semibold tracking-wider hover:border-white/25 hover:text-white transition-all">
              Cancelar
            </button>
            <button type="button" onClick={submit}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gold text-black text-[12px] font-bold tracking-wider hover:bg-gold/90 transition-all"
              style={{ boxShadow: '0 0 18px -4px rgba(201,164,92,0.5)' }}>
              ✓ Guardar foto
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
