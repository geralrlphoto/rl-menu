/* ============================================================
   /api/blog-ai/article  (POST)
   Gera o artigo completo a partir de um tema escolhido.

   Body:
   {
     systemPrompt?: string,
     topic: { title, angle, category, readingMin }
   }

   Devolve:
   {
     ok: true,
     article: {
       title, subtitle, body, seoKeywords,
       instagramFeed: { caption, hashtags },
       instagramStories: [{ title, kind }, ...],
       facebookPost: string
     }
   }
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server'
import {
  DEFAULT_SYSTEM_PROMPT,
  ARTICLE_USER_PROMPT_TEMPLATE,
} from '@/app/social-media/blog/_data/system-prompt'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5-20250929'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: 'ANTHROPIC_API_KEY não configurada',
        setup: 'Adiciona env var no Vercel.',
      },
      { status: 503 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const systemPrompt = String(body?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT).trim() || DEFAULT_SYSTEM_PROMPT
  const topic = body?.topic
  if (!topic?.title) {
    return NextResponse.json({ ok: false, error: 'topic.title obrigatório' }, { status: 400 })
  }

  const readingMin: number = Number(topic.readingMin) || 4
  const targetWords = readingMin * 200

  const userPrompt = ARTICLE_USER_PROMPT_TEMPLATE
    .replace('{{TITLE}}', String(topic.title))
    .replace('{{ANGLE}}', String(topic.angle ?? ''))
    .replace('{{CATEGORY}}', String(topic.category ?? 'fotografia'))
    .replace('{{READING_MIN}}', String(readingMin))
    .replace('{{TARGET_WORDS}}', String(targetWords))

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
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
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

    if (!parsed?.title || !parsed?.body) {
      return NextResponse.json(
        { ok: false, error: 'Resposta inválida (faltam title/body)', raw: raw.slice(0, 1500) },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true, article: parsed })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'erro' }, { status: 500 })
  }
}

function extractJson(text: string): any | null {
  if (!text) return null
  try { return JSON.parse(text) } catch {}
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenced?.[1]) {
    try { return JSON.parse(fenced[1]) } catch {}
  }
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first >= 0 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)) } catch {}
  }
  return null
}
