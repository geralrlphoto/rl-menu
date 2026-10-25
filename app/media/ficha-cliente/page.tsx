'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FUNDO } from '@/app/media/_lib/estilo'
import { Secao, Campo, ComCopiar, Copiar, inputCls, chip, nLinhas } from './_ui'
import CampoDataPT from '@/app/media/_components/CampoDataPT'

const TIPOS = [
  'Produção Photography & Video',
  'Vídeo Institucional',
  'Vídeo Casamento',
  'Vídeo Evento',
  'Fotografia Comercial',
  'Fotografia Produto',
  'Fotografia Evento',
  'Outro',
]

const ESTADOS = [
  'Contacto Inicial',
  'Proposta Enviada',
  'Em Negociação',
  'Adjudicado',
  'Em Produção',
  'Concluído',
  'Cancelado',
]

const ESTADOS_CONTRATO = [
  'Por Elaborar',
  'Enviado ao Cliente',
  'Assinado',
  'Cancelado',
]

interface FormData {
  ref: string
  nome: string
  empresa: string
  nif: string
  morada: string
  email: string
  telefone: string
  representanteLegal: string
  tipo: string
  estado: string
  descricao: string
  orcamento: string
  dataFilmagem: string
  dataEntrega: string
  notas: string
  // Anexo I
  servicosList: string
  profissionaisList: string
  localAssinatura: string
  // Contrato
  contratoRef: string
  contratoEstado: string
  contratoDataEnvio: string
  contratoDataAssinatura: string
  contratoUrl: string
  contratoNotas: string
}

const EMPTY: FormData = {
  ref: '',
  nome: '',
  empresa: '',
  nif: '',
  morada: '',
  email: '',
  telefone: '',
  representanteLegal: '',
  tipo: '',
  estado: 'Contacto Inicial',
  descricao: '',
  orcamento: '',
  dataFilmagem: '',
  dataEntrega: '',
  notas: '',
  servicosList: '',
  profissionaisList: '',
  localAssinatura: 'Lisboa',
  contratoRef: '',
  contratoEstado: 'Por Elaborar',
  contratoDataEnvio: '',
  contratoDataAssinatura: '',
  contratoUrl: '',
  contratoNotas: '',
}

// Campos de cada secção (para os contadores e o índice lateral)
const SECOES: { id: string; num: string; titulo: string; campos: (keyof FormData)[] }[] = [
  { id: 'identificacao', num: '01', titulo: 'Identificação', campos: ['ref', 'nome', 'empresa', 'nif', 'telefone', 'email', 'morada', 'representanteLegal'] },
  { id: 'projeto', num: '02', titulo: 'Projeto', campos: ['tipo', 'estado', 'dataFilmagem', 'dataEntrega', 'orcamento', 'localAssinatura', 'descricao'] },
  { id: 'anexo', num: '03', titulo: 'Anexo I', campos: ['servicosList', 'profissionaisList'] },
  { id: 'contrato', num: '04', titulo: 'Contrato', campos: ['contratoRef', 'contratoEstado', 'contratoDataEnvio', 'contratoDataAssinatura', 'contratoUrl', 'contratoNotas'] },
  { id: 'notas', num: '05', titulo: 'Notas internas', campos: ['notas'] },
]

const OBRIGATORIOS: { campo: keyof FormData; rotulo: string; dica: string }[] = [
  { campo: 'nome', rotulo: 'Nome do cliente', dica: 'Para guardar a ficha' },
  { campo: 'ref', rotulo: 'Ref do portal', dica: 'Para gerar o contrato' },
]

const cheio = (v: string) => v.trim() !== ''

const hora = () => new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })

// Ficha guardada na base de dados (/api/media-fichas), para a lista lateral
type FichaResumo = { id: string; ref: string | null; nome: string | null; empresa: string | null; estado: string | null; atualizado_em: string }

