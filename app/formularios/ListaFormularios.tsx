type Link_ = { rotulo: string; href: string }
type Formulario = {
  nome: string
  quando: string
  abrir: Link_[]
  demo?: boolean // abre a simulação com um casal fictício
}

const FORMULARIOS: Formulario[] = [
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
    demo: true,
  },
  {
    nome: 'Briefing pré-casamento e reunião de preparação',
    quando: '15 dias antes do casamento',
    abrir: [{ rotulo: 'Abrir', href: '/preparacao/demo' }],
    demo: true,
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

export default function ListaFormularios() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {FORMULARIOS.map((f, i) => {
        return (
          <div key={f.nome} className="pilar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
            <span style={{ fontFamily: 'var(--fs, serif)', color: 'var(--g)', fontSize: '22px', width: '32px' }}>{String(i + 1).padStart(2, '0')}</span>
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <p style={{ fontSize: '18px', margin: 0 }}>{f.nome}</p>
              <p className="meta" style={{ marginTop: '6px' }}>{f.quando}</p>
              {f.demo && <p className="hint" style={{ marginTop: '6px' }}>Abre uma simulação com um casal fictício: nada é gravado nem enviado.</p>}
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
        )
      })}
    </div>
  )
}
