import { RespaldoCompleto } from '../types';

/**
 * Contrato de Persistencia (Dependency Inversion & Liskov Substitution)
 * Define la abstracción de almacenamiento sin acoplar a implementaciones concretas
 * como Fetch HTTP, LocalStorage o SQLite.
 */
export interface IAgendaStorage {
  cargar(): Promise<RespaldoCompleto | null>;
  guardar(datos: RespaldoCompleto): Promise<boolean>;
}
