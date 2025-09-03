# Deploy Gratuito en Render - Guía Paso a Paso

## 🚀 Render es la mejor opción gratuita para tu ToDoList App

### Paso 1: Preparar el repositorio en GitHub

1. Ve a GitHub y crea un nuevo repositorio llamado "ToDoList"
2. Sube todo tu código:

```bash
git init
git add .
git commit -m "Initial commit - ToDoList with custom categories"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ToDoList.git
git push -u origin main
```

### Paso 2: Crear cuenta en Render

1. Ve a [render.com](https://render.com)
2. Regístrate con tu cuenta de GitHub (es gratis)
3. Conecta tu repositorio de GitHub

### Paso 3: Crear el Web Service

1. En el dashboard de Render, click en "New +"
2. Selecciona "Web Service"
3. Conecta tu repositorio "ToDoList"
4. Configura lo siguiente:

**Configuración básica:**
- **Name**: `todolist-demo`
- **Region**: `Oregon (US West)`
- **Branch**: `main`
- **Runtime**: `Node`

**Build & Deploy Settings:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run sync && npm start`

**Environment Variables:**
```
NODE_ENV=production
SESSION_SECRET=render_super_secret_key_2024_demo
DB_PATH=data/database.sqlite
PORT=10000
```

### Paso 4: Deploy

1. Click en "Create Web Service"
2. Render automáticamente:
   - Clonará tu repositorio
   - Instalará dependencias
   - Compilará TypeScript
   - Sincronizará la base de datos
   - Iniciará la aplicación

### Paso 5: Acceder a tu aplicación

Una vez completado el deploy (5-10 minutos), tendrás:
- URL pública: `https://todolist-demo.onrender.com`
- Usuario demo: `demo@example.com` / `demo123`

## ✅ Ventajas de Render (Plan Gratuito)

- ✅ 750 horas gratuitas por mes
- ✅ Dominio personalizado incluido
- ✅ SSL automático
- ✅ Auto-deploy desde GitHub
- ✅ Persistencia de datos
- ✅ Logs en tiempo real

## 📝 Notas importantes

- La aplicación puede "dormir" después de 15 minutos de inactividad
- Se reactiva automáticamente al recibir una nueva petición
- Perfecto para demos y portfolios

---

**¡Tu aplicación estará lista en menos de 10 minutos!**
