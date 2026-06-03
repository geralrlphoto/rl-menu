/* ============================================================
   /api/blog-ai/topics  (POST)
   Gera 3 ideias de artigo via Claude (Anthropic).

   Body opcional:
   {
     systemPrompt?: string   // override do default
   }

   Devolve:
   {
     ok: true,
     topics: [
       { title, angle, category, readingMin }, x3
     ]
   }
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_SYSTEM_PROMPT, TOPICS_USER_PROMPT } from '@/app/social-media/blog/_data/system-prompt'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5-20250929'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: 'ANTHROPIC_API_KEY não configurada',
        setup: 'Vai a Vercel → Project → Settings → Environment Variables. Adiciona ANTHROPIC_API_KEY com a tua chave da Anthropic. Cria conta em https://console.anthropic.com se ainda não tiveres.',
      },
      { status: 503 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const systemPrompt = String(body?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT).trim() || DEFAULT_SYSTEM_PROMPT

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        temperature: 0.9, // mais variedade nos 3 temas
        system: systemPrompt,
        messages: [{ role: 'user', content: TOPICS_USER_PROMPT }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return NextResponse.json(
        { ok: false, error: `Anthropic API ${res.status}`, details: errText.slice(0, 500) },
        { status: 502 },
      )
    }

    const data: any = await res.json()
    const raw = data?.content?.[0]?.text ?? ''
    const parsed = extractJson(raw)

    if (!parsed?.topics || !Array.isArray(parsed.topics)) {
      return NextResponse.json(
        { ok: false, error: 'Resposta do modelo sem topics array', raw: raw.slice(0, 1000) },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true, topics: parsed.topics })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'erro' }, { status: 500 })
  }
}

/** Extrai o primeiro JSON válido de um texto.
 *  Aceita ```json fences ou JSON directo. */
function extractJson(text: string): any | null {
  if (!text) return null
  // Tenta direct parse
  try { return JSON.parse(text) } catch {}
  // Tenta extrair de fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenced?.[1]) {
    try { return JSON.parse(fenced[1]) } catch {}
  }
  // Tenta encontrar primeiro `{` … último `}`
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first >= 0 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)) } catch {}
  }
  return null
}
