import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { cookieEditorial, cookieValido, lerEditorial } from '@/lib/editorialAcesso'
import { FL_COOKIE_NAME, verifyFlSession } from '@/lib/freelancer-session'
import EntradaEditorial from '../../EntradaEditorial'
import MeteoEvento from '../../MeteoEvento'
import GuiaEquipa, { type BlocoGuia } from '@/app/p/[token]/GuiaEquipa'

/* Briefing de vídeo do XIX Zankyou Wedding Club × SUD Lisboa, para a equipa da RL.
   Abre no portal do freelancer (botão "Ver Briefing", freelancer_casamentos.briefing_url) dentro de um iframe:
   entra quem tem sessão da equipa (fl_session), o admin ou quem tem a senha do portal do evento. */

export const metadata: Metadata = {
  title: 'Briefing de vídeo · XIX Zankyou Wedding Club × SUD Lisboa',
  robots: { index: false, follow: false },
}

const SLUG = 'zankyou-sud-lisboa'
const LAT = 38.696528, LON = -9.191611
const GMAPS = `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LON}`
const WAZE = `https://waze.com/ul?ll=${LAT},${LON}&navigate=yes`

const BLOCOS = [
  { hora: '15:00', fim: '16:00', nome: 'Chegada da equipa RL', evento: 'Estamos no SUD Lisboa às 15h00 para o nosso briefing e para produzir conteúdos antes da chegada dos convidados.',
    filmar: ['Briefing rápido entre a equipa: planos, divisão de tarefas e som', 'O espaço vazio e arrumado, com boa luz: interiores, esplanada e o Tejo', 'Decoração e detalhes do espaço antes de haver gente', 'Primeiras falas do Rui para a marca pessoal', 'Se for possível, drone: o SUD, o Tejo e a ponte vistos do ar'] },
  { hora: '16:00', fim: '17:00', nome: 'Welcome & Connect', evento: 'Receção, welcome drink e primeiros momentos de networking.',
    filmar: ['16:00 · Kapa Loop Sessions no cocktail', 'Chegada dos convidados e cumprimentos', 'O espaço a encher: planos largos e das entradas', 'Detalhes de marca: Zankyou e SUD Lisboa'] },
  { hora: '17:00', fim: '18:00', nome: 'Inspire & Share', evento: 'Abertura pela Zankyou Portugal, agradecimento aos parceiros e intervenção do SUD / SANA.',
    filmar: ['Discursos com som limpo (falar com a Floor Sensation para a saída de áudio)', 'Oradores em plano médio e apertado', 'Reações do público', 'Pôr do sol perto das 17h20: prioridade aos planos sobre o rio', 'Se for possível, drone ao pôr do sol sobre o Tejo'] },
  { hora: '18:00', fim: '20:00', nome: 'Taste & Experience', evento: 'Experiência gastronómica e sensorial, com espetáculo e surpresa.',
    filmar: ['18:20 · Dançarinos (Fábio Trindade), logo após a entrada', '19:00 · Priceless Band, a meio do jantar', '19:50 · Annia, no final do jantar', 'Pratos, empratamento e convidados a provar', 'Networking: conversas e gargalhadas'] },
  { hora: '20:00', fim: '22:00', nome: "Let's Celebrate!", evento: 'Música, animação e celebração.',
    filmar: ['20:05 · Tropicana Queens na abertura da pista (por confirmar)', '20:20 · DJ com saxofonista: a festa', 'Pista e energia da festa, luz e som', 'Planos de fecho da noite'] },
]

// Cartaz: a ordem das atuações (informação da organização)
const CARTAZ: Array<[string, string, string, boolean?]> = [
  ['16:00', 'Cocktail', 'Kapa Loop Sessions'],
  ['18:20', 'Após a entrada', 'Dançarinos (Fábio Trindade)'],
  ['19:00', 'Meio do jantar', 'Priceless Band'],
  ['19:50', 'Final do jantar', 'Annia'],
  ['20:05', 'Abertura da pista', 'Tropicana Queens', true],
  ['20:20', 'Festa', 'DJ com saxofonista'],
]


