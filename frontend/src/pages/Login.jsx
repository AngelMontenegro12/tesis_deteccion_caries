import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Importamos las imágenes desde la carpeta assets
import bgLogin from '../assets/fondo_login.png';
import logoEmpresa from '../assets/logo_sonrie.jpg';

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Redirigir al dashboard si ya está logeado
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorLogin('');
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, contrasena })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }
      
      // Si el login es exitoso
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
      
    } catch (err) {
      setErrorLogin(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center bg-dentBlue-900 bg-cover bg-center"
      style={{
        backgroundImage: `url(${bgLogin})`
      }}
    >
      {/* Contenedor (Card) Central (flotando encima del fondo sin ningún filtro) */}
      <div className="relative z-20 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden w-full max-w-md mx-4 p-10 flex flex-col justify-center border border-white/20">
        
        <div className="flex flex-col items-center mb-8">
          {/* Logo de la empresa */}
          <div className="bg-white p-2 rounded-2xl shadow-sm mb-5">
            <img 
              src={logoEmpresa} 
              alt="Logo Sonrisa" 
              className="w-32 h-auto rounded-xl object-contain"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = 'https://via.placeholder.com/150?text=Logo';
              }}
            />
          </div>
          <h2 className="text-2xl font-bold text-dentBlue-900 mb-1 text-center tracking-wide">
            INICIAR SESIÓN
          </h2>
          <div className="h-1 w-16 bg-dentGreen-500 rounded-full mb-3"></div>
          <p className="text-sm text-gray-500 text-center">
            Ingresa al Sistema de Detección de Caries
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
          <div className="flex flex-col relative group">
            <label className="text-xs font-bold text-dentBlue-900 uppercase tracking-wider mb-1" htmlFor="correo">
              Correo Electrónico
            </label>
            <input 
              type="email" 
              id="correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-dentGreen-500 focus:border-transparent transition-all shadow-inner text-gray-700"
              placeholder="ejemplo@sonrie.pe"
              required
            />
          </div>

          <div className="flex flex-col relative group">
            <label className="text-xs font-bold text-dentBlue-900 uppercase tracking-wider mb-1" htmlFor="contrasena">
              Contraseña
            </label>
            <input 
              type="password" 
              id="contrasena"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-dentGreen-500 focus:border-transparent transition-all shadow-inner text-gray-700"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Mostrar mensaje de error si lo hay */}
          {errorLogin && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200 text-center animate-pulse">
              {errorLogin}
            </div>
          )}

          <div className="flex items-center justify-between text-sm py-1">
            <label className="flex items-center text-gray-600 cursor-pointer hover:text-dentBlue-900 transition-colors">
              <input type="checkbox" className="mr-2 h-4 w-4 rounded border-gray-300 text-dentGreen-500 focus:ring-dentGreen-500 transition-colors" />
              Recordarme
            </label>
            <a href="#" className="font-semibold text-dentGreen-600 hover:text-dentGreen-500 transition-colors">
              ¿Olvidaste tu clave?
            </a>
          </div>

          <button 
            type="submit"
            className="mt-4 bg-dentBlue-900 hover:bg-dentGreen-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-dentGreen-500/30 transform hover:-translate-y-0.5 transition-all duration-300 tracking-wide uppercase text-sm"
          >
            Ingresar al Sistema
          </button>
        </form>
        
        <div className="mt-10 text-center text-xs font-medium text-gray-400">
          <p>© {new Date().getFullYear()} Sistema Odontológico. Todos los derechos reservados.</p>
        </div>

      </div>
    </div>
  );
};

export default Login;
