import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  User, 
  Calendar, 
  Activity, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import api from '../services/api';

const getBaseUrl = () => {
  // Extraer la URL base del API eliminando el '/api' al final
  const apiUrl = api.defaults.baseURL || 'http://127.0.0.1:5000/api';
  return apiUrl.replace('/api', '/');
};

const IMAGE_BASE_URL = getBaseUrl();

const CLASS_STYLES = {
  incipiente: {
    badge: 'border-amber-500 bg-amber-50 text-amber-800',
    box: 'border-amber-500 bg-amber-400/20',
  },
  moderada: {
    badge: 'border-orange-600 bg-orange-50 text-orange-800',
    box: 'border-orange-600 bg-orange-500/20',
  },
  avanzada: {
    badge: 'border-red-700 bg-red-50 text-red-800',
    box: 'border-red-700 bg-red-600/20',
  },
};

const ImageSlider = ({ beforeImage, afterImage, beforeDetections = [], afterDetections = [] }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [beforeSize, setBeforeSize] = useState({ w: 1, h: 1 });
  const [afterSize, setAfterSize] = useState({ w: 1, h: 1 });
  
  const resolveUrl = (url) => {
    if (!url) return '';
    const normalizedUrl = url.replace(/\\/g, '/');
    if (normalizedUrl.startsWith('http')) return normalizedUrl;
    const base = IMAGE_BASE_URL.endsWith('/') ? IMAGE_BASE_URL : `${IMAGE_BASE_URL}/`;
    const path = normalizedUrl.startsWith('/') ? normalizedUrl.substring(1) : normalizedUrl;
    return `${base}${path}`;
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='14' font-weight='bold' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3EImagen no encontrada en el disco%3C/text%3E%3C/svg%3E";
  };

  const beforeSrc = resolveUrl(beforeImage);
  const afterSrc = resolveUrl(afterImage);

  return (
    <div className="relative w-full h-[500px] max-lg:h-[300px] bg-gray-100 rounded-2xl overflow-hidden group select-none border-2 border-dashed border-gray-300 flex items-center justify-center">
      {/* Base image: Before (Oldest) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative max-w-full max-h-full" style={{ aspectRatio: `${beforeSize.w}/${beforeSize.h}` }}>
          <img 
            src={beforeSrc} 
            className="w-full h-full object-contain" 
            alt="Antes" 
            draggable="false"
            onError={handleImageError}
            onLoad={(e) => setBeforeSize({ w: e.target.naturalWidth || 1, h: e.target.naturalHeight || 1 })}
          />
          <div className="absolute inset-0 pointer-events-none">
            {beforeDetections && beforeDetections.map((det, idx) => {
                const severity = det.severidad || 'incipiente';
                const styles = CLASS_STYLES[severity] || CLASS_STYLES.incipiente;
                
                const left = `${(det.bbox_x / beforeSize.w) * 100}%`;
                const top = `${(det.bbox_y / beforeSize.h) * 100}%`;
                const width = `${(det.bbox_ancho / beforeSize.w) * 100}%`;
                const height = `${(det.bbox_alto / beforeSize.h) * 100}%`;

                return (
                  <div 
                    key={idx}
                    className={`absolute border-[3px] shadow-[0_0_15px_rgba(0,0,0,0.5)] ${styles.box}`}
                    style={{ left, top, width, height }}
                  />
                );
            })}
          </div>
        </div>
      </div>
      
      {/* Overlay image: After (Newest) */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
      >
        <div className="relative max-w-full max-h-full" style={{ aspectRatio: `${afterSize.w}/${afterSize.h}` }}>
          <img 
            src={afterSrc} 
            className="w-full h-full object-contain" 
            alt="Después" 
            draggable="false"
            onError={handleImageError}
            onLoad={(e) => setAfterSize({ w: e.target.naturalWidth || 1, h: e.target.naturalHeight || 1 })}
          />
          <div className="absolute inset-0 pointer-events-none">
            {afterDetections && afterDetections.map((det, idx) => {
                const severity = det.severidad || 'incipiente';
                const styles = CLASS_STYLES[severity] || CLASS_STYLES.incipiente;
                
                const left = `${(det.bbox_x / afterSize.w) * 100}%`;
                const top = `${(det.bbox_y / afterSize.h) * 100}%`;
                const width = `${(det.bbox_ancho / afterSize.w) * 100}%`;
                const height = `${(det.bbox_alto / afterSize.h) * 100}%`;

                return (
                  <div 
                    key={idx}
                    className={`absolute border-[3px] shadow-[0_0_15px_rgba(0,0,0,0.5)] ${styles.box}`}
                    style={{ left, top, width, height }}
                  />
                );
            })}
          </div>
        </div>
      </div>

      {/* Slider handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white/90 shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize flex items-center justify-center z-10 pointer-events-none"
        style={{ left: `calc(${sliderPos}% - 2px)` }}
      >
         <div className="w-10 h-10 bg-white rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)] border border-gray-200 flex items-center justify-center pointer-events-none">
            <ChevronRight className="w-5 h-5 text-dentBlue-900 transform rotate-180 absolute -left-1" />
            <ChevronRight className="w-5 h-5 text-dentBlue-900 absolute -right-1" />
         </div>
      </div>
      
      {/* Invisible range input for control */}
      <input 
        type="range" min="0" max="100" value={sliderPos}
        onChange={(e) => setSliderPos(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20 m-0 p-0"
      />

      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-bold tracking-wider z-10 pointer-events-none">
        ANTES
      </div>
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-bold tracking-wider z-10 pointer-events-none">
        DESPUÉS
      </div>
    </div>
  );
};

const TimelineItem = ({ visit }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  
  return (
    <div className="relative pl-6 pb-6 border-l-2 border-dentBlue-200/60 last:border-l-transparent last:pb-0">
      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-dentBlue-500 shadow-sm" />
      
      <div className="bg-gradient-to-br from-white to-dentBlue-50/40 rounded-xl border border-dentBlue-100/60 shadow-[0_2px_10px_rgba(15,59,76,0.04)] p-4 hover:shadow-md hover:border-dentBlue-200 transition-all">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-extrabold text-dentBlue-900 text-sm capitalize">{visit.tipo_visita}</h4>
          <span className="text-[11px] font-bold text-dentBlue-800/60 tracking-wider flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-dentBlue-100 shadow-sm">
            <Calendar className="w-3 h-3 text-dentBlue-500" />
            {visit.fecha_evaluacion.split(' ')[0]}
          </span>
        </div>
        
        {visit.diagnostico_texto && (
          <div className="mb-2">
            <p className="text-xs font-bold text-dentBlue-800/50 uppercase tracking-wider mb-1">Diagnóstico</p>
            <p className="text-sm text-gray-700 font-medium line-clamp-2">{visit.diagnostico_texto}</p>
          </div>
        )}

        {visit.plan_tratamiento && (
          <div>
            <p className="text-xs font-bold text-dentBlue-800/50 uppercase tracking-wider mb-1 mt-3">Plan de Tratamiento</p>
            <p className={`text-sm text-gray-700 bg-white/80 p-3 rounded-lg border border-dentBlue-100/50 shadow-inner leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
              {visit.plan_tratamiento}
            </p>
            
            {visit.plan_tratamiento.length > 150 && (
              <button 
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-xs font-bold text-dentBlue-600 hover:text-dentBlue-800 flex items-center gap-1 transition-colors"
              >
                {expanded ? (
                  <><ChevronUp className="w-3 h-3" /> Ver menos</>
                ) : (
                  <><ChevronDown className="w-3 h-3" /> Ver más</>
                )}
              </button>
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-dentBlue-100/50">
          <button
            onClick={() => navigate(`/evaluacion/${visit.id_evaluacion}`)}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all ${
              visit.estado === 'pendiente' 
                ? 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 hover:shadow-md' 
                : 'bg-dentBlue-900 text-white hover:bg-dentBlue-800 hover:shadow-md'
            }`}
          >
            {visit.estado === 'pendiente' ? (
              <><Clock className="w-4 h-4" /> Continuar evaluación</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Ver evaluación</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReporteIndividual = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedPatient, setSelectedPatient] = useState(() => {
    const saved = localStorage.getItem('reportes_selectedPatient');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAntesIdx, setSelectedAntesIdx] = useState(-1);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const res = await api.get(`/pacientes/buscar?q=${searchQuery}`);
          setSearchResults(res.data || []);
        } catch (err) {
          console.error("Error buscando pacientes", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedPatient && !reportData && !loadingReport) {
      loadPatientReport(selectedPatient, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPatientReport = async (patient, isInitialLoad = false) => {
    if (!isInitialLoad) {
      setSelectedPatient(patient);
      localStorage.setItem('reportes_selectedPatient', JSON.stringify(patient));
    }
    setSearchQuery('');
    setSearchResults([]);
    setLoadingReport(true);
    setError(null);
    setReportData(null);
    setSelectedAntesIdx(-1);

    try {
      const res = await api.get(`/reportes/diagnostico-individual?id_paciente=${patient.id_paciente}`);
      if (res.data && res.data.status === 'success') {
        setReportData(res.data.data);
      } else {
        setError(res.data?.message || 'Error desconocido al cargar reporte.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar el reporte del paciente.');
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Búsqueda de Paciente */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 max-lg:p-4 relative z-30">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Contexto clínico</p>
            <h3 className="mt-1 text-xl font-extrabold text-dentBlue-900 tracking-tight">Buscar Paciente</h3>
            <p className="mt-1 text-sm text-gray-500">Busca por DNI, nombres o apellidos para ver su evolución longitudinal.</p>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-dentBlue-500/20 focus:border-dentBlue-500 transition-all font-medium text-gray-700"
             placeholder="Ej. Juan Pérez o 72458901 (Opcional)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <div className="w-4 h-4 border-2 border-dentBlue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Resultados Autocomplete */}
          {searchResults.length > 0 && (
            <div className="absolute w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-64 overflow-y-auto">
              {searchResults.map((p) => (
                <button
                  key={p.id_paciente}
                  onClick={() => loadPatientReport(p)}
                  className="w-full text-left px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 flex items-center gap-4 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-dentBlue-100 text-dentBlue-900 font-bold flex items-center justify-center shrink-0">
                    {p.nombres.charAt(0)}{p.apellidos.charAt(0)}
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-800">{p.nombres} {p.apellidos}</p>
                    <p className="text-xs text-gray-500 font-medium">DNI: {p.dni} • {p.edad} años</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loadingReport && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 p-12 max-lg:p-6 flex flex-col items-center justify-center">
           <div className="w-12 h-12 border-4 border-dentBlue-200 border-t-dentBlue-600 rounded-full animate-spin mb-4"></div>
           <p className="text-dentBlue-900 font-bold">Analizando historial del paciente...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-6 font-medium flex items-center gap-3">
          <AlertCircle className="w-6 h-6" />
          {error}
        </div>
      )}

      {reportData && !loadingReport && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* 1. Cabecera del Paciente */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 max-lg:p-4 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 max-lg:w-20 max-lg:h-20 rounded-full bg-gradient-to-br from-dentBlue-100 to-dentBlue-200 text-dentBlue-900 font-extrabold text-3xl max-lg:text-2xl flex items-center justify-center shadow-inner shrink-0">
              {reportData.paciente.nombres.charAt(0)}{reportData.paciente.apellidos.charAt(0)}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl max-lg:text-2xl font-black text-gray-900 tracking-tight">
                {reportData.paciente.nombres} <span className="text-dentBlue-900">{reportData.paciente.apellidos}</span>
              </h2>
              <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-bold">
                  <User className="w-4 h-4" /> {reportData.paciente.edad} años
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-bold">
                  Sexo: {reportData.paciente.genero === 'M' ? 'Masculino' : reportData.paciente.genero === 'F' ? 'Femenino' : 'Otro'}
                </span>
                {reportData.paciente.primera_visita && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-dentBlue-50 text-dentBlue-800 text-sm font-bold">
                    <Clock className="w-4 h-4" /> 1ra Visita: {reportData.paciente.primera_visita.split(' ')[0]}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dentGreen-500 text-white text-sm font-extrabold shadow-md ring-2 ring-dentGreen-500/30 transform transition-transform hover:scale-105">
                  <Activity className="w-4 h-4 text-white" /> Total Visitas: {reportData.timeline ? reportData.timeline.length : 0}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* 2. Gráfico de Evolución (Toma 2 columnas) */}
            <div className="xl:col-span-2 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 max-lg:p-4">
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Progreso Clínico</p>
                <h3 className="mt-1 text-xl font-extrabold text-dentBlue-900 tracking-tight">Curva de Actividad de Caries</h3>
                <p className="mt-1 text-sm text-gray-500">Muestra la evolución de las detecciones por severidad a lo largo del tiempo.</p>
              </div>
              
              {reportData.grafico_caries && reportData.grafico_caries.length > 0 ? (
                <div className="h-[350px] max-lg:h-[280px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.grafico_caries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="fecha" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }}
                        tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                        labelStyle={{ color: '#6B7280', fontWeight: 'bold', marginBottom: '8px' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', color: '#6B7280' }} />
                      
                      <Line type="monotone" name="Incipiente" dataKey="incipiente" stroke="#16A34A" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" name="Moderada" dataKey="moderada" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" name="Avanzada" dataKey="avanzada" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                  <p className="text-gray-400 font-bold text-sm flex items-center gap-2">
                    <Activity className="w-5 h-5" /> No hay suficientes datos para graficar.
                  </p>
                </div>
              )}
            </div>

            {/* 3. Timeline Vertical (Toma 1 columna) */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 max-lg:p-4 flex flex-col max-h-[500px]">
              <div className="mb-6 shrink-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Registro Narrativo</p>
                <h3 className="mt-1 text-xl font-extrabold text-dentBlue-900 tracking-tight">Historial Clínico</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {reportData.timeline && reportData.timeline.length > 0 ? (
                  <div className="pt-2">
                    {reportData.timeline.map((visit, idx) => (
                      <TimelineItem key={idx} visit={visit} />
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                    No hay visitas registradas.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Comparativa Radiográfica */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 max-lg:p-4">
            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Demostración al paciente</p>
              <h3 className="mt-1 text-xl font-extrabold text-dentBlue-900 tracking-tight flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-dentBlue-500" />
                Visor Comparativo Antes / Después
              </h3>
              <p className="mt-1 text-sm text-gray-500">Mueve el deslizador para comparar el estado inicial con el resultado de la última visita procesada por la IA.</p>
            </div>
            
            {reportData.comparativa && reportData.comparativa.antes && reportData.comparativa.despues ? (
              reportData.comparativa.antes.imagen === reportData.comparativa.despues.imagen ? (
                 <div className="h-[200px] flex items-center justify-center border border-gray-100 rounded-2xl bg-gray-50">
                    <div className="text-center">
                      <CheckCircle2 className="w-10 h-10 text-dentGreen-500 mx-auto mb-3" />
                      <p className="text-gray-600 font-bold">El paciente solo tiene una visita procesada.</p>
                      <p className="text-gray-400 text-sm mt-1">Se mostrará la imagen cruda vs la procesada de esta única visita.</p>
                    </div>
                 </div>
              ) : (
                <div className="p-2 bg-gray-50 border border-gray-100 rounded-[1.25rem]">
                  {reportData.comparativa.opciones && reportData.comparativa.opciones.length > 1 && (
                    <div className="mb-4 px-2">
                      <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 mb-1.5">
                         Seleccionar radiografía anterior ("Antes") (Opcional):
                      </label>
                      <select
                        value={selectedAntesIdx}
                        onChange={(e) => setSelectedAntesIdx(Number(e.target.value))}
                        className="w-full text-sm font-bold bg-white text-dentBlue-900 border border-gray-200 rounded-xl px-3 py-2 shadow-sm focus:ring-2 focus:ring-dentBlue-500 focus:border-dentBlue-500 transition-all outline-none"
                      >
                        <option value={-1} disabled>-- Selecciona una visita anterior --</option>
                        {reportData.comparativa.opciones.slice(0, -1).map((opt, idx) => (
                          <option key={idx} value={idx}>
                            Visita del {opt.fecha.split(' ')[0]}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {(() => {
                    const hasOptions = reportData.comparativa.opciones && reportData.comparativa.opciones.length > 1;
                    
                    let beforeImg = reportData.comparativa.antes.imagen;
                    let beforeDate = reportData.comparativa.antes.fecha;
                    let beforeDetections = reportData.comparativa.antes.detecciones || [];
                    const afterImg = reportData.comparativa.despues.imagen;
                    const afterDate = reportData.comparativa.despues.fecha;
                    const afterDetections = reportData.comparativa.despues.detecciones || [];
                    
                    if (hasOptions) {
                      if (selectedAntesIdx === -1) {
                         return (
                            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 mt-2">
                               <div className="text-center">
                                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                  <p className="text-gray-500 font-extrabold text-lg">Selecciona una radiografía</p>
                                  <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">Elige una fecha en el menú desplegable superior para poder compararla con el diagnóstico actual.</p>
                               </div>
                            </div>
                         );
                      }
                      
                      const selectedOpt = reportData.comparativa.opciones[selectedAntesIdx];
                      beforeImg = selectedOpt.imagen_cruda;
                      beforeDate = selectedOpt.fecha;
                      beforeDetections = selectedOpt.detecciones || [];
                    }

                    return (
                      <>
                        <ImageSlider 
                          beforeImage={beforeImg} 
                          afterImage={afterImg} 
                          beforeDetections={beforeDetections}
                          afterDetections={afterDetections}
                        />
                        <div className="flex justify-between items-center max-lg:flex-col max-lg:items-start max-lg:gap-2 mt-3 px-2 text-xs font-bold text-gray-500">
                          <span>Antes: {beforeDate.split(' ')[0]}</span>
                          <div className="flex gap-4 max-lg:flex-wrap max-lg:gap-2">
                            <div className="flex items-center gap-1.5" title="Caries en estado inicial (Esmalte)">
                              <div className="w-3 h-3 rounded bg-amber-400/20 border border-amber-500"></div>
                              Incipiente
                            </div>
                            <div className="flex items-center gap-1.5" title="Caries que alcanza la dentina">
                              <div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-600"></div>
                              Moderada
                            </div>
                            <div className="flex items-center gap-1.5" title="Caries profunda o lesión periapical">
                              <div className="w-3 h-3 rounded bg-red-600/20 border border-red-700"></div>
                              Avanzada
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Después: {afterDate.split(' ')[0]}</span>
                            <span className="px-1.5 py-0.5 rounded-md bg-dentBlue-100 text-dentBlue-800 text-[9px] font-extrabold uppercase tracking-wider hidden sm:inline-block">Último Diagnóstico</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )
            ) : (
              <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <p className="text-gray-500 font-bold text-sm">
                  No se encontraron radiografías suficientes para hacer la comparativa.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default ReporteIndividual;
