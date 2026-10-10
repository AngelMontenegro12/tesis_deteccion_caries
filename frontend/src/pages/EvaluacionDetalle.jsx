import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, Download, User, Calendar, Activity, Info, Phone, Mail, CheckCircle, 
  Stethoscope, ChevronRight, AlertTriangle, CheckCircle2, ZoomIn, ZoomOut, Maximize2, 
  Plus
} from 'lucide-react';
import BoundingBoxViewer from '../components/BoundingBoxViewer';
import api from '../services/api';
import bgDashboard from '../assets/fondo_dashboard_2.png';
import dienteImg from '../assets/diente.png';
// This file will render the details of an evaluation

const EvaluacionDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [error, setError] = useState('');
  const [selectedHallazgoId, setSelectedHallazgoId] = useState(null);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [isolateSelection, setIsolateSelection] = useState(false);

  const safeData = data || {};
  const paciente = safeData.paciente || {};
  const evaluacion = safeData.evaluacion || {};
  const radiografias = Array.isArray(safeData.radiografias) ? safeData.radiografias : [];
  const detecciones_caries = Array.isArray(safeData.detecciones_caries) ? safeData.detecciones_caries : [];
  const diagnostico = safeData.diagnostico || null;

  const isMinor = !!paciente && Number(paciente.edad) < 18;
  const initials = paciente.nombres && paciente.apellidos
    ? `${paciente.nombres.charAt(0)}${paciente.apellidos.charAt(0)}`.toUpperCase()
    : '';
  const radiografiasResultados = radiografias;
  const totalRadiografiasResultados = radiografiasResultados.length;
  const safeActiveImageIndex = totalRadiografiasResultados > 0
    ? Math.min(Math.max(activeImageIndex, 0), totalRadiografiasResultados - 1)
    : 0;
  const hasMultipleRadiografiasResultados = totalRadiografiasResultados > 1;
  const activeRadiografiaResultado = radiografiasResultados[safeActiveImageIndex] || null;
  const deteccionesActivas = activeRadiografiaResultado?.id_resultado
    ? detecciones_caries.filter((d) => d.id_resultado === activeRadiografiaResultado.id_resultado)
    : [];

  useEffect(() => {
    if (totalRadiografiasResultados === 0) return;
    if (activeImageIndex < 0) {
      setActiveImageIndex(0);
      return;
    }
    if (activeImageIndex > totalRadiografiasResultados - 1) {
      setActiveImageIndex(totalRadiografiasResultados - 1);
    }
  }, [activeImageIndex, totalRadiografiasResultados]);

  const goToPrevRadiografia = () => {
    if (!hasMultipleRadiografiasResultados) return;
    setActiveImageIndex((prev) => (prev - 1 + totalRadiografiasResultados) % totalRadiografiasResultados);
  };

  const goToNextRadiografia = () => {
    if (!hasMultipleRadiografiasResultados) return;
    setActiveImageIndex((prev) => (prev + 1) % totalRadiografiasResultados);
  };

  useEffect(() => {
    if (deteccionesActivas.length === 0) {
      setSelectedHallazgoId(null);
      return;
    }

    setSelectedHallazgoId((currentSelectedId) => {
      const stillExists = deteccionesActivas.some((det) => (det.id_deteccion ?? null) === currentSelectedId);
      return stillExists ? currentSelectedId : deteccionesActivas[0].id_deteccion ?? null;
    });
  }, [deteccionesActivas]);

  useEffect(() => {
    const fetchEvaluacion = async () => {
      try {
        const res = await api.get(`/evaluaciones/${id}/detalle`);
        setData(res.data);
      } catch (err) {
        console.error("Network error", err);
        setError('No se pudo cargar el expediente clínico.');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluacion();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 flex-col">
        <div className="w-12 h-12 border-4 border-dentBlue-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-dentBlue-900 font-bold">Cargando expediente clínico...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">{error || 'No se encontró el diagnóstico solicitado.'}</p>
        <button onClick={() => navigate('/pacientes')} className="ml-4 text-dentBlue-900 hover:underline">
          Volver a Pacientes
        </button>
      </div>
    );
  }

  const getRadiografiaSrc = (rad) => {
    if (!rad) return '';
    if (rad.ruta_archivo) return `http://localhost:5000/${rad.ruta_archivo}`;
    return '';
  };

  const getResultadoSeverityLabel = (severidad) => {
    if (severidad === 'avanzada') return 'Caries Periapical (Avanzada)';
    if (severidad === 'moderada') return 'Caries Profunda';
    return 'Caries Incipiente';
  };

  const getResultadoSeverityClass = (severidad) => {
    if (severidad === 'avanzada') return 'text-red-700 bg-red-50 border-red-100';
    if (severidad === 'moderada') return 'text-orange-800 bg-orange-50 border-orange-100';
    return 'text-amber-800 bg-amber-50 border-amber-100';
  };

  const getClassDistribution = (det) => {
    const probs = det?.class_probabilities || null;

    if (probs && typeof probs === 'object') {
      let inc = Math.round((probs['Caries Incipiente'] || probs['Caries Incipiente'] === 0 ? Number(probs['Caries Incipiente']) : 0) * 100);
      let mod = Math.round((probs['Caries Profunda'] || probs['Caries Profunda'] === 0 ? Number(probs['Caries Profunda']) : 0) * 100);
      let adv = Math.round((probs['Caries Periapical (Avanzada)'] || probs['Caries Periapical (Avanzada)'] === 0 ? Number(probs['Caries Periapical (Avanzada)']) : 0) * 100);

      const total = inc + mod + adv;
      if (total !== 100) {
        const diff = 100 - total;
        const maxKey = Math.max(inc, mod, adv);
        if (maxKey === inc) inc += diff;
        else if (maxKey === mod) mod += diff;
        else adv += diff;
      }

      return { incipiente: inc, moderada: mod, avanzada: adv };
    }

    const mainConf = Math.round((Number(det?.confianza) || 0) * 100);
    const rem = 100 - mainConf;
    const otherA = Math.round(rem / 2);
    const otherB = rem - otherA;

    return {
      incipiente: det?.severidad === 'incipiente' ? mainConf : otherA,
      moderada: det?.severidad === 'moderada' ? mainConf : (det?.severidad === 'incipiente' ? otherB : (det?.severidad === 'avanzada' ? otherA : otherA)),
      avanzada: det?.severidad === 'avanzada' ? mainConf : otherB,
    };
  };

  const renderHallazgoCard = (det, idx, isOddLastCard = false) => {
    const severityLabel = getResultadoSeverityLabel(det.severidad);
    const severityClass = getResultadoSeverityClass(det.severidad);
    const classVals = getClassDistribution(det);
    const maxVal = Math.max(classVals.incipiente, classVals.moderada, classVals.avanzada);
    const isSelected = selectedHallazgoId !== null && det.id_deteccion === selectedHallazgoId;
    const rows = [
      { key: 'incipiente', label: 'Caries Incipiente', val: classVals.incipiente },
      { key: 'moderada', label: 'Caries Profunda', val: classVals.moderada },
      { key: 'avanzada', label: 'Caries Periapical (Avanzada)', val: classVals.avanzada },
    ];

    return (
      <div
        key={det.id_deteccion || idx}
        onClick={() => setSelectedHallazgoId(det.id_deteccion ?? null)}
        className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden cursor-pointer hover:border-gray-300 ${isOddLastCard ? 'lg:col-span-2' : ''} ${isSelected ? 'border-dentBlue-900 ring-2 ring-dentBlue-900/20 shadow-lg' : 'border-gray-200'}`}
      >
        <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-sm font-extrabold text-dentBlue-900 flex items-center">
            <img src={dienteImg} alt="Diente" className="w-4 h-4 mr-2 opacity-70 grayscale" />
            {det.numero_diente ? `Diente ${det.numero_diente}` : `Hallazgo ${idx + 1}`}
          </h4>
          <span className={`text-[10px] font-bold border px-2 py-1 rounded-md uppercase tracking-wide ${severityClass}`}>
            {det.localizacion || severityLabel}
          </span>
        </div>

        <div className="p-4 lg:p-3 xl:p-4 space-y-3">
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.key} className={`flex items-center justify-between text-xs ${row.val === maxVal ? 'font-extrabold' : 'font-medium'}`}>
                <div className="w-1/2 text-sm text-gray-700">{row.label}</div>
                <div className="w-1/2 pl-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex-1 mr-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-2 rounded-full ${row.val === maxVal ? 'bg-dentBlue-900' : 'bg-gray-300'}`} style={{ width: `${row.val}%` }} />
                    </div>
                    <div className="w-12 text-right text-xs text-gray-800">{row.val}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Radiografia Activa
  const currentRadiografia = radiografias[activeImageIndex] || null;

  return (
    <div 
      className="flex flex-col h-full bg-cover bg-center bg-no-repeat bg-fixed overflow-y-auto relative"
      style={{ backgroundImage: `url(${bgDashboard})` }}
    >
      
      {/* Navegacion Breadcrumb */}
      <div className="px-4 md:px-6 pt-6 pb-2 max-w-[98%] 2xl:max-w-[1600px] mx-auto w-full shrink-0 flex items-center text-sm font-medium text-slate-500">
        <Link to="/historial" className="hover:text-dentBlue-900 transition-colors flex items-center">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Historial de Diagnósticos
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="font-semibold text-slate-700 bg-white/50 px-2 py-0.5 rounded-md">{paciente.nombres} {paciente.apellidos}</span>
      </div>

      {/* 1. Cabecera tipo "Tarjeta de Perfil Blanca" */}
      <div className="px-4 md:px-6 pt-2 max-w-[98%] 2xl:max-w-[1600px] mx-auto w-full shrink-0">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-gray-100">
          
          {/* Izquierda (Avatar y Nombres) */}
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="w-20 h-20 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-3xl font-extrabold shrink-0 border border-teal-100">
              {initials}
            </div>
            
            <div className="flex flex-col">
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2">
                {paciente.nombres} {paciente.apellidos}
              </h1>
              
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-slate-50 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold border border-slate-100">
                  DNI: {paciente.dni}
                </span>
                <span className="bg-slate-50 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold border border-slate-100">
                  {paciente.edad} años {isMinor ? '(Adolescente)' : '(Adulto)'}
                </span>
                {isMinor && paciente.apoderado && (
                  <span className="bg-teal-50 text-teal-800 px-3 py-1 rounded-lg text-xs font-bold flex items-center border border-teal-100">
                    <User className="w-3.5 h-3.5 mr-1" />
                    Apoderado: {paciente.apoderado}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Derecha (Contacto) */}
          <div className="flex flex-col gap-2 text-sm text-slate-700 font-medium md:text-right w-full md:w-auto">
            <div className="flex items-center md:justify-end gap-2 bg-slate-50/50 px-3 py-1.5 rounded-lg border border-slate-100">
              <Phone className="w-4 h-4 text-gray-400" />
              {paciente.telefono || 'Sin teléfono'}
            </div>
            <div className="flex items-center md:justify-end gap-2 bg-slate-50/50 px-3 py-1.5 rounded-lg border border-slate-100">
              <Mail className="w-4 h-4 text-gray-400" />
              {paciente.correo || 'Sin correo'}
            </div>
          </div>
          
        </div>
      </div>

      {/* Grid Central */}
      <div className="p-4 md:p-6 max-w-[98%] 2xl:max-w-[1600px] w-full mx-auto flex-1 flex flex-col lg:flex-row gap-8 pb-12">
        
        {/* 2. Columna Izquierda: Evidencia Visual (60%) */}
        <div className="lg:w-3/5 flex flex-col gap-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden">
            <div className="w-full flex items-center justify-between border-b border-gray-50 pb-4">
              <h2 className="text-lg font-black text-gray-800 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-dentBlue-500" />
                Radiografía Panorámica
              </h2>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => setShowBoxes((value) => !value)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${showBoxes ? 'bg-dentBlue-900 text-white border-dentBlue-900' : 'bg-white text-gray-600 border-gray-200 hover:border-dentBlue-300'}`}
                >
                  {showBoxes ? 'Ocultar cajas' : 'Mostrar cajas'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLabels((value) => !value)}
                  disabled={!showBoxes}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                    !showBoxes
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : showLabels
                        ? 'bg-dentGreen-600 text-white border-dentGreen-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-dentGreen-300'
                  }`}
                >
                  {showLabels ? 'Ocultar etiquetas' : 'Mostrar etiquetas'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsolateSelection((value) => !value)}
                  disabled={!showBoxes}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                    !showBoxes
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : isolateSelection
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                  }`}
                  title="Muestra solo el hallazgo que selecciones"
                >
                  {isolateSelection ? 'Desactivar aislamiento' : 'Aislar selección'}
                </button>
                {activeRadiografiaResultado ? (
                  <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    {radiografiasResultados.length > 1 ? `Imagen ${safeActiveImageIndex + 1} de ${radiografiasResultados.length}` : 'Imagen única'}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="relative w-full">
              {hasMultipleRadiografiasResultados && (
                <>
                  <button
                    type="button"
                    onClick={goToPrevRadiografia}
                    className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/95 text-dentBlue-900 shadow-lg backdrop-blur transition-all hover:bg-white hover:scale-105"
                    aria-label="Ver radiografía anterior"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextRadiografia}
                    className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/95 text-dentBlue-900 shadow-lg backdrop-blur transition-all hover:bg-white hover:scale-105"
                    aria-label="Ver radiografía siguiente"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {activeRadiografiaResultado ? (
                <BoundingBoxViewer
                  imageSrc={getRadiografiaSrc(activeRadiografiaResultado)}
                  alt="Radiografia"
                  title="Radiografía Panorámica"
                  detections={deteccionesActivas}
                  selectedDetectionId={selectedHallazgoId}
                  onDetectionClick={(det) => setSelectedHallazgoId(det.id_deteccion ?? null)}
                  showBoxes={showBoxes}
                  showLabels={showLabels}
                  isolateSelection={isolateSelection}
                />
              ) : (
                <div className="w-full h-64 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                  Sin imagen disponible
                </div>
              )}
            </div>

            {radiografiasResultados.length > 1 && (
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2 pt-1 w-full">
                {radiografiasResultados.map((rad, idx) => (
                  <button
                    key={rad.id_radiografia || idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`shrink-0 relative w-28 h-16 rounded-xl overflow-hidden border-[3px] transition-all bg-slate-100 ${
                      idx === safeActiveImageIndex
                        ? 'border-dentBlue-900 ring-2 ring-dentBlue-900/25 shadow-[0_10px_24px_rgba(30,58,138,0.28)] scale-110 -translate-y-1 opacity-100'
                        : 'border-gray-200 opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img
                      src={getRadiografiaSrc(rad)}
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tarjeta 3: Diagnóstico Clínico Final (Solo Lectura) */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-5">
            <h3 className="font-extrabold text-gray-900 flex items-center">
              <Stethoscope className="w-5 h-5 mr-2 text-teal-600" />
              Diagnóstico Clínico
            </h3>
            
            {!diagnostico ? (
               <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                 <p className="text-sm font-semibold text-gray-400">Aún no se ha redactado un diagnóstico para este expediente.</p>
               </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
                    Diagnóstico Final
                  </label>
                  <p className="w-full bg-slate-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {diagnostico.diagnostico_texto}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Barra de Acciones Flotante (Reubicada) */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-800 text-white rounded-2xl shadow-sm hover:bg-slate-900 hover:-translate-y-0.5 transition-all font-bold">
              <Download className="w-5 h-5" />
              Descargar Expediente
            </button>
            <button 
              onClick={() => navigate('/pacientes')} 
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-700 border border-gray-200 rounded-2xl shadow-sm hover:bg-gray-50 hover:-translate-y-0.5 transition-all font-bold"
            >
              <ChevronLeft className="w-5 h-5" />
              Volver a Pacientes
            </button>
          </div>
        </div>

        {/* 3. Columna Derecha: El Expediente Clínico (40%) */}
        <div className="lg:w-2/5 flex flex-col gap-6">
          
          {/* Tarjeta 1: Contexto de la Visita */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-gray-900 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-dentBlue-500" />
                Contexto de Visita
              </h3>
              <span className="bg-dentBlue-50 text-dentBlue-900 font-black text-[11px] px-3 py-1 rounded-full border border-dentBlue-100">
                {evaluacion.tipo_visita}
              </span>
            </div>
            
            <div className="pt-3 border-t border-gray-50 flex flex-col gap-4 text-sm">
              <div>
                <p className="text-gray-400 font-bold mb-1 text-xs uppercase tracking-widest">Fecha</p>
                <p className="font-medium text-gray-800">
                  {new Date(evaluacion.fecha_evaluacion.replace(' ', 'T')).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-bold mb-1 text-xs uppercase tracking-widest">Motivo de consulta</p>
                <p className="font-medium text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {evaluacion.motivo_consulta || 'No especificado'}
                </p>
              </div>
              {evaluacion.observaciones && (
                <div>
                  <p className="text-gray-400 font-bold mb-1 text-xs uppercase tracking-widest">Observaciones Auxiliares</p>
                  <p className="font-medium text-gray-700">{evaluacion.observaciones}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta 2: Hallazgos de la IA */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-extrabold text-gray-900 flex items-center mb-5">
              <Info className="w-5 h-5 mr-2 text-red-500" />
              Hallazgos del Modelo
            </h3>

            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="flex items-center bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0" />
                <p className="text-sm font-bold text-amber-800">
                  Se detectaron {deteccionesActivas.length} posibles lesiones en esta radiografía.
                </p>
              </div>

              {deteccionesActivas.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-12 h-12 text-dentGreen-400 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-bold text-gray-500">No se detectaron caries en esta imagen.</p>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {deteccionesActivas.map((det, idx) => {
                    const isOddLastCard = deteccionesActivas.length % 2 === 1 && idx === deteccionesActivas.length - 1;
                    return renderHallazgoCard(det, idx, isOddLastCard);
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EvaluacionDetalle;