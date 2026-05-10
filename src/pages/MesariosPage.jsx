import { useEffect, useState, useCallback } from 'react';
import { userService } from '../services/userService';

const inputStyle = {
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '14px',
  flex: '1 1 160px',
};

function gerarSenhaTemporaria() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function MesariosPage() {
  const [mesarios, setMesarios]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [salvando, setSalvando]   = useState(false);
  const [senhaGerada, setSenhaGerada] = useState('');

  const [nome,     setNome]     = useState('');
  const [cpf,      setCpf]      = useState('');
  const [userName, setUserName] = useState('');
  const [email,    setEmail]    = useState('');
  const [senha,    setSenha]    = useState('');

  const carregarMesarios = useCallback(async () => {
    try {
      setLoading(true);
      const lista = await userService.listMesarios();
      setMesarios(lista);
    } catch (err) {
      console.error('Erro ao carregar mesários:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregarMesarios(); }, [carregarMesarios]);

  const handleGerarSenha = () => {
    const nova = gerarSenhaTemporaria();
    setSenha(nova);
    setSenhaGerada(nova);
  };

  const handleCadastrar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await userService.create({
        name:     nome,
        cpf:      cpf.replace(/\D/g, ''),
        userName,
        email,
        password: senha,
        role:     'mesario',
      });
      alert(`Mesário cadastrado!\n\nLogin: ${email}\nSenha: ${senha}\n\nAnote a senha — ela não será exibida novamente.`);
      carregarMesarios();
      setNome(''); setCpf(''); setUserName(''); setEmail(''); setSenha(''); setSenhaGerada('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verifique os dados e tente novamente.';
      alert(`Erro ao cadastrar: ${msg}`);
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (id, nome) => {
    if (!window.confirm(`Excluir o mesário "${nome}"? Esta ação é irreversível.`)) return;
    try {
      await userService.delete(id);
      carregarMesarios();
    } catch (err) {
      alert('Erro ao excluir o mesário.');
      console.error(err);
    }
  };

  const formatarCpf = (valor) => {
    const n = valor.replace(/\D/g, '').slice(0, 11);
    return n
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  return (
    <>
      <h2 style={{ color: '#c41e3a', marginBottom: '25px', fontSize: '26px' }}>
        Gerenciamento de Mesários
      </h2>

      {/* Formulário de cadastro */}
      <div className="card">
        <h3 style={{ color: '#c41e3a', marginBottom: '18px' }}>Cadastrar Novo Mesário</h3>
        <form onSubmit={handleCadastrar} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>

          <input
            placeholder="Nome completo"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            placeholder="CPF (000.000.000-00)"
            value={cpf}
            onChange={e => setCpf(formatarCpf(e.target.value))}
            required
            maxLength={14}
            style={inputStyle}
          />

          <input
            placeholder="Nome de usuário (login)"
            value={userName}
            onChange={e => setUserName(e.target.value.replace(/\s/g, '').toLowerCase())}
            required
            style={inputStyle}
          />

          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <div style={{ display: 'flex', gap: '8px', flex: '1 1 260px', alignItems: 'center' }}>
            <input
              placeholder="Senha temporária"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGerarSenha}
              style={{ whiteSpace: 'nowrap', padding: '10px 14px', fontSize: '13px' }}
            >
              Gerar senha
            </button>
          </div>

          {senhaGerada && (
            <div style={{
              width: '100%',
              background: '#fff8e1',
              border: '1px solid #ffe082',
              borderRadius: '6px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#555',
            }}>
              Senha gerada: <strong style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>{senhaGerada}</strong>
              <span style={{ marginLeft: '12px', color: '#c41e3a' }}>— anote antes de salvar.</span>
            </div>
          )}

          <div style={{ width: '100%' }}>
            <button
              type="submit"
              className="btn"
              disabled={salvando}
              style={{ opacity: salvando ? 0.75 : 1, cursor: salvando ? 'not-allowed' : 'pointer' }}
            >
              {salvando ? 'Cadastrando...' : 'Cadastrar Mesário'}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de mesários */}
      <div className="card">
        <h3 style={{ color: '#c41e3a', marginBottom: '18px' }}>
          Mesários Cadastrados
          {!loading && (
            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#888', marginLeft: '12px' }}>
              {mesarios.length} {mesarios.length === 1 ? 'mesário' : 'mesários'}
            </span>
          )}
        </h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>Carregando...</p>
        ) : mesarios.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
            Nenhum mesário cadastrado ainda.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #c41e3a' }}>
                  {['Nome', 'Usuário', 'Email', 'CPF', 'Ações'].map(h => (
                    <th key={h} style={{ padding: '10px 8px', color: '#c41e3a', fontWeight: 'bold' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mesarios.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{m.name || m.nome || '—'}</td>
                    <td style={{ padding: '12px 8px', fontFamily: 'monospace' }}>{m.userName || m.username || '—'}</td>
                    <td style={{ padding: '12px 8px' }}>{m.email || '—'}</td>
                    <td style={{ padding: '12px 8px', fontFamily: 'monospace' }}>{m.cpf || '—'}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <button
                        onClick={() => handleDeletar(m.id, m.name || m.nome)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '13px', color: '#dc3545', borderColor: '#dc3545' }}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
