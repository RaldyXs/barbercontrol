import React, { useState } from 'react';
import { Cita, Servicio } from '../types';
import { useAgenda } from '../context/AgendaContext';
import {
  formatearMonedaRD,
  formatearHora12,
  sumarMinutosAHora,
  generarEnlaceWhatsApp,
} from '../utils/formatters';
import {
  Check,
  MessageCircle,
  MoreHorizontal,
  Calendar,
  UserX,
  X,
  Trash2,
  RotateCcw,
  Scissors,
  Clock,
  Sparkles,
  Coffee,
} from 'lucide-react';

interface CitaCardProps {
  cita: Cita;
  servicio?: Servicio;
  onReprogramar: (cita: Cita) => void;
}

export const CitaCard: React.FC<CitaCardProps> = ({ cita, servicio, onReprogramar }) => {
  const { cambiarEstadoCita, eliminarCita } = useAgenda();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [confirmandoBloqueo, setConfirmandoBloqueo] = useState(false);

  // Si es un bloqueo personal (Almuerzo, Descanso, Diligencia)
  if (cita.esBloqueo) {
    const horaSegura = cita.hora || '12:00';
    const duracionSegura = cita.duracionMinutos || 30;
    const horaFin = sumarMinutosAHora(horaSegura, duracionSegura);
    return (
      <div className="bg-stone-50 border border-stone-200/90 border-dashed rounded-2xl p-3.5 shadow-sm transition-all hover:border-amber-300">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center flex-shrink-0">
              <Coffee className="w-5 h-5 text-amber-800" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-zinc-800 truncate">
                  {cita.clienteNombre}
                </h3>
                <span className="text-[10px] font-semibold bg-stone-200 text-zinc-600 px-2 py-0.5 rounded-full">
                  Pausa Personal
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                <span className="flex items-center gap-1 font-medium text-amber-900">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  {formatearHora12(cita.hora)} - {formatearHora12(horaFin)}
                </span>
                <span className="text-zinc-400 text-[11px]">({cita.duracionMinutos} min)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {confirmandoBloqueo ? (
              <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-1 shadow-sm">
                <span className="text-[10px] text-zinc-600 px-1 font-medium">¿Liberar?</span>
                <button
                  type="button"
                  onClick={() => setConfirmandoBloqueo(false)}
                  className="text-[10px] text-zinc-500 hover:text-zinc-700 px-1.5 py-0.5 rounded cursor-pointer"
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmandoBloqueo(false);
                    eliminarCita(cita.id);
                  }}
                  className="text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-0.5 rounded shadow-sm cursor-pointer"
                >
                  Sí
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmandoBloqueo(true)}
                className="text-xs text-stone-400 hover:text-rose-600 p-2 rounded-xl hover:bg-stone-200/50 transition-colors cursor-pointer flex items-center gap-1"
                title="Liberar horario"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-[11px] font-medium hidden sm:inline">Liberar</span>
              </button>
            )}
          </div>
        </div>

        {cita.notas && (
          <p className="text-[11px] text-zinc-500 italic mt-2 bg-white rounded-lg px-2.5 py-1 border border-stone-100">
            "{cita.notas}"
          </p>
        )}
      </div>
    );
  }

  const nombreServicio = servicio ? servicio.nombre : 'Corte Personalizado';
  const precioRD = cita.precioCobradoRD || (servicio ? servicio.precioRD : 0);

  const esAtendido = cita.estado === 'atendido';
  const esEnAtencion = cita.estado === 'en_atencion';
  const esPendiente = cita.estado === 'pendiente';
  const esNoAsistio = cita.estado === 'no_asistio';
  const esCancelado = cita.estado === 'cancelado';

  // Generar iniciales del cliente para el avatar
  const clienteNombreSeguro = cita.clienteNombre || 'Cliente';
  const iniciales = clienteNombreSeguro
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => (p && p[0] ? p[0].toUpperCase() : ''))
    .join('');

  return (
    <div
      className={`bg-white border rounded-2xl transition-all duration-200 overflow-hidden shadow-sm ${
        esAtendido
          ? 'border-stone-200/60 opacity-80'
          : esEnAtencion
          ? 'border-blue-400 ring-2 ring-blue-500/10'
          : esPendiente
          ? 'border-stone-200 hover:border-amber-400/80'
          : 'border-stone-200/50 opacity-60'
      }`}
    >
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          {/* Avatar + Datos del Cliente */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar circular con iniciales */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                esEnAtencion
                  ? 'bg-blue-100 text-blue-700'
                  : esAtendido
                  ? 'bg-emerald-100 text-emerald-700'
                  : esNoAsistio
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {iniciales || 'C'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-zinc-900 truncate">
                  {cita.clienteNombre}
                </h3>
              </div>

              {/* Servicio y Hora */}
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                <span className="flex items-center gap-1 font-medium text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                  <Scissors className="w-3 h-3 text-amber-700" />
                  <span className="truncate max-w-[130px]">{nombreServicio}</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <Clock className="w-3 h-3" />
                  {formatearHora12(cita.hora)}
                </span>
              </div>
            </div>
          </div>

          {/* Estado Badge, Botón Eliminar y Menú */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              {esEnAtencion && (
                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-blue-500" /> En atención
                </span>
              )}
              {esPendiente && (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                  Esperando
                </span>
              )}
              {esAtendido && (
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> Completado
                </span>
              )}
              {esNoAsistio && (
                <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-200">
                  No asistió
                </span>
              )}
              {esCancelado && (
                <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
                  Cancelado
                </span>
              )}

              {/* Botón directo de Eliminar en la cabecera */}
              <button
                type="button"
                onClick={() => setConfirmandoEliminar(true)}
                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                title="Eliminar cita"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Menú de más opciones (...) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuAbierto(!menuAbierto)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg transition-colors cursor-pointer"
                  title="Más opciones"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {menuAbierto && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuAbierto(false)}
                    />
                    <div className="absolute right-0 top-7 z-50 w-44 bg-white border border-stone-200 rounded-xl shadow-xl py-1 text-xs text-zinc-700">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuAbierto(false);
                          onReprogramar(cita);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        Reprogramar turno
                      </button>

                      {esPendiente && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuAbierto(false);
                            cambiarEstadoCita(cita.id, 'en_atencion');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center gap-2 text-blue-600 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Pasar a atención
                        </button>
                      )}

                      {!esAtendido && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuAbierto(false);
                              cambiarEstadoCita(cita.id, 'no_asistio');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center gap-2 text-rose-600 cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Marcar que no vino
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuAbierto(false);
                              cambiarEstadoCita(cita.id, 'cancelado');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center gap-2 text-zinc-500 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancelar turno
                          </button>
                        </>
                      )}

                      {esAtendido && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuAbierto(false);
                            cambiarEstadoCita(cita.id, 'pendiente');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center gap-2 text-amber-600 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reabrir como pendiente
                        </button>
                      )}

                      <div className="border-t border-stone-100 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setMenuAbierto(false);
                          setConfirmandoEliminar(true);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar cita
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Precio en RD$ */}
            <span className="font-extrabold text-sm text-zinc-900 mt-0.5">
              {formatearMonedaRD(precioRD)}
            </span>
          </div>
        </div>

        {/* Nota si existe */}
        {cita.notas && (
          <p className="text-[11px] text-zinc-500 italic mt-2 bg-stone-50 rounded-lg px-2.5 py-1 border border-stone-100">
            "{cita.notas}"
          </p>
        )}

        {/* Banner de confirmación para eliminar sin depender de alert() del navegador */}
        {confirmandoEliminar && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-xs font-semibold text-rose-900 flex items-center gap-1.5 min-w-0">
              <Trash2 className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="truncate">¿Eliminar cita de <strong>{cita.clienteNombre}</strong>?</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              <button
                type="button"
                onClick={() => setConfirmandoEliminar(false)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer shadow-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmandoEliminar(false);
                  eliminarCita(cita.id);
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, eliminar</span>
              </button>
            </div>
          </div>
        )}

        {/* Barra de Acciones del Barbero */}
        <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center gap-2">
          {esPendiente ? (
            <>
              {/* Botón Pasar a Atención */}
              <button
                type="button"
                onClick={() => cambiarEstadoCita(cita.id, 'en_atencion')}
                className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-amber-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Atender</span>
              </button>

              {/* Botón Completar Directo */}
              <button
                type="button"
                onClick={() => cambiarEstadoCita(cita.id, 'atendido')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Completar</span>
              </button>

              {/* WhatsApp si tiene */}
              {cita.clienteTelefono && (
                <a
                  href={generarEnlaceWhatsApp(
                    cita.clienteTelefono,
                    cita.clienteNombre,
                    nombreServicio,
                    cita.hora
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-stone-100 hover:bg-stone-200 text-emerald-700 p-2 rounded-xl transition-colors flex items-center justify-center"
                  title="Avisar por WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </>
          ) : esEnAtencion ? (
            <>
              <button
                type="button"
                onClick={() => cambiarEstadoCita(cita.id, 'atendido')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Completar y Cobrar {formatearMonedaRD(precioRD)}</span>
              </button>

              <button
                type="button"
                onClick={() => cambiarEstadoCita(cita.id, 'pendiente')}
                className="text-xs text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded cursor-pointer"
              >
                Pausar
              </button>
            </>
          ) : esAtendido ? (
            <div className="w-full flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold truncate max-w-[170px]">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Corte cobrado
              </span>
              <button
                type="button"
                onClick={() => cambiarEstadoCita(cita.id, 'pendiente')}
                className="text-zinc-400 hover:text-zinc-700 underline cursor-pointer text-[11px]"
              >
                Deshacer
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between text-xs text-zinc-500">
              <span className="text-[11px] italic">
                {esCancelado ? 'Turno cancelado' : 'No asistió al turno'}
              </span>
              <button
                type="button"
                onClick={() => cambiarEstadoCita(cita.id, 'pendiente')}
                className="text-amber-800 hover:underline font-semibold text-[11px] cursor-pointer"
              >
                Reactivar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
