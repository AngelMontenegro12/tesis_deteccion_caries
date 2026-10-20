import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Users, Calendar, Activity, AlertCircle, FileCheck, Phone, Mail, MapPin, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { isValidDate, todayLocal } from '../utils/validation';

const HISTORY_PER_PAGE = 5;
const COMMON_VISITS = ['Primera vez', 'Control rutina', 'Urgencia', 'Seguimiento'];

const getPaginationItems = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, 'end', total];
  if (current >= total - 2) return [1, 'start', total - 2, total - 1, total];
  return [1, 'start', current, 'end', total];
};

const PatientSlideOver = ({ isOpen, onClose, patient, onEdit }) => {
  const navigate = useNavigate();
  const [fechaExacta, setFechaExacta] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [tipoVisita, setTipoVisita] = useState('');
  const [page, setPage] = useState(1);
  const scrollContainerRef = useRef(null);
  const historyRef = useRef(null);

  // La lista ya pertenece exclusivamente al paciente seleccionado y llega ordenada por fecha.
  const evaluaciones = useMemo(() => patient?.evaluaciones || [], [patient?.evaluaciones]);
  const tiposDisponibles = useMemo(() => {
    const tipos = new Set(evaluaciones.map(evaluacion => evaluacion.tipo_visita).filter(Boolean));
    return [...COMMON_VISITS.filter(tipo => tipos.has(tipo)), ...[...tipos].filter(tipo => !COMMON_VISITS.includes(tipo)).sort()];
  }, [evaluaciones]);

  const dateError = ([fechaExacta, fechaDesde, fechaHasta].some(value => value && !isValidDate(value)))
    ? 'Selecciona fechas válidas entre 1900 y hoy.'
    : (fechaDesde && fechaHasta && fechaDesde > fechaHasta)
      ? 'La fecha inicial no puede ser posterior a la fecha final.' : '';

  const evaluacionesFiltradas = useMemo(() => {
    if (dateError) return [];
    return evaluaciones.filter(evaluacion => {
      const fecha = String(evaluacion.fecha_evaluacion || '').slice(0, 10);
      return (!tipoVisita || evaluacion.tipo_visita === tipoVisita) &&
        (!fechaExacta || fecha === fechaExacta) &&
        (!fechaDesde || fecha >= fechaDesde) &&
        (!fechaHasta || fecha <= fechaHasta);
    });
  }, [evaluaciones, fechaExacta, fechaDesde, fechaHasta, tipoVisita, dateError]);

  const totalPages = Math.ceil(evaluacionesFiltradas.length / HISTORY_PER_PAGE);
  const visiblePage = Math.min(page, Math.max(1, totalPages));
  const evaluacionesVisibles = evaluacionesFiltradas.slice((visiblePage - 1) * HISTORY_PER_PAGE, visiblePage * HISTORY_PER_PAGE);

  useEffect(() => {
    setFechaExacta('');
    setFechaDesde('');
    setFechaHasta('');
    setTipoVisita('');
    setPage(1);
  }, [patient?.id_paciente, isOpen]);

  useEffect(() => {
    setPage(1);
  }, [fechaExacta, fechaDesde, fechaHasta, tipoVisita]);

  useEffect(() => {
    setPage(current => Math.min(current, Math.max(1, totalPages)));
  }, [totalPages]);

  const goToPage = target => {
    if (target < 1 || target > totalPages) return;
    setPage(target);
    const container = scrollContainerRef.current;
    const section = historyRef.current;
    if (container && section) {
      container.scrollTo({
        top: container.scrollTop + section.getBoundingClientRect().top - container.getBoundingClientRect().top,
        behavior: 'smooth'
      });
    }
  };

  if (!isOpen || !patient) return null;

  // Función para edad calculada al vuelo
  const getAge = (dateStr) => {
    if (!dateStr) return 0;
    const today = new Date();
    const birthDate = new Date(dateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  return (
    <div className={`fixed inset-0 z-50 flex justify-end ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Overlay oscuro (Backdrop) */}
      <div 
        className={`absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />

      {/* Slide-over Panel Lateral */}
      <div 
        className={`relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out z-10 
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Cabecera del Panel (Cerrar) */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-black text-dentBlue-900 tracking-tight flex items-center">
            <User className="w-5 h-5 mr-2 text-dentGreen-500" />
            Perfil Clínico
          </h2>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onEdit && onEdit(patient)}
              className="p-2 text-dentBlue-900 hover:text-dentBlue-700 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0 focus:outline-none"
              title="Editar Paciente"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {/* SECCIÓN SUPERIOR: Datos del Paciente */}
          <div className="p-8 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-black text-gray-900 mb-1 leading-tight">
                  {patient.nombres} {patient.apellidos}
                </h1>
                <p className="text-sm font-semibold text-gray-500 flex items-center">
                  <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded mr-2 text-xs">
                    DNI: {patient.dni}
                  </span>
                  {patient.fecha_nacimiento 
                    ? patient.fecha_nacimiento.split('-').reverse().join('-') 
                    : 'Fecha no registrada'}
                </p>
              </div>
            </div>

            {/* Badges Adicionales Interiores */}
            {(patient.apoderado) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                <Users className="w-5 h-5 text-dentBlue-900 opacity-60" />
                <div>
                  <p className="text-xs font-bold text-dentBlue-900 uppercase tracking-widest leading-none mb-1">
                    Apoderado Legal
                  </p>
                  <p className="text-sm font-extrabold text-gray-800">{patient.apoderado}</p>
                </div>
              </div>
            )}

            {/* Contacto Grid */}
            <div className="mt-6 grid grid-cols-1 gap-4 text-sm font-medium text-gray-600">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="truncate">Edad: {getAge(patient.fecha_nacimiento)} años</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="truncate">{patient.telefono || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="truncate">{patient.correo || 'Sin correo'}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="break-words line-clamp-2">{patient.direccion || 'Sin dirección registrada'}</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN INFERIOR: Historial Clínico (Línea de Tiempo) */}
          <div ref={historyRef} className="p-8 bg-gray-50/50 flex-1 min-h-0">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-dentBlue-900" />
              Historial de Diagnósticos
            </h3>

            {evaluaciones.length > 0 && (
              <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Filtrar historial (Opcional)</span>
                  {(fechaExacta || fechaDesde || fechaHasta || tipoVisita) && (
                    <button
                      type="button"
                      onClick={() => { setFechaExacta(''); setFechaDesde(''); setFechaHasta(''); setTipoVisita(''); }}
                      className="text-xs font-semibold text-dentBlue-900 hover:text-dentBlue-700"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="min-w-0 text-xs font-semibold text-gray-600">
                    Fecha exacta
                    <input
                      type="date"
                      min="1900-01-01" max={todayLocal()}
                      value={fechaExacta}
                      onChange={event => {
                        setFechaExacta(event.target.value);
                        setFechaDesde('');
                        setFechaHasta('');
                      }}
                      className="mt-1.5 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-dentBlue-900 focus:bg-white focus:ring-2 focus:ring-dentBlue-900/10"
                    />
                  </label>
                  <label className="min-w-0 text-xs font-semibold text-gray-600">
                    Tipo de visita
                    <select
                      value={tipoVisita}
                      onChange={event => setTipoVisita(event.target.value)}
                      className="mt-1.5 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-dentBlue-900 focus:bg-white focus:ring-2 focus:ring-dentBlue-900/10"
                    >
                      <option value="">Todas las visitas</option>
                      {tiposDisponibles.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                    </select>
                  </label>
                  <label className="min-w-0 text-xs font-semibold text-gray-600">
                    Desde
                    <input
                      type="date"
                      min="1900-01-01" max={todayLocal()}
                      value={fechaDesde}
                      onChange={event => { setFechaDesde(event.target.value); setFechaExacta(''); }}
                      className="mt-1.5 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-dentBlue-900 focus:bg-white focus:ring-2 focus:ring-dentBlue-900/10"
                    />
                  </label>
                  <label className="min-w-0 text-xs font-semibold text-gray-600">
                    Hasta
                    <input
                      type="date"
                      min="1900-01-01" max={todayLocal()}
                      value={fechaHasta}
                      onChange={event => { setFechaHasta(event.target.value); setFechaExacta(''); }}
                      className="mt-1.5 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-dentBlue-900 focus:bg-white focus:ring-2 focus:ring-dentBlue-900/10"
                    />
                  </label>
                </div>
                {dateError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{dateError}</p>}
              </div>
            )}

            {evaluaciones.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <FileCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-500">Sin historial clínico previo.</p>
                <p className="text-xs text-gray-400 mt-1">Aún no se ha realizado ningún diagnóstico para este paciente.</p>
              </div>
            ) : evaluacionesFiltradas.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white px-5 py-10 text-center shadow-sm">
                <AlertCircle className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                <p className="text-sm font-semibold text-gray-600">
                  {dateError ? 'Corrige las fechas para consultar el historial.' : 'No hay diagnósticos con estos filtros.'}
                </p>
              </div>
            ) : (
              <div className="relative pl-4 space-y-8 before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-gray-200 before:z-0">
                {evaluacionesVisibles.map(evaluacion => {
                  const isCompletada = evaluacion.estado === 'completada';
                    
                    // Parse date safely (replace space with T for valid ISO parsing)
                    const safeDateString = evaluacion.fecha_evaluacion.replace(' ', 'T');
                    const dateObj = new Date(safeDateString);
                    
                    const fechaStr = dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
                    const horaStr = dateObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });

                  return (
                    <div key={evaluacion.id_evaluacion} className="relative z-10 flex">
                      {/* Nodo (Punto Círculo) de la Línea de tiempo */}
                      <div className={`w-3 h-3 rounded-full border-2 mt-1 mr-4 flex-shrink-0 ${
                        isCompletada 
                          ? 'bg-dentGreen-500 border-white shadow-[0_0_0_2px_rgba(16,185,129,0.2)]' 
                          : 'bg-amber-400 border-white shadow-[0_0_0_2px_rgba(251,191,36,0.2)]'
                      }`} />

                      {/* Contenido de la Tarjeta del Evento */}
                      <div className={`flex-1 rounded-xl p-4 transition-all duration-200 border ${
                        isCompletada 
                          ? 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-dentGreen-100 cursor-pointer' 
                          : 'bg-amber-50/50 border-amber-100 shadow-none'
                      }`}
                        onClick={() => {
                            if (isCompletada) {
                              navigate(`/evaluacion/${evaluacion.id_evaluacion}`);
                            }
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md ${
                            isCompletada ? 'bg-green-50 text-dentGreen-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {evaluacion.estado}
                          </span>
                          <span className="text-xs font-bold text-gray-400 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {fechaStr}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-extrabold text-gray-900 mb-1">{evaluacion.tipo_visita}</h4>
                        <span className="text-xs font-medium text-gray-500">Hora: {horaStr}</span>

                        {isCompletada ? (
                            <button
                              onClick={() => navigate(`/evaluacion/${evaluacion.id_evaluacion}`)}
                              className="mt-3 pt-3 border-t border-gray-50 w-full text-left text-xs font-black text-dentBlue-900 flex items-center hover:text-dentGreen-500 transition-colors"
                            >
                              Ver diagnóstico y radiografía <span className="ml-1">→</span>
                            </button>
                        ) : (
                            <button
                              onClick={() => navigate('/nueva-evaluacion', { state: { resume: true, id_paciente: patient.id_paciente, id_evaluacion: evaluacion.id_evaluacion } })}
                              className="mt-3 pt-3 border-t border-amber-200/50 w-full text-left text-xs font-black text-amber-700 flex items-center hover:text-amber-900 transition-colors"
                            >
                              <Activity className="w-3.5 h-3.5 mr-1.5" /> Continuar diagnóstico pendiente <span className="ml-1">→</span>
                            </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {evaluacionesFiltradas.length > 0 && (
              <div className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
                <p className="text-center text-xs text-gray-500">
                  Mostrando <span className="font-semibold text-gray-800">{(visiblePage - 1) * HISTORY_PER_PAGE + 1}–{Math.min(visiblePage * HISTORY_PER_PAGE, evaluacionesFiltradas.length)}</span> de <span className="font-semibold text-gray-800">{evaluacionesFiltradas.length}</span> diagnósticos
                </p>
                {totalPages > 1 && (
                  <nav className="mt-3 flex items-center justify-center gap-1" aria-label="Páginas del historial del paciente">
                    <button
                      type="button"
                      onClick={() => goToPage(visiblePage - 1)}
                      disabled={visiblePage <= 1}
                      aria-label="Página anterior"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-dentBlue-900/30 hover:bg-dentBlue-50 hover:text-dentBlue-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {getPaginationItems(visiblePage, totalPages).map(item =>
                      typeof item === 'number' ? (
                        <button
                          key={item}
                          type="button"
                          onClick={() => goToPage(item)}
                          aria-label={`Página ${item}`}
                          aria-current={visiblePage === item ? 'page' : undefined}
                          className={`flex h-8 min-w-[30px] shrink-0 items-center justify-center rounded-lg px-1 text-xs font-semibold transition-colors ${visiblePage === item ? 'bg-dentBlue-900 text-white shadow-sm' : 'text-gray-600 hover:bg-dentBlue-50 hover:text-dentBlue-900'}`}
                        >
                          {item}
                        </button>
                      ) : (
                        <span key={item} aria-hidden="true" className="flex h-8 w-3 shrink-0 items-center justify-center text-xs text-gray-400">…</span>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => goToPage(visiblePage + 1)}
                      disabled={visiblePage >= totalPages}
                      aria-label="Página siguiente"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-dentBlue-900/30 hover:bg-dentBlue-50 hover:text-dentBlue-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer del Drawer (Opcional Acción Rápida) */}
        <div className="p-6 border-t border-gray-100 bg-white">
           <button 
             onClick={() => {
               navigate('/nueva-evaluacion', { 
                 state: { 
                   forceNew: true, 
                   paciente_preseleccionado: patient 
                 } 
               });
             }}
             className="w-full flex items-center justify-center px-4 py-3 rounded-xl font-bold text-sm text-dentBlue-900 bg-dentBlue-50 hover:bg-dentBlue-900 hover:text-white transition-colors"
           >
             + Iniciar Diagnóstico
           </button>
        </div>

      </div>
    </div>
  );
};

export default PatientSlideOver;
