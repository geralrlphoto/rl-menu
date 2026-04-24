'use client'

import Link from 'next/link'
import { useState } from 'react'

// ─── DADOS 2025 ────────────────────────────────────────────────────────────────

const RECEITAS_2025 = [
  { data: '21/02/2025', mes: 'Fevereiro', tipo: 'CASAMENTO', valor: 1000, info: '' },
  { data: '21/03/2025', mes: 'Março', tipo: 'SESSÃO', valor: 200, info: '' },
  { data: '25/04/2025', mes: 'Abril', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '26/04/2025', mes: 'Abril', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '26/04/2025', mes: 'Abril', tipo: 'CASAMENTO', valor: 350, info: 'Liliana e Fábio | Videografo LUÍS' },
  { data: '02/05/2025', mes: 'Maio', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '03/05/2025', mes: 'Maio', tipo: 'CASAMENTO', valor: 900, info: '' },
  { data: '09/05/2025', mes: 'Maio', tipo: 'CORPORATIVO', valor: 375, info: 'Projeto NAFAS' },
  { data: '10/05/2025', mes: 'Maio', tipo: 'CASAMENTO', valor: 520, info: '' },
  { data: '17/05/2025', mes: 'Maio', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '18/05/2025', mes: 'Maio', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '24/05/2025', mes: 'Maio', tipo: 'CASAMENTO', valor: 350, info: 'Raquel e Nuno | Videografo LUÍS' },
  { data: '24/05/2025', mes: 'Maio', tipo: 'BATIZADO', valor: 450, info: '' },
  { data: '25/05/2025', mes: 'Maio', tipo: 'BATIZADO', valor: 450, info: '' },
  { data: '30/05/2025', mes: 'Maio', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '06/06/2025', mes: 'Junho', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '07/06/2025', mes: 'Junho', tipo: 'CASAMENTO', valor: 200, info: 'Liquidado até à data 200€' },
  { data: '14/06/2025', mes: 'Junho', tipo: 'CASAMENTO', valor: 350, info: 'Mica e Gastão | Videografo LUÍS' },
  { data: '19/06/2025', mes: 'Junho', tipo: 'CASAMENTO', valor: 750, info: '' },
  { data: '21/06/2025', mes: 'Junho', tipo: 'CASAMENTO', valor: 375, info: 'Pack 600€+100€ drone | Videografo LUÍS' },
  { data: '21/06/2025', mes: 'Junho', tipo: 'CASAMENTO', valor: 300, info: 'Videografo LETRAS' },
  { data: '21/06/2025', mes: 'Junho', tipo: 'CASAMENTO', valor: 730, info: 'Pack 650+80€ Projetor' },
  { data: '26/06/2025', mes: 'Junho', tipo: 'CORPORATIVO', valor: 450, info: 'Arraialzinho' },
  { data: '28/06/2025', mes: 'Junho', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '05/07/2025', mes: 'Junho', tipo: 'CASAMENTO', valor: 800, info: 'Liquidado até à data 660€' },
  { data: '03/07/2025', mes: 'Julho', tipo: 'CORPORATIVO', valor: 400, info: 'Festa de 50 Anos' },
  { data: '12/07/2025', mes: 'Julho', tipo: 'CASAMENTO', valor: 350, info: 'Jéssica e Luís | Videografo LUÍS' },
  { data: '18/07/2025', mes: 'Julho', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '19/07/2025', mes: 'Julho', tipo: 'CASAMENTO', valor: 300, info: 'Marisa e Flávio | Videografo LETRAS' },
  { data: '19/07/2025', mes: 'Julho', tipo: 'CASAMENTO', valor: 600, info: 'Marisa e Aaron | Videografo LUÍS' },
  { data: '19/07/2025', mes: 'Julho', tipo: 'CASAMENTO', valor: 600, info: 'Liquidado até à data 500€' },
  { data: '26/07/2025', mes: 'Julho', tipo: 'CASAMENTO', valor: 400, info: 'Videografo LETRAS' },
  { data: '08/08/2025', mes: 'Agosto', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '09/08/2025', mes: 'Agosto', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '16/08/2025', mes: 'Agosto', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '17/08/2025', mes: 'Agosto', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '22/08/2025', mes: 'Agosto', tipo: 'CASAMENTO', valor: 400, info: 'Catarina e Cyrill | Videografo LUÍS' },
  { data: '22/08/2025', mes: 'Agosto', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '23/08/2025', mes: 'Agosto', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '24/08/2025', mes: 'Agosto', tipo: 'CASAMENTO', valor: 450, info: 'Cláudia e Marco | Videografo LUÍS' },
  { data: '24/08/2025', mes: 'Agosto', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '27/08/2025', mes: 'Agosto', tipo: 'CASAMENTO', valor: 880, info: '' },
  { data: '30/08/2025', mes: 'Agosto', tipo: 'CASAMENTO', valor: 1000, info: '' },
  { data: '31/08/2025', mes: 'Agosto', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '06/09/2025', mes: 'Setembro', tipo: 'CASAMENTO', valor: 350, info: 'Cintia' },
  { data: '06/09/2025', mes: 'Setembro', tipo: 'CASAMENTO', valor: 500, info: 'Ana e Mário Coutinho' },
  { data: '07/09/2025', mes: 'Setembro', tipo: 'CASAMENTO', valor: 950, info: 'Débora e Bruno' },
  { data: '11/09/2025', mes: 'Setembro', tipo: 'CASAMENTO', valor: 500, info: 'Beatriz e Miguel' },
  { data: '13/09/2025', mes: 'Setembro', tipo: 'CASAMENTO', valor: 350, info: 'Daniela e Ruben' },
  { data: '14/09/2025', mes: 'Setembro', tipo: 'CASAMENTO', valor: 600, info: 'Joana e Diogo' },
  { data: '15/09/2025', mes: 'Setembro', tipo: 'SESSÃO', valor: 100, info: 'Sessão TTD (Joana e Miguel)' },
  { data: '20/09/2025', mes: 'Setembro', tipo: 'CASAMENTO', valor: 450, info: 'Larissa e Luís' },
  { data: '20/09/2025', mes: 'Setembro', tipo: 'CASAMENTO', valor: 600, info: 'Miriã e Marco' },
  { data: '27/09/2025', mes: 'Setembro', tipo: 'CASAMENTO', valor: 350, info: 'Inês e Ricardo' },
  { data: '27/09/2025', mes: 'Setembro', tipo: 'CASAMENTO', valor: 600, info: 'Susana e João' },
  { data: '04/10/2025', mes: 'Outubro', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '11/10/2025', mes: 'Outubro', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '18/10/2025', mes: 'Outubro', tipo: 'CASAMENTO', valor: 350, info: 'Joana e Fábio' },
  { data: '18/10/2025', mes: 'Outubro', tipo: 'CASAMENTO', valor: 1000, info: 'Nayure e Gonçalo' },
  { data: '20/10/2025', mes: 'Outubro', tipo: 'CORPORATIVO', valor: 2400, info: 'OLEOBIO SERVICES' },
  { data: '26/10/2025', mes: 'Outubro', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '10/11/2025', mes: 'Novembro', tipo: 'CASAMENTO', valor: 80, info: '20% FINAIS' },
  { data: '15/11/2025', mes: 'Novembro', tipo: 'CASAMENTO', valor: 600, info: '' },
  { data: '01/12/2025', mes: 'Dezembro', tipo: 'CASAMENTO', valor: 700, info: '' },
]

