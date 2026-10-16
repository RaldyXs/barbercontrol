import { Cita, Servicio, ResumenCaja } from '../types';

/**
 * Calculador de Métricas de Caja (Single Responsibility & Open/Closed Principle)
 * Función pura desacoplada de la interfaz gráfica y de React.
 */
export class CajaCalculator {
  static calcular(
    citas: Cita[],
    servicios: Servicio[],
    fecha: string
  ): ResumenCaja {
    const citasSeguras = Array.isArray(citas) ? citas : [];
    const serviciosSeguros = Array.isArray(servicios) ? servicios : [];

    const citasDelDia = citasSeguras.filter(
      (c) => c && c.fecha === fecha && !c.esBloqueo
    );

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
  }
}
