// Conta do lucro da Sessão 1 (partilhada pela calculadora e pela aula interativa)

export type Linha = { nome: string; valor: number }
export type Estado = {
  lucroMensal: number
  meses: number
  impostos: number
  fixos: Linha[]
  variaveis: Linha[]
  preco: number
  capacidade: number
  horas: number
  taxaReuniao: number
  taxaFecho: number
}

export const EXEMPLOS: { nome: string; desc: string; e: Estado }[] = [
  {
    nome: 'Fotógrafo a solo',
    desc: 'Só fotografia, edita sozinho, pouca estrutura.',
    e: {
      lucroMensal: 2000, meses: 12, impostos: 25,
      fixos: [
        { nome: 'Equipamento (renovação por ano)', valor: 3000 },
        { nome: 'Software, site e galerias', valor: 1200 },
        { nome: 'Marketing e anúncios', valor: 2500 },
        { nome: 'Contabilista e seguros', valor: 1800 },
        { nome: 'Viatura, escritório, outros', valor: 1500 },
      ],
      variaveis: [
        { nome: '2º fotógrafo / assistente', valor: 150 },
        { nome: 'Edição externa', valor: 0 },
        { nome: 'Álbum e produto', valor: 200 },
        { nome: 'Deslocação e refeições', valor: 80 },
      ],
      preco: 2200, capacidade: 26, horas: 30, taxaReuniao: 40, taxaFecho: 30,
    },
  },
  {
    nome: 'Equipa foto + vídeo',
    desc: 'Foto e vídeo com freelancers e editor externo.',
    e: {
      lucroMensal: 3000, meses: 12, impostos: 30,
      fixos: [
        { nome: 'Equipamento (renovação por ano)', valor: 6000 },
        { nome: 'Software, site e galerias', valor: 2000 },
        { nome: 'Marketing e anúncios', valor: 5000 },
        { nome: 'Contabilista e seguros', valor: 2500 },
        { nome: 'Viatura, escritório, outros', valor: 4500 },
      ],
      variaveis: [
        { nome: 'Equipa no dia (freelancers)', valor: 450 },
        { nome: 'Edição externa', valor: 400 },
        { nome: 'Álbum e produto', valor: 300 },
        { nome: 'Deslocação e refeições', valor: 100 },
      ],
      preco: 4000, capacidade: 26, horas: 40, taxaReuniao: 40, taxaFecho: 25,
    },
  },
  {
    nome: 'Estúdio premium',
    desc: 'Poucos casais, ticket alto, equipa e produto de topo.',
    e: {
      lucroMensal: 5000, meses: 12, impostos: 35,
      fixos: [
        { nome: 'Equipamento (renovação por ano)', valor: 9000 },
        { nome: 'Software, site e galerias', valor: 3000 },
        { nome: 'Marketing e anúncios', valor: 9000 },
        { nome: 'Contabilista e seguros', valor: 3500 },
        { nome: 'Viatura, escritório, outros', valor: 8000 },
      ],
      variaveis: [
        { nome: 'Equipa no dia (freelancers)', valor: 800 },
        { nome: 'Edição externa', valor: 700 },
        { nome: 'Álbum e produto', valor: 600 },
        { nome: 'Deslocação e refeições', valor: 200 },
      ],
      preco: 8500, capacidade: 22, horas: 50, taxaReuniao: 35, taxaFecho: 25,
    },
  },
]

export const milhar = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
export const eur = (v: number) => (isFinite(v) ? milhar(v) + ' €' : '—')
export const num = (v: number) => (isFinite(v) ? milhar(v) : '—')
export const soma = (l: Linha[]) => l.reduce((a, b) => a + (b.valor || 0), 0)
export const clone = (e: Estado): Estado => JSON.parse(JSON.stringify(e))

export function calc(e: Estado, preco = e.preco) {
  const lucroLiquido = e.lucroMensal * e.meses
  const lucroBruto = lucroLiquido / (1 - e.impostos / 100)
  const fixos = soma(e.fixos)
  const porCasamento = soma(e.variaveis)
  const aCobrir = lucroBruto + fixos
  const margem = preco - porCasamento
  const casamentos = margem > 0 ? Math.ceil(aCobrir / margem - 1e-9) : Infinity
  const faturacao = casamentos * preco
  const precoMinCapacidade = e.capacidade > 0 ? aCobrir / e.capacidade + porCasamento : Infinity
  const reunioes = casamentos / (e.taxaFecho / 100)
  const leads = reunioes / (e.taxaReuniao / 100)
  return { lucroLiquido, lucroBruto, fixos, porCasamento, aCobrir, margem, casamentos, faturacao, precoMinCapacidade, reunioes, leads, horasAno: casamentos * e.horas }
}
