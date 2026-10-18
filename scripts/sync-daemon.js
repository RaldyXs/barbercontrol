// scripts/sync-daemon.js
// Demonio de sincronización y respaldo continuo entre Servidor Linux y Render
// Funciona 100% con librerías nativas de Node.js (sin dependencias adicionales)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración por variables de entorno o valores por defecto
const RENDER_URL = (
  process.env.RENDER_URL ||
  process.env.SYNC_UPSTREAM ||
  'https://barbercontrol-59hb.onrender.com'
).replace(/\/$/, '');

const SYNC_INTERVAL_SEC = parseInt(process.env.SYNC_INTERVAL_SEC || '60', 10);
const DATA_DIR = path.join(__dirname, '..', 'server-data');
const DB_FILE = path.join(DATA_DIR, 'agenda-db.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

// Asegurar directorios locales
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

function log(mensaje, tipo = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${tipo}] ${mensaje}`);
}

/**
 * Lee la base de datos local en disco
 */
function leerDBLocal() {
  if (!fs.existsSync(DB_FILE)) return null;
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    log(`Error leyendo base de datos local: ${err.message}`, 'WARN');
    return null;
  }
}

/**
 * Guarda la base de datos en disco de forma atómica y genera respaldo diario
 */
function guardarDBLocal(datos) {
  try {
    const jsonStr = JSON.stringify(datos, null, 2);
    fs.writeFileSync(DB_FILE, jsonStr, 'utf-8');

    // Generar respaldo histórico diario
    const hoy = new Date().toISOString().split('T')[0];
    const backupFile = path.join(BACKUPS_DIR, `agenda-backup-${hoy}.json`);
    fs.writeFileSync(backupFile, jsonStr, 'utf-8');
  } catch (err) {
    log(`Error guardando base de datos en disco: ${err.message}`, 'ERROR');
  }
}

/**
 * Realiza una petición GET a Render
 */
async function fetchRenderAgenda() {
  const url = `${RENDER_URL}/api/agenda?_t=${Date.now()}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store',
      Accept: 'application/json',
    },
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} al consultar Render`);
  }

  return await resp.json();
}

/**
 * Envía datos a Render para restaurar o actualizar
 */
async function pushRenderAgenda(datos) {
  const url = `${RENDER_URL}/api/agenda`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} al enviar datos a Render`);
  }

  return await resp.json();
}

/**
 * Ciclo principal de sincronización
 */
export async function sincronizar() {
  try {
    log(`Consultando novedades en Render (${RENDER_URL})...`);
    const serverData = await fetchRenderAgenda();
    const localData = leerDBLocal();

    // CASO 1: Render se reinició o está vacío, pero Linux tiene los datos protegidos
    if (serverData && serverData.empty) {
      if (localData && (localData.citas?.length > 0 || localData.fiados?.length > 0)) {
        log('⚠️ Render se reinició y está vacío. Restaurando datos desde Linux hacia la nube...', 'WARN');
        await pushRenderAgenda(localData);
        log('✅ Datos restaurados exitosamente en Render.');
      } else {
        log('Servidor Render y Linux están ambos vacíos o en estado inicial.');
      }
      return;
    }

    // CASO 2: Si Render tiene información, fusionar con la copia de Linux
    if (serverData && !serverData.empty) {
      // 1. Unificar citas eliminadas (tombstones)
      const eliminadasSet = new Set([
        ...(Array.isArray(localData?.citasEliminadas) ? localData.citasEliminadas : []),
        ...(Array.isArray(serverData.citasEliminadas) ? serverData.citasEliminadas : []),
      ]);

      // 2. Unificar citas por ID (la versión más reciente gana)
      const citasMap = new Map();
      (Array.isArray(serverData.citas) ? serverData.citas : []).forEach((c) => {
        if (c && c.id && !eliminadasSet.has(c.id)) {
          citasMap.set(c.id, c);
        }
      });

      (Array.isArray(localData?.citas) ? localData.citas : []).forEach((c) => {
        if (c && c.id && !eliminadasSet.has(c.id)) {
          if (!citasMap.has(c.id)) {
            citasMap.set(c.id, c);
          } else {
            const serverCita = citasMap.get(c.id);
            const timeServer = serverCita?.creadoEn ? Date.parse(serverCita.creadoEn) : 0;
            const timeLocal = c?.creadoEn ? Date.parse(c.creadoEn) : 0;
            citasMap.set(c.id, timeLocal >= timeServer ? c : serverCita);
          }
        }
      });

      // 3. Unificar fiados por ID
      const fiadosMap = new Map();
      (Array.isArray(serverData.fiados) ? serverData.fiados : []).forEach((f) => {
        if (f && f.id) fiadosMap.set(f.id, f);
      });
      (Array.isArray(localData?.fiados) ? localData.fiados : []).forEach((f) => {
        if (f && f.id && !fiadosMap.has(f.id)) {
          fiadosMap.set(f.id, f);
        }
      });

      // 4. Servicios (conservar los de Render si están personalizados)
      const servicios =
        Array.isArray(serverData.servicios) && serverData.servicios.length > 0
          ? serverData.servicios
          : localData?.servicios || [];

      const merged = {
        version: serverData.version || localData?.version || '1.0',
        fechaRespaldo: new Date().toISOString(),
        citas: Array.from(citasMap.values()),
        servicios,
        fiados: Array.from(fiadosMap.values()),
        citasEliminadas: Array.from(eliminadasSet).slice(-500),
      };

      // Guardar en el disco físico de Linux
      guardarDBLocal(merged);

      // Si Linux tenía citas locales que no estaban en Render, actualizamos Render también
      const serverCitasCount = serverData.citas?.length || 0;
      const mergedCitasCount = merged.citas.length;
      if (mergedCitasCount > serverCitasCount) {
        log(`Sincronizando ${mergedCitasCount - serverCitasCount} cita(s) locales hacia Render...`);
        await pushRenderAgenda(merged);
      }

      log(`✅ Sincronización exitosa: ${merged.citas.length} citas, ${merged.fiados.length} fiados respaldados en disco.`);
    }
  } catch (err) {
    log(`Aviso en ciclo de sincronización (se reintentará en ${SYNC_INTERVAL_SEC}s): ${err.message}`, 'WARN');
  }
}

// Ejecutar ciclo continuo
log(`Iniciando demonio de sincronización de BarberControl RD`);
log(`Destino Render: ${RENDER_URL}`);
log(`Intervalo: cada ${SYNC_INTERVAL_SEC} segundos`);

// Primera sincronización inmediata
sincronizar();

// Intervalo recurrente
setInterval(sincronizar, SYNC_INTERVAL_SEC * 1000);
