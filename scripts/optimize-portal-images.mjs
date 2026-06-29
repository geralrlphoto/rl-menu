#!/usr/bin/env node
/**
 * Optimiza todas as imagens do bucket público `portal-images`:
 *   - redimensiona para no máximo 2000px no lado maior (qualidade 80, sharp)
 *   - re-grava com o MESMO nome de ficheiro e cacheControl '31536000' (1 ano)
 *   - no fim mostra quanto espaço foi poupado
 *
 * A service role key vem SEMPRE de variável de ambiente (nunca em código).
 * Lê de process.env e, se faltar, tenta carregar de rl-menu/.env.local.
 *
 * Uso:
 *   node scripts/optimize-portal-images.mjs --dry-run     # só calcula, não escreve
 *   node scripts/optimize-portal-images.mjs               # aplica
 *   node scripts/optimize-portal-images.mjs --limit 10    # processa só os primeiros N
 */

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const BUCKET = 'portal-images'
const MAX_DIMENSION = 2000
const QUALITY = 80
const CACHE_CONTROL = '31536000'
const CONCURRENCY = 5

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const limitArg = args.indexOf('--limit')
const LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : Infinity

// ── Env ────────────────────────────────────────────────────────────────────
// Carrega .env.local (sem dependências) caso as vars não estejam no ambiente.
function loadEnvLocal() {
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    const envPath = join(here, '..', '.env.local')
    const raw = readFileSync(envPath, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
      if (!m) continue
      const key = m[1]
      let val = m[2].replace(/^['"]|['"]$/g, '')
      if (!(key in process.env)) process.env[key] = val
    }
  } catch {
    /* .env.local opcional */
  }
}
loadEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('✗ Faltam variáveis de ambiente: NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function targetFormat(contentType, name) {
  const ext = (name.split('.').pop() || '').toLowerCase()
  const ct = (contentType || '').toLowerCase()
  if (ct.includes('jpeg') || ct.includes('jpg') || ext === 'jpg' || ext === 'jpeg') return 'jpeg'
  if (ct.includes('png') || ext === 'png') return 'png'
  if (ct.includes('webp') || ext === 'webp') return 'webp'
  return null
}

async function optimize(input, contentType, name) {
  const format = targetFormat(contentType, name)
  if (!format) return { buffer: input, contentType }
  const pipeline = sharp(input, { failOn: 'none' })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
  let out, outType
  if (format === 'jpeg') {
    out = await pipeline.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer()
    outType = 'image/jpeg'
  } else if (format === 'png') {
    out = await pipeline.png({ quality: QUALITY, compressionLevel: 9, palette: true }).toBuffer()
    outType = 'image/png'
  } else {
    out = await pipeline.webp({ quality: QUALITY }).toBuffer()
    outType = 'image/webp'
  }
  if (out.length >= input.length) return { buffer: input, contentType }
  return { buffer: out, contentType: outType }
}

// Lista recursiva de TODOS os ficheiros do bucket (inclui subpastas).
async function listAll(prefix = '') {
  const files = []
  const pageSize = 100
  let offset = 0
  for (;;) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: pageSize,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw new Error(`list("${prefix}"): ${error.message}`)
    if (!data || data.length === 0) break
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.id === null) {
        // É uma subpasta → recursar
        files.push(...(await listAll(path)))
      } else {
        files.push({ path, size: entry.metadata?.size ?? 0, contentType: entry.metadata?.mimetype || '' })
      }
    }
    if (data.length < pageSize) break
    offset += pageSize
  }
  return files
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n  Bucket: ${BUCKET}`)
  console.log(`  Modo:   ${DRY_RUN ? 'DRY-RUN (não escreve nada)' : 'APLICAR (re-grava ficheiros)'}`)
  console.log(`  Alvo:   máx ${MAX_DIMENSION}px · qualidade ${QUALITY} · cacheControl ${CACHE_CONTROL}\n`)

  process.stdout.write('  A listar ficheiros... ')
  let all = await listAll()
  if (Number.isFinite(LIMIT)) all = all.slice(0, LIMIT)
  console.log(`${all.length} ficheiros\n`)

  let bytesBefore = 0
  let bytesAfter = 0
  let optimized = 0
  let unchanged = 0
  let failed = 0
  let done = 0

  async function processOne(file) {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).download(file.path)
      if (error) throw new Error(error.message)
      const original = Buffer.from(await data.arrayBuffer())
      const { buffer: best, contentType } = await optimize(original, file.contentType, file.path)

      const before = original.length
      const after = best.length
      bytesBefore += before
      bytesAfter += after
      const saved = before - after

      if (!DRY_RUN) {
        // Re-grava sempre (mesmo quando o tamanho não muda) para corrigir o cacheControl.
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(file.path, best, { contentType, cacheControl: CACHE_CONTROL, upsert: true })
        if (upErr) throw new Error(`upload: ${upErr.message}`)
      }

      if (saved > 0) optimized++
      else unchanged++

      done++
      const pct = saved > 0 ? ` (-${((saved / before) * 100).toFixed(0)}%)` : ''
      console.log(
        `  [${String(done).padStart(3)}/${all.length}] ${file.path}  ${fmt(before)} → ${fmt(after)}${pct}`,
      )
    } catch (e) {
      failed++
      done++
      console.log(`  [${String(done).padStart(3)}/${all.length}] ✗ ${file.path}  (${e.message})`)
    }
  }

  // Pool de concorrência simples.
  let idx = 0
  async function worker() {
    while (idx < all.length) {
      const file = all[idx++]
      await processOne(file)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, all.length) }, worker))

  const saved = bytesBefore - bytesAfter
  const pct = bytesBefore > 0 ? (saved / bytesBefore) * 100 : 0
  console.log('\n  ─────────────────────────────────────────────')
  console.log(`  Ficheiros:        ${all.length}  (optimizados: ${optimized}, sem ganho: ${unchanged}, falhas: ${failed})`)
  console.log(`  Tamanho antes:    ${fmt(bytesBefore)}`)
  console.log(`  Tamanho depois:   ${fmt(bytesAfter)}`)
  console.log(`  Espaço poupado:   ${fmt(saved)}  (${pct.toFixed(1)}%)`)
  if (DRY_RUN) console.log('\n  (DRY-RUN — nada foi escrito. Corre sem --dry-run para aplicar.)')
  else console.log(`\n  ✓ Concluído. Todos os ficheiros re-gravados com cacheControl=${CACHE_CONTROL}.`)
  console.log('')
}

run().catch((e) => {
  console.error('\n✗ Erro fatal:', e.message)
  process.exit(1)
})
