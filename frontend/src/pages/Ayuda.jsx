import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Image,
  Inbox,
  KeyRound,
  LifeBuoy,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';
import api from '../services/api';
import bgDashboard from '../assets/fondo_dashboard_2.png';

const CATEGORIAS = ['Todas', 'Primeros pasos', 'Diagnóstico', 'Pacientes', 'Reportes', 'Cuenta', 'Soporte'];

const FAQS = [
  {
    id: 1,
    categoria: 'Primeros pasos',
    pregunta: '¿Cómo creo una nueva evaluación clínica?',
    respuesta: 'Ingresa a Diagnóstico en el menú lateral, selecciona o registra al paciente, completa el motivo de consulta y adjunta la radiografía. Al guardar, la evaluación quedará disponible en el historial.'
  },
  {
    id: 2,
    categoria: 'Primeros pasos',
    pregunta: '¿Qué puedo hacer desde el panel de inicio?',
    respuesta: 'El inicio resume la actividad reciente, la cantidad de pacientes registrados, las evaluaciones realizadas y los casos con caries detectada para que puedas priorizar tu trabajo.'
  },
  {
    id: 3,
    categoria: 'Diagnóstico',
    pregunta: '¿Qué tipos de radiografía acepta el sistema?',
    respuesta: 'El sistema está orientado a radiografías interproximales y periapicales. Formatos como imágenes panorámicas aún no cuentan con un modelo entrenado específico, por lo que sus resultados pueden no ser confiables.'
  },
  {
    id: 4,
    categoria: 'Diagnóstico',
    pregunta: '¿Puedo analizar una radiografía panorámica?',
    respuesta: 'Actualmente no se recomienda. El modelo de detección fue entrenado para radiografías interproximales y periapicales. El soporte para panorámicas se encuentra dentro de las mejoras futuras del sistema.'
  },
  {
    id: 5,
    categoria: 'Diagnóstico',
    pregunta: '¿La detección de la IA reemplaza mi diagnóstico?',
    respuesta: 'No. El resultado de la IA es un apoyo para priorizar la revisión clínica. El odontólogo debe validar las detecciones, confirmar el diagnóstico y registrar su plan de tratamiento.'
  },
  {
    id: 6,
    categoria: 'Diagnóstico',
    pregunta: '¿Qué hago si la IA no marca una caries que sí observo?',
    respuesta: 'Puedes continuar con tu evaluación y registrar tu diagnóstico manualmente. Si el caso se repite, envíanos un reporte desde el formulario indicando la evaluación y una descripción del hallazgo.'
  },
  {
    id: 7,
    categoria: 'Diagnóstico',
    pregunta: '¿Qué formatos de imagen se aceptan?',
    respuesta: 'Se aceptan imágenes en formatos comunes como JPG, JPEG y PNG. Para obtener mejores resultados, usa radiografías nítidas, bien recortadas y con una resolución adecuada.'
  },
  {
    id: 8,
    categoria: 'Pacientes',
    pregunta: '¿Cómo registro un nuevo paciente?',
    respuesta: 'Ve a Pacientes y selecciona Nuevo paciente. Completa los datos personales, el contacto y la información del apoderado cuando corresponda. El DNI no puede repetirse.'
  },
  {
    id: 9,
    categoria: 'Pacientes',
    pregunta: '¿Puedo eliminar un paciente?',
    respuesta: 'El sistema prioriza conservar el historial clínico. En lugar de eliminar, puedes desactivar al paciente para que no aparezca en las búsquedas habituales sin perder sus evaluaciones.'
  },
  {
    id: 10,
    categoria: 'Reportes',
    pregunta: '¿Cómo genero un reporte?',
    respuesta: 'Abre Reportes, define el rango de fechas y el tipo de información que necesitas. Luego descarga el reporte en el formato disponible para adjuntarlo a la historia clínica o presentarlo.'
  },
  {
    id: 11,
    categoria: 'Cuenta',
    pregunta: '¿Cómo cambio mi contraseña?',
    respuesta: 'Ingresa a Configuración, luego Preferencias, y usa la opción Ir a seguridad. También puedes hacerlo desde Mi Perfil. Deberás confirmar tu contraseña actual.'
  },
  {
    id: 12,
    categoria: 'Cuenta',
    pregunta: '¿Qué hago si olvidé mi contraseña?',
    respuesta: 'Desde la pantalla de inicio de sesión usa la opción de recuperación. Se generará una solicitud que el administrador principal debe aprobar antes de que puedas definir una nueva contraseña.'
  },
  {
    id: 13,
    categoria: 'Cuenta',
    pregunta: '¿Por qué no veo un módulo en el menú?',
    respuesta: 'Tu cuenta puede tener permisos limitados. Si necesitas acceso a Diagnóstico, Pacientes, Historial o Reportes, solicita al administrador que revise tus permisos.'
  },
  {
    id: 14,
    categoria: 'Soporte',
    pregunta: '¿Cómo reporto un error o una idea de mejora?',
    respuesta: 'Usa el formulario de esta página. Selecciona el tipo de mensaje, escribe un asunto claro y describe lo que ocurrió. El superadministrador recibirá el reporte en su bandeja de soporte.'
  },
  {
    id: 15,
    categoria: 'Soporte',
    pregunta: '¿Dónde puedo ver la respuesta a mi reporte?',
    respuesta: 'El administrador revisará tu mensaje desde la bandeja de soporte. Si necesitas seguimiento, vuelve a enviar un mensaje indicando el código del reporte anterior.'
  }
];

