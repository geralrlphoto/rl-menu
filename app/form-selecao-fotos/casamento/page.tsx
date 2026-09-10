'use client'

import FormSelecao, { type Seccao } from '../FormSelecao'

// Seleção de fotografias — casamento (mesmas secções do formulário do Tally).

const SECCOES: Seccao[] = [
  { name: 'fotos_noivo',   label: 'Fotos do Noivo' },
  { name: 'fotos_noiva',   label: 'Fotos da Noiva' },
  { name: 'cerimonia',     label: 'Cerimónia' },
  { name: 'convidados',    label: 'Convidados' },
  { name: 'sala_animacao', label: 'Sala e Animação' },
  { name: 'bolo_bouquet',  label: 'Bolo e Bouquet' },
  { name: 'detalhes',      label: 'Detalhes' },
  { name: 'sessao_noivos', label: 'Sessão Noivos' },
  { name: 'fotos_album',   label: 'Fotos para Álbum' },
]

export default function FormSelecaoCasamentoPage() {
  return (
    <FormSelecao
      tipo="casamento"
      eyebrow="Casamento"
      nomeLabel="Nome dos Noivos"
      nomePlaceholder="Ex.: Ana e André"
      dataLabel="Data do Casamento"
      refPlaceholder="Ex.: CAS_011_26_RL"
      exemplo="LG-0001"
      iniciais="as iniciais dos noivos"
      seccoes={SECCOES}
    />
  )
}