const DESPESAS_2025 = [
  // Janeiro
  { data: '01/2025', mes: 'Janeiro', item: 'INTERNET HOTSPOT', valor: 20, notas: '' },
  { data: '01/2025', mes: 'Janeiro', item: 'LUZ LOJA', valor: 16, notas: '' },
  { data: '01/2025', mes: 'Janeiro', item: 'LOJA RENDA', valor: 200, notas: '' },
  { data: '01/2025', mes: 'Janeiro', item: 'CARRINHO DE PRAIA', valor: 56.83, notas: '' },
  { data: '01/2025', mes: 'Janeiro', item: 'WFOLIO', valor: 43.85, notas: '' },
  // Fevereiro
  { data: '02/2025', mes: 'Fevereiro', item: 'LOJA RENDA', valor: 200, notas: '' },
  { data: '02/2025', mes: 'Fevereiro', item: 'CAGE CANON R7', valor: 120, notas: '' },
  { data: '02/2025', mes: 'Fevereiro', item: 'PEGA CAGE CANON R7', valor: 60, notas: '' },
  { data: '02/2025', mes: 'Fevereiro', item: 'INTERNET HOTSPOT', valor: 20, notas: '' },
  { data: '02/2025', mes: 'Fevereiro', item: 'LUZ LOJA', valor: 16, notas: '' },
  { data: '02/2025', mes: 'Fevereiro', item: 'CAFÉ LOJA', valor: 15, notas: '' },
  { data: '02/2025', mes: 'Fevereiro', item: 'FILMMAKERS SUMMIT', valor: 67.50, notas: '' },
  { data: '02/2025', mes: 'Fevereiro', item: 'VIDEOGRAFO GONÇALO', valor: 180, notas: '' },
  { data: '02/2025', mes: 'Fevereiro', item: 'PORTÁTIL', valor: 1500, notas: '' },
  // Março
  { data: '03/2025', mes: 'Março', item: 'LOJA RENDA', valor: 200, notas: '' },
  { data: '03/2025', mes: 'Março', item: 'ANA MONTEIRO', valor: 125, notas: '' },
  { data: '03/2025', mes: 'Março', item: 'FILMMAKERS SUMMIT', valor: 67.50, notas: '' },
  { data: '03/2025', mes: 'Março', item: 'LUZ LOJA', valor: 15.56, notas: '' },
  { data: '03/2025', mes: 'Março', item: 'SEGURO RC', valor: 64.72, notas: '' },
  { data: '03/2025', mes: 'Março', item: 'INTERNET HOTSPOT', valor: 20, notas: '' },
  { data: '03/2025', mes: 'Março', item: 'AMAZON', valor: 75, notas: '' },
  // Abril
  { data: '04/2025', mes: 'Abril', item: 'LOJA RENDA', valor: 200, notas: '' },
  { data: '04/2025', mes: 'Abril', item: 'LUZ LOJA', valor: 14.96, notas: '' },
  { data: '04/2025', mes: 'Abril', item: 'INTERNET HOTSPOT', valor: 20, notas: '' },
  { data: '04/2025', mes: 'Abril', item: 'AMAZON', valor: 65.58, notas: '' },
  { data: '04/2025', mes: 'Abril', item: 'LUMI GH7', valor: 1601.27, notas: '' },
  // Maio
  { data: '05/2025', mes: 'Maio', item: 'LOJA RENDA', valor: 200, notas: '' },
  { data: '05/2025', mes: 'Maio', item: 'LENTE 12-35MM', valor: 350, notas: '' },
  { data: '05/2025', mes: 'Maio', item: 'BILHETE COMBOIO', valor: 59, notas: '' },
  { data: '05/2025', mes: 'Maio', item: 'HOTEL PORTO', valor: 140.40, notas: '' },
  { data: '05/2025', mes: 'Maio', item: 'UBER PORTO', valor: 26.68, notas: '' },
  { data: '05/2025', mes: 'Maio', item: 'REFEIÇÕES PORTO', valor: 52.54, notas: '' },
  { data: '05/2025', mes: 'Maio', item: 'HOTSPOT INTERNET', valor: 25, notas: '' },
  { data: '05/2025', mes: 'Maio', item: 'LUZ LOJA', valor: 15.10, notas: '' },
  { data: '05/2025', mes: 'Maio', item: 'MENTORIA', valor: 500, notas: '1ª prestação' },
  { data: '05/2025', mes: 'Maio', item: 'AMAZON (Discos)', valor: 411.90, notas: '' },
  // Junho
  { data: '06/2025', mes: 'Junho', item: 'RENDA LOJA', valor: 200, notas: '' },
  { data: '06/2025', mes: 'Junho', item: 'AMAZON (Baterias)', valor: 52.12, notas: '' },
  { data: '06/2025', mes: 'Junho', item: 'PERSONALIZAÇÃO BOXES', valor: 6, notas: '' },
  { data: '06/2025', mes: 'Junho', item: 'HOTSPOT INTERNET', valor: 20, notas: '' },
  { data: '06/2025', mes: 'Junho', item: 'SEGURO RC', valor: 64.72, notas: '' },
  { data: '06/2025', mes: 'Junho', item: 'MENTORIA', valor: 500, notas: '2ª prestação' },
  { data: '06/2025', mes: 'Junho', item: 'LUZ LOJA', valor: 11.89, notas: '' },
  { data: '06/2025', mes: 'Junho', item: 'MONITOR PARA CÂMARA', valor: 160, notas: '' },
  // Julho
  { data: '07/2025', mes: 'Julho', item: 'RENDA LOJA', valor: 200, notas: '' },
  { data: '07/2025', mes: 'Julho', item: 'CAFÉ LOJA', valor: 15, notas: '' },
  { data: '07/2025', mes: 'Julho', item: 'MENTORIA', valor: 500, notas: '3ª prestação' },
  { data: '07/2025', mes: 'Julho', item: 'AMAZON (Cabo drone)', valor: 10.54, notas: '' },
  { data: '07/2025', mes: 'Julho', item: 'HOTSPOT INTERNET', valor: 20, notas: '' },
  { data: '07/2025', mes: 'Julho', item: 'VIDEOGRAFO LUÍS', valor: 250, notas: '' },
  { data: '07/2025', mes: 'Julho', item: 'LUZ LOJA', valor: 13.57, notas: '' },
  { data: '07/2025', mes: 'Julho', item: 'DEVOLUÇÃO VALOR VÍDEO', valor: 380, notas: '' },
  // Agosto
  { data: '08/2025', mes: 'Agosto', item: 'MAXMAT (Madeiras)', valor: 47.34, notas: '' },
  { data: '08/2025', mes: 'Agosto', item: 'MENTORIA', valor: 500, notas: 'Pagamento final' },
  { data: '08/2025', mes: 'Agosto', item: 'RENDA LOJA', valor: 200, notas: '' },
  { data: '08/2025', mes: 'Agosto', item: 'DRONE 4G PRO', valor: 865, notas: '' },
  { data: '08/2025', mes: 'Agosto', item: 'AMAZON (Baterias + Bolsa)', valor: 147.36, notas: '' },
  { data: '08/2025', mes: 'Agosto', item: 'AMAZON (Alça ombro drone)', valor: 11.69, notas: '' },
  { data: '08/2025', mes: 'Agosto', item: 'HOTSPOT INTERNET', valor: 20, notas: '' },
  { data: '08/2025', mes: 'Agosto', item: 'LUZ LOJA', valor: 18.42, notas: '' },
  { data: '08/2025', mes: 'Agosto', item: 'EDITOR VÍDEO', valor: 150, notas: '' },
  { data: '08/2025', mes: 'Agosto', item: 'VIDEOGRAFO LUÍS', valor: 250, notas: '' },
  { data: '08/2025', mes: 'Agosto', item: 'AMAZON (Walkies Talkies)', valor: 63.01, notas: '' },
  // Setembro
  { data: '09/2025', mes: 'Setembro', item: 'DISCOS RÍGIDOS', valor: 451.98, notas: '' },
  { data: '09/2025', mes: 'Setembro', item: 'RENDA LOJA', valor: 200, notas: '' },
  { data: '09/2025', mes: 'Setembro', item: 'PUBLICIDADE FACEBOOK', valor: 12.15, notas: '' },
  { data: '09/2025', mes: 'Setembro', item: '2º VIDEOGRAFO LEANDRO', valor: 100, notas: '' },
  { data: '09/2025', mes: 'Setembro', item: 'ALIMENTAÇÃO LISBOA', valor: 11.79, notas: '' },
  { data: '09/2025', mes: 'Setembro', item: 'TRAVESSIA TEJO', valor: 15.50, notas: '' },
  { data: '09/2025', mes: 'Setembro', item: 'EDITOR VÍDEO', valor: 150, notas: '' },
  { data: '09/2025', mes: 'Setembro', item: 'HOTSPOT INTERNET', valor: 20, notas: '' },
  { data: '09/2025', mes: 'Setembro', item: 'AMAZON', valor: 217.26, notas: '' },
  { data: '09/2025', mes: 'Setembro', item: 'EVENTO MENTORIA', valor: 54.45, notas: '' },
  { data: '09/2025', mes: 'Setembro', item: 'LUZ LOJA', valor: 18.79, notas: '' },
  { data: '09/2025', mes: 'Setembro', item: 'SEGURO RC', valor: 64.72, notas: '' },
  { data: '09/2025', mes: 'Setembro', item: 'PUBLICIDADE FACEBOOK', valor: 16.64, notas: '' },
  { data: '09/2025', mes: 'Setembro', item: 'T-SHIRTS RL MEDIA', valor: 95, notas: '' },
  // Outubro
  { data: '10/2025', mes: 'Outubro', item: 'GO PRO 5', valor: 55, notas: '' },
  { data: '10/2025', mes: 'Outubro', item: 'HOSTINGER SITES', valor: 147.45, notas: '' },
  { data: '10/2025', mes: 'Outubro', item: 'PUBLICIDADE FACEBOOK', valor: 135.82, notas: '' },
  { data: '10/2025', mes: 'Outubro', item: 'CAFÉ LOJA', valor: 15.99, notas: '' },
  { data: '10/2025', mes: 'Outubro', item: 'RENDA LOJA', valor: 200, notas: '' },
  { data: '10/2025', mes: 'Outubro', item: 'ALUGUER LENTE QUIM', valor: 26, notas: '' },
  { data: '10/2025', mes: 'Outubro', item: 'EDITOR VÍDEO', valor: 150, notas: '' },
  { data: '10/2025', mes: 'Outubro', item: 'PERSONALIZAÇÃO CASACOS', valor: 18, notas: 'RL MEDIA' },
  { data: '10/2025', mes: 'Outubro', item: 'CASACOS RL MEDIA', valor: 55.50, notas: '' },
  { data: '10/2025', mes: 'Outubro', item: 'HOTSPOT INTERNET', valor: 20, notas: '' },
  { data: '10/2025', mes: 'Outubro', item: 'VÍDEO BTS', valor: 200, notas: 'Projeto NAFAS' },
  { data: '10/2025', mes: 'Outubro', item: 'LUZ LOJA', valor: 19.74, notas: '' },
  { data: '10/2025', mes: 'Outubro', item: 'DOWNLOAD MÚSICAS', valor: 30.75, notas: '' },
  // Novembro
  { data: '11/2025', mes: 'Novembro', item: 'RENDA LOJA', valor: 200, notas: '' },
  { data: '11/2025', mes: 'Novembro', item: 'HOTSPOT INTERNET', valor: 20, notas: '' },
  { data: '11/2025', mes: 'Novembro', item: 'ANUIDADE SMASH', valor: 88.56, notas: '' },
  { data: '11/2025', mes: 'Novembro', item: 'VIDFLOW', valor: 31.46, notas: '' },
  { data: '11/2025', mes: 'Novembro', item: 'AMAZON', valor: 190.82, notas: '' },
  { data: '11/2025', mes: 'Novembro', item: 'CARTÕES DE VISITA', valor: 11.50, notas: '' },
  { data: '11/2025', mes: 'Novembro', item: 'LUZ LOJA', valor: 16.96, notas: '' },
  // Dezembro
  { data: '12/2025', mes: 'Dezembro', item: 'RENDA LOJA', valor: 200, notas: '' },
  { data: '12/2025', mes: 'Dezembro', item: 'HOTSPOT INTERNET', valor: 20, notas: '' },
  { data: '12/2025', mes: 'Dezembro', item: 'LUZ LOJA', valor: 20, notas: '' },
  { data: '12/2025', mes: 'Dezembro', item: 'EQUIPAMENTO / OUTROS', valor: 1840.83, notas: '' },
]

