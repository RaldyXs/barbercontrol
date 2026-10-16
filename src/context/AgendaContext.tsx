import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { Cita, Servicio, EstadoCita, VistaActiva, ResumenCaja, Fiado, ClienteFrecuente } from '../types';
import { SERVICIOS_INICIALES } from '../data/serviciosIniciales';
import { getCitasDemoIniciales } from '../data/citasIniciales';
import { getFiadosDemoIniciales } from '../data/fiadosIniciales';
import { getFechaHoyLocal } from '../utils/formatters';

interface AgendaContextType {
  citas: Cita[];
  servicios: Servicio[];
  fiados: Fiado[];
  clientesFrecuentes: ClienteFrecuente[];
  vistaActiva: VistaActiva;
  fechaSeleccionada: string;
  cargandoServidor: boolean;
  guardandoServidor: boolean;
  setVistaActiva: (vista: VistaActiva) => void;
  setFechaSeleccionada: (fecha: string) => void;
  cambiarEstadoCita: (citaId: string, nuevoEstado: EstadoCita) => void;
  agregarCita: (nuevaCita: Omit<Cita, 'id' | 'creadoEn'>) => void;
  reprogramarCita: (citaId: string, nuevaFecha: string, nuevaHora: string) => void;
  eliminarCita: (citaId: string) => void;
  agregarServicio: (servicio: Omit<Servicio, 'id'>) => void;
  actualizarServicio: (servicio: Servicio) => void;
  eliminarServicio: (servicioId: string) => void;
  agregarFiado: (fiado: Omit<Fiado, 'id'>) => void;
  toggleSaldarFiado: (fiadoId: string) => void;
  eliminarFiado: (fiadoId: string) => void;
  exportarRespaldoJSON: () => void;
  importarRespaldoJSON: (contenidoJSON: string) => boolean;
  restablecerDatosDemo: () => void;
  getResumenCaja: (fecha?: string) => ResumenCaja;
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

export const AgendaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [servicios, setServicios] = useState<Servicio[]>(SERVICIOS_INICIALES);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [fiados, setFiados] = useState<Fiado[]>([]);

  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('hoy');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(getFechaHoyLocal());

  const [cargandoServidor, setCargandoServidor] = useState<boolean>(true);
  const [guardandoServidor, setGuardandoServidor] = useState<boolean>(false);

  // Guardado directo en el servidor (host)
  const guardarEnServidor = async (
    citasActuales: Cita[],
    serviciosActuales: Servicio[],
    fiadosActuales: Fiado[]
  ) => {
    try {
      setGuardandoServidor(true);
      await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: '1.0',
          fechaRespaldo: new Date().toISOString(),
          citas: citasActuales,
          servicios: serviciosActuales,
          fiados: fiadosActuales,
        }),
      });
    } catch (e) {
      console.warn('Error al conectar con el servidor:', e);
    } finally {
      setGuardandoServidor(false);
    }
  };

  // Carga inicial directa desde el servidor
  const inicializado = useRef(false);
  useEffect(() => {
    let activo = true;
    const cargarServidor = async () => {
      try {
        setCargandoServidor(true);
        const resp = await fetch('/api/agenda');
        if (resp.ok && activo) {
          const data = await resp.json();
          if (data && !data.empty && Array.isArray(data.citas)) {
            setCitas(data.citas);
            if (Array.isArray(data.servicios) && data.servicios.length > 0) {
              setServicios(data.servicios);
            }
            if (Array.isArray(data.fiados)) {
              setFiados(data.fiados);
            }
          } else if (data && data.empty) {
            // Inicializar el servidor con los datos por defecto
            guardarEnServidor(citas, servicios, fiados);
          }
        }
      } catch (err) {
        console.warn('No se pudo conectar al servidor host:', err);
      } finally {
        if (activo) {
          setCargandoServidor(false);
          inicializado.current = true;
        }
      }
    };

    cargarServidor();
    return () => {
      activo = false;
    };
  }, []);

  // Guardado automático en el servidor al haber cambios (debounce 400ms)
  useEffect(() => {
    if (!inicializado.current) return;

    const timer = setTimeout(() => {
      guardarEnServidor(citas, servicios, fiados);
    }, 400);

    return () => clearTimeout(timer);
  }, [citas, servicios, fiados]);

  // Derivación de clientes frecuentes para autocompletado
  const clientesFrecuentes: ClienteFrecuente[] = useMemo(() => {
    const mapa = new Map<string, { nombre: string; telefono: string; ultimoServicioId?: string; totalVisitas: number }>();
    
    (citas || []).forEach((c) => {
      if (!c || c.esBloqueo || !c.clienteNombre?.trim()) return;
      const key = c.clienteNombre.trim().toLowerCase();
      const previo = mapa.get(key);
      if (previo) {
        previo.totalVisitas += 1;
        if (c.clienteTelefono) previo.telefono = c.clienteTelefono;
        if (c.servicioId) previo.ultimoServicioId = c.servicioId;
      } else {
        mapa.set(key, {
          nombre: c.clienteNombre.trim(),
          telefono: c.clienteTelefono || '',
          ultimoServicioId: c.servicioId,
          totalVisitas: 1,
        });
      }
    });

    return Array.from(mapa.values()).sort((a, b) => b.totalVisitas - a.totalVisitas);
  }, [citas]);

  // Acciones en la agenda
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
    setCitas((prev) => prev.filter((c) => c.id !== citaId));
  };

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

  const exportarRespaldoJSON = () => {
    const datosRespaldo = {
      version: '1.0',
      fechaRespaldo: new Date().toISOString(),
      citas,
      servicios,
      fiados,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(datosRespaldo, null, 2))}`;
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
        guardarEnServidor(data.citas, data.servicios, data.fiados || []);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const restablecerDatosDemo = () => {
    const demoCitas = getCitasDemoIniciales();
    const demoFiados = getFiadosDemoIniciales();
    setCitas(demoCitas);
    setServicios(SERVICIOS_INICIALES);
    setFiados(demoFiados);
    guardarEnServidor(demoCitas, SERVICIOS_INICIALES, demoFiados);
  };

  const getResumenCaja = (fecha = getFechaHoyLocal()): ResumenCaja => {
    const citasSeguras = Array.isArray(citas) ? citas : [];
    const serviciosSeguros = Array.isArray(servicios) ? servicios : [];
    const citasDelDia = citasSeguras.filter((c) => c && c.fecha === fecha && !c.esBloqueo);

    const atendidos = citasDelDia.filter((c) => c.estado === 'atendido');
    const pendientes = citasDelDia.filter((c) => c.estado === 'pendiente');
    const enAtencion = citasDelDia.filter((c) => c.estado === 'en_atencion');
    const cancelados = citasDelDia.filter((c) => c.estado === 'cancelado');
    const noAsistieron = citasDelDia.filter((c) => c.estado === 'no_asistio');

    const totalDineroRD = atendidos.reduce(
      (sum, c) => sum + (c.precioCobradoRD || 0),
      0
    );

    const desgloseMap = new Map<string, { cantidad: number; subtotalRD: number }>();

    atendidos.forEach((c) => {
      const srv = serviciosSeguros.find((s) => s && s.id === c.servicioId);
      const nombreServicio = srv ? srv.nombre : 'Servicio Especial';
      const actual = desgloseMap.get(nombreServicio) || { cantidad: 0, subtotalRD: 0 };
      desgloseMap.set(nombreServicio, {
        cantidad: actual.cantidad + 1,
        subtotalRD: actual.subtotalRD + (c.precioCobradoRD || 0),
      });
    });

    const desgloseServicios = Array.from(desgloseMap.entries()).map(
      ([nombre, datos]) => ({
        nombre,
        cantidad: datos.cantidad,
        subtotalRD: datos.subtotalRD,
      })
    );

    return {
      fecha,
      totalDineroRD,
      totalAtendidos: atendidos.length,
      totalPendientes: pendientes.length,
      totalEnAtencion: enAtencion.length,
      totalCancelados: cancelados.length,
      totalNoAsistieron: noAsistieron.length,
      desgloseServicios,
    };
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
        restablecerDatosDemo,
        getResumenCaja,
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
};

export const useAgenda = () => {
  const context = useContext(AgendaContext);
  if (!context) {
    throw new Error('useAgenda debe usarse dentro de un AgendaProvider');
  }
  return context;
};
