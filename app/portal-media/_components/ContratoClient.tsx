'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Projeto, FichaCliente } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'
import EditableDateField from './EditableDateField'
import HeroUploadBlock from './HeroUploadBlock'
import ContratoFinanceiro from './ContratoFinanceiro'

/* ── Identidade rlprod.pt ── */
const CARTAO    = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/70'
const TILE      = 'rounded-xl border border-white/[0.08] bg-[#0c2236]/70'
const LABEL     = 'rlp-m text-[9.5px] text-white/45 block mb-1.5'
const BTN_AZUL  = 'rounded-full bg-[#2e6cf6] hover:bg-[#3d79ff] px-6 py-3 text-[13.5px] font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
const BTN_LINHA = 'rounded-full border border-white/25 hover:border-white/50 px-5 py-3 text-[13.5px] text-white/85 hover:text-white transition-colors'

const SERVICOS_LISTA = [
  '1 Reunião', '2 Reuniões',
  '1 Dia de Captação', '2 Dias de Captação', '3 Dias de Captação', '1 Dia Opcional',
  'Filmagem 4K', 'Drone', 'Fotografia',
  '1 Videógrafo', '2 Videógrafos', '1 Assistente', '2 Assistentes',
  'Diretor Criativo', '1 Fotógrafo', '2 Fotógrafos', '1 Editor',
  '1 Vídeo Horizontal 1 Min', '1 Vídeo Horizontal 2 Min', '1 Vídeo Horizontal 3 Min',
  '1 Vídeo Vertical 59seg', '1 Vídeo Vertical 90seg', '1 Vídeo Vertical 2min',
  'Direitos Musicais', 'Cedência de Fotografias Uso Media Social', 'Voz Off Estúdio',
]

interface ContratoGerado {
  gerado: boolean
  geradoEm?: string
  ref?: string
  estado?: string
  url?: string
  portalUrl?: string
}

interface Props {
  projeto: Projeto
  isAdmin: boolean
  contratoGerado?: ContratoGerado | null
  contratoAssinadoUrl?: string | null
}

