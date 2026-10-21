'use client'

import { useState } from 'react'
import MarcarReuniao from '@/app/rollup/MarcarReuniao'
import CenaReuniao from '../CenaReuniao'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export default function MarcarLead({ leadId, nome, dataCasamento, reuniaoData, reuniaoHora }: {
  leadId: string; nome: string; dataCasamento: string; reuniaoData: string; reuniaoHora: string
}) {
  const [passo, setPasso] = useState(0)
  const hoje = new Date().toISOString().slice(0, 10)
  const jaMarcada = reuniaoData && reuniaoData >= hoje && reuniaoHora
  const x = reuniaoData ? new Date(reuniaoData + 'T12:00:00') : null

  return (
    <CenaReuniao titulo={<>Vamos <em>conversar</em>{nome ? <>,<br />{nome}</> : null}</>} passo={passo}>
      {jaMarcada && x && passo < 3 && (
        <p className="rp-ja">Já têm reunião marcada para {x.getDate()} de {MESES[x.getMonth()]} às {reuniaoHora}. Só precisam de escolher outro horário se quiserem alterar.</p>
      )}
      <MarcarReuniao dataCasamento={dataCasamento} leadId={leadId} onPasso={setPasso} />
    </CenaReuniao>
  )
}
