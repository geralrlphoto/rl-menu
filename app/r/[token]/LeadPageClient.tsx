'use client'

import { useEffect, useRef, useState } from 'react'

const WHATSAPP     = 'https://wa.me/351912932768'
const DEFAULT_HERO = 'https://rl-menu-lake.vercel.app/casamentos-2028.webp'

// ─── DESIGN SYSTEM — RL PHOTO.VIDEO (rlphotovideo.pt) ─────────────────────────
const RLP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400&family=Hanken+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap');

.rl-portal{
  --ink:#0b0a08; --ink-2:#100e0b; --ink-3:#16130f;
  --g:#d8be93; --g-deep:#c8a866;
  --tx:rgba(243,237,226,.92); --tx-mid:rgba(243,237,226,.6); --tx-dim:rgba(243,237,226,.4);
  --line:rgba(243,237,226,.14); --line-soft:rgba(243,237,226,.08);
  --fd:'Jost',sans-serif; --fb:'Hanken Grotesk',sans-serif; --fm:'Space Mono',monospace; --fs:'Cormorant Garamond',serif;
  --ease:cubic-bezier(.16,1,.3,1); --pad:clamp(20px,5vw,80px);
  background:var(--ink); color:var(--tx); font-family:var(--fb);
  -webkit-font-smoothing:antialiased;
}
.rl-portal ::selection{background:rgba(216,190,147,.28);color:#0b0a08;}

/* Atmosfera */
.rlp-grain{position:fixed;inset:0;z-index:9000;pointer-events:none;opacity:.05;mix-blend-mode:overlay;background-size:130px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");}
.rlp-vig{position:fixed;inset:0;z-index:8990;pointer-events:none;box-shadow:inset 0 0 240px 40px rgba(0,0,0,.5);}
.rlp-prog{position:fixed;top:0;left:0;height:2px;width:0;background:var(--g);z-index:9100;transition:width .1s linear;}

/* Barra fixa */
.rlp-bar{position:fixed;left:0;width:100%;z-index:8000;display:flex;align-items:center;justify-content:space-between;padding:20px var(--pad);border-bottom:1px solid transparent;transition:background .6s var(--ease),padding .6s var(--ease),border-color .6s;}
.rlp-bar.s{background:rgba(11,10,8,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding-top:13px;padding-bottom:13px;border-color:var(--line-soft);}
.rlp-mono{display:inline-flex;align-items:baseline;gap:.6em;text-decoration:none;}
.rlp-mono span{font-family:var(--fd);font-weight:300;letter-spacing:.3em;font-size:16px;color:var(--tx);}
.rlp-mono i{font-family:var(--fm);font-style:normal;font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);opacity:.85;}

/* Eyebrow */
.rlp-eyebrow{font-family:var(--fm);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--g);display:inline-flex;gap:.8em;align-items:center;}
.rlp-eyebrow::before{content:"";width:34px;height:1px;background:var(--g);opacity:.6;}
.rlp-eyebrow.c{justify-content:center;}

/* Contentor / secção */
.rlp-wrap{width:100%;max-width:1280px;margin:0 auto;padding-left:var(--pad);padding-right:var(--pad);}
.rlp-sec{position:relative;padding-top:clamp(60px,9vh,120px);padding-bottom:clamp(60px,9vh,120px);}

/* Títulos */
.rlp-h1{font-family:var(--fd);font-weight:200;line-height:.92;letter-spacing:-.02em;color:var(--tx);}
.rlp-h2{font-family:var(--fd);font-weight:200;line-height:1.04;letter-spacing:-.02em;font-size:clamp(30px,5vw,64px);color:var(--tx);}
.rlp-h2 em{font-style:italic;color:var(--g);}
.rlp-lede{font-family:var(--fb);font-weight:300;color:var(--tx-mid);line-height:1.75;font-size:clamp(15px,1.4vw,18px);}
.rlp-ed{font-family:var(--fs);font-weight:300;color:var(--tx-mid);}
.rlp-ed em{font-style:italic;color:var(--g);}

/* Botões */
.rlp-btn{display:inline-flex;align-items:center;justify-content:center;gap:.9em;position:relative;isolation:isolate;font-family:var(--fm);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink);padding:18px 38px;border:1px solid var(--g);border-radius:40px;overflow:hidden;background:var(--g);transition:color .5s var(--ease),opacity .3s;cursor:pointer;text-decoration:none;}
.rlp-btn .fill{position:absolute;inset:0;z-index:-1;background:var(--ink);transform:translateY(101%);transition:transform .6s var(--ease);}
.rlp-btn .dot{width:5px;height:5px;border-radius:50%;background:var(--ink);transition:background .5s;flex:none;}
.rlp-btn:hover{color:var(--g);} .rlp-btn:hover .fill{transform:translateY(0);} .rlp-btn:hover .dot{background:var(--g);}
.rlp-btn:disabled{opacity:.45;pointer-events:none;}
.rlp-btn.ghost{background:transparent;color:var(--tx);border-color:var(--line);}
.rlp-btn.ghost .dot{background:var(--g);}
.rlp-btn.ghost .fill{background:var(--g);}
.rlp-btn.ghost:hover{color:var(--ink);}
.rlp-btn.ghost:hover .dot{background:var(--ink);}
.rlp-btn.danger{background:transparent;color:#e79b9b;border-color:rgba(231,155,155,.4);}
.rlp-btn.danger .dot{background:#e79b9b;} .rlp-btn.danger .fill{background:rgba(231,155,155,.9);}
.rlp-btn.danger:hover{color:#170d0d;} .rlp-btn.danger:hover .dot{background:#170d0d;}
.rlp-btn.full{width:100%;}

/* Link sublinhado */
.rlp-link-u{font-family:var(--fm);font-size:12px;letter-spacing:.16em;text-transform:uppercase;display:inline-flex;gap:.7em;align-items:center;position:relative;color:var(--tx-mid);text-decoration:none;}
.rlp-link-u::after{content:"";position:absolute;left:0;bottom:-5px;width:100%;height:1px;background:var(--g);transform:scaleX(0);transform-origin:right;transition:transform .5s var(--ease);}
.rlp-link-u:hover::after{transform:scaleX(1);transform-origin:left;}
.rlp-link-u .a{color:var(--g);transition:transform .4s var(--ease);}
.rlp-link-u:hover .a{transform:translateX(5px);}

/* Placeholder de imagem */
.rlp-slot{position:relative;overflow:hidden;background:var(--ink-3);background-image:repeating-linear-gradient(122deg,rgba(243,237,226,.022) 0 1px,transparent 1px 11px);}
.rlp-slot .lab{position:absolute;inset:0;display:grid;place-items:center;text-align:center;font-family:var(--fm);font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:var(--tx-dim);padding:1em;}
.rlp-slot img{width:100%;height:100%;object-fit:cover;display:block;}

/* Cartão com sheen */
.rlp-card{border:1px solid var(--line-soft);border-radius:10px;background:var(--ink-2);position:relative;overflow:hidden;transition:border-color .5s var(--ease),transform .5s var(--ease);}
.rlp-card::before{content:"";position:absolute;top:0;left:-70%;width:55%;height:100%;background:linear-gradient(100deg,transparent,rgba(216,190,147,.08),transparent);transform:skewX(-18deg);animation:rlpSheen 6s ease-in-out infinite;pointer-events:none;}
@keyframes rlpSheen{0%{left:-70%}55%,100%{left:170%}}
.rlp-card:hover{border-color:var(--g);}

/* Linha de detalhe */
.rlp-drow{display:flex;align-items:center;justify-content:space-between;padding:16px 0;border-top:1px solid var(--line-soft);}
.rlp-drow:first-child{border-top:0;}
.rlp-drow .k{font-family:var(--fm);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--tx-dim);}
.rlp-drow .v{font-family:var(--fd);font-weight:300;font-size:clamp(16px,1.6vw,20px);color:var(--tx);}

/* Divisor */
.rlp-div{width:100%;max-width:1280px;margin:0 auto;height:1px;background:var(--line-soft);}

/* Footer */
.rlp-foot{background:var(--ink-2);border-top:1px solid var(--line-soft);padding:clamp(50px,7vh,90px) 0 0;}
.rlp-foot h5{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);margin-bottom:18px;}
.rlp-foot a{color:var(--tx-mid);text-decoration:none;transition:color .4s var(--ease);}
.rlp-foot a:hover{color:var(--tx);}
.rlp-foot .end{border-top:1px solid var(--line-soft);margin-top:clamp(40px,6vh,70px);padding:22px var(--pad);display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;font-family:var(--fm);font-size:11px;color:var(--tx-dim);}

/* Botões de calendário */
.rlp-calbtn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:.6em;padding:13px 0;border:1px solid var(--line);border-radius:40px;font-family:var(--fm);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-mid);background:transparent;cursor:pointer;transition:border-color .4s var(--ease),color .4s var(--ease);}
.rlp-calbtn:hover{border-color:var(--g);color:var(--g);}
.rlp-calbtn svg{width:13px;height:13px;}

