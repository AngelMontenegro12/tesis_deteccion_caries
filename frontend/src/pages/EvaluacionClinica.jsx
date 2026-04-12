import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  X,
  UploadCloud,
  FileImage,
  Trash2,
  Plus,
  AlertCircle,
  Play,
  Bot,
  Clock,
  Sparkles,
  ScanLine,
  CheckCircle2,
  Cog
} from 'lucide-react';
import bgDashboard from '../assets/fondo_dashboard_2.png';
import dienteImg from '../assets/diente.png';

const EvaluacionClinica = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isResuming, setIsResuming] = useState(!!location.state?.resume);
  const [currentStep, setCurrentStep] = useState(1);
  const [patientMode, setPatientMode] = useState('search'); // 'search' o 'create'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [evaluacionId, setEvaluacionId] = useState(null);

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
  // Estado para errores de validacion
  const [formErrors, setFormErrors] = useState({});

  // Estado para el Contexto Clínico (Paso 2)
  const [contextoClinico, setContextoClinico] = useState({
    tipo_visita: 'Primera vez',
    motivo_consulta: '',
    observaciones: ''
  });

  const handleContextoChange = (e) => {
    const { name, value } = e.target;
    setContextoClinico(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- Estado para el Paso 3: Carga de Radiografías ---
  const [radiografias, setRadiografias] = useState([
    { id: Date.now(), file: null, preview: null, tipo: '1' } // ID 1 por defecto (Panorámica)
  ]);

  // Estado para el modal de eliminación de radiografía
  const [modalEliminarImg, setModalEliminarImg] = useState({ isOpen: false, idToRemove: null });

  // Estado para el modal de previsualización (pantalla completa dentro del sistema)
  const [previewModal, setPreviewModal] = useState({ isOpen: false, url: null });

  // --- Estado para el Paso 4: Detección ---
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisItems, setAnalysisItems] = useState([]);
  const [analysisTime, setAnalysisTime] = useState(0);

  const startAnalysis = () => {
    // Tiempo total deseado por imagen (5 segundos = 5000ms)
    const TIME_PER_IMAGE = 5000;

    // Inicializar los items en base a las radiografías subidas
    const items = radiografias.map((rad, index) => ({
      ...rad,
      // Estados: 'waiting', 'analyzing', 'completed'
      status: index === 0 ? 'analyzing' : 'waiting',
      progress: 0,
      startTime: index === 0 ? Date.now() : null
    }));
    setAnalysisItems(items);
    setAnalysisTime(0);
    setIsAnalyzing(true);

    // Simulacion temporal de analisis (luego lo conectaremos al backend)
    let currentActiveIndex = 0;

    const timeInterval = setInterval(() => {
      setAnalysisTime(prev => prev + 1);
    }, 1000);

    const progressInterval = setInterval(() => {
      setAnalysisItems(prev => {
        const newItems = [...prev];
        
        // Encontramos el elemento en análisis activo (evita bugs de doble render en React)
        let currentActiveIndex = newItems.findIndex(i => i.status === 'analyzing');
        
        // Si no hay nadie analizando, cerramos el ciclo (si ya todos fueron completados)
        if (currentActiveIndex === -1) {
          clearInterval(progressInterval);
          clearInterval(timeInterval);
          return prev;
        }

        const currentItem = { ...newItems[currentActiveIndex] };

        if (!currentItem.startTime) {
          currentItem.startTime = Date.now();
        }

        // Calcular progreso real en porcentaje (0-100)
        const elapsed = Date.now() - currentItem.startTime;
        const currentProgress = (elapsed / TIME_PER_IMAGE) * 100;

        if (currentProgress < 100) {
          // Guardar el progreso como entero para evitar decimales largos
          currentItem.progress = Math.floor(currentProgress);
          newItems[currentActiveIndex] = currentItem;
        } else {
          // Si llegó a 100, se completa y pasa al siguiente
          currentItem.progress = 100;
          currentItem.status = 'completed';
          newItems[currentActiveIndex] = currentItem;

          const nextIndex = currentActiveIndex + 1;
          if (newItems[nextIndex]) {
             // Iniciar la siguiente radiografía
            newItems[nextIndex] = {
              ...newItems[nextIndex],
              status: 'analyzing',
              startTime: Date.now()
            };
          } else {
            clearInterval(progressInterval);
            clearInterval(timeInterval);
            // Ya todas terminaron. Esperamos interaccion del usuario
          }
        }
        return newItems;
      });
    }, 50); // Se actualiza visualmente a 50ms, pero no depende de la pestaña activa
  };

  const addRadiografiaRow = () => {
    setRadiografias([
      ...radiografias,
      { id: Date.now(), file: null, preview: null, tipo: '1' }
    ]);
  };

  const removeRadiografiaRow = (idToRemove) => {
    const rad = radiografias.find(r => r.id === idToRemove);
    if (rad && (rad.file || rad.preview)) {
      setModalEliminarImg({ isOpen: true, idToRemove });
    } else {
      executeRemoveRadiografia(idToRemove);
    }
  };

  const executeRemoveRadiografia = (idToRemove) => {
    if (radiografias.length === 1) {
      setRadiografias([{ id: Date.now(), file: null, preview: null, tipo: '1' }]);
    } else {
      setRadiografias(radiografias.filter(rad => rad.id !== idToRemove));
    }
    setModalEliminarImg({ isOpen: false, idToRemove: null });
  };

  const handleTipoRadiografiaChange = (id, newTipo) => {
    setRadiografias(radiografias.map(rad => {
      if (rad.id === id) {
        // Si cambia a un tipo que no es 1, limpiamos el archivo e imagen porque no está soportado
        if (newTipo !== '1') {
          return { ...rad, tipo: newTipo, file: null, preview: null };
        }
        return { ...rad, tipo: newTipo };
      }
      return rad;
    }));
  };

  const handleFileChange = (id, e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setRadiografias(radiografias.map(rad => 
        rad.id === id ? { ...rad, file, preview: previewUrl } : rad
      ));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setRadiografias(radiografias.map(rad => 
        rad.id === id ? { ...rad, file, preview: previewUrl } : rad
      ));
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateField = (name, value) => {
    let error = '';
    const lettersOnlyRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const numbersOnlyRegex = /^[0-9]+$/;

    switch (name) {
      case 'nombres':
      case 'apellidos':
        if (value.trim() && !lettersOnlyRegex.test(value)) {
          error = 'Solo se permiten letras';
        }
        break;
      case 'apoderado':
        if (value.trim() && !lettersOnlyRegex.test(value)) {
          error = 'Solo se permiten letras';
        }
        break;
      case 'dni':
        if (value && (!numbersOnlyRegex.test(value) || value.length !== 8)) {
          error = value.length < 8 && numbersOnlyRegex.test(value) ? 'Debe tener 8 dígitos' : 'Solo 8 números permitidos';
        }
        break;
      case 'telefono':
      case 'telefono_apoderado':
        if (value && (!numbersOnlyRegex.test(value) || value.length !== 9)) {
          error = value.length < 9 && numbersOnlyRegex.test(value) ? 'Debe tener 9 dígitos' : 'Solo 9 números permitidos';
        }
        break;
      case 'fecha_nacimiento':
        if (value) {
          const selectedDate = new Date(value);
          const today = new Date();
          // Reset time to compare only dates
          today.setHours(0,0,0,0);
          selectedDate.setHours(0,0,0,0);
          // Allow today, but not future
          if (selectedDate > today) {
            error = 'La fecha no puede ser en el futuro';
          }
        }
        break;
      case 'correo':
        if (value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            error = 'Ingrese un correo electrónico válido';
          }
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto validación en tiempo real (evitar escribir ciertas cosas)
    let newValue = value;
    const numbersOnlyRegex = /^[0-9]+$/;
    if (name === 'dni' || name === 'telefono' || name === 'telefono_apoderado') {
      if (value && !numbersOnlyRegex.test(value)) {
        return; // No actualizar el estado si no son numeros
      }
    }
    
    setFormData({
      ...formData,
      [name]: newValue
    });

    // Validar el error y mostrarlo
    const error = validateField(name, newValue);
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Efecto para buscar pacientes con un debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
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
    { id: 4, title: 'Resumen y Ejecución' },
    { id: 5, title: 'Resultados' }
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
    } else if (currentStep === 2) {
      setIsSubmitting(true);
      try {
        const isEditing = !!evaluacionId;
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing
          ? `http://localhost:5000/api/evaluaciones/${evaluacionId}`
          : 'http://localhost:5000/api/evaluaciones';

        const payload = {
          id_paciente: selectedPatient.id_paciente,
          tipo_visita: contextoClinico.tipo_visita,
          motivo_consulta: contextoClinico.motivo_consulta,
          observaciones: contextoClinico.observaciones
        };

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const evalData = await response.json();
          if (!isEditing) {
            setEvaluacionId(evalData.id_evaluacion);
          }
          
          setSuccessMessage(isEditing ? 'Contexto Clínico Actualizado' : 'Contexto Clínico Guardado');
          setIsSuccess(true);
          
          setTimeout(() => {
            setIsSubmitting(false);
            setCurrentStep(currentStep + 1);
          }, 1500);

          setTimeout(() => setIsSuccess(false), 4000);
        } else {
          setIsSubmitting(false);
          console.error('Error al registrar evaluación');
          alert('Hubo un error al registrar el contexto clínico.');
        }
      } catch (error) {
        setIsSubmitting(false);
        console.error('Error in request:', error);
        alert('Hubo un error de red al intentar guardar la evaluación.');
      }
    } else if (currentStep === 3) {
      setIsSubmitting(true);
      try {
        const formDataPayload = new FormData();
        radiografias.forEach((rad, index) => {
          if (rad.file) {
            formDataPayload.append(`file_${index}`, rad.file);
            formDataPayload.append(`tipo_${index}`, rad.tipo);
            formDataPayload.append(`local_id_${index}`, rad.id);
            if (rad.id_bd) {
              formDataPayload.append(`idbd_${index}`, rad.id_bd);
            }
          } else if (rad.id_bd) {
            // Indicar al backend que esta imagen existe y no ha sido modificada, para que no la borre
            formDataPayload.append('keep_idbd', rad.id_bd);
          }
        });

        const url = `http://localhost:5000/api/evaluaciones/${evaluacionId}/radiografias`;
        const response = await fetch(url, {
          method: 'PUT', // PUT para indicar reemplazo y actualizacion de radiografias
          body: formDataPayload,
          // 'Content-Type' no se establece manualmente cuando usamos FormData,
          // fetch lo maneja automáticamente con el boundary adecuado.
        });

        if (response.ok) {
          const resData = await response.json();
          
          // Actualizar el estado con el ID real de la BD para futuras actualizaciones
          if (resData.radiografias && resData.radiografias.length > 0) {
            const upDatedRadiografias = [...radiografias];
            resData.radiografias.forEach(savedRad => {
              const indexRad = upDatedRadiografias.findIndex(r => r.id.toString() === savedRad.local_id);
              if (indexRad !== -1) {
                upDatedRadiografias[indexRad].id_bd = savedRad.id_radiografia;
              }
            });
            setRadiografias(upDatedRadiografias);
          }

          setSuccessMessage('Radiografías guardadas correctamente');
          setIsSuccess(true);
          
          setTimeout(() => {
            setIsSubmitting(false);
            setCurrentStep(4);
          }, 1500);

          setTimeout(() => setIsSuccess(false), 4000);
        } else {
          setIsSubmitting(false);
          const errorData = await response.json();
          alert(`Error al subir radiografías: ${errorData.error || 'Desconocido'}`);
        }
      } catch (error) {
        setIsSubmitting(false);
        console.error('Error in upload request:', error);
        alert('Hubo un error de red al intentar subir las radiografías.');
      }
    } else {
      if (currentStep < 4) setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep === 5) return; // No se puede retornar desde resultados
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const getIsNextDisabled = () => {
    if (currentStep === 1) {
      if (patientMode === 'search') return !selectedPatient;
      if (patientMode === 'create') {
        const basicData = formData.nombres && formData.apellidos && formData.dni.length === 8 && formData.fecha_nacimiento && formData.genero;
        if (!basicData) return true;

        // Comprobar errores
        for (let key in formData) {
          if (validateField(key, formData[key])) {
            return true;
          }
        }
        const isMinor = calculateAge(formData.fecha_nacimiento) !== null && calculateAge(formData.fecha_nacimiento) < 18;
        if (isMinor) {
           return !(formData.apoderado && formData.telefono_apoderado && formData.telefono_apoderado.length === 9);
        }
        return false;
      }
    }
    
    if (currentStep === 2) {
      if (!contextoClinico.tipo_visita || !contextoClinico.motivo_consulta.trim()) {
        return true;
      }
      return false;
    }
    
    if (currentStep === 3) {
      if (radiografias.length === 0) return true;
      const isAnyIncomplete = radiografias.some(rad => (!rad.file && !rad.id_bd) || !rad.tipo);
      if (isAnyIncomplete) return true;
      return false;
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

  useEffect(() => {
    if (location.state?.resume && location.state?.id_paciente) {
      const loadPatientAndResume = async () => {
        setIsResuming(true);
        try {
          // Obtener paciente
          const res = await fetch(`http://localhost:5000/api/pacientes/${location.state.id_paciente}`);
          if (res.ok) {
            const paciente = await res.json();
            await handleSelectPatient(paciente);
          }
        } catch (e) {
          console.error("Error cargando paciente para reanudar evaluación", e);
        } finally {
          setIsResuming(false);
          // Limpiar el state usando react-router-dom para no volver a ejecutar si cambia por otra razón
          navigate(location.pathname, { replace: true, state: {} });
        }
      };
      loadPatientAndResume();
    }
  }, [location.state, location.pathname, navigate]);

  const handleSelectPatient = async (paciente) => {
    setSelectedPatient(paciente);

    try {
      const response = await fetch(`http://localhost:5000/api/evaluaciones/pendientes/paciente/${paciente.id_paciente}`);
      if (response.ok) {
        const evalPendiente = await response.json();
        
        setEvaluacionId(evalPendiente.id_evaluacion);
        setContextoClinico({
          tipo_visita: evalPendiente.tipo_visita || 'Primera vez',
          motivo_consulta: evalPendiente.motivo_consulta || '',
          observaciones: evalPendiente.observaciones || ''
        });
        
        // Si la evaluación pendiente ya tiene radiografías, las cargamos y saltamos al paso 4
        if (evalPendiente.radiografias && evalPendiente.radiografias.length > 0) {
          const loadedRads = evalPendiente.radiografias.map(rad => ({
            id: rad.id_radiografia.toString(),
            id_bd: rad.id_radiografia,
            file: null, // Ya está en servidor, no hay File objeto
            preview: `http://localhost:5000/${rad.ruta_archivo}`,
            tipo: rad.id_tipo.toString()
          }));
          setRadiografias(loadedRads);
          setSuccessMessage('Evaluación pendiente recuperada');
          setIsSuccess(true);
          setCurrentStep(4);
        } else {
          setSuccessMessage('Evaluación pendiente recuperada');
          setIsSuccess(true);
          setCurrentStep(3); // Saltar al paso 3 (Carga de Radiografías)
        }
        
        setTimeout(() => setIsSuccess(false), 4000);
      } else {
        // No hay pendiente (404), limpiar evaluación por si había alguna en estado
        setEvaluacionId(null);
        setContextoClinico({
          tipo_visita: 'Primera vez',
          motivo_consulta: '',
          observaciones: ''
        });
      }
    } catch (error) {
      console.error('Error verificando evaluación pendiente:', error);
    }
  };

  return (
    <div className="flex flex-col h-full font-sans pb-8 relative">
      
      {/* Loading Overlay al reanudar */}
      {isResuming && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm animate-in fade-in duration-300 rounded-2xl">
          <Loader2 className="w-12 h-12 text-dentBlue-900 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-dentBlue-900">Retomando Evaluación...</h2>
          <p className="text-sm text-gray-500 mt-2">Cargando datos del paciente y restaurando el progreso</p>
        </div>
      )}

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
              {/* Barra de progreso vaciándose */}
              <div 
                className="h-full bg-dentBlue-900 rounded-bl-xl origin-left"
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
                        {searchQuery.length > 0 && (
                          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                              <span>Resultados Encontrados</span>
                              {isSearching && <span className="text-dentBlue-900 animate-pulse">Buscando...</span>}
                            </div>
                            <ul className="divide-y divide-gray-100">
                              {searchResults.length > 0 ? (
                                searchResults.slice(0, 4).map((paciente) => (
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
                                      onClick={() => handleSelectPatient(paciente)}
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
                                onClick={() => {
                                  setSelectedPatient(null);
                                  setEvaluacionId(null);
                                  setContextoClinico({tipo_visita: 'Primera vez', motivo_consulta: '', observaciones: ''});
                                  setCurrentStep(1);
                                }}
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
                      <div className="animate-fade-in px-4 md:px-12 lg:px-16">
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
                                  className={`w-full px-4 py-2.5 bg-white border ${formErrors.apoderado ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700`}
                                />
                                {formErrors.apoderado && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.apoderado}</p>}
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center"><Phone className="w-3.5 h-3.5 mr-1" /> Tel. Apoderado  <span className="text-red-500">*</span></label>
                                <input 
                                  type="tel" name="telefono_apoderado" maxLength="9" value={formData.telefono_apoderado} onChange={handleInputChange}
                                  placeholder="Ej: 999888777"
                                  className={`w-full px-4 py-2.5 bg-white border ${formErrors.telefono_apoderado ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 focus:border-dentBlue-900 focus:ring-dentBlue-900/20'} rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm font-medium text-gray-700`}
                                />
                                {formErrors.telefono_apoderado && <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{formErrors.telefono_apoderado}</p>}
                              </div>
                            </div>
                          </div>
                          
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Paso 2: Contexto Clínico */}
              {currentStep === 2 && (
                <div className="animate-fade-in-up">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-dentBlue-900 flex items-center">
                      <Stethoscope className="w-5 h-5 mr-2 text-dentGreen-500" /> 
                      Contexto Clínico
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Registre el motivo de consulta, tipo de visita y las observaciones preliminares del paciente.</p>
                  </div>
                  
                  <div className="p-8 px-4 md:px-12 lg:px-16 space-y-8">
                    
                    {/* Tipo de Visita (Botones tipo Píldora) */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Tipo de Visita <span className="text-red-500">*</span></label>
                      <div className="flex flex-wrap gap-3">
                        {['Primera vez', 'Control rutina', 'Urgencia', 'Seguimiento'].map((tipo) => (
                          <button
                            key={tipo}
                            onClick={() => setContextoClinico(prev => ({ ...prev, tipo_visita: tipo }))}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${
                              contextoClinico.tipo_visita === tipo
                                ? 'bg-dentBlue-900 border-dentBlue-900 text-white shadow-md shadow-dentBlue-900/20'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                            }`}
                          >
                            {tipo}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Motivo de Consulta */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Motivo de Consulta <span className="text-red-500">*</span></label>
                      <textarea
                        name="motivo_consulta"
                        value={contextoClinico.motivo_consulta}
                        onChange={handleContextoChange}
                        placeholder="Describa el motivo principal por el que el paciente acude a la consulta..."
                        rows="3"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700 resize-none shadow-sm"
                      />
                    </div>

                    {/* Observaciones (Opcional) */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center justify-between">
                        <span>Observaciones Clínicas Previas</span>
                        <span className="text-gray-400 font-medium text-[10px] bg-gray-100 px-2 py-0.5 rounded-md">OPCIONAL</span>
                      </label>
                      <textarea
                        name="observaciones"
                        value={contextoClinico.observaciones}
                        onChange={handleContextoChange}
                        placeholder="Anotaciones extra, signos vitales o cualquier detalle clínico de importancia..."
                        rows="4"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700 resize-none shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 3: Carga de Radiografías */}
              {currentStep === 3 && (
                <div className="animate-fade-in-up">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-dentBlue-900 flex items-center">
                      <Stethoscope className="w-5 h-5 mr-2 text-dentGreen-500" /> 
                      Carga de Radiografías
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Seleccione y suba las imágenes radiográficas necesarias para que la Inteligencia Artificial analice las lesiones.</p>
                  </div>
                  
                  <div className="p-8 px-4 md:px-12 lg:px-16">
                    <div className="space-y-6">
                      {radiografias.map((rad, index) => (
                        <div key={rad.id} className={`p-5 rounded-2xl border transition-all duration-300 relative bg-white ${rad.file ? 'border-dentGreen-200 ring-1 ring-dentGreen-50' : 'border-gray-200'}`}>
                          
                          {/* Botón de Borrar Fila (Solo si más de 1 bloque) */}
                          {radiografias.length > 1 && (
                            <button
                              onClick={() => removeRadiografiaRow(rad.id)}
                              className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-full flex items-center justify-center shadow-sm transition-colors"
                              title="Eliminar radiografía"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          <div className="flex flex-col md:flex-row gap-6">
                            
                            {/* Selector de Tipo (Izquierda) */}
                            <div className="md:w-1/3 flex flex-col justify-start">
                              <label className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 block">
                                Tipo de Imagen <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  value={rad.tipo}
                                  onChange={(e) => handleTipoRadiografiaChange(rad.id, e.target.value)}
                                  className="w-full px-4 py-3 pb-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-colors text-sm font-medium text-gray-700 appearance-none"
                                >
                                  <option value="1">Panorámica</option>
                                  <option value="2">Interproximal</option>
                                  <option value="3">Periapical</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                                  <ChevronRight className="w-4 h-4 rotate-90" />
                                </div>
                              </div>
                              
                              {/* Preview Info debajo del Selector en desktop si hay archivo */}
                              {rad.file && (
                                <div className="hidden md:flex mt-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                  <FileImage className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                                  <div className="overflow-hidden">
                                     <p className="text-xs font-bold text-gray-700 truncate">{rad.file.name}</p>
                                     <p className="text-[10px] text-gray-500 font-medium">{formatFileSize(rad.file.size)}</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Dropzone o Preview (Derecha) */}
                            <div className="md:w-2/3">
                              <label className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 block">
                                Archivo <span className="text-red-500">*</span>
                              </label>
                              
                              {rad.tipo === '' ? (
                                /* Estado inicial cuando no se ha seleccionado tipo */
                                <div className="flex flex-col items-center justify-center w-full h-36 rounded-xl bg-gray-50 border border-gray-200 border-dashed text-center px-4">
                                  <p className="text-sm font-medium text-gray-500">Seleccione un tipo de rafiografía ...</p>
                                </div>
                              ) : rad.tipo !== '1' ? (
                                /* Estado "En Construcción" para otros tipos de radiografía */
                                <div className="flex flex-col items-center justify-center w-full h-36 rounded-xl bg-amber-50 border border-amber-200 border-dashed text-center px-4 group">
                                  <AlertCircle className="w-8 h-8 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                                  <p className="text-sm font-bold text-amber-700">Análisis no disponible</p>
                                  <p className="text-xs text-amber-600/80 mt-1 max-w-[250px]">
                                    Por el momento el análisis por IA solo está entrenado para formato Panorámica.
                                  </p>
                                </div>
                              ) : !rad.preview ? (
                                /* Zona de Drag & Drop */
                                <label 
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(rad.id, e)}
                                  className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-blue-50/50 hover:border-dentBlue-900/50 transition-colors cursor-pointer group"
                                >
                                  <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-dentBlue-900 mb-2 transition-colors" />
                                  <p className="text-sm font-medium text-gray-600"><span className="text-dentBlue-900 font-bold">Haga clic</span> para seleccionar</p>
                                  <p className="text-xs text-gray-400 mt-1">o arrastre y suelte su imagen aquí</p>
                                  <input 
                                    type="file" className="hidden" accept="image/*"
                                    onChange={(e) => handleFileChange(rad.id, e)}
                                  />
                                </label>
                              ) : (
                                /* View de Imagen subida */
                                <div className="relative w-full h-36 bg-gray-900 rounded-xl overflow-hidden group">
                                  <img 
                                    src={rad.preview} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <label className="bg-white/90 backdrop-blur-sm text-dentBlue-900 px-4 py-2 rounded-lg text-sm font-bold shadow-sm cursor-pointer hover:bg-white transition-colors">
                                      Cambiar Imagen
                                      <input 
                                        type="file" className="hidden" accept="image/*"
                                        onChange={(e) => handleFileChange(rad.id, e)}
                                      />
                                    </label>
                                  </div>
                                </div>
                              )}
                              
                              {/* Preview Info en mobile */}
                              {rad.file && (
                                <div className="flex md:hidden mt-3 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                  <FileImage className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                                  <div className="overflow-hidden">
                                     <p className="text-xs font-bold text-gray-700 truncate">{rad.file.name}</p>
                                     <p className="text-[10px] text-gray-500 font-medium">{formatFileSize(rad.file.size)}</p>
                                  </div>
                                </div>
                              )}

                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Botón Agregar Radiografía Adicional */}
                      <button
                        onClick={addRadiografiaRow}
                        className="w-full py-4 border-2 border-dashed border-dentGreen-300 text-dentGreen-600 hover:bg-dentGreen-50 rounded-xl flex items-center justify-center text-sm font-bold transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar radiografía adicional
                      </button>

                    </div>
                  </div>
                </div>
              )}

              {/* Paso 4: Detección IA */}
              {currentStep === 4 && (
                <div className="p-8 md:p-12 animate-fade-in-up h-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
                  
                  {/* Left Column: Acción principal */}
                  <div className="bg-white/80 p-10 rounded-3xl border border-gray-100 shadow-xl max-w-lg w-full text-center relative overflow-hidden">
                    {/* Decoración sutil de fondo */}
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-dentGreen-50 rounded-full opacity-50 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-dentBlue-50 rounded-full opacity-50 blur-2xl"></div>

                    <div className="relative z-10">
                      <div className="w-24 h-24 bg-gradient-to-br from-dentGreen-50 to-white text-dentGreen-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-dentGreen-100/50">
                        <Sparkles className="w-12 h-12" />
                      </div>
                      
                      <h3 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-tight">
                        Asistente Diagnóstico
                      </h3>
                      
                      <p className="text-base text-gray-500 mb-8 leading-relaxed px-4">
                        Radiografías han sido procesadas con éxito. El modelo analizará cada radiografía.
                      </p>
                      
                      <button 
                        onClick={startAnalysis}
                        className="w-full flex items-center justify-center px-8 py-4 bg-gradient-to-r from-dentBlue-900 to-dentGreen-500 text-white rounded-2xl font-bold text-xl shadow-lg hover:shadow-xl hover:shadow-dentGreen-500/20 hover:-translate-y-1 transition-all duration-300"
                      >
                        <Play className="w-6 h-6 mr-3 fill-current" />
                        Iniciar Detección
                      </button>
                      
                      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-8 text-sm text-gray-400 font-medium">
                        <div className="flex items-center"><ScanLine className="w-4 h-4 mr-2 text-dentBlue-900/50"/> Análisis Radiografía</div>
                        <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-dentGreen-500/50"/> Alta Precisión</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Previsualización tipo Lista (dentro de tarjeta) */}
                  {radiografias.some(r => r.preview) && (
                    <div className="bg-white/80 p-8 rounded-3xl border border-gray-100 shadow-xl w-full max-w-md flex flex-col max-h-[500px] relative overflow-hidden">
                      <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                        <h4 className="text-lg font-extrabold text-gray-800 tracking-tight flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-dentGreen-500 mr-3 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                          Cola de Procesamiento
                        </h4>
                      </div>
                      
                      <div className="overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pr-2 -mr-2 flex flex-col gap-4">
                        {radiografias.filter(r => r.preview).map((rad, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-2xl border border-gray-100 p-3 flex gap-4 items-center hover:bg-white hover:border-dentGreen-200 transition-all duration-300 shadow-sm group">
                            
                            {/* Imagen Miniatura */}
                            <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 cursor-pointer shadow-inner border border-gray-100"
                                 onClick={() => setPreviewModal({ isOpen: true, url: rad.preview })}>
                              <img 
                                src={rad.preview} 
                                alt={`Radiografía ${idx+1}`} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              />
                              <div className="absolute inset-0 bg-black/opacity-0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <ScanLine className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>

                            {/* Información del archivo */}
                            <div className="flex-1 min-w-0 flex items-center justify-between ml-1">
                              
                              {/* Tipo de Radiografía (Izquierda) */}
                              <div className="flex-shrink-0 flex items-center">
                                <span className="text-[10px] font-bold text-dentBlue-900 bg-dentBlue-50 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm border border-dentBlue-100">
                                  {rad.tipo === '1' ? 'PANORÁMICA' : (rad.tipo === '2' ? 'INTERPROXIMAL' : 'PERIAPICAL')}
                                </span>
                              </div>

                              {/* Metadatos (Derecha) */}
                              <div className="flex flex-col items-end text-right overflow-hidden ml-3">
                                <p className="text-sm font-bold text-gray-700 truncate w-full max-w-[120px]" title={rad.file?.name}>
                                  {rad.file?.name || `img_bd_${idx+1}.jpg`}
                                </p>
                                {rad.file && (
                                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                    {formatFileSize(rad.file.size)}
                                  </p>
                                )}
                              </div>

                            </div>

                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Paso 5: Resultados de IA */}
                {currentStep === 5 && (
                  <div className="p-8 md:p-12 animate-fade-in-up h-full flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle className="w-12 h-12 text-dentGreen-500" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-800 mb-4">Evaluación Finalizada</h2>
                    <p className="text-gray-500 max-w-lg mx-auto mb-8 text-lg">
                      El procesamiento de radiografías ha concluido. En el panel de resultados podrás ver el análisis completo asistido por Inteligencia Artificial y confirmar tus hallazgos.
                    </p>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-8 py-3 bg-dentBlue-900 text-white font-bold rounded-xl shadow-lg hover:bg-dentBlue-800 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                    >
                      Ir al Panel Principal <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

            {/* Bottom Actions (Botones de Atrás y Siguiente pegados abajo) */}
            <div className="px-8 py-5 bg-white border-t border-gray-100 flex items-center justify-between mt-auto">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1 || currentStep === 5 || isAnalyzing}
                className={`flex items-center px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
                  (currentStep === 1 || currentStep === 5 || isAnalyzing)
                    ? 'text-gray-400 cursor-not-allowed hidden'
                    : 'text-gray-600 hover:bg-gray-100 bg-gray-50 border border-gray-200 shadow-sm'
                }`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </button>

              <button
                onClick={handleNext}
                disabled={getIsNextDisabled() || isSubmitting || currentStep >= 4}
                className={`flex items-center justify-center px-8 py-3 rounded-lg font-bold text-sm shadow-md transition-all duration-300 ml-auto ${
                  (getIsNextDisabled() || isSubmitting || currentStep >= 4)
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none hidden'
                    : 'bg-dentBlue-900 hover:bg-dentBlue-800 text-white hover:shadow-lg'
                }`}
              >
                {/* Animaciones de boton en step 1 y create */}
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {(currentStep === 1 && formData.id_paciente) ? 'Guardando...' : (currentStep === 1 ? 'Registrando...' : 'Guardando...')}
                  </>
                ) : (
                  <>
                    {currentStep === 4 ? 'Finalizar Evaluación' : (
                      (patientMode === 'create' && currentStep === 1)
                        ? (formData.id_paciente ? 'Guardar y Continuar' : 'Registrar y Continuar')
                        : (currentStep === 2 ? 'Guardar y Continuar' : 'Continuar')
                    )} <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación de Radiografía */}
      {modalEliminarImg.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setModalEliminarImg({ isOpen: false, idToRemove: null })}></div>
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden transform transition-all scale-100 opacity-100 p-6 animate-fade-in-up">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <button 
                onClick={() => setModalEliminarImg({ isOpen: false, idToRemove: null })}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Eliminar radiografía</h3>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              La radiografía seleccionada ya contiene una imagen cargada. ¿Está seguro que desea eliminar este registro?
            </p>
            
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setModalEliminarImg({ isOpen: false, idToRemove: null })}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => executeRemoveRadiografia(modalEliminarImg.idToRemove)}
                className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-md shadow-red-600/20 transition-all flex items-center justify-center"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Modal para Previsualizar Imagen Pantalla Completa */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Fondo oscuro con efecto borroso */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity cursor-pointer" 
            onClick={() => setPreviewModal({ isOpen: false, url: null })}
          ></div>
          
          {/* Contenedor de la Imagen */}
          <div className="relative z-10 w-full max-w-5xl max-h-[90vh] flex flex-col items-center justify-center animate-fade-in-up">
            
            {/* Botón de cerrar */}
            <button 
              onClick={() => setPreviewModal({ isOpen: false, url: null })}
              className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 backdrop-blur-sm transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Imagen Responsiva */}
            <img 
              src={previewModal.url} 
              alt="Previsualización Ampliada" 
              className="w-auto h-auto max-h-[85vh] rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] object-contain border border-white/10"
            />
          </div>
        </div>
      )}

      {/* Modal de Análisis / Detección IA */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"></div>
          
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden transform transition-all scale-100 opacity-100 flex flex-col max-h-[90vh]">
            {/* Header del Modal */}
            <div className="p-8 border-b border-gray-100 bg-gradient-to-b from-blue-50/50 to-white flex flex-col items-center text-center">
              
{/* Animación del Diente Escaneado o Check de Completado */}
                <div className="relative w-20 h-20 mb-4 mx-auto flex items-center justify-center">
                  {analysisItems.length > 0 && analysisItems.every(i => i.status === 'completed') ? (
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500 shadow-inner">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                  ) : (
                    <>
                      <img
                        src={dienteImg}
                        alt="Diente Escaneado"
                        className="w-14 h-14 object-contain drop-shadow-md opacity-90 z-0"
                      />
                      {/* Scanner line animada */}
                      <div className="absolute left-[-10%] right-[-10%] h-[3px] bg-sky-400 shadow-[0_0_10px_3px_rgba(56,189,248,0.7)] animate-scan-line z-10"></div>
                    </>
                  )}
                </div>

                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  {analysisItems.length > 0 && analysisItems.every(i => i.status === 'completed') 
                    ? "Procesamiento Completado" 
                    : "Procesando Radiografías"}
                </h2>
                <p className="text-gray-500 mt-2 font-medium">
                  {analysisItems.length > 0 && analysisItems.every(i => i.status === 'completed') 
                    ? "Radiografías analizadas correctamente" 
                    : "Analizando estructura dental ..."}
                </p>
              </div>

              {/* Listado de Radiografías en proceso */}
              <div className="p-8 overflow-y-auto bg-gray-50/30 flex-1">
                <div className="space-y-4">
                  {analysisItems.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center gap-4 transition-all duration-300">
                      
                      {/* Identificador */}
                      <div className="flex items-center gap-3 md:w-1/3">
                        <div className={`p-2.5 rounded-xl ${
                          item.status === 'completed' ? 'bg-green-50 text-dentGreen-500' :
                          item.status === 'analyzing' ? 'bg-blue-50 text-dentBlue-900' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <FileImage className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-gray-800 truncate" title={item.file?.name || item.nombre_archivo}>
                            {item.file?.name || item.nombre_archivo || `Radiografía ${idx+1}`}
                          </p>
                        </div>
                      </div>

                    {/* Estado & Barra Progreso */}
                    <div className="flex-1 px-1">
                      <div className="flex justify-between items-center mb-2">
                        
                        {/* Status Label */}
                        <div className="flex items-center text-xs font-bold uppercase tracking-wider">
                          {item.status === 'waiting' && <><Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" /><span className="text-gray-400">En cola</span></>}
                          {item.status === 'analyzing' && <><Cog className="w-3.5 h-3.5 mr-1.5 text-sky-500 animate-spin-slow" /><span className="text-sky-600">Analizando</span></>}
                          {item.status === 'completed' && <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-dentGreen-500" /><span className="text-dentGreen-600">Completado</span></>}
                        </div>
                        
                        {/* Progress */}
                        {item.status === 'analyzing' && (
                          <span className="text-xs font-bold text-gray-500">{item.progress}%</span>
                        )}
                        {item.status === 'completed' && (
                          <span className="text-xs font-bold text-dentGreen-500">100%</span>
                        )}
                      </div>

                      {/* Bar Fill */}
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            item.status === 'completed' ? 'bg-dentGreen-500' : 'bg-gradient-to-r from-dentBlue-900 to-sky-400'
                          }`}
                          style={{ width: `${item.status === 'waiting' ? 0 : item.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Status Cronometro / Botón de Acción */}
            <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between">
              
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tiempo transcurrido</span>
                <span className="text-xl font-black text-gray-800 tabular-nums">
                  00:{analysisTime.toString().padStart(2, '0')}
                </span>
              </div>
              
              {analysisItems.length > 0 && analysisItems.every(i => i.status === 'completed') ? (
                <button
                  onClick={async () => {
                    try {
                      await fetch(`http://localhost:5000/api/evaluaciones/${evaluacionId}/completar`, {
                        method: 'PUT'
                      });
                    } catch(e) {
                      console.error("Error al completar evaluación", e);
                    }
                    setIsAnalyzing(false);
                    setCurrentStep(5);
                  }}
                  className="flex items-center justify-center px-8 py-3 rounded-lg font-bold text-sm shadow-md transition-all duration-300 ml-auto bg-dentBlue-900 hover:bg-dentBlue-800 text-white hover:shadow-lg animate-fade-in-up"
                >
                  Ver resultados
                </button>
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                  <Cog className="w-5 h-5 text-gray-400 animate-spin-slow" />
                </div>
              )}
              
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default EvaluacionClinica;