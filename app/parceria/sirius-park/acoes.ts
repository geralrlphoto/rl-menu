'use server'

// Ações do portal de parceria. Casamentos e biblioteca: só a RL (sessão de admin).
// Mood board: a Inês (password do portal) e a RL.
import { db, ehAdmin } from './apresentacao/fotos'
import { temAcesso } from './apresentacao/acesso'
import { BUCKET, PASTA, PUBLICO, mudarPortal, type Casamento, type EstadoMood, type ItemBib } from './dados'

const id = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
const agora = () => new Date().toISOString()
const doBucket = (u?: string) => !u || u.startsWith(`${PUBLICO}${PASTA}/`)
const https = (u?: string) => !u || /^https:\/\/[^\s]+$/.test(u)
const nomeSeguro = (n: string) =>
  n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.\- ]+/g, '').replace(/\s+/g, '-').slice(-80) || 'ficheiro'

async function podeVer() { return (await ehAdmin()) || (await temAcesso()) }

// Envio direto do browser para o Storage (sem passar pelo servidor: aguenta vídeos grandes)
export async function prepararEnvio(nome: string, pasta: 'biblioteca' | 'moodboard') {
  if (pasta === 'biblioteca' ? !(await ehAdmin()) : !(await podeVer())) return null
  const path = `${PASTA}/${pasta}/${Date.now()}-${nomeSeguro(nome)}`
  const { data, error } = await db().storage.from(BUCKET).createSignedUploadUrl(path)
  if (error || !data) return null
  return { path: data.path, token: data.token, url: `${PUBLICO}${data.path}` }
}

export async function gravarCasamento(c: Omit<Casamento, 'id'>) {
  if (!(await ehAdmin())) return null
  const noivos = c.noivos.trim().slice(0, 80)
  if (!noivos || !/^\d{4}-\d{2}-\d{2}$/.test(c.data)) return null
  const convidados = c.convidados && c.convidados > 0 ? Math.round(c.convidados) : undefined
  return mudarPortal(d => ({ ...d, casamentos: [...d.casamentos, { id: id(), noivos, data: c.data, convidados }] }))
}

export async function tirarCasamento(cid: string) {
  if (!(await ehAdmin())) return null
  return mudarPortal(d => ({ ...d, casamentos: d.casamentos.filter(c => c.id !== cid) }))
}

export async function juntarBiblioteca(itens: Omit<ItemBib, 'id' | 'criado'>[]) {
  if (!(await ehAdmin())) return null
  const ok = itens.filter(i => (i.tipo === 'foto' || i.tipo === 'video') && https(i.url) && (doBucket(i.url) || /vimeo\.com|youtu/.test(i.url)))
  if (!ok.length) return null
  return mudarPortal(d => ({ ...d, biblioteca: [...ok.map(i => ({ ...i, titulo: i.titulo.slice(0, 80), id: id(), criado: agora() })), ...d.biblioteca] }))
}

export async function tirarBiblioteca(bid: string) {
  if (!(await ehAdmin())) return null
  return mudarPortal(d => ({ ...d, biblioteca: d.biblioteca.filter(b => b.id !== bid) }))
}

export async function juntarMood(r: { imgs: string[]; link?: string; nota: string }) {
  if (!(await podeVer())) return null
  const admin = await ehAdmin()
  const imgs = r.imgs.filter(u => doBucket(u)).slice(0, 20)
  const link = r.link?.trim() || undefined
  const nota = r.nota.trim().slice(0, 600)
  if (!https(link) || (!imgs.length && !link && !nota)) return null
  const base = { nota, autor: admin ? 'rl' as const : 'sirius' as const, estado: 'novo' as const, criado: agora() }
  // Cada imagem fica um cartão; a nota e o link vão com a primeira
  const novos = imgs.length
    ? imgs.map((img, i) => ({ ...base, id: id(), img, ...(i === 0 ? { link } : { nota: '' }) }))
    : [{ ...base, id: id(), link }]
  return mudarPortal(d => ({ ...d, moodboard: [...novos, ...d.moodboard] }))
}

export async function estadoMood(mid: string, estado: EstadoMood) {
  if (!(await ehAdmin())) return null
  return mudarPortal(d => ({ ...d, moodboard: d.moodboard.map(m => m.id === mid ? { ...m, estado } : m) }))
}

export async function tirarMood(mid: string) {
  if (!(await podeVer())) return null
  return mudarPortal(d => ({ ...d, moodboard: d.moodboard.filter(m => m.id !== mid) }))
}
