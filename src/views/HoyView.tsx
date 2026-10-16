import React, { useState } from 'react';
import { useAgenda } from '../context/AgendaContext';
import { CitaCard } from '../components/CitaCard';
import { Cita } from '../types';
import { formatearMonedaRD } from '../utils/formatters';
import { Scissors, DollarSign, Clock, Sparkles, Plus } from 'lucide-react';

interface HoyViewProps {
  onAbrirNuevaCita: () => void;
  onReprogramar: (cita: Cita) => void;
}

export const HoyView: React.FC<HoyViewProps> = ({
  onAbrirNuevaCita,
  onReprogramar,
}) => {
  const { citas, servicios, fechaSeleccionada, setVistaActiva } = useAgenda();
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'en_curso' | 'esperando' | 'completados'>('todos');

  const citasSeguras = Array.isArray(citas) ? citas : [];
  const serviciosSeguros = Array.isArray(servicios) ? servicios : [];
  const citasDelDia = citasSeguras
    .filter((c) => c && c.fecha === fechaSeleccionada)
    .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));

  const turnosReales = citasDelDia.filter((c) => !c.esBloqueo);
  const totalCitas = turnosReales.length;
  const enAtencion = turnosReales.filter((c) => c.estado === 'en_atencion').length;
  const pendientes = turnosReales.filter((c) => c.estado === 'pendiente').length;
  const atendidos = turnosReales.filter((c) => c.estado === 'atendido').length;
  const totalIngresosHoy = turnosReales
    .filter((c) => c.estado === 'atendido')
    .reduce((sum, c) => sum + (c.precioCobradoRD || 0), 0);

  const citasFiltradas = citasDelDia.filter((c) => {
    if (filtroEstado === 'en_curso') return !c.esBloqueo && c.estado === 'en_atencion';
    if (filtroEstado === 'esperando') return !c.esBloqueo && c.estado === 'pendiente';
    if (filtroEstado === 'completados') return !c.esBloqueo && c.estado === 'atendido';
    return true;
  });

  return (
    <div className="space-y-4 pb-24">
      {/* 4 Métricas Rápidas (Cuadrícula 2x2 como en la referencia de Mi Panel) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Tarjeta 1: Turnos Hoy */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold">Turnos Hoy</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <Scissors className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight">
            {totalCitas}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {atendidos} ya completados
          </p>
        </div>

        {/* Tarjeta 2: En Atención (En el sillón) */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold">En Atención</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 tracking-tight">
            {enAtencion}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {enAtencion > 0 ? 'En el sillón ahora' : 'Sillón libre'}
          </p>
        </div>

        {/* Tarjeta 3: Ingresos Hoy */}
        <div
          onClick={() => setVistaActiva('caja')}
          className="bg-white border border-stone-200/80 rounded-2xl p-3.5 shadow-sm cursor-pointer hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold">Ingresos Hoy</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight truncate">
            {formatearMonedaRD(totalIngresosHoy)}
          </div>
          <p className="text-[11px] text-emerald-700/80 font-medium mt-0.5 flex items-center gap-1">
            <span>Ver caja completa →</span>
          </p>
        </div>

        {/* Tarjeta 4: En Espera */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold">En Espera</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">
            {pendientes}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Clientes por atender
          </p>
        </div>
      </div>

      {/* Cabecera de la lista de turnos */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
              <span>Mis Turnos</span>
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-zinc-500">
              <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded-full">
                {pendientes} esperando
              </span>
              {enAtencion > 0 && (
                <span className="bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-full">
                  {enAtencion} en curso
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onAbrirNuevaCita}
            className="text-xs text-amber-900 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>

        {/* Filtros de la cola */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              filtroEstado === 'todos'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-stone-100 text-zinc-600 hover:bg-stone-200'
            }`}
          >
            Todos ({totalCitas})
          </button>
          {enAtencion > 0 && (
            <button
              onClick={() => setFiltroEstado('en_curso')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filtroEstado === 'en_curso'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              En atención ({enAtencion})
            </button>
          )}
          <button
            onClick={() => setFiltroEstado('esperando')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              filtroEstado === 'esperando'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Esperando ({pendientes})
          </button>
          <button
            onClick={() => setFiltroEstado('completados')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              filtroEstado === 'completados'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Completados ({atendidos})
          </button>
        </div>
      </div>

      {/* Lista de Turnos */}
      {citasFiltradas.length > 0 ? (
        <div className="space-y-2.5">
          {citasFiltradas.map((cita) => {
            const servicio = serviciosSeguros.find((s) => s.id === cita.servicioId);
            return (
              <CitaCard
                key={cita.id}
                cita={cita}
                servicio={servicio}
                onReprogramar={onReprogramar}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-white border border-stone-200/80 rounded-2xl shadow-sm">
          <Scissors className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-zinc-800">
            No hay turnos {filtroEstado !== 'todos' ? `${filtroEstado}` : ''}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 mb-4">
            Pulsa el botón para agregar un cliente a tu cola de atención.
          </p>
          <button
            onClick={onAbrirNuevaCita}
            className="bg-[#78350f] hover:bg-[#92400e] text-white font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Turno</span>
          </button>
        </div>
      )}
    </div>
  );
};
