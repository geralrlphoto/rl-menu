'use client'

import { useEffect } from 'react'
import type { PageContent } from '@/app/r/[token]/LeadPageClient'

const GOLD = '#C9A84C'
const DARK = '#0d0b07'
const CREAM = '#faf8f3'
const BODY_COLOR = '#1e1a14'

// ── Dados da empresa ─────────────────────────────────────────────────────────
const EMPRESA = {
  nome:      'RL Photo · Video',
  email:     'geral@rlphotovideo.pt',
  telefone:  '+351 919 191 919',
  whatsapp:  'https://wa.me/351919191919',
  instagram: '@rlphotovideo',
  website:   'www.rlphotovideo.pt',
  morada:    'Portugal',
  nif:       '',
}

// ── Condições Gerais ─────────────────────────────────────────────────────────
const CONDICOES = [
  {
    titulo: '1. Reserva e Adjudicação',
    texto: 'A reserva da data apenas fica confirmada após o pagamento da adjudicação no valor de 400 €. Este valor é deduzido do valor total do serviço. Enquanto a adjudicação não for liquidada, a data permanece disponível para outros clientes.',
  },
  {
    titulo: '2. Forma de Pagamento',
    texto: 'O valor total do serviço divide-se em três momentos: (1) Adjudicação de 400 € para reserva da data; (2) Reforço correspondente a 80% do valor restante, a liquidar até 30 dias antes do evento; (3) Valor final (20% restante) a pagar no próprio dia do casamento, antes do início do serviço.',
  },
  {
    titulo: '3. Entrega dos Materiais',
    texto: 'As fotografias editadas são entregues num prazo máximo de 90 dias após a data do evento, através de galeria online privada e/ou pen drive. O vídeo de casamento tem um prazo de entrega de até 180 dias após a data do evento. Estes prazos podem ser ajustados em função da época e volume de trabalho.',
  },
  {
    titulo: '4. Direitos de Autor e Uso de Imagens',
    texto: 'Todos os conteúdos fotográficos e videográficos produzidos são propriedade intelectual da RL Photo · Video. O cliente recebe licença de uso pessoal ilimitado. A RL Photo · Video reserva o direito de utilizar os conteúdos produzidos para fins de portfólio, redes sociais e material promocional, salvo indicação expressa em contrário por parte do cliente.',
  },
  {
    titulo: '5. Cancelamento e Alterações',
    texto: 'Em caso de cancelamento por parte do cliente, a adjudicação não é reembolsável. Em caso de adiamento da data, a RL Photo · Video compromete-se a assegurar a nova data, sujeito a disponibilidade. Qualquer alteração ao contrato deve ser comunicada por escrito com, pelo menos, 30 dias de antecedência.',
  },
  {
    titulo: '6. Responsabilidade',
    texto: 'A RL Photo · Video compromete-se a garantir a máxima qualidade e profissionalismo na captação dos momentos. Em caso de falha técnica de equipamento, serão envidados todos os esforços para minimizar o impacto. A responsabilidade máxima da RL Photo · Video limita-se ao valor pago pelo serviço. Não nos responsabilizamos por condições meteorológicas, atrasos ou imprevistos alheios à nossa vontade.',
  },
  {
    titulo: '7. Contrato',
    texto: 'Todos os serviços ficam formalizados através de contrato escrito assinado por ambas as partes. O contrato é enviado digitalmente para assinatura após confirmação da proposta e pagamento da adjudicação. A proposta tem validade de 15 dias a partir da data de emissão.',
  },
]

function parseVal(v: string): number {
  if (!v) return 0
  return parseFloat(v.replace(/€/g, '').replace(/\s+/g, '').replace(',', '.')) || 0
}
function fmt(n: number): string {
  return n.toLocaleString('pt-PT') + ' €'
}

const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500&display=swap'
const LOGO_URL  = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png'

