'use server'

// Pedido de disponibilidade do kit dos casais do Sirius Park:
// cria a lead no CRM (Nova Entrada, "Indicação · Sirius Park") e avisa por email o geral.rlphoto@gmail.com.
// Falhar o email não falha o pedido: a lead já ficou guardada.
import { revalidateTag } from 'next/cache'
import { db } from '../apresentacao/fotos'
import { qualificarLead } from '@/lib/crm'

const DESTINO = 'geral.rlphoto@gmail.com'
const REMETENTE = 'RL Photo.Video <geral@rlphotovideo.pt>'
const COMO_CHEGOU_SIRIUS = 'Indicação · Sirius Park'

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

export async function pedirDisponibilidade(f: { nome: string; email: string; contacto: string; data: string; site?: string }) {
  if (f.site) return { ok: true } // campo escondido: só os robôs o preenchem
  const nome = f.nome.trim().slice(0, 120)
  const email = f.email.trim().toLowerCase().slice(0, 160)
  const contato = f.contacto.trim().slice(0, 40)
  const data = /^\d{4}-\d{2}-\d{2}$/.test(f.data) ? f.data : ''
  if (nome.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || contato.replace(/\D/g, '').length < 9 || !data) {
    return { ok: false, erro: 'Preencham o nome, o email, o contacto e a data.' }
  }
  const hoje = new Date().toISOString().slice(0, 10)

  const { error } = await db().from('crm_contacts').insert({
    nome, email, contato,
    data_casamento: data,
    local_casamento: 'Sirius Park',
    tipo_evento: 'Casamento',
    como_chegou: COMO_CHEGOU_SIRIUS,
    mensagem: 'Pedido de disponibilidade pelo kit do Sirius Park (recomendação da Inês).',
    status: 'Por Contactar',
    lead_prioridade: qualificarLead('', data),
    data_entrada: hoje,
    proxima_acao: 'Verificar a data e responder (pedido pelo kit do Sirius Park)',
    proxima_acao_data: hoje,
  })
  if (error) return { ok: false, erro: 'Não foi possível enviar. Tentem outra vez ou falem connosco por WhatsApp.' }
  revalidateTag('photo-dashboard', { expire: 0 })

  if (process.env.RESEND_API_KEY) {
    const dataPT = new Date(`${data}T12:00:00`).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const linhas: [string, string][] = [['Noivos', nome], ['Data', dataPT], ['Email', email], ['Contacto', contato], ['Local', 'Sirius Park'], ['Origem', 'Kit do Sirius Park (Inês)']]
    const html = `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0b0b0b;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;padding:40px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111;border:1px solid #3a3022;border-radius:14px;">
<tr><td style="padding:36px 40px;font-family:Helvetica,Arial,sans-serif;">
<p style="margin:0 0 6px;font-size:11px;letter-spacing:.3em;color:#d8be93;text-transform:uppercase;">Nova lead · Sirius Park</p>
<p style="margin:0 0 24px;font-size:24px;color:#f3ede2;font-weight:300;">Pedido de disponibilidade</p>
<table width="100%" cellpadding="0" cellspacing="0">${linhas.map(([k, v]) => `<tr><td style="padding:9px 0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8a7650;white-space:nowrap;vertical-align:top;">${k}</td><td style="padding:9px 0 9px 20px;font-size:15px;color:#f3ede2;">${esc(v)}</td></tr>`).join('')}</table>
<p style="margin:26px 0 0;font-size:13px;color:#9a9285;">Já está no CRM como Nova Entrada. Disseram-lhes que vamos verificar a data e entrar em contacto.</p>
</td></tr></table></td></tr></table></body></html>`
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: REMETENTE, to: [DESTINO], reply_to: email, subject: `Nova lead Sirius Park: ${nome} · ${dataPT}`, html }),
      })
    } catch (e) { console.error('[sirius kit] email não enviado', e) }
  }
  return { ok: true }
}
