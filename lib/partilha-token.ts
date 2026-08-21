/**
 * Token de partilha de uma sub-página do portal.
 *
 * Formato: `<base64url(payload)>.<base64url(hmac)>`
 * Payload: { id, ref, titulo, exp }
 *
 * Serve para partilhar UMA página com quem não é dos noivos, sem lhe dar
 * qualquer via para o resto do portal. O token identifica uma só página; a
 * rota /p/[token] recusa tudo o que não venha assinado e dentro do prazo.
 *
 * Implementação com Web Crypto, para correr também em Edge (middleware).
 */

const SECRET = () =>
  process.env.PARTILHA_TOKEN_SECRET ??
  process.env.NOIVOS_SESSION_SECRET ??
  process.env.AUTH_SECRET ??
  'rl-partilha-fallback-dev-secret-do-not-use-in-prod'

/** 90 dias: cobre com folga os 30 dias de download sem ficar eterno. */
export const PARTILHA_TTL_MS = 90 * 24 * 60 * 60 * 1000

export type PartilhaPayload = {
  id: string        // id da sub-página no Notion
  ref: string       // referência do evento, ex.: CAS_026_26_RL
  titulo: string    // título a mostrar
  exp: number       // epoch ms
}

const enc = new TextEncoder()
const dec = new TextDecoder()
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function b64urlEncode(bytes: Uint8Array): string {
  let out = ''
  let i = 0
  for (; i + 3 <= bytes.length; i += 3) {
    const v = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    out += B64[(v >> 18) & 63] + B64[(v >> 12) & 63] + B64[(v >> 6) & 63] + B64[v & 63]
  }
  if (i < bytes.length) {
    const r = bytes.length - i
    const v = (bytes[i] << 16) | (r === 2 ? bytes[i + 1] << 8 : 0)
    out += B64[(v >> 18) & 63] + B64[(v >> 12) & 63]
    if (r === 2) out += B64[(v >> 6) & 63]
  }
  return out
}

function b64urlDecode(s: string): Uint8Array {
  const map = new Int8Array(128).fill(-1)
  for (let i = 0; i < B64.length; i++) map[B64.charCodeAt(i)] = i
  const out = new Uint8Array(Math.floor((s.length * 3) / 4))
  let p = 0, buf = 0, bits = 0
  for (let i = 0; i < s.length; i++) {
    const v = map[s.charCodeAt(i)]
    if (v < 0) continue
    buf = (buf << 6) | v
    bits += 6
    if (bits >= 8) { bits -= 8; out[p++] = (buf >> bits) & 0xff }
  }
  return out.subarray(0, p)
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw', enc.encode(SECRET()),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify'],
  )
}

export async function assinarPartilha(
  dados: Omit<PartilhaPayload, 'exp'>,
  ttlMs: number = PARTILHA_TTL_MS,
): Promise<string> {
  const payload: PartilhaPayload = { ...dados, exp: Date.now() + ttlMs }
  const b64 = b64urlEncode(enc.encode(JSON.stringify(payload)))
  const sig = await crypto.subtle.sign('HMAC', await getKey(), enc.encode(b64))
  return `${b64}.${b64urlEncode(new Uint8Array(sig))}`
}

export async function verificarPartilha(token: string | null | undefined): Promise<PartilhaPayload | null> {
  if (!token || typeof token !== 'string') return null
  const dot = token.lastIndexOf('.')
  if (dot < 1) return null
  try {
    const ok = await crypto.subtle.verify(
      'HMAC', await getKey(),
      b64urlDecode(token.slice(dot + 1)) as unknown as BufferSource,
      enc.encode(token.slice(0, dot)),
    )
    if (!ok) return null
    const p = JSON.parse(dec.decode(b64urlDecode(token.slice(0, dot)))) as PartilhaPayload
    if (typeof p.exp !== 'number' || p.exp < Date.now()) return null
    if (!p.id || !/^[0-9a-f-]{32,36}$/i.test(p.id)) return null
    return p
  } catch { return null }
}
