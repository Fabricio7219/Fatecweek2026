import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';

import LoginPage       from './pages/LoginPage';
import EventosPage     from './pages/EventosPage';
import FacialPage      from './pages/FacialPage';
import ExpositoresPage from './pages/ExpositoresPage';
import PalestrasPage   from './pages/PalestrasPage';
import EstandesPage    from './pages/EstandesPage';
import RelatorioPage   from './pages/RelatorioPage';
import MesariosPage    from './pages/MesariosPage';

import './styles/style.css';

/** Wrapper que combina proteção de rota + layout com header/footer */
function PrivateLayout({ children, requiredPolicy }) {
  return (
    <ProtectedRoute requiredPolicy={requiredPolicy}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas privadas — cada uma com sua policy conforme documentação */}
        <Route path="/eventos" element={
          <PrivateLayout requiredPolicy="Events:Manage">
            <EventosPage />
          </PrivateLayout>
        } />

        <Route path="/reconhecimento-facial" element={
          <PrivateLayout>   {/* sem policy extra — apenas autenticado */}
            <FacialPage />
          </PrivateLayout>
        } />

        <Route path="/expositores" element={
          <PrivateLayout requiredPolicy="Exhibitors:Manage">
            <ExpositoresPage />
          </PrivateLayout>
        } />

        <Route path="/palestras" element={
          <PrivateLayout requiredPolicy="Lectures:Manage">
            <PalestrasPage />
          </PrivateLayout>
        } />

        <Route path="/estandes" element={
          <PrivateLayout requiredPolicy="Booths:Manage">
            <EstandesPage />
          </PrivateLayout>
        } />

        <Route path="/relatorio" element={
          <PrivateLayout>
            <RelatorioPage />
          </PrivateLayout>
        } />

        <Route path="/mesarios" element={
          <PrivateLayout requiredPolicy="Events:Manage">
            <MesariosPage />
          </PrivateLayout>
        } />

        {/* Fallback → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
