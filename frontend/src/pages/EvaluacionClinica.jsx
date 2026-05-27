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
  Info,
  Play,
  Bot,
  Clock,
  ScanLine,
  CheckCircle2,
  Cog,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertCircle,
  AlertTriangle,
  MousePointer2,
  Activity,
  Sparkles
} from 'lucide-react';
import BoundingBoxViewer from '../components/BoundingBoxViewer';
import bgDashboard from '../assets/fondo_dashboard_2.png';
import dienteImg from '../assets/diente.png';
import ModalConfirmacion from '../components/ModalConfirmacion';
import ModalFinalizacion from '../components/ModalFinalizacion';

const EvaluacionClinica = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isResuming, setIsResuming] = useState(!!location.state?.resume);
  // Extraer estado inicial de sessionStorage si existe
  const getInitialState = (key, defaultVal) => {
    // Si viene con forceNew = true desde el dashboard, no recuperamos sesión y reiniciamos
    if (location.state?.forceNew) {
      return defaultVal;
    }

    // Prevenir fuga de estado: Si entramos a reanudar un paciente DISTINTO al que está en memoria, ignoramos cache
    if (location.state?.resume && location.state?.paciente_preseleccionado) {
      const savedPatientStr = sessionStorage.getItem('eval_selectedPatient');
      if (savedPatientStr) {
        try {
          const savedPatient = JSON.parse(savedPatientStr);
          if (savedPatient && String(savedPatient.id_paciente) !== String(location.state.paciente_preseleccionado.id_paciente)) {
            return defaultVal; // Borrón y cuenta nueva para este render inicial
          }
        } catch(e) {}
      }
    }
    
    const saved = sessionStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultVal;
      }
    }
    return defaultVal;
  };

  const [currentStep, setCurrentStep] = useState(() => getInitialState('eval_currentStep', 1));
  const [patientMode, setPatientMode] = useState(() => getInitialState('eval_patientMode', 'search'));
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [evaluacionId, setEvaluacionId] = useState(() => getInitialState('eval_evaluacionId', null));
  const [selectedPatient, setSelectedPatient] = useState(() => getInitialState('eval_selectedPatient', null));

  // Estado para el formulario de nuevo paciente
  const [formData, setFormData] = useState(() => getInitialState('eval_formData', {
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
  }));  
  // Estado para errores de validacion
  const [formErrors, setFormErrors] = useState({});

  // Estado para el Contexto Clínico (Paso 2)
  const [contextoClinico, setContextoClinico] = useState(() => getInitialState('eval_contextoClinico', {
    tipo_visita: 'Primera vez',
    motivo_consulta: '',
    observaciones: ''
  }));

  const [isAnalyzing, setIsAnalyzing] = useState(() => getInitialState('eval_isAnalyzing', false));
  const [analysisItems, setAnalysisItems] = useState(() => getInitialState('eval_analysisItems', []));
  const [analysisTime, setAnalysisTime] = useState(() => getInitialState('eval_analysisTime', 0));
  const [analysisResultsReady, setAnalysisResultsReady] = useState(false);

  // --- Estado para el Paso 5: Resultados ---
  const [activeResultIndex, setActiveResultIndex] = useState(() => getInitialState('eval_activeResultIndex', 0));
  const [hoveredBox, setHoveredBox] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragStartRef = useRef(null);
  const [selectedHallazgoId, setSelectedHallazgoId] = useState(null);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [modalInvalidImage, setModalInvalidImage] = useState({ isOpen: false, message: '' });
  const [finalDiagnosis, setFinalDiagnosis] = useState(() => getInitialState('eval_finalDiagnosis', ''));
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishProgress, setFinishProgress] = useState(0);
  const [detalleResultados, setDetalleResultados] = useState({ radiografias: [], detecciones: [] });

  const isUsablePreviewSrc = (src) => Boolean(src && !src.startsWith('blob:'));
  const createEmptyRadiografia = () => ({ id: Date.now(), file: null, preview: null, previewPersisted: null, tipo: '1' });
  const getRadiografiaPreviewSrc = (rad) => {
    if (!rad) return '';
    const previewSrc = isUsablePreviewSrc(rad.previewPersisted) ? rad.previewPersisted : rad.preview;
    return isUsablePreviewSrc(previewSrc) ? previewSrc : '';
  };
  const hasRadiografiaPreview = (rad) => Boolean(getRadiografiaPreviewSrc(rad));
  const hasOnlyPanoramicRadiografias = () => radiografias.length > 0 && radiografias.every((rad) => rad.tipo === '1');
  const compactAnalysisItems = (items = []) => items.map((item, idx) => ({
    id: item.id ?? idx,
    id_bd: item.id_bd ?? null,
    id_radiografia: item.id_radiografia ?? null,
    nombre_archivo: item.nombre_archivo || item.nombreArchivo || item.file?.name || null,
    tipo: item.tipo || '1',
    status: item.status || 'waiting',
    progress: Number(item.progress ?? 0),
    startTime: item.startTime ?? null,
  }));

  const clearAnalysisPersistence = () => {
    sessionStorage.removeItem('eval_isAnalyzing');
    sessionStorage.removeItem('eval_analysisItems');
    sessionStorage.removeItem('eval_analysisTime');
    sessionStorage.removeItem('eval_activeResultIndex');
    sessionStorage.removeItem('eval_finalDiagnosis');

    if (evaluacionId) {
      const pausas = JSON.parse(localStorage.getItem('eval_pausas') || '{}');
      delete pausas[evaluacionId];
      try {
        localStorage.setItem('eval_pausas', JSON.stringify(pausas));
      } catch (error) {
        console.warn('No se pudo limpiar pausa de análisis (cuota excedida):', error);
      }
    }
  };

  // Efecto para guardar en sessionStorage y precaver pérdida de pausas en localStorage
  useEffect(() => {
    const compactItems = compactAnalysisItems(analysisItems);

    try {
      sessionStorage.setItem('eval_currentStep', JSON.stringify(currentStep));
      sessionStorage.setItem('eval_patientMode', JSON.stringify(patientMode));
      sessionStorage.setItem('eval_evaluacionId', JSON.stringify(evaluacionId));
      sessionStorage.setItem('eval_selectedPatient', JSON.stringify(selectedPatient));
      sessionStorage.setItem('eval_formData', JSON.stringify(formData));
      sessionStorage.setItem('eval_contextoClinico', JSON.stringify(contextoClinico));
      sessionStorage.setItem('eval_isAnalyzing', JSON.stringify(isAnalyzing));
      sessionStorage.setItem('eval_analysisItems', JSON.stringify(compactItems));
      sessionStorage.setItem('eval_analysisTime', JSON.stringify(analysisTime));
      sessionStorage.setItem('eval_activeResultIndex', JSON.stringify(activeResultIndex));
      sessionStorage.setItem('eval_finalDiagnosis', JSON.stringify(finalDiagnosis));
    } catch (error) {
      console.warn('No se pudo persistir estado en sessionStorage (cuota excedida):', error);
      try {
        sessionStorage.removeItem('eval_analysisItems');
      } catch (_) {}
    }

    // Si estamos en Fase 4 o superior, guardamos siempre la pausa en vivo
    // para evitar que se pierda si el usuario sale bruscamente o desmonta el componente
    if (evaluacionId && currentStep >= 4) {
      const pausas = JSON.parse(localStorage.getItem('eval_pausas') || '{}');
      pausas[evaluacionId] = {
        currentStep,
        isAnalyzing,
        analysisItems: compactItems,
        analysisTime,
        activeResultIndex,
        finalDiagnosis
      };
      try {
        localStorage.setItem('eval_pausas', JSON.stringify(pausas));
      } catch (error) {
        console.warn('No se pudo persistir pausa en localStorage (cuota excedida):', error);
      }
    }
  }, [currentStep, patientMode, evaluacionId, selectedPatient, formData, contextoClinico, isAnalyzing, analysisItems, analysisTime, activeResultIndex, finalDiagnosis]);

  // Limpiar estado al desmontar en un caso específico o cuando termine
  const clearSessionStorageState = (finishing = false) => {
    // Si tenemos una evaluación activa, podemos guardar su progreso (Fase 4 o 5) en localStorage como una "pausa"
    if (evaluacionId) {
      const pausas = JSON.parse(localStorage.getItem('eval_pausas') || '{}');
      if (finishing) {
        // Múltiples limpiezas
        delete pausas[evaluacionId];
      } else if (currentStep >= 4) {
        // Pausamos el AI State temporalmente
        pausas[evaluacionId] = {
          currentStep,
          isAnalyzing,
          analysisItems: compactAnalysisItems(analysisItems),
          analysisTime,
          activeResultIndex,
          finalDiagnosis
        };
      }
      try {
        localStorage.setItem('eval_pausas', JSON.stringify(pausas));
      } catch (error) {
        console.warn('No se pudo guardar pausa al limpiar estado (cuota excedida):', error);
      }
    }

    sessionStorage.removeItem('eval_currentStep');
    sessionStorage.removeItem('eval_patientMode');
    sessionStorage.removeItem('eval_evaluacionId');
    sessionStorage.removeItem('eval_selectedPatient');
    sessionStorage.removeItem('eval_formData');
    sessionStorage.removeItem('eval_contextoClinico');
    sessionStorage.removeItem('eval_radiografias');
    sessionStorage.removeItem('eval_isAnalyzing');
    sessionStorage.removeItem('eval_analysisItems');
    sessionStorage.removeItem('eval_analysisTime');
    sessionStorage.removeItem('eval_activeResultIndex');
    sessionStorage.removeItem('eval_finalDiagnosis');
  };

  const handleRestart = () => {
    setModalRestart(true);
  };

  const confirmRestart = () => {
    clearSessionStorageState();
    setCurrentStep(1);
    setPatientMode('search');
    setSelectedPatient(null);
    setEvaluacionId(null);
    setSearchQuery('');
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
    setContextoClinico({
      tipo_visita: 'Primera vez',
      motivo_consulta: '',
      observaciones: ''
    });
    setRadiografias([{ id: Date.now(), file: null, preview: null, tipo: '1' }]);
    setIsAnalyzing(false);
    setAnalysisItems([]);
    setAnalysisTime(0);
    setActiveResultIndex(0);
    setFinalDiagnosis('');
    setModalRestart(false);
  };

  const handleContextoChange = (e) => {
    const { name, value } = e.target;
    setContextoClinico(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- Estado para el Paso 3: Carga de Radiografías ---
  const [radiografias, setRadiografias] = useState(() => {
    const saved = getInitialState('eval_radiografias', null);
    if (saved) {
      // Necesito reconstruir los objects pero cuidando que el 'file' no es serializable.
      // Así que los files se perderán al hacer F5, tienen que volverlos a subir,
      // PERO pueden cargarse los de bd si existieran.
      return saved.map(r => ({
        ...r,
        file: null,
        preview: isUsablePreviewSrc(r.preview) ? r.preview : null,
        previewPersisted: isUsablePreviewSrc(r.previewPersisted) ? r.previewPersisted : (isUsablePreviewSrc(r.preview) ? r.preview : null)
      }));
    }
    return [createEmptyRadiografia()];
  });

  useEffect(() => {
    // Al guardar las radiografias, no guardamos el file porque da error de circular structure o no es serializable.
    const radsToSave = radiografias.map(r => ({
      ...r,
      file: null,
      preview: isUsablePreviewSrc(r.preview) ? r.preview : null,
      previewPersisted: isUsablePreviewSrc(r.previewPersisted) ? r.previewPersisted : (isUsablePreviewSrc(r.preview) ? r.preview : null)
    }));

    try {
      sessionStorage.setItem('eval_radiografias', JSON.stringify(radsToSave));
    } catch (error) {
      console.warn('No se pudo persistir eval_radiografias (cuota excedida), guardando versión liviana.', error);
      const lightweight = radiografias.map(r => ({
        ...r,
        file: null,
        preview: null,
        previewPersisted: null,
      }));
      try {
        sessionStorage.setItem('eval_radiografias', JSON.stringify(lightweight));
      } catch (_) {
        // Si incluso la versión liviana falla, evitamos romper la UI.
      }
    }
  }, [radiografias]);

  // Estado para el modal de eliminación de radiografía
  const [modalEliminarImg, setModalEliminarImg] = useState({ isOpen: false, idToRemove: null });

  // Estado para el modal de confirmación de nueva evaluación
  const [modalRestart, setModalRestart] = useState(false);

  // Estado para el modal de previsualización (pantalla completa dentro del sistema)
  const [previewModal, setPreviewModal] = useState({ isOpen: false, url: null });

  const obtenerDetalleResultados = async () => {
    if (!evaluacionId) return;

    try {
      const response = await fetch(`http://localhost:5000/api/evaluaciones/${evaluacionId}/detalle`);
      if (!response.ok) return;
      const data = await response.json();

      setDetalleResultados({
        radiografias: Array.isArray(data.radiografias) ? data.radiografias : [],
        detecciones: Array.isArray(data.detecciones_caries) ? data.detecciones_caries : []
      });
    } catch (error) {
      console.error('Error cargando detalle de resultados:', error);
    }
  };

  useEffect(() => {
    if (currentStep === 5 && evaluacionId) {
      obtenerDetalleResultados();
    }
  }, [currentStep, evaluacionId]);

  const radiografiasResultados = detalleResultados.radiografias.length > 0
    ? detalleResultados.radiografias
    : radiografias;
  const totalRadiografiasResultados = radiografiasResultados.length;
  const safeActiveResultIndex = totalRadiografiasResultados > 0
    ? Math.min(Math.max(activeResultIndex, 0), totalRadiografiasResultados - 1)
    : 0;
  const hasMultipleRadiografiasResultados = totalRadiografiasResultados > 1;

  useEffect(() => {
    if (totalRadiografiasResultados === 0) return;
    if (activeResultIndex < 0) {
      setActiveResultIndex(0);
      return;
    }
    if (activeResultIndex > totalRadiografiasResultados - 1) {
      setActiveResultIndex(totalRadiografiasResultados - 1);
    }
  }, [activeResultIndex, totalRadiografiasResultados]);

  const goToPrevRadiografia = () => {
    if (!hasMultipleRadiografiasResultados) return;
    setActiveResultIndex((prev) => (prev - 1 + totalRadiografiasResultados) % totalRadiografiasResultados);
  };

  const goToNextRadiografia = () => {
    if (!hasMultipleRadiografiasResultados) return;
    setActiveResultIndex((prev) => (prev + 1) % totalRadiografiasResultados);
  };

  const activeRadiografiaResultado = radiografiasResultados[safeActiveResultIndex] || null;
  const deteccionesActivas = activeRadiografiaResultado?.id_resultado
    ? detalleResultados.detecciones.filter(d => d.id_resultado === activeRadiografiaResultado.id_resultado)
    : [];

  useEffect(() => {
    if (deteccionesActivas.length === 0) {
      setSelectedHallazgoId(null);
      return;
    }

    setSelectedHallazgoId((currentSelectedId) => {
      const stillExists = deteccionesActivas.some((det) => (det.id_deteccion ?? null) === currentSelectedId);
      return stillExists ? currentSelectedId : deteccionesActivas[0].id_deteccion ?? null;
    });
  }, [deteccionesActivas]);

  const getResultadoSeverityLabel = (severidad) => {
    if (severidad === 'avanzada') return 'Caries Periapical (Avanzada)';
    if (severidad === 'moderada') return 'Caries Profunda';
    return 'Caries Incipiente';
  };

  const getResultadoSeverityClass = (severidad) => {
    if (severidad === 'avanzada') return 'text-red-700 bg-red-50 border-red-100';
    if (severidad === 'moderada') return 'text-orange-800 bg-orange-50 border-orange-100';
    return 'text-amber-800 bg-amber-50 border-amber-100';
  };

  const getRadiografiaSrc = (rad) => {
    if (!rad) return '';
    const previewSrc = getRadiografiaPreviewSrc(rad);
    if (previewSrc) return previewSrc;
    if (rad.ruta_archivo) return `http://localhost:5000/${rad.ruta_archivo}`;
    return '';
  };
  
  const resetRadiografiaView = () => {
    setZoomLevel(1);
    setImagePan({ x: 0, y: 0 });
    setIsDraggingImage(false);
    dragStartRef.current = null;
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoomLevel(prev => {
    const next = Math.max(prev - 0.5, 1);
    if (next === 1) {
      setImagePan({ x: 0, y: 0 });
    }
    return next;
  });
  const handleZoomReset = resetRadiografiaView;

  const showInvalidImageModal = (message) => {
    setModalInvalidImage({
      isOpen: true,
      message: message || 'La imagen subida no es una radiografía. Suba nuevamente.'
    });
  };

  const handleImageWheel = (event) => {
    event.preventDefault();
    const direction = event.deltaY < 0 ? 0.15 : -0.15;

    setZoomLevel((prev) => {
      const next = Math.min(Math.max(prev + direction, 1), 3);
      if (next === 1) {
        setImagePan({ x: 0, y: 0 });
      }
      return Number(next.toFixed(2));
    });
  };

  const handleImagePointerDown = (event) => {
    if (zoomLevel <= 1 || event.button !== 0) {
      return;
    }

    if (event.target.closest('button')) {
      return;
    }

    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: imagePan.x,
      panY: imagePan.y,
    };
    setIsDraggingImage(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleImagePointerMove = (event) => {
    if (!isDraggingImage || !dragStartRef.current) {
      return;
    }

    setImagePan({
      x: dragStartRef.current.panX + (event.clientX - dragStartRef.current.x),
      y: dragStartRef.current.panY + (event.clientY - dragStartRef.current.y),
    });
  };

  const stopImageDragging = (event) => {
    if (event?.currentTarget?.releasePointerCapture && event.pointerId !== undefined) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDraggingImage(false);
    dragStartRef.current = null;
  };

  const startAnalysis = async () => {
    if (!evaluacionId) {
      return;
    }

    if (!radiografias.length) {
      return;
    }

    const items = radiografias.map((rad, index) => ({
      id: rad.id ?? index,
      id_bd: rad.id_bd ?? null,
      id_radiografia: rad.id_radiografia ?? null,
      nombre_archivo: rad.file?.name || rad.nombreArchivo || rad.nombre_archivo || null,
      tipo: rad.tipo || '1',
      status: index === 0 ? 'analyzing' : 'waiting',
      progress: index === 0 ? 1 : 0,
      startTime: index === 0 ? Date.now() : null
    }));

    setAnalysisItems(items);
    setAnalysisTime(0);
    setIsAnalyzing(true);
    setAnalysisResultsReady(false);

    const MIN_ANALYSIS_DELAY = 4000;
    const MAX_ANALYSIS_DELAY = 6000;
    const analysisDelay = Math.floor(Math.random() * (MAX_ANALYSIS_DELAY - MIN_ANALYSIS_DELAY + 1)) + MIN_ANALYSIS_DELAY;

    const waitForMinimumDelay = new Promise((resolve) => {
      setTimeout(resolve, analysisDelay);
    });

    let stopAnimation = false;

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const animateItemProgress = (itemIndex, durationMs = 4200, tickMs = 80) => new Promise((resolve) => {
      const animationStart = Date.now();
      const targetProgress = 98;

      const timer = setInterval(() => {
        if (stopAnimation) {
          clearInterval(timer);
          resolve();
          return;
        }

        const elapsed = Date.now() - animationStart;
        const ratio = Math.min(elapsed / durationMs, 1);
        const nextProgress = Math.max(1, Math.floor(ratio * targetProgress));

        setAnalysisItems((prev) => prev.map((item, idx) => (
          idx === itemIndex
            ? { ...item, status: 'analyzing', progress: nextProgress }
            : item
        )));

        if (ratio >= 1) {
          clearInterval(timer);
          resolve();
        }
      }, tickMs);
    });

    const runVisualQueue = async () => {
      for (let idx = 0; idx < items.length; idx++) {
        if (stopAnimation) {
          return;
        }

        setAnalysisItems(prev => prev.map((item, itemIdx) => {
          if (itemIdx < idx) return { ...item, status: 'completed', progress: 100 };
          if (itemIdx === idx) return { ...item, status: 'analyzing', progress: Math.max(1, Number(item.progress || 0)), startTime: Date.now() };
          return { ...item, status: 'waiting', progress: 0 };
        }));

        await animateItemProgress(idx, 4200, 80);

        if (stopAnimation) {
          return;
        }

        await sleep(200);
        setAnalysisItems(prev => prev.map((item, itemIdx) => (
          itemIdx === idx ? { ...item, status: 'completed', progress: 100 } : item
        )));
      }
    };

    const timeInterval = setInterval(() => {
      setAnalysisTime(prev => prev + 1);
    }, 1000);

    try {
      const visualQueuePromise = runVisualQueue();

      const responsePromise = fetch(`http://localhost:5000/api/evaluaciones/${evaluacionId}/procesar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await Promise.all([responsePromise, waitForMinimumDelay]).then(([res]) => res);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'No se pudo procesar la evaluación');
      }

      // Intentar leer la respuesta para detectar validaciones (por ejemplo: imagen no es radiografía)
      let resData = {};
      try {
        resData = await response.json();
      } catch (e) {
        resData = {};
      }

      // Comprobaciones defensivas: distintos backends pueden devolver keys diferentes.
      const invalidFlag = (
        resData.validation === false ||
        resData.validacion === false ||
        resData.valid === false ||
        resData.is_radiograph === false ||
        resData.any_invalid_images === true ||
        resData.image_valid === false ||
        resData.status === 'invalid_image' ||
        resData.status === 'error'
      );

      // Si el backend agrupa resultados por radiografía, revisar cada resultado anidado
      if (!invalidFlag && Array.isArray(resData.resultados)) {
        for (const r of resData.resultados) {
          const inner = r?.resultado || r?.result || r;
          if (!inner) continue;
          if (inner.status === 'invalid_image' || inner.status === 'error' || inner.valid === false) {
            stopAnimation = true;
            clearAnalysisPersistence();
            setAnalysisResultsReady(false);
            setCurrentStep(4);
            setAnalysisItems([]);
            showInvalidImageModal('La imagen subida no es una radiografía. Suba nuevamente.');
            setIsAnalyzing(false);
            return;
          }
        }
      }

      if (invalidFlag) {
        // No avanzar a resultados; informar al usuario y resetear estado de análisis
        stopAnimation = true;
        clearAnalysisPersistence();
        setAnalysisResultsReady(false);
        setCurrentStep(4);
        setAnalysisItems([]);
        showInvalidImageModal('La imagen subida no es una radiografía. Suba nuevamente.');
        setIsAnalyzing(false);
        return;
      }

      await visualQueuePromise;
      setAnalysisResultsReady(true);
    } catch (error) {
      stopAnimation = true;
      setAnalysisResultsReady(false);
      console.error('Error al procesar radiografías:', error);
      setAnalysisItems(prev => prev.map(item => ({
        ...item,
        status: 'waiting',
        progress: 0
      })));
      setIsAnalyzing(false);
    } finally {
      clearInterval(timeInterval);
    }
  };

  const addRadiografiaRow = () => {
    setRadiografias([
      ...radiografias,
      createEmptyRadiografia()
    ]);
  };

  const removeRadiografiaRow = (idToRemove) => {
    const rad = radiografias.find(r => r.id === idToRemove);
    if (rad && (rad.file || hasRadiografiaPreview(rad))) {
      setModalEliminarImg({ isOpen: true, idToRemove });
    } else {
      executeRemoveRadiografia(idToRemove);
    }
  };

  const executeRemoveRadiografia = (idToRemove) => {
    if (radiografias.length === 1) {
      setRadiografias([createEmptyRadiografia()]);
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

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const fileToCompressedDataUrl = async (file, maxSide = 900, quality = 0.65) => {
    const originalDataUrl = await fileToDataUrl(file);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (!width || !height) {
          resolve(originalDataUrl);
          return;
        }

        const scale = Math.min(1, maxSide / Math.max(width, height));
        const targetW = Math.max(1, Math.round(width * scale));
        const targetH = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(originalDataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);

        // Guardamos una miniatura JPEG para reducir drásticamente el tamaño en sessionStorage.
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed || originalDataUrl);
      };
      img.onerror = () => resolve(originalDataUrl);
      img.src = originalDataUrl;
    });
  };

  const handleFileChange = async (id, e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      let previewPersisted = '';
      try {
        previewPersisted = await fileToCompressedDataUrl(file);
      } catch (error) {
        previewPersisted = previewUrl;
      }
      setRadiografias(prev => prev.map(rad => 
        rad.id === id ? { ...rad, file, preview: previewUrl, previewPersisted } : rad
      ));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      let previewPersisted = '';
      try {
        previewPersisted = await fileToCompressedDataUrl(file);
      } catch (error) {
        previewPersisted = previewUrl;
      }
      setRadiografias(prev => prev.map(rad => 
        rad.id === id ? { ...rad, file, preview: previewUrl, previewPersisted } : rad
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
  // selectedPatient se subió arriba para usar getInitialState

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

  const isStep3Locked = currentStep === 3 && isSubmitting;

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
      if (!hasOnlyPanoramicRadiografias()) {
        return;
      }

      setIsSubmitting(true);
      try {
        const formDataPayload = new FormData();
        
        for (let index = 0; index < radiografias.length; index++) {
          const rad = radiografias[index];
          let fileToUpload = rad.file;

          // Intentar recuperar el archivo desde el blob URL si se perdió por navegar entre vistas (sin F5)
          const previewSrc = getRadiografiaPreviewSrc(rad);
          if (!fileToUpload && !rad.id_bd && previewSrc) {
            try {
              const resBlob = await fetch(previewSrc);
              const blobData = await resBlob.blob();
              fileToUpload = new File([blobData], `imagen_recuperada_${index}.jpg`, { type: blobData.type || 'image/jpeg' });
            } catch (err) {
              console.warn("No se pudo recuperar la imagen local", err);
              alert("Una de las imágenes no se pudo procesar. Por favor, vuelva a seleccionarla.");
              setIsSubmitting(false);
              return; // Cancelar ejecución
            }
          }

          if (fileToUpload) {
            formDataPayload.append(`file_${index}`, fileToUpload);
            formDataPayload.append(`tipo_${index}`, rad.tipo);
            formDataPayload.append(`local_id_${index}`, rad.id);
            if (rad.id_bd) {
              formDataPayload.append(`idbd_${index}`, rad.id_bd);
            }
          } else if (rad.id_bd) {
            // Indicar al backend que esta imagen existe y no ha sido modificada, para que no la borre
            formDataPayload.append('keep_idbd', rad.id_bd);
          }
        }

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
      if (currentStep < 5) setCurrentStep(currentStep + 1);
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
      if (!hasOnlyPanoramicRadiografias()) return true;
      const isAnyIncomplete = radiografias.some(rad => (!rad.file && !rad.id_bd && !hasRadiografiaPreview(rad)) || !rad.tipo);
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
    } else if (location.state?.forceNew) {
      clearSessionStorageState();
      
      // Si nos pasan un paciente desde la vista de pacientes, lo preseleccionamos
      if (location.state?.paciente_preseleccionado) {
        const preselect = async () => {
          setIsResuming(true); // Reusamos el estado de loading
          try {
            await handleSelectPatient(location.state.paciente_preseleccionado);
          } catch (e) {
            console.error("Error preseleccionando paciente", e);
          } finally {
            setIsResuming(false);
          }
        };
        preselect();
      }
      
      // Limpiamos el state para que si se recarga la página, funcione normal
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const handleSelectPatient = async (paciente) => {
    // 1. Verificar si el paciente a evaluar es el mismo que teníamos en sesión
    const savedPatientStr = sessionStorage.getItem('eval_selectedPatient');
    let isSamePatient = false;
    let savedStep = 1;
    if (savedPatientStr) {
      try {
        const savedPatient = JSON.parse(savedPatientStr);
        if (savedPatient && String(savedPatient.id_paciente) === String(paciente.id_paciente)) {
          isSamePatient = true;
          savedStep = parseInt(JSON.parse(sessionStorage.getItem('eval_currentStep'))) || 1;
        }
      } catch(e) { }
    }

    // 2. Si es un paciente DUAL limpiar toda su variable local, caso contrario mantenemos
    if (!isSamePatient || location.state?.forceNew) {
      clearSessionStorageState();
      setActiveResultIndex(0);
      setIsAnalyzing(false);
      setAnalysisItems([]);
      setFinalDiagnosis('');
      setAnalysisTime(0);
      setZoomLevel(1);
      // Faltaba resetear step temporalmente antes que el fecth lo cambie, previniendo glitch visual a step 5
      setCurrentStep(1); 
    }
    
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
        
        // Si la evaluación pendiente ya tiene radiografías, las cargamos
        if (evalPendiente.radiografias && evalPendiente.radiografias.length > 0) {
          const loadedRads = evalPendiente.radiografias.map(rad => ({
            id: rad.id_radiografia.toString(),
            id_bd: rad.id_radiografia,
            file: null, // Ya está en servidor, no hay File objeto
            preview: `http://localhost:5000/${rad.ruta_archivo}`,
            tipo: rad.id_tipo.toString()
          }));
          setRadiografias(loadedRads);
          setSuccessMessage('Diagnóstico pendiente recuperado. Revise los datos y continúe.');
          setIsSuccess(true);
          
          // VERIFICAMOS SI TENIA ESTADO PAUSADO EN LOCALSTORAGE (Fase 4 o 5)
          const pausas = JSON.parse(localStorage.getItem('eval_pausas') || '{}');
          const pausaActiva = pausas[evalPendiente.id_evaluacion];

          if (pausaActiva && pausaActiva.currentStep >= 4) {
            setCurrentStep(pausaActiva.currentStep);
            setIsAnalyzing(pausaActiva.isAnalyzing || false);
            setAnalysisItems(pausaActiva.analysisItems || []);
            setAnalysisTime(pausaActiva.analysisTime || 0);
            setActiveResultIndex(pausaActiva.activeResultIndex || 0);
            setFinalDiagnosis(pausaActiva.finalDiagnosis || '');
          } else {
            // Si recordamos el mismo paciente, respetamos el step guardado asumiendo que avanzó más
            if (isSamePatient && savedStep > 3) {
              setCurrentStep(savedStep);
            } else {
              setCurrentStep(4); // Saltar al paso 4 (Detección IA) base
            }
          }
        } else {
          setRadiografias([createEmptyRadiografia()]); // Limpiar si no hay guardadas
          setSuccessMessage('Diagnóstico pendiente recuperado. Revise los datos y continúe.');
          setIsSuccess(true);
          if (isSamePatient && savedStep >= 3) {
             setCurrentStep(savedStep);
          } else {
             setCurrentStep(3); // Saltar al paso 3 (Carga de Radiografías)
          }
        }
        
        setTimeout(() => setIsSuccess(false), 4000);
      } else {
        // No hay pendiente (404), limpiar evaluación por si había alguna en estado
        setEvaluacionId(null);
        setRadiografias([createEmptyRadiografia()]);
        setContextoClinico({
          tipo_visita: 'Primera vez',
          motivo_consulta: '',
          observaciones: ''
        });
        
        // Si devolvemos el mismo pacience pero no hay eval, tal vez era create state
        if (isSamePatient && savedStep >= 2) {
          setCurrentStep(savedStep);
        } else {
          setCurrentStep(1); // Mantenemos en la fase 1 para que el usuario presione "Continuar"
        }
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
          <h2 className="text-xl font-bold text-dentBlue-900">Retomando Diagnóstico...</h2>
          <p className="text-sm text-gray-500 mt-2">Cargando datos del paciente y restaurando el progreso</p>
        </div>
      )}

      {/* Modal Reanudar o Nuevo Diagnóstico reusable */}
      <ModalConfirmacion
        isOpen={modalRestart}
        onClose={() => setModalRestart(false)}
        onConfirm={confirmRestart}
        title="Iniciar nuevo diagnóstico"
        message="El diagnóstico actual quedará en pausa y podrás retomarlo más adelante. ¿Deseas iniciar un nuevo diagnóstico en blanco?"
        confirmText="Sí, iniciar nueva"
        cancelText="Cancelar"
        icon={Info}
        colorTheme="blue"
      />

      <ModalConfirmacion
        isOpen={modalInvalidImage.isOpen}
        onClose={() => setModalInvalidImage({ isOpen: false, message: '' })}
        onConfirm={() => setModalInvalidImage({ isOpen: false, message: '' })}
        title="Imagen no válida"
        message={modalInvalidImage.message}
        confirmText="Cerrar"
        hideCancelButton={true}
        icon={AlertTriangle}
        colorTheme="red"
      />

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
      <header className="px-8 py-6 bg-white/90 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between shrink-0 z-10 sticky top-0">
        <div>
          <h1 className="text-2xl font-bold text-dentBlue-900 tracking-tight flex items-center">
            <Stethoscope className="w-8 h-8 mr-3 text-dentGreen-500" />
            Nuevo Diagnóstico Clínico
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Crea y registra un nuevo diagnóstico clínico asistido con inteligencia artificial.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Info del Paciente seleccionado */}
          {selectedPatient && currentStep > 1 && (
            <div className="hidden md:flex flex-col items-end border-r border-gray-200 pr-5 py-1">
              <span className="text-sm font-extrabold text-dentBlue-900">
                {selectedPatient.nombres} {selectedPatient.apellidos}
              </span>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 mt-1">
                DNI: {selectedPatient.dni || 'Sin registrar'}
              </span>
            </div>
          )}

          {/* Botón para forzar una nueva evaluación y descartar el estado guardado */}
          {(currentStep > 1 || selectedPatient) && (
            <button 
              onClick={handleRestart}
              className="flex items-center px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-dentBlue-900 hover:border-dentBlue-900/30 transition-all font-bold shadow-sm text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Diagnóstico
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div 
        className="flex-1 overflow-auto p-8 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url(${bgDashboard})` }}
      >
        <div className={currentStep === 5 ? 'w-full max-w-[98%] 2xl:max-w-[1600px] mx-auto' : 'max-w-[90%] 2xl:max-w-7xl mx-auto'}>
          
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
                    <p className="text-sm text-gray-500 mt-1">Busque un paciente existente o registre uno nuevo para comenzar el diagnóstico.</p>
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
                            <p className="text-gray-500 font-medium text-sm max-w-sm mx-auto">Utilice el buscador superior para seleccionar un paciente previamente registrado.</p>
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
                                  sessionStorage.removeItem('eval_radiografias');
                                  setRadiografias([createEmptyRadiografia()]);
                                  setIsAnalyzing(false);
                                  setAnalysisItems([]);
                                  setAnalysisTime(0);
                                  setActiveResultIndex(0);
                                  setFinalDiagnosis('');
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
                <div className="animate-fade-in-up relative">
                  {isStep3Locked && (
                    <div className="absolute inset-0 z-20 rounded-2xl bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm border border-gray-200 text-sm font-bold text-dentBlue-900">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando radiografías...
                      </div>
                    </div>
                  )}
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-dentBlue-900 flex items-center">
                      <Stethoscope className="w-5 h-5 mr-2 text-dentGreen-500" /> 
                      Carga de Radiografías
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Seleccione y suba las imágenes radiográficas necesarias para que la Inteligencia Artificial analice las lesiones.</p>
                  </div>
                  
                  <div className={`p-8 px-4 md:px-12 lg:px-16 ${isStep3Locked ? 'pointer-events-none select-none opacity-70' : ''}`} aria-busy={isStep3Locked}>
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
                                  disabled={isStep3Locked}
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
                              ) : !hasRadiografiaPreview(rad) ? (
                                /* Zona de Drag & Drop */
                                <label 
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(rad.id, e)}
                                  className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 transition-colors group ${isStep3Locked ? 'cursor-not-allowed' : 'hover:bg-blue-50/50 hover:border-dentBlue-900/50 cursor-pointer'}`}
                                >
                                  <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-dentBlue-900 mb-2 transition-colors" />
                                  <p className="text-sm font-medium text-gray-600"><span className="text-dentBlue-900 font-bold">Haga clic</span> para seleccionar</p>
                                  <p className="text-xs text-gray-400 mt-1">o arrastre y suelte su imagen aquí</p>
                                  <input 
                                    type="file" className="hidden" accept="image/*"
                                    disabled={isStep3Locked}
                                    onChange={(e) => handleFileChange(rad.id, e)}
                                  />
                                </label>
                              ) : (
                                /* View de Imagen subida */
                                <div className="relative w-full h-36 bg-gray-900 rounded-xl overflow-hidden group">
                                  <img 
                                    src={getRadiografiaPreviewSrc(rad)} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <label className="bg-white/90 backdrop-blur-sm text-dentBlue-900 px-4 py-2 rounded-lg text-sm font-bold shadow-sm cursor-pointer hover:bg-white transition-colors">
                                      Cambiar Imagen
                                      <input 
                                        type="file" className="hidden" accept="image/*"
                                        disabled={isStep3Locked}
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
                        disabled={isStep3Locked}
                        className={`w-full py-4 border-2 border-dashed rounded-xl flex items-center justify-center text-sm font-bold transition-colors shadow-sm ${isStep3Locked ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50' : 'border-dentGreen-300 text-dentGreen-600 hover:bg-dentGreen-50'}`}
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
                  {radiografias.some(r => hasRadiografiaPreview(r)) && (
                    <div className="bg-white/80 p-8 rounded-3xl border border-gray-100 shadow-xl w-full max-w-md flex flex-col max-h-[500px] relative overflow-hidden">
                      <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                        <h4 className="text-lg font-extrabold text-gray-800 tracking-tight flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-dentGreen-500 mr-3 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                          Cola de Procesamiento
                        </h4>
                      </div>
                      
                      <div className="overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pr-2 -mr-2 flex flex-col gap-4">
                        {radiografias.filter(r => hasRadiografiaPreview(r)).map((rad, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-2xl border border-gray-100 p-3 flex gap-4 items-center hover:bg-white hover:border-dentGreen-200 transition-all duration-300 shadow-sm group">
                            
                            {/* Imagen Miniatura */}
                            <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 cursor-pointer shadow-inner border border-gray-100"
                                 onClick={() => setPreviewModal({ isOpen: true, url: getRadiografiaSrc(rad) })}>
                              <img 
                                src={getRadiografiaSrc(rad)} 
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
                <div className="flex flex-col h-full w-full animate-fade-in-up bg-gray-50">
                  {/* Contenedor Principal Dividido */}
                  <div className="grid flex-1 overflow-hidden min-h-[600px] gap-4 lg:gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(460px,1.05fr)]">
                    
                    {/* VISOR PRINCIPAL (Izquierda - 60%) */}
                    <div className="flex min-w-0 flex-col border-r border-gray-200 bg-black/5 relative">
                      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-10 shrink-0 gap-3">
                        <span className="text-xs font-bold bg-white text-dentBlue-900 border border-gray-200 px-3 py-1.5 rounded-lg flex items-center shadow-sm">
                          <Activity className="w-4 h-4 mr-2 text-dentBlue-900" />
                          Radiografía {safeActiveResultIndex + 1}
                        </span>

                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => setShowBoxes((value) => !value)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${showBoxes ? 'bg-dentBlue-900 text-white border-dentBlue-900' : 'bg-white text-gray-600 border-gray-200 hover:border-dentBlue-300'}`}
                          >
                            {showBoxes ? 'Ocultar cajas' : 'Mostrar cajas'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowLabels((value) => !value)}
                            disabled={!showBoxes}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                              !showBoxes
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : showLabels
                                  ? 'bg-dentGreen-600 text-white border-dentGreen-600'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-dentGreen-300'
                            }`}
                          >
                            {showLabels ? 'Ocultar etiquetas' : 'Mostrar etiquetas'}
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gray-900/5 px-2 py-3 pb-24 lg:px-3">
                        {hasMultipleRadiografiasResultados && (
                          <>
                            <button
                              type="button"
                              onClick={goToPrevRadiografia}
                              className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/90 text-dentBlue-900 shadow-lg backdrop-blur transition-all hover:bg-white hover:scale-105"
                              aria-label="Ver radiografía anterior"
                            >
                              <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                              type="button"
                              onClick={goToNextRadiografia}
                              className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/90 text-dentBlue-900 shadow-lg backdrop-blur transition-all hover:bg-white hover:scale-105"
                              aria-label="Ver radiografía siguiente"
                            >
                              <ChevronRight className="h-6 w-6" />
                            </button>
                          </>
                        )}

                        {activeRadiografiaResultado ? (
                          <BoundingBoxViewer
                            imageSrc={getRadiografiaSrc(activeRadiografiaResultado)}
                            alt="Radiografía Panorámica"
                            title="Radiografía Panorámica"
                            detections={deteccionesActivas}
                            selectedDetectionId={selectedHallazgoId}
                            onDetectionClick={(det) => setSelectedHallazgoId(det.id_deteccion ?? null)}
                            showBoxes={showBoxes}
                            showLabels={showLabels}
                          />
                        ) : (
                          <div className="w-full h-full min-h-[400px] bg-white/70 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100">
                            Sin imagen disponible
                          </div>
                        )}
                      </div>

                      {/* Thumbnail Carrusel (Inferior) */}
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-md border-t border-gray-200 flex items-center px-4 gap-4 overflow-x-auto shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                        {radiografiasResultados.map((rad, idx) => (
                          <div 
                            key={rad.id_radiografia || rad.id || idx}
                            onClick={() => {
                              setActiveResultIndex(idx);
                              setZoomLevel(1);
                              setImagePan({ x: 0, y: 0 });
                            }}
                            className={`relative cursor-pointer flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                              safeActiveResultIndex === idx 
                                ? 'border-dentBlue-900 ring-2 ring-dentBlue-900/25 shadow-[0_10px_25px_rgba(30,58,138,0.28)] scale-110 -translate-y-1 z-10' 
                                : 'border-gray-200 hover:border-gray-400 hover:scale-105'
                            }`}
                          >
                            <img src={getRadiografiaSrc(rad)} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                            {safeActiveResultIndex === idx && (
                              <>
                                <div className="absolute inset-0 bg-dentBlue-900/10 mix-blend-overlay"></div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PANEL DE HALLAZGOS (Derecha - 40%) */}
                    <div className="min-w-0 bg-white flex flex-col h-full border-l border-white">
                      
                      <div className="px-5 py-4 lg:px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
                        <div>
                          <h3 className="text-xl font-extrabold text-gray-800 tracking-tight flex items-center">
                            Resultados
                          </h3>
                          <p className="text-sm font-medium text-gray-500 mt-1">
                            Análisis automático de posibles lesiones.
                          </p>
                        </div>
                      </div>

                      {/* Lista de Tarjetas de Lesiones */}
                      <div className="flex-1 overflow-y-auto px-5 py-4 lg:px-6 bg-gray-50">
                        
                        {/* Resumen Header */}
                        <div className="flex items-center bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm mb-4">
                          <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0" />
                          <p className="text-sm font-bold text-amber-800">
                            Se detectaron {deteccionesActivas.length} posibles lesiones en esta radiografía.
                          </p>
                        </div>

                        {deteccionesActivas.length === 0 ? (
                          <div className="text-center py-10 col-span-2">
                            <CheckCircle2 className="w-12 h-12 text-dentGreen-400 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-bold text-gray-500">No se detectaron caries en esta imagen.</p>
                          </div>
                        ) : (
                          <div className="grid gap-4 lg:grid-cols-2">
                            {deteccionesActivas.map((det, idx) => {
                              const severityLabel = getResultadoSeverityLabel(det.severidad);
                              const severityClass = getResultadoSeverityClass(det.severidad);
                              const confidence = Math.round((Number(det.confianza) || 0) * 100);
                              const isOddLastCard = deteccionesActivas.length % 2 === 1 && idx === deteccionesActivas.length - 1;
                              const isSelected = selectedHallazgoId !== null && det.id_deteccion === selectedHallazgoId;

                              return (
                                <div 
                                  key={det.id_deteccion || idx}
                                  onClick={() => setSelectedHallazgoId(det.id_deteccion ?? null)}
                                  className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden cursor-pointer hover:border-gray-300 ${isOddLastCard ? 'lg:col-span-2' : ''} ${isSelected ? 'border-dentBlue-900 ring-2 ring-dentBlue-900/20 shadow-lg' : 'border-gray-200'}`}
                                >
                                <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                  <h4 className="text-sm font-extrabold text-dentBlue-900 flex items-center">
                                    <img src={dienteImg} alt="Diente" className="w-4 h-4 mr-2 opacity-70 grayscale" />
                                    {det.numero_diente ? `Diente ${det.numero_diente}` : `Hallazgo ${idx + 1}`}
                                  </h4>
                                  <span className={`text-[10px] font-bold border px-2 py-1 rounded-md uppercase tracking-wide ${severityClass}`}>
                                    {det.localizacion || severityLabel}
                                  </span>
                                </div>
                                
                                <div className="p-4 lg:p-3 xl:p-4 space-y-3">
                                  {/* Mostrar las 3 clases con porcentajes y destacar la mayor */}
                                  {(() => {
                                    // Preferir probabilidades reales si se entregan desde la BD
                                    const probs = det.class_probabilities || null;
                                    let classVals;

                                    if (probs && typeof probs === 'object') {
                                      // Convertir a porcentajes enteros
                                      let inc = Math.round((probs['Caries Incipiente'] || probs['Caries Incipiente'] === 0 ? Number(probs['Caries Incipiente']) : 0) * 100);
                                      let mod = Math.round((probs['Caries Profunda'] || probs['Caries Profunda'] === 0 ? Number(probs['Caries Profunda']) : 0) * 100);
                                      let adv = Math.round((probs['Caries Periapical (Avanzada)'] || probs['Caries Periapical (Avanzada)'] === 0 ? Number(probs['Caries Periapical (Avanzada)']) : 0) * 100);

                                      // Asegurar suma 100 (ajustar por redondeo)
                                      let total = inc + mod + adv;
                                      if (total !== 100) {
                                        const diff = 100 - total;
                                        // añadir la diferencia al mayor
                                        const maxKey = Math.max(inc, mod, adv);
                                        if (maxKey === inc) inc += diff;
                                        else if (maxKey === mod) mod += diff;
                                        else adv += diff;
                                      }

                                      classVals = { incipiente: inc, moderada: mod, avanzada: adv };
                                    } else {
                                      // Fallback a la simulación antigua si no hay probabilidades
                                      const mainConf = Math.round((Number(det.confianza) || 0) * 100);
                                      const rem = 100 - mainConf;
                                      const otherA = Math.round(rem / 2);
                                      const otherB = rem - otherA;

                                      classVals = {
                                        incipiente: det.severidad === 'incipiente' ? mainConf : otherA,
                                        moderada: det.severidad === 'moderada' ? mainConf : (det.severidad === 'incipiente' ? otherB : (det.severidad === 'avanzada' ? otherA : otherA)),
                                        avanzada: det.severidad === 'avanzada' ? mainConf : otherB
                                      };
                                    }

                                    const maxVal = Math.max(classVals.incipiente, classVals.moderada, classVals.avanzada);

                                    const rows = [
                                      { key: 'incipiente', label: 'Caries Incipiente', val: classVals.incipiente },
                                      { key: 'moderada', label: 'Caries Profunda', val: classVals.moderada },
                                      { key: 'avanzada', label: 'Caries Periapical (Avanzada)', val: classVals.avanzada }
                                    ];

                                    return (
                                      <div className="space-y-3">
                                        {rows.map((r) => (
                                          <div key={r.key} className={`flex items-center justify-between text-xs ${r.val === maxVal ? 'font-extrabold' : 'font-medium'}`}>
                                            <div className="w-1/2 text-sm text-gray-700">{r.label}</div>
                                            <div className="w-1/2 pl-3">
                                              <div className="flex items-center justify-between mb-1">
                                                <div className="flex-1 mr-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                  <div className={`h-2 rounded-full ${r.val === maxVal ? 'bg-dentBlue-900' : 'bg-gray-300'}`} style={{ width: `${r.val}%` }} />
                                                </div>
                                                <div className="w-12 text-right text-xs text-gray-800">{r.val}%</div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                                  </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Cierre del Flujo Médico */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                          <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-2 text-dentBlue-900" />
                            Cierre del Diagnóstico
                          </h4>

                          <div className="space-y-2 mb-6">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                              Diagnóstico Final
                            </label>
                            <textarea
                              value={finalDiagnosis}
                              onChange={(e) => setFinalDiagnosis(e.target.value)}
                              placeholder="Ej. Paciente presenta caries en pieza 46. Se requiere restauración con resina compuesta..."
                              className="w-full min-h-[120px] p-4 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-all resize-y shadow-sm"
                            ></textarea>
                          </div>
                        </div>

                      </div>

                      {/* Botones de Finalización en el Panel */}
                      <div className="p-4 border-t border-gray-200 bg-white shrink-0 flex flex-col gap-3">
                        <button
                          onClick={async () => { 
                            try {
                              if (evaluacionId) {
                                // Llamamos al endpoint para completar la evaluación
                                await fetch(`http://localhost:5000/api/evaluaciones/${evaluacionId}/completar`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({ 
                                    finalDiagnosis,
                                    plan_tratamiento: 'Plan de tratamiento estandar derivado de la evaluación',
                                    confirma_ia: true,
                                    observaciones: contextoClinico.observaciones || ''
                                  })
                                });
                              }
                              
                              console.log("Guardando en BD:", { finalDiagnosis, evaluacionId });
                                clearSessionStorageState(true);
                              // Mostrar Modal de Finalización con barra de progreso
                              setIsFinishing(true);
                              
                              let progress = 0;
                              const timer = setInterval(() => {
                                progress += 1; // 1% cada 20ms = 2s exactos
                                setFinishProgress(progress);
                                if (progress >= 100) {
                                  clearInterval(timer);
                                  setTimeout(() => {
                                    setIsFinishing(false);
                                    navigate('/dashboard');
                                  }, 300); // Cierra rápido después de completar (300ms)
                                }
                              }, 20); // 20ms * 100 iteraciones = 2 segundos exactos

                          } catch (error) {
                            console.error('Error al finalizar diagnóstico:', error);
                            alert('Ocurrió un error al finalizar el diagnóstico.');
                            setIsFinishing(false);
                          }
                        }}
                        disabled={isFinishing}
                        className={`w-full flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white transition-all ${
                          isFinishing ? 'bg-slate-400 cursor-not-allowed' : 'bg-dentBlue-900 hover:bg-dentBlue-800 shadow-md hover:shadow-lg'
                        }`}
                      >
                        {isFinishing ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Finalizando diagnóstico...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Finalizar Diagnóstico
                          </>
                        )}
                      </button>
                      <button
                          onClick={() => { alert('Prueba xd'); }}
                          className="w-full flex items-center justify-center px-6 py-3 rounded-xl font-bold text-dentBlue-900 bg-white border-2 border-dentBlue-900 hover:bg-dentBlue-50 transition-all"
                        >
                          <FileImage className="w-5 h-5 mr-2" />
                          Exportar PDF
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions (Botones de Atrás y Siguiente pegados abajo) */}
            {currentStep < 5 && (
              <div className="px-8 py-5 bg-white border-t border-gray-100 flex items-center justify-between mt-auto">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 1 || isAnalyzing}
                  className={`flex items-center px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
                    (currentStep === 1 || isAnalyzing)
                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                      : 'text-gray-600 hover:bg-gray-100 bg-gray-50 border border-gray-200 shadow-sm'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </button>

                {currentStep < 4 && (
                  <button
                    onClick={handleNext}
                    disabled={getIsNextDisabled() || isSubmitting}
                    className={`flex items-center justify-center px-8 py-3 rounded-lg font-bold text-sm shadow-md transition-all duration-300 ml-auto ${
                      (getIsNextDisabled() || isSubmitting)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
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
                        {(patientMode === 'create' && currentStep === 1)
                            ? (formData.id_paciente ? 'Guardar y Continuar' : 'Registrar y Continuar')
                            : (currentStep === 2 ? 'Guardar y Continuar' : 'Continuar')
                        } <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación de Radiografía reusable */}
      <ModalConfirmacion
        isOpen={modalEliminarImg.isOpen}
        onClose={() => setModalEliminarImg({ isOpen: false, idToRemove: null })}
        onConfirm={() => executeRemoveRadiografia(modalEliminarImg.idToRemove)}
        title="Eliminar radiografía"
        message="La radiografía seleccionada ya contiene una imagen cargada. ¿Está seguro que desea eliminar este registro?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        icon={Trash2}
        colorTheme="red"
      />

      {/* Modal de Finalización Sweep/Linear (Componente Reutilizable) */}
      <ModalFinalizacion isOpen={isFinishing} progress={finishProgress} />

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
              
              {analysisResultsReady && analysisItems.length > 0 && analysisItems.every(i => i.status === 'completed') ? (
                <button
                  onClick={async () => {
                    await obtenerDetalleResultados();
                    setIsAnalyzing(false);
                    setCurrentStep(5);
                    sessionStorage.setItem('eval_currentStep', 5); // Remarcar forzadamente
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