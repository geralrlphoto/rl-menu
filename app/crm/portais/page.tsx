'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const MASTER_TOKEN = '85343645-b0d3-4412-ae78-795fd7f8ddf1'
const BATIZADO_MASTER = 'batizado_batizado-maquete'

type WeddingPortal = {
  page_token: string
  nome: string | null
  data_casamento: string | null
  status: string | null
}

type BatizadoPortal = {
  page_id: string
  token: string
  clientName: string | null
}

export default function PortaisPage() {
  const [weddings, setWeddings]   = useState<WeddingPortal[]>([])
  const [batizados, setBatizados] = useState<BatizadoPortal[]>([])
  const [loading, setLoading]     = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'wedding' | 'batizado'; id: string; label: string } | null>(null)
  const [deleting, setDeleting]   = useState(false)

  async function load() {
    setLoading(true)
    const [{ data: wRaw }, { data: bRaw }] = await Promise.all([
      supabase
        .from('crm_contacts')
        .select('page_token, nome, data_casamento, status')
        .not('page_token', 'is', null)
        .neq('page_token', MASTER_TOKEN)
        .order('nome', { ascending: true }),
      supabase
        .from('portal_template_settings')
        .select('page_id, settings')
        .like('page_id', 'batizado_%')
        .neq('page_id', BATIZADO_MASTER)
        .order('page_id', { ascending: true }),
    ])

    setWeddings((wRaw ?? []).filter(r => r.page_token) as WeddingPortal[])
    setBatizados(
      (bRaw ?? []).map((r: any) => ({
        page_id: r.page_id,
        token: r.page_id.replace('batizado_', ''),
        clientName: r.settings?.content?.evento?.nome || null,
      }))
    )
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)

    if (confirmDelete.type === 'wedding') {
      await supabase
        .from('crm_contacts')
        .update({ page_token: null })
        .eq('page_token', confirmDelete.id)
    } else {
      await supabase
        .from('portal_template_settings')
        .delete()
        .eq('page_id', confirmDelete.id)
    }

    setDeleting(false)
    setConfirmDelete(null)
    await load()
  }

  const total = weddings.length + batizados.length

  return (
    <main className="min-h-screen bg-[#0c0a07] px-6 py-14 md:px-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="text-[10px] tracking-[0.5em] uppercase text-white/20 mb-2">CRM · Portais</p>
            <h1 className="text-3xl font-extralight text-white tracking-[0.06em]">Portais Activos</h1>
          </div>
          <div className="flex items-center gap-4">
            {!loading && (
              <div className="text-right">
                <p className="text-white/20 text-[10px] tracking-[0.4em] uppercase">Total</p>
                <p className="text-3xl font-extralight text-gold">{total}</p>
              </div>
            )}
            <Link
              href="/crm"
              className="px-5 py-3 border border-white/10 hover:border-gold/40 rounded-xl text-sm text-white/40 hover:text-gold tracking-[0.15em] uppercase transition-all"
            >
              ← CRM
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-white/20 tracking-[0.4em] text-xs uppercase text-center py-20">A carregar...</p>
        ) : (
          <>
            {/* Casamentos */}
            <section className="mb-14">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[10px] tracking-[0.5em] uppercase text-gold/50">Casamentos</span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-white/20">{weddings.length}</span>
              </div>

              {weddings.length === 0 ? (
                <p className="text-white/20 text-sm tracking-wider">Nenhum portal de casamento encontrado.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {weddings.map(p => (
                    <div key={p.page_token} className="group bg-white/[0.02] border border-white/8 hover:border-gold/20 rounded-2xl px-5 py-5 transition-all flex flex-col gap-3">
                      {/* Badge row */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] tracking-[0.4em] uppercase text-gold/40 border border-gold/20 rounded-full px-2 py-0.5">
                          Casamento
                        </span>
                        <button
                          onClick={() => setConfirmDelete({ type: 'wedding', id: p.page_token, label: p.nome || p.page_token })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-400 p-1 rounded-lg hover:bg-red-400/10"
                          title="Eliminar portal"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>

                      {/* Info */}
                      <div>
                        <p className="text-white font-light text-base tracking-wide mb-1">
                          {p.nome || <span className="text-white/30 italic text-sm">Sem nome</span>}
                        </p>
                        {p.data_casamento && (
                          <p className="text-white/30 text-xs tracking-wider">
                            {new Date(p.data_casamento + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        )}
                        {p.status && (
                          <p className="text-white/20 text-[10px] tracking-[0.3em] uppercase mt-1">{p.status}</p>
                        )}
                      </div>

                      {/* Open link — explicit button, not overlay */}
                      <a
                        href={`/r/${p.page_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase text-white/20 hover:text-gold transition-colors"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                        Abrir Portal
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Batizados */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[10px] tracking-[0.5em] uppercase text-gold/50">Batizados</span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-white/20">{batizados.length}</span>
              </div>

              {batizados.length === 0 ? (
                <p className="text-white/20 text-sm tracking-wider">Nenhum portal de batizado encontrado.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {batizados.map(p => (
                    <div key={p.page_id} className="group bg-white/[0.02] border border-white/8 hover:border-gold/20 rounded-2xl px-5 py-5 transition-all flex flex-col gap-3">
                      {/* Badge row */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] tracking-[0.4em] uppercase text-blue-400/50 border border-blue-400/20 rounded-full px-2 py-0.5">
                          Batizado
                        </span>
                        <button
                          onClick={() => setConfirmDelete({ type: 'batizado', id: p.page_id, label: p.clientName || p.token })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-400 p-1 rounded-lg hover:bg-red-400/10"
                          title="Eliminar portal"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>

                      {/* Info */}
                      <div>
                        <p className="text-white font-light text-base tracking-wide mb-1">
                          {p.clientName || <span className="text-white/30 italic text-sm">Sem nome</span>}
                        </p>
                        <p className="text-white/20 text-[10px] tracking-[0.25em] font-mono">{p.token}</p>
                      </div>

                      {/* Open link */}
                      <a
                        href={`/b/${p.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase text-white/20 hover:text-gold transition-colors"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                        Abrir Portal
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* ── Modal confirmação ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <div className="bg-[#120e09] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <p className="text-[10px] tracking-[0.5em] uppercase text-red-400/60 mb-4">Confirmar Eliminação</p>
            <p className="text-white font-light text-lg mb-2 leading-snug">
              Tens a certeza que queres eliminar o portal de{' '}
              <span className="text-gold">{confirmDelete.label}</span>?
            </p>
            <p className="text-white/30 text-xs tracking-wider mb-8">
              {confirmDelete.type === 'wedding'
                ? 'O portal será removido mas o contacto fica no CRM.'
                : 'Todos os dados deste portal de batizado serão apagados permanentemente.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 px-4 py-3 border border-white/10 hover:border-white/20 rounded-xl text-sm text-white/40 hover:text-white/70 tracking-[0.15em] uppercase transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/60 rounded-xl text-sm text-red-400 tracking-[0.15em] uppercase transition-all disabled:opacity-40"
              >
                {deleting ? 'A eliminar...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
