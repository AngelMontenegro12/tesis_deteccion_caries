import React, { useState, useEffect, useCallback } from 'react';
import { User, Mail, Phone, Award, Stethoscope, Save, Loader2, CheckCircle2, Shield, Camera, Lock, KeyRound, X } from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import api from '../services/api';
import ModalFinalizacion from '../components/ModalFinalizacion';
import PhoneInput from '../components/PhoneInput';
import { isValidPhone, isValidPassword, isNotEmpty, phoneError } from '../utils/validation';
import bgDashboard from '../assets/fondo_dashboard_2.png';

const readOnlyFieldClassName = 'w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 font-medium cursor-default focus:outline-none';

const getPasswordStrength = (password) => {
  const value = password.trim();
  if (!value) return null;

  const characterGroups = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9\s]/]
    .filter(group => group.test(value)).length;
  const score = Number(value.length >= 8) + Number(value.length >= 12) +
    Number(characterGroups >= 2) + Number(characterGroups >= 3);

  if (value.length < 6 || score <= 1) return { label: 'Baja', level: 1, color: 'bg-red-400', text: 'text-red-600' };
  if (score <= 3) return { label: 'Media', level: 2, color: 'bg-amber-400', text: 'text-amber-700' };
  return { label: 'Alta', level: 3, color: 'bg-green-500', text: 'text-green-700' };
};

