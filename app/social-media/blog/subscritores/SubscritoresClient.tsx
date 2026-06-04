'use client'

import { useEffect, useMemo, useState } from 'react'

type Subscriber = {
  id: string
  email: string
  status: 'active' | 'unsubscribed'
  source?: string | null
  created_at: string
  unsubscribed_at?: string | null
}

export default function SubscritoresClient() {
  const [subs, setSubs] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [setupHint, setSetupHint] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [addErr, setAddErr] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'unsubscribed'>('all')
  const [search, setSearch] = useState('')

  // Import CSV
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/blog-subscribers', { cache: 'no-store' })
      const d = await r.json()
      setSubs(Array.isArray(d?.subscribers) ? d.subscribers : [])
      if (d?.setup) setSetupHint(d.setup)
    } catch {/* ignore */}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addSub(e: React.FormEvent) {
    e.preventDefault()
    const v = email.trim().toLowerCase()
    if (!v) return
    setAdding(true)
    setAddErr(null)
    try {
      const r = await fetch('/api/blog-subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: v, source: 'admin' }),
      })
      const d = await r.json()
      if (!d.ok) {
        setAddErr(d.error || 'Erro ao adicionar')
      } else {
        setEmail('')
        await load()
      }
    } catch (err: any) {
      setAddErr(err?.message ?? 'Erro de rede')
    }
    setAdding(false)
  }

  async function toggleStatus(s: Subscriber) {
    const next = s.status === 'active' ? 'unsubscribed' : 'active'
    try {
      await fetch(`/api/blog-subscribers/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      load()
    } catch {/* */}
  }

  async function removeSub(s: Subscriber) {
    if (!confirm(`Eliminar ${s.email} definitivamente?`)) return
    try {
      await fetch(`/api/blog-subscribers/${s.id}`, { method: 'DELETE' })
      load()
    } catch {/* */}
  }

  /** Extrai emails únicos de um texto/CSV. Aceita:
   *  - 1 email por linha
   *  - CSV com várias colunas (procura a coluna com formato de email)
   *  - Separadores: vírgula, ponto e vírgula, tab, nova linha */
  function extractEmails(text: string): string[] {
    const seen = new Set<string>()
    const lines = text.split(/\r?\n/)
    for (const line of lines) {
      const cells = line.split(/[,;\t]/)
      for (const cell of cells) {
        const c = cell.trim().replace(/^["']|["']$/g, '').toLowerCase()
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) {
          seen.add(c)
        }
      }
    }
    return Array.from(seen)
  }

  async function handleCsvImport(file: File) {
    setImporting(true)
    setImportMsg(null)
    setImportProgress(null)
    try {
      const text = await file.text()
      const emails = extractEmails(text)
      if (emails.length === 0) {
        setImportMsg('Nenhum email válido encontrado no ficheiro.')
        setImporting(false)
        return
      }
      setImportProgress({ done: 0, total: emails.length })
      let success = 0
      let errors = 0
      for (let i = 0; i < emails.length; i++) {
        try {
          const r = await fetch('/api/blog-subscribers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emails[i], source: 'import' }),
          })
          const d = await r.json()
          if (d.ok) success++
          else errors++
        } catch { errors++ }
        setImportProgress({ done: i + 1, total: emails.length })
      }
      setImportMsg(
        `✓ Importação concluída: ${success} guardados, ${errors} erros (de ${emails.length} emails detectados).`,
      )
      await load()
    } catch (e: any) {
      setImportMsg(`Erro: ${e?.message ?? 'desconhecido'}`)
    }
    setImporting(false)
    setImportProgress(null)
  }

  function exportCsv() {
    const visible = filteredSubs
    if (!visible.length) return
    const header = ['email', 'status', 'source', 'created_at', 'unsubscribed_at']
    const rows = visible.map(s => [
      s.email,
      s.status,
      s.source ?? '',
      s.created_at,
      s.unsubscribed_at ?? '',
    ])
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blog-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredSubs = useMemo(() => {
    return subs.filter(s => {
      if (filter !== 'all' && s.status !== filter) return false
      if (search && !s.email.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [subs, filter, search])

  const stats = useMemo(() => ({
    total: subs.length,
    active: subs.filter(s => s.status === 'active').length,
    unsubscribed: subs.filter(s => s.status === 'unsubscribed').length,
  }), [subs])

  return (
    <>
      {/* KPIs */}
      <section className="sub-stats">
        <div className="sub-stat">
          <span className="sub-stat-label">Total</span>
          <span className="sub-stat-value">{stats.total}</span>
        </div>
        <div className="sub-stat is-active">
          <span className="sub-stat-label">Activos</span>
          <span className="sub-stat-value">{stats.active}</span>
        </div>
        <div className="sub-stat is-off">
          <span className="sub-stat-label">Cancelados</span>
          <span className="sub-stat-value">{stats.unsubscribed}</span>
        </div>
      </section>

      {/* Form adicionar */}
      <section className="sub-add">
        <form onSubmit={addSub} className="sub-add-form">
          <label className="sub-add-label">Adicionar subscritor manualmente</label>
          <div className="sub-add-row">
            <input
              type="email"
              required
              placeholder="email@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="sub-add-input"
            />
            <button type="submit" disabled={adding || !email.trim()} className="sub-add-btn">
              {adding ? 'A adicionar…' : '+ Adicionar'}
            </button>
          </div>
          {addErr && <p className="sub-add-err">⚠ {addErr}</p>}
        </form>
      </section>

      {/* Toolbar */}
      <section className="sub-toolbar">
        <div className="sub-filters">
          {(['all', 'active', 'unsubscribed'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`sub-filter ${filter === f ? 'is-on' : ''}`}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Cancelados'}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Procurar email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="sub-search"
        />
        <label className={`sub-export sub-import ${importing ? 'is-loading' : ''}`}>
          {importing
            ? importProgress
              ? `A importar ${importProgress.done}/${importProgress.total}…`
              : 'A preparar…'
            : '⬆ Importar CSV'}
          <input
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            disabled={importing}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleCsvImport(f)
              e.target.value = ''
            }}
            style={{ display: 'none' }}
          />
        </label>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!filteredSubs.length}
          className="sub-export"
        >
          ⬇ Exportar CSV
        </button>
      </section>
      {importMsg && (
        <p className="sub-import-msg">{importMsg}</p>
      )}

      {/* Tabela */}
      <section className="sub-list">
        {setupHint && (
          <div className="sub-setup">
            <strong>⚠ Setup DB:</strong> {setupHint.slice(0, 300)}
          </div>
        )}

        {loading ? (
          <p className="sub-empty">A carregar…</p>
        ) : filteredSubs.length === 0 ? (
          <p className="sub-empty">
            {subs.length === 0
              ? 'Sem subscritores ainda. Adiciona o primeiro no form acima ou importa um CSV/TXT com emails.'
              : 'Nenhum subscritor corresponde aos filtros.'}
          </p>
        ) : (
          <table className="sub-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Origem</th>
                <th>Subscrito em</th>
                <th>Cancelado em</th>
                <th>Acções</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.map((s, i) => (
                <tr key={s.id} className={s.status === 'unsubscribed' ? 'is-off' : ''}>
                  <td className="sub-num">{String(i + 1).padStart(3, '0')}</td>
                  <td className="sub-email">{s.email}</td>
                  <td>
                    <span className={`sub-badge sub-badge--${s.status}`}>
                      {s.status === 'active' ? '✓ Activo' : '✕ Cancelado'}
                    </span>
                  </td>
                  <td className="sub-src">{s.source ?? '—'}</td>
                  <td className="sub-date">{formatDate(s.created_at)}</td>
                  <td className="sub-date">{s.unsubscribed_at ? formatDate(s.unsubscribed_at) : '—'}</td>
                  <td className="sub-actions">
                    <button type="button" onClick={() => toggleStatus(s)} className="sub-act">
                      {s.status === 'active' ? 'Cancelar' : 'Reactivar'}
                    </button>
                    <button type="button" onClick={() => removeSub(s)} className="sub-act sub-act--danger">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Como funciona */}
      <section className="sub-help">
        <h3 className="sub-help-title">Como funciona</h3>
        <p className="sub-help-text">
          Este é só o teu <strong>arquivo</strong> de subscritores — não é um sistema de envio automático.
          Podes adicionar 1 a 1 no formulário acima ou <strong>importar uma lista</strong> em CSV/TXT.
        </p>
        <p className="sub-help-text">
          O importador detecta automaticamente emails em qualquer formato:
          1 por linha, separados por vírgula, ponto-e-vírgula ou tab.
          Emails duplicados são ignorados (a tabela tem unique constraint).
          Cada novo email guarda a <strong>data e hora exacta</strong> da importação.
        </p>
        <p className="sub-help-text">
          Quando quiseres enviar uma newsletter, exportas o CSV e usas a tua ferramenta
          preferida (Mailchimp, MailerLite, Resend, etc.).
        </p>
      </section>
    </>
  )
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
