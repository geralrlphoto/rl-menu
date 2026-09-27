type Link_ = { rotulo: string; href: string }
type Item = {
  nome: string
  quando: string
  abrir: Link_[]
  nota?: string // ex.: abre uma simulação ou um portal de teste
}

const NOTA_DEMO = 'Abre uma simulação com um casal fictício: nada é gravado nem enviado.'

const FORMULARIOS: Item[] = [
  {
    nome: 'Dados para Contrato CPS',
    quando: 'Depois de fecharem, para fazer o contrato',
    abrir: [{ rotulo: 'Casamento', href: '/contrato-cps/casamento' }, { rotulo: 'Batizado', href: '/contrato-cps/batizado' }],
  },
  {
    nome: 'Registo de Pagamento',
    quando: 'Sempre que fazem um pagamento',
    abrir: [{ rotulo: 'Abrir', href: '/registar-pagamento' }],
  },
  {
    nome: 'Marcação do Pré-Wedding',
    quando: '30 dias antes do casamento',
    abrir: [{ rotulo: 'Abrir', href: '/prewedding/demo' }],
    nota: NOTA_DEMO,
  },
  {
    nome: 'Briefing pré-casamento e reunião de preparação',
    quando: '15 dias antes do casamento',
    abrir: [{ rotulo: 'Abrir', href: '/preparacao/demo' }],
    nota: NOTA_DEMO,
  },
  {
    nome: 'Seleção de Fotografias',
    quando: 'Depois do casamento, com as fotos para seleção',
    abrir: [{ rotulo: 'Casamento', href: '/form-selecao-fotos/casamento' }, { rotulo: 'Batizado', href: '/form-selecao-fotos/batizado' }],
  },
  {
    nome: 'Satisfação',
    quando: 'No fim, depois das entregas',
    abrir: [{ rotulo: 'Abrir', href: 'https://tally.so/r/pbKJry' }],
  },
]

/* Portais de teste (abertos como admin: vê-se o que os noivos vêem, sem mexer em clientes reais) */
const PORTAIS: Item[] = [
  {
    nome: 'Portal da Reunião',
    quando: 'Antes de fecharem: reunião, proposta e confirmação',
    abrir: [{ rotulo: 'Abrir', href: '/r/493c0598-aa54-4476-994c-cd46e1aacf7f' }],
    nota: 'Lead de teste "rui e liliana". Como admin, os botões de confirmar ficam desligados.',
  },
  {
    nome: 'Portal do Casamento',
    quando: 'Depois de fecharem, até às entregas',
    abrir: [{ rotulo: 'Abrir', href: '/portal-cliente/ref/CAS_148_26_RL?admin=1' }],
    nota: 'Portal de teste Rui e Liliana (CAS_148_26_RL).',
  },
  {
    nome: 'Portal do Batizado',
    quando: 'Depois de fecharem, até às entregas',
    abrir: [{ rotulo: 'Abrir', href: '/portal-batizado/ref/BAT_TESTE_RL?admin=1' }],
    nota: 'Portal de teste (BAT_TESTE_RL), com nomes fictícios.',
  },
]

function Lista({ titulo, itens }: { titulo: string; itens: Item[] }) {
  return (
    <section style={{ marginBottom: '48px' }}>
      <p className="eyebrow" style={{ marginBottom: '8px' }}>{titulo}</p>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {itens.map((f, i) => (
          <div key={f.nome} className="pilar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
            <span style={{ fontFamily: 'var(--fs, serif)', color: 'var(--g)', fontSize: '22px', width: '32px' }}>{String(i + 1).padStart(2, '0')}</span>
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <p style={{ fontSize: '18px', margin: 0 }}>{f.nome}</p>
              <p className="meta" style={{ marginTop: '6px' }}>{f.quando}</p>
              {f.nota && <p className="hint" style={{ marginTop: '6px' }}>{f.nota}</p>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {f.abrir.map(l => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="pill"
                  style={{ borderColor: 'var(--g)', color: 'var(--g)' }}>
                  {l.rotulo} ↗
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function ListaFormularios() {
  return (
    <div>
      <Lista titulo="Formulários" itens={FORMULARIOS} />
      <Lista titulo="Portais" itens={PORTAIS} />
    </div>
  )
}