// Guia da equipa (o dos casamentos, em app/p/[token]/GuiaEquipa.tsx) adaptado a um evento de networking
const MATERIAL_EVENTO = [
  'Câmaras',
  'Lentes',
  'Baterias carregadas e suplentes',
  'Cartões de memória vazios e formatados',
  'Microfone de lapela para o Rui (marca pessoal)',
  'Gravadores de áudio e microfones',
  'Estabilizador',
  'Drone, se for possível',
  'Luzes de apoio',
  'Carregadores das baterias',
  'Panos de limpeza das lentes',
]

const GUIA_EVENTO: BlocoGuia[] = [
  {
    titulo: 'Apresentação e dress code',
    icone: '◆',
    itens: [
      'Dress code adequado ao evento: um encontro elegante de profissionais dos casamentos, num espaço sofisticado.',
      'Podes e deves levar roupa toda preta, sem imagens, logótipos nem estampados.',
      'Calçado fechado, preto e confortável: são seis horas de pé.',
      'Roupa limpa e cuidada e um perfume suave. Combina a roupa com o Rui antes do dia.',
    ],
    proibido: ['Roupa com imagens ou estampados', 'Calças de ganga', 'Chinelos', 'Bonés'],
  },
  {
    titulo: 'Captação',
    icone: '◉',
    itens: [
      'Filmar o espaço à chegada, antes de os convidados entrarem, enquanto está arrumado e com boa luz.',
      'Detalhes do ambiente para o recap: decoração, flores, gastronomia, som e luz.',
      'Nos discursos, som limpo e planos dos oradores e do público.',
      'Se for possível, imagens de drone: o SUD, o Tejo e a ponte, de preferência antes dos convidados e ao pôr do sol. Só se as regras de voo do local o permitirem.',
      'Guardar sempre alguns segundos antes e depois de cada momento importante.',
      'Filmar tudo em horizontal 16:9, também a marca pessoal do Rui. Os cortes verticais fazem-se na edição.',
    ],
  },
  {
    titulo: 'Redes sociais e postura',
    icone: '✕',
    itens: [
      'Não publicar nada sobre o evento nas redes sociais. O vídeo oficial e os conteúdos saem pela RL e pela organização.',
      'Se quiseres partilhar alguma coisa, envia ao Rui. É ele que publica.',
      'Apresenta-te sempre como RL Photo.Video, a equipa do vídeo oficial do evento.',
      'O evento é de networking, mas estamos a trabalhar: não promovas serviços teus junto de convidados ou parceiros.',
    ],
    proibido: ['Publicar nas redes sociais', 'Partilhar o Instagram pessoal', 'Promover serviços próprios'],
    nota: 'São regras de boas práticas e de consciência profissional.',
  },
  {
    titulo: 'Boas práticas no dia',
    icone: '✓',
    itens: [
      'Estar no SUD Lisboa às 15h00, para o briefing e os conteúdos antes dos convidados.',
      'Telemóvel em silêncio e discrição total durante os discursos e a atuação.',
      'Não comer nem beber à frente dos convidados enquanto se filma; só quando a organização indicar.',
      'No fim do dia, copiar os cartões para dois sítios antes de os voltar a formatar.',
      'Em caso de dúvida no dia, falar com o Rui.',
    ],
  },
]

// Só o contacto da RL: os contactos dos fornecedores não entram no briefing da equipa
const CONTACTOS = [
  ['Rui Gonçalves', 'RL Photo Video · responsável do vídeo', '+351 912 932 768'],
]

