/* Icons de linha (24x24 viewBox, stroke 1.3) — direção Atmosphère */

type IconProps = { className?: string; size?: number }
const base = (size = 24) => ({
  width: size, height: size, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.3,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
})

export function MenuIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M4 7h16M4 12h16M4 17h16" /></svg>)
}
export function StarIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M12 3l2.6 5.7L20 9.4l-4 4 1 5.7-5-2.7-5 2.7 1-5.7-4-4 5.4-.7z" /></svg>)
}
export function CalendarIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>)
}
export function DocumentIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M6 3h9l5 5v13H6z" /><path d="M14 3v6h6" /></svg>)
}
export function CardIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h4" /></svg>)
}
export function BookIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z" /><path d="M9 7h7M9 11h7M9 15h5" /></svg>)
}
export function CameraIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M3 8a2 2 0 0 1 2-2h3l2-2h4l2 2h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="4" /></svg>)
}
export function MusicIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>)
}
export function HeartIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M12 21s-7-4.5-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.5-7 11-7 11z" /></svg>)
}
export function GiftIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M3 12h18M12 8v13M12 8a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM12 8a3 3 0 1 0 3-3 3 3 0 0 0-3 3z" /></svg>)
}
export function HomeIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></svg>)
}
export function ShieldIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6z" /></svg>)
}
export function ClockIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>)
}
export function CheckIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M4 12l5 5L20 6" /></svg>)
}
export function ArrowUpRightIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><path d="M7 17L17 7M9 7h8v8" /></svg>)
}
export function MailIcon({ className, size = 18 }: IconProps) {
  return (<svg {...base(size)} className={className}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>)
}

/** Devolve o ícone para um item de nav baseado no título. */
export function getNavIconFor(title: string, size = 18) {
  const t = (title ?? '').toUpperCase()
  if (t.includes('SOBRE'))      return <StarIcon size={size} />
  if (t.includes('ATEND'))      return <CalendarIcon size={size} />
  if (t.includes('CONTRAT'))    return <DocumentIcon size={size} />
  if (t.includes('PAGAMENT'))   return <CardIcon size={size} />
  if (t.includes('GUIA') && t.includes('PRÉ'))    return <BookIcon size={size} />
  if (t.includes('GUIA'))       return <BookIcon size={size} />
  if (t.includes('FOTO'))       return <CameraIcon size={size} />
  if (t.includes('BANDA') || t.includes('MÚSIC') || t.includes('MUSIC'))  return <MusicIcon size={size} />
  if (t.includes('FAME'))       return <HeartIcon size={size} />
  if (t.includes('PRESENT'))    return <GiftIcon size={size} />
  if (t.includes('CRONOG'))     return <ClockIcon size={size} />
  if (t.includes('BRIEFING'))   return <DocumentIcon size={size} />
  if (t.includes('SATIS'))      return <ShieldIcon size={size} />
  if (t.includes('VÍDEO') || t.includes('FILME')) return <CameraIcon size={size} />
  return <HomeIcon size={size} />
}
