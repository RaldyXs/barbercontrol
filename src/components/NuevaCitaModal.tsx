import React, { useState, useMemo, useEffect } from 'react';
import { useAgenda } from '../context/AgendaContext';
import { SERVICIOS_INICIALES } from '../data/serviciosIniciales';
import {
  formatearMonedaRD,
  getFechaHoyLocal,
  getHoraActual,
  sumarMinutosAHora,
  haySolapamiento,
  formatearHora12,
} from '../utils/formatters';
import {
  X,
  Check,
  Scissors,
  Coffee,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

interface NuevaCitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  fechaDefault?: string;
}

export const NuevaCitaModal: React.FC<NuevaCitaModalProps> = ({
  isOpen,
  onClose,
  fechaDefault,
}) => {
  const {
    servicios = [],
    citas = [],
    clientesFrecuentes = [],
    agregarCita,
    fechaSeleccionada,
  } = useAgenda();

  const listaServicios = Array.isArray(servicios) && servicios.length > 0 ? servicios : SERVICIOS_INICIALES;

  const [tipoRegistro, setTipoRegistro] = useState<'cita' | 'bloqueo'>('cita');

  // Campos para Cita
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [servicioId, setServicioId] = useState(listaServicios[0]?.id || 'corte-clasico');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Campos para Bloqueo Personal
  const [motivoBloqueo, setMotivoBloqueo] = useState('Almuerzo 🥪');
  const [duracionBloqueo, setDuracionBloqueo] = useState(45);

  // Campos comunes
  const [fecha, setFecha] = useState(fechaDefault || fechaSeleccionada || getFechaHoyLocal());
  const [hora, setHora] = useState(getHoraActual());
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFecha(fechaDefault || fechaSeleccionada || getFechaHoyLocal());
      setHora(getHoraActual());
      if (!servicioId || !listaServicios.some((s) => s.id === servicioId)) {
        setServicioId(listaServicios[0]?.id || 'corte-clasico');
      }
    }
  }, [isOpen, fechaDefault, fechaSeleccionada]);

  // Filtrar sugerencias de clientes frecuentes
  const sugerencias = useMemo(() => {
    if (!clienteNombre.trim() || !mostrarSugerencias) return [];
    const query = clienteNombre.toLowerCase().trim();
    return (clientesFrecuentes || [])
      .filter((cf) => cf && cf.nombre && cf.nombre.toLowerCase().includes(query))
      .slice(0, 4);
  }, [clienteNombre, clientesFrecuentes, mostrarSugerencias]);

  const servicioSeleccionado =
    listaServicios.find((s) => s.id === servicioId) ||
    listaServicios[0] || {
      id: 'corte-clasico',
      nombre: 'Corte Clásico',
      precioRD: 350,
      duracionMinutos: 30,
    };

  const duracionActual =
    tipoRegistro === 'cita'
      ? servicioSeleccionado?.duracionMinutos || 30
      : duracionBloqueo;

  // Detección en tiempo real de conflicto / solapamiento de horarios
  const citaEnConflicto = useMemo(() => {
    const citasDelDia = (citas || []).filter(
      (c) => c && c.fecha === fecha && c.estado !== 'cancelado' && c.estado !== 'no_asistio'
    );
    return citasDelDia.find((c) =>
      c && c.hora && haySolapamiento(hora, duracionActual, c.hora, c.duracionMinutos || 30)
    );
  }, [citas, fecha, hora, duracionActual]);

  if (!isOpen) return null;

  const seleccionarClienteFrecuente = (nombre: string, tel: string, srvId?: string) => {
    setClienteNombre(nombre);
    if (tel) setClienteTelefono(tel);
    if (srvId && listaServicios.some((s) => s.id === srvId)) {
      setServicioId(srvId);
    }
    setMostrarSugerencias(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (tipoRegistro === 'cita') {
      if (!clienteNombre.trim()) {
        alert('Por favor escribe el nombre del cliente');
        return;
      }

      agregarCita({
        clienteNombre: clienteNombre.trim(),
        clienteTelefono: clienteTelefono.trim(),
        servicioId: servicioSeleccionado.id,
        fecha,
        hora,
        duracionMinutos: servicioSeleccionado.duracionMinutos,
        precioCobradoRD: servicioSeleccionado.precioRD,
        estado: 'pendiente',
        notas: notas.trim() || undefined,
        esBloqueo: false,
      });
    } else {
      // Bloqueo personal (Almuerzo / Descanso / Diligencia)
      agregarCita({
        clienteNombre: motivoBloqueo.trim() || 'Bloqueo Personal',
        clienteTelefono: '',
        servicioId: '',
        fecha,
        hora,
        duracionMinutos: duracionBloqueo,
        precioCobradoRD: 0,
        estado: 'pendiente',
        notas: notas.trim() || undefined,
        esBloqueo: true,
      });
    }

    setClienteNombre('');
    setClienteTelefono('');
    setNotas('');
    setMostrarSugerencias(false);
    onClose();
  };

  const motivosPredefinidos = [
    'Almuerzo 🥪',
    'Descanso ☕',
    'Diligencia personal 🛵',
    'Asunto bancario 🏦',
    'Limpieza / Taller 💈',
  ];

  const duracionesBloqueo = [15, 30, 45, 60, 90, 120];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm overflow-hidden"
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[88dvh] overflow-y-auto overscroll-contain shadow-2xl p-4 sm:p-5 text-zinc-900 font-sans relative flex flex-col">
        {/* Cabecera Sticky del Modal (Siempre visible aunque se desplace o abra el teclado) */}
        <div className="sticky top-0 bg-white z-30 pb-3 border-b border-stone-100 flex items-center justify-between -mt-1 pt-1">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              {tipoRegistro === 'cita' ? 'Agendar Turno' : 'Bloquear Horario Personal'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {tipoRegistro === 'cita'
                ? 'Ingreso de cliente a la agenda'
                : 'Pausa para almuerzo, descanso o diligencia'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-zinc-500 hover:text-zinc-800 rounded-full transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Pestañas: Cita vs Bloqueo */}
        <div className="flex bg-stone-100 p-1 rounded-xl mt-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTipoRegistro('cita')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tipoRegistro === 'cita'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-amber-800" />
            <span>Turno Cliente</span>
          </button>
          <button
            type="button"
            onClick={() => setTipoRegistro('bloqueo')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tipoRegistro === 'bloqueo'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-amber-700" />
            <span>Bloqueo Personal</span>
          </button>
        </div>

        {/* ALERTA DE SOLAPAMIENTO / CONFLICTO */}
        {citaEnConflicto && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">¡Conflicto de horario!</span>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                Se solapa con <strong className="font-bold">{citaEnConflicto.clienteNombre || 'Turno'}</strong> ({formatearHora12(citaEnConflicto.hora || '12:00')}, {citaEnConflicto.duracionMinutos || 30} min). Puedes agendar de todas formas o cambiar la hora.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3.5">
          {tipoRegistro === 'cita' ? (
            <>
              {/* Nombre del Cliente con Autocompletado */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-zinc-700">
                    Nombre del cliente *
                  </label>
                  {(clientesFrecuentes || []).length > 0 && (
                    <span className="text-[10px] text-amber-800 flex items-center gap-1 font-semibold">
                      <UserCheck className="w-3 h-3" /> Clientes frecuentes activos
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={clienteNombre}
                  onChange={(e) => {
                    setClienteNombre(e.target.value);
                    setMostrarSugerencias(true);
                  }}
                  onFocus={() => setMostrarSugerencias(true)}
                  onBlur={() => {
                    setTimeout(() => setMostrarSugerencias(false), 200);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-800 rounded-xl px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none font-medium"
                />

                {/* Dropdown de Sugerencias */}
                {sugerencias.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-stone-100">
                    <div className="px-3 py-1.5 bg-stone-50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Clientes Frecuentes
                    </div>
                    {sugerencias.map((cf) => {
                      const servicioHabitual = listaServicios.find(
                        (s) => s.id === cf.ultimoServicioId
                      );
                      return (
                        <button
                          key={cf.nombre}
                          type="button"
                          onClick={() =>
                            seleccionarClienteFrecuente(
                              cf.nombre,
                              cf.telefono,
                              cf.ultimoServicioId
                            )
                          }
                          className="w-full text-left px-3 py-2 hover:bg-amber-50 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-bold text-zinc-900">
                              {cf.nombre}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {cf.telefono || 'Sin teléfono'} • {cf.totalVisitas}{' '}
                              {cf.totalVisitas === 1 ? 'visita' : 'visitas'}
                            </div>
                          </div>
                          {servicioHabitual && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                              {servicioHabitual.nombre}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Servicios */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Servicio / Corte
                </label>
                <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {listaServicios.map((s) => {
                    const isSelected = s.id === servicioId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setServicioId(s.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 border-amber-800 text-amber-950 font-bold'
                            : 'bg-stone-50 border-stone-200 text-zinc-700 hover:bg-stone-100'
                        }`}
                      >
                        <div>
                          <div className="text-xs">{s.nombre}</div>
                          <div className="text-[10px] text-zinc-400">
                            {s.duracionMinutos} min
                          </div>
                        </div>
                        <span className="text-xs font-black text-amber-900">
                          {formatearMonedaRD(s.precioRD)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Campos específicos para Bloqueo Personal */
            <>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Motivo del Bloqueo
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {motivosPredefinidos.map((mot) => (
                    <button
                      key={mot}
                      type="button"
                      onClick={() => setMotivoBloqueo(mot)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                        motivoBloqueo === mot
                          ? 'bg-amber-100 border-amber-800 text-amber-950 font-bold'
                          : 'bg-stone-50 border-stone-200 text-zinc-600 hover:bg-stone-100'
                      }`}
                    >
                      {mot}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Otro motivo..."
                  value={motivoBloqueo}
                  onChange={(e) => setMotivoBloqueo(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-800 rounded-xl px-3 py-2 text-sm text-zinc-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Tiempo de Pausa (Minutos)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {duracionesBloqueo.map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setDuracionBloqueo(min)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        duracionBloqueo === min
                          ? 'bg-amber-800 text-white border-amber-800'
                          : 'bg-stone-50 border-stone-200 text-zinc-700 hover:bg-stone-100'
                      }`}
                    >
                      {min >= 60 ? `${min / 60}h ${min % 60 ? `${min % 60}m` : ''}` : `${min} min`}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Fecha y Hora (Comunes a ambos tipos) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-amber-800 rounded-xl px-2.5 py-2 text-xs font-bold text-zinc-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Hora de Inicio
              </label>
              <input
                type="time"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-amber-800 rounded-xl px-2.5 py-2 text-xs font-bold text-zinc-900 outline-none"
              />
              {/* Botones de selección rápida de hora */}
              <div className="flex items-center gap-1 mt-1.5">
                <button
                  type="button"
                  onClick={() => setHora(getHoraActual())}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-zinc-700 transition-colors cursor-pointer"
                >
                  Ahora
                </button>
                <button
                  type="button"
                  onClick={() => setHora(sumarMinutosAHora(getHoraActual(), 15))}
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-zinc-600 transition-colors cursor-pointer"
                >
                  +15m
                </button>
                <button
                  type="button"
                  onClick={() => setHora(sumarMinutosAHora(getHoraActual(), 30))}
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-zinc-600 transition-colors cursor-pointer"
                >
                  +30m
                </button>
                <button
                  type="button"
                  onClick={() => setHora(sumarMinutosAHora(getHoraActual(), 60))}
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-zinc-600 transition-colors cursor-pointer"
                >
                  +1h
                </button>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Nota corta (Opcional)
            </label>
            <input
              type="text"
              placeholder="Detalle o recordatorio..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              onBlur={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-full bg-stone-50 border border-stone-200 focus:border-amber-800 rounded-xl px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none"
            />
          </div>

          {/* Botones de Acción: Cancelar y Confirmar */}
          <div className="pt-3 pb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl border border-stone-200 text-zinc-700 font-bold text-xs hover:bg-stone-50 transition-colors cursor-pointer bg-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-amber-800 hover:bg-amber-900 active:scale-98 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer text-xs"
            >
              <Check className="w-4 h-4" />
              <span>
                {tipoRegistro === 'cita'
                  ? `Confirmar • ${formatearMonedaRD(servicioSeleccionado?.precioRD || 400)}`
                  : `Guardar Bloqueo (${duracionBloqueo}m)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
