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
      if (fs.existsSync(DB_FILE)) {
        try {
          const content = fs.readFileSync(DB_FILE, 'utf-8');
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

          // Fusión atómica segura en servidor: sincroniza acceso directo y web sin sobreescribir
          let finalData = incoming;
          if (fs.existsSync(DB_FILE)) {
            try {
              const existingRaw = fs.readFileSync(DB_FILE, 'utf-8');
              const existing = JSON.parse(existingRaw);
              if (existing && !existing.empty) {
                // Combinar listas de eliminadas (tombstones)
                const eliminadasSet = new Set([
                  ...(Array.isArray(existing.citasEliminadas) ? existing.citasEliminadas : []),
                  ...(Array.isArray(incoming.citasEliminadas) ? incoming.citasEliminadas : []),
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
                  if (f && f.id) fiadosMap.set(f.id, f);
                });
                (Array.isArray(incoming.fiados) ? incoming.fiados : []).forEach((f) => {
                  if (f && f.id) fiadosMap.set(f.id, f);
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
                };
              }
            } catch (mergeErr) {
              console.error('Error fusionando datos en servidor:', mergeErr);
            }
          }

          fs.writeFileSync(DB_FILE, JSON.stringify(finalData, null, 2), 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));
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
});
