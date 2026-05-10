import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import logoFatexpo from '../imagens/Fatexpo-01.png';

const NAV_LINKS = [
  { path: '/eventos',              label: 'Eventos' },
  { path: '/expositores',          label: 'Expositores' },
  { path: '/palestras',            label: 'Palestras' },
  { path: '/estandes',             label: 'Estandes' },
  { path: '/mesarios',             label: 'Mesários' },
  { path: '/relatorio',            label: 'Relatorio' },
  { path: '/reconhecimento-facial',label: 'Biometria' },
];

function getPermissions() {
  try {
    const token = localStorage.getItem('@App:token');
    if (!token) return [];
    const payload = JSON.parse(atob(token.split('.')[1]));
    const raw = payload?.permission ?? [];
    return Array.isArray(raw) ? raw : [raw];
  } catch {
    return [];
  }
}

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const permissions = getPermissions();
  const isAdmin = permissions.includes('Events:Manage');

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="header">
        <div className="header-content">
          <img 
            src={logoFatexpo} 
            alt="FatecWeek" 
            className="logo-principal" 
            onClick={() => navigate(isAdmin ? '/eventos' : '/reconhecimento-facial')} 
            style={{ cursor: 'pointer', width: '200px', height: 'auto', display: 'block' }} 
          />

          <div className="header-buttons">
            {isAdmin && NAV_LINKS.map(({ path, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="btn btn-secondary btn-header"
                style={{
                  background: pathname === path ? '#c41e3a' : undefined,
                  color: pathname === path ? 'white' : undefined,
                }}
              >
                {label}
              </button>
            ))}
            <button className="btn btn-header" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ flex: 1 }}>
        {children}
      </main>

      <footer className="footer">
        <p>FatecWeek — Sistema de Gerenciamento de Eventos</p>
        <p>© {new Date().getFullYear()} Centro Paula Souza</p>
      </footer>
    </div>
  );
}
