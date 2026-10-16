import React from 'react';
import { useAgenda } from '../context/AgendaContext';
import { formatearFechaHumana, getFechaHoyLocal } from '../utils/formatters';
import { Plus } from 'lucide-react';

export const Header: React.FC<{ onAbrirNuevaCita: () => void }> = ({ onAbrirNuevaCita }) => {
  const {
    fechaSeleccionada,
  } = useAgenda();

  const esHoy = fechaSeleccionada === getFechaHoyLocal();

  return (
    <header className="bg-[#78350f] text-white pt-4 pb-5 px-4 rounded-b-[28px] shadow-md max-w-lg mx-auto w-full transition-all">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-amber-200/80 uppercase">
            Mi Panel
          </span>

          <h1 className="text-lg font-bold tracking-tight mt-0.5 flex items-center gap-1.5">
            <span>Hola, Barbero</span>
            <span className="text-amber-300">✂️</span>
          </h1>

          <p className="text-xs text-amber-100/70 capitalize mt-0.5">
            {esHoy ? `Hoy • ${formatearFechaHumana(fechaSeleccionada)}` : formatearFechaHumana(fechaSeleccionada)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAbrirNuevaCita}
            className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Cita</span>
          </button>
        </div>
      </div>
    </header>
  );
};
