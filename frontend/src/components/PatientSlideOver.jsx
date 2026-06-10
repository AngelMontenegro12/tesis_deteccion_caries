import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Users, Calendar, Activity, AlertCircle, FileCheck, Phone, Mail, MapPin, Edit2 } from 'lucide-react';

const PatientSlideOver = ({ isOpen, onClose, patient, onEdit }) => {
  const navigate = useNavigate();

  if (!isOpen || !patient) return null;

  // Filtrar si hay una evaluación en progreso o terminada
  const evaluaciones = patient.evaluaciones || [];

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
        className={`relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out z-10 
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
        <div className="flex-1 overflow-y-auto">
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
          <div className="p-8 bg-gray-50/50 flex-1 min-h-0">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-dentBlue-900" />
              Historial de Diagnósticos
            </h3>

            {evaluaciones.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <FileCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-500">Sin historial clínico previo.</p>
                <p className="text-xs text-gray-400 mt-1">Aún no se ha realizado ningún diagnóstico para este paciente.</p>
              </div>
            ) : (
              <div className="relative pl-4 space-y-8 before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-gray-200 before:z-0">
                {evaluaciones.map((evaluacion, idx) => {
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