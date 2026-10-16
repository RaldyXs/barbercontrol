import React, { useState } from 'react';
import { useAgenda } from '../context/AgendaContext';
import {
  formatearMonedaRD,
  getFechaHoyLocal,
} from '../utils/formatters';
import {
  Calendar,
  Plus,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
  CreditCard,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export const CajaView: React.FC = () => {
  const {
    getResumenCaja,
    fechaSeleccionada,
    setFechaSeleccionada,
    fiados,
    agregarFiado,
    toggleSaldarFiado,
    eliminarFiado,
  } = useAgenda();

  const [pestaña, setPestaña] = useState<'balance' | 'fiados'>('balance');
  const [modalFiado, setModalFiado] = useState(false);

  // Formulario nuevo fiado
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState(350);
  const [nuevoConcepto, setNuevoConcepto] = useState('Corte de cabello');
  const [nuevasNotas, setNuevasNotas] = useState('');

  const hoyLocal = getFechaHoyLocal();
  const resumen = getResumenCaja(fechaSeleccionada);
  const esHoy = fechaSeleccionada === hoyLocal;

  const ticketPromedioRD =
    resumen.totalAtendidos > 0
      ? Math.round(resumen.totalDineroRD / resumen.totalAtendidos)
      : 0;

  // Totales de fiados
  const fiadosSeguros = Array.isArray(fiados) ? fiados : [];
  const fiadosPendientes = fiadosSeguros.filter((f) => f && !f.saldado);
  const totalFiadosEnLaCalle = fiadosPendientes.reduce((sum, f) => sum + (f.montoRD || 0), 0);

  const handleCrearFiado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    agregarFiado({
      clienteNombre: nuevoNombre.trim(),
      clienteTelefono: nuevoTelefono.trim() || undefined,
      montoRD: Number(nuevoMonto),
      concepto: nuevoConcepto.trim(),
      fecha: getFechaHoyLocal(),
      saldado: false,
      notas: nuevasNotas.trim() || undefined,
    });

    setNuevoNombre('');
    setNuevoTelefono('');
    setNuevasNotas('');
    setModalFiado(false);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Selector de Pestaña: Balance vs Control de Fiados */}
      <div className="grid grid-cols-2 p-1 bg-stone-200/80 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setPestaña('balance')}
          className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            pestaña === 'balance'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          <span>Balance de Caja</span>
        </button>
        <button
          onClick={() => setPestaña('fiados')}
          className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            pestaña === 'fiados'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-amber-600" />
          <span>Control de Fiados ({fiadosPendientes.length})</span>
        </button>
      </div>

      {/* PESTAÑA 1: BALANCE DE CAJA */}
      {pestaña === 'balance' && (
        <div className="space-y-4">
          {/* Selector de Fecha */}
          <div className="flex items-center justify-between text-xs text-zinc-600 bg-white border border-stone-200/80 rounded-2xl px-3.5 py-2.5 shadow-sm">
            <span className="font-medium">{esHoy ? 'Cierre de Hoy' : 'Registro de Fecha'}</span>
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="bg-transparent text-xs font-semibold text-zinc-800 outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Tarjeta Principal de Balance */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-5 shadow-sm text-center">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Total Cobrado en Caja
            </span>
            <div className="text-4xl font-black text-emerald-700 tracking-tight mt-1 mb-1">
              {formatearMonedaRD(resumen.totalDineroRD)}
            </div>
            <p className="text-xs text-zinc-500">
              {resumen.totalAtendidos} clientes atendidos • {formatearMonedaRD(ticketPromedioRD)} ticket promedio
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-stone-100 text-left text-xs">
              <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
                <span className="text-zinc-500">Completados</span>
                <div className="text-base font-black text-zinc-800 mt-0.5">
                  {resumen.totalAtendidos} cortes
                </div>
              </div>
              <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
                <span className="text-zinc-500">En espera de cobro</span>
                <div className="text-base font-black text-amber-700 mt-0.5">
                  {resumen.totalPendientes + resumen.totalEnAtencion} turnos
                </div>
              </div>
            </div>
          </div>

          {/* Desglose por Servicio */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-zinc-800 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-800" />
              <span>Desglose por tipo de corte</span>
            </h3>

            {resumen.desgloseServicios.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {resumen.desgloseServicios.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-zinc-800">{item.nombre}</span>
                      <span className="text-zinc-400 ml-1.5">({item.cantidad} cortes)</span>
                    </div>
                    <span className="font-black text-emerald-700">
                      {formatearMonedaRD(item.subtotalRD)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-400 text-xs">
                Aún no hay cortes cobrados en esta fecha.
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: CONTROL DE FIADOS */}
      {pestaña === 'fiados' && (
        <div className="space-y-4">
          {/* Hero Fiados */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Cuentas por Cobrar
                </span>
                <div className="text-3xl font-black text-amber-900 tracking-tight mt-0.5">
                  {formatearMonedaRD(totalFiadosEnLaCalle)}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {fiadosPendientes.length} personas con pago pendiente
                </p>
              </div>

              <button
                onClick={() => setModalFiado(true)}
                className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Anotar</span>
              </button>
            </div>
          </div>

          {/* Lista de Fiados */}
          <div className="space-y-2.5">
            {fiados.map((fiado) => (
              <div
                key={fiado.id}
                className={`bg-white border rounded-2xl p-3.5 shadow-sm transition-all ${
                  fiado.saldado ? 'border-stone-200 opacity-60' : 'border-amber-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`font-bold text-sm ${fiado.saldado ? 'text-zinc-500 line-through' : 'text-zinc-900'}`}>
                        {fiado.clienteNombre}
                      </h4>
                      {fiado.saldado ? (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Pagado
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5 text-amber-600" /> Debe
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500 mt-0.5">
                      {fiado.concepto}
                    </p>

                    {fiado.notas && (
                      <p className="text-[11px] text-zinc-400 italic mt-1">
                        "{fiado.notas}"
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-sm text-zinc-900">
                      {formatearMonedaRD(fiado.montoRD)}
                    </div>

                    <div className="flex items-center gap-1 mt-2">
                      <button
                        onClick={() => toggleSaldarFiado(fiado.id)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          fiado.saldado
                            ? 'bg-stone-100 text-zinc-600 hover:bg-stone-200'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        }`}
                      >
                        {fiado.saldado ? 'Reabrir' : 'Cobrar'}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la deuda de ${fiado.clienteNombre}?`)) {
                            eliminarFiado(fiado.id);
                          }
                        }}
                        className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para Anotar Nuevo Fiado */}
      {modalFiado && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 text-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-base font-bold text-zinc-900">
                Anotar Cuenta Pendiente (Fiado)
              </h2>
              <button
                onClick={() => setModalFiado(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearFiado} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Manuel Tejada"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-700 rounded-xl px-3 py-2 text-sm text-zinc-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Monto (RD$) *
                  </label>
                  <input
                    type="number"
                    required
                    min="50"
                    step="25"
                    value={nuevoMonto}
                    onChange={(e) => setNuevoMonto(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-700 rounded-xl px-3 py-2 text-sm text-zinc-900 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Teléfono (Opcional)
                  </label>
                  <input
                    type="tel"
                    placeholder="809-555-1234"
                    value={nuevoTelefono}
                    onChange={(e) => setNuevoTelefono(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-700 rounded-xl px-3 py-2 text-sm text-zinc-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Concepto / Servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Corte Fade, Barba..."
                  value={nuevoConcepto}
                  onChange={(e) => setNuevoConcepto(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-700 rounded-xl px-3 py-2 text-sm text-zinc-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Nota / Cuándo paga (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Pasa a pagar el sábado en la quincena..."
                  value={nuevasNotas}
                  onChange={(e) => setNuevasNotas(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-700 rounded-xl px-3 py-2 text-xs text-zinc-900 outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Guardar Fiado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
