import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  FileCheck,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Clock,
  BarChart2,
  Calendar,
  AlertCircle,
  ClipboardCheck,
  Search,
  Activity,
  ArrowRight,
  Image as ImageIcon
} from 'lucide-react';
import api from '../services/api';

// Importamos la imagen de fondo para el dashboard
import bgDashboard from '../assets/fondo_dashboard_2.png';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificamos si existe usuario guardado en localStorage
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      // Si no hay usuario logueado, redirigir al login
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      const fetchStats = async () => {
        try {
           const id_odontologo = parsedUser?.id_odontologo || 1;
           const response = await api.get(`/dashboard/stats?id_odontologo=${id_odontologo}`);
           if (response.data.status === 'success') {
              setStats(response.data.data);
           }
        } catch (error) {
           console.error("Error obteniendo datos del dashboard", error);
        } finally {
           setLoading(false);
        }
      };
      
      fetchStats();
    }
  }, [navigate]);

  if (loading) {
     return <div className="p-8 text-center text-gray-500">Cargando Dashboard...</div>;
  }

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
                     <p className="text-3xl font-extrabold text-dentBlue-900">{stats?.total_pacientes || 0}</p>
                     <p className="text-sm text-green-600 font-medium mt-2 flex items-center">
                       <TrendingUp className="w-4 h-4 mr-1" /> Pacientes activos
                     </p>
                  </div>

                  {/* KPI 2 */}
                  <div className="bg-white/90 border border-dentBlue-900/10 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Diagnósticos</h3>
                        <div className="relative group cursor-help p-2 bg-green-50 rounded-lg">
                          <FileCheck className="w-5 h-5 text-dentGreen-600" />
                          <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 text-white font-normal normal-case tracking-normal text-xs p-2.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none">
                            Total de diagnósticos clínicos realizados a los pacientes en el sistema.
                          </div>
                        </div>
                     </div>
                     <p className="text-3xl font-extrabold text-dentBlue-900">{stats?.total_evaluaciones || 0}</p>
                     <p className="text-sm text-gray-500 font-medium mt-2">{stats?.evaluaciones_completadas || 0} completadas, {stats?.evaluaciones_pendientes || 0} pendiente{stats?.evaluaciones_pendientes !== 1 && 's'}</p>
                  </div>

                  {/* KPI 3 - Radiografías Subidas (Reemplaza a Lesiones Avanzadas) */}
                  <div className="bg-white/90 border border-dentBlue-900/10 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Radiografías </h3>
                        <div className="relative group cursor-help p-2 bg-indigo-50 rounded-lg">
                          <ImageIcon className="w-5 h-5 text-indigo-600" />
                          <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 text-white font-normal normal-case tracking-normal text-xs p-2.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none">
                            Total de radiografías digitales subidas y almacenadas en el sistema.
                          </div>
                        </div>
                     </div>
                     <p className="text-3xl font-extrabold text-dentBlue-900">{stats?.total_radiografias || 0}</p>
                     <p className="text-sm text-indigo-500 font-medium mt-2 flex items-center">
                       Radiografías procesadas
                     </p>
                  </div>

                  {/* KPI 4 */}
                  <div className="bg-white/90 border border-dentBlue-900/10 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Diagnósticos Hoy</h3>
                        <div className="relative group cursor-help p-2 bg-indigo-50 rounded-lg">
                          <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                          <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 text-white font-normal normal-case tracking-normal text-xs p-2.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none">
                            Diagnósticos clínicos validados y finalizadas exitosamente durante el día de hoy.
                          </div>
                        </div>
                     </div>
                     <p className="text-3xl font-extrabold text-dentBlue-900">{stats?.evaluaciones_hoy || 0}</p>
                     
                     {stats && stats.evaluaciones_ayer !== undefined ? (
                       <div className="mt-2 flex items-center">
                         {stats.evaluaciones_hoy > stats.evaluaciones_ayer ? (
                           <p className="text-sm text-green-600 font-medium flex items-center">
                             <TrendingUp className="w-4 h-4 mr-1" /> {(stats.evaluaciones_hoy - stats.evaluaciones_ayer).toString()} más que ayer
                           </p>
                         ) : stats.evaluaciones_hoy < stats.evaluaciones_ayer ? (
                           <p className="text-sm text-red-500 font-medium flex items-center">
                             <TrendingDown className="w-4 h-4 mr-1" /> {(stats.evaluaciones_ayer - stats.evaluaciones_hoy).toString()} menos que ayer
                           </p>
                         ) : (
                           <p className="text-sm text-gray-500 font-medium flex items-center">
                             <TrendingUp className="w-4 h-4 mr-1 text-gray-400" /> Igual que ayer
                           </p>
                         )}
                       </div>
                     ) : (
                       <p className="text-sm text-indigo-500 font-medium mt-2 flex items-center">
                         Pacientes atendidos hoy
                       </p>
                     )}
                  </div>
               </div>

               {/* Fila Media: Accesos Rápidos */}
               <div className="bg-dentBlue-900 rounded-2xl p-6 shadow-md text-white">
                  <h3 className="text-sm font-bold text-dentGreen-500 uppercase tracking-wider mb-5">Accesos Rápidos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    
                    <button 
                      onClick={() => navigate('/nueva-evaluacion', { state: { forceNew: true } })}
                      className="flex flex-col items-center justify-center py-4 px-2 bg-white/10 hover:bg-dentGreen-500 transition-colors rounded-xl group border border-white/5 border-dashed"
                    >
                      <PlusCircle className="w-8 h-8 mb-2 text-white group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold">Nuevo diagnóstico</span>
                    </button>

                    <button 
                      onClick={() => navigate('/pacientes')}
                      className="flex flex-col items-center justify-center py-4 px-2 bg-white/10 hover:bg-dentGreen-500 transition-colors rounded-xl group border border-white/5 border-dashed"
                    >
                      <Users className="w-8 h-8 mb-2 text-white group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold">Ver Pacientes</span>
                    </button>

                      <button className="flex flex-col items-center justify-center py-4 px-2 bg-white/10 hover:bg-dentGreen-500 transition-colors rounded-xl group border border-white/5 border-dashed">
                        <Clock className="w-8 h-8 mb-2 text-white group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-semibold">Diagnósticos Pendientes</span>
                      </button>

                      <button className="flex flex-col items-center justify-center py-4 px-2 bg-white/10 hover:bg-dentGreen-500 transition-colors rounded-xl group border border-white/5 border-dashed">
                        <BarChart2 className="w-8 h-8 mb-2 text-white group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-semibold">Estadísticas y Reportes</span>
                      </button>

                    </div>
                 </div>

                 {/* Fila Inferior: Panel Izquierdo y Derecho */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Panel Izquierdo: Últimos Diagnósticos */}
                    <div className="lg:col-span-2 bg-white/90 border border-dentBlue-900/10 rounded-2xl shadow-sm p-6">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" /> Últimos Diagnósticos
                      </h3>
                      
                      <div className="space-y-4">
                        {stats?.ultimas_evaluaciones?.length > 0 ? (
                           stats.ultimas_evaluaciones.map((evaluacion, index) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white transition-colors">
                                 <div className="flex flex-col">
                                    <span className="font-bold text-dentBlue-900">{evaluacion.paciente}</span>
                                    <span className="text-xs text-gray-500 font-medium">
                                       {evaluacion.tipo_visita} • {new Date(evaluacion.fecha_evaluacion).toLocaleDateString()}
                                    </span>
                                 </div>
                                 <div className="flex items-center space-x-3">
                                    {evaluacion.estado !== 'completada' && (
                                       <button 
                                          onClick={() => navigate('/nueva-evaluacion', { state: { resume: true, id_paciente: evaluacion.id_paciente, id_evaluacion: evaluacion.id_evaluacion } })}
                                          className="p-2 bg-dentBlue-900 hover:bg-dentBlue-800 text-white rounded-lg transition-colors flex items-center justify-center shadow-sm"
                                          title="Continuar diagnóstico"
                                       >
                                          <ArrowRight className="w-4 h-4" />
                                       </button>
                                    )}
                                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                                       evaluacion.estado === 'completada' 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-yellow-100 text-yellow-700'
                                       }`}>
                                       {evaluacion.estado}
                                    </span>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="text-center text-gray-500 py-4">No hay diagnósticos recientes</div>
                        )}
                      </div>
                    </div>

{/* Panel Derecho: Gráfico Rápido */}
                    <div className="bg-white/90 border border-dentBlue-900/10 rounded-2xl shadow-sm p-6 flex flex-col">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5 flex items-center">
                        <Activity className="w-4 h-4 mr-2" /> Caries Más Encontradas
                      </h3>

                      <div className="flex-1 flex items-end justify-center space-x-6 pt-4 relative">
                         {/* Bar 1 */}
                         <div className="flex flex-col items-center group cursor-pointer">
                            <span className="text-xs font-bold text-gray-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{stats?.detecciones_localizacion?.Corona || 0}</span>
                            <div
                               className="w-12 bg-red-400 rounded-t-lg group-hover:bg-red-500 transition-colors shadow-sm"
                               style={{ height: `${Math.max(16, (stats?.detecciones_localizacion?.Corona || 0) * 10)}px` }}
                            ></div>
                            <span className="text-xs font-semibold text-gray-500 mt-3 rotate-0">Corona</span>
                         </div>
                         {/* Bar 2 */}
                         <div className="flex flex-col items-center group cursor-pointer">
                            <span className="text-xs font-bold text-gray-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{stats?.detecciones_localizacion?.Interdental || 0}</span>
                            <div
                               className="w-12 bg-orange-400 rounded-t-lg group-hover:bg-orange-500 transition-colors shadow-sm"
                               style={{ height: `${Math.max(16, (stats?.detecciones_localizacion?.Interdental || 0) * 10)}px` }}
                            ></div>
                            <span className="text-xs font-semibold text-gray-500 mt-3 rotate-0">Interdental</span>
                         </div>
                         {/* Bar 3 */}
                         <div className="flex flex-col items-center group cursor-pointer">
                            <span className="text-xs font-bold text-gray-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{stats?.detecciones_localizacion?.Fisura || 0}</span>
                            <div
                               className="w-12 bg-yellow-400 rounded-t-lg group-hover:bg-yellow-500 transition-colors shadow-sm"
                               style={{ height: `${Math.max(16, (stats?.detecciones_localizacion?.Fisura || 0) * 10)}px` }}
                            ></div>
                            <span className="text-xs font-semibold text-gray-500 mt-3 rotate-0">Fisura</span>
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