import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import EvaluacionClinica from './pages/EvaluacionClinica';
import HistorialEvaluaciones from './pages/HistorialEvaluaciones';
import ListaPacientes from './pages/ListaPacientes';
import EvaluacionDetalle from './pages/EvaluacionDetalle';
import Usuarios from './pages/Usuarios';
import EnConstruccion from './pages/EnConstruccion';

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
          <Route path="/configuracion" element={<EnConstruccion title="Configuración" description="La configuración general del sistema todavía está en desarrollo." />} />
          <Route path="/ayuda" element={<EnConstruccion title="Soporte / Ayuda" description="El centro de soporte y ayuda estará disponible pronto." />} />
          <Route path="/pendientes" element={<EnConstruccion title="Diagnósticos pendientes" description="Aquí se mostrará la cola de diagnósticos pendientes cuando esté habilitada." />} />
          <Route path="/reportes" element={<EnConstruccion title="Estadísticas y reportes" description="Este módulo reunirá reportes y métricas cuando esté listo." />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
