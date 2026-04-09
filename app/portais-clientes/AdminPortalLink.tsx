'use client'

import { useRouter } from 'next/navigation'

export default function AdminPortalLink({ referencia, children, className, style }: {
  referencia: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const router = useRouter()

  function handleClick() {
    // Mark this session as admin for this specific portal
    sessionStorage.setItem(`portalAdmin_${referencia}`, 'true')
    router.push(`/portal-cliente/ref/${encodeURIComponent(referencia)}`)
  }

  return (
    <button onClick={handleClick} className={className} style={style}>
      {children}
    </button>
  )
}
