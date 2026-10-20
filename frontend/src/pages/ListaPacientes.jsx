import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Loader2, ChevronLeft, ChevronRight, ArrowRight, CheckCircle, LayoutGrid, Table as TableIcon, List, Columns, ArrowUpDown, ChevronUp, ChevronDown, UserPlus } from 'lucide-react';
import PatientCard from '../components/PatientCard';
import PatientSlideOver from '../components/PatientSlideOver';
import ModalEditarPaciente from '../components/ModalEditarPaciente';
import ModalNuevoPaciente from '../components/ModalNuevoPaciente';
import ModalFinalizacion from '../components/ModalFinalizacion';
import bgDashboard from '../assets/fondo_dashboard_2.png';

const KANBAN_COLUMNS = ['Nuevos', 'Diagnóstico Pendiente', 'En Tratamiento', 'En Control'];
const KANBAN_ITEMS_PER_PAGE = 6;

const getKanbanColumn = (patient) => {
  if (!patient.ultima_atencion) return 'Nuevos';
  if (patient.evaluacion_pendiente) return 'Diagnóstico Pendiente';
  // Mantener la clasificación actual cuando no existe un estado de tratamiento.
  return patient.id_paciente % 2 === 0 ? 'En Control' : 'En Tratamiento';
};

const getPaginationItems = (current, total, compact = false) => {
  const visibleLimit = compact ? 5 : 7;
  if (total <= visibleLimit) return Array.from({ length: total }, (_, index) => index + 1);
  if (compact) {
    if (current <= 3) return [1, 2, 3, 'end', total];
    if (current >= total - 2) return [1, 'start', total - 2, total - 1, total];
    return [1, 'start', current, 'end', total];
  }
  if (current <= 4) return [1, 2, 3, 4, 5, 'end', total];
  if (current >= total - 3) return [1, 'start', total - 4, total - 3, total - 2, total - 1, total];
  return [1, 'start', current - 1, current, current + 1, 'end', total];
};

