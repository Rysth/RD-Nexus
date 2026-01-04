# Nexus (by RysthDesign)

Proyecto **100% personal** para administrar mis clientes, proyectos, servicios recurrentes, cotizaciones y facturación (incluyendo una base para futura facturación electrónica en Ecuador).

Stack monorepo:
- **Backend**: AdonisJS v6 (API) + Lucid ORM
- **Frontend**: React + TypeScript + Vite
- **Mobile**: Expo / React Native
- **Infra local**: Docker + PostgreSQL + Redis + Mailpit

## 🚀 Inicio Rápido

### Requisitos
- [Docker](https://docs.docker.com/get-docker/) y Docker Compose
- Git

### Configuración Automática

1. **Clona el repositorio:**
```bash
git clone git@github.com:Rysth/RD-Nexus.git
cd RD-Nexus
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

## 🎯 Objetivo del Proyecto

Centralizar mi operación (RysthDesign) en un solo sistema:
- Saber **quién es el cliente** y **qué software** le vendí
- Automatizar **cobros recurrentes** (mensual/anual)
- Crear **cotizaciones** con items y generar **PDF**
- Convertir cotizaciones aprobadas en **facturas**
- Ejecutar **recordatorios automáticos** por scheduler + email

La prioridad es simple: que sea mantenible y útil para mí.

## 📁 Estructura del Proyecto

```
RD-Nexus/
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

## 🧩 Roadmap Funcional (Módulos)

### Módulo 1: Gestión de Clientes y Proyectos (La base)

**Objetivo**: estructurar quién es el cliente y qué software se le vendió.

**Entidades**
- `clients`
	- `id`
	- `name` (nombre o razón social)
	- `identification_type` (Ecuador: RUC=04, Cédula=05, Pasaporte=06)
	- `identification` (RUC/Cédula)
	- `email`
	- `phone`
	- `address`
	- `created_at`, `updated_at`
- `projects`
	- `id`
	- `client_id` (FK)
	- `name` (ej: QuickInventory)
	- `production_url`
	- `start_date`
	- `status` (enum: `active`, `maintenance`, `canceled`)
	- `created_at`, `updated_at`

**Relaciones (Lucid)**
- Un `Client` **hasMany** `Project`
- Un `Project` **belongsTo** `Client`

### Módulo 2: Servicios Recurrentes (Automatización del cobro)

**Objetivo**: definir qué se cobra mes a mes o anualmente por proyecto.

**Entidad**: `recurring_services`
- `id`
- `project_id` (FK)
- `name` (ej: “Mantenimiento Mensual”, “Hosting Anual”)
- `amount` (precio)
- `billing_cycle` (enum: `monthly`, `yearly`)
- `next_billing_date`
- `status` (enum: `active`, `paused`)
- `created_at`, `updated_at`

**API**
- CRUD básico en controlador para gestionar servicios recurrentes de un proyecto.

### Módulo 3: Cotizaciones (Upselling)

**Objetivo**: cotizar mejoras/cambios por proyecto.

**Entidades**
- `quotes`
	- `id`
	- `project_id` (FK)
	- `issue_date`
	- `valid_until`
	- `status` (enum: `draft`, `sent`, `approved`, `rejected`)
	- `total`
	- `created_at`, `updated_at`
- `quote_items`
	- `id`
	- `quote_id` (FK)
	- `description` (ej: “Módulo de reportes”)
	- `quantity`
	- `unit_price`
	- `subtotal`
	- `created_at`, `updated_at`

**Lógica**
- Método en controlador para crear una cotización con **items anidados** en una sola operación.

**PDF**
- Servicio backend que reciba una `quote` y genere un PDF simple con el logo de **RysthDesign** (librería sugerida: `pdfmake` o `puppeteer`).

### Módulo 4: Facturación y Conversión

**Objetivo**: facturar cotizaciones aprobadas y cobros recurrentes.

**Entidad**: `invoices`
- `id`
- `project_id` (FK)
- `number` (secuencial)
- `issue_date`
- `due_date`
- `status` (enum: `pending`, `paid`, `voided`)
- `total`
- Preparación facturación electrónica (fase futura):
	- `access_key` (clave de acceso SRI)
	- `xml_content`
- `created_at`, `updated_at`

**Conversión (quote → invoice)**
- Función que reciba el ID de una `quote` **aprobada** y genere una `invoice` copiando sus items.

**Impuestos (RIMPE)**
- IVA configurable, por defecto **0% / exento**.
- Mantener una tabla separada `taxes` como base para cambios de régimen a futuro.

### Módulo 5: Automatización y Cron Jobs (Recordatorios)

**Objetivo**: evitar recordatorios manuales y generar facturas recurrentes.

**Scheduler (AdonisJS)**
- Usar `@adonisjs/scheduler`.

**Job `BillingReminder`**
- Se ejecuta todos los días a las **8:00 AM**.
- Busca en `recurring_services` los registros donde `next_billing_date` sea **hoy** (o hoy + 3 días, según se configure).
- Por cada servicio:
	- Genera una nueva `invoice`.
	- Envía correo al cliente usando **Adonis Mail**:
		- “Hola [Cliente], tu factura por [Servicio] del proyecto [Proyecto] ya está generada por un valor de [Monto]”.
	- Actualiza `next_billing_date` (+1 mes o +1 año según `billing_cycle`).

## 🧱 Resumen Técnico (para mi yo desarrollador)

### Backend (AdonisJS)
- Lucid ORM para relaciones y consultas.
- Adonis Mail para envíos (SMTP Gmail / Resend / Mailgun como opciones).
- `@adonisjs/scheduler` para automatización diaria.

### Frontend (React)
- Dashboard: vista rápida de “Pagos pendientes este mes”.
- Detalle de Proyecto: tabs para “Servicios Recurrentes”, “Historial de Cotizaciones”, “Facturas”.
- En cotizaciones: botón “Convertir a Factura” que consume la API.

### Facturación Electrónica (Ecuador) — fase futura
- Mantener `identification_type` en clientes (RUC=04, Cédula=05, Pasaporte=06).
- Reservar campos `access_key` y `xml_content` en facturas.
- Tabla `taxes` para evolucionar la lógica tributaria si cambia el régimen.

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

