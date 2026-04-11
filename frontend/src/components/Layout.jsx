import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Activity, 
  Users, 
  Settings, 
  HelpCircle, 
  LogOut,
  Menu,
  ChevronLeft
} from 'lucide-react';

const Layout = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificamos si existe usuario guardado en localStorage
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      // Si no hay usuario logueado, redirigir al login
      navigate('/login');
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Menu de navegación principal
  const mainMenuItems = [
    { icon: Home, label: 'Inicio', path: '/dashboard' },
    { icon: Activity, label: 'Historial de evaluaciones', path: '/historial' },
    { icon: Users, label: 'Gestión de usuarios', path: '/usuarios' },
  ];

  // Menu de navegación secundario
  const bottomMenuItems = [
    { icon: Settings, label: 'Configuración', path: '/configuracion' },
    { icon: HelpCircle, label: 'Soporte / Ayuda', path: '/ayuda' },
  ];

  // Función para simular ruta activa
  const isActive = (path) => {
    // Para rutas exactas o subrutas
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* Sidebar Fijo / Colapsable */}
      <aside 
        className={`flex flex-col bg-slate-50 border-r border-gray-200 transition-all duration-300 ease-in-out relative z-20 shrink-0 ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        
        {/* Cabecera del sidebar (Logo superior) */}
        <div className={`flex items-center h-20 border-b border-gray-200 bg-gradient-to-r from-dentBlue-900 to-dentGreen-500 shrink-0 transition-all duration-300 ${isOpen ? 'justify-between px-4' : 'justify-center px-2'}`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-dentBlue-900">CS</span>
            </div>
            {isOpen && (
              <div className="whitespace-nowrap transition-opacity duration-300">
                <h1 className="text-xl font-bold text-white leading-tight">Clínica Sonríe</h1>
                <p className="text-xs text-white">Diagnóstico IA</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors focus:outline-none flex-shrink-0 ${!isOpen ? 'hidden' : 'block'}`}
            title="Contraer"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Botón expandir (visible cuando está cerrado) */}
        {!isOpen && (
          <button 
            onClick={() => setIsOpen(true)}
            className="w-full py-3 flex justify-center text-gray-500 hover:text-dentBlue-900 hover:bg-gray-100 border-b border-gray-200 transition-colors"
            title="Expandir"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Navegación Principal */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="space-y-1">
            {mainMenuItems.map((item, index) => (
              <Link 
                key={index}
                to={item.path}
                title={!isOpen ? item.label : ""}
                className={`group flex items-center ${isOpen ? 'px-4' : 'justify-center'} py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-dentBlue-900 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-white hover:shadow-md hover:text-dentBlue-900'
                }`}
              >
                <item.icon className={`${isOpen ? 'mr-3' : ''} shrink-0 h-5 w-5 transition-colors ${
                  isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-dentBlue-900'
                }`} />
                {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            ))}
          </div>

          <div className="pt-6 mt-6 border-t border-gray-200">
            <div className="space-y-1">
              {bottomMenuItems.map((item, index) => (
                <Link 
                  key={index}
                  to={item.path}
                  title={!isOpen ? item.label : ""}
                  className={`group flex items-center ${isOpen ? 'px-4' : 'justify-center'} py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-dentBlue-900 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-white hover:shadow-md hover:text-dentBlue-900'
                  }`}
                >
                  <item.icon className={`${isOpen ? 'mr-3' : ''} shrink-0 h-5 w-5 transition-colors ${
                    isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-dentBlue-900'
                  }`} />
                  {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Footer del sidebar (Info usuario y Cerrar Sesión) */}
        <div className="p-4 border-t border-gray-200 shrink-0 bg-white">
          {user && (
            <div className={`flex items-center space-x-3 mb-4 ${isOpen ? '' : 'justify-center'}`}>
              <div className="w-10 h-10 bg-dentGreen-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-lg">
                  {user.nombres.charAt(0)}{user.apellidos ? user.apellidos.charAt(0) : ''}
                </span>
              </div>
              {isOpen && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.nombres} {user.apellidos}</p>
                  <p className="text-xs text-gray-500 truncate">{user.especialidad}</p>
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            title={!isOpen ? "Cerrar Sesión" : ""}
            className={`w-full flex items-center ${isOpen ? 'px-4 justify-start' : 'justify-center px-0'} py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors overflow-hidden group`}
          >
            <LogOut className={`shrink-0 h-5 w-5 ${isOpen ? 'mr-3' : ''} group-hover:-translate-x-1 transition-transform`} />
            {isOpen && <span className="whitespace-nowrap">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Contenido Principal (Espacio de trabajo renderizado con Outlet) */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;