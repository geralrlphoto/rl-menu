'use client'

// Cartão "01 · Ver e escolher" da página dos convidados: abre a mesma galeria da
// seleção dos noivos (numa só pasta). Os convidados escolhem as fotografias e o
// "Continuar" leva ao formulário de compra já com elas preenchidas.

import { useState } from 'react'
import { SelecaoGaleria } from '@/app/portal-cliente/atmosphere/SelecaoGaleria'
import '@/app/portal-cliente/atmosphere/atmosphere.css'
import '@/app/portal-cliente/atmosphere/tema-rl.css'
import '@/app/portal-cliente/atmosphere/fotografias.css'

const FONTES = `@import url('https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,200;0,300;0,400;0,500;1,200;1,300&family=Hanken+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');`
const G = '#d8be93'

export default function GaleriaConvidados({ portalId, evento, comprar, foto, cartao }: {
  portalId: string
  evento: 'casamento' | 'batizado'
  comprar: string
  foto: string | null
  cartao: string
}) {
  const [aberta, setAberta] = useState(false)

  function continuar(sel: string[]) {
    try {
      sessionStorage.setItem('rl_adqf_fotos', JSON.stringify(sel))
      sessionStorage.setItem('rl_adqf_chave', `rl_conv_${portalId}`)
    } catch {}
    window.location.href = comprar
  }

  return (
    <>
      <style>{FONTES}</style>
      <button type="button" onClick={() => setAberta(true)} className={`${cartao} w-full text-left`} style={{ borderLeft: '2px solid rgba(216,190,147,0.6)' }}>
        {foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="" className="h-48 w-full object-cover grayscale-[60%] opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 group-hover:opacity-100" />
        )}
        <div className="p-6">
          <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase" style={{ color: G }}>01 · Ver e escolher</p>
          <h2 className="mt-2 font-cond font-semibold text-[26px]">Ver as fotografias</h2>
          <p className="mt-2 font-cond text-[15px] leading-relaxed text-white/55">Abram a galeria, toquem em Selecionar nas fotografias de que mais gostam e no fim carreguem em Continuar.</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#d8be93]/60 bg-[#d8be93]/15 px-5 py-2 font-cond font-semibold text-[14px] transition-all group-hover:bg-[#d8be93]/30" style={{ color: G }}>
            Abrir a galeria →
          </span>
        </div>
      </button>

      {aberta && (
        <SelecaoGaleria
          portalRef={portalId}
          tipo={evento}
          temaRL
          fonteUrl={`/api/convidados/${portalId}/galeria`}
          onClose={() => setAberta(false)}
          convidados={{ onContinuar: continuar }}
        />
      )}
    </>
  )
}
