'use client'

import { useCallback, useEffect, useState } from 'react'
import type { RMPageContent, RMPackage, RMProposta } from '../RMLeadPageClient'

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
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?title=0&byline=0&portrait=0`
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
    hero:    { titulo: 'Reunião Marcada', subtitulo: 'RL Media · Audiovisual' },
    videos:  { label: '', titulo: '', urls: ['','',''] },
    proposta: {
      titulo: 'Proposta Criativa', intro: '', packages: DEFAULT_PACKAGES,
      propostaAtiva: 1, cta: 'Iniciar Produção', password: '',
      planoEtapas: DEFAULT_PLANO, incluido: DEFAULT_INCLUIDO,
      videoUrls: ['','',''], checkpointPergunta: 'Esta abordagem alinha-se com a visão da vossa marca?',
      slideImages: ['','','','','','','','','',''],
    },
    sobre:   { label: 'Quem Somos', titulo: 'RL Media', texto: '' },
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
const SERVICOS_DESC: Record<string, string> = {
  '1 reunião':                              'Sessão de briefing e alinhamento com a equipa criativa para definir objetivos, visão e expectativas do projeto.',
  '2 reuniões':                             'Duas sessões de briefing e acompanhamento para garantir total alinhamento criativo ao longo de todo o projeto.',
  '1 dia de captação':                      'Um dia completo de filmagem e/ou fotografia em locação, com equipamento profissional e equipa dedicada.',
  '2 dias de captação':                     'Dois dias de produção em locação para projetos com maior escala ou diversidade de ambientes.',
  '3 dias de captação':                     'Três dias de produção intensiva para campanhas abrangentes com múltiplos cenários e conteúdos.',
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
  '1 video horizontal 1 min':               'Vídeo em formato 16:9 com duração até 1 minuto — ideal para exibição em websites, apresentações, feiras e ecrãs de TV.',
  '1 video horizontal 2 min':               'Vídeo em formato 16:9 com até 2 minutos — versátil para websites, exposição em feiras, ecrãs de TV e comunicação institucional.',
  '1 video horizontal 3 min':               'Vídeo em formato 16:9 com até 3 minutos — perfeito para storytelling aprofundado em websites, televisão e eventos de exposição.',
  '1 video vertical 59seg':                 'Vídeo em formato 9:16 com até 59 segundos para uso exclusivo em social media — otimizado para Instagram Reels, TikTok e YouTube Shorts.',
  '1 video vertical 90seg':                 'Vídeo em formato 9:16 com até 90 segundos para social media — máximo impacto e engagement em Instagram Reels e TikTok.',
  '1 video vertical 2min':                  'Vídeo em formato 9:16 com até 2 minutos para social media — ideal para histórias mais completas no feed vertical do Instagram e TikTok.',
  'direitos musicais':                      'Licenciamento de música profissional para uso comercial dos conteúdos, sem restrições de copyright ou direitos de autor.',
  'cedência de fotografias uso media social':'Licença de utilização das imagens captadas para publicação em redes sociais e todos os meios digitais da marca.',
  'voz off estúdio':                        'Gravação de locução profissional em estúdio para narração do vídeo, com seleção de voz, dicção e masterização de áudio.',
}

function getServDesc(nome: string): string {
  return SERVICOS_DESC[nome.toLowerCase().trim()] || ''
}

const EDITABLE_SLIDES = [0, 1, 2, 3, 4, 5, 6]
const TOTAL_SLIDES = 10

const T = {
  xs:  'text-[13px]',
  sm:  'text-[14px]',
  md:  'text-[15px]',
  lg:  'text-[16px]',
  xl:  'text-[17px]',
  xxl: 'text-[18px]',
}

const INP  = 'w-full bg-white/[0.04] border border-white/[0.12] px-3 py-2.5 text-[13px] text-white/80 placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors'
const AREA = INP + ' resize-none leading-relaxed'
const LBL  = 'text-[10px] tracking-[0.5em] text-white/40 uppercase mb-1.5 block'

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

  const labelCls = `${T.xs} tracking-[0.55em] text-white/50 uppercase`

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#04080f' }}>
      <p className={`${T.xs} tracking-[0.6em] text-white/40 uppercase animate-pulse`}>A carregar...</p>
    </main>
  )
  if (notFound) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#04080f' }}>
      <p className={`${T.xs} tracking-[0.6em] text-white/40 uppercase`}>Página não disponível</p>
    </main>
  )

  const { proposta } = content!
  const empresa = lead!.empresa || lead!.nome || ''

  // ── Cabeçalho de imagem do slide ───────────────────────────────────────────
  function SlideHeader({ idx }: { idx: number }) {
    const img = proposta.slideImages?.[idx]
    if (!img) return null
    return (
      <div className="w-full shrink-0 overflow-hidden" style={{ height: 280 }}>
        <img
          src={img}
          alt=""
          className="w-full h-full object-cover object-center"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black 35%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 35%, transparent 100%)',
          }}
        />
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
        <div className="flex-1 flex flex-col sm:flex-row min-h-0">

          {/* Painel esquerdo — identidade + valor */}
          <div className="flex flex-col justify-between px-8 sm:px-12 py-10 sm:py-14 border-b sm:border-b-0 sm:border-r border-white/[0.07]"
            style={{ minWidth: 0, flex: '0 0 auto', width: '100%', maxWidth: 320 }}>

            {/* Número de fundo */}
            <div className="relative select-none pointer-events-none mb-6" style={{ lineHeight: 1 }}>
              <span className="font-black text-white/[0.04]" style={{ fontSize: 'clamp(80px, 14vw, 130px)', letterSpacing: '-0.02em' }}>
                {num}
              </span>
            </div>

            {/* Título */}
            <div className="flex flex-col gap-3 mb-auto">
              <p className="text-[10px] tracking-[0.6em] text-white/35 uppercase">Opção {num}</p>
              <h2 className="text-[26px] sm:text-[30px] font-extrabold tracking-[0.04em] text-white/90 uppercase leading-tight">
                {prop.titulo}
              </h2>
              <div className="h-px w-10 bg-white/25 mt-1" />
            </div>

            {/* Valor */}
            <div className="mt-8 flex flex-col gap-1.5">
              <p className="text-[10px] tracking-[0.55em] text-white/35 uppercase">Investimento</p>
              {prop.valor ? (
                <p className="text-[36px] sm:text-[42px] font-extralight tracking-[0.06em] text-white/90 leading-none">
                  {prop.valor}
                </p>
              ) : (
                <p className="text-[28px] font-extralight tracking-[0.06em] text-white/30 leading-none">—</p>
              )}
            </div>
          </div>

          {/* Painel direito — serviços */}
          <div className="flex-1 flex flex-col px-8 sm:px-12 py-10 sm:py-14 min-h-0 overflow-y-auto">
            <p className="text-[10px] tracking-[0.6em] text-white/35 uppercase mb-6 shrink-0">Serviços Incluídos</p>

            {prop.servicos.length > 0 ? (
              <div className="flex flex-col gap-0">
                {prop.servicos.map((s, i) => {
                  const key  = `${propIdx}-${i}`
                  const open = expandedServicos.includes(key)
                  const desc = getServDesc(s)
                  return (
                    <div key={i} className="border-b border-white/[0.055] last:border-0">
                      {/* Linha principal */}
                      <div className="flex items-center gap-4 py-3">
                        <span className="text-[11px] font-bold text-white/20 shrink-0 w-5 text-right tabular-nums">{String(i + 1).padStart(2,'0')}</span>
                        <div className="w-px h-3 bg-white/10 shrink-0" />
                        <p className="text-[15px] font-light text-white/75 leading-snug flex-1">{s}</p>
                        {desc && (
                          <button
                            onClick={() => toggleServico(key)}
                            className="shrink-0 w-6 h-6 flex items-center justify-center border border-white/[0.15] hover:border-white/40 text-white/40 hover:text-white/80 transition-all"
                            style={{ fontSize: 16, lineHeight: 1, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.25s ease, border-color 0.2s, color 0.2s' }}
                            title="Saber mais"
                          >+</button>
                        )}
                      </div>
                      {/* Descrição expandível */}
                      <div style={{
                        maxHeight: open ? 120 : 0,
                        overflow: 'hidden',
                        transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
                      }}>
                        <p className="text-[13px] font-light text-white/45 leading-relaxed pb-4 pl-9 pr-2">{desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[12px] tracking-[0.4em] text-white/20 uppercase">A definir</p>
              </div>
            )}
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
      <div className="border-t border-white/[0.06] pt-5 mt-5">
        <label className={LBL}>Foto do Cabeçalho</label>

        {/* Upload por ficheiro */}
        <label className={`relative mb-3 flex items-center justify-center gap-2 w-full py-4 border border-dashed cursor-pointer transition-all ${uploading ? 'border-white/10 text-white/25' : 'border-white/20 hover:border-white/40 text-white/45 hover:text-white/65'}`}>
          <span style={{ fontSize: 16 }}>↑</span>
          <span className="text-[11px] tracking-[0.4em] uppercase">
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
          <p className="mb-3 text-[11px] text-red-400/60 tracking-wide">Erro ao processar imagem. Tenta novamente.</p>
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
          <div className="relative overflow-hidden" style={{ height: 110 }}>
            <img src={img} alt="" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(4,8,15,0.9) 100%)' }} />
            <button
              onClick={() => { setSlideImage(idx, ''); setUploadErr(false) }}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white/60 hover:text-white text-[11px] border border-white/15 transition-all"
            >✕</button>
          </div>
        ) : (
          <div className="border border-dashed border-white/[0.07] flex items-center justify-center" style={{ height: 50 }}>
            <p className="text-[10px] tracking-widest text-white/20 uppercase">Sem imagem</p>
          </div>
        )}
      </div>
    )
  }

  // ── PASSWORD GATE ──────────────────────────────────────────────────────────
  if (!unlocked) return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative" style={{ background: '#04080f' }}>
      <div className="pointer-events-none fixed inset-0" style={{
        backgroundImage: `linear-gradient(rgba(70,120,255,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(70,120,255,0.055) 1px,transparent 1px)`,
        backgroundSize: '64px 64px',
      }} />
      <div className="pointer-events-none fixed inset-0" style={{
        background: 'radial-gradient(ellipse 110% 55% at 50% -8%, rgba(50,110,255,0.13) 0%, rgba(30,70,200,0.05) 45%, transparent 70%)',
      }} />
      <div className="pointer-events-none fixed inset-0" style={{
        background: 'radial-gradient(ellipse 45% 55% at -6% 45%, rgba(60,130,255,0.07) 0%, transparent 55%)',
      }} />
      <div className="pointer-events-none fixed inset-0" style={{
        background: 'radial-gradient(ellipse 45% 55% at 106% 55%, rgba(40,100,255,0.06) 0%, transparent 52%)',
      }} />
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-3">
          <p className={labelCls}>RL Media · Audiovisual</p>
          <h1 className={`${T.xxl} font-extralight tracking-[0.3em] text-white/80 uppercase`}>Proposta Criativa</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-px w-8 bg-white/30" />
            <div className="w-1 h-1 bg-white/40 rotate-45" />
            <div className="h-px w-8 bg-white/30" />
          </div>
          {empresa && <p className={`${T.xs} tracking-[0.5em] text-white/50 uppercase mt-2`}>{empresa}</p>}
        </div>
        <form onSubmit={handleUnlock} className="w-full flex flex-col gap-4">
          <div>
            <input type="password" value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false) }}
              placeholder="Password de acesso" autoFocus
              className={`w-full bg-white/[0.03] border px-5 py-4 ${T.sm} text-white/70 placeholder:text-white/30 tracking-wider text-center focus:outline-none transition-colors ${pwError ? 'border-red-400/40' : 'border-white/[0.12] focus:border-white/30'}`}
            />
            {pwError && <p className={`mt-2 ${T.xs} tracking-[0.4em] text-red-400/70 uppercase text-center`}>Password incorreta</p>}
          </div>
          <button type="submit" className={`w-full border border-white/30 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/45 py-4 ${T.xs} tracking-[0.5em] text-white/60 hover:text-white/80 uppercase transition-all`}>
            Aceder →
          </button>
        </form>
        <a href={`/rm/${token}`} className={`${T.xs} tracking-[0.4em] text-white/40 hover:text-white/60 uppercase transition-colors`}>‹ Voltar ao Portal</a>
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
                {url && <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[13px] ${valid ? 'text-emerald-400/70' : 'text-red-400/60'}`}>{valid ? '✓' : '✕'}</span>}
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
  const slides = [

    // 0 — CAPA
    <div key={0} className="flex flex-col h-full w-full">
      <SlideHeader idx={0} />
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-8 py-8">
        <div style={{ background:'#04080f', borderRadius:'9999px', padding:'6px', boxShadow:'0 0 24px rgba(255,255,255,0.22), 0 0 56px rgba(255,255,255,0.09)' }}>
          <img src="/logo-rl-media-branco.png" alt="RL Media" className="w-36 h-36 object-contain block" style={{ mixBlendMode:'screen', borderRadius:'9999px' }} />
        </div>
        <div className="flex flex-col items-center gap-5">
          <p className="text-[16px] tracking-[0.55em] text-white/55 uppercase">RL Media · Audiovisual</p>
          <h1 className="text-[42px] font-extralight tracking-[0.35em] text-white/90 uppercase leading-snug">Proposta<br />Criativa</h1>
          <div className="flex items-center gap-5 my-1">
            <div className="h-px w-16 bg-white/30" />
            <div className="w-2 h-2 bg-white/40 rotate-45" />
            <div className="h-px w-16 bg-white/30" />
          </div>
          {empresa && <p className="text-[20px] font-extralight tracking-[0.4em] text-white/65 uppercase">{empresa}</p>}
          <p className="text-[15px] tracking-[0.5em] text-white/40 uppercase font-mono">
            {new Date().toLocaleDateString('pt-PT', { day:'2-digit', month:'long', year:'numeric' })}
          </p>
        </div>
      </div>
    </div>,

    // 1 — PLANO DE AÇÃO
    <div key={1} className="flex flex-col h-full w-full">
      <SlideHeader idx={1} />
      <div className="flex-1 flex flex-col justify-center gap-8 px-8 sm:px-20 py-8 max-w-3xl mx-auto w-full">
        <h2 className="text-[32px] font-extrabold tracking-[0.12em] text-white/90 uppercase leading-tight text-center">
          Plano de Ação<br />Personalizado<br />com 3 Etapas
        </h2>
        <div className="flex flex-col gap-6">
          {proposta.planoEtapas.map((etapa, i) => (
            <div key={i} className={`flex flex-col gap-2 ${i < proposta.planoEtapas.length - 1 ? 'pb-6 border-b border-white/[0.07]' : ''}`}>
              <h3 className="text-[22px] font-bold text-white/85">{i + 1}. {etapa.titulo}</h3>
              <p className="text-[17px] font-light text-white/60 leading-relaxed">{etapa.texto}</p>
            </div>
          ))}
        </div>
        <p className="text-[16px] font-light text-white/45 leading-relaxed tracking-wide">
          {(proposta as any).planoFrase ?? 'Uma proposta desenvolvida com base nos objetivos da vossa marca. Foco em resultados, narrativa estratégica e produção de excelência do briefing à entrega final.'}
        </p>
      </div>
    </div>,

    // 2 — COMO FUNCIONA
    <div key={2} className="flex flex-col h-full w-full">
      <SlideHeader idx={2} />
      <div className="flex-1 flex flex-col justify-center gap-8 px-8 sm:px-16 py-8 max-w-5xl mx-auto w-full">
        <h2 className="text-[32px] font-extrabold tracking-[0.12em] text-white/90 uppercase text-center">Como Funciona?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
          {COMO_FUNCIONA.map((item, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-center gap-3 pb-2 border-b border-white/[0.10]">
                <span className="w-7 h-7 flex items-center justify-center bg-white/[0.08] border border-white/[0.15] text-[13px] font-bold text-white/70 shrink-0">{item.n}</span>
                <h3 className="text-[22px] font-bold text-white/85 uppercase tracking-wide leading-tight">{item.titulo}</h3>
              </div>
              <p className="text-[17px] font-light text-white/55 leading-relaxed pt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>,

    // 3 — O QUE ESTÁ INCLUÍDO
    <div key={3} className="flex flex-col h-full w-full">
      <SlideHeader idx={3} />
      <div className="flex-1 flex flex-col justify-center gap-8 px-8 sm:px-20 py-8 max-w-3xl mx-auto w-full">
        <h2 className="text-[32px] font-extrabold tracking-[0.08em] text-white/90 uppercase">O Que Está Incluído?</h2>
        <div className="flex flex-col gap-5">
          {proposta.incluido.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <span className="text-[22px] font-bold text-white/50 shrink-0 leading-tight">✓</span>
              <p className="text-[22px] font-bold text-white/85 leading-tight">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>,

    // 4 — VÍDEOS
    <div key={4} className="flex flex-col h-full w-full">
      <SlideHeader idx={4} />
      <div className="flex-1 flex flex-col justify-center gap-8 px-8 sm:px-16 py-8 max-w-5xl mx-auto w-full">
        <h2 className="text-[32px] font-extrabold tracking-[0.08em] text-white/90 uppercase text-center">O Nosso Trabalho</h2>
        <div className="grid grid-cols-1 gap-4">
          {proposta.videoUrls.map((url, i) => {
            const embed = toEmbedUrl(url)
            if (embed) return (
              <div key={i} className="border border-white/[0.08] w-full" style={{ aspectRatio:'16/9' }}>
                <iframe src={embed} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
              </div>
            )
            return (
              <div key={i} className="border border-dashed border-white/[0.08] flex items-center justify-center" style={{ aspectRatio:'16/9' }}>
                <p className={`${T.xs} text-white/20 tracking-widest uppercase`}>Vídeo {i + 1}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>,

    // 5 — CHECKPOINT
    <div key={5} className="flex flex-col h-full w-full">
      <SlideHeader idx={5} />
      <div className="flex-1 flex flex-col items-center justify-center gap-10 px-8 sm:px-20 text-center py-8 max-w-3xl mx-auto w-full">
        <p className={labelCls}>A Tua Opinião</p>
        <h2 className="text-[38px] font-extrabold tracking-[0.06em] text-white/90 uppercase leading-tight">Momento de<br />Reflexão</h2>
        <div className="flex items-center gap-4">
          <div className="h-px w-12 bg-white/20" />
          <div className="w-1.5 h-1.5 bg-white/30 rotate-45" />
          <div className="h-px w-12 bg-white/20" />
        </div>
        <p className="text-[24px] font-light text-white/70 leading-relaxed max-w-xl">{proposta.checkpointPergunta}</p>
      </div>
    </div>,

    // 6 — INVESTIMENTO
    <div key={6} className="flex flex-col h-full w-full">
      <SlideHeader idx={6} />
      <div className="flex-1 flex items-center justify-center px-8 text-center">
        <h1 className="text-[80px] sm:text-[110px] font-extralight tracking-[0.3em] text-white/90 uppercase leading-none">
          INVESTIMENTO
        </h1>
      </div>
    </div>,

    // 7 — PROPOSTA 1
    <PropostaSlide key={7} idx={7} propIdx={0} />,

    // 8 — PROPOSTA 2
    <PropostaSlide key={8} idx={8} propIdx={1} />,

    // 9 — PROPOSTA 3
    <PropostaSlide key={9} idx={9} propIdx={2} />,
  ]

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen relative overflow-hidden flex flex-col" style={{ background: '#04080f' }}>

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(70,120,255,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(70,120,255,0.055) 1px,transparent 1px)`,
        backgroundSize: '64px 64px',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 110% 55% at 50% -8%, rgba(50,110,255,0.13) 0%, rgba(30,70,200,0.05) 45%, transparent 70%)',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 45% 55% at -6% 45%, rgba(60,130,255,0.07) 0%, transparent 55%)',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 45% 55% at 106% 55%, rgba(40,100,255,0.06) 0%, transparent 52%)',
      }} />

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
        <a href={`/rm/${token}`} className={`${T.xs} tracking-[0.4em] text-white/45 hover:text-white/65 uppercase transition-colors`}>‹ Portal</a>
        <p className={`${T.xs} tracking-[0.5em] text-white/40 uppercase`}>RL Media · Proposta Criativa</p>
        <p className={`${T.xs} tracking-widest text-white/45 font-mono`}>
          {String(current + 1).padStart(2,'0')} / {String(TOTAL_SLIDES).padStart(2,'0')}
        </p>
      </div>

      {/* Slides */}
      <div className="relative flex-1 z-10 overflow-hidden">
        {slides.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 overflow-y-auto"
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
                className="absolute bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 border border-white/25 hover:border-white/50 bg-[#0d1120] hover:bg-[#141a2e] text-white/60 hover:text-white/90 transition-all"
              >
                <span style={{ fontSize: 15 }}>✎</span>
                <span className="text-[10px] tracking-[0.45em] uppercase">Editar</span>
              </button>
            )}

            {/* ── Overlay de edição ── */}
            {isAdmin && editingSlide === i && draft && (
              <div className="absolute inset-0 z-50 flex flex-col overflow-y-auto" style={{ background: '#04080f' }}>
                <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-white/[0.08]" style={{ background: '#04080f' }}>
                  <p className="text-[10px] tracking-[0.6em] text-white/40 uppercase">✎ Slide {i + 1}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={cancelEdit}
                      className="px-4 py-2 text-[10px] tracking-[0.4em] text-white/40 hover:text-white/65 border border-white/[0.08] hover:border-white/20 uppercase transition-all">
                      ✕ Cancelar
                    </button>
                    <button onClick={saveEdit} disabled={saving}
                      className={`px-6 py-2 text-[10px] tracking-[0.4em] uppercase transition-all border disabled:opacity-40 ${
                        savedOk
                          ? 'border-emerald-400/50 text-emerald-400/80 bg-emerald-400/[0.06]'
                          : 'border-white/30 text-white/70 hover:text-white/90 hover:border-white/50 bg-white/[0.04] hover:bg-white/[0.08]'
                      }`}>
                      {savedOk ? '✓ Guardado' : saving ? 'A guardar...' : '✓ Guardar'}
                    </button>
                  </div>
                </div>
                <div className="flex-1 px-8 sm:px-16 py-8 max-w-2xl w-full mx-auto">
                  {renderEditForm(i)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="relative z-20 shrink-0 flex items-center justify-between px-6 py-5 border-t border-white/[0.06]">
        <button onClick={() => goTo(current - 1)} disabled={current === 0 || editingSlide !== null}
          className="flex items-center gap-2 border border-white/[0.12] hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.07] px-5 py-3 text-white/50 hover:text-white/80 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
          <span className={`${T.xxl} leading-none`}>‹</span>
          <span className={`${T.xs} tracking-[0.4em] uppercase hidden sm:inline`}>Anterior</span>
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button key={i} onClick={() => goTo(i)} disabled={editingSlide !== null}
              className="transition-all duration-300 disabled:cursor-not-allowed"
              style={{ width: current === i ? 20 : 6, height: 6, background: current === i ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)' }}
            />
          ))}
        </div>

        <button onClick={() => goTo(current + 1)} disabled={current === TOTAL_SLIDES - 1 || editingSlide !== null}
          className="flex items-center gap-2 border border-white/[0.12] hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.07] px-5 py-3 text-white/50 hover:text-white/80 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
          <span className={`${T.xs} tracking-[0.4em] uppercase hidden sm:inline`}>Seguinte</span>
          <span className={`${T.xxl} leading-none`}>›</span>
        </button>
      </div>
    </div>
  )
}
