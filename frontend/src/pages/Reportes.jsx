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
import ReporteIndividual from '../components/ReporteIndividual';

const REPORT_OPTIONS = [
  {
    id: 'ia_rendimiento',
    title: 'Precisión y Rendimiento de IA',
    icon: Sparkles
  },
  {
    id: 'epidemiologico_caries',
    title: 'Epidemiológico de Caries',
    icon: FlaskConical
  },
  {
    id: 'productividad_clinica',
    title: 'Productividad Clínica',
    icon: CircleGauge
  },
  {
    id: 'diagnostico_individual',
    title: 'Evolución del Paciente',
    icon: FileText
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

      <div className="max-lg:overflow-x-auto">
        <div className="relative h-[360px] pt-4 pb-10 max-lg:min-w-[560px]">
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
    </div>
  );
};

const SmoothedAreaChart = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
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

  // Create path for area (with spline curve)
  const linePath = points.map((p, i) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const pPrev = points[i - 1];
    const midX = (pPrev.x + p.x) / 2;
    return `C ${midX},${pPrev.y} ${midX},${p.y} ${p.x},${p.y}`;
  }).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`;

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
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
        <path d={linePath} fill="none" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points (Visual) */}
        {points.map((p, i) => (
          <circle 
            key={`point-${i}`} 
            cx={p.x} 
            cy={p.y} 
            r={hoveredPoint === i ? "6" : "4"} 
            fill={hoveredPoint === i ? "#0EA5E9" : "white"} 
            stroke="#0EA5E9" 
            strokeWidth={hoveredPoint === i ? "3" : "2"}
            className="transition-all duration-200 pointer-events-none"
          />
        ))}

        {/* Hit areas for easier hovering */}
        {points.map((p, i) => (
          <circle
            key={`hit-${i}`}
            cx={p.x}
            cy={p.y}
            r="20"
            fill="transparent"
            onMouseEnter={() => setHoveredPoint(i)}
            onMouseLeave={() => setHoveredPoint(null)}
            className="cursor-pointer outline-none"
          />
        ))}

        {/* Labels X (simplified) */}
        {safeData.map((d, i) => {
          if (i % Math.ceil(safeData.length / 6) !== 0 && i !== safeData.length - 1) return null;
          return (
            <text key={`label-${i}`} x={points[i].x} y={height - 15} fontSize="10" fill="#94A3B8" textAnchor="middle" fontWeight="bold">
              {d.fecha.split('-').slice(1).reverse().join('/')}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredPoint !== null && (
        <div 
          className="absolute z-10 bg-white/95 backdrop-blur-md border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl px-4 py-3 pointer-events-none transform -translate-x-1/2 -translate-y-[calc(100%+12px)] transition-all duration-200 ease-out"
          style={{ left: `${(points[hoveredPoint].x / width) * 100}%`, top: `${(points[hoveredPoint].y / height) * 100}%` }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">
            {safeData[hoveredPoint].fecha.split('-').reverse().join('/')}
          </p>
          <p className="text-xl font-extrabold text-dentBlue-900 leading-none">
            {safeData[hoveredPoint].cantidad} <span className="text-xs font-medium text-gray-500">evals</span>
          </p>
        </div>
      )}
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

const getVisitColor = (tipo) => {
  const t = tipo?.toLowerCase() || '';
  if (t.includes('primera')) return '#38BDF8';
  if (t.includes('control')) return '#10B981';
  if (t.includes('urgencia')) return '#F43F5E';
  return '#8B5CF6';
};

const DonutVisitChart = ({ data, total }) => {
  const thickness = 24;
  const safeTotal = Math.max(Number(total || 0), 0);
  let accumulated = 0;
  
  const sortedData = [...(data || [])].sort((a,b) => b.cantidad - a.cantidad);

  const segments = sortedData.map((item) => {
    const ratio = safeTotal ? Number(item.cantidad || 0) / safeTotal : 0;
    const start = accumulated;
    const end = accumulated + ratio * 100;
    accumulated = end;
    return `${getVisitColor(item.tipo)} ${start}% ${end}%`;
  });

  const background = safeTotal ? `conic-gradient(${segments.join(', ')})` : 'conic-gradient(#E5E7EB 0% 100%)';

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: 200, height: 200 }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background,
            WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`,
            mask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`
          }}
        />
        <div className="absolute inset-[18px] rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)] flex flex-col items-center justify-center text-center px-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">Total</p>
          <p className="mt-1 text-4xl font-extrabold text-dentBlue-900 leading-none">{safeTotal}</p>
          <p className="mt-1 text-xs text-gray-500">visitas</p>
        </div>
      </div>
      <div className="mt-8 w-full space-y-3">
        {sortedData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: getVisitColor(item.tipo) }}></span>
              <span className="text-dentBlue-900 font-bold capitalize">{item.tipo || 'Desconocido'}</span>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-dentBlue-900 block">{item.cantidad}</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold">{safeTotal ? Math.round((item.cantidad / safeTotal) * 100) : 0}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Reportes = () => {
  const navigate = useNavigate();
  const [activeReport, setActiveReport] = useState(() => {
    return localStorage.getItem('reportes_activeTab') || 'ia_rendimiento';
  });

  useEffect(() => {
    localStorage.setItem('reportes_activeTab', activeReport);
  }, [activeReport]);

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
        const endpoint = REPORT_ENDPOINTS[activeReport];

        if (!endpoint) {
          setReportData(null);
          return;
        }

        const response = await api.get(endpoint);

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
    <div className="flex-1 overflow-auto flex flex-col h-full bg-cover bg-center bg-no-repeat bg-fixed max-lg:bg-scroll" style={{ backgroundImage: `url(${bgDashboard})` }}>
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-8 py-6 max-lg:px-4 max-lg:py-4 shrink-0 z-10 sticky top-0">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl max-lg:text-xl font-bold text-dentBlue-900 tracking-tight">Estadísticas y reportes</h1>
            <p className="text-sm text-gray-500 mt-1">Métricas clínicas y de IA con un diseño limpio, sobrio y orientado a la lectura rápida.</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-dentBlue-900 text-white font-bold shadow-md hover:bg-dentBlue-800 hover:shadow-lg transition-all max-lg:w-full"
          >
            <ArrowUpRight className="w-4 h-4" />
            Ir al dashboard
          </button>
        </div>
      </header>

      <div className="relative flex-1 overflow-auto p-8 max-lg:p-4 space-y-6 max-lg:space-y-4">
        <nav className="flex flex-wrap items-center gap-2 max-lg:gap-1.5 p-1.5 bg-white/60 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm w-full">
          {REPORT_OPTIONS.map((item) => {
            const Icon = item.icon;
            const isActive = activeReport === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveReport(item.id)}
                className={`flex flex-1 justify-center items-center gap-2.5 max-lg:gap-1.5 max-lg:min-w-0 px-6 max-lg:px-3 py-3 rounded-xl text-sm max-lg:text-xs font-extrabold transition-all duration-300 ${
                  isActive
                    ? 'bg-dentBlue-900 text-white shadow-md transform scale-[1.02]'
                    : 'text-gray-500 hover:bg-white hover:text-dentBlue-900 hover:shadow-sm'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white/90' : 'text-gray-400'}`} />
                {item.title}
              </button>
            );
          })}
        </nav>

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
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 max-lg:p-5">
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

              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 max-lg:p-5">
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
        ) : activeReport === 'productividad_clinica' ? (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Total Evaluaciones</p>
                <div className="mt-3 text-3xl font-extrabold text-dentBlue-900">{loading ? '—' : Number(reportData?.total_general || 0)}</div>
                <p className="mt-2 text-sm text-gray-500">Evaluaciones clínicas procesadas en total.</p>
              </div>
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Especialistas Activos</p>
                <div className="mt-3 text-3xl font-extrabold text-dentBlue-900">{loading ? '—' : (reportData?.especialistas?.length || 0)}</div>
                <p className="mt-2 text-sm text-gray-500">Odontólogos con evaluaciones registradas.</p>
              </div>
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Promedio Evaluaciones/Médico</p>
                <div className="mt-3 text-3xl font-extrabold text-dentBlue-900">{loading ? '—' : (reportData?.especialistas?.length ? (Number(reportData?.total_general || 0) / reportData.especialistas.length).toFixed(1) : 0)}</div>
                <p className="mt-2 text-sm text-gray-500">Volumen promedio por especialista.</p>
              </div>
            </section>
            
            <section className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
              <div className="space-y-6">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 max-lg:p-5">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Tendencia de Evaluaciones</p>
                      <h3 className="mt-1 text-xl font-extrabold text-dentBlue-900 tracking-tight">Volumen de Actividad</h3>
                      <p className="mt-2 text-sm text-gray-500">Muestra la cantidad de pacientes y evaluaciones procesadas a lo largo del tiempo reciente.</p>
                    </div>
                  </div>
                  <SmoothedAreaChart data={reportData?.tendencia} />
                </div>

                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 max-lg:p-5 overflow-hidden">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Rendimiento por Especialista</p>
                      <h3 className="mt-1 text-xl font-extrabold text-dentBlue-900 tracking-tight">Carga de Trabajo</h3>
                      <p className="mt-2 text-sm text-gray-500">Odontólogos más activos y estado de sus evaluaciones.</p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto max-lg:hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-[0.1em] text-gray-400">
                          <th className="pb-3 font-semibold">Odontólogo</th>
                          <th className="pb-3 font-semibold text-center">Especialidad</th>
                          <th className="pb-3 font-semibold text-center">Completadas</th>
                          <th className="pb-3 font-semibold text-center">En progreso</th>
                          <th className="pb-3 font-semibold text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(reportData?.especialistas || []).map((doc) => {
                          const pendientes = doc.total_evaluaciones - doc.completadas;
                          const hasPendientes = pendientes > 0;
                          return (
                            <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 pr-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-dentBlue-100 text-dentBlue-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    {doc.nombre.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                                  </div>
                                  <span className="font-bold text-dentBlue-900 whitespace-nowrap">{doc.nombre}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center text-sm text-gray-500 font-medium">
                                {doc.especialidad}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-dentGreen-50 text-dentGreen-700">
                                  {doc.completadas}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                {hasPendientes ? (
                                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600">
                                    {pendientes} pendientes
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs font-medium">—</span>
                                )}
                              </td>
                              <td className="py-4 pl-4 text-right">
                                <span className="text-lg font-extrabold text-dentBlue-900">{doc.total_evaluaciones}</span>
                              </td>
                            </tr>
                          );
                        })}
                        {(!reportData?.especialistas || reportData.especialistas.length === 0) && (
                          <tr>
                            <td colSpan="5" className="py-8 text-center text-gray-500 text-sm">
                              No hay especialistas registrados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista de tarjetas para móvil (la tabla se mantiene intacta en escritorio) */}
                  <div className="lg:hidden space-y-3">
                    {(reportData?.especialistas || []).map((doc) => {
                      const pendientes = doc.total_evaluaciones - doc.completadas;
                      const hasPendientes = pendientes > 0;
                      return (
                        <div key={doc.id} className="rounded-xl border border-gray-100 p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-dentBlue-100 text-dentBlue-900 flex items-center justify-center font-bold text-sm shrink-0">
                              {doc.nombre.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-dentBlue-900 break-words">{doc.nombre}</p>
                              <p className="text-xs text-gray-500 break-words">{doc.especialidad}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-extrabold text-dentBlue-900">{doc.total_evaluaciones}</p>
                              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-bold">Total</p>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-dentGreen-50 text-dentGreen-700">
                              {doc.completadas} completadas
                            </span>
                            {hasPendientes && (
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600">
                                {pendientes} pendientes
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {(!reportData?.especialistas || reportData.especialistas.length === 0) && (
                      <p className="py-6 text-center text-gray-500 text-sm">No hay especialistas registrados.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 max-lg:p-5 h-fit">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Distribución</p>
                    <h3 className="mt-1 text-xl font-extrabold text-dentBlue-900 tracking-tight">Tipos de Visita</h3>
                  </div>
                </div>
                <DonutVisitChart data={reportData?.tipos_visita} total={reportData?.total_general} />
              </div>
            </section>
          </>
        ) : activeReport === 'diagnostico_individual' ? (
          <ReporteIndividual />
        ) : activeReport !== 'ia_rendimiento' ? (
            <section className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-8 max-lg:p-6 min-h-[340px] flex items-center justify-center text-center">
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
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 max-lg:p-5">
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

              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 max-lg:p-5">
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