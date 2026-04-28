'use client'

import Link from 'next/link'
import { useState, useEffect, use } from 'react'
import { ComposedChart, BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, ReferenceLine, LineChart, Legend } from 'recharts'
import { supabase } from '@/lib/supabase'

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

  const [tab, setTab]                   = useState<'resumo' | 'receitas' | 'despesas' | 'comparação' | 'estratégia'>('resumo')
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
  // Estratégia
  const [metaAnualSim, setMetaAnualSim]     = useState<number>(30000)
  const [numEventosSim, setNumEventosSim]   = useState<number>(20)
  const [relatorioOpen, setRelatorioOpen]   = useState<boolean>(false)
  type CrmEst = {
    total: number; fechados: number; perdidos: number; ativos: number
    porChegou: Array<{ canal: string; count: number; fechados: number }>
    orcamentosF: number[]   // valores de orcamento dos leads fechados (parsed)
  }
  const [crmEst, setCrmEst]             = useState<CrmEst | null>(null)
  // Packs config (editável, persistido em localStorage)
  type PacksCfg = { preco: number; freelancer: number; servicos: string[] }
  type AllPacksCfg = { p1: PacksCfg; p2: PacksCfg; p3: PacksCfg; bat: PacksCfg; corp: PacksCfg }
  const DEFAULT_PACKS_CFG: AllPacksCfg = {
    p1:   { preco: 850,  freelancer: 300, servicos: ['1 Videógrafo', 'Reportagem completa', 'Vídeo final 20 min', 'Qualidade Full HD', 'Deslocação incluída'] },
    p2:   { preco: 1050, freelancer: 300, servicos: ['1 Videógrafo', 'Reportagem completa', 'Vídeo final 20 min', 'Qualidade Full HD', 'Deslocação incluída', 'Sessão Pré-Wedding'] },
    p3:   { preco: 1300, freelancer: 350, servicos: ['1 Videógrafo', 'Reportagem completa', 'Vídeo final 20 min', 'Qualidade Full HD', 'Deslocação incluída', 'Sessão Pré-Wedding', 'Imagens de Drone', 'Same-Day Edit (SDE)'] },
    bat:  { preco: 450,  freelancer: 120, servicos: ['Reportagem completa', 'Vídeo highlights', 'Deslocação incluída'] },
    corp: { preco: 700,  freelancer: 80,  servicos: ['Captação de evento', 'Edição profissional', 'Entrega digital'] },
  }
  const [packsCfg, setPacksCfg] = useState<AllPacksCfg>(DEFAULT_PACKS_CFG)
  const [newServicoInput, setNewServicoInput] = useState<Record<string, string>>({ p1: '', p2: '', p3: '', bat: '', corp: '' })

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

    // Packs config from localStorage — merge with defaults to handle schema migrations
    const savedPacks = localStorage.getItem('packs-config')
    if (savedPacks) {
      try {
        const p = JSON.parse(savedPacks)
        const merged: AllPacksCfg = {
          p1:   { ...DEFAULT_PACKS_CFG.p1,   ...p.p1,   servicos: p.p1?.servicos   ?? DEFAULT_PACKS_CFG.p1.servicos },
          p2:   { ...DEFAULT_PACKS_CFG.p2,   ...p.p2,   servicos: p.p2?.servicos   ?? DEFAULT_PACKS_CFG.p2.servicos },
          p3:   { ...DEFAULT_PACKS_CFG.p3,   ...p.p3,   servicos: p.p3?.servicos   ?? DEFAULT_PACKS_CFG.p3.servicos },
          bat:  { ...DEFAULT_PACKS_CFG.bat,  ...p.bat,  servicos: p.bat?.servicos  ?? DEFAULT_PACKS_CFG.bat.servicos },
          corp: { ...DEFAULT_PACKS_CFG.corp, ...p.corp, servicos: p.corp?.servicos ?? DEFAULT_PACKS_CFG.corp.servicos },
        }
        setPacksCfg(merged)
      } catch { localStorage.removeItem('packs-config') }
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

  // CRM stats para tab Estratégia
  useEffect(() => {
    if (tab !== 'estratégia' || crmEst) return
    // Busca tudo o que precisamos de crm_contacts — tudo no Supabase, sem tocar no Notion
    supabase
      .from('crm_contacts')
      .select('status, como_chegou, orcamento, servicos, nome, data_casamento, tipo_evento')
      .then(({ data }) => {
        if (!data) return
        const total = data.length
        const fechados = data.filter(c => c.status === 'Fechou').length
        const perdidos = data.filter(c => ['NÃO FECHOU','Encerrado','Cancelado','Sem resposta'].includes(c.status)).length
        const ativos   = total - fechados - perdidos

        // Canais de aquisição
        const canaisMap = new Map<string, { count: number; fechados: number }>()
        for (const c of data) {
          const raw = c.como_chegou ?? ''
          const canais = raw.split(',').map((s: string) => s.trim()).filter(Boolean)
          if (!canais.length) canais.push('Não especificado')
          for (const canal of canais) {
            if (!canaisMap.has(canal)) canaisMap.set(canal, { count: 0, fechados: 0 })
            canaisMap.get(canal)!.count++
            if (c.status === 'Fechou') canaisMap.get(canal)!.fechados++
          }
        }
        const porChegou = [...canaisMap.entries()]
          .map(([canal, v]) => ({ canal, count: v.count, fechados: v.fechados }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)

        // Classificação de proposta para leads fechados
        // Prioridade: servicos (mais fiável) > orcamento (fallback)
        const parseOrc = (raw: string): number => {
          const cleaned = raw.replace(/[^0-9.,]/g, '').replace(',', '.')
          const num = cleaned.includes('.') && cleaned.split('.')[1]?.length === 3
            ? parseFloat(cleaned.replace('.', ''))
            : parseFloat(cleaned)
          return isNaN(num) ? 0 : num
        }

        const orcamentosF = data
          .filter(c => c.status === 'Fechou')
          .map(c => {
            const servStr = (c.servicos ?? '').toLowerCase()
            // Classificar por serviços incluídos (campo mais fiável)
            if (/drone|sde|same.day/i.test(servStr)) return 1300        // P3
            if (/pr[eé].wedding|pre.wedding/i.test(servStr)) return 1050 // P2
            // Fallback: usar orçamento se tiver valor
            const orc = parseOrc((c.orcamento ?? '').toString())
            if (orc > 0) return orc
            // Sem dados suficientes
            return 0
          })
          .filter(v => v > 0)

        setCrmEst({ total, fechados, perdidos, ativos, porChegou, orcamentosF })
      })
  }, [tab, crmEst])

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

  // ── Ticket médio atual (baseline 2025 casamentos) ──
  const casamentos2025 = RECEITAS_2025.filter(r => r.tipo === 'CASAMENTO')
  const ticketMedioAtual = casamentos2025.length > 0
    ? casamentos2025.reduce((s, r) => s + r.valor, 0) / casamentos2025.length
    : 0

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
          <button onClick={() => setTab('estratégia')}
            className={`px-4 py-2.5 text-xs tracking-[0.25em] uppercase transition-colors ${tab === 'estratégia' ? 'text-gold border-b-2 border-gold -mb-px' : 'text-white/30 hover:text-white/60'}`}>
            Estratégia
          </button>
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

      {/* ── ESTRATÉGIA ── */}
      {tab === 'estratégia' && (() => {
        // ── Packs de vídeo (editáveis via UI)
        const p1Preco = packsCfg.p1.preco, p1Freelancer = packsCfg.p1.freelancer, p1Margem = p1Preco - p1Freelancer
        const p2Preco = packsCfg.p2.preco, p2Freelancer = packsCfg.p2.freelancer, p2Margem = p2Preco - p2Freelancer
        const p3Preco = packsCfg.p3.preco, p3Freelancer = packsCfg.p3.freelancer, p3Margem = p3Preco - p3Freelancer

        // ── Ticket médio video atual (entradas com "Videografo"/"Letras" no info 2025)
        const videoEntries2025 = RECEITAS_2025.filter(r =>
          /videografo|letras|vídeo|video/i.test(r.info)
        )
        const videoSumAtual = videoEntries2025.reduce((s, r) => s + r.valor, 0)
        const ticketMedioVideo = videoEntries2025.length > 0
          ? Math.round(videoSumAtual / videoEntries2025.length)
          : 370

        // Margem líquida atual por evento vídeo (recebido − pago ao freelancer ~280€)
        const margemVideoAtual = ticketMedioVideo - 280

        // ── Ticket médio do ano atual (casamentos em allReceitas — inclui Supabase)
        const casamentosAno = allReceitas.filter(r => r.tipo === 'CASAMENTO')
        const ticketMedioAno = casamentosAno.length > 0
          ? Math.round(casamentosAno.reduce((s, r) => s + r.valor, 0) / casamentosAno.length)
          : 0
        const margemAno = ticketMedioAno > 0 ? ticketMedioAno - 280 : 0

        // ── Mix 2027: 20 eventos de vídeo (8 × P1 + 8 × P2 + 4 × P3)
        const mixData = [
          { proposta: 'P1 × 8', receita: p1Preco * 8, margem: p1Margem * 8 },
          { proposta: 'P2 × 8', receita: p2Preco * 8, margem: p2Margem * 8 },
          { proposta: 'P3 × 4', receita: p3Preco * 4, margem: p3Margem * 4 },
        ]
        const mixReceitas  = mixData.reduce((s, d) => s + d.receita, 0)
        const mixMargem    = mixData.reduce((s, d) => s + d.margem, 0)
        const atualMargem  = videoEntries2025.length * margemVideoAtual
        const pctMelhoria  = atualMargem > 0 ? Math.round(((mixMargem - atualMargem) / atualMargem) * 100) : 0
        const ticketMedio2027 = Math.round((p1Preco*8 + p2Preco*8 + p3Preco*4) / 20)
        const fillCells    = ['rgba(96,165,250,0.65)','rgba(201,168,76,0.70)','rgba(167,139,250,0.65)']

        const savePacks = (next: AllPacksCfg) => { setPacksCfg(next); localStorage.setItem('packs-config', JSON.stringify(next)) }
        const updatePack = (key: keyof AllPacksCfg, field: 'preco' | 'freelancer', val: number) =>
          savePacks({ ...packsCfg, [key]: { ...packsCfg[key], [field]: val } })
        const removeServico = (key: keyof AllPacksCfg, idx: number) => {
          const next = { ...packsCfg, [key]: { ...packsCfg[key], servicos: packsCfg[key].servicos.filter((_, i) => i !== idx) } }
          savePacks(next)
        }
        const addServico = (key: keyof AllPacksCfg) => {
          const val = (newServicoInput[key] ?? '').trim()
          if (!val) return
          savePacks({ ...packsCfg, [key]: { ...packsCfg[key], servicos: [...packsCfg[key].servicos, val] } })
          setNewServicoInput(prev => ({ ...prev, [key]: '' }))
        }

        return (
          <div className="space-y-8">

            {/* ── Botão Gerar Relatório (topo) ── */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  const next = !relatorioOpen
                  setRelatorioOpen(next)
                  if (next) setTimeout(() => document.getElementById('relatorio-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
                }}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl border border-gold/40 bg-gold/[0.08] hover:bg-gold/[0.14] transition-all text-gold text-sm tracking-[0.2em] uppercase font-medium shadow-lg shadow-gold/5"
              >
                <span className="text-lg">📊</span>
                {relatorioOpen ? 'Fechar Relatório' : 'Gerar Relatório'}
              </button>
            </div>

            {/* ── Serviços & Preços ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase">Serviços & Preços</p>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              <p className="text-[10px] text-white/15 text-center">Edita os valores — todos os cálculos actualizam automaticamente</p>

              {/* Casamentos — P1/P2/P3 */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06]">
                  <p className="text-[9px] tracking-[0.35em] text-white/30 uppercase">Casamentos · Packs de Vídeo</p>
                </div>
                {([
                  { key: 'p1' as const, label: 'Proposta 1', color: 'text-blue-300',   chipBg: 'bg-blue-500/10 border-blue-500/20',   border: 'border-blue-500/15' },
                  { key: 'p2' as const, label: 'Proposta 2', color: 'text-gold',        chipBg: 'bg-gold/10 border-gold/20',            border: 'border-gold/10' },
                  { key: 'p3' as const, label: 'Proposta 3', color: 'text-purple-300',  chipBg: 'bg-purple-500/10 border-purple-500/20', border: 'border-purple-500/15' },
                ] as { key: keyof AllPacksCfg; label: string; color: string; chipBg: string; border: string }[]).map(row => {
                  const cfg = packsCfg[row.key]
                  const margem = cfg.preco - cfg.freelancer
                  return (
                    <div key={row.key} className={`px-5 py-4 border-b last:border-b-0 ${row.border}`}>
                      {/* Row header */}
                      <div className="flex items-center justify-between mb-3">
                        <p className={`text-xs font-semibold ${row.color}`}>{row.label}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] text-white/20 uppercase tracking-wider">Preço</span>
                            <input type="number" min={0} step={50} value={cfg.preco}
                              onChange={e => updatePack(row.key, 'preco', Number(e.target.value) || 0)}
                              className={`w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm font-mono text-right focus:outline-none focus:border-white/25 transition-colors ${row.color}`} />
                            <span className="text-[10px] text-white/20">€</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] text-white/20 uppercase tracking-wider">Freelancer</span>
                            <input type="number" min={0} step={10} value={cfg.freelancer}
                              onChange={e => updatePack(row.key, 'freelancer', Number(e.target.value) || 0)}
                              className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm font-mono text-right text-red-400/60 focus:outline-none focus:border-white/25 transition-colors" />
                            <span className="text-[10px] text-white/20">€</span>
                          </div>
                          <div className="text-center min-w-[52px]">
                            <p className="text-[8px] text-white/20 uppercase tracking-wider mb-0.5">Margem</p>
                            <p className={`text-sm font-mono font-semibold ${margem > 0 ? 'text-green-400' : 'text-red-400'}`}>{margem} €</p>
                          </div>
                        </div>
                      </div>
                      {/* Service chips */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(cfg.servicos ?? []).map((s, si) => (
                          <span key={si} className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border ${row.chipBg} text-white/50`}>
                            {s}
                            <button onClick={() => removeServico(row.key, si)}
                              className="text-white/25 hover:text-red-400/70 leading-none transition-colors text-xs ml-0.5">×</button>
                          </span>
                        ))}
                        {/* Add new service */}
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="+ novo serviço"
                            value={newServicoInput[row.key] ?? ''}
                            onChange={e => setNewServicoInput(prev => ({ ...prev, [row.key]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && addServico(row.key)}
                            className="text-[10px] bg-white/[0.03] border border-white/[0.08] rounded-full px-3 py-1 text-white/30 placeholder-white/15 focus:outline-none focus:border-white/20 focus:text-white/50 transition-colors w-28"
                          />
                          {(newServicoInput[row.key] ?? '').trim() && (
                            <button onClick={() => addServico(row.key)}
                              className="text-[10px] text-white/30 hover:text-white/60 transition-colors">↵</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Outros serviços — Batizado + Corporate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  { key: 'bat' as const,  label: 'Batizado',  color: 'text-yellow-300',  chipBg: 'bg-yellow-500/10 border-yellow-500/20' },
                  { key: 'corp' as const, label: 'Corporate', color: 'text-emerald-300', chipBg: 'bg-emerald-500/10 border-emerald-500/20' },
                ] as { key: keyof AllPacksCfg; label: string; color: string; chipBg: string }[]).map(row => {
                  const cfg = packsCfg[row.key]
                  const margem = cfg.preco - cfg.freelancer
                  return (
                    <div key={row.key} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-semibold ${row.color}`}>{row.label}</p>
                        <div>
                          <p className="text-[8px] text-white/20 uppercase tracking-wider mb-0.5 text-right">Margem</p>
                          <p className={`text-base font-mono font-semibold ${margem > 0 ? 'text-green-400' : 'text-red-400'}`}>{margem} €</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <p className="text-[8px] text-white/20 uppercase tracking-wider mb-1">Preço</p>
                          <div className="flex items-center gap-1">
                            <input type="number" min={0} step={50} value={cfg.preco}
                              onChange={e => updatePack(row.key, 'preco', Number(e.target.value) || 0)}
                              className={`w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm font-mono text-right focus:outline-none focus:border-white/25 transition-colors ${row.color}`} />
                            <span className="text-[10px] text-white/20">€</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-[8px] text-white/20 uppercase tracking-wider mb-1">Freelancer</p>
                          <div className="flex items-center gap-1">
                            <input type="number" min={0} step={10} value={cfg.freelancer}
                              onChange={e => updatePack(row.key, 'freelancer', Number(e.target.value) || 0)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm font-mono text-right text-red-400/60 focus:outline-none focus:border-white/25 transition-colors" />
                            <span className="text-[10px] text-white/20">€</span>
                          </div>
                        </div>
                      </div>
                      {/* Service chips */}
                      <div className="flex flex-wrap gap-2">
                        {(cfg.servicos ?? []).map((s, si) => (
                          <span key={si} className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border ${row.chipBg} text-white/50`}>
                            {s}
                            <button onClick={() => removeServico(row.key, si)}
                              className="text-white/25 hover:text-red-400/70 leading-none transition-colors text-xs ml-0.5">×</button>
                          </span>
                        ))}
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="+ novo serviço"
                            value={newServicoInput[row.key] ?? ''}
                            onChange={e => setNewServicoInput(prev => ({ ...prev, [row.key]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && addServico(row.key)}
                            className="text-[10px] bg-white/[0.03] border border-white/[0.08] rounded-full px-3 py-1 text-white/30 placeholder-white/15 focus:outline-none focus:border-white/20 focus:text-white/50 transition-colors w-28"
                          />
                          {(newServicoInput[row.key] ?? '').trim() && (
                            <button onClick={() => addServico(row.key)}
                              className="text-[10px] text-white/30 hover:text-white/60 transition-colors">↵</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Reset */}
              <div className="flex justify-end">
                <button
                  onClick={() => { setPacksCfg(DEFAULT_PACKS_CFG); localStorage.setItem('packs-config', JSON.stringify(DEFAULT_PACKS_CFG)) }}
                  className="text-[10px] tracking-[0.25em] text-white/20 hover:text-white/40 uppercase transition-colors"
                >
                  ↺ Repor valores por defeito
                </button>
              </div>
            </div>

            {/* ── Ticket Médio ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase">Ticket Médio — Vídeo</p>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              {/* Destaque: 2025 → 2026 → 2027 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 2025 — vídeo */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
                  <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">2025 · Vídeo</p>
                  <p className="text-[9px] text-white/20 mb-2">ticket médio recebido</p>
                  <p className="text-3xl font-light text-white/55">{ticketMedioVideo}</p>
                  <p className="text-[9px] text-white/20 mt-1">€ / evento</p>
                  <div className="mt-3 pt-3 border-t border-white/[0.05]">
                    <p className="text-[9px] text-white/20">margem líquida</p>
                    <p className={`text-base font-mono ${margemVideoAtual > 0 ? 'text-green-400/60' : 'text-red-400/60'}`}>{margemVideoAtual} €</p>
                    <p className="text-[9px] text-white/15">após ~280€ freelancer</p>
                  </div>
                </div>
                {/* Ano atual */}
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-4 text-center">
                  <p className="text-[9px] tracking-[0.3em] text-blue-400/60 uppercase mb-1">{anoNum} · Casamentos</p>
                  <p className="text-[9px] text-white/20 mb-2">
                    {casamentosAno.length > 0 ? `${casamentosAno.length} entradas` : 'sem dados'}
                  </p>
                  <p className="text-3xl font-light text-blue-300">
                    {ticketMedioAno > 0 ? ticketMedioAno.toLocaleString('pt-PT') : '—'}
                  </p>
                  <p className="text-[9px] text-blue-400/30 mt-1">€ / entrada</p>
                  <div className="mt-3 pt-3 border-t border-blue-500/[0.10]">
                    <p className="text-[9px] text-white/20">margem estimada</p>
                    <p className={`text-base font-mono ${margemAno > 0 ? 'text-green-400/70' : 'text-white/30'}`}>
                      {ticketMedioAno > 0 ? `${margemAno} €` : '—'}
                    </p>
                    <p className="text-[9px] text-white/15">após ~280€ freelancer</p>
                  </div>
                </div>
                {/* 2027 objetivo */}
                <div className="rounded-2xl border border-gold/20 bg-gold/[0.05] p-4 text-center">
                  <p className="text-[9px] tracking-[0.3em] text-gold/60 uppercase mb-1">2027 · Objetivo</p>
                  <p className="text-[9px] text-white/20 mb-2">mix de propostas</p>
                  <p className="text-3xl font-light text-gold">{ticketMedio2027.toLocaleString('pt-PT')}</p>
                  <p className="text-[9px] text-gold/30 mt-1">€ / evento</p>
                  <div className="mt-3 pt-3 border-t border-gold/[0.10]">
                    <p className="text-[9px] text-white/20">margem média</p>
                    <p className="text-base font-mono text-green-400">{Math.round((p1Margem*8 + p2Margem*8 + p3Margem*4) / 20)} €</p>
                    <p className="text-[9px] text-green-400/30">após freelancer</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {/* 2025 vídeo */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 text-center">
                  <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1.5">2025 Vídeo</p>
                  <p className="text-xl font-light text-white/55">{ticketMedioVideo}</p>
                  <p className="text-[9px] text-white/20 mt-0.5">€ / evento</p>
                  <div className="mt-2 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-white/25 rounded-full" style={{ width: `${(ticketMedioVideo / p3Preco) * 100}%` }} />
                  </div>
                </div>
                {/* Ano atual */}
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-3 text-center">
                  <p className="text-[9px] tracking-[0.3em] text-blue-400/60 uppercase mb-1.5">{anoNum} Real</p>
                  <p className="text-xl font-light text-blue-300">
                    {ticketMedioAno > 0 ? ticketMedioAno.toLocaleString('pt-PT') : '—'}
                  </p>
                  <p className="text-[9px] text-blue-400/30 mt-0.5">€ / entrada</p>
                  {ticketMedioAno > 0 && ticketMedioVideo > 0 && (
                    <p className="text-[9px] text-white/25 mt-1">
                      {ticketMedioAno > ticketMedioVideo
                        ? <span className="text-green-400/60">+{Math.round((ticketMedioAno / ticketMedioVideo - 1) * 100)}% vs 2025</span>
                        : <span className="text-red-400/50">{Math.round((ticketMedioAno / ticketMedioVideo - 1) * 100)}% vs 2025</span>
                      }
                    </p>
                  )}
                  <div className="mt-2 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400/40 rounded-full" style={{ width: `${Math.min(100, (ticketMedioAno / p3Preco) * 100)}%` }} />
                  </div>
                </div>
                {/* P1 */}
                <div className="rounded-2xl border border-blue-500/25 bg-blue-500/[0.06] p-3 text-center">
                  <p className="text-[9px] tracking-[0.3em] text-blue-400/60 uppercase mb-1.5">Proposta 1</p>
                  <p className="text-xl font-light text-blue-300">{p1Preco.toLocaleString('pt-PT')}</p>
                  <p className="text-[9px] text-blue-400/30 mt-0.5">€ / evento</p>
                  <p className="text-[9px] text-green-400/70 mt-1">+{Math.round((p1Preco / ticketMedioVideo - 1) * 100)}% vs 2025</p>
                  <div className="mt-2 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400/50 rounded-full" style={{ width: `${(p1Preco / p3Preco) * 100}%` }} />
                  </div>
                </div>
                {/* P2 */}
                <div className="rounded-2xl border border-gold/25 bg-gold/[0.06] p-3 text-center">
                  <p className="text-[9px] tracking-[0.3em] text-gold/60 uppercase mb-1.5">Proposta 2</p>
                  <p className="text-xl font-light text-gold">{p2Preco.toLocaleString('pt-PT')}</p>
                  <p className="text-[9px] text-gold/30 mt-0.5">€ / evento</p>
                  <p className="text-[9px] text-green-400/70 mt-1">+{Math.round((p2Preco / ticketMedioVideo - 1) * 100)}% vs 2025</p>
                  <div className="mt-2 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-gold/50 rounded-full" style={{ width: `${(p2Preco / p3Preco) * 100}%` }} />
                  </div>
                </div>
                {/* P3 */}
                <div className="rounded-2xl border border-purple-500/25 bg-purple-500/[0.06] p-3 text-center">
                  <p className="text-[9px] tracking-[0.3em] text-purple-400/60 uppercase mb-1.5">Proposta 3</p>
                  <p className="text-xl font-light text-purple-300">{p3Preco.toLocaleString('pt-PT')}</p>
                  <p className="text-[9px] text-purple-400/30 mt-0.5">€ / evento</p>
                  <p className="text-[9px] text-green-400/70 mt-1">+{Math.round((p3Preco / ticketMedioVideo - 1) * 100)}% vs 2025</p>
                  <div className="mt-2 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400/50 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>

              {/* Gráfico ticket médio */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
                <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase mb-4">Evolução Ticket Médio (€ / evento)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={[
                      { label: '2025 Vídeo', valor: ticketMedioVideo, margem: margemVideoAtual },
                      ...(ticketMedioAno > 0 ? [{ label: `${anoNum} Real`, valor: ticketMedioAno, margem: margemAno }] : []),
                      { label: 'Proposta 1', valor: p1Preco, margem: p1Margem },
                      { label: 'Proposta 2', valor: p2Preco, margem: p2Margem },
                      { label: 'Proposta 3', valor: p3Preco, margem: p3Margem },
                    ]}
                    barCategoryGap="20%" barGap={3}
                  >
                    <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number, name: string) => [`${v.toLocaleString('pt-PT')} €`, name === 'valor' ? 'Ticket' : 'Margem Líquida']}
                    />
                    <Bar dataKey="valor" name="valor" radius={[4,4,0,0]}>
                      {[
                        'rgba(255,255,255,0.20)',
                        ...(ticketMedioAno > 0 ? ['rgba(59,130,246,0.65)'] : []),
                        'rgba(96,165,250,0.70)',
                        'rgba(201,168,76,0.75)',
                        'rgba(167,139,250,0.70)',
                      ].map((fill, i) => <Cell key={i} fill={fill} />)}
                    </Bar>
                    <Bar dataKey="margem" name="margem" radius={[4,4,0,0]}>
                      {[
                        'rgba(255,255,255,0.10)',
                        ...(ticketMedioAno > 0 ? ['rgba(59,130,246,0.30)'] : []),
                        'rgba(96,165,250,0.35)',
                        'rgba(201,168,76,0.35)',
                        'rgba(167,139,250,0.35)',
                      ].map((fill, i) => <Cell key={i} fill={fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-6 mt-2 justify-center">
                  <span className="flex items-center gap-1.5 text-[10px] text-white/30"><span className="w-3 h-2 rounded-sm bg-white/25 inline-block" /> Ticket</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-white/30"><span className="w-3 h-2 rounded-sm bg-white/10 inline-block" /> Margem Líquida</span>
                </div>
              </div>
            </div>

            {/* ── As 3 Propostas ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase">Packs de Vídeo</p>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              <div className="space-y-3">
                {/* Proposta 1 */}
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-blue-500/[0.10]">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] tracking-[0.4em] text-blue-400/70 uppercase font-semibold">Proposta 1</span>
                        <span className="text-[9px] text-white/20">·</span>
                        <span className="text-[9px] tracking-wider text-white/30 uppercase">Reportagem Vídeo</span>
                      </div>
                      <p className="text-2xl font-light text-blue-300">{p1Preco.toLocaleString('pt-PT')} <span className="text-sm text-blue-300/40">€</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-white/20 uppercase tracking-widest mb-0.5">Margem líquida</p>
                      <p className="text-xl font-mono font-semibold text-green-400">{p1Margem} €</p>
                      <p className="text-[9px] text-white/20 mt-0.5">após {p1Freelancer}€ videógrafo</p>
                    </div>
                  </div>
                  <div className="px-6 py-3.5 flex flex-wrap gap-x-6 gap-y-2">
                    {(packsCfg.p1.servicos ?? []).map(item => (
                      <span key={item} className="flex items-center gap-2 text-[11px] text-white/40">
                        <span className="w-1 h-1 rounded-full bg-blue-400/50 flex-shrink-0" />{item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Proposta 2 */}
                <div className="rounded-2xl border border-gold/20 bg-gold/[0.04] overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gold/[0.10]">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] tracking-[0.4em] text-gold/70 uppercase font-semibold">Proposta 2</span>
                        <span className="text-[9px] text-white/20">·</span>
                        <span className="text-[9px] tracking-wider text-white/30 uppercase">Reportagem + Pré-Wedding</span>
                      </div>
                      <p className="text-2xl font-light text-gold">{p2Preco.toLocaleString('pt-PT')} <span className="text-sm text-gold/40">€</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-white/20 uppercase tracking-widest mb-0.5">Margem líquida</p>
                      <p className="text-xl font-mono font-semibold text-green-400">{p2Margem} €</p>
                      <p className="text-[9px] text-white/20 mt-0.5">após {p2Freelancer}€ videógrafo</p>
                    </div>
                  </div>
                  <div className="px-6 py-3.5 flex flex-wrap gap-x-6 gap-y-2">
                    {(packsCfg.p2.servicos ?? []).map(item => (
                      <span key={item} className="flex items-center gap-2 text-[11px] text-white/40">
                        <span className="w-1 h-1 rounded-full bg-gold/50 flex-shrink-0" />{item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Proposta 3 */}
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/[0.10]">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] tracking-[0.4em] text-purple-400/70 uppercase font-semibold">Proposta 3</span>
                        <span className="text-[9px] text-white/20">·</span>
                        <span className="text-[9px] tracking-wider text-white/30 uppercase">Premium · Drone + SDE</span>
                      </div>
                      <p className="text-2xl font-light text-purple-300">{p3Preco.toLocaleString('pt-PT')} <span className="text-sm text-purple-300/40">€</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-white/20 uppercase tracking-widest mb-0.5">Margem líquida</p>
                      <p className="text-xl font-mono font-semibold text-green-400">{p3Margem} €</p>
                      <p className="text-[9px] text-white/20 mt-0.5">após {p3Freelancer}€ videógrafo</p>
                    </div>
                  </div>
                  <div className="px-6 py-3.5 flex flex-wrap gap-x-6 gap-y-2">
                    {(packsCfg.p3.servicos ?? []).map(item => (
                      <span key={item} className="flex items-center gap-2 text-[11px] text-white/40">
                        <span className="w-1 h-1 rounded-full bg-purple-400/50 flex-shrink-0" />{item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Comparação de margens */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
                  <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase mb-3">Margem por Pack (após freelancer)</p>
                  <div className="space-y-3">
                    {[
                      { label: `Proposta 1 · ${p1Preco}€`, margem: p1Margem, max: p3Margem, pct: Math.round(p1Margem/p3Margem*100), fill: 'rgba(96,165,250,0.5)' },
                      { label: `Proposta 2 · ${p2Preco}€`, margem: p2Margem, max: p3Margem, pct: Math.round(p2Margem/p3Margem*100), fill: 'rgba(201,168,76,0.55)' },
                      { label: `Proposta 3 · ${p3Preco}€`, margem: p3Margem, max: p3Margem, pct: 100, fill: 'rgba(167,139,250,0.5)' },
                    ].map(r => (
                      <div key={r.label}>
                        <div className="flex justify-between text-[10px] mb-1.5">
                          <span className="text-white/40">{r.label}</span>
                          <span className="font-mono text-green-400">{r.margem} €</span>
                        </div>
                        <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${r.pct}%`, background: r.fill }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Projeção 2027 ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase">Projeção Vídeo 2027</p>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              {/* Cenários */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
                  <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase">Sem Mudança (preços actuais)</p>
                  <div className="space-y-2">
                    {[
                      { l: `${videoEntries2025.length} eventos × ${ticketMedioVideo}€`, v: `${videoSumAtual.toLocaleString('pt-PT')} €`, c: 'text-white/50' },
                      { l: 'Custo freelancers', v: `−${(videoEntries2025.length * 280).toLocaleString('pt-PT')} €`, c: 'text-red-400/50' },
                    ].map(r => (
                      <div key={r.l} className="flex justify-between text-sm">
                        <span className="text-white/35">{r.l}</span>
                        <span className={`font-mono ${r.c}`}>{r.v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-2 border-t border-white/[0.06]">
                      <span className="text-white/50 font-medium">Margem líquida vídeo</span>
                      <span className="font-mono font-bold text-white/40">{atualMargem.toLocaleString('pt-PT')} €</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gold/25 bg-gold/[0.05] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] tracking-[0.4em] text-gold/60 uppercase">Mix 2027 · 20 eventos</p>
                    {pctMelhoria > 0 && (
                      <span className="text-[9px] text-green-400/70 tracking-wider px-2 py-0.5 rounded-full border border-green-500/20 bg-green-500/10">
                        +{pctMelhoria}% margem
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {[
                      { l: `20 eventos × ~${ticketMedio2027}€`, v: `${mixReceitas.toLocaleString('pt-PT')} €`, c: 'text-green-400/70' },
                      { l: 'Custo freelancers', v: `−${(mixReceitas - mixMargem).toLocaleString('pt-PT')} €`, c: 'text-red-400/50' },
                    ].map(r => (
                      <div key={r.l} className="flex justify-between text-sm">
                        <span className="text-white/35">{r.l}</span>
                        <span className={`font-mono ${r.c}`}>{r.v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-2 border-t border-gold/[0.15]">
                      <span className="text-white/50 font-medium">Margem líquida vídeo</span>
                      <span className="font-mono font-bold text-gold">{mixMargem.toLocaleString('pt-PT')} €</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico mix */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
                <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase mb-1">Composição do Mix 2027 · 20 Eventos</p>
                <p className="text-[10px] text-white/20 mb-4">receita bruta vs margem líquida por proposta</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={mixData} barCategoryGap="25%" barGap={3}>
                    <XAxis dataKey="proposta" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number, name: string) => [`${v.toLocaleString('pt-PT')} €`, name === 'receita' ? 'Receita Bruta' : 'Margem Líquida']}
                    />
                    <Bar dataKey="receita" name="receita" radius={[4,4,0,0]}>
                      {fillCells.map((fill, i) => <Cell key={i} fill={fill} />)}
                    </Bar>
                    <Bar dataKey="margem" name="margem" radius={[4,4,0,0]}>
                      {fillCells.map((fill, i) => <Cell key={i} fill={fill} opacity={0.4} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-6 mt-2 justify-center">
                  <span className="flex items-center gap-1.5 text-[10px] text-white/30"><span className="w-3 h-2 rounded-sm bg-white/25 inline-block" /> Receita Bruta</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-white/30"><span className="w-3 h-2 rounded-sm bg-white/10 inline-block" /> Margem Líquida</span>
                </div>
              </div>

              {/* Evolução resultado líquido total */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
                <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase mb-4">Evolução Resultado Líquido (negócio total)</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={[
                      { ano: '2025 Real', liquido: 19825 },
                      { ano: '2026 Est.', liquido: 23000 },
                      { ano: '2027 Obj.', liquido: 28500 },
                    ]}
                    barCategoryGap="35%"
                  >
                    <XAxis dataKey="ano" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number) => [`${v.toLocaleString('pt-PT')} €`, 'Resultado Líquido']}
                    />
                    <Bar dataKey="liquido" radius={[6,6,0,0]}>
                      <Cell fill="rgba(96,165,250,0.55)" />
                      <Cell fill="rgba(201,168,76,0.65)" />
                      <Cell fill="rgba(74,222,128,0.75)" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { ano: '2025 Real', val: 19825, c: 'text-blue-300' },
                    { ano: '2026 Estimado', val: 23000, c: 'text-gold' },
                    { ano: '2027 Objetivo', val: 28500, c: 'text-green-400' },
                  ].map(d => (
                    <div key={d.ano} className="text-center">
                      <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">{d.ano}</p>
                      <p className={`text-lg font-mono font-semibold ${d.c}`}>{d.val.toLocaleString('pt-PT')} €</p>
                      {d.ano !== '2025 Real' && (
                        <p className="text-[9px] text-green-400/50 mt-0.5">+{Math.round(((d.val - 19825) / 19825) * 100)}% vs 2025</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Ponto de Equilíbrio ── */}
            {(() => {
              const custoFixoAnual = totalCustosFixosAnuais + 3840 + 480 // +renda 320×12 + internet/luz 40×12
              const cfMes = Math.round(custoFixoAnual / 12)
              const beAnual = { p1: Math.ceil(custoFixoAnual / p1Margem), p2: Math.ceil(custoFixoAnual / p2Margem), p3: Math.ceil(custoFixoAnual / p3Margem) }
              const maxBe = beAnual.p1
              const beChartData = Array.from({ length: Math.min(maxBe + 5, 30) }, (_, i) => ({
                eventos: i + 1,
                p1: Math.round((i + 1) * p1Margem - custoFixoAnual),
                p2: Math.round((i + 1) * p2Margem - custoFixoAnual),
                p3: Math.round((i + 1) * p3Margem - custoFixoAnual),
              }))
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase">Ponto de Equilíbrio</p>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                  <p className="text-[10px] text-white/20 text-center">
                    Custos fixos anuais estimados: <span className="text-white/40 font-mono">{custoFixoAnual.toLocaleString('pt-PT')} €</span>
                    <span className="text-white/20 ml-2">({cfMes.toLocaleString('pt-PT')} €/mês)</span>
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Proposta 1', be: beAnual.p1, preco: p1Preco, margem: p1Margem, fill: 'border-blue-500/25 bg-blue-500/[0.05]', tc: 'text-blue-300' },
                      { label: 'Proposta 2', be: beAnual.p2, preco: p2Preco, margem: p2Margem, fill: 'border-gold/20 bg-gold/[0.05]', tc: 'text-gold' },
                      { label: 'Proposta 3', be: beAnual.p3, preco: p3Preco, margem: p3Margem, fill: 'border-purple-500/20 bg-purple-500/[0.05]', tc: 'text-purple-300' },
                    ].map(c => (
                      <div key={c.label} className={`rounded-2xl border ${c.fill} p-4 text-center`}>
                        <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-2">{c.label}</p>
                        <p className={`text-3xl font-light ${c.tc}`}>{c.be}</p>
                        <p className="text-[9px] text-white/20 mt-1">eventos / ano</p>
                        <p className="text-[9px] text-white/25 mt-2">{Math.ceil(c.be / 12) === 0 ? '<1' : Math.ceil(c.be / 12)} por mês</p>
                        <div className="mt-3 pt-2 border-t border-white/[0.06]">
                          <p className="text-[9px] text-white/20">cada evento acima = lucro</p>
                          <p className={`text-sm font-mono font-semibold ${c.tc} mt-0.5`}>+{c.margem} €</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
                    <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase mb-1">Acumulado por Nº de Eventos (após custos fixos)</p>
                    <p className="text-[10px] text-white/20 mb-4">acima de zero = lucro · abaixo de zero = prejuízo</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={beChartData}>
                        <XAxis dataKey="eventos" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'nº eventos/ano', fill: 'rgba(255,255,255,0.2)', fontSize: 9, position: 'insideBottomRight', offset: -5 }} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }}
                          formatter={(v: number, name: string) => [`${v.toLocaleString('pt-PT')} €`, name === 'p1' ? 'P1' : name === 'p2' ? 'P2' : 'P3']}
                          labelFormatter={(l: number) => `${l} eventos`}
                        />
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 3" />
                        <Line dataKey="p1" stroke="rgba(96,165,250,0.7)" strokeWidth={2} dot={false} />
                        <Line dataKey="p2" stroke="rgba(201,168,76,0.7)" strokeWidth={2} dot={false} />
                        <Line dataKey="p3" stroke="rgba(167,139,250,0.7)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-6 mt-2 justify-center">
                      {[['P1','rgba(96,165,250,0.7)'],['P2','rgba(201,168,76,0.7)'],['P3','rgba(167,139,250,0.7)']].map(([l,c]) => (
                        <span key={l} className="flex items-center gap-1.5 text-[10px] text-white/30">
                          <span className="w-4 h-px inline-block" style={{ background: c as string }} />{l}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ── ROI por Tipo de Evento ── */}
            {(() => {
              const HORAS: Record<string, number> = { CASAMENTO: 14, BATIZADO: 5, CORPORATIVO: 6, 'SESSÃO': 3, OUTRO: 4 }
              const roiData = TIPOS_RECEITA
                .map(tipo => {
                  const entries = allReceitas.filter(r => r.tipo === tipo)
                  if (!entries.length) return null
                  const avg = Math.round(entries.reduce((s, r) => s + r.valor, 0) / entries.length)
                  const horas = HORAS[tipo] ?? 5
                  return { tipo, avg, horas, porHora: Math.round(avg / horas), count: entries.length }
                })
                .filter(Boolean)
                .sort((a, b) => b!.porHora - a!.porHora) as { tipo: string; avg: number; horas: number; porHora: number; count: number }[]
              const maxPH = roiData[0]?.porHora ?? 1
              const COLS: Record<string, string> = { CASAMENTO: '#c9a84c', BATIZADO: '#60a5fa', CORPORATIVO: '#a78bfa', 'SESSÃO': '#4ade80', OUTRO: '#6b7280' }
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase">ROI por Tipo de Evento</p>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                  <p className="text-[10px] text-white/20 text-center">ticket médio ÷ horas estimadas (shoot + edição)</p>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
                    {roiData.map((d, i) => (
                      <div key={d.tipo} className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0">
                        <span className="text-xl font-extralight text-white/10 w-5 text-right flex-shrink-0">{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-white/70 font-medium">{d.tipo}</span>
                              <span className="text-[9px] text-white/25">{d.count} entradas · {d.horas}h estimadas</span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-[10px] text-white/30 font-mono">avg {d.avg.toLocaleString('pt-PT')} €</span>
                              <span className="text-sm font-mono font-bold" style={{ color: COLS[d.tipo] }}>{d.porHora} €/h</span>
                            </div>
                          </div>
                          <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(d.porHora / maxPH) * 100}%`, background: COLS[d.tipo], opacity: 0.65 }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {roiData.length >= 2 && (
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3 flex items-center gap-3">
                      <span className="text-lg">💡</span>
                      <p className="text-[11px] text-white/40 leading-relaxed">
                        <span style={{ color: COLS[roiData[0].tipo] }} className="font-semibold">{roiData[0].tipo}</span> é o tipo mais rentável por hora ({roiData[0].porHora} €/h).
                        {roiData.find(d => d.tipo === 'CASAMENTO') && roiData[0].tipo !== 'CASAMENTO' &&
                          ` Casamento rende ${roiData.find(d => d.tipo === 'CASAMENTO')!.porHora} €/h — ${Math.round(roiData[0].porHora / roiData.find(d => d.tipo === 'CASAMENTO')!.porHora)}× menos eficiente.`
                        }
                      </p>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* ── Simulador de Meta Anual ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase">Simulador de Meta Anual</p>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              <div className="space-y-2">
                {/* Slider Meta Líquida */}
                <div className="flex items-center gap-4 rounded-2xl border border-gold/20 bg-gold/[0.04] px-5 py-4">
                  <p className="text-[10px] tracking-[0.3em] text-gold/60 uppercase flex-shrink-0 w-28">Meta Líquida</p>
                  <div className="flex-1">
                    <input type="range" min={15000} max={60000} step={1000} value={metaAnualSim}
                      onChange={e => setMetaAnualSim(Number(e.target.value))}
                      className="w-full accent-yellow-400" />
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input type="number" value={metaAnualSim} step={1000}
                      onChange={e => setMetaAnualSim(Number(e.target.value) || 30000)}
                      className="w-24 bg-white/5 border border-gold/20 rounded-xl px-3 py-1.5 text-sm text-gold font-mono text-right focus:outline-none focus:border-gold/40" />
                    <span className="text-white/30 text-sm">€</span>
                  </div>
                </div>
                {/* Slider Nº de Eventos */}
                <div className="flex items-center gap-4 rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] px-5 py-4">
                  <p className="text-[10px] tracking-[0.3em] text-blue-400/60 uppercase flex-shrink-0 w-28">Nº Eventos</p>
                  <div className="flex-1">
                    <input type="range" min={1} max={60} step={1} value={numEventosSim}
                      onChange={e => setNumEventosSim(Number(e.target.value))}
                      className="w-full accent-blue-400" />
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input type="number" value={numEventosSim} step={1} min={1} max={60}
                      onChange={e => setNumEventosSim(Math.max(1, Number(e.target.value) || 1))}
                      className="w-24 bg-white/5 border border-blue-500/20 rounded-xl px-3 py-1.5 text-sm text-blue-300 font-mono text-right focus:outline-none focus:border-blue-400/40" />
                    <span className="text-white/30 text-sm">ev.</span>
                  </div>
                </div>
              </div>
              {(() => {
                const custoFixoAnual = totalCustosFixosAnuais + 3840 + 480
                const receitasNec = metaAnualSim + custoFixoAnual
                const simData = [
                  { label: 'Proposta 1', preco: p1Preco, margem: p1Margem, eventos: Math.ceil(receitasNec / p1Preco), evMargem: Math.ceil(metaAnualSim / p1Margem), fill: 'rgba(96,165,250,0.65)', tc: 'text-blue-300' },
                  { label: 'Proposta 2', preco: p2Preco, margem: p2Margem, eventos: Math.ceil(receitasNec / p2Preco), evMargem: Math.ceil(metaAnualSim / p2Margem), fill: 'rgba(201,168,76,0.70)', tc: 'text-gold' },
                  { label: 'Proposta 3', preco: p3Preco, margem: p3Margem, eventos: Math.ceil(receitasNec / p3Preco), evMargem: Math.ceil(metaAnualSim / p3Margem), fill: 'rgba(167,139,250,0.65)', tc: 'text-purple-300' },
                ]
                return (
                  <>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      {simData.map(s => (
                        <div key={s.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
                          <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-3">{s.label} · {s.preco}€</p>
                          <p className={`text-3xl font-light ${s.tc}`}>{s.evMargem}</p>
                          <p className="text-[9px] text-white/20 mt-1">eventos / ano</p>
                          <p className="text-[9px] text-white/20 mt-2">{Math.ceil(s.evMargem / 12)} a {Math.ceil(s.evMargem / 10)} / mês</p>
                          <div className="mt-3 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (s.evMargem / 35) * 100)}%`, background: s.fill }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
                      <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase mb-4">Eventos Necessários por Proposta</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={simData.map(s => ({ label: s.label, eventos: s.evMargem }))} barCategoryGap="35%">
                          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip
                            contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }}
                            formatter={(v: number) => [`${v} eventos/ano`, 'Necessário']}
                          />
                          <Bar dataKey="eventos" radius={[6,6,0,0]}>
                            {simData.map((s, i) => <Cell key={i} fill={s.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* ── Resultado por Nº de Eventos ── */}
                  {(() => {
                    const custoFixoAnual = totalCustosFixosAnuais + 3840 + 480
                    const evData = [
                      { label: 'Proposta 1', preco: p1Preco, margem: p1Margem, fill: 'rgba(96,165,250,0.65)',  tc: 'text-blue-300',   border: 'border-blue-500/20',   bg: 'bg-blue-500/[0.04]' },
                      { label: 'Proposta 2', preco: p2Preco, margem: p2Margem, fill: 'rgba(201,168,76,0.70)',  tc: 'text-gold',       border: 'border-gold/20',       bg: 'bg-gold/[0.04]' },
                      { label: 'Proposta 3', preco: p3Preco, margem: p3Margem, fill: 'rgba(167,139,250,0.65)', tc: 'text-purple-300', border: 'border-purple-500/20', bg: 'bg-purple-500/[0.04]' },
                    ].map(s => {
                      const bruto   = numEventosSim * s.preco
                      const margem  = numEventosSim * s.margem
                      const liquido = margem - custoFixoAnual
                      const metaOk  = liquido >= metaAnualSim
                      return { ...s, bruto, margem, liquido, metaOk }
                    })
                    const maxLiq = Math.max(...evData.map(s => Math.abs(s.liquido)), 1)
                    return (
                      <div className="space-y-3">
                        <p className="text-[10px] text-white/20 text-center">
                          Com <span className="text-blue-300 font-mono font-semibold">{numEventosSim}</span> eventos · resultado líquido por proposta
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {evData.map(s => (
                            <div key={s.label} className={`rounded-2xl border ${s.border} ${s.bg} p-4 text-center space-y-2`}>
                              <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase">{s.label}</p>
                              <div>
                                <p className={`text-2xl font-light ${s.metaOk ? s.tc : 'text-red-400/70'}`}>
                                  {s.liquido >= 0 ? '' : '−'}{Math.abs(s.liquido).toLocaleString('pt-PT')}
                                </p>
                                <p className="text-[9px] text-white/20 mt-0.5">€ líquidos</p>
                              </div>
                              <div className="pt-2 border-t border-white/[0.06] space-y-1">
                                <div className="flex justify-between text-[9px]">
                                  <span className="text-white/20">Bruto</span>
                                  <span className="text-white/35 font-mono">{s.bruto.toLocaleString('pt-PT')} €</span>
                                </div>
                                <div className="flex justify-between text-[9px]">
                                  <span className="text-white/20">Margem</span>
                                  <span className="text-white/35 font-mono">{s.margem.toLocaleString('pt-PT')} €</span>
                                </div>
                              </div>
                              {s.metaOk
                                ? <p className="text-[9px] text-green-400/60">✓ meta atingida</p>
                                : <p className="text-[9px] text-red-400/40">faltam {(metaAnualSim - s.liquido).toLocaleString('pt-PT')} €</p>
                              }
                            </div>
                          ))}
                        </div>
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
                          <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase mb-4">Resultado Líquido por Proposta</p>
                          <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={evData.map(s => ({ label: s.label, liquido: Math.max(0, s.liquido), deficit: Math.min(0, s.liquido) }))} barCategoryGap="35%">
                              <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis hide />
                              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 3" />
                              <Tooltip
                                contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }}
                                formatter={(v: number, name: string) => [`${Math.abs(v).toLocaleString('pt-PT')} €`, name === 'liquido' ? 'Resultado' : 'Défice']}
                              />
                              <Bar dataKey="liquido" radius={[6,6,0,0]}>
                                {evData.map((s, i) => <Cell key={i} fill={s.fill} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )
                  })()}
                </>
                )
              })()}

            {/* ── Estratégia de Vendas ── */}
            {(() => {
              const custoFixoAnual = totalCustosFixosAnuais + 3840 + 480
              const margemNecessaria = metaAnualSim + custoFixoAnual
              const PREC_BAT = packsCfg.bat.preco,  MARG_BAT = packsCfg.bat.preco  - packsCfg.bat.freelancer
              const PREC_CORP = packsCfg.corp.preco, MARG_CORP = packsCfg.corp.preco - packsCfg.corp.freelancer
              // Seasonal weights Jan–Dec (sum ≈ 13.0)
              const SW = [0, 0.4, 0.3, 1.0, 1.5, 1.8, 1.8, 2.0, 2.0, 1.2, 0.5, 0.5]
              const SW_SUM = SW.reduce((a, b) => a + b, 0)
              const MESES_S = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

              type StratMix = { p1: number; p2: number; p3: number; bat: number; corp: number }
              const profileDefs: { name: string; tag: string; desc: string; color: string; mix: StratMix }[] = [
                { name: 'Conservadora', tag: 'Volume', desc: 'Mais eventos, preço base — ideal para encher agenda', color: 'blue',
                  mix: { p1: 0.55, p2: 0.25, p3: 0.05, bat: 0.10, corp: 0.05 } },
                { name: 'Equilibrada', tag: 'Recomendada', desc: 'Mix diversificado — menos eventos, margem mais alta', color: 'gold',
                  mix: { p1: 0.20, p2: 0.50, p3: 0.15, bat: 0.10, corp: 0.05 } },
                { name: 'Premium', tag: 'Alto Valor', desc: 'Poucos eventos de alto valor — máxima eficiência', color: 'purple',
                  mix: { p1: 0.05, p2: 0.30, p3: 0.50, bat: 0.10, corp: 0.05 } },
              ]

              const strategies = profileDefs.map(pd => {
                const avgMargem = pd.mix.p1*p1Margem + pd.mix.p2*p2Margem + pd.mix.p3*p3Margem + pd.mix.bat*MARG_BAT + pd.mix.corp*MARG_CORP
                const totalEvents = Math.ceil(margemNecessaria / avgMargem)
                const counts: StratMix = {
                  p1: Math.round(totalEvents * pd.mix.p1),
                  p2: Math.round(totalEvents * pd.mix.p2),
                  p3: Math.round(totalEvents * pd.mix.p3),
                  bat: Math.round(totalEvents * pd.mix.bat),
                  corp: Math.round(totalEvents * pd.mix.corp),
                }
                const sumC = counts.p1 + counts.p2 + counts.p3 + counts.bat + counts.corp
                counts.p2 += (totalEvents - sumC)
                const totalMargem = counts.p1*p1Margem + counts.p2*p2Margem + counts.p3*p3Margem + counts.bat*MARG_BAT + counts.corp*MARG_CORP
                const totalBruto = counts.p1*p1Preco + counts.p2*p2Preco + counts.p3*p3Preco + counts.bat*PREC_BAT + counts.corp*PREC_CORP
                const liquido = totalMargem - custoFixoAnual
                const rows = [
                  ...(counts.p1 > 0 ? [{ l: `Proposta 1 · ${p1Preco} €`, n: counts.p1, m: counts.p1*p1Margem, fill: 'rgba(96,165,250,0.55)' }] : []),
                  ...(counts.p2 > 0 ? [{ l: `Proposta 2 · ${p2Preco} €`, n: counts.p2, m: counts.p2*p2Margem, fill: 'rgba(201,168,76,0.55)' }] : []),
                  ...(counts.p3 > 0 ? [{ l: `Proposta 3 · ${p3Preco} €`, n: counts.p3, m: counts.p3*p3Margem, fill: 'rgba(167,139,250,0.55)' }] : []),
                  ...(counts.bat > 0 ? [{ l: `Batizados · ${PREC_BAT} €`, n: counts.bat, m: counts.bat*MARG_BAT, fill: 'rgba(251,191,36,0.45)' }] : []),
                  ...(counts.corp > 0 ? [{ l: `Corporate · ${PREC_CORP} €`, n: counts.corp, m: counts.corp*MARG_CORP, fill: 'rgba(74,222,128,0.45)' }] : []),
                ]
                const monthlyEv = SW.map(w => Math.round((totalEvents * w / SW_SUM) * 10) / 10)
                return { ...pd, totalEvents, counts, totalMargem, totalBruto, liquido, rows, monthlyEv }
              })

              const colorMap: Record<string, { border: string; bg: string; tc: string; badge: string; bar: string }> = {
                blue:   { border: 'border-blue-500/20',   bg: 'bg-blue-500/[0.04]',   tc: 'text-blue-300',   badge: 'bg-blue-500/10 border-blue-500/20 text-blue-300/80',   bar: 'rgba(96,165,250,0.45)' },
                gold:   { border: 'border-gold/25',       bg: 'bg-gold/[0.05]',       tc: 'text-gold',       badge: 'bg-gold/10 border-gold/25 text-gold/80',               bar: 'rgba(201,168,76,0.45)' },
                purple: { border: 'border-purple-500/20', bg: 'bg-purple-500/[0.04]', tc: 'text-purple-300', badge: 'bg-purple-500/10 border-purple-500/20 text-purple-300/80', bar: 'rgba(167,139,250,0.45)' },
              }

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/[0.04]" />
                    <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase">Estratégia de Vendas</p>
                    <div className="h-px flex-1 bg-white/[0.04]" />
                  </div>
                  <p className="text-[10px] text-white/20 text-center">
                    Para atingir <span className="font-mono font-semibold text-gold/70">{metaAnualSim.toLocaleString('pt-PT')} €</span> líquidos · 3 caminhos possíveis
                  </p>

                  {strategies.map((s, si) => {
                    const cm = colorMap[s.color]
                    const maxM = Math.max(...s.rows.map(r => r.m), 1)
                    const maxEv = Math.max(...s.monthlyEv, 1)
                    return (
                      <div key={si} className={`rounded-2xl border ${cm.border} ${cm.bg} overflow-hidden`}>

                        {/* Header */}
                        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-semibold ${cm.tc}`}>{s.name}</p>
                              <span className={`text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 rounded-full border ${cm.badge}`}>{s.tag}</span>
                            </div>
                            <p className="text-[10px] text-white/25">{s.desc}</p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <p className={`text-3xl font-light ${cm.tc}`}>{s.totalEvents}</p>
                            <p className="text-[9px] text-white/25 uppercase tracking-wider">eventos/ano</p>
                          </div>
                        </div>

                        {/* Mix breakdown with bars */}
                        <div className="px-5 py-4 space-y-3">
                          {s.rows.map((r, ri) => (
                            <div key={ri}>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-mono font-bold w-5 text-right flex-shrink-0 ${cm.tc}`}>{r.n}×</span>
                                  <span className="text-[11px] text-white/40">{r.l}</span>
                                </div>
                                <span className="text-[11px] text-white/35 font-mono">+{r.m.toLocaleString('pt-PT')} €</span>
                              </div>
                              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden ml-7">
                                <div className="h-full rounded-full" style={{ width: `${(r.m / maxM) * 100}%`, background: r.fill }} />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Totals */}
                        <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06]">
                          {[
                            { l: 'Receita Bruta',      v: `${s.totalBruto.toLocaleString('pt-PT')} €`,  tc: 'text-white/40' },
                            { l: 'Margem Total',       v: `${s.totalMargem.toLocaleString('pt-PT')} €`, tc: 'text-white/40' },
                            { l: 'Resultado Líquido',  v: `${s.liquido.toLocaleString('pt-PT')} €`,     tc: s.liquido >= metaAnualSim ? cm.tc : 'text-red-400' },
                          ].map((t, ti) => (
                            <div key={ti} className="px-3 py-3 text-center">
                              <p className="text-[8px] tracking-[0.25em] text-white/20 uppercase mb-1">{t.l}</p>
                              <p className={`text-sm font-mono font-semibold ${t.tc}`}>{t.v}</p>
                            </div>
                          ))}
                        </div>

                        {/* Monthly bar chart */}
                        <div className="px-5 py-4 border-t border-white/[0.06]">
                          <p className="text-[9px] tracking-[0.25em] text-white/20 uppercase mb-3">
                            Distribuição Mensal Sugerida · {(s.totalEvents / 12).toFixed(1)} eventos/mês médio
                          </p>
                          <div className="grid grid-cols-12 gap-1">
                            {s.monthlyEv.map((ev, mi) => {
                              const rounded = Math.round(ev)
                              return (
                                <div key={mi} className="flex flex-col items-center gap-1">
                                  <div className="h-10 w-full flex items-end justify-center">
                                    {ev > 0 ? (
                                      <div className="w-full rounded-t-sm transition-all"
                                        style={{ height: `${Math.max(4, (ev / maxEv) * 40)}px`, background: cm.bar }} />
                                    ) : (
                                      <div className="w-full h-1 rounded-full bg-white/[0.03]" />
                                    )}
                                  </div>
                                  <p className={`text-[9px] font-mono leading-none ${rounded > 0 ? cm.tc : 'text-white/15'}`}>
                                    {rounded > 0 ? rounded : '·'}
                                  </p>
                                  <p className="text-[7px] text-white/15 leading-none">{MESES_S[mi]}</p>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Action plan callout — only for recommended */}
                        {s.color === 'gold' && (
                          <div className="px-5 pb-5">
                            <div className="rounded-xl border border-gold/15 bg-gold/[0.03] px-4 py-3.5 space-y-2">
                              <p className="text-[9px] tracking-[0.35em] text-gold/50 uppercase">Plano de Ação</p>
                              {[
                                `Proposta 2 (pré-wedding) como produto principal — maior margem sem custo extra de freelancer`,
                                `Aceitar ${s.counts.p1 > 0 ? s.counts.p1 : 'poucos'} eventos P1 em meses de menor procura (Jan–Mar, Nov–Dez) para manter fluxo`,
                                `${s.counts.p3 > 0 ? s.counts.p3 : 'Alguns'} casamentos P3 (drone+SDE) para elevar posicionamento e ticket médio`,
                                `Ticket médio alvo por evento: ${Math.round(s.totalBruto / s.totalEvents).toLocaleString('pt-PT')} € — usar como referência ao fechar contratos`,
                                `${s.counts.bat > 0 ? s.counts.bat : 'Alguns'} batizados + ${s.counts.corp > 0 ? s.counts.corp : 'alguns'} corporate para diversificar receita nos meses mortos`,
                              ].map((tip, ti) => (
                                <div key={ti} className="flex items-start gap-2.5">
                                  <span className="text-gold/40 text-xs flex-shrink-0 mt-0.5">→</span>
                                  <p className="text-[11px] text-white/35 leading-relaxed">{tip}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
            </div>

            {/* ── Sazonalidade ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase">Sazonalidade</p>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              {(() => {
                const maxRec = Math.max(...resumo.map(r => r.receitas), 1)
                const totalAnual = resumo.reduce((s, r) => s + r.receitas, 0)
                const mesesMortos = ORDEM_MESES.filter(m => !resumo.find(r => r.mes === m && r.receitas > 0))
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {ORDEM_MESES.map(mes => {
                        const r = resumo.find(m => m.mes === mes)
                        const val = r?.receitas ?? 0
                        const pct = Math.round((val / maxRec) * 100)
                        const isAtual = mes === ORDEM_MESES[new Date().getMonth()] && anoNum === new Date().getFullYear()
                        return (
                          <div key={mes} className={`rounded-xl border p-3 text-center transition-colors ${
                            val === 0 ? 'border-white/[0.04] bg-white/[0.01]' :
                            pct >= 80 ? 'border-green-500/30 bg-green-500/[0.08]' :
                            pct >= 40 ? 'border-gold/20 bg-gold/[0.05]' :
                            'border-white/[0.08] bg-white/[0.03]'
                          } ${isAtual ? 'ring-1 ring-gold/30' : ''}`}>
                            <p className="text-[9px] tracking-wider text-white/30 uppercase">{mes.slice(0,3)}</p>
                            {val > 0 ? (
                              <>
                                <p className={`text-base font-mono font-semibold mt-1 ${pct >= 80 ? 'text-green-400' : pct >= 40 ? 'text-gold' : 'text-white/50'}`}>
                                  {val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                                </p>
                                <div className="mt-1.5 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 80 ? 'rgba(74,222,128,0.6)' : pct >= 40 ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.3)' }} />
                                </div>
                              </>
                            ) : (
                              <p className="text-[10px] text-white/15 mt-2">—</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {mesesMortos.length > 0 && (
                      <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.04] px-5 py-3">
                        <p className="text-[10px] tracking-[0.3em] text-orange-400/60 uppercase mb-1.5">Meses sem receita registada</p>
                        <div className="flex flex-wrap gap-2">
                          {mesesMortos.map(m => (
                            <span key={m} className="text-[10px] text-white/30 px-2.5 py-1 rounded-full border border-white/[0.06] bg-white/[0.02]">{m}</span>
                          ))}
                        </div>
                        <p className="text-[10px] text-white/20 mt-2">→ Ideal para corporate, sessões pré-wedding, álbuns pendentes ou mentoria</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Melhor Mês', val: resumo.reduce((best, r) => r.receitas > best.receitas ? r : best, resumo[0] ?? { mes: '—', receitas: 0 }) },
                        { label: 'Pior Mês Ativo', val: resumo.filter(r => r.receitas > 0).reduce((worst, r) => r.receitas < worst.receitas ? r : worst, resumo.filter(r => r.receitas > 0)[0] ?? { mes: '—', receitas: 0 }) },
                      ].map(({ label, val }) => val && (
                        <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center col-span-1">
                          <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">{label}</p>
                          <p className="text-base font-medium text-white/60">{val.mes}</p>
                          <p className="text-sm font-mono text-gold/70">{fmt(val.receitas)} €</p>
                        </div>
                      ))}
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                        <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Meses Ativos</p>
                        <p className="text-2xl font-light text-white/60">{resumo.filter(r => r.receitas > 0).length}</p>
                        <p className="text-[9px] text-white/20">de 12</p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                        <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Média Mês Ativo</p>
                        <p className="text-base font-mono font-semibold text-gold/70">
                          {resumo.filter(r => r.receitas > 0).length > 0 ? fmt(Math.round(totalAnual / resumo.filter(r => r.receitas > 0).length)) : '—'} €
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* ── Taxa de Conversão CRM ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase">Funil de Conversão CRM</p>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              {!crmEst ? (
                <div className="text-center py-8 text-white/20 text-xs tracking-widest">A carregar dados CRM…</div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { l: 'Total Leads', v: crmEst.total, c: 'text-white/60', b: 'border-white/[0.08] bg-white/[0.02]' },
                      { l: 'Em Pipeline', v: crmEst.ativos, c: 'text-blue-300', b: 'border-blue-500/20 bg-blue-500/[0.04]' },
                      { l: 'Fechados', v: crmEst.fechados, c: 'text-green-400', b: 'border-green-500/20 bg-green-500/[0.04]' },
                      { l: 'Perdidos', v: crmEst.perdidos, c: 'text-red-400/70', b: 'border-red-500/20 bg-red-500/[0.04]' },
                    ].map(c => (
                      <div key={c.l} className={`rounded-2xl border ${c.b} p-4 text-center`}>
                        <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-2">{c.l}</p>
                        <p className={`text-3xl font-light ${c.c}`}>{c.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.04] p-4 text-center">
                      <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-2">Taxa de Conversão</p>
                      <p className="text-3xl font-light text-green-400">
                        {crmEst.total > 0 ? Math.round((crmEst.fechados / crmEst.total) * 100) : 0}%
                      </p>
                      <p className="text-[9px] text-white/20 mt-1">{crmEst.fechados} de {crmEst.total} leads</p>
                    </div>
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4 text-center">
                      <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-2">Taxa de Perda</p>
                      <p className="text-3xl font-light text-red-400/70">
                        {crmEst.total > 0 ? Math.round((crmEst.perdidos / crmEst.total) * 100) : 0}%
                      </p>
                      <p className="text-[9px] text-white/20 mt-1">{crmEst.perdidos} leads perdidas</p>
                    </div>
                  </div>
                  {/* ── Propostas Fechadas — baseado em eventos reais ── */}
                  {(() => {
                    // Fonte: RECEITAS_2025 (hardcoded) + eventos Supabase (ano atual)
                    // Valor real cobrado é o dado mais fiável — sem depender de campos CRM
                    const todosEventos = [...RECEITAS_2025, ...eventReceitas]
                    const casamentos = todosEventos.filter(r => r.tipo === 'CASAMENTO' && r.valor > 0)
                    const mid12 = (p1Preco + p2Preco) / 2
                    const mid23 = (p2Preco + p3Preco) / 2
                    const b1 = casamentos.filter(r => r.valor <= mid12)
                    const b2 = casamentos.filter(r => r.valor > mid12 && r.valor <= mid23)
                    const b3 = casamentos.filter(r => r.valor > mid23)
                    const total = casamentos.length
                    const maxB = Math.max(b1.length, b2.length, b3.length, 1)
                    const ticketMedio = total > 0
                      ? Math.round(casamentos.reduce((s, r) => s + r.valor, 0) / total)
                      : 0
                    const rec2025 = RECEITAS_2025.filter(r => r.tipo === 'CASAMENTO').length
                    const recAno = eventReceitas.filter(r => r.tipo === 'CASAMENTO').length
                    return (
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase">Distribuição por Proposta</p>
                            <p className="text-[9px] text-white/15 mt-1">
                              {rec2025} casamentos 2025
                              {recAno > 0 ? ` · ${recAno} de ${anoNum}` : ''}
                              {' · '}{total} total
                            </p>
                          </div>
                          {ticketMedio > 0 && (
                            <span className="text-[10px] text-gold/60 font-mono flex-shrink-0">
                              ticket médio {ticketMedio.toLocaleString('pt-PT')} €
                            </span>
                          )}
                        </div>
                        <div className="space-y-3">
                          {[
                            { label: `Proposta 1`, sub: `≤ ${mid12.toFixed(0)} €`, items: b1, color: 'bg-blue-400/50',   tc: 'text-blue-300' },
                            { label: `Proposta 2`, sub: `${mid12.toFixed(0)} – ${mid23.toFixed(0)} €`, items: b2, color: 'bg-gold/50', tc: 'text-gold' },
                            { label: `Proposta 3`, sub: `> ${mid23.toFixed(0)} €`,  items: b3, color: 'bg-purple-400/50', tc: 'text-purple-300' },
                          ].map((row, ri) => {
                            const pct = total > 0 ? Math.round((row.items.length / total) * 100) : 0
                            const avgVal = row.items.length > 0
                              ? Math.round(row.items.reduce((s, r) => s + r.valor, 0) / row.items.length)
                              : 0
                            return (
                              <div key={ri}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[11px] font-medium ${row.tc}`}>{row.label}</span>
                                    <span className="text-[9px] text-white/20">{row.sub}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {avgVal > 0 && <span className="text-[9px] text-white/20 font-mono">~{avgVal.toLocaleString('pt-PT')} €/ev</span>}
                                    <span className={`text-sm font-mono font-bold ${row.tc}`}>{row.items.length}</span>
                                    <span className="text-[10px] text-white/25 font-mono w-8 text-right">{pct}%</span>
                                  </div>
                                </div>
                                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${row.color}`}
                                    style={{ width: `${(row.items.length / maxB) * 100}%` }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Canais de Aquisição */}
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
                    <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase mb-4">Canais de Aquisição</p>
                    <div className="space-y-3">
                      {crmEst.porChegou.map((c, i) => {
                        const convRate = c.count > 0 ? Math.round((c.fechados / c.count) * 100) : 0
                        const maxCount = crmEst.porChegou[0]?.count ?? 1
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] text-white/50 truncate">{c.canal}</span>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <span className="text-[10px] text-white/30 font-mono">{c.count} leads</span>
                                  <span className={`text-[10px] font-mono font-semibold ${convRate >= 30 ? 'text-green-400' : convRate >= 15 ? 'text-gold' : 'text-white/30'}`}>
                                    {convRate}% conv.
                                  </span>
                                </div>
                              </div>
                              <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-blue-400/40" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Ações Prioritárias ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase">Ações Prioritárias</p>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              <div className="space-y-2">
                {[
                  { u: 'IMEDIATO',    c: 'text-red-400',    b: 'border-red-500/20',    bg: 'bg-red-500/[0.04]',    a: `Implementar Proposta 1 (${p1Preco}€) como mínimo — abandonar vídeo a ${ticketMedioVideo}€` },
                  { u: 'IMEDIATO',    c: 'text-red-400',    b: 'border-red-500/20',    bg: 'bg-red-500/[0.04]',    a: 'Criar proposta PDF com os 3 packs para apresentar a novos clientes' },
                  { u: 'CURTO PRAZO', c: 'text-orange-400', b: 'border-orange-500/20', bg: 'bg-orange-500/[0.04]', a: 'Promover activamente a Proposta 2 — pré-wedding diferencia e justifica +200€' },
                  { u: 'CURTO PRAZO', c: 'text-orange-400', b: 'border-orange-500/20', bg: 'bg-orange-500/[0.04]', a: 'Avaliar se o estúdio (320€/mês = 3.840€/ano) tem retorno real' },
                  { u: 'MÉDIO PRAZO', c: 'text-yellow-400', b: 'border-yellow-500/20', bg: 'bg-yellow-500/[0.04]', a: 'Objetivo: 40% dos eventos na Proposta 2 ou 3 — maior margem com mesma carga de trabalho' },
                  { u: 'MÉDIO PRAZO', c: 'text-yellow-400', b: 'border-yellow-500/20', bg: 'bg-yellow-500/[0.04]', a: 'Criar proposta corporate autónoma — eventos tipo OLEOBIO (2.400€/dia) são muito mais eficientes' },
                ].map((row, i) => (
                  <div key={i} className={`flex items-start gap-4 rounded-xl border ${row.b} ${row.bg} px-5 py-3.5`}>
                    <span className={`text-[9px] tracking-[0.2em] ${row.c} font-medium flex-shrink-0 mt-0.5 w-24`}>{row.u}</span>
                    <span className="text-sm text-white/50">{row.a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Relatório Completo ── */}
            {relatorioOpen && (() => {
              // ── Dados financeiros dinâmicos
              const p1Preco = packsCfg.p1.preco
              const p2Preco = packsCfg.p2.preco
              const p3Preco = packsCfg.p3.preco
              const custoAnual = totalCustosFixosAnuais + 3840 + 480
              const receitasBruto  = allReceitas.reduce((s, r) => s + r.valor, 0)
              const casamentosAno  = allReceitas.filter(r => r.tipo === 'CASAMENTO')
              const ticketMedio    = casamentosAno.length > 0 ? Math.round(casamentosAno.reduce((s, r) => s + r.valor, 0) / casamentosAno.length) : 0
              const margemEstimada = receitasBruto - custoAnual

              // ── Posicionamento no mercado
              // Média Lisboa (casamentos.pt): €1,028  |  Setúbal (fixando): €400–€500
              const MEDIA_LX = 1028
              const MID_BUDGET_MAX = 750
              const MID_MID_MAX    = 1800
              const getTier = (preco: number) =>
                preco < MID_BUDGET_MAX ? 'Budget' : preco < MID_MID_MAX ? 'Mid-Range' : 'Premium'
              const getTierColor = (t: string) =>
                t === 'Budget' ? 'text-blue-300' : t === 'Mid-Range' ? 'text-gold' : 'text-purple-300'
              const getTierBg = (t: string) =>
                t === 'Budget' ? 'border-blue-500/20 bg-blue-500/[0.04]' : t === 'Mid-Range' ? 'border-gold/20 bg-gold/[0.04]' : 'border-purple-500/20 bg-purple-500/[0.04]'

              // ── Dados concorrentes (pesquisa exaustiva Lisboa/Setúbal 2025)
              const CONCORRENTES = [
                { nome: 'Alerfilme',       zona: 'Lisboa/Sintra',      min: 590,  max: 590,  inclui: '1 videógrafo · FullHD · Highlights + full film · USB',                  nota: '' },
                { nome: 'Jada Cine',       zona: 'Lisboa',             min: 400,  max: 900,  inclui: '1 videógrafo · 4K · Highlights + teaser · Drone incluído',              nota: 'pagamento até 2 meses pós-evento' },
                { nome: 'Luís Ademar',     zona: 'Lisboa',             min: 500,  max: 800,  inclui: '1 videógrafo · Full event · 3 DVDs',                                   nota: '4.9★' },
                { nome: 'EyeFocus',        zona: 'Seixal (Setúbal)',   min: 750,  max: 5000, inclui: 'Sony a7III 4K · Full coverage · Wedding Awards ★',                    nota: '5.0★ 100% rec.' },
                { nome: 'CortejoFilm',     zona: 'Almada (Setúbal)',   min: 900,  max: 1300, inclui: '1 videógrafo · Full day · Highlights + full film',                      nota: '4.9★ 98% rec.' },
                { nome: 'Bravo',           zona: 'Corroios (Setúbal)', min: 950,  max: 1500, inclui: 'Foto + Vídeo · Drone · Love Session',                                  nota: 'Setúbal focused' },
                { nome: 'Diogo Francisco', zona: 'Lisboa',             min: 950,  max: 2500, inclui: '1 videógrafo · Full coverage · edição profissional',                   nota: '5.0★ 100% rec.' },
                { nome: 'Pithon Films',    zona: 'Lisboa',             min: 900,  max: 4900, inclui: 'Personalizado · vários formatos · Chico Pithon',                       nota: '' },
                { nome: 'Make Me Feel',    zona: 'Lisboa',             min: 1250, max: 2250, inclui: '1–2 videógrafos · 4K · Drone · Highlights + full film',                nota: 'preços públicos' },
                { nome: 'LuísGorrão',      zona: 'Lisboa',             min: 1400, max: 2300, inclui: '2 videógrafos std · Drone · Sony FX3 · SDE opcional',                  nota: '5.0★ 100% rec.' },
                { nome: 'Digital Studio',  zona: 'Lisboa',             min: 1000, max: 2100, inclui: 'Foto + Vídeo · 4K multicam · Drone · SDE Pack Rubi 1.500€',            nota: 'preços públicos' },
                { nome: 'Murall Films',    zona: 'Lisboa',             min: 2000, max: 5000, inclui: '4K cinema · Drone certificado · SDE · colour grading',                 nota: 'sem preços públicos' },
                { nome: 'Laranja Metade',  zona: 'Lisboa',             min: 1150, max: 3000, inclui: 'Multi-câmara 4K · Drone · equipa 3 profissionais',                     nota: 'Timeout + Zankyou top' },
              ]

              // ── Diagnóstico automático (tips dinâmicos)
              const tips: { tipo: 'ok' | 'atenção' | 'crítico'; titulo: string; desc: string }[] = []

              // Tip 1: posicionamento P1
              const tierP1 = getTier(p1Preco)
              if (p1Preco < MEDIA_LX) {
                tips.push({ tipo: 'atenção', titulo: `Proposta 1 abaixo da média Lisboa (${MEDIA_LX}€)`, desc: `O teu P1 está a ${p1Preco}€. A média de mercado em Lisboa é ${MEDIA_LX}€. Tens espaço para subir sem perder competitividade.` })
              } else {
                tips.push({ tipo: 'ok', titulo: `Proposta 1 bem posicionada (${p1Preco}€)`, desc: `Acima da média Lisboa (${MEDIA_LX}€). Bom posicionamento para não competir apenas por preço.` })
              }

              // Tip 2: drone incluído?
              const p3HasDrone = packsCfg.p3.servicos.some(s => /drone/i.test(s))
              const p2HasDrone = packsCfg.p2.servicos.some(s => /drone/i.test(s))
              if (!p3HasDrone) {
                tips.push({ tipo: 'crítico', titulo: 'Drone não incluído na Proposta 3', desc: 'Em Lisboa, drone é standard acima de €900. Sem drone no P3 (€' + p3Preco + ') perdes para concorrentes como Make Me Feel e LuísGorrão que incluem de série.' })
              } else if (!p2HasDrone) {
                tips.push({ tipo: 'atenção', titulo: 'Drone só a partir de P3', desc: 'Considera incluir drone na P2 — Make Me Feel inclui drone a partir de €1.250. Pode ser diferenciador para fechar mais P2.' })
              } else {
                tips.push({ tipo: 'ok', titulo: 'Drone incluído a partir de P2', desc: 'Bom posicionamento. Drone como standard no P2 aumenta valor percebido face a concorrentes que cobram como add-on.' })
              }

              // Tip 3: SDE
              const p3HasSDE = packsCfg.p3.servicos.some(s => /sde|same.day/i.test(s))
              if (!p3HasSDE) {
                tips.push({ tipo: 'atenção', titulo: 'SDE (Same-Day Edit) não incluído na P3', desc: 'Digital Studio já inclui SDE no pack €1.500. Considerar adicionar SDE ao P3 para justificar o preço premium.' })
              } else {
                tips.push({ tipo: 'ok', titulo: 'SDE incluído na P3 — diferenciador forte', desc: 'SDE no P3 é um diferenciador real. Reforça este ponto no marketing — muitos concorrentes cobram €200–€300 extra.' })
              }

              // Tip 4: margem vs meta
              const evNecP2 = metaAnualSim > 0 ? Math.ceil((metaAnualSim + custoAnual) / p2Preco) : 0
              if (evNecP2 > 25) {
                tips.push({ tipo: 'crítico', titulo: `Meta requer ${evNecP2} eventos só com P2`, desc: `Com meta de €${metaAnualSim.toLocaleString('pt-PT')} e P2 a €${p2Preco}, precisas de ${evNecP2} eventos/ano — acima de 25 é operacionalmente exigente. Considera subir o P2 ou aumentar o mix de P3.` })
              } else {
                tips.push({ tipo: 'ok', titulo: `Meta atingível com ${evNecP2} eventos em P2`, desc: `Operacionalmente realista. ${evNecP2} eventos/ano em P2 dá para gerir com qualidade.` })
              }

              // Tip 5: ticket médio actual
              if (ticketMedio > 0 && ticketMedio < p1Preco) {
                tips.push({ tipo: 'crítico', titulo: `Ticket médio actual (${ticketMedio}€) abaixo do P1 (${p1Preco}€)`, desc: `Ainda existem eventos abaixo do P1. Urge eliminar trabalho abaixo de €${p1Preco} — cada evento a esse preço reduz a tua margem anual disponível.` })
              } else if (ticketMedio > 0 && ticketMedio >= p1Preco && ticketMedio < p2Preco) {
                tips.push({ tipo: 'atenção', titulo: `Ticket médio (${ticketMedio}€) ainda no P1`, desc: `A maioria dos eventos fecha em P1. O objectivo é migrar para média de P2 — foca o pitch na Sessão Pré-Wedding como upgrade natural.` })
              } else if (ticketMedio >= p2Preco) {
                tips.push({ tipo: 'ok', titulo: `Ticket médio (${ticketMedio}€) acima de P2 — excelente`, desc: `Já estás a fechar maioritariamente em P2 ou superior. Foca agora em aumentar a % de P3.` })
              }

              // Tip 6: Setúbal vs Lisboa
              tips.push({ tipo: 'atenção', titulo: 'Mercado Setúbal paga menos — diferencia a proposta', desc: `Preços Setúbal: €400–€500 (fixando.pt). Posicionares-te a €${p1Preco} em Setúbal requer diferenciação clara: qualidade 4K, drone, entregáveis superiores. Em Lisboa podes ir até €${p2Preco}–€${p3Preco} sem atrito.` })

              // Estatísticas de mercado
              const mktStats = [
                { label: 'Média Lisboa (casamentos.pt)', valor: '€1.028', cor: 'text-gold' },
                { label: 'Range Setúbal (fixando.pt)',   valor: '€400–500', cor: 'text-blue-300' },
                { label: 'Range Lisboa (fixando.pt)',    valor: '€650–1.250', cor: 'text-gold' },
                { label: 'Média nacional (zaask.pt)',    valor: '€1.050', cor: 'text-white/50' },
                { label: 'Top premium Lisboa',           valor: '€2.000–5.000', cor: 'text-purple-300' },
              ]

              return (
                <div id="relatorio-section" className="space-y-6 border-t border-white/[0.06] pt-6">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gold/20" />
                    <div className="text-center">
                      <p className="text-[10px] tracking-[0.5em] text-gold/50 uppercase">Relatório Estratégico</p>
                      <p className="text-[9px] text-white/20 mt-0.5">{new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="h-px flex-1 bg-gold/20" />
                  </div>

                  {/* ── 1. Diagnóstico Financeiro ── */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
                    <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase">1 · Diagnóstico Financeiro</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: 'Receitas Brutas', valor: `${receitasBruto.toLocaleString('pt-PT')} €`, cor: 'text-green-400' },
                        { label: 'Custos Fixos Est.', valor: `${custoAnual.toLocaleString('pt-PT')} €`, cor: 'text-red-400/70' },
                        { label: 'Margem Estimada', valor: `${margemEstimada.toLocaleString('pt-PT')} €`, cor: margemEstimada >= metaAnualSim ? 'text-green-400' : 'text-orange-400' },
                        { label: 'Meta Anual',       valor: `${metaAnualSim.toLocaleString('pt-PT')} €`, cor: 'text-gold' },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                          <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">{s.label}</p>
                          <p className={`text-lg font-light font-mono ${s.cor}`}>{s.valor}</p>
                        </div>
                      ))}
                    </div>
                    {/* Progress bar meta */}
                    <div>
                      <div className="flex justify-between text-[9px] text-white/30 mb-1.5">
                        <span>Progresso para meta ({metaAnualSim.toLocaleString('pt-PT')} €)</span>
                        <span className={margemEstimada >= metaAnualSim ? 'text-green-400' : 'text-orange-400'}>
                          {Math.min(100, Math.round((margemEstimada / metaAnualSim) * 100))}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${margemEstimada >= metaAnualSim ? 'bg-green-400/60' : 'bg-orange-400/60'}`}
                          style={{ width: `${Math.min(100, (margemEstimada / metaAnualSim) * 100)}%` }} />
                      </div>
                      {ticketMedio > 0 && (
                        <p className="text-[9px] text-white/25 mt-2">Ticket médio actual: <span className="text-gold font-mono">{ticketMedio}€</span> · Benchmark Lisboa: <span className="text-white/40 font-mono">€1.028</span></p>
                      )}
                    </div>
                  </div>

                  {/* ── 2. Posicionamento de Mercado ── */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
                    <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase">2 · Posicionamento dos Packs no Mercado Lisboa/Setúbal</p>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { key: 'p1', label: 'Proposta 1', preco: p1Preco },
                        { key: 'p2', label: 'Proposta 2', preco: p2Preco },
                        { key: 'p3', label: 'Proposta 3', preco: p3Preco },
                      ] as const).map(s => {
                        const tier = getTier(s.preco)
                        const pctMkt = Math.min(100, Math.round((s.preco / 4000) * 100))
                        return (
                          <div key={s.key} className={`rounded-xl border p-4 text-center space-y-2 ${getTierBg(tier)}`}>
                            <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase">{s.label}</p>
                            <p className={`text-2xl font-light font-mono ${getTierColor(tier)}`}>{s.preco}€</p>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full border ${getTierBg(tier)} ${getTierColor(tier)}`}>{tier}</span>
                            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden mt-2">
                              <div className="h-full rounded-full" style={{ width: `${pctMkt}%`, background: tier === 'Budget' ? 'rgba(96,165,250,0.5)' : tier === 'Mid-Range' ? 'rgba(201,168,76,0.55)' : 'rgba(167,139,250,0.55)' }} />
                            </div>
                            <p className="text-[8px] text-white/20">vs mercado Lisboa (€0–€4.000)</p>
                          </div>
                        )
                      })}
                    </div>
                    {/* Stats mercado */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                      {mktStats.map(s => (
                        <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.01] px-3 py-2 text-center">
                          <p className="text-[8px] text-white/25 mb-0.5 leading-tight">{s.label}</p>
                          <p className={`text-xs font-mono font-semibold ${s.cor}`}>{s.valor}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── 3. Benchmarking Concorrentes ── */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
                    <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase">3 · Benchmarking — Concorrentes Lisboa & Setúbal (2025)</p>
                    <div className="space-y-2">
                      {CONCORRENTES.sort((a, b) => a.min - b.min).map((c, i) => {
                        const tier = getTier((c.min + c.max) / 2)
                        const isMeuRange = (p1Preco >= c.min && p1Preco <= c.max) || (p2Preco >= c.min && p2Preco <= c.max) || (p3Preco >= c.min && p3Preco <= c.max)
                        return (
                          <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 border transition-colors ${isMeuRange ? 'border-gold/25 bg-gold/[0.04]' : 'border-white/[0.06] bg-white/[0.01]'}`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span className="text-sm text-white/70 font-medium">{c.nome}</span>
                                <span className="text-[9px] text-white/25">{c.zona}</span>
                                {isMeuRange && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/20">concorre contigo</span>}
                                {c.nota && <span className="text-[8px] text-white/20">{c.nota}</span>}
                              </div>
                              <p className="text-[9px] text-white/30 leading-relaxed">{c.inclui}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-mono font-semibold ${getTierColor(tier)}`}>
                                {c.min === c.max ? `${c.min}€` : `${c.min}–${c.max}€`}
                              </p>
                              <p className={`text-[8px] ${getTierColor(tier)}`}>{tier}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-[9px] text-white/20 text-center pt-1">Fonte: casamentos.pt · fixando.pt · zaask.pt · sites próprios — pesquisa Abr 2025</p>
                  </div>

                  {/* ── 4. Diagnóstico & Recomendações ── */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
                    <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase">4 · Diagnóstico & Recomendações</p>
                    <div className="space-y-2">
                      {tips.map((t, i) => (
                        <div key={i} className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
                          t.tipo === 'ok'      ? 'border-green-500/20 bg-green-500/[0.04]' :
                          t.tipo === 'atenção' ? 'border-yellow-500/20 bg-yellow-500/[0.04]' :
                                                 'border-red-500/20 bg-red-500/[0.04]'
                        }`}>
                          <span className="text-base flex-shrink-0 mt-0.5">
                            {t.tipo === 'ok' ? '✅' : t.tipo === 'atenção' ? '⚠️' : '🚨'}
                          </span>
                          <div>
                            <p className={`text-[11px] font-medium mb-0.5 ${
                              t.tipo === 'ok' ? 'text-green-400' : t.tipo === 'atenção' ? 'text-yellow-400' : 'text-red-400'
                            }`}>{t.titulo}</p>
                            <p className="text-[10px] text-white/40 leading-relaxed">{t.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── 5. Tendências de Mercado ── */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
                    <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase">5 · Tendências de Mercado 2025</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {[
                        { icon: '🚁', titulo: 'Drone é standard acima de €900', desc: 'Maioria dos concorrentes mid-range inclui drone. Cobrar como add-on já não justifica.' },
                        { icon: '🎬', titulo: '4K multicam substituiu FullHD', desc: 'Até em pacotes a €1.000–€1.200 o 4K é norm. FullHD já não diferencia positivamente.' },
                        { icon: '⚡', titulo: 'SDE a tornar-se mid-range', desc: 'Digital Studio já inclui SDE no pack de €1.500. Era exclusividade premium.' },
                        { icon: '📦', titulo: 'Foto+Vídeo bundle domina', desc: 'Casais preferem fornecedor único. Bundles €2.000–€2.500 aumentam fidelização.' },
                        { icon: '🔒', titulo: 'Opacidade de preços = premium', desc: '60% dos top players não publicam preços — cria percepção de exclusividade.' },
                        { icon: '📅', titulo: 'Lead time 9–12 meses em Lisboa', desc: 'Bons fornecedores estão cheios 9–12 meses antes. Foca na pré-reserva precoce.' },
                      ].map((t, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.01] px-4 py-3">
                          <span className="text-lg flex-shrink-0">{t.icon}</span>
                          <div>
                            <p className="text-[11px] text-white/60 font-medium mb-0.5">{t.titulo}</p>
                            <p className="text-[10px] text-white/30 leading-relaxed">{t.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )
            })()}

          </div>
        )
      })()}

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