export default function ContratoClient({ projeto: initial, isAdmin, contratoGerado, contratoAssinadoUrl = null }: Props) {
  const [projeto, setProjeto] = useState(initial)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [confirmAnular, setConfirmAnular] = useState(false)
  const [anulando, setAnulando] = useState(false)
  const [contratoLocal, setContratoLocal] = useState(contratoGerado)
  const [heroUrl, setHeroUrl] = useState(initial.contratoImageUrl ?? '')

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contratoUrl:      projeto.contratoUrl,
          reciboFaturaUrl:  projeto.reciboFaturaUrl,
          cpsFormUrl:       projeto.cpsFormUrl,
          fichaCliente:     projeto.fichaCliente,
          contaBancaria:    projeto.contaBancaria,
          contratoImageUrl: heroUrl,
        }),
      })
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => { setProjeto(initial); setIsEditing(false) }
  const set = (field: keyof Projeto, value: string) =>
    setProjeto(p => ({ ...p, [field]: value }))

  const setFicha = (field: keyof FichaCliente, value: string) =>
    setProjeto(p => ({
      ...p,
      fichaCliente: { ...(p.fichaCliente ?? {}), [field]: value },
    }))

  const setConta = (field: string, value: string) =>
    setProjeto(p => ({
      ...p,
      contaBancaria: { ...(p.contaBancaria ?? {}), [field]: value },
    }))

  async function gerarContrato() {
    setGerando(true)
    try {
      const ficha: FichaCliente = projeto.fichaCliente || {}
      const valorTotal = (projeto.pagamentos || []).reduce((s: number, p: any) => s + (p.valor || 0), 0)
      const servicosList = ficha.servicosList || (projeto.entregas || []).map((e: any) => e.titulo).join('\n')
      const res = await fetch('/api/media-portal/gerar-contrato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ref:                projeto.ref,
          nome:               ficha.nome               || projeto.nome,
          empresa:            ficha.empresa            || projeto.cliente,
          nif:                ficha.nif                || '',
          morada:             ficha.morada             || projeto.local,
          telefone:           ficha.telefone           || '',
          email:              ficha.email              || '',
          representanteLegal: ficha.representanteLegal || ficha.nome || projeto.nome,
          orcamento:          ficha.orcamento          || (valorTotal > 0 ? String(valorTotal) : ''),
          servicosList,
          localAssinatura:    ficha.localEvento        || projeto.local || 'Lisboa',
          contratoEstado:     'rascunho',
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setContratoLocal({ gerado: true, url: data.contratoUrl, ref: `CPS-${new Date().getFullYear()}-${projeto.ref}`, estado: 'rascunho', geradoEm: new Date().toLocaleDateString('pt-PT') })
        window.open(data.contratoUrl, '_blank')
      }
    } catch {}
    setGerando(false)
  }

  const confirmarContrato = async () => {
    if (!contratoLocal) return
    setConfirmando(true)
    try {
      const updated: ContratoGerado = { ...contratoLocal, estado: 'disponivel' }
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contrato: updated }),
      })
      setContratoLocal(updated)
      // Notificar cliente por email
      const emailCliente = projeto.fichaCliente?.email
      if (emailCliente) {
        fetch('/api/media-portal/notify-contrato', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: emailCliente,
            nomeProjeto: projeto.nome,
            cliente: projeto.cliente,
            contratoUrl: updated.url,
            portalUrl: updated.portalUrl ?? `/portal-media/${projeto.ref}/contrato`,
          }),
        }).catch(() => {})
      }
    } catch {}
    setConfirmando(false)
  }

  const anularContrato = async () => {
    setAnulando(true)
    try {
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contrato: { gerado: false } }),
      })
      setContratoLocal(null)
      setConfirmAnular(false)
    } catch {}
    setAnulando(false)
  }

  const temContratoGerado = !!(contratoLocal?.gerado && contratoLocal?.url)
  const estaDisponivelCliente = contratoLocal?.estado === 'disponivel' || contratoLocal?.estado === 'Assinado'
  // Admin vê sempre que gerado; cliente só vê após confirmação
  const mostrarBlocoContrato = temContratoGerado && (isAdmin || estaDisponivelCliente)

  // Conta bancária com defaults
  const conta = {
    prazo:   projeto.contaBancaria?.prazo   ?? '48 horas após confirmação em reunião',
    metodo:  projeto.contaBancaria?.metodo  ?? 'Transferência Bancária',
    titular: projeto.contaBancaria?.titular ?? 'Liliana Sofia Barreto Gonçalves',
    iban:    projeto.contaBancaria?.iban    ?? 'PT50 0036 0167 9910 0068 3001 0',
    email:   projeto.contaBancaria?.email   ?? 'geral.rlmedia@gmail.com',
  }

  const fichaFields: { label: string; field: keyof FichaCliente; placeholder?: string; isDate?: boolean }[] = [
    { label: 'Nome',            field: 'nome',             placeholder: 'Nome do cliente' },
    { label: 'Empresa / Marca', field: 'empresa',          placeholder: 'Nome da empresa' },
    { label: 'NIF / NIPC',      field: 'nif',              placeholder: '000 000 000' },
    { label: 'Email',           field: 'email',            placeholder: 'email@empresa.pt' },
    { label: 'Telefone',        field: 'telefone',         placeholder: '+351 900 000 000' },
    { label: 'Morada',          field: 'morada',           placeholder: 'Rua, cidade' },
    { label: 'Rep. Legal',      field: 'representanteLegal', placeholder: 'Nome do representante' },
    { label: 'Data do Evento',  field: 'dataEvento',       placeholder: '15 Jul 2025', isDate: true },
    { label: 'Local do Evento', field: 'localEvento',      placeholder: 'Lisboa' },
    { label: 'Orçamento',       field: 'orcamento',        placeholder: '3000 €' },
  ]

  const estadoContrato = contratoLocal?.estado
  const pillContrato =
    estadoContrato === 'Assinado'   ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white'
    : estadoContrato === 'disponivel' ? 'border-[#2e6cf6]/60 bg-[#2e6cf6]/15 text-[#a9c1ff]'
    : 'border-[#7c8893]/50 text-[#7c8893]'

  return (
    <>
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />
      <div className="rlp relative z-10 max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12 text-white">

        <Link href={`/portal-media/${projeto.ref}`}
          className="rlp-m inline-flex items-center gap-2 text-[10.5px] text-white/45 hover:text-white transition-colors mb-10 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        {/* ── Cabeçalho ── */}
        <header className="mb-8">
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">RL Prod · {projeto.nome}</p>
          <h1 className="rlp-t mt-3 text-[44px] sm:text-[60px] leading-[0.95]">Contrato & CPS</h1>
        </header>

        {/* ── Texto de boas-vindas ── */}
        <section className={`${CARTAO} p-4 sm:p-6 mb-4`}>
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Área exclusiva</p>
          <p className="mt-3 text-[16px] text-white/85 leading-relaxed">
            Encontra-se na área exclusiva do seu contrato. Aqui pode:
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { icon: '◎', text: 'Consultar o contrato aqui mesmo, sem precisar de o descarregar.' },
              { icon: '↓', text: 'Descarregar o contrato em PDF para assinar.' },
              { icon: '↑', text: 'Devolver o contrato assinado e consultar os seus dados.' },
            ].map(({ icon, text }) => (
              <div key={icon} className={`${TILE} px-4 py-3.5 flex sm:flex-col items-start gap-3 sm:gap-2`}>
                <span className="w-8 h-8 rounded-full border border-[#2e6cf6]/60 text-[#a9c1ff] flex items-center justify-center shrink-0 text-[14px]">{icon}</span>
                <p className="text-[14px] text-white/65 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[15px] text-white/55 leading-relaxed">
            O nosso objetivo é <span className="text-white/90">simplificar o acesso à informação essencial</span>, garantindo-lhe mais comodidade e transparência.
          </p>
          <p className="rlp-m mt-3 text-[9.5px] text-white/40">Obrigado pela confiança · RL PROD</p>
        </section>

        {/* ── Contrato: consultar, descarregar e devolver assinado ── */}
        <ContratoFinanceiro
          portalRef={projeto.ref}
          contrato={contratoLocal}
          contratoFinalUrl={projeto.contratoUrl}
          assinado={(projeto as any).contratoAssinado}
          assinadoUrl={contratoAssinadoUrl}
          isAdmin={isAdmin}
        />

        {/* ── Documentos: gestão do contrato (só admin) + recibo ── */}
        <div className="flex flex-col gap-4 mb-4">

          {isAdmin && <p className="rlp-m traco text-[10px] text-[#a9c1ff] -mb-1">Gestão do contrato · só visível para a RL PROD</p>}

          {/* Contrato gerado (gestão: só admin; o cliente usa a secção acima) */}
          {!isAdmin ? null : mostrarBlocoContrato ? (
            <section className={`${CARTAO} p-4 sm:p-6`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Contrato de prestação de serviços</p>
                  <p className="rlp-t mt-2 text-[22px] leading-tight text-white break-all">{contratoLocal?.ref}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2.5">
                    <span className={`rlp-m text-[8.5px] tracking-[0.2em] px-2.5 py-1 border rounded-full ${pillContrato}`}>
                      {estadoContrato === 'rascunho' ? 'Rascunho'
                        : estadoContrato === 'disponivel' ? 'Disponível'
                        : estadoContrato}
                    </span>
                    {contratoLocal?.geradoEm && (
                      <span className="text-[13px] text-white/45">Gerado em {contratoLocal.geradoEm}</span>
                    )}
                  </div>
                </div>
                <a
                  href={contratoLocal!.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${BTN_AZUL} shrink-0 inline-flex items-center justify-center gap-2`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z"/>
                  </svg>
                  Ver contrato
                </a>
              </div>

              {/* Admin: rascunho warning + confirm button */}
              {isAdmin && !estaDisponivelCliente && (
                <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-[13.5px] text-[#a9c1ff]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#7c8893]" />
                    Ainda não visível para o cliente
                  </p>
                  <button
                    onClick={confirmarContrato}
                    disabled={confirmando}
                    className={`${BTN_LINHA} shrink-0 disabled:opacity-40`}
                  >
                    {confirmando ? 'A confirmar...' : '✓ Confirmar e disponibilizar'}
                  </button>
                </div>
              )}

              {isEditing && (
                <div className="mt-4">
                  <p className={LABEL}>URL externo do contrato (opcional)</p>
                  <EditableField
                    value={projeto.contratoUrl ?? ''}
                    isEditing={true}
                    onChange={v => set('contratoUrl', v)}
                    placeholder="https://drive.google.com/..."
                    className="text-[15px] text-white/80"
                  />
                </div>
              )}

              {/* Admin: anular contrato */}
              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-end">
                  {confirmAnular ? (
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <span className="text-[14px] text-white/60">Tens a certeza?</span>
                      <button
                        onClick={anularContrato}
                        disabled={anulando}
                        className="rounded-full px-4 py-1.5 text-[13px] border border-[#ff4747]/60 text-[#ff4747]
                                   hover:bg-[#ff4747]/10 transition-colors disabled:opacity-40"
                      >
                        {anulando ? 'A anular...' : 'Anular'}
                      </button>
                      <button
                        onClick={() => setConfirmAnular(false)}
                        className="text-[13px] text-white/50 hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmAnular(true)}
                      className="rlp-m text-[9.5px] text-white/35 hover:text-[#ff4747] transition-colors"
                    >
                      Anular contrato
                    </button>
                  )}
                </div>
              )}
            </section>
          ) : (
            /* Contrato sem gerar */
            <section className={`rounded-2xl border p-4 sm:p-6 ${projeto.contratoUrl ? 'border-[#2e6cf6]/40 bg-[#00141f]/70' : 'border-white/[0.1] bg-[#00141f]/70'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Contrato</p>
                  <p className="rlp-t mt-2 text-[22px] leading-tight text-white">Contrato de Prestação de Serviços</p>
                  <span className={`rlp-m mt-2.5 inline-block text-[8.5px] tracking-[0.2em] px-2.5 py-1 border rounded-full ${
                    projeto.contratoUrl ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white'
                    : temContratoGerado ? 'border-[#5a8bff]/50 text-[#a9c1ff]'
                    : 'border-[#7c8893]/50 text-[#7c8893]'
                  }`}>
                    {projeto.contratoUrl ? 'Assinado' : temContratoGerado ? 'Em elaboração' : 'A aguardar geração'}
                  </span>
                  {isEditing && (
                    <div className="mt-4">
                      <p className={LABEL}>URL do contrato (Google Drive, etc.)</p>
                      <EditableField
                        value={projeto.contratoUrl ?? ''}
                        isEditing={true}
                        onChange={v => set('contratoUrl', v)}
                        placeholder="https://..."
                        className="text-[15px] text-white/80"
                      />
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex flex-row sm:flex-col flex-wrap gap-2 sm:items-end">
                  {!isEditing && (
                    projeto.contratoUrl ? (
                      <a href={projeto.contratoUrl} target="_blank" rel="noopener noreferrer"
                        className={`${BTN_AZUL} inline-flex items-center justify-center`}>
                        Ver mais →
                      </a>
                    ) : (
                      <span className="rlp-m rounded-full border border-white/[0.12] px-5 py-3 text-[9.5px] text-[#7c8893] cursor-not-allowed">
                        Aguardar
                      </span>
                    )
                  )}
                  {isAdmin && !isEditing && !temContratoGerado && (
                    <button onClick={gerarContrato} disabled={gerando}
                      className={`${BTN_LINHA} disabled:opacity-40`}>
                      {gerando ? 'A gerar...' : '⊕ Gerar contrato'}
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ── Recibo / Fatura ── */}
          <section className={`rounded-2xl border p-4 sm:p-6 ${
            projeto.reciboFaturaUrl ? 'border-[#2e6cf6]/40 bg-[#00141f]/70' : 'border-white/[0.1] bg-[#00141f]/70'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Faturação</p>
                <p className="rlp-t mt-2 text-[22px] leading-tight text-white">Recibo / Fatura</p>
                {isEditing ? (
                  <div className="mt-3">
                    <p className={LABEL}>URL do PDF (Google Drive, Dropbox, etc.)</p>
                    <EditableField
                      value={projeto.reciboFaturaUrl ?? ''}
                      isEditing={true}
                      onChange={v => set('reciboFaturaUrl', v)}
                      placeholder="https://drive.google.com/..."
                      className="text-[15px] text-white/80"
                    />
                  </div>
                ) : (
                  <p className={`mt-1 text-[14px] ${projeto.reciboFaturaUrl ? 'text-[#a9c1ff]' : 'text-[#7c8893]'}`}>
                    {projeto.reciboFaturaUrl ? 'Disponível para download' : 'A aguardar emissão'}
                  </p>
                )}
              </div>
              {!isEditing && (
                projeto.reciboFaturaUrl ? (
                  <a
                    href={projeto.reciboFaturaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${BTN_AZUL} shrink-0 inline-flex items-center justify-center gap-2`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 16l-4-4m4 4l4-4m-4 4V4M4 20h16" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Recibo / Fatura
                  </a>
                ) : (
                  <span className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12]
                                   px-5 py-3 text-[13.5px] text-white/35 cursor-not-allowed">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 16l-4-4m4 4l4-4m-4 4V4M4 20h16" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Recibo / Fatura
                  </span>
                )
              )}
            </div>
          </section>
        </div>

        {/* ── Método de Pagamento ── */}
        <section className={`${CARTAO} p-4 sm:p-6 mb-4`}>
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Pagamento</p>
          <h2 className="rlp-t mt-1 mb-4 text-[22px]">Método de pagamento</h2>

          {/* Prazo */}
          <div className={`${TILE} px-4 py-3 mb-2.5`}>
            <p className="rlp-m text-[9.5px] text-white/45 mb-1">Prazo</p>
            <EditableField
              value={conta.prazo}
              isEditing={isEditing}
              onChange={v => setConta('prazo', v)}
              className="text-[15px] text-white font-medium"
              placeholder="Ex: 48 horas após confirmação"
            />
          </div>

          {/* Método + Titular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
            <div className={`${TILE} px-4 py-3`}>
              <p className="rlp-m text-[9.5px] text-white/45 mb-1">Método</p>
              <EditableField
                value={conta.metodo}
                isEditing={isEditing}
                onChange={v => setConta('metodo', v)}
                className="text-[15px] text-white/85"
                placeholder="Transferência Bancária"
              />
            </div>
            <div className={`${TILE} px-4 py-3`}>
              <p className="rlp-m text-[9.5px] text-white/45 mb-1">Titular</p>
              <EditableField
                value={conta.titular}
                isEditing={isEditing}
                onChange={v => setConta('titular', v)}
                className="text-[15px] text-white/85"
                placeholder="Nome do titular"
              />
            </div>
          </div>

          {/* IBAN */}
          {isEditing ? (
            <div className={`${TILE} px-4 py-3 mb-4`}>
              <p className="rlp-m text-[9.5px] text-white/45 mb-1">IBAN</p>
              <EditableField
                value={conta.iban}
                isEditing={isEditing}
                onChange={v => setConta('iban', v)}
                className="text-[16px] text-white font-mono tracking-wide"
                placeholder="PT50 0000 0000 0000 0000 0000 0"
              />
            </div>
          ) : conta.iban ? (
            <div className="mb-4"><LinhaCopiar label="IBAN" valor={conta.iban} /></div>
          ) : null}

          {/* Comprovativo */}
          <div className="border-t border-white/[0.08] pt-4">
            <p className="rlp-m text-[9.5px] text-white/45 mb-2">Após transferência</p>
            {isEditing ? (
              <div>
                <p className="text-[14px] text-white/55 mb-1">Email para comprovativo</p>
                <EditableField
                  value={conta.email}
                  isEditing={true}
                  onChange={v => setConta('email', v)}
                  className="text-[15px] text-white/85"
                  placeholder="email@www.rlprod.pt"
                />
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-[#2e6cf6]/30 bg-[#2e6cf6]/[0.07] px-4 py-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2e6cf6]" />
                <p className="text-[15px] text-white/70 leading-relaxed">
                  Após cada pagamento, registe-o na{' '}
                  <a href={`/portal-media/${projeto.ref}/pagamentos`}
                    className="text-[#a9c1ff] hover:text-white transition-colors underline underline-offset-2">
                    página de Pagamentos
                  </a>
                  {' '}para manter o registo financeiro do projeto atualizado.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Dados do Cliente ── sempre visível para admin ── */}
        {(isAdmin || projeto.fichaCliente) && (
          <section className={`${CARTAO} p-4 sm:p-6 mb-8`}>
            <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
              <div>
                <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Ficha</p>
                <h2 className="rlp-t mt-1 text-[22px]">Dados do cliente</h2>
              </div>
              {isAdmin && !isEditing && !projeto.fichaCliente && (
                <p className="text-[13px] text-white/40 italic">Clica em Editar para preencher</p>
              )}
            </div>

            {/* ── Valor do Serviço + Método (destaque) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
              <div className={`${TILE} px-4 py-4`}>
                <p className="rlp-m text-[9.5px] text-white/45 mb-2">Valor do serviço</p>
                {isEditing ? (
                  <EditableField
                    value={projeto.fichaCliente?.orcamento ?? ''}
                    isEditing={true}
                    onChange={v => setFicha('orcamento', v)}
                    className="rlp-t text-[26px] text-white"
                    placeholder="Ex: 3 000 €"
                  />
                ) : projeto.fichaCliente?.orcamento ? (
                  <p className="rlp-t text-[28px] leading-none text-white">{projeto.fichaCliente.orcamento}</p>
                ) : (
                  <p className="text-[15px] text-white/30">—</p>
                )}
              </div>

              <div className={`${TILE} px-4 py-4`}>
                <p className="rlp-m text-[9.5px] text-white/45 mb-2">Método de pagamento</p>
                {isEditing ? (
                  <EditableField
                    value={projeto.fichaCliente?.metodoPagamento ?? ''}
                    isEditing={true}
                    onChange={v => setFicha('metodoPagamento', v)}
                    className="text-[15px] text-white/85"
                    placeholder="Ex: Transferência, 50% + 50%"
                  />
                ) : projeto.fichaCliente?.metodoPagamento ? (
                  <p className="text-[16px] text-white/85">{projeto.fichaCliente.metodoPagamento}</p>
                ) : (
                  <p className="text-[15px] text-white/30">—</p>
                )}
              </div>
            </div>

            {/* ── Serviços Contratados ── */}
            <div className={`${TILE} px-4 py-4 mb-5`}>
              <p className="rlp-m text-[9.5px] text-white/45 mb-3">Serviços contratados</p>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {SERVICOS_LISTA.map(servico => {
                    const selecionados = (projeto.fichaCliente?.servicosList ?? '').split('\n').filter(Boolean)
                    const isSelected = selecionados.includes(servico)
                    return (
                      <button
                        key={servico}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? selecionados.filter(s => s !== servico)
                            : [...selecionados, servico]
                          setFicha('servicosList', next.join('\n'))
                        }}
                        className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors border ${
                          isSelected
                            ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white'
                            : 'border-white/[0.12] bg-[#00141f]/50 text-white/55 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        {isSelected && <span className="mr-1.5">✓</span>}
                        {servico}
                      </button>
                    )
                  })}
                </div>
              ) : projeto.fichaCliente?.servicosList ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {projeto.fichaCliente.servicosList.split('\n').filter(Boolean).map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2e6cf6] shrink-0" />
                      <p className="text-[14.5px] text-white/80">{s}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[15px] text-white/30">—</p>
              )}
            </div>

            {/* ── Campos da ficha ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {fichaFields
                .filter(({ field }) => field !== 'orcamento') // já está no bloco acima
                .filter(({ field }) => isEditing || !!(projeto.fichaCliente as any)?.[field])
                .map(({ label, field, placeholder, isDate }) => (
                  <div key={field} className="flex flex-col gap-1 min-w-0 border-b border-white/[0.06] pb-3">
                    <p className="rlp-m text-[9.5px] text-white/45">{label}</p>
                    {isDate ? (
                      <EditableDateField
                        value={(projeto.fichaCliente as any)?.[field] ?? ''}
                        isEditing={isEditing}
                        onChange={v => setFicha(field, v)}
                        className="text-[15px] text-white/85 break-words"
                        placeholder={placeholder}
                      />
                    ) : (
                      <EditableField
                        value={(projeto.fichaCliente as any)?.[field] ?? ''}
                        isEditing={isEditing}
                        onChange={v => setFicha(field, v)}
                        className="text-[15px] text-white/85 break-words"
                        placeholder={placeholder}
                      />
                    )}
                  </div>
                ))}
            </div>

            {/* Observações */}
            {(isEditing || projeto.fichaCliente?.observacoes) && (
              <div className="mt-4 pt-4 border-t border-white/[0.08]">
                <p className="rlp-m text-[9.5px] text-white/45 mb-2">Observações</p>
                <EditableField
                  value={projeto.fichaCliente?.observacoes ?? ''}
                  isEditing={isEditing}
                  onChange={v => setFicha('observacoes', v)}
                  className="text-[15px] text-white/75 leading-relaxed"
                  placeholder="Notas adicionais..."
                  multiline
                />
              </div>
            )}
          </section>
        )}

      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}

/* ── Linha com botão de copiar (IBAN) ── */
function LinhaCopiar({ label, valor }: { label: string; valor: string }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try {
      // O IBAN copia-se sem espaços para colar direto no homebanking
      await navigator.clipboard.writeText(label === 'IBAN' ? valor.replace(/\s+/g, '') : valor.trim())
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {}
  }
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0c2236]/70 px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="rlp-m text-[9.5px] text-white/45">{label}</p>
        <p className="mt-1 text-[15px] sm:text-[18px] text-white break-all font-mono tracking-wide">{valor}</p>
      </div>
      <button type="button" onClick={copiar}
        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
          copiado ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white' : 'border-white/20 text-white/75 hover:border-[#2e6cf6] hover:text-white'
        }`}>
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}
