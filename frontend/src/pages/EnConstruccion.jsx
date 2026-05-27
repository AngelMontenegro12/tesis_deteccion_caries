import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Sparkles } from 'lucide-react';
import bgDashboard from '../assets/fondo_dashboard_2.png';

const EnConstruccion = ({ title, description }) => {
  const navigate = useNavigate();

  return (
    <div
      className="flex-1 overflow-auto flex flex-col h-full bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${bgDashboard})` }}
    >
      <div className="absolute inset-0 bg-white/35 pointer-events-none"></div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-white/90 backdrop-blur-md border border-gray-200 rounded-[2rem] shadow-xl p-8 md:p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-sm">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dentBlue-50 border border-dentBlue-100 text-dentBlue-900 text-xs font-bold uppercase tracking-[0.25em] mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            En construcción
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-dentBlue-900 tracking-tight">
            {title || 'Módulo en construcción'}
          </h1>
          <p className="mt-4 text-base md:text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
            {description || 'Esta sección todavía está en desarrollo. Pronto estará disponible con su funcionalidad completa.'}
          </p>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-dentBlue-900 text-white font-bold shadow-md hover:bg-dentBlue-800 hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnConstruccion;
