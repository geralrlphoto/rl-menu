'use client'

import FormSelecao, { type Seccao } from '../FormSelecao'

// Seleção de fotografias — casamento (mesmas secções do formulário do Tally).

const SECCOES: Seccao[] = [
  { name: 'fotos_noivo',   label: 'Fotos do Noivo',   required: true  },
  { name: 'fotos_noiva',   label: 'Fotos da Noiva',   required: true  },
  { name: 'cerimonia',     label: 'Cerimónia',        required: true  },
  { name: 'convidados',    label: 'Convidados',       required: true  },
  { name: 'sala_animacao', label: 'Sala e Animação',  required: true  },
  { name: 'bolo_bouquet',  label: 'Bolo e Bouquet',   required: true  },
  { name: 'detalhes',      label: 'Detalhes',         required: true  },
  { name: 'sessao_noivos', label: 'Sessão Noivos',    required: true  },
  { name: 'fotos_album',   label: 'Fotos para Álbum', required: false },
]

export default function FormSelecaoCasamentoPage() {
  return (
    <FormSelecao
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
