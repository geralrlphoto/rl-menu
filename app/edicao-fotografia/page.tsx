'use client'

// Produção → Departamento de Fotografia.
// Quadro dos casamentos por fase (sneak peek, galeria online, fotos p/ seleção,
// seleção dos noivos, edição, entregue), com os envios aos noivos feitos daqui.
// Fases e prazos: lib/fotografiaFluxo.ts. Dados: /api/edicao-fotografia.
// Envios: /api/edicao-fotografia/enviar (email + portal, as mesmas chaves da ficha).
// Editor de fotos: PATCH /api/evento-equipa (cria o trabalho e avisa o editor).

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { mensagemSneakPeek, type EtapaFoto } from '@/lib/fotografiaFluxo'
import { whatsappLink } from '@/lib/crm'
import { JanelaWhatsApp, comNotaAutomatica } from '@/app/components/WhatsAppMembro'

const OURO = '#C9A84C'
const FASES: { k: EtapaFoto; titulo: string; cor: string }[] = [
  { k: 'sneakpeek', titulo: 'Sneak peek', cor: '#f9a8d4' },
  { k: 'galerias', titulo: 'Galeria online', cor: '#fb923c' },
  { k: 'selecao', titulo: 'Fotos p/ seleção', cor: '#fbbf24' },
  { k: 'escolha', titulo: 'Seleção dos noivos', cor: '#93c5fd' },
  { k: 'edicao', titulo: 'Edição', cor: '#c4b5fd' },
  { k: 'entregue', titulo: 'Entregue', cor: '#4ade80' },
]
const COR = Object.fromEntries(FASES.map(f => [f.k, f.cor])) as Record<EtapaFoto, string>

// Cada fase e quem faz o quê (o que os noivos recebem)
const FASES_INFO: { k: EtapaFoto; quem: string; quando: string; noivos: string }[] = [
  { k: 'sneakpeek', quem: 'RL', quando: 'Até 48 horas depois do casamento. Quem não tem o serviço passa à galeria com Sem serviço.', noivos: 'recebem o link por WhatsApp ou email e o cartão Sneak Peek abre no portal.' },
  { k: 'galerias', quem: 'RL', quando: 'Até 7 dias depois do casamento.', noivos: 'recebem o email da Galeria Online; o cartão fica Disponível no portal.' },
  { k: 'selecao', quem: 'RL', quando: 'Até 30 dias depois do casamento.', noivos: 'recebem a galeria para escolherem as fotos do álbum.' },
  { k: 'escolha', quem: 'Noivos', quando: 'Enviam a seleção pelo formulário (chega sozinha). Lembrar ao fim de 30 dias.', noivos: 'escolhem as preferidas no portal.' },
  { k: 'edicao', quem: 'Editor', quando: 'A RL nomeia o editor; 30 dias depois de chegar a seleção.', noivos: 'veem a seleção recebida e em edição.' },
  { k: 'entregue', quem: 'RL', quando: 'A RL envia as fotos editadas.', noivos: 'recebem o email das Fotos Finais; 30 dias para descarregar.' },
]

type Membro = { id: string; nome: string; foto_url: string | null; status: string; contato: string | null }
type Projeto = {
  id: number; fichaId: string; referencia: string; cliente: string | null; data: string; local: string | null
  fase: EtapaFoto; prazo: string | null; diasPrazo: number | null; alertaOff: boolean
  recebida: string | null; editores: string[]; editorIds: (string | null)[]; fotografos: string[]
  links: Partial<Record<EtapaFoto, string | null>>; enviadas: Partial<Record<EtapaFoto, string | null>>
  portalId: string | null
  contacto: { noiva: string | null; noivo: string | null; tel: string | null } | null
  selecaoFotos: { categoria: string; fotos: number }[] | null
  editorAlbum: string | null
  selecao: { id: string; referencia: string | null; nome: string | null; entrada: string | null; categorias: { campo: string; titulo: string; texto: string }[]; detalhes: string | null } | null
  trabalhos: { freelancerId: string; estado: string | null; em: string | null }[]
  historico: { etapa: string; origem: string | null; em: string }[]
}

const fmt = (iso: string) => new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
const primeiro = (n: string) => n.trim().split(/\s+/)[0]
const diasEntre = (a: string, b: string) => Math.round((new Date(b.slice(0, 10) + 'T12:00:00Z').getTime() - new Date(a.slice(0, 10) + 'T12:00:00Z').getTime()) / 86400000)

