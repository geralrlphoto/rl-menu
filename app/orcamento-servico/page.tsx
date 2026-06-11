import Link from 'next/link'
import '../secao/[id]/menu-geral.css'

export default function OrcamentoServico() {
  return (
    <main className="rl-mg">
      <div className="rl-mg-back-row">
        <Link href="/secao/657aa823-19f0-4bc8-a1a1-a0a712f6d6e0" className="rl-mg-back">
          <span className="chev">‹</span> Voltar
        </Link>
      </div>

      <header className="rl-mg-head">
        <div className="rl-mg-mono" aria-hidden="true">
          <span>RL</span>
        </div>
        <p className="rl-mg-eyebrow">RL Photo · Video — Back-office</p>
        <h1 className="rl-mg-title">ORÇAMENTO <em>Serviço</em></h1>
        <hr className="rl-mg-rule" />
      </header>
    </main>
  )
}
