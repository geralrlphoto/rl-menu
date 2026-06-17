'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { plainText, type Block } from '../../NotionRenderer'
import BlockEditor from '../../BlockEditor'
import { NoivosLogoutButton } from '@/app/components/NoivosLogoutButton'
import { AtmospherePortal, buildDeliveriesFromSettings } from '../../../portal-cliente/atmosphere/AtmospherePortal'

const PAGE_ID = '35b220116d8a811b99b7f6f26648c017'
const PORTAL_TIPO: 'casamento' | 'batizado' = 'batizado'
const COUPLE_LABEL = 'Os Pais'

type Task = { id: string; text: string; done: boolean }

type PortalSettings = {
  hiddenNav: string[]
  noiva?: string
  noivo?: string
  nomeCrianca?: string
  emailNoiva?: string
  dataFormatada?: string
  data?: string
  local?: string
  activeNavId?: string
  heroImageUrl?: string
  galleryUrls?: string[]
  tasks?: Task[]
  referencia?: string
  valorTotal?: number
  valorFoto?: number
  valorVideo?: number
  valorExtras?: number
  guiaLinks?: {
    blogUrl?: string
    fotosSelecaoUrl?: string
    fotosVerMaisUrl?: string
    fotosConvidadosUrl?: string
    dadosContratoUrl?: string
    pagamentosRegistoUrl?: string
  }
  parceiros?: Array<{ imageUrl: string; url?: string }>
  subpageHeaderUrl?: string
  preWeddingSlots?: Array<{ id: string; date: string; time: string; local: string }>
  preWeddingReservedSlotId?: string
  preWeddingReservedAt?: string
  // BookingSection (Marcação) — admin configura slots, cliente reserva
  bookingActive?: boolean
  bookingType?: 'sessao' | 'reuniao'
  bookingSlots?: Array<{ id: string; date: string; time: string; local: string }>
  bookingReservedSlotId?: string
  bookingReservedAt?: string
  pageTitles?: Record<string, string>
  calloutLinks?: Record<string, Record<string, string>>
  briefingLinks?: Record<string, string>
  pageHeaders?: Record<string, string>
  briefingInfo?: Record<string, { fields?: Array<{ label: string; value: string }>; infoGeral?: string; equipa?: Array<{ role: string; name: string }> }>
  portalPassword?: string
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function findAllChildPages(blocks: Block[]): Array<{ id: string; title: string }> {
  const out: Array<{ id: string; title: string }> = []
  for (const b of blocks) {
    if (b.type === 'child_page') out.push({ id: b.id, title: b.child_page?.title ?? '' })
    if (b.children) out.push(...findAllChildPages(b.children))
  }
  return out
}

function findImages(blocks: Block[]): string[] {
  const urls: string[] = []
  for (const b of blocks) {
    if (b.type === 'image') {
      const url = b.image?.type === 'external' ? b.image?.external?.url : b.image?.file?.url
      if (url) urls.push(url)
    }
    if (b.children) urls.push(...findImages(b.children))
  }
  return urls
}

function findWelcomeText(blocks: Block[]): { heading: string; paragraphs: string[]; reference: string } {
  const heading = blocks.find(b => b.type === 'heading_2')
  const paragraphs = blocks.filter(b => b.type === 'paragraph')
  let reference = ''
  const lines: string[] = []
  for (const p of paragraphs) {
    const text = plainText(p.paragraph?.rich_text ?? '')
    if (!text) continue
    if (/^(referên|referên|referência|referencia|ref\.?\s*:|ref\s+)/i.test(text.trim())) {
      reference = text.trim()
      continue
    }
    text.split('\n').forEach(l => lines.push(l))
  }
  return {
    heading: heading ? plainText(heading.heading_2?.rich_text ?? []) : '',
    paragraphs: lines,
    reference,
  }
}

// ─── upload helper ────────────────────────────────────────────────────────────

function uploadWithProgress(file: File, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const fd = new FormData()
    fd.append('file', file)
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => {
      try { resolve(JSON.parse(xhr.responseText).url ?? '') } catch { reject(new Error('Upload falhou')) }
    }
    xhr.onerror = () => reject(new Error('Erro de rede'))
    xhr.open('POST', '/api/upload-image')
    xhr.send(fd)
  })
}

