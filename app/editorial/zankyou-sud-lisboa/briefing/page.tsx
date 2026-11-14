import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { cookieEditorial, cookieValido, lerEditorial } from '@/lib/editorialAcesso'
import { FL_COOKIE_NAME, verifyFlSession } from '@/lib/freelancer-session'
import EntradaEditorial from '../../EntradaEditorial'
import MeteoEvento from '../../MeteoEvento'
import GuiaEquipa, { type BlocoGuia } from '@/app/p/[token]/GuiaEquipa'
import { CSS_BRIEFING } from '@/app/_briefing/estilo'

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
  { hora: '16:00', fim: '17:00', nome: 'Welcome & Connect', evento: 'Receção, welcome drink e primeiros momentos de networking.',
    filmar: ['Chegada dos convidados e cumprimentos', 'O espaço com o Tejo: planos largos e de entrada', 'Decoração floral da Madame Boutique Floral', 'Detalhes de marca: Zankyou e SUD Lisboa'] },
  { hora: '17:00', fim: '18:00', nome: 'Inspire & Share', evento: 'Abertura pela Zankyou Portugal, agradecimento aos parceiros e intervenção do SUD / SANA.',
    filmar: ['Discursos com som limpo (falar com a Floor Sensation para a saída de áudio)', 'Oradores em plano médio e apertado', 'Reações do público', 'Pôr do sol perto das 17h20: prioridade aos planos sobre o rio'] },
  { hora: '18:00', fim: '20:00', nome: 'Taste & Experience', evento: 'Experiência gastronómica e sensorial, com espetáculo e surpresa.',
    filmar: ['Pratos, empratamento e convidados a provar', 'Atuação da Annia', 'Momentos de surpresa e espetáculo', 'Networking: conversas e gargalhadas'] },
  { hora: '20:00', fim: '22:00', nome: "Let's Celebrate!", evento: 'Música, animação e celebração.',
    filmar: ['Pista e energia da festa', 'Luz e som da Floor Sensation', 'Planos para fechar o aftermovie', 'Material vertical para o reel'] },
]

