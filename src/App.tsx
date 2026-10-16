import React, { useState } from 'react';
import { useAgenda } from './context/AgendaContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HoyView } from './views/HoyView';
import { SemanaView } from './views/SemanaView';
import { CajaView } from './views/CajaView';
import { ServiciosView } from './views/ServiciosView';
import { NuevaCitaModal } from './components/NuevaCitaModal';
import { ReprogramarModal } from './components/ReprogramarModal';
import { Cita } from './types';

export const AppContent: React.FC = () => {
  const { vistaActiva } = useAgenda();
  const [modalNuevaCita, setModalNuevaCita] = useState(false);
  const [citaReprogramar, setCitaReprogramar] = useState<Cita | null>(null);

  return (
    <div className="min-h-screen bg-[#f6f6f7] text-zinc-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Cabecera común fija */}
      <Header onAbrirNuevaCita={() => setModalNuevaCita(true)} />

      {/* Contenedor principal con ancho tipo smartphone / libreta */}
      <main className="flex-1 max-w-lg mx-auto w-full px-3.5 pt-3 pb-8">
        {vistaActiva === 'hoy' && (
          <HoyView
            onAbrirNuevaCita={() => setModalNuevaCita(true)}
            onReprogramar={(cita) => setCitaReprogramar(cita)}
          />
        )}

        {vistaActiva === 'semana' && (
          <SemanaView
            onAbrirNuevaCita={() => setModalNuevaCita(true)}
            onReprogramar={(cita) => setCitaReprogramar(cita)}
          />
        )}

        {vistaActiva === 'caja' && <CajaView />}

        {vistaActiva === 'servicios' && <ServiciosView />}
      </main>

      {/* Modales */}
      {modalNuevaCita && (
        <NuevaCitaModal
          isOpen={modalNuevaCita}
          onClose={() => setModalNuevaCita(false)}
        />
      )}

      {citaReprogramar && (
        <ReprogramarModal
          cita={citaReprogramar}
          onClose={() => setCitaReprogramar(null)}
        />
      )}

      {/* Navegación inferior ergonómica y minimalista */}
      <BottomNav />
    </div>
  );
};

export default AppContent;
