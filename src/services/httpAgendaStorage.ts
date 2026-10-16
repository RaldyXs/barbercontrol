import { IAgendaStorage } from './storage.interface';
import { RespaldoCompleto } from '../types';

/**
 * Implementación concreta de almacenamiento vía API REST (Single Responsibility Principle)
 * Encapsula la comunicación de red con el host y el manejo de errores HTTP.
 */
export class HttpAgendaStorage implements IAgendaStorage {
  private endpoint: string;

  constructor(endpoint: string = '/api/agenda') {
    this.endpoint = endpoint;
  }

  async cargar(): Promise<RespaldoCompleto | null> {
    try {
      const resp = await fetch(this.endpoint);
      if (!resp.ok) return null;

      const data = await resp.json();
      if (!data || data.empty) return null;

      return {
        version: data.version || '1.0',
        fechaRespaldo: data.fechaRespaldo || new Date().toISOString(),
        citas: Array.isArray(data.citas) ? data.citas : [],
        servicios: Array.isArray(data.servicios) ? data.servicios : [],
        fiados: Array.isArray(data.fiados) ? data.fiados : [],
      };
    } catch (err) {
      console.warn('[HttpAgendaStorage] Error al cargar datos del servidor:', err);
      return null;
    }
  }

  async guardar(datos: RespaldoCompleto): Promise<boolean> {
    try {
      const resp = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      return resp.ok;
    } catch (err) {
      console.warn('[HttpAgendaStorage] Error al guardar datos en el servidor:', err);
      return false;
    }
  }
}

// Instancia singleton por defecto inyectable
export const defaultStorage = new HttpAgendaStorage();
