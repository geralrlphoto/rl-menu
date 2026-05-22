'use client'

import { useState } from 'react'
import Link from 'next/link'

// ────────────────────────────────────────────────────────────────────────
//  DADOS PESSOAIS — Wedding Moments Films
//  Freelancer profile center
// ────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',           icon: '⌂', href: '/painel-editor' },
  { key: 'novos',       label: 'Novos Projetos',      icon: '+', href: '/painel-editor/novos-projetos' },
  { key: 'pagamentos',  label: 'Pagamentos',          icon: '€', href: '/painel-editor/pagamentos' },
  { key: 'tarefas',     label: 'Tarefas',             icon: '◷', href: '/painel-editor/tarefas' },
  { key: 'calendario',  label: 'Calendário',          icon: '◉', href: '/painel-editor/calendario' },
  { key: 'workflow',    label: 'Workflow',            icon: '☰', href: '/painel-editor/workflow' },
  { key: 'biblioteca',  label: 'Biblioteca',          icon: '♪', href: '/painel-editor/musicas' },
  { key: 'dados',       label: 'Dados Pessoais',      icon: '☻', href: '/painel-editor/dados-pessoais', active: true },
]

const SKILLS = [
  { label: 'Edição de Vídeo',   value: 95 },
  { label: 'Color Grading',     value: 90 },
  { label: 'Motion Graphics',   value: 75 },
  { label: 'Sound Design',      value: 70 },
  { label: 'Direção Criativa',  value: 85 },
]

