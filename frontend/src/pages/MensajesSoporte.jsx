import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Shield,
  User,
  X
} from 'lucide-react';
import api from '../services/api';
import bgDashboard from '../assets/fondo_dashboard_2.png';

const TIPOS = {
  error: {
    label: 'Error',
    icon: AlertCircle,
    className: 'border-red-100 bg-red-50 text-red-700'
  },
  consulta: {
    label: 'Consulta',
    icon: MessageSquare,
    className: 'border-sky-100 bg-sky-50 text-sky-700'
  },
  sugerencia: {
    label: 'Sugerencia',
    icon: CheckCircle2,
    className: 'border-amber-100 bg-amber-50 text-amber-700'
  }
};

const formatFecha = (valor) => {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
};

const MensajesSoporte = () => {
  const loggedUser = useMemo(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);
  const isSuperadmin = loggedUser?.rol === 'superadmin';

  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [tipo, setTipo] = useState('');
  const [selected, setSelected] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [modalError, setModalError] = useState('');
  const [exito, setExito] = useState('');

  const fetchMensajes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/soporte/mensajes');
      if (response.data?.status === 'success') {
        setMensajes(response.data.data || []);
      } else {
        setError(response.data?.message || 'No se pudieron obtener los mensajes.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperadmin) {
      fetchMensajes();
    }
  }, [fetchMensajes, isSuperadmin]);

  const resumen = useMemo(() => {
    const sinResponder = mensajes.filter((mensaje) => !mensaje.respuesta).length;
    return {
      total: mensajes.length,
      sinResponder,
      respondidos: mensajes.length - sinResponder
    };
  }, [mensajes]);

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return mensajes.filter((mensaje) => {
      if (tipo && mensaje.tipo !== tipo) return false;
      if (filtro === 'sin_responder' && mensaje.respuesta) return false;
      if (filtro === 'respondidos' && !mensaje.respuesta) return false;
      if (!termino) return true;

      return (
        mensaje.codigo?.toLowerCase().includes(termino) ||
        mensaje.asunto?.toLowerCase().includes(termino) ||
        mensaje.descripcion?.toLowerCase().includes(termino) ||
        mensaje.usuario_nombre?.toLowerCase().includes(termino) ||
        mensaje.usuario_correo?.toLowerCase().includes(termino)
      );
    });
  }, [mensajes, busqueda, filtro, tipo]);

  const abrirMensaje = (mensaje) => {
    setSelected(mensaje);
    setRespuesta(mensaje.respuesta || '');
    setModalError('');
    setExito('');
  };

  const cerrarModal = () => {
    if (guardando) return;
    setSelected(null);
    setRespuesta('');
    setModalError('');
  };

  const guardarRespuesta = async () => {
    if (!selected) return;
    if (!respuesta.trim()) {
      setModalError('Escribe una respuesta antes de guardar.');
      return;
    }

    setGuardando(true);
    setModalError('');
    try {
      const response = await api.patch(`/soporte/mensajes/${selected.id_mensaje}/respuesta`, {
        respuesta: respuesta.trim()
      });

      if (response.data?.status === 'success') {
        const actualizado = response.data.data;
        setMensajes((prev) =>
          prev.map((mensaje) => (mensaje.id_mensaje === actualizado.id_mensaje ? actualizado : mensaje))
        );
        setSelected(actualizado);
        setRespuesta(actualizado.respuesta || '');
        setExito('Respuesta guardada correctamente.');
      } else {
        setModalError(response.data?.message || 'No se pudo guardar la respuesta.');
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'No se pudo conectar con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  if (!isSuperadmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50/50 p-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso restringido</h2>
        <p className="text-gray-500 text-center max-w-md">
          Esta bandeja es exclusiva del superadministrador del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
      <div className="flex-none bg-white border-b border-gray-200 px-8 py-6 z-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Inbox className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mensajes de soporte</h1>
              <p className="text-sm text-gray-500">Revisa y responde los reportes enviados desde el centro de ayuda.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchMensajes}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-dentBlue-900 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto relative bg-cover bg-center bg-no-repeat p-6 lg:p-10"
        style={{ backgroundImage: `url(${bgDashboard})` }}
      >
        <div className="absolute inset-0 bg-white/45 z-0 pointer-events-none"></div>

        <div className="relative z-10 max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Total</p>
                <Inbox className="w-4 h-4 text-dentBlue-900" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-gray-900">{resumen.total}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white/95 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-600">Sin responder</p>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-amber-600">{resumen.sinResponder}</p>
            </div>
            <div className="rounded-2xl border border-green-100 bg-white/95 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-green-600">Respondidos</p>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-green-600">{resumen.respondidos}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white/95 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="search"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar por código, asunto o usuario..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm font-medium focus:border-dentBlue-500 focus:outline-none focus:ring-2 focus:ring-dentBlue-500/30"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                  {[
                    { key: 'todos', label: 'Todos' },
                    { key: 'sin_responder', label: 'Sin responder' },
                    { key: 'respondidos', label: 'Respondidos' }
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFiltro(item.key)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        filtro === item.key ? 'bg-dentBlue-900 text-white shadow-sm' : 'text-gray-600 hover:bg-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <select
                  value={tipo}
                  onChange={(event) => setTipo(event.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 focus:border-dentBlue-500 focus:outline-none focus:ring-2 focus:ring-dentBlue-500/30"
                >
                  <option value="">Todos los tipos</option>
                  <option value="error">Error</option>
                  <option value="consulta">Consulta</option>
                  <option value="sugerencia">Sugerencia</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-dentBlue-900 animate-spin" />
                <p className="mt-3 text-sm font-medium text-gray-500">Cargando mensajes...</p>
              </div>
            ) : filtrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Inbox className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No hay mensajes</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {busqueda || tipo || filtro !== 'todos'
                    ? 'No se encontraron mensajes con los filtros seleccionados.'
                    : 'Los reportes enviados desde el centro de ayuda aparecerán aquí.'}
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {filtrados.map((mensaje) => {
                  const tipoInfo = TIPOS[mensaje.tipo] || TIPOS.consulta;
                  const IconoTipo = tipoInfo.icon;
                  return (
                    <button
                      key={mensaje.id_mensaje}
                      type="button"
                      onClick={() => abrirMensaje(mensaje)}
                      className="w-full rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-dentBlue-100 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${tipoInfo.className}`}>
                            <IconoTipo className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-dentBlue-900">{mensaje.codigo}</span>
                              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${tipoInfo.className}`}>
                                {tipoInfo.label}
                              </span>
                              {mensaje.respuesta ? (
                                <span className="rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
                                  Respondido
                                </span>
                              ) : (
                                <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                  Sin respuesta
                                </span>
                              )}
                            </div>
                            <p className="mt-1 truncate text-sm font-bold text-gray-900">{mensaje.asunto}</p>
                            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{mensaje.descripcion}</p>
                          </div>
                        </div>

                        <div className="shrink-0 text-left md:text-right">
                          <p className="text-sm font-semibold text-gray-800">{mensaje.usuario_nombre}</p>
                          <p className="text-xs text-gray-500">{mensaje.usuario_correo}</p>
                          <p className="mt-1 text-xs text-gray-400">{formatFecha(mensaje.creado_en)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!loading && filtrados.length > 0 && (
              <p className="mt-5 text-right text-xs font-medium text-gray-500">
                Mostrando {filtrados.length} de {mensajes.length} mensajes.
              </p>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-dentBlue-900">{selected.codigo}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${(TIPOS[selected.tipo] || TIPOS.consulta).className}`}>
                    {(TIPOS[selected.tipo] || TIPOS.consulta).label}
                  </span>
                  {selected.respuesta ? (
                    <span className="rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
                      Respondido
                    </span>
                  ) : (
                    <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                      Sin respuesta
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-xl font-bold text-gray-900">{selected.asunto}</h3>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl bg-gray-50 p-4 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Usuario</p>
                    <p className="text-sm font-semibold text-gray-900">{selected.usuario_nombre}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Correo</p>
                    <p className="break-all text-sm font-semibold text-gray-900">{selected.usuario_correo}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Enviado</p>
                    <p className="text-sm font-semibold text-gray-900">{formatFecha(selected.creado_en)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MessageSquare className="mt-0.5 w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Página de origen</p>
                    <p className="break-all text-sm font-semibold text-gray-900">{selected.pagina_origen || 'No indicada'}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Descripción</p>
                <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm leading-relaxed text-gray-700">
                  {selected.descripcion}
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="respuesta" className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  {selected.respuesta ? 'Actualizar respuesta' : 'Respuesta'}
                </label>
                <textarea
                  id="respuesta"
                  rows={5}
                  value={respuesta}
                  onChange={(event) => setRespuesta(event.target.value)}
                  placeholder="Escribe la respuesta para el usuario..."
                  className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed focus:border-dentBlue-500 focus:outline-none focus:ring-2 focus:ring-dentBlue-500/30"
                />
                {selected.respondido_en && (
                  <p className="mt-1 text-xs text-gray-400">Última respuesta: {formatFecha(selected.respondido_en)}</p>
                )}
              </div>

              {exito && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  {exito}
                </div>
              )}

              {modalError && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {modalError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-60"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={guardarRespuesta}
                disabled={guardando}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-dentBlue-900 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-dentBlue-800 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {guardando ? 'Guardando...' : selected.respuesta ? 'Actualizar respuesta' : 'Enviar respuesta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MensajesSoporte;
