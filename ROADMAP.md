# Nexus — Roadmap (Milestones)

Este roadmap es para avanzar **milestone por milestone** en Nexus (uso 100% personal), priorizando lo esencial para operar RysthDesign.

## Convenciones
- Cada milestone debe terminar con:
  - Migraciones + modelos + relaciones listas (si aplica)
  - Endpoints API funcionales (mínimo viable)
  - Validaciones y manejo de errores básico
  - Un flujo UI mínimo si aplica (pantalla o sección)

---

## Milestone 0 — Base del proyecto (Infra + estándares)
**Objetivo**: entorno estable para iterar rápido.

**Entregables**
- Backend (AdonisJS)
  - Variables `.env` documentadas (DB/Redis/Mail)
  - Seeds mínimos si se necesitan (admin/usuario)
  - Reglas básicas de CORS/auth según lo que ya exista
- Docker
  - `docker-compose.dev.yml` levanta todo sin pasos manuales extra

**Criterio de hecho**
- `./setup.sh` levanta stack y se puede acceder a backend/frontend.

---

## Milestone 1 — Módulo 1: Clientes y Proyectos (Base)
**Objetivo**: saber quién es el cliente y qué proyecto/software tiene.

**Backend**
- DB
  - `clients`: name, identification_type (04/05/06), identification, email, phone, address, timestamps
  - `projects`: client_id, name, production_url, start_date, status (active/maintenance/canceled), timestamps
- Lucid
  - `Client` hasMany `Project`
  - `Project` belongsTo `Client`
- API (mínimo viable)
  - CRUD de clients
  - CRUD de projects
  - Endpoint para listar projects por client

**Frontend (mínimo viable)**
- Listado de clientes
- Detalle de cliente con listado de proyectos

**Criterio de hecho**
- Se puede crear un cliente y asignarle uno o más proyectos desde UI.

---

## Milestone 2 — Módulo 2: Servicios Recurrentes
**Objetivo**: definir cobros recurrentes por proyecto.

**Backend**
- DB
  - `recurring_services`: project_id, name, amount, billing_cycle (monthly/yearly), next_billing_date, status (active/paused), timestamps
- API (mínimo viable)
  - CRUD de servicios recurrentes por proyecto
  - Validaciones: amount > 0, next_billing_date válida, billing_cycle permitido

**Frontend (mínimo viable)**
- En detalle de proyecto: sección/tab “Servicios Recurrentes”
  - Crear/editar/pausar servicio

**Criterio de hecho**
- Un proyecto puede tener varios servicios recurrentes activos/pausados.

---

## Milestone 3 — Módulo 3: Cotizaciones + PDF
**Objetivo**: crear cotizaciones con items y generar PDF.

**Backend**
- DB
  - `quotes`: project_id, issue_date, valid_until, status (draft/sent/approved/rejected), total, timestamps
  - `quote_items`: quote_id, description, quantity, unit_price, subtotal, timestamps
- API (mínimo viable)
  - Crear quote con items anidados (transacción)
  - Recalcular totales en backend (source of truth)
  - Cambiar status (draft→sent→approved/rejected)
- PDF
  - Servicio: generar PDF simple de una quote (logo RysthDesign)

**Frontend (mínimo viable)**
- En detalle de proyecto: tab “Cotizaciones”
  - Crear cotización con items
  - Ver detalle y descargar PDF

**Criterio de hecho**
- Se puede crear una cotización con 2+ items y descargar un PDF coherente.

---

## Milestone 4 — Módulo 4: Facturas + Conversión (Quote → Invoice)
**Objetivo**: facturar y convertir cotizaciones aprobadas.

**Backend**
- DB
  - `invoices`: project_id, number (secuencial), issue_date, due_date, status (pending/paid/voided), total, access_key, xml_content, timestamps
  - (Opcional si se mantiene simetría) `invoice_items` similar a `quote_items`
- Conversión
  - Endpoint/servicio: recibe quote aprobada → genera invoice + items
- Impuestos
  - IVA configurable (por defecto 0%/exento)
  - Tabla `taxes` preparada para futuro

**Frontend (mínimo viable)**
- En detalle de proyecto: tab “Facturas”
  - Listar facturas y ver estado
- En detalle de cotización: botón “Convertir a Factura”

**Criterio de hecho**
- Una quote aprobada se convierte en invoice en 1 clic, conservando items y total.

---

## Milestone 5 — Módulo 5: Scheduler + BillingReminder
**Objetivo**: automatizar generación de facturas recurrentes y enviar correos.

**Backend**
- Scheduler
  - Configurar `@adonisjs/scheduler`
  - Job `BillingReminder` diario 8:00 AM
- Lógica del job
  - Buscar recurring_services con next_billing_date = hoy (o hoy + 3 días)
  - Generar invoice automáticamente
  - Enviar email: “Hola [Cliente], tu factura por [Servicio] del proyecto [Proyecto] ya está generada por un valor de [Monto]”
  - Actualizar next_billing_date (+1 mes/+1 año)

**Criterio de hecho**
- Ejecutando el job manualmente en dev: crea facturas y manda emails (Mailpit).

---

## Backlog (post-M5, cuando haga falta)
- Facturación electrónica SRI (fase 2)
- Reportes (ingresos por mes, MRR/ARR personal)
- Exportaciones (CSV/PDF)