const CATEGORIA_ICONS = {
  'Primeros pasos': Sparkles,
  Diagnóstico: Image,
  Pacientes: Users,
  Reportes: BarChart2,
  Cuenta: KeyRound,
  Soporte: ShieldCheck
};

const FAQS_POR_PAGINA = 5;
const MENSAJES_POR_PAGINA = 4;

const getPaginationItems = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, 'end', total];
  if (current >= total - 3) return [1, 'start', total - 4, total - 3, total - 2, total - 1, total];
  return [1, 'start', current - 1, current, current + 1, 'end', total];
};

const formatFecha = (valor) => {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
};

const Ayuda = () => {
  const location = useLocation();
  const user = useMemo(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [abierta, setAbierta] = useState(null);
  const [paginaFaqs, setPaginaFaqs] = useState(1);
  const [paginaFaqsInput, setPaginaFaqsInput] = useState('');
  const [paginaFaqsError, setPaginaFaqsError] = useState('');
  const [form, setForm] = useState({ tipo: 'consulta', asunto: '', descripcion: '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(null);
  const [misMensajes, setMisMensajes] = useState([]);
  const [cargandoMios, setCargandoMios] = useState(true);
  const [errorMios, setErrorMios] = useState('');
  const [paginaMios, setPaginaMios] = useState(1);
  const [mensajeAbierto, setMensajeAbierto] = useState(null);

  const faqsFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return FAQS.filter((faq) => {
      const coincideCategoria = categoria === 'Todas' || faq.categoria === categoria;
      const coincideBusqueda =
        !termino ||
        faq.pregunta.toLowerCase().includes(termino) ||
        faq.respuesta.toLowerCase().includes(termino);
      return coincideCategoria && coincideBusqueda;
    });
  }, [busqueda, categoria]);

  const totalPaginasFaqs = Math.ceil(faqsFiltradas.length / FAQS_POR_PAGINA);
  const paginaFaqsVisible = Math.min(paginaFaqs, Math.max(1, totalPaginasFaqs));
  const faqsPagina = faqsFiltradas.slice(
    (paginaFaqsVisible - 1) * FAQS_POR_PAGINA,
    paginaFaqsVisible * FAQS_POR_PAGINA
  );

  const totalPaginasMios = Math.ceil(misMensajes.length / MENSAJES_POR_PAGINA);
  const paginaMiosVisible = Math.min(paginaMios, Math.max(1, totalPaginasMios));
  const mensajesPagina = misMensajes.slice(
    (paginaMiosVisible - 1) * MENSAJES_POR_PAGINA,
    paginaMiosVisible * MENSAJES_POR_PAGINA
  );

  const resumenMios = useMemo(() => {
    const sinResponder = misMensajes.filter((mensaje) => !mensaje.respondido).length;
    return {
      total: misMensajes.length,
      sinResponder,
      respondidos: misMensajes.length - sinResponder
    };
  }, [misMensajes]);

  const fetchMisMensajes = useCallback(async () => {
    if (!user) {
      setCargandoMios(false);
      return;
    }

    try {
      setCargandoMios(true);
      setErrorMios('');
      const response = await api.get('/soporte/mis-mensajes');
      if (response.data?.status === 'success') {
        setMisMensajes(response.data.data || []);
      } else {
        setErrorMios(response.data?.message || 'No se pudieron cargar tus mensajes.');
      }
    } catch (err) {
      setErrorMios(err.response?.data?.message || 'No se pudieron cargar tus mensajes.');
    } finally {
      setCargandoMios(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMisMensajes();
  }, [fetchMisMensajes]);

  useEffect(() => {
    setPaginaFaqs(1);
    setPaginaFaqsInput('');
    setPaginaFaqsError('');
    setAbierta(null);
  }, [busqueda, categoria]);

  useEffect(() => {
    setPaginaFaqs((previous) => Math.min(previous, Math.max(1, totalPaginasFaqs)));
    setPaginaFaqsInput('');
    setPaginaFaqsError('');
  }, [totalPaginasFaqs]);

  useEffect(() => {
    setPaginaMios((previous) => Math.min(previous, Math.max(1, totalPaginasMios)));
  }, [totalPaginasMios]);

  const irAPaginaFaqs = (target) => {
    if (target < 1 || target > totalPaginasFaqs) return;
    setPaginaFaqs(target);
    setPaginaFaqsInput('');
    setPaginaFaqsError('');
  };

  const handleFaqPageJump = (event) => {
    event.preventDefault();
    const target = Number(paginaFaqsInput);
    if (!/^\d+$/.test(paginaFaqsInput) || !Number.isSafeInteger(target) || target < 1 || target > totalPaginasFaqs) {
      setPaginaFaqsError(`Ingresa una página del 1 al ${totalPaginasFaqs}.`);
      return;
    }
    irAPaginaFaqs(target);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.asunto.trim().length < 5) {
      setError('El asunto debe tener al menos 5 caracteres.');
      return;
    }
    if (form.descripcion.trim().length < 10) {
      setError('La descripción debe tener al menos 10 caracteres.');
      return;
    }

    setEnviando(true);
    try {
      const response = await api.post('/soporte/mensajes', {
        tipo: form.tipo,
        asunto: form.asunto.trim(),
        descripcion: form.descripcion.trim(),
        pagina_origen: location.pathname
      });

      if (response.data?.status === 'success') {
        setExito(response.data.data);
        setForm({ tipo: 'consulta', asunto: '', descripcion: '' });
        setPaginaMios(1);
        setMensajeAbierto(response.data.data.id_mensaje);
        fetchMisMensajes();
      } else {
        setError(response.data?.message || 'No se pudo registrar el mensaje.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo conectar con el servidor. Inténtalo nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
      <div className="flex-none bg-white border-b border-gray-200 px-8 py-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-dentBlue-50 rounded-xl flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-dentBlue-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Soporte / Ayuda</h1>
            <p className="text-sm text-gray-500">Encuentra respuestas rápidas o comunícate con el administrador.</p>
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto relative bg-cover bg-center bg-no-repeat p-6 lg:p-10"
        style={{ backgroundImage: `url(${bgDashboard})` }}
      >
        <div className="absolute inset-0 bg-white/45 z-0 pointer-events-none"></div>

        <div className="relative z-10 max-w-6xl mx-auto space-y-6">
          <section className="rounded-3xl bg-gradient-to-r from-dentBlue-900 to-dentGreen-500 p-8 text-white shadow-xl overflow-hidden relative">
            <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/10"></div>
            <div className="absolute right-24 bottom-0 h-24 w-24 rounded-full bg-white/10"></div>
            <div className="relative max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]">
                <BookOpen className="w-3.5 h-3.5" />
                Centro de ayuda
              </span>
              <h2 className="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight">
                {user ? `Hola, ${user.nombres}. ¿En qué podemos ayudarte?` : '¿En qué podemos ayudarte?'}
              </h2>
              <p className="mt-2 text-sm md:text-base text-white/85 max-w-2xl">
                Consulta las preguntas frecuentes del sistema o envíanos un reporte. Los reportes llegan directamente al superadministrador.
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
            <section className="xl:col-span-3 bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Preguntas frecuentes</h3>
                  <p className="text-sm text-gray-500">Busca por palabra clave o filtra por categoría.</p>
                </div>
              </div>

              <div className="relative mb-5">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="search"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar una pregunta..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm font-medium focus:border-dentBlue-500 focus:outline-none focus:ring-2 focus:ring-dentBlue-500/30"
                />
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {CATEGORIAS.map((item) => {
                  const Icono = CATEGORIA_ICONS[item];
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategoria(item)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                        categoria === item
                          ? 'border-dentBlue-900 bg-dentBlue-900 text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-dentBlue-200 hover:text-dentBlue-900'
                      }`}
                    >
                      {Icono && <Icono className="w-3.5 h-3.5" />}
                      {item}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                {faqsPagina.map((faq) => {
                  const isOpen = abierta === faq.id;
                  return (
                    <div key={faq.id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setAbierta(isOpen ? null : faq.id)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50/80 transition-colors"
                      >
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wide text-dentGreen-600">
                            {faq.categoria}
                          </span>
                          <p className="mt-0.5 text-sm font-bold text-gray-900">{faq.pregunta}</p>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4">
                          <p className="text-sm leading-relaxed text-gray-600">{faq.respuesta}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {faqsFiltradas.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-10 text-center">
                    <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="font-bold text-gray-700">No encontramos preguntas con ese criterio.</p>
                    <p className="mt-1 text-sm text-gray-500">Prueba con otra palabra o envía tu consulta al administrador.</p>
                  </div>
                )}
              </div>

              {faqsFiltradas.length > 0 && (
                <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-center text-xs font-medium text-gray-500 lg:text-left">
                    Mostrando{' '}
                    <span className="font-bold text-gray-800">
                      {(paginaFaqsVisible - 1) * FAQS_POR_PAGINA + 1}-
                      {Math.min(paginaFaqsVisible * FAQS_POR_PAGINA, faqsFiltradas.length)}
                    </span>{' '}
                    de <span className="font-bold text-gray-800">{faqsFiltradas.length}</span> preguntas
                  </p>

                  {totalPaginasFaqs > 1 && (
                    <div className="flex flex-col items-center gap-2 sm:items-end">
                      <div className="flex items-center gap-2">
                        <nav className="flex items-center gap-1" aria-label="Páginas de preguntas frecuentes">
                          <button
                            type="button"
                            onClick={() => irAPaginaFaqs(paginaFaqsVisible - 1)}
                            disabled={paginaFaqsVisible <= 1}
                            aria-label="Página anterior"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-dentBlue-900/30 hover:bg-dentBlue-50 hover:text-dentBlue-900 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {getPaginationItems(paginaFaqsVisible, totalPaginasFaqs).map((item) =>
                            typeof item === 'number' ? (
                              <button
                                key={item}
                                type="button"
                                onClick={() => irAPaginaFaqs(item)}
                                aria-label={`Página ${item}`}
                                aria-current={paginaFaqsVisible === item ? 'page' : undefined}
                                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors ${
                                  paginaFaqsVisible === item
                                    ? 'bg-dentBlue-900 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-dentBlue-50 hover:text-dentBlue-900'
                                }`}
                              >
                                {item}
                              </button>
                            ) : (
                              <span key={item} className="px-1 text-xs text-gray-400">
                                …
                              </span>
                            )
                          )}
                          <button
                            type="button"
                            onClick={() => irAPaginaFaqs(paginaFaqsVisible + 1)}
                            disabled={paginaFaqsVisible >= totalPaginasFaqs}
                            aria-label="Página siguiente"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-dentBlue-900/30 hover:bg-dentBlue-50 hover:text-dentBlue-900 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </nav>

                        <form onSubmit={handleFaqPageJump} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={paginaFaqsInput}
                            onChange={(event) => {
                              if (/^\d*$/.test(event.target.value) && event.target.value.length <= String(totalPaginasFaqs).length) {
                                setPaginaFaqsInput(event.target.value);
                                setPaginaFaqsError('');
                              }
                            }}
                            placeholder="#"
                            aria-label="Ir a la página"
                            aria-invalid={Boolean(paginaFaqsError)}
                            className={`h-8 w-11 rounded-lg border bg-gray-50 text-center text-xs font-medium text-gray-800 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-dentBlue-900/10 ${
                              paginaFaqsError ? 'border-red-400' : 'border-gray-200 focus:border-dentBlue-900'
                            }`}
                          />
                          <button
                            type="submit"
                            aria-label="Ir a la página indicada"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-dentBlue-900 text-white transition-colors hover:bg-dentBlue-800"
                          >
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </form>
                      </div>
                      {paginaFaqsError && <span role="alert" className="text-xs text-red-600">{paginaFaqsError}</span>}
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="xl:col-span-2 bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MessageSquarePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Enviar un mensaje</h3>
                  <p className="text-sm text-gray-500">Reporta un problema o envía una sugerencia.</p>
                </div>
              </div>

              {exito ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 shrink-0 text-green-600" />
                    <div>
                      <p className="font-bold text-green-800">Mensaje registrado</p>
                      <p className="mt-1 text-sm text-green-700">
                        El administrador revisará tu mensaje. Código de referencia:
                      </p>
                      <p className="mt-2 inline-flex rounded-lg bg-white px-3 py-1.5 font-mono text-sm font-bold text-green-800 border border-green-200">
                        {exito.codigo}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExito(null)}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-green-200 bg-white px-4 py-2.5 text-sm font-bold text-green-700 hover:bg-green-100 transition-colors"
                  >
                    Registrar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                      Usuario
                    </label>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">
                        {user ? `${user.nombres} ${user.apellidos}` : 'Sesión no disponible'}
                      </p>
                      <p className="text-xs text-gray-500">{user?.correo || 'Inicia sesión para enviar reportes.'}</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="tipo" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                      Tipo de mensaje
                    </label>
                    <select
                      id="tipo"
                      value={form.tipo}
                      onChange={(event) => setForm({ ...form, tipo: event.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-dentBlue-500 focus:outline-none focus:ring-2 focus:ring-dentBlue-500/30"
                    >
                      <option value="consulta">Consulta</option>
                      <option value="error">Reportar un error</option>
                      <option value="sugerencia">Sugerencia de mejora</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="asunto" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                      Asunto
                    </label>
                    <input
                      id="asunto"
                      type="text"
                      maxLength={150}
                      value={form.asunto}
                      onChange={(event) => setForm({ ...form, asunto: event.target.value })}
                      placeholder="Ej: Error al guardar una evaluación"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-dentBlue-500 focus:outline-none focus:ring-2 focus:ring-dentBlue-500/30"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="descripcion" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                      Descripción
                    </label>
                    <textarea
                      id="descripcion"
                      rows={5}
                      maxLength={2000}
                      value={form.descripcion}
                      onChange={(event) => setForm({ ...form, descripcion: event.target.value })}
                      placeholder="Describe lo que ocurrió, qué esperabas que sucediera y los pasos para reproducirlo."
                      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium focus:border-dentBlue-500 focus:outline-none focus:ring-2 focus:ring-dentBlue-500/30"
                      required
                    />
                    <p className="mt-1 text-right text-[11px] text-gray-400">{form.descripcion.length}/2000</p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={enviando}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-dentBlue-900 px-5 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-dentBlue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {enviando ? 'Enviando...' : 'Enviar mensaje'}
                  </button>

                  <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
                    <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Incluye en la descripción toda la información necesaria.
                  </div>
                </form>
              )}
            </section>
          </div>

          <section className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-dentBlue-50 text-dentBlue-900 flex items-center justify-center">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Mis mensajes</h3>
                  <p className="text-sm text-gray-500">Revisa los reportes que enviaste y si ya recibieron respuesta.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchMisMensajes}
                disabled={cargandoMios}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-dentBlue-900 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${cargandoMios ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Total enviados</p>
                <p className="mt-1 text-xl font-extrabold text-gray-900">{resumenMios.total}</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600">Sin respuesta</p>
                <p className="mt-1 text-xl font-extrabold text-amber-600">{resumenMios.sinResponder}</p>
              </div>
              <div className="rounded-xl border border-green-100 bg-green-50/60 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-green-600">Respondidos</p>
                <p className="mt-1 text-xl font-extrabold text-green-600">{resumenMios.respondidos}</p>
              </div>
            </div>

            {errorMios && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {errorMios}
              </div>
            )}

            {cargandoMios ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-7 h-7 text-dentBlue-900 animate-spin" />
                <p className="mt-3 text-sm font-medium text-gray-500">Cargando tus mensajes...</p>
              </div>
            ) : misMensajes.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-10 text-center">
                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="font-bold text-gray-700">Aún no has enviado mensajes.</p>
                <p className="mt-1 text-sm text-gray-500">Cuando envíes un reporte desde esta página aparecerá aquí.</p>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-3">
                  {mensajesPagina.map((mensaje) => {
                    const isOpen = mensajeAbierto === mensaje.id_mensaje;
                    return (
                      <div key={mensaje.id_mensaje} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                        <button
                          type="button"
                          onClick={() => setMensajeAbierto(isOpen ? null : mensaje.id_mensaje)}
                          className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/80"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              mensaje.respondido ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {mensaje.respondido ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-dentBlue-900">{mensaje.codigo}</span>
                                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-bold capitalize text-gray-600">
                                  {mensaje.tipo}
                                </span>
                                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                                  mensaje.respondido
                                    ? 'border-green-100 bg-green-50 text-green-700'
                                    : 'border-amber-100 bg-amber-50 text-amber-700'
                                }`}>
                                  {mensaje.respondido ? 'Respondido' : 'Sin respuesta'}
                                </span>
                              </div>
                              <p className="mt-1 truncate text-sm font-bold text-gray-900">{mensaje.asunto}</p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                Enviado el {formatFecha(mensaje.creado_en)}
                                {mensaje.respondido && mensaje.respondido_en && ` · Respondido el ${formatFecha(mensaje.respondido_en)}`}
                              </p>
                            </div>
                          </div>
                          <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isOpen && (
                          <div className="space-y-3 border-t border-gray-100 bg-gray-50/60 px-5 py-4">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Tu mensaje</p>
                              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{mensaje.descripcion}</p>
                            </div>

                            {mensaje.respondido ? (
                              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-green-700">Respuesta del administrador</p>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-green-800">{mensaje.respuesta}</p>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                                Tu mensaje aún no tiene respuesta. El administrador lo revisará pronto.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {totalPaginasMios > 1 && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-center text-xs font-medium text-gray-500 sm:text-left">
                      Mostrando{' '}
                      <span className="font-bold text-gray-800">
                        {(paginaMiosVisible - 1) * MENSAJES_POR_PAGINA + 1}-
                        {Math.min(paginaMiosVisible * MENSAJES_POR_PAGINA, misMensajes.length)}
                      </span>{' '}
                      de <span className="font-bold text-gray-800">{misMensajes.length}</span> mensajes
                    </p>

                    <nav className="flex items-center justify-center gap-1" aria-label="Páginas de mis mensajes">
                      <button
                        type="button"
                        onClick={() => setPaginaMios(paginaMiosVisible - 1)}
                        disabled={paginaMiosVisible <= 1}
                        aria-label="Página anterior"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-dentBlue-900/30 hover:bg-dentBlue-50 hover:text-dentBlue-900 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </button>
                      {getPaginationItems(paginaMiosVisible, totalPaginasMios).map((item) =>
                        typeof item === 'number' ? (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setPaginaMios(item)}
                            aria-label={`Página ${item}`}
                            aria-current={paginaMiosVisible === item ? 'page' : undefined}
                            className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors ${
                              paginaMiosVisible === item
                                ? 'bg-dentBlue-900 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-dentBlue-50 hover:text-dentBlue-900'
                            }`}
                          >
                            {item}
                          </button>
                        ) : (
                          <span key={item} className="px-1 text-xs text-gray-400">…</span>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => setPaginaMios(paginaMiosVisible + 1)}
                        disabled={paginaMiosVisible >= totalPaginasMios}
                        aria-label="Página siguiente"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-dentBlue-900/30 hover:bg-dentBlue-50 hover:text-dentBlue-900 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Ayuda;