/* Botão flutuante WhatsApp */
.rlp-wa{position:fixed;bottom:24px;right:24px;width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:8100;background:var(--g);color:var(--ink);box-shadow:0 10px 30px rgba(0,0,0,.4);transition:transform .4s var(--ease);}
.rlp-wa:hover{transform:translateY(-3px) scale(1.05);}

@media (max-width:760px){
  .rlp-foot .end{flex-direction:column;align-items:flex-start;}
  .rlp-mono i{display:none;}
}
@media (prefers-reduced-motion:reduce){
  .rlp-card::before{animation:none;}
}
`


type Contact = Record<string, any>

export const FONTS: { value: string; label: string; className: string }[] = [
  { value: 'playfair',  label: 'Playfair',  className: 'font-playfair' },
  { value: 'cormorant', label: 'Cormorant', className: 'font-cormorant' },
  { value: 'sans',      label: 'Sans',      className: 'font-sans' },
]

export const SIZES: { value: string; label: string; className: string }[] = [
  { value: 'sm',  label: 'S',  className: 'text-2xl' },
  { value: 'md',  label: 'M',  className: 'text-4xl' },
  { value: 'lg',  label: 'L',  className: 'text-3xl sm:text-6xl' },
  { value: 'xl',  label: 'XL', className: 'text-4xl sm:text-7xl' },
]

export const TITLE_SIZES: { value: string; label: string; className: string }[] = [
  { value: 'sm',  label: 'S',  className: 'text-4xl sm:text-5xl' },
  { value: 'md',  label: 'M',  className: 'text-2xl sm:text-6xl' },
  { value: 'lg',  label: 'L',  className: 'text-3xl sm:text-7xl' },
  { value: 'xl',  label: 'XL', className: 'text-4xl sm:text-8xl' },
]

export type ExtraServico = { nome: string; valor: string }
export type Proposta = { nome: string; servicos_foto: string[]; servicos_video: string[]; valor: string; notas?: string }

export type PageContent = {
  hero:         { title: string; titleFont: string; titleSize: string; titleColor: string; brandLine: string; brandColor: string }
  countdown:    { title: string; titleColor: string }
  video:        { label: string; title: string; urls: string[] }
  portfolio:    { label: string; title: string; titleFont: string; titleColor: string; photos: string[] }
  testimonials: { label: string; items: { text: string; author: string }[] }
  about:        { label: string; title: string; titleFont: string; titleColor: string; text: string; textColor: string }
  revista:      { visible: boolean; label: string; title: string; subtitle: string; imageUrl: string; buttonLabel: string; linkUrl: string }
  banner:       { message: string; signature: string }
  proposta:     { password: string; buttonLabel: string }
  propostas:    Proposta[]
  extras_proposta: ExtraServico[]
  propostaPage: {
    subtitle: string; intro: string
    about: { title: string; text: string; photo: string; videoUrl: string; titlePos: string }
    relive: { imageUrl: string; buttonUrl: string }
    couple: { imageUrl: string; title: string }
    reflexao: { imageUrl: string }
    final: { imageUrl: string }
    slidePhotos: Record<string, string>
    grandeDia: { title: string; p1: string; p2: string; p3: string; note: string; imageUrl: string }
    packages: { title: string; description: string; price: string }[]
    propostaAtiva: number
    ctaText: string
    typography: {
      titleFont: string; titleSize: string; titleColor: string
      accentColor: string
      bodyFont: string; bodyColor: string
      pkgTitleFont: string; pkgTitleColor: string
    }
  }
}

export const DEFAULT_CONTENT: PageContent = {
  hero: {
    title: 'Reunião Marcada', titleFont: 'playfair', titleSize: 'xl',
    titleColor: '#ffffff', brandLine: 'RL Photo · Video', brandColor: '#C9A84C',
  },
  countdown:    { title: 'Contagem Regressiva', titleColor: '#C9A84C' },
  video:        { label: 'O nosso trabalho', title: 'Vê como captamos cada momento.', urls: ['', '', ''] },
  portfolio: {
    label: 'Portfólio', title: 'Momentos que ficam para sempre.',
    titleFont: 'cormorant', titleColor: '#ffffff', photos: ['', '', ''],
  },
  testimonials: {
    label: 'O que dizem',
    items: [
      { text: 'Captaram cada momento com uma sensibilidade única. As nossas fotos são pura magia.', author: '— Ana & Pedro · Casamento 2024' },
      { text: 'Desde o primeiro contacto sentimos que estaríamos em boas mãos. Superaram todas as expectativas.', author: '— Sofia & Miguel · Casamento 2024' },
    ],
  },
  about: {
    label: 'Quem somos', title: 'RL Photo · Video', titleFont: 'cormorant',
    titleColor: '#ffffff',
    text: 'Somos especializados em fotografia e vídeo de casamentos. O nosso objetivo é preservar a autenticidade de cada momento — a emoção, os detalhes, as histórias que só acontecem uma vez.',
    textColor: '#666666',
  },
  revista: {
    visible: false,
    label: 'Revista',
    title: 'A nossa revista de casamentos',
    subtitle: 'Descobre o nosso método de trabalho e todos os serviços disponíveis ao detalhe. Fica a saber exatamente o que esperar de um casamento com a RL Photo · Video.',
    imageUrl: '',
    buttonLabel: 'Ver Revista',
    linkUrl: 'https://rl-menu-lake.vercel.app/secao/ee958740-f53f-4417-ad11-c01d0c42efa5',
  },
  banner: {
    message: 'Cada momento do vosso dia merece ser preservado para sempre. Estamos honrados em fazer parte desta história.',
    signature: '',
  },
  proposta:     { password: '', buttonLabel: 'Ver Proposta Criativa' },
  propostas: [
    { nome: 'Proposta 1', servicos_foto: [], servicos_video: [], valor: '' },
    { nome: 'Proposta 2', servicos_foto: [], servicos_video: [], valor: '' },
    { nome: 'Proposta 3', servicos_foto: [], servicos_video: [], valor: '' },
  ],
  extras_proposta: [] as ExtraServico[],
  propostaPage: {
    subtitle: 'Uma proposta criada especialmente para vocês.',
    intro: 'A vossa história é única — e é essa unicidade que merece ser preservada para sempre. Cada detalhe, cada olhar, cada momento é parte de algo que nunca mais se repetirá.',
    about: {
      title: 'Sobre Nós',
      text: '',
      photo: '',
      videoUrl: '',
      titlePos: 'top-right',
    },
    relive: {
      imageUrl: '',
      buttonUrl: '/login-noivos',
    },
    couple: {
      imageUrl: '',
      title: 'Os nossos noivos',
    },
    reflexao: {
      imageUrl: '',
    },
    final: {
      imageUrl: '',
    },
    slidePhotos: {},
    grandeDia: {
      title: 'o grande dia',
      p1: 'Nas preparações (sempre que possível), normalmente o que aconselhamos é reunir com as noivas 1 hora e 45 minutos e com os noivos cerca de 1 hora, antes da saída para a cerimónia.',
      p2: 'Por norma gostamos de chegar ao local da cerimónia 20 minutos antes do seu início, para conseguirmos recolher imagens do local antes do verdadeiro SIM.',
      p3: 'Junto à golden hour recomendamos reservarem 30 minutos (no máx.) para a sessão de casal.',
      note: '* Caso a preparação do noivo tenha que ser realizada antes das 08h00 é obrigatório 2 videógrafos, no entanto e se pretenderem a preparação do noivo não é realizada.',
      imageUrl: '',
    },
    packages: [
      { title: 'Essencial', description: 'Cobertura fotográfica completa do dia, edição premium e galeria online privada.', price: 'Sob consulta' },
      { title: 'Premium', description: 'Fotografia + Vídeo cinematográfico com highlights do dia e música personalizada.', price: 'Sob consulta' },
      { title: 'Luxe', description: 'Pacote completo com álbum premium, second shooter, pré-wedding e vídeo completo.', price: 'Sob consulta' },
    ],
    propostaAtiva: 0,
    ctaText: 'Falemos sobre o vosso dia especial',
    typography: {
      titleFont: 'cormorant', titleSize: 'xl', titleColor: '#ffffff',
      accentColor: '#C9A84C',
      bodyFont: 'cormorant', bodyColor: '#c8c0b0',
      pkgTitleFont: 'cormorant', pkgTitleColor: '#C9A84C',
    },
  },
}

function merge(saved: any): PageContent {
  if (!saved) return DEFAULT_CONTENT
  return {
    hero:         { ...DEFAULT_CONTENT.hero,         ...(saved.hero         || {}) },
    countdown:    { ...DEFAULT_CONTENT.countdown,    ...(saved.countdown    || {}) },
    video:        { ...DEFAULT_CONTENT.video,        ...(saved.video        || {}), urls: saved.video?.urls || DEFAULT_CONTENT.video.urls },
    portfolio:    { ...DEFAULT_CONTENT.portfolio,    ...(saved.portfolio    || {}), photos: saved.portfolio?.photos || DEFAULT_CONTENT.portfolio.photos },
    testimonials: { ...DEFAULT_CONTENT.testimonials, ...(saved.testimonials || {}), items: saved.testimonials?.items || DEFAULT_CONTENT.testimonials.items },
    about:        { ...DEFAULT_CONTENT.about,        ...(saved.about        || {}) },
    revista:      { ...DEFAULT_CONTENT.revista,      ...(saved.revista      || {}), linkUrl: saved.revista?.linkUrl ?? DEFAULT_CONTENT.revista.linkUrl },
    banner:       { ...DEFAULT_CONTENT.banner,       ...(saved.banner       || {}) },
    proposta:     { ...DEFAULT_CONTENT.proposta,     ...(saved.proposta     || {}) },
    propostas:       saved.propostas       || DEFAULT_CONTENT.propostas,
    extras_proposta: saved.extras_proposta || [],
    propostaPage: { ...DEFAULT_CONTENT.propostaPage, ...(saved.propostaPage || {}), about: { ...DEFAULT_CONTENT.propostaPage.about, ...(saved.propostaPage?.about || {}) }, relive: { ...DEFAULT_CONTENT.propostaPage.relive, ...(saved.propostaPage?.relive || {}) }, grandeDia: { ...DEFAULT_CONTENT.propostaPage.grandeDia, ...(saved.propostaPage?.grandeDia || {}) }, packages: saved.propostaPage?.packages || DEFAULT_CONTENT.propostaPage.packages, propostaAtiva: saved.propostaPage?.propostaAtiva ?? 0, typography: { ...DEFAULT_CONTENT.propostaPage.typography, ...(saved.propostaPage?.typography || {}) } },
  }
}

function toEmbedUrl(url: string): string | null {
  if (!url) return null
  // YouTube watch or short link
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1&color=white`
  // Vimeo
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?title=0&byline=0&portrait=0&color=C9A84C`
  // Already embed URL
  if (url.includes('/embed/') || url.includes('player.vimeo')) return url
  return null
}

// ─── UI helpers ──────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] tracking-[0.25em] text-white/30 uppercase">{label}</label>
      {children}
    </div>
  )
}

function TInput({ value, onChange, multiline }: { value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const cls = "w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold/40 placeholder:text-white/20 resize-none"
  return multiline
    ? <textarea rows={3} className={cls} value={value} onChange={e => onChange(e.target.value)} />
    : <input type="text" className={cls} value={value} onChange={e => onChange(e.target.value)} />
}

function FontPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      {FONTS.map(f => (
        <button key={f.value} onClick={() => onChange(f.value)}
          className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${value === f.value ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>
          {f.label}
        </button>
      ))}
    </div>
  )
}

function SizePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      {SIZES.map(s => (
        <button key={s.value} onClick={() => onChange(s.value)}
          className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${value === s.value ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>
          {s.label}
        </button>
      ))}
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg cursor-pointer border border-white/10 bg-transparent p-0.5" />
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold/40 font-mono" />
    </div>
  )
}

function AccordionSection({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen || false)
  return (
    <div className="border border-white/[0.07] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.03] transition-all">
        <span className="text-xs tracking-[0.2em] text-white/50 uppercase">{title}</span>
        <span className="text-white/20 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-4 flex flex-col gap-4 border-t border-white/[0.06]" style={{ paddingTop: '1rem' }}>{children}</div>}
    </div>
  )
}

function FadeIn({ children, delay = 0, className = '', style = {} }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const t = setTimeout(() => {
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
        { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
      )
      obs.observe(el)
      return () => obs.disconnect()
    }, 60)
    return () => clearTimeout(t)
  }, [])
  return (
    <div ref={ref} className={className} style={{
      ...style,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0px)' : 'translateY(22px)',
      transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
function fmtData(d: string) {
  if (!d) return ''
  try {
    const dt = new Date(d + 'T00:00:00')
    return `${String(dt.getDate()).padStart(2,'0')} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`
  } catch { return d }
}
function fmtHora(h: string) { return (h || '').slice(0, 5) }

function Countdown({ targetDate }: { targetDate: string }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    function tick() {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) return setT({ d: 0, h: 0, m: 0, s: 0 })
      setT({ d: Math.floor(diff/86400000), h: Math.floor((diff%86400000)/3600000), m: Math.floor((diff%3600000)/60000), s: Math.floor((diff%60000)/1000) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [targetDate])
  const Unit = ({ v, label }: { v: number; label: string }) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-5xl sm:text-7xl tabular-nums" style={{ fontFamily: "'Jost',sans-serif", fontWeight: 200, letterSpacing: '-.02em', color: 'var(--tx)' }}>{String(v).padStart(2,'0')}</span>
      <span className="text-[10px] tracking-[0.26em] uppercase" style={{ fontFamily: "'Space Mono',monospace", color: 'var(--tx-dim)' }}>{label}</span>
    </div>
  )
  const Sep = () => <span className="text-3xl sm:text-4xl self-start mt-2" style={{ color: 'var(--g)', opacity: .35, fontFamily: "'Jost',sans-serif", fontWeight: 200 }}>·</span>
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8">
      <Unit v={t.d} label="Dias"/><Sep/>
      <Unit v={t.h} label="Horas"/><Sep/>
      <Unit v={t.m} label="Min"/><Sep/>
      <Unit v={t.s} label="Seg"/>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LeadPageClient({ token, isAdmin }: { token: string; isAdmin: boolean }) {
  const [contact,    setContact]    = useState<Contact | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)
  const [status,     setStatus]     = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [propostaResposta,    setPropostaResposta]    = useState<'confirmada' | 'rejeitada' | null>(null)
  const [submittingProposta,  setSubmittingProposta]  = useState(false)

  // Hero photo
  const [heroPreview,  setHeroPreview]  = useState('')
  const [heroInput,    setHeroInput]    = useState('')
  const [editingHero,  setEditingHero]  = useState(false)
  const [savingHero,   setSavingHero]   = useState(false)
  const [heroSaved,    setHeroSaved]    = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Editor
  const [editorOpen,  setEditorOpen]  = useState(false)
  const [content,     setContent]     = useState<PageContent>(DEFAULT_CONTENT)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)

  // Photo upload refs for portfolio
  const photoRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null)
  const [uploadError,    setUploadError]    = useState<string | null>(null)
  const [saveError,      setSaveError]      = useState<string | null>(null)
  const [propostaPdfUrl, setPropostaPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/lead-page/view?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.contact) { setNotFound(true); setLoading(false); return }
        setContact(data.contact)
        setStatus(data.contact.page_confirmacao || null)
        setPropostaResposta(data.contact.proposta_resposta === 'confirmar' ? 'confirmada' : data.contact.proposta_resposta === 'rejeitar' ? 'rejeitada' : null)
        setPropostaPdfUrl(data.contact.proposta_pdf_url || null)
        setHeroPreview(data.contact.page_foto_url || DEFAULT_HERO)
        setHeroInput(data.contact.page_foto_url || '')
        setContent(merge(data.contact.page_content))
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token])

  // ── Scroll: barra de progresso + estado da nav ──
  useEffect(() => {
    const onScroll = () => {
      const st = window.scrollY || document.documentElement.scrollTop
      const h = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const prog = document.getElementById('rlp-prog')
      if (prog) prog.style.width = `${h > 0 ? (st / h) * 100 : 0}%`
      const bar = document.getElementById('rlp-bar')
      if (bar) bar.classList.toggle('s', st > 40)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Content updater helpers ──
  function setHero(k: keyof PageContent['hero'], v: string) {
    setContent(c => ({ ...c, hero: { ...c.hero, [k]: v } }))
  }
  function setCountdown(k: keyof PageContent['countdown'], v: string) {
    setContent(c => ({ ...c, countdown: { ...c.countdown, [k]: v } }))
  }
  function setVideo(k: keyof PageContent['video'], v: any) {
    setContent(c => ({ ...c, video: { ...c.video, [k]: v } }))
  }
  function setVideoUrl(i: number, v: string) {
    setContent(c => {
      const urls = [...c.video.urls]
      urls[i] = v
      return { ...c, video: { ...c.video, urls } }
    })
  }
  function setPortfolio(k: keyof PageContent['portfolio'], v: any) {
    setContent(c => ({ ...c, portfolio: { ...c.portfolio, [k]: v } }))
  }
  function setTestimonial(i: number, k: 'text' | 'author', v: string) {
    setContent(c => {
      const items = [...c.testimonials.items]
      items[i] = { ...items[i], [k]: v }
      return { ...c, testimonials: { ...c.testimonials, items } }
    })
  }
  function setAbout(k: keyof PageContent['about'], v: string) {
    setContent(c => ({ ...c, about: { ...c.about, [k]: v } }))
  }
  function setRevista(k: keyof PageContent['revista'], v: any) {
    setContent(c => ({ ...c, revista: { ...c.revista, [k]: v } }))
  }
  function setBanner(k: keyof PageContent['banner'], v: string) {
    setContent(c => ({ ...c, banner: { ...c.banner, [k]: v } }))
  }
  function setProposta(k: keyof PageContent['proposta'], v: string) {
    setContent(c => ({ ...c, proposta: { ...c.proposta, [k]: v } }))
  }
  function setPhoto(i: number, url: string) {
    setContent(c => {
      const photos = [...c.portfolio.photos]
      photos[i] = url
      return { ...c, portfolio: { ...c.portfolio, photos } }
    })
  }

  // ── Save content ──
  const handleSaveContent = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/lead-page/save-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, page_content: content }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        const d = await res.json().catch(() => ({}))
        setSaveError(d.error || `Erro ${res.status}`)
      }
    } catch {
      setSaveError('Erro de ligação ao guardar')
    }
    setSaving(false)
  }

  // ── Hero photo ──
  const handleSaveHero = async () => {
    setSavingHero(true)
    const res = await fetch('/api/lead-page/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, page_foto_url: heroInput || null }),
    })
    if (res.ok) {
      setHeroPreview(heroInput || DEFAULT_HERO)
      setContact(c => c ? { ...c, page_foto_url: heroInput || null } : c)
      setHeroSaved(true)
      setTimeout(() => { setHeroSaved(false); setEditingHero(false) }, 1500)
    }
    setSavingHero(false)
  }

  const handleUpload = async (file: File, cb: (url: string) => void, photoIndex?: number) => {
    if (photoIndex !== undefined) setUploadingPhoto(photoIndex)
    setUploadError(null)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        cb(data.url)
      } else {
        setUploadError(data.error || 'Erro ao carregar foto')
      }
    } catch {
      setUploadError('Erro de ligação ao carregar foto')
    } finally {
      if (photoIndex !== undefined) setUploadingPhoto(null)
    }
  }

  // ── Confirm / change ──
  const handleConfirm = async () => {
    setConfirming(true)
    await fetch(`/api/lead-page/confirm?token=${token}`, { method: 'POST' })
    setStatus('confirmada'); setConfirming(false)
  }
  const handleChangeRequest = async () => {
    setRequesting(true)
    await fetch('/api/lead-page/request-change-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    setStatus('alteracao_pedida')
    setRequesting(false)
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0b0a08' }}>
      <p className="tracking-[0.3em] text-xs uppercase animate-pulse" style={{ color: 'rgba(243,237,226,.4)', fontFamily: "'Space Mono', monospace" }}>A carregar…</p>
    </main>
  )
  if (notFound) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0b0a08' }}>
      <p className="tracking-[0.3em] text-xs uppercase" style={{ color: 'rgba(243,237,226,.4)', fontFamily: "'Space Mono', monospace" }}>Página não disponível</p>
    </main>
  )

  const heroImage  = heroPreview || DEFAULT_HERO
  const isVideo    = contact!.reuniao_tipo === 'Videochamada'
  const dataFmt    = fmtData(contact!.reuniao_data || '')
  const horaFmt    = fmtHora(contact!.reuniao_hora || '')
  const targetDate = contact!.reuniao_data && contact!.reuniao_hora
    ? `${contact!.reuniao_data}T${horaFmt}:00` : null

  const { hero, countdown, video, portfolio, testimonials, about, revista, banner, proposta } = content

  return (
    <div className="rl-portal min-h-screen">

      {/* ── DESIGN SYSTEM — RL PHOTO.VIDEO ── */}
      <style>{RLP_CSS}</style>

      {/* Atmosfera */}
      <div className="rlp-grain" aria-hidden />
      <div className="rlp-vig" aria-hidden />
      <div id="rlp-prog" className="rlp-prog" aria-hidden />

      {/* Barra de navegação fixa */}
      <header id="rlp-bar" className="rlp-bar" style={{ top: isAdmin ? 34 : 0 }}>
        <a href={`/r/${token}`} className="rlp-mono" aria-label="RL Photo · Video">
          <span>RL</span><i>Photo · Video</i>
        </a>
        <a href="/login-noivos" className="rlp-link-u">
          <span>Área de Cliente</span><span className="a">→</span>
        </a>
      </header>

      {/* ── ADMIN BAR ── */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-white/5">
          <a href="/crm" className="text-[10px] tracking-widest text-white/25 hover:text-white/50 transition-colors uppercase">‹ CRM</a>
          <span className="text-[10px] tracking-widest text-white/20 uppercase">Admin · Página do Cliente</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditingHero(true)}
              className="text-[10px] px-2.5 py-1 border border-white/10 rounded text-white/40 hover:text-white hover:border-white/30 transition-all uppercase tracking-wider">
              ✎ Foto
            </button>
            <button onClick={() => setEditorOpen(true)}
              className="text-[10px] px-2.5 py-1 border border-gold/30 rounded text-gold/70 hover:text-gold hover:border-gold/60 transition-all uppercase tracking-wider">
              ✎ Editar Página
            </button>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section id="sec-reuniao" className="relative flex items-end overflow-hidden" style={{ minHeight: '92svh', paddingTop: isAdmin ? 60 : 0 }}>
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(11,10,8,.35) 0%, rgba(11,10,8,.55) 45%, var(--ink) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(11,10,8,.62) 0%, rgba(11,10,8,.15) 55%, transparent 100%)' }} />
        </div>

        {/* Hero edit overlay */}
        {isAdmin && editingHero && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 backdrop-blur-sm">
            <div className="w-full max-w-md px-4">
              <p className="text-[10px] text-gold/60 tracking-widest uppercase mb-3 text-center">Trocar fotografia de fundo</p>
              <label className="flex items-center justify-center w-full py-3 rounded-xl border border-dashed border-white/20 hover:border-gold/50 hover:bg-gold/5 text-white/40 hover:text-gold/80 cursor-pointer transition-all mb-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, url => { setHeroInput(url); setHeroPreview(url) }) }} />
                <span className="text-sm">⬆ Carregar do dispositivo</span>
              </label>
              <input value={heroInput} onChange={e => { setHeroInput(e.target.value); setHeroPreview(e.target.value || DEFAULT_HERO) }}
                placeholder="ou cola um URL de imagem..."
                className="w-full bg-white/[0.08] border border-white/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50 mb-3 placeholder:text-white/25" />
              {heroPreview && <div className="w-full h-28 rounded-lg bg-cover bg-center mb-3 border border-white/10" style={{ backgroundImage: `url(${heroPreview})` }} />}
              <div className="flex gap-2 justify-center">
                <button onClick={() => { setEditingHero(false); setHeroPreview(contact!.page_foto_url || DEFAULT_HERO); setHeroInput(contact!.page_foto_url || '') }}
                  className="px-4 py-2 text-xs border border-white/15 rounded-lg text-white/50 hover:text-white/80 transition-all">Cancelar</button>
                <button onClick={handleSaveHero} disabled={savingHero}
                  className="px-5 py-2 text-xs bg-gold/20 border border-gold/40 rounded-lg text-gold hover:bg-gold/30 transition-all disabled:opacity-50">
                  {savingHero ? 'A guardar...' : heroSaved ? '✓ Guardado!' : '✓ Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isAdmin && !editingHero && (
          <button onClick={() => setEditingHero(true)}
            className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-[10px] text-white/50 hover:text-white transition-all backdrop-blur-sm">
            📷 Trocar foto
          </button>
        )}

        <div className="rlp-wrap relative z-10 w-full" style={{ paddingBottom: 'clamp(48px,8vh,110px)' }}>
          <FadeIn delay={80}>
            <span className="rlp-eyebrow" style={hero.brandColor && hero.brandColor !== '#C9A84C' ? { color: hero.brandColor } : undefined}>{hero.brandLine}</span>
          </FadeIn>
          <FadeIn delay={220}>
            <h1 className="rlp-h1" style={{ fontSize: 'clamp(42px,8vw,112px)', margin: '18px 0 0', maxWidth: '15ch', color: (hero.titleColor && hero.titleColor !== '#ffffff') ? hero.titleColor : undefined }}>
              {hero.title}
            </h1>
          </FadeIn>
          <FadeIn delay={380} className="mt-6 flex flex-col gap-3" style={{ maxWidth: '52ch' }}>
            {contact!.nome && <p className="rlp-ed" style={{ fontSize: 'clamp(20px,2.4vw,30px)', lineHeight: 1.2 }}><em>{contact!.nome}</em></p>}
            {dataFmt && <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--tx-mid)' }}>{dataFmt} · {horaFmt} · {contact!.reuniao_tipo || 'Presencial'}</p>}
          </FadeIn>
        </div>
      </section>

      {/* ── COUNTDOWN ── */}
      {targetDate && (
        <section id="sec-countdown" className="border-y" style={{ borderColor: 'var(--line-soft)', background: 'var(--ink-2)' }}>
          <div className="rlp-wrap flex flex-col items-center gap-8" style={{ paddingTop: 'clamp(46px,7vh,88px)', paddingBottom: 'clamp(46px,7vh,88px)' }}>
            <FadeIn><span className="rlp-eyebrow c">{countdown.title}</span></FadeIn>
            <FadeIn delay={150}><Countdown targetDate={targetDate} /></FadeIn>
          </div>
        </section>
      )}

      {/* ── CARD REUNIÃO ── */}
      <section className="rlp-sec" style={{ paddingLeft: 'var(--pad)', paddingRight: 'var(--pad)' }}>
        <div className="mx-auto flex flex-col items-center md:flex-row md:items-stretch md:justify-center gap-6 md:gap-8" style={{ maxWidth: 900 }}>
        <FadeIn className="w-full flex flex-col gap-3" style={{ maxWidth: 420 }}>
        <div className="rlp-card w-full flex-1">
          <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--line-soft)' }}>
            <span className="rlp-eyebrow">Detalhes da Reunião</span>
          </div>
          <div style={{ padding: '8px 26px 20px' }}>
            <div className="rlp-drow"><span className="k">Data</span><span className="v">{dataFmt}</span></div>
            <div className="rlp-drow"><span className="k">Hora</span><span className="v">{horaFmt}</span></div>
            <div className="rlp-drow"><span className="k">Modo</span><span className="v">{contact!.reuniao_tipo || 'Presencial'}</span></div>
          </div>
          {contact!.reuniao_link && (
            <div style={{ padding: '0 26px 18px' }}>
              <a href={contact!.reuniao_link} target="_blank" rel="noopener noreferrer" className="rlp-btn ghost full">
                <span className="fill" /><span className="dot" />{isVideo ? 'Entrar na videochamada' : 'Ver localização'}
              </a>
            </div>
          )}
          {targetDate && (() => {
            const fmt = (d: string, h: string) => `${d.replace(/-/g,'') }T${h.replace(':','')}00`
            const start = fmt(contact!.reuniao_data, horaFmt)
            const end   = fmt(contact!.reuniao_data, String(parseInt(horaFmt.split(':')[0]) + 1).padStart(2,'0') + ':' + horaFmt.split(':')[1])
            const title = encodeURIComponent('Reunião RL Photo · Video')
            const loc   = encodeURIComponent(contact!.reuniao_link || (contact!.reuniao_tipo === 'Videochamada' ? 'Videochamada' : 'Presencial'))
            const gcal  = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${loc}`
            const downloadIcs = () => {
              const ics = [
                'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//RL Photo//Video//PT',
                'BEGIN:VEVENT',
                `DTSTART:${start}`, `DTEND:${end}`,
                `SUMMARY:Reunião RL Photo · Video`,
                `LOCATION:${decodeURIComponent(loc)}`,
                'END:VEVENT','END:VCALENDAR'
              ].join('\r\n')
              const blob = new Blob([ics], { type: 'text/calendar' })
              const url  = URL.createObjectURL(blob)
              const a    = Object.assign(document.createElement('a'), { href: url, download: 'reuniao-rl-photo.ics' })
              a.click(); URL.revokeObjectURL(url)
            }
            return (
              <div style={{ padding: '4px 26px 24px' }} className="flex flex-col items-center gap-3">
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--tx-dim)' }}>Adicionar ao Calendário</p>
                <div className="flex gap-2 w-full">
                  <a href={gcal} target="_blank" rel="noopener noreferrer" className="rlp-calbtn">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.5 3h-1V1h-2v2h-9V1h-2v2h-1A2.5 2.5 0 0 0 2 5.5v15A2.5 2.5 0 0 0 4.5 23h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 19.5 3zM20 20.5a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5V10h16v10.5zM20 8H4V5.5a.5.5 0 0 1 .5-.5H6v1h2V5h9v1h2V5h.5a.5.5 0 0 1 .5.5V8z"/></svg>
                    Google
                  </a>
                  <button onClick={downloadIcs} className="rlp-calbtn">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    Apple
                  </button>
                </div>
              </div>
            )
          })()}
        </div>

          {/* Status badge */}
          {status === 'confirmada' && (
            <div className="w-full flex items-center justify-center gap-2 rounded-lg"
              style={{ padding: '14px 20px', background: 'rgba(216,190,147,.08)', color: 'var(--g)', border: '1px solid rgba(216,190,147,.28)', fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase' }}>
              ✦&nbsp; Reunião Confirmada · Até breve
            </div>
          )}
          {status === 'alteracao_pedida' && (
            <div className="w-full flex items-center justify-center gap-2 rounded-lg"
              style={{ padding: '14px 20px', background: 'rgba(243,237,226,.05)', color: 'var(--tx-mid)', border: '1px solid var(--line)', fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase' }}>
              Pedido enviado · Entraremos em contacto
            </div>
          )}

          {/* Confirmar — só se ainda não confirmou */}
          {status !== 'confirmada' && (
            <button onClick={handleConfirm} disabled={confirming || isAdmin} className="rlp-btn full">
              <span className="fill" /><span className="dot" />{confirming ? 'A confirmar…' : 'Confirmar Reunião'}
            </button>
          )}

          {/* Alterar — sempre visível */}
          <button onClick={handleChangeRequest} disabled={requesting || isAdmin} className="rlp-btn ghost full">
            <span className="fill" /><span className="dot" />{requesting ? 'A enviar…' : 'Alterar Reunião'}
          </button>
        </FadeIn>

        <FadeIn delay={150} className="w-full flex flex-col gap-3" style={{ maxWidth: 420 }}>

          {/* ── Proposta: Confirmar / Rejeitar ── */}
          {(() => {
            const handleProposta = async (action: 'confirmar' | 'rejeitar') => {
              setSubmittingProposta(true)
              try {
                const res = await fetch('/api/lead-page/proposta-response', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token, action }),
                })
                const data = await res.json()
                console.log('[proposta-response]', res.status, data)
                if (res.ok) {
                  setPropostaResposta(action === 'confirmar' ? 'confirmada' : 'rejeitada')
                }
              } catch (e) { console.error('[proposta-response] erro:', e) }
              setSubmittingProposta(false)
            }

            if (propostaResposta === 'confirmada') return (
              <div className="flex flex-col gap-3 w-full flex-1">
                <div className="rlp-card w-full text-center flex-1" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', border: '1px solid var(--g)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--g)', fontSize: 20 }}>✦</span>
                  </div>
                  <div>
                    <p className="rlp-h2" style={{ fontSize: 'clamp(24px,3.4vw,34px)' }}>Obrigado por <em>nos escolherem</em></p>
                    <p className="rlp-ed" style={{ fontSize: 18, marginTop: 6 }}>para o vosso grande dia</p>
                  </div>
                  <p className="rlp-lede" style={{ fontSize: 14, maxWidth: '40ch' }}>
                    Estamos muito felizes por fazer parte deste momento tão especial. Para dar seguimento ao contrato, avancem abaixo.
                  </p>
                </div>
                <a href="/contrato-cps/casamento" className="rlp-btn full">
                  <span className="fill" /><span className="dot" />Próximo Passo
                </a>
              </div>
            )

            if (propostaResposta === 'rejeitada') return (
              <div className="rlp-card w-full text-center flex-1" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                <p className="rlp-h2" style={{ fontSize: 'clamp(22px,3vw,30px)' }}>Obrigado pelo <em>vosso tempo</em></p>
                <p className="rlp-lede" style={{ fontSize: 14, maxWidth: '42ch' }}>
                  Foi um prazer conhecer-vos e esperamos poder trabalhar juntos no futuro. Desejamos-vos o melhor para o vosso dia especial.
                </p>
              </div>
            )

            return (
              <div className="flex flex-col gap-3 w-full flex-1">
                {/* Card de destaque */}
                <div className="rlp-card w-full text-center flex-1" style={{ padding: '30px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(216,190,147,.1)', border: '1px solid rgba(216,190,147,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--g)', fontSize: 18 }}>✦</span>
                  </div>
                  <div>
                    <p className="rlp-eyebrow c" style={{ marginBottom: 10 }}>A vossa decisão</p>
                    <p className="rlp-h2" style={{ fontSize: 'clamp(22px,3vw,30px)' }}>Confirmam a nossa <em>proposta?</em></p>
                  </div>
                </div>
                {/* Confirmar */}
                <button onClick={() => handleProposta('confirmar')} disabled={submittingProposta} className="rlp-btn full">
                  <span className="fill" /><span className="dot" />{submittingProposta ? 'A processar…' : 'Confirmar Proposta'}
                </button>
                {/* Rejeitar — discreto */}
                <button onClick={() => handleProposta('rejeitar')} disabled={submittingProposta} className="rlp-btn danger full">
                  <span className="fill" /><span className="dot" />{submittingProposta ? '…' : 'Rejeitar Proposta'}
                </button>
              </div>
            )
          })()}

        </FadeIn>
        </div>
        {isAdmin && <p className="text-center" style={{ marginTop: 22, fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--tx-dim)' }}>Botões desativados em modo admin</p>}
      </section>

      {/* ── VÍDEO ── */}
      {(video.urls.some(u => u) || isAdmin) && (
        <section id="sec-video" className="rlp-sec" style={{ background: 'var(--ink-2)' }}>
          <div className="rlp-wrap">
            <FadeIn><span className="rlp-eyebrow">{video.label}</span></FadeIn>
            <FadeIn delay={120}><h2 className="rlp-h2" style={{ marginTop: 16, marginBottom: 40, maxWidth: '18ch' }}>{video.title}</h2></FadeIn>
            <FadeIn delay={240}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {video.urls.map((url, i) => {
                const embed = toEmbedUrl(url)
                if (embed) return (
                  <div key={i} className="overflow-hidden" style={{ aspectRatio: '16/9', border: '1px solid var(--line-soft)', borderRadius: 10 }}>
                    <iframe src={embed} className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen />
                  </div>
                )
                if (isAdmin) return (
                  <div key={i} className="rlp-slot" style={{ aspectRatio: '16/9', borderRadius: 10 }}>
                    <div className="lab">▶ · Vídeo {i + 1}</div>
                  </div>
                )
                return null
              })}
            </div>
            </FadeIn>
          </div>
        </section>
      )}

      <div className="rlp-div" />

      {/* ── PORTFÓLIO ── */}
      <section id="sec-portfolio" className="rlp-sec">
        <div className="rlp-wrap">
          <FadeIn><span className="rlp-eyebrow">{portfolio.label}</span></FadeIn>
          <FadeIn delay={120}>
            <h2 className="rlp-h2" style={{ marginTop: 16, marginBottom: 40, maxWidth: '20ch', color: (portfolio.titleColor && portfolio.titleColor !== '#ffffff') ? portfolio.titleColor : undefined }}>
              {portfolio.title}
            </h2>
          </FadeIn>
          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            {portfolio.photos.map((url, i) => (
              <FadeIn key={i} delay={i * 120} className="aspect-square">
                <div className="rlp-slot w-full h-full" style={{ borderRadius: 10 }}>
                  {url ? <img src={url} alt="" /> : <div className="lab">Foto {i + 1}</div>}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <div className="rlp-div" />

      {/* ── REVISTA ── */}
      {(revista.visible || isAdmin) && (
        <section className="rlp-sec" style={{ background: 'var(--ink)' }}>
          <div className="rlp-wrap">
          {isAdmin && !revista.visible && (
            <div className="mb-8" style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 40, border: '1px dashed rgba(216,190,147,.3)', fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(216,190,147,.4)' }}>
              Secção Oculta · ativa no editor
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center gap-12">
            <FadeIn delay={200} className="flex-shrink-0">
              {revista.imageUrl ? (
                <div className="rlp-slot" style={{ width: 200, aspectRatio: '2/3', borderRadius: 8 }}>
                  <img src={revista.imageUrl} alt="Revista" />
                </div>
              ) : isAdmin ? (
                <div className="rlp-slot" style={{ width: 200, aspectRatio: '2/3', borderRadius: 8 }}><div className="lab">◻ · Capa</div></div>
              ) : null}
            </FadeIn>
            <FadeIn delay={300} className="flex flex-col items-start gap-6">
              <span className="rlp-eyebrow">{revista.label || 'Edição Exclusiva'}</span>
              <h2 className="rlp-h2" style={{ fontSize: 'clamp(28px,4vw,48px)' }}>{revista.title}</h2>
              {revista.subtitle && <p className="rlp-lede" style={{ maxWidth: '46ch' }}>{revista.subtitle}</p>}
              <a href={revista.linkUrl} target="_blank" rel="noopener noreferrer" className="rlp-btn">
                <span className="fill" /><span className="dot" />{revista.buttonLabel || 'Ver Revista'}
              </a>
            </FadeIn>
          </div>
          </div>
        </section>
      )}

      <div className="rlp-div" />

      {/* ── TESTEMUNHOS ── */}
      <section id="sec-testemunhos" className="rlp-sec">
        <div className="rlp-wrap flex flex-col items-center gap-12" style={{ maxWidth: 900 }}>
          <FadeIn><span className="rlp-eyebrow c">{testimonials.label}</span></FadeIn>
          {testimonials.items.map((item, i) => (
            <FadeIn key={i} delay={i * 150} className="w-full">
              <blockquote className="text-center flex flex-col items-center gap-5">
                <p className="rlp-ed" style={{ fontSize: 'clamp(20px,2.6vw,32px)', fontStyle: 'italic', lineHeight: 1.5, color: 'var(--tx)' }}>“{item.text}”</p>
                <cite style={{ fontFamily: "'Space Mono',monospace", fontStyle: 'normal', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--g)' }}>{item.author}</cite>
              </blockquote>
              {i < testimonials.items.length - 1 && <div style={{ width: 40, height: 1, background: 'rgba(216,190,147,.3)', margin: '48px auto 0' }} />}
            </FadeIn>
          ))}
        </div>
      </section>

      <div className="rlp-div" />

      {/* ── BANNER ── */}
      <section className="rlp-sec" style={{ background: 'var(--ink-2)' }}>
        <div className="rlp-wrap">
        <FadeIn>
          <div className="rlp-card" style={{ padding: 'clamp(32px,5vw,64px)' }}>
            <div className="flex flex-col md:flex-row md:items-center gap-10 relative z-10">
              {/* Esquerda — frase */}
              <div className="flex-1 flex flex-col gap-5">
                <span className="rlp-eyebrow">Uma palavra nossa</span>
                <p className="rlp-ed" style={{ fontSize: 'clamp(22px,3vw,34px)', fontStyle: 'italic', lineHeight: 1.45, color: 'var(--tx)' }}>
                  &ldquo;{banner.message}&rdquo;
                </p>
                {banner.signature && (
                  <p className="rlp-ed" style={{ fontSize: 18, color: 'var(--g)' }}>{banner.signature}</p>
                )}
              </div>
              {/* Direita — botões */}
              <div className="flex flex-col items-stretch gap-3 md:w-72 flex-shrink-0">
                <a href={`/r/${token}/proposta`} className="rlp-btn full">
                  <span className="fill" /><span className="dot" />{proposta.buttonLabel}
                </a>
                {propostaPdfUrl && (
                  <a href={propostaPdfUrl} target="_blank" rel="noopener noreferrer" className="rlp-btn ghost full">
                    <span className="fill" /><span className="dot" />Ver Proposta PDF
                  </a>
                )}
              </div>
            </div>
          </div>
        </FadeIn>
        </div>
      </section>

      <div className="rlp-div" />

      {/* ── SOBRE NÓS ── */}
      <section id="sec-sobre" className="rlp-sec">
        <div className="rlp-wrap flex flex-col items-center text-center gap-6" style={{ maxWidth: 760 }}>
          <FadeIn><span className="rlp-eyebrow c">{about.label}</span></FadeIn>
          <FadeIn delay={120}>
            <h2 className="rlp-h2">{about.title}</h2>
          </FadeIn>
          <FadeIn delay={240}>
            <p className="rlp-lede" style={{ color: (about.textColor && about.textColor !== '#666666') ? about.textColor : undefined }}>{about.text}</p>
          </FadeIn>
          <FadeIn delay={340}>
            <p className="rlp-ed" style={{ fontStyle: 'italic', fontSize: 'clamp(18px,2.4vw,26px)', color: 'var(--g)', marginTop: 8 }}>registamos com foco na verdade</p>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="rlp-foot">
        <div className="rlp-wrap">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.5fr_1fr_1fr] md:gap-8">
            <FadeIn>
              <h2 className="rlp-h2" style={{ fontSize: 'clamp(28px,3.4vw,44px)', maxWidth: '14ch' }}>Vamos <em>registar</em> a vossa história</h2>
              <a href="/nova-lead" className="rlp-btn" style={{ marginTop: 28 }}><span className="fill" /><span className="dot" />Iniciar Conversa</a>
            </FadeIn>
            <FadeIn delay={100} className="flex flex-col gap-3">
              <h5>Contactos</h5>
              <a href="mailto:geral.rlphoto@gmail.com">geral.rlphoto@gmail.com</a>
              <a href="tel:+351912932768">912 932 768</a>
              <span style={{ color: 'var(--tx-mid)' }}>Pinhal Novo, Palmela</span>
            </FadeIn>
            <FadeIn delay={180} className="flex flex-col gap-3">
              <h5>Seguir</h5>
              <a href="https://www.instagram.com/rlphoto_fotografia.video/" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://www.facebook.com/people/RL_Photo/100089058572642/" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="/login-noivos">Área de Cliente</a>
            </FadeIn>
          </div>
        </div>
        <div className="end">
          <span>© RL Photo · Video</span>
          <span>registamos com foco na verdade</span>
        </div>
      </footer>

      {/* ── WHATSAPP ── */}
      {!isAdmin && (
        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="rlp-wa" aria-label="WhatsApp">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}

      {/* ══════════════════════════════════════════════
          EDITOR PANEL (admin only)
      ══════════════════════════════════════════════ */}
      {isAdmin && (
        <>
          {/* Overlay */}
          {editorOpen && <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setEditorOpen(false)} />}

          {/* Panel */}
          <div className={`fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${editorOpen ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ width: '320px', background: '#0d0d0d', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-xs tracking-widest text-white/60 uppercase">Editor</p>
                <p className="text-[10px] text-white/20 mt-0.5">Alterações em tempo real</p>
              </div>
              <button onClick={() => setEditorOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all">✕</button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

              {/* ── HERO ── */}
              <AccordionSection title="Hero" defaultOpen>
                <Field label="Título">
                  <TInput value={hero.title} onChange={v => setHero('title', v)} />
                </Field>
                <Field label="Tipo de letra">
                  <FontPicker value={hero.titleFont} onChange={v => setHero('titleFont', v)} />
                </Field>
                <Field label="Tamanho">
                  <SizePicker value={hero.titleSize} onChange={v => setHero('titleSize', v)} />
                </Field>
                <Field label="Cor do título">
                  <ColorPicker value={hero.titleColor} onChange={v => setHero('titleColor', v)} />
                </Field>
                <Field label="Linha da marca">
                  <TInput value={hero.brandLine} onChange={v => setHero('brandLine', v)} />
                </Field>
                <Field label="Cor da marca">
                  <ColorPicker value={hero.brandColor} onChange={v => setHero('brandColor', v)} />
                </Field>
              </AccordionSection>

              {/* ── CONTAGEM ── */}
              <AccordionSection title="Contagem Regressiva">
                <Field label="Título">
                  <TInput value={countdown.title} onChange={v => setCountdown('title', v)} />
                </Field>
                <Field label="Cor do título">
                  <ColorPicker value={countdown.titleColor} onChange={v => setCountdown('titleColor', v)} />
                </Field>
              </AccordionSection>

              {/* ── VÍDEO ── */}
              <AccordionSection title="Vídeo">
                <Field label="Etiqueta">
                  <TInput value={video.label} onChange={v => setVideo('label', v)} />
                </Field>
                <Field label="Título">
                  <TInput value={video.title} onChange={v => setVideo('title', v)} />
                </Field>
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex flex-col gap-1 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[10px] tracking-widest text-white/25 uppercase mb-1">Vídeo {i + 1}</p>
                    <input
                      type="text"
                      placeholder="https://youtube.com/watch?v=..."
                      value={video.urls[i] || ''}
                      onChange={e => setVideoUrl(i, e.target.value)}
                      className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold/40 placeholder:text-white/20"
                    />
                    {video.urls[i] && (
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-[10px] ${toEmbedUrl(video.urls[i]) ? 'text-green-400/70' : 'text-red-400/70'}`}>
                          {toEmbedUrl(video.urls[i]) ? '✓ Válido' : '✕ Inválido'}
                        </p>
                        <button onClick={() => setVideoUrl(i, '')}
                          className="text-[9px] text-white/20 hover:text-red-400 transition-colors">
                          ✕ remover
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </AccordionSection>

              {/* ── PORTFÓLIO ── */}
              <AccordionSection title="Portfólio">
                <Field label="Etiqueta">
                  <TInput value={portfolio.label} onChange={v => setPortfolio('label', v)} />
                </Field>
                <Field label="Título">
                  <TInput value={portfolio.title} onChange={v => setPortfolio('title', v)} />
                </Field>
                <Field label="Tipo de letra">
                  <FontPicker value={portfolio.titleFont} onChange={v => setPortfolio('titleFont', v)} />
                </Field>
                <Field label="Cor do título">
                  <ColorPicker value={portfolio.titleColor} onChange={v => setPortfolio('titleColor', v)} />
                </Field>
                <Field label="Fotos (3)">
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="flex flex-col gap-1">
                        <label className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:border-gold/40 transition-all group"
                          style={{ background: portfolio.photos[i] ? undefined : 'rgba(255,255,255,0.04)' }}>
                          <input ref={photoRefs[i]} type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, url => setPhoto(i, url), i) }} />
                          {portfolio.photos[i]
                            ? <img src={portfolio.photos[i]} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                <span className="text-white/20 text-lg">⬆</span>
                                <span className="text-white/20 text-[9px] tracking-wider">Foto {i+1}</span>
                              </div>
                          }
                          {/* Loading overlay */}
                          {uploadingPhoto === i && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1">
                              <span className="text-white/70 text-lg animate-spin">⟳</span>
                              <span className="text-white/40 text-[9px]">A enviar...</span>
                            </div>
                          )}
                          {uploadingPhoto !== i && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                              <span className="text-white text-xs">Trocar</span>
                            </div>
                          )}
                        </label>
                        {portfolio.photos[i] && (
                          <button onClick={() => setPhoto(i, '')}
                            className="text-[9px] text-white/20 hover:text-red-400 transition-colors text-center tracking-wider">
                            ✕ remover
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </Field>
              </AccordionSection>

              {/* ── TESTEMUNHOS ── */}
              <AccordionSection title="Testemunhos">
                <Field label="Etiqueta">
                  <TInput value={testimonials.label} onChange={v => setContent(c => ({ ...c, testimonials: { ...c.testimonials, label: v } }))} />
                </Field>
                {testimonials.items.map((item, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[10px] tracking-widest text-white/20 uppercase">Testemunho {i + 1}</p>
                    <Field label="Texto">
                      <TInput value={item.text} onChange={v => setTestimonial(i, 'text', v)} multiline />
                    </Field>
                    <Field label="Autor">
                      <TInput value={item.author} onChange={v => setTestimonial(i, 'author', v)} />
                    </Field>
                  </div>
                ))}
              </AccordionSection>

              {/* ── PROPOSTA ── */}
              <AccordionSection title="Proposta Criativa">
                <Field label="Texto do botão">
                  <TInput value={proposta.buttonLabel} onChange={v => setProposta('buttonLabel', v)} />
                </Field>
                <Field label="Password de acesso">
                  <TInput value={proposta.password} onChange={v => setProposta('password', v)} />
                </Field>
                {!proposta.password && (
                  <p className="text-[10px] text-amber-400/60 text-center">Sem password → qualquer pessoa com o link acede</p>
                )}
              </AccordionSection>

              {/* ── BANNER ── */}
              <AccordionSection title="Banner">
                <Field label="Mensagem / Frase">
                  <TInput value={banner.message} onChange={v => setBanner('message', v)} multiline />
                </Field>
                <Field label="Assinatura (ex: Ana & Pedro ♡)">
                  <TInput value={banner.signature} onChange={v => setBanner('signature', v)} />
                </Field>
              </AccordionSection>

              {/* ── REVISTA ── */}
              <AccordionSection title="Revista">
                <button onClick={() => setRevista('visible', !revista.visible)}
                  className="w-full py-2 rounded-lg text-xs tracking-[0.2em] uppercase transition-all"
                  style={revista.visible
                    ? { background: 'rgba(216,190,147,0.15)', color: '#d8be93', border: '1px solid rgba(216,190,147,0.3)' }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {revista.visible ? '● Visível' : '○ Oculta'}
                </button>
                <Field label="Etiqueta"><TInput value={revista.label} onChange={v => setRevista('label', v)} /></Field>
                <Field label="Título"><TInput value={revista.title} onChange={v => setRevista('title', v)} /></Field>
                <Field label="Subtítulo"><TInput value={revista.subtitle} onChange={v => setRevista('subtitle', v)} multiline /></Field>
                <Field label="Capa (imagem)">
                  <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs cursor-pointer transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.35)' }}>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, url => setRevista('imageUrl', url)) }} />
                    {revista.imageUrl ? '✓ Trocar capa' : '⬆ Carregar capa'}
                  </label>
                  {revista.imageUrl && (
                    <div className="relative mt-1 rounded-lg overflow-hidden" style={{ height: '90px' }}>
                      <img src={revista.imageUrl} alt="" className="w-full h-full object-cover opacity-70" />
                      <button onClick={() => setRevista('imageUrl', '')}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                        style={{ background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.5)' }}>✕</button>
                    </div>
                  )}
                </Field>
                <Field label="Texto do botão"><TInput value={revista.buttonLabel} onChange={v => setRevista('buttonLabel', v)} /></Field>
                <Field label="Link da revista">
                  <TInput value={revista.linkUrl} onChange={v => setRevista('linkUrl', v)} placeholder="https://..." />
                </Field>
              </AccordionSection>

              {/* ── SOBRE NÓS ── */}
              <AccordionSection title="Sobre Nós">
                <Field label="Etiqueta">
                  <TInput value={about.label} onChange={v => setAbout('label', v)} />
                </Field>
                <Field label="Título">
                  <TInput value={about.title} onChange={v => setAbout('title', v)} />
                </Field>
                <Field label="Tipo de letra">
                  <FontPicker value={about.titleFont} onChange={v => setAbout('titleFont', v)} />
                </Field>
                <Field label="Cor do título">
                  <ColorPicker value={about.titleColor} onChange={v => setAbout('titleColor', v)} />
                </Field>
                <Field label="Texto">
                  <TInput value={about.text} onChange={v => setAbout('text', v)} multiline />
                </Field>
                <Field label="Cor do texto">
                  <ColorPicker value={about.textColor} onChange={v => setAbout('textColor', v)} />
                </Field>
              </AccordionSection>

            </div>

            {/* Save button */}
            <div className="px-4 py-4 border-t flex flex-col gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {uploadError && (
                <p className="text-[11px] text-red-400 text-center bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
                  ✕ {uploadError}
                </p>
              )}
              {saveError && (
                <p className="text-[11px] text-red-400 text-center bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
                  ✕ {saveError}
                </p>
              )}
              <button onClick={handleSaveContent} disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold tracking-[0.1em] uppercase transition-all disabled:opacity-50"
                style={{ background: saved ? 'rgba(74,222,128,0.15)' : 'rgba(216,190,147,0.15)', color: saved ? '#4ade80' : '#d8be93', border: `1px solid ${saved ? 'rgba(74,222,128,0.3)' : 'rgba(216,190,147,0.3)'}` }}>
                {saving ? 'A guardar...' : saved ? '✓ Guardado!' : 'Guardar Alterações'}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
