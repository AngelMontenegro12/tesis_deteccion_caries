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
  ChevronLeft,
  ClipboardList,
  BarChart2,
  ChevronDown
} from 'lucide-react';

const Layout = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem('user');
      navigate('/login');
    }, 1500);
  };

  // Menu de navegación principal
  const mainMenuItems = [
    { icon: Home, label: 'Inicio', path: '/dashboard' },
    { icon: ClipboardList, label: 'Diagnóstico', path: '/nueva-evaluacion' },
    { icon: Users, label: 'Pacientes', path: '/pacientes' },
    { icon: Activity, label: 'Historial de diagnósticos', path: '/historial' },
    { icon: BarChart2, label: 'Reportes', path: '/reportes' },
  ];

  // Menu de navegación secundario
  const bottomMenuItems = [
    { 
      icon: Settings, 
      label: 'Configuración', 
      isDropdown: true,
      isOpen: isConfigOpen,
      toggleOpen: () => setIsConfigOpen(!isConfigOpen),
      subItems: [
        { icon: Users, label: 'Odontólogos', path: '/usuarios' }
      ]
    },
    { icon: HelpCircle, label: 'Soporte / Ayuda', path: '/ayuda' },
  ];

  // Función para simular ruta activa
  const isActive = (path) => {
    // Caso especial: Si estamos en un detalle de evaluación (/evaluacion/:id), marcamos activo el 'Historial de diagnósticos'
    if (path === '/historial' && location.pathname.startsWith('/evaluacion/')) {
      return true;
    }
    // Para rutas exactas o subrutas
    return location.pathname.startsWith(path) && path !== '/';
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
                <p className="text-xs text-white">Diagnóstico</p>
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
                <div key={index} className="space-y-1">
                  {item.isDropdown ? (
                    <div>
                      <button
                        onClick={() => {
                          if (!isOpen) setIsOpen(true);
                          item.toggleOpen();
                        }}
                        title={!isOpen ? item.label : ""}
                        className={`w-full group flex items-center justify-between ${isOpen ? 'px-4' : 'justify-center'} py-3 text-sm font-medium rounded-lg transition-all duration-200 text-gray-700 hover:bg-white hover:shadow-md hover:text-dentBlue-900`}
                      >
                        <div className="flex items-center">
                          <item.icon className={`${isOpen ? 'mr-3' : ''} shrink-0 h-5 w-5 transition-colors text-gray-400 group-hover:text-dentBlue-900`} />
                          {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
                        </div>
                        {isOpen && (
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${item.isOpen ? 'rotate-180' : ''}`} />
                        )}
                      </button>
                      
                      {/* SubItems */}
                      {item.isOpen && isOpen && (
                        <div className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
                          {item.subItems.map((subItem, subIdx) => (
                            <Link
                              key={subIdx}
                              to={subItem.path}
                              className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isActive(subItem.path)
                                  ? 'bg-dentBlue-900 text-white shadow-lg'
                                  : 'text-gray-700 hover:bg-white hover:shadow-md hover:text-dentBlue-900'
                              }`}
                            >
                              <subItem.icon className={`mr-3 shrink-0 h-5 w-5 transition-colors ${
                                isActive(subItem.path) ? 'text-white' : 'text-gray-400 group-hover:text-dentBlue-900'
                              }`} />
                              <span className="whitespace-nowrap">{subItem.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link 
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
                  )}
                </div>
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

      {/* Pantalla de Carga - Cerrar Sesión */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center transform transition-all scale-100 opacity-100">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-dentBlue-900 border-l-4 border-l-transparent border-r-4 border-r-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <LogOut className="h-6 w-6 text-dentBlue-900" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Cerrando sesión</h3>
            <p className="text-sm text-gray-500 font-medium">Por favor, espere un momento...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;