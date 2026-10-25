import type { FichaDados } from '@/app/media/equipa/categorias'

// Frente e verso da credencial do kit RL PROD (A6, 105 × 148 mm), para um membro num projeto.
// Usada em /media/credenciais/<ref> (uma por pessoa da equipa do projeto).

// Contactos da RL PROD no verso
const RL = { telefone: '+351 916 162 728', email: 'geral@rlprod.pt', site: 'www.rlprod.pt', ig: '@rlprod_pt', morada: 'Pinhal Novo, Portugal' }

export type MembroCredencial = { id: string; nome: string; foto_url: string | null; dados: FichaDados | null }
export type ProjetoCredencial = { cliente: string; dataTxt: string; local: string | null; gestorNome: string | null; gestorTelefone: string | null }

const iniciais = (n: string) => n.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()
const FURO = <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '5mm', width: '14mm', height: '3mm', borderRadius: '2mm', background: 'rgba(255,255,255,0.18)' }} />

export default function CredencialFaces({ m, funcao, p }: { m: MembroCredencial; funcao: string; p: ProjetoCredencial }) {
  const ficha = m.dados ?? {}
  return (
    <div className="par flex flex-wrap items-start justify-center gap-8">
      {/* Frente */}
      <div className="face">
        <p className="rotulo-face rlp-m mb-2 text-center text-[10px] text-white/45">{m.nome} · frente</p>
        <section className="credencial relative overflow-hidden flex flex-col shadow-2xl"
          style={{ width: '105mm', height: '148mm', background: 'linear-gradient(160deg, #0c2a44 0%, #00141f 55%, #000c13 100%)' }}>
          {FURO}
          <div className="flex items-center justify-between" style={{ padding: '12mm 8mm 0' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-rl-prod-branco.png" alt="RL PROD" style={{ width: '11mm', height: '11mm', objectFit: 'contain' }} />
            <span className="rlp-m" style={{ fontSize: '2.6mm', letterSpacing: '0.35em', color: '#a9c1ff' }}>EQUIPA</span>
          </div>
          <div className="flex justify-center" style={{ marginTop: '7mm' }}>
            {m.foto_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={m.foto_url} alt="" style={{ width: '40mm', height: '40mm', borderRadius: '50%', objectFit: 'cover', border: '1.2mm solid #2e6cf6' }} />
              : <span className="rlp-t flex items-center justify-center" style={{ width: '40mm', height: '40mm', borderRadius: '50%', background: '#2e6cf6', fontSize: '15mm' }}>{iniciais(m.nome)}</span>}
          </div>
          <div className="text-center" style={{ padding: '6mm 6mm 0' }}>
            <p className="rlp-t uppercase" style={{ fontSize: m.nome.length > 18 ? '7mm' : '8.5mm', lineHeight: 1 }}>{m.nome}</p>
            <p className="rlp-m uppercase" style={{ marginTop: '2.5mm', fontSize: '2.8mm', letterSpacing: '0.3em', color: '#5a8bff' }}>{funcao}</p>
          </div>
          <div className="mx-auto text-center" style={{ marginTop: '6mm', width: '85mm', padding: '3.5mm 4mm', borderTop: '0.3mm solid rgba(255,255,255,0.18)', borderBottom: '0.3mm solid rgba(255,255,255,0.18)' }}>
            <p className="rlp-m uppercase" style={{ fontSize: '2.3mm', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.5)' }}>Cliente</p>
            <p className="rlp-t uppercase" style={{ marginTop: '1.2mm', fontSize: p.cliente.length > 22 ? '4.6mm' : '5.6mm', lineHeight: 1.05 }}>{p.cliente || '·'}</p>
            {p.dataTxt && <p style={{ marginTop: '1.2mm', fontSize: '2.8mm', color: 'rgba(255,255,255,0.6)' }}>{p.dataTxt}</p>}
          </div>
          <div className="mt-auto flex items-center justify-between" style={{ background: '#2e6cf6', padding: '4mm 8mm' }}>
            <span className="rlp-t" style={{ fontSize: '5.5mm', letterSpacing: '0.04em' }}>STAFF · RL PROD</span>
            <span className="rlp-m" style={{ fontSize: '2.3mm', letterSpacing: '0.15em' }}>rlprod.pt</span>
          </div>
        </section>
      </div>

      {/* Verso: contactos da RL PROD, responsável do dia e emergência */}
      <div className="face">
        <p className="rotulo-face rlp-m mb-2 text-center text-[10px] text-white/45">{m.nome} · verso</p>
        <section className="credencial relative overflow-hidden flex flex-col shadow-2xl"
          style={{ width: '105mm', height: '148mm', background: 'linear-gradient(200deg, #0c2a44 0%, #00141f 55%, #000c13 100%)' }}>
          {FURO}
          <div style={{ padding: '12mm 8mm 0' }}>
            <p className="rlp-m uppercase" style={{ fontSize: '2.3mm', letterSpacing: '0.3em', color: '#5a8bff' }}>Contactos RL PROD</p>
            <div style={{ marginTop: '2.5mm', fontSize: '3.3mm', lineHeight: 1.55 }}>
              <p className="rlp-t" style={{ fontSize: '5mm', lineHeight: 1.1 }}>{RL.telefone}</p>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>{RL.email}</p>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>{RL.site} · {RL.ig}</p>
            </div>

            {(p.gestorNome || p.gestorTelefone || p.local) && (
              <div style={{ marginTop: '5mm', paddingTop: '4mm', borderTop: '0.3mm solid rgba(255,255,255,0.18)' }}>
                <p className="rlp-m uppercase" style={{ fontSize: '2.3mm', letterSpacing: '0.3em', color: '#5a8bff' }}>Responsável no dia</p>
                <div style={{ marginTop: '2mm', fontSize: '3.3mm', lineHeight: 1.5 }}>
                  {p.gestorNome && <p className="rlp-t" style={{ fontSize: '4.6mm', lineHeight: 1.15 }}>{p.gestorNome}</p>}
                  {p.gestorTelefone && <p style={{ color: 'rgba(255,255,255,0.85)' }}>{p.gestorTelefone}</p>}
                  {p.local && <p style={{ color: 'rgba(255,255,255,0.6)' }}>Local: {p.local}</p>}
                </div>
              </div>
            )}

            <div style={{ marginTop: '5mm', padding: '3.5mm 4mm', borderRadius: '2.5mm', border: '0.4mm solid rgba(255,71,71,0.6)', background: 'rgba(255,71,71,0.08)' }}>
              <p className="rlp-m uppercase" style={{ fontSize: '2.3mm', letterSpacing: '0.3em', color: '#ff8a8a' }}>Em caso de emergência</p>
              {ficha.urgenciaNome || ficha.urgenciaTelefone ? (
                <div style={{ marginTop: '2mm', fontSize: '3.3mm', lineHeight: 1.5 }}>
                  <p className="rlp-t" style={{ fontSize: '4.6mm', lineHeight: 1.15 }}>{ficha.urgenciaNome || 'Contacto de urgência'}{ficha.urgenciaRelacao ? ` (${ficha.urgenciaRelacao})` : ''}</p>
                  {ficha.urgenciaTelefone && <p style={{ color: 'rgba(255,255,255,0.9)' }}>{ficha.urgenciaTelefone}</p>}
                </div>
              ) : (
                <p style={{ marginTop: '2mm', fontSize: '3mm', color: 'rgba(255,255,255,0.6)' }}>Contacto de urgência por preencher na ficha.</p>
              )}
              <p style={{ marginTop: '2mm', fontSize: '3mm', color: 'rgba(255,255,255,0.75)' }}>Emergência médica: <b className="rlp-t" style={{ fontSize: '4.2mm', color: '#fff' }}>112</b></p>
            </div>
          </div>

          <div className="mt-auto text-center" style={{ padding: '0 8mm 5mm' }}>
            <p style={{ fontSize: '2.6mm', lineHeight: 1.4, color: 'rgba(255,255,255,0.55)' }}>Se encontrar esta credencial, por favor contacte a RL PROD.</p>
          </div>
          <div className="flex items-center justify-between" style={{ background: '#2e6cf6', padding: '4mm 8mm' }}>
            <span className="rlp-t" style={{ fontSize: '5.5mm', letterSpacing: '0.04em' }}>{m.nome.trim().split(/\s+/)[0].toUpperCase()}</span>
            <span className="rlp-m" style={{ fontSize: '2.3mm', letterSpacing: '0.15em' }}>{RL.morada}</span>
          </div>
        </section>
      </div>
    </div>
  )
}