const Perfil = () => {
  const [user, setUser] = useState(null);
  
  // Formularios
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    colegiatura: '',
    especialidad: ''
  });
  
  const [passData, setPassData] = useState({
    contrasena_actual: '',
    nueva_contrasena: '',
    confirmar_contrasena: ''
  });

  // Cropper y Foto
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Estados de carga y mensajes
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  
  const [success, setSuccess] = useState('');
  const [successProgress, setSuccessProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      setFormData({
        nombres: parsed.nombres || '',
        apellidos: parsed.apellidos || '',
        correo: parsed.correo || '',
        telefono: parsed.telefono || '',
        colegiatura: parsed.colegiatura || '',
        especialidad: parsed.especialidad || ''
      });
    }
  }, []);

  const handleChange = (e) => {
    if (e.target.name !== 'telefono') return;
    const telefono = e.target.value.replace(/\D/g, '').slice(0, 9);
    setFormData(current => ({ ...current, telefono }));
  };

  const handlePassChange = (e) => {
    const { name, value } = e.target;
    setPassData(current => ({ ...current, [name]: value }));
  };

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setSuccess('');
    } else {
      setSuccess(msg);
      setError('');
      setSuccessProgress(0);
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2;
        setSuccessProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          window.location.reload();
        }
      }, 30);
    }
  };

  const validateForm = () => {
    if (!isValidPhone(formData.telefono)) {
      showMessage(phoneError(formData.telefono), true);
      return false;
    }
    return true;
  };

  const hasChanges = user ? formData.telefono !== (user.telefono || '') : false;

  const isPhoneInvalid = !isValidPhone(formData.telefono);

  const passwordStrength = getPasswordStrength(passData.nueva_contrasena);
  const isPasswordTooShort = passData.nueva_contrasena.length > 0 && !isValidPassword(passData.nueva_contrasena);
  const isSamePassword = isNotEmpty(passData.contrasena_actual) &&
    isValidPassword(passData.nueva_contrasena) &&
    passData.contrasena_actual === passData.nueva_contrasena;
  const isConfirmationMismatch = passData.confirmar_contrasena.length > 0 &&
    passData.nueva_contrasena !== passData.confirmar_contrasena;
  const isConfirmationValid = isValidPassword(passData.nueva_contrasena) &&
    passData.confirmar_contrasena.length > 0 && !isConfirmationMismatch;
  const isSecurityValid = isNotEmpty(passData.contrasena_actual) && isConfirmationValid && !isSamePassword;

  const handleSubmitGeneral = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoadingGeneral(true);
    try {
      const response = await api.put(`/odontologos/${user.id_odontologo}`, { telefono: formData.telefono });
      if (response.data?.status === 'success') {
        const updatedUser = response.data.data;
        const newUser = { ...user, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        showMessage('Número de teléfono actualizado correctamente.');
      } else {
        showMessage(response.data?.message || 'Error al actualizar el perfil', true);
      }
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error de conexión', true);
    } finally {
      setLoadingGeneral(false);
    }
  };

  const handleSubmitSecurity = async (e) => {
    e.preventDefault();
    if (!isNotEmpty(passData.contrasena_actual)) {
      showMessage('Ingresa tu contraseña actual', true);
      return;
    }

    if (!isValidPassword(passData.nueva_contrasena)) {
      showMessage('La nueva contraseña debe tener al menos 6 caracteres', true);
      return;
    }

    if (isSamePassword) {
      showMessage('La nueva contraseña debe ser diferente de la contraseña actual', true);
      return;
    }

    if (!isConfirmationValid) {
      showMessage('Las contraseñas no coinciden', true);
      return;
    }

    setLoadingPass(true);
    try {
      const response = await api.put(`/odontologos/${user.id_odontologo}/password`, {
        contrasena_actual: passData.contrasena_actual,
        nueva_contrasena: passData.nueva_contrasena
      });
      if (response.data?.status === 'success') {
        showMessage('Contraseña actualizada de manera segura.');
        setPassData({ contrasena_actual: '', nueva_contrasena: '', confirmar_contrasena: '' });
      } else {
        showMessage(response.data?.message || 'Error al actualizar contraseña', true);
      }
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error al actualizar contraseña', true);
    } finally {
      setLoadingPass(false);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
      setImageSrc(imageDataUrl);
      setShowCropper(true);
    }
  };

  const handleSubmitPhoto = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setLoadingPhoto(true);

    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const formDataObj = new FormData();
      formDataObj.append('foto', croppedImageBlob, 'avatar.png');

      const response = await api.post(`/odontologos/${user.id_odontologo}/avatar`, formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.status === 'success') {
        const newUser = { ...user, foto_perfil: response.data.foto_perfil };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        showMessage('Foto de perfil actualizada correctamente.');
        setShowCropper(false);
        setImageSrc(null);
      } else {
        showMessage(response.data?.message || 'Error al actualizar foto', true);
      }
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error al actualizar foto', true);
    } finally {
      setLoadingPhoto(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
      {/* Header Fijo */}
      <div className="flex-none bg-white border-b border-gray-200 px-8 py-6 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">

            <div>
              <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
               <p className="text-sm text-gray-500">Consulta tus datos y actualiza tu foto, teléfono o contraseña.</p>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto relative bg-cover bg-center bg-no-repeat p-6 lg:p-10"
        style={{ backgroundImage: `url(${bgDashboard})` }}
      >
        <div className="absolute inset-0 bg-white/40 z-0 pointer-events-none"></div>
        <div className="relative z-10 max-w-7xl mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUMNA IZQUIERDA: Foto y Seguridad */}
            <div className="lg:col-span-4 space-y-8 flex flex-col">
              
              {/* Tarjeta de Foto de Perfil */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-gray-100 to-white -z-10"></div>
                
                <label className="relative group mb-6 cursor-pointer block">
                  <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-50 flex items-center justify-center relative">
                    {(user.foto_perfil && user.foto_perfil !== 'null' && user.foto_perfil.length > 5 && !imgError) ? (
                      <img 
                        src={`http://localhost:5000${user.foto_perfil}`} 
                        alt="Perfil" 
                        className="w-full h-full object-cover group-hover:opacity-70 transition-opacity duration-300" 
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <User className="w-20 h-20 text-gray-300 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                    )}
                    
                    {/* Overlay Oscuro en Hover */}
                    <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Camera className="w-10 h-10 text-white" strokeWidth={1.5} />
                    </div>
                  </div>
                  
                  {/* Botón flotante (ahora decorativo porque todo es clickeable) */}
                  <div className="absolute bottom-2 right-2 w-11 h-11 bg-white border border-gray-200 text-gray-700 group-hover:bg-gray-50 group-hover:text-dentBlue-900 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                    <Camera className="w-5 h-5" />
                  </div>
                  
                  {/* Input invisible que es accionado por el Label */}
                  <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={onFileChange} />
                </label>
                
                 <span className="text-xs text-gray-500">Foto de perfil (Opcional)</span>
                 <h2 className="text-2xl font-bold text-gray-900 leading-tight">{user.nombres}</h2>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{user.apellidos}</h2>
                
                <div className="flex items-center gap-2 mt-2 px-4 py-1.5 bg-green-50 rounded-full">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700 capitalize">{user.rol}</span>
                </div>
              </div>

              {/* Tarjeta de Seguridad (Contraseña) */}
              <form onSubmit={handleSubmitSecurity} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
                <div className="p-6 sm:p-8 flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                      <Lock className="w-5 h-5 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Seguridad</h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="contrasena-actual" className="text-sm font-semibold text-gray-700">Contraseña Actual <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input id="contrasena-actual" type="password" name="contrasena_actual" value={passData.contrasena_actual} onChange={handlePassChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-dentBlue-500 focus:border-dentBlue-500 transition-all font-medium" placeholder="••••••••" required />
                      </div>
                      {!isNotEmpty(passData.contrasena_actual) && (passData.nueva_contrasena || passData.confirmar_contrasena) && (
                        <p className="text-xs font-medium text-amber-700">Ingresa tu contraseña actual para actualizarla.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="nueva-contrasena" className="text-sm font-semibold text-gray-700">Nueva Contraseña <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <KeyRound className="h-5 w-5 text-gray-400" />
                        </div>
                        <input id="nueva-contrasena" type="password" name="nueva_contrasena" value={passData.nueva_contrasena} onChange={handlePassChange} aria-invalid={isPasswordTooShort || isSamePassword} aria-describedby="nueva-contrasena-ayuda" className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-gray-900 focus:ring-2 transition-all font-medium ${isPasswordTooShort || isSamePassword ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-dentBlue-500 focus:border-dentBlue-500'}`} placeholder="••••••••" required />
                      </div>
                      <p id="nueva-contrasena-ayuda" className={`text-xs font-medium ${isPasswordTooShort || isSamePassword ? 'text-red-600' : 'text-gray-500'}`}>
                        {isPasswordTooShort ? 'La nueva contraseña es muy corta: mínimo 6 caracteres.' : isSamePassword ? 'La nueva contraseña debe ser diferente de la actual.' : 'Mínimo 6 caracteres.'}
                      </p>
                      {passwordStrength && (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs font-medium text-gray-500">Dificultad: <span className={`font-bold ${passwordStrength.text}`}>{passwordStrength.label}</span></p>
                          <div className="flex gap-1.5" aria-hidden="true">
                            {[1, 2, 3].map(level => (
                              <span key={level} className={`h-1.5 flex-1 rounded-full ${level <= passwordStrength.level ? passwordStrength.color : 'bg-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="confirmar-contrasena" className="text-sm font-semibold text-gray-700">Confirmar Contraseña <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <KeyRound className="h-5 w-5 text-gray-400" />
                        </div>
                        <input id="confirmar-contrasena" type="password" name="confirmar_contrasena" value={passData.confirmar_contrasena} onChange={handlePassChange} aria-invalid={isConfirmationMismatch} aria-describedby={isConfirmationMismatch || isConfirmationValid || (isValidPassword(passData.nueva_contrasena) && !passData.confirmar_contrasena) ? 'confirmacion-ayuda' : undefined} className={`w-full pl-10 pr-11 py-2.5 bg-gray-50 border rounded-xl text-gray-900 focus:ring-2 transition-all font-medium ${isConfirmationMismatch ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : isConfirmationValid ? 'border-green-400 focus:ring-green-200 focus:border-green-400' : 'border-gray-200 focus:ring-dentBlue-500 focus:border-dentBlue-500'}`} placeholder="••••••••" required />
                        {isConfirmationValid && <CheckCircle2 className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-600" aria-hidden="true" />}
                      </div>
                      {(isConfirmationMismatch || isConfirmationValid || (isValidPassword(passData.nueva_contrasena) && !passData.confirmar_contrasena)) && (
                        <p id="confirmacion-ayuda" role={isConfirmationMismatch ? 'alert' : 'status'} className={`text-xs font-medium ${isConfirmationMismatch ? 'text-red-600' : isConfirmationValid ? 'text-green-700' : 'text-gray-500'}`}>
                          {isConfirmationMismatch ? 'Las contraseñas no coinciden.' : isConfirmationValid ? 'Las contraseñas coinciden.' : 'Confirma la nueva contraseña para continuar.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                  <button type="submit" disabled={loadingPass || !isSecurityValid} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-dentBlue-900 text-white font-bold rounded-xl hover:bg-dentBlue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                    {loadingPass ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Actualizar Contraseña
                  </button>
                </div>
              </form>
            </div>

            {/* COLUMNA DERECHA: Información Personal y Profesional */}
            <div className="lg:col-span-8">
              <form onSubmit={handleSubmitGeneral} className="bg-white rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
                <div className="p-8 sm:p-10 flex-1">
                  <p className="mb-8 text-xs leading-relaxed text-gray-500">
                    Para modificar otros datos de tu perfil, contacta al administrador mediante el módulo Soporte / Ayuda.
                  </p>
                  
                  {/* Sección: Información Personal */}
                  <div className="mb-10">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                      <User className="w-6 h-6 text-dentBlue-900" />
                      <h3 className="text-xl font-bold text-gray-900">Información Personal</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <label className="text-sm font-semibold text-gray-700">Nombres <span className="text-red-500">*</span></label>
                        </div>
                         <input type="text" name="nombres" value={formData.nombres} readOnly className={readOnlyFieldClassName} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <label className="text-sm font-semibold text-gray-700">Apellidos <span className="text-red-500">*</span></label>
                        </div>
                         <input type="text" name="apellidos" value={formData.apellidos} readOnly className={readOnlyFieldClassName} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <label className="text-sm font-semibold text-gray-700">Correo Electrónico <span className="text-red-500">*</span></label>
                        </div>
                         <input type="email" name="correo" value={formData.correo} readOnly className={readOnlyFieldClassName} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <label className="text-sm font-semibold text-gray-700">Teléfono <span className="text-red-500">*</span></label>
                           {isPhoneInvalid && <span className="text-xs text-red-500 font-medium">9 dígitos, empieza en 9</span>}
                        </div>
                        <PhoneInput name="telefono" value={formData.telefono} onChange={handleChange} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:ring-2 transition-all font-medium ${isPhoneInvalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Sección: Información Profesional */}
                  <div>
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                      <Stethoscope className="w-6 h-6 text-dentGreen-600" />
                      <h3 className="text-xl font-bold text-gray-900">Información Profesional</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <label className="text-sm font-semibold text-gray-700">Número de Colegiatura (Opcional)</label>
                        </div>
                         <input type="text" name="colegiatura" value={formData.colegiatura} readOnly className={readOnlyFieldClassName} placeholder="Ej. COP 12345" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <label className="text-sm font-semibold text-gray-700">Especialidad (Opcional)</label>
                        </div>
                         <input type="text" name="especialidad" value={formData.especialidad} readOnly className={readOnlyFieldClassName} placeholder="Ej. Ortodoncia, Odontopediatría..." />
                      </div>
                    </div>
                  </div>
                  
                </div>
                
                {/* Footer del Formulario Derecho */}
                <div className="p-6 sm:p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end">
                  <button type="submit" disabled={loadingGeneral || !hasChanges || isPhoneInvalid} className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-dentBlue-900 text-white font-bold rounded-xl hover:bg-dentBlue-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg">
                    {loadingGeneral ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                     Guardar teléfono
                  </button>
                </div>
              </form>
            </div>
            
          </div>
        </div>
      </div>

      {/* MODAL DEL CROPPER */}
      {showCropper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-dentBlue-900" />
                Ajustar Foto
              </h3>
              <button 
                onClick={() => { setShowCropper(false); setImageSrc(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="relative w-full h-80 bg-gray-100 rounded-2xl overflow-hidden mb-6">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="round"
                  showGrid={false}
                />
              </div>
              
              <div className="space-y-2 mb-8">
                <div className="flex items-center justify-between text-sm font-semibold text-gray-600">
                  <span>Alejar</span>
                  <span>Zoom</span>
                  <span>Acercar</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full accent-dentBlue-900 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <button
                type="button"
                onClick={handleSubmitPhoto}
                disabled={loadingPhoto}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-dentBlue-900 text-white font-bold text-lg rounded-xl hover:bg-dentBlue-800 transition-colors disabled:opacity-70 shadow-lg"
              >
                {loadingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {loadingPhoto ? 'Guardando...' : 'Aplicar y Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito Estilo Diagnóstico */}
      <ModalFinalizacion 
        isOpen={!!success} 
        progress={successProgress} 
        title="¡Operación Exitosa!" 
        message={success} 
      />

      {/* Modal de Error */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 relative pt-8 pb-6 px-6 text-center">
            
            <div className="w-16 h-16 rounded-full border-[3px] border-red-500 flex items-center justify-center mx-auto mb-5">
              <X className="w-8 h-8 text-red-500" strokeWidth={2.5} />
            </div>
            
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-500 font-medium text-sm mb-6">
              {error}
            </p>

            <button
              onClick={() => setError('')}
              className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-md"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Perfil;
