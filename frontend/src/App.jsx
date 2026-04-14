import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import EvaluacionClinica from './pages/EvaluacionClinica';
import HistorialEvaluaciones from './pages/HistorialEvaluaciones';
import ListaPacientes from './pages/ListaPacientes';
import EvaluacionDetalle from './pages/EvaluacionDetalle';

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
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