const RESUMO_2025 = [
  { mes: 'Janeiro',   receitas: 0,      despesas: 336.68  },
  { mes: 'Fevereiro', receitas: 1000,   despesas: 2178.50 },
  { mes: 'Março',     receitas: 200,    despesas: 567.78  },
  { mes: 'Abril',     receitas: 1550,   despesas: 1901.81 },
  { mes: 'Maio',      receitas: 5445,   despesas: 1780.62 },
  { mes: 'Junho',     receitas: 5155,   despesas: 1014.73 },
  { mes: 'Julho',     receitas: 3250,   despesas: 1389.11 },
  { mes: 'Agosto',    receitas: 7530,   despesas: 2272.82 },
  { mes: 'Setembro',  receitas: 5350,   despesas: 1428.28 },
  { mes: 'Outubro',   receitas: 5550,   despesas: 1074.25 },
  { mes: 'Novembro',  receitas: 680,    despesas: 1174.14 },
  { mes: 'Dezembro',  receitas: 700,    despesas: 2080.83 },
]

const TIPO_CLS: Record<string, string> = {
  'CASAMENTO':   'bg-gold/10 text-gold/80 border-gold/20',
  'BATIZADO':    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'CORPORATIVO': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'SESSÃO':      'bg-green-500/10 text-green-400 border-green-500/20',
}

