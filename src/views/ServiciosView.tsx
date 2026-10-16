import React, { useState } from 'react';
import { useAgenda } from '../context/AgendaContext';
import { Servicio } from '../types';
import { formatearMonedaRD } from '../utils/formatters';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Scissors,
  Clock,
} from 'lucide-react';

export const ServiciosView: React.FC = () => {
  const {
    servicios,
    agregarServicio,
    actualizarServicio,
    eliminarServicio,
  } = useAgenda();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [servicioEditando, setServicioEditando] = useState<Servicio | null>(null);

  const [nombre, setNombre] = useState('');
  const [precioRD, setPrecioRD] = useState(400);
  const [duracionMinutos, setDuracionMinutos] = useState(30);
  const [descripcion, setDescripcion] = useState('');

  const abrirParaCrear = () => {
    setServicioEditando(null);
    setNombre('');
    setPrecioRD(400);
    setDuracionMinutos(30);
    setDescripcion('');
    setModalAbierto(true);
  };

  const abrirParaEditar = (srv: Servicio) => {
    setServicioEditando(srv);
    setNombre(srv.nombre);
    setPrecioRD(srv.precioRD);
    setDuracionMinutos(srv.duracionMinutos);
    setDescripcion(srv.descripcion || '');
    setModalAbierto(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    if (servicioEditando) {
      actualizarServicio({
        ...servicioEditando,
        nombre: nombre.trim(),
        precioRD: Number(precioRD),
        duracionMinutos: Number(duracionMinutos),
        descripcion: descripcion.trim() || undefined,
      });
    } else {
      agregarServicio({
        nombre: nombre.trim(),
        precioRD: Number(precioRD),
        duracionMinutos: Number(duracionMinutos),
        descripcion: descripcion.trim() || undefined,
      });
    }

    setModalAbierto(false);
  };

  return (
    <div className="space-y-4 pb-24 font-sans">
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-1.5">
            <Scissors className="w-4 h-4 text-amber-800 -rotate-45" />
            <span>Mis Tarifas & Cortes</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Precios configurados en Pesos Dominicanos (RD$)
          </p>
        </div>

        <button
          onClick={abrirParaCrear}
          className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Nuevo</span>
        </button>
      </div>

      {/* Lista de Servicios */}
      <div className="space-y-2.5">
        {(Array.isArray(servicios) ? servicios : []).map((srv) => (
          <div
            key={srv.id}
            className="bg-white border border-stone-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-sm hover:border-amber-400 transition-all"
          >
            <div className="flex-1 pr-3">
              <div className="flex items-baseline justify-between">
                <h3 className="font-bold text-sm text-zinc-900">
                  {srv.nombre}
                </h3>
                <span className="font-black text-sm text-amber-900">
                  {formatearMonedaRD(srv.precioRD)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 font-medium">
                <span className="flex items-center gap-1 text-zinc-400">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  {srv.duracionMinutos} min
                </span>
                {srv.descripcion && (
                  <span className="truncate max-w-[200px]">
                    • {srv.descripcion}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 border-l border-stone-100 pl-2">
              <button
                onClick={() => abrirParaEditar(srv)}
                className="p-1.5 text-zinc-400 hover:text-amber-800 transition-colors cursor-pointer"
                title="Editar"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              {servicios.length > 1 && (
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar "${srv.nombre}"?`)) {
                      eliminarServicio(srv.id);
                    }
                  }}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pie de configuración del servidor */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm space-y-2.5 mt-6">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="font-semibold text-zinc-700">Alojamiento</span>
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Servidor Host Activo ✓
          </span>
        </div>


      </div>

      {/* Modal Crear / Editar Servicio */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 text-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-base font-bold text-zinc-900">
                {servicioEditando ? 'Editar Tarifa' : 'Nuevo Servicio'}
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Nombre del Corte / Servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Fade con navaja..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-800 rounded-xl px-3 py-2 text-sm text-zinc-900 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Precio (RD$) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="25"
                    value={precioRD}
                    onChange={(e) => setPrecioRD(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-800 rounded-xl px-3 py-2 text-sm font-bold text-zinc-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Duración (min) *
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    step="5"
                    value={duracionMinutos}
                    onChange={(e) => setDuracionMinutos(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-800 rounded-xl px-3 py-2 text-sm text-zinc-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Detalles..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-800 rounded-xl px-3 py-2 text-sm text-zinc-900 outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  Guardar Tarifa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
