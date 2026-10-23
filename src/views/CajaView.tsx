import React, { useState } from 'react';
import { useAgenda } from '../context/AgendaContext';
import { Fiado } from '../types';
import {
  formatearMonedaRD,
  getFechaHoyLocal,
  formatearFechaCorta,
  normalizarTexto,
  obtenerMovimientosFiado,
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
  HandCoins,
  ChevronDown,
  ChevronUp,
  History,
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
    abonarFiado,
    eliminarAbono,
  } = useAgenda();

  const [pestaña, setPestaña] = useState<'balance' | 'fiados'>('balance');
  const [modalFiado, setModalFiado] = useState(false);

  // Formulario nuevo fiado
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState(350);
  const [nuevoConcepto, setNuevoConcepto] = useState('Corte de cabello');
  const [nuevasNotas, setNuevasNotas] = useState('');

  // Modal registrar abono
  const [fiadoParaAbono, setFiadoParaAbono] = useState<Fiado | null>(null);
  const [montoAbono, setMontoAbono] = useState<number | ''>('');
  const [fechaAbono, setFechaAbono] = useState<string>(getFechaHoyLocal());

  // Tarjetas con historial expandido
  const [abonosExpandidos, setAbonosExpandidos] = useState<{ [id: string]: boolean }>({});

  const toggleExpandirAbonos = (fiadoId: string) => {
    setAbonosExpandidos((prev) => ({
      ...prev,
      [fiadoId]: !prev[fiadoId],
    }));
  };

  const abrirModalAbono = (fiado: Fiado) => {
    setFiadoParaAbono(fiado);
    setMontoAbono(fiado.montoRD <= 500 ? fiado.montoRD : 500);
    setFechaAbono(getFechaHoyLocal());
  };

  const cerrarModalAbono = () => {
    setFiadoParaAbono(null);
    setMontoAbono('');
  };

  const handleRegistrarAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiadoParaAbono) return;
    const abonoNum = Number(montoAbono);
    if (!abonoNum || abonoNum <= 0) return;

    abonarFiado(fiadoParaAbono.id, abonoNum, fechaAbono);
    cerrarModalAbono();
  };

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
          <div className="space-y-3">
            {fiados.map((fiado) => {
              const movimientos = obtenerMovimientosFiado(fiado);
              const cargos = movimientos.filter((m) => m.tipo === 'cargo');
              const abonos = movimientos.filter((m) => m.tipo === 'abono');
              const totalCargado = cargos.reduce((sum, c) => sum + (c.montoRD || 0), 0);
              const totalAbonado = abonos.reduce((sum, a) => sum + (a.montoRD || 0), 0);
              const estaExpandido = !!abonosExpandidos[fiado.id];

              return (
                <div
                  key={fiado.id}
                  className={`bg-white border rounded-2xl p-4 shadow-sm transition-all ${
                    fiado.saldado ? 'border-stone-200 opacity-60' : 'border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`font-bold text-sm ${
                            fiado.saldado ? 'text-zinc-500 line-through' : 'text-zinc-900'
                          }`}
                        >
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
                        {fiado.concepto} {fiado.fecha ? `• ${formatearFechaCorta(fiado.fecha)}` : ''}
                      </p>

                      {fiado.notas && (
                        <p className="text-[11px] text-zinc-400 italic mt-1">
                          "{fiado.notas}"
                        </p>
                      )}

                      {/* Desglose de Deuda / Abonos si hay múltiples cargos o abonos */}
                      {(cargos.length > 1 || totalAbonado > 0) && (
                        <div className="mt-2 text-[11px] flex items-center gap-2 text-zinc-500 flex-wrap">
                          {cargos.length > 1 && (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300/70 px-1.5 py-0.5 rounded font-bold text-[10px]">
                              {cargos.length} cargos sumados
                            </span>
                          )}
                          {totalAbonado > 0 && (
                            <>
                              <span>
                                Total adeudado: <strong className="text-zinc-700">{formatearMonedaRD(totalCargado)}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Abonado: <strong className="text-emerald-700 font-bold">-{formatearMonedaRD(totalAbonado)}</strong>
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {fiado.saldado ? 'Saldado' : 'Resta'}
                      </div>
                      <div
                        className={`font-black text-base ${
                          fiado.saldado ? 'text-zinc-400 line-through' : 'text-amber-900'
                        }`}
                      >
                        {formatearMonedaRD(fiado.montoRD)}
                      </div>

                      <div className="flex items-center justify-end gap-1.5 mt-2 flex-wrap">
                        {!fiado.saldado && (
                          <button
                            type="button"
                            onClick={() => abrirModalAbono(fiado)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title="Abonar a esta cuenta"
                          >
                            <HandCoins className="w-3.5 h-3.5" />
                            <span>Abonar</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleSaldarFiado(fiado.id)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                            fiado.saldado
                              ? 'bg-stone-100 text-zinc-600 hover:bg-stone-200'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                          }`}
                          title={fiado.saldado ? 'Reabrir deuda' : 'Marcar como pagado'}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{fiado.saldado ? 'Reabrir' : 'Cobrar'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar la deuda de ${fiado.clienteNombre}?`)) {
                              eliminarFiado(fiado.id);
                            }
                          }}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer rounded-lg hover:bg-rose-50"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sección de Historial General (Cargos y Abonos) Desplegable */}
                  {movimientos.length > 1 && (
                    <div className="mt-3 pt-2.5 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => toggleExpandirAbonos(fiado.id)}
                        className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 flex items-center gap-1.5 cursor-pointer py-0.5 group"
                      >
                        <History className="w-3.5 h-3.5 text-amber-700 group-hover:rotate-12 transition-transform" />
                        <span className="font-bold">Historial general</span>
                        <span className="text-[11px] bg-stone-100 text-zinc-600 px-1.5 py-0.5 rounded-full font-medium">
                          {movimientos.length} movimientos
                        </span>
                        {estaExpandido ? (
                          <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </button>

                      {estaExpandido && (
                        <div className="mt-2.5 bg-stone-50 rounded-xl p-2.5 space-y-1.5 border border-stone-200/80">
                          {movimientos.map((mov, idx) => {
                            const esCargo = mov.tipo === 'cargo';
                            return (
                              <div
                                key={mov.id || `mov-${idx}`}
                                className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg transition-colors border ${
                                  esCargo
                                    ? 'bg-amber-50/70 border-amber-200/70'
                                    : 'bg-emerald-50/70 border-emerald-200/70'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <span
                                    className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                      esCargo
                                        ? 'bg-amber-200 text-amber-900'
                                        : 'bg-emerald-200 text-emerald-900'
                                    }`}
                                  >
                                    {esCargo ? '+' : '-'}
                                  </span>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-zinc-800">
                                        {esCargo
                                          ? idx === 0
                                            ? 'Apertura de cuenta'
                                            : 'Se le sumó al fiado'
                                          : 'Abono a cuenta'}
                                      </span>
                                      <span className="text-[11px] text-zinc-400">
                                        • {formatearFechaCorta(mov.fecha)}
                                      </span>
                                    </div>

                                    {(mov.concepto || mov.notas) && (
                                      <div className="text-[11px] text-zinc-600 truncate">
                                        {mov.concepto ? mov.concepto : ''}
                                        {mov.concepto && mov.notas ? ' — ' : ''}
                                        {mov.notas ? `"${mov.notas}"` : ''}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={`font-black text-xs px-2 py-0.5 rounded ${
                                      esCargo
                                        ? 'text-amber-900 bg-amber-100'
                                        : 'text-emerald-800 bg-emerald-100'
                                    }`}
                                  >
                                    {esCargo ? '+' : '-'}
                                    {formatearMonedaRD(mov.montoRD)}
                                  </span>

                                  {!esCargo && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (
                                          confirm(
                                            `¿Eliminar este abono de ${formatearMonedaRD(
                                              mov.montoRD
                                            )} del ${formatearFechaCorta(
                                              mov.fecha
                                            )}? Se sumará de nuevo a la deuda.`
                                          )
                                        ) {
                                          eliminarAbono(fiado.id, mov.id);
                                        }
                                      }}
                                      className="text-zinc-300 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                                      title="Eliminar este abono"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
                  list="lista-clientes-fiados"
                  placeholder="Ej. Manuel Tejada"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-700 rounded-xl px-3 py-2 text-sm text-zinc-900 outline-none"
                />
                <datalist id="lista-clientes-fiados">
                  {fiadosPendientes.map((f) => (
                    <option key={f.id} value={f.clienteNombre} />
                  ))}
                </datalist>
              </div>

              {/* Notificación si el cliente ya tiene una cuenta activa */}
              {(() => {
                const fiadoExistente = fiadosPendientes.find(
                  (f) =>
                    nuevoNombre.trim().length > 1 &&
                    normalizarTexto(f.clienteNombre) === normalizarTexto(nuevoNombre)
                );
                if (!fiadoExistente) return null;

                return (
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs text-amber-950 flex items-start gap-2.5 shadow-sm">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-900">
                        Cuenta existente de {fiadoExistente.clienteNombre}
                      </div>
                      <div className="text-zinc-600 mt-0.5">
                        Saldo actual:{' '}
                        <strong className="text-zinc-900">{formatearMonedaRD(fiadoExistente.montoRD)}</strong>.
                        {' '}Se le sumarán{' '}
                        <strong className="text-amber-800">+{formatearMonedaRD(Number(nuevoMonto) || 0)}</strong>.
                      </div>
                      <div className="mt-1 font-black text-amber-900">
                        Nuevo saldo total: {formatearMonedaRD(fiadoExistente.montoRD + (Number(nuevoMonto) || 0))}
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                {(() => {
                  const fiadoExistente = fiadosPendientes.find(
                    (f) =>
                      nuevoNombre.trim().length > 1 &&
                      normalizarTexto(f.clienteNombre) === normalizarTexto(nuevoNombre)
                  );

                  return (
                    <button
                      type="submit"
                      className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        {fiadoExistente
                          ? `Sumar a cuenta de ${fiadoExistente.clienteNombre} (+${formatearMonedaRD(Number(nuevoMonto) || 0)})`
                          : 'Guardar Fiado'}
                      </span>
                    </button>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Registrar Abono a Fiado */}
      {fiadoParaAbono && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 text-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                  <HandCoins className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">
                    Abonar a Cuenta
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Cliente: <strong className="text-zinc-800">{fiadoParaAbono.clienteNombre}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={cerrarModalAbono}
                className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen del Fiado */}
            <div className="mt-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Saldo pendiente
                </span>
                <div className="text-xl font-black text-amber-900">
                  {formatearMonedaRD(fiadoParaAbono.montoRD)}
                </div>
              </div>
              <div className="text-right text-xs text-zinc-500">
                <div>Concepto: {fiadoParaAbono.concepto}</div>
                {fiadoParaAbono.fecha && (
                  <div>Desde: {formatearFechaCorta(fiadoParaAbono.fecha)}</div>
                )}
              </div>
            </div>

            <form onSubmit={handleRegistrarAbono} className="mt-4 space-y-3.5">
              {/* Monto del abono */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Monto a Abonar (RD$) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={fiadoParaAbono.montoRD}
                  step="any"
                  value={montoAbono}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setMontoAbono(val);
                  }}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-700 rounded-xl px-3 py-2 text-base text-zinc-900 font-black outline-none"
                  placeholder="Ej. 500"
                  autoFocus
                />

                {/* Botones rápidos */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {[200, 300, 500, 1000]
                    .filter((m) => m < fiadoParaAbono.montoRD)
                    .map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMontoAbono(m)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                          montoAbono === m
                            ? 'bg-amber-800 text-white border-amber-800'
                            : 'bg-stone-50 text-zinc-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        +{formatearMonedaRD(m)}
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={() => setMontoAbono(fiadoParaAbono.montoRD)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                      montoAbono === fiadoParaAbono.montoRD
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    Pagar Todo ({formatearMonedaRD(fiadoParaAbono.montoRD)})
                  </button>
                </div>
              </div>

              {/* Selector de Fecha */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Fecha del Abono *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    required
                    value={fechaAbono}
                    onChange={(e) => setFechaAbono(e.target.value)}
                    className="flex-1 bg-stone-50 border border-stone-200 focus:border-amber-700 rounded-xl px-3 py-2 text-sm text-zinc-900 outline-none font-semibold cursor-pointer"
                  />
                  {fechaAbono !== hoyLocal && (
                    <button
                      type="button"
                      onClick={() => setFechaAbono(hoyLocal)}
                      className="text-xs bg-stone-100 hover:bg-stone-200 text-zinc-700 font-bold px-2.5 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      Hoy
                    </button>
                  )}
                </div>
              </div>

              {/* Previsualización del Saldo Restante */}
              {Number(montoAbono) > 0 && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    Number(montoAbono) >= fiadoParaAbono.montoRD
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-stone-50 border-stone-200 text-zinc-700'
                  }`}
                >
                  {Number(montoAbono) >= fiadoParaAbono.montoRD ? (
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>¡Este abono saldará la deuda por completo! Pasará a Pagado.</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span>Saldo restante después de este abono:</span>
                      <strong className="text-amber-800 font-black text-sm">
                        {formatearMonedaRD(
                          Math.max(0, fiadoParaAbono.montoRD - Number(montoAbono))
                        )}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={cerrarModalAbono}
                  className="w-1/3 bg-stone-100 hover:bg-stone-200 text-zinc-700 font-bold py-2.5 px-3 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!montoAbono || Number(montoAbono) <= 0}
                  className="flex-1 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <HandCoins className="w-4 h-4" />
                  <span>
                    Confirmar Abono ({formatearMonedaRD(Number(montoAbono) || 0)})
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
