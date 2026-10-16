export type EstadoCita = 'pendiente' | 'en_atencion' | 'atendido' | 'no_asistio' | 'cancelado';

export interface Servicio {
  id: string;
  nombre: string;
  precioRD: number;
  duracionMinutos: number;
  categoria?: string;
  descripcion?: string;
}

export interface Cita {
  id: string;
  clienteNombre: string;
  clienteTelefono: string;
  servicioId: string;
  fecha: string; // Formato YYYY-MM-DD
  hora: string; // Formato HH:mm (ej. "10:30")
  duracionMinutos: number;
  precioCobradoRD: number;
  estado: EstadoCita;
  notas?: string;
  esBloqueo?: boolean; // Para bloqueos personales: Almuerzo, Diligencia, etc.
  creadoEn: string;
}

export interface Fiado {
  id: string;
  clienteNombre: string;
  clienteTelefono?: string;
  montoRD: number;
  concepto: string;
  fecha: string;
  saldado: boolean;
  notas?: string;
}

export interface ClienteFrecuente {
  nombre: string;
  telefono: string;
  ultimoServicioId?: string;
  totalVisitas: number;
}

export interface RespaldoCompleto {
  version: string;
  fechaRespaldo: string;
  citas: Cita[];
  servicios: Servicio[];
  fiados: Fiado[];
}

export type VistaActiva = 'hoy' | 'semana' | 'caja' | 'servicios';

export interface ResumenCaja {
  fecha: string;
  totalDineroRD: number;
  totalAtendidos: number;
  totalPendientes: number;
  totalEnAtencion: number;
  totalCancelados: number;
  totalNoAsistieron: number;
  desgloseServicios: {
    nombre: string;
    cantidad: number;
    subtotalRD: number;
  }[];
}

/* =======================================================================
 * INTERFACE SEGREGATION PRINCIPLE (ISP)
 * Contratos segregados y específicos por área de responsabilidad.
 * ======================================================================= */

export interface ICitasOperations {
  citas: Cita[];
  cambiarEstadoCita: (citaId: string, nuevoEstado: EstadoCita) => void;
  agregarCita: (nuevaCita: Omit<Cita, 'id' | 'creadoEn'>) => void;
  reprogramarCita: (citaId: string, nuevaFecha: string, nuevaHora: string) => void;
  eliminarCita: (citaId: string) => void;
}

export interface IServiciosOperations {
  servicios: Servicio[];
  agregarServicio: (servicio: Omit<Servicio, 'id'>) => void;
  actualizarServicio: (servicio: Servicio) => void;
  eliminarServicio: (servicioId: string) => void;
}

export interface IFiadosOperations {
  fiados: Fiado[];
  agregarFiado: (fiado: Omit<Fiado, 'id'>) => void;
  toggleSaldarFiado: (fiadoId: string) => void;
  eliminarFiado: (fiadoId: string) => void;
}

export interface ICajaAnalytics {
  getResumenCaja: (fecha?: string) => ResumenCaja;
}

export interface INavegacionState {
  vistaActiva: VistaActiva;
  fechaSeleccionada: string;
  setVistaActiva: (vista: VistaActiva) => void;
  setFechaSeleccionada: (fecha: string) => void;
}

export interface AgendaContextType
  extends ICitasOperations,
    IServiciosOperations,
    IFiadosOperations,
    ICajaAnalytics,
    INavegacionState {
  clientesFrecuentes: ClienteFrecuente[];
  cargandoServidor: boolean;
  guardandoServidor: boolean;
  exportarRespaldoJSON: () => void;
  importarRespaldoJSON: (contenidoJSON: string) => boolean;
}
