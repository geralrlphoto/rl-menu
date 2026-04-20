'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STATUS_COLOR: Record<string, string> = {
  active: '#3ca374', pending: '#f0b429', unsubscribed: '#666', bounced: '#c97c7c', complained: '#c97c7c',
}

export default function SubscribersClient({ initial }: { initial: any[] }) {
  const router = useRouter()
  const [subs, setSubs] = useState(initial)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [adding, setAdding] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newNome, setNewNome] = useState('')
  const [importing, setImporting] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  const filtered = useMemo(() => {
    return subs.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (search && !(s.email?.toLowerCase().includes(search.toLowerCase()) || s.nome?.toLowerCase().includes(search.toLowerCase()))) return false
      return true
    })
  }, [subs, search, statusFilter])

  const counts = useMemo(() => ({
    all: subs.length,
    active: subs.filter(s => s.status === 'active').length,
    pending: subs.filter(s => s.status === 'pending').length,
    unsubscribed: subs.filter(s => s.status === 'unsubscribed').length,
  }), [subs])

  async function addSubscriber() {
    if (!newEmail) return
    setAdding(true)
    try {
      const r = await fetch('/api/newsletter-subscriber-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, nome: newNome, skip_confirmation: true }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      setSubs([data.subscriber, ...subs])
      setNewEmail(''); setNewNome('')
    } catch (e: any) {
      alert('Erro: ' + e.message)
    } finally {
      setAdding(false)
    }
  }

  async function importFromEvents() {
    setImporting(true)
    setImportResult(null)
    try {
      const r = await fetch('/api/newsletter-import-noivos', { method: 'POST' })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      setImportResult(data)
      router.refresh()
    } catch (e: any) {
      alert('Erro: ' + e.message)
    } finally {
      setImporting(false)
    }
  }

  async function deleteSubscriber(id: string) {
    if (!confirm('Remover este subscritor?')) return
    try {
      await fetch(`/api/newsletter-subscriber-delete?id=${id}`, { method: 'DELETE' })
      setSubs(subs.filter(s => s.id !== id))
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0e0b06', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ padding: '24px 40px', borderBottom: '1px solid #2a2217', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Link href="/newsletter-admin" style={{ color: '#8a7450', fontSize: 11, textDecoration: 'none', letterSpacing: 2 }}>← NEWSLETTERS</Link>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 400, marginTop: 8 }}>
            Subscritores <em style={{ color: '#c9a96e' }}>({counts.all})</em>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowImport(!showImport)} style={btnGhost}>
            Importar Noivos
          </button>
        </div>
      </div>

      {/* Import panel */}
      {showImport && (
        <div style={{ padding: '24px 40px', background: 'rgba(201,169,110,0.05)', borderBottom: '1px solid #2a2217' }}>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 400, marginBottom: 12 }}>Importar emails de noivos existentes</h3>
          <p style={{ fontSize: 13, color: '#b3a082', marginBottom: 16, lineHeight: 1.6 }}>
            Vai buscar todos os emails dos eventos/casais que já tens no Supabase e adicionar à lista como subscritores <strong>ativos</strong>.<br />
            Não são enviados emails de confirmação — assume que são clientes teus e já deram consentimento.
          </p>
          <button onClick={importFromEvents} disabled={importing} style={btnGold}>
            {importing ? 'A importar...' : 'Importar Agora'}
          </button>
          {importResult && (
            <div style={{ marginTop: 16, padding: 14, background: '#110e08', border: '1px solid #3ca374', fontSize: 13, color: '#b3a082' }}>
              ✓ Importação completa: <strong style={{ color: '#c9a96e' }}>{importResult.imported}</strong> novos · {importResult.skipped} já existiam · {importResult.total_found} emails encontrados
            </div>
          )}
        </div>
      )}

      {/* Add manually */}
      <div style={{ padding: '20px 40px', borderBottom: '1px solid #2a2217', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input placeholder="email@exemplo.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ ...input, minWidth: 240 }} />
        <input placeholder="Nome (opcional)" value={newNome} onChange={e => setNewNome(e.target.value)} style={{ ...input, minWidth: 180 }} />
        <button onClick={addSubscriber} disabled={adding || !newEmail} style={btnGold}>
          {adding ? '...' : '+ Adicionar'}
        </button>
      </div>

      {/* Filters */}
      <div style={{ padding: '16px 40px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #2a2217' }}>
        <input placeholder="Pesquisar email ou nome..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...input, minWidth: 240, flex: 1, maxWidth: 400 }} />
        {['all', 'active', 'pending', 'unsubscribed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{
              padding: '8px 14px', background: statusFilter === s ? '#c9a96e' : 'transparent',
              color: statusFilter === s ? '#0e0b06' : '#8a7450',
              border: `1px solid ${statusFilter === s ? '#c9a96e' : '#2a2217'}`,
              fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
            }}>
            {s === 'all' ? 'TODOS' : s.toUpperCase()} ({counts[s as keyof typeof counts] ?? 0})
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ padding: 40 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2217' }}>
              <Th>Email</Th><Th>Nome</Th><Th>Estado</Th><Th>Origem</Th><Th>Data</Th><Th></Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #1a1510' }}>
                <Td><span style={{ color: '#fff' }}>{s.email}</span></Td>
                <Td>{s.nome || '—'}</Td>
                <Td>
                  <span style={{
                    fontSize: 10, padding: '3px 10px', borderRadius: 2, letterSpacing: 1.5,
                    background: STATUS_COLOR[s.status] + '20', color: STATUS_COLOR[s.status], textTransform: 'uppercase',
                  }}>{s.status}</span>
                </Td>
                <Td><span style={{ fontSize: 11, color: '#8a7450' }}>{s.source}</span></Td>
                <Td><span style={{ fontSize: 11, color: '#8a7450' }}>{new Date(s.created_at).toLocaleDateString('pt-PT')}</span></Td>
                <Td>
                  <button onClick={() => deleteSubscriber(s.id)} style={{
                    background: 'transparent', border: 'none', color: '#8a7450', cursor: 'pointer', fontSize: 16,
                  }}>×</button>
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#4a3f28' }}>Sem resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const input: React.CSSProperties = {
  padding: '10px 14px', background: '#1a1510', border: '1px solid #2a2217',
  color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit',
}
const btnGold: React.CSSProperties = {
  padding: '10px 22px', background: '#c9a96e', color: '#0e0b06', border: 'none',
  fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  padding: '10px 22px', background: 'transparent', color: '#c9a96e', border: '1px solid #7a6340',
  fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 10, letterSpacing: 2, color: '#8a7450', fontWeight: 600 }}>{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '12px 8px', fontSize: 13, color: '#b3a082' }}>{children}</td>
}
