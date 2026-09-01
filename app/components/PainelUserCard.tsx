'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Cartão do membro no fundo da barra lateral dos painéis.
 *
 * Estava escrito à mão em cada sub-página: nome "Editor Pro", email
 * "editorpro@mail.com" e uma fotografia de stock. Nunca mostrava quem estava
 * mesmo no painel. Aqui a identidade vem da tabela `freelancers`, a mesma
 * fonte do dashboard e da ficha admin.
 *
 * Sem membro identificado (modo maquete) mantém-se o texto de exemplo, para as
 * demonstrações continuarem a fazer sentido.
 */
const AVATAR_EXEMPLO = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop&crop=face'

export function PainelUserCard({ compacto = false }: { compacto?: boolean } = {}) {
  const pathname = usePathname()
  const params = useSearchParams()
  const [nome, setNome] = useState('Editor Pro')
  const [email, setEmail] = useState('editorpro@mail.com')
  const [foto, setFoto] = useState(AVATAR_EXEMPLO)

  useEffect(() => {
    const chave = pathname?.startsWith('/painel-fotografo')
      ? 'painel-fotografo-fl-id'
      : 'painel-editor-fl-id'
    let id = params?.get('freelancer') ?? null
    if (!id) {
      try { id = localStorage.getItem(chave) } catch { id = null }
    }
    if (!id) return

    let cancelado = false
    fetch(`/api/painel-editor/perfil?freelancer=${id}`)
      .then(r => r.json())
      .then(d => {
        if (cancelado) return
        const base = d?.base ?? {}
        const perfil = (d?.perfil && typeof d.perfil === 'object') ? d.perfil : {}
        if (base.nome) setNome(String(base.nome).trim())
        if (base.email || perfil.email) setEmail(base.email || perfil.email)
        if (base.foto_url || perfil.foto) setFoto(base.foto_url || perfil.foto)
      })
      .catch(() => {})
    return () => { cancelado = true }
  }, [pathname, params])

  // Sem fotografia real, cai na inicial do nome em vez do retrato de stock.
  const semFoto = foto === AVATAR_EXEMPLO
  const inicial = (nome || '?').trim().charAt(0).toUpperCase()
  const lado = compacto ? 'w-9 h-9' : 'w-10 h-10'

  return (
    <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] ${compacto ? 'mb-4' : ''}`}>
      {semFoto && compacto ? (
        <div className={`${lado} rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/40 flex items-center justify-center text-gold font-bold shrink-0`}>
          {inicial}
        </div>
      ) : (
        <div className={`relative ${lado} rounded-full overflow-hidden border border-gold/40 shrink-0`}>
          <img src={foto} alt={nome} className="w-full h-full object-cover" />
          {!compacto && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-white truncate">{nome}</p>
        <p className="text-[10px] text-white/35 truncate">{email || '—'}</p>
        {!compacto && <p className="text-[9px] text-emerald-400 mt-0.5">● Online</p>}
      </div>
    </div>
  )
}
