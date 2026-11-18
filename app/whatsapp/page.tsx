import Link from 'next/link'
import WhatsappClient from './WhatsappClient'

/* ============================================================
   /whatsapp
   Respostas sugeridas aos clientes. O Claude Code lê a conversa no
   WhatsApp Web e deixa aqui a sugestão; o Rui ajusta, copia ou abre
   no WhatsApp e envia. Custo zero (sem API).
   ============================================================ */

export const metadata = { title: 'WhatsApp · Respostas' }

export default function WhatsappPage() {
  return (
    <main className="min-h-screen overflow-x-clip font-cond bg-[#070707] text-white">
      <section className="relative pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-14 pb-10">
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <Link href="/crm" className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ Voltar ao CRM</Link>
        <p className="mt-12 text-[13px] sm:text-[16px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">Atendimento</p>
        <h1 className="font-bold uppercase leading-[0.9] text-[48px] sm:text-[84px] mt-2">WhatsApp</h1>
        <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-4 max-w-xl">
          Respostas sugeridas pelo Claude. Ajusta o texto, copia ou abre a conversa no WhatsApp e envia.
        </p>
      </section>
      <WhatsappClient />
    </main>
  )
}
