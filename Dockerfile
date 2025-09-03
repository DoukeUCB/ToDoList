# Dockerfile para ToDoList App - Optimizado para producción
FROM node:18-alpine

# Instalar dependencias del sistema para SQLite
RUN apk add --no-cache sqlite

# Crear directorio de la aplicación
WORKDIR /usr/src/app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias incluyendo las de desarrollo para la compilación
RUN npm install

# Copiar el código fuente
COPY src/ ./src/
COPY public/ ./public/

# Compilar TypeScript
RUN npm run build

# Limpiar dependencias de desarrollo
RUN npm prune --production

# Crear directorio para la base de datos con permisos correctos
RUN mkdir -p /usr/src/app/data && chmod 755 /usr/src/app/data

# Exponer el puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/usr/src/app/data/database.sqlite
ENV SESSION_SECRET=douke017

# Inicializar la base de datos y ejecutar la aplicación
CMD ["sh", "-c", "npx ts-node src/database/sync.ts && npm start"]
