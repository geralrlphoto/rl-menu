'use client'

const GOLD = '#B1937E'
const GOLD_DK = '#9A7B66'
const CREAM = '#F8F6F3'
const CREAM2 = '#FBF8F4'
const RULE = '#E3D9CC'
const MUTE = '#8A7E72'
const INK = '#33302B'

const BASE = '/wedding-mentor-files/'

const SECTIONS = [
  {
    title: 'Apresentar a Mentoria',
    cards: [
      { badge: 'PPTX', title: 'A Mentoria — Apresentação', file: 'A_Mentoria_Apresentacao.pptx' },
    ],
  },
  {
    title: 'Marca & Método',
    cards: [
      { badge: 'PNG',  title: 'Logótipo (original)',          file: 'Logotipo_RL_Wedding_Mentor.png' },
      { badge: 'PNG',  title: 'Logótipo (fundo transparente)', file: 'Logotipo_RL_transparente.png' },
      { badge: 'PDF',  title: 'O Método RL',                   file: 'Metodo_RL.pdf' },
      { badge: 'PNG',  title: 'O Método RL (imagem)',          file: 'Metodo_RL.png' },
      { badge: 'WORD', title: 'O Método RL (editável)',        file: '00_Metodo_RL.docx' },
      { badge: 'PDF',  title: 'Certificado de Conclusão',      file: 'Certificado.pdf' },
      { badge: 'PNG',  title: 'Certificado (imagem)',          file: 'Certificado.png' },
    ],
  },
  {
    title: 'Guia & Sessões',
    cards: [
      { badge: 'PDF',  title: 'Guia da Mentoria',                              file: 'Guia_Mentoria_RL.pdf' },
      { badge: 'PPTX', title: 'Sessão 1 — Posicionamento e a Matemática dos 100K', file: 'S1_Posicionamento.pptx' },
      { badge: 'PPTX', title: 'Sessão 2 — Como Chegar ao Cliente',             file: 'S2_Atracao.pptx' },
      { badge: 'PPTX', title: 'Sessão 3 — Captação e Qualificação do Lead',    file: 'S3_Captacao.pptx' },
      { badge: 'PPTX', title: 'Sessão 4 — A Reunião de Venda',                 file: 'S4_Reuniao_Venda.pptx' },
      { badge: 'PPTX', title: 'Sessão 5 — Proposta e Pricing',                 file: 'S5_Proposta_Pricing.pptx' },
      { badge: 'PPTX', title: 'Sessão 6 — Experiência e Portal de Cliente',    file: 'S6_Experiencia_Portal.pptx' },
      { badge: 'PPTX', title: 'Sessão 7 — Produção e Entrega',                 file: 'S7_Producao_Entrega.pptx' },
      { badge: 'PPTX', title: 'Sessão 8 — Pós-venda, Escala e Sistemas',       file: 'S8_Posvenda_Escala.pptx' },
    ],
  },
  {
    title: 'Ferramentas de Trabalho',
    cards: [
      { badge: 'WORD',  title: 'Sistema de Captação',        file: '01_Sistema_de_Captacao.docx' },
      { badge: 'WORD',  title: 'Guião de Reunião de Venda',  file: '02_Guiao_Reuniao_de_Venda.docx' },
      { badge: 'WORD',  title: 'Proposta Premium',           file: '03_Proposta_Premium.docx' },
      { badge: 'WORD',  title: 'Experiência & Portal',       file: '04_Experiencia_e_Portal.docx' },
      { badge: 'EXCEL', title: 'Dashboard de Métricas',      file: '05_Dashboard_Metricas.xlsx' },
    ],
  },
  {
    title: 'Experiência Premium',
    cards: [
      { badge: 'WORD', title: 'Diagnóstico & Reavaliação',  file: '06_Diagnostico_e_Reavaliacao.docx' },
      { badge: 'WORD', title: 'Kit de Boas-Vindas',         file: '07_Kit_de_Boas_Vindas.docx' },
      { badge: 'WORD', title: 'Swipe Files & Bónus',        file: '08_Swipe_Files_Bonus.docx' },
      { badge: 'WORD', title: 'Portal do Mentorando',       file: '09_Portal_do_Mentorando_Blueprint.docx' },
    ],
  },
]

const ALL_FILES = SECTIONS.flatMap(s => s.cards).map(c => c.file)

