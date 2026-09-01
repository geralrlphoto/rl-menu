/* ============================================================
   Markdown mínimo para as notas dos episódios.

   O briefing pedia Markdown renderizado. Uma biblioteca dessas seria
   uma dependência nova, que não podemos acrescentar, por isso está
   aqui o essencial escrito à mão: títulos, listas, negrito, itálico,
   ligações e parágrafos.

   O texto é escapado ANTES de qualquer conversão, portanto nada do que
   escreveres nas notas pode injectar HTML na página.
   ============================================================ */

function escapar(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inline(s: string): string {
  return s
    // [texto](ligação) — só http(s) e caminhos internos
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
      (_m, texto, url) => `<a href="${url}" ${url.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${texto}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
}

export function markdownParaHtml(md: string | null | undefined): string {
  if (!md) return ''
  const linhas = escapar(md).split(/\r?\n/)
  const saida: string[] = []
  let emLista = false

  const fecharLista = () => { if (emLista) { saida.push('</ul>'); emLista = false } }

  for (const bruta of linhas) {
    const linha = bruta.trim()

    if (linha === '') { fecharLista(); continue }

    if (linha.startsWith('### ')) { fecharLista(); saida.push(`<h3>${inline(linha.slice(4))}</h3>`); continue }
    if (linha.startsWith('## '))  { fecharLista(); saida.push(`<h2>${inline(linha.slice(3))}</h2>`); continue }
    if (linha.startsWith('# '))   { fecharLista(); saida.push(`<h2>${inline(linha.slice(2))}</h2>`); continue }

    if (/^[-*]\s+/.test(linha)) {
      if (!emLista) { saida.push('<ul>'); emLista = true }
      saida.push(`<li>${inline(linha.replace(/^[-*]\s+/, ''))}</li>`)
      continue
    }

    fecharLista()
    saida.push(`<p>${inline(linha)}</p>`)
  }

  fecharLista()
  return saida.join('\n')
}
