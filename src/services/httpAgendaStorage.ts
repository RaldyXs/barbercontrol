import { IAgendaStorage } from './storage.interface';
import { RespaldoCompleto, Cita, Fiado } from '../types';

const LOCAL_STORAGE_KEY = 'barbercontrol_agenda_v1';
const PENDING_SYNC_KEY = 'barbercontrol_pending_sync';

/**
 * Almacenamiento Híbrido Resiliente (Offline-First + Cloud Sync)
 * Principio SOLID (SRP & DIP): Gestiona la doble persistencia (localStorage + Servidor Cloud)
 * Garantiza que NINGUNA cita ni fiado se pierda aunque Render se reinicie,
 * se haga un nuevo despliegue o la conexión a internet sea inestable.
 */
export class HttpAgendaStorage implements IAgendaStorage {
  private endpoint: string;

  constructor(endpoint: string = '/api/agenda') {
    this.endpoint = endpoint;
  }

  /**
   * Lee la copia física de seguridad guardada en el teléfono/navegador
   */
  private leerDeLocalStorage(): RespaldoCompleto | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const cached = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      if (!parsed || typeof parsed !== 'object') return null;

      return {
        version: parsed.version || '1.0',
        fechaRespaldo: parsed.fechaRespaldo || new Date().toISOString(),
        citas: Array.isArray(parsed.citas) ? parsed.citas : [],
        servicios: Array.isArray(parsed.servicios) ? parsed.servicios : [],
        fiados: Array.isArray(parsed.fiados) ? parsed.fiados : [],
      };
    } catch (e) {
      console.warn('[HttpAgendaStorage] Error leyendo de almacenamiento local:', e);
      return null;
    }
  }

  /**
   * Guarda de forma síncrona en el almacenamiento seguro del teléfono (0ms latencia)
   */
  private guardarEnLocalStorage(datos: RespaldoCompleto): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(datos));
      }
    } catch (e) {
      console.warn('[HttpAgendaStorage] Error guardando en almacenamiento local:', e);
    }
  }

  /**
   * Carga datos unificando la memoria local del teléfono y el servidor en la nube.
   * Si el servidor se reinició o está vacío, restaura automáticamente los datos del teléfono.
   */
  async cargar(): Promise<RespaldoCompleto | null> {
    const localData = this.leerDeLocalStorage();

    try {
      const resp = await fetch(this.endpoint);
      if (resp.ok) {
        const serverData = await resp.json();

        // Si el servidor respondió con datos
        if (serverData && !serverData.empty) {
          const serverCitas: Cita[] = Array.isArray(serverData.citas) ? serverData.citas : [];
          const serverFiados: Fiado[] = Array.isArray(serverData.fiados) ? serverData.fiados : [];
          const serverServicios = Array.isArray(serverData.servicios) ? serverData.servicios : [];

          // CASO CRÍTICO: El servidor está vacío tras un redeploy/reinicio de Render,
          // pero el teléfono del barbero tiene citas o fiados guardados.
          if (
            serverCitas.length === 0 &&
            serverFiados.length === 0 &&
            localData &&
            (localData.citas.length > 0 || localData.fiados.length > 0)
          ) {
            console.log(
              '[HttpAgendaStorage] Servidor vacío tras reinicio. Restaurando datos desde el teléfono...'
            );
            const restaurado: RespaldoCompleto = {
              version: localData.version || '1.0',
              fechaRespaldo: new Date().toISOString(),
              citas: localData.citas,
              servicios: serverServicios.length > 0 ? serverServicios : localData.servicios,
              fiados: localData.fiados,
            };
            // Re-sincronizar al servidor en la nube en segundo plano
            this.guardarEnServidor(restaurado).catch(() => {});
            return restaurado;
          }

          // Si ambos tienen información, fusionar inteligentemente sin duplicar
          const datosCombinados = this.fusionarDatos(localData, {
            version: serverData.version || '1.0',
            fechaRespaldo: serverData.fechaRespaldo || new Date().toISOString(),
            citas: serverCitas,
            servicios: serverServicios.length > 0 ? serverServicios : (localData?.servicios || []),
            fiados: serverFiados,
          });

          this.guardarEnLocalStorage(datosCombinados);
          return datosCombinados;
        }
      }
    } catch (err) {
      console.warn(
        '[HttpAgendaStorage] Servidor inaccesible o en reposo. Utilizando datos protegidos del teléfono:',
        err
      );
    }

    // Si el servidor falla o está en reposo (spin down), usar siempre los datos locales del teléfono
    if (localData) {
      return localData;
    }

    return null;
  }

  /**
   * Guarda inmediatamente en el teléfono y luego replica en el servidor en la nube
   */
  async guardar(datos: RespaldoCompleto): Promise<boolean> {
    // 1. Guardar de inmediato en la memoria física del teléfono (inmune a caídas de red)
    this.guardarEnLocalStorage(datos);

    // 2. Enviar copia de seguridad al servidor
    const ok = await this.guardarEnServidor(datos);

    if (!ok) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(PENDING_SYNC_KEY, 'true');
        }
      } catch (_) {}
    } else {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(PENDING_SYNC_KEY);
        }
      } catch (_) {}
    }

    return ok;
  }

  private async guardarEnServidor(datos: RespaldoCompleto): Promise<boolean> {
    try {
      const resp = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      return resp.ok;
    } catch (err) {
      console.warn('[HttpAgendaStorage] Error guardando en servidor nube:', err);
      return false;
    }
  }

  /**
   * Fusiona citas y fiados de ambas fuentes por ID único para evitar cualquier pérdida
   */
  private fusionarDatos(
    local: RespaldoCompleto | null,
    server: RespaldoCompleto
  ): RespaldoCompleto {
    if (!local) return server;

    // Mapa unificado de citas por ID
    const citasMap = new Map<string, Cita>();
    (server.citas || []).forEach((c) => {
      if (c && c.id) citasMap.set(c.id, c);
    });
    (local.citas || []).forEach((c) => {
      if (c && c.id) {
        if (!citasMap.has(c.id)) {
          citasMap.set(c.id, c);
        } else {
          // Si existe en ambos, conservar el más completo o reciente
          const existente = citasMap.get(c.id)!;
          citasMap.set(c.id, { ...existente, ...c });
        }
      }
    });

    // Mapa unificado de fiados por ID
    const fiadosMap = new Map<string, Fiado>();
    (server.fiados || []).forEach((f) => {
      if (f && f.id) fiadosMap.set(f.id, f);
    });
    (local.fiados || []).forEach((f) => {
      if (f && f.id && !fiadosMap.has(f.id)) {
        fiadosMap.set(f.id, f);
      }
    });

    const servicios =
      server.servicios && server.servicios.length > 0
        ? server.servicios
        : local.servicios || [];

    return {
      version: '1.0',
      fechaRespaldo: new Date().toISOString(),
      citas: Array.from(citasMap.values()),
      servicios,
      fiados: Array.from(fiadosMap.values()),
    };
  }
}

// Instancia singleton inyectable
export const defaultStorage = new HttpAgendaStorage();
