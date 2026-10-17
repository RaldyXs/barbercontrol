import { IAgendaStorage } from './storage.interface';
import { RespaldoCompleto, Cita, Fiado } from '../types';

const LOCAL_STORAGE_KEY = 'barbercontrol_agenda_v1';
const ELIMINADAS_STORAGE_KEY = 'barbercontrol_citas_eliminadas_v1';
const PENDING_SYNC_KEY = 'barbercontrol_pending_sync';

/**
 * Almacenamiento Híbrido Resiliente (Offline-First + Cloud Sync + Tombstones)
 * Principio SOLID (SRP & DIP):
 * 1. Persistencia dual inmediata: guarda en teléfono (localStorage) y replica en nube (/api/agenda).
 * 2. Cero resurrección de citas: utiliza Tombstones (IDs eliminados) para que las citas borradas
 *    NUNCA vuelvan a aparecer al recargar la página o sincronizar con el servidor.
 * 3. Auto-recuperación: si el servidor de Render se reinicia, restaura citas válidas del teléfono.
 */
export class HttpAgendaStorage implements IAgendaStorage {
  private endpoint: string;

  constructor(endpoint: string = '/api/agenda') {
    this.endpoint = endpoint;
  }

  /**
   * Obtiene el conjunto de IDs de citas eliminadas intencionalmente por el usuario
   */
  private getEliminadas(): Set<string> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return new Set();
      const raw = window.localStorage.getItem(ELIMINADAS_STORAGE_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  /**
   * Registra IDs de citas como eliminadas permanentemente
   */
  private registrarEliminadas(ids: string[]): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage || ids.length === 0) return;
      const set = this.getEliminadas();
      ids.forEach((id) => set.add(id));
      window.localStorage.setItem(
        ELIMINADAS_STORAGE_KEY,
        JSON.stringify(Array.from(set))
      );
    } catch (e) {
      console.warn('[HttpAgendaStorage] Error guardando IDs eliminados:', e);
    }
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

      const eliminadas = this.getEliminadas();
      const citasLimpias = (Array.isArray(parsed.citas) ? parsed.citas : []).filter(
        (c: Cita) => c && c.id && !eliminadas.has(c.id)
      );

      return {
        version: parsed.version || '1.0',
        fechaRespaldo: parsed.fechaRespaldo || new Date().toISOString(),
        citas: citasLimpias,
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
   * Une inteligentemente citas entre el acceso directo y el navegador respetando citas eliminadas.
   */
  async cargar(): Promise<RespaldoCompleto | null> {
    const localData = this.leerDeLocalStorage();
    let eliminadas = this.getEliminadas();

    try {
      // Prevenir cualquier caché agresiva de Safari iOS mediante timestamp y no-store
      const resp = await fetch(`${this.endpoint}?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      if (resp.ok) {
        const serverData = await resp.json();

        // Si el servidor está vacío o reiniciado
        if (serverData && serverData.empty) {
          if (localData && (localData.citas.length > 0 || localData.fiados.length > 0)) {
            console.log(
              '[HttpAgendaStorage] Servidor vacío detectado. Restaurando datos protegidos del teléfono...'
            );
            this.guardarEnServidor(localData).catch(() => {});
            return localData;
          }
        }

        // Si el servidor respondió con datos
        if (serverData && !serverData.empty) {
          // 1. Sincronizar lápidas (tombstones): si otra pestaña o acceso directo eliminó una cita, registrarlo
          const serverEliminadas = Array.isArray(serverData.citasEliminadas)
            ? serverData.citasEliminadas
            : [];
          if (serverEliminadas.length > 0) {
            this.registrarEliminadas(serverEliminadas);
            eliminadas = this.getEliminadas();
          }

          const rawServerCitas: Cita[] = Array.isArray(serverData.citas) ? serverData.citas : [];
          const serverCitas = rawServerCitas.filter((c) => c && c.id && !eliminadas.has(c.id));
          const serverFiados: Fiado[] = Array.isArray(serverData.fiados) ? serverData.fiados : [];
          const serverServicios = Array.isArray(serverData.servicios) ? serverData.servicios : [];

          // 2. Fusión unificada por ID para mantener sincronizados el acceso directo y Safari:
          const citasMap = new Map<string, Cita>();
          serverCitas.forEach((c) => {
            if (c && c.id && !eliminadas.has(c.id)) {
              citasMap.set(c.id, c);
            }
          });

          (localData?.citas || []).forEach((c) => {
            if (c && c.id && !eliminadas.has(c.id)) {
              if (!citasMap.has(c.id)) {
                citasMap.set(c.id, c);
              } else {
                const s = citasMap.get(c.id)!;
                const timeServer = s.creadoEn ? Date.parse(s.creadoEn) : 0;
                const timeLocal = c.creadoEn ? Date.parse(c.creadoEn) : 0;
                citasMap.set(c.id, timeLocal >= timeServer ? c : s);
              }
            }
          });

          // 3. Fusión de fiados
          const fiadosMap = new Map<string, Fiado>();
          serverFiados.forEach((f) => {
            if (f && f.id) fiadosMap.set(f.id, f);
          });
          (localData?.fiados || []).forEach((f) => {
            if (f && f.id && !fiadosMap.has(f.id)) {
              fiadosMap.set(f.id, f);
            }
          });

          const resultado: RespaldoCompleto = {
            version: serverData.version || '1.0',
            fechaRespaldo: new Date().toISOString(),
            citas: Array.from(citasMap.values()),
            servicios: serverServicios.length > 0 ? serverServicios : (localData?.servicios || []),
            fiados: Array.from(fiadosMap.values()),
            citasEliminadas: Array.from(eliminadas).slice(-500),
          };

          this.guardarEnLocalStorage(resultado);
          return resultado;
        }
      }
    } catch (err) {
      console.warn(
        '[HttpAgendaStorage] Servidor no disponible. Usando datos protegidos del teléfono:',
        err
      );
    }

    if (localData) {
      return localData;
    }

    return null;
  }

  /**
   * Guarda inmediatamente en el teléfono y luego replica en el servidor en la nube
   */
  async guardar(datos: RespaldoCompleto): Promise<boolean> {
    // 1. Detectar si alguna cita fue eliminada respecto a la versión anterior en caché
    try {
      const previo = this.leerDeLocalStorage();
      if (previo && Array.isArray(previo.citas)) {
        const nuevosIds = new Set((datos.citas || []).map((c) => c.id));
        const eliminadosAhora = previo.citas
          .filter((c) => c && c.id && !nuevosIds.has(c.id))
          .map((c) => c.id);

        if (eliminadosAhora.length > 0) {
          this.registrarEliminadas(eliminadosAhora);
        }
      }
    } catch (_) {}

    // 2. Filtrar cualquier cita que esté en la lista de eliminadas
    const eliminadas = this.getEliminadas();
    const datosLimpios: RespaldoCompleto = {
      ...datos,
      fechaRespaldo: new Date().toISOString(),
      citas: (datos.citas || []).filter((c) => c && c.id && !eliminadas.has(c.id)),
      citasEliminadas: Array.from(eliminadas).slice(-500),
    };

    // 3. Guardar de inmediato en la memoria física del teléfono (0ms latencia)
    this.guardarEnLocalStorage(datosLimpios);

    // 4. Enviar copia de seguridad al servidor
    const ok = await this.guardarEnServidor(datosLimpios);

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
}

// Instancia singleton inyectable
export const defaultStorage = new HttpAgendaStorage();