// Lembrete da seleção por WhatsApp: nomes e dia do casamento, sem referência nem emojis
const PORTAL_LOGIN = 'https://portal.rlphotovideo.pt/login-noivos'
function mensagemLembrete(p: Projeto): string {
  const bonito = (n: string) => { const w = primeiro(n); return w.charAt(0).toLocaleUpperCase('pt-PT') + w.slice(1).toLocaleLowerCase('pt-PT') }
  const n1 = p.contacto?.noiva ? bonito(p.contacto.noiva) : null
  const n2 = p.contacto?.noivo ? bonito(p.contacto.noivo) : null
  const nomes = n1 && n2 ? `${n1} e ${n2}` : n1 || n2 || (p.cliente ?? '').trim() || ''
  const dia = new Date(p.data.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', timeZone: 'UTC' })
  const galeria = p.links.selecao ? `\n\nA galeria para escolherem está aqui: ${p.links.selecao}` : ''
  return `Olá ${nomes}! Esperamos que estejam bem.\n\nJá tiveram oportunidade de ver as fotografias do vosso casamento de ${dia}? Para avançarmos com a edição, só falta escolherem as vossas preferidas e enviarem-nos a seleção no portal, na página Fotografias.${galeria}\n\nPortal: ${PORTAL_LOGIN}\n\nQualquer dúvida, estamos por aqui. Um abraço,\nRL Photo.Video`
}
/** Sneak peek por WhatsApp: abre a conversa da noiva (número da ficha) com o link e marca como enviado. */
async function sneakPeekWhatsApp(p: Projeto, url: string, depois: () => void) {
  if (!/^https?:\/\//i.test(url)) { alert('Cola o link do sneak peek (https://…).'); return }
  const janela = window.open('', '_blank')
  let tel = p.contacto?.tel ?? null, noiva = p.contacto?.noiva ?? null, noivo = p.contacto?.noivo ?? null
  try {
    const ev = await fetch(`/api/eventos-notion/${p.fichaId}`).then(r => r.ok ? r.json() : null)
    const e = ev?.event ?? ev?.evento ?? ev
    tel = e?.tel_noiva || e?.tel_noivo || tel
    noiva = e?.nome_noiva || noiva
    noivo = e?.nome_noivo || noivo
  } catch { /* fica o do contrato */ }
  const bonito = (n: string) => { const w = primeiro(n); return w.charAt(0).toLocaleUpperCase('pt-PT') + w.slice(1).toLocaleLowerCase('pt-PT') }
  const nomes = noiva && noivo ? `${bonito(noiva)} e ${bonito(noivo)}` : (p.cliente ?? '').trim()
  const link = whatsappLink(tel, mensagemSneakPeek(nomes, url))
  if (!link) { janela?.close(); alert('A noiva não tem telemóvel na ficha do evento. Preenche-o em Dados do Casal.'); return }
  if (janela) janela.location.href = link; else window.open(link, '_blank')
  await fetch('/api/edicao-fotografia/enviar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: p.referencia, etapa: 'sneakpeek-whatsapp', url }) }).catch(() => {})
  depois()
}

/** Abre o WhatsApp já com o número da noiva: o mesmo da ficha do evento (Notion, depois contrato). */
async function lembrarPorWhatsApp(p: Projeto) {
  const janela = window.open('', '_blank')   // abre já, para o browser não bloquear
  let tel = p.contacto?.tel ?? null, noiva = p.contacto?.noiva ?? null, noivo = p.contacto?.noivo ?? null
  try {
    const ev = await fetch(`/api/eventos-notion/${p.fichaId}`).then(r => r.ok ? r.json() : null)
    const e = ev?.event ?? ev?.evento ?? ev
    tel = e?.tel_noiva || e?.tel_noivo || tel
    noiva = e?.nome_noiva || noiva
    noivo = e?.nome_noivo || noivo
  } catch { /* fica o do contrato */ }
  const texto = mensagemLembrete({ ...p, contacto: { tel, noiva, noivo } })
  const link = whatsappLink(tel, texto)
  if (!link) {
    janela?.close()
    alert('A noiva não tem telemóvel na ficha do evento. Preenche-o em Dados do Casal.')
    return
  }
  if (janela) janela.location.href = link; else window.open(link, '_blank')
  fetch('/api/edicao-fotografia/enviar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: p.referencia, etapa: 'lembrete' }) }).catch(() => {})
}

// Aviso de atraso ao membro responsável: nomes e dia do casamento, sem referência nem emojis
const O_QUE: Partial<Record<EtapaFoto, string>> = {
  sneakpeek: 'o sneak peek', galerias: 'a galeria online', selecao: 'as fotos para seleção', edicao: 'as fotos editadas',
}
function mensagemAtraso(p: Projeto, membro: string | null): string {
  const dia = (iso: string) => new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', timeZone: 'UTC' })
  const nome = membro ? primeiro(membro).charAt(0).toLocaleUpperCase('pt-PT') + primeiro(membro).slice(1).toLocaleLowerCase('pt-PT') : ''
  const atraso = -(p.diasPrazo ?? 0)
  return `Olá${nome ? ` ${nome}` : ''}! Tudo bem?\n\nO casamento ${(p.cliente ?? '').trim() ? `de ${(p.cliente ?? '').trim()} ` : ''}(${dia(p.data)}) está atrasado ${atraso} ${atraso === 1 ? 'dia' : 'dias'}: ${O_QUE[p.fase] ?? 'a entrega'} ${p.fase === 'selecao' || p.fase === 'edicao' ? 'tinham' : 'tinha'} prazo até ${p.prazo ? dia(p.prazo) : ''}.\n\nConsegues dar-me uma previsão de entrega? Obrigado!\nRui`
}

function linhaDoTempo(p: Projeto) {
  const ev: { em: string; titulo: string; quem?: string | null }[] = [{ em: p.data, titulo: 'Casamento' }]
  for (const h of p.historico) ev.push({ em: h.em, titulo: h.etapa, quem: h.origem })
  // envios feitos antes de haver histórico (ficha do evento)
  const nomes: [EtapaFoto, string][] = [['sneakpeek', 'Sneak peek enviado'], ['galerias', 'Galeria online enviada'], ['selecao', 'Fotos p/ seleção enviadas'], ['entregue', 'Fotos editadas entregues']]
  for (const [k, t] of nomes) {
    const d = p.enviadas[k]
    if (d && !p.historico.some(h => h.etapa === t)) ev.push({ em: String(d), titulo: t })
  }
  if (p.recebida && !p.historico.some(h => h.etapa === 'Seleção recebida')) ev.push({ em: p.recebida, titulo: 'Seleção recebida' })
  return ev.sort((a, b) => a.em.localeCompare(b.em))
}

/* Seleção dos noivos completa: listas dos códigos por categoria, copiar e corrigir.
   (Substitui a antiga página Fotos Seleção.) Grava em /api/fotos-selecao/[id]. */
function SelecaoCaixa({ p, onFechar, onGuardado }: { p: Projeto; onFechar: () => void; onGuardado: () => void }) {
  const sel = p.selecao!
  const [editar, setEditar] = useState(false)
  const [textos, setTextos] = useState<Record<string, string>>(() => Object.fromEntries([...sel.categorias.map(c => [c.campo, c.texto]), ['detalhes', sel.detalhes ?? '']]))
  const [copiado, setCopiado] = useState<string | null>(null)
  const [aGuardar, setAGuardar] = useState(false)
  const conta = (t: string) => t.split(/[\s,;]+/).filter(x => /\d/.test(x)).length
  const total = sel.categorias.reduce((s, c) => s + conta(textos[c.campo] ?? ''), 0)
  const copiar = async (k: string, t: string) => { try { await navigator.clipboard.writeText(t); setCopiado(k); setTimeout(() => setCopiado(null), 2000) } catch {} }
  const guardar = async (extra: Record<string, string> = {}) => {
    setAGuardar(true)
    const r = await fetch(`/api/fotos-selecao/${sel.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...textos, ...extra }),
    }).catch(() => null)
    setAGuardar(false)
    if (!r?.ok) { alert('Não foi possível guardar a seleção.'); return }
    onGuardado()
  }
  const refErrada = (sel.referencia ?? '').trim().toUpperCase() !== p.referencia.toUpperCase()
  return (
    <div role="dialog" aria-modal="true" aria-label={`Seleção de ${p.cliente ?? p.referencia}`} onClick={onFechar}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-[22px] border border-[#C9A84C]/35 bg-[#0e0e0e] p-6 shadow-[0_0_60px_-20px_rgba(201,168,76,0.6)]"
        style={{ borderLeft: `2px solid ${OURO}` }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Seleção dos noivos</p>
            <h3 className="mt-1 text-2xl font-semibold">{p.cliente || sel.nome || p.referencia}</h3>
            <p className="text-sm text-white/45">Casamento a {fmt(p.data)}{sel.entrada ? ` · seleção recebida a ${fmt(sel.entrada)}` : ''}</p>
          </div>
          <div className="text-right">
            <p className="text-[40px] font-thin leading-none tabular-nums" style={{ color: OURO }}>{total}</p>
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">fotos para edição</p>
          </div>
        </div>
        {refErrada && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/30 bg-amber-300/[0.06] px-3 py-2 text-[12px] text-amber-200/90">
            <span>A seleção chegou com a referência “{sel.referencia || 'vazia'}”. Ligámo-la a este casamento pela data e pelos nomes.</span>
            <button type="button" disabled={aGuardar} onClick={() => guardar({ referencia: p.referencia })}
              className="rounded-full border border-amber-300/40 px-3 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase hover:bg-amber-300/10">Corrigir para {p.referencia}</button>
          </div>
        )}
        <div className="mt-5 flex flex-col gap-3">
          {sel.categorias.filter(c => editar || conta(textos[c.campo] ?? '') > 0).map(c => (
            <div key={c.campo} className="rounded-[14px] border border-white/[0.08] bg-[#141414] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-semibold text-white/85">{c.titulo} <span className="font-normal text-white/40">· {conta(textos[c.campo] ?? '')} fotos</span></p>
                {!editar && (
                  <button type="button" onClick={() => copiar(c.campo, textos[c.campo] ?? '')}
                    className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/45 hover:text-white">{copiado === c.campo ? 'Copiado ✓' : 'Copiar'}</button>
                )}
              </div>
              {editar
                ? <textarea rows={3} value={textos[c.campo] ?? ''} onChange={e => setTextos(t => ({ ...t, [c.campo]: e.target.value }))}
                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 text-[12px] text-white font-mono outline-none focus:border-[#C9A84C]/60" />
                : <p className="mt-1.5 text-[12px] text-white/55 font-mono leading-relaxed break-words">{textos[c.campo]}</p>}
            </div>
          ))}
          {(editar || textos.detalhes) && (
            <div className="rounded-[14px] border border-white/[0.08] bg-[#141414] p-3">
              <p className="text-[12px] font-semibold text-white/85">Detalhes e observações</p>
              {editar
                ? <textarea rows={3} value={textos.detalhes ?? ''} onChange={e => setTextos(t => ({ ...t, detalhes: e.target.value }))}
                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 text-[12px] text-white outline-none focus:border-[#C9A84C]/60" />
                : <p className="mt-1.5 text-[12px] text-white/55 whitespace-pre-wrap break-words">{textos.detalhes}</p>}
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {editar ? (
            <>
              <button type="button" onClick={() => setEditar(false)} className="rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/55 hover:text-white">Cancelar</button>
              <button type="button" disabled={aGuardar} onClick={() => guardar()} className="rounded-full border border-[#4ade80]/50 bg-[#4ade80]/10 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-[#4ade80] hover:bg-[#4ade80]/20 disabled:opacity-40">{aGuardar ? 'A guardar…' : 'Guardar'}</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => copiar('tudo', sel.categorias.filter(c => textos[c.campo]).map(c => `${c.titulo}: ${textos[c.campo]}`).join('\n\n'))}
                className="rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/60 hover:text-white">{copiado === 'tudo' ? 'Copiado ✓' : 'Copiar tudo'}</button>
              <button type="button" onClick={() => setEditar(true)} className="rounded-full border border-[#C9A84C]/50 bg-[#C9A84C]/10 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white hover:bg-[#C9A84C]/25">Editar</button>
              <button type="button" onClick={onFechar} className="rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/55 hover:text-white">Fechar</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DepartamentoFotografiaPage() {
  const [dados, setDados] = useState<{ equipa: Membro[]; projetos: Projeto[]; retirados: { referencia: string; cliente: string | null; data: string }[] } | null>(null)
  const [erro, setErro] = useState(false)
  const [aGravar, setAGravar] = useState<number | null>(null)
  const [links, setLinks] = useState<Record<string, string>>({})
  const [aVer, setAVer] = useState<Membro | null>(null)
  const [selAberta, setSelAberta] = useState<Projeto | null>(null)
  const [avisoSem, setAvisoSem] = useState<Projeto | null>(null)
  const [filtro, setFiltro] = useState<EtapaFoto | 'todos'>('todos')

  const carregar = () => {
    fetch('/api/edicao-fotografia').then(r => r.json())
      .then(d => { if (d.ok) setDados({ equipa: d.equipa, projetos: d.projetos, retirados: d.retirados ?? [] }); else setErro(true) })
      .catch(() => setErro(true))
  }
  useEffect(carregar, [])

  const acao = async (p: Projeto, etapa: string, confirmar: string, url?: string) => {
    if (!['recebida', 'retirar', 'repor', 'sem-sneakpeek'].includes(etapa) && !/^https?:\/\//i.test(url ?? '')) { alert('Cola o link da galeria (https://…).'); return }
    if (!window.confirm(confirmar)) return
    setAGravar(p.id)
    const r = await fetch('/api/edicao-fotografia/enviar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia: p.referencia, etapa, url }),
    }).catch(() => null)
    const d = r ? await r.json().catch(() => ({})) : {}
    setAGravar(null)
    if (!r?.ok) { alert((d as any).error || 'Não foi possível guardar.'); return }
    carregar()
  }

  const atribuir = async (p: Projeto, nome: string) => {
    if (!nome) return
    setAGravar(p.id)
    await fetch('/api/evento-equipa', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia: p.referencia, data_casamento: p.data, local: p.local, editor_fotos: [nome] }),
    }).catch(() => {})
    // Com a seleção já recebida, o editor recebe também o email "Nova edição de fotos"
    const fl = dados?.equipa.find(m => m.nome === nome)
    if (p.fase === 'edicao' && fl) {
      await fetch('/api/send-edicao-fotos-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancer_id: fl.id, nome_noivos: p.cliente ?? null, referencia: p.referencia }),
      }).catch(() => {})
    }
    setAGravar(null)
    carregar()
  }

  // Editor do álbum (o que fazia a página Fotos Seleção): álbum na página Álbuns,
  // trabalho no portal do editor e email
  const nomearAlbum = async (p: Projeto, nome: string) => {
    if (!nome || nome === p.editorAlbum) return
    if (!window.confirm(p.editorAlbum
      ? `Trocar o editor do álbum de ${p.cliente || p.referencia} de ${p.editorAlbum} para ${nome}?`
      : `Nomear ${nome} para o álbum de ${p.cliente || p.referencia}? Recebe o trabalho no portal e o email.`)) return
    setAGravar(p.id)
    const r = await fetch('/api/edicao-fotografia/album', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia: p.referencia, editor: nome }),
    }).catch(() => null)
    const d = r ? await r.json().catch(() => ({})) : {}
    setAGravar(null)
    if (!r?.ok) alert((d as any).error || 'Não foi possível guardar.')
    carregar()
  }

  const projetos = dados?.projetos ?? []
  const porFase = useMemo(() => {
    const m = new Map<EtapaFoto, Projeto[]>(FASES.map(f => [f.k, []]))
    for (const p of projetos) m.get(p.fase)?.push(p)
    for (const [f, l] of m) l.sort((a, b) => f === 'entregue'
      ? String(b.enviadas.entregue ?? '').localeCompare(String(a.enviadas.entregue ?? ''))
      : (a.diasPrazo ?? 9999) - (b.diasPrazo ?? 9999))
    return m
  }, [projetos])
  // Atraso da RL (a espera pela seleção dos noivos não conta)
  const atrasado = (p: Projeto) => p.fase !== 'entregue' && p.fase !== 'escolha' && !p.alertaOff && p.diasPrazo !== null && p.diasPrazo < 0
  const kpis = [
    ...FASES.filter(f => f.k !== 'entregue').map(f => ({ label: f.titulo, valor: porFase.get(f.k)!.length, cor: f.cor })),
    { label: 'Atrasados', valor: projetos.filter(atrasado).length, cor: '#f87171' },
  ]

  const cargas = (dados?.equipa ?? []).map(e => {
    const meus = projetos.filter(p => p.fase === 'edicao' && p.editorIds.includes(e.id))
    const nomeados = projetos.filter(p => p.fase !== 'edicao' && p.fase !== 'entregue' && p.editorIds.includes(e.id)).length
    return { e, ativos: meus.length, nomeados, atrasados: meus.filter(atrasado).length }
  }).sort((a, b) => a.ativos - b.ativos || a.e.nome.localeCompare(b.e.nome))
  const comTrabalho = cargas.filter(c => c.ativos > 0 || c.nomeados > 0)
  const albumAtual = (p: Projeto) => cargas.find(c => p.editorAlbum && c.e.nome.trim().toLowerCase() === p.editorAlbum.trim().toLowerCase())?.e.nome ?? p.editorAlbum ?? ''
  // Responsável pelo atraso: o editor de fotos nomeado; senão, o fotógrafo do casamento
  const responsavel = (p: Projeto): Membro | null => {
    const porId = (dados?.equipa ?? []).find(m => p.editorIds[0] && m.id === p.editorIds[0])
    if (porId) return porId
    const n = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    return (dados?.equipa ?? []).find(m => p.fotografos.some(f => n(f) === n(m.nome))) ?? null
  }
  const avisarMembro = (p: Projeto) => {
    const m = responsavel(p)
    const link = m ? whatsappLink(m.contato, comNotaAutomatica(mensagemAtraso(p, m.nome))) : null
    if (!link) { setAvisoSem(p); return }   // sem responsável ou sem telemóvel: escolher na janela
    window.open(link, '_blank')
    fetch('/api/edicao-fotografia/enviar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: p.referencia, etapa: 'aviso', url: m!.nome }) }).catch(() => {})
  }
  // Nome do editor como está na equipa (no evento pode vir em maiúsculas)
  const editorAtual = (p: Projeto) => cargas.find(c => p.editorIds[0] && c.e.id === p.editorIds[0])?.e.nome ?? p.editores[0] ?? ''

  return (
    <main className="min-h-screen bg-[#070707] text-white font-cond overflow-x-clip">
      {/* ── Topo ── */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 70% at 85% 10%, rgba(201,168,76,0.12), transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-60"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '26px 26px', maskImage: 'radial-gradient(ellipse 70% 80% at 70% 20%, #000 20%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 70% 20%, #000 20%, transparent 75%)' }} />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-24 pb-12">
          <p className="text-[13px] font-bold tracking-[0.5em] uppercase" style={{ color: OURO }}>Produção · Departamento</p>
          <h1 className="mt-3 font-bold uppercase leading-[0.9] text-[52px] sm:text-[88px] lg:text-[110px]">Fotografia</h1>
          <div className="mt-5 flex items-center gap-4">
            <span className="w-12 h-px" style={{ background: OURO }} />
            <span className="text-sm tracking-[0.22em] uppercase text-white/60">Do sneak peek às fotos editadas, tudo enviado daqui</span>
          </div>

          <p className="mt-12 text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Ponto de situação</p>
          <h2 className="mt-1 text-3xl sm:text-[34px] font-semibold">Fotografias em curso</h2>
          <p className="mt-2 text-sm text-white/45">Quantos casamentos estão em cada fase e quantos já passaram o prazo da fase em que estão.</p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map(k => (
              <div key={k.label} className="rounded-[18px] border border-white/[0.08] bg-[#111111]/85 backdrop-blur-md px-4 py-3.5" style={{ borderLeft: `2px solid ${k.cor}` }}>
                <p className="text-[10px] tracking-[0.25em] uppercase text-white/45">{k.label}</p>
                <p className="mt-1 text-[34px] font-thin leading-none tabular-nums" style={{ color: k.valor ? k.cor : 'rgba(255,255,255,.35)' }}>{dados ? k.valor : '–'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 flex flex-col gap-16">
        {erro && <p className="text-red-400 text-sm">Não foi possível carregar os dados. Atualiza a página.</p>}

        {/* ── Fases: quem faz o quê ── */}
        <section>
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Portal dos noivos</p>
          <h2 className="mt-1 text-3xl sm:text-[34px] font-semibold">As fases: quem faz o quê</h2>
          <p className="mt-2 text-sm text-white/45">Cada envio sai deste quadro: email aos noivos e o cartão fica Disponível no portal. A ficha do evento usa os mesmos dados, por isso fica sempre igual.</p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FASES_INFO.map((e, i) => {
              const f = FASES.find(x => x.k === e.k)!
              return (
                <li key={e.k} className="rounded-[22px] border border-white/[0.08] bg-[#111111]/85 backdrop-blur-md p-5" style={{ borderLeft: `2px solid ${f.cor}` }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-thin tabular-nums text-white/40">{String(i + 1).padStart(2, '0')}</span>
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: f.cor, background: `${f.cor}1f`, border: `1px solid ${f.cor}55` }}>{e.quem}</span>
                  </div>
                  <p className="mt-3 text-[22px] font-semibold leading-tight">{f.titulo}</p>
                  <p className="mt-2 text-[13px] text-white/70 leading-snug"><span className="text-white/40">Quando: </span>{e.quando}</p>
                  <p className="mt-3 pt-3 border-t border-white/[0.06] text-[12.5px] italic leading-snug" style={{ color: '#d8be93' }}>Noivos: {e.noivos}</p>
                </li>
              )
            })}
          </ol>
        </section>

        {/* ── Equipa de edição de fotos ── */}
        <section>
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Equipa</p>
          <h2 className="mt-1 text-3xl sm:text-[34px] font-semibold">Quem está a editar</h2>
          <p className="mt-2 text-sm text-white/45">Editores de fotos com casamentos em edição. Ao nomear, o editor recebe o trabalho e o aviso no portal dele.</p>
          {dados && !comTrabalho.length && <p className="mt-6 text-sm text-white/35">Ninguém tem casamentos em edição neste momento.</p>}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comTrabalho.map(({ e, ativos, nomeados, atrasados }) => (
              <div key={e.id}
                className="rounded-[22px] border border-white/[0.08] bg-[#111111]/90 p-5 flex items-center gap-4 transition-all duration-300 hover:border-[#C9A84C]/45"
                style={{ borderLeft: `2px solid ${OURO}` }}>
                <div className="w-14 h-14 rounded-full overflow-hidden flex-none border border-[#C9A84C]/40 bg-[#C9A84C]/10 flex items-center justify-center text-lg" style={{ color: OURO }}>
                  {e.foto_url ? <img src={e.foto_url} alt="" className="w-full h-full object-cover" /> : primeiro(e.nome).charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold truncate">{e.nome}</p>
                  <p className="text-xs text-white/45 mt-0.5">{e.status === 'ASSISTENTE' ? 'Assistente' : 'Fotógrafo'}</p>
                  <button type="button" onClick={() => setAVer(e)}
                    className="mt-2 rounded-full border border-[#C9A84C]/50 bg-[#C9A84C]/10 px-3.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase text-white hover:bg-[#C9A84C]/25">Ver</button>
                </div>
                <div className="text-right flex-none">
                  <p className="text-[34px] font-thin leading-none tabular-nums" style={{ color: OURO }}>{ativos}</p>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">em edição</p>
                  {atrasados > 0 && <p className="text-[10px] tracking-[0.15em] uppercase text-red-400 mt-1">{atrasados} atrasado{atrasados > 1 ? 's' : ''}</p>}
                  {nomeados > 0 && <p className="text-[10px] tracking-[0.15em] uppercase text-white/40 mt-1">+{nomeados} a seguir</p>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Quadro por fases ── */}
        <section>
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Quadro de trabalho</p>
          <h2 className="mt-1 text-3xl sm:text-[34px] font-semibold">Casamentos por fase</h2>
          <p className="mt-2 text-sm text-white/45">Casamentos com fotografia desde 1 de janeiro de 2026. Cola o link da galeria e envia: os noivos recebem o email e o cartão abre no portal. Todos os casamentos começam no sneak peek: quem não o tem passa à galeria com Sem serviço.</p>
          {/* Filtros: uma fase de cada vez, ou todas */}
          <div className="mt-6 flex flex-wrap gap-2">
            {([{ k: 'todos' as const, titulo: 'Todos', cor: OURO }, ...FASES]).map(f => {
              const n = f.k === 'todos' ? projetos.length : (porFase.get(f.k)?.length ?? 0)
              const ativo = filtro === f.k
              return (
                <button key={f.k} type="button" onClick={() => setFiltro(f.k)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-semibold tracking-[0.15em] uppercase transition-all ${ativo ? 'text-white' : 'text-white/55 hover:text-white border-white/10 bg-white/[0.02]'}`}
                  style={ativo ? { borderColor: f.cor, background: `${f.cor}22`, boxShadow: `0 0 18px -8px ${f.cor}` } : undefined}>
                  <i className="w-2 h-2 rounded-full" style={{ background: f.cor }} />{f.titulo}
                  <span className="rounded-full bg-white/[0.06] px-2 py-px text-[11px] tabular-nums">{dados ? n : '–'}</span>
                </button>
              )
            })}
          </div>
          <div className={filtro === 'todos' ? 'mt-6 flex gap-4 overflow-x-auto pb-4 snap-x' : 'mt-6'}>
            {FASES.filter(f => filtro === 'todos' || f.k === filtro).map(f => {
              const lista = porFase.get(f.k) ?? []
              return (
                <div key={f.k} className={filtro === 'todos' ? 'snap-start flex-none w-[290px] flex flex-col gap-3' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-start'}>
                  <div className="flex items-center justify-between px-1 col-span-full">
                    <span className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.2em] uppercase text-white/75">
                      <i className="w-2 h-2 rounded-full" style={{ background: f.cor, boxShadow: `0 0 8px ${f.cor}` }} />{f.titulo}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[12px] font-semibold text-white/70">{lista.length}</span>
                  </div>
                  {!dados && <div className="h-28 rounded-[18px] bg-white/[0.03] animate-pulse" />}
                  {dados && !lista.length && <p className="text-xs text-white/25 px-1">Nada aqui.</p>}
                  {lista.map(p => {
                    const chave = `${p.id}:${p.fase}`
                    const link = links[chave] ?? p.links[p.fase] ?? ''
                    const nomes = p.cliente || p.referencia
                    return (
                      <div key={p.id} className="rounded-[18px] border border-white/[0.08] bg-[#111111]/90 p-4 flex flex-col gap-3" style={{ borderLeft: `2px solid ${COR[p.fase]}` }}>
                        <div>
                          <p className="font-semibold leading-snug">{nomes}</p>
                          <p className="text-[11px] text-white/40 mt-0.5">{fmt(p.data)}{p.local ? ` · ${p.local}` : ''}</p>
                        </div>
                        {p.fase !== 'entregue' && p.prazo && p.diasPrazo !== null && (
                          <p className={`text-[12px] font-semibold tracking-[0.08em] ${p.alertaOff ? 'text-white/35' : p.diasPrazo < 0 ? 'text-red-400' : p.diasPrazo <= 2 ? 'text-amber-300' : 'text-white/55'}`}>
                            {p.fase === 'escolha'
                              ? (p.diasPrazo < 0 ? `Lembrar os noivos (há ${-p.diasPrazo} ${p.diasPrazo === -1 ? 'dia' : 'dias'})` : `Lembrar em ${p.diasPrazo} ${p.diasPrazo === 1 ? 'dia' : 'dias'}`)
                              : p.diasPrazo < 0 ? `Atrasado ${-p.diasPrazo} ${p.diasPrazo === -1 ? 'dia' : 'dias'}` : p.diasPrazo === 0 ? 'Termina hoje' : `Prazo em ${p.diasPrazo} ${p.diasPrazo === 1 ? 'dia' : 'dias'}`} · {fmt(p.prazo)}
                            {p.alertaOff ? ' · alerta desligado' : ''}
                          </p>
                        )}

                        {atrasado(p) && (
                          <button type="button" onClick={() => avisarMembro(p)}
                            className="flex items-center justify-center gap-2 rounded-full border border-[#25D366]/45 bg-[#25D366]/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#25D366] hover:bg-[#25D366]/20">
                            Avisar {responsavel(p) ? primeiro(responsavel(p)!.nome) : 'a equipa'} por WhatsApp
                          </button>
                        )}
                        {p.fase !== 'entregue' && (
                          <label className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/40">Editor de fotos</span>
                            <select disabled={aGravar === p.id} value={editorAtual(p)}
                              onChange={e => {
                                const novo = e.target.value
                                if (!novo || novo === editorAtual(p)) return
                                if (p.editores.length && !window.confirm(`Trocar o editor de ${nomes} de ${p.editores.join(', ')} para ${novo}? O trabalho passa para o portal de ${primeiro(novo)}.`)) return
                                atribuir(p, novo)
                              }}
                              className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#C9A84C] ${p.editores.length ? 'border-white/10 text-white' : 'border-[#C9A84C]/40 text-white/60'}`}>
                              <option value="" disabled>{aGravar === p.id ? 'A guardar…' : 'Nomear editor…'}</option>
                              {editorAtual(p) && !cargas.some(c => c.e.nome === editorAtual(p)) && <option value={editorAtual(p)}>{editorAtual(p)}</option>}
                              {cargas.map(({ e, ativos }) => <option key={e.id} value={e.nome}>{e.nome} ({ativos} em edição)</option>)}
                            </select>
                          </label>
                        )}

                        {(p.fase === 'sneakpeek' || p.fase === 'galerias' || p.fase === 'selecao') && (
                          <div className="flex flex-col gap-2 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/[0.06] p-3">
                            <input type="url" placeholder="Link da galeria" value={link}
                              onChange={e => setLinks(l => ({ ...l, [chave]: e.target.value }))}
                              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-white outline-none focus:border-[#C9A84C]/60" />
                            <button type="button" disabled={aGravar === p.id}
                              onClick={() => acao(p, p.fase, `Enviar ${FASES.find(x => x.k === p.fase)!.titulo.toLowerCase()} a ${nomes}? Os noivos recebem o email e o cartão abre no portal.`, link.trim())}
                              className="rounded-full border border-[#C9A84C]/60 bg-[#C9A84C]/15 px-3 py-2 text-[11px] font-semibold tracking-[0.15em] uppercase text-white hover:bg-[#C9A84C]/30 disabled:opacity-40">
                              {aGravar === p.id ? 'A enviar…' : p.fase === 'sneakpeek' ? 'Enviar por email →' : 'Enviar aos noivos →'}
                            </button>
                            {p.fase === 'sneakpeek' && (
                              <>
                                <button type="button" disabled={aGravar === p.id} onClick={() => sneakPeekWhatsApp(p, link.trim(), carregar)}
                                  className="rounded-full border border-[#25D366]/45 bg-[#25D366]/10 px-3 py-2 text-[11px] font-semibold tracking-[0.15em] uppercase text-[#25D366] hover:bg-[#25D366]/20 disabled:opacity-40">
                                  Enviar por WhatsApp
                                </button>
                                <button type="button" disabled={aGravar === p.id}
                                  onClick={() => acao(p, 'sem-sneakpeek', `${nomes} não tem sneak peek (sem serviço)? Passa para a Galeria online.`)}
                                  className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/35 hover:text-white/70">Sem serviço →</button>
                              </>
                            )}
                          </div>
                        )}

                        {p.fase === 'escolha' && (
                          <div className="flex flex-col gap-2 rounded-xl border border-[#93c5fd]/25 bg-[#93c5fd]/[0.06] p-3">
                            <p className="text-[11px] text-white/55">À espera da seleção dos noivos. Chega sozinha quando enviam o formulário.</p>
                            <button type="button" onClick={() => lembrarPorWhatsApp(p)}
                              className="text-center rounded-full border border-[#4ade80]/45 bg-[#4ade80]/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#4ade80] hover:bg-[#4ade80]/20">
                              Lembrar por WhatsApp
                            </button>
                            <button type="button" disabled={aGravar === p.id}
                              onClick={() => acao(p, 'recebida', `Marcar a seleção de ${nomes} como recebida hoje? O casamento passa para Edição.`)}
                              className="rounded-full border border-[#93c5fd]/40 bg-[#93c5fd]/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#93c5fd] hover:bg-[#93c5fd]/20 disabled:opacity-40">✓ Seleção recebida</button>
                          </div>
                        )}

                        {p.fase === 'edicao' && (
                          <div className="flex flex-col gap-2 rounded-xl border border-[#c4b5fd]/25 bg-[#c4b5fd]/[0.05] p-3">
                            {p.recebida && <p className="text-[11px] text-white/45">Seleção recebida a {fmt(p.recebida)}</p>}
                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/40">Editor do álbum</span>
                              <select disabled={aGravar === p.id} value={albumAtual(p)} onChange={e => nomearAlbum(p, e.target.value)}
                                className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#C9A84C] ${p.editorAlbum ? 'border-white/10 text-white' : 'border-[#C9A84C]/40 text-white/60'}`}>
                                <option value="" disabled>{aGravar === p.id ? 'A guardar…' : 'Nomear editor do álbum…'}</option>
                                {albumAtual(p) && !cargas.some(c => c.e.nome === albumAtual(p)) && <option value={albumAtual(p)}>{albumAtual(p)}</option>}
                                {cargas.map(({ e }) => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                              </select>
                            </label>
                            <input type="url" placeholder="Link das fotos editadas" value={link}
                              onChange={e => setLinks(l => ({ ...l, [chave]: e.target.value }))}
                              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-white outline-none focus:border-[#C9A84C]/60" />
                            <button type="button" disabled={aGravar === p.id}
                              onClick={() => acao(p, 'entregue', `Enviar as fotos editadas a ${nomes}? Os noivos recebem o email e têm 30 dias para descarregar.`, link.trim())}
                              className="rounded-full border border-[#4ade80]/50 bg-[#4ade80]/10 px-3 py-2 text-[11px] font-semibold tracking-[0.15em] uppercase text-[#4ade80] hover:bg-[#4ade80]/20 disabled:opacity-40">
                              {aGravar === p.id ? 'A enviar…' : 'Entregar fotos editadas →'}
                            </button>
                          </div>
                        )}

                        {p.fase === 'entregue' && p.enviadas.entregue && (
                          <p className="text-[12px] text-[#4ade80]">✓ Entregues a {fmt(String(p.enviadas.entregue))}</p>
                        )}

                        {p.selecao && (
                          <button type="button" onClick={() => setSelAberta(p)}
                            className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/75 hover:text-white hover:border-[#C9A84C]/50">
                            Ver seleção · {(p.selecaoFotos ?? []).reduce((s, c) => s + c.fotos, 0)} fotos
                          </button>
                        )}
                        <details className="group/h">
                          <summary className="cursor-pointer list-none text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40 hover:text-white/70">
                            <span className="group-open/h:hidden">+ Histórico</span><span className="hidden group-open/h:inline">− Histórico</span>
                          </summary>
                          <ol className="mt-2.5 ml-1 border-l border-white/10 pl-3.5 flex flex-col gap-2">
                            {linhaDoTempo(p).map((ev, i, l) => (
                              <li key={i} className="relative">
                                <i className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full" style={{ background: OURO }} />
                                <p className="text-[12px] font-semibold text-white/85 leading-tight">{ev.titulo}{ev.quem ? <span className="font-normal text-white/40"> · {ev.quem}</span> : null}</p>
                                <p className="text-[11px] text-white/40">{fmt(ev.em)}{i > 0 ? ` · +${diasEntre(l[i - 1].em, ev.em)} dias` : ''}</p>
                              </li>
                            ))}
                          </ol>
                        </details>
                        <div className="flex gap-3 text-[11px] font-semibold tracking-[0.15em] uppercase">
                          <Link href={`/eventos-2026/${p.fichaId}`} className="text-[#C9A84C]/80 hover:text-[#C9A84C]">Ficha →</Link>
                          {p.portalId && <Link href={`/portal-cliente/ref/${encodeURIComponent(p.referencia)}?admin=1`} className="text-white/45 hover:text-white">Portal →</Link>}
                          <button type="button" disabled={aGravar === p.id} title="Este casamento não é da nossa responsabilidade"
                            onClick={() => acao(p, 'retirar', `Retirar ${nomes} do departamento? Não é apagado: fica na lista Retirados, no fim da página, e podes repor.`)}
                            className="ml-auto text-white/30 hover:text-red-400 uppercase tracking-[0.15em] disabled:opacity-40">✕ Retirar</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </section>

        {!!dados?.retirados.length && (
          <details className="rounded-[22px] border border-white/[0.08] bg-[#111111]/70 px-5 py-4 -mt-8">
            <summary className="cursor-pointer text-[12px] font-semibold tracking-[0.2em] uppercase text-white/60">
              Retirados ({dados.retirados.length})
            </summary>
            <p className="mt-3 text-sm text-white/45">Casamentos que não são da nossa responsabilidade. Não contam nos números nem nos atrasos.</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {dados.retirados.map(r => (
                <li key={r.referencia} className="flex items-center justify-between gap-3 border-b border-white/[0.05] pb-2">
                  <span><span className="text-white/85">{r.cliente || r.referencia}</span> <span className="text-white/35">· {fmt(r.data)}</span></span>
                  <button type="button" onClick={async () => {
                    await fetch('/api/edicao-fotografia/enviar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: r.referencia, etapa: 'repor' }) }).catch(() => {})
                    carregar()
                  }} className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#C9A84C]/80 hover:text-[#C9A84C]">Repor</button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <JanelaWhatsApp aberto={!!avisoSem} onFechar={() => setAvisoSem(null)}
        titulo={avisoSem ? `Atraso · ${avisoSem.cliente ?? avisoSem.referencia}` : 'Atraso'}
        mensagem={avisoSem ? mensagemAtraso(avisoSem, responsavel(avisoSem)?.nome ?? null) : ''} />

      {selAberta?.selecao && (
        <SelecaoCaixa p={selAberta} onFechar={() => setSelAberta(null)} onGuardado={() => { setSelAberta(null); carregar() }} />
      )}

      {aVer && (() => {
        const meus = projetos.filter(p => p.fase === 'edicao' && p.editorIds.includes(aVer.id))
          .sort((a, b) => (a.diasPrazo ?? 9999) - (b.diasPrazo ?? 9999))
        const aSeguir = projetos.filter(p => p.fase !== 'edicao' && p.fase !== 'entregue' && p.editorIds.includes(aVer.id))
        return (
          <div role="dialog" aria-modal="true" aria-label={`O que ${aVer.nome} está a editar`} onClick={() => setAVer(null)}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[22px] border border-[#C9A84C]/35 bg-[#0e0e0e] p-6 shadow-[0_0_60px_-20px_rgba(201,168,76,0.6)]"
              style={{ borderLeft: `2px solid ${OURO}` }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Em edição</p>
                  <h3 className="mt-1 text-2xl font-semibold">{aVer.nome}</h3>
                  <p className="text-sm text-white/45">{meus.length} casamento{meus.length === 1 ? '' : 's'} a editar{aSeguir.length ? ` · ${aSeguir.length} a seguir` : ''}</p>
                </div>
                <button type="button" onClick={() => setAVer(null)} aria-label="Fechar"
                  className="w-9 h-9 rounded-full border border-white/15 text-white/60 hover:text-white text-lg">×</button>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                {meus.map(p => {
                  const t = p.trabalhos.find(x => x.freelancerId === aVer.id)
                  const total = (p.selecaoFotos ?? []).reduce((s, c) => s + c.fotos, 0)
                  return (
                    <div key={p.id} className="rounded-[18px] border border-white/[0.08] bg-[#141414] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{p.cliente || p.referencia}</p>
                          <p className="text-[11px] text-white/40">{fmt(p.data)}{p.local ? ` · ${p.local}` : ''}</p>
                        </div>
                        {t?.estado && <span className="rounded-full border border-[#c4b5fd]/40 bg-[#c4b5fd]/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-[#c4b5fd]">{t.estado}</span>}
                      </div>
                      <p className="mt-2 text-[12px] text-white/60">
                        {p.recebida ? <>Seleção recebida a {fmt(p.recebida)}</> : 'Seleção sem data'}
                        {p.prazo && p.diasPrazo !== null && <> · <span className={p.diasPrazo < 0 ? 'text-red-400 font-semibold' : 'text-white/70'}>{p.diasPrazo < 0 ? `atrasado ${-p.diasPrazo} dias` : `entrega em ${p.diasPrazo} dias`} ({fmt(p.prazo)})</span></>}
                      </p>
                      {p.selecaoFotos?.length ? (
                        <>
                          <p className="mt-3 text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40">Seleção dos noivos · {total} fotos</p>
                          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {p.selecaoFotos.map(c => (
                              <div key={c.categoria} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-1.5 text-[12px]">
                                <span className="text-white/60">{c.categoria}</span><b className="text-white tabular-nums">{c.fotos}</b>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : <p className="mt-3 text-[12px] text-white/35">Sem a lista da seleção no sistema.</p>}
                      {p.selecao && (
                        <button type="button" onClick={() => { setAVer(null); setSelAberta(p) }}
                          className="mt-3 text-[11px] font-semibold tracking-[0.15em] uppercase text-white/60 hover:text-white">Ver a seleção completa →</button>
                      )}
                      <div className="mt-3 flex gap-3 text-[11px] font-semibold tracking-[0.15em] uppercase">
                        <Link href={`/eventos-2026/${p.fichaId}`} className="text-[#C9A84C]/80 hover:text-[#C9A84C]">Ficha →</Link>
                        <Link href={`/freelancers/${aVer.id}`} className="text-white/45 hover:text-white">Ficha do editor →</Link>
                      </div>
                    </div>
                  )
                })}
              </div>
              {aSeguir.length > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40">A seguir · já nomeado, à espera da seleção</p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {aSeguir.map(p => (
                      <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2 text-[12px]">
                        <span><span className="text-white/85">{p.cliente || p.referencia}</span> <span className="text-white/35">· {fmt(p.data)}</span></span>
                        <span className="text-white/45">{FASES.find(f => f.k === p.fase)?.titulo}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </main>
  )
}
