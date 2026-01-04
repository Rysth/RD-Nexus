# MicroBiz Stack

Un stack completo con React (frontend) y AdonisJS API (backend) en un solo repositorio monorepo.

## 🚀 Inicio Rápido

### Requisitos
- [Docker](https://docs.docker.com/get-docker/) y Docker Compose
- Git

### Configuración Automática

1. **Clona el repositorio:**
```bash
git clone https://github.com/TuUsuario/MicroBiz-Stack.git
cd MicroBiz-Stack
```

2. **Ejecuta el script de configuración:**
```bash
chmod +x setup.sh
./setup.sh
```

El script automáticamente:
- Crea `.env` desde `.env.example` si no existe
- Levanta todos los contenedores

3. **Accede a las aplicaciones:**
- Frontend (React): http://localhost:5173
- Backend (AdonisJS API): http://localhost:3333
- Mailpit (Email testing): http://localhost:8025

## 📁 Estructura del Proyecto

```
MicroBiz-Stack/
├── client/                 # Frontend React + TypeScript + Vite
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── backend/                # Backend AdonisJS v6 API
│   ├── app/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── validators/
│   ├── config/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── start/
│   │   └── routes.ts
│   ├── Dockerfile
│   └── package.json
├── mobile/                 # App móvil React Native + Expo
│   ├── app/
│   └── package.json
├── docker-compose.dev.yml  # Configuración Docker (desarrollo)
├── docker-compose.yml      # Configuración Docker (producción)
├── .env.example            # Variables de entorno
├── setup.sh                # Script de configuración
└── README.md
```

## 🔧 Comandos Útiles

### Desarrollo
```bash
# Levantar todos los servicios
./setup.sh

# Levantar servicios manualmente
docker compose -f docker-compose.dev.yml up

# Detener servicios
docker compose -f docker-compose.dev.yml down

# Ver logs
docker compose -f docker-compose.dev.yml logs -f

# Ver logs de un servicio específico
docker compose -f docker-compose.dev.yml logs -f backend

# Reconstruir contenedores
docker compose -f docker-compose.dev.yml up --build
```

### Base de Datos (AdonisJS)
```bash
# Acceder al contenedor AdonisJS
docker compose -f docker-compose.dev.yml exec backend sh

# Ejecutar migraciones
docker compose -f docker-compose.dev.yml exec backend node ace migration:run

# Revertir última migración
docker compose -f docker-compose.dev.yml exec backend node ace migration:rollback

# Ver estado de migraciones
docker compose -f docker-compose.dev.yml exec backend node ace migration:status

# Ejecutar seeders
docker compose -f docker-compose.dev.yml exec backend node ace db:seed

# Ejecutar seeder específico
docker compose -f docker-compose.dev.yml exec backend node ace db:seed --files database/seeders/admin_seeder.ts

# Refrescar base de datos (rollback + migrate + seed)
docker compose -f docker-compose.dev.yml exec backend node ace migration:fresh --seed
```

### Consola y REPL
```bash
# REPL de AdonisJS (similar a rails console)
docker compose -f docker-compose.dev.yml exec backend node ace repl

# Listar todos los comandos disponibles
docker compose -f docker-compose.dev.yml exec backend node ace list
```

### Cache y Redis
```bash
# Acceder a Redis CLI
docker compose -f docker-compose.dev.yml exec redis redis-cli

# Limpiar todo el cache
docker compose -f docker-compose.dev.yml exec redis redis-cli FLUSHALL

# Ver keys en cache
docker compose -f docker-compose.dev.yml exec redis redis-cli KEYS "*"
```

### Administración
```bash
# Crear cuenta de administrador (ejecutar seeder)
docker compose -f docker-compose.dev.yml exec backend node ace db:seed --files database/seeders/admin_seeder.ts

# Reiniciar contenedor backend
docker compose -f docker-compose.dev.yml restart backend

# Ver logs del contenedor backend
docker compose -f docker-compose.dev.yml logs -f backend
```

## ⚙️ Configuración

### Variables de Entorno
Copia `.env.example` a `.env` y ajusta las variables según tu entorno:

```bash
cp .env.example .env
```

### Configuraciones Importantes
- `VITE_API_URL` - URL de la API para el frontend
- `DB_HOST`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` - Configuración de PostgreSQL
- `REDIS_HOST`, `REDIS_PORT` - Configuración de Redis
- `ADONIS_APP_KEY` - Clave secreta de la aplicación (generar con `node ace generate:key`)

## 🐳 Servicios Docker

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| client | 5173 | Frontend React + Vite |
| backend | 3333 | Backend AdonisJS API |
| postgres | 5432 | Base de datos PostgreSQL |
| redis | 6379 | Cache y sesiones |
| jobs | - | Worker para jobs en background |
| mailpit | 8025 / 1025 | Testing de emails (Web UI / SMTP) |

## 🔍 Desarrollo

### Frontend (React + Vite)
```bash
cd client
npm install
npm run dev
```

### Backend (AdonisJS)
```bash
cd backend
npm install
node ace serve --watch
```

### Generar recursos (AdonisJS)
```bash
# Crear nuevo controlador
node ace make:controller NombreController

# Crear nuevo modelo
node ace make:model Nombre -m  # -m genera migración también

# Crear nueva migración
node ace make:migration nombre_tabla

# Crear nuevo seeder
node ace make:seeder NombreSeeder

# Crear nuevo middleware
node ace make:middleware NombreMiddleware

# Crear nuevo validador
node ace make:validator NombreValidator
```

## 📝 Notas

- **Estructura monorepo**: Este repositorio contiene frontend, backend y app móvil en carpetas separadas
- **Hot reloading**: Todos los servicios soportan recarga automática durante el desarrollo
- **Persistencia**: Los datos de PostgreSQL y Redis se mantienen en volúmenes Docker
- **Jobs**: Los trabajos en background se procesan con `@rlanz/adonisjs-jobs` usando Redis

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Añadir nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

Creado por [RysthDesign](https://rysthdesign.com/)

