import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Search, 
  UserPlus, 
  ChevronRight, 
  ChevronLeft, 
  UserCheck, 
  CheckCircle,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Users,
  Loader2,
  X
} from 'lucide-react';
import bgDashboard from '../assets/fondo_dashboard_2.png';

const EvaluacionClinica = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [patientMode, setPatientMode] = useState('search'); // 'search' o 'create'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Estado para el formulario de nuevo paciente
  const [formData, setFormData] = useState({
    id_paciente: null,
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Efecto para buscar pacientes con un debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        try {
          const response = await fetch(`http://localhost:5000/api/pacientes/buscar?q=${searchQuery.trim()}`);
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data);
          } else {
            console.error('Error fetching search results');
            setSearchResults([]);
          }
        } catch (error) {
          console.error('Error al conectar con el servidor:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const steps = [
    { id: 1, title: 'Identificación del Paciente' },
    { id: 2, title: 'Contexto Clínico' },
    { id: 3, title: 'Carga de Radiografías' },
    { id: 4, title: 'Resumen y Ejecución' }
  ];

  const handleNext = async () => {
    if (currentStep === 1 && patientMode === 'create') {
      setIsSubmitting(true);
      try {
        const isEditing = !!formData.id_paciente;
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing 
          ? `http://localhost:5000/api/pacientes/${formData.id_paciente}`
          : 'http://localhost:5000/api/pacientes';

        // Calcular si es menor de edad para asegurar enviar apoderado correctamente (aunque ya estaria en formData)
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const savedPatient = await response.json();
          setSelectedPatient(savedPatient);
          setFormData(savedPatient); // update formData with id

          // Mostrar confirmación de éxito y esperar 1.5s
          setSuccessMessage(isEditing ? 'Paciente Actualizado Correctamente' : 'Paciente Registrado Correctamente');
          setIsSuccess(true);
          
          // Cambiar de paso en 1.5s sin ocultar el toast
          setTimeout(() => {
            setIsSubmitting(false);
            setCurrentStep(currentStep + 1);
          }, 1500);

          // Ocultar el toast animado en 4s
          setTimeout(() => {
            setIsSuccess(false);
          }, 4000);
        } else {
          setIsSubmitting(false);
          console.error('Error al registrar paciente');
          alert('Hubo un error al registrar el paciente, compruebe los datos.');
        }
      } catch (error) {
        setIsSubmitting(false);
        console.error('Error in request:', error);
        alert('Hubo un error de red al intentar registrar el paciente.');
      }
    } else {
      if (currentStep < 4) setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const getIsNextDisabled = () => {
    if (currentStep === 1) {
      if (patientMode === 'search') return !selectedPatient;
      if (patientMode === 'create') {
        const basicData = formData.nombres && formData.apellidos && formData.dni.length >= 8;
        const isMinor = calculateAge(formData.fecha_nacimiento) !== null && calculateAge(formData.fecha_nacimiento) < 18;
        if (isMinor) {
           return !(basicData && formData.apoderado);
        }
        return !basicData;
      }
    }
    return false;
  };

  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  return (
    <div className="flex flex-col h-full font-sans pb-8 relative">
      
      {/* Estilos locales para las animaciones del toast */}
      <style>{`
        @keyframes shrink-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {/* Flash Message / Snackbar */}
      {isSuccess && (
        <div className="fixed top-8 right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden min-w-[320px] flex flex-col">
            <div className="px-5 py-3.5 flex items-center gap-3.5">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="flex-1 font-medium text-gray-700 text-sm">
                {successMessage}
              </span>
              <button 
                onClick={() => setIsSuccess(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full p-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Base gris de la barra de progreso */}
            <div className="h-1 w-full bg-gray-50">
              {/* Barra verde vaciándose */}
              <div 
                className="h-full bg-emerald-500 rounded-bl-xl origin-left"
                style={{ 
                  animation: 'shrink-progress 4000ms linear forwards' 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Topbar */}
      <header className="h-20 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm shrink-0">
        <h1 className="text-2xl font-bold text-dentBlue-900 tracking-tight flex items-center">
          <Stethoscope className="w-8 h-8 mr-3 text-dentGreen-500" />
          Nueva Evaluación Clínica
        </h1>
      </header>

      {/* Main Content */}
      <div 
        className="flex-1 overflow-auto p-8 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url(${bgDashboard})` }}
      >
        <div className="max-w-[90%] 2xl:max-w-7xl mx-auto">
          
          {/* Progress Bar */}
          <div className="mb-14 px-4 max-w-5xl mx-auto">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0 rounded-full"></div>
              
              {/* Progreso Activo */}
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-dentGreen-500 z-0 transition-all duration-500 rounded-full" 
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>

              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center group">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm border-2 
                      ${isActive ? 'bg-white border-dentGreen-500 text-dentGreen-500 scale-110' : 
                        isCompleted ? 'bg-dentGreen-500 border-dentGreen-500 text-white' : 
                        'bg-white border-gray-300 text-gray-400'}`}
                    >
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : step.id}
                    </div>
                    <span 
                      className={`absolute top-12 whitespace-nowrap text-sm font-semibold transition-colors duration-300
                      ${isActive ? 'text-dentBlue-900' : isCompleted ? 'text-dentGreen-500' : 'text-gray-400'}`}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
            
            {/* Contenido Dinámico de los Pasos (Ocupa el espacio flexible) */}
            <div className="flex-1">
              
              {/* Paso 1: Identificación del Paciente */}
              {currentStep === 1 && (
                <div className="animate-fade-in-up">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-dentBlue-900">Identificación del Paciente</h2>
                    <p className="text-sm text-gray-500 mt-1">Busque un paciente existente o registre uno nuevo para comenzar la evaluación.</p>
                  </div>
                  
                  <div className="p-8">
                    {/* Tabs: Buscar vs Nuevo */}
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-10 w-fit mx-auto border border-gray-200/60 shadow-inner">
                      <button 
                        onClick={() => setPatientMode('search')}
                        className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                          patientMode === 'search' 
                            ? 'bg-white text-dentBlue-900 shadow-sm ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                      >
                        <Search className="w-4 h-4 mr-2" /> Buscar Paciente
                      </button>
                      <button 
                        onClick={() => {
                          setPatientMode('create');
                          // Resetear el formulario sin perder el selectedPatient (por si el usuario vuelve a buscar)
                          setFormData({
                            id_paciente: null,
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
                        }}
                        className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                          patientMode === 'create' 
                            ? 'bg-white text-dentBlue-900 shadow-sm ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                      >
                        <UserPlus className="w-4 h-4 mr-2" /> Registrar Nuevo
                      </button>
                    </div>

                    {/* Mode: Search Patient */}
                    {patientMode === 'search' && (
                      <div className="max-w-2xl mx-auto space-y-6">
                        {!selectedPatient ? (
                          <>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-dentBlue-900 transition-colors">
                                <Search className="w-5 h-5" />
                              </div>
                              <input 
                                type="text" 
                                placeholder="Ingrese DNI o Nombre del paciente..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-all text-sm font-medium shadow-sm text-gray-700"
                              />
                              <button className="absolute inset-y-2 right-2 bg-dentBlue-900 hover:bg-dentBlue-800 text-white px-6 rounded-lg text-sm font-bold transition-colors shadow-sm">
                                Buscar
                              </button>
                            </div>

                        {/* Resultados de Búsqueda */}
                        {searchQuery.length > 2 && (
                          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                              <span>Resultados Encontrados</span>
                              {isSearching && <span className="text-dentBlue-900 animate-pulse">Buscando...</span>}
                            </div>
                            <ul className="divide-y divide-gray-100">
                              {searchResults.length > 0 ? (
                                searchResults.map((paciente) => (
                                  <li key={paciente.id_paciente} className="flex items-center justify-between p-4 hover:bg-blue-50/50 cursor-pointer transition-colors group bg-white">
                                    <div className="flex items-center space-x-4">
                                      <div className="w-10 h-10 rounded-full bg-dentBlue-900/10 text-dentBlue-900 flex items-center justify-center font-bold">
                                        {paciente.nombres.charAt(0)}{paciente.apellidos.charAt(0)}
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-gray-900 group-hover:text-dentBlue-900 transition-colors">
                                          {paciente.nombres} {paciente.apellidos}
                                        </p>
                                        <p className="text-xs text-gray-500 font-medium">DNI: {paciente.dni} • {paciente.edad} años</p>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => setSelectedPatient(paciente)}
                                      className="text-dentGreen-500 bg-dentGreen-50 hover:bg-dentGreen-100 p-2 rounded-lg flex items-center text-xs font-bold transition-colors border border-dentGreen-200 shadow-sm"
                                    >
                                      <UserCheck className="w-4 h-4 mr-1" /> Seleccionar
                                    </button>
                                  </li>
                                ))
                              ) : (
                                !isSearching && (
                                  <li className="p-6 text-center text-gray-500 text-sm font-medium bg-white">
                                    No se encontraron pacientes que coincidan con la búsqueda.
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                        
                        {searchQuery.length === 0 && (
                          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                            <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                              <Search className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium text-sm max-w-sm mx-auto">Utilice el buscador superior para encontrar un paciente previamente registrado en su base de datos.</p>
                          </div>
                        )}
                          </>
                        ) : (
                          <div className="bg-white border border-dentGreen-200 rounded-xl shadow-sm overflow-hidden animate-fade-in relative">
                            <div className="bg-dentGreen-50 px-6 py-4 border-b border-dentGreen-200 flex justify-between items-center relative z-20">
                              <h3 className="text-sm font-bold text-dentGreen-700 flex items-center">
                                <CheckCircle className="w-4 h-4 mr-2" /> Paciente Seleccionado
                              </h3>
                              <button 
                                onClick={() => setSelectedPatient(null)}
                                className="text-xs font-bold text-gray-500 hover:text-dentBlue-900 transition-colors"
                              >
                                Seleccionar otro
                              </button>
                            </div>
                            
                            <div className="p-8 opacity-90">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                                
                                {/* Nombres */}
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Nombres</label>
                                  <input 
                                    type="text" value={selectedPatient.nombres || ''} readOnly
                                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-dentGreen-300"
                                  />
                                </div>

                                {/* Apellidos */}
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Apellidos</label>
                                  <input 
                                    type="text" value={selectedPatient.apellidos || ''} readOnly
                                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-dentGreen-300"
                                  />
                                </div>

                                {/* DNI & Edad (o Fecha Nacimiento dependiendo de lo que devuelva el back) */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><CreditCard className="w-3.5 h-3.5 mr-1" /> DNI</label>
                                    <input 
                                      type="text" value={selectedPatient.dni || ''} readOnly
                                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-dentGreen-300"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> Edad</label>
                                    <input 
                                      type="text" value={`${selectedPatient.edad || calculateAge(selectedPatient.fecha_nacimiento) || 0} años`} readOnly
                                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:ring-1 focus:ring-dentGreen-300"
                                    />
                                  </div>
                                </div>

                                {/* Género & Fecha de Nacimiento */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Género</label>
                                    <input 
                                      type="text" value={(selectedPatient.genero === 'M' ? 'Masculino' : selectedPatient.genero === 'F' ? 'Femenino' : selectedPatient.genero) || ''} readOnly
                                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-dentGreen-300"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> Nacimiento</label>
                                    <input 
                                      type="date" value={selectedPatient.fecha_nacimiento ? selectedPatient.fecha_nacimiento.substring(0, 10) : ''} readOnly
                                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-dentGreen-300"
                                    />
                                  </div>
                                </div>

                                {/* Teléfono & Dirección */}
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><Phone className="w-3.5 h-3.5 mr-1" /> Teléfono</label>
                                  <input 
                                    type="tel" value={selectedPatient.telefono || 'No registrado'} readOnly
                                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-dentGreen-300 selection:bg-dentGreen-200 selection:text-dentGreen-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> Dirección</label>
                                  <input 
                                    type="text" value={selectedPatient.direccion || 'No registrada'} readOnly
                                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-dentGreen-300 selection:bg-dentGreen-200 selection:text-dentGreen-900"
                                  />
                                </div>

                                {/* Correo */}
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><Mail className="w-3.5 h-3.5 mr-1" /> Correo</label>
                                  <input 
                                    type="email" value={selectedPatient.correo || 'No registrado'} readOnly
                                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-dentGreen-300 selection:bg-dentGreen-200 selection:text-dentGreen-900"
                                  />
                                </div>

                                {/* Observaciones */}
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Observaciones Generales</label>
                                  <textarea 
                                    value={selectedPatient.observaciones_generales || 'Ninguna'} readOnly
                                    rows="2"
                                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 resize-none focus:outline-none focus:ring-1 focus:ring-dentGreen-300 selection:bg-dentGreen-200 selection:text-dentGreen-900"
                                  />
                                </div>

                                {/* Menor de Edad (Apoderado) */}
                                {(selectedPatient.edad < 18 || calculateAge(selectedPatient.fecha_nacimiento) < 18) && (
                                  <div className="md:col-span-2 p-5 bg-blue-50/40 border border-blue-100 rounded-2xl mt-2">
                                    <h3 className="text-sm font-bold text-dentBlue-900 mb-4 flex items-center"><Users className="w-4 h-4 mr-2" /> Datos del Apoderado</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Nombre del Apoderado</label>
                                        <input 
                                          type="text" value={selectedPatient.apoderado || 'No registrado'} readOnly
                                          className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-dentGreen-300"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><Phone className="w-3.5 h-3.5 mr-1" /> Tel. Apoderado</label>
                                        <input 
                                          type="text" value={selectedPatient.telefono_apoderado || 'No registrado'} readOnly
                                          className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-dentGreen-300"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mode: Create Patient */}
                    {patientMode === 'create' && (
                      <div className="animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                          
                          {/* Nombres */}
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Nombres <span className="text-red-500">*</span></label>
                            <input 
                              type="text" name="nombres" value={formData.nombres} onChange={handleInputChange}
                              placeholder="Ej: Ángel Eduardo"
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700"
                            />
                          </div>

                          {/* Apellidos */}
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Apellidos <span className="text-red-500">*</span></label>
                            <input 
                              type="text" name="apellidos" value={formData.apellidos} onChange={handleInputChange}
                              placeholder="Ej: Montenegro Lucumí"
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700"
                            />
                          </div>

                          {/* DNI & Fecha Nacimiento */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><CreditCard className="w-3.5 h-3.5 mr-1" /> DNI <span className="text-red-500 ml-1">*</span></label>
                              <input 
                                type="text" name="dni" maxLength="8" value={formData.dni} onChange={handleInputChange}
                                placeholder="8 dígitos"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> Nacimiento <span className="text-red-500 ml-1">*</span></label>
                              <input 
                                type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-600"
                              />
                            </div>
                          </div>

                          {/* Género & Edad (Calculada) */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Género <span className="text-red-500">*</span></label>
                              <select 
                                name="genero" value={formData.genero} onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700"
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
                              type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange}
                              placeholder="Ej: 999888777"
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700"
                            />
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
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700"
                            />
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
                                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><Phone className="w-3.5 h-3.5 mr-1" /> Tel. Apoderado</label>
                                <input 
                                  type="tel" name="telefono_apoderado" value={formData.telefono_apoderado} onChange={handleInputChange}
                                  placeholder="Ej: 999888777"
                                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700"
                                />
                              </div>
                            </div>
                          </div>
                          
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Paso 2: Placeholder */}
              {currentStep === 2 && (
                <div className="p-12 text-center animate-fade-in-up h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-blue-50 text-dentBlue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Stethoscope className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Contexto Clínico</h3>
                  <p className="text-gray-500 mt-2 max-w-sm mx-auto">Registre el motivo de consulta, nivel de higiene bucal, dolor y otros síntomas del paciente.</p>
                </div>
              )}

              {/* Paso 3: Placeholder */}
              {currentStep === 3 && (
                <div className="p-12 text-center animate-fade-in-up h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-blue-50 text-dentBlue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Stethoscope className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Carga de Radiografías</h3>
                  <p className="text-gray-500 mt-2 max-w-sm mx-auto">Seleccione y suba las imágenes radiográficas necesarias para que la Inteligencia Artificial analice las lesiones.</p>
                </div>
              )}

              {/* Paso 4: Placeholder */}
              {currentStep === 4 && (
                <div className="p-12 text-center animate-fade-in-up h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-green-50 text-dentGreen-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Resumen y Ejecución</h3>
                  <p className="text-gray-500 mt-2 max-w-sm mx-auto">Se presentarán los resultados del modelo predictivo y se aprobará el diagnóstico clínico final.</p>
                </div>
              )}
            </div>

            {/* Bottom Actions (Botones de Atrás y Siguiente pegados abajo) */}
            <div className="px-8 py-5 bg-white border-t border-gray-100 flex items-center justify-between mt-auto">
              <button 
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={`flex items-center px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
                  currentStep === 1 
                    ? 'text-gray-400 cursor-not-allowed hidden' 
                    : 'text-gray-600 hover:bg-gray-100 bg-gray-50 border border-gray-200 shadow-sm'
                }`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </button>

              <button 
                onClick={handleNext}
                disabled={getIsNextDisabled() || isSubmitting}
                className={`flex items-center justify-center px-8 py-3 rounded-lg font-bold text-sm shadow-md transition-all duration-300 ml-auto ${
                  getIsNextDisabled() || isSubmitting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-dentBlue-900 hover:bg-dentBlue-800 text-white hover:shadow-lg'
                }`}
              >
                {/* Animaciones de boton en step 1 y create */}
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {formData.id_paciente ? 'Guardando...' : 'Registrando...'}
                  </>
                ) : (
                  <>
                    {currentStep === 4 ? 'Finalizar Evaluación' : (patientMode === 'create' && currentStep === 1 ? (formData.id_paciente ? 'Guardar y Continuar' : 'Registrar y Continuar') : 'Continuar')} <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluacionClinica;