import React from 'react';
import { User, Activity, Calendar, FileCheck } from 'lucide-react';

const PatientCard = ({ patient, onClick }) => {
  // Calcular la edad a partir de fecha_nacimiento ('YYYY-MM-DD')
  const getAge = (dateStr) => {
    if (!dateStr) return 0;
    const today = new Date();
    const birthDate = new Date(dateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = getAge(patient.fecha_nacimiento);
  const isMinor = age < 18;

  // Extraer iniciales
  const initials = `${patient.nombres.charAt(0)}${patient.apellidos.charAt(0)}`.toUpperCase();

  return (
    <div 
      onClick={() => onClick(patient)}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:border-dentGreen-500 cursor-pointer transition-all duration-300 relative group overflow-hidden flex flex-col"
    >
      {/* Indicador sutil de pendiente superior, si requiere */}
      {patient.evaluacion_pendiente && (
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500"></div>
      )}

      {/* Header Card */}
      <div className="flex items-start gap-4 mb-4 mt-1">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-dentBlue-100 to-dentBlue-50 flex items-center justify-center text-dentBlue-900 font-extrabold text-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
          {initials}
        </div>

        {/* Nombres y DNI */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-extrabold text-gray-800 truncate" title={`${patient.nombres} ${patient.apellidos}`}>
            {patient.nombres} {patient.apellidos}
          </h3>
          <p className="text-sm font-medium text-gray-400 truncate mt-0.5">
            DNI: <span className="text-gray-500">{patient.dni}</span>
          </p>
        </div>
      </div>

      {/* Badges / Insignias Clínicas */}
      <div className="flex flex-wrap gap-2 mb-4">
        {isMinor && patient.apoderado && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-dentBlue-900 border border-blue-100">
            <User className="w-3 h-3 mr-1" />
            Apoderado: {patient.apoderado.split(' ')[0]}
          </span>
        )}
        
        {patient.evaluacion_pendiente && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
            <Activity className="w-3 h-3 mr-1" />
            Eval. Pendiente
          </span>
        )}
      </div>

      {/* Footer Info (Stats rápidos) */}
      <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-3">
        <div className="text-xs font-semibold text-gray-400 flex items-center">
          <Calendar className="w-3.5 h-3.5 mr-1" />
          <span className="truncate">
            Última: {patient.ultima_atencion 
              ? patient.ultima_atencion.split('-').reverse().join('-') 
              : 'No registrada'}
          </span>
        </div>
        
        {/* Un peque icon extra para indicar la accion de clic */}
        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-dentGreen-500 group-hover:text-white transition-colors">
          <FileCheck className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};

export default PatientCard;