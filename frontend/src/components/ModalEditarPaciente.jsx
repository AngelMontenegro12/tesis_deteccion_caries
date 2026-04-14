import React, { useState, useEffect } from 'react';
import { X, Edit2, Loader2 } from 'lucide-react';

const ModalEditarPaciente = ({ isOpen, onClose, patient, onUpdate }) => {
  const [formData, setFormData] = useState({
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
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && patient) {
      setFormData({
        nombres: patient.nombres || '',
        apellidos: patient.apellidos || '',
        dni: patient.dni || '',
        fecha_nacimiento: patient.fecha_nacimiento || '',
        genero: patient.genero || 'M',
        telefono: patient.telefono || '',
        correo: patient.correo || '',
        direccion: patient.direccion || '',
        observaciones_generales: patient.observaciones_generales || '',
        apoderado: patient.apoderado || '',
        telefono_apoderado: patient.telefono_apoderado || ''
      });
      setFormErrors({});
    }
  }, [isOpen, patient]);

  if (!isOpen) return null;

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
    
    // Validar menor de edad de forma simple (edad en años vs 18)
    const today = new Date();
    const birthDate = new Date(formData.fecha_nacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      if (!formData.apoderado?.trim()) errors.apoderado = "Nombre del apoderado es requerido para menores";
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
      const response = await fetch(`http://localhost:5000/api/pacientes/${patient.id_paciente}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedPatientData = await response.json();
        // Llamar al callback con los nuevos datos combinados por si faltan campos devueltos
        onUpdate({ ...patient, ...updatedPatientData });
        onClose();
      } else {
        const err = await response.json();
        setFormErrors({ general: err.error || "Error al actualizar" });
      }
    } catch (error) {
      console.error("Error updating:", error);
      setFormErrors({ general: "Error de red al actualizar paciente" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50 shrink-0">
          <h2 className="text-xl font-extrabold text-dentBlue-900 flex items-center">
            <Edit2 className="w-6 h-6 mr-3 text-dentGreen-500" />
            Editar Paciente
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {formErrors.general && (
             <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 font-medium">
               {formErrors.general}
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Nombres */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Nombres <span className="text-red-500">*</span></label>
              <input 
                type="text" name="nombres" value={formData.nombres} onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-50 border ${formErrors.nombres ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700`}
              />
              {formErrors.nombres && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.nombres}</p>}
            </div>

            {/* Apellidos */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Apellidos <span className="text-red-500">*</span></label>
              <input 
                type="text" name="apellidos" value={formData.apellidos} onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-50 border ${formErrors.apellidos ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700`}
              />
              {formErrors.apellidos && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.apellidos}</p>}
            </div>

            {/* DNI */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">DNI / Documento <span className="text-red-500">*</span></label>
              <input 
                type="text" name="dni" maxLength="15" value={formData.dni} onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-50 border ${formErrors.dni ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700`}
              />
              {formErrors.dni && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.dni}</p>}
            </div>

            {/* Género */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Género</label>
              <select 
                name="genero" value={formData.genero} onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700 appearance-none"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Fecha Nacimiento */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Fecha Nacimiento <span className="text-red-500">*</span></label>
              <input 
                type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-50 border ${formErrors.fecha_nacimiento ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700`}
              />
              {formErrors.fecha_nacimiento && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.fecha_nacimiento}</p>}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Teléfono Personal</label>
              <input 
                type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700"
              />
            </div>

            {/* Correo */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Correo Electrónico</label>
              <input 
                type="email" name="correo" value={formData.correo} onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700"
              />
            </div>

            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Dirección Completa</label>
              <input 
                type="text" name="direccion" value={formData.direccion} onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700"
              />
            </div>

            {/* Observaciones */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Observaciones Generales</label>
              <textarea 
                name="observaciones_generales" value={formData.observaciones_generales} onChange={handleInputChange}
                rows="2"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700 resize-none"
              />
            </div>

            {/* Datos de Apoderado (Condicional) */}
            {(() => {
              const today = new Date();
              const birthDate = new Date(formData.fecha_nacimiento);
              let age = formData.fecha_nacimiento ? today.getFullYear() - birthDate.getFullYear() : 18;
              if (formData.fecha_nacimiento && (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()))) {
                age--;
              }
              return age;
            })() < 18 && (
              <div className="md:col-span-2 p-5 bg-blue-50/40 border border-blue-100 rounded-2xl">
                <h3 className="text-sm font-bold text-dentBlue-900 mb-4 flex items-center">Datos del Apoderado Legal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Nombre del Apoderado <span className="text-red-500">*</span></label>
                    <input 
                      type="text" name="apoderado" value={formData.apoderado} onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 bg-white border ${formErrors.apoderado ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700`}
                    />
                    {formErrors.apoderado && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.apoderado}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Tel. Apoderado <span className="text-red-500">*</span></label>
                    <input 
                      type="tel" name="telefono_apoderado" value={formData.telefono_apoderado} onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 bg-white border ${formErrors.telefono_apoderado ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700`}
                    />
                    {formErrors.telefono_apoderado && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.telefono_apoderado}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer (Actions) */}
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
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalEditarPaciente;