import React, { useState } from 'react';
import { Cita } from '../types';
import { useAgenda } from '../context/AgendaContext';
import { X, Check, Trash2 } from 'lucide-react';

interface ReprogramarModalProps {
  cita: Cita | null;
  onClose: () => void;
}

export const ReprogramarModal: React.FC<ReprogramarModalProps> = ({ cita, onClose }) => {
  const { reprogramarCita, eliminarCita } = useAgenda();
  const [nuevaFecha, setNuevaFecha] = useState(cita?.fecha || '');
  const [nuevaHora, setNuevaHora] = useState(cita?.hora || '');
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

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

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Cambio</span>
            </button>

            {confirmandoEliminar ? (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-rose-800">¿Eliminar este turno?</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConfirmandoEliminar(false)}
                    className="px-2.5 py-1 text-xs font-medium text-zinc-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      eliminarCita(cita.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer"
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmandoEliminar(true)}
                className="w-full text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar turno</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
