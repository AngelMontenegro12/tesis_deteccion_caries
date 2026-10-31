import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
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
import { isValidDate, todayLocal } from '../utils/validation';

const getPaginationItems = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, 'end', total];
  if (current >= total - 3) return [1, 'start', total - 4, total - 3, total - 2, total - 1, total];
  return [1, 'start', current - 1, current, current + 1, 'end', total];
};

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
  const [pageInput, setPageInput] = useState('');
  const [pageInputError, setPageInputError] = useState('');
  const dateError = ((fechaInicio && !isValidDate(fechaInicio)) || (fechaFin && !isValidDate(fechaFin)))
    ? 'Seleccione fechas válidas desde 1900 hasta hoy.'
    : (fechaInicio && fechaFin && fechaInicio > fechaFin)
      ? 'La fecha inicial no puede ser posterior a la fecha final.' : '';
  
  const navigate = useNavigate();

  useEffect(() => {
    setPageInput('');
    setPageInputError('');
  }, [page, totalPages]);

  const goToPage = (target) => {
    if (loading || target < 1 || target > totalPages) return;
    setPage(target);
    setPageInput('');
    setPageInputError('');
  };

  const handlePageJump = (event) => {
    event.preventDefault();
    const target = Number(pageInput);
    if (!/^\d+$/.test(pageInput) || !Number.isSafeInteger(target) || target < 1 || target > totalPages) {
      setPageInputError(`Ingresa una página del 1 al ${totalPages}.`);
      return;
    }
    goToPage(target);
  };

  const fetchEvaluaciones = async () => {
    if (dateError) {
      setEvaluaciones([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }
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
      className="flex-1 overflow-auto flex flex-col h-full bg-cover bg-center bg-no-repeat bg-fixed max-lg:bg-scroll"
      style={{ backgroundImage: `url(${bgDashboard})` }}
    >
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-8 py-6 max-lg:px-4 max-lg:py-4 shrink-0 flex justify-between items-center z-10 sticky top-0">
        <div>
          <h1 className="text-2xl max-lg:text-xl font-bold text-dentBlue-900 tracking-tight">Historial de Diagnósticos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consulta y filtra todos los diagnósticos clínicos realizadas a tus pacientes.
          </p>
        </div>
      </header>

      <div className="p-8 max-lg:p-4 flex-1 flex flex-col space-y-6 max-lg:space-y-4 animate-fade-in-up">
        
        {/* Barra de Filtros */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-gray-200 p-5 max-lg:p-4 flex flex-col xl:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row w-full xl:w-auto gap-4 flex-1">
            <div className="relative w-full md:w-80 flex shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-dentBlue-900 focus:border-dentBlue-900 sm:text-sm transition-colors"
                placeholder="Buscar por nombre, apellido o DNI (Opcional)..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            {/* Rango de Fechas */}
            <div className="flex items-center max-lg:flex-col max-lg:items-stretch space-x-2 max-lg:space-x-0 max-lg:gap-2 w-full md:w-auto shrink-0 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
              <Calendar size={18} className="text-gray-400 shrink-0 max-lg:hidden" />
              <div className="flex items-center space-x-2 max-lg:flex-col max-lg:items-stretch max-lg:space-x-0 max-lg:gap-2 text-sm text-gray-600 max-lg:w-full">
                <label className="flex flex-col text-[10px] text-gray-500 max-lg:w-full">Desde (Opcional)
                  <input
                    type="date"
                    min="1900-01-01" max={todayLocal()}
                    value={fechaInicio}
                    onChange={(e) => { setFechaInicio(e.target.value); setPage(1); }}
                    className="bg-transparent border-none focus:ring-0 cursor-pointer outline-none w-28 max-lg:w-full p-0 text-sm text-gray-700"
                  />
                </label>
                <span className="text-gray-400 max-lg:hidden">-</span>
                <label className="flex flex-col text-[10px] text-gray-500 max-lg:w-full">Hasta (Opcional)
                  <input
                    type="date"
                    min="1900-01-01" max={todayLocal()}
                    value={fechaFin}
                    onChange={(e) => { setFechaFin(e.target.value); setPage(1); }}
                    className="bg-transparent border-none focus:ring-0 cursor-pointer outline-none w-28 max-lg:w-full p-0 text-sm text-gray-700"
                  />
                </label>
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

          <div className="flex items-center max-lg:flex-col max-lg:items-stretch space-x-3 max-lg:space-x-0 max-lg:gap-2 w-full md:w-auto shrink-0">
            {(search || estado || tipoVisita || fechaInicio || fechaFin) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1 transition-colors whitespace-nowrap"
              >
                Limpiar filtros
              </button>
            )}
            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 min-w-[200px] max-lg:min-w-0 max-lg:w-full">
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

        {dateError && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{dateError}</p>}

         {/* Contenedor Principal (Tabla) */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
          
          {error && <div className="p-4 text-red-500 bg-red-50 text-sm">{error}</div>}
          
          <div className="overflow-x-auto flex-1 max-lg:hidden">
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

          {/* Vista de tarjetas para móvil (la tabla se mantiene intacta en escritorio) */}
          <div className="lg:hidden flex-1 overflow-y-auto divide-y divide-gray-200">
            {loading ? (
              <div className="flex flex-col items-center justify-center space-y-3 px-6 py-12 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dentBlue-900"></div>
                <p>Cargando diagnósticos...</p>
              </div>
            ) : evaluaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-3 px-6 py-12 text-center text-gray-500">
                <AlertCircle className="w-10 h-10 text-gray-400" />
                <p className="text-lg font-medium text-gray-600">No se encontraron diagnósticos</p>
                <p className="text-sm">Prueba ajustando los filtros de búsqueda.</p>
              </div>
            ) : (
              evaluaciones.map((evaluacion) => (
                <div key={evaluacion.id_evaluacion} className="p-4 active:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-dentBlue-100 to-dentBlue-200 flex items-center justify-center text-dentBlue-900 font-bold">
                      {evaluacion.paciente.nombres.charAt(0)}{evaluacion.paciente.apellidos.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 break-words">
                        {evaluacion.paciente.nombres} {evaluacion.paciente.apellidos}
                      </p>
                      <p className="text-xs text-gray-500">DNI: {evaluacion.paciente.dni || 'No reg.'}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatearFecha(evaluacion.fecha_evaluacion).split(',')[0]}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {formatearFecha(evaluacion.fecha_evaluacion).split(',')[1]}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-900 break-words">{evaluacion.motivo_consulta || 'Sin especificar'}</p>
                      <p className="text-xs text-gray-500">{evaluacion.tipo_visita}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {evaluacion.radiografias_count} {evaluacion.radiografias_count === 1 ? 'radiografía' : 'radiografías'}
                        </span>
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
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleVerDetalles(evaluacion.id_evaluacion)}
                      className="flex-1 text-dentBlue-900 hover:text-white hover:bg-dentBlue-900 bg-blue-50 px-3 py-2 rounded flex items-center justify-center transition-colors shadow-sm text-sm font-medium"
                    >
                      <Eye size={16} />
                      <span className="ml-1.5">Ver detalle</span>
                    </button>
                    {evaluacion.estado === 'pendiente' && (
                      <button
                        type="button"
                        onClick={() => navigate('/nueva-evaluacion', { state: { resume: true, id_paciente: evaluacion.paciente.id_paciente, id_evaluacion: evaluacion.id_evaluacion } })}
                        className="flex-1 text-white hover:bg-dentBlue-800 bg-dentBlue-900 px-3 py-2 rounded flex items-center justify-center transition-colors shadow-sm text-sm font-medium"
                      >
                        <Activity size={16} />
                        <span className="ml-1.5">Continuar</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

           {/* Footer de Paginación */}
           <div className="shrink-0 border-t border-gray-100 bg-white px-5 max-lg:px-4 py-4 max-lg:py-3 sm:px-6">
             <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between lg:gap-5">
               <p className="text-center text-sm text-gray-500 lg:text-left">
                 Mostrando <span className="font-semibold text-gray-800">{totalItems === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, totalItems)}</span> de <span className="font-semibold text-gray-800">{totalItems}</span> resultados
               </p>

                {totalPages > 1 && (
                  <div className="flex max-w-full flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-end lg:ml-auto">
                   <nav className="flex max-w-full items-center gap-1 overflow-x-auto pb-1" aria-label="Páginas del historial">
                     <button
                       type="button"
                       onClick={() => goToPage(page - 1)}
                       disabled={page <= 1 || loading}
                       aria-label="Página anterior"
                       className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-dentBlue-900/30 hover:bg-dentBlue-50 hover:text-dentBlue-900 disabled:cursor-not-allowed disabled:opacity-40"
                     >
                       <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                     </button>

                     {getPaginationItems(page, totalPages).map((item) =>
                       typeof item === 'number' ? (
                         <button
                           key={item}
                           type="button"
                           onClick={() => goToPage(item)}
                           disabled={loading}
                           aria-label={`Página ${item}`}
                           aria-current={page === item ? 'page' : undefined}
                           className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                             page === item
                               ? 'bg-dentBlue-900 text-white shadow-sm'
                               : 'text-gray-600 hover:bg-dentBlue-50 hover:text-dentBlue-900'
                           }`}
                         >
                           {item}
                         </button>
                       ) : (
                         <span key={item} aria-hidden="true" className="flex h-9 w-6 shrink-0 items-center justify-center text-sm text-gray-400">…</span>
                       )
                     )}

                     <button
                       type="button"
                       onClick={() => goToPage(page + 1)}
                       disabled={page >= totalPages || loading}
                       aria-label="Página siguiente"
                       className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-dentBlue-900/30 hover:bg-dentBlue-50 hover:text-dentBlue-900 disabled:cursor-not-allowed disabled:opacity-40"
                     >
                       <ChevronRight className="h-4 w-4" aria-hidden="true" />
                     </button>
                   </nav>

                   <form onSubmit={handlePageJump} className="flex flex-col items-center gap-1 lg:items-end">
                     <div className="flex items-center gap-2">
                       <label htmlFor="historial-page-jump" className="whitespace-nowrap text-xs font-medium text-gray-500">Ir a página</label>
                       <input
                         id="historial-page-jump"
                         type="text"
                         inputMode="numeric"
                         autoComplete="off"
                         value={pageInput}
                         onChange={(event) => {
                           if (/^\d*$/.test(event.target.value) && event.target.value.length <= String(totalPages).length) {
                             setPageInput(event.target.value);
                             setPageInputError('');
                           }
                         }}
                         placeholder="#"
                         aria-invalid={Boolean(pageInputError)}
                         aria-describedby={pageInputError ? 'historial-page-error' : undefined}
                         className={`h-9 w-12 rounded-lg border bg-gray-50 text-center text-sm font-medium text-gray-800 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-dentBlue-900/10 ${pageInputError ? 'border-red-400' : 'border-gray-200 focus:border-dentBlue-900'}`}
                       />
                       <button
                         type="submit"
                         disabled={loading}
                         aria-label="Ir a la página indicada"
                         className="flex h-9 w-9 items-center justify-center rounded-lg bg-dentBlue-900 text-white transition-colors hover:bg-dentBlue-800 disabled:cursor-not-allowed disabled:opacity-40"
                       >
                         <ArrowRight className="h-4 w-4" aria-hidden="true" />
                       </button>
                     </div>
                     {pageInputError && <span id="historial-page-error" role="alert" className="text-xs text-red-600">{pageInputError}</span>}
                   </form>
                  </div>
                )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HistorialEvaluaciones;
