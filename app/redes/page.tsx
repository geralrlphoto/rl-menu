import Link from 'next/link'

const REDES = [
  {
    id: 'instagram',
    label: 'Instagram',
    handle: '@rlphoto_fotografia.video',
    href: 'https://www.instagram.com/rlphoto_fotografia.video/',
    color: '#E1306C',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    handle: 'RL Photo',
    href: 'https://www.facebook.com/people/RL_Photo/100089058572642/?locale=pt_PT',
    color: '#1877F2',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: 'youtube',
    label: 'YouTube',
    handle: '@rlphotovideo3062',
    href: 'https://www.youtube.com/@rlphotovideo3062',
    color: '#FF0000',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    id: 'site',
    label: 'Website',
    handle: 'rlphotovideo.pt',
    href: 'https://rlphotovideo.pt',
    color: '#C9A84C',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
]

export default function RedesPage() {
  return (
    <main className="min-h-screen bg-[#080808] flex flex-col px-4 py-12 max-w-2xl mx-auto">

      {/* Voltar */}
      <Link
        href="/photo"
        className="inline-flex items-center gap-2 text-[10px] tracking-[0.35em] text-white/30 hover:text-[#C9A84C] transition-colors mb-12 uppercase"
      >
        ‹ Menu
      </Link>

      {/* Header */}
      <header className="mb-12">
        <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">RL PHOTO.VIDEO</p>
        <h1 className="text-3xl font-extralight tracking-[0.2em] text-[#C9A84C] uppercase">
          Redes Sociais
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px w-12 bg-[#C9A84C]/50" />
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>
      </header>

      {/* Links */}
      <div className="flex flex-col gap-px bg-white/[0.04]">
        {REDES.map((rede, i) => (
          <a
            key={rede.id}
            href={rede.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center gap-5 px-6 py-5 overflow-hidden
                       border-l-2 border border-white/[0.06] bg-white/[0.015]
                       hover:bg-white/[0.04] transition-colors duration-300"
            style={{ borderLeftColor: `${rede.color}50` }}
          >
            {/* Sweep hover */}
            <div
              className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"
              style={{ background: `linear-gradient(90deg, ${rede.color}08, transparent)` }}
            />

            {/* Índice */}
            <span className="relative z-10 text-[10px] font-mono text-white/15 w-5 shrink-0 select-none">
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Ícone */}
            <span
              className="relative z-10 shrink-0 transition-colors duration-300"
              style={{ color: `${rede.color}60` }}
            >
              <span className="group-hover:scale-110 transition-transform duration-200 block"
                style={{ color: rede.color }}>
                {rede.icon}
              </span>
            </span>

            {/* Texto */}
            <div className="relative z-10 flex-1">
              <p className="text-[11px] tracking-[0.3em] font-medium text-white/60 group-hover:text-white uppercase transition-colors duration-200">
                {rede.label}
              </p>
              <p className="text-[10px] text-white/25 mt-0.5 font-mono">{rede.handle}</p>
            </div>

            {/* Seta */}
            <span className="relative z-10 text-white/20 group-hover:text-white/60 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200 text-xs">
              ↗
            </span>
          </a>
        ))}
      </div>

    </main>
  )
}
