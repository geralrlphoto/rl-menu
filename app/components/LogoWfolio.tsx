// Logótipo do Wfolio: círculo preto com o "w" branco (botão das galerias e página /galerias)
export function LogoWfolio({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#000" />
      <path d="M10.5 15.5l3.4 10.2c.4 1.2 2.1 1.2 2.5 0L20 16.4l3.6 9.3c.4 1.2 2.1 1.2 2.5 0l3.4-10.2" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
