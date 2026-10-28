import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import EvaluacionClinica from './pages/EvaluacionClinica';
import HistorialEvaluaciones from './pages/HistorialEvaluaciones';
import ListaPacientes from './pages/ListaPacientes';
import EvaluacionDetalle from './pages/EvaluacionDetalle';
import Usuarios from './pages/Usuarios';
import Solicitudes from './pages/Solicitudes';
import Pendientes from './pages/Pendientes';
import Reportes from './pages/Reportes';
import Perfil from './pages/Perfil';
import Preferencias from './pages/Preferencias';
import Ayuda from './pages/Ayuda';
import MensajesSoporte from './pages/MensajesSoporte';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Rutas con Sidebar (Layout) */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/nueva-evaluacion" element={<EvaluacionClinica />} />    
          <Route path="/historial" element={<HistorialEvaluaciones />} />       
          <Route path="/pacientes" element={<ListaPacientes />} />
          <Route path="/evaluacion/:id" element={<EvaluacionDetalle />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/solicitudes" element={<Solicitudes />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/configuracion" element={<Preferencias />} />
          <Route path="/ayuda" element={<Ayuda />} />
          <Route path="/soporte-mensajes" element={<MensajesSoporte />} />
          <Route path="/pendientes" element={<Pendientes />} />
          <Route path="/reportes" element={<Reportes />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
