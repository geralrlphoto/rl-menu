'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Projeto, FichaCliente } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'

interface ContratoGerado {
  gerado: boolean
  geradoEm?: string
  ref?: string
  estado?: string
  url?: string
}

interface Props {
  projeto: Projeto
  isAdmin: boolean
  contratoGerado?: ContratoGerado | null
}

export default function ContratoClient({ projeto: initial, isAdmin, contratoGerado }: Props) {
  const [projeto, setProjeto] = useState(initial)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [contratoLocal, setContratoLocal] = useState(contratoGerado)

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contratoUrl:    projeto.contratoUrl,
          cpsFormUrl:     projeto.cpsFormUrl,
          fichaCliente:   projeto.fichaCliente,
          contaBancaria:  projeto.contaBancaria,
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
          contratoEstado:     'Por Elaborar',
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setContratoLocal({ gerado: true, url: data.contratoUrl, ref: `CPS-${new Date().getFullYear()}-${projeto.ref}`, estado: 'Por Elaborar', geradoEm: new Date().toLocaleDateString('pt-PT') })
        window.open(data.contratoUrl, '_blank')
      }
    } catch {}
    setGerando(false)
  }

  const temContratoGerado = contratoLocal?.gerado && contratoLocal?.url

  // Conta bancária com defaults
  const conta = {
    prazo:   projeto.contaBancaria?.prazo   ?? '48 horas após confirmação em reunião',
    metodo:  projeto.contaBancaria?.metodo  ?? 'Transferência Bancária',
    titular: projeto.contaBancaria?.titular ?? 'Liliana Sofia Barreto Gonçalves',
    iban:    projeto.contaBancaria?.iban    ?? 'PT50 0036 0167 9910 0068 3001 0',
    email:   projeto.contaBancaria?.email   ?? 'geral.rlmedia@gmail.com',
  }

  const fichaFields: { label: string; field: keyof FichaCliente; placeholder?: string }[] = [
    { label: 'Nome',            field: 'nome',             placeholder: 'Nome do cliente' },
    { label: 'Empresa / Marca', field: 'empresa',          placeholder: 'Nome da empresa' },
    { label: 'NIF / NIPC',      field: 'nif',              placeholder: '000 000 000' },
    { label: 'Email',           field: 'email',            placeholder: 'email@empresa.pt' },
    { label: 'Telefone',        field: 'telefone',         placeholder: '+351 900 000 000' },
    { label: 'Morada',          field: 'morada',           placeholder: 'Rua, cidade' },
    { label: 'Rep. Legal',      field: 'representanteLegal', placeholder: 'Nome do representante' },
    { label: 'Data do Evento',  field: 'dataEvento',       placeholder: '15 Jul 2025' },
    { label: 'Local do Evento', field: 'localEvento',      placeholder: 'Lisboa' },
    { label: 'Orçamento',       field: 'orcamento',        placeholder: '3000 €' },
  ]

  return (
    <>
      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-10">

        <Link href={`/portal-media/${projeto.ref}`}
          className="inline-flex items-center gap-2 text-sm tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        <div className="mb-10">
          <p className="text-sm tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · {projeto.nome}</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Contrato & CPS</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        {/* ── Texto de boas-vindas ── */}
        <div className="border border-white/[0.07] bg-white/[0.02] px-6 py-6 mb-6">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <p className="text-[15px] tracking-[0.5em] text-white/20 uppercase mb-4">Área Exclusiva</p>
          <p className="text-[15px] text-white/60 font-light leading-relaxed mb-4">
            Encontra-se na área exclusiva do seu contrato.
          </p>
          <div className="flex flex-col gap-2.5 mb-4">
            {[
              { icon: '↓', text: 'Descarregar o contrato completo em formato digital, sempre que necessitar.' },
              { icon: '€', text: 'Consultar de forma prática e transparente os valores já liquidados.' },
              { icon: '◎', text: 'Acompanhar o histórico de pagamentos associados ao seu processo.' },
            ].map(({ icon, text }) => (
              <div key={icon} className="flex items-start gap-3">
                <span className="text-[15px] text-white/25 mt-0.5 shrink-0 w-4">{icon}</span>
                <p className="text-[14px] text-white/45 font-light leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <p className="text-[15px] text-white/30 font-light leading-relaxed">
            O nosso objetivo é <span className="text-white/55">simplificar o acesso à informação essencial</span>, garantindo-lhe mais comodidade e transparência.
          </p>
          <p className="text-[15px] text-white/20 mt-3 tracking-[0.15em]">Obrigado pela confiança — RL Media</p>
        </div>

        {/* ── Método de Pagamento ── */}
        <div className="border border-white/[0.12] bg-white/[0.03] px-6 py-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <p className="text-[11px] tracking-[0.5em] text-white/20 uppercase mb-5">Método de Pagamento</p>

          {/* Prazo */}
          <div className="bg-white/[0.04] border border-white/[0.08] px-4 py-3 mb-5">
            <p className="text-[11px] tracking-[0.3em] text-white/25 uppercase mb-1">Prazo</p>
            <EditableField
              value={conta.prazo}
              isEditing={isEditing}
              onChange={v => setConta('prazo', v)}
              className="text-[14px] text-white/80 font-medium"
              placeholder="Ex: 48 horas após confirmação"
            />
          </div>

          {/* Método + Titular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[11px] tracking-[0.3em] text-white/25 uppercase mb-1">Método</p>
              <EditableField
                value={conta.metodo}
                isEditing={isEditing}
                onChange={v => setConta('metodo', v)}
                className="text-[14px] text-white/65"
                placeholder="Transferência Bancária"
              />
            </div>
            <div>
              <p className="text-[11px] tracking-[0.3em] text-white/25 uppercase mb-1">Titular</p>
              <EditableField
                value={conta.titular}
                isEditing={isEditing}
                onChange={v => setConta('titular', v)}
                className="text-[14px] text-white/65"
                placeholder="Nome do titular"
              />
            </div>
          </div>

          {/* IBAN */}
          <div className="border border-white/[0.10] bg-white/[0.02] px-4 py-4 mb-5">
            <p className="text-[11px] tracking-[0.3em] text-white/25 uppercase mb-2">IBAN</p>
            <EditableField
              value={conta.iban}
              isEditing={isEditing}
              onChange={v => setConta('iban', v)}
              className="text-[16px] text-white/80 font-mono tracking-widest"
              placeholder="PT50 0000 0000 0000 0000 0000 0"
            />
          </div>

          {/* Comprovativo */}
          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-[11px] tracking-[0.3em] text-white/25 uppercase mb-2">Após Transferência</p>
            {isEditing ? (
              <div>
                <p className="text-[12px] text-white/30 mb-1">Email para comprovativo</p>
                <EditableField
                  value={conta.email}
                  isEditing={true}
                  onChange={v => setConta('email', v)}
                  className="text-[13px] text-white/65"
                  placeholder="email@rlmedia.pt"
                />
              </div>
            ) : (
              <p className="text-[13px] text-white/45 leading-relaxed">
                Envie o comprovativo para{' '}
                <a href={`mailto:${conta.email}`} className="text-white/70 hover:text-white/90 transition-colors underline underline-offset-2">
                  {conta.email}
                </a>
                {' '}— a validação só é confirmada após receção do comprovativo.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-8">

          {/* Contrato gerado */}
          {temContratoGerado ? (
            <div className="border border-white/[0.12] bg-white/[0.03] px-6 py-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[15px] tracking-[0.5em] text-white/25 uppercase mb-1">Contrato de Prestação de Serviços</p>
                  <p className="text-[15px] tracking-[0.2em] text-white/75 font-light mb-1">{contratoLocal?.ref}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-[15px] tracking-[0.35em] uppercase px-2 py-0.5 border ${
                      contratoLocal?.estado === 'Assinado'
                        ? 'border-emerald-400/30 text-emerald-400/60'
                        : contratoLocal?.estado === 'Enviado ao Cliente'
                        ? 'border-blue-400/30 text-blue-400/60'
                        : 'border-white/10 text-white/25'
                    }`}>{contratoLocal?.estado}</span>
                    {contratoLocal?.geradoEm && (
                      <span className="text-[15px] text-white/15 tracking-[0.2em]">Gerado em {contratoLocal.geradoEm}</span>
                    )}
                  </div>
                </div>
                <a
                  href={contratoLocal!.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 border border-white/15 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/30
                             px-5 py-3 text-[14px] tracking-[0.4em] text-white/45 hover:text-white/75 uppercase
                             transition-all duration-300 flex items-center gap-2"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z"/>
                  </svg>
                  Ver Contrato
                </a>
              </div>
              {isEditing && (
                <div className="mt-4">
                  <p className="text-[12px] text-white/30 mb-1">URL externo do contrato (opcional)</p>
                  <EditableField
                    value={projeto.contratoUrl ?? ''}
                    isEditing={true}
                    onChange={v => set('contratoUrl', v)}
                    placeholder="https://drive.google.com/..."
                    className="text-sm text-white/40"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Contrato sem gerar */
            <div className={`border px-6 py-5
              ${projeto.contratoUrl ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-white/[0.07] bg-white/[0.02]'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm tracking-[0.25em] text-white/60 uppercase font-medium mb-1">
                    Contrato de Prestação de Serviços
                  </p>
                  <p className={`text-sm tracking-[0.3em] uppercase mb-3 ${projeto.contratoUrl ? 'text-emerald-400/60' : 'text-white/20'}`}>
                    {projeto.contratoUrl ? 'Assinado' : 'A aguardar geração'}
                  </p>
                  {isEditing && (
                    <div>
                      <p className="text-[12px] text-white/30 mb-1">URL do contrato (Google Drive, etc.)</p>
                      <EditableField
                        value={projeto.contratoUrl ?? ''}
                        isEditing={true}
                        onChange={v => set('contratoUrl', v)}
                        placeholder="https://..."
                        className="text-sm text-white/40"
                      />
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex flex-col gap-2 items-end">
                  {!isEditing && projeto.contratoUrl && (
                    <a href={projeto.contratoUrl} target="_blank" rel="noopener noreferrer"
                      className="text-sm tracking-[0.3em] text-white/35 hover:text-white/60 uppercase transition-colors">Ver →</a>
                  )}
                  {isAdmin && !isEditing && (
                    <button onClick={gerarContrato} disabled={gerando}
                      className="border border-white/20 hover:border-white/40 bg-white/[0.04] hover:bg-white/[0.08] px-5 py-2.5 text-[14px] tracking-[0.4em] text-white/50 hover:text-white/80 uppercase transition-all disabled:opacity-40">
                      {gerando ? 'A gerar...' : '⊕ Gerar Contrato'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Dados do Cliente ── */}
          {(isEditing || projeto.fichaCliente) && (
            <div className="border border-white/[0.07] bg-white/[0.02] px-6 py-6">
              <p className="text-[15px] tracking-[0.5em] text-white/25 uppercase mb-5">Dados do Cliente</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {fichaFields
                  .filter(({ field }) => isEditing || !!(projeto.fichaCliente as any)?.[field])
                  .map(({ label, field, placeholder }) => (
                    <div key={field} className="flex flex-col gap-0.5">
                      <p className="text-[11px] tracking-[0.35em] text-white/20 uppercase">{label}</p>
                      <EditableField
                        value={(projeto.fichaCliente as any)?.[field] ?? ''}
                        isEditing={isEditing}
                        onChange={v => setFicha(field, v)}
                        className="text-[14px] text-white/55 font-light"
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
              </div>

              {/* Serviços Incluídos */}
              {(isEditing || projeto.fichaCliente?.servicosList) && (
                <div className="mt-5 pt-4 border-t border-white/[0.06]">
                  <p className="text-[11px] tracking-[0.35em] text-white/20 uppercase mb-2">Serviços Incluídos</p>
                  {isEditing ? (
                    <EditableField
                      value={projeto.fichaCliente?.servicosList ?? ''}
                      isEditing={true}
                      onChange={v => setFicha('servicosList', v)}
                      className="text-[14px] text-white/50 font-light"
                      placeholder="Um serviço por linha..."
                      multiline
                    />
                  ) : (
                    <div className="flex flex-col gap-1">
                      {projeto.fichaCliente?.servicosList?.split('\n').filter(Boolean).map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-white/15 shrink-0" />
                          <p className="text-[14px] text-white/50 font-light">{s}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Observações */}
              {(isEditing || projeto.fichaCliente?.observacoes) && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="text-[11px] tracking-[0.35em] text-white/20 uppercase mb-2">Observações</p>
                  <EditableField
                    value={projeto.fichaCliente?.observacoes ?? ''}
                    isEditing={isEditing}
                    onChange={v => setFicha('observacoes', v)}
                    className="text-[14px] text-white/45 font-light leading-relaxed"
                    placeholder="Notas adicionais..."
                    multiline
                  />
                </div>
              )}
            </div>
          )}

          {/* CPS form */}
          <div className="border border-white/[0.07] bg-white/[0.02] px-6 py-6">
            <p className="text-sm tracking-[0.4em] text-white/25 uppercase mb-2">Dados para CPS</p>
            <p className="text-sm text-white/30 leading-relaxed mb-4">
              Para emissão do contrato precisamos dos dados fiscais da tua empresa. Preenche o formulário abaixo.
            </p>
            {isEditing && (
              <div className="mb-4">
                <p className="text-[12px] text-white/30 mb-1">URL do formulário CPS</p>
                <EditableField
                  value={projeto.cpsFormUrl ?? ''}
                  isEditing={true}
                  onChange={v => set('cpsFormUrl', v)}
                  placeholder="https://tally.so/... ou outro link"
                  className="text-sm text-white/40"
                />
              </div>
            )}
            {!isEditing && projeto.cpsFormUrl ? (
              <a href={projeto.cpsFormUrl} target="_blank" rel="noopener noreferrer"
                className="inline-block border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] px-5 py-2.5
                           text-sm tracking-[0.4em] text-white/45 hover:text-white/70 uppercase transition-all">
                Preencher Formulário →
              </a>
            ) : !isEditing ? (
              <button disabled
                className="border border-white/15 bg-white/[0.04] px-5 py-2.5
                           text-sm tracking-[0.4em] text-white/25 uppercase cursor-not-allowed">
                Preencher Formulário →
              </button>
            ) : null}
          </div>
        </div>

        <div className="border border-white/[0.05] bg-white/[0.01] px-5 py-4">
          <p className="text-sm tracking-[0.2em] text-white/20 leading-relaxed">
            Dúvidas sobre o contrato? Contacta <span className="text-white/35">rl@rlmedia.pt</span>
          </p>
        </div>
      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}
