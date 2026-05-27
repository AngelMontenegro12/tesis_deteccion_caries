import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Loader2,
  Plus,
  Stethoscope,
  Mail,
  Phone,
  BadgeCheck,
  UserCog,
  Users,
  CheckCircle2,
  XCircle,
  Shield,
  Edit3,
  ArrowUpDown,
  Sparkles,
  X
} from 'lucide-react';
import api from '../services/api';
import bgDashboard from '../assets/fondo_dashboard_2.png';

const emptyForm = {
  nombres: '',
  apellidos: '',
  correo: '',
  contrasena: '',
  colegiatura: '',
  especialidad: '',
  telefono: '',
  activo: true
};

const Usuarios = () => {
  const [odontologos, setOdontologos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(true);
  const [sortKey, setSortKey] = useState('apellidos');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchOdontologos = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/odontologos', {
        params: {
          incluir_inactivos: showInactive,
          q: search.trim()
        }
      });

      if (response.data?.status === 'success') {
        setOdontologos(response.data.data || []);
      } else {
        setOdontologos([]);
      }
    } catch (requestError) {
      console.error('Error obteniendo odontólogos', requestError);
      setError('No se pudo cargar la lista de odontólogos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchOdontologos();
    }, 300);

    return () => clearTimeout(debounce);
  }, [search, showInactive]);

  const metrics = useMemo(() => {
    const total = odontologos.length;
    const activos = odontologos.filter((odontologo) => odontologo.activo).length;
    const especialistas = new Set(
      odontologos
        .map((odontologo) => odontologo.especialidad)
        .filter(Boolean)
        .map((especialidad) => especialidad.trim())
    ).size;

    return {
      total,
      activos,
      inactivos: total - activos,
      especialistas
    };
  }, [odontologos]);

  const sortedOdontologos = useMemo(() => {
    const lista = [...odontologos];

    lista.sort((a, b) => {
      let valorA = a[sortKey] ?? '';
      let valorB = b[sortKey] ?? '';

      if (sortKey === 'nombre_completo') {
        valorA = `${a.nombres ?? ''} ${a.apellidos ?? ''}`.trim();
        valorB = `${b.nombres ?? ''} ${b.apellidos ?? ''}`.trim();
      }

      if (typeof valorA === 'string') valorA = valorA.toLowerCase();
      if (typeof valorB === 'string') valorB = valorB.toLowerCase();

      if (valorA < valorB) return sortDirection === 'asc' ? -1 : 1;
      if (valorA > valorB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return lista;
  }, [odontologos, sortKey, sortDirection]);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (odontologo) => {
    setEditingUser(odontologo);
    setForm({
      nombres: odontologo.nombres || '',
      apellidos: odontologo.apellidos || '',
      correo: odontologo.correo || '',
      contrasena: '',
      colegiatura: odontologo.colegiatura || '',
      especialidad: odontologo.especialidad || '',
      telefono: odontologo.telefono || '',
      activo: Boolean(odontologo.activo)
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      correo: form.correo.trim(),
      colegiatura: form.colegiatura.trim(),
      especialidad: form.especialidad.trim(),
      telefono: form.telefono.trim(),
      activo: form.activo
    };

    if (!editingUser || form.contrasena.trim()) {
      payload.contrasena = form.contrasena.trim();
    }

    try {
      const response = editingUser
        ? await api.put(`/odontologos/${editingUser.id_odontologo}`, payload)
        : await api.post('/odontologos', payload);

      if (response.data?.status === 'success') {
        await fetchOdontologos();
        closeModal();
      } else {
        setError(response.data?.message || 'No se pudo guardar el odontólogo.');
      }
    } catch (requestError) {
      const message = requestError?.response?.data?.message || 'No se pudo guardar el odontólogo.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (odontologo) => {
    try {
      const response = await api.patch(`/odontologos/${odontologo.id_odontologo}/estado`, {
        activo: !odontologo.activo
      });

      if (response.data?.status === 'success') {
        fetchOdontologos();
      } else {
        setError(response.data?.message || 'No se pudo actualizar el estado.');
      }
    } catch (requestError) {
      const message = requestError?.response?.data?.message || 'No se pudo actualizar el estado.';
      setError(message);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection(key === 'activo' ? 'desc' : 'asc');
  };

  const sortIndicator = (key) => (
    <ArrowUpDown className={`w-4 h-4 ${sortKey === key ? 'text-dentBlue-900' : 'text-gray-400'}`} />
  );

  return (
    <div
      className="flex-1 overflow-auto flex flex-col h-full bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${bgDashboard})` }}
    >
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-8 py-6 shrink-0 z-10 sticky top-0">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dentBlue-900 tracking-tight">Odontólogos del sistema</h1>
            <p className="text-sm text-gray-500 mt-1">
              Administra únicamente el personal odontológico autorizado para usar la plataforma.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-dentBlue-900 text-white font-bold shadow-md hover:bg-dentBlue-800 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo odontólogo
          </button>
        </div>
      </header>

      <div className="relative flex-1 overflow-auto p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="bg-white/90 backdrop-blur-md border border-dentBlue-900/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Total odontólogos</p>
              <div className="w-10 h-10 rounded-xl bg-dentBlue-50 flex items-center justify-center text-dentBlue-900">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-dentBlue-900">{metrics.total}</p>
            <p className="text-sm text-gray-500 mt-2">Cuentas registradas en el sistema.</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md border border-dentBlue-900/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Activos</p>
              <div className="w-10 h-10 rounded-xl bg-dentGreen-50 flex items-center justify-center text-dentGreen-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-dentBlue-900">{metrics.activos}</p>
            <p className="text-sm text-gray-500 mt-2">Odontólogos disponibles para iniciar sesión.</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md border border-dentBlue-900/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Inactivos</p>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-dentBlue-900">{metrics.inactivos}</p>
            <p className="text-sm text-gray-500 mt-2">Cuentas suspendidas temporalmente.</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md border border-dentBlue-900/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Especialidades</p>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-dentBlue-900">{metrics.especialistas}</p>
            <p className="text-sm text-gray-500 mt-2">Áreas clínicas distintas registradas.</p>
          </div>
        </div>

        <section className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="relative w-full xl:max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombres, apellidos, correo, colegiatura o especialidad..."
                className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50/60 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-all shadow-sm text-sm font-medium"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setShowInactive((current) => !current)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                  showInactive
                    ? 'bg-dentBlue-900 text-white border-dentBlue-900 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {showInactive ? 'Ocultar inactivos' : 'Mostrar inactivos'}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm">
            {error}
          </div>
        )}

        <section className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-dentBlue-900">Listado de odontólogos</h2>
              <p className="text-sm text-gray-500">Solo se muestran cuentas de odontólogos registrados en el sistema.</p>
            </div>
            <div className="text-sm text-gray-500 font-medium">
              {sortedOdontologos.length} resultado{sortedOdontologos.length !== 1 && 's'}
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-10 h-10 text-dentBlue-900 animate-spin mb-4" />
              <p className="font-medium">Cargando odontólogos...</p>
            </div>
          ) : sortedOdontologos.length === 0 ? (
            <div className="px-6 py-16 text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                <UserCog className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No hay odontólogos para mostrar</h3>
              <p className="mt-1">Prueba cambiando el filtro o crea una nueva cuenta.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th scope="col" className="px-5 py-4 text-left">
                      <button type="button" onClick={() => handleSort('nombre_completo')} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-dentBlue-900 transition-colors">
                        Odontólogo {sortIndicator('nombre_completo')}
                      </button>
                    </th>
                    <th scope="col" className="px-5 py-4 text-left">
                      <button type="button" onClick={() => handleSort('correo')} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-dentBlue-900 transition-colors">
                        Contacto {sortIndicator('correo')}
                      </button>
                    </th>
                    <th scope="col" className="px-5 py-4 text-left">
                      <button type="button" onClick={() => handleSort('especialidad')} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-dentBlue-900 transition-colors">
                        Perfil clínico {sortIndicator('especialidad')}
                      </button>
                    </th>
                    <th scope="col" className="px-5 py-4 text-center">
                      <button type="button" onClick={() => handleSort('activo')} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-dentBlue-900 transition-colors">
                        Estado {sortIndicator('activo')}
                      </button>
                    </th>
                    <th scope="col" className="px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {sortedOdontologos.map((odontologo) => (
                    <tr key={odontologo.id_odontologo} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-dentBlue-900 text-white flex items-center justify-center shadow-sm shrink-0">
                            <Stethoscope className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">{odontologo.nombres} {odontologo.apellidos}</p>
                            <p className="text-sm text-gray-500 truncate">Colegiatura {odontologo.colegiatura || 'No registrada'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="truncate">{odontologo.correo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{odontologo.telefono || 'Sin teléfono'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-2">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dentBlue-50 text-dentBlue-900 text-xs font-bold border border-dentBlue-100">
                            <BadgeCheck className="w-3.5 h-3.5" />
                            {odontologo.especialidad || 'Especialidad general'}
                          </span>
                          <p className="text-xs text-gray-500 max-w-[20rem]">
                            El acceso y la visibilidad clínica se mantienen ligados a la cuenta de odontólogo.
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top text-center">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                          odontologo.activo
                            ? 'bg-green-50 text-green-700 border-green-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {odontologo.activo ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {odontologo.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(odontologo)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-dentBlue-900/30 hover:text-dentBlue-900 hover:bg-dentBlue-50 transition-all text-sm font-semibold"
                          >
                            <Edit3 className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(odontologo)}
                            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
                              odontologo.activo
                                ? 'border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300'
                                : 'border-dentGreen-200 text-dentGreen-700 hover:bg-dentGreen-50 hover:border-dentGreen-300'
                            }`}
                          >
                            {odontologo.activo ? <X className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            {odontologo.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm px-4">
          <div className="w-full max-w-3xl bg-white rounded-[1.75rem] shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-dentBlue-50 to-white">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-dentBlue-100 text-dentBlue-900 text-xs font-bold uppercase tracking-[0.2em] mb-3">
                  <UserCog className="w-3.5 h-3.5" />
                  {editingUser ? 'Editar odontólogo' : 'Nuevo odontólogo'}
                </div>
                <h3 className="text-2xl font-extrabold text-dentBlue-900 tracking-tight">
                  {editingUser ? 'Actualizar datos clínicos' : 'Registrar odontólogo'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Mantén la ficha profesional alineada con la identidad visual del sistema.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-10 h-10 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-gray-700">Nombres</span>
                  <input
                    type="text"
                    name="nombres"
                    value={form.nombres}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-all"
                    placeholder="Nombres"
                  />
                </label>
                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-gray-700">Apellidos</span>
                  <input
                    type="text"
                    name="apellidos"
                    value={form.apellidos}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-all"
                    placeholder="Apellidos"
                  />
                </label>
                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-gray-700">Correo</span>
                  <input
                    type="email"
                    name="correo"
                    value={form.correo}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-all"
                    placeholder="correo@clinica.com"
                  />
                </label>
                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-gray-700">Contraseña {editingUser && <span className="text-gray-400 font-medium">(opcional)</span>}</span>
                  <input
                    type="password"
                    name="contrasena"
                    value={form.contrasena}
                    onChange={handleInputChange}
                    required={!editingUser}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-all"
                    placeholder={editingUser ? 'Dejar en blanco para mantener' : 'Crear contraseña'}
                  />
                </label>
                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-gray-700">Colegiatura <span className="text-gray-400 font-medium">(opcional)</span></span>
                  <input
                    type="text"
                    name="colegiatura"
                    value={form.colegiatura}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-all"
                    placeholder="N. colegiatura"
                  />
                </label>
                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-gray-700">Teléfono</span>
                  <input
                    type="text"
                    name="telefono"
                    value={form.telefono}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-all"
                    placeholder="987 654 321"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="block text-sm font-semibold text-gray-700">Especialidad</span>
                  <input
                    type="text"
                    name="especialidad"
                    value={form.especialidad}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-all"
                    placeholder="Endodoncia, Ortodoncia, Odontopediatría..."
                  />
                </label>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2 flex-wrap">
                <label className="inline-flex items-center gap-3 text-sm font-semibold text-gray-700 select-none">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={form.activo}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 text-dentBlue-900 focus:ring-dentBlue-900"
                  />
                  Cuenta activa
                </label>

                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-dentBlue-900 text-white font-bold shadow-md hover:bg-dentBlue-800 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Guardando' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
