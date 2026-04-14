import React from 'react';
import { AlertCircle } from 'lucide-react';

const ModalConfirmacion = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Continuar', 
  cancelText = 'Cancelar',
  icon: Icon = AlertCircle,
  colorTheme = 'blue' // Soporta 'blue', 'green', 'red'
}) => {
  if (!isOpen) return null;

  // Definir paleta de colores usando los del sistema global
  const themeStyles = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-dentBlue-900',
      border: 'border-blue-100',
      iconColor: 'text-dentBlue-900',
      buttonBg: 'bg-dentBlue-900 hover:bg-dentBlue-800'
    },
    green: {
      bg: 'bg-dentGreen-50',
      text: 'text-dentGreen-900',
      border: 'border-dentGreen-200',
      iconColor: 'text-dentGreen-500',
      buttonBg: 'bg-dentGreen-500 hover:bg-dentGreen-600'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-900',
      border: 'border-red-100',
      iconColor: 'text-red-500',
      buttonBg: 'bg-red-500 hover:bg-red-600'
    }
  };

  const currentTheme = themeStyles[colorTheme] || themeStyles.blue;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className={`${currentTheme.bg} p-6 flex flex-col items-center text-center border-b ${currentTheme.border}`}>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <Icon className={`w-8 h-8 ${currentTheme.iconColor}`} />
          </div>
          <h2 className={`text-xl font-bold ${currentTheme.text}`}>{title}</h2>
          <p className={`text-sm opacity-80 mt-2 ${currentTheme.text}`}>
            {message}
          </p>
        </div>
        <div className="p-6 bg-white flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors w-full sm:w-auto"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md transition-all active:scale-95 w-full sm:w-auto ${currentTheme.buttonBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacion;
