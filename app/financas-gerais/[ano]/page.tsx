'use client'

import Link from 'next/link'
import { useState, useEffect, use } from 'react'
import { ComposedChart, BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, ReferenceLine } from 'recharts'

// ─── DADOS BASE 2025 ───────────────────────────────────────────────────────────

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

const RECEITAS_2026 = [
  { data: '21/01/2026', mes: 'Janeiro', tipo: 'CASAMENTO', valor: 600, info: 'ANA E EDNEY (ACERTO FINAL)' },
  { data: '22/01/2026', mes: 'Janeiro', tipo: 'CORPORATIVO', valor: 750, info: 'ARRAIALZINHO' },
  { data: '29/01/2026', mes: 'Janeiro', tipo: 'CORPORATIVO', valor: 100, info: 'SITE KAPPA (CAPÃO)' },
  { data: '12/02/2026', mes: 'Fevereiro', tipo: 'CORPORATIVO', valor: 600, info: 'ANIVERSÁRIO 2026/02/28' },
  { data: '13/02/2026', mes: 'Fevereiro', tipo: 'CORPORATIVO', valor: 198.59, info: 'Domínio e mudança de site PLÁTANOS' },
  { data: '21/02/2026', mes: 'Fevereiro', tipo: 'CASAMENTO', valor: 80, info: 'TOTAL SERVIÇO=150€' },
  { data: '28/02/2026', mes: 'Fevereiro', tipo: 'CASAMENTO', valor: 500, info: 'CASAMENTO 31/01/2026' },
  { data: '07/03/2026', mes: 'Março', tipo: 'CASAMENTO', valor: 150, info: 'Plataforma Fotos+Vídeos 05/07/2025' },
  { data: '08/03/2026', mes: 'Março', tipo: 'CASAMENTO', valor: 55, info: 'FOTOS IMPRESSAS - Sra. D.Fátima Ricardo' },
  { data: '10/03/2026', mes: 'Março', tipo: 'CASAMENTO', valor: 5, info: 'FOTO DIGITAL - Sra. Mihaela Mudric' },
]

const DESPESAS_2026 = [
  // Janeiro
  { data: '05/01/2026', mes: 'Janeiro', item: 'MAXMAT (RIPAS MADEIRA)', valor: 50.17, notas: '' },
  { data: '05/01/2026', mes: 'Janeiro', item: 'MOTIONARRA MOTION', valor: 29.51, notas: '' },
  { data: '07/01/2026', mes: 'Janeiro', item: 'RENDA ESTÚDIO', valor: 320, notas: '' },
  { data: '09/01/2026', mes: 'Janeiro', item: 'LEROY MERLIN', valor: 105.16, notas: '' },
  { data: '12/01/2026', mes: 'Janeiro', item: 'MAXMAT', valor: 37.93, notas: '' },
  { data: '14/01/2026', mes: 'Janeiro', item: 'ESTADIA PORTO', valor: 50.85, notas: 'Mentoria João Seagull' },
  { data: '14/01/2026', mes: 'Janeiro', item: 'EXPRESSO LX', valor: 15.46, notas: 'Mentoria João Seagull' },
  { data: '14/01/2026', mes: 'Janeiro', item: 'VOO PORTO', valor: 45.22, notas: 'Mentoria João Seagull' },
  { data: '14/01/2026', mes: 'Janeiro', item: 'IKEA', valor: 129.90, notas: '' },
  { data: '15/01/2026', mes: 'Janeiro', item: 'INTERNET HOTSPOT', valor: 20, notas: '' },
  { data: '19/01/2026', mes: 'Janeiro', item: 'CARTÕES DE VISITA', valor: 20, notas: '' },
  { data: '20/01/2026', mes: 'Janeiro', item: 'LUZ ESTÚDIO', valor: 10.80, notas: '' },
  { data: '24/01/2026', mes: 'Janeiro', item: 'DOMINIO SITE (RL MEDIA)', valor: 48.59, notas: '' },
  { data: '31/01/2026', mes: 'Janeiro', item: 'DOMINIO SITE (KAPPA)', valor: 48.59, notas: '' },
  { data: '31/01/2026', mes: 'Janeiro', item: 'ESTACIONAMENTO LISBOA', valor: 5, notas: 'Mentoria João Seagull' },
  { data: '31/01/2026', mes: 'Janeiro', item: 'ALIMENTAÇÃO PORTO', valor: 7.48, notas: 'Mentoria João Seagull' },
  { data: '31/01/2026', mes: 'Janeiro', item: 'UBER', valor: 7.62, notas: 'Mentoria João Seagull' },
  // Fevereiro
  { data: '05/02/2026', mes: 'Fevereiro', item: 'RENDA ESTÚDIO', valor: 320, notas: '' },
  { data: '08/02/2026', mes: 'Fevereiro', item: 'MICROFONE', valor: 60, notas: 'Em 2ª mão' },
  { data: '16/02/2026', mes: 'Fevereiro', item: 'DOMÍNIO SITE (PLÁTANOS)', valor: 48.59, notas: '' },
  { data: '17/02/2026', mes: 'Fevereiro', item: 'PLATAFORMA CASAMENTOS.PT', valor: 920, notas: '' },
  { data: '18/02/2026', mes: 'Fevereiro', item: 'INTERNET HOTSPOT', valor: 20, notas: '' },
  { data: '25/02/2026', mes: 'Fevereiro', item: 'VIDFLOW', valor: 30.83, notas: '' },
  { data: '28/02/2026', mes: 'Fevereiro', item: 'COMISSÃO ANA LAGUS RESORT', valor: 150, notas: '' },
  // Março
  { data: '01/03/2026', mes: 'Março', item: 'RENDA ESTÚDIO', valor: 320, notas: 'DESPESA FIXA' },
  { data: '02/03/2026', mes: 'Março', item: 'CTT', valor: 5.28, notas: '' },
  { data: '03/03/2026', mes: 'Março', item: 'NOTION (AVENÇA MENSAL)', valor: 28.91, notas: '' },
  { data: '10/03/2026', mes: 'Março', item: 'AMAZON (Discos+rato+cartões)', valor: 734.85, notas: '2x12TB+1x4TB, rato ergonómico, cartões' },
  { data: '12/03/2026', mes: 'Março', item: 'EDIÇÃO NVS FILMS', valor: 150, notas: 'CAS_08/08/25_SoniaEDiogo' },
  { data: '13/03/2026', mes: 'Março', item: 'AMAZON (Diversos)', valor: 97.48, notas: '' },
  { data: '13/03/2026', mes: 'Março', item: 'AMAZON (Microfones lapela)', valor: 34.43, notas: '' },
  { data: '13/03/2026', mes: 'Março', item: 'MICROS LAPELA BRANCOS', valor: 30, notas: '' },
  { data: '17/03/2026', mes: 'Março', item: 'MENTORIA JOÃO SEAGULL', valor: 3800, notas: '' },
  { data: '17/03/2026', mes: 'Março', item: 'SEGURO RC', valor: 64.72, notas: 'ANUAL' },
  { data: '17/03/2026', mes: 'Março', item: 'LUZ ESTÚDIO', valor: 40.38, notas: '' },
  { data: '18/03/2026', mes: 'Março', item: 'FILMMAKERSSUMMIT', valor: 87.08, notas: '' },
  { data: '18/03/2026', mes: 'Março', item: 'INTERNET HOTSPOT', valor: 20, notas: '' },
  { data: '26/03/2026', mes: 'Março', item: 'EDIÇÃO NVS FILMS', valor: 150, notas: '' },
  { data: '30/03/2026', mes: 'Março', item: 'CHAT GPT SUBSCRIÇÃO', valor: 7.99, notas: '' },
  // Abril
  { data: '01/04/2026', mes: 'Abril', item: 'CLAUDE', valor: 22.14, notas: '' },
  { data: '02/04/2026', mes: 'Abril', item: 'CP (PALESTRA J.SEAGULL PORTO)', valor: 42, notas: '' },
  { data: '07/04/2026', mes: 'Abril', item: 'ESTACIONAMENTO LX', valor: 5, notas: 'Palestra João Seagull' },
  { data: '07/04/2026', mes: 'Abril', item: 'CP (PALESTRA J.SEAGULL PORTO)', valor: 18.70, notas: '' },
  { data: '08/04/2026', mes: 'Abril', item: 'TOKENS IA', valor: 205.84, notas: '' },
  { data: '08/04/2026', mes: 'Abril', item: 'RENDA ESTÚDIO', valor: 320, notas: '' },
  { data: '10/04/2026', mes: 'Abril', item: 'EDIÇÃO JOSÉ SOUZA', valor: 150, notas: '' },
  { data: '11/04/2026', mes: 'Abril', item: 'INTERNET HOTSPOT', valor: 20, notas: '' },
  { data: '11/04/2026', mes: 'Abril', item: 'LUZ ESTÚDIO', valor: 19.94, notas: '' },
]

