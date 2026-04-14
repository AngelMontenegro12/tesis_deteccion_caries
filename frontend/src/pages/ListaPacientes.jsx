import React, { useState, useMemo, useEffect } from 'react';
import { Search, Loader2, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import PatientCard from '../components/PatientCard';
import PatientSlideOver from '../components/PatientSlideOver';
import ModalEditarPaciente from '../components/ModalEditarPaciente';
import ModalFinalizacion from '../components/ModalFinalizacion';

const ListaPacientes = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  
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
  const filters = ['Todos', 'Con Diagnóstico Pendiente', 'Menores de edad', 'Atendidos este mes'];

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
        if (activeFilter === 'Con Diagnóstico Pendiente') {
          return p.evaluacion_pendiente;
        }
        if (activeFilter === 'Menores de edad') {
          return getAge(p.fecha_nacimiento) < 18;
        }
        if (activeFilter === 'Atendidos este mes') {
          // Asumimos "este mes" según la fecha actual
          const thisMonth = new Date().toISOString().substring(0, 7); 
          if (!p.ultima_atencion) return false;
          return p.ultima_atencion.startsWith(thisMonth);
        }
        return true;
      });
    }

    return result;
  }, [searchTerm, activeFilter, patients]);

  // Resetear página al filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter]);

  // Lógica de Paginación
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const currentPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    <div className="flex-1 flex flex-col h-full bg-gray-50/50">
      
      {/* Cabecera y Filtros "Pill" (Minimalismo puro) */}
      <header className="px-8 py-8 bg-white border-b border-gray-100 shrink-0 z-10 sticky top-0">
        <h1 className="text-3xl font-extrabold text-dentBlue-900 tracking-tight mb-6">
          Gestión de Pacientes
        </h1>
        
        {/* Buscador Universal Ancho */}
        <div className="relative max-w-3xl mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-4 border border-gray-200 rounded-2xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-dentBlue-900/20 focus:border-dentBlue-900 transition-all shadow-sm text-base font-medium"
            placeholder="Buscar por nombres, apellidos o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtros Inteligentes (Chips/Pills) */}
        <div className="flex flex-wrap items-center gap-3">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 border ${
                activeFilter === filter
                  ? 'bg-dentGreen-500 border-dentGreen-500 text-white shadow-md shadow-dentGreen-500/20 transform scale-[1.02]'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      {/* Grid de Pacientes */}
      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="flex flex-col flex-1 items-center justify-center p-12">
            <Loader2 className="w-12 h-12 text-dentBlue-900 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-dentBlue-900">Cargando pacientes...</h3>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No se encontraron pacientes</h3>
            <p className="text-gray-500 mt-1">Intenta con otros términos o limpia los filtros de búsqueda.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentPatients.map(patient => (
                <PatientCard 
                  key={patient.id_paciente} 
                  patient={patient} 
                  onClick={handleCardClick}
                />
              ))}
            </div>

            {/* Controles de Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-10 mb-4 gap-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-dentBlue-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-sm font-medium text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-2xl">
                  Página {currentPage} de {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-dentBlue-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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