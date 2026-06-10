import React, { useState, useEffect } from 'react';
import { X, UserPlus, Loader2, CreditCard, Calendar, Phone, MapPin, Mail, Users } from 'lucide-react';

const ModalNuevoPaciente = ({ isOpen, onClose, onCreated }) => {
  const initialFormData = {
    nombres: '',
    apellidos: '',
    dni: '',
    fecha_nacimiento: '',
    genero: '',
    telefono: '',
    correo: '',
    direccion: '',
    observaciones_generales: '',
    apoderado: '',
    telefono_apoderado: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setFormErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const calculateAge = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    const birthDate = new Date(dateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nombres.trim()) errors.nombres = "Los nombres son requeridos";
    if (!formData.apellidos.trim()) errors.apellidos = "Los apellidos son requeridos";
    if (!formData.dni.trim()) {
      errors.dni = "El DNI es requerido";
    } else if (formData.dni.length < 8) {
      errors.dni = "El DNI debe tener al menos 8 dígitos";
    }
    if (!formData.fecha_nacimiento) errors.fecha_nacimiento = "Fecha de nacimiento requerida";
    if (!formData.genero) errors.genero = "El género es requerido";
    
    // Validar menor de edad
    const age = calculateAge(formData.fecha_nacimiento);
    if (age !== null && age < 18) {
      if (!formData.apoderado?.trim()) errors.apoderado = "Nombre del apoderado es requerido";
      if (!formData.telefono_apoderado?.trim()) errors.telefono_apoderado = "Teléfono de apoderado requerido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/pacientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newPatientData = await response.json();
        onCreated(newPatientData.paciente || newPatientData);
        onClose();
      } else {
        const err = await response.json();
        setFormErrors({ general: err.error || "Error al registrar paciente" });
      }
    } catch (error) {
      console.error("Error creating:", error);
      setFormErrors({ general: "Error de red al registrar paciente" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50 shrink-0">
          <h2 className="text-xl font-extrabold text-dentBlue-900 flex items-center">
            <UserPlus className="w-6 h-6 mr-3 text-dentGreen-500" />
            Registrar Nuevo Paciente
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
          <div className="px-4 md:px-12 lg:px-16 pb-4">
            {formErrors.general && (
               <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 font-medium">
                 {formErrors.general}
               </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              
              {/* Nombres */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Nombres <span className="text-red-500">*</span></label>
                <input 
                  type="text" name="nombres" value={formData.nombres} onChange={handleInputChange}
                  placeholder="Ej: Ángel Eduardo"
                  className={`w-full px-4 py-3 bg-gray-50 border ${formErrors.nombres ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700`}
                />
                {formErrors.nombres && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.nombres}</p>}
              </div>

              {/* Apellidos */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Apellidos <span className="text-red-500">*</span></label>
                <input 
                  type="text" name="apellidos" value={formData.apellidos} onChange={handleInputChange}
                  placeholder="Ej: Montenegro Lucumí"
                  className={`w-full px-4 py-3 bg-gray-50 border ${formErrors.apellidos ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700`}
                />
                {formErrors.apellidos && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.apellidos}</p>}
              </div>

              {/* DNI & Fecha Nacimiento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><CreditCard className="w-3.5 h-3.5 mr-1" /> DNI <span className="text-red-500 ml-1">*</span></label>
                  <input 
                    type="text" name="dni" maxLength="8" value={formData.dni} onChange={handleInputChange}
                    placeholder="8 dígitos"
                    className={`w-full px-4 py-3 bg-gray-50 border ${formErrors.dni ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700`}
                  />
                  {formErrors.dni && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.dni}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> Nacimiento <span className="text-red-500 ml-1">*</span></label>
                  <input 
                    type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange}
                    max={new Date().toISOString().split("T")[0]}
                    className={`w-full px-4 py-3 bg-gray-50 border ${formErrors.fecha_nacimiento ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-600`}
                  />
                  {formErrors.fecha_nacimiento && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.fecha_nacimiento}</p>}
                </div>
              </div>

              {/* Género & Edad (Calculada) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Género <span className="text-red-500">*</span></label>
                  <select 
                    name="genero" value={formData.genero} onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-50 border ${formErrors.genero ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-dentBlue-900/20 focus:border-dentBlue-900'} rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700`}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> Edad</label>
                  <input 
                    type="text" value={calculateAge(formData.fecha_nacimiento) !== null ? `${calculateAge(formData.fecha_nacimiento)} años` : '-'} readOnly
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none text-sm font-medium text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Teléfono & Dirección */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><Phone className="w-3.5 h-3.5 mr-1" /> Teléfono</label>
                <input 
                  type="tel" name="telefono" maxLength="9" value={formData.telefono} onChange={handleInputChange}
                  placeholder="Ej: 999888777"
                  className={`w-full px-4 py-3 bg-gray-50 border ${formErrors.telefono ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700`}
                />
                {formErrors.telefono && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.telefono}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> Dirección</label>
                <input 
                  type="text" name="direccion" value={formData.direccion} onChange={handleInputChange}
                  placeholder="Dirección del paciente"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700"
                />
              </div>

              {/* Correo */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><Mail className="w-3.5 h-3.5 mr-1" /> Correo</label>
                <input 
                  type="email" name="correo" value={formData.correo} onChange={handleInputChange}
                  placeholder="correo@ejemplo.com"
                  className={`w-full px-4 py-3 bg-gray-50 border ${formErrors.correo ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700`}
                />
                {formErrors.correo && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.correo}</p>}
              </div>

              {/* Observaciones */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Observaciones Generales</label>
                <textarea 
                  name="observaciones_generales" value={formData.observaciones_generales} onChange={handleInputChange}
                  placeholder="Alergias, condiciones previas..."
                  rows="2"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700 resize-none"
                />
              </div>

              {/* Apoderado */}
              <div className={`md:col-span-2 p-5 border rounded-2xl transition-all duration-300 ${
                (calculateAge(formData.fecha_nacimiento) !== null && calculateAge(formData.fecha_nacimiento) < 18) 
                  ? 'bg-blue-50/40 border-blue-200' 
                  : 'bg-gray-50 border-gray-200 opacity-60 grayscale-[50%] pointer-events-none'
              }`}>
                <h3 className="text-sm font-bold text-dentBlue-900 mb-4 flex items-center">
                  <Users className="w-4 h-4 mr-2" /> Datos del Apoderado (Obligatorio en menores de edad)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Nombre del Apoderado <span className="text-red-500">*</span></label>
                    <input 
                      type="text" name="apoderado" value={formData.apoderado} onChange={handleInputChange}
                      placeholder="Nombre completo"
                      disabled={!(calculateAge(formData.fecha_nacimiento) !== null && calculateAge(formData.fecha_nacimiento) < 18)}
                      tabIndex={!(calculateAge(formData.fecha_nacimiento) !== null && calculateAge(formData.fecha_nacimiento) < 18) ? -1 : 0}
                      className={`w-full px-4 py-2.5 bg-white border ${formErrors.apoderado ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50`}
                    />
                    {formErrors.apoderado && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.apoderado}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><Phone className="w-3.5 h-3.5 mr-1" /> Tel. Apoderado  <span className="text-red-500">*</span></label>
                    <input 
                      type="tel" name="telefono_apoderado" maxLength="9" value={formData.telefono_apoderado} onChange={handleInputChange}
                      placeholder="Ej: 999888777"
                      disabled={!(calculateAge(formData.fecha_nacimiento) !== null && calculateAge(formData.fecha_nacimiento) < 18)}
                      tabIndex={!(calculateAge(formData.fecha_nacimiento) !== null && calculateAge(formData.fecha_nacimiento) < 18) ? -1 : 0}
                      className={`w-full px-4 py-2.5 bg-white border ${formErrors.telefono_apoderado ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50`}
                    />
                    {formErrors.telefono_apoderado && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.telefono_apoderado}</p>}
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0 gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors text-sm"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-2.5 rounded-xl font-bold text-white bg-dentBlue-900 hover:bg-dentBlue-800 focus:ring-4 focus:ring-dentBlue-900/30 transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar Paciente'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalNuevoPaciente;
