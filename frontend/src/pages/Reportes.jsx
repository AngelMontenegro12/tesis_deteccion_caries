import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldAlert,
  Sparkles,
  CircleGauge,
  FileText,
  FlaskConical,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import api from '../services/api';
import bgDashboard from '../assets/fondo_dashboard_2.png';

const REPORT_OPTIONS = [
  {
    id: 'ia_rendimiento',
    title: 'Precisión y Rendimiento de IA',
    subtitle: 'Confianza media y tasa de rechazo clínica.',
    active: true
  },
  {
    id: 'epidemiologico_caries',
    title: 'Epidemiológico de Caries',
    subtitle: 'Severidad histórica, incidencia por edad y carga de enfermedad.',
    active: true
  },
  {
    id: 'productividad_clinica',
    title: 'Productividad Clínica',
    subtitle: 'Tendencia de evaluaciones y carga por especialista.',
    active: true
  },
  {
    id: 'diagnostico_individual',
    title: 'Diagnóstico Individual',
    subtitle: 'Próximamente: reportes por paciente y casos.',
    active: false
  }
];

const formatPercent = (value, decimals = 1) => `${Number(value || 0).toFixed(decimals)}%`;

const REPORT_ENDPOINTS = {
  ia_rendimiento: '/reportes/ia-rendimiento',
  epidemiologico_caries: '/reportes/epidemiologico-caries',
  productividad_clinica: '/reportes/productividad-clinica'
};

const SEVERITY_LEGEND = [
  { key: 'incipiente', label: 'Incipiente', color: '#16A34A' },
  { key: 'moderada', label: 'Moderada (Profunda)', color: '#F59E0B' },
  { key: 'avanzada', label: 'Avanzada (Periapical)', color: '#EF4444' }
];

const DonutSeverityChart = ({ data, total }) => {
  const thickness = 24;
  const safeTotal = Math.max(Number(total || 0), 0);
  let accumulated = 0;
  const segments = (data || []).map((item) => {
    const ratio = safeTotal ? Number(item.cantidad || 0) / safeTotal : 0;
    const start = accumulated;
    const end = accumulated + ratio * 100;
    accumulated = end;
    return `${item.color} ${start}% ${end}%`;
  });

  const background = safeTotal ? `conic-gradient(${segments.join(', ')})` : 'conic-gradient(#E5E7EB 0% 100%)';

  return (
    <div className="flex items-center justify-center">
      <div className="relative" style={{ width: 240, height: 240 }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background,
            WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`,
            mask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`
          }}
        />
        <div className="absolute inset-[18px] rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)] flex flex-col items-center justify-center text-center px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">Lesiones</p>
          <p className="mt-2 text-4xl font-extrabold text-dentBlue-900 leading-none">{safeTotal}</p>
          <p className="mt-2 text-sm text-gray-500">cargadas históricamente</p>
        </div>
      </div>
    </div>
  );
};

