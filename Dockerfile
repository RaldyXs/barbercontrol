FROM node:18-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente y compilar frontend
COPY . .
RUN npm run build

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000
ENV SYNC_UPSTREAM=https://barbercontrol-59hb.onrender.com
ENV SYNC_INTERVAL_SEC=60

# Puerto de la app
EXPOSE 3000

# Persistencia de datos en volumen
VOLUME ["/app/server-data"]

# Arrancar servidor con sincronizador integrado
CMD ["node", "server.js"]
