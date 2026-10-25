'use client'

import { useCallback, useEffect, useState } from 'react'
import type { RMPageContent, RMPackage, RMProposta } from '../RMLeadPageClient'
import EstiloRLProd from '@/app/media/_components/EstiloRLProd'
import { FUNDO } from '@/app/media/_lib/estilo'

// ─── Comprime imagem no browser → base64 JPEG ────────────────────────────────
function compressImage(file: File, maxWidth = 1400, quality = 0.80): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let w = img.width, h = img.height
      if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas')); return }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

// ─── Embed helper ─────────────────────────────────────────────────────────────
function toEmbedUrl(url: string): string | null {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`
  // Vídeos não listados (vimeo.com/ID/HASH): sem o h=HASH só abrem para quem tem sessão no Vimeo
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([0-9a-f]{6,}))?/)
  const vh = vm?.[2] ?? url.match(/[?&]h=([0-9a-f]+)/)?.[1]
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?title=0&byline=0&portrait=0${vh ? `&h=${vh}` : ''}`
  if (url.includes('/embed/') || url.includes('player.vimeo')) return url
  return null
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_PACKAGES: RMPackage[] = [
  {
    titulo: 'Essencial',
    descricao: 'Produção focada e objetiva para uma peça de comunicação impactante.',
    itens: ['1 dia de produção (8h)','1 vídeo final (até 3 min)','Correção de cor profissional','Sound design + música licenciada','1 ronda de revisões','Entrega digital em 15 dias úteis'],
    preco: 'Sob consulta',
  },
  {
    titulo: 'Profissional',
    descricao: 'Produção completa com cortes adaptados para múltiplas plataformas.',
    itens: ['2 dias de produção','1 vídeo principal (até 5 min)','3 cortes para redes sociais (16:9, 9:16, 1:1)','Pós-produção premium + motion graphics','2 rondas de revisões','Música premium licenciada','Entrega em 21 dias úteis'],
    preco: 'Sob consulta',
  },
  {
    titulo: 'Estratégico',
    descricao: 'Estratégia de conteúdo completa para uma presença de marca consistente.',
    itens: ['Sessão de estratégia + moodboard','3+ dias de produção','Vídeo institucional + série de conteúdos','Pós-produção premium + efeitos visuais','Copywriting integrado','Revisões ilimitadas','Calendário editorial de publicação','Entrega faseada'],
    preco: 'Sob consulta',
  },
]

const DEFAULT_PLANO: { titulo: string; texto: string }[] = [
  { titulo: 'Definir a Visão Estratégica',        texto: 'Começamos por explorar em conjunto o potencial único da marca. Vamos identificar oportunidades e definir um caminho claro para melhorar a presença visual no mercado.' },
  { titulo: 'Alinhar a Narrativa e Storytelling', texto: 'Mergulhamos na essência da marca para desenvolver uma narrativa visual autêntica para se conectar naturalmente com o público.' },
  { titulo: 'Acompanhamento Contínuo',            texto: 'Por fim, desenvolvemos em conjunto um plano de produção personalizado para elevar a comunicação a um novo patamar, para potenciar o crescimento da Marca e fortalecer genuinamente a ligação com o público.' },
]

const DEFAULT_INCLUIDO = [
  'Planeamento estratégico',
  'Gestor de conta dedicado à tua Marca',
  'Desenvolvimento da Narrativa & Storytelling',
  'Produção de fotografias e vídeos personalizado',
  'Edição de fotografias e vídeos personalizado e website',
  'Acompanhamento contínuo durante todo o projeto',
]

function merge(saved: any): RMPageContent {
  const d: RMPageContent = {
    hero:    { titulo: 'Reunião Marcada', subtitulo: 'RL PROD · Photography & Video' },
    videos:  { label: '', titulo: '', urls: ['','',''] },
    proposta: {
      titulo: 'Proposta Criativa', intro: '', packages: DEFAULT_PACKAGES,
      propostaAtiva: 1, cta: 'Iniciar Produção', password: '',
      planoEtapas: DEFAULT_PLANO, incluido: DEFAULT_INCLUIDO,
      videoUrls: ['','',''], checkpointPergunta: 'Esta abordagem alinha-se com a visão da vossa marca?',
      slideImages: ['','','','','','','','','',''],
    },
    sobre:   { label: 'Quem Somos', titulo: 'RL PROD', texto: '' },
    propostas: [],
  }
  if (!saved) return d
  return {
    hero:    { ...d.hero,    ...(saved.hero    || {}) },
    videos:  { ...d.videos,  ...(saved.videos  || {}), urls: saved.videos?.urls || d.videos.urls },
    proposta: {
      ...d.proposta, ...(saved.proposta || {}),
      packages:           saved.proposta?.packages           || d.proposta.packages,
      propostaAtiva:      saved.proposta?.propostaAtiva      ?? 1,
      password:           saved.proposta?.password           || '',
      planoEtapas:        saved.proposta?.planoEtapas        || d.proposta.planoEtapas,
      incluido:           saved.proposta?.incluido           || d.proposta.incluido,
      videoUrls:          saved.proposta?.videoUrls          || d.proposta.videoUrls,
      checkpointPergunta: saved.proposta?.checkpointPergunta || d.proposta.checkpointPergunta,
      slideImages:        saved.proposta?.slideImages        || d.proposta.slideImages,
    },
    sobre:   { ...d.sobre,   ...(saved.sobre   || {}) },
    propostas: saved.propostas || [
      { titulo: 'Proposta 1', valor: '', servicos: [] },
      { titulo: 'Proposta 2', valor: '', servicos: [] },
      { titulo: 'Proposta 3', valor: '', servicos: [] },
    ],
  }
}

const COMO_FUNCIONA = [
  { n: '1', titulo: 'Briefing e Imersão',         desc: 'Recebemos o teu briefing, analisamos a marca, o mercado e a concorrência.' },
  { n: '2', titulo: 'Proposta',                   desc: 'Desenvolvemos a nossa proposta com uma visão completa e estratégica.' },
  { n: '3', titulo: 'Planeamento',                desc: 'Definimos como e quando tudo vai acontecer.' },
  { n: '4', titulo: 'Pré-Produção e Produção',    desc: 'Preparamos tudo para que não falte nada na captação de conteúdos.' },
  { n: '5', titulo: 'Edição',                     desc: 'Nesta fase, editamos o conteúdo que captámos.' },
  { n: '6', titulo: 'Aprovação',                  desc: 'Recebemos feedback aos conteúdos, fazemos ajustes e temos a tua validação.' },
  { n: '7', titulo: 'Entrega',                    desc: 'Garantimos que tens os conteúdos do teu lado, prontos a serem usados.' },
  { n: '8', titulo: 'Feedback e Resultados',      desc: 'Dás-nos o teu feedback sobre todo o percurso do projeto e analisamos o impacto.' },
]

// ─── Descrições dos serviços ──────────────────────────────────────────────────
// Chaves em minúsculas SEM acentos — a função getServDesc normaliza o input da mesma forma
const SERVICOS_DESC: Record<string, string> = {
  '1 reuniao':                              'Sessão de briefing e alinhamento com a equipa criativa para definir objetivos, visão e expectativas do projeto.',
  '2 reunioes':                             'Duas sessões de briefing e acompanhamento para garantir total alinhamento criativo ao longo de todo o projeto.',
  '1 dia de captacao':                      'Um dia completo de filmagem e/ou fotografia em locação, com equipamento profissional e equipa dedicada.',
  '2 dias de captacao':                     'Dois dias de produção em locação para projetos com maior escala ou diversidade de ambientes.',
  '3 dias de captacao':                     'Três dias de produção intensiva para campanhas abrangentes com múltiplos cenários e conteúdos.',
  '1 dia opcional':                         'Dia adicional de captação flexível, a agendar conforme as necessidades específicas do projeto.',
  'filmagem 4k':                            'Captação de vídeo em resolução 4K Ultra HD para máxima qualidade visual e flexibilidade total na pós-produção.',
  'drone':                                  'Captação aérea com drone profissional para perspetivas cinematográficas únicas e planos de grande escala.',
  'fotografia':                             'Sessão fotográfica profissional com seleção, retoque e entrega das imagens editadas em alta resolução.',
  '1 videografo':                           'Responsável por captar todos os momentos em detalhe, garantindo cobertura completa e narrativa visual coesa ao longo de todo o dia de produção.',
  '2 videografos':                          'Dois profissionais responsáveis por captar todos os momentos em detalhe em simultâneo, assegurando ângulos múltiplos e cobertura total sem perder nenhum instante.',
  '1 assistente':                           'Assistente de produção para apoio logístico, gestão de equipamento e fluidez operacional no set.',
  '2 assistentes':                          'Dois assistentes de produção para projetos de maior dimensão que requerem mais apoio operacional.',
  'diretor criativo':                       'Supervisão criativa de todo o projeto: conceito, narrativa visual, direção artística e consistência estética.',
  '1 fotografo':                            'Fotógrafo profissional dedicado à captação de imagens estáticas de alta qualidade ao longo do dia.',
  '2 fotografos':                           'Dois fotógrafos para cobertura abrangente e simultânea de diferentes momentos e perspetivas.',
  '1 editor':                               'Editor de vídeo dedicado à montagem, correção de cor, sound design e entrega final do projeto.',
  '1 video horizontal 1 min':               'Vídeo em formato 16:9 com duração até 1 minuto, ideal para exibição em websites, apresentações, feiras e ecrãs de TV.',
  '1 video horizontal 2 min':               'Vídeo em formato 16:9 com até 2 minutos, versátil para websites, exposição em feiras, ecrãs de TV e comunicação institucional.',
  '1 video horizontal 3 min':               'Vídeo em formato 16:9 com até 3 minutos, perfeito para storytelling aprofundado em websites, televisão e eventos de exposição.',
  '1 video vertical 59seg':                 'Vídeo em formato 9:16 com até 59 segundos para uso em social media, otimizado para Instagram Reels, TikTok e YouTube Shorts.',
  '1 video vertical 90seg':                 'Vídeo em formato 9:16 com até 90 segundos para social media, com máximo impacto e engagement em Instagram Reels e TikTok.',
  '1 video vertical 2min':                  'Vídeo em formato 9:16 com até 2 minutos para social media, ideal para histórias mais completas no feed vertical do Instagram e TikTok.',
  'direitos musicais':                      'Licenciamento de música profissional para uso comercial dos conteúdos, sem restrições de copyright ou direitos de autor.',
  'cedencia de fotografias uso media social':'Licença de utilização das imagens captadas para publicação em redes sociais e todos os meios digitais da marca.',
  'voz off estudio':                        'Gravação de locução profissional em estúdio para narração do vídeo, com seleção de voz, dicção e masterização de áudio.',
}

// Remove acentos e normaliza para comparação — resolve diferenças entre "Videógrafo" e "videografo"
function normalizeKey(s: string): string {
  return s.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function getServDesc(nome: string): string {
  return SERVICOS_DESC[normalizeKey(nome)] || ''
}

const EDITABLE_SLIDES = [0, 1, 2, 3, 4, 5, 6]
const TOTAL_SLIDES = 11

const INP  = 'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-3 py-2 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6] transition-colors'
const AREA = INP + ' resize-none leading-relaxed'
const LBL  = 'rlp-m text-[9.5px] text-white/45 mb-1.5 block'

// Linguagem visual do portal da reunião (RMLeadPageClient)
const CARD    = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/75 backdrop-blur-sm'
const EYEBROW = 'rlp-m traco text-[10.5px] text-[#5a8bff]'
const BTN_PRI = 'rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] text-white font-medium transition-colors disabled:opacity-40'
const BTN_SEC = 'rounded-full border border-white/[0.16] hover:border-white/40 text-white/75 hover:text-white transition-colors disabled:opacity-40'
const PONTO   = <span className="text-[#5a8bff]">.</span>
// Contentor dos slides: 16px de margem no telemóvel
const WRAP    = 'w-full mx-auto px-4 sm:px-10 pt-10 sm:pt-16 pb-28'

// ─── Component ────────────────────────────────────────────────────────────────
export default function RMPropostaClient({ token, isAdmin }: { token: string; isAdmin: boolean }) {
  const [lead,     setLead]     = useState<Record<string, any> | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [content,  setContent]  = useState<RMPageContent | null>(null)

  const [unlocked, setUnlocked] = useState(false)
  const [pwInput,  setPwInput]  = useState('')
  const [pwError,  setPwError]  = useState(false)

  const [current,  setCurrent]  = useState(0)
  const [dir,      setDir]      = useState<1 | -1>(1)

  // ── Inline edit ────────────────────────────────────────────────────────────
  const [expandedServicos, setExpandedServicos] = useState<string[]>([])

  // ── Confirmação de proposta ────────────────────────────────────────────────
  type ConfirmStatus = 'idle' | 'form' | 'submitting' | 'aceite' | 'rejeitada'
  const [confirmStatus, setConfirmStatus] = useState<ConfirmStatus>('idle')
  const [confirmErr,    setConfirmErr]    = useState('')
  const [confirmForm,   setConfirmForm]   = useState({
    nome: '', email: '', telefone: '', nif: '', empresa: '',
    morada: '', data_evento: '', local_evento: '',
    proposta_escolhida: 'Proposta 1', observacoes: '',
  })

  async function submitConfirm(acao: 'aceite' | 'rejeitada') {
    if (acao === 'aceite') {
      if (!confirmForm.nome.trim() || !confirmForm.email.trim() || !confirmForm.telefone.trim()) {
        setConfirmErr('Por favor preenche Nome, Email e Telefone.')
        return
      }
    }
    setConfirmStatus('submitting')
    setConfirmErr('')
    try {
      const res = await fetch('/api/media-portal/confirm-proposta', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, acao, dados: confirmForm }),
      })
      if (!res.ok) throw new Error('Erro no servidor')
      setConfirmStatus(acao)
    } catch {
      setConfirmErr('Ocorreu um erro. Tenta novamente.')
      setConfirmStatus(acao === 'aceite' ? 'form' : 'idle')
    }
  }

  function toggleServico(key: string) {
    setExpandedServicos(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const [editingSlide, setEditingSlide] = useState<number | null>(null)
  const [draft,        setDraft]        = useState<RMPageContent['proposta'] | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [savedOk,      setSavedOk]      = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [uploadErr,    setUploadErr]    = useState(false)

  function startEdit(idx: number) {
    if (!content) return
    setDraft(JSON.parse(JSON.stringify(content.proposta)))
    setEditingSlide(idx)
    setSavedOk(false)
  }

  function cancelEdit() { setEditingSlide(null); setDraft(null) }

  async function saveEdit() {
    if (!content || !draft) return
    setSaving(true)
    const newContent: RMPageContent = { ...content, proposta: draft }
    try {
      await fetch('/api/media-portal/save-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, page_content: newContent }),
      })
      setContent(newContent)
      setSavedOk(true)
      setTimeout(() => { setEditingSlide(null); setDraft(null); setSavedOk(false) }, 900)
    } finally { setSaving(false) }
  }

  async function handleImageFile(file: File, idx: number) {
    if (!draft) return
    setUploading(true)
    setUploadErr(false)
    try {
      const dataUrl = await compressImage(file)
      const imgs = [...(draft.slideImages || ['','','','','','',''])]
      imgs[idx] = dataUrl
      setDraft({ ...draft, slideImages: imgs })
    } catch {
      setUploadErr(true)
    } finally {
      setUploading(false)
    }
  }

  function setSlideImage(idx: number, val: string) {
    if (!draft) return
    const imgs = [...(draft.slideImages || ['','','','','','',''])]
    imgs[idx] = val
    setDraft({ ...draft, slideImages: imgs })
  }

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/media-portal/view?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.lead) { setNotFound(true); setLoading(false); return }
        const c = merge(data.lead.page_content)
        setLead(data.lead)
        setContent(c)
        if (typeof window !== 'undefined') {
          const stored = sessionStorage.getItem(`rm_proposta_${token}`)
          if (stored === c.proposta.password || !c.proposta.password || isAdmin) setUnlocked(true)
        }
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token, isAdmin])

  const goTo = useCallback((next: number) => {
    if (next < 0 || next >= TOTAL_SLIDES || editingSlide !== null) return
    setDir(next > current ? 1 : -1)
    setCurrent(next)
  }, [current, editingSlide])

  useEffect(() => {
    if (!unlocked) return
    const onKey = (e: KeyboardEvent) => {
      if (editingSlide !== null) return
      if (e.key === 'ArrowRight') goTo(current + 1)
      if (e.key === 'ArrowLeft')  goTo(current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [unlocked, current, goTo, editingSlide])

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (!content) return
    if (!content.proposta.password || pwInput === content.proposta.password) {
      sessionStorage.setItem(`rm_proposta_${token}`, pwInput)
      setUnlocked(true); setPwError(false)
    } else { setPwError(true); setPwInput('') }
  }

  const labelCls = 'rlp-m text-[10px] text-white/45'

  if (loading) return (
    <main className="rlp min-h-screen flex items-center justify-center bg-[#00141f] text-white">
      <EstiloRLProd />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />
      <p className="rlp-m relative z-10 text-[10.5px] text-[#a9c1ff] animate-pulse">A carregar...</p>
    </main>
  )
  if (notFound) return (
    <main className="rlp min-h-screen flex items-center justify-center bg-[#00141f] text-white">
      <EstiloRLProd />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />
      <p className="rlp-m relative z-10 text-[10.5px] text-white/50">Página não disponível</p>
    </main>
  )

  const { proposta } = content!
  const empresa = lead!.empresa || lead!.nome || ''

  // ── Cabeçalho de imagem do slide ───────────────────────────────────────────
  function SlideHeader({ idx }: { idx: number }) {
    const img = proposta.slideImages?.[idx]
    if (!img) return null
    return (
      <div className="relative w-full shrink-0 overflow-hidden h-[200px] sm:h-[300px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt=""
          className="w-full h-full object-cover object-center"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black 35%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 35%, transparent 100%)',
          }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,20,31,0.55) 0%, rgba(0,20,31,0.1) 60%, transparent 100%)' }} />
      </div>
    )
  }

  // ── Slide de Proposta (1, 2 ou 3) ─────────────────────────────────────────
  function PropostaSlide({ idx, propIdx }: { idx: number; propIdx: number }) {
    const prop: RMProposta = (content!.propostas || [])[propIdx] || { titulo: `Proposta ${propIdx + 1}`, valor: '', servicos: [] }
    const num = String(propIdx + 1).padStart(2, '0')

    return (
      <div className="flex flex-col h-full w-full">
        <SlideHeader idx={idx} />

        {/* ── Layout principal: dois painéis ── */}
        <div className={`${WRAP} max-w-6xl flex-1 flex flex-col`}>
          <p className={EYEBROW}>Investimento · Opção {num}</p>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] items-start">

            {/* Painel esquerdo — identidade + valor */}
            <div className={`${CARD} relative overflow-hidden p-6 sm:p-8 flex flex-col`}>
              <div className="absolute inset-x-0 top-0 h-[3px] bg-[#2e6cf6]" />
              <div className="flex items-start justify-between gap-4">
                <span className="rlp-t text-[56px] sm:text-[72px] leading-[0.85] text-[#2e6cf6]">{num}</span>
                <p className="rlp-m text-[9.5px] text-[#a9c1ff] mt-2">Opção {num}</p>
              </div>

              {/* Título */}
              <h2 className="rlp-t mt-6 text-[32px] sm:text-[40px] leading-[0.95] break-words">
                {prop.titulo}{PONTO}
              </h2>

              {/* Valor */}
              <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-col gap-2">
                <p className={labelCls}>Investimento</p>
                {prop.valor ? (
                  <p className="rlp-t text-[44px] sm:text-[56px] leading-none text-white break-words">
                    {prop.valor}
                  </p>
                ) : (
                  <p className="rlp-t text-[36px] leading-none text-white/30">—</p>
                )}
              </div>
            </div>

            {/* Painel direito — serviços */}
            <div className={`${CARD} p-5 sm:p-8 flex flex-col min-w-0`}>
              <p className="rlp-m traco text-[10px] text-[#5a8bff] mb-4 shrink-0">Serviços Incluídos</p>

              {prop.servicos.length > 0 ? (
                <div className="flex flex-col">
                  {prop.servicos.map((s, i) => {
                    const key  = `${propIdx}-${i}`
                    const open = expandedServicos.includes(key)
                    const desc = getServDesc(s)
                    return (
                      <div key={i} className="border-b border-white/[0.07] last:border-0">
                        {/* Linha principal */}
                        <div className="flex items-center gap-3 sm:gap-4 py-3.5">
                          <span className="rlp-m text-[10px] text-[#5a8bff] shrink-0 w-6 tabular-nums" style={{ letterSpacing: '0.1em' }}>{String(i + 1).padStart(2,'0')}</span>
                          <p className="text-[15px] sm:text-[16px] text-white/85 leading-snug flex-1 min-w-0 break-words">{s}</p>
                          {desc && (
                            <button
                              onClick={() => toggleServico(key)}
                              className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${open ? 'border-[#2e6cf6] bg-[#2e6cf6]/20 text-white' : 'border-white/[0.16] hover:border-[#2e6cf6] text-white/60 hover:text-white'}`}
                              style={{ fontSize: 16, lineHeight: 1, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.25s ease, border-color 0.2s, color 0.2s, background-color 0.2s' }}
                              title="Saber mais"
                            >+</button>
                          )}
                        </div>
                        {/* Descrição expandível */}
                        <div style={{
                          maxHeight: open ? 160 : 0,
                          overflow: 'hidden',
                          transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
                        }}>
                          <p className="text-[13.5px] text-white/55 leading-relaxed pb-4 pl-9 sm:pl-10 pr-2">{desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="rlp-m text-[10px] text-white/30">A definir</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Bloco de edição de imagem (usado em todos os slides) ──────────────────
  function ImageEditBlock({ idx }: { idx: number }) {
    if (!draft) return null
    const img = draft.slideImages?.[idx] || ''
    return (
      <div className="border-t border-white/[0.08] pt-5 mt-5">
        <label className={LBL}>Foto do Cabeçalho</label>

        {/* Upload por ficheiro */}
        <label className={`relative mb-3 flex items-center justify-center gap-2 w-full py-4 rounded-xl border border-dashed cursor-pointer transition-colors ${uploading ? 'border-white/10 text-white/30' : 'border-white/20 hover:border-[#2e6cf6] text-white/55 hover:text-white'}`}>
          <span style={{ fontSize: 16 }}>↑</span>
          <span className="rlp-m text-[10px]">
            {uploading ? 'A processar...' : 'Carregar imagem'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={uploading}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleImageFile(f, idx)
              e.target.value = ''
            }}
          />
        </label>

        {uploadErr && (
          <p className="mb-3 text-[12px] text-[#ff4747]">Erro ao processar imagem. Tenta novamente.</p>
        )}

        {/* URL manual */}
        <div className="mb-3">
          <label className={LBL}>Ou cole um URL</label>
          <input
            className={INP}
            placeholder="https://..."
            value={img.startsWith('data:') ? '' : img}
            onChange={e => setSlideImage(idx, e.target.value)}
          />
        </div>

        {/* Preview */}
        {img ? (
          <div className="relative overflow-hidden rounded-xl border border-white/[0.1]" style={{ height: 110 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,20,31,0.9) 100%)' }} />
            <button
              onClick={() => { setSlideImage(idx, ''); setUploadErr(false) }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-[#00141f]/80 hover:bg-[#00141f] text-white/70 hover:text-[#ff4747] text-[11px] border border-white/20 transition-colors"
            >✕</button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/[0.1] flex items-center justify-center" style={{ height: 50 }}>
            <p className="rlp-m text-[9.5px] text-white/30">Sem imagem</p>
          </div>
        )}
      </div>
    )
  }

  // ── PASSWORD GATE ──────────────────────────────────────────────────────────
  if (!unlocked) return (
    <main className="rlp min-h-screen flex flex-col items-center justify-center px-4 relative bg-[#00141f] text-white">
      <EstiloRLProd />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />
      <div className="relative z-10 w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="w-12 h-12 object-contain opacity-90 mb-4" />
          <p className={EYEBROW}>RL PROD · Photography & Video</p>
          <h1 className="rlp-t text-[44px] sm:text-[56px] leading-[0.9]">Proposta Criativa{PONTO}</h1>
          {empresa && <p className="rlp-t text-[20px] text-white/75 mt-1">{empresa}</p>}
        </div>
        <form onSubmit={handleUnlock} className={`${CARD} w-full flex flex-col gap-4 p-5 sm:p-6`}>
          <div>
            <label className={LBL}>Password de acesso</label>
            <input type="password" value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false) }}
              placeholder="Password de acesso" autoFocus
              className={`w-full rounded-md border bg-[#00141f]/70 px-3 py-3 text-[14px] text-white placeholder:text-white/30 focus:outline-none transition-colors ${pwError ? 'border-[#ff4747]/70' : 'border-white/[0.12] focus:border-[#2e6cf6]'}`}
            />
            {pwError && <p className="rlp-m mt-2 text-[9.5px] text-[#ff4747]">Password incorreta</p>}
          </div>
          <button type="submit" className={`${BTN_PRI} w-full py-3.5 text-[14px]`}>
            Aceder →
          </button>
        </form>
        <a href={`/rm/${token}`} className="rlp-m text-[10px] text-white/50 hover:text-white transition-colors">‹ Voltar ao Portal</a>
      </div>
    </main>
  )

  // ── FORMULÁRIO DE EDIÇÃO por slide ─────────────────────────────────────────
  function renderEditForm(idx: number) {
    if (!draft) return null

    // Bloco de imagem é comum a todos os slides
    const imgBlock = <ImageEditBlock idx={idx} />

    if (idx === 0) return (
      <div className="flex flex-col gap-1">
        <p className="text-[12px] text-white/35 leading-relaxed mb-4">
          O slide de capa usa o logo e o nome do cliente automaticamente.<br />Podes adicionar uma foto de fundo aqui em baixo.
        </p>
        {imgBlock}
      </div>
    )

    if (idx === 1) return (
      <div className="flex flex-col gap-6">
        {draft.planoEtapas.map((etapa, i) => (
          <div key={i} className="flex flex-col gap-3 pb-6 border-b border-white/[0.06] last:border-0 last:pb-0">
            <label className={LBL}>Etapa {i + 1} — Título</label>
            <input className={INP} value={etapa.titulo}
              onChange={e => { const n = [...draft.planoEtapas]; n[i] = { ...n[i], titulo: e.target.value }; setDraft({ ...draft, planoEtapas: n }) }}
            />
            <label className={LBL}>Etapa {i + 1} — Texto</label>
            <textarea rows={3} className={AREA} value={etapa.texto}
              onChange={e => { const n = [...draft.planoEtapas]; n[i] = { ...n[i], texto: e.target.value }; setDraft({ ...draft, planoEtapas: n }) }}
            />
          </div>
        ))}
        <div>
          <label className={LBL}>Frase final do slide</label>
          <textarea rows={2} className={AREA}
            value={(draft as any).planoFrase ?? 'Uma proposta desenvolvida com base nos objetivos da vossa marca. Foco em resultados, narrativa estratégica e produção de excelência do briefing à entrega final.'}
            onChange={e => setDraft({ ...draft, planoFrase: e.target.value } as any)}
          />
        </div>
        {imgBlock}
      </div>
    )

    if (idx === 2) return (
      <div className="flex flex-col gap-1">
        <p className="text-[12px] text-white/35 leading-relaxed mb-4">
          O slide "Como Funciona?" tem conteúdo fixo. Podes adicionar uma foto de cabeçalho.
        </p>
        {imgBlock}
      </div>
    )

    if (idx === 3) return (
      <div className="flex flex-col gap-3">
        <label className={LBL}>Itens incluídos — um por linha</label>
        <textarea rows={10} className={AREA}
          value={draft.incluido.join('\n')}
          onChange={e => setDraft({ ...draft, incluido: e.target.value.split('\n') })}
        />
        <p className="text-[11px] text-white/25">Cada linha torna-se um item com ✓</p>
        {imgBlock}
      </div>
    )

    if (idx === 4) return (
      <div className="flex flex-col gap-5">
        {draft.videoUrls.map((url, i) => {
          const valid = !!toEmbedUrl(url)
          return (
            <div key={i}>
              <label className={LBL}>Vídeo {i + 1} — URL (YouTube ou Vimeo)</label>
              <div className="relative">
                <input className={INP + ' pr-8'} placeholder="https://youtu.be/... ou https://vimeo.com/..." value={url}
                  onChange={e => { const n = [...draft.videoUrls]; n[i] = e.target.value; setDraft({ ...draft, videoUrls: n }) }}
                />
                {url && <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[13px] ${valid ? 'text-[#5a8bff]' : 'text-[#ff4747]'}`}>{valid ? '✓' : '✕'}</span>}
              </div>
            </div>
          )
        })}
        {imgBlock}
      </div>
    )

    if (idx === 5) return (
      <div className="flex flex-col gap-3">
        <label className={LBL}>Pergunta de reflexão</label>
        <textarea rows={4} className={AREA} value={draft.checkpointPergunta}
          onChange={e => setDraft({ ...draft, checkpointPergunta: e.target.value })}
        />
        {imgBlock}
      </div>
    )

    if (idx === 6) return (
      <div className="flex flex-col gap-3">
        <label className={LBL}>Texto do botão CTA</label>
        <input className={INP} value={draft.cta}
          onChange={e => setDraft({ ...draft, cta: e.target.value })}
        />
        {imgBlock}
      </div>
    )

    return imgBlock
  }

  // ── SLIDES ─────────────────────────────────────────────────────────────────
  const capaImg = proposta.slideImages?.[0]

  const slides = [

    // 0 — CAPA
    <div key={0} className="relative flex flex-col h-full w-full min-h-full">
      {capaImg && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={capaImg} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,20,31,0.94) 0%, rgba(0,20,31,0.6) 55%, rgba(0,20,31,0.3) 100%)' }} />
          <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: 'linear-gradient(to top, #00141f 0%, transparent 100%)' }} />
        </div>
      )}
      <div className={`${WRAP} relative max-w-6xl flex-1 flex flex-col justify-center gap-8`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="w-14 h-14 sm:w-16 sm:h-16 object-contain opacity-90" />
        <div className="flex flex-col">
          <p className="rlp-m traco text-[10.5px] sm:text-[11px] text-[#5a8bff]">RL PROD · Photography & Video</p>
          <h1 className="rlp-t mt-4 text-[58px] sm:text-[104px] leading-[0.86]">Proposta<br />Criativa{PONTO}</h1>
          {empresa && <p className="rlp-t mt-6 text-[24px] sm:text-[32px] text-white/85 break-words">{empresa}</p>}
          <p className="rlp-m mt-4 text-[10.5px] text-[#a9c1ff]">
            {new Date().toLocaleDateString('pt-PT', { day:'2-digit', month:'long', year:'numeric' })}
          </p>
        </div>
        <div className="mt-2 pt-6 border-t border-white/[0.1] max-w-xl leading-[0.95]">
          <p className="rlp-t text-[26px] sm:text-[36px] text-[#5a8bff]">More Than a Product,</p>
          <p className="rlp-t text-[26px] sm:text-[36px] text-white">An Experience.</p>
        </div>
      </div>
    </div>,

    // 1 — PLANO DE AÇÃO
    <div key={1} className="flex flex-col h-full w-full">
      <SlideHeader idx={1} />
      <div className={`${WRAP} max-w-6xl grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16`}>
        <div className="flex flex-col gap-6 lg:sticky lg:top-0 self-start">
          <p className={EYEBROW}>Plano de ação</p>
          <h2 className="rlp-t text-[40px] sm:text-[60px] leading-[0.92]">
            Plano de Ação<br />Personalizado<br />com 3 Etapas{PONTO}
          </h2>
          <p className="text-[15px] sm:text-[16px] text-white/60 leading-relaxed max-w-md">
            {(proposta as any).planoFrase ?? 'Uma proposta desenvolvida com base nos objetivos da vossa marca. Foco em resultados, narrativa estratégica e produção de excelência do briefing à entrega final.'}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {proposta.planoEtapas.map((etapa, i) => (
            <article key={i} className={`${CARD} p-5 sm:p-7 flex gap-5 sm:gap-7`}>
              <span className="rlp-t text-[44px] sm:text-[56px] leading-[0.85] text-[#2e6cf6] shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <div className="flex flex-col gap-2 min-w-0">
                <h3 className="rlp-t text-[22px] sm:text-[26px] leading-tight">{etapa.titulo}</h3>
                <p className="text-[15px] text-white/60 leading-relaxed">{etapa.texto}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>,

    // 2 — COMO FUNCIONA
    <div key={2} className="flex flex-col h-full w-full">
      <SlideHeader idx={2} />
      <div className={`${WRAP} max-w-6xl flex flex-col gap-8 sm:gap-10`}>
        <div className="flex flex-col gap-3">
          <p className={EYEBROW}>O processo</p>
          <h2 className="rlp-t text-[40px] sm:text-[60px] leading-[0.92]">Como Funciona?</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COMO_FUNCIONA.map((item, i) => (
            <article key={i} className={`${CARD} h-full p-5 sm:p-6 transition-colors hover:border-[#2e6cf6]/70 hover:bg-[#0c2236]/80`}>
              <span className="rlp-t text-[34px] leading-none text-[#2e6cf6]">{item.n.padStart(2, '0')}</span>
              <h3 className="rlp-t mt-4 text-[20px] sm:text-[22px] leading-tight">{item.titulo}</h3>
              <p className="mt-2 text-[14px] text-white/60 leading-relaxed">{item.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </div>,

    // 3 — O QUE ESTÁ INCLUÍDO
    <div key={3} className="flex flex-col h-full w-full">
      <SlideHeader idx={3} />
      <div className={`${WRAP} max-w-5xl flex flex-col gap-8 sm:gap-10`}>
        <div className="flex flex-col gap-3">
          <p className={EYEBROW}>Incluído</p>
          <h2 className="rlp-t text-[40px] sm:text-[60px] leading-[0.92]">O Que Está Incluído?</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {proposta.incluido.map((item, i) => (
            <div key={i} className={`${CARD} flex items-start gap-4 p-4 sm:p-5`}>
              <span className="shrink-0 w-7 h-7 rounded-full bg-[#2e6cf6] flex items-center justify-center text-[13px] text-white">✓</span>
              <p className="rlp-t text-[18px] sm:text-[20px] leading-snug pt-0.5 min-w-0 break-words">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>,

    // 4 — VÍDEOS
    <div key={4} className="flex flex-col h-full w-full">
      <SlideHeader idx={4} />
      <div className={`${WRAP} max-w-6xl flex flex-col gap-8 sm:gap-10`}>
        <div className="flex flex-col gap-3">
          <p className={EYEBROW}>Portfólio</p>
          <h2 className="rlp-t text-[40px] sm:text-[60px] leading-[0.92]">O Nosso Trabalho{PONTO}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {proposta.videoUrls.map((url, i) => {
            const embed = toEmbedUrl(url)
            const span = i === 0 ? 'sm:col-span-2' : ''
            if (embed) return (
              <div key={i} className={`${span} rounded-2xl overflow-hidden border border-white/[0.1] bg-[#00141f] w-full`} style={{ aspectRatio:'16/9' }}>
                <iframe src={embed} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
              </div>
            )
            return (
              <div key={i} className={`${span} rounded-2xl border border-dashed border-white/[0.12] bg-[#00141f]/50 flex items-center justify-center`} style={{ aspectRatio:'16/9' }}>
                <p className="rlp-m text-[10px] text-white/30">Vídeo {i + 1}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>,

    // 5 — CHECKPOINT
    <div key={5} className="flex flex-col h-full w-full">
      <SlideHeader idx={5} />
      <div className={`${WRAP} max-w-4xl flex-1 flex flex-col justify-center gap-8`}>
        <div className="flex flex-col gap-3">
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">A Tua Opinião</p>
          <h2 className="rlp-t text-[44px] sm:text-[72px] leading-[0.9]">Momento de<br />Reflexão{PONTO}</h2>
        </div>
        <div className={`${CARD} relative overflow-hidden p-6 sm:p-10`}>
          <div className="absolute inset-y-0 left-0 w-[3px] bg-[#2e6cf6]" />
          <p className="text-[20px] sm:text-[26px] font-light text-white/85 leading-snug">{proposta.checkpointPergunta}</p>
        </div>
      </div>
    </div>,

    // 6 — INVESTIMENTO
    <div key={6} className="flex flex-col h-full w-full">
      <SlideHeader idx={6} />
      <div className={`${WRAP} max-w-6xl flex-1 flex flex-col justify-center gap-4`}>
        <p className={EYEBROW}>RL PROD · Photography & Video</p>
        <h1 className="rlp-t leading-[0.85] break-words" style={{ fontSize: 'clamp(48px, 14vw, 168px)' }}>
          INVESTIMENTO{PONTO}
        </h1>
        <div className="h-[3px] w-16 bg-[#2e6cf6] mt-2" />
      </div>
    </div>,

    // 7 — PROPOSTA 1
    <PropostaSlide key={7} idx={7} propIdx={0} />,

    // 8 — PROPOSTA 2
    <PropostaSlide key={8} idx={8} propIdx={1} />,

    // 9 — PROPOSTA 3
    <PropostaSlide key={9} idx={9} propIdx={2} />,

    // 10 — CONFIRMAR PROPOSTA
    <div key={10} className="flex flex-col h-full w-full overflow-y-auto">
      <div className={`${WRAP} max-w-3xl flex-1 flex flex-col gap-8`}>

        {/* ── ESTADO: ACEITE ── */}
        {confirmStatus === 'aceite' && (
          <div className={`${CARD} flex flex-col gap-6 p-6 sm:p-10 mt-4`}>
            <div className="w-14 h-14 rounded-full bg-[#2e6cf6] flex items-center justify-center">
              <span className="text-white text-[24px]">✓</span>
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="rlp-t text-[36px] sm:text-[48px] leading-[0.95]">Proposta Confirmada{PONTO}</h2>
              <p className="text-[15px] text-white/65 leading-relaxed">Recebemos a vossa confirmação. Entraremos em contacto brevemente para dar início ao projeto.</p>
            </div>
            <p className="rlp-m traco text-[10px] text-[#5a8bff]">RL PROD · Obrigado</p>
          </div>
        )}

        {/* ── ESTADO: REJEITADA ── */}
        {confirmStatus === 'rejeitada' && (
          <div className={`${CARD} flex flex-col gap-6 p-6 sm:p-10 mt-4`}>
            <div className="flex flex-col gap-3">
              <h2 className="rlp-t text-[36px] sm:text-[48px] leading-[0.95]">Recebido{PONTO}</h2>
              <p className="text-[15px] text-white/65 leading-relaxed max-w-md">Obrigado pelo vosso tempo. Se mudarem de ideias ou tiverem questões, estamos disponíveis.</p>
            </div>
            <a href={`/rm/${token}`} className={`${BTN_SEC} self-start px-5 py-3 text-[13.5px]`}>‹ Voltar ao Portal</a>
          </div>
        )}

        {/* ── ESTADO: IDLE ou FORM ── */}
        {(confirmStatus === 'idle' || confirmStatus === 'form' || confirmStatus === 'submitting') && (<>

          {/* Cabeçalho */}
          <div className="flex flex-col gap-3">
            <p className={EYEBROW}>A Vossa Decisão</p>
            <h2 className="rlp-t text-[38px] sm:text-[60px] leading-[0.92]">
              Esta Proposta<br />Alinha-se com<br />o Que Procuram?
            </h2>
          </div>

          {/* Botões de decisão (sempre visíveis) */}
          {confirmStatus === 'idle' && (
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => setConfirmStatus('form')}
                className={`${BTN_PRI} flex-1 py-4 text-[14.5px]`}>
                ✓ Aceitar Proposta
              </button>
              <button
                onClick={() => submitConfirm('rejeitada')}
                className="flex-1 rounded-full border border-white/[0.16] hover:border-[#ff4747]/70 py-4 text-[14px] text-white/60 hover:text-[#ff4747] transition-colors">
                ✕ Não, Obrigado
              </button>
            </div>
          )}

          {/* Formulário de aceitação */}
          {(confirmStatus === 'form' || confirmStatus === 'submitting') && (
            <div className={`${CARD} flex flex-col gap-5 w-full p-5 sm:p-8`}>
              <p className="rlp-m traco text-[10px] text-[#5a8bff] border-b border-white/[0.08] pb-4">Dados para a Ficha de Cliente</p>

              {/* Nome + Empresa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Nome Completo <span className="text-[#5a8bff]">*</span></label>
                  <input className={INP} placeholder="Nome completo" value={confirmForm.nome}
                    onChange={e => setConfirmForm(f => ({ ...f, nome: e.target.value }))} />
                </div>
                <div>
                  <label className={LBL}>Empresa / Marca</label>
                  <input className={INP} placeholder="Nome da empresa" value={confirmForm.empresa}
                    onChange={e => setConfirmForm(f => ({ ...f, empresa: e.target.value }))} />
                </div>
              </div>

              {/* Email + Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Email <span className="text-[#5a8bff]">*</span></label>
                  <input className={INP} type="email" placeholder="email@exemplo.com" value={confirmForm.email}
                    onChange={e => setConfirmForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className={LBL}>Telefone <span className="text-[#5a8bff]">*</span></label>
                  <input className={INP} type="tel" placeholder="+351 9XX XXX XXX" value={confirmForm.telefone}
                    onChange={e => setConfirmForm(f => ({ ...f, telefone: e.target.value }))} />
                </div>
              </div>

              {/* NIF + Morada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>NIF</label>
                  <input className={INP} placeholder="Número de contribuinte" value={confirmForm.nif}
                    onChange={e => setConfirmForm(f => ({ ...f, nif: e.target.value }))} />
                </div>
                <div>
                  <label className={LBL}>Morada</label>
                  <input className={INP} placeholder="Rua, cidade, código postal" value={confirmForm.morada}
                    onChange={e => setConfirmForm(f => ({ ...f, morada: e.target.value }))} />
                </div>
              </div>

              {/* Data evento + Local */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Data do Evento</label>
                  <input className={INP + ' [color-scheme:dark]'} type="date" value={confirmForm.data_evento}
                    onChange={e => setConfirmForm(f => ({ ...f, data_evento: e.target.value }))} />
                </div>
                <div>
                  <label className={LBL}>Local do Evento</label>
                  <input className={INP} placeholder="Local / Quinta / Espaço" value={confirmForm.local_evento}
                    onChange={e => setConfirmForm(f => ({ ...f, local_evento: e.target.value }))} />
                </div>
              </div>

              {/* Proposta escolhida */}
              <div>
                <label className={LBL}>Proposta Escolhida</label>
                <div className="flex flex-wrap gap-2">
                  {(content!.propostas || []).map((p, i) => (
                    <button key={i}
                      onClick={() => setConfirmForm(f => ({ ...f, proposta_escolhida: p.titulo }))}
                      className={`flex-1 min-w-[96px] rounded-full py-2.5 px-3 text-[13px] border transition-colors ${confirmForm.proposta_escolhida === p.titulo ? 'border-[#2e6cf6] bg-[#2e6cf6]/20 text-white' : 'border-white/[0.14] text-white/55 hover:border-white/40 hover:text-white'}`}>
                      {p.titulo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className={LBL}>Observações / Notas</label>
                <textarea className={AREA} rows={3} placeholder="Alguma nota ou pedido especial..." value={confirmForm.observacoes}
                  onChange={e => setConfirmForm(f => ({ ...f, observacoes: e.target.value }))} />
              </div>

              {/* Erro */}
              {confirmErr && <p className="text-[13px] text-[#ff4747]">{confirmErr}</p>}

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => submitConfirm('aceite')}
                  disabled={confirmStatus === 'submitting'}
                  className={`${BTN_PRI} flex-1 py-4 text-[14.5px]`}>
                  {confirmStatus === 'submitting' ? 'A enviar...' : '✓ Confirmar e Enviar'}
                </button>
                <button
                  onClick={() => { setConfirmStatus('idle'); setConfirmErr('') }}
                  disabled={confirmStatus === 'submitting'}
                  className={`${BTN_SEC} px-6 py-4 text-[13.5px]`}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>)}
      </div>
    </div>,
  ]

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="rlp h-screen h-[100dvh] relative overflow-hidden flex flex-col bg-[#00141f] text-white">
      <EstiloRLProd />

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/[0.08] bg-[#00141f]/85 backdrop-blur-md shrink-0">
        <a href={`/rm/${token}`} className="rlp-m text-[10px] text-white/55 hover:text-white transition-colors shrink-0">‹ Portal</a>
        <p className="rlp-m hidden sm:block text-[9.5px] text-white/45 truncate">RL Prod · Proposta criativa</p>
        <p className="rlp-m text-[10px] text-[#a9c1ff] tabular-nums shrink-0" style={{ letterSpacing: '0.15em' }}>
          {String(current + 1).padStart(2,'0')} / {String(TOTAL_SLIDES).padStart(2,'0')}
        </p>
      </div>

      {/* Slides */}
      <div className="relative flex-1 z-10 overflow-hidden">
        {slides.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 overflow-y-auto overflow-x-hidden"
            style={{
              opacity:       current === i ? 1 : 0,
              pointerEvents: current === i ? 'auto' : 'none',
              transform:     current === i ? 'translateX(0px)' : `translateX(${(i - current) * dir > 0 ? '32px' : '-32px'})`,
              transition:    'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {slide}

            {/* ── Botão ✎ Editar ── */}
            {isAdmin && editingSlide !== i && (
              <button
                onClick={() => startEdit(i)}
                className="absolute bottom-5 right-4 sm:right-5 z-40 flex items-center gap-2 rounded-full border border-[#2e6cf6]/60 bg-[#00141f]/90 hover:bg-[#2e6cf6] backdrop-blur-md px-4 py-2 text-[12.5px] text-[#a9c1ff] hover:text-white transition-colors"
              >
                <span style={{ fontSize: 14 }}>✎</span>
                <span>Editar</span>
              </button>
            )}

            {/* ── Overlay de edição ── */}
            {isAdmin && editingSlide === i && draft && (
              <div className="absolute inset-0 z-50 flex flex-col overflow-y-auto bg-[#00141f]">
                <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-8 py-3 border-b border-white/[0.08] bg-[#00141f]/95 backdrop-blur-md">
                  <p className="rlp-m traco text-[10px] text-[#5a8bff]">✎ Slide {i + 1}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={cancelEdit}
                      className={`${BTN_SEC} px-4 py-1.5 text-[12.5px]`}>
                      ✕ Cancelar
                    </button>
                    <button onClick={saveEdit} disabled={saving}
                      className={`rounded-full px-5 py-1.5 text-[12.5px] font-medium transition-colors disabled:opacity-40 ${
                        savedOk
                          ? 'border border-[#2e6cf6] bg-[#2e6cf6]/20 text-[#a9c1ff]'
                          : 'bg-[#2e6cf6] hover:bg-[#5a8bff] text-white'
                      }`}>
                      {savedOk ? '✓ Guardado' : saving ? 'A guardar...' : '✓ Guardar'}
                    </button>
                  </div>
                </div>
                <div className="flex-1 px-4 sm:px-8 py-8 max-w-2xl w-full mx-auto">
                  <div className={`${CARD} p-5 sm:p-6`}>
                    {renderEditForm(i)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="relative z-20 shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/[0.08] bg-[#00141f]/85 backdrop-blur-md">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
          <button onClick={() => goTo(current - 1)} disabled={current === 0 || editingSlide !== null}
            className="flex items-center gap-2 rounded-full border border-white/[0.16] hover:border-white/40 px-4 sm:px-5 py-2.5 text-[13.5px] text-white/75 hover:text-white transition-colors disabled:opacity-25 disabled:cursor-not-allowed">
            <span className="text-[18px] leading-none">‹</span>
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#00141f]/75 px-3 py-2.5 min-w-0">
            {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
              <button key={i} onClick={() => goTo(i)} disabled={editingSlide !== null}
                aria-label={`Slide ${i + 1}`}
                className="rounded-full transition-all duration-300 disabled:cursor-not-allowed"
                style={{ width: current === i ? 20 : 6, height: 6, background: current === i ? '#2e6cf6' : 'rgba(255,255,255,0.22)' }}
              />
            ))}
          </div>

          <button onClick={() => goTo(current + 1)} disabled={current === TOTAL_SLIDES - 1 || editingSlide !== null}
            className="flex items-center gap-2 rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-4 sm:px-5 py-2.5 text-[13.5px] font-medium text-white transition-colors disabled:opacity-25 disabled:cursor-not-allowed">
            <span className="hidden sm:inline">Seguinte</span>
            <span className="text-[18px] leading-none">›</span>
          </button>
        </div>
      </div>
    </div>
  )
}