const PARCEIROS = [
  ['Zankyou', 'Equipa da organização, branding e momentos de palco'],
  ['SUD Lisboa', 'O espaço: interiores, esplanada e vista para o Tejo'],
  ['Floor Sensation', 'Som, luz e produção técnica em ação'],
  ['Madame Boutique Floral', 'Arranjos florais, de perto e no ambiente'],
  ['Detail Wedding Photography', 'Os fotógrafos oficiais a trabalhar'],
  ['Annia', 'A atuação ao vivo'],
  ['Gio Rodrigues Atelier', 'Os vestidos e looks em destaque'],
  ['Filipa Martins Make Up & Hair', 'Maquilhagem e cabelos'],
  ['Halus Stories', 'Joias em detalhe'],
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
      'Cada parceiro precisa dos seus planos: flores, joias, looks, maquilhagem, som e luz, gastronomia.',
      'Nos discursos, som limpo e planos dos oradores e do público.',
      'Guardar sempre alguns segundos antes e depois de cada momento importante.',
      'Material vertical para os reels e para a marca pessoal do Rui.',
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
      'Chegar 15 minutos antes da hora combinada com o Rui.',
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

const CSS = `
.bf{max-width:960px;margin:0 auto;padding:clamp(36px,7vh,64px) 16px 64px;}
.bf .top h1{font-size:clamp(36px,7vw,62px);margin:16px 0 0;}
.bf .top .ln{width:56px;height:1px;background:var(--g);margin-top:20px;}
.bf .top .sub{font-family:var(--fm);font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--tx-mid);margin-top:18px;line-height:1.9;}
.bf h2{font-size:clamp(28px,4.4vw,40px);margin:clamp(44px,8vh,72px) 0 0;}
.bf .k{font-family:var(--fm);font-size:9.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--g);}
.bf .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:22px;}
@media (max-width:700px){.bf .grid{grid-template-columns:minmax(0,1fr);}}
.bf .cx{padding:20px;border-radius:14px;background:var(--ink-2);border:1px solid var(--line-soft);}
.bf .cx b{display:block;font-family:var(--fs);font-weight:300;font-size:22px;color:var(--tx);margin-top:8px;line-height:1.25;}
.bf .cx p{color:var(--tx-mid);font-size:13.5px;line-height:1.55;margin:8px 0 0;}
.bf .cx a{color:var(--g);font-family:var(--fm);font-size:10px;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;margin-right:14px;}
.bf .bl{display:grid;grid-template-columns:110px minmax(0,1fr);gap:18px;padding:22px 0;border-top:1px solid var(--line-soft);}
.bf .bl .h{font-family:var(--fs);font-weight:300;font-size:30px;color:var(--g);line-height:1;}
.bf .bl .h small{display:block;font-family:var(--fm);font-size:9.5px;letter-spacing:.14em;color:var(--tx-dim);margin-top:6px;}
.bf .bl h3{font-family:var(--fs);font-weight:300;font-size:26px;color:var(--tx);margin:0;}
.bf .bl .ev{color:var(--tx-mid);font-size:14px;margin:6px 0 0;}
.bf .bl ul{list-style:none;margin:12px 0 0;padding:0;}
.bf .bl li{position:relative;padding:7px 0 7px 20px;color:var(--tx);font-size:14.5px;line-height:1.5;}
.bf .bl li::before{content:"";position:absolute;left:2px;top:16px;width:9px;height:1px;background:var(--g);}
@media (max-width:600px){.bf .bl{grid-template-columns:minmax(0,1fr);gap:8px;}}
.bf .ent{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:22px;}
@media (max-width:600px){.bf .ent{grid-template-columns:minmax(0,1fr);}}
.bf .tab{margin-top:22px;border:1px solid var(--line-soft);border-radius:14px;overflow:hidden;}
.bf .tr{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);gap:14px;padding:13px 18px;}
.bf .tr + .tr{border-top:1px solid var(--line-soft);}
.bf .tr:nth-child(even){background:rgba(243,237,226,.025);}
.bf .tr span:first-child{font-family:var(--fs);font-size:19px;color:var(--tx);}
.bf .tr span:last-child{color:var(--tx-mid);font-size:14px;}
.bf .tr a{color:var(--g);text-decoration:none;font-family:var(--fm);font-size:11px;letter-spacing:.1em;}
@media (max-width:600px){.bf .tr{grid-template-columns:minmax(0,1fr);gap:4px;}}
.bf .nota{margin-top:22px;padding:18px 20px;border-left:1px solid var(--g);background:rgba(216,190,147,.05);border-radius:0 12px 12px 0;color:var(--tx-mid);font-size:14px;line-height:1.6;}
.bf .meteo{margin-top:22px;padding:22px;border-radius:16px;background:var(--ink-2);border:1px solid var(--line-soft);}
.bf .meteo-resumo{display:flex;gap:18px;align-items:center;}
.bf .meteo-ic{width:60px;height:60px;flex:none;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(216,190,147,.4);color:var(--g);}
.bf .meteo-ic svg{width:30px;height:30px;}
.bf .meteo-t{font-family:var(--fs);font-weight:300;font-size:42px;line-height:1;color:var(--tx);margin:0;}
.bf .meteo-t em{font-size:.5em;color:var(--tx-dim);}
.bf .meteo-d{font-family:var(--fm);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-mid);margin:8px 0 0;}
.bf .meteo-c{font-family:var(--fs);font-style:italic;font-size:17px;color:var(--g);margin:8px 0 0;}
.bf .meteo-horas{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;margin-top:18px;}
.bf .meteo-h{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 2px;border-radius:12px;border:1px solid var(--line-soft);background:#070605;}
.bf .meteo-h.por{border-color:rgba(216,190,147,.55);}
.bf .meteo-h .hh{font-family:var(--fm);font-size:9.5px;color:var(--tx-dim);}
.bf .meteo-h .ic{color:var(--g);}.bf .meteo-h .ic svg{width:18px;height:18px;display:block;}
.bf .meteo-h b{font-family:var(--fs);font-weight:300;font-size:20px;color:var(--tx);}
.bf .meteo-h .ch{font-family:var(--fm);font-size:9px;color:#93c5fd;}
.bf .meteo-h .tag{position:absolute;top:-8px;font-family:var(--fm);font-size:7px;letter-spacing:.1em;text-transform:uppercase;background:var(--g);color:var(--ink);padding:2px 6px;border-radius:20px;white-space:nowrap;}
.bf .meteo-fonte,.bf .meteo-aviso{font-family:var(--fm);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-dim);margin:14px 0 0;}
@media (max-width:600px){.bf .meteo-horas{grid-template-columns:repeat(4,minmax(0,1fr));}}
`

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

  return (
    <main className="nlead" style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      <style>{CSS_BRIEFING + CSS}</style>
      <div className="bf">
        <header className="top">
          <p className="eyebrow">Briefing de vídeo · RL Photo Video</p>
          <h1>XIX Zankyou <em>Wedding Club</em></h1>
          <div className="ln" />
          <p className="sub">SUD Lisboa · segunda, 16 de novembro de 2026 · evento das 16h às 22h<br />Vídeo oficial do evento</p>
        </header>

        <h2>Guia do <em>dia</em></h2>
        <div className="nota" style={{ color: 'var(--tx)' }}>
          <span className="k" style={{ display: 'block', marginBottom: 8 }}>Dress code</span>
          Adequado ao evento: roupa toda preta, sem imagens, logótipos nem estampados, e calçado fechado preto.
          No guia está o material a levar, como nos apresentamos e as regras do dia.
        </div>
        <div style={{ marginTop: 18 }}>
          <GuiaEquipa material={MATERIAL_EVENTO} blocos={GUIA_EVENTO} chave="rl-guia-zankyou-sud"
            subtitulo="O que todos na equipa devem cumprir no XIX Zankyou Wedding Club." />
        </div>

        <h2>O <em>essencial</em></h2>
        <div className="grid">
          <div className="cx"><span className="k">Equipa de vídeo</span><b>Rui Gonçalves<br />Guilherme Paim</b><p>O Rui coordena: hora de chegada e quem filma o quê combinam-se com ele.</p></div>
          <div className="cx"><span className="k">Local</span><b>SUD Lisboa</b><p>Avenida Brasília, Pavilhão Poente, ao lado do MAAT, 1300-598 Lisboa. Tem estacionamento.</p><p><a href={GMAPS} target="_blank" rel="noopener noreferrer">Google Maps ↗</a><a href={WAZE} target="_blank" rel="noopener noreferrer">Waze ↗</a></p></div>
          <div className="cx"><span className="k">O que é</span><b>Networking do setor</b><p>Encontro da Zankyou com profissionais de casamentos. Não há noivos: o foco são as pessoas, as marcas e o ambiente.</p></div>
        </div>

        <h2>O tempo no <em>dia</em></h2>
        <MeteoEvento lat={LAT} lon={LON} data="2026-11-16" inicio={16} fim={22} por={17} />

        <h2>Programa e o que <em>filmar</em></h2>
        <div style={{ marginTop: 22 }}>
          {BLOCOS.map(b => (
            <div key={b.hora} className="bl">
              <div className="h">{b.hora}<small>até às {b.fim}</small></div>
              <div>
                <h3>{b.nome}</h3>
                <p className="ev">{b.evento}</p>
                <ul>{b.filmar.map(f => <li key={f}>{f}</li>)}</ul>
              </div>
            </div>
          ))}
        </div>

        <h2>O que <em>entregamos</em></h2>
        <div className="ent">
          <div className="cx"><span className="k">16:9 · 60–90 s</span><b>Aftermovie do evento</b><p>O filme principal: ambiente, discursos, gastronomia e festa.</p></div>
          <div className="cx"><span className="k">9:16 · 30–45 s</span><b>Reel do evento</b><p>Filmar com espaço para o corte vertical, ou com uma câmara na vertical.</p></div>
          <div className="cx"><span className="k">9:16 · 15 s</span><b>Teaser do dia seguinte</b><p>Os planos mais fortes da tarde, para sair logo no dia 17.</p></div>
          <div className="cx"><span className="k">9:16 · por marca</span><b>Clips dos parceiros</b><p>Cada parceiro precisa de planos próprios: ver a lista abaixo.</p></div>
        </div>

        <h2>Marca pessoal do <em>Rui</em></h2>
        <div className="nota" style={{ color: 'var(--tx)' }}>
          Além do vídeo oficial, filmar conteúdo para o vídeo de marca pessoal do Rui: <b style={{ display: 'inline', fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 0, textTransform: 'none', color: 'var(--g)' }}>o Rui a falar para a câmara</b>, a contar o que estamos a fazer, que fomos convidados pela Zankyou e que somos parceiros do evento, como vídeo oficial.
        </div>
        <div className="ent">
          <div className="cx"><span className="k">Formato</span><b>Vertical 9:16</b><p>Tomadas curtas, de 10 a 30 s, com o Rui a olhar para a câmara. Várias tomadas de cada ideia.</p></div>
          <div className="cx"><span className="k">Som</span><b>Voz limpa</b><p>Microfone no Rui e sítios mais calmos para falar. Evitar gravar ao lado das colunas.</p></div>
        </div>
        <div className="tab">
          {[
            ['À chegada', 'Com o SUD e o Tejo atrás: onde estamos e o que vamos fazer hoje.'],
            ['Antes de começar', 'Fomos convidados pela Zankyou e somos parceiros: fazemos o vídeo oficial do evento.'],
            ['Ao pôr do sol', 'Na esplanada, com a luz das 17h20: o que é estar aqui com os melhores do setor.'],
            ['Durante a festa', 'Um momento mais solto, com o ambiente atrás, e uma despedida para fechar.'],
            ['Bastidores', 'O Rui a filmar, a falar com os parceiros e a preparar planos, para cobrir a voz.'],
          ].map(([m, o]) => <div key={m} className="tr"><span>{m}</span><span>{o}</span></div>)}
        </div>

        <h2>Planos de cada <em>parceiro</em></h2>
        <div className="tab">
          {PARCEIROS.map(([n, o]) => <div key={n} className="tr"><span>{n}</span><span>{o}</span></div>)}
        </div>

        <h2>Contacto no <em>dia</em></h2>
        <div className="tab">
          {CONTACTOS.map(([n, p, t]) => (
            <div key={n} className="tr"><span>{n}</span><span>{p} · <a href={`tel:${t.replace(/\s/g, '')}`}>{t}</a></span></div>
          ))}
        </div>

        <div className="nota">Dúvidas sobre horários, equipamento ou divisão de planos: falar com o Rui antes do evento.</div>
      </div>
    </main>
  )
}
