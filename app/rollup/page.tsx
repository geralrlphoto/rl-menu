import type { Metadata } from 'next'
import Rollup from './Rollup'

/* Rollup: página aberta pelo QR code impresso no rollup (só casamentos).
   Opção 2, interativa: o telemóvel vira câmara. A opção 1 está em
   design-opcoes/rollup-opcao-1.tsx (etiqueta git rollup-opcao-1). */

export const metadata: Metadata = { title: 'RL Photo.Video · Casamentos' }

export default function RollupPage() {
  return <Rollup />
}
