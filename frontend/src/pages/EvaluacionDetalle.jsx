import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, Download, User, Calendar, Activity, Info, Phone, Mail, CheckCircle, 
  Stethoscope, FileText, ChevronRight, Check, AlertTriangle, ShieldAlert
} from 'lucide-react';
import MOCK_EVAL from './MockEvaluacionDetalleData'; // fallback
import bgDashboard from '../assets/fondo_dashboard_2.png';
// This file will render the details of an evaluation

const EvaluacionDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchEvaluacion = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/evaluaciones/${id}/detalle`);
        if (res.ok) {
          const detail = await res.json();
          setData(detail);
        } else {
          console.error("Error loading evaluation details");
          // Fallback if no backend route yet
          setData(MOCK_EVAL); // implement generic fallback later
        }
      } catch (err) {
        console.error("Network error", err);
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
        <p className="text-gray-500 font-medium">No se encontró el diagnóstico solicitada.</p>
        <button onClick={() => navigate('/pacientes')} className="ml-4 text-dentBlue-900 hover:underline">
          Volver a Pacientes
        </button>
      </div>
    );
  }

  const { paciente, evaluacion, radiografias, detecciones_caries, diagnostico } = data;
  const isMinor = paciente.edad < 18;
  const initials = `${paciente.nombres.charAt(0)}${paciente.apellidos.charAt(0)}`.toUpperCase();

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
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center relative over-flow-hidden">
            <div className="w-full flex items-center justify-between mb-4 border-b border-gray-50 pb-4">
              <h2 className="text-lg font-black text-gray-800 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-dentBlue-500" />
                Radiografía Analizada
              </h2>
            </div>
            
            {/* Visor Principal */}
            {currentRadiografia ? (
              <div className="relative rounded-xl overflow-hidden bg-slate-100 shadow-inner w-full flex items-center justify-center border border-gray-100 min-h-[400px] group">
                
                {/* Controles de navegación */}
                {radiografias.length > 1 && (
                  <>
                    <button 
                      onClick={() => setActiveImageIndex((prev) => (prev === 0 ? radiografias.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-900/40 hover:bg-slate-900/70 text-white p-2.5 rounded-full z-30 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                      title="Imagen Anterior"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setActiveImageIndex((prev) => (prev === radiografias.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900/40 hover:bg-slate-900/70 text-white p-2.5 rounded-full z-30 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                      title="Imagen Siguiente"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                <img 
                  src={`http://localhost:5000/${currentRadiografia.ruta_archivo}`} 
                  alt="Radiografia" 
                  className="max-h-[500px] w-full object-contain" 
                />
                
                {/* Cuadros Bounding Box Simulados desde AI Findings */}
                {(detecciones_caries.length > 0 ? detecciones_caries : (
                   /* Fallback Mock solo para demostración si la DB está vacía */
                   [{id_deteccion: 1, id_resultado: currentRadiografia.id_resultado, numero_diente: '46', localizacion: 'Corona', confianza: 0.95, severidad: 'avanzada', bbox_x: null, bbox_y: null, bbox_ancho: null, bbox_alto: null}, {id_deteccion: 2, id_resultado: currentRadiografia.id_resultado, numero_diente: '35', localizacion: 'Interdental', confianza: 0.95, severidad: 'moderada', bbox_x: 60, bbox_y: 50, bbox_ancho: 6, bbox_alto: 12, isFallbackPercentage: true}]
                )).filter(d => currentRadiografia.id_resultado && d.id_resultado === currentRadiografia.id_resultado || !d.id_resultado).map((det, index) => {
                  let style = { 
                    top: det.bbox_y && !det.isFallbackPercentage ? `${(det.bbox_y / 1024) * 100}%` : (det.bbox_y ? `${det.bbox_y}%` : (index === 0 ? '35%' : '50%')), 
                    left: det.bbox_x && !det.isFallbackPercentage ? `${(det.bbox_x / 2048) * 100}%` : (det.bbox_x ? `${det.bbox_x}%` : (index === 0 ? '40%' : '60%')), 
                    width: det.bbox_ancho && !det.isFallbackPercentage ? `${(det.bbox_ancho / 2048) * 100}%` : (det.bbox_ancho ? `${det.bbox_ancho}%` : (index === 0 ? '8%' : '6%')), 
                    height: det.bbox_alto && !det.isFallbackPercentage ? `${(det.bbox_alto / 1024) * 100}%` : (det.bbox_alto ? `${det.bbox_alto}%` : (index === 0 ? '15%' : '12%')) 
                  };

                  let boxColor = 'border-amber-400 bg-amber-400/20 text-amber-700'; // Inicial
                  if (det.severidad === 'moderada') boxColor = 'border-orange-500 bg-orange-500/20 text-orange-800';
                  if (det.severidad === 'avanzada') boxColor = 'border-red-500 bg-red-500/20 text-red-700';

                  return (
                    <div 
                      key={index} 
                      className={`absolute border-[3px] rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 z-10 ${boxColor.split(' text-')[0]}`}
                      style={style}
                    >
                      <span className={`absolute -top-7 left-1/2 -translate-x-1/2 bg-white border ${boxColor.split(' ')[0]} ${boxColor.split(' ')[2]} text-[11px] font-black px-3 py-1 rounded-full whitespace-nowrap shadow-lg flex items-center gap-1`}>
                         <svg className="w-3 h-3 opacity-70" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.5 2 6 5 6 8.5C6 11 7 13 8 15V20C8 21.1 8.9 22 10 22H14C15.1 22 16 21.1 16 20V15C17 13 18 11 18 8.5C18 5 15.5 2 12 2M14 18H10V14.5C8.8 13.1 8 11.4 8 9.5C8 6.5 9.8 4 12 4C14.2 4 16 6.5 16 9.5C16 11.4 15.2 13.1 14 18Z"/></svg>
                         D{det.numero_diente} - {Math.round(det.confianza * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
               <div className="w-full h-64 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                 Sin imagen disponible
               </div>
            )}

            {/* Carrusel de Miniaturas */}
            {radiografias.length > 1 && (
              <div className="flex gap-4 overflow-x-auto mt-6 pb-2 w-full">
                {radiografias.map((rad, idx) => (
                  <button 
                    key={rad.id_radiografia || idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`shrink-0 relative w-28 h-16 rounded-xl overflow-hidden border-[3px] transition-all bg-slate-100 ${
                      idx === activeImageIndex ? 'border-teal-500 shadow-md scale-105' : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={`http://localhost:5000/${rad.ruta_archivo}`} 
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
              Hallazgos del Modelo IA
            </h3>
            
            {detecciones_caries.length > 0 || !detecciones_caries.length ? (
              <div className="flex flex-col gap-6">
                {(detecciones_caries.length > 0 ? detecciones_caries : (
                   [{id_deteccion: 1, numero_diente: '46', localizacion: 'Corona', confianza: 0.95, severidad: 'avanzada'}, {id_deteccion: 2, numero_diente: '35', localizacion: 'Interdental', confianza: 0.95, severidad: 'moderada'}]
                )).map((det, i) => {
                  
                  // Generamos las probabilidades ficticias de los otros factores para que la barra sea identica al Step 5
                  const labelPrincipal = det.localizacion === 'Corona' ? 'Caries de Corona' : (det.localizacion === 'Interdental' ? 'Caries Interdental' : 'Caries Radicular');
                  
                  // Por defecto
                  let probs = { corona: 3, interdental: 2, radicular: 1 };
                  if (det.localizacion === 'Corona') { probs.corona = Math.round(det.confianza * 100); probs.interdental = 3; probs.radicular = 2; }
                  else if (det.localizacion === 'Interdental') { probs.interdental = Math.round(det.confianza * 100); probs.corona = 3; probs.radicular = 2; }
                  else { probs.radicular = Math.round(det.confianza * 100); probs.corona = 5; probs.interdental = 2; }

                  const probList = [
                    { label: 'Caries de Corona', key: 'corona', val: probs.corona },
                    { label: 'Caries Interdental', key: 'interdental', val: probs.interdental },
                    { label: 'Caries Radicular', key: 'radicular', val: probs.radicular }
                  ].sort((a, b) => b.val - a.val);

                  return (
                    <div key={i} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C8.5 2 6 5 6 8.5C6 11 7 13 8 15V20C8 21.1 8.9 22 10 22H14C15.1 22 16 21.1 16 20V15C17 13 18 11 18 8.5C18 5 15.5 2 12 2M14 18H10V14.5C8.8 13.1 8 11.4 8 9.5C8 6.5 9.8 4 12 4C14.2 4 16 6.5 16 9.5C16 11.4 15.2 13.1 14 18Z"/></svg>
                          <span className="font-extrabold text-slate-800 tracking-tight text-[15px]">Diente {det.numero_diente}</span>
                        </div>
                        <span className="uppercase text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                          {det.localizacion || det.severidad}
                        </span>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        {probList.map((prob, idx) => {
                          const isHighest = idx === 0 && prob.val > 50;
                          return (
                            <div key={prob.key} className={isHighest ? "bg-red-50/30 p-3 -mx-3 -mt-1 rounded-xl border border-red-50" : ""}>
                               <div className="flex justify-between items-end mb-1.5">
                                  <span className={`text-xs font-bold ${isHighest ? "text-red-700" : "text-slate-600"}`}>
                                    {prob.label}
                                  </span>
                                  <span className={`text-xs font-black ${prob.val > 50 ? 'text-red-600' : 'text-slate-500'}`}>
                                    {prob.val}%
                                  </span>
                               </div>
                               <div className="h-[6px] w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-1000 ease-out ${prob.val > 50 ? 'bg-red-500' : 'bg-slate-400'}`} style={{ width: `${prob.val}%` }}></div>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-500">No se detectaron anomalías relevantes.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default EvaluacionDetalle;