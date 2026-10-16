import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Plugin de servidor para persistencia directa en el backend / host
function apiBackendPlugin(): Plugin {
  const dataDir = path.resolve(__dirname, 'server-data')
  const dbFile = path.join(dataDir, 'agenda-db.json')

  return {
    name: 'api-backend-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] || ''
        if (url === '/api/agenda') {
          if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true })
          }

          if (req.method === 'GET') {
            if (fs.existsSync(dbFile)) {
              try {
                const data = fs.readFileSync(dbFile, 'utf-8')
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(data)
                return
              } catch (e) {
                console.error('Error leyendo base de datos:', e)
              }
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ empty: true }))
            return
          }

          if (req.method === 'POST') {
            let body = ''
            req.setEncoding('utf-8')
            req.on('data', (chunk) => {
              body += chunk
            })
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body)
                if (parsed && parsed.reset === true) {
                  if (fs.existsSync(dbFile)) {
                    try { fs.unlinkSync(dbFile) } catch {}
                  }
                  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                  res.end(JSON.stringify({ ok: true, reset: true }))
                  return
                }
                fs.writeFile(dbFile, JSON.stringify(parsed, null, 2), (err) => {
                  if (err) console.error('Error escribiendo en db:', err)
                })
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }))
              } catch {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({ error: 'JSON inválido' }))
              }
            })
            req.on('error', () => {
              res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
              res.end(JSON.stringify({ error: 'Error de conexión' }))
            })
            return
          }
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    apiBackendPlugin(),
  ],
  server: {
    port: 5173,
    host: true,
  },
})