function fmt(n: number) {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const ORDEM_MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function groupByMes<T extends { mes: string }>(arr: T[]): { mes: string; items: T[] }[] {
  const map = new Map<string, T[]>()
  for (const item of arr) {
    if (!map.has(item.mes)) map.set(item.mes, [])
    map.get(item.mes)!.push(item)
  }
  return ORDEM_MESES
    .filter(m => map.has(m))
    .map(m => ({ mes: m, items: map.get(m)! }))
}

export default function FinancasAnoPage() {
  const [tab, setTab] = useState<'resumo' | 'receitas' | 'despesas'>('resumo')

  const totalReceitas = RECEITAS_2025.reduce((s, r) => s + r.valor, 0)
  const totalDespesas = DESPESAS_2025.reduce((s, d) => s + d.valor, 0)
  const saldo = totalReceitas - totalDespesas

  const receitasPorMes  = groupByMes(RECEITAS_2025)
  const despesasPorMes  = groupByMes(DESPESAS_2025)

  return (
    <main className="min-h-screen px-4 py-12 max-w-5xl mx-auto">
      <Link href="/financas-gerais" className="inline-flex items-center gap-2 text-xs tracking-widest text-white/40 hover:text-gold transition-colors mb-10">
        ‹ FINANÇAS GERAIS
      </Link>

      <header className="mb-10">
        <p className="text-xs tracking-[0.4em] text-white/30 uppercase mb-1">RL PHOTO.VIDEO</p>
        <h1 className="text-2xl font-light tracking-widest text-gold uppercase">Finanças 2025</h1>
        <div className="mt-3 h-px w-16 bg-gold/40" />
      </header>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase mb-2">Total Receitas</p>
          <p className="text-3xl font-light text-green-400">{fmt(totalReceitas)} <span className="text-green-400/40 text-lg">€</span></p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase mb-2">Total Despesas</p>
          <p className="text-3xl font-light text-red-400">{fmt(totalDespesas)} <span className="text-red-400/40 text-lg">€</span></p>
        </div>
        <div className={`rounded-2xl border p-6 ${saldo >= 0 ? 'border-gold/30 bg-gold/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase mb-2">Saldo</p>
          <p className={`text-3xl font-light ${saldo >= 0 ? 'text-gold' : 'text-red-400'}`}>{fmt(saldo)} <span className="text-lg opacity-50">€</span></p>
          <p className={`text-[10px] tracking-widest uppercase mt-1 ${saldo >= 0 ? 'text-gold/40' : 'text-red-400/40'}`}>{saldo >= 0 ? 'Saldo Positivo' : 'Saldo Negativo'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-white/[0.06]">
        {(['resumo', 'receitas', 'despesas'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-xs tracking-[0.25em] uppercase transition-colors ${tab === t ? 'text-gold border-b-2 border-gold -mb-px' : 'text-white/30 hover:text-white/60'}`}>
            {t === 'resumo' ? 'Resumo Mensal' : t === 'receitas' ? `Receitas (${RECEITAS_2025.length})` : `Despesas (${DESPESAS_2025.length})`}
          </button>
        ))}
      </div>

      {/* RESUMO */}
      {tab === 'resumo' && (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-[10px] tracking-[0.3em] text-white/30 uppercase font-normal">Mês</th>
                <th className="text-right px-5 py-3 text-[10px] tracking-[0.3em] text-green-400/60 uppercase font-normal">Receitas</th>
                <th className="text-right px-5 py-3 text-[10px] tracking-[0.3em] text-red-400/60 uppercase font-normal">Despesas</th>
                <th className="text-right px-5 py-3 text-[10px] tracking-[0.3em] text-white/30 uppercase font-normal">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {RESUMO_2025.map((r, i) => {
                const s = r.receitas - r.despesas
                return (
                  <tr key={r.mes} className={`border-b border-white/[0.04] ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-5 py-3 text-white/70">{r.mes}</td>
                    <td className="px-5 py-3 text-right text-green-400/80 font-mono">{fmt(r.receitas)} €</td>
                    <td className="px-5 py-3 text-right text-red-400/80 font-mono">{fmt(r.despesas)} €</td>
                    <td className={`px-5 py-3 text-right font-mono font-semibold ${s >= 0 ? 'text-gold' : 'text-red-400'}`}>
                      {s >= 0 ? '+' : ''}{fmt(s)} €
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/[0.1] bg-white/[0.03]">
                <td className="px-5 py-3 text-[10px] tracking-[0.3em] text-white/40 uppercase font-semibold">Total</td>
                <td className="px-5 py-3 text-right text-green-400 font-mono font-bold">{fmt(totalReceitas)} €</td>
                <td className="px-5 py-3 text-right text-red-400 font-mono font-bold">{fmt(totalDespesas)} €</td>
                <td className={`px-5 py-3 text-right font-mono font-bold ${saldo >= 0 ? 'text-gold' : 'text-red-400'}`}>{saldo >= 0 ? '+' : ''}{fmt(saldo)} €</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* RECEITAS por mês */}
      {tab === 'receitas' && (
        <div className="space-y-6">
          {receitasPorMes.map(({ mes, items }) => {
            const subtotal = items.reduce((s, r) => s + r.valor, 0)
            return (
              <div key={mes} className="rounded-2xl border border-white/[0.06] overflow-hidden">
                {/* Cabeçalho do mês */}
                <div className="flex items-center justify-between px-5 py-3 bg-white/[0.03] border-b border-white/[0.06]">
                  <span className="text-xs tracking-[0.35em] text-white/60 uppercase font-medium">{mes}</span>
                  <span className="text-sm font-mono font-semibold text-green-400">{fmt(subtotal)} €</span>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {items.map((r, i) => (
                      <tr key={i} className={`border-b border-white/[0.04] last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                        <td className="px-4 py-2.5 text-white/35 font-mono text-xs w-24">{r.data}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${TIPO_CLS[r.tipo] ?? 'bg-white/10 text-white/40 border-white/20'}`}>{r.tipo}</span>
                        </td>
                        <td className="px-4 py-2.5 text-white/40 text-xs hidden sm:table-cell">{r.info}</td>
                        <td className="px-4 py-2.5 text-right text-green-400 font-mono font-semibold whitespace-nowrap">{fmt(r.valor)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
          {/* Total geral */}
          <div className="flex items-center justify-between px-5 py-4 rounded-2xl border border-green-500/20 bg-green-500/5">
            <span className="text-xs tracking-[0.35em] text-white/40 uppercase">Total Receitas 2025</span>
            <span className="text-xl font-mono font-bold text-green-400">{fmt(totalReceitas)} €</span>
          </div>
        </div>
      )}

      {/* DESPESAS por mês */}
      {tab === 'despesas' && (
        <div className="space-y-6">
          {despesasPorMes.map(({ mes, items }) => {
            const subtotal = items.reduce((s, d) => s + d.valor, 0)
            return (
              <div key={mes} className="rounded-2xl border border-white/[0.06] overflow-hidden">
                {/* Cabeçalho do mês */}
                <div className="flex items-center justify-between px-5 py-3 bg-white/[0.03] border-b border-white/[0.06]">
                  <span className="text-xs tracking-[0.35em] text-white/60 uppercase font-medium">{mes}</span>
                  <span className="text-sm font-mono font-semibold text-red-400">{fmt(subtotal)} €</span>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {items.map((d, i) => (
                      <tr key={i} className={`border-b border-white/[0.04] last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                        <td className="px-4 py-2.5 text-white/70 text-xs font-medium">{d.item}</td>
                        <td className="px-4 py-2.5 text-white/30 text-xs hidden sm:table-cell">{d.notas}</td>
                        <td className="px-4 py-2.5 text-right text-red-400 font-mono font-semibold whitespace-nowrap">{fmt(d.valor)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
          {/* Total geral */}
          <div className="flex items-center justify-between px-5 py-4 rounded-2xl border border-red-500/20 bg-red-500/5">
            <span className="text-xs tracking-[0.35em] text-white/40 uppercase">Total Despesas 2025</span>
            <span className="text-xl font-mono font-bold text-red-400">{fmt(totalDespesas)} €</span>
          </div>
        </div>
      )}
    </main>
  )
}