export default function WeddingMentorPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Poppins:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: ${CREAM}; color: ${INK}; font-family: 'Poppins', -apple-system, sans-serif; line-height: 1.55; }
        .wm-wrap { max-width: 1080px; margin: 0 auto; padding: 0 22px 80px; }
        .wm-header { text-align: center; padding: 54px 22px 14px; }
        .wm-header img { width: 150px; height: auto; }
        .wm-kicker { font-size: 12px; letter-spacing: 5px; color: ${GOLD}; font-weight: 600; margin-top: 10px; }
        .wm-header h1 { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; font-size: clamp(28px,5vw,44px); margin: 6px 0 8px; }
        .wm-intro { color: ${MUTE}; max-width: 620px; margin: 0 auto; font-size: 15px; }
        .wm-tools { text-align: center; margin: 22px 0 8px; }
        .wm-all-btn { background: transparent; border: 1px solid ${GOLD}; color: ${GOLD_DK}; font-family: 'Poppins'; font-weight: 600; letter-spacing: 1px; font-size: 12px; padding: 11px 22px; border-radius: 30px; cursor: pointer; transition: .2s; }
        .wm-all-btn:hover { background: ${GOLD}; color: #fff; }
        .wm-note { max-width: 760px; margin: 14px auto 0; font-size: 12.5px; color: ${MUTE}; background: ${CREAM2}; border: 1px solid ${RULE}; border-radius: 12px; padding: 12px 16px; line-height: 1.5; }
        .wm-section { margin-top: 46px; }
        .wm-sec-head h2 { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; font-size: 24px; margin: 0 0 4px; padding-bottom: 10px; border-bottom: 1px solid ${RULE}; }
        .wm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; margin-top: 18px; }
        .wm-card { background: #fff; border: 1px solid ${RULE}; border-radius: 14px; padding: 20px 20px 22px; display: flex; flex-direction: column; box-shadow: 0 6px 18px rgba(60,45,30,.05); transition: .2s; }
        .wm-card:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(60,45,30,.10); }
        .wm-badge { align-self: flex-start; font-size: 10px; letter-spacing: 1.5px; font-weight: 600; color: ${GOLD_DK}; background: ${CREAM2}; border: 1px solid ${RULE}; padding: 4px 10px; border-radius: 20px; margin-bottom: 12px; }
        .wm-card h3 { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; font-size: 18px; margin: 0 0 6px; line-height: 1.25; flex: 1; }
        .wm-dl { background: ${INK}; color: #fff; border: none; font-family: 'Poppins'; font-weight: 500; font-size: 13px; letter-spacing: .5px; padding: 11px 16px; border-radius: 9px; cursor: pointer; transition: .2s; text-decoration: none; display: inline-block; text-align: center; margin-top: 18px; }
        .wm-dl:hover { background: ${GOLD_DK}; }
        .wm-footer { text-align: center; color: ${GOLD}; font-size: 12px; letter-spacing: 3px; margin-top: 64px; padding-top: 22px; border-top: 1px solid ${RULE}; }
      `}</style>

      <header className="wm-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo mentor.webp" alt="RL Wedding Mentor" />
        <div className="wm-kicker">CENTRO DE RECURSOS DA MENTORIA</div>
        <h1>O Sistema Completo</h1>
        <p className="wm-intro">Todos os materiais da mentoria RL Wedding Mentor num só lugar. Carrega em descarregar para guardar cada documento, tudo funciona offline.</p>
        <div className="wm-tools">
          <button className="wm-all-btn" onClick={() => ALL_FILES.forEach(f => {
            const a = document.createElement('a'); a.href = BASE + f; a.download = f; document.body.appendChild(a); a.click(); document.body.removeChild(a)
          })}>DESCARREGAR TUDO</button>
        </div>
      </header>

      <div className="wm-wrap">
        {SECTIONS.map(section => (
          <section key={section.title} className="wm-section">
            <div className="wm-sec-head">
              <h2>{section.title}</h2>
            </div>
            <div className="wm-grid">
              {section.cards.map(card => (
                <div key={card.file} className="wm-card">
                  <div className="wm-badge">{card.badge}</div>
                  <h3>{card.title}</h3>
                  <a className="wm-dl" href={BASE + card.file} download={card.file}>Descarregar</a>
                </div>
              ))}
            </div>
          </section>
        ))}

        <footer className="wm-footer">RL WEDDING MENTOR · EDUCATE · INSPIRE · ELEVATE</footer>
      </div>
    </>
  )
}
