import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  Clock3,
  AlertTriangle,
  CalendarDays,
  FileImage,
  Eye,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Activity,
  RefreshCw,
  Stethoscope
} from 'lucide-react';
import api from '../services/api';
import bgDashboard from '../assets/fondo_dashboard_2.png';

const Pendientes = () => {
  const navigate = useNavigate();
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('fecha_evaluacion');
  const [sortDirection, setSortDirection] = useState('asc');
  const [tipoVisita, setTipoVisita] = useState('');
  const visitTypeFilters = ['','Primera vez','Control rutina','Urgencia','Seguimiento'];

  const fetchPendientes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/evaluaciones', {
        params: {
          page,
          per_page: perPage,
          search: search.trim(),
          estado: 'pendiente',
          tipo_visita: tipoVisita,
          sort_by: sortBy,
          sort_dir: sortDirection
        }
      });

      if (response.data?.status === 'success') {
        setEvaluaciones(response.data.data || []);
        setTotalItems(response.data.meta?.total_items || 0);
        setTotalPages(response.data.meta?.total_pages || 1);
      } else {
        setEvaluaciones([]);
      }
    } catch (requestError) {
      console.error('Error cargando pendientes', requestError);
      setError('No se pudo cargar la cola de diagnósticos pendientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchPendientes();
    }, 300);

    return () => clearTimeout(debounce);
  }, [page, search, sortBy, sortDirection, tipoVisita]);

  const metrics = useMemo(() => {
    const total = evaluaciones.length;
    const conRadiografias = evaluaciones.filter((evaluacion) => Number(evaluacion.radiografias_count || 0) > 0).length;
    const urgencias = evaluaciones.filter((evaluacion) => evaluacion.tipo_visita === 'Urgencia').length;
    const controles = evaluaciones.filter((evaluacion) => evaluacion.tipo_visita === 'Control rutina').length;

    return {
      total,
      conRadiografias,
      urgencias,
      controles
    };
  }, [evaluaciones]);

  const sortIndicator = (key) => {
    if (sortBy !== key) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }

    return sortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 text-dentBlue-900" />
      : <ChevronDown className="w-4 h-4 text-dentBlue-900" />;
  };

  const handleSort = (key) => {
    setPage(1);
    if (sortBy === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(key);
    setSortDirection(key === 'fecha_evaluacion' ? 'asc' : 'asc');
  };

  const getPatientFullName = (evaluacion) => {
    const paciente = evaluacion?.paciente || {};
    return `${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim();
  };

  const getPatientInitials = (evaluacion) => {
    const paciente = evaluacion?.paciente || {};
    const first = paciente.nombres?.charAt(0) || '';
    const last = paciente.apellidos?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const formatDate = (fechaStr) => {
    if (!fechaStr) return 'Sin fecha';
    return new Date(fechaStr).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPendientes = totalItems || metrics.total;

  return (
    <div
      className="flex-1 overflow-auto flex flex-col h-full bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${bgDashboard})` }}
    >
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-8 py-6 shrink-0 z-10 sticky top-0">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dentBlue-900 tracking-tight">Diagnósticos pendientes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Revisa las evaluaciones que siguen en espera y entra a cada caso para continuar el trabajo clínico.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPendientes}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-dentBlue-900 text-white font-bold shadow-md hover:bg-dentBlue-800 hover:shadow-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar cola
          </button>
        </div>
      </header>

      <div className="relative flex-1 overflow-auto p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="bg-white/90 backdrop-blur-md border border-dentBlue-900/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Pendientes</p>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock3 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-dentBlue-900">{totalPendientes}</p>
            <p className="text-sm text-gray-500 mt-2">Casos aún sin finalizar.</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md border border-dentBlue-900/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Con radiografías</p>
              <div className="w-10 h-10 rounded-xl bg-dentBlue-50 flex items-center justify-center text-dentBlue-900">
                <FileImage className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-dentBlue-900">{metrics.conRadiografias}</p>
            <p className="text-sm text-gray-500 mt-2">Evaluaciones con imágenes cargadas.</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md border border-dentBlue-900/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Urgencias</p>
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-dentBlue-900">{metrics.urgencias}</p>
            <p className="text-sm text-gray-500 mt-2">Casos marcados como urgentes.</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md border border-dentBlue-900/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Controles</p>
              <div className="w-10 h-10 rounded-xl bg-dentGreen-50 flex items-center justify-center text-dentGreen-600">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-dentBlue-900">{metrics.controles}</p>
            <p className="text-sm text-gray-500 mt-2">Seguimientos y controles de rutina.</p>
          </div>
        </div>

        <section className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="relative w-full xl:max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                 placeholder="Buscar por paciente, DNI o motivo (Opcional)..."
                className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50/60 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-all shadow-sm text-sm font-medium"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {visitTypeFilters.map((filter) => {
                const isActive = tipoVisita === filter;
                const label = filter === '' ? 'Todas' : filter;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setTipoVisita(filter);
                      setPage(1);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      isActive
                        ? 'bg-dentBlue-900 text-white border-dentBlue-900 shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm">
            {error}
          </div>
        )}

        <section className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-dentBlue-900">Cola de trabajo</h2>
              <p className="text-sm text-gray-500">Todos los casos pendientes disponibles para revisión.</p>
            </div>
            <div className="text-sm text-gray-500 font-medium">
              {totalPendientes} resultado{totalPendientes !== 1 && 's'}
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-10 h-10 text-dentBlue-900 animate-spin mb-4" />
              <p className="font-medium">Cargando pendientes...</p>
            </div>
          ) : evaluaciones.length === 0 ? (
            <div className="px-6 py-16 text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                <Stethoscope className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No hay diagnósticos pendientes</h3>
              <p className="mt-1">La cola está vacía por ahora.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th scope="col" className="px-5 py-4 text-left">
                      <button type="button" onClick={() => handleSort('paciente')} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-dentBlue-900 transition-colors">
                        Paciente {sortIndicator('paciente')}
                      </button>
                    </th>
                    <th scope="col" className="px-5 py-4 text-left">
                      <button type="button" onClick={() => handleSort('fecha_evaluacion')} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-dentBlue-900 transition-colors">
                        Fecha / hora {sortIndicator('fecha_evaluacion')}
                      </button>
                    </th>
                    <th scope="col" className="px-5 py-4 text-left">
                      <button type="button" onClick={() => handleSort('tipo_visita')} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-dentBlue-900 transition-colors">
                        Tipo de visita {sortIndicator('tipo_visita')}
                      </button>
                    </th>
                    <th scope="col" className="px-5 py-4 text-center">
                      <button type="button" onClick={() => handleSort('radiografias_count')} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-dentBlue-900 transition-colors">
                        Radiografías {sortIndicator('radiografias_count')}
                      </button>
                    </th>
                    <th scope="col" className="px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {evaluaciones.map((evaluacion) => {
                    const paciente = evaluacion?.paciente || {};
                    const nombreCompleto = getPatientFullName(evaluacion);
                    const initials = getPatientInitials(evaluacion);

                    return (
                      <tr key={evaluacion.id_evaluacion} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-dentBlue-900 text-white flex items-center justify-center shadow-sm shrink-0 font-bold text-sm">
                              {initials || 'DS'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate">{nombreCompleto || 'Paciente sin nombre'}</p>
                              <p className="text-sm text-gray-500 truncate">DNI: {paciente.dni || 'No registrado'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-4 h-4 text-gray-400" />
                              <span>{formatDate(evaluacion.fecha_evaluacion)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-amber-700 font-medium">
                              <Clock3 className="w-4 h-4 text-amber-500" />
                              En espera de revisión
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                              evaluacion.tipo_visita === 'Urgencia'
                                ? 'bg-red-50 text-red-700 border-red-100'
                                : 'bg-dentBlue-50 text-dentBlue-900 border-dentBlue-100'
                            }`}>
                              {evaluacion.tipo_visita || 'Sin tipo'}
                            </span>
                            <p className="text-xs text-gray-500 max-w-[20rem] line-clamp-2">
                              {evaluacion.motivo_consulta || 'Sin motivo de consulta registrado'}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top text-center">
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border bg-gray-50 text-gray-700 border-gray-200">
                            <FileImage className="w-3.5 h-3.5" />
                            {Number(evaluacion.radiografias_count || 0)}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/evaluacion/${evaluacion.id_evaluacion}`)}
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-dentBlue-900/30 hover:text-dentBlue-900 hover:bg-dentBlue-50 transition-all text-sm font-semibold"
                            >
                              <Eye className="w-4 h-4" />
                              Ver detalle
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate('/nueva-evaluacion', { state: { resume: true, id_paciente: paciente.id_paciente, id_evaluacion: evaluacion.id_evaluacion } })}
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dentBlue-900 text-white hover:bg-dentBlue-800 shadow-sm transition-all text-sm font-semibold"
                            >
                              <Activity className="w-4 h-4" />
                              Continuar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex items-center justify-between gap-4 flex-wrap bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <div className="text-sm text-gray-500">
            Página <span className="font-semibold text-dentBlue-900">{page}</span> de <span className="font-semibold text-dentBlue-900">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pendientes;
