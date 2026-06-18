/**
 * Signed freelancer session cookie helpers.
 *
 * Cookie format: `fl_session = <base64url(payload)>.<base64url(hmac)>`
 * Payload      : { id, email, role, exp }
 *
 * Implementação com Web Crypto (`crypto.subtle`) — funciona tanto em Node.js
 * runtime como Edge runtime (middleware Next.js). Não usa `node:crypto`.
 */

const SECRET = () =>
  process.env.FREELANCER_SESSION_SECRET ??
  process.env.AUTH_SECRET ??
  'rl-photo-video-fallback-dev-secret-do-not-use-in-prod'

// TTL curto: força login a cada 30 min de inatividade. O cookie é renovado
// pelo heartbeat de presença (sliding window) enquanto o membro está activo.
const SESSION_TTL_SECONDS = 60 * 30 // 30 minutos

export type FlPayload = {
  id: string
  email: string
  role: string
  status?: string // função (ex.: 'EDITORES') — usada para routing no middleware
  exp: number // epoch ms
}

// ── base64url helpers (sem Buffer/atob/btoa para compat universal) ──────────
const enc = new TextEncoder()
const dec = new TextDecoder()
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
function b64urlEncode(bytes: Uint8Array): string {
  let out = ''
  let i = 0
  for (; i + 3 <= bytes.length; i += 3) {
    const v = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    out += B64_CHARS[(v >> 18) & 63] + B64_CHARS[(v >> 12) & 63] + B64_CHARS[(v >> 6) & 63] + B64_CHARS[v & 63]
  }
  if (i < bytes.length) {
    const r = bytes.length - i
    const v = (bytes[i] << 16) | (r === 2 ? bytes[i + 1] << 8 : 0)
    out += B64_CHARS[(v >> 18) & 63] + B64_CHARS[(v >> 12) & 63]
    if (r === 2) out += B64_CHARS[(v >> 6) & 63]
  }
  return out
}
function b64urlDecode(s: string): Uint8Array {
  const map = new Int8Array(128).fill(-1)
  for (let i = 0; i < B64_CHARS.length; i++) map[B64_CHARS.charCodeAt(i)] = i
  const len = s.length
  const out = new Uint8Array(Math.floor((len * 3) / 4))
  let p = 0
  let buf = 0, bits = 0
  for (let i = 0; i < len; i++) {
    const v = map[s.charCodeAt(i)]
    if (v < 0) continue
    buf = (buf << 6) | v
    bits += 6
    if (bits >= 8) {
      bits -= 8
      out[p++] = (buf >> bits) & 0xff
    }
  }
  return out.subarray(0, p)
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function signPayload(payloadB64: string): Promise<string> {
  const key = await getKey()
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64))
  return b64urlEncode(new Uint8Array(sig))
}

export async function makeFlSession(input: Omit<FlPayload, 'exp'>): Promise<string> {
  const payload: FlPayload = { ...input, exp: Date.now() + SESSION_TTL_SECONDS * 1000 }
  const payloadB64 = b64urlEncode(enc.encode(JSON.stringify(payload)))
  const sigB64 = await signPayload(payloadB64)
  return `${payloadB64}.${sigB64}`
}

export async function verifyFlSession(cookie: string | null | undefined): Promise<FlPayload | null> {
  if (!cookie || typeof cookie !== 'string') return null
  const dot = cookie.lastIndexOf('.')
  if (dot < 1) return null
  const payloadB64 = cookie.slice(0, dot)
  const sigB64 = cookie.slice(dot + 1)
  try {
    const key = await getKey()
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sigB64),
      enc.encode(payloadB64),
    )
    if (!ok) return null
    const payload = JSON.parse(dec.decode(b64urlDecode(payloadB64))) as FlPayload
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
    if (!payload.id) return null
    return payload
  } catch { return null }
}

export const FL_COOKIE_NAME = 'fl_session'
export const FL_COOKIE_MAX_AGE = SESSION_TTL_SECONDS