// Design do portal do freelancer (app/freelancers/[id]/fl-rl.css e CapaPortal): fundo #070707,
// dourado #d8be93, Roboto Condensed, títulos fortes em maiúsculas, capa com foto a cinzento à direita
// e cartões escuros com contorno dourado suave e borda esquerda dourada.
const CSS = `
.fb{--g:#d8be93;--line:rgba(216,190,147,.14);--line-soft:rgba(255,255,255,.07);background:#070707;color:#fff;min-height:100vh;}
.fb,.fb *{font-family:'Roboto Condensed',sans-serif;}
.fb .ey{font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--g);}
.fb .wrap{max-width:1100px;margin:0 auto;padding:0 20px 80px;}
.fb .sec{margin-top:clamp(48px,8vh,72px);}
.fb .sec-h{display:flex;align-items:center;gap:14px;}
.fb .sec-h::after{content:"";flex:1;height:1px;background:var(--line-soft);}
.fb h2{font-weight:700;text-transform:uppercase;font-size:clamp(30px,5vw,44px);line-height:.95;margin:8px 0 0;letter-spacing:-.005em;}
.fb .card{border:1px solid var(--line);border-left:2px solid rgba(216,190,147,.35);border-radius:18px;background:rgba(17,17,17,.9);padding:20px 22px;}
.fb .card .k{font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--g);}
.fb .card b{display:block;font-weight:600;font-size:22px;line-height:1.2;margin-top:8px;}
.fb .card p{color:rgba(255,255,255,.55);font-size:15px;font-weight:300;line-height:1.55;margin:8px 0 0;}
.fb .g2,.fb .g3{display:grid;gap:12px;margin-top:20px;}
.fb .g2{grid-template-columns:repeat(2,minmax(0,1fr));}
.fb .g3{grid-template-columns:repeat(3,minmax(0,1fr));}
@media (max-width:760px){.fb .g2,.fb .g3{grid-template-columns:minmax(0,1fr);}}
.fb .btn{display:inline-flex;align-items:center;gap:.4em;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#fff;border:1px solid rgba(216,190,147,.55);background:rgba(216,190,147,.1);padding:9px 16px;text-decoration:none;transition:background .3s;margin:12px 8px 0 0;}
.fb .btn:hover{background:rgba(216,190,147,.25);}
.fb .destaque{margin-top:20px;border:1px solid rgba(216,190,147,.3);border-radius:18px;background:rgba(216,190,147,.06);padding:18px 22px;display:grid;gap:14px;}
.fb .destaque div{display:grid;grid-template-columns:120px minmax(0,1fr);gap:14px;align-items:baseline;}
.fb .destaque span{font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--g);}
.fb .destaque p{margin:0;font-size:16px;color:#fff;line-height:1.5;}
@media (max-width:560px){.fb .destaque div{grid-template-columns:minmax(0,1fr);gap:4px;}}
.fb .guia-btn button{border-radius:999px;border-color:rgba(216,190,147,.55)!important;background:rgba(216,190,147,.1)!important;}
/* Lista em cartão (como as listas do Início do portal) */
.fb .lista{margin-top:20px;border:1px solid var(--line);border-left:2px solid rgba(216,190,147,.35);border-radius:18px;background:rgba(17,17,17,.9);padding:0 22px;}
.fb .lista > div{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);gap:16px;padding:15px 0;border-top:1px solid var(--line-soft);}
.fb .lista > div:first-child{border-top:0;}
.fb .lista span:first-child{font-weight:600;font-size:17px;}
.fb .lista span:last-child{color:rgba(255,255,255,.55);font-size:15px;font-weight:300;}
.fb .lista a{color:var(--g);text-decoration:none;font-weight:600;letter-spacing:.06em;}
@media (max-width:600px){.fb .lista > div{grid-template-columns:minmax(0,1fr);gap:4px;}}
/* Timeline */
.fb .tl{margin-top:20px;border:1px solid var(--line);border-left:2px solid rgba(216,190,147,.35);border-radius:18px;background:rgba(17,17,17,.9);padding:0 22px;}
.fb .tl > div{display:grid;grid-template-columns:96px minmax(0,1fr);gap:20px;padding:22px 0;border-top:1px solid var(--line-soft);}
.fb .tl > div:first-child{border-top:0;}
.fb .tl .h{font-weight:700;font-size:30px;line-height:1;color:var(--g);}
.fb .tl .h small{display:block;font-weight:400;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.35);margin-top:6px;}
.fb .tl h3{font-weight:700;text-transform:uppercase;font-size:22px;letter-spacing:.02em;margin:0;}
.fb .tl .ev{color:rgba(255,255,255,.55);font-size:15px;font-weight:300;margin:6px 0 0;}
.fb .tl ul{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:6px;}
.fb .tl li{display:flex;gap:10px;font-size:15px;line-height:1.45;color:rgba(255,255,255,.88);}
.fb .tl li::before{content:"";flex:none;width:6px;height:6px;border-radius:50%;background:var(--g);margin-top:8px;}
.fb .tl > div.equipa{background:linear-gradient(90deg,rgba(216,190,147,.08),transparent 70%);margin:0 -22px;padding:22px;}
@media (max-width:600px){.fb .tl > div{grid-template-columns:minmax(0,1fr);gap:8px;}}
/* Meteorologia (componente MeteoEvento) */
.fb .meteo{margin-top:20px;border:1px solid var(--line);border-left:2px solid rgba(216,190,147,.35);border-radius:18px;background:rgba(17,17,17,.9);padding:22px;}
.fb .meteo-resumo{display:flex;gap:18px;align-items:center;}
.fb .meteo-ic{width:60px;height:60px;flex:none;display:grid;place-items:center;border-radius:50%;background:rgba(216,190,147,.12);color:var(--g);}
.fb .meteo-ic svg{width:30px;height:30px;}
.fb .meteo-t{font-weight:700;font-size:40px;line-height:1;margin:0;}
.fb .meteo-t em{font-style:normal;font-weight:300;font-size:.5em;color:rgba(255,255,255,.4);}
.fb .meteo-d{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.55);margin:8px 0 0;}
.fb .meteo-c{font-size:15px;color:var(--g);margin:8px 0 0;}
.fb .meteo-horas{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;margin-top:18px;}
.fb .meteo-h{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 2px;border-radius:12px;border:1px solid var(--line-soft);background:#0b0b0b;}
.fb .meteo-h.por{border-color:rgba(216,190,147,.55);}
.fb .meteo-h .hh{font-size:11px;color:rgba(255,255,255,.4);}
.fb .meteo-h .ic{color:var(--g);}.fb .meteo-h .ic svg{width:18px;height:18px;display:block;}
.fb .meteo-h b{font-weight:600;font-size:20px;}
.fb .meteo-h .ch{font-size:11px;color:#93c5fd;}
.fb .meteo-h .tag{position:absolute;top:-9px;font-size:8px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;background:var(--g);color:#070707;padding:2px 7px;border-radius:20px;white-space:nowrap;}
.fb .meteo-fonte,.fb .meteo-aviso{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.35);margin:14px 0 0;}
@media (max-width:600px){.fb .meteo-horas{grid-template-columns:repeat(4,minmax(0,1fr));}}
`

