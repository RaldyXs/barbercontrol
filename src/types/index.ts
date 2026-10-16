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
