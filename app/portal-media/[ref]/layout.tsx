export default function PortalMediaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#04080f]">
      {/* Neon topo */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 110% 55% at 50% -8%, rgba(50,110,255,0.13) 0%, rgba(30,70,200,0.05) 45%, transparent 70%)',
      }} />
      {/* Neon esquerda */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 45% 55% at -6% 45%, rgba(60,130,255,0.07) 0%, transparent 55%)',
      }} />
      {/* Neon direita */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 45% 55% at 106% 55%, rgba(40,100,255,0.06) 0%, transparent 52%)',
      }} />
      {children}
    </div>
  )
}
