import React, { useState } from 'react';
import { Cita } from '../types';
import { useAgenda } from '../context/AgendaContext';
import { X, Check } from 'lucide-react';

interface ReprogramarModalProps {
  cita: Cita | null;
  onClose: () => void;
}

export const ReprogramarModal: React.FC<ReprogramarModalProps> = ({ cita, onClose }) => {
  const { reprogramarCita } = useAgenda();
  const [nuevaFecha, setNuevaFecha] = useState(cita?.fecha || '');
  const [nuevaHora, setNuevaHora] = useState(cita?.hora || '');

  if (!cita) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reprogramarCita(cita.id, nuevaFecha, nuevaHora);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-sm w-full p-5 text-zinc-900 shadow-2xl font-sans">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Reprogramar Turno
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">{cita.clienteNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Nueva Fecha
            </label>
            <input
              type="date"
              required
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 focus:border-amber-800 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Nueva Hora
            </label>
            <input
              type="time"
              required
              value={nuevaHora}
              onChange={(e) => setNuevaHora(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 focus:border-amber-800 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Cambio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