export default function PrintView({ contact, content, autoPrint = true }: { contact: any; content: PageContent; autoPrint?: boolean }) {
  useEffect(() => {
    if (!autoPrint) return
    const t = setTimeout(() => window.print(), 900)
    return () => clearTimeout(t)
  }, [autoPrint])

  const ADJUDICACAO = 400
  const intro = content.propostaPage?.intro || ''
  const extras = content.extras_proposta || []

  return (
    <>
      <style>{`
        @import url('${FONTS_URL}');
        @page { size: A4; margin: 0; }
        *, *::before, *::after { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        html, body { margin: 0; padding: 0; background: #e8e2d8; }
        .a4 { width: 210mm; min-height: 297mm; page-break-after: always; overflow: hidden; position: relative; }
        .a4:last-of-type { page-break-after: avoid; }
        .no-print { position: fixed; top: 20px; right: 20px; z-index: 999; display: flex; gap: 10px; }
        @media print { .no-print { display: none !important; } body { background: none; } }
        @media screen { .a4 { margin: 30px auto; box-shadow: 0 6px 50px rgba(0,0,0,0.3); } }
      `}</style>

      {/* Screen-only controls */}
      <div className="no-print">
        <button onClick={() => window.print()} style={{ padding: '10px 20px', background: GOLD, color: '#0d0b07', border: 'none', borderRadius: 8, fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 13, cursor: 'pointer', letterSpacing: '0.05em' }}>
          🖨 Imprimir / Guardar PDF
        </button>
        <button onClick={() => window.close()} style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'Montserrat, sans-serif', fontWeight: 400, fontSize: 13, cursor: 'pointer' }}>
          ✕ Fechar
        </button>
      </div>

      {/* ── CAPA ── */}
      <div className="a4" style={{ background: DARK, display: 'flex', flexDirection: 'column' }}>
        {/* Corner decorations */}
        {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v, h]) => (
          <div key={v+h} style={{ position: 'absolute', [v]: 36, [h]: 36, width: 44, height: 44,
            [`border${v.charAt(0).toUpperCase()+v.slice(1)}`]: `1px solid ${GOLD}`,
            [`border${h.charAt(0).toUpperCase()+h.slice(1)}`]: `1px solid ${GOLD}` }} />
        ))}

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 60px', textAlign: 'center', gap: 28 }}>
          {/* Logo */}
          <img src={LOGO_URL} alt="RL Photo · Video" style={{ width: 120, opacity: 0.92 }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <h1 style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 78, color: '#ffffff', lineHeight: 1 }}>Proposta</h1>
            <h1 style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 78, color: GOLD, lineHeight: 1 }}>Criativa</h1>
          </div>

          <div style={{ width: 50, height: 0.5, background: `${GOLD}50` }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <p style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 9, letterSpacing: '0.4em', color: `${GOLD}80`, textTransform: 'uppercase' }}>Preparada para</p>
            <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 400, fontSize: 38, color: '#ffffff', letterSpacing: '0.02em' }}>{contact.nome || '—'}</p>
          </div>

          {contact.data_casamento && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <p style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 9, letterSpacing: '0.35em', color: `${GOLD}60`, textTransform: 'uppercase' }}>Data do Casamento</p>
              <p style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 13, color: `${GOLD}CC`, letterSpacing: '0.12em' }}>
                {new Date(contact.data_casamento + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          {contact.local_casamento && (
            <p style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 10, color: `rgba(255,255,255,0.35)`, letterSpacing: '0.08em' }}>
              {contact.local_casamento}
            </p>
          )}

          {intro && (
            <p style={{ margin: '8px 0 0', fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 15, color: 'rgba(255,255,255,0.4)', maxWidth: '75%', lineHeight: 1.8, textAlign: 'center' }}>
              &ldquo;{intro}&rdquo;
            </p>
          )}
        </div>

        {/* Footer da capa */}
        <div style={{ padding: '18px 52px', borderTop: `0.5px solid ${GOLD}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img src={LOGO_URL} alt="RL" style={{ height: 28, opacity: 0.4 }} />
          <p style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 8, color: `${GOLD}45`, letterSpacing: '0.2em' }}>{new Date().getFullYear()}</p>
        </div>
      </div>

      {/* ── PÁGINAS DE PROPOSTA ── */}
      {content.propostas.map((proposta, idx) => {

        const valor = parseVal(proposta.valor)
        const restante = valor > ADJUDICACAO ? valor - ADJUDICACAO : 0
        const reforco = Math.round(restante * 0.8)
        const valorFinal = Math.round(restante * 0.2)
        const hasFoto = (proposta.servicos_foto || []).length > 0
        const hasVideo = (proposta.servicos_video || []).length > 0
        const labels = ['1', '2', '3']

        return (
          <div key={idx} className="a4" style={{ background: '#ffffff', display: 'flex', flexDirection: 'column' }}>

            {/* Header strip */}
            <div style={{ background: DARK, padding: '24px 44px 20px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 52, color: GOLD, lineHeight: 1 }}>{labels[idx]}</span>
                <div>
                  <p style={{ margin: '0 0 3px', fontFamily: 'Montserrat, sans-serif', fontWeight: 400, fontSize: 8, letterSpacing: '0.45em', color: `${GOLD}70`, textTransform: 'uppercase' }}>Proposta</p>
                  <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, color: '#ffffff', fontWeight: 300, letterSpacing: '0.04em' }}>{proposta.nome || `Proposta ${labels[idx]}`}</p>
                </div>
              </div>
              <img src={LOGO_URL} alt="RL" style={{ height: 32, opacity: 0.65, alignSelf: 'center' }} />
            </div>

            {/* Body */}
            <div style={{ display: 'flex', flex: 1 }}>

              {/* Left panel */}
              <div style={{ width: '37%', background: CREAM, borderRight: `0.5px solid ${GOLD}25`, padding: '30px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Investimento */}
                <div>
                  <p style={{ margin: '0 0 6px', fontFamily: 'Montserrat, sans-serif', fontWeight: 400, fontSize: 7.5, letterSpacing: '0.5em', color: `${GOLD}80`, textTransform: 'uppercase' }}>Investimento Total</p>
                  {valor > 0
                    ? <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 42, color: GOLD, lineHeight: 1 }}>{fmt(valor)}</p>
                    : <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 18, color: `${GOLD}60`, fontWeight: 300 }}>Sob consulta</p>
                  }
                </div>

                <div style={{ height: 0.5, background: `${GOLD}30` }} />

                {/* Forma de Investimento */}
                {valor > 0 && (
                  <div>
                    <p style={{ margin: '0 0 14px', fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 7.5, letterSpacing: '0.45em', color: BODY_COLOR, textTransform: 'uppercase' }}>Forma de Investimento</p>

                    {[
                      { n: 1, label: 'Adjudicação', desc: 'Reserva da data', val: '400 €' },
                      { n: 2, label: 'Reforço', desc: '80% do valor em falta', val: restante > 0 ? fmt(reforco) : '—' },
                      { n: 3, label: 'Valor Final', desc: 'Restante no dia do casamento', val: restante > 0 ? fmt(valorFinal) : '—' },
                    ].map((step, si) => (
                      <div key={si} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: si < 2 ? `0.5px solid ${GOLD}18` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${GOLD}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 8, color: GOLD }}>{step.n}</span>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 8.5, color: BODY_COLOR }}>{step.label}</p>
                            <p style={{ margin: '2px 0 0', fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 7.5, color: '#888' }}>{step.desc}</p>
                          </div>
                        </div>
                        <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 17, color: GOLD, fontWeight: 400, flexShrink: 0 }}>{step.val}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Extras */}
                {extras.length > 0 && (
                  <>
                    <div style={{ height: 0.5, background: `${GOLD}20` }} />
                    <div>
                      <p style={{ margin: '0 0 12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 7.5, letterSpacing: '0.45em', color: BODY_COLOR, textTransform: 'uppercase' }}>Serviços Extras Disponíveis</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {extras.map((e, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: GOLD, fontSize: 5, flexShrink: 0 }}>◆</span>
                            <p style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 9, color: BODY_COLOR }}>{e.nome}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Right panel — services */}
              <div style={{ flex: 1, padding: '30px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

                {!hasFoto && !hasVideo && (
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 11, color: '#ccc', fontStyle: 'italic' }}>Serviços a definir</p>
                )}

                {hasFoto && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <p style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 7.5, letterSpacing: '0.45em', color: GOLD, textTransform: 'uppercase' }}>Fotografia</p>
                      <div style={{ flex: 1, height: 0.5, background: `${GOLD}35` }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {proposta.servicos_foto.map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ color: GOLD, fontSize: 5.5, flexShrink: 0 }}>◆</span>
                          <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 16, color: BODY_COLOR, fontWeight: 400, lineHeight: 1.2 }}>{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hasFoto && hasVideo && (
                  <div style={{ height: 0.5, background: `${GOLD}18` }} />
                )}

                {hasVideo && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <p style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 7.5, letterSpacing: '0.45em', color: GOLD, textTransform: 'uppercase' }}>Vídeo</p>
                      <div style={{ flex: 1, height: 0.5, background: `${GOLD}35` }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {proposta.servicos_video.map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ color: GOLD, fontSize: 5.5, flexShrink: 0 }}>◆</span>
                          <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 16, color: BODY_COLOR, fontWeight: 400, lineHeight: 1.2 }}>{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Page footer */}
            <div style={{ padding: '10px 44px', borderTop: `0.5px solid ${GOLD}15`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: '#fdfcf9' }}>
              <img src={LOGO_URL} alt="RL" style={{ height: 22, opacity: 0.3 }} />
              <p style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 7.5, color: '#bbb', letterSpacing: '0.15em' }}>{contact.nome}</p>
            </div>
          </div>
        )
      })}
      {/* ── CONDIÇÕES GERAIS ── */}
      <div className="a4" style={{ background: '#ffffff', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ background: DARK, padding: '24px 44px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p style={{ margin: '0 0 3px', fontFamily: 'Montserrat, sans-serif', fontWeight: 400, fontSize: 7.5, letterSpacing: '0.45em', color: `${GOLD}70`, textTransform: 'uppercase' }}>Documento</p>
            <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 26, color: '#ffffff', fontWeight: 300, letterSpacing: '0.04em' }}>Condições Gerais</p>
          </div>
          <img src={LOGO_URL} alt="RL" style={{ height: 32, opacity: 0.65 }} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '32px 44px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {CONDICOES.map((c, i) => (
            <div key={i} style={{ paddingBottom: 18, marginBottom: 18, borderBottom: i < CONDICOES.length - 1 ? `0.5px solid ${GOLD}18` : 'none' }}>
              <p style={{ margin: '0 0 5px', fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 8, letterSpacing: '0.25em', color: GOLD, textTransform: 'uppercase' }}>{c.titulo}</p>
              <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 13.5, color: '#3a3530', lineHeight: 1.75, fontWeight: 400 }}>{c.texto}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 44px', borderTop: `0.5px solid ${GOLD}15`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: '#fdfcf9' }}>
          <img src={LOGO_URL} alt="RL" style={{ height: 22, opacity: 0.3 }} />
          <p style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 7.5, color: '#bbb', letterSpacing: '0.15em' }}>{contact.nome}</p>
        </div>
      </div>

      {/* ── CONTACTOS ── */}
      <div className="a4" style={{ background: DARK, display: 'flex', flexDirection: 'column' }}>
        {/* Corner decorations */}
        {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v, h]) => (
          <div key={v+h} style={{ position: 'absolute', [v]: 36, [h]: 36, width: 44, height: 44,
            [`border${v.charAt(0).toUpperCase()+v.slice(1)}`]: `1px solid ${GOLD}`,
            [`border${h.charAt(0).toUpperCase()+h.slice(1)}`]: `1px solid ${GOLD}` }} />
        ))}

        {/* Central content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 60px', textAlign: 'center', gap: 36 }}>

          <img src={LOGO_URL} alt="RL Photo · Video" style={{ width: 110, opacity: 0.9 }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 300, fontSize: 42, color: '#ffffff', letterSpacing: '0.04em' }}>{EMPRESA.nome}</p>
            <p style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 9, letterSpacing: '0.4em', color: `${GOLD}70`, textTransform: 'uppercase' }}>Fotografia & Vídeo de Casamentos</p>
          </div>

          <div style={{ width: 50, height: 0.5, background: `${GOLD}50` }} />

          {/* Contact grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 340 }}>
            {[
              { icon: '✉', label: 'Email', value: EMPRESA.email },
              { icon: '📱', label: 'Telefone', value: EMPRESA.telefone },
              { icon: '◎', label: 'Instagram', value: EMPRESA.instagram },
              { icon: '⌂', label: 'Website', value: EMPRESA.website },
              { icon: '⊙', label: 'Localização', value: EMPRESA.morada },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', border: `0.5px solid ${GOLD}25`, borderRadius: 4 }}>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: `${GOLD}80`, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: '0 0 2px', fontFamily: 'Montserrat, sans-serif', fontWeight: 400, fontSize: 7, letterSpacing: '0.35em', color: `${GOLD}55`, textTransform: 'uppercase' }}>{item.label}</p>
                  <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 16, color: '#ffffff', fontWeight: 300, letterSpacing: '0.03em' }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ width: 50, height: 0.5, background: `${GOLD}30` }} />

          <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 14, color: `rgba(255,255,255,0.3)`, maxWidth: 320, lineHeight: 1.9 }}>
            Obrigado pela vossa confiança. Será uma honra fazer parte do vosso dia especial.
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: '18px 52px', borderTop: `0.5px solid ${GOLD}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img src={LOGO_URL} alt="RL" style={{ height: 28, opacity: 0.4 }} />
          <p style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 8, color: `${GOLD}45`, letterSpacing: '0.2em' }}>{new Date().getFullYear()}</p>
        </div>
      </div>
    </>
  )
}
