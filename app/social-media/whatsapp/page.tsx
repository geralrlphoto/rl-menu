import Link from 'next/link'
import WhatsappClient from './WhatsappClient'

/* ============================================================
   /social-media/whatsapp (Departamento de Comunicação)
   Respostas sugeridas aos clientes. O Claude Code lê a conversa no
   WhatsApp Web e deixa aqui a sugestão; o Rui ajusta, copia ou abre
   no WhatsApp e envia. Custo zero (sem API).
   Topo como o do Blog e do 12 Meses 12 Vídeos.
   ============================================================ */

export const metadata = { title: 'WhatsApp · Comunicação' }

export default function WhatsappPage() {
  return (
    <main className="min-h-screen overflow-x-clip font-cond bg-[#070707] text-white">

      {/* ── Topo, como o do CRM e das outras áreas da Comunicação ───────── */}
      <section className="relative min-h-[480px] lg:min-h-[62vh] flex flex-col overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
          <img src="/casamentos-2026.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_45%] grayscale opacity-40 lg:opacity-55" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
          Ler · Responder · Enviar
        </p>

        <div className="relative flex-1 flex flex-col pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-16 lg:pt-8 pb-10 lg:pb-14">
          <Link href="/social-media" className="self-start text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ Voltar a Comunicação</Link>
          <div className="mt-auto pt-14">
            <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">Comunicação</p>
            <h1 className="font-bold uppercase text-white leading-[0.88] text-[56px] sm:text-[110px] lg:text-[140px] mt-2">WhatsApp</h1>
            <div className="flex items-center gap-4 mt-5">
              <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
              <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">
                Respostas · Promessas · <span className="text-[#C9A84C]">Leads</span>
              </p>
            </div>
            <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-2xl">
              Diz <strong className="text-white/80 font-semibold">&quot;ler mensagens&quot;</strong> no Claude Code e as respostas
              sugeridas aparecem aqui. Põe esta janela à esquerda: <strong className="text-white/80 font-semibold">Abrir no WhatsApp</strong> abre
              a conversa na metade direita do ecrã, já com o texto escrito.
            </p>
          </div>
        </div>
      </section>

      <WhatsappClient />
    </main>
  )
}
