import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import PanelAdmin from './pages/PanelAdmin';
import PanelPropietario from './pages/PanelPropietario';
import RutaProtegida from './components/RutaProtegida';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<RutaProtegida rol="ADMIN"><PanelAdmin /></RutaProtegida>} />
      <Route path="/propietario" element={<RutaProtegida rol="PROPIETARIO"><PanelPropietario /></RutaProtegida>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
