# 🧾 Roadmap de Implementación - Facturación Electrónica SRI Ecuador

## 📋 Resumen del Proyecto

Implementación del sistema de facturación electrónica para el SRI de Ecuador, específico para contribuyentes **RIMPE - NEGOCIO POPULAR** con servicios gravados con IVA 0%.

---

## 🔐 REQUISITOS PREVIOS (¡IMPORTANTE!)

### 1. Certificado de Firma Electrónica (P12)

Para emitir facturas electrónicas necesitas un **certificado de firma electrónica** válido. Puedes obtenerlo de:

| Entidad                 | Sitio Web                       | Costo Aprox.   |
| ----------------------- | ------------------------------- | -------------- |
| **Banco Central (BCE)** | https://www.eci.bce.ec          | $25-50 USD/año |
| **Security Data**       | https://www.securitydata.net.ec | $30-60 USD/año |
| **ANF Ecuador**         | https://www.anfecuador.com      | $40-70 USD/año |

**Proceso:**

1. Registrarte en una de las entidades certificadoras
2. Agendar cita presencial con documentos (cédula, papeleta votación, RUC)
3. Recibir el archivo `.p12` y la contraseña

### 2. Ambiente SRI

Debes habilitar el ambiente de facturación electrónica en el SRI:

1. Ingresa a **SRI en Línea**: https://srienlinea.sri.gob.ec
2. Ve a: **Facturación Electrónica > Ambiente de Pruebas**
3. Solicita el ambiente de **Pruebas** primero
4. Una vez todo funcione, solicita el **ambiente de Producción**

### 3. Datos Tributarios Necesarios

Necesitarás tener a mano:

```
- RUC: Tu número de 13 dígitos
- Razón Social: Nombre completo como aparece en el RUC
- Nombre Comercial: Nombre de tu negocio
- Dirección Matriz: Dirección registrada en el SRI
- Código de Establecimiento: 001 (si es único)
- Punto de Emisión: 001 (si es único)
```

---

## 📅 FASES DE IMPLEMENTACIÓN

### Fase 1: Configuración Inicial ✅

**Tiempo estimado: 1 día**

- [x] Análisis de modelos existentes
- [x] Diseño de arquitectura SRI
- [ ] Actualizar variables de entorno (.env)
- [ ] Crear migración para campos SRI en Business
- [ ] Actualizar modelo Business con campos tributarios

### Fase 2: Servicio Core SRI

**Tiempo estimado: 2-3 días**

- [ ] Implementar `SriService.ts`:
  - [ ] `cleanText()` - Limpiar texto según normativa
  - [ ] `generateAccessKey()` - Clave de acceso 49 dígitos
  - [ ] `generateXml()` - XML estructura factura
  - [ ] `signXml()` - Firma XAdES-BES
  - [ ] `sendToSri()` - Envío a web service SRI
  - [ ] `authorize()` - Consulta de autorización

### Fase 3: Integración con Facturas

**Tiempo estimado: 1-2 días**

- [ ] Agregar endpoints SRI al controller de facturas
- [ ] Crear job para procesamiento asíncrono
- [ ] Manejo de reintentos y errores SRI

### Fase 4: UI Frontend

**Tiempo estimado: 2-3 días**

- [ ] Formulario configuración SRI del negocio
- [ ] Botón "Facturar al SRI" en facturas
- [ ] Visualización de estado SRI
- [ ] Descarga de RIDE (representación impresa)

### Fase 5: Pruebas y Producción

**Tiempo estimado: 2-3 días**

- [ ] Pruebas en ambiente de pruebas SRI
- [ ] Corrección de errores
- [ ] Migración a producción
- [ ] Monitoreo y logging

---

## 🗃️ ESTRUCTURA DE ARCHIVOS

