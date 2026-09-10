'use client'

import FormSelecao, { type Seccao } from '../FormSelecao'

// Seleção de fotografias — batizado.
// As secções gravam nas colunas de fotos_selecao: preparação tem coluna
// própria, a festa fica em sala_animacao e o álbum em fotos_album.

const SECCOES: Seccao[] = [
  { name: 'preparacao',    label: 'Preparação', required: true  },
  { name: 'cerimonia',     label: 'Cerimónia',  required: true  },
  { name: 'sala_animacao', label: 'Festa',      required: true  },
  { name: 'fotos_album',   label: 'Álbum',      required: false },
]

export default function FormSelecaoBatizadoPage() {
  return (
    <FormSelecao
      tipo="batizado"
      eyebrow="Batizado"
      nomeLabel="Nome da Criança"
      nomePlaceholder="Ex.: Maria Silva"
      dataLabel="Data do Batizado"
      refPlaceholder="Ex.: BTZ_011_26_RL"
      exemplo="MS-0001"
      iniciais="as iniciais da criança"
      seccoes={SECCOES}
    />
  )
}
