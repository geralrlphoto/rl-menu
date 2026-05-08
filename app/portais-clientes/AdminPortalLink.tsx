'use client'

import { useRouter } from 'next/navigation'

export default function AdminPortalLink({ referencia, tipoPortal, children, className, style }: {
  referencia: string
  tipoPortal?: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const router = useRouter()

  function handleClick() {
    // Mark this session as admin for this specific portal
    sessionStorage.setItem(`portalAdmin_${referencia}`, 'true')
    const base = tipoPortal === 'batizado' ? '/portal-batizado' : '/portal-cliente'
    router.push(`${base}/ref/${encodeURIComponent(referencia)}`)
  }

  return (
    <button onClick={handleClick} className={className} style={style}>
      {children}
    </button>
  )
}