```
backend/
├── app/
│   ├── services/
│   │   ├── sri_service.ts          # ← NUEVO: Servicio principal SRI
│   │   └── invoice_service.ts      # Actualizado
│   ├── models/
│   │   ├── business.ts             # ← Actualizado con campos SRI
│   │   └── invoice.ts              # Ya tiene campos SRI básicos
│   ├── controllers/
│   │   └── invoices_controller.ts  # ← Nuevos endpoints SRI
│   └── jobs/
│       └── process_sri_invoice.ts  # ← NUEVO: Procesamiento async
├── database/
│   └── migrations/
│       └── add_sri_fields_to_businesses.ts  # ← NUEVA
├── storage/
│   └── certificates/               # ← NUEVO: Guardar .p12 aquí
└── resources/
    └── views/
        └── emails/
            └── invoice_ride.tsx    # ← NUEVO: Template RIDE
```

---

## 🔧 VARIABLES DE ENTORNO REQUERIDAS

```env
# ========================================
# SRI Ecuador - Facturación Electrónica
# ========================================

# Ambiente SRI: 1 = Pruebas, 2 = Producción
SRI_ENVIRONMENT=1

# Ruta al certificado P12 de firma electrónica
SRI_CERTIFICATE_PATH=./storage/certificates/firma.p12

# Contraseña del certificado P12
SRI_CERTIFICATE_PASSWORD=tu_contrasena_certificado

# Datos del Emisor (tu negocio)
SRI_RUC=0123456789001
SRI_RAZON_SOCIAL=TU NOMBRE COMPLETO
SRI_NOMBRE_COMERCIAL=Tu Negocio
SRI_DIRECCION_MATRIZ=Calle Principal y Secundaria, Ciudad
SRI_CODIGO_ESTABLECIMIENTO=001
SRI_PUNTO_EMISION=001

# Régimen tributario
SRI_OBLIGADO_CONTABILIDAD=NO
SRI_CONTRIBUYENTE_ESPECIAL=
SRI_REGIMEN_RIMPE=CONTRIBUYENTE RÉGIMEN RIMPE
```

---

## 📝 NOTAS TÉCNICAS

### Formato Clave de Acceso (49 dígitos)

```
Posición  | Contenido              | Ejemplo
----------|------------------------|----------
1-8       | Fecha (ddmmaaaa)       | 07022026
9-10      | Tipo Comprobante       | 01 (factura)
11-23     | RUC Emisor             | 0123456789001
24        | Ambiente               | 1 (pruebas)
25-27     | Serie Establecimiento  | 001
28-30     | Punto Emisión          | 001
31-39     | Secuencial             | 000000001
40-47     | Código Numérico        | 12345678
48        | Tipo Emisión           | 1 (normal)
49        | Dígito Verificador     | X (Módulo 11)
```

### Códigos de Identificación

| Código | Tipo             |
| ------ | ---------------- |
| 04     | RUC              |
| 05     | Cédula           |
| 06     | Pasaporte        |
| 07     | Consumidor Final |

### Formas de Pago

| Código | Descripción         |
| ------ | ------------------- |
| 01     | Sin utilización SF  |
| 15     | Compensación deudas |
| 16     | Tarjeta de débito   |
| 17     | Dinero electrónico  |
| 18     | Tarjeta prepago     |
| 19     | Tarjeta de crédito  |
| 20     | Otros con SF        |

---

## ⚠️ CONSIDERACIONES RIMPE NEGOCIO POPULAR

Tu caso específico requiere:

1. **IVA 0%** en todos los servicios
2. **No obligado a llevar contabilidad**
3. Tag especial: `<contribuyenteRimpe>CONTRIBUYENTE RÉGIMEN RIMPE</contribuyenteRimpe>`
4. Tag: `<obligadoContabilidad>NO</obligadoContabilidad>`

---

## 🚀 PRÓXIMOS PASOS

1. **Obtén tu certificado P12** de una entidad certificadora
2. **Habilita el ambiente de pruebas** en SRI en Línea
3. **Copia tu archivo .p12** a `backend/storage/certificates/`
4. **Configura las variables de entorno** con tus datos reales
5. **Ejecuta las migraciones** para actualizar la base de datos
6. **Prueba en ambiente de pruebas** antes de producción

---

## 📚 Referencias

- [Ficha Técnica SRI](https://www.sri.gob.ec/facturacion-electronica)
- [Documentación Técnica](https://www.sri.gob.ec/web/guest/comprobantes-electronicos)
- [Web Services SRI](https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl)