function Seccao({ ey, titulo, children }: { ey: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="sec">
      <div className="sec-h"><p className="ey">{ey}</p></div>
      <h2>{titulo}</h2>
      {children}
    </section>
  )
}

export default async function BriefingZankyouSud() {
  const c = await cookies()
  const admin = !!process.env.AUTH_SECRET && c.get('rl_auth')?.value === process.env.AUTH_SECRET
  const equipa = !!(await verifyFlSession(c.get(FL_COOKIE_NAME)?.value))
  if (!admin && !equipa) {
    const ed = await lerEditorial(SLUG)
    if (!cookieValido(SLUG, ed.senhaHash, c.get(cookieEditorial(SLUG))?.value)) {
      return <EntradaEditorial slug={SLUG} parceiros={['Zankyou', 'SUD Lisboa', 'RL Photo Video']}
        titulo={<>Briefing de <em>vídeo</em></>} fundo="/editorial/zankyou-sud-lisboa/cartaz.webp" />
    }
  }

  const numeros = [
    { l: 'Data', v: '16 nov', s: 'Segunda-feira' },
    { l: 'Chegada', v: '15h00', s: 'Briefing e conteúdos', ouro: true },
    { l: 'Vídeos', v: '2 × 59 s', s: 'Recap e marca pessoal' },
    { l: 'Formato', v: '16:9', s: 'Tudo na horizontal' },
  ]

  return (
    <main className="fb font-cond">
      <style>{CSS}</style>

      {/* Capa, como a CapaPortal do portal do freelancer */}
      <section className="relative min-h-[460px] lg:min-h-[62vh] flex flex-col overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/editorial/zankyou-sud-lisboa/cartaz.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_35%] grayscale opacity-40 lg:opacity-55" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-12 w-px bg-[#d8be93]/45" />
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">Briefing · 16 nov 2026</p>
        <span className="hidden lg:block absolute left-[34%] top-[22%] w-2.5 h-2.5 rounded-full bg-[#d8be93]" />
        <span className="hidden lg:block absolute left-[33.2%] top-[27%] w-11 h-11 rounded-full border border-[#d8be93]/45" />

        <div className="relative flex-1 grid grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_330px] gap-8 items-end pl-11 sm:pl-16 lg:pl-20 pr-5 sm:pr-14 pt-20 pb-10 lg:pb-14">
          <div className="min-w-0">
            <p className="text-[12px] sm:text-[15px] font-bold tracking-[0.5em] uppercase text-[#d8be93]">RL Photo.Video</p>
            <h1 className="text-white mt-2 font-bold leading-[0.9] text-[52px] sm:text-[88px] lg:text-[104px]">BRIEFING</h1>
            <div className="flex items-center gap-4 mt-5">
              <span className="hidden sm:block w-12 h-px bg-[#d8be93]" />
              <p className="text-[12px] sm:text-[16px] tracking-[0.22em] uppercase text-white/70">XIX Zankyou Wedding Club · <span className="text-[#d8be93]">SUD Lisboa</span></p>
            </div>
            <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-4 max-w-xl">Vídeo oficial do evento. Equipa no SUD às 15h00; o evento é das 16h às 22h.</p>
          </div>
          <aside className="rounded-[22px] border border-[#d8be93]/30 bg-[#111111]/80 backdrop-blur-xl p-5 shadow-[0_0_48px_-22px_rgba(216,190,147,0.5)]">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/85">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d8be93] shadow-[0_0_8px_#d8be93]" />O dia
            </p>
            <div className="grid grid-cols-2 mt-3">
              {numeros.map((x, i) => (
                <div key={x.l} className={`py-3 min-w-0 ${i % 2 === 0 ? 'pr-3 border-r border-white/[0.07]' : 'pl-3'} ${i < numeros.length - 2 ? 'border-b border-white/[0.07]' : ''}`}>
                  <p className="text-[11px] text-white/50 truncate">{x.l}</p>
                  <p className={`font-semibold text-[22px] leading-none mt-1.5 truncate ${x.ouro ? 'text-[#d8be93]' : 'text-white'}`}>{x.v}</p>
                  <p className="text-[10.5px] text-white/30 mt-1 truncate">{x.s}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <div className="wrap">
        <Seccao ey="Antes de sair de casa" titulo="Guia do dia">
          <div className="destaque">
            <div><span>Dress code</span><p>Adequado ao evento: roupa toda preta, sem imagens, logótipos nem estampados, e calçado fechado preto.</p></div>
            <div><span>Formato</span><p>Todo o material é filmado em horizontal 16:9, incluindo a marca pessoal do Rui.</p></div>
            <div><span>Chegada</span><p>No SUD Lisboa às 15h00, para o briefing e os conteúdos antes dos convidados.</p></div>
            <div><span>Drone</span><p>Se for possível, traz drone: imagens aéreas do SUD, do Tejo e da ponte, antes dos convidados e ao pôr do sol. Só se as regras de voo do local o permitirem.</p></div>
          </div>
          <div className="guia-btn" style={{ marginTop: 16 }}>
            <GuiaEquipa material={MATERIAL_EVENTO} blocos={GUIA_EVENTO} chave="rl-guia-zankyou-sud"
              subtitulo="O que todos na equipa devem cumprir no XIX Zankyou Wedding Club." />
          </div>
        </Seccao>

        <Seccao ey="O evento" titulo="O essencial">
          <div className="g3">
            <div className="card"><span className="k">Equipa de vídeo</span><b>Rui Gonçalves<br />Guilherme Paim</b><p>Chegada às 15h00, uma hora antes dos convidados. O Rui coordena quem filma o quê.</p></div>
            <div className="card"><span className="k">Local</span><b>SUD Lisboa</b><p>Avenida Brasília, Pavilhão Poente, ao lado do MAAT, 1300-598 Lisboa. Tem estacionamento.</p>
              <a className="btn" href={GMAPS} target="_blank" rel="noopener noreferrer">Google Maps ↗</a><a className="btn" href={WAZE} target="_blank" rel="noopener noreferrer">Waze ↗</a></div>
            <div className="card"><span className="k">O que é</span><b>Networking do setor</b><p>Encontro da Zankyou com profissionais de casamentos. Não há noivos: o foco são as pessoas, as marcas e o ambiente.</p></div>
          </div>
        </Seccao>

        <Seccao ey="Belém · 16h às 22h" titulo="Meteorologia">
          <MeteoEvento lat={LAT} lon={LON} data="2026-11-16" inicio={16} fim={22} por={17} />
        </Seccao>

        <Seccao ey="Timeline" titulo="Programa e o que filmar">
          <div className="tl">
            {BLOCOS.map(b => (
              <div key={b.hora} className={b.hora === '15:00' ? 'equipa' : undefined}>
                <div className="h">{b.hora}<small>até às {b.fim}</small></div>
                <div>
                  <h3>{b.nome}</h3>
                  <p className="ev">{b.evento}</p>
                  <ul>{b.filmar.map(f => <li key={f}>{f}</li>)}</ul>
                </div>
              </div>
            ))}
          </div>
        </Seccao>

        <Seccao ey="Cartaz" titulo="A ordem das atuações">
          <div className="lista">
            {CARTAZ.map(([h, q, n, pc]) => (
              <div key={n}><span>{h} · {n}</span><span>{q}{pc ? ' · por confirmar' : ''}</span></div>
            ))}
          </div>
          <p style={{ marginTop: 14, color: 'rgba(255,255,255,.45)', fontSize: 15, fontWeight: 300 }}>Estar em posição uns minutos antes de cada atuação, com som e planos preparados.</p>
        </Seccao>

        <Seccao ey="Dois vídeos até 59 s e os brutos" titulo="O que tens de entregar">
          <div className="g2">
            <div className="card"><span className="k">Vídeo 1 · até 59 s</span><b>Recap do evento</b><p>O resumo da tarde: o espaço, as pessoas, os discursos, a gastronomia, os parceiros e a festa.</p></div>
            <div className="card"><span className="k">Vídeo 2 · até 59 s</span><b>Marca pessoal do Rui</b><p>O Rui a falar para a câmara sobre o evento, com bastidores e planos do dia a cobrir a voz.</p></div>
          </div>
          <div className="card" style={{ marginTop: 12 }}><span className="k">Depois do evento</span><b>Todos os brutos para a RL Photo Video</b><p>Além dos dois vídeos, entregas à RL Photo Video todo o material em bruto que filmaste no evento, sem cortes.</p></div>
        </Seccao>

        <Seccao ey="Vídeo 2" titulo="Marca pessoal do Rui">
          <div className="destaque">
            <div><span>O que é</span><p>O Rui a falar para a câmara, a contar o que estamos a fazer, que fomos convidados pela Zankyou e que somos parceiros do evento, como vídeo oficial.</p></div>
          </div>
          <div className="g2">
            <div className="card"><span className="k">Formato</span><b>Horizontal 16:9</b><p>Tomadas curtas, de 10 a 30 s, com o Rui a olhar para a câmara. Várias tomadas de cada ideia.</p></div>
            <div className="card"><span className="k">Som</span><b>Voz limpa</b><p>Microfone no Rui e sítios mais calmos para falar. Evitar gravar ao lado das colunas.</p></div>
          </div>
          <div className="lista">
            {[
              ['À chegada, 15h00', 'Com o SUD e o Tejo atrás, ainda sem convidados: onde estamos e o que vamos fazer hoje.'],
              ['Antes de começar', 'Fomos convidados pela Zankyou e somos parceiros: fazemos o vídeo oficial do evento.'],
              ['Ao pôr do sol', 'Na esplanada, com a luz das 17h20: o que é estar aqui com os melhores do setor.'],
              ['Durante a festa', 'Um momento mais solto, com o ambiente atrás, e uma despedida para fechar.'],
              ['Bastidores', 'O Rui a filmar, a falar com os parceiros e a preparar planos, para cobrir a voz.'],
            ].map(([m, o]) => <div key={m}><span>{m}</span><span>{o}</span></div>)}
          </div>
        </Seccao>


        <Seccao ey="Duas fases" titulo="Pagamento">
          <div className="g2">
            <div className="card"><span className="k">1.ª fase · 50%</span><b>No dia do evento</b><p>Metade do valor é paga no dia, a 16 de novembro.</p></div>
            <div className="card"><span className="k">2.ª fase · 50%</span><b>Na entrega dos vídeos finais</b><p>A outra metade é paga quando entregares os dois vídeos finais.</p></div>
          </div>
        </Seccao>

        <Seccao ey="Dúvidas" titulo="Contacto no dia">
          <div className="lista">
            {CONTACTOS.map(([n, p, t]) => (
              <div key={n}><span>{n}</span><span>{p} · <a href={`tel:${t.replace(/\s/g, '')}`}>{t}</a></span></div>
            ))}
          </div>
          <p style={{ marginTop: 16, color: 'rgba(255,255,255,.45)', fontSize: 15, fontWeight: 300 }}>Dúvidas sobre horários, equipamento ou divisão de planos: falar com o Rui antes do evento.</p>
        </Seccao>
      </div>
    </main>
  )
}