// ─── photo field ─────────────────────────────────────────────────────────────

function PhotoField({ label, value, onChange, onClear }: {
  label: string; value: string; onChange: (url: string) => void; onClear: () => void
}) {
  const [progress, setProgress] = useState<number | null>(null)

  async function handleFile(file: File) {
    setProgress(0)
    try {
      const url = await uploadWithProgress(file, setProgress)
      if (url) onChange(url)
    } finally { setProgress(null) }
  }

  const uploading = progress !== null

  return (
    <div>
      <label className="block text-[10px] text-white/30 mb-1">{label}</label>
      <div className="flex gap-2 items-start">
        <div className="flex-1 space-y-1.5">
          <label className={`relative flex flex-col items-center justify-center w-full py-2.5 rounded-lg border border-dashed cursor-pointer transition-all overflow-hidden
            ${uploading ? 'border-gold/40 bg-gold/5 text-gold/70' : 'border-white/15 hover:border-gold/40 hover:bg-gold/5 text-white/35 hover:text-gold/70'}`}>
            <input type="file" accept="image/*" className="hidden" disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
            {uploading ? (
              <>
                <div className="absolute inset-0 bg-gold/10 transition-all duration-200" style={{ width: `${progress}%` }} />
                <div className="relative flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  <span className="text-[11px] tracking-wide font-medium">{progress}%</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-[11px] tracking-wide">Carregar fotografia</span>
              </div>
            )}
          </label>
          <input value={value} onChange={e => onChange(e.target.value)} placeholder="ou cola um URL..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20" />
        </div>
        {value && (
          <div className="shrink-0 flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-lg bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${value})` }} />
            <button onClick={onClear} className="text-[10px] text-white/25 hover:text-red-400 transition-colors">remover</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── settings panel (saves to Supabase) ──────────────────────────────────────

function SettingsPanel({ settings, referencia, blocks, onSaved, onCancel }: {
  settings: PortalSettings
  referencia: string
  blocks: Block[]
  onSaved: (newSettings: PortalSettings) => void
  onCancel: () => void
}) {
  const DEFAULT_GUIA_LINKS = {
    blogUrl: 'https://www.rlprod.pt/blog-list1',
    fotosSelecaoUrl: 'https://tally.so/r/448PrO',
    fotosVerMaisUrl: '',
    fotosConvidadosUrl: 'https://tally.so/r/w56N86',
    dadosContratoUrl: '/contrato-cps/batizado',
    pagamentosRegistoUrl: 'https://tally.so/r/A72PQB',
  }
  const [form, setForm] = useState({ hiddenNav: [] as string[], ...settings, guiaLinks: { ...DEFAULT_GUIA_LINKS, ...(settings.guiaLinks ?? {}) } })
  const [saving, setSaving] = useState(false)
  const navPages = findAllChildPages(blocks)

  function toggleNav(id: string) {
    setForm(prev => ({
      ...prev,
      hiddenNav: (prev.hiddenNav ?? []).includes(id)
        ? (prev.hiddenNav ?? []).filter(x => x !== id)
        : [...(prev.hiddenNav ?? []), id],
    }))
  }

  function setActive(id: string) {
    setForm(prev => ({ ...prev, activeNavId: prev.activeNavId === id ? '' : id }))
  }

  async function save() {
    setSaving(true)
    await fetch('/api/portais', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia, updates: { settings: form } }),
    })
    setSaving(false)
    onSaved(form)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gold/20">
        <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
        <span className="text-xs text-gold/70 tracking-widest uppercase mr-auto">Configurações do Portal</span>
        <button onClick={onCancel} className="px-3 py-1.5 text-xs border border-white/15 rounded-lg text-white/40 hover:text-white/70">Cancelar</button>
        <button onClick={save} disabled={saving} className="px-4 py-1.5 text-xs bg-gold/20 border border-gold/40 rounded-lg text-gold hover:bg-gold/30 disabled:opacity-50">
          {saving ? 'A guardar...' : '✓ Guardar'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-[10px] text-white/40 tracking-widest uppercase mb-1">Nome da Criança</label>
          <input
            value={form.nomeCrianca ?? ''}
            onChange={e => setForm(prev => ({ ...prev, nomeCrianca: e.target.value }))}
            placeholder="ex: MARIA"
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20"
          />
        </div>
        {(['noiva','noivo','dataFormatada','data','local'] as const).map((k) => {
          const labels: Record<string, string> = { noiva: 'Nome (Mãe/Pai 1)', noivo: 'Nome (Mãe/Pai 2)', dataFormatada: 'Data do Batizado', data: 'Data (para contagem)', local: 'Local' }
          const placeholders: Record<string, string> = { noiva: 'ex: ANA', noivo: 'ex: PEDRO', dataFormatada: 'ex: 25 de setembro de 2026', data: 'ex: 2026-09-25', local: 'ex: QUINTA DO BATIZADO' }
          return (
            <div key={k}>
              <label className="block text-[10px] text-white/40 tracking-widest uppercase mb-1">{labels[k]}</label>
              <input value={(form[k] as string) ?? ''} onChange={e => setForm(prev => ({ ...prev, [k]: e.target.value }))}
                placeholder={placeholders[k]}
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20" />
            </div>
          )
        })}
        <div>
          <label className="block text-[10px] text-white/40 tracking-widest uppercase mb-1">Referência do Evento</label>
          <input value={form.referencia ?? ''} onChange={e => setForm(prev => ({ ...prev, referencia: e.target.value }))}
            placeholder="ex: BAT_001_26_RL"
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20" />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 tracking-widest uppercase mb-1">Email da Família</label>
          <input type="email" value={form.emailNoiva ?? ''} onChange={e => setForm(prev => ({ ...prev, emailNoiva: e.target.value }))}
            placeholder="ex: familia@email.com"
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20" />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 tracking-widest uppercase mb-1">Valor Total do Contrato (€)</label>
          <input type="number" value={form.valorTotal ?? ''} onChange={e => setForm(prev => ({ ...prev, valorTotal: e.target.value ? Number(e.target.value) : undefined }))}
            placeholder="ex: 1600"
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {([['Valor Fotografia (€)', 'valorFoto', 'ex: 750'], ['Valor Vídeo (€)', 'valorVideo', 'ex: 850'], ['Valor Extras (€)', 'valorExtras', 'ex: 0']] as const).map(([lbl, key, ph]) => (
            <div key={key}>
              <label className="block text-[10px] text-white/40 tracking-widest uppercase mb-1">{lbl}</label>
              <input type="number" value={(form as any)[key] ?? ''} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder={ph}
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20" />
            </div>
          ))}
        </div>

        {/* Portal Password */}
        <div className="pt-3 border-t border-white/[0.06]">
          <p className="text-[10px] text-white/40 tracking-widest uppercase mb-2">Password do Portal</p>
          <input
            type="text"
            value={form.portalPassword ?? ''}
            onChange={e => setForm(prev => ({ ...prev, portalPassword: e.target.value }))}
            placeholder="Deixar vazio = sem password"
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-white/25 placeholder:text-white/20"
          />
          <p className="text-[9px] text-white/20 mt-1 tracking-wide">A password é pedida ao abrir o portal</p>
        </div>

        {/* Guia Links */}
        <div className="pt-3 border-t border-white/[0.06]">
          <p className="text-[10px] text-white/40 tracking-widest uppercase mb-3">Links do Guia da Família</p>
          <div className="space-y-2">
            {([
              ['Blog', 'blogUrl', 'https://...'],
              ['Formulário Seleção de Fotos', 'fotosSelecaoUrl', 'https://tally.so/...'],
              ['Ver Mais (sub-página Fotografias)', 'fotosVerMaisUrl', 'https://...'],
              ['Fotos Convidados', 'fotosConvidadosUrl', 'https://tally.so/...'],
              ['Dados para Contrato', 'dadosContratoUrl', '/contrato-cps/batizado'],
              ['Pagamentos / Registo', 'pagamentosRegistoUrl', 'https://tally.so/...'],
            ] as const).map(([lbl, key, ph]) => (
              <div key={key}>
                <label className="block text-[10px] text-white/40 tracking-widest uppercase mb-1">{lbl}</label>
                <input value={form.guiaLinks?.[key] ?? ''} onChange={e => setForm(prev => ({ ...prev, guiaLinks: { ...prev.guiaLinks, [key]: e.target.value } }))}
                  placeholder={ph}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20" />
              </div>
            ))}
          </div>
        </div>

        {/* Parceiros */}
        <div className="pt-3 border-t border-white/[0.06]">
          <p className="text-[10px] text-white/40 tracking-widest uppercase mb-3">Parceiros de Confiança</p>
          <div className="space-y-3">
            {(form.parceiros ?? []).map((p, i) => (
              <div key={i} className="flex gap-2 items-start p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex-1 space-y-2">
                  <PhotoField label={`Parceiro ${i+1} — Imagem`} value={p.imageUrl}
                    onChange={url => setForm(prev => { const arr = [...(prev.parceiros ?? [])]; arr[i] = { ...arr[i], imageUrl: url }; return { ...prev, parceiros: arr } })}
                    onClear={() => setForm(prev => { const arr = [...(prev.parceiros ?? [])]; arr[i] = { ...arr[i], imageUrl: '' }; return { ...prev, parceiros: arr } })} />
                  <input value={p.url ?? ''} onChange={e => setForm(prev => { const arr = [...(prev.parceiros ?? [])]; arr[i] = { ...arr[i], url: e.target.value }; return { ...prev, parceiros: arr } })}
                    placeholder="URL do site do parceiro"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20" />
                </div>
                <button onClick={() => setForm(prev => ({ ...prev, parceiros: (prev.parceiros ?? []).filter((_,j) => j !== i) }))}
                  className="mt-1 text-white/20 hover:text-red-400 transition-colors text-lg leading-none" title="Remover">✕</button>
              </div>
            ))}
            <button onClick={() => setForm(prev => ({ ...prev, parceiros: [...(prev.parceiros ?? []), { imageUrl: '', url: '' }] }))}
              className="w-full py-2 rounded-xl border border-dashed border-gold/20 text-gold/40 hover:text-gold/70 hover:border-gold/40 text-xs tracking-widest transition-all">
              + ADICIONAR PARCEIRO
            </button>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div>
        <p className="text-[10px] text-white/40 tracking-widest uppercase mb-3">Fotografias</p>
        <div className="space-y-4">
          <PhotoField label="Cabeçalho das Sub-páginas (todas)" value={form.subpageHeaderUrl ?? ''}
            onChange={url => setForm(prev => ({ ...prev, subpageHeaderUrl: url }))}
            onClear={() => setForm(prev => ({ ...prev, subpageHeaderUrl: '' }))} />
          <PhotoField label="Imagem de Fundo (Hero)" value={form.heroImageUrl ?? ''}
            onChange={url => setForm(prev => ({ ...prev, heroImageUrl: url }))}
            onClear={() => setForm(prev => ({ ...prev, heroImageUrl: '' }))} />
          {[0, 1, 2].map(i => (
            <PhotoField key={i} label={`Galeria — Foto ${i + 1}`} value={form.galleryUrls?.[i] ?? ''}
              onChange={url => { const urls = [...(form.galleryUrls ?? ['', '', ''])]; urls[i] = url; setForm(prev => ({ ...prev, galleryUrls: urls })) }}
              onClear={() => { const urls = [...(form.galleryUrls ?? ['', '', ''])]; urls[i] = ''; setForm(prev => ({ ...prev, galleryUrls: urls })) }} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] text-white/40 tracking-widest uppercase mb-3">Menu de Navegação</p>
        <div className="rounded-xl border border-white/10 overflow-hidden divide-y divide-white/[0.04]">
          {navPages.map(page => {
            const isHidden = form.hiddenNav.includes(page.id)
            const isActive = form.activeNavId === page.id
            return (
              <div key={page.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`text-sm flex-1 uppercase tracking-wide ${isHidden ? 'line-through text-white/25' : 'text-white/70'}`}>{page.title}</span>
                <button onClick={() => setActive(page.id)} title="Marcar como passo actual"
                  className={`text-[10px] px-2 py-0.5 rounded border transition-all ${isActive ? 'border-gold/50 bg-gold/20 text-gold' : 'border-white/10 text-white/25 hover:border-gold/30'}`}>
                  activo
                </button>
                <button onClick={() => toggleNav(page.id)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${isHidden ? 'bg-white/10' : 'bg-gold/50'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isHidden ? 'left-0.5' : 'left-4'}`} />
                </button>
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-white/20 mt-2">Toggle = visível/oculto. "Activo" = destaque dourado no botão.</p>
      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function PortalRefPage() {
  const params = useParams()
  const referencia = decodeURIComponent(params.referencia as string)

  const [blocks, setBlocks] = useState<Block[]>([])
  const [settings, setSettings] = useState<PortalSettings>({ hiddenNav: [] })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const [error, setError] = useState('')
  const [heroEdit, setHeroEdit] = useState<{ field: 'nomeCrianca' | 'noiva' | 'noivo' | 'hero' | null; value: string }>({ field: null, value: '' })
  const [heroSaving, setHeroSaving] = useState(false)
  const [heroUploadProgress, setHeroUploadProgress] = useState<number | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [checkingPassword, setCheckingPassword] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Batizado puro: nenhum patch de texto. (No portal-cliente há um patch
  // para forçar 'casamento' nos textos genéricos do Notion. Aqui não
  // queremos isso — o Notion template de batizado já vem com a linguagem
  // correcta.)

  const loadBlocks = useCallback(async (bust = false) => {
    const url = bust ? `/api/portais-clientes?id=${PAGE_ID}&bust=1` : `/api/portais-clientes?id=${PAGE_ID}`
    const d = await fetch(url).then(r => r.json())
    if (d.error) setError(d.error)
    else setBlocks(d.blocks ?? [])
  }, [])

  const loadSettings = useCallback(async () => {
    // Carrega EM PARALELO o portal da família (Supabase) e o template-mestre
    // (Notion via portal_template_settings) para usar template como
    // FALLBACK nos campos visuais. Tudo o que é específico da família
    // (identidade, valores, estado das entregas, mensagens, URLs das
    // galerias, password) continua a vir só do portal individual.
    const [d, templateD, evD] = await Promise.all([
      fetch(`/api/portais?ref=${encodeURIComponent(referencia)}`).then(r => r.json()),
      fetch(`/api/portais-clientes?id=${PAGE_ID}&bust=1`).then(r => r.json()).catch(() => null),
      fetch(`/api/evento-by-ref?ref=${encodeURIComponent(referencia)}`).then(r => r.json()).catch(() => null),
    ])
    if (d.portal?.settings) {
      const ps: any = { ...d.portal.settings }
      const tmpl: any = templateD?.settings ?? {}

      // Estado das Entregas — fonte de verdade é o EVENTO (admin edita em
      // /eventos-2026). Sobrepõe os estados do evento às definições do portal
      // para manter o card de entregas sempre sincronizado (inclui portais
      // já ativos, sem precisar de re-guardar no admin).
      const ev: any = evD?.evento ?? {}
      if (ev.sel_fotos_estado != null)    ps.sel_fotos_estado    = ev.sel_fotos_estado
      if (ev.video_estado != null)        ps.video_estado        = ev.video_estado
      if (ev.fotos_edicao_estado != null) ps.fotos_edicao_estado = ev.fotos_edicao_estado
      if (ev.album_estado != null)        ps.album_estado        = ev.album_estado

      // Regra: assim que o dia do evento passa, a Seleção de Fotos passa
      // automaticamente para "Em Seleção" (a menos que já tenha um estado
      // definido pelo admin — Em Edição, Entregue, etc.).
      if (ev.data_evento) {
        const evDate = new Date(ev.data_evento)
        const today = new Date(); today.setHours(0, 0, 0, 0)
        evDate.setHours(0, 0, 0, 0)
        const passou = !isNaN(evDate.getTime()) && evDate.getTime() < today.getTime()
        const cur = String(ps.sel_fotos_estado ?? '').trim().toLowerCase()
        if (passou && (cur === '' || cur === 'aguardar' || cur === 'aguarda')) {
          ps.sel_fotos_estado = 'Em Seleção'
        }
      }

      const useTemplateIfEmpty = (campo: string) => {
        const cur = ps[campo]
        const isEmpty =
          cur === undefined || cur === null || cur === '' ||
          (Array.isArray(cur) && cur.length === 0)
        if (isEmpty && tmpl[campo] !== undefined && tmpl[campo] !== null && tmpl[campo] !== '') {
          ps[campo] = tmpl[campo]
        }
      }

      // Fotos globais
      useTemplateIfEmpty('heroImageUrl')
      useTemplateIfEmpty('subpageHeaderUrl')
      // pageHeaders: merge (override pessoal vence)
      if (tmpl.pageHeaders && typeof tmpl.pageHeaders === 'object') {
        ps.pageHeaders = { ...(tmpl.pageHeaders ?? {}), ...(ps.pageHeaders ?? {}) }
      }
      useTemplateIfEmpty('parceiros')
      // guiaLinks: merge (defaults do template; portal vence)
      if (tmpl.guiaLinks && typeof tmpl.guiaLinks === 'object') {
        ps.guiaLinks = { ...(tmpl.guiaLinks ?? {}), ...(ps.guiaLinks ?? {}) }
      }
      useTemplateIfEmpty('designPremiumPages')
      // Galleria (fotos da home do template)
      useTemplateIfEmpty('galleryUrls')

      setSettings(ps)
    }
    const hp = d.portal?.hasPassword ?? false
    setHasPassword(hp)
    const adminFlag = sessionStorage.getItem(`portalAdmin_${referencia}`)
    const isAdminSession = adminFlag === 'true'
    if (hp && !isAdminSession) {
      const stored = sessionStorage.getItem(`portalAuth_${referencia}`)
      if (stored === 'true') setAuthenticated(true)
    } else {
      setAuthenticated(true)
    }
  }, [referencia])

  const searchParamsHook = useSearchParams()

  useEffect(() => {
    Promise.all([loadBlocks(), loadSettings()]).finally(() => setLoading(false))
    // Check admin: URL param ?admin=1 OR sessionStorage flag
    const fromUrl = searchParamsHook?.get('admin') === '1'
    const fromSession = sessionStorage.getItem(`portalAdmin_${referencia}`) === 'true'
    if (fromUrl || fromSession) {
      setIsAdmin(true)
      sessionStorage.setItem(`portalAdmin_${referencia}`, 'true')
    }
  }, [loadBlocks, loadSettings, referencia, searchParamsHook])

  // ── Gate de sessão dos pais (tab-scoped) ─────────────────────────────────
  //   Mesmo com cookie `nv_session` válido, exige que este TAB tenha
  //   passado pelo /login-noivos (sessionStorage 'nv_active'). Se ela
  //   fechou o tab/janela, o flag desaparece e a próxima visita força
  //   novo login — independente do cookie ainda estar tecnicamente vivo.
  //   Admins (rl_auth ou ?admin=1) bypassam SEM precisar de login.
  useEffect(() => {
    const adminViaUrl = searchParamsHook?.get('admin') === '1'
    let adminViaSession = false
    try { adminViaSession = sessionStorage.getItem(`portalAdmin_${referencia}`) === 'true' } catch {}
    if (isAdmin || adminViaUrl || adminViaSession) return

    let active = false
    try { active = sessionStorage.getItem('nv_active') === '1' } catch {}
    if (!active) {
      // limpa o cookie do servidor para evitar resíduos e redireciona
      fetch('/api/noivos-auth', { method: 'DELETE', credentials: 'include' })
        .catch(() => {})
        .finally(() => {
          window.location.href = `/login-batizado?next=${encodeURIComponent(window.location.pathname)}`
        })
    }
  }, [isAdmin, referencia, searchParamsHook])

  // ── Heartbeat de sessão dos pais ──────────────────────────────────────────
  //    Cada GET /api/noivos-auth válido renova o cookie nv_session por
  //    mais 10 min (sliding window) ENQUANTO o tab está aberto.
  useEffect(() => {
    if (isAdmin) return
    let canceled = false
    let initialized = false
    async function ping(redirectOnFail: boolean) {
      if (document.visibilityState !== 'visible') return
      try {
        const r = await fetch('/api/noivos-auth', { cache: 'no-store', credentials: 'include' })
        if (canceled) return
        const j = await r.json().catch(() => ({}))
        if (!j?.ok) {
          if (redirectOnFail && initialized) {
            window.location.href = `/login-batizado?next=${encodeURIComponent(window.location.pathname)}`
          }
          return
        }
        initialized = true
        // Marca presença na referencia actual (para dashboard admin)
        fetch('/api/noivos-presence', { method: 'POST', credentials: 'include', body: '{}', keepalive: true }).catch(() => {})
      } catch { /* offline */ }
    }
    ping(false)
    const iv = setInterval(() => ping(true), 3 * 60 * 1000)
    const onVis = () => { if (document.visibilityState === 'visible') ping(true) }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      canceled = true
      clearInterval(iv)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [referencia, isAdmin])

  async function saveSettings(newSettings: PortalSettings) {
    await fetch('/api/portais', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia, updates: { settings: newSettings } }),
    })
  }

  async function handleSaved(newSettings?: PortalSettings) {
    if (newSettings) {
      setSettings(newSettings)
      setEditing(false)
    } else {
      setEditingContent(false)
      await loadBlocks(true)
    }
  }

  async function saveHeroField() {
    if (!heroEdit.field) return
    setHeroSaving(true)
    const patch: Partial<PortalSettings> =
      heroEdit.field === 'nomeCrianca' ? { nomeCrianca: heroEdit.value } :
      heroEdit.field === 'noiva' ? { noiva: heroEdit.value } :
      heroEdit.field === 'noivo' ? { noivo: heroEdit.value } :
      { heroImageUrl: heroEdit.value }
    const newSettings = { ...settings, ...patch }
    await saveSettings(newSettings)
    setSettings(newSettings)
    setHeroEdit({ field: null, value: '' })
    setHeroSaving(false)
  }

  async function handlePasswordSubmit() {
    if (!passwordInput.trim()) return
    setCheckingPassword(true)
    setPasswordError(false)
    try {
      const res = await fetch('/api/portais-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia, password: passwordInput }),
      })
      const d = await res.json()
      if (d.ok) {
        sessionStorage.setItem(`portalAuth_${referencia}`, 'true')
        setAuthenticated(true)
      } else {
        setPasswordError(true)
      }
    } catch {
      setPasswordError(true)
    } finally {
      setCheckingPassword(false)
    }
  }

  // Avoid unused-warnings on values that are saved indirectly via Atmosphère
  void heroEdit; void heroSaving; void heroUploadProgress; void saveHeroField

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-white/20 tracking-widest uppercase">A carregar portal...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-400/60 text-sm">{error}</p>
    </div>
  )

  if (hasPassword && !authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div>
            <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase mb-3">RL PHOTO.VIDEO</p>
            <h1 className="font-cormorant font-light text-4xl text-white mb-2 tracking-[0.15em] uppercase">Portal Privado</h1>
            <p className="font-cormorant italic text-white/30 text-base">Introduz a tua password para continuar</p>
          </div>
          <div className="space-y-3">
            <input
              autoFocus
              type="password"
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setPasswordError(false) }}
              onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="••••••••"
              className={`w-full bg-white/[0.04] border rounded-xl px-4 py-3.5 text-white text-center text-lg tracking-widest outline-none transition-all ${passwordError ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-white/30'}`}
            />
            {passwordError && (
              <p className="text-xs text-red-400/70 tracking-widest">Password incorreta</p>
            )}
            <button
              onClick={handlePasswordSubmit}
              disabled={checkingPassword || !passwordInput.trim()}
              className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all disabled:opacity-40"
            >
              {checkingPassword ? 'A verificar...' : 'Entrar'}
            </button>
          </div>
          <div className="flex justify-center">
            <span className="text-white/10 text-2xl">♡</span>
          </div>
        </div>
      </div>
    )
  }

  // ── edit modes ──────────────────────────────────────────────────────────────
  if (editing) return (
    <main className="min-h-screen px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <button onClick={() => setEditing(false)} className="text-xs text-white/30 hover:text-white/60 mb-6 flex items-center gap-1">
        ‹ voltar ao portal
      </button>
      <SettingsPanel
        settings={settings}
        referencia={referencia}
        blocks={blocks}
        onSaved={handleSaved}
        onCancel={() => setEditing(false)}
      />
    </main>
  )

  if (editingContent) return (
    <main className="min-h-screen px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <button onClick={() => setEditingContent(false)} className="text-xs text-white/30 hover:text-white/60 mb-6 flex items-center gap-1">
        ‹ voltar ao portal
      </button>
      <BlockEditor blocks={blocks} pageId={PAGE_ID} settings={settings} settingsBlockId={null} onSaved={() => handleSaved()} />
    </main>
  )


  // ── portal view (Atmosphère + Atelier reskin) ─────────────────────────────
  const subPagesList = findAllChildPages(blocks)
  const welcomeText = findWelcomeText(blocks)

  return (
    <>
      {/* Admin bar — só visível para o admin (botões de editar/configurar) */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-[80] flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-white/5">
          <Link href="/portais-clientes" className="text-[10px] tracking-widest text-white/25 hover:text-white/50 transition-colors uppercase">
            ‹ Portais
          </Link>
          <div className="flex gap-2">
            <button onClick={() => setEditingContent(true)} className="text-[10px] px-2.5 py-1 border border-white/10 rounded text-white/30 hover:text-white/60 hover:border-white/20 transition-all uppercase tracking-wider">
              Editar Conteúdo
            </button>
            <button onClick={() => setEditing(true)} className="text-[10px] px-2.5 py-1 border border-gold/20 rounded text-gold/50 hover:text-gold hover:border-gold/40 transition-all uppercase tracking-wider">
              ✎ Configurar
            </button>
          </div>
        </div>
      )}

      {/* Botão Sair (esconde para admin) */}
      <NoivosLogoutButton referencia={referencia} isAdmin={isAdmin} />

      <AtmospherePortal
        data={{
          tipo:        PORTAL_TIPO,
          coupleLabel: COUPLE_LABEL,
          // Em batizado, usamos nomeCrianca como o nome principal mostrado;
          // se vazio, fallback para "noiva" (nome da mãe/pai 1) — manter
          // compatibilidade com portais antigos.
          noiva:     settings.nomeCrianca || settings.noiva,
          noivo:     settings.noivo,
          dataIso:   settings.data ?? null,
          dataLabel: settings.dataFormatada ?? null,
          referencia: settings.referencia ?? referencia,
          heroImageUrl: settings.heroImageUrl ?? null,
          welcomeHeading:    welcomeText.heading
            ? welcomeText.heading.replace(/\bvosso\b/i, m => `<em>${m}</em>`)
            : undefined,
          welcomeParagraphs: welcomeText.paragraphs,
          galleryUrls: settings.galleryUrls,
          subPages:    subPagesList,
          hiddenNav:   settings.hiddenNav,
          activeNavId: settings.activeNavId ?? null,
          pageTitles:  settings.pageTitles,
          portalRefForLinks: referencia,
          hasTasks:    (settings.tasks ?? []).length > 0,
          deliveries:  buildDeliveriesFromSettings(settings),
          noivosNotifications: settings.noivos_notifications ?? [],
        }}
        callbacks={{}}
      />
    </>
  )
}
