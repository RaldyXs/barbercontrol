# 🐧 Guía de Despliegue en Servidor Linux: BarberControl RD

Esta guía te permite correr **BarberControl RD** en tu servidor Linux local en paralelo con **Render** (`https://barbercontrol-59hb.onrender.com`).

Tu servidor Linux descargará automáticamente cada 60 segundos cualquier novedad que registre el barbero, la guardará en su disco duro físico permanente y generará respaldos diarios automáticos en `server-data/backups/`. Si Render alguna vez se reinicia y queda vacío, tu Linux le devolverá los datos a la nube en segundos.

---

## 📋 Requisitos Previos en tu Linux

Tener instalado **Node.js 18+** y **Git**:
```bash
# Verificar versiones en tu terminal de Linux
node -v
git --version
```
*(Si no los tienes instalados en Ubuntu/Debian: `sudo apt update && sudo apt install -y nodejs npm git`)*

---

## 🚀 Paso 1: Clonar y Preparar el Proyecto en Linux

Abre la terminal en tu servidor Linux y ejecuta:

```bash
# 1. Clonar el repositorio
git clone https://github.com/RaldyXs/barbercontrol.git
cd barbercontrol

# 2. Instalar dependencias y compilar el frontend
npm install
npm run build
```

---

## ⚙️ Paso 2: Ejecutar en tu Servidor Linux (Elige tu opción preferida)

### Opción A: Con PM2 (Recomendada para fácil gestión)

Si usas **PM2**, ya te dejamos el archivo `ecosystem.config.cjs` listo:

```bash
# 1. Instalar PM2 globalmente (si no lo tienes)
sudo npm install -g pm2

# 2. Iniciar el servicio con sincronización continua a Render
pm2 start ecosystem.config.cjs

# 3. Guardar para que arranque automáticamente si reinicias el servidor Linux
pm2 save
pm2 startup
```

* **Ver estado:** `pm2 status`
* **Ver registros de sincronización en vivo:** `pm2 logs barbercontrol-server`
* **Reiniciar:** `pm2 restart barbercontrol-server`

---

### Opción B: Con Systemd (Servicio nativo del sistema Linux)

Crea el archivo de servicio del sistema:

```bash
sudo nano /etc/systemd/system/barbercontrol.service
```

Pega el siguiente contenido (ajusta la ruta `/home/tu_usuario/barbercontrol` según tu ruta real):

```ini
[Unit]
Description=BarberControl RD - Servidor Local y Sincronizador
After=network.target

[Service]
Type=simple
User=tu_usuario
WorkingDirectory=/home/tu_usuario/barbercontrol
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=PORT=3000
Environment=NODE_ENV=production
Environment=SYNC_UPSTREAM=https://barbercontrol-59hb.onrender.com
Environment=SYNC_INTERVAL_SEC=60

[Install]
WantedBy=multi-user.target
```

Luego activa y arranca el servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl enable barbercontrol
sudo systemctl start barbercontrol
```

* **Ver estado:** `sudo systemctl status barbercontrol`
* **Ver logs en vivo:** `sudo journalctl -u barbercontrol -f`

---

### Opción C: Modo Solo Sincronizador / Respaldo (Sin levantar servidor web local)

Si **solo quieres que tu Linux respalde y cuide a Render en segundo plano** sin abrir el puerto 3000:

```bash
# Ejecutar el demonio de respaldo directo
node scripts/sync-daemon.js
```

O en segundo plano con `nohup`:
```bash
nohup node scripts/sync-daemon.js > sync.log 2>&1 &
```

---

## 🔍 ¿Dónde se guardan los datos en tu Linux?

1. **Base de datos activa:** `server-data/agenda-db.json`
2. **Respaldos históricos diarios:** `server-data/backups/agenda-backup-YYYY-MM-DD.json`

Puedes revisar tus datos en cualquier momento en Linux ejecutando:
```bash
cat server-data/agenda-db.json
ls -la server-data/backups/
```

---

## 🌐 Acceso Local
Desde cualquier computadora, tablet o celular conectado al mismo Wi-Fi de tu casa o local:
👉 `http://IP_DE_TU_LINUX:3000` (Ejemplo: `http://192.168.1.100:3000`)
