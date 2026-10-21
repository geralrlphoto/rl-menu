'use client'

import { useState } from 'react'
import MarcarReuniao from '@/app/rollup/MarcarReuniao'
import CenaReuniao from './CenaReuniao'

/* Marcação pública: o calendário aparece logo aberto; a data do casamento é opcional. */
export default function MarcarPublico() {
  const [dataCasamento, setDataCasamento] = useState('')
  const [passo, setPasso] = useState(0)
  return (
    <CenaReuniao titulo={<>Vamos <em>conversar</em></>} passo={passo}>
      {passo < 3 && (
        <label className="rp-data">
          <span>Data do casamento <i>(se já tiverem)</i></span>
          <input type="date" value={dataCasamento} onChange={e => setDataCasamento(e.target.value)} className="finput" />
        </label>
      )}
      <MarcarReuniao dataCasamento={dataCasamento} origem="link" abertoInicial sujeitaConfirmacao onPasso={setPasso} />
    </CenaReuniao>
  )
}
