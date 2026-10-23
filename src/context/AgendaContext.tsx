import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  Cita,
  Servicio,
  EstadoCita,
  VistaActiva,
  ResumenCaja,
  Fiado,
  AbonoFiado,
  AgendaContextType,
} from '../types';
import { SERVICIOS_INICIALES } from '../data/serviciosIniciales';
import { getFechaHoyLocal } from '../utils/formatters';
import { IAgendaStorage } from '../services/storage.interface';
import { defaultStorage } from '../services/httpAgendaStorage';
import { CajaCalculator } from '../services/cajaCalculator';
import { ClienteService } from '../services/clienteService';

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

interface AgendaProviderProps {
  children: React.ReactNode;
  storage?: IAgendaStorage; // Inversión de Dependencias (DIP)
}

/**
 * Proveedor de Estado Global de la Agenda
 * Orquesta la UI y delega persistencia y cálculos a servicios especializados (SOLID).
 */
export const AgendaProvider: React.FC<AgendaProviderProps> = ({
  children,
  storage = defaultStorage,
}) => {
  // Carga instantánea de memoria física del teléfono (0ms latencia: cero pantallas en blanco)
  const [servicios, setServicios] = useState<Servicio[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const local = (storage as any).leerDeLocalStorage?.() || defaultStorage.leerDeLocalStorage?.();
        if (local && Array.isArray(local.servicios) && local.servicios.length > 0) return local.servicios;
      } catch (_) {}
    }
    return SERVICIOS_INICIALES;
  });

  const [citas, setCitas] = useState<Cita[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const local = (storage as any).leerDeLocalStorage?.() || defaultStorage.leerDeLocalStorage?.();
        if (local && Array.isArray(local.citas)) return local.citas;
      } catch (_) {}
    }
    return [];
  });

  const [fiados, setFiados] = useState<Fiado[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const local = (storage as any).leerDeLocalStorage?.() || defaultStorage.leerDeLocalStorage?.();
        if (local && Array.isArray(local.fiados)) return local.fiados;
      } catch (_) {}
    }
    return [];
  });

  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('hoy');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(getFechaHoyLocal());

  const [cargandoServidor, setCargandoServidor] = useState<boolean>(true);
  const [guardandoServidor, setGuardandoServidor] = useState<boolean>(false);

  // Guardado persistente delegado a la abstracción de almacenamiento (DIP & SRP)
  const persistirDatos = async (
    citasActuales: Cita[],
    serviciosActuales: Servicio[],
    fiadosActuales: Fiado[]
  ) => {
    try {
      setGuardandoServidor(true);
      await storage.guardar({
        version: '1.0',
        fechaRespaldo: new Date().toISOString(),
        citas: citasActuales,
        servicios: serviciosActuales,
        fiados: fiadosActuales,
      });
    } finally {
      setGuardandoServidor(false);
    }
  };

  // Carga inicial delegada al servicio de almacenamiento
  const inicializado = useRef(false);
  useEffect(() => {
    let activo = true;
    const cargarDatos = async () => {
      try {
        setCargandoServidor(true);
        const data = await storage.cargar();
        if (activo && data) {
          if (Array.isArray(data.citas)) setCitas(data.citas);
          if (Array.isArray(data.servicios) && data.servicios.length > 0) {
            setServicios(data.servicios);
          }
          if (Array.isArray(data.fiados)) setFiados(data.fiados);
        } else if (activo && !data) {
          // Si el servidor falló (ej. error 520 de Cloudflare o timeout), NO borrar citas
          console.warn('[AgendaContext] Servidor no respondió, manteniendo datos locales protegidos.');
        }
      } catch (err) {
        console.warn('[AgendaContext] Error inicializando datos:', err);
      } finally {
        if (activo) {
          setCargandoServidor(false);
          inicializado.current = true;
        }
      }
    };

    cargarDatos();
    return () => {
      activo = false;
    };
  }, [storage]);

  // Guardado automático debounced (400ms) al haber cambios
  useEffect(() => {
    if (!inicializado.current) return;

    const timer = setTimeout(() => {
      persistirDatos(citas, servicios, fiados);
    }, 400);

    return () => clearTimeout(timer);
  }, [citas, servicios, fiados]);

  // Re-sincronización automática bidireccional al volver a la app o reconectarse a internet
  useEffect(() => {
    let montado = true;
    const reSincronizar = async () => {
      if (!inicializado.current) return;
      try {
        const data = await storage.cargar();
        if (montado && data) {
          if (Array.isArray(data.citas)) setCitas(data.citas);
          if (Array.isArray(data.fiados)) setFiados(data.fiados);
          if (Array.isArray(data.servicios) && data.servicios.length > 0) {
            setServicios(data.servicios);
          }
        }
      } catch (err) {
        console.warn('[AgendaContext] Error en re-sincronización pasiva:', err);
      }
    };

    window.addEventListener('online', reSincronizar);
    window.addEventListener('focus', reSincronizar);
    const handleVis = () => {
      if (document.visibilityState === 'visible') {
        reSincronizar();
      }
    };
    document.addEventListener('visibilitychange', handleVis);

    return () => {
      montado = false;
      window.removeEventListener('online', reSincronizar);
      window.removeEventListener('focus', reSincronizar);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, [storage]);

  // SRP: Delegar análisis de clientes frecuentes a ClienteService
  const clientesFrecuentes = useMemo(() => {
    return ClienteService.derivarClientesFrecuentes(citas);
  }, [citas]);

  // SRP & OCP: Delegar cálculo de caja a CajaCalculator
  const getResumenCaja = (fecha = fechaSeleccionada): ResumenCaja => {
    return CajaCalculator.calcular(citas, servicios, fecha);
  };

  // --- Operaciones de Citas (ICitasOperations) ---
  const cambiarEstadoCita = (citaId: string, nuevoEstado: EstadoCita) => {
    setCitas((prev) =>
      prev.map((c) => (c.id === citaId ? { ...c, estado: nuevoEstado } : c))
    );
  };

  const agregarCita = (nuevaCita: Omit<Cita, 'id' | 'creadoEn'>) => {
    const citaCreada: Cita = {
      ...nuevaCita,
      id: 'cita-' + Date.now(),
      creadoEn: new Date().toISOString(),
    };
    setCitas((prev) => [...prev, citaCreada]);
  };

  const reprogramarCita = (citaId: string, nuevaFecha: string, nuevaHora: string) => {
    setCitas((prev) =>
      prev.map((c) =>
        c.id === citaId ? { ...c, fecha: nuevaFecha, hora: nuevaHora } : c
      )
    );
  };

  const eliminarCita = (citaId: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('barbercontrol_citas_eliminadas_v1');
        const arr = raw ? JSON.parse(raw) : [];
        if (!arr.includes(citaId)) {
          arr.push(citaId);
          window.localStorage.setItem('barbercontrol_citas_eliminadas_v1', JSON.stringify(arr));
        }
      }
    } catch (_) {}

    setCitas((prev) => {
      const actualizadas = prev.filter((c) => c.id !== citaId);
      persistirDatos(actualizadas, servicios, fiados);
      return actualizadas;
    });
  };

  // --- Operaciones de Servicios (IServiciosOperations) ---
  const agregarServicio = (nuevoServicio: Omit<Servicio, 'id'>) => {
    const servicioCreado: Servicio = {
      ...nuevoServicio,
      id: 'srv-' + Date.now(),
    };
    setServicios((prev) => [...prev, servicioCreado]);
  };

  const actualizarServicio = (servicioActualizado: Servicio) => {
    setServicios((prev) =>
      prev.map((s) => (s.id === servicioActualizado.id ? servicioActualizado : s))
    );
  };

  const eliminarServicio = (servicioId: string) => {
    setServicios((prev) => prev.filter((s) => s.id !== servicioId));
  };

  // --- Operaciones de Fiados (IFiadosOperations) ---
  const agregarFiado = (nuevoFiado: Omit<Fiado, 'id'>) => {
    const fiadoCreado: Fiado = {
      ...nuevoFiado,
      id: 'fiado-' + Date.now(),
    };
    setFiados((prev) => [fiadoCreado, ...prev]);
  };

  const toggleSaldarFiado = (fiadoId: string) => {
    setFiados((prev) =>
      prev.map((f) => (f.id === fiadoId ? { ...f, saldado: !f.saldado } : f))
    );
  };

  const eliminarFiado = (fiadoId: string) => {
    setFiados((prev) => prev.filter((f) => f.id !== fiadoId));
  };

  const abonarFiado = (
    fiadoId: string,
    montoAbono: number,
    fechaAbono?: string,
    notas?: string
  ) => {
    if (montoAbono <= 0) return;
    setFiados((prev) =>
      prev.map((f) => {
        if (f.id !== fiadoId) return f;

        const totalAbonadoPrevio = f.abonos?.reduce((acc, a) => acc + (a.montoRD || 0), 0) || 0;
        const montoOriginal = f.montoOriginalRD ?? (f.montoRD + totalAbonadoPrevio);

        const nuevoAbono: AbonoFiado = {
          id: 'abono-' + Date.now(),
          montoRD: montoAbono,
          fecha: fechaAbono || getFechaHoyLocal(),
          creadoEn: new Date().toISOString(),
          notas: notas?.trim() || undefined,
        };

        const abonosActuales = f.abonos ? [...f.abonos, nuevoAbono] : [nuevoAbono];
        const nuevoMontoRD = Math.max(0, f.montoRD - montoAbono);
        const estaSaldado = nuevoMontoRD === 0;

        return {
          ...f,
          montoOriginalRD: montoOriginal,
          montoRD: nuevoMontoRD,
          saldado: estaSaldado,
          abonos: abonosActuales,
        };
      })
    );
  };

  const eliminarAbono = (fiadoId: string, abonoId: string) => {
    setFiados((prev) =>
      prev.map((f) => {
        if (f.id !== fiadoId || !f.abonos) return f;

        const abonoAEliminar = f.abonos.find((a) => a.id === abonoId);
        if (!abonoAEliminar) return f;

        const abonosFiltrados = f.abonos.filter((a) => a.id !== abonoId);
        const nuevoMontoRD = f.montoRD + abonoAEliminar.montoRD;
        const estaSaldado = nuevoMontoRD === 0;

        return {
          ...f,
          montoRD: nuevoMontoRD,
          saldado: estaSaldado,
          abonos: abonosFiltrados,
        };
      })
    );
  };

  // --- Respaldos manuales ---
  const exportarRespaldoJSON = () => {
    const datosRespaldo = {
      version: '1.0',
      fechaRespaldo: new Date().toISOString(),
      citas,
      servicios,
      fiados,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(datosRespaldo, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `respaldo-barberia-${getFechaHoyLocal()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importarRespaldoJSON = (contenidoJSON: string): boolean => {
    try {
      const data = JSON.parse(contenidoJSON);
      if (Array.isArray(data.citas) && Array.isArray(data.servicios)) {
        setCitas(data.citas);
        setServicios(data.servicios);
        if (Array.isArray(data.fiados)) setFiados(data.fiados);
        persistirDatos(data.citas, data.servicios, data.fiados || []);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AgendaContext.Provider
      value={{
        citas,
        servicios,
        fiados,
        clientesFrecuentes,
        vistaActiva,
        fechaSeleccionada,
        cargandoServidor,
        guardandoServidor,
        setVistaActiva,
        setFechaSeleccionada,
        cambiarEstadoCita,
        agregarCita,
        reprogramarCita,
        eliminarCita,
        agregarServicio,
        actualizarServicio,
        eliminarServicio,
        agregarFiado,
        toggleSaldarFiado,
        eliminarFiado,
        abonarFiado,
        eliminarAbono,
        exportarRespaldoJSON,
        importarRespaldoJSON,
        getResumenCaja,
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
};

export const useAgenda = (): AgendaContextType => {
  const context = useContext(AgendaContext);
  if (!context) {
    throw new Error('useAgenda debe usarse dentro de un AgendaProvider');
  }
  return context;
};
