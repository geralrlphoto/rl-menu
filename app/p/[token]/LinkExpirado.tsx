// Briefing partilhado depois do casamento: o link já não mostra nada.
// Mesmo estilo das páginas novas (fundo escuro, letra condensada, só dourado suave).

export default function LinkExpirado() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 font-cond" style={{ background: '#070707' }}>
      <div className="relative w-full max-w-md text-center rounded-[24px] border border-[#C9A84C]/30 bg-[#111111] px-7 py-10 shadow-[0_0_80px_-24px_rgba(201,168,76,0.45)]">
        <span className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-[22px] text-[#C9A84C]" style={{ background: 'rgba(201,168,76,0.12)' }}>
          ◷
        </span>
        <p className="mt-6 text-[12px] font-bold tracking-[0.45em] uppercase text-[#C9A84C]">RL Photo.Video</p>
        <h1 className="mt-2 text-[34px] font-bold uppercase leading-none text-white">Link expirado</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-white/60">
          Este briefing deixou de estar disponível depois do casamento.
        </p>
        <p className="mt-2 text-[14px] text-white/35">
          Se precisares de alguma informação, fala com a RL Photo.Video.
        </p>
      </div>
    </main>
  )
}
