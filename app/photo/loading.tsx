/* Loading state para /photo — mostrado instantaneamente quando o user
   clica no brand selector, enquanto o server component faz as 8 fetches
   (Supabase CRM + 7 Notion DBs). Sem isto o browser fica parado em /
   até o /photo terminar (5-15s). */

export default function PhotoLoading() {
  return (
    <main className="min-h-screen bg-[#0a0805] flex flex-col items-center justify-center gap-6 p-8">
      {/* Pulse / shimmer central */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-0 rounded-full border-t-2 border-white/60 animate-spin" />
      </div>

      <div className="text-center">
        <p className="text-[9px] tracking-[0.5em] text-white/30 uppercase mb-2">RL Photo · Video</p>
        <p className="text-sm text-white/40">A carregar o teu painel…</p>
      </div>

      {/* Skeleton de cards à frente */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8 w-full max-w-3xl opacity-30">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="aspect-[3/2] rounded-md border border-white/[0.06] bg-white/[0.015] overflow-hidden">
            <div className="h-2/3 bg-gradient-to-b from-white/[0.03] to-transparent" />
            <div className="px-3 py-2">
              <div className="h-2 w-1/2 rounded bg-white/10 mb-1.5" />
              <div className="h-1.5 w-1/3 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
