Actúa como un Arquitecto de Software Senior experto en AdonisJS V6 y en la integración técnica del SRI (Ecuador).

Estoy desarrollando el servicio de facturación electrónica `app/services/SriService.ts`.
**Contexto Tributario:** Soy "RIMPE - NEGOCIO POPULAR". No llevo contabilidad. Mis servicios gravan IVA 0%.

### 1. REQUERIMIENTOS DE LIBRERÍAS

Usa las siguientes librerías (asume que las instalaré con `npm install xml-crypto xmldom axios luxon`):

- `xml-crypto`: Para la firma XAdES-BES.
- `xmldom`: Para manipular el DOM del XML.
- `axios`: Para las peticiones SOAP (evita librerías SOAP complejas, usa sobres XML manuales).
- `luxon`: Para manejo de fechas.

### 2. CONTEXTO DE DATOS (Modelos Lucid)

Tengo los modelos `Invoice`, `Client`, `InvoiceItem` en `app/models`.

- `Invoice`: `invoiceNumber` (001-001-000000001), `issueDate` (DateTime), `accessKey`, `sriStatus`, `items` (relación), `client` (relación).
- `Client`: `identification` (RUC/CI), `identificationType`, `email`, `address`, `name`.

### 3. TAREA PRINCIPAL

Genera el código completo para `app/services/SriService.ts`. El código debe ser robusto, tipado y seguir el orden estricto de la Ficha Técnica del SRI.

Debe incluir los siguientes métodos y helpers:

#### A. Helper Privado: `cleanText(text: string): string`

- **CRÍTICO:** Basado en la normativa técnica, los campos alfanuméricos NO deben tener saltos de línea ni espacios múltiples.
- Implementa una función que haga `.trim()` y reemplace `\n` y espacios dobles por uno solo.
- Úsala en todos los campos de texto (razón social, dirección, descripción).

#### B. Método: `generateAccessKey(invoice: Invoice, environment: '1'|'2'): string`

- Genera la clave de 49 dígitos con el algoritmo **Módulo 11**.
- Estructura: `ddmmyyyy` (fecha) + `01` (factura) + `RUC_EMISOR` + `env` + `serie` (001001) + `secuencial` (9 dig) + `12345678` (código numérico fijo) + `1` (emisión normal) + `DigitoVerificador`.

#### C. Método: `generateXml(invoice: Invoice, accessKey: string): string`

- Construye el XML manual o mediante template string para asegurar el orden exacto de tags (XSD estricto).
- **Reglas RIMPE - Negocio Popular:**
  1.  En `<infoTributaria>` incluye: `<contribuyenteRimpe>CONTRIBUYENTE RÉGIMEN RIMPE</contribuyenteRimpe>`.
  2.  En `<infoFactura>`: `<obligadoContabilidad>NO</obligadoContabilidad>`.
  3.  **Impuestos:** Para cada item y el total, usa:
      - `codigo`: 2 (IVA)
      - `codigoPorcentaje`: 0 (Tarifa 0%)
      - `tarifa`: 0
      - `baseImponible`: [Valor]
      - `valor`: 0.00
- **Estructura XML Requerida:**

```xml
<factura id="comprobante" version="1.0.0">
  <infoTributaria>
    <ambiente>1</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>[CleanText]</razonSocial>
    <nombreComercial>[CleanText]</nombreComercial>
    <ruc>[RUC]</ruc>
    <claveAcceso>[AccessKey]</claveAcceso>
    <codDoc>01</codDoc>
    <estab>001</estab>
    <ptoEmi>001</ptoEmi>
    <secuencial>[000000001]</secuencial>
    <dirMatriz>[CleanText]</dirMatriz>
    <contribuyenteRimpe>CONTRIBUYENTE RÉGIMEN RIMPE</contribuyenteRimpe>
  </infoTributaria>
  <infoFactura>
    <fechaEmision>dd/mm/aaaa</fechaEmision>
    <dirEstablecimiento>[CleanText]</dirEstablecimiento>
    <obligadoContabilidad>NO</obligadoContabilidad>
    <tipoIdentificacionComprador>[04/05]</tipoIdentificacionComprador>
    <razonSocialComprador>[CleanText]</razonSocialComprador>
    <identificacionComprador>[ID Cliente]</identificacionComprador>
    <totalSinImpuestos>[0.00]</totalSinImpuestos>
    <totalDescuento>[0.00]</totalDescuento>
    <totalConImpuestos>
        <totalImpuesto>
            <codigo>2</codigo>
            <codigoPorcentaje>0</codigoPorcentaje>
            <baseImponible>[Subtotal]</baseImponible>
            <valor>0.00</valor>
        </totalImpuesto>
    </totalConImpuestos>
    <propina>0.00</propina>
    <importeTotal>[Total]</importeTotal>
    <moneda>DOLAR</moneda>
    <pagos>
        <pago>
            <formaPago>01</formaPago>
            <total>[Total]</total>
        </pago>
    </pagos>
  </infoFactura>
  <detalles>
    <detalle>
        <codigoPrincipal>[Item ID]</codigoPrincipal>
        <descripcion>[CleanText]</descripcion>
        <cantidad>[Qty]</cantidad>
        <precioUnitario>[Price]</precioUnitario>
        <descuento>[0.00]</descuento>
        <precioTotalSinImpuesto>[Subtotal Linea]</precioTotalSinImpuesto>
        <impuestos>
            <impuesto>
                <codigo>2</codigo>
                <codigoPorcentaje>0</codigoPorcentaje>
                <tarifa>0</tarifa>
                <baseImponible>[Subtotal Linea]</baseImponible>
                <valor>0.00</valor>
            </impuesto>
        </impuestos>
    </detalle>
  </detalles>
  <infoAdicional>
     <campoAdicional nombre="Email">[Email Cliente]</campoAdicional>
  </infoAdicional>
</factura>
D. Método: signXml(xml: string, p12Path: string, password: string): Promise<string>
Implementa la firma XAdES-BES usando xml-crypto.

Configura los algoritmos requeridos por SRI:

Canonicalization: http://www.w3.org/TR/2001/REC-xml-c14n-20010315

Signature: http://www.w3.org/2000/09/xmldsig#rsa-sha1

Asegúrate de inyectar la firma correctamente en el XML.

E. Método: sendToSri(signedXmlBase64: string, environment: '1'|'2'): Promise<any>
Construye el Envelope SOAP manualmente y envíalo con axios.

URL Pruebas: https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl

URL Producción: https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl

Parsea la respuesta XML del SRI para obtener el estado ("RECIBIDA" o "DEVUELTA").

F. Método: authorize(accessKey: string, environment: '1'|'2'): Promise<any>
Consume el servicio AutorizacionComprobantesOffline.

Retorna la respuesta completa del SRI.

Instrucciones Finales
Escribe el archivo SriService.ts completo.

Añade tipos explícitos de TypeScript.

Maneja errores con try/catch.
```