const GroupedAgeBarChart = ({ data }) => {
  const raw = data || [];

  if (!raw.length) {
    return (
      <div className="h-full min-h-[320px] flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 text-gray-500 text-sm">
        No hay datos suficientes para mostrar incidencia por edad.
      </div>
    );
  }

  // Detectar si los datos vienen por edad exacta y si hay muchas edades distintas
  const hasEdad = raw.every((it) => it.edad !== undefined && it.edad !== null);
  let grouped = [];

    if (hasEdad) {
    // Definimos 5 grupos etarios: niños, adolescentes, adultos jóvenes, adultos, mayores
    const binsDef = [
      { label: '0-9 (Niños)', min: 0, max: 9 },
      { label: '10-17 (Adol.)', min: 10, max: 17 },
      { label: '18-34 (Adultos jóvenes)', min: 18, max: 34 },
      { label: '35-54 (Adultos)', min: 35, max: 54 },
      { label: '55+ (Mayores)', min: 55, max: 200 }
    ];

    const bins = binsDef.map((b) => ({ ...b, incipiente: 0, moderada: 0, avanzada: 0, total: 0 }));

    raw.forEach((it) => {
      const age = Number(it.edad);
      const bin = bins.find((bb) => age >= bb.min && age <= bb.max) || bins[bins.length - 1];
      bin.incipiente += Number(it.incipiente || 0);
      bin.moderada += Number(it.moderada || 0);
      bin.avanzada += Number(it.avanzada || 0);
      bin.total += Number(it.total || 0);
    });

    grouped = bins.map((b) => ({ label: b.label, incipiente: b.incipiente, moderada: b.moderada, avanzada: b.avanzada, total: b.total }));
  } else {
    // Si ya vienen agrupados con 'label' o 'rango'
    grouped = raw.map((it) => ({ label: it.label || it.rango || '—', incipiente: Number(it.incipiente || 0), moderada: Number(it.moderada || 0), avanzada: Number(it.avanzada || 0), total: Number(it.total || 0) }));
  }

  const maxValue = Math.max(1, ...grouped.flatMap((item) => [Number(item.incipiente || 0), Number(item.moderada || 0), Number(item.avanzada || 0)]));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
        {SEVERITY_LEGEND.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      <div className="relative h-[360px] pt-4 pb-10">
        <div className="absolute left-0 right-0 bottom-10 h-px bg-gray-200" />
        <div className="relative z-10 flex items-end gap-4 h-full">
          {grouped.map((item) => (
            <div key={item.label} className="flex-1 min-w-[70px] flex flex-col items-center justify-end h-full">
              <div className="flex items-end justify-center gap-1.5 h-full w-full max-h-[270px]">
                {SEVERITY_LEGEND.map((severity) => {
                  const value = Number(item[severity.key] || 0);
                  const height = value ? Math.max((value / maxValue) * 230, 12) : 3;
                  return (
                    <div
                      key={severity.key}
                      className="w-4 rounded-t-xl shadow-sm"
                      style={{ height: `${height}px`, backgroundColor: severity.color }}
                      title={`${severity.label}: ${value}`}
                    />
                  );
                })}
              </div>
              <div className="mt-3 text-center">
                <p className="text-sm font-bold text-dentBlue-900">{item.label}</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mt-1">{item.total} lesiones</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SmoothedAreaChart = ({ data }) => {
  const safeData = data || [];
  const height = 240;
  const width = 800;
  const padding = 40;

  if (!safeData.length) {
    return (
      <div className="h-[240px] flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 text-gray-500 text-sm">
        No hay datos suficientes para mostrar la tendencia.
      </div>
    );
  }

  const maxValue = Math.max(5, ...safeData.map((d) => d.cantidad));
  const points = safeData.map((d, i) => ({
    x: padding + (i * (width - 2 * padding)) / (safeData.length - 1 || 1),
    y: height - padding - ((d.cantidad / maxValue) * (height - 2 * padding))
  }));

  // Create path for area (with gradient)
  const linePath = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`), '');
  const areaPath = `${linePath} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`;

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F3B4C" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0F3B4C" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => {
          const y = height - padding - v * (height - 2 * padding);
          return <line key={v} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />;
        })}

        {/* The Area */}
        <path d={areaPath} fill="url(#areaGradient)" />
        
        {/* The Line */}
        <path d={linePath} fill="none" stroke="#0F3B4C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#0F3B4C" strokeWidth="2" />
        ))}

        {/* Labels X (simplified) */}
        {safeData.map((d, i) => {
          if (i % Math.ceil(safeData.length / 6) !== 0 && i !== safeData.length - 1) return null;
          return (
            <text key={i} x={points[i].x} y={height - 15} fontSize="10" fill="#94A3B8" textAnchor="middle" fontWeight="bold">
              {d.fecha.split('-').slice(1).reverse().join('/')}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

const RadialProgress = ({ value }) => {
  const size = 180;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));
  const dashOffset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 drop-shadow-sm">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(148, 163, 184, 0.18)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#reportRadialBlue)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
        <defs>
          <linearGradient id="reportRadialBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F3B4C" />
            <stop offset="55%" stopColor="#2A7A8C" />
            <stop offset="100%" stopColor="#13B8A6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Válidas</span>
        <span className="mt-2 text-3xl font-extrabold text-dentBlue-900 leading-none">{formatPercent(safeValue, 0)}</span>
        <span className="mt-1 text-[11px] font-medium text-gray-500 leading-none">del total procesado</span>
      </div>
    </div>
  );
};

const Reportes = () => {
  const navigate = useNavigate();
  const [activeReport, setActiveReport] = useState('ia_rendimiento');
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [hoveredInsight, setHoveredInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchReport = async () => {
      try {
        setLoading(true);
        setError('');
        setSelectedInsight(null);
        setHoveredInsight(null);
        const savedUser = localStorage.getItem('user');
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
        const idOdontologo = parsedUser?.id_odontologo || 1;
        const endpoint = REPORT_ENDPOINTS[activeReport];

        if (!endpoint) {
          setReportData(null);
          return;
        }

        const response = await api.get(endpoint, {
          params: { id_odontologo: idOdontologo }
        });

        if (!cancelled && response.data?.status === 'success') {
          setReportData(response.data.data);
        } else if (!cancelled) {
          setError('No se pudo cargar el reporte de IA.');
        }
      } catch (requestError) {
        if (!cancelled) {
          console.error('Error cargando reportes', requestError);
          setError('No se pudo cargar el reporte de IA.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchReport();
    return () => {
      cancelled = true;
    };
  }, [activeReport]);

  const kpis = useMemo(() => {
    const confianzaMedia = Number(reportData?.confianza_media_validos || 0) * 100;
    const aceptacion = Number(reportData?.aceptacion_clinica || 0);
    const rechazo = Number(reportData?.tasa_rechazo_filtro || 0);

    return [
      {
        key: 'total_detecciones',
        title: 'Confianza media',
        value: formatPercent(confianzaMedia, 1),
        hint: 'Promedio de confianza global.'
      },
      {
        key: 'detecciones_validas',
        title: 'Aceptación clínica',
        value: formatPercent(aceptacion, 0),
        hint: 'Resultado útil tras pasar el filtro de validación.'
      },
      {
        key: 'detecciones_rechazadas',
        title: 'Tasa de rechazo',
        value: formatPercent(rechazo, 0),
        hint: 'Errores o registros con confianza 0. (Imágenes erroneas)'
      }
    ];
  }, [reportData]);

  const activeReportConfig = REPORT_OPTIONS.find((item) => item.id === activeReport) || REPORT_OPTIONS[0];
  const activeInsight = hoveredInsight || selectedInsight;
  const epidemiologicalSeverity = reportData?.distribucion_severidad || [];
  const epidemiologicalIncidence = reportData?.incidencia_por_edad || [];

  return (
    <div className="flex-1 overflow-auto flex flex-col h-full bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: `url(${bgDashboard})` }}>
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-8 py-6 shrink-0 z-10 sticky top-0">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dentBlue-900 tracking-tight">Estadísticas y reportes</h1>
            <p className="text-sm text-gray-500 mt-1">Métricas clínicas y de IA con un diseño limpio, sobrio y orientado a la lectura rápida.</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-dentBlue-900 text-white font-bold shadow-md hover:bg-dentBlue-800 hover:shadow-lg transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            Ir al dashboard
          </button>
        </div>
      </header>

      <div className="relative flex-1 overflow-auto p-8 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {REPORT_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveReport(item.id)}
              className={`text-left rounded-[1.35rem] border p-4 transition-all duration-300 shadow-sm backdrop-blur-sm ${
                activeReport === item.id
                  ? 'bg-white border-dentBlue-900/20 ring-2 ring-dentBlue-900/10 shadow-[0_14px_40px_rgba(15,23,42,0.06)]'
                  : 'bg-white/80 border-gray-200 hover:border-dentBlue-900/15 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Reporte</p>
                  <h2 className="text-sm font-extrabold leading-tight text-dentBlue-900">{item.title}</h2>
                </div>
                <div className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${activeReport === item.id ? 'bg-dentBlue-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">{item.subtitle}</p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                <span className={`h-1.5 w-1.5 rounded-full ${item.active ? 'bg-dentGreen-500' : 'bg-amber-400'}`} />
                {item.active ? 'Disponible' : 'Próximamente'}
              </div>
            </button>
          ))}
        </section>

        {activeReport === 'epidemiologico_caries' ? (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Lesiones históricas</p>
                <div className="mt-3 text-3xl font-extrabold text-dentBlue-900">{loading ? '—' : Number(reportData?.total_lesiones || 0)}</div>
                <p className="mt-2 text-sm text-gray-500">Total de caries clasificadas y procesadas históricamente.</p>
              </div>
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Pacientes evaluados</p>
                <div className="mt-3 text-3xl font-extrabold text-dentBlue-900">{loading ? '—' : Number(reportData?.pacientes_evaluados || 0)}</div>
                <p className="mt-2 text-sm text-gray-500">Pacientes únicos cruzados con detecciones cariosas.</p>
              </div>
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Edad media</p>
                <div className="mt-3 text-3xl font-extrabold text-dentBlue-900">{loading ? '—' : (() => {
                  const inc = reportData?.incidencia_por_edad || [];
                  const total = (inc || []).reduce((s, r) => s + Number(r.total || 0), 0);
                  if (!total) return '—';
                  const avg = (inc || []).reduce((s, r) => s + Number(r.edad || 0) * Number(r.total || 0), 0) / total;
                  return Number(avg).toFixed(1);
                })()}</div>
                <p className="mt-2 text-sm text-gray-500">Edad media estimada de pacientes con lesiones (por lesiones).</p>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-[0.82fr_1.18fr] gap-6">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Distribución de severidad</p>
                    <h3 className="mt-1 text-xl font-extrabold text-dentBlue-900 tracking-tight">Caries históricas</h3>
                    <p className="mt-2 text-sm text-gray-500">Anillo delgado con colores semánticos para leer rápidamente la gravedad general.</p>
                  </div>
                </div>

                <DonutSeverityChart data={epidemiologicalSeverity} total={reportData?.total_lesiones || 0} />

                <div className="mt-6 space-y-3">
                  {epidemiologicalSeverity.map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-dentBlue-900 truncate">{item.label}</p>
                          <p className="text-xs text-gray-500">Severidad clínica</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-dentBlue-900">{item.cantidad}</p>
                        <p className="text-xs text-gray-500">{formatPercent(item.porcentaje, 1)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Incidencia por edad</p>
                    <h3 className="mt-1 text-xl font-extrabold text-dentBlue-900 tracking-tight">Severidad vs edad</h3>
                    <p className="mt-2 text-sm text-gray-500">Barras agrupadas sin cuadrícula, para leer el comportamiento de la caries por edad exacta del paciente.</p>
                  </div>
                </div>

                <GroupedAgeBarChart data={epidemiologicalIncidence} />
              </div>
            </section>
          </>
        ) : activeReport !== 'ia_rendimiento' ? (
          <section className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-8 min-h-[340px] flex items-center justify-center text-center">
            <div className="max-w-xl">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                <FlaskConical className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-dentBlue-900 tracking-tight">{activeReportConfig.title}</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">Este módulo está previsto para una siguiente fase. Mantendrá la misma línea visual y se conectará a la base de datos cuando esté listo.</p>
            </div>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {kpis.map((kpi) => (
                <button
                  key={kpi.title}
                  type="button"
                  onMouseEnter={() => setHoveredInsight(kpi.key)}
                  onMouseLeave={() => setHoveredInsight(null)}
                  onFocus={() => setHoveredInsight(kpi.key)}
                  onBlur={() => setHoveredInsight(null)}
                  onClick={() => setSelectedInsight(kpi.key)}
                  className={`text-left bg-white/95 backdrop-blur-md rounded-2xl border shadow-sm p-5 transition-all duration-300 ${
                    activeInsight === kpi.key
                      ? 'border-dentBlue-900/25 ring-2 ring-dentBlue-900/10 shadow-[0_14px_40px_rgba(15,23,42,0.06)]'
                      : 'border-gray-200 hover:border-dentBlue-900/20 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">{kpi.title}</p>
                    <div className="w-10 h-10 rounded-xl bg-dentBlue-50 flex items-center justify-center text-dentBlue-900">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-dentBlue-900 tracking-tight">{loading ? '—' : kpi.value}</div>
                  <p className="mt-2 text-sm text-gray-500">{kpi.hint}</p>
                </button>
              ))}
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Indicador radial</p>
                    <h3 className="mt-1 text-xl font-extrabold text-dentBlue-900 tracking-tight">Detecciones válidas</h3>
                    <p className="mt-2 text-sm text-gray-500">Anillo azul que muestra el porcentaje de detecciones válidas que sí son útiles clínicamente, es decir, las que superan la validación y provienen de imágenes correctas.</p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-dentBlue-50 flex items-center justify-center text-dentBlue-900">
                    <CircleGauge className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                  <RadialProgress value={reportData?.aceptacion_clinica || 0} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full xl:max-w-md">
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredInsight('total_detecciones')}
                      onMouseLeave={() => setHoveredInsight(null)}
                      onFocus={() => setHoveredInsight('total_detecciones')}
                      onBlur={() => setHoveredInsight(null)}
                      onClick={() => setSelectedInsight('total_detecciones')}
                      className={`text-left rounded-2xl border p-4 transition-all duration-300 ${activeInsight === 'total_detecciones' ? 'border-dentBlue-900/25 bg-dentBlue-50/70 ring-2 ring-dentBlue-900/10' : 'border-gray-200 bg-gray-50/70 hover:border-dentBlue-900/20 hover:bg-white'}`}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Total detecciones</p>
                      <p className="mt-2 text-2xl font-extrabold text-dentBlue-900">{loading ? '—' : Number(reportData?.total_resultados || 0)}</p>
                    </button>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredInsight('detecciones_validas')}
                      onMouseLeave={() => setHoveredInsight(null)}
                      onFocus={() => setHoveredInsight('detecciones_validas')}
                      onBlur={() => setHoveredInsight(null)}
                      onClick={() => setSelectedInsight('detecciones_validas')}
                      className={`text-left rounded-2xl border p-4 transition-all duration-300 ${activeInsight === 'detecciones_validas' ? 'border-dentBlue-900/25 bg-dentGreen-50/60 ring-2 ring-dentBlue-900/10' : 'border-gray-200 bg-gray-50/70 hover:border-dentBlue-900/20 hover:bg-white'}`}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Detecciones válidas</p>
                      <p className="mt-2 text-2xl font-extrabold text-dentBlue-900">{loading ? '—' : Number(reportData?.resultados_validos || 0)}</p>
                    </button>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredInsight('detecciones_rechazadas')}
                      onMouseLeave={() => setHoveredInsight(null)}
                      onFocus={() => setHoveredInsight('detecciones_rechazadas')}
                      onBlur={() => setHoveredInsight(null)}
                      onClick={() => setSelectedInsight('detecciones_rechazadas')}
                      className={`text-left rounded-2xl border p-4 transition-all duration-300 ${activeInsight === 'detecciones_rechazadas' ? 'border-dentBlue-900/25 bg-amber-50/70 ring-2 ring-dentBlue-900/10' : 'border-gray-200 bg-gray-50/70 hover:border-dentBlue-900/20 hover:bg-white'}`}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Detecciones rechazadas</p>
                      <p className="mt-2 text-2xl font-extrabold text-dentBlue-900">{loading ? '—' : Number(reportData?.resultados_rechazados || 0)}</p>
                    </button>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredInsight('porcentaje_rechazadas')}
                      onMouseLeave={() => setHoveredInsight(null)}
                      onFocus={() => setHoveredInsight('porcentaje_rechazadas')}
                      onBlur={() => setHoveredInsight(null)}
                      onClick={() => setSelectedInsight('porcentaje_rechazadas')}
                      className={`text-left rounded-2xl border p-4 transition-all duration-300 ${activeInsight === 'porcentaje_rechazadas' ? 'border-dentBlue-900/25 bg-slate-50/80 ring-2 ring-dentBlue-900/10' : 'border-gray-200 bg-gray-50/70 hover:border-dentBlue-900/20 hover:bg-white'}`}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">% detecciones rechazadas</p>
                      <p className="mt-2 text-2xl font-extrabold text-dentBlue-900">{loading ? '—' : formatPercent(reportData?.tasa_rechazo_filtro || 0, 0)}</p>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Lectura rápida</p>
                    <h3 className="mt-1 text-xl font-extrabold text-dentBlue-900 tracking-tight">Resumen clínico</h3>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-dentBlue-50 flex items-center justify-center text-dentBlue-900">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                </div>

                {loading ? (
                  <div className="flex h-[280px] items-center justify-center text-gray-500">
                    <Loader2 className="w-10 h-10 animate-spin text-dentBlue-900" />
                  </div>
                ) : error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                    {error}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`rounded-2xl border p-4 transition-all duration-300 ${activeInsight === 'total_detecciones' ? 'border-dentBlue-900/25 bg-dentBlue-50/70 ring-2 ring-dentBlue-900/10' : 'border-gray-200 bg-gray-50/70'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-dentBlue-900 text-white">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Total detecciones</p>
                          <p className="text-sm text-gray-600">Suma todas las detecciones analizadas por la IA, tanto las válidas como las rechazadas.</p>
                        </div>
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-4 transition-all duration-300 ${activeInsight === 'detecciones_validas' ? 'border-dentBlue-900/25 bg-dentGreen-50/60 ring-2 ring-dentBlue-900/10' : 'border-gray-200 bg-gray-50/70'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeInsight === 'detecciones_validas' ? 'bg-dentGreen-100 text-dentGreen-700' : 'bg-dentGreen-50 text-dentGreen-600'}`}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Detecciones válidas</p>
                          <p className="text-sm text-gray-600">Son las detecciones generadas cuando se suben imágenes correctas, como radiografías panorámicas, y el filtro las considera aptas para lectura clínica.</p>
                        </div>
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-4 transition-all duration-300 ${activeInsight === 'detecciones_rechazadas' ? 'border-dentBlue-900/25 bg-amber-50/70 ring-2 ring-dentBlue-900/10' : 'border-gray-200 bg-gray-50/70'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeInsight === 'detecciones_rechazadas' ? 'bg-amber-100 text-amber-700' : 'bg-amber-50 text-amber-600'}`}>
                          <Clock3 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Detecciones rechazadas</p>
                          <p className="text-sm text-gray-600">Agrupa los registros descartados por error, por confianza igual a 0 o por subir imágenes erróneas, como archivos que no son radiografías, antes de llegar al informe clínico.</p>
                        </div>
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-4 transition-all duration-300 ${activeInsight === 'porcentaje_rechazadas' ? 'border-dentBlue-900/25 bg-slate-50/80 ring-2 ring-dentBlue-900/10' : 'border-gray-200 bg-gray-50/70'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeInsight === 'porcentaje_rechazadas' ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600'}`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">% detecciones rechazadas</p>
                          <p className="text-sm text-gray-600">Es el porcentaje de detecciones que no pasan la validación y quedan fuera de la lectura clínica.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Reportes;