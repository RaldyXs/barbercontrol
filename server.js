// Servidor de producción para BarberControl RD
// Funciona en cualquier VPS, servidor local o nube con Node.js (sin dependencias adicionales)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_DIR = path.join(__dirname, 'server-data');
const DB_FILE = path.join(DATA_DIR, 'agenda-db.json');

// Asegurar carpeta de datos en el servidor
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

// Memoria en RAM para responder en 1ms a Cloudflare y no bloquear I/O
let inMemoryAgenda = null;
if (fs.existsSync(DB_FILE)) {
  try {
    inMemoryAgenda = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error cargando base de datos inicial en memoria:', err);
  }
}

const server = http.createServer((req, res) => {
  // Manejo de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = req.url.split('?')[0];

  // ENDPOINT DE API: /api/agenda (Persistencia automática del barbero)
  if (urlPath === '/api/agenda') {
    // Evitar que Safari o cualquier proxy cachee las respuestas de la API
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      if (inMemoryAgenda && !inMemoryAgenda.empty) {
        res.writeHead(200);
        res.end(JSON.stringify(inMemoryAgenda));
        return;
      }
      if (fs.existsSync(DB_FILE)) {
        try {
          const content = fs.readFileSync(DB_FILE, 'utf-8');
          inMemoryAgenda = JSON.parse(content);
          res.writeHead(200);
          res.end(content);
          return;
        } catch (err) {
          console.error('Error leyendo base de datos:', err);
        }
      }
      res.writeHead(200);
      res.end(JSON.stringify({ empty: true }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const incoming = JSON.parse(body);

          // Fusión atómica segura en memoria RAM (ultra rápida)
          let finalData = incoming;
          const existing = inMemoryAgenda || (fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) : null);
          
          if (existing && !existing.empty) {
            // Combinar listas de eliminadas (tombstones)
            const eliminadasSet = new Set([
              ...(Array.isArray(existing.citasEliminadas) ? existing.citasEliminadas : []),
              ...(Array.isArray(incoming.citasEliminadas) ? incoming.citasEliminadas : []),
            ]);

            const fiadosEliminadosSet = new Set([
              ...(Array.isArray(existing.fiadosEliminados) ? existing.fiadosEliminados : []),
              ...(Array.isArray(incoming.fiadosEliminados) ? incoming.fiadosEliminados : []),
            ]);

            // Mapa unificado de citas por ID
            const citasMap = new Map();
            (Array.isArray(existing.citas) ? existing.citas : []).forEach((c) => {
              if (c && c.id && !eliminadasSet.has(c.id)) {
                citasMap.set(c.id, c);
              }
            });
            (Array.isArray(incoming.citas) ? incoming.citas : []).forEach((c) => {
              if (c && c.id && !eliminadasSet.has(c.id)) {
                if (!citasMap.has(c.id)) {
                  citasMap.set(c.id, c);
                } else {
                  const prev = citasMap.get(c.id);
                  const timePrev = prev?.creadoEn ? Date.parse(prev.creadoEn) : 0;
                  const timeInc = c.creadoEn ? Date.parse(c.creadoEn) : 0;
                  citasMap.set(c.id, timeInc >= timePrev ? c : prev);
                }
              }
            });

            // Mapa unificado de fiados por ID
            const fiadosMap = new Map();
            (Array.isArray(existing.fiados) ? existing.fiados : []).forEach((f) => {
              if (f && f.id && !fiadosEliminadosSet.has(f.id)) fiadosMap.set(f.id, f);
            });
            (Array.isArray(incoming.fiados) ? incoming.fiados : []).forEach((f) => {
              if (f && f.id && !fiadosEliminadosSet.has(f.id)) {
                if (fiadosMap.has(f.id)) {
                  const prevFiado = fiadosMap.get(f.id);
                  // Si el fiado entrante no tiene movimientos pero el existente sí, preservarlos
                  if (
                    (!f.movimientos || f.movimientos.length === 0) &&
                    Array.isArray(prevFiado.movimientos) &&
                    prevFiado.movimientos.length > 0
                  ) {
                    f = { ...f, movimientos: prevFiado.movimientos };
                  }
                  // Preservar montoOriginalRD si no viene
                  if (f.montoOriginalRD === undefined && prevFiado.montoOriginalRD !== undefined) {
                    f = { ...f, montoOriginalRD: prevFiado.montoOriginalRD };
                  }
                }
                fiadosMap.set(f.id, f);
              }
            });

            finalData = {
              version: incoming.version || existing.version || '1.0',
              fechaRespaldo: new Date().toISOString(),
              citas: Array.from(citasMap.values()),
              servicios:
                Array.isArray(incoming.servicios) && incoming.servicios.length > 0
                  ? incoming.servicios
                  : existing.servicios || [],
              fiados: Array.from(fiadosMap.values()),
              citasEliminadas: Array.from(eliminadasSet).slice(-500),
              fiadosEliminados: Array.from(fiadosEliminadosSet).slice(-500),
            };
          }

          // Actualizar memoria RAM inmediatamente
          inMemoryAgenda = finalData;

          // Responder a Cloudflare en 1 milisegundo
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));

          // Persistir en disco en segundo plano de forma no bloqueante
          fs.writeFile(DB_FILE, JSON.stringify(finalData, null, 2), 'utf-8', (writeErr) => {
            if (writeErr) console.error('Error guardando en disco:', writeErr);
          });
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Datos no válidos' }));
        }
      });
      return;
    }
  }

  // SERVICIO DE ARCHIVOS ESTÁTICOS (PWA)
  let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback a index.html para SPA
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error interno del servidor');
        return;
      }

      // Control de caché: index.html nunca debe cachearse permanentemente
      if (ext === '.html') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('========================================================');
  console.log(`💈 BarberControl RD está corriendo en tu servidor:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`👉 Base de datos automática en: ${DB_FILE}`);
  console.log('========================================================');

  // Si se configuró SYNC_UPSTREAM, iniciar el demonio de sincronización continuo integrado
  const upstream = process.env.SYNC_UPSTREAM || process.env.RENDER_URL;
  if (upstream) {
    import('./scripts/sync-daemon.js').catch((err) => {
      console.warn('[Sync] No se pudo iniciar el demonio de sincronización integrado:', err.message);
    });
  }
});