export default function FichaClientePage() {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [guardadoAs, setGuardadoAs] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [contratoGerado, setContratoGerado] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [tentou, setTentou] = useState(false)
  const [fichaId, setFichaId] = useState<string | null>(null)
  const [fichas, setFichas] = useState<FichaResumo[]>([])
  const [procura, setProcura] = useState('')

  async function carregarLista() {
    try { const r = await fetch('/api/media-fichas'); if (r.ok) setFichas(await r.json()) } catch { /* sem rede */ }
  }

  // Lista das fichas guardadas; ?id= abre uma ficha diretamente
  useEffect(() => {
    carregarLista()
    const id = new URLSearchParams(window.location.search).get('id')
    if (id) abrirFicha(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function abrirFicha(id: string) {
    setError('')
    try {
      const r = await fetch(`/api/media-fichas?id=${id}`)
      const d = await r.json()
      if (!r.ok || !d) throw new Error(d?.error || 'Ficha não encontrada.')
      setForm({ ...EMPTY, ...(d.dados ?? {}) })
      setFichaId(d.id)
      setGuardadoAs(new Date(d.atualizado_em).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }))
      setContratoGerado(null)
      setTentou(false)
      window.history.replaceState(null, '', `?id=${d.id}`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível abrir a ficha.')
    }
  }

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))
  const setV = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTentou(true)
    if (!form.nome.trim()) { setError('Nome do cliente é obrigatório.'); return }
    setSaving(true)
    setError('')
    try {
      const r = await fetch('/api/media-fichas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fichaId, dados: form }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro ao guardar.')
      if (!fichaId) { setFichaId(d.id); window.history.replaceState(null, '', `?id=${d.id}`) }
      setSaved(true)
      setGuardadoAs(hora())
      setTimeout(() => setSaved(false), 3000)
      carregarLista()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar a ficha.')
    } finally {
      setSaving(false)
    }
  }

  async function handleGerarContrato() {
    setTentou(true)
    if (!form.ref.trim()) { setError('Ref do portal é obrigatória para gerar o contrato.'); return }
    if (!form.nome.trim()) { setError('Nome do cliente é obrigatório.'); return }
    setGerando(true)
    setError('')
    try {
      const res = await fetch('/api/media-portal/gerar-contrato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setContratoGerado(data.contratoUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar contrato.')
    } finally {
      setGerando(false)
    }
  }

  function limpar() {
    if (SECOES.some(s => s.campos.some(c => form[c] !== EMPTY[c])) && !window.confirm('Limpar todos os campos da ficha?')) return
    setForm(EMPTY)
    setFichaId(null)
    window.history.replaceState(null, '', window.location.pathname)
    setContratoGerado(null)
    setError('')
    setTentou(false)
    setGuardadoAs(null)
  }

  const contagem = (campos: (keyof FormData)[]) => campos.filter(c => cheio(form[c])).length
  const obrigOk = OBRIGATORIOS.filter(o => cheio(form[o.campo])).length
  const totalCampos = SECOES.reduce((n, s) => n + s.campos.length, 0)
  const totalCheios = SECOES.reduce((n, s) => n + contagem(s.campos), 0)
  const pctObrig = Math.round((obrigOk / OBRIGATORIOS.length) * 100)
  const erroNome = tentou && !cheio(form.nome)
  const erroRef = tentou && !cheio(form.ref) && error.startsWith('Ref')
  const dateCls = inputCls + ' [color-scheme:dark]'
  const taCls = inputCls + ' resize-none leading-relaxed'
  const monoTaCls = inputCls + ' resize-none leading-relaxed font-mono text-[13px] uppercase'

  return (
    <main className="rlp min-h-screen relative text-white">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-8 pb-16">

        <Link href="/media" className="text-[12px] text-white/45 hover:text-white transition-colors">‹ RL Prod</Link>

        {/* Cabeçalho */}
        <header className="mt-8">
          <p className="rlp-m traco text-[11px] text-[#5a8bff]">RL Prod · Clientes</p>
          <h1 className="rlp-t mt-4 text-[44px] sm:text-[64px] leading-[0.98]">
            Ficha de <span className="text-[#5a8bff]">cliente.</span>
          </h1>
          <p className="mt-4 text-[15px] sm:text-[16px] text-white/60 max-w-2xl leading-relaxed">
            Dados do cliente, do projeto e do contrato num só sítio. A ref liga esta ficha ao portal do cliente.
          </p>
          {(form.nome || form.ref) && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {form.ref && <span className="rlp-m rounded border border-[#2e6cf6]/60 bg-[#2e6cf6]/[0.12] px-3 py-1.5 text-[10.5px] text-[#a9c1ff]">{form.ref}</span>}
              {form.nome && <span className="rlp-t text-[20px]">{form.nome}</span>}
              {form.empresa && <span className="text-[14px] text-white/50">· {form.empresa}</span>}
              {form.estado && <span className="rlp-m rounded border border-white/[0.14] px-3 py-1.5 text-[10px] text-white/60">{form.estado}</span>}
            </div>
          )}
        </header>

        <div className="mt-10 h-px bg-white/[0.1]" />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

          <form id="ficha" onSubmit={handleSubmit} className="flex flex-col gap-6 min-w-0">

            {/* 01 Identificação */}
            <Secao id="identificacao" num="01" titulo="Identificação" sub="Quem é o cliente e como o contactar."
              preenchidos={contagem(SECOES[0].campos)} total={SECOES[0].campos.length}>
              <Campo label="Ref do portal" obrigatorio erro={erroRef}
                dica="Referência única do projeto. Liga a ficha ao portal do cliente." className="mb-5">
                <ComCopiar valor={form.ref}>
                  <input
                    value={form.ref}
                    onChange={e => setForm(f => ({ ...f, ref: e.target.value.toUpperCase() }))}
                    placeholder="Ex: OLEOBIO"
                    className={inputCls + ' rlp-m uppercase !tracking-[0.2em] pr-24' + (erroRef ? ' !border-[#ff4747]' : '')}
                  />
                </ComCopiar>
              </Campo>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Campo label="Nome" obrigatorio erro={erroNome}>
                  <input value={form.nome} onChange={set('nome')} placeholder="Nome completo"
                    className={inputCls + (erroNome ? ' !border-[#ff4747]' : '')} />
                </Campo>
                <Campo label="Empresa / Marca">
                  <input value={form.empresa} onChange={set('empresa')} placeholder="Nome da empresa" className={inputCls} />
                </Campo>
                <Campo label="NIF / NIPC">
                  <ComCopiar valor={form.nif}>
                    <input value={form.nif} onChange={set('nif')} placeholder="123 456 789" inputMode="numeric" className={inputCls + ' pr-24'} />
                  </ComCopiar>
                </Campo>
                <Campo label="Telefone">
                  <ComCopiar valor={form.telefone}>
                    <input value={form.telefone} onChange={set('telefone')} placeholder="+351 9xx xxx xxx" type="tel" className={inputCls + ' pr-24'} />
                  </ComCopiar>
                </Campo>
                <Campo label="Email">
                  <ComCopiar valor={form.email}>
                    <input type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" className={inputCls + ' pr-24'} />
                  </ComCopiar>
                </Campo>
                <Campo label="Morada">
                  <input value={form.morada} onChange={set('morada')} placeholder="Rua, cidade" className={inputCls} />
                </Campo>
                <Campo label="Representante legal" className="sm:col-span-2">
                  <input value={form.representanteLegal} onChange={set('representanteLegal')} placeholder="Nome completo do representante legal" className={inputCls} />
                </Campo>
              </div>
            </Secao>

            {/* 02 Projeto */}
            <Secao id="projeto" num="02" titulo="Projeto" sub="O que vamos fazer, quando e por quanto."
              preenchidos={contagem(SECOES[1].campos)} total={SECOES[1].campos.length}>
              <Campo label="Tipo de serviço">
                <div className="flex flex-wrap gap-2">
                  {TIPOS.map(t => (
                    <button key={t} type="button" onClick={() => setV('tipo', form.tipo === t ? '' : t)} className={chip(form.tipo === t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </Campo>
              <Campo label="Estado" className="mt-6">
                <div className="flex flex-wrap gap-2">
                  {ESTADOS.map(t => (
                    <button key={t} type="button" onClick={() => setV('estado', t)} className={chip(form.estado === t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </Campo>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Campo label="Data de filmagem">
                  <CampoDataPT value={form.dataFilmagem} onChange={v => setV('dataFilmagem', v)} className={dateCls + ' w-full'} />
                </Campo>
                <Campo label="Data de entrega">
                  <CampoDataPT value={form.dataEntrega} onChange={v => setV('dataEntrega', v)} className={dateCls + ' w-full'} />
                </Campo>
                <Campo label="Valor do serviço (€)">
                  <div className="relative">
                    <input value={form.orcamento} onChange={set('orcamento')} placeholder="0.00" inputMode="decimal" className={inputCls + ' pr-10'} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35">€</span>
                  </div>
                </Campo>
                <Campo label="Local de assinatura">
                  <input value={form.localAssinatura} onChange={set('localAssinatura')} placeholder="Lisboa" className={inputCls} />
                </Campo>
              </div>
              <Campo label="Descrição do projeto" className="mt-5">
                <textarea value={form.descricao} onChange={set('descricao')}
                  placeholder="Descrição breve do projeto e objetivos..." rows={4} className={taCls} />
              </Campo>
            </Secao>

            {/* 03 Anexo I */}
            <Secao id="anexo" num="03" titulo="Anexo I" sub="Serviços e profissionais que entram no contrato."
              preenchidos={contagem(SECOES[2].campos)} total={SECOES[2].campos.length}>
              <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5">
                <Campo label="Serviços contratados" dica={`Um por linha · ${nLinhas(form.servicosList)} ${nLinhas(form.servicosList) === 1 ? 'serviço' : 'serviços'}`}>
                  <textarea value={form.servicosList} onChange={set('servicosList')}
                    placeholder={'2 REUNIÕES DE ARRANQUE\n1 A 2 DIAS DE FILMAGEM\nCORREÇÃO DE CORES\nDIREITOS DE MÚSICAS ILIMITADOS'}
                    rows={7} className={monoTaCls} />
                </Campo>
                <Campo label="Profissionais envolvidos" dica={`Um por linha · ${nLinhas(form.profissionaisList)} ${nLinhas(form.profissionaisList) === 1 ? 'linha' : 'linhas'}`}>
                  <textarea value={form.profissionaisList} onChange={set('profissionaisList')}
                    placeholder={'1 VIDEÓGRAFO\n1 FOTÓGRAFO\n1 ASSISTENTE'}
                    rows={7} className={monoTaCls} />
                </Campo>
              </div>
            </Secao>

            {/* 04 Contrato */}
            <Secao id="contrato" num="04" titulo="Contrato" sub="Estado, datas e ligação ao documento."
              preenchidos={contagem(SECOES[3].campos)} total={SECOES[3].campos.length}>
              <Campo label="Estado do contrato">
                <div className="flex flex-wrap gap-2">
                  {ESTADOS_CONTRATO.map(t => (
                    <button key={t} type="button" onClick={() => setV('contratoEstado', t)} className={chip(form.contratoEstado === t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </Campo>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Campo label="Referência do contrato" className="sm:col-span-2">
                  <ComCopiar valor={form.contratoRef}>
                    <input value={form.contratoRef} onChange={set('contratoRef')} placeholder="Ex: CPS-2026-001" className={inputCls + ' pr-24'} />
                  </ComCopiar>
                </Campo>
                <Campo label="Data de envio">
                  <CampoDataPT value={form.contratoDataEnvio} onChange={v => setV('contratoDataEnvio', v)} className={dateCls + ' w-full'} />
                </Campo>
                <Campo label="Data de assinatura">
                  <CampoDataPT value={form.contratoDataAssinatura} onChange={v => setV('contratoDataAssinatura', v)} className={dateCls + ' w-full'} />
                </Campo>
              </div>
              <Campo label="Link do contrato (PDF / Drive)" className="mt-5">
                <div className="flex gap-2">
                  <div className="relative flex-1 min-w-0">
                    <input value={form.contratoUrl} onChange={set('contratoUrl')} placeholder="https://..." className={inputCls + ' pr-24'} />
                    <Copiar valor={form.contratoUrl} />
                  </div>
                  {/^https?:\/\//.test(form.contratoUrl.trim()) && (
                    <a href={form.contratoUrl.trim()} target="_blank" rel="noopener noreferrer"
                      className="rlp-m shrink-0 flex items-center rounded-md border border-white/[0.14] px-4 text-[10px] text-white/70 hover:text-white hover:border-[#5a8bff]/70 transition-colors">
                      Abrir ↗
                    </a>
                  )}
                </div>
              </Campo>
              <Campo label="Notas sobre o contrato" className="mt-5">
                <textarea value={form.contratoNotas} onChange={set('contratoNotas')}
                  placeholder="Condições especiais, revisões, observações..." rows={3} className={taCls} />
              </Campo>
            </Secao>

            {/* 05 Notas */}
            <Secao id="notas" num="05" titulo="Notas internas" sub="Só a equipa vê estas notas."
              preenchidos={contagem(SECOES[4].campos)} total={SECOES[4].campos.length}>
              <textarea value={form.notas} onChange={set('notas')}
                placeholder="Notas internas, observações, contexto adicional..." rows={4} className={taCls} />
            </Secao>

            {/* Erro */}
            {error && (
              <p role="alert" className="rounded-md border border-[#ff4747]/40 bg-[#ff4747]/[0.08] px-4 py-3 text-[14.5px] text-[#ff8a8a]">{error}</p>
            )}

            {/* Contrato gerado */}
            {contratoGerado && <ContratoGerado url={contratoGerado} />}

            {/* Ações */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/[0.1]">
              <button type="button" onClick={limpar}
                className="rlp-m self-start text-[10.5px] text-white/40 hover:text-white/75 transition-colors">
                {fichaId ? 'Nova ficha' : 'Limpar'}
              </button>
              <div className="flex flex-col sm:flex-row gap-3">
                <BotaoGerar gerando={gerando} onClick={handleGerarContrato} />
                <BotaoGuardar saving={saving} saved={saved} />
              </div>
            </div>
          </form>

          {/* Lateral */}
          <aside className="lg:sticky lg:top-6 flex flex-col gap-5">
            <div className="rounded-xl border border-white/[0.1] bg-[#00141f]/70 p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Fichas guardadas</p>
                <span className="rlp-m text-[10px] text-white/40">{fichas.length}</span>
              </div>
              {fichas.length > 4 && (
                <input value={procura} onChange={e => setProcura(e.target.value)} placeholder="Procurar…"
                  className={inputCls + ' mt-3 !py-2 !text-[13.5px]'} />
              )}
              <ul className="mt-3 space-y-1.5 max-h-[260px] overflow-y-auto">
                {fichas.length === 0 && <li className="text-[13px] text-white/45">Ainda não há fichas guardadas.</li>}
                {fichas
                  .filter(f => !procura.trim() || `${f.nome ?? ''} ${f.empresa ?? ''} ${f.ref ?? ''}`.toLowerCase().includes(procura.trim().toLowerCase()))
                  .map(f => (
                    <li key={f.id}>
                      <button type="button" onClick={() => abrirFicha(f.id)}
                        className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${f.id === fichaId ? 'border-[#2e6cf6] bg-[#2e6cf6]/[0.12]' : 'border-white/[0.07] hover:border-white/25'}`}>
                        <span className="block truncate text-[13.5px] text-white/90">{f.nome || 'Sem nome'}{f.empresa ? ` · ${f.empresa}` : ''}</span>
                        <span className="block truncate text-[11px] text-white/45">{[f.ref, f.estado].filter(Boolean).join(' · ') || 'Sem ref'}</span>
                      </button>
                    </li>
                  ))}
              </ul>
              {fichaId && (
                <button type="button" onClick={limpar} className="mt-3 w-full rounded-md border border-white/20 hover:border-white/45 py-2 text-[13px] text-white/80 transition-colors">
                  + Nova ficha
                </button>
              )}
            </div>

            <div className="rounded-xl border border-white/[0.1] bg-[#00141f]/70 p-6">
              <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Obrigatórios</p>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="rlp-t text-[40px] leading-none">{obrigOk}<span className="text-white/35">/{OBRIGATORIOS.length}</span></span>
                <span className="rlp-m text-[10px] text-[#7c8893]">{pctObrig}%</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div className="h-full bg-[#2e6cf6] transition-all duration-500" style={{ width: `${pctObrig}%` }} />
              </div>
              <ul className="mt-5 space-y-3">
                {OBRIGATORIOS.map(o => {
                  const ok = cheio(form[o.campo])
                  return (
                    <li key={o.campo} className="flex items-start gap-3">
                      <span className={`mt-0.5 w-4 h-4 shrink-0 rounded-full border flex items-center justify-center ${ok ? 'border-[#2e6cf6] bg-[#2e6cf6]' : 'border-white/25'}`}>
                        {ok && <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      </span>
                      <span>
                        <span className={`block text-[14px] ${ok ? 'text-white' : 'text-white/70'}`}>{o.rotulo}</span>
                        <span className="block text-[12px] text-white/40">{o.dica}</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                <span className="rlp-m text-[10px] text-white/45">Ficha preenchida</span>
                <span className="rlp-m text-[10px] text-[#a9c1ff]">{totalCheios}/{totalCampos}</span>
              </div>
            </div>

            <nav className="hidden lg:block rounded-xl border border-white/[0.1] bg-[#00141f]/70 p-3">
              {SECOES.map(s => {
                const n = contagem(s.campos)
                return (
                  <a key={s.id} href={`#${s.id}`}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-white/[0.04] transition-colors">
                    <span className="rlp-t text-[18px] w-7 text-[#2e6cf6]">{s.num}</span>
                    <span className="flex-1 text-[14px] text-white/75">{s.titulo}</span>
                    <span className={`rlp-m text-[9.5px] ${n === s.campos.length ? 'text-[#5a8bff]' : 'text-[#7c8893]'}`}>{n}/{s.campos.length}</span>
                  </a>
                )
              })}
            </nav>

            <div className="hidden lg:flex flex-col gap-3">
              <BotaoGuardar saving={saving} saved={saved} cheio />
              <p className="rlp-m text-center text-[9.5px] text-white/40">
                {guardadoAs ? `Guardado às ${guardadoAs}` : 'Ainda não guardado'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

function BotaoGuardar({ saving, saved, cheio }: { saving: boolean; saved: boolean; cheio?: boolean }) {
  return (
    <button type="submit" form="ficha" disabled={saving}
      className={`rlp-t inline-flex items-center justify-center gap-3 rounded-md px-8 py-3.5 text-[19px] tracking-[0.06em] text-white transition-colors disabled:opacity-50 ${cheio ? 'w-full' : ''} ${saved ? 'bg-[#0c2236] border border-[#2e6cf6]' : 'bg-[#2e6cf6] hover:bg-[#3d79ff] border border-[#2e6cf6]'}`}
      style={saved ? undefined : { boxShadow: '0 10px 30px -10px rgba(46,108,246,0.7)' }}>
      {saving ? 'A guardar…' : saved ? '✓ Guardado' : 'Guardar ficha →'}
    </button>
  )
}

function BotaoGerar({ gerando, onClick }: { gerando: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={gerando}
      className="rlp-t inline-flex items-center justify-center gap-2.5 rounded-md border border-white/25 hover:border-[#5a8bff] px-6 py-3.5 text-[17px] tracking-[0.06em] text-white/85 hover:text-white transition-colors disabled:opacity-50">
      {gerando ? 'A gerar…' : (
        <>
          <svg className="w-4 h-4 text-[#5a8bff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z"/>
          </svg>
          Gerar contrato
        </>
      )}
    </button>
  )
}

function ContratoGerado({ url }: { url: string }) {
  return (
    <div className="rounded-xl border border-[#2e6cf6]/50 bg-[#2e6cf6]/[0.1] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-[#2e6cf6]">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
        </span>
        <div>
          <p className="rlp-t text-[20px] leading-tight">Contrato gerado</p>
          <p className="text-[13.5px] text-white/60">Disponível na ficha e no portal do cliente.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative w-[92px] h-[38px]"><Copiar valor={url} rotulo="Copiar link" /></div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="rlp-m rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-4 py-2.5 text-[10.5px] text-white transition-colors">
          Ver contrato →
        </a>
      </div>
    </div>
  )
}
