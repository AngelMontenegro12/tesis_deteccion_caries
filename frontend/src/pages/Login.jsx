import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Importamos las imágenes desde la carpeta assets
import bgLogin from '../assets/fondo_login.png';
import logoEmpresa from '../assets/logo_sonrie.jpg';
import { isValidEmail, isValidPassword } from '../utils/validation';

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorLogin, setErrorLogin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState({ type: '', text: '' });
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const navigate = useNavigate();

  // Redirigir al dashboard si ya está logeado y cargar credenciales si existen
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/dashboard', { replace: true });
    }

    const savedLogin = localStorage.getItem('savedLogin');
    if (savedLogin) {
      try {
        const parsed = JSON.parse(savedLogin);
        if (parsed.correo && parsed.contrasena) {
          setCorreo(parsed.correo);
          setContrasena(parsed.contrasena);
          setRememberMe(true);
        }
      } catch (e) {}
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorLogin('');

    if (!isValidEmail(correo)) {
      setErrorLogin('Ingrese un correo electrónico válido');
      return;
    }
    if (!contrasena.trim()) {
      setErrorLogin('Ingrese su contraseña');
      return;
    }

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
      
      // Login exitoso
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (rememberMe) {
        localStorage.setItem('savedLogin', JSON.stringify({ correo, contrasena }));
      } else {
        localStorage.removeItem('savedLogin');
      }
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (err) {
      setErrorLogin(err.message);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMessage({ type: '', text: '' });

    if (!isValidEmail(forgotEmail)) {
      setForgotMessage({ type: 'error', text: 'Ingrese un correo electrónico válido' });
      return;
    }

    setIsForgotLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: forgotEmail })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      if (data.status === 'pending') {
        setForgotMessage({ type: 'warning', text: data.message });
      } else if (data.status === 'created') {
        setForgotMessage({ type: 'success', text: data.message });
      } else if (data.status === 'approved') {
        setForgotMessage({ type: 'success', text: data.message });
        setTimeout(() => setForgotStep(2), 1500);
      }
    } catch (err) {
      setForgotMessage({ type: 'error', text: err.message });
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!isValidPassword(newPassword)) {
      setForgotMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    setForgotMessage({ type: '', text: '' });
    setIsForgotLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: forgotEmail, nueva_contrasena: newPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setForgotMessage({ type: 'success', text: data.message });
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail('');
        setNewPassword('');
        setConfirmNewPassword('');
        setForgotMessage({ type: '', text: '' });
      }, 2000);
    } catch (err) {
      setForgotMessage({ type: 'error', text: err.message });
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center bg-dentBlue-900 bg-cover bg-center max-lg:items-start max-lg:py-6"
      style={{
        backgroundImage: `url(${bgLogin})`
      }}
    >
      {/* Contenedor (Card) Central (flotando encima del fondo sin ningún filtro) */}
      <div className="relative z-20 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden w-full max-w-md mx-4 p-10 max-lg:p-6 max-sm:p-5 flex flex-col justify-center border border-white/20">
        
        <div className="flex flex-col items-center mb-8 max-lg:mb-6">
          {/* Logo de la empresa */}
          <div className="bg-white p-2 rounded-2xl shadow-sm mb-5">
            <img 
              src={logoEmpresa} 
              alt="Logo Sonrisa" 
              className="w-32 max-lg:w-28 h-auto rounded-xl object-contain"
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
              Correo Electrónico <span className="text-red-500">*</span>
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
              Contraseña <span className="text-red-500">*</span>
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

          <div className="flex items-center justify-between text-sm py-1 max-lg:flex-col max-lg:items-start max-lg:gap-2">
            <label className="flex items-center text-gray-600 cursor-pointer hover:text-dentBlue-900 transition-colors">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-dentGreen-500 focus:ring-dentGreen-500 transition-colors" 
              />
               Recordarme (Opcional)
            </label>
            <button 
              type="button" 
              onClick={() => {
                setShowForgotModal(true);
                setForgotStep(1);
                setForgotMessage({ type: '', text: '' });
              }}
              className="font-semibold text-dentGreen-600 hover:text-dentGreen-500 transition-colors"
            >
              ¿Olvidaste tu clave?
            </button>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className={`mt-4 w-full flex justify-center items-center text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transform transition-all duration-300 tracking-wide uppercase text-sm ${
              isLoading 
                ? 'bg-dentGreen-500 opacity-90 cursor-not-allowed' 
                : 'bg-dentBlue-900 hover:bg-dentGreen-500 hover:shadow-dentGreen-500/30 hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ingresando al sistema...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
        
        <div className="mt-10 max-lg:mt-6 text-center text-xs font-medium text-gray-400">
          <p>© {new Date().getFullYear()} Sistema Odontológico. Todos los derechos reservados.</p>
        </div>

      </div>

      {/* MODAL OLVIDE MI CONTRASEÑA */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up relative max-lg:max-h-[90dvh] max-lg:overflow-y-auto">
            <div className="p-8 pb-10 max-lg:p-5 max-lg:pb-7">
              <h3 className="text-2xl font-extrabold text-dentBlue-900 mb-2">
                {forgotStep === 1 ? 'Recuperar Contraseña' : 'Nueva Contraseña'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {forgotStep === 1 
                  ? 'Ingresa tu correo para consultar o generar tu solicitud de recuperación.'
                  : 'Tu solicitud fue aprobada. Ingresa tu nueva contraseña.'}
              </p>

              {forgotMessage.text && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
                  forgotMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                  forgotMessage.type === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-green-50 text-green-700 border-green-200'
                }`}>
                  {forgotMessage.text}
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="flex flex-col relative">
                    <label className="text-xs font-bold text-dentBlue-900 uppercase tracking-wider mb-1">
                       Correo Electrónico <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-dentGreen-500 transition-all text-gray-700"
                      placeholder="ejemplo@sonrie.pe"
                      required
                    />
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm uppercase tracking-wider"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isForgotLoading}
                      className="flex-1 px-4 py-3 bg-dentBlue-900 text-white font-bold rounded-xl hover:bg-dentGreen-500 transition-colors text-sm uppercase tracking-wider disabled:opacity-50"
                    >
                      {isForgotLoading ? 'Verificando...' : 'Verificar'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="flex flex-col relative">
                    <label className="text-xs font-bold text-dentBlue-900 uppercase tracking-wider mb-1">
                       Nueva Contraseña <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-dentGreen-500 transition-all text-gray-700"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="flex flex-col relative">
                    <label className="text-xs font-bold text-dentBlue-900 uppercase tracking-wider mb-1">
                       Confirmar Contraseña <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="password" 
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-dentGreen-500 transition-all text-gray-700"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(false);
                        setForgotStep(1);
                      }}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm uppercase tracking-wider"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isForgotLoading}
                      className="flex-1 px-4 py-3 bg-dentBlue-900 text-white font-bold rounded-xl hover:bg-dentGreen-500 transition-colors text-sm uppercase tracking-wider disabled:opacity-50"
                    >
                      {isForgotLoading ? 'Actualizando...' : 'Actualizar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;
