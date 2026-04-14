import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const ModalFinalizacion = ({ 
  isOpen, 
  progress, 
  title = "¡Diagnóstico Completado!", 
  message = "Guardando diagnóstico y regresando al panel principal..." 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay oscuro y blur sutil */}
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity opacity-100"></div>
      
      {/* Contenedor del Modal */}
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl text-center animate-fade-in-up border border-gray-100 overflow-hidden flex flex-col">
        
        {/* Controles de estilo para la animación del check dibujándose */}
        <style>
          {`
            .checkmark-circle {
              stroke-dasharray: 166;
              stroke-dashoffset: 166;
              stroke-miterlimit: 10;
              fill: none;
              animation: drawCheck 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
            }
            .checkmark-check {
              stroke-dasharray: 48;
              stroke-dashoffset: 48;
              fill: none;
              animation: drawCheck 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
            }
            @keyframes drawCheck {
              100% {
                stroke-dashoffset: 0;
              }
            }
          `}
        </style>

        {/* Contenido Principal */}
        <div className="p-8 pb-10">
          {/* Ícono animado dibujándose */}
          <div className="mx-auto w-24 h-24 bg-dentGreen-50 rounded-full flex items-center justify-center mb-6 relative">
             <svg className="w-16 h-16 text-dentGreen-500" viewBox="0 0 52 52">
                <circle className="checkmark-circle stroke-current transition-colors" strokeWidth="2" cx="26" cy="26" r="25" />
                <path className="checkmark-check stroke-current transition-colors" strokeWidth="3" d="M14.1 27.2l7.1 7.2 16.7-16.8" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
          </div>
          
          <h3 className="text-xl font-extrabold text-gray-800 mb-2 tracking-tight">{title}</h3>
          <p className="text-gray-500 text-sm font-medium">{message}</p>
        </div>
        
        {/* Barra Sweep de Borde Inferior (Flash Message temporizador) */}
        <div className="absolute bottom-0 left-0 w-full h-[5px] bg-gray-100">
          <div 
            className="h-full transition-all ease-linear" 
            style={{ 
              width: `${progress}%`, 
              transitionDuration: '30ms', 
              backgroundColor: '#0F3B4C' 
            }}
          ></div>
        </div>

      </div>
    </div>
  );
};

export default ModalFinalizacion;
