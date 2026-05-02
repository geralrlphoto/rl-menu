export default function PortalMediaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050507]">
      {/* Neon azul — glow central suave */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 100% 60% at 50% 50%, rgba(20,60,255,0.04) 0%, transparent 70%)',
      }} />
      {children}
    </div>
  )
}
