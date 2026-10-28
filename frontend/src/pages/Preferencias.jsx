import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  Palette,
  RefreshCw,
  Server,
  Shield,
  SlidersHorizontal,
  User,
  XCircle
} from 'lucide-react';
import api from '../services/api';
import { getPreferences, savePreferences } from '../utils/preferences';
import bgDashboard from '../assets/fondo_dashboard_2.png';

const IA_HEALTH_URL = 'http://127.0.0.1:8000/api/health';

const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-dentBlue-900' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  </div>
);

const SectionCard = ({ icon: Icon, iconClassName, title, description, children }) => (
  <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
    <div className="flex items-start gap-3 mb-6">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClassName}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
    </div>
    {children}
  </section>
);

const StatusBadge = ({ state }) => {
  if (state === 'loading') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Verificando
      </span>
    );
  }

  if (state === 'online') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
        <CheckCircle2 className="w-3.5 h-3.5" />
        En línea
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
      <XCircle className="w-3.5 h-3.5" />
      Sin conexión
    </span>
  );
};

const ServiceRow = ({ title, subtitle, service }) => (
  <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
        <Server className="w-4 h-4 text-dentBlue-900" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
        <p className="mt-1 text-xs text-gray-400">{service.message}</p>
      </div>
    </div>
    <StatusBadge state={service.state} />
  </div>
);

const Preferencias = () => {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState(() => getPreferences());
  const [services, setServices] = useState({
    backend: { state: 'loading', message: 'Comprobando conexión con el backend...' },
    ia: { state: 'loading', message: 'Comprobando conexión con el microservicio...' }
  });
  const [checking, setChecking] = useState(false);

  const user = useMemo(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const roleLabel = useMemo(() => {
    if (!user) return 'Sin sesión';
    if (user.id_odontologo === 1) return 'Administrador principal';
    if (user.rol === 'superadmin') return 'Superadministrador';
    if (user.rol === 'admin') return 'Administrador';
    return 'Odontólogo';
  }, [user]);

  const checkServices = useCallback(async () => {
    setChecking(true);
    setServices({
      backend: { state: 'loading', message: 'Comprobando conexión con el backend...' },
      ia: { state: 'loading', message: 'Comprobando conexión con el microservicio...' }
    });

    const backendPromise = api
      .get('/test')
      .then((response) => {
        const ok = response.data?.status === 'success';
        return {
          state: ok ? 'online' : 'offline',
          message: ok
            ? 'API Flask y base de datos MySQL conectadas.'
            : response.data?.message || 'Respuesta inesperada del backend.'
        };
      })
      .catch(() => ({
        state: 'offline',
        message: 'No se pudo conectar con el backend en http://127.0.0.1:5000.'
      }));

    const iaPromise = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(IA_HEALTH_URL, { signal: controller.signal });
        if (!response.ok) {
          return { state: 'offline', message: `El microservicio respondió con HTTP ${response.status}.` };
        }
        const data = await response.json();
        return data?.status === 'ok'
          ? { state: 'online', message: 'Microservicio de detección de caries disponible.' }
          : { state: 'offline', message: 'Respuesta inesperada del microservicio de IA.' };
      } catch {
        return {
          state: 'offline',
          message: 'No se pudo conectar con la API de IA en http://127.0.0.1:8000.'
        };
      } finally {
        clearTimeout(timeout);
      }
    })();

    const [backend, ia] = await Promise.all([backendPromise, iaPromise]);
    setServices({ backend, ia });
    setChecking(false);
  }, []);

  useEffect(() => {
    checkServices();
  }, [checkServices]);

  const handleSidebarToggle = (value) => {
    setPreferences(savePreferences({ sidebarOpen: value }));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
      <div className="flex-none bg-white border-b border-gray-200 px-8 py-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-dentBlue-50 rounded-xl flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5 text-dentBlue-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Preferencias</h1>
            <p className="text-sm text-gray-500">
              Personaliza tu experiencia y revisa el estado de los servicios.
            </p>
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto relative bg-cover bg-center bg-no-repeat p-6 lg:p-10"
        style={{ backgroundImage: `url(${bgDashboard})` }}
      >
        <div className="absolute inset-0 bg-white/40 z-0 pointer-events-none"></div>
        <div className="relative z-10 max-w-5xl mx-auto space-y-6">

          <SectionCard
            icon={Palette}
            iconClassName="bg-indigo-50 text-indigo-600"
            title="Apariencia"
            description="Cómo quieres que se vea el sistema al iniciar sesión."
          >
            <Toggle
              checked={preferences.sidebarOpen}
              onChange={handleSidebarToggle}
              label="Mantener la barra lateral expandida"
              description="Si lo desactivas, el menú lateral se mostrará contraído cada vez que ingreses."
            />
          </SectionCard>

          <SectionCard
            icon={User}
            iconClassName="bg-dentGreen-500/10 text-dentGreen-600"
            title="Cuenta"
            description="Datos de tu cuenta registrados en el sistema."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Correo electrónico</p>
                <p className="mt-1 text-sm font-medium text-gray-900 break-all">
                  {user?.correo || 'No registrado'}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rol</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{roleLabel}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Colegiatura</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {user?.colegiatura || 'No registrada'}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Especialidad</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {user?.especialidad || 'No registrada'}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/perfil')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-dentBlue-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-dentBlue-800"
              >
                <Mail className="w-4 h-4" />
                Editar perfil
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </SectionCard>

          <SectionCard
            icon={Shield}
            iconClassName="bg-orange-50 text-orange-500"
            title="Seguridad"
            description="Actualiza la contraseña de acceso a tu cuenta."
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Cambiar contraseña</p>
                  <p className="text-xs text-gray-500">
                    Por seguridad, la contraseña se actualiza desde tu perfil.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/perfil')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-dentBlue-900 shadow-sm transition-colors hover:bg-gray-50"
              >
                Ir a seguridad
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </SectionCard>

          <SectionCard
            icon={Server}
            iconClassName="bg-sky-50 text-sky-600"
            title="Estado del sistema"
            description="Verifica la conexión con los servicios que usa el sistema."
          >
            <div className="space-y-3">
              <ServiceRow
                title="Backend Flask + MySQL"
                subtitle="http://127.0.0.1:5000/api"
                service={services.backend}
              />
              <ServiceRow
                title="Microservicio de IA"
                subtitle={IA_HEALTH_URL}
                service={services.ia}
              />
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={checkServices}
                disabled={checking}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-dentBlue-900 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                Reintentar
              </button>
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
};

export default Preferencias;
