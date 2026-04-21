'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Section = { num: string; title: string; body: string }

export default function NewsletterEditor({ initialData, activeSubscribers }: { initialData: any; activeSubscribers: number }) {
  const router = useRouter()
  const [data, setData] = useState({
    ...initialData,
    sections: (initialData.sections || []) as Section[],
  })
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<any>(null)
  const [adminKey, setAdminKey] = useState('')
  const [testMode, setTestMode] = useState(false)
  const [testEmail, setTestEmail] = useState('ruimngpro@gmail.com')
  const [toast, setToast] = useState('')

  const isLocked = data.status === 'sent'
  const pct = (a: number, b: number) => b ? Math.round((a / b) * 100) : 0

  function update(patch: any) {
    setData((d: any) => ({ ...d, ...patch }))
  }

  function updateSection(i: number, patch: Partial<Section>) {
    const s = [...data.sections]
    s[i] = { ...s[i], ...patch }
    update({ sections: s })
  }

  function addSection() {
    const num = String(data.sections.length + 1).padStart(2, '0')
    update({ sections: [...data.sections, { num, title: '', body: '' }] })
  }

  function removeSection(i: number) {
    update({ sections: data.sections.filter((_: any, idx: number) => idx !== i) })
  }

  async function save() {
    setSaving(true)
    try {
      const r = await fetch(`/api/newsletter-update?id=${data.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title, subject: data.subject, preview_text: data.preview_text,
          hero_image_url: data.hero_image_url, intro: data.intro, sections: data.sections,
          cta_label: data.cta_label, cta_url: data.cta_url, category: data.category,
        }),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'Erro')
      setToast('Guardado')
      setTimeout(() => setToast(''), 2000)
    } catch (e: any) {
      alert('Erro a guardar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function approveAndSend() {
    setSending(true)
    try {
      sessionStorage.setItem('nl_admin_key', adminKey)
      await save()
      const r = await fetch('/api/newsletter-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          newsletter_id: data.id,
          ...(testMode ? { test_email: testEmail } : {}),
        }),
      })
      const result = await r.json()
      if (!r.ok) throw new Error(result.error || 'Erro')
      setSent(result)
    } catch (e: any) {
      alert('Erro: ' + e.message)
    } finally {
      setSending(false)
    }
  }

  const html = buildEmailHtml(data)
  const isComplete = data.intro && data.sections.length > 0 && data.sections.every((s: Section) => s.title && s.body)

  return (
    <div style={{ minHeight: '100vh', background: '#0e0b06', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ padding: '20px 32px', borderBottom: '1px solid #2a2217', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link href="/newsletter-admin" style={{ color: '#8a7450', fontSize: 11, textDecoration: 'none', letterSpacing: 2 }}>← LISTA</Link>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 400, marginTop: 4 }}>
            {isLocked ? 'Newsletter ' : 'Editar '}<em style={{ color: '#c9a96e' }}>Newsletter</em>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {toast && <span style={{ fontSize: 12, color: '#3ca374' }}>✓ {toast}</span>}
          {!isLocked && (
            <>
              <button onClick={save} disabled={saving} style={btnGhost}>
                {saving ? 'A guardar...' : 'Guardar'}
              </button>
              <button onClick={() => { setTestMode(true); setShowConfirm(true) }} disabled={!isComplete} style={{ ...btnGhost, opacity: isComplete ? 1 : 0.4 }}>
                ✉ Enviar Teste
              </button>
              <button onClick={() => { setTestMode(false); setShowConfirm(true) }} disabled={!isComplete} style={{ ...btnGold, opacity: isComplete ? 1 : 0.4 }}>
                Aprovar e Enviar →
              </button>
            </>
          )}
        </div>
      </div>

      {(data.delivered_count || data.unique_opens || data.total_clicks || isLocked) ? (
        <div style={{ padding: '20px 32px', background: 'rgba(201,168,76,0.05)', borderBottom: '1px solid #2a2217' }}>
          <div style={{ fontSize: 10, color: '#8a7450', letterSpacing: 3, marginBottom: 12 }}>
            ESTATÍSTICAS {isLocked ? 'DE ENVIO' : '(INCLUI TESTES)'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
            <Stat label="Destinatários" value={(data.sent_to_count || 0) + (isLocked ? 0 : (data.delivered_count || 0))} />
            <Stat label="Entregues" value={data.delivered_count || 0} />
            <Stat label="Aberturas únicas" value={data.unique_opens || 0} />
            <Stat label="Cliques total" value={data.total_clicks || 0} />
            <Stat label="Cliques Instagram" value={data.ig_clicks || 0} icon="📸" />
            <Stat label="Partilhas" value={data.share_clicks || 0} icon="↗" />
            <Stat label="Bounces" value={data.bounced_count || 0} />
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 80px)' }}>
        {/* EDITOR */}
        <div style={{ padding: 28, borderRight: '1px solid #2a2217', overflowY: 'auto', maxHeight: 'calc(100vh - 80px)' }}>
          <Field label="TITULO INTERNO">
            <input value={data.title || ''} onChange={e => update({ title: e.target.value })} style={input} disabled={isLocked} />
          </Field>
          <Field label="ASSUNTO DO EMAIL">
            <input value={data.subject || ''} onChange={e => update({ subject: e.target.value })} style={input} disabled={isLocked} />
          </Field>
          <Field label="PREVIEW TEXT">
            <input value={data.preview_text || ''} onChange={e => update({ preview_text: e.target.value })} style={input} disabled={isLocked} />
          </Field>
          <Field label="CATEGORIA">
            <select value={data.category || ''} onChange={e => update({ category: e.target.value })} style={input} disabled={isLocked}>
              <option value="">—</option>
              <option value="dicas">Dicas</option>
              <option value="tendencias">Tendências</option>
              <option value="bastidores">Bastidores</option>
              <option value="checklists">Checklists</option>
              <option value="inspiracao">Inspiração</option>
              <option value="historias">Histórias</option>
            </select>
          </Field>
          <Field label="IMAGEM HERO (URL)">
            <input value={data.hero_image_url || ''} onChange={e => update({ hero_image_url: e.target.value })} style={input} disabled={isLocked} placeholder="https://..." />
          </Field>
          <Field label="INTRODUCAO">
            <textarea value={data.intro || ''} onChange={e => update({ intro: e.target.value })} rows={3} style={{ ...input, fontFamily: 'inherit' }} disabled={isLocked} />
          </Field>

          <div style={{ margin: '28px 0 12px', fontSize: 11, color: '#8a7450', letterSpacing: 3 }}>SECCOES</div>
          {data.sections.map((s: Section, i: number) => (
            <div key={i} style={{ border: '1px solid #2a2217', padding: 14, marginBottom: 10, position: 'relative' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={s.num} onChange={e => updateSection(i, { num: e.target.value })} style={{ ...input, width: 70, fontFamily: 'Georgia, serif' }} disabled={isLocked} />
                <input value={s.title} onChange={e => updateSection(i, { title: e.target.value })} placeholder="Titulo da seccao" style={input} disabled={isLocked} />
                {!isLocked && (
                  <button onClick={() => removeSection(i)} style={{ background: 'transparent', border: 'none', color: '#8a7450', cursor: 'pointer', fontSize: 16 }}>×</button>
                )}
              </div>
              <textarea value={s.body} onChange={e => updateSection(i, { body: e.target.value })} rows={4} style={{ ...input, fontFamily: 'inherit' }} disabled={isLocked} placeholder="Corpo do texto..." />
            </div>
          ))}
          {!isLocked && (
            <button onClick={addSection} style={{ ...btnGhost, marginBottom: 24 }}>+ Adicionar Secção</button>
          )}

          <Field label="BOTAO — TEXTO"><input value={data.cta_label || ''} onChange={e => update({ cta_label: e.target.value })} style={input} disabled={isLocked} /></Field>
          <Field label="BOTAO — URL"><input value={data.cta_url || ''} onChange={e => update({ cta_url: e.target.value })} style={input} disabled={isLocked} /></Field>
        </div>

        {/* PREVIEW */}
        <div style={{ padding: 28, background: '#0a0804', overflowY: 'auto', maxHeight: 'calc(100vh - 80px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: '#8a7450', letterSpacing: 3 }}>PREVIEW</div>
              <div style={{ fontSize: 11, color: '#6a5a3e', marginTop: 4 }}>Assim chega ao subscritor (com rotação real de fotos)</div>
            </div>
            <button onClick={() => setPreviewKey(k => k + 1)} style={btnGhost}>↻ Rodar Foto</button>
          </div>
          <div style={{ background: '#fff', borderRadius: 4, overflow: 'hidden' }}>
            <iframe
              key={previewKey}
              src={`/api/newsletter-preview/${data.id}?v=${previewKey}`}
              style={{ width: '100%', height: 900, border: 'none', display: 'block' }}
              title="Preview"
            />
          </div>
        </div>
      </div>

      {/* CONFIRMACAO */}
      {showConfirm && (
        <div onClick={() => !sending && !sent && setShowConfirm(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#110e08', border: '1px solid #7a6340', maxWidth: 480, width: '100%',
            padding: 40, textAlign: 'center', fontFamily: 'Georgia, serif',
          }}>
            {!sent ? (
              <>
                <h2 style={{ fontSize: 26, marginBottom: 16 }}>
                  {testMode ? 'Envio de ' : 'Confirmar '}
                  <em style={{ color: '#c9a96e' }}>{testMode ? 'teste' : 'envio'}</em>
                </h2>
                {testMode ? (
                  <>
                    <p style={{ color: '#b3a082', fontFamily: 'Arial, sans-serif', fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
                      Envia "<strong>{data.subject}</strong>" apenas para um email para testares o design e conteúdo.<br />
                      <span style={{ fontSize: 11, opacity: 0.7 }}>Não afeta os {activeSubscribers} subscritores.</span>
                    </p>
                    <div style={{ textAlign: 'left', marginBottom: 14 }}>
                      <label style={{ fontSize: 10, color: '#8a7450', letterSpacing: 2, fontFamily: 'Arial, sans-serif' }}>EMAIL DE TESTE</label>
                      <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} style={{ ...input, marginTop: 6 }} />
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#b3a082', fontFamily: 'Arial, sans-serif', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
                    Vais enviar <strong>"{data.subject}"</strong> para<br />
                    <strong style={{ color: '#c9a96e' }}>{activeSubscribers} subscritores ativos</strong>.<br />
                    <span style={{ fontSize: 11, opacity: 0.7 }}>Esta ação não pode ser revertida.</span>
                  </p>
                )}
                <div style={{ textAlign: 'left', marginBottom: 20 }}>
                  <label style={{ fontSize: 10, color: '#8a7450', letterSpacing: 2, fontFamily: 'Arial, sans-serif' }}>CHAVE ADMIN</label>
                  <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)} style={{ ...input, marginTop: 6 }} autoFocus />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowConfirm(false)} disabled={sending} style={{ ...btnGhost, flex: 1 }}>Cancelar</button>
                  <button onClick={approveAndSend} disabled={sending || !adminKey} style={{ ...btnGold, flex: 1 }}>
                    {sending ? 'A enviar...' : (testMode ? 'Enviar Teste' : 'Confirmar')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, color: '#c9a96e', marginBottom: 16 }}>✓</div>
                <h2 style={{ fontSize: 26, marginBottom: 16 }}>Newsletter <em style={{ color: '#c9a96e' }}>enviada</em></h2>
                <p style={{ color: '#b3a082', fontFamily: 'Arial, sans-serif', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
                  Enviada para <strong>{sent.sent}</strong> de <strong>{sent.total}</strong> subscritores.
                  {sent.failed > 0 && <><br />{sent.failed} falharam.</>}
                </p>
                <button onClick={() => { router.push('/newsletter-admin'); router.refresh() }} style={btnGold}>Voltar à Lista</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const input: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: '#1a1510', border: '1px solid #2a2217',
  color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'Arial, sans-serif',
}

const btnGold: React.CSSProperties = {
  padding: '12px 28px', background: '#c9a96e', color: '#0e0b06', border: 'none',
  fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  padding: '12px 24px', background: 'transparent', color: '#c9a96e', border: '1px solid #7a6340',
  fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
}

function Stat({ label, value, sub, icon }: { label: string; value: number; sub?: string; icon?: string }) {
  return (
    <div style={{ padding: 14, background: 'rgba(0,0,0,0.25)', border: '1px solid #2a2217' }}>
      <div style={{ fontSize: 10, color: '#8a7450', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
        {icon && <span style={{ marginRight: 4 }}>{icon}</span>}{label}
      </div>
      <div style={{ fontSize: 24, fontFamily: 'Georgia, serif', color: '#c9a96e', fontWeight: 300 }}>
        {value}{sub && <span style={{ fontSize: 12, color: '#6a5a3e', marginLeft: 6 }}>{sub}</span>}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 10, color: '#8a7450', letterSpacing: 2, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

// Template partilhado — espelha landing page
function esc(s: string): string {
  return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

const TESTIMONIALS = [
  { text: "O Rui e a equipa foram incriveis. Captaram cada emocao com uma sensibilidade unica. As fotografias sao autenticas obras de arte.", author: "Ana & Pedro", year: 2025 },
  { text: "Profissionalismo do inicio ao fim. Passaram despercebidos durante o dia mas captaram todos os momentos especiais. O filme e cinematografico!", author: "Sofia & Miguel", year: 2025 },
  { text: "Mais do que fotografos, ganhamos amigos. Fizeram-nos sentir em casa, confortaveis e naturais. Recomendamos de olhos fechados!", author: "Joana & Tiago", year: 2024 },
  { text: "Olhamos para as fotografias e revivemos o dia como se fosse ontem. A qualidade e impressionante, a emocao esta toda la.", author: "Catarina & Rui", year: 2025 },
  { text: "Tinhamos medo da camara e eles souberam poer-nos a vontade. As fotografias mais naturais que ja vimos.", author: "Ines & Ricardo", year: 2024 },
  { text: "Vale cada cent. O album e uma obra-prima que vamos passar aos filhos. O filme faz-nos chorar todas as vezes que vemos.", author: "Marta & Andre", year: 2025 },
  { text: "Contratamos outros fotografos para sessoes e nenhum chegou ao nivel. A diferenca esta nos detalhes que so eles captam.", author: "Beatriz & Joao", year: 2024 },
  { text: "No dia do casamento estavam em todo o lado mas sem se notar. Capturaram momentos que nem nos vimos acontecer. Magia pura.", author: "Carolina & Diogo", year: 2025 },
  { text: "A equipa certa faz toda a diferenca. Com o Rui e a equipa sentimos que estavamos em casa. O resultado fala por si.", author: "Filipa & Nuno", year: 2024 },
  { text: "Entrega impecavel, prazo cumprido, qualidade acima do esperado. O Same Day Edit foi o momento mais emocionante da festa.", author: "Raquel & Hugo", year: 2025 },
]
function rand3() { return [...TESTIMONIALS].sort(() => Math.random() - 0.5).slice(0, 3) }

function buildEmailHtml(d: any) {
  const testis = rand3()
  const testiHtml = testis.map(t => `
    <tr><td style="padding:0 40px 16px;background:rgba(201,168,76,0.03);">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.015);border:1px solid rgba(201,168,76,0.08);"><tr><td style="padding:28px;">
        <p style="margin:0 0 14px;font-family:'Montserrat',Arial,sans-serif;font-size:11px;letter-spacing:2px;color:#c9a84c;">★ ★ ★ ★ ★</p>
        <p style="margin:0 0 18px;font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-style:italic;color:#f5f0e8;line-height:1.7;">"${t.text}"</p>
        <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#a09585;text-transform:uppercase;">${t.author} &middot; Casamento ${t.year}</p>
      </td></tr></table>
    </td></tr>`).join('')
  const sections = (d.sections || []).map((s: any) => `
    <tr><td style="padding:32px 40px 0;">
      <p style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-style:italic;color:#c9a84c;letter-spacing:1px;">${esc(s.num || '')}</p>
      <h2 style="margin:0 0 14px;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:400;color:#f5f0e8;line-height:1.3;">${esc(s.title || '')}</h2>
      <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:16px;line-height:1.75;color:#b3a082;font-weight:300;">${esc(s.body || '')}</p>
    </td></tr>
  `).join('')

  const hero = d.hero_image_url ? `<tr><td style="padding:0 40px 32px;"><img src="${esc(d.hero_image_url)}" alt="" style="width:100%;display:block;height:auto;border:0;border-radius:4px;" /></td></tr>` : ''

  const cta = d.cta_url && d.cta_label ? `<tr><td style="padding:24px 40px 8px;">
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#c9a84c;padding:16px 36px;">
      <a href="${esc(d.cta_url)}" style="display:block;color:#0c0907;text-decoration:none;font-family:'Montserrat',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">${esc(d.cta_label)}</a>
    </td></tr></table>
  </td></tr>` : ''

  const intro = d.intro ? `<tr><td style="padding:0 40px 8px;">
    <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:16px;line-height:1.75;color:#b3a082;font-weight:300;">${esc(d.intro)}</p>
  </td></tr>` : ''

  return `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#0c0907;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(d.preview_text || '')}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0c0907;"><tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1410;border:1px solid rgba(201,168,76,0.15);border-radius:8px;overflow:hidden;">
  <tr><td style="padding:40px 40px 24px;text-align:center;background:rgba(201,168,76,0.04);">
    <img src="https://rl-menu-lake.vercel.app/logo-email.png" alt="RL" width="80" height="80" style="display:block;margin:0 auto 16px;width:80px;height:auto;border:0;" />
    <p style="margin:0 0 6px;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:#c9a84c;letter-spacing:4px;">RL PHOTO &amp; VIDEO</p>
    <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:10px;letter-spacing:3px;color:#a09585;">NEWSLETTER QUINZENAL</p>
  </td></tr>
  <!-- HERO inspira -->
  <tr><td style="padding:72px 40px 64px;text-align:center;background:#0c0907;">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 40px;"><tr>
      <td style="border:1px solid rgba(201,168,76,0.3);padding:10px 28px;">
        <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:11px;letter-spacing:4px;color:#c9a84c;text-transform:uppercase;">NEWSLETTER EXCLUSIVA</p>
      </td>
    </tr></table>
    <h1 style="margin:0 0 28px;font-family:'Cormorant Garamond',Georgia,serif;font-size:46px;font-weight:300;line-height:1.15;color:#f5f0e8;">
      Inspira o teu<br><em style="font-style:italic;color:#c9a84c;">casamento de sonho</em>
    </h1>
    <p style="margin:0 auto 40px;max-width:460px;font-family:'Montserrat',Arial,sans-serif;font-size:14px;font-weight:300;line-height:1.8;color:#a09585;">
      Dicas, tendências e bastidores do mundo da fotografia e videografia de casamentos. Direto na tua caixa de email, todas as semanas.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
      <td style="background:#c9a84c;padding:16px 44px;">
        <a href="https://rl-menu-lake.vercel.app/newsletter" style="display:block;color:#0c0907;text-decoration:none;font-family:'Montserrat',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">Partilhar com Amigos</a>
      </td>
    </tr></table>
    <p style="margin:20px 0 0;font-family:'Montserrat',Arial,sans-serif;font-size:11px;color:#6a5a3e;">Sem spam. Cancela quando quiseres.</p>
  </td></tr>
  <tr><td style="padding:0 40px;"><table width="100%"><tr><td style="border-top:1px solid rgba(201,168,76,0.15);height:1px;font-size:1px;">&nbsp;</td></tr></table></td></tr>
  <tr><td style="padding:48px 40px;background:#0c0907;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="25%" align="center" style="padding:8px;">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:38px;font-weight:300;color:#c9a84c;line-height:1;margin-bottom:6px;">+500</div>
        <div style="font-family:'Montserrat',Arial,sans-serif;font-size:10px;letter-spacing:3px;color:#a09585;text-transform:uppercase;">Casamentos</div>
      </td>
      <td width="25%" align="center" style="padding:8px;">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:38px;font-weight:300;color:#c9a84c;line-height:1;margin-bottom:6px;">8</div>
        <div style="font-family:'Montserrat',Arial,sans-serif;font-size:10px;letter-spacing:3px;color:#a09585;text-transform:uppercase;">Anos experi&ecirc;ncia</div>
      </td>
      <td width="25%" align="center" style="padding:8px;">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:38px;font-weight:300;color:#c9a84c;line-height:1;margin-bottom:6px;">50+</div>
        <div style="font-family:'Montserrat',Arial,sans-serif;font-size:10px;letter-spacing:3px;color:#a09585;text-transform:uppercase;">Dicas exclusivas</div>
      </td>
      <td width="25%" align="center" style="padding:8px;">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:300;color:#c9a84c;line-height:1;margin-bottom:6px;font-style:italic;">Quinzenal</div>
        <div style="font-family:'Montserrat',Arial,sans-serif;font-size:10px;letter-spacing:3px;color:#a09585;text-transform:uppercase;">Frequ&ecirc;ncia</div>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:0 40px;"><table width="100%"><tr><td style="border-top:1px solid rgba(201,168,76,0.15);height:1px;font-size:1px;">&nbsp;</td></tr></table></td></tr>
  <tr><td style="padding:32px 40px 24px;">
    <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:400;color:#f5f0e8;line-height:1.25;">${esc(d.subject || '')}</h1>
  </td></tr>
  ${hero}
  ${intro}
  ${sections}
  ${cta}
  <tr><td style="padding:56px 40px 16px;text-align:center;background:rgba(201,168,76,0.03);border-top:1px solid rgba(201,168,76,0.1);">
    <p style="margin:0 0 8px;font-family:'Montserrat',Arial,sans-serif;font-size:10px;letter-spacing:4px;color:#c9a84c;text-transform:uppercase;">TESTEMUNHOS</p>
    <h3 style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#f5f0e8;line-height:1.2;">O que dizem os <em style="font-style:italic;color:#c9a84c;">noivos</em></h3>
    <p style="margin:0 0 36px;font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#6a5a3e;">Casais que confiaram em nos para eternizar o seu grande dia</p>
  </td></tr>
  ${testiHtml}
  <tr><td style="padding:24px 40px 0;background:rgba(201,168,76,0.03);"><table width="100%"><tr><td style="border-top:1px solid rgba(201,168,76,0.08);height:1px;font-size:1px;">&nbsp;</td></tr></table></td></tr>
  <tr><td style="padding:56px 40px 48px;text-align:center;">
    <p style="margin:0 0 8px;font-family:'Montserrat',Arial,sans-serif;font-size:10px;letter-spacing:4px;color:#c9a84c;text-transform:uppercase;">INSTAGRAM</p>
    <h3 style="margin:0 0 16px;font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:400;color:#f5f0e8;line-height:1.2;">Os bastidores <em style="font-style:italic;color:#c9a84c;">todos os dias</em></h3>
    <p style="margin:0 auto 32px;max-width:420px;font-family:'Montserrat',Arial,sans-serif;font-size:14px;color:#a09585;line-height:1.7;font-weight:300;">Acompanhem a nossa jornada no Instagram. Fotografias exclusivas, vídeos dos casamentos e inspiração para o vosso grande dia.</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
      <td style="background:#c9a84c;padding:16px 40px;">
        <a href="https://www.instagram.com/rlphoto_fotografia.video/" style="display:block;color:#0c0907;text-decoration:none;font-family:'Montserrat',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">Seguir no Instagram</a>
      </td>
    </tr></table>
    <p style="margin:18px 0 0;font-family:'Montserrat',Arial,sans-serif;font-size:11px;color:#6a5a3e;">@rlphoto_fotografia.video</p>
  </td></tr>
  <tr><td style="padding:48px 40px 32px;text-align:center;">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr><td style="width:40px;height:1px;background:#c9a84c;font-size:1px;">&nbsp;</td></tr></table>
    <p style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-style:italic;color:#c9a84c;">Com carinho,</p>
    <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:#a09585;">Equipa RL Photo &amp; Video</p>
  </td></tr>
  <tr><td style="padding:28px 40px 36px;text-align:center;background:rgba(12,9,7,0.5);border-top:1px solid rgba(201,168,76,0.1);">
    <p style="margin:0 0 14px;font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;color:#c9a84c;letter-spacing:3px;">RL PHOTO &amp; VIDEO</p>
    <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:11px;color:#a09585;line-height:1.7;">
      <a href="https://rlphotovideo.pt" style="color:#a09585;text-decoration:none;">rlphotovideo.pt</a> &middot;
      <a href="https://www.instagram.com/rlphoto_fotografia.video/" style="color:#a09585;text-decoration:none;">Instagram</a>
    </p>
    <p style="margin:16px 0 0;font-family:'Montserrat',Arial,sans-serif;font-size:10px;color:#6a5a3e;line-height:1.6;">
      Recebeste este email porque subscreveste a nossa newsletter.<br>
      <a href="{{unsubscribe_url}}" style="color:#8a7450;text-decoration:underline;">Cancelar subscrição</a>
    </p>
  </td></tr>
</table></td></tr></table></body></html>`
}
