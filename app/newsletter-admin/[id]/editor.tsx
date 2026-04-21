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

// Template partilhado — mesmo usado no envio real
function esc(s: string): string {
  return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function buildEmailHtml(d: any) {
  const sections = (d.sections || []).map((s: any, i: number) => {
    const isLast = i === (d.sections || []).length - 1
    return `
    <tr><td style="padding:0 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#15100a;border:1px solid #2a2217;margin-bottom:${isLast ? 0 : 16}px;">
        <tr><td style="padding:28px 28px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:top;width:60px;">
              <div style="display:inline-block;padding:6px 10px;border:1px solid #c9a96e;color:#c9a96e;font-family:Georgia,serif;font-size:13px;font-style:italic;">
                ${esc(s.num || '')}
              </div>
            </td>
            <td style="vertical-align:top;padding-left:16px;">
              <h2 style="margin:0 0 10px;font-size:22px;font-weight:400;color:#fff;font-family:Georgia,serif;line-height:1.25;">
                ${esc(s.title || '')}
              </h2>
              <p style="margin:0;font-size:14px;line-height:1.85;color:#b3a082;font-family:Arial,sans-serif;">
                ${esc(s.body || '')}
              </p>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>`
  }).join('')

  const hero = d.hero_image_url
    ? `<tr><td style="padding:0;"><img src="${esc(d.hero_image_url)}" alt="" style="width:100%;display:block;height:auto;border:0;" /></td></tr>`
    : ''

  const cta = d.cta_url && d.cta_label
    ? `<tr><td style="padding:0 40px 24px;text-align:center;">
        <a href="${esc(d.cta_url)}" style="display:inline-block;padding:18px 48px;background:#c9a96e;color:#0e0b06;text-decoration:none;font-family:Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:4px;text-transform:uppercase;">${esc(d.cta_label)}</a>
      </td></tr>
      <tr><td style="padding:0 40px 40px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #2a2217;height:1px;font-size:1px;">&nbsp;</td></tr></table></td></tr>`
    : ''

  const intro = d.intro
    ? `<tr><td style="padding:0 40px 32px;">
        <p style="margin:0;font-size:17px;line-height:1.7;color:#c9a96e;font-style:italic;font-family:Georgia,serif;text-align:center;">${esc(d.intro)}</p>
      </td></tr>
      <tr><td style="padding:0 40px 32px;text-align:center;"><div style="display:inline-block;width:48px;height:1px;background:#c9a96e;font-size:1px;line-height:1px;">&nbsp;</div></td></tr>`
    : ''

  const category = d.category
    ? `<tr><td style="padding:0 40px 12px;text-align:center;">
        <span style="display:inline-block;padding:5px 14px;border:1px solid #7a6340;color:#c9a96e;font-family:Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;">${esc(d.category)}</span>
      </td></tr>`
    : ''

  return `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.subject || '')}</title></head>
<body style="margin:0;padding:0;background:#0e0b06;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(d.preview_text || '')}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;"><tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#110e08;border:1px solid #3a2f1e;">
  <tr><td style="padding:48px 40px 32px;text-align:center;">
    <div style="display:inline-block;width:72px;height:72px;border-radius:50%;border:1px solid #c9a96e;line-height:72px;margin-bottom:18px;">
      <span style="font-size:22px;font-style:italic;color:#c9a96e;font-family:Georgia,serif;letter-spacing:1px;">RL</span>
    </div>
    <p style="margin:0;font-size:10px;letter-spacing:4px;color:#8a7450;font-family:Arial,sans-serif;font-weight:500;">RL PHOTO &amp; VIDEO</p>
    <p style="margin:6px 0 0;font-size:9px;letter-spacing:3px;color:#4a3f28;font-family:Arial,sans-serif;">NEWSLETTER QUINZENAL</p>
  </td></tr>
  ${hero}
  <tr><td style="padding:40px 0 0;">&nbsp;</td></tr>
  ${category}
  <tr><td style="padding:8px 40px 24px;text-align:center;">
    <h1 style="margin:0;font-size:32px;font-weight:400;color:#fff;line-height:1.22;font-family:Georgia,serif;letter-spacing:-0.3px;">${esc(d.subject || '')}</h1>
  </td></tr>
  ${intro}
  ${sections}
  <tr><td style="padding:40px 0 0;">&nbsp;</td></tr>
  ${cta}
  <tr><td style="padding:32px 40px;text-align:center;border-top:1px solid #2a2217;background:#0c0a06;">
    <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:16px;color:#c9a96e;font-style:italic;">Com carinho,</p>
    <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#b3a082;">Equipa RL Photo &amp; Video</p>
  </td></tr>
  <tr><td style="padding:28px 40px 36px;text-align:center;background:#0a0804;">
    <p style="margin:0 0 12px;font-size:10px;color:#8a7450;font-family:Arial,sans-serif;letter-spacing:2px;">RL PHOTO &amp; VIDEO</p>
    <p style="margin:0 0 14px;font-size:11px;color:#6a5a3e;font-family:Arial,sans-serif;line-height:1.7;">
      <a href="https://rlphotovideo.pt" style="color:#8a7450;text-decoration:none;">rlphotovideo.pt</a> &middot;
      <a href="https://www.instagram.com/rlphotovideo" style="color:#8a7450;text-decoration:none;">Instagram</a>
    </p>
    <p style="margin:16px 0 0;font-size:10px;color:#4a3f28;font-family:Arial,sans-serif;line-height:1.6;">
      Recebeste este email porque subscreveste a nossa newsletter.<br>
      <a href="{{unsubscribe_url}}" style="color:#6a5a3e;text-decoration:underline;">Cancelar subscrição</a>
    </p>
  </td></tr>
</table></td></tr></table></body></html>`
}
