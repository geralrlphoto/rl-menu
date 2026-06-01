/* Loading state para /media (RL Prod). 1 query Supabase, ~200-500ms,
   mas continua a dar feedback imediato se o Supabase estiver lento. */

export default function MediaLoading() {
  return (
    <main className="min-h-screen bg-[#050507] flex flex-col items-center justify-center gap-6 p-8">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-0 rounded-full border-t-2 border-white/60 animate-spin" />
      </div>

      <div className="text-center">
        <p className="text-[9px] tracking-[0.5em] text-white/30 uppercase mb-2">RL Prod</p>
        <p className="text-sm text-white/40">A carregar o teu painel…</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-2xl opacity-30">
        {[1,2,3,4].map(i => (
          <div key={i} className="border border-white/[0.06] bg-white/[0.015] p-5">
            <div className="h-3 w-1/2 rounded bg-white/10 mb-2" />
            <div className="h-1.5 w-1/3 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </main>
  )
}
