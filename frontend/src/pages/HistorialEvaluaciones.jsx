import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Eye, 
  Activity, 
  AlertCircle,
  FileCheck,
  Calendar,
  Clock
} from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import bgDashboard from '../assets/fondo_dashboard_2.png';

const HistorialEvaluaciones = () => {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Paginación y Filtros
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [tipoVisita, setTipoVisita] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [sortBy, setSortBy] = useState('fecha_evaluacion');
  const [sortDirection, setSortDirection] = useState('desc');
  
  const navigate = useNavigate();

  const fetchEvaluaciones = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/evaluaciones`, {
        params: {
          page,
          per_page: perPage,
          search,
          estado,
          tipo_visita: tipoVisita,
          fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            sort_by: sortBy,
            sort_dir: sortDirection
        }
      });
      
      if (response.data.status === 'success') {
        setEvaluaciones(response.data.data);
        setTotalItems(response.data.meta.total_items);
        setTotalPages(response.data.meta.total_pages);
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar las evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEvaluaciones();
    }, 400); // 400ms debounce
    return () => clearTimeout(timeoutId);
  }, [page, estado, search, tipoVisita, fechaInicio, fechaFin, sortBy, sortDirection]);

  const handleClearFilters = () => {
    setSearch('');
    setEstado('');
    setTipoVisita('');
    setFechaInicio('');
    setFechaFin('');
    setPage(1);
  };

  const handleSort = (column) => {
    setPage(1);
    if (sortBy === column) {
      setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(column);
    setSortDirection(column === 'fecha_evaluacion' ? 'desc' : 'asc');
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }

    return sortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 text-dentBlue-900" />
      : <ChevronDown className="w-4 h-4 text-dentBlue-900" />;
  };

  const renderSortableHeader = (label, column, centered = false) => (
    <button
      type="button"
      onClick={() => handleSort(column)}
      className={`w-full flex items-center gap-2 ${centered ? 'justify-center text-center' : 'justify-start text-left'} text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-dentBlue-900 transition-colors`}
      aria-label={`Ordenar por ${label}`}
      aria-sort={sortBy === column ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span>{label}</span>
      {getSortIcon(column)}
    </button>
  );

  const handleVerDetalles = (id) => {
    // Por ahora podemos navegar a algun lado (quizas en un futuro tengamos /evaluacion/:id)
    navigate(`/evaluacion/${id}`); // O console.log por mientras si no existe la ruta
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-PE', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div 
      className="flex-1 overflow-auto flex flex-col h-full bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${bgDashboard})` }}
    >
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-8 py-6 shrink-0 flex justify-between items-center z-10 sticky top-0">
        <div>
          <h1 className="text-2xl font-bold text-dentBlue-900 tracking-tight">Historial de Diagnósticos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consulta y filtra todos los diagnósticos clínicos realizadas a tus pacientes.
          </p>
        </div>
      </header>

      <div className="p-8 flex-1 flex flex-col space-y-6 animate-fade-in-up">
        
        {/* Barra de Filtros */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col xl:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row w-full xl:w-auto gap-4 flex-1">
            <div className="relative w-full md:w-80 flex shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-dentBlue-900 focus:border-dentBlue-900 sm:text-sm transition-colors"
                placeholder="Buscar por nombre, apellido o DNI..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            {/* Rango de Fechas */}
            <div className="flex items-center space-x-2 w-full md:w-auto shrink-0 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
              <Calendar size={18} className="text-gray-400 shrink-0" />
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <input 
                  type="date" 
                  value={fechaInicio}
                  onChange={(e) => { setFechaInicio(e.target.value); setPage(1); }}
                  className="bg-transparent border-none focus:ring-0 cursor-pointer outline-none w-28 p-0"
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="date" 
                  value={fechaFin}
                  onChange={(e) => { setFechaFin(e.target.value); setPage(1); }}
                  className="bg-transparent border-none focus:ring-0 cursor-pointer outline-none w-28 p-0"
                />
              </div>
            </div>
            
            {/* Tipo de Visita */}
            <div className="flex items-center w-full md:w-auto shrink-0 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
              <Activity size={18} className="text-gray-400 mr-2 shrink-0" />
              <select
                className="bg-transparent border-none text-gray-700 text-sm focus:ring-0 w-full md:min-w-[140px] cursor-pointer outline-none p-0"
                value={tipoVisita}
                onChange={(e) => {
                  setTipoVisita(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tipo de visita (Todos)</option>
                <option value="Primera vez">Primera vez</option>
                <option value="Control rutina">Control rutina</option>
                <option value="Urgencia">Urgencia</option>
                <option value="Seguimiento">Seguimiento</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto shrink-0">
            {(search || estado || tipoVisita || fechaInicio || fechaFin) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1 transition-colors whitespace-nowrap"
              >
                Limpiar filtros
              </button>
            )}
            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 min-w-[200px]">
              <Filter size={18} className="text-gray-400 mr-2 shrink-0" />
              <select
                className="bg-transparent border-none text-gray-700 text-sm focus:ring-0 w-full cursor-pointer outline-none p-0"
                value={estado}
                onChange={(e) => {
                  setEstado(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todos los Estados</option>
                <option value="completada">Completadas</option>
                <option value="pendiente">Pendientes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contenedor Principal (Tabla) */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
          
          {error && <div className="p-4 text-red-500 bg-red-50 text-sm">{error}</div>}
          
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left">
                    {renderSortableHeader('Paciente', 'paciente')}
                  </th>
                  <th scope="col" className="px-6 py-4 text-left">
                    {renderSortableHeader('Fecha / Hora', 'fecha_evaluacion')}
                  </th>
                  <th scope="col" className="px-6 py-4 text-left">
                    {renderSortableHeader('Motivo / Visita', 'motivo_consulta')}
                  </th>
                  <th scope="col" className="px-6 py-4 text-center">
                    {renderSortableHeader('Radiografías', 'radiografias_count', true)}
                  </th>
                  <th scope="col" className="px-6 py-4 text-center">
                    {renderSortableHeader('Estado', 'estado', true)}
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dentBlue-900"></div>
                        <p>Cargando diagnósticos...</p>
                      </div>
                    </td>
                  </tr>
                ) : evaluaciones.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <AlertCircle className="w-10 h-10 text-gray-400" />
                        <p className="text-lg font-medium text-gray-600">No se encontraron diagnósticos</p>
                        <p className="text-sm">Prueba ajustando los filtros de búsqueda.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  evaluaciones.map((evaluacion) => (
                    <tr key={evaluacion.id_evaluacion} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-dentBlue-100 to-dentBlue-200 flex items-center justify-center text-dentBlue-900 font-bold">
                            {evaluacion.paciente.nombres.charAt(0)}{evaluacion.paciente.apellidos.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {evaluacion.paciente.nombres} {evaluacion.paciente.apellidos}
                            </div>
                            <div className="text-xs text-gray-500">
                              DNI: {evaluacion.paciente.dni || 'No reg.'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1.5 align-middle">
                            <Calendar className="w-3.5 h-3.5 text-gray-400"/>
                            {formatearFecha(evaluacion.fecha_evaluacion).split(',')[0]}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {formatearFecha(evaluacion.fecha_evaluacion).split(',')[1]}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-xs" title={evaluacion.motivo_consulta}>
                          {evaluacion.motivo_consulta || 'Sin especificar'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {evaluacion.tipo_visita}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {evaluacion.radiografias_count} {evaluacion.radiografias_count === 1 ? 'radiografía' : 'radiografías'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          evaluacion.estado === 'completada' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {evaluacion.estado === 'completada' ? (
                            <>
                              <FileCheck size={14} className="mr-1.5" /> Completada
                            </>
                          ) : (
                            <>
                              <Activity size={14} className="mr-1.5" /> Pendiente
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleVerDetalles(evaluacion.id_evaluacion)}
                            className="text-dentBlue-900 hover:text-white hover:bg-dentBlue-900 bg-blue-50 px-3 py-1.5 rounded flex items-center justify-center transition-colors shadow-sm"
                            title="Ver detalle"
                          >
                            <Eye size={16} />
                            <span className="ml-1.5 hidden sm:inline">Ver detalle</span>
                          </button>
                          
                          {evaluacion.estado === 'pendiente' && (
                            <button
                              type="button"
                              onClick={() => navigate('/nueva-evaluacion', { state: { resume: true, id_paciente: evaluacion.paciente.id_paciente, id_evaluacion: evaluacion.id_evaluacion } })}
                              className="text-white hover:bg-dentBlue-800 bg-dentBlue-900 px-3 py-1.5 rounded flex items-center justify-center transition-colors shadow-sm"
                              title="Continuar diagnóstico"
                            >
                              <Activity size={16} />
                              <span className="ml-1.5 hidden sm:inline">Continuar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer de Paginación */}
          <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between sm:px-6 shrink-0">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando de <span className="font-semibold">{totalItems === 0 ? 0 : (page - 1) * perPage + 1}</span> a <span className="font-semibold">{Math.min(page * perPage, totalItems)}</span> de <span className="font-semibold">{totalItems}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  
                  {/* Botones de paginación numéricos simples */}
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      disabled={loading}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                        page === i + 1
                          ? 'z-10 bg-dentBlue-50 border-dentBlue-900 text-dentBlue-900'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0 || loading}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="sr-only">Siguiente</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistorialEvaluaciones;