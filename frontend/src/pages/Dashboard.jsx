import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  FileCheck,
  TrendingUp,
  PlusCircle,
  Clock,
  BarChart2,
  Calendar,
  AlertCircle,
  ClipboardCheck,
  Search,
  History,
  FileText,
  Activity
} from 'lucide-react';

// Importamos la imagen de fondo para el dashboard
import bgDashboard from '../assets/fondo_dashboard_2.png';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificamos si existe usuario guardado en localStorage
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      // Si no hay usuario logueado, redirigir al login
      navigate('/login');
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [navigate]);

  return (
    <>
      {/* Topbar opcional u oculto por ahora */}
      <header className="h-20 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm shrink-0">
        <h1 className="text-2xl font-bold text-dentBlue-900 tracking-tight">
          Panel de Inicio
        </h1>
      </header>

      {/* Área donde irán las tablas, gráficos, etc. */}
      <div 
        className="flex-1 overflow-auto relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgDashboard})` }}
      >
        {/* Capa de opacidad blanca que ocupa todo el contenedor */}
        <div className="absolute inset-0 bg-white/40 z-0"></div>

        {/* Contenido Real del Dashboard */}
        <div className="relative z-10 p-8 min-h-full flex flex-col space-y-8 animate-fade-in-up">
               
               {/* Fila Superior: KPIs (Basados en la BD) */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* KPI 1 */}
                  <div className="bg-white/90 border border-dentBlue-900/10 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Pacientes</h3>
                        <div className="relative group cursor-help p-2 bg-blue-50 rounded-lg">
                          <Users className="w-5 h-5 text-blue-600" />
                          <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 text-white font-normal normal-case tracking-normal text-xs p-2.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none">
                            Cantidad total de pacientes registrados.
                          </div>
                        </div>
                     </div>
                     <p className="text-3xl font-extrabold text-dentBlue-900">6</p>
                     <p className="text-sm text-green-600 font-medium mt-2 flex items-center">
                       <TrendingUp className="w-4 h-4 mr-1" /> +2 esta semana
                     </p>
                  </div>

                  {/* KPI 2 */}
                  <div className="bg-white/90 border border-dentBlue-900/10 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Evaluaciones</h3>
                        <div className="relative group cursor-help p-2 bg-green-50 rounded-lg">
                          <FileCheck className="w-5 h-5 text-dentGreen-600" />
                          <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 text-white font-normal normal-case tracking-normal text-xs p-2.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none">
                            Total de evaluaciones clínicas realizadas a los pacientes en el sistema.
                          </div>
                        </div>
                     </div>
                     <p className="text-3xl font-extrabold text-dentBlue-900">7</p>
                     <p className="text-sm text-gray-500 font-medium mt-2">6 completadas, 1 pendiente</p>
                  </div>

                  {/* KPI 3 */}
                  <div className="bg-white/90 border border-dentBlue-900/10 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Lesiones Avanzadas</h3>
                        <div className="relative group cursor-help p-2 bg-red-50 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 text-white font-normal normal-case tracking-normal text-xs p-2.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none">
                            Cantidad de casos que necesitan intervención rápida para evitar mayores daños en el paciente.
                          </div>
                        </div>
                     </div>
                     <p className="text-3xl font-extrabold text-dentBlue-900">8</p>
                     <p className="text-sm text-red-500 font-medium mt-2 flex items-center">
                       <TrendingUp className="w-4 h-4 mr-1" /> +2 casos que el mes anterior
                     </p>
                  </div>

                  {/* KPI 4 */}
                  <div className="bg-white/90 border border-dentBlue-900/10 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Evaluaciones Hoy</h3>
                        <div className="relative group cursor-help p-2 bg-indigo-50 rounded-lg">
                          <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                          <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 text-white font-normal normal-case tracking-normal text-xs p-2.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none">
                            Evaluaciones clínicas validadas y finalizadas exitosamente durante el día de hoy.
                          </div>
                        </div>
                     </div>
                     <p className="text-3xl font-extrabold text-dentBlue-900">12</p>
                     <p className="text-sm text-indigo-500 font-medium mt-2 flex items-center">
                       <TrendingUp className="w-4 h-4 mr-1" /> +4 validaciones que ayer
                     </p>
                  </div>
               </div>

               {/* Fila Media: Accesos Rápidos */}
               <div className="bg-dentBlue-900 rounded-2xl p-6 shadow-md text-white">
                  <h3 className="text-sm font-bold text-dentGreen-500 uppercase tracking-wider mb-5">Accesos Rápidos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    
                    <button 
                      onClick={() => navigate('/nueva-evaluacion')}
                      className="flex flex-col items-center justify-center py-4 px-2 bg-white/10 hover:bg-dentGreen-500 transition-colors rounded-xl group border border-white/5 border-dashed"
                    >
                      <PlusCircle className="w-8 h-8 mb-2 text-white group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold">Nueva evaluación</span>
                    </button>

                      <button className="flex flex-col items-center justify-center py-4 px-2 bg-white/10 hover:bg-dentGreen-500 transition-colors rounded-xl group border border-white/5 border-dashed">
                        <Users className="w-8 h-8 mb-2 text-white group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-semibold">Ver Pacientes</span>
                      </button>

                      <button className="flex flex-col items-center justify-center py-4 px-2 bg-white/10 hover:bg-dentGreen-500 transition-colors rounded-xl group border border-white/5 border-dashed">
                        <Clock className="w-8 h-8 mb-2 text-white group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-semibold">Evaluaciones Recientes</span>
                      </button>

                      <button className="flex flex-col items-center justify-center py-4 px-2 bg-white/10 hover:bg-dentGreen-500 transition-colors rounded-xl group border border-white/5 border-dashed">
                        <BarChart2 className="w-8 h-8 mb-2 text-white group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-semibold">Estadísticas y Reportes</span>
                      </button>

                    </div>
                 </div>

                 {/* Fila Inferior: Panel Izquierdo y Derecho */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Panel Izquierdo: Últimas Evaluaciones */}
                    <div className="lg:col-span-2 bg-white/90 border border-dentBlue-900/10 rounded-2xl shadow-sm p-6">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" /> Últimas Evaluaciones
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Eval 1 */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white transition-colors">
                           <div className="flex flex-col">
                              <span className="font-bold text-dentBlue-900">Ángel Montenegro Lucumí</span>
                              <span className="text-xs text-gray-500 font-medium">Control mensual • 20 Jul 2025</span>
                           </div>
                           <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-yellow-100 text-yellow-700">
                              Pendiente
                           </span>
                        </div>
                        {/* Eval 2 */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white transition-colors">
                           <div className="flex flex-col">
                              <span className="font-bold text-dentBlue-900">Camila Herrera Bustamante</span>
                              <span className="text-xs text-gray-500 font-medium">Seguimiento post-tratamiento • 15 Jun 2025</span>
                           </div>
                           <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-green-100 text-green-700">
                              Completada
                           </span>
                        </div>
                        {/* Eval 3 */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white transition-colors">
                           <div className="flex flex-col">
                              <span className="font-bold text-dentBlue-900">Rodrigo Vásquez Carrasco</span>
                              <span className="text-xs text-gray-500 font-medium">Primera evaluación • 14 Jun 2025</span>
                           </div>
                           <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-green-100 text-green-700">
                              Completada
                           </span>
                        </div>
                      </div>
                    </div>

                    {/* Panel Derecho: Gráfico Rápido (Severidad de Caries CSS nativo) */}
                    <div className="bg-white/90 border border-dentBlue-900/10 rounded-2xl shadow-sm p-6 flex flex-col">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5 flex items-center">
                        <Activity className="w-4 h-4 mr-2" /> Detecciones por Severidad
                      </h3>
                      
                      <div className="flex-1 flex items-end justify-center space-x-6 pt-4 relative">
                         {/* Bar 1 */}
                         <div className="flex flex-col items-center group cursor-pointer">
                            <span className="text-xs font-bold text-gray-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">1</span>
                            <div className="w-12 bg-red-400 rounded-t-lg h-16 group-hover:bg-red-500 transition-colors shadow-sm"></div>
                            <span className="text-xs font-semibold text-gray-500 mt-3 rotate-0">Avanzada</span>
                         </div>
                         {/* Bar 2 */}
                         <div className="flex flex-col items-center group cursor-pointer">
                            <span className="text-xs font-bold text-gray-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">3</span>
                            <div className="w-12 bg-orange-400 rounded-t-lg h-32 group-hover:bg-orange-500 transition-colors shadow-sm"></div>
                            <span className="text-xs font-semibold text-gray-500 mt-3 rotate-0">Moderada</span>
                         </div>
                         {/* Bar 3 */}
                         <div className="flex flex-col items-center group cursor-pointer">
                            <span className="text-xs font-bold text-gray-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">3</span>
                            <div className="w-12 bg-yellow-400 rounded-t-lg h-32 group-hover:bg-yellow-500 transition-colors shadow-sm"></div>
                            <span className="text-xs font-semibold text-gray-500 mt-3 rotate-0">Incipiente</span>
                         </div>
                      </div>
                      
                    </div>

                 </div>
             </div>
        </div>
    </>
  );
};

export default Dashboard;