# Dockerfile para ToDoList App
FROM node:20-alpine

# Crear directorio de la aplicación
WORKDIR /usr/src/app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm ci --only=production

# Instalar TypeScript globalmente para la compilación
RUN npm install -g typescript ts-node

# Copiar el código fuente
COPY src/ ./src/
COPY public/ ./public/

# Compilar TypeScript
RUN npm run build

# Crear directorio para la base de datos
RUN mkdir -p data

# Exponer el puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=data/database.sqlite

# Inicializar la base de datos y ejecutar la aplicación
CMD ["sh", "-c", "npx ts-node src/database/sync.ts && npm start"]
