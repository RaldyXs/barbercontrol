import { Cita, ClienteFrecuente } from '../types';

/**
 * Servicio de Inteligencia de Clientes (Single Responsibility Principle)
 * Deriva estadísticas y preferencias de clientes basadas en el historial de citas.
 */
export class ClienteService {
  static derivarClientesFrecuentes(citas: Cita[]): ClienteFrecuente[] {
    const mapa = new Map<
      string,
      { nombre: string; telefono: string; ultimoServicioId?: string; totalVisitas: number }
    >();

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
  }
}
