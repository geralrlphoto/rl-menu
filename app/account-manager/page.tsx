import AccountManagerClient from './AccountManagerClient'

/* ============================================================
   /account-manager
   O "account manager" da RL: ponto de situação de todos os projetos.
   Os números são calculados pela app quando se carrega em Atualizar;
   a análise e as prioridades são escritas pelo Claude Code quando o
   Rui diz "ponto de situação" (sem API paga).
   ============================================================ */

export const metadata = { title: 'Account Manager · RL' }

export default function AccountManagerPage() {
  return (
    <main className="min-h-screen overflow-x-clip font-cond bg-[#070707] text-white">
      <AccountManagerClient />
    </main>
  )
}
