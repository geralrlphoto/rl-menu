import { FONTES_CSS, FONTE } from '@/app/media/_lib/estilo'

// Letras do rlprod.pt + classes rlp / rlp-t / rlp-m.
// Vai na barra das páginas internas e nas páginas públicas da RL PROD (ex.: nova-lead).
export default function EstiloRLProd() {
  return (
    <>
      <link rel="stylesheet" href={FONTES_CSS} precedence="default" />
      <style>{`
        .rlp { font-family: ${FONTE.texto}; }
        .rlp-t { font-family: ${FONTE.titulo}; font-weight: 700; text-transform: uppercase; letter-spacing: 0; }
        .rlp-m { font-family: ${FONTE.mono}; text-transform: uppercase; letter-spacing: 0.3em; }
        .rlp-m.traco::before { content: ''; display: inline-block; width: 26px; height: 1px; background: currentColor; opacity: .6; vertical-align: middle; margin-right: 12px; }
        /* Barras de deslizar em azul (o estilo global da app é o dourado da RL Photo) */
        html:has(.rlp), .rlp, .rlp * { scrollbar-color: rgba(46,108,246,0.45) transparent; }
        .rlp *::-webkit-scrollbar-thumb, html:has(.rlp)::-webkit-scrollbar-thumb { background: rgba(46,108,246,0.45); border-radius: 8px; }
        .rlp *::-webkit-scrollbar-track, html:has(.rlp)::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </>
  )
}