const DATA_BY_ANO: Record<number, { receitas: typeof RECEITAS_2025; despesas: typeof DESPESAS_2025 }> = {
  2025: { receitas: RECEITAS_2025, despesas: DESPESAS_2025 },
  2026: { receitas: RECEITAS_2026 as any, despesas: DESPESAS_2026 as any },
}

const PIE_COLORS: Record<string, string> = {
  'CASAMENTO':   '#c9a84c',
  'BATIZADO':    '#60a5fa',
  'CORPORATIVO': '#a78bfa',
  'SESSÃO':      '#4ade80',
  'OUTRO':       '#6b7280',
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────

const ORDEM_MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const TIPOS_RECEITA = ['CASAMENTO', 'BATIZADO', 'CORPORATIVO', 'SESSÃO', 'OUTRO']

const TIPO_CLS: Record<string, string> = {
  'CASAMENTO':   'bg-gold/10 text-gold/80 border-gold/20',
  'BATIZADO':    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'CORPORATIVO': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'SESSÃO':      'bg-green-500/10 text-green-400 border-green-500/20',
  'OUTRO':       'bg-white/10 text-white/50 border-white/20',
}

function fmt(n: number) {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function groupByMes<T extends { mes: string }>(arr: T[]): { mes: string; items: T[] }[] {
  const map = new Map<string, T[]>()
  for (const item of arr) {
    if (!map.has(item.mes)) map.set(item.mes, [])
    map.get(item.mes)!.push(item)
  }
  return ORDEM_MESES.filter(m => map.has(m)).map(m => ({ mes: m, items: map.get(m)! }))
}

function mapEvents(events: any[]): ReceitaRow[] {
  const MES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  return events
    .filter((e: any) => e.data_evento)
    .map((e: any) => {
      const dt   = new Date(e.data_evento)
      const mes  = MES[dt.getMonth()]
      const tipos: string[] = (() => { try { return JSON.parse(e.tipo_evento || '[]') } catch { return [] } })()
      const tipo = tipos[0] ?? 'CASAMENTO'
      const valor = e.valor_liquido ?? 0
      const dataFmt = `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
      return { data: dataFmt, mes, tipo, valor, info: e.cliente ?? '' }
    })
    .filter((r: ReceitaRow) => r.valor > 0)
}

// ─── CUSTOS FIXOS ANUAIS — dados por defeito ───────────────────────────────────

type CustoFixo = { id: string; item: string; valor: number }

const DEFAULT_CUSTOS_FIXOS: Record<number, CustoFixo[]> = {
  2025: [
    { id: 'cf25-1', item: 'WFOLIO', valor: 80 },
    { id: 'cf25-2', item: 'HOSTINGER ALOJAMENTO', valor: 150 },
    { id: 'cf25-3', item: 'DOMINIO AMEN.PT', valor: 50 },
    { id: 'cf25-4', item: 'SEGURO RC PROFISSIONAL', valor: 259 },
  ],
  2026: [
    { id: 'cf26-1', item: 'WFOLIO', valor: 80 },
    { id: 'cf26-2', item: 'HOSTINGER ALOJAMENTO', valor: 150 },
    { id: 'cf26-3', item: 'DOMINIO AMEN.PT (X2)', valor: 100 },
    { id: 'cf26-4', item: 'SEGURO RC PROFISSIONAL', valor: 259 },
    { id: 'cf26-5', item: 'NOTION', valor: 120 },
    { id: 'cf26-6', item: 'DISCOS NAS 2', valor: 800 },
    { id: 'cf26-7', item: 'SMASH', valor: 100 },
    { id: 'cf26-8', item: 'PLATAFORMA "CASAMENTOS.PT"', valor: 920 },
    { id: 'cf26-9', item: 'COMISSÕES QUINTAS PARCEIRAS', valor: 300 },
  ],
}

// ─── TIPOS ─────────────────────────────────────────────────────────────────────

type DbEntry = {
  id: string
  ano: number
  tipo: 'receita' | 'despesa'
  data: string
  mes: string
  categoria: string
  valor: number
  info: string
}

type ReceitaRow = { _id?: string; data: string; mes: string; tipo: string; valor: number; info: string }
type DespesaRow = { _id?: string; data: string; mes: string; item: string; valor: number; notas: string }

type Props = { params: Promise<{ ano: string }> }

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function FinancasAnoPage({ params }: Props) {
  const { ano } = use(params)
  const anoNum = parseInt(ano)

  const [tab, setTab]                   = useState<'resumo' | 'receitas' | 'despesas' | 'comparação'>('resumo')
  const [dbEntries, setDbEntries]       = useState<DbEntry[]>([])
  const [eventReceitas, setEventReceitas]   = useState<ReceitaRow[]>([])
  const [prevYearReceitas, setPrevYearReceitas] = useState<ReceitaRow[]>([])
  const [prevYearDespesas, setPrevYearDespesas] = useState<DespesaRow[]>([])
  const [metaMensal, setMetaMensal]     = useState<number>(0)
  const [modalOpen, setModalOpen]       = useState(false)
  const [formTipo, setFormTipo]         = useState<'receita' | 'despesa'>('receita')
  const [fMes, setFMes]                 = useState('Janeiro')
  const [fData, setFData]               = useState('')
  const [fCategoria, setFCategoria]     = useState('CASAMENTO')
  const [fItem, setFItem]               = useState('')
  const [fValor, setFValor]             = useState('')
  const [fInfo, setFInfo]               = useState('')
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState<string | null>(null)
  // Custos fixos anuais
  const [custosFixosAnuais, setCustosFixosAnuais] = useState<CustoFixo[]>([])
  const [cfModalOpen, setCfModalOpen]   = useState(false)
  const [cfItem, setCfItem]             = useState('')
  const [cfValor, setCfValor]           = useState('')

  useEffect(() => {
    // Meta mensal from localStorage
    const saved = localStorage.getItem(`meta-mensal-${anoNum}`)
    if (saved) setMetaMensal(parseFloat(saved) || 0)

    // Custos fixos anuais from localStorage (com defaults pré-carregados)
    const savedCF = localStorage.getItem(`custos-fixos-${anoNum}`)
    if (savedCF) {
      try { setCustosFixosAnuais(JSON.parse(savedCF)) } catch {}
    } else if (DEFAULT_CUSTOS_FIXOS[anoNum]) {
      setCustosFixosAnuais(DEFAULT_CUSTOS_FIXOS[anoNum])
      localStorage.setItem(`custos-fixos-${anoNum}`, JSON.stringify(DEFAULT_CUSTOS_FIXOS[anoNum]))
    }

    // DB entries
    fetch(`/api/financas-gerais?ano=${anoNum}`)
      .then(r => r.json())
      .then(d => setDbEntries(d.entries ?? []))

    // Para 2026+ as receitas vêm dos eventos (mesma fonte que /eventos-2026)
    if (anoNum >= 2026) {
      fetch(`/api/eventos-supabase?ano=${anoNum}`)
        .then(r => r.json())
        .then(d => setEventReceitas(mapEvents(d.events ?? [])))
    }

    // Dados do ano anterior para a aba de comparação
    if (anoNum >= 2026) {
      const prevAno = anoNum - 1
      if (prevAno === 2025) {
        // Usar dados hardcoded 2025
        setPrevYearReceitas(RECEITAS_2025.map(r => ({ data: r.data, mes: r.mes, tipo: r.tipo, valor: r.valor, info: r.info })))
        setPrevYearDespesas(DESPESAS_2025.map(d => ({ data: d.data, mes: d.mes, item: d.item, valor: d.valor, notas: d.notas })))
      } else {
        // Para 2027+ buscar via API
        fetch(`/api/eventos-supabase?ano=${prevAno}`)
          .then(r => r.json())
          .then(d => setPrevYearReceitas(mapEvents(d.events ?? [])))
      }
    }
  }, [anoNum])

  function handleMetaChange(val: number) {
    setMetaMensal(val)
    if (val > 0) localStorage.setItem(`meta-mensal-${anoNum}`, String(val))
    else localStorage.removeItem(`meta-mensal-${anoNum}`)
  }

  function addCustoFixo() {
    const valorNum = parseFloat(cfValor.replace(',', '.'))
    if (!cfItem.trim() || !valorNum) return
    const novo: CustoFixo = { id: `cf-${Date.now()}`, item: cfItem.trim().toUpperCase(), valor: valorNum }
    const updated = [...custosFixosAnuais, novo]
    setCustosFixosAnuais(updated)
    localStorage.setItem(`custos-fixos-${anoNum}`, JSON.stringify(updated))
    setCfItem(''); setCfValor('')
    setCfModalOpen(false)
  }

  function removeCustoFixo(id: string) {
    const updated = custosFixosAnuais.filter(c => c.id !== id)
    setCustosFixosAnuais(updated)
    localStorage.setItem(`custos-fixos-${anoNum}`, JSON.stringify(updated))
  }

  const totalCustosFixosAnuais = custosFixosAnuais.reduce((s, c) => s + c.valor, 0)

  // Base hardcoded para 2025; API de eventos para 2026+
  const baseAnual = DATA_BY_ANO[anoNum] ?? { receitas: [], despesas: [] }
  const baseReceitas: ReceitaRow[] = anoNum >= 2026
    ? eventReceitas
    : (baseAnual.receitas as any[]).map((r: any) => ({ data: r.data, mes: r.mes, tipo: r.tipo, valor: r.valor, info: r.info }))
  const baseDespesas: DespesaRow[] = (baseAnual.despesas as any[]).map((d: any) => ({ data: d.data, mes: d.mes, item: d.item, valor: d.valor, notas: d.notas }))

  // DB entries convertidas
  const dbReceitas: ReceitaRow[] = dbEntries
    .filter(e => e.tipo === 'receita')
    .map(e => ({ _id: e.id, data: e.data, mes: e.mes, tipo: e.categoria, valor: e.valor, info: e.info }))
  const dbDespesas: DespesaRow[] = dbEntries
    .filter(e => e.tipo === 'despesa')
    .map(e => ({ _id: e.id, data: e.data, mes: e.mes, item: e.categoria, valor: e.valor, notas: e.info }))

  const allReceitas = [...baseReceitas, ...dbReceitas]
  const allDespesas = [...baseDespesas, ...dbDespesas]

  const totalReceitas = allReceitas.reduce((s, r) => s + r.valor, 0)
  const totalDespesas = allDespesas.reduce((s, d) => s + d.valor, 0)
  const saldo = totalReceitas - totalDespesas

  // Resumo calculado dinamicamente
  const resumo = ORDEM_MESES
    .map(mes => ({
      mes,
      receitas: allReceitas.filter(r => r.mes === mes).reduce((s, r) => s + r.valor, 0),
      despesas: allDespesas.filter(d => d.mes === mes).reduce((s, d) => s + d.valor, 0),
    }))
    .filter(r => r.receitas > 0 || r.despesas > 0)

  const receitasPorMes = groupByMes(allReceitas)
  const despesasPorMes = groupByMes(allDespesas)

  // ── Previsão de fecho de ano ──
  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtualIdx = hoje.getMonth() // 0-based (April = 3)
  const podeProjetar = anoNum === anoAtual
  const mesesDecorridos = podeProjetar ? mesAtualIdx + 1 : (anoNum < anoAtual ? 12 : 0)
  const mesesFuturos = podeProjetar ? 12 - mesesDecorridos : 0

  const mesesComDados = resumo.filter(r => ORDEM_MESES.indexOf(r.mes) < mesesDecorridos)
  const avgRecMes = mesesComDados.length > 0
    ? mesesComDados.reduce((s, r) => s + r.receitas, 0) / mesesComDados.length : 0
  const avgDespMes = mesesComDados.length > 0
    ? mesesComDados.reduce((s, r) => s + r.despesas, 0) / mesesComDados.length : 0
  const projReceitas = totalReceitas + avgRecMes * mesesFuturos
  const projDespesas = totalDespesas + avgDespMes * mesesFuturos
  const projSaldo = projReceitas - projDespesas

  // ── Comparação com o ano anterior ──
  const prevTotalReceitas = prevYearReceitas.reduce((s, r) => s + r.valor, 0)
  const prevTotalDespesas = prevYearDespesas.reduce((s, d) => s + d.valor, 0)
  const prevSaldo = prevTotalReceitas - prevTotalDespesas

  const prevResumo = ORDEM_MESES
    .map(mes => ({
      mes,
      receitas: prevYearReceitas.filter(r => r.mes === mes).reduce((s, r) => s + r.valor, 0),
      despesas: prevYearDespesas.filter(d => d.mes === mes).reduce((s, d) => s + d.valor, 0),
    }))
    .filter(r => r.receitas > 0 || r.despesas > 0)

  // Dados para gráfico agrupado por mês (comparação)
  const comparacaoChartData = ORDEM_MESES.map(mes => {
    const obj: Record<string, any> = { mes: mes.slice(0, 3) }
    obj[String(anoNum - 1)] = prevYearReceitas.filter(r => r.mes === mes).reduce((s, r) => s + r.valor, 0)
    obj[String(anoNum)]     = allReceitas.filter(r => r.mes === mes).reduce((s, r) => s + r.valor, 0)
    return obj
  }).filter(d => (d[String(anoNum - 1)] as number) > 0 || (d[String(anoNum)] as number) > 0)

  // Meses acima da meta
  const mesesAcimaMeta = metaMensal > 0 ? resumo.filter(r => r.receitas >= metaMensal).length : 0

  function openModal(tipo: 'receita' | 'despesa', mesPrefill?: string) {
    setFormTipo(tipo)
    setFMes(mesPrefill ?? 'Janeiro'); setFData(''); setFCategoria('CASAMENTO')
    setFItem(''); setFValor(''); setFInfo('')
    setModalOpen(true)
  }

  async function handleSave() {
    const valorNum = parseFloat(fValor.replace(',', '.'))
    if (!fMes || !valorNum) return
    setSaving(true)
    const payload = {
      ano: anoNum, tipo: formTipo, mes: fMes, data: fData,
      categoria: formTipo === 'receita' ? fCategoria : fItem,
      valor: valorNum, info: fInfo,
    }
    const res = await fetch('/api/financas-gerais', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const d = await res.json()
    if (d.entry) setDbEntries(prev => [...prev, d.entry])
    setSaving(false)
    setModalOpen(false)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch(`/api/financas-gerais?id=${id}`, { method: 'DELETE' })
    setDbEntries(prev => prev.filter(e => e.id !== id))
    setDeleting(null)
  }

  return (
    <main className="min-h-screen px-4 py-12 max-w-5xl mx-auto">
      <Link href="/financas-gerais" className="inline-flex items-center gap-2 text-xs tracking-widest text-white/40 hover:text-gold transition-colors mb-10">
        ‹ FINANÇAS GERAIS
      </Link>

      <header className="mb-10">
        <p className="text-xs tracking-[0.4em] text-white/30 uppercase mb-1">RL PHOTO.VIDEO</p>
        <h1 className="text-2xl font-light tracking-widest text-gold uppercase">Finanças {ano}</h1>
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
      <div className="flex items-center justify-between mb-8 border-b border-white/[0.06]">
        <div className="flex gap-1 flex-wrap">
          {(['resumo', 'receitas', 'despesas'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs tracking-[0.25em] uppercase transition-colors ${tab === t ? 'text-gold border-b-2 border-gold -mb-px' : 'text-white/30 hover:text-white/60'}`}>
              {t === 'resumo' ? 'Resumo' : t === 'receitas' ? `Receitas (${allReceitas.length})` : `Despesas (${allDespesas.length})`}
            </button>
          ))}
          {anoNum >= 2026 && (
            <button onClick={() => setTab('comparação')}
              className={`px-4 py-2.5 text-xs tracking-[0.25em] uppercase transition-colors ${tab === 'comparação' ? 'text-gold border-b-2 border-gold -mb-px' : 'text-white/30 hover:text-white/60'}`}>
              {anoNum - 1} vs {anoNum}
            </button>
          )}
        </div>

        {/* Botão Adicionar */}
        {(tab === 'receitas' || tab === 'despesas') && (
          <button
            onClick={() => openModal(tab === 'receitas' ? 'receita' : 'despesa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs tracking-widest uppercase transition-all border ${
              tab === 'receitas'
                ? 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
            }`}
          >
            <span className="text-base leading-none">+</span>
            {tab === 'receitas' ? 'Receita' : 'Despesa'}
          </button>
        )}
      </div>

      {/* ── RESUMO ── */}
      {tab === 'resumo' && (
        <div className="space-y-6">
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
                {resumo.map((r, i) => {
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

          {/* ── Previsão de Fecho de Ano ── */}
          {podeProjetar && mesesFuturos > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase">Previsão de Fecho de Ano</p>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              <p className="text-[10px] text-white/20 text-center">
                Baseado na média dos últimos {mesesDecorridos} {mesesDecorridos === 1 ? 'mês' : 'meses'} · {mesesFuturos} {mesesFuturos === 1 ? 'mês restante' : 'meses restantes'} a projetar
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                  <p className="text-[9px] tracking-[0.3em] text-green-400/50 uppercase mb-1">Receitas Previstas</p>
                  <p className="text-2xl font-light text-green-400">{fmt(projReceitas)}</p>
                  <p className="text-[9px] text-green-400/30 mt-1">€ no final do ano</p>
                  <p className="text-[9px] text-white/20 mt-2">média {fmt(avgRecMes)} €/mês</p>
                </div>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                  <p className="text-[9px] tracking-[0.3em] text-red-400/50 uppercase mb-1">Despesas Previstas</p>
                  <p className="text-2xl font-light text-red-400">{fmt(projDespesas)}</p>
                  <p className="text-[9px] text-red-400/30 mt-1">€ no final do ano</p>
                  <p className="text-[9px] text-white/20 mt-2">média {fmt(avgDespMes)} €/mês</p>
                </div>
                <div className={`rounded-2xl border p-5 ${projSaldo >= 0 ? 'border-gold/30 bg-gold/5' : 'border-red-500/30 bg-red-500/5'}`}>
                  <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Saldo Previsto</p>
                  <p className={`text-2xl font-light ${projSaldo >= 0 ? 'text-gold' : 'text-red-400'}`}>{projSaldo >= 0 ? '+' : ''}{fmt(projSaldo)}</p>
                  <p className={`text-[9px] mt-1 ${projSaldo >= 0 ? 'text-gold/30' : 'text-red-400/30'}`}>€ no final do ano</p>
                  <p className="text-[9px] text-white/20 mt-2 italic">estimativa linear</p>
                </div>
              </div>
            </div>
          )}

          {/* Badge ano completo */}
          {anoNum < anoAtual && (
            <div className="flex items-center justify-center gap-2 py-3">
              <span className="text-[10px] tracking-[0.3em] text-gold/40 uppercase px-4 py-1.5 border border-gold/20 rounded-full">
                ✓ Ano Completo
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── RECEITAS por mês ── */}
      {tab === 'receitas' && (
        <div className="space-y-6">

          {/* Meta Mensal */}
          <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.01] px-5 py-3.5">
            <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase flex-1">Meta Mensal</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={metaMensal || ''}
                onChange={e => handleMetaChange(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-28 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white font-mono text-right placeholder-white/20 focus:outline-none focus:border-gold/40 transition-colors"
              />
              <span className="text-white/30 text-sm">€ / mês</span>
            </div>
            {metaMensal > 0 && resumo.length > 0 && (
              <span className={`text-[10px] tracking-wider px-3 py-1 rounded-full border ${
                mesesAcimaMeta >= resumo.length / 2
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-orange-500/30 bg-orange-500/10 text-orange-400'
              }`}>
                {mesesAcimaMeta}/{resumo.length} meses ✓
              </span>
            )}
          </div>

          {/* Gráfico — barras verdes + linha acumulada dourada */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase">Receitas por Mês</p>
              <div className="flex items-center gap-4 flex-wrap justify-end">
                <span className="flex items-center gap-1.5 text-[10px] text-white/30"><span className="w-3 h-3 rounded-sm bg-green-400/70 inline-block" /> Mensal</span>
                <span className="flex items-center gap-1.5 text-[10px] text-white/30"><span className="w-4 h-px bg-gold inline-block" /> Acumulado</span>
                {metaMensal > 0 && <span className="flex items-center gap-1.5 text-[10px] text-white/30"><span className="w-4 h-px border-t border-dashed border-gold/60 inline-block" /> Meta</span>}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={resumo.map((r, i, arr) => ({
                mes: r.mes.slice(0,3),
                mensal: r.receitas,
                acumulado: arr.slice(0, i+1).reduce((s, x) => s + x.receitas, 0),
              }))} barCategoryGap="35%">
                <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="bar" hide />
                <YAxis yAxisId="line" hide />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontSize: 11 }}
                  formatter={(v: number, name: string) => [
                    `${v.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €`,
                    name === 'mensal' ? 'Mês' : 'Acumulado'
                  ]}
                />
                {metaMensal > 0 && (
                  <ReferenceLine
                    yAxisId="bar"
                    y={metaMensal}
                    stroke="rgba(201,168,76,0.55)"
                    strokeDasharray="5 4"
                    label={{ value: `Meta ${fmt(metaMensal)} €`, fill: 'rgba(201,168,76,0.5)', fontSize: 9, position: 'insideTopRight' }}
                  />
                )}
                <Bar yAxisId="bar" dataKey="mensal" radius={[6,6,0,0]}>
                  {resumo.map((r, i) => (
                    <Cell
                      key={i}
                      fill={metaMensal > 0 && r.receitas >= metaMensal ? 'rgba(74,222,128,0.85)' : 'rgba(74,222,128,0.55)'}
                    />
                  ))}
                </Bar>
                <Line yAxisId="line" dataKey="acumulado" type="monotone" stroke="#c9a84c" strokeWidth={2} dot={{ fill: '#c9a84c', r: 3, strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Donut — breakdown por tipo */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
            <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase mb-4">Receitas por Tipo</p>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={TIPOS_RECEITA
                      .map(tipo => ({ nome: tipo, valor: allReceitas.filter(r => r.tipo === tipo).reduce((s, r) => s + r.valor, 0) }))
                      .filter(d => d.valor > 0)}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75}
                    dataKey="valor" nameKey="nome"
                  >
                    {TIPOS_RECEITA
                      .map(tipo => ({ nome: tipo, valor: allReceitas.filter(r => r.tipo === tipo).reduce((s, r) => s + r.valor, 0) }))
                      .filter(d => d.valor > 0)
                      .map((entry, i) => (
                        <Cell key={i} fill={PIE_COLORS[entry.nome] ?? '#6b7280'} opacity={0.8} />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number, name: string) => [`${v.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {TIPOS_RECEITA
                  .map(tipo => ({ tipo, valor: allReceitas.filter(r => r.tipo === tipo).reduce((s, r) => s + r.valor, 0) }))
                  .filter(d => d.valor > 0)
                  .sort((a, b) => b.valor - a.valor)
                  .map(d => (
                    <div key={d.tipo}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span style={{ color: PIE_COLORS[d.tipo] }} className="tracking-wider">{d.tipo}</span>
                        <span className="text-white/40 font-mono">{fmt(d.valor)} € · {Math.round(d.valor / totalReceitas * 100)}%</span>
                      </div>
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${d.valor / totalReceitas * 100}%`, backgroundColor: PIE_COLORS[d.tipo], opacity: 0.7 }} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {receitasPorMes.map(({ mes, items }) => {
            const subtotal = items.reduce((s, r) => s + r.valor, 0)
            return (
              <div key={mes} className="rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-white/[0.03] border-b border-white/[0.06]">
                  <span className="text-xs tracking-[0.35em] text-white/60 uppercase font-medium">{mes}</span>
                  <div className="flex items-center gap-3">
                    {metaMensal > 0 && (
                      <span className={`text-[9px] tracking-wider px-2 py-0.5 rounded-full ${subtotal >= metaMensal ? 'text-green-400/70 bg-green-500/10' : 'text-orange-400/70 bg-orange-500/10'}`}>
                        {subtotal >= metaMensal ? '✓ meta' : `${fmt(metaMensal - subtotal)} € p/ meta`}
                      </span>
                    )}
                    <span className="text-sm font-mono font-semibold text-green-400">{fmt(subtotal)} €</span>
                    <button
                      onClick={() => openModal('receita', mes)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/25 hover:border-green-500/50 transition-all text-lg leading-none"
                      title={`Adicionar receita em ${mes}`}
                    >+</button>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {items.map((r, i) => (
                      <tr key={i} className={`border-b border-white/[0.04] last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'} group`}>
                        <td className="px-4 py-2.5 text-white/35 font-mono text-xs w-24">{r.data}</td>
                        <td className="px-4 py-2.5 w-28">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${TIPO_CLS[r.tipo] ?? 'bg-white/10 text-white/40 border-white/20'}`}>{r.tipo}</span>
                        </td>
                        <td className="px-4 py-2.5 text-white/40 text-xs">{r.info}</td>
                        <td className="px-4 py-2.5 text-right text-green-400 font-mono font-semibold whitespace-nowrap">
                          {fmt(r.valor)} €
                        </td>
                        <td className="px-4 py-2.5 w-10 text-right">
                          {r._id ? (
                            <button
                              onClick={() => handleDelete(r._id!)}
                              disabled={deleting === r._id}
                              className="text-white/20 hover:text-red-400 transition-colors text-base opacity-0 group-hover:opacity-100 disabled:opacity-50"
                              title="Apagar"
                            >
                              {deleting === r._id ? '…' : '×'}
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}

          {/* Meses ainda sem receitas — botões para adicionar */}
          {ORDEM_MESES.filter(m => !receitasPorMes.find(g => g.mes === m)).length > 0 && (
            <div>
              <p className="text-[10px] tracking-[0.3em] text-white/20 uppercase mb-3">Adicionar noutro mês</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {ORDEM_MESES.filter(m => !receitasPorMes.find(g => g.mes === m)).map(mes => (
                  <button
                    key={mes}
                    onClick={() => openModal('receita', mes)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-dashed border-white/[0.08] text-white/25 hover:border-green-500/30 hover:text-green-400/60 hover:bg-green-500/5 transition-all text-xs tracking-wider"
                  >
                    <span className="text-sm leading-none">+</span>{mes.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-5 py-4 rounded-2xl border border-green-500/20 bg-green-500/5">
            <span className="text-xs tracking-[0.35em] text-white/40 uppercase">Total Receitas {ano}</span>
            <span className="text-xl font-mono font-bold text-green-400">{fmt(totalReceitas)} €</span>
          </div>
        </div>
      )}

      {/* ── DESPESAS por mês ── */}
      {tab === 'despesas' && (
        <div className="space-y-6">

          {/* ── Custos Fixos Anuais ── */}
          <div className="rounded-2xl border border-orange-500/25 bg-orange-500/[0.04] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-orange-500/15">
              <div>
                <p className="text-xs tracking-[0.4em] text-orange-400/70 uppercase">Custos Fixos Anuais</p>
                <p className="text-[10px] text-white/20 mt-0.5 tracking-wider">despesas recorrentes planeadas para {ano}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[9px] text-white/20 uppercase tracking-widest">Total</p>
                  <p className="text-xl font-mono font-semibold text-orange-300">{fmt(totalCustosFixosAnuais)} €</p>
                </div>
                <button
                  onClick={() => { setCfItem(''); setCfValor(''); setCfModalOpen(true) }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs tracking-widest uppercase transition-all"
                >
                  <span className="text-base leading-none">+</span> Adicionar
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="divide-y divide-orange-500/[0.08]">
              {custosFixosAnuais.length === 0 && (
                <p className="text-center py-8 text-white/20 text-xs tracking-widest">Sem custos fixos definidos</p>
              )}
              {custosFixosAnuais.map((c, i) => (
                <div key={c.id} className="group flex items-center gap-4 px-6 py-3.5 hover:bg-orange-500/[0.04] transition-colors">
                  <span className="text-xl font-extralight text-white/10 w-7 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-sm text-white/70 font-medium tracking-wide truncate">{c.item}</span>
                      <span className="text-base font-mono font-semibold text-orange-300 flex-shrink-0">{fmt(c.valor)} €</span>
                    </div>
                    {/* Barra proporcional */}
                    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-orange-400/60"
                        style={{ width: `${totalCustosFixosAnuais > 0 ? (c.valor / totalCustosFixosAnuais) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-white/20 flex-shrink-0 w-16 text-right font-mono">
                    {totalCustosFixosAnuais > 0 ? Math.round((c.valor / totalCustosFixosAnuais) * 100) : 0}%
                  </span>
                  <button
                    onClick={() => removeCustoFixo(c.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all text-lg leading-none flex-shrink-0 w-6 text-center"
                    title="Remover"
                  >×</button>
                </div>
              ))}
            </div>

            {/* Footer totais */}
            {custosFixosAnuais.length > 0 && (
              <div className="flex items-center justify-between px-6 py-3 bg-orange-500/[0.06] border-t border-orange-500/15">
                <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase">{custosFixosAnuais.length} itens · média mensal</span>
                <span className="text-sm font-mono font-semibold text-orange-300/70">{fmt(totalCustosFixosAnuais / 12)} € / mês</span>
              </div>
            )}
          </div>

          {/* ── Análise de Custos ── */}
          {(() => {
            const mesesAtivos = resumo.filter(r => r.despesas > 0).length || 1
            const mediaTotal  = totalDespesas / mesesAtivos

            // Detecta custos fixos: itens que aparecem em ≥ 8 meses
            // Normaliza ordenando palavras (LOJA RENDA = RENDA LOJA) e remove conteúdo entre parênteses
            const porItem = new Map<string, { total: number; meses: Set<string>; nome: string }>()
            for (const d of allDespesas) {
              const key = d.item.toUpperCase().replace(/\s*\(.*\)/, '').trim().split(/\s+/).sort().join(' ')
              const nomeOriginal = d.item.toUpperCase().replace(/\s*\(.*\)/, '').trim()
              if (!porItem.has(key)) porItem.set(key, { total: 0, meses: new Set(), nome: nomeOriginal })
              const e = porItem.get(key)!
              e.total += d.valor
              e.meses.add(d.mes)
            }
            const fixos = [...porItem.entries()]
              .filter(([, v]) => v.meses.size >= 8)
              .map(([, v]) => ({ nome: v.nome, media: v.total / v.meses.size, meses: v.meses.size }))
            const totalFixo = fixos.reduce((s, f) => s + f.media, 0)
            const totalVariavel = mediaTotal - totalFixo

            return (
              <div className="space-y-3">
                {/* Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                    <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-2">Média Mensal</p>
                    <p className="text-2xl font-light text-red-400">{fmt(mediaTotal)}</p>
                    <p className="text-[9px] text-white/20 mt-1">€ / mês</p>
                  </div>
                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
                    <p className="text-[9px] tracking-[0.3em] text-orange-400/60 uppercase mb-2">Custos Fixos</p>
                    <p className="text-2xl font-light text-orange-300">{fmt(totalFixo)}</p>
                    <p className="text-[9px] text-orange-400/30 mt-1">€ / mês</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                    <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-2">Variáveis</p>
                    <p className="text-2xl font-light text-white/60">{fmt(totalVariavel)}</p>
                    <p className="text-[9px] text-white/20 mt-1">€ / mês</p>
                  </div>
                </div>

                {/* Custos fixos detalhados */}
                {fixos.length > 0 && (
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4">
                    <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-3">Custos Fixos Identificados <span className="text-white/20 normal-case tracking-normal">(aparecem em {'>'}= 8 meses)</span></p>
                    <div className="space-y-2">
                      {fixos.sort((a,b) => b.media - a.media).map(f => (
                        <div key={f.nome} className="flex items-center gap-3">
                          <div className="flex-1 bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-orange-400/50 rounded-full" style={{ width: `${Math.min(100, (f.media / totalFixo) * 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-white/50 w-36 truncate text-right">{f.nome}</span>
                          <span className="text-[10px] font-mono text-orange-300 w-20 text-right">{fmt(f.media)} €</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Top Despesas */}
          {(() => {
            const top = [...allDespesas]
              .sort((a, b) => b.valor - a.valor)
              .slice(0, 8)
            const maxValor = top[0]?.valor ?? 1
            return (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-6">
                <p className="text-xs tracking-[0.4em] text-red-400/50 uppercase mb-6">Top Despesas do Ano</p>
                <div className="space-y-4">
                  {top.map((d, i) => (
                    <div key={i} className="flex items-center gap-4">
                      {/* Rank */}
                      <span className="text-2xl font-extralight text-white/10 w-8 text-right leading-none flex-shrink-0">{i + 1}</span>

                      {/* Barra + labels */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-sm text-white/70 truncate font-medium tracking-wide">{d.item}</span>
                          <div className="flex items-baseline gap-2 flex-shrink-0">
                            <span className="text-base font-mono font-semibold text-red-400" style={{ opacity: 1 - i * 0.07 }}>{fmt(d.valor)} €</span>
                            <span className="text-[10px] text-white/25 tracking-wider">{d.mes.slice(0,3).toUpperCase()}</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(d.valor / maxValor) * 100}%`,
                              background: `rgba(248,113,113,${0.75 - i * 0.06})`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Gráfico — saldo por mês (verde = bom, vermelho = mau) */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase">Saldo por Mês</p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[10px] text-white/30"><span className="w-3 h-3 rounded-sm bg-green-400/60 inline-block" /> Mês positivo</span>
                <span className="flex items-center gap-1.5 text-[10px] text-white/30"><span className="w-3 h-3 rounded-sm bg-red-400/60 inline-block" /> Mês negativo</span>
              </div>
            </div>
            <p className="text-[10px] text-white/20 mb-4">Receitas − Despesas · barras para cima = mês bom · para baixo = mês mau</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={resumo.map(r => ({ mes: r.mes.slice(0,3), saldo: r.receitas - r.despesas, receitas: r.receitas, despesas: r.despesas }))}
                barCategoryGap="30%"
              >
                <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontSize: 11 }}
                  formatter={(v: number, name: string, props: any) => {
                    const { receitas, despesas, saldo } = props.payload
                    return [
                      <span key="tip">
                        <span style={{ color: '#4ade80' }}>Rec: {receitas.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €</span><br/>
                        <span style={{ color: '#f87171' }}>Desp: {despesas.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €</span><br/>
                        <span style={{ color: saldo >= 0 ? '#c9a84c' : '#f87171', fontWeight: 700 }}>Saldo: {saldo >= 0 ? '+' : ''}{saldo.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €</span>
                      </span>,
                      ''
                    ]
                  }}
                />
                <Bar dataKey="saldo" radius={[4,4,4,4]}>
                  {resumo.map((r, i) => (
                    <Cell key={i} fill={r.receitas - r.despesas >= 0 ? 'rgba(74,222,128,0.65)' : 'rgba(248,113,113,0.65)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {despesasPorMes.map(({ mes, items }) => {
            const subtotal = items.reduce((s, d) => s + d.valor, 0)
            return (
              <div key={mes} className="rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-white/[0.03] border-b border-white/[0.06]">
                  <span className="text-xs tracking-[0.35em] text-white/60 uppercase font-medium">{mes}</span>
                  <span className="text-sm font-mono font-semibold text-red-400">{fmt(subtotal)} €</span>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {items.map((d, i) => (
                      <tr key={i} className={`border-b border-white/[0.04] last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'} group`}>
                        <td className="px-4 py-2.5 text-white/70 text-xs font-medium">{d.item}</td>
                        <td className="px-4 py-2.5 text-white/30 text-xs hidden sm:table-cell">{d.notas}</td>
                        <td className="px-4 py-2.5 text-right text-red-400 font-mono font-semibold whitespace-nowrap">
                          {fmt(d.valor)} €
                        </td>
                        <td className="px-4 py-2.5 w-10 text-right">
                          {d._id && (
                            <button
                              onClick={() => handleDelete(d._id!)}
                              disabled={deleting === d._id}
                              className="text-white/20 hover:text-red-400 transition-colors text-xs opacity-0 group-hover:opacity-100 disabled:opacity-50"
                              title="Apagar"
                            >
                              {deleting === d._id ? '…' : '×'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
          <div className="flex items-center justify-between px-5 py-4 rounded-2xl border border-red-500/20 bg-red-500/5">
            <span className="text-xs tracking-[0.35em] text-white/40 uppercase">Total Despesas {ano}</span>
            <span className="text-xl font-mono font-bold text-red-400">{fmt(totalDespesas)} €</span>
          </div>
        </div>
      )}

      {/* ── COMPARAÇÃO ANO ANTERIOR ── */}
      {tab === 'comparação' && anoNum >= 2026 && (
        <div className="space-y-6">

          {/* Cards comparação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ano anterior */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-3">
              <p className="text-[10px] tracking-[0.4em] text-blue-400/60 uppercase">{anoNum - 1}</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Receitas</p>
                  <p className="text-2xl font-light text-blue-300">{fmt(prevTotalReceitas)} <span className="text-sm text-blue-300/40">€</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Despesas</p>
                  <p className="text-xl font-light text-red-400/70">{fmt(prevTotalDespesas)} <span className="text-sm text-red-400/30">€</span></p>
                </div>
              </div>
              <div className="pt-2 border-t border-white/[0.06]">
                <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Saldo</p>
                <p className={`text-xl font-semibold font-mono ${prevSaldo >= 0 ? 'text-blue-300' : 'text-red-400'}`}>
                  {prevSaldo >= 0 ? '+' : ''}{fmt(prevSaldo)} €
                </p>
              </div>
            </div>
            {/* Ano atual */}
            <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5 space-y-3">
              <p className="text-[10px] tracking-[0.4em] text-gold/60 uppercase">{anoNum} <span className="text-[8px] text-white/20 ml-1">{podeProjetar ? '(em curso)' : ''}</span></p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Receitas</p>
                  <p className="text-2xl font-light text-green-400">{fmt(totalReceitas)} <span className="text-sm text-green-400/40">€</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Despesas</p>
                  <p className="text-xl font-light text-red-400/70">{fmt(totalDespesas)} <span className="text-sm text-red-400/30">€</span></p>
                </div>
              </div>
              <div className="pt-2 border-t border-white/[0.06]">
                <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Saldo</p>
                <p className={`text-xl font-semibold font-mono ${saldo >= 0 ? 'text-gold' : 'text-red-400'}`}>
                  {saldo >= 0 ? '+' : ''}{fmt(saldo)} €
                </p>
              </div>
            </div>
          </div>

          {/* Variação */}
          {prevTotalReceitas > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(() => {
                const varRec  = totalReceitas - prevTotalReceitas
                const varDesp = totalDespesas - prevTotalDespesas
                const varSaldo = saldo - prevSaldo
                const pctRec  = prevTotalReceitas > 0 ? (varRec / prevTotalReceitas) * 100 : 0
                return (
                  <>
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                      <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-2">Δ Receitas</p>
                      <p className={`text-xl font-mono font-semibold ${varRec >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {varRec >= 0 ? '+' : ''}{fmt(varRec)} €
                      </p>
                      <p className={`text-[10px] mt-1 ${varRec >= 0 ? 'text-green-400/40' : 'text-red-400/40'}`}>
                        {varRec >= 0 ? '▲' : '▼'} {Math.abs(pctRec).toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                      <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-2">Δ Despesas</p>
                      <p className={`text-xl font-mono font-semibold ${varDesp <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {varDesp >= 0 ? '+' : ''}{fmt(varDesp)} €
                      </p>
                      <p className={`text-[10px] mt-1 ${varDesp <= 0 ? 'text-green-400/40' : 'text-red-400/40'}`}>
                        {varDesp >= 0 ? '▲' : '▼'} {prevTotalDespesas > 0 ? Math.abs((varDesp / prevTotalDespesas) * 100).toFixed(1) : '—'}%
                      </p>
                    </div>
                    <div className={`rounded-2xl border p-4 text-center ${varSaldo >= 0 ? 'border-gold/20 bg-gold/5' : 'border-red-500/20 bg-red-500/5'}`}>
                      <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-2">Δ Saldo</p>
                      <p className={`text-xl font-mono font-semibold ${varSaldo >= 0 ? 'text-gold' : 'text-red-400'}`}>
                        {varSaldo >= 0 ? '+' : ''}{fmt(varSaldo)} €
                      </p>
                      <p className={`text-[10px] mt-1 ${varSaldo >= 0 ? 'text-gold/40' : 'text-red-400/40'}`}>
                        vs {anoNum - 1}
                      </p>
                    </div>
                  </>
                )
              })()}
            </div>
          )}

          {/* Gráfico comparação receitas por mês */}
          {comparacaoChartData.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase">Receitas por Mês</p>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[10px] text-white/30">
                    <span className="w-3 h-3 rounded-sm bg-blue-400/60 inline-block" /> {anoNum - 1}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-white/30">
                    <span className="w-3 h-3 rounded-sm bg-gold/70 inline-block" /> {anoNum}
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={comparacaoChartData} barCategoryGap="25%" barGap={3}>
                  <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontSize: 11 }}
                    formatter={(v: number, name: string) => [
                      `${v.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €`,
                      name
                    ]}
                  />
                  <Bar dataKey={String(anoNum - 1)} name={String(anoNum - 1)} fill="rgba(96,165,250,0.55)" radius={[4,4,0,0]} />
                  <Bar dataKey={String(anoNum)} name={String(anoNum)} fill="rgba(201,168,76,0.70)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabela comparativa mensal */}
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3 bg-white/[0.03] border-b border-white/[0.06] grid grid-cols-4 gap-2">
              <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase">Mês</span>
              <span className="text-[10px] tracking-[0.3em] text-blue-400/50 uppercase text-right">{anoNum - 1}</span>
              <span className="text-[10px] tracking-[0.3em] text-gold/50 uppercase text-right">{anoNum}</span>
              <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase text-right">Variação</span>
            </div>
            {ORDEM_MESES.map(mes => {
              const prev = prevYearReceitas.filter(r => r.mes === mes).reduce((s, r) => s + r.valor, 0)
              const curr = allReceitas.filter(r => r.mes === mes).reduce((s, r) => s + r.valor, 0)
              if (prev === 0 && curr === 0) return null
              const diff = curr - prev
              return (
                <div key={mes} className="px-5 py-3 grid grid-cols-4 gap-2 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm text-white/60">{mes}</span>
                  <span className="text-sm font-mono text-blue-300/70 text-right">{prev > 0 ? `${fmt(prev)} €` : '—'}</span>
                  <span className="text-sm font-mono text-green-400/80 text-right">{curr > 0 ? `${fmt(curr)} €` : '—'}</span>
                  <span className={`text-sm font-mono text-right font-semibold ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-white/20'}`}>
                    {diff !== 0 ? `${diff > 0 ? '+' : ''}${fmt(diff)} €` : '—'}
                  </span>
                </div>
              )
            })}
            <div className="px-5 py-3 grid grid-cols-4 gap-2 bg-white/[0.03] border-t border-white/[0.1]">
              <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase font-semibold">Total</span>
              <span className="text-sm font-mono font-bold text-blue-300 text-right">{fmt(prevTotalReceitas)} €</span>
              <span className="text-sm font-mono font-bold text-green-400 text-right">{fmt(totalReceitas)} €</span>
              <span className={`text-sm font-mono font-bold text-right ${totalReceitas - prevTotalReceitas >= 0 ? 'text-gold' : 'text-red-400'}`}>
                {totalReceitas - prevTotalReceitas >= 0 ? '+' : ''}{fmt(totalReceitas - prevTotalReceitas)} €
              </span>
            </div>
          </div>

          {comparacaoChartData.length === 0 && prevTotalReceitas === 0 && (
            <div className="text-center py-16 text-white/20 text-sm tracking-widest">
              A CARREGAR DADOS DO ANO ANTERIOR…
            </div>
          )}
        </div>
      )}

      {/* ── MODAL CUSTO FIXO ── */}
      {cfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCfModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#111] border border-orange-500/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm tracking-[0.3em] uppercase font-medium text-orange-400">+ Custo Fixo Anual</h2>
              <button onClick={() => setCfModalOpen(false)} className="text-white/30 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] tracking-[0.3em] text-white/30 uppercase mb-1.5">Descrição</label>
                <input
                  type="text" value={cfItem} onChange={e => setCfItem(e.target.value)}
                  placeholder="ex: HOSTINGER ALOJAMENTO"
                  onKeyDown={e => e.key === 'Enter' && addCustoFixo()}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/40 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.3em] text-white/30 uppercase mb-1.5">Valor Anual (€)</label>
                <input
                  type="text" value={cfValor} onChange={e => setCfValor(e.target.value)}
                  placeholder="ex: 150"
                  onKeyDown={e => e.key === 'Enter' && addCustoFixo()}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/40 transition-colors font-mono"
                />
                {cfValor && parseFloat(cfValor.replace(',', '.')) > 0 && (
                  <p className="text-[10px] text-white/20 mt-1.5 pl-1">
                    ≈ {fmt(parseFloat(cfValor.replace(',', '.')) / 12)} € / mês
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCfModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-xs tracking-widest text-white/40 hover:text-white/70 uppercase transition-colors">
                Cancelar
              </button>
              <button
                onClick={addCustoFixo}
                disabled={!cfItem.trim() || !cfValor}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs tracking-widest uppercase font-medium transition-all disabled:opacity-40 bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

          {/* Card */}
          <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-sm tracking-[0.3em] uppercase font-medium ${formTipo === 'receita' ? 'text-green-400' : 'text-red-400'}`}>
                {formTipo === 'receita' ? '+ Nova Receita' : '+ Nova Despesa'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-white/30 hover:text-white text-xl leading-none">×</button>
            </div>

            <div className="space-y-4">
              {/* Mês */}
              <div>
                <label className="block text-[10px] tracking-[0.3em] text-white/30 uppercase mb-1.5">Mês</label>
                <select value={fMes} onChange={e => setFMes(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/40 transition-colors">
                  {ORDEM_MESES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Data */}
              <div>
                <label className="block text-[10px] tracking-[0.3em] text-white/30 uppercase mb-1.5">Data <span className="text-white/20 normal-case tracking-normal">(opcional)</span></label>
                <input
                  type="text" value={fData} onChange={e => setFData(e.target.value)}
                  placeholder="ex: 15/04/2025"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/40 transition-colors"
                />
              </div>

              {/* Categoria / Item */}
              {formTipo === 'receita' ? (
                <div>
                  <label className="block text-[10px] tracking-[0.3em] text-white/30 uppercase mb-1.5">Tipo</label>
                  <select value={fCategoria} onChange={e => setFCategoria(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/40 transition-colors">
                    {TIPOS_RECEITA.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] tracking-[0.3em] text-white/30 uppercase mb-1.5">Item / Descrição</label>
                  <input
                    type="text" value={fItem} onChange={e => setFItem(e.target.value)}
                    placeholder="ex: RENDA LOJA"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/40 transition-colors"
                  />
                </div>
              )}

              {/* Valor */}
              <div>
                <label className="block text-[10px] tracking-[0.3em] text-white/30 uppercase mb-1.5">Valor (€)</label>
                <input
                  type="text" value={fValor} onChange={e => setFValor(e.target.value)}
                  placeholder="ex: 600"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/40 transition-colors"
                />
              </div>

              {/* Info / Notas */}
              <div>
                <label className="block text-[10px] tracking-[0.3em] text-white/30 uppercase mb-1.5">
                  {formTipo === 'receita' ? 'Info' : 'Notas'} <span className="text-white/20 normal-case tracking-normal">(opcional)</span>
                </label>
                <input
                  type="text" value={fInfo} onChange={e => setFInfo(e.target.value)}
                  placeholder="ex: Joana e Miguel"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/40 transition-colors"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-xs tracking-widest text-white/40 hover:text-white/70 uppercase transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !fValor}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs tracking-widest uppercase font-medium transition-all disabled:opacity-40 ${
                  formTipo === 'receita'
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                    : 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                }`}
              >
                {saving ? 'A guardar…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