const ListaPacientes = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  
  // View Modes - persistencia
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('pacientesViewMode') || 'grid';
  }); 
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Guardar la vista cada vez que cambie
  useEffect(() => {
    localStorage.setItem('pacientesViewMode', viewMode);
  }, [viewMode]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [kanbanPages, setKanbanPages] = useState(() => Object.fromEntries(KANBAN_COLUMNS.map(col => [col, 1])));
  const [pageInput, setPageInput] = useState('');
  const [pageInputError, setPageInputError] = useState('');
  const kanbanScrollRefs = useRef({});
  
  // Slide Over State
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Add Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successProgress, setSuccessProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/pacientes');
        if (response.ok) {
          const data = await response.json();
          setPatients(data);
        }
      } catch (error) {
        console.error("Error cargando pacientes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Helper para edad
  const getAge = (dateStr) => {
    if (!dateStr) return 0;
    const today = new Date();
    const birthDate = new Date(dateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  // Filtros "Pill"
  const filters = ['Todos', 'Con Diagnóstico Pendiente', 'Menores de edad', 'Mayores de edad', 'Nuevos Pacientes', 'Atendidos este mes', 'Urgencias', 'Controles de rutina'];

  const filteredPatients = useMemo(() => {
    let result = patients;

    // 1. Filtrado por Búsqueda (Search)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => {
        const fullName = `${p.nombres} ${p.apellidos}`.toLowerCase();
        return fullName.includes(term) || (p.dni && p.dni.includes(term));
      });
    }

    // 2. Filtrado por Pills
    if (activeFilter !== 'Todos') {
      result = result.filter(p => {
        // --- Diagnósticos/Estado ---
        if (activeFilter === 'Con Diagnóstico Pendiente') {
          return p.evaluacion_pendiente;
        }
        if (activeFilter === 'Atendidos este mes') {
          const thisMonth = new Date().toISOString().substring(0, 7); 
          if (!p.ultima_atencion) return false;
          return p.ultima_atencion.startsWith(thisMonth);
        }
        if (activeFilter === 'Urgencias') {
          return p.evaluaciones && p.evaluaciones.length > 0 && p.evaluaciones[0].tipo_visita === 'Urgencia';
        }
        if (activeFilter === 'Controles de rutina') {
          return p.evaluaciones && p.evaluaciones.length > 0 && p.evaluaciones[0].tipo_visita === 'Control rutina';
        }
        
        // --- Paciente ---
        if (activeFilter === 'Menores de edad') {
          return getAge(p.fecha_nacimiento) < 18;
        }
        if (activeFilter === 'Mayores de edad') {
          return getAge(p.fecha_nacimiento) >= 18;
        }
        if (activeFilter === 'Nuevos Pacientes') {
          // Filtrado por creados en los últimos 30 días
          if (!p.creado_en && !p.fecha_registro) return false;
          const createdDate = new Date(p.creado_en || p.fecha_registro);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return createdDate >= thirtyDaysAgo;
        }
        
        return true;
      });
    }

    return result;
  }, [searchTerm, activeFilter, patients]);

  // Resetear página al filtrar
  useEffect(() => {
    setCurrentPage(1);
    setKanbanPages(Object.fromEntries(KANBAN_COLUMNS.map(col => [col, 1])));
    setPageInput('');
    setPageInputError('');
    Object.values(kanbanScrollRefs.current).forEach(element => {
      if (element) element.scrollTop = 0;
    });
  }, [searchTerm, activeFilter, viewMode]);

  // Lógica de Ordenamiento (Sorting)
  const sortedPatients = useMemo(() => {
    let sortableItems = [...filteredPatients];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Excepción paramétrica para nombres completos si así se quisiera (se puede usar nomes/aps directos)
        if (sortConfig.key === 'edad') {
          aValue = getAge(a.fecha_nacimiento);
          bValue = getAge(b.fecha_nacimiento);
        }
        
        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredPatients, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // Helper para pintar iconitos de Sort
  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1 text-dentBlue-900" /> : <ChevronDown className="w-4 h-4 ml-1 text-dentBlue-900" />;
  };

  // Lógica de Paginación
  const totalPages = Math.ceil(sortedPatients.length / itemsPerPage);
  const visiblePage = Math.min(currentPage, Math.max(1, totalPages));
  const currentPatients = sortedPatients.slice(
    (visiblePage - 1) * itemsPerPage,
    visiblePage * itemsPerPage
  );

  const kanbanColumns = useMemo(() => {
    const columns = Object.fromEntries(KANBAN_COLUMNS.map(col => [col, []]));
    sortedPatients.forEach(patient => columns[getKanbanColumn(patient)].push(patient));
    return columns;
  }, [sortedPatients]);

  useEffect(() => {
    setCurrentPage(previous => Math.min(previous, Math.max(1, totalPages)));
    setPageInput('');
    setPageInputError('');
  }, [totalPages]);

  useEffect(() => {
    setKanbanPages(previous => {
      const next = { ...previous };
      let changed = false;
      KANBAN_COLUMNS.forEach(col => {
        const lastPage = Math.max(1, Math.ceil(kanbanColumns[col].length / KANBAN_ITEMS_PER_PAGE));
        if (next[col] > lastPage) {
          next[col] = lastPage;
          changed = true;
        }
      });
      return changed ? next : previous;
    });
  }, [kanbanColumns]);

  const goToPage = (target) => {
    if (target < 1 || target > totalPages) return;
    setCurrentPage(target);
    setPageInput('');
    setPageInputError('');
  };

  const handlePageJump = (event) => {
    event.preventDefault();
    const target = Number(pageInput);
    if (!/^\d+$/.test(pageInput) || !Number.isSafeInteger(target) || target < 1 || target > totalPages) {
      setPageInputError(`Ingresa una página del 1 al ${totalPages}.`);
      return;
    }
    goToPage(target);
  };

  const goToKanbanPage = (column, target) => {
    const lastPage = Math.ceil(kanbanColumns[column].length / KANBAN_ITEMS_PER_PAGE);
    if (target < 1 || target > lastPage) return;
    if (kanbanScrollRefs.current[column]) kanbanScrollRefs.current[column].scrollTop = 0;
    setKanbanPages(previous => ({ ...previous, [column]: target }));
  };

  const handleCardClick = (patient) => {
    setSelectedPatient(patient);
    setIsSlideOpen(true);
  };

  const handleEditClick = (patient) => {
    setSelectedPatient(patient);
    setIsSlideOpen(false);
    setIsEditModalOpen(true);
  };

  const handleUpdatePatientCallback = (updatedPatient) => {
    setPatients(prev => prev.map(p => p.id_paciente === updatedPatient.id_paciente ? updatedPatient : p));
    setSelectedPatient(updatedPatient);
    
    // Iniciar ModalFinalizacion animation
    setSuccessMessage(`Los datos de ${updatedPatient?.nombres || ''} se actualizaron correctamente.`);
    setShowSuccessModal(true);
    setSuccessProgress(0);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 2;
      setSuccessProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setShowSuccessModal(false);
          setIsEditModalOpen(false); // Make sure edit modal is closed properly
        }, 500);
      }
    }, 20); // 20ms * 50 = 1000ms duration
  };

  const handleCreatePatientCallback = (newPatient) => {
    setPatients(prev => [newPatient, ...prev]);
    
    // Iniciar ModalFinalizacion animation
    setSuccessMessage(`El paciente ${newPatient?.nombres || ''} ha sido registrado correctamente.`);
    setShowSuccessModal(true);
    setSuccessProgress(0);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 2;
      setSuccessProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 500);
      }
    }, 20); // 20ms * 50 = 1000ms duration
  };

  return (
    <div 
      className="flex-1 flex flex-col h-full bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${bgDashboard})` }}
    >
      
      {/* Cabecera y Filtros "Pill" (Minimalismo puro) */}
      <header className="px-8 py-6 bg-white/90 backdrop-blur-sm border-b border-gray-100 shrink-0 z-10 sticky top-0">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dentBlue-900 tracking-tight">Gestión de Pacientes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Visualiza, busca y gestiona los expedientes de todos los pacientes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 self-start lg:self-auto">
            <div className="inline-flex items-center gap-3 bg-dentBlue-50 border border-dentBlue-100 rounded-2xl px-4 py-3 shadow-sm h-full">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-dentBlue-900 font-extrabold shadow-sm border border-dentBlue-100 shrink-0">
                {patients.length}
              </div>
              <div>
                <p className="text-xs font-extrabold text-dentBlue-900 uppercase tracking-widest">Total pacientes</p>
                <p className="text-sm text-gray-600 font-medium">Registrados en el sistema</p>
              </div>
            </div>

            <button 
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-dentBlue-900 text-white font-bold shadow-md hover:bg-dentBlue-800 hover:shadow-lg transition-all h-full"
            >
              <UserPlus className="w-5 h-5 shrink-0" />
              Registrar Paciente
            </button>
          </div>
        </div>
      </header>

      {/* Área de Vistas (Listado / Grid / Tabla / Kanban) */}
      <div className="flex-1 overflow-y-auto p-8 pt-6 flex flex-col gap-6 animate-fade-in-up">
        
        {/* Controles de Búsqueda y Filtros Separados del Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6 w-full">
          
          {/* Fila 1: Buscador y Selector de Vistas */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Buscador */}
            <div className="relative w-full md:max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl leading-5 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-all shadow-sm text-sm font-medium"
                 placeholder="Buscar por nombres, apellidos o DNI (Opcional)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Selector de Vistas (View Toggle) */}
            <div className="flex bg-gray-50 border border-gray-200 rounded-xl p-1 gap-1 shrink-0">
              <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-dentBlue-900 font-bold' : 'text-gray-400 hover:text-gray-700'}`} title="Vista de Cuadrícula">
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow text-dentBlue-900 font-bold' : 'text-gray-400 hover:text-gray-700'}`} title="Vista de Tabla">
                <TableIcon className="w-5 h-5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-dentBlue-900 font-bold' : 'text-gray-400 hover:text-gray-700'}`} title="Vista de Lista Expandida">
                <List className="w-5 h-5" />
              </button>
              <button onClick={() => setViewMode('kanban')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-dentBlue-900 font-bold' : 'text-gray-400 hover:text-gray-700'}`} title="Tablero Kanban">
                <Columns className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fila 2: Filtros Agrupados por Categoría */}
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
            {/* Primer bloque: Filtros Generales y de Paciente */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mr-2 w-24">Pacientes:</span>
              {['Todos', 'Menores de edad', 'Mayores de edad', 'Nuevos Pacientes'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border ${
                    activeFilter === filter
                      ? 'bg-dentGreen-500 border-dentGreen-500 text-white shadow-md shadow-dentGreen-500/20 transform scale-[1.02]'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            {/* Segundo bloque: Filtros Médicos / Diagnósticos */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mr-2 w-24">Diagnósticos:</span>
              {['Con Diagnóstico Pendiente', 'Atendidos este mes', 'Urgencias', 'Controles de rutina'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border ${
                    activeFilter === filter
                      ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20 transform scale-[1.02]'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENIDO (Grillas / Tablas) */}
        {loading ? (
          <div className="flex flex-col flex-1 items-center justify-center p-12">
            <Loader2 className="w-12 h-12 text-dentBlue-900 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-dentBlue-900">Cargando pacientes...</h3>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No se encontraron pacientes</h3>
            <p className="text-gray-500 mt-1">Intenta con otros términos o limpia los filtros de búsqueda.</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 shrink-0">
                {currentPatients.map(patient => (
                  <PatientCard 
                    key={patient.id_paciente} 
                    patient={patient} 
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            )}

            {viewMode === 'table' && (
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 overflow-hidden shrink-0">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/80">
                  <div>
                    <h3 className="text-base font-bold text-dentBlue-900">Vista de tabla</h3>
                    <p className="text-sm text-gray-500">Listado compacto con ordenamiento por columna.</p>
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    {sortedPatients.length} paciente{sortedPatients.length !== 1 && 's'}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-md">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left">
                          <button
                            type="button"
                            onClick={() => requestSort('nombres')}
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-dentBlue-900 transition-colors"
                          >
                            Paciente {getSortIcon('nombres')}
                          </button>
                        </th>
                        <th scope="col" className="px-6 py-4 text-left">
                          <button
                            type="button"
                            onClick={() => requestSort('dni')}
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-dentBlue-900 transition-colors"
                          >
                            DNI {getSortIcon('dni')}
                          </button>
                        </th>
                        <th scope="col" className="px-6 py-4 text-left">
                          <button
                            type="button"
                            onClick={() => requestSort('edad')}
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-dentBlue-900 transition-colors"
                          >
                            Edad {getSortIcon('edad')}
                          </button>
                        </th>
                        <th scope="col" className="px-6 py-4 text-left">
                          <button
                            type="button"
                            onClick={() => requestSort('ultima_atencion')}
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-dentBlue-900 transition-colors"
                          >
                            Última atención {getSortIcon('ultima_atencion')}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {currentPatients.map((patient) => (
                        <tr
                          key={patient.id_paciente}
                          className={`transition-colors cursor-pointer group ${patient.evaluacion_pendiente ? 'bg-amber-50/40 hover:bg-amber-50/80' : 'hover:bg-gray-50/80'}`}
                          onClick={() => handleCardClick(patient)}
                        >
                          <td className="px-6 py-4 align-top relative">
                            {patient.evaluacion_pendiente && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
                            )}
                            <div className="flex items-start gap-4">
                              <div className="w-11 h-11 rounded-2xl bg-dentBlue-900 text-white flex items-center justify-center shadow-sm shrink-0 font-bold text-sm">
                                {patient.nombres?.charAt(0)}{patient.apellidos?.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-gray-900 flex items-center gap-2 truncate">
                                  <span>{patient.nombres} {patient.apellidos}</span>
                                  {patient.evaluacion_pendiente && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200/60">
                                      Dx pendiente
                                    </span>
                                  )}
                                </div>
                                {getAge(patient.fecha_nacimiento) < 18 && patient.apoderado && (
                                  <div className="text-xs text-gray-500 mt-0.5 truncate">Apoderado: {patient.apoderado}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top text-gray-600 font-medium">{patient.dni || '-'}</td>
                          <td className="px-6 py-4 align-top text-gray-600">{getAge(patient.fecha_nacimiento)} años</td>
                          <td className="px-6 py-4 align-top text-gray-600 font-medium">
                            {patient.ultima_atencion ? patient.ultima_atencion.split('-').reverse().join('-') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewMode === 'list' && (
              <div className="flex flex-col gap-4 shrink-0">
                {currentPatients.map(patient => (
                  <div
                    key={patient.id_paciente}
                    onClick={() => handleCardClick(patient)}
                    className="group relative overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white/95 px-5 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-dentBlue-900/20 hover:bg-dentBlue-50/20 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] cursor-pointer"
                  >
                    {patient.evaluacion_pendiente && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
                    )}

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-dentBlue-900 text-white flex items-center justify-center font-extrabold text-lg flex-shrink-0 shadow-md shadow-dentBlue-900/10">
                          {patient.nombres.charAt(0)}{patient.apellidos.charAt(0)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start gap-3">
                            <h3 className="text-lg font-extrabold text-dentBlue-900 leading-tight">
                              {patient.nombres} {patient.apellidos}
                            </h3>
                            {patient.evaluacion_pendiente && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                Pendiente
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span className="inline-flex items-center gap-2">
                              <span className="font-semibold text-gray-700">DNI:</span>
                              <span>{patient.dni || '-'}</span>
                            </span>
                            <span className="hidden sm:inline-flex h-1 w-1 rounded-full bg-gray-300" />
                            <span>{getAge(patient.fecha_nacimiento)} años</span>
                          </div>

                          {getAge(patient.fecha_nacimiento) < 18 && patient.apoderado && (
                            <p className="mt-2 text-sm text-gray-500">
                              <span className="font-semibold text-dentBlue-900">Apoderado:</span> {patient.apoderado}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="lg:text-right lg:pl-6 lg:border-l lg:border-gray-100 flex items-center lg:items-end justify-between lg:justify-end gap-4 lg:pr-2">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-1">Última atención</p>
                          <p className="text-sm font-semibold text-gray-700">
                            {patient.ultima_atencion ? patient.ultima_atencion.split('-').reverse().join('-') : 'Ninguna'}
                          </p>
                        </div>

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition-all group-hover:border-dentBlue-900 group-hover:bg-dentBlue-900 group-hover:text-white group-hover:shadow-[0_10px_24px_rgba(15,59,76,0.2)] group-hover:ring-4 group-hover:ring-dentBlue-900/10">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'kanban' && (
              <div className="flex gap-5 overflow-x-auto pb-4 h-full min-h-[540px] snap-x shrink-0">
                {KANBAN_COLUMNS.map(col => {
                  const columnPatients = kanbanColumns[col];
                  const columnPages = Math.ceil(columnPatients.length / KANBAN_ITEMS_PER_PAGE);
                  const columnPage = Math.min(kanbanPages[col] || 1, Math.max(1, columnPages));
                  const visiblePatients = columnPatients.slice((columnPage - 1) * KANBAN_ITEMS_PER_PAGE, columnPage * KANBAN_ITEMS_PER_PAGE);
                  return (
                    <div key={col} className="flex-1 min-w-[290px] w-72 rounded-[1.5rem] border border-gray-200 bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgba(15,23,42,0.04)] flex flex-col snap-center overflow-hidden">
                    <div className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/70 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Columna</p>
                          <h3 className="mt-1 text-sm font-extrabold text-dentBlue-900">{col}</h3>
                        </div>
                        <span className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold text-gray-600 shadow-sm">
                          {columnPatients.length}
                        </span>
                      </div>
                    </div>
                    <div ref={element => { kanbanScrollRefs.current[col] = element; }} className="flex flex-col gap-3 flex-1 overflow-y-auto p-4">
                      {visiblePatients.map(patient => (
                        <div key={patient.id_paciente} onClick={() => handleCardClick(patient)} className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-dentBlue-900/20 hover:bg-dentBlue-50/20 hover:shadow-[0_0_0_1px_rgba(15,59,76,0.08),0_14px_30px_rgba(15,23,42,0.06)] cursor-pointer">
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-dentBlue-900/0 via-white/0 to-dentGreen-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:from-dentBlue-900/[0.06] group-hover:via-white/0 group-hover:to-dentGreen-500/[0.08]" />
                          {patient.evaluacion_pendiente && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
                          )}
                          <div className="relative flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-dentBlue-900 text-xs font-extrabold text-white shadow-sm">
                               {patient.nombres.charAt(0)}{patient.apellidos.charAt(0)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start gap-2">
                                <p className="text-sm font-extrabold leading-tight text-dentBlue-900">
                                  {patient.nombres} {patient.apellidos}
                                </p>
                                {patient.evaluacion_pendiente && (
                                  <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                                    Pendiente
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-xs font-medium text-gray-500">
                                Última: <span className="font-semibold text-gray-700">{patient.ultima_atencion ? patient.ultima_atencion.split('-').reverse().join('-') : 'N/A'}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {columnPages > 1 && (
                      <div className="shrink-0 border-t border-gray-100 bg-gray-50/70 px-3 py-3">
                        <p className="mb-2 text-center text-[11px] text-gray-500">
                          Mostrando <span className="font-semibold text-gray-700">{(columnPage - 1) * KANBAN_ITEMS_PER_PAGE + 1}–{Math.min(columnPage * KANBAN_ITEMS_PER_PAGE, columnPatients.length)}</span> de <span className="font-semibold text-gray-700">{columnPatients.length}</span>
                        </p>
                        <nav className="flex items-center justify-center gap-1" aria-label={`Páginas de ${col}`}>
                          <button
                            type="button"
                            onClick={() => goToKanbanPage(col, columnPage - 1)}
                            disabled={columnPage === 1}
                            aria-label={`Página anterior de ${col}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-dentBlue-900/30 hover:bg-dentBlue-50 hover:text-dentBlue-900 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {getPaginationItems(columnPage, columnPages, true).map(item =>
                            typeof item === 'number' ? (
                              <button
                                key={item}
                                type="button"
                                onClick={() => goToKanbanPage(col, item)}
                                aria-label={`Página ${item} de ${col}`}
                                aria-current={columnPage === item ? 'page' : undefined}
                                className={`flex h-8 min-w-[30px] shrink-0 items-center justify-center rounded-lg px-1 text-xs font-semibold transition-colors ${columnPage === item ? 'bg-dentBlue-900 text-white shadow-sm' : 'text-gray-600 hover:bg-dentBlue-50 hover:text-dentBlue-900'}`}
                              >
                                {item}
                              </button>
                            ) : (
                              <span key={item} aria-hidden="true" className="flex h-8 w-3 shrink-0 items-center justify-center text-xs text-gray-400">…</span>
                            )
                          )}
                          <button
                            type="button"
                            onClick={() => goToKanbanPage(col, columnPage + 1)}
                            disabled={columnPage === columnPages}
                            aria-label={`Página siguiente de ${col}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-dentBlue-900/30 hover:bg-dentBlue-50 hover:text-dentBlue-900 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </nav>
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Paginación compartida de cuadrícula, tabla y lista */}
            {viewMode !== 'kanban' && (
              <div className="shrink-0 rounded-2xl border border-gray-200 bg-white/95 px-5 py-4 shadow-sm sm:px-6">
                <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between lg:gap-5">
                  <p className="text-center text-sm text-gray-500 lg:text-left">
                    Mostrando <span className="font-semibold text-gray-800">{(visiblePage - 1) * itemsPerPage + 1}–{Math.min(visiblePage * itemsPerPage, sortedPatients.length)}</span> de <span className="font-semibold text-gray-800">{sortedPatients.length}</span> pacientes
                  </p>
                  {totalPages > 1 && (
                    <div className="flex max-w-full flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-end lg:ml-auto">
                      <nav className="flex max-w-full items-center gap-1 overflow-x-auto pb-1" aria-label="Páginas de pacientes">
                        <button
                          type="button"
                          onClick={() => goToPage(visiblePage - 1)}
                          disabled={visiblePage <= 1}
                          aria-label="Página anterior"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-dentBlue-900/30 hover:bg-dentBlue-50 hover:text-dentBlue-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {getPaginationItems(visiblePage, totalPages).map(item =>
                          typeof item === 'number' ? (
                            <button
                              key={item}
                              type="button"
                              onClick={() => goToPage(item)}
                              aria-label={`Página ${item}`}
                              aria-current={visiblePage === item ? 'page' : undefined}
                              className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors ${visiblePage === item ? 'bg-dentBlue-900 text-white shadow-sm' : 'text-gray-600 hover:bg-dentBlue-50 hover:text-dentBlue-900'}`}
                            >
                              {item}
                            </button>
                          ) : (
                            <span key={item} aria-hidden="true" className="flex h-9 w-6 shrink-0 items-center justify-center text-sm text-gray-400">…</span>
                          )
                        )}
                        <button
                          type="button"
                          onClick={() => goToPage(visiblePage + 1)}
                          disabled={visiblePage >= totalPages}
                          aria-label="Página siguiente"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-dentBlue-900/30 hover:bg-dentBlue-50 hover:text-dentBlue-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </nav>
                      <form onSubmit={handlePageJump} className="flex flex-col items-center gap-1 lg:items-end">
                        <div className="flex items-center gap-2">
                          <label htmlFor="pacientes-page-jump" className="whitespace-nowrap text-xs font-medium text-gray-500">Ir a página</label>
                          <input
                            id="pacientes-page-jump"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={pageInput}
                            onChange={(event) => {
                              if (/^\d*$/.test(event.target.value) && event.target.value.length <= String(totalPages).length) {
                                setPageInput(event.target.value);
                                setPageInputError('');
                              }
                            }}
                            placeholder="#"
                            aria-invalid={Boolean(pageInputError)}
                            aria-describedby={pageInputError ? 'pacientes-page-error' : undefined}
                            className={`h-9 w-12 rounded-lg border bg-gray-50 text-center text-sm font-medium text-gray-800 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-dentBlue-900/10 ${pageInputError ? 'border-red-400' : 'border-gray-200 focus:border-dentBlue-900'}`}
                          />
                          <button
                            type="submit"
                            aria-label="Ir a la página indicada"
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-dentBlue-900 text-white transition-colors hover:bg-dentBlue-800"
                          >
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                        {pageInputError && <span id="pacientes-page-error" role="alert" className="text-xs text-red-600">{pageInputError}</span>}
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Slide-over Drawer (Panel Lateral) */}
      <PatientSlideOver 
        isOpen={isSlideOpen} 
        onClose={() => setIsSlideOpen(false)} 
        patient={selectedPatient}
        onEdit={handleEditClick}
      />

      {/* Modal de Edición */}
      <ModalEditarPaciente
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        patient={selectedPatient}
        onUpdate={handleUpdatePatientCallback}
      />

      {/* Modal de Nuevo Paciente */}
      <ModalNuevoPaciente
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={handleCreatePatientCallback}
      />

      {/* Modal de Éxito de Edición o Creación */}
      <ModalFinalizacion
        isOpen={showSuccessModal}
        progress={successProgress}
        title="¡Operación Exitosa!"
        message={successMessage}
      />

    </div>
  );
};

export default ListaPacientes;
