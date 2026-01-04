# Nexus — Roadmap (Milestones)

Roadmap para avanzar **milestone por milestone** en Nexus (uso 100% personal), priorizando lo esencial para operar RysthDesign.

## Convenciones
- [ ] Cada milestone cierra con: migraciones/modelos/relaciones listas, API mínima operativa, validaciones básicas y una UI mínima cuando aplique.

---

## Milestone 0 — Base del proyecto (Infra + estándares)
**Objetivo**: entorno estable para iterar rápido.

- [ ] `.env` documentado (DB/Redis/Mail) y presente tras `./setup.sh`
- [ ] `docker-compose.dev.yml` levanta todo sin pasos manuales extra
- [ ] `./setup.sh` corre migraciones y seeds en dev sin fallar
- [ ] Acceso OK: frontend 5173, backend 3333, Mailpit 8025

---

## Milestone 1 — Clientes y Proyectos (Base)
**Objetivo**: saber quién es el cliente y qué proyecto/software tiene.

- DB/Modelos
  - [ ] Migration `clients` (name, identification_type 04/05/06, identification, email, phone, address, timestamps)
  - [ ] Migration `projects` (client_id, name, production_url, start_date, status active/maintenance/canceled, timestamps)
  - [ ] Relaciones Lucid: `Client` hasMany `Project`, `Project` belongsTo `Client`
- API
  - [ ] CRUD clients
  - [ ] CRUD projects
  - [ ] Listar projects por client
- Frontend
  - [ ] Lista de clientes
  - [ ] Detalle de cliente con proyectos
- Done
  - [ ] Crear cliente + asignar proyectos desde UI funciona

---

## Milestone 2 — Servicios Recurrentes
**Objetivo**: definir cobros recurrentes por proyecto.

- DB/Modelos
  - [ ] Migration `recurring_services` (project_id, name, amount, billing_cycle monthly/yearly, next_billing_date, status active/paused, timestamps)
- API
  - [ ] CRUD de servicios recurrentes por proyecto
  - [ ] Validaciones: amount > 0, fecha válida, ciclo permitido
- Frontend
  - [ ] En detalle de proyecto: tab/section "Servicios Recurrentes" con crear/editar/pausar
- Done
  - [ ] Proyecto puede tener múltiples servicios recurrentes activos/pausados

---

## Milestone 3 — Cotizaciones + PDF
**Objetivo**: crear cotizaciones con items y generar PDF.

- DB/Modelos
  - [ ] Migration `quotes` (project_id, issue_date, valid_until, status draft/sent/approved/rejected, total, timestamps)
  - [ ] Migration `quote_items` (quote_id, description, quantity, unit_price, subtotal, timestamps)
- API
  - [ ] Crear quote con items anidados (transacción + recalcular total)
  - [ ] Cambiar status (draft→sent→approved/rejected)
- PDF
  - [ ] Servicio para generar PDF simple (logo RysthDesign)
- Frontend
  - [ ] Tab "Cotizaciones": crear con items, ver detalle y descargar PDF
- Done
  - [ ] Crear cotización con 2+ items y descargar PDF coherente

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
