import React from 'react';
import { User, Activity, Calendar, ChevronRight } from 'lucide-react';

const PatientCard = ({ patient, onClick }) => {
  const getAge = (dateStr) => {
    if (!dateStr) return 0;
    const today = new Date();
    const birthDate = new Date(dateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDelta = today.getMonth() - birthDate.getMonth();

    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const age = getAge(patient.fecha_nacimiento);
  const isMinor = age < 18;
  const initials = `${patient.nombres.charAt(0)}${patient.apellidos.charAt(0)}`.toUpperCase();

  return (
    <div
      onClick={() => onClick(patient)}
      className="group relative flex min-h-[260px] flex-col overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-dentBlue-900/20 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-dentBlue-900 via-dentGreen-500 to-dentBlue-900 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {patient.evaluacion_pendiente && (
        <div className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Pendiente
        </div>
      )}

      <div className="flex items-start gap-4 pt-2">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-dentBlue-900 text-xl font-extrabold text-white shadow-md shadow-dentBlue-900/10 transition-transform duration-300 group-hover:scale-[1.03]">
          {initials}
        </div>

        <div className="min-w-0 flex-1 pr-14">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Paciente</p>
          <h3 className="text-lg font-extrabold leading-tight break-words text-dentBlue-900" title={`${patient.nombres} ${patient.apellidos}`}>
            {patient.nombres} {patient.apellidos}
          </h3>
          <p className="mt-1 truncate text-sm font-medium text-gray-500">
            DNI: <span className="text-gray-700">{patient.dni}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {isMinor && patient.apoderado && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-dentBlue-100 bg-dentBlue-50 px-3 py-1 text-[11px] font-bold text-dentBlue-900">
            <User className="h-3 w-3" />
            Apoderado: {patient.apoderado.split(' ')[0]}
          </span>
        )}

        {patient.evaluacion_pendiente && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
            <Activity className="h-3 w-3" />
            Eval. pendiente
          </span>
        )}
      </div>

      <div className="mt-auto border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate">
              Última atención: {patient.ultima_atencion
                ? patient.ultima_atencion.split('-').reverse().join('-')
                : 'No registrada'}
            </span>
          </div>

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition-all group-hover:border-dentBlue-900/20 group-hover:bg-dentBlue-50 group-hover:text-dentBlue-900">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientCard;