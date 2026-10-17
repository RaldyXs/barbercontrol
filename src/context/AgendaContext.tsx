import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  Cita,
  Servicio,
  EstadoCita,
  VistaActiva,
  ResumenCaja,
  Fiado,
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
  const [servicios, setServicios] = useState<Servicio[]>(SERVICIOS_INICIALES);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [fiados, setFiados] = useState<Fiado[]>([]);

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
          // Inicializar almacenamiento con catálogo base
          persistirDatos(citas, servicios, fiados);
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
