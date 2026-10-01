// Lista de sub-páginas do modelo do portal (Notion) para a barra lateral.
// O pedido ao Notion às vezes falha (503), e a barra ficava só com "Início".
// Por isso: mostra logo a última lista guardada no browser e volta a tentar até 3 vezes.

export type NavPage = { id: string; title: string }

const chave = (pageId: string) => `portalNav_${pageId}`

function lerGuardada(pageId: string): NavPage[] {
  try { return JSON.parse(localStorage.getItem(chave(pageId)) ?? '[]') } catch { return [] }
}

export function carregarNavPortal(pageId: string, aoCarregar: (pages: NavPage[]) => void): () => void {
  let cancelado = false
  const guardada = lerGuardada(pageId)
  if (guardada.length) aoCarregar(guardada)

  const tentar = async (n: number) => {
    try {
      const r = await fetch(`/api/portais-clientes?id=${pageId}`, { cache: 'no-store' })
      if (!r.ok) throw new Error(String(r.status))
      const d = await r.json()
      const out: NavPage[] = []
      const walk = (bs: any[]) => {
        for (const b of bs ?? []) {
          if (b.type === 'child_page') out.push({ id: b.id, title: b.child_page?.title ?? '' })
          if (b.children) walk(b.children)
        }
      }
      walk(d?.blocks ?? [])
      if (!out.length) throw new Error('vazio')
      if (cancelado) return
      aoCarregar(out)
      try { localStorage.setItem(chave(pageId), JSON.stringify(out)) } catch { /* sem storage */ }
    } catch {
      if (!cancelado && n < 3) setTimeout(() => tentar(n + 1), n * 2500)
    }
  }
  tentar(1)
  return () => { cancelado = true }
}
