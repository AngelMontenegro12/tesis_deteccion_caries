import React, { useState, useMemo, useEffect } from 'react';
import { Search, Loader2, ChevronLeft, ChevronRight, CheckCircle, LayoutGrid, Table as TableIcon, List, Columns, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import PatientCard from '../components/PatientCard';
import PatientSlideOver from '../components/PatientSlideOver';
import ModalEditarPaciente from '../components/ModalEditarPaciente';
import ModalFinalizacion from '../components/ModalFinalizacion';
import bgDashboard from '../assets/fondo_dashboard_2.png';

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
  
  // Slide Over State
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Add Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successProgress, setSuccessProgress] = useState(0);

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
  const currentPatients = sortedPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getKanbanColumn = (p) => {
    if (!p.ultima_atencion) return 'Nuevos';
    if (p.evaluacion_pendiente) return 'Diagnóstico Pendiente';
    // Lógica mock si no hay estado_tratamiento real en los datos (par/impar para que haya vista)
    return p.id_paciente % 2 === 0 ? 'En Control' : 'En Tratamiento';
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

          <div className="inline-flex items-center gap-3 self-start lg:self-auto bg-dentBlue-50 border border-dentBlue-100 rounded-2xl px-4 py-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-dentBlue-900 font-extrabold shadow-sm border border-dentBlue-100">
              {patients.length}
            </div>
            <div>
              <p className="text-xs font-extrabold text-dentBlue-900 uppercase tracking-widest">Total pacientes</p>
              <p className="text-sm text-gray-600 font-medium">Pacientes activos cargados en el sistema</p>
            </div>
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
                placeholder="Buscar por nombres, apellidos o DNI..."
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
              <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm overflow-hidden shrink-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-6 py-4 font-bold text-sm text-gray-500 uppercase cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => requestSort('nombres')}>
                          <div className="flex items-center text-xs tracking-wider">Paciente {getSortIcon('nombres')}</div>
                        </th>
                        <th className="px-6 py-4 font-bold text-sm text-gray-500 uppercase cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => requestSort('dni')}>
                          <div className="flex items-center text-xs tracking-wider">DNI {getSortIcon('dni')}</div>
                        </th>
                        <th className="px-6 py-4 font-bold text-sm text-gray-500 uppercase cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => requestSort('edad')}>
                          <div className="flex items-center text-xs tracking-wider">Edad {getSortIcon('edad')}</div>
                        </th>
                        <th className="px-6 py-4 font-bold text-sm text-gray-500 uppercase cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => requestSort('ultima_atencion')}>
                          <div className="flex items-center text-xs tracking-wider">Última Atención {getSortIcon('ultima_atencion')}</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentPatients.map((patient) => (
                        <tr key={patient.id_paciente} className={`transition-colors cursor-pointer group ${patient.evaluacion_pendiente ? 'bg-amber-50/40 hover:bg-amber-50/80' : 'hover:bg-gray-50/50 bg-white'}`} onClick={() => handleCardClick(patient)}>
                          <td className="px-6 py-4 relative">
                            {patient.evaluacion_pendiente && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                            )}
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              {patient.nombres} {patient.apellidos}
                              {patient.evaluacion_pendiente && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 shadow-sm border border-amber-200/50">Dx Pendiente</span>
                              )}
                            </div>
                            {getAge(patient.fecha_nacimiento) < 18 && patient.apoderado && (
                              <div className="text-xs text-gray-400 mt-0.5">Apod: {patient.apoderado}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-medium">{patient.dni}</td>
                          <td className="px-6 py-4 text-gray-600">{getAge(patient.fecha_nacimiento)} años</td>
                          <td className="px-6 py-4 text-gray-600 font-medium">
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
                  <div key={patient.id_paciente} onClick={() => handleCardClick(patient)} className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-dentGreen-500 cursor-pointer transition-all duration-300 flex items-center justify-between gap-6 relative overflow-hidden">
                    {patient.evaluacion_pendiente && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-500"></div>
                    )}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-dentBlue-100 to-dentBlue-50 flex items-center justify-center text-dentBlue-900 font-extrabold text-lg flex-shrink-0 shadow-inner">
                        {patient.nombres.charAt(0)}{patient.apellidos.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-gray-800">{patient.nombres} {patient.apellidos}</h3>
                        <p className="text-sm font-medium text-gray-400">DNI: <span className="text-gray-500">{patient.dni}</span> | {getAge(patient.fecha_nacimiento)} años</p>
                      </div>
                    </div>
                    {patient.evaluacion_pendiente && (
                      <span className="hidden md:inline-flex px-3 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        Eval. Pendiente
                      </span>
                    )}
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Última Atención</p>
                      <p className="text-sm font-bold text-gray-700">{patient.ultima_atencion ? patient.ultima_atencion.split('-').reverse().join('-') : 'Ninguna'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'kanban' && (
              <div className="flex gap-6 overflow-x-auto pb-4 h-full min-h-[500px] snap-x shrink-0">
                {['Nuevos', 'Diagnóstico Pendiente', 'En Tratamiento', 'En Control'].map(col => (
                  <div key={col} className="flex-1 min-w-[280px] w-72 bg-gray-100/50 rounded-2xl flex flex-col snap-center border border-gray-200/60 p-4">
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h3 className="font-extrabold text-gray-700 text-sm uppercase tracking-wider">{col}</h3>
                      <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {currentPatients.filter(p => getKanbanColumn(p) === col).length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
                      {currentPatients.filter(p => getKanbanColumn(p) === col).map(patient => (
                        <div key={patient.id_paciente} onClick={() => handleCardClick(patient)} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 hover:border-dentGreen-500 group relative">
                          {patient.evaluacion_pendiente && (
                            <div className="absolute top-0 right-0 left-0 h-1 bg-amber-400 rounded-t-xl opacity-70"></div>
                          )}
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-gray-800 text-sm leading-tight">{patient.nombres} <br/> {patient.apellidos}</p>
                            <div className="w-8 h-8 rounded-full bg-dentBlue-50 flex items-center justify-center text-dentBlue-900 font-bold text-xs flex-shrink-0">
                               {patient.nombres.charAt(0)}{patient.apellidos.charAt(0)}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 font-medium mt-1 border-t border-gray-50 pt-2">
                            Últ: {patient.ultima_atencion ? patient.ultima_atencion.split('-').reverse().join('-') : 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Controles de Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-10 mb-4 gap-4 shrink-0">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full text-gray-500 hover:text-dentBlue-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-sm font-bold text-gray-700 bg-white/90 backdrop-blur-sm border border-gray-200 px-5 py-2.5 rounded-2xl shadow-sm">
                  Página {currentPage} de {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full text-gray-500 hover:text-dentBlue-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
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

      {/* Modal de Éxito de Edición */}
      <ModalFinalizacion
        isOpen={showSuccessModal}
        progress={successProgress}
        title="¡Paciente actualizado!"
        message={`Los datos de ${selectedPatient?.nombres || ''} se actualizaron correctamente.`}
      />

    </div>
  );
};

export default ListaPacientes;