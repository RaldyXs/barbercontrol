import React, { useState } from 'react';
import { useAgenda } from '../context/AgendaContext';
import { CitaCard } from '../components/CitaCard';
import { Cita } from '../types';
import { formatearFechaHumana, getFechaHoyLocal } from '../utils/formatters';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';

interface SemanaViewProps {
  onAbrirNuevaCita: () => void;
  onReprogramar: (cita: Cita) => void;
}

export const SemanaView: React.FC<SemanaViewProps> = ({
  onAbrirNuevaCita,
  onReprogramar,
}) => {
  const { citas, servicios, fechaSeleccionada, setFechaSeleccionada } = useAgenda();
  const hoyLocal = getFechaHoyLocal();

  const [añoVisual, setAñoVisual] = useState<number>(() => {
    const [y] = (fechaSeleccionada || hoyLocal).split('-').map(Number);
    return y || new Date().getFullYear();
  });
  const [mesVisual, setMesVisual] = useState<number>(() => {
    const [, m] = (fechaSeleccionada || hoyLocal).split('-').map(Number);
    return m ? m - 1 : new Date().getMonth();
  });

  const [modoVista, setModoVista] = useState<'mes' | 'semana'>('mes');

  const nombreMes = new Date(añoVisual, mesVisual, 1).toLocaleDateString('es-DO', {
    month: 'long',
    year: 'numeric',
  });

  const cambiarMes = (delta: number) => {
    let nuevoMes = mesVisual + delta;
    let nuevoAño = añoVisual;
    if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAño += 1;
    } else if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAño -= 1;
    }
    setMesVisual(nuevoMes);
    setAñoVisual(nuevoAño);
  };

  const irAHoy = () => {
    const hoy = new Date();
    setAñoVisual(hoy.getFullYear());
    setMesVisual(hoy.getMonth());
    setFechaSeleccionada(hoyLocal);
  };

  const primerDiaSemana = (new Date(añoVisual, mesVisual, 1).getDay() + 6) % 7;
  const diasEnMes = new Date(añoVisual, mesVisual + 1, 0).getDate();
  const diasMesAnterior = new Date(añoVisual, mesVisual, 0).getDate();

  const celdasCalendario: {
    fechaStr: string;
    numDia: number;
    esMesActual: boolean;
    esHoy: boolean;
    isSelected: boolean;
  }[] = [];

  for (let i = primerDiaSemana - 1; i >= 0; i--) {
    const numDia = diasMesAnterior - i;
    const mesAnt = mesVisual === 0 ? 12 : mesVisual;
    const añoAnt = mesVisual === 0 ? añoVisual - 1 : añoVisual;
    const fechaStr = `${añoAnt}-${String(mesAnt).padStart(2, '0')}-${String(numDia).padStart(2, '0')}`;
    celdasCalendario.push({
      fechaStr,
      numDia,
      esMesActual: false,
      esHoy: fechaStr === hoyLocal,
      isSelected: fechaStr === fechaSeleccionada,
    });
  }

  for (let d = 1; d <= diasEnMes; d++) {
    const fechaStr = `${añoVisual}-${String(mesVisual + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    celdasCalendario.push({
      fechaStr,
      numDia: d,
      esMesActual: true,
      esHoy: fechaStr === hoyLocal,
      isSelected: fechaStr === fechaSeleccionada,
    });
  }

  const totalCeldas = celdasCalendario.length;
  const celdasRestantes = (7 - (totalCeldas % 7)) % 7;
  for (let d = 1; d <= celdasRestantes; d++) {
    const mesSig = mesVisual === 11 ? 1 : mesVisual + 2;
    const añoSig = mesVisual === 11 ? añoVisual + 1 : añoVisual;
    const fechaStr = `${añoSig}-${String(mesSig).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    celdasCalendario.push({
      fechaStr,
      numDia: d,
      esMesActual: false,
      esHoy: fechaStr === hoyLocal,
      isSelected: fechaStr === fechaSeleccionada,
    });
  }

  const hoyRef = new Date((fechaSeleccionada || hoyLocal).replace(/-/g, '/'));
  const diasSemanaCorta: { fechaStr: string; nombreDia: string; numDia: number; esHoy: boolean }[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(hoyRef);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const fechaStr = `${y}-${m}-${day}`;
    diasSemanaCorta.push({
      fechaStr,
      nombreDia: d.toLocaleDateString('es-DO', { weekday: 'short' }),
      numDia: d.getDate(),
      esHoy: fechaStr === hoyLocal,
    });
  }

  const citasSeguras = Array.isArray(citas) ? citas : [];
  const serviciosSeguros = Array.isArray(servicios) ? servicios : [];
  const citasDiaSeleccionado = citasSeguras
    .filter((c) => c && c.fecha === fechaSeleccionada)
    .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));

  return (
    <div className="space-y-4 pb-24">
      {/* Controles de Navegación del Calendario */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-900 capitalize tracking-tight">
              {nombreMes}
            </h2>
            <button
              onClick={irAHoy}
              className="text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
            >
              Hoy
            </button>
          </div>

          <div className="flex items-center gap-1">
            <div className="inline-flex p-0.5 bg-stone-100 rounded-xl text-[11px] mr-1">
              <button
                onClick={() => setModoVista('mes')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  modoVista === 'mes'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setModoVista('semana')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  modoVista === 'semana'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                7 Días
              </button>
            </div>

            <button
              onClick={() => cambiarMes(-1)}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => cambiarMes(1)}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {modoVista === 'mes' && (
          <div className="pt-3">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-zinc-400 font-bold mb-1.5">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {celdasCalendario.map((celda, idx) => {
                const citasEnCelda = citas.filter((c) => c.fecha === celda.fechaStr && !c.esBloqueo);
                const tienePendientes = citasEnCelda.some((c) => c.estado === 'pendiente' || c.estado === 'en_atencion');
                const tieneCobrados = citasEnCelda.some((c) => c.estado === 'atendido');
                const tieneNoAsistio = citasEnCelda.some((c) => c.estado === 'no_asistio');

                return (
                  <button
                    key={idx}
                    onClick={() => setFechaSeleccionada(celda.fechaStr)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
                      celda.isSelected
                        ? 'bg-[#78350f] text-white font-black shadow-sm'
                        : celda.esHoy
                        ? 'bg-amber-50 text-amber-900 font-bold border border-amber-300'
                        : celda.esMesActual
                        ? 'text-zinc-800 hover:bg-stone-100'
                        : 'text-zinc-300 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xs">{celda.numDia}</span>

                    <div className="flex items-center gap-0.5 mt-0.5 h-1.5">
                      {tienePendientes && (
                        <span
                          title="Cita pendiente"
                          className={`w-1.5 h-1.5 rounded-full ${
                            celda.isSelected ? 'bg-amber-300' : 'bg-amber-500'
                          }`}
                        />
                      )}
                      {tieneCobrados && (
                        <span
                          title="Cita cobrada"
                          className={`w-1.5 h-1.5 rounded-full ${
                            celda.isSelected ? 'bg-emerald-300' : 'bg-emerald-500'
                          }`}
                        />
                      )}
                      {tieneNoAsistio && (
                        <span
                          title="No asistió"
                          className={`w-1.5 h-1.5 rounded-full ${
                            celda.isSelected ? 'bg-rose-300' : 'bg-rose-500'
                          }`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-500 pt-3 border-t border-stone-100 mt-3 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Pendiente
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Cobrado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> No asistió
              </span>
            </div>
          </div>
        )}

        {modoVista === 'semana' && (
          <div className="grid grid-cols-7 gap-1 pt-3">
            {diasSemanaCorta.map((dia) => {
              const isSelected = dia.fechaStr === fechaSeleccionada;
              const citasEnDia = citas.filter((c) => c.fecha === dia.fechaStr && !c.esBloqueo);
              const tienePendientes = citasEnDia.some((c) => c.estado === 'pendiente' || c.estado === 'en_atencion');
              const tieneCobrados = citasEnDia.some((c) => c.estado === 'atendido');

              return (
                <button
                  key={dia.fechaStr}
                  onClick={() => setFechaSeleccionada(dia.fechaStr)}
                  className={`flex flex-col items-center justify-between py-2 px-1 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#78350f] text-white border-[#78350f] font-bold shadow-sm'
                      : 'bg-stone-50 border-stone-200 text-zinc-600 hover:bg-stone-100'
                  }`}
                >
                  <span className={`text-[10px] capitalize ${isSelected ? 'text-amber-200' : 'text-zinc-500'}`}>
                    {dia.nombreDia.slice(0, 3)}
                  </span>
                  <span className={`text-sm font-bold my-0.5 ${isSelected ? 'text-white' : 'text-zinc-800'}`}>
                    {dia.numDia}
                  </span>
                  <div className="flex items-center gap-0.5 h-1">
                    {tienePendientes && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500'}`} />
                    )}
                    {tieneCobrados && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de Turnos del Día Seleccionado */}
      <div>
        <div className="flex items-center justify-between mb-2 text-xs text-zinc-600 px-1 font-medium">
          <span className="capitalize font-bold text-zinc-900 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-amber-800" />
            {formatearFechaHumana(fechaSeleccionada)}
          </span>
          <span className="text-zinc-500">
            {citasDiaSeleccionado.length} {citasDiaSeleccionado.length === 1 ? 'cita' : 'citas'}
          </span>
        </div>

        {citasDiaSeleccionado.length > 0 ? (
          <div className="space-y-2.5">
            {citasDiaSeleccionado.map((cita) => {
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
          <div className="text-center py-10 bg-white rounded-2xl border border-stone-200/80 text-zinc-500 text-xs shadow-sm">
            <p className="font-medium">Sin citas programadas para esta fecha.</p>
            <button
              onClick={onAbrirNuevaCita}
              className="mt-2 text-amber-900 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Agendar cita en este día
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