const DEVICES = [
  { device: 'MacBook Pro 16"', sub: 'macOS · Chrome 124.0.0.0', location: 'Lisboa, Portugal', when: '19/05/2026 às 14:32', current: true,  icon: '◫' },
  { device: 'iPhone 14 Pro',   sub: 'iOS · Safari Mobile',       location: 'Lisboa, Portugal', when: '19/05/2026 às 09:15', current: false, icon: '◫' },
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

  return (
    <div className="min-h-screen text-white relative" style={{ background: '#0A0A0A' }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 15%, rgba(201,164,92,0.07), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 15% 85%, rgba(201,164,92,0.05), transparent 70%)' }} />

      <Sidebar />

      <main className="relative z-10 lg:pl-[250px]">
        <div className="px-6 sm:px-8 py-6 max-w-[1700px] mx-auto">

          <Hero theme={theme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} onEdit={() => setEditMode(!editMode)} />

          {/* 3-column row: Profile | Conta | Resumo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
            <ProfileCard />
            <AccountInfoCard />
            <ActivitySummaryCard />
          </div>

          {/* Sobre Mim + Especialidades */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
            <div className="lg:col-span-2">
              <AboutCard />
            </div>
            <SkillsCard />
          </div>

          {/* Preferências + Pagamento + Segurança */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
            <WorkPreferencesCard />
            <PaymentInfoCard />
            <SecurityCard />
          </div>

          {/* Devices full width */}
          <div className="mt-5">
            <DevicesCard />
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

function Sidebar() {
  return (
    <aside
      className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[250px] z-30 flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(15,12,8,0.96) 0%, rgba(11,9,5,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(201,164,92,0.12)',
      }}>
      <div className="px-6 pt-7 pb-6 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl border border-gold/40 flex items-center justify-center"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.2), rgba(201,164,92,0.04))', boxShadow: '0 0 20px rgba(201,164,92,0.15)' }}>
            <span className="text-xl">📷</span>
          </div>
          <div>
            <p className="text-[14px] tracking-[0.18em] text-gold font-bold uppercase leading-tight" style={{ fontFamily: 'Georgia, serif' }}>Wedding</p>
            <p className="text-[14px] tracking-[0.18em] text-gold font-bold uppercase leading-tight" style={{ fontFamily: 'Georgia, serif' }}>Moments</p>
            <p className="text-[9px] tracking-[0.35em] text-gold/70 uppercase mt-0.5">Films</p>
          </div>
        </div>
      </div>
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
            <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop&crop=face" alt="" className="w-full h-full object-cover" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-white truncate">Editor Pro</p>
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

function Hero({ theme, onToggleTheme, onEdit }: { theme: 'dark'|'light'; onToggleTheme: () => void; onEdit: () => void }) {
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
          <button className="relative w-11 h-11 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-gold/40 transition-all flex items-center justify-center">
            <span className="text-lg text-white/75">🔔</span>
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-black">3</span>
          </button>
          <button onClick={onToggleTheme}
            className="w-11 h-11 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-gold/40 transition-all flex items-center justify-center text-white/75 hover:text-gold">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button onClick={onEdit}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gold text-black text-[13px] font-semibold tracking-wider hover:bg-gold/90 transition-all"
            style={{ boxShadow: '0 0 24px -4px rgba(201,164,92,0.5)' }}>
            ✎ Editar Perfil
          </button>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  PROFILE CARD
// ────────────────────────────────────────────────────────────────────────

function ProfileCard() {
  return (
    <Card>
      <div className="flex items-start gap-5">
        {/* Photo */}
        <div className="relative shrink-0">
          <div className="w-32 h-32 rounded-full border-2 border-gold/40 overflow-hidden"
            style={{ boxShadow: '0 0 28px -6px rgba(201,164,92,0.3)' }}>
            <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300&h=300&fit=crop&crop=face" alt="Editor Pro" className="w-full h-full object-cover" />
          </div>
          <button className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-gold text-black flex items-center justify-center hover:bg-gold/90 transition-all"
            style={{ boxShadow: '0 0 14px rgba(201,164,92,0.5)' }} title="Alterar foto">
            <span className="text-sm">📷</span>
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-2xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>Editor Pro</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold uppercase tracking-widest font-bold">Freelancer</span>
          </div>
          <p className="text-[13px] text-white/55 mb-4">Editor de Vídeo & Colorista</p>

          <div className="space-y-2 text-[13px]">
            <ContactLine ico="✉" value="editorpro@mail.com" />
            <ContactLine ico="✆" value="+351 912 345 678" />
            <ContactLine ico="◉" value="Lisboa, Portugal" />
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

function ContactLine({ ico, value }: { ico: string; value: string }) {
  return (
    <p className="flex items-center gap-2 text-white/80">
      <span className="text-gold/70 w-4 text-center">{ico}</span>
      <span>{value}</span>
    </p>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  ACCOUNT INFO
// ────────────────────────────────────────────────────────────────────────

function AccountInfoCard() {
  const rows = [
    ['Nome Completo',     'Editor Pro'],
    ['Nome de Usuário',   'editorpro'],
    ['Email',             'editorpro@mail.com'],
    ['Telefone',          '+351 912 345 678'],
    ['Data de Nascimento','15/07/1992'],
    ['Localização',       'Lisboa, Portugal'],
    ['Fuso Horário',      '🌐 (GMT+01:00) Lisboa'],
    ['Idioma',            '🇵🇹 Português (Portugal)'],
  ]
  return (
    <Card>
      <CardHeader title="Informações da Conta" />
      <div className="space-y-3.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
            <span className="text-[12px] text-white/45">{label}</span>
            <span className="text-[13px] text-white font-medium text-right">{value}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  ACTIVITY SUMMARY
// ────────────────────────────────────────────────────────────────────────

function ActivitySummaryCard() {
  const stats = [
    { ico: '◫', label: 'Projetos em Edição',     value: '6',      color: '#a78bfa' },
    { ico: '✓', label: 'Tarefas Concluídas',     value: '24',     color: '#10b981' },
    { ico: '◷', label: 'Horas Trabalhadas',      value: '56h 30m', color: '#60a5fa' },
    { ico: '◇', label: 'Projetos Finalizados',  value: '4',      color: '#C9A45C' },
    { ico: '★', label: 'Avaliação Média',        value: '4.9/5',  color: '#facc15' },
  ]
  return (
    <Card>
      <CardHeader title="Resumo da Atividade" right={
        <button className="text-[11px] tracking-wider uppercase text-white/45 hover:text-gold transition-colors border border-white/10 px-2.5 py-1 rounded-md">Este Mês ▾</button>
      } />
      <div className="space-y-3.5">
        {stats.map(s => (
          <div key={s.label} className="flex items-center gap-3 pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
            <div className="w-9 h-9 rounded-lg border flex items-center justify-center text-base shrink-0"
              style={{ background: `${s.color}1a`, borderColor: `${s.color}55`, color: s.color }}>
              {s.ico}
            </div>
            <p className="flex-1 text-[13px] text-white/85">{s.label}</p>
            <p className="text-[15px] font-bold text-white tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  ABOUT
// ────────────────────────────────────────────────────────────────────────

function AboutCard() {
  return (
    <Card>
      <CardHeader title="Sobre Mim" right={<EditButton />} />
      <p className="text-[13px] text-white/65 leading-relaxed">
        Editor de vídeo especializado em casamentos com mais de 6 anos de experiência.
        Apaixonado por contar histórias reais através de imagens. Busco sempre capturar
        emoções autênticas e transformar momentos em memórias inesquecíveis.
      </p>

      <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/[0.05]">
        <AboutStat label="Experiência"           value="6+ anos" />
        <AboutStat label="Projetos Realizados"   value="150+" />
        <AboutStat label="Estilo"                value="Cinemático, Emocional, Autêntico" small />
      </div>
    </Card>
  )
}

function AboutStat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <p className="text-[10px] tracking-widest uppercase text-white/35 mb-1">{label}</p>
      <p className={`${small ? 'text-[12px]' : 'text-[15px]'} font-semibold text-white leading-tight`}>{value}</p>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  SKILLS
// ────────────────────────────────────────────────────────────────────────

function SkillsCard() {
  return (
    <Card>
      <CardHeader title="Especialidades" right={<EditButton />} />
      <div className="space-y-4">
        {SKILLS.map(s => (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] text-white/75">{s.label}</span>
              <span className="text-[12px] font-bold text-gold">{s.value}%</span>
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
      </div>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  WORK PREFERENCES
// ────────────────────────────────────────────────────────────────────────

function WorkPreferencesCard() {
  const rows = [
    ['Dias de Trabalho',    'Segunda a Sábado'],
    ['Horário Preferencial','09:00 - 18:00'],
    ['Comunicação',         'Email, WhatsApp, Slack'],
    ['Notificações',        'Ativas'],
  ]
  return (
    <Card>
      <CardHeader title="Preferências de Trabalho" right={<EditButton />} />
      <div className="space-y-3.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
            <span className="text-[12px] text-white/45">{label}</span>
            <span className="text-[13px] text-white font-medium text-right">{value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-white/45">Disponibilidade</span>
          <span className="inline-flex items-center gap-1.5 text-[12px] text-emerald-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
            Disponível para novos projetos
          </span>
        </div>
      </div>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  PAYMENT INFO
// ────────────────────────────────────────────────────────────────────────

function PaymentInfoCard() {
  const rows = [
    ['Método de Pagamento', 'Transferência Bancária'],
    ['IBAN',                'PT50 0010 0000 1234 5678 9015 4'],
    ['Titular da Conta',    'Editor Pro'],
    ['NIF',                 '123 456 789'],
    ['Moeda',               'EUR (€)'],
  ]
  return (
    <Card>
      <CardHeader title="Informações de Pagamento" right={<EditButton />} />
      <div className="space-y-3.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
            <span className="text-[12px] text-white/45">{label}</span>
            <span className="text-[13px] text-white font-medium text-right">{value}</span>
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

function DevicesCard() {
  return (
    <Card>
      <CardHeader title="Dispositivos Conectados" />
      <div className="rounded-xl border border-white/[0.05] overflow-hidden">
        {DEVICES.map((d, i) => (
          <div key={i} className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-4 py-4 ${i < DEVICES.length-1 ? 'border-b border-white/[0.04]' : ''} hover:bg-white/[0.02] transition-colors`}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg text-gold border border-gold/25 bg-gold/[0.06]">{d.icon}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[13px] font-semibold text-white truncate">{d.device}</p>
                {d.current && (
                  <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 tracking-widest uppercase font-bold">Este Dispositivo</span>
                )}
              </div>
              <p className="text-[11px] text-white/40 mt-0.5 truncate">{d.sub}</p>
            </div>
            <p className="text-[12px] text-white/55 hidden sm:block">{d.location}</p>
            <p className="text-[12px] text-white/55 hidden md:block">{d.when}</p>
            <button className="w-8 h-8 rounded-lg text-white/35 hover:text-gold hover:bg-white/[0.04] transition-all flex items-center justify-center">⋮</button>
          </div>
        ))}
      </div>
    </Card>
  )
}

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

function EditButton() {
  return (
    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold/30 bg-gold/[0.06] text-gold text-[11px] tracking-widest uppercase font-bold hover:bg-gold/15 transition-all">
      Editar
    </button>
  )
}
