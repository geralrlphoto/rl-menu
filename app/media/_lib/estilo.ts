// Identidade do rlprod.pt para as páginas internas da RL PROD (/media)
// Azul-noite + azul elétrico, títulos Saira Condensed em maiúsculas, etiquetas JetBrains Mono.

export const COR = {
  noite: '#00141f',     // barra do site
  marinho: '#0b2033',   // secções escuras
  cartao: '#0c2236',    // cartões sobre o escuro
  azul: '#2e6cf6',      // botões e contornos
  azulClaro: '#5a8bff', // texto de destaque sobre o escuro
  azulPalido: '#a9c1ff',
  cinza: '#7c8893',
  vermelho: '#ff4747',  // o "REC" do site
}

// Carregadas por <link> (o next/font partiu o build do Vercel com a JetBrains Mono)
export const FONTES_CSS =
  'https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700;800&family=Saira:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap'

export const FONTE = {
  titulo: "'Saira Condensed', 'Saira', sans-serif",
  texto: "'Saira', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
}

// Fundo comum: metal escovado em azul-aço (tons do rlprod.pt).
// Camadas, de cima para baixo: escurecer as margens, reflexo diagonal, riscas finas do
// "escovado" e faixas de luz e sombra que dão o brilho de chapa metálica.
export const FUNDO = `
  radial-gradient(ellipse 85% 75% at 50% 40%, transparent 45%, rgba(0,8,14,0.75) 100%),
  linear-gradient(115deg, transparent 28%, rgba(190,215,255,0.10) 42%, rgba(255,255,255,0.04) 47%, transparent 58%),
  repeating-linear-gradient(0deg, rgba(255,255,255,0.028) 0px, rgba(255,255,255,0.028) 1px, transparent 1px, transparent 3px),
  repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, transparent 1px, transparent 7px),
  linear-gradient(135deg, #0a1a28 0%, #1d3650 18%, #0c1d2d 34%, #26476a 50%, #0d2031 66%, #1a3149 82%, #08141f 100%)`
export const FUNDO_TAMANHO = ''
