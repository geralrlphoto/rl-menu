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
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<any>(null)
  const [adminKey, setAdminKey] = useState('')
  const [toast, setToast] = useState('')

  const isLocked = data.status === 'sent'

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
        body: JSON.stringify({ newsletter_id: data.id }),
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
              <button onClick={() => setShowConfirm(true)} disabled={!isComplete} style={{ ...btnGold, opacity: isComplete ? 1 : 0.4 }}>
                Aprovar e Enviar →
              </button>
            </>
          )}
        </div>
      </div>

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
          <div style={{ fontSize: 11, color: '#8a7450', letterSpacing: 3, marginBottom: 8 }}>PREVIEW</div>
          <div style={{ fontSize: 11, color: '#6a5a3e', marginBottom: 20 }}>Assim chega ao subscritor</div>
          <div style={{ background: '#fff', borderRadius: 4, overflow: 'hidden' }}>
            <iframe srcDoc={html} style={{ width: '100%', height: 700, border: 'none', display: 'block' }} title="Preview" />
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
                <h2 style={{ fontSize: 26, marginBottom: 16 }}>Confirmar <em style={{ color: '#c9a96e' }}>envio</em></h2>
                <p style={{ color: '#b3a082', fontFamily: 'Arial, sans-serif', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
                  Vais enviar <strong>"{data.subject}"</strong> para<br />
                  <strong style={{ color: '#c9a96e' }}>{activeSubscribers} subscritores ativos</strong>.<br />
                  <span style={{ fontSize: 11, opacity: 0.7 }}>Esta ação não pode ser revertida.</span>
                </p>
                <div style={{ textAlign: 'left', marginBottom: 20 }}>
                  <label style={{ fontSize: 10, color: '#8a7450', letterSpacing: 2, fontFamily: 'Arial, sans-serif' }}>CHAVE ADMIN</label>
                  <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)} style={{ ...input, marginTop: 6 }} autoFocus />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowConfirm(false)} disabled={sending} style={{ ...btnGhost, flex: 1 }}>Cancelar</button>
                  <button onClick={approveAndSend} disabled={sending || !adminKey} style={{ ...btnGold, flex: 1 }}>
                    {sending ? 'A enviar...' : 'Confirmar'}
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

function buildEmailHtml(d: any) {
  const sections = (d.sections || []).map((s: any) => `
    <tr><td style="padding:32px 40px 0;">
      <p style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-style:italic;color:#c9a84c;letter-spacing:1px;">${esc(s.num || '')}</p>
      <h2 style="margin:0 0 14px;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:400;color:#f5f0e8;line-height:1.25;">${esc(s.title || '')}</h2>
      <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:14px;line-height:1.85;color:#a09585;font-weight:300;">${esc(s.body || '')}</p>
    </td></tr>
  `).join('')

  const hero = d.hero_image_url ? `<tr><td style="padding:0 40px 32px;"><img src="${esc(d.hero_image_url)}" alt="" style="width:100%;display:block;height:auto;border:0;border-radius:4px;" /></td></tr>` : ''

  const cta = d.cta_url && d.cta_label ? `<tr><td style="padding:24px 40px 8px;">
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#c9a84c;padding:16px 36px;">
      <a href="${esc(d.cta_url)}" style="display:block;color:#0c0907;text-decoration:none;font-family:'Montserrat',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">${esc(d.cta_label)}</a>
    </td></tr></table>
  </td></tr>` : ''

  const intro = d.intro ? `<tr><td style="padding:0 40px 8px;">
    <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:14px;line-height:1.8;color:#a09585;font-weight:300;">${esc(d.intro)}</p>
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
  <tr><td style="padding:0 40px;"><table width="100%"><tr><td style="border-top:1px solid rgba(201,168,76,0.15);height:1px;font-size:1px;">&nbsp;</td></tr></table></td></tr>
  <tr><td style="padding:32px 40px 24px;">
    <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:400;color:#f5f0e8;line-height:1.25;">${esc(d.subject || '')}</h1>
  </td></tr>
  ${hero}
  ${intro}
  ${sections}
  ${cta}
  <tr><td style="padding:48px 40px 32px;text-align:center;">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr><td style="width:40px;height:1px;background:#c9a84c;font-size:1px;">&nbsp;</td></tr></table>
    <p style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-style:italic;color:#c9a84c;">Com carinho,</p>
    <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:#a09585;">Equipa RL Photo &amp; Video</p>
  </td></tr>
  <tr><td style="padding:28px 40px 36px;text-align:center;background:rgba(12,9,7,0.5);border-top:1px solid rgba(201,168,76,0.1);">
    <p style="margin:0 0 14px;font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;color:#c9a84c;letter-spacing:3px;">RL PHOTO &amp; VIDEO</p>
    <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:11px;color:#a09585;line-height:1.7;">
      <a href="https://rlphotovideo.pt" style="color:#a09585;text-decoration:none;">rlphotovideo.pt</a> &middot;
      <a href="https://www.instagram.com/rlphotovideo" style="color:#a09585;text-decoration:none;">Instagram</a>
    </p>
    <p style="margin:16px 0 0;font-family:'Montserrat',Arial,sans-serif;font-size:10px;color:#6a5a3e;line-height:1.6;">
      Recebeste este email porque subscreveste a nossa newsletter.<br>
      <a href="{{unsubscribe_url}}" style="color:#8a7450;text-decoration:underline;">Cancelar subscrição</a>
    </p>
  </td></tr>
</table></td></tr></table></body></html>`
}
