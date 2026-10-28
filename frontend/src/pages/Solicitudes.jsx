import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Loader2, CheckCircle2, XCircle, Clock, Search, ChevronRight, UserCog } from 'lucide-react';
import api from '../services/api';
import bgDashboard from '../assets/fondo_dashboard_2.png';

const Solicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pendiente');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const loggedUser = useMemo(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  }, []);
  const isSuperadmin = loggedUser?.id_odontologo === 1 || loggedUser?.rol === 'superadmin';

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/solicitudes');
      if (response.data?.status === 'success') {
        setSolicitudes(response.data.data);
      } else {
        setError(response.data?.message || 'Error al obtener solicitudes');
      }
    } catch (err) {
      setError('Error de red al obtener solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperadmin) {
      fetchSolicitudes();
    }
  }, [isSuperadmin]);

  const handleAction = async (id, action) => {
    try {
      setProcessingId(id);
      const response = await api.post(`/solicitudes/${id}/${action}`);
      if (response.data?.status === 'success') {
        await fetchSolicitudes();
        setSuccessMessage(response.data.message || `Solicitud ${action} correctamente`);
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setError(response.data?.message || `Error al ${action} solicitud`);
      }
    } catch (err) {
      setError(`Error al procesar la solicitud`);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isSuperadmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50/50 p-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
        <p className="text-gray-500 text-center max-w-md">
          Esta área es exclusiva para el Administrador Principal o un Superadministrador.
        </p>
      </div>
    );
  }

  const filteredSolicitudes = solicitudes.filter(s => {
    const matchesFilter = s.estado === filter;
    const matchesSearch = s.objetivo_nombre?.toLowerCase().includes(search.toLowerCase()) || 
                          s.solicitante_nombre?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
      
      {/* Header Fijo */}
      <div className="flex-none bg-white border-b border-gray-200 px-8 py-6 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <UserCog className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Rol</h1>
              <p className="text-sm text-gray-500">Aprueba o rechaza solicitudes de nuevos administradores.</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
               placeholder="Buscar por nombre (Opcional)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto relative bg-cover bg-center bg-no-repeat p-6 lg:p-10"
        style={{ backgroundImage: `url(${bgDashboard})` }}
      >
        <div className="absolute inset-0 bg-white/40 z-0 pointer-events-none"></div>
        <div className="relative z-10 max-w-6xl mx-auto">
          
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[75vh] flex flex-col">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
            <XCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-px mb-8">
          {['pendiente', 'aprobada', 'rechazada'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-3 text-sm font-bold capitalize transition-all border-b-2 ${
                filter === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}s
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                filter === tab ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {solicitudes.filter(s => s.estado === tab).length}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-gray-500 font-medium animate-pulse">Cargando solicitudes...</p>
          </div>
        ) : filteredSolicitudes.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay solicitudes</h3>
            <p className="text-gray-500">No se encontraron solicitudes en estado "{filter}".</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSolicitudes.map((solicitud) => (
              <div key={solicitud.id_solicitud} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
                
                <div className="flex items-start gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    solicitud.estado === 'pendiente' ? 'bg-amber-100 text-amber-600' :
                    solicitud.estado === 'aprobada' ? 'bg-green-100 text-green-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {solicitud.estado === 'pendiente' ? <Clock className="w-6 h-6" /> :
                     solicitud.estado === 'aprobada' ? <CheckCircle2 className="w-6 h-6" /> :
                     <XCircle className="w-6 h-6" />}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-gray-900">{solicitud.objetivo_nombre}</span>
                      {solicitud.tipo_solicitud === 'Restablecer Contraseña' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200 shadow-sm uppercase text-xs">
                          <ChevronRight className="w-4 h-4 text-amber-500" />
                          Restablecer Contraseña
                        </span>
                      ) : solicitud.objetivo_rol_actual === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200 text-xs">
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                          DEGRADAR A ODONTÓLOGO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 font-bold border border-purple-200 shadow-sm text-xs">
                          <ChevronRight className="w-4 h-4 text-purple-500" />
                          ASCENDER A ADMINISTRADOR
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {solicitud.tipo_solicitud === 'Restablecer Contraseña' ? (
                        <>Correo asociado <span className="font-semibold text-gray-800">{solicitud.correo}</span></>
                      ) : (
                        <>Solicitado por <span className="font-semibold text-gray-800">{solicitud.solicitante_nombre}</span></>
                      )}
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-gray-500">
                        {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {solicitud.estado === 'pendiente' && (
                  <div className="flex items-center gap-3 md:ml-auto">
                    <button
                      onClick={() => handleAction(solicitud.id_solicitud, 'rechazar')}
                      disabled={processingId === solicitud.id_solicitud}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleAction(solicitud.id_solicitud, 'aprobar')}
                      disabled={processingId === solicitud.id_solicitud}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm hover:shadow transition-all disabled:opacity-50"
                    >
                      {processingId === solicitud.id_solicitud ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Aprobar
                    </button>
                  </div>
                )}
                
                {solicitud.estado !== 'pendiente' && (
                  <div className="md:ml-auto">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${
                      solicitud.estado === 'aprobada' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {solicitud.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Modal de Éxito de Acción */}
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¡Operación Exitosa!</h3>
              <p className="text-gray-600 text-sm">{successMessage}</p>
            </div>
            <div className="p-4 bg-gray-50 flex justify-center">
              <button
                onClick={() => setSuccessMessage('')}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Solicitudes;
