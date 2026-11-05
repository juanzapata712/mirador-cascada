import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MiCuenta from './pages/MiCuenta';
import RutaProtegida from './components/RutaProtegida';

import LayoutAdmin from './components/LayoutAdmin';
import InicioAdmin from './pages/admin/InicioAdmin';
import Propietarios from './pages/admin/Propietarios';
import Cuotas from './pages/admin/Cuotas';
import Pagos from './pages/admin/Pagos';
import TableroAdmin from './pages/admin/TableroAdmin';
import Visitantes from './pages/admin/Visitantes';
import Porteros from './pages/admin/Porteros';
import ChatAdmin from './pages/admin/ChatAdmin';

import LayoutPropietario from './components/LayoutPropietario';
import InicioPropietario from './pages/propietario/Inicio';
import MisPagos from './pages/propietario/MisPagos';
import Tablero from './pages/propietario/Tablero';
import MisVisitantes from './pages/propietario/MisVisitantes';
import Chat from './pages/propietario/Chat';

import LayoutPorteria from './components/LayoutPorteria';
import Porteria from './pages/porteria/Porteria';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Zona del administrador */}
      <Route path="/admin" element={<RutaProtegida rol="ADMIN"><LayoutAdmin /></RutaProtegida>}>
        <Route index element={<InicioAdmin />} />
        <Route path="propietarios" element={<Propietarios />} />
        <Route path="cuotas" element={<Cuotas />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="visitantes" element={<Visitantes />} />
        <Route path="tablero" element={<TableroAdmin />} />
        <Route path="chat" element={<ChatAdmin />} />
        <Route path="porteros" element={<Porteros />} />
        <Route path="cuenta" element={<MiCuenta />} />
      </Route>

      {/* Zona del propietario */}
      <Route path="/propietario" element={<RutaProtegida rol="PROPIETARIO"><LayoutPropietario /></RutaProtegida>}>
        <Route index element={<InicioPropietario />} />
        <Route path="pagos" element={<MisPagos />} />
        <Route path="visitantes" element={<MisVisitantes />} />
        <Route path="tablero" element={<Tablero />} />
        <Route path="chat" element={<Chat />} />
        <Route path="cuenta" element={<MiCuenta />} />
      </Route>

      {/* Portería: la usan el portero y el administrador */}
      <Route path="/porteria" element={<RutaProtegida roles={['ADMIN', 'PORTERO']}><LayoutPorteria /></RutaProtegida>}>
        <Route index element={<Porteria />} />
        <Route path="cuenta" element={<MiCuenta />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
