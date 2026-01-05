# Nexus — Roadmap (Milestones)

Roadmap para avanzar **milestone por milestone** en Nexus (uso 100% personal), priorizando lo esencial para operar RysthDesign.

## Convenciones
- [ ] Cada milestone cierra con: migraciones/modelos/relaciones listas, API mínima operativa, validaciones básicas y una UI mínima cuando aplique.

---

## Milestone 0 — Base del proyecto (Infra + estándares)
**Objetivo**: entorno estable para iterar rápido.

- [x] `.env` documentado (DB/Redis/Mail) y presente tras `./setup.sh`
- [x] `docker-compose.dev.yml` levanta todo sin pasos manuales extra
- [x] `./setup.sh` corre migraciones y seeds en dev sin fallar
- [x] Acceso OK: frontend 5173, backend 3333, Mailpit 8025

---

## Milestone 1 — Clientes y Proyectos (Base)
**Objetivo**: saber quién es el cliente y qué proyecto/software tiene.

- DB/Modelos
  - [x] Migration `clients` (name, identification_type 04/05/06, identification, email, phone, address, timestamps)
  - [x] Migration `projects` (client_id, name, production_url, start_date, status active/maintenance/canceled, timestamps)
  - [x] Relaciones Lucid: `Client` hasMany `Project`, `Project` belongsTo `Client`
- API
  - [x] CRUD clients
  - [x] CRUD projects
  - [x] Listar projects por client
- Frontend
  - [x] Lista de clientes
  - [x] Detalle de cliente con proyectos
- Done
  - [x] Crear cliente + asignar proyectos desde UI funciona

---

## Milestone 2 — Servicios Recurrentes
**Objetivo**: definir cobros recurrentes por proyecto.

- DB/Modelos
  - [x] Migration `recurring_services` (project_id, name, amount, billing_cycle monthly/yearly, next_billing_date, status active/paused, timestamps)
- API
  - [x] CRUD de servicios recurrentes por proyecto
  - [x] Validaciones: amount > 0, fecha válida, ciclo permitido
- Frontend
  - [x] En detalle de proyecto: tab/section "Servicios Recurrentes" con crear/editar/pausar
- Done
  - [x] Proyecto puede tener múltiples servicios recurrentes activos/pausados

---

## Milestone 3 — Cotizaciones + PDF ✅
**Objetivo**: crear cotizaciones con items y generar PDF.

- DB/Modelos
  - [x] Migration `quotes` (project_id, issue_date, valid_until, status draft/sent/approved/rejected, total, timestamps)
  - [x] Migration `quote_items` (quote_id, description, quantity, unit_price, subtotal, timestamps)
- API
  - [x] Crear quote con items anidados (transacción + recalcular total)
  - [x] Cambiar status (draft→sent→approved/rejected)
- PDF
  - [x] Servicio para generar PDF simple (logo RysthDesign)
- Frontend
  - [x] Tab "Cotizaciones": crear con items, ver detalle y descargar PDF
- Done
  - [x] Crear cotización con 2+ items y descargar PDF coherente

---

## Milestone 4 — Facturas + Conversión (Quote → Invoice)
**Objetivo**: facturar cotizaciones aprobadas y cobros recurrentes.

- DB/Modelos
  - [ ] Migration `invoices` (project_id, number secuencial, issue_date, due_date, status pending/paid/voided, total, access_key, xml_content, timestamps)
  - [ ] (Opcional) `invoice_items` si se quiere simetría con quotes
  - [ ] Tabla `taxes` preparada para IVA configurable (default 0%/exento)
- API
  - [ ] Servicio: quote aprobada → invoice + items copiados
- Frontend
  - [ ] Tab "Facturas": listar/ver estado
  - [ ] En detalle de cotización: botón "Convertir a Factura"
- Done
  - [ ] Quote aprobada se convierte en invoice en 1 clic conservando items/total

---

## Milestone 5 — Scheduler + BillingReminder
**Objetivo**: automatizar facturas recurrentes y correos.

- Infra
  - [ ] Configurar `@adonisjs/scheduler`
- Job
  - [ ] `BillingReminder` diario 8:00 AM
  - [ ] Buscar `recurring_services` con next_billing_date = hoy (o hoy+3)
  - [ ] Generar invoice automática por servicio
  - [ ] Enviar email: "Hola [Cliente], tu factura por [Servicio] del proyecto [Proyecto] ya está generada por un valor de [Monto]"
  - [ ] Actualizar next_billing_date (+1 mes o +1 año)
- Done
  - [ ] Job ejecutado manual en dev genera facturas y se ve en Mailpit

---

## Backlog (post-M5)
- [ ] Facturación electrónica SRI (fase 2)
- [ ] Reportes (ingresos por mes, MRR/ARR personal)
- [ ] Exportaciones (CSV/PDF)
