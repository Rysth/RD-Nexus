/**
 * SRI Ecuador - Electronic Billing Service
 *
 * This service handles electronic invoicing for Ecuador's SRI (Servicio de Rentas Internas).
 * Specific for RIMPE - NEGOCIO POPULAR regime with 0% IVA services.
 *
 * @see https://www.sri.gob.ec/facturacion-electronica
 */

import { DateTime } from 'luxon'
import env from '#start/env'
import Invoice from '#models/invoice'
import Business from '#models/business'
import { readFileSync } from 'fs'
import { DOMParser, XMLSerializer } from '@xmldom/xmldom'
import { SignedXml } from 'xml-crypto'
import axios from 'axios'
import * as forge from 'node-forge'

// ========================================
// Types
// ========================================

export interface SriConfig {
  environment: '1' | '2'
  ruc: string
  razonSocial: string
  nombreComercial: string
  direccionMatriz: string
  direccionEstablecimiento?: string
  codigoEstablecimiento: string
  puntoEmision: string
  obligadoContabilidad: 'SI' | 'NO'
  contribuyenteEspecial?: string
  regimenRimpe?: string
  certificatePath: string
  certificatePassword: string
}

export interface SriResponse {
  success: boolean
  estado: 'RECIBIDA' | 'DEVUELTA' | 'ERROR'
  comprobantes?: any[]
  mensajes?: SriMensaje[]
}

export interface SriAuthResponse {
  success: boolean
  estado: 'AUTORIZADO' | 'NO AUTORIZADO' | 'EN PROCESO'
  numeroAutorizacion?: string
  fechaAutorizacion?: string
  comprobante?: string
  mensajes?: SriMensaje[]
}

export interface SriMensaje {
  identificador: string
  mensaje: string
  informacionAdicional?: string
  tipo: 'ADVERTENCIA' | 'ERROR' | 'INFORMATIVO'
}

// ========================================
// SRI Endpoints
// ========================================

const SRI_ENDPOINTS = {
  // Recepción de comprobantes
  recepcion: {
    pruebas: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
    produccion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
  },
  // Autorización de comprobantes
  autorizacion: {
    pruebas: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline',
    produccion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline',
  },
}

// ========================================
// SRI Service Class
// ========================================

export default class SriService {
  private config: SriConfig

  constructor(config?: Partial<SriConfig>) {
    // Load from environment variables or provided config
    this.config = {
      environment: (config?.environment || env.get('SRI_ENVIRONMENT') || '1') as '1' | '2',
      ruc: config?.ruc || env.get('SRI_RUC') || '',
      razonSocial: config?.razonSocial || env.get('SRI_RAZON_SOCIAL') || '',
      nombreComercial: config?.nombreComercial || env.get('SRI_NOMBRE_COMERCIAL') || '',
      direccionMatriz: config?.direccionMatriz || env.get('SRI_DIRECCION_MATRIZ') || '',
      direccionEstablecimiento: config?.direccionEstablecimiento || env.get('SRI_DIRECCION_MATRIZ') || '',
      codigoEstablecimiento: config?.codigoEstablecimiento || env.get('SRI_CODIGO_ESTABLECIMIENTO') || '001',
      puntoEmision: config?.puntoEmision || env.get('SRI_PUNTO_EMISION') || '001',
      obligadoContabilidad: (config?.obligadoContabilidad || env.get('SRI_OBLIGADO_CONTABILIDAD') || 'NO') as 'SI' | 'NO',
      contribuyenteEspecial: config?.contribuyenteEspecial || env.get('SRI_CONTRIBUYENTE_ESPECIAL') || '',
      regimenRimpe: config?.regimenRimpe || env.get('SRI_REGIMEN_RIMPE') || 'CONTRIBUYENTE RÉGIMEN RIMPE',
      certificatePath: config?.certificatePath || env.get('SRI_CERTIFICATE_PATH') || './storage/certificates/firma.p12',
      certificatePassword: config?.certificatePassword || env.get('SRI_CERTIFICATE_PASSWORD') || '',
    }
  }

  /**
   * Load configuration from Business model
   */
  static async fromBusiness(): Promise<SriService> {
    const business = await Business.current()
    
    return new SriService({
      environment: business.sriAmbiente || '1',
      ruc: business.ruc || env.get('SRI_RUC') || '',
      razonSocial: business.razonSocial || env.get('SRI_RAZON_SOCIAL') || '',
      nombreComercial: business.nombreComercial || env.get('SRI_NOMBRE_COMERCIAL') || '',
      direccionMatriz: business.direccionMatriz || env.get('SRI_DIRECCION_MATRIZ') || '',
      direccionEstablecimiento: business.direccionEstablecimiento || business.direccionMatriz || '',
      codigoEstablecimiento: business.codigoEstablecimiento || '001',
      puntoEmision: business.puntoEmision || '001',
      obligadoContabilidad: business.obligadoContabilidad || 'NO',
      contribuyenteEspecial: business.contribuyenteEspecial || '',
      regimenRimpe: business.regimenRimpe || 'CONTRIBUYENTE RÉGIMEN RIMPE',
      certificatePath: business.sriCertificatePath || env.get('SRI_CERTIFICATE_PATH') || '',
      certificatePassword: env.get('SRI_CERTIFICATE_PASSWORD') || '',
    })
  }

  /**
   * Validate that SRI configuration is complete
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.config.ruc || this.config.ruc.length !== 13) {
      errors.push('RUC inválido o no configurado (debe tener 13 dígitos)')
    }
    if (!this.config.razonSocial) {
      errors.push('Razón Social no configurada')
    }
    if (!this.config.direccionMatriz) {
      errors.push('Dirección Matriz no configurada')
    }
    if (!this.config.certificatePath) {
      errors.push('Ruta del certificado P12 no configurada')
    }
    if (!this.config.certificatePassword) {
      errors.push('Contraseña del certificado no configurada')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  // ========================================
  // Helper: Clean Text (SRI Normative)
  // ========================================

  /**
   * Clean text according to SRI technical specification.
   * Alphanumeric fields must NOT have line breaks or multiple spaces.
   *
   * @param text - The text to clean
   * @returns Cleaned text
   */
  private cleanText(text: string | null | undefined): string {
    if (!text) return ''

    return text
      .trim()
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[<>&'"]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          "'": '&apos;',
          '"': '&quot;',
        }
        return entities[char] || char
      })
  }

  /**
   * Format decimal number with 2 decimal places
   */
  private formatDecimal(value: number): string {
    return value.toFixed(2)
  }

  /**
   * Format date as DD/MM/YYYY for SRI
   */
  private formatDateSri(date: DateTime): string {
    return date.toFormat('dd/MM/yyyy')
  }

  /**
   * Format date as DDMMYYYY for access key
   */
  private formatDateAccessKey(date: DateTime): string {
    return date.toFormat('ddMMyyyy')
  }

  // ========================================
  // Generate Access Key (49 digits)
  // ========================================

  /**
   * Generate the 49-digit access key (clave de acceso) using Module 11 algorithm.
   *
   * Structure:
   * - Position 1-8: Date (ddmmyyyy)
   * - Position 9-10: Document type (01 = factura)
   * - Position 11-23: Issuer RUC
   * - Position 24: Environment (1 = test, 2 = production)
   * - Position 25-27: Establishment code (001)
   * - Position 28-30: Point of emission (001)
   * - Position 31-39: Sequential number (9 digits)
   * - Position 40-47: Numeric code (8 digits)
   * - Position 48: Emission type (1 = normal)
   * - Position 49: Verification digit (Module 11)
   *
   * @param invoice - The invoice model
   * @returns The 49-digit access key
   */
  generateAccessKey(invoice: Invoice): string {
    const date = invoice.issueDate || DateTime.now()

    // Extract sequential from invoice number (expecting format: 001-001-000000001 or FAC-2026-000001)
    let secuencial = '000000001'
    const invoiceNumber = invoice.invoiceNumber || ''

    // Try SRI format first: 001-001-000000001
    const sriMatch = invoiceNumber.match(/\d{3}-\d{3}-(\d{9})/)
    if (sriMatch) {
      secuencial = sriMatch[1]
    } else {
      // Try internal format: FAC-2026-000001
      const internalMatch = invoiceNumber.match(/FAC-\d{4}-(\d+)/)
      if (internalMatch) {
        secuencial = internalMatch[1].padStart(9, '0')
      }
    }

    // Build the 48-digit base key
    const fechaEmision = this.formatDateAccessKey(date)
    const tipoComprobante = '01' // Factura
    const ruc = this.config.ruc.padStart(13, '0')
    const ambiente = this.config.environment
    const serie = `${this.config.codigoEstablecimiento}${this.config.puntoEmision}`
    const codigoNumerico = this.generateNumericCode()
    const tipoEmision = '1' // Normal

    const baseKey = `${fechaEmision}${tipoComprobante}${ruc}${ambiente}${serie}${secuencial}${codigoNumerico}${tipoEmision}`

    // Calculate verification digit using Module 11
    const verificationDigit = this.calculateModule11(baseKey)

    return `${baseKey}${verificationDigit}`
  }

  /**
   * Generate an 8-digit numeric code (can be random or fixed)
   */
  private generateNumericCode(): string {
    // Use a pseudo-random but reproducible code based on timestamp
    const code = Math.floor(Math.random() * 100000000)
    return String(code).padStart(8, '0')
  }

  /**
   * Calculate Module 11 verification digit
   *
   * Algorithm:
   * 1. Multiply each digit by weights 2-7 (cycling)
   * 2. Sum all products
   * 3. Divide by 11 and get remainder
   * 4. Subtract remainder from 11
   * 5. If result is 11, return 0; if 10, return 1
   */
  private calculateModule11(value: string): string {
    const weights = [2, 3, 4, 5, 6, 7]
    let sum = 0

    // Process from right to left
    const digits = value.split('').reverse()

    for (let i = 0; i < digits.length; i++) {
      const digit = parseInt(digits[i], 10)
      const weight = weights[i % 6]
      sum += digit * weight
    }

    const remainder = sum % 11
    let verificationDigit = 11 - remainder

    if (verificationDigit === 11) {
      verificationDigit = 0
    } else if (verificationDigit === 10) {
      verificationDigit = 1
    }

    return String(verificationDigit)
  }

  // ========================================
  // Generate XML
  // ========================================

  /**
   * Generate the invoice XML following SRI strict XSD schema.
   * Specific for RIMPE - NEGOCIO POPULAR with 0% IVA.
   *
   * @param invoice - The invoice with client and items preloaded
   * @param accessKey - The 49-digit access key
   * @returns The XML string
   */
  async generateXml(invoice: Invoice, accessKey: string): Promise<string> {
    // Ensure client and items are loaded
    if (!invoice.client) {
      await invoice.load('client')
    }
    if (!invoice.items || invoice.items.length === 0) {
      await invoice.load('items')
    }

    const client = invoice.client
    const items = invoice.items || []
    const issueDate = invoice.issueDate || DateTime.now()

    // Extract serie and secuencial from access key
    const estab = accessKey.substring(24, 27)
    const ptoEmi = accessKey.substring(27, 30)
    const secuencial = accessKey.substring(30, 39)

    // Calculate totals
    const subtotal = Number(invoice.subtotal) || 0
    const total = Number(invoice.total) || subtotal
    const totalDescuento = 0 // Calculate if you have discounts

    // Build XML manually for strict order compliance
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="1.0.0">
  <infoTributaria>
    <ambiente>${this.config.environment}</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>${this.cleanText(this.config.razonSocial)}</razonSocial>
    <nombreComercial>${this.cleanText(this.config.nombreComercial || this.config.razonSocial)}</nombreComercial>
    <ruc>${this.config.ruc}</ruc>
    <claveAcceso>${accessKey}</claveAcceso>
    <codDoc>01</codDoc>
    <estab>${estab}</estab>
    <ptoEmi>${ptoEmi}</ptoEmi>
    <secuencial>${secuencial}</secuencial>
    <dirMatriz>${this.cleanText(this.config.direccionMatriz)}</dirMatriz>${this.config.regimenRimpe ? `
    <contribuyenteRimpe>${this.cleanText(this.config.regimenRimpe)}</contribuyenteRimpe>` : ''}
  </infoTributaria>
  <infoFactura>
    <fechaEmision>${this.formatDateSri(issueDate)}</fechaEmision>
    <dirEstablecimiento>${this.cleanText(this.config.direccionEstablecimiento || this.config.direccionMatriz)}</dirEstablecimiento>
    <obligadoContabilidad>${this.config.obligadoContabilidad}</obligadoContabilidad>
    <tipoIdentificacionComprador>${client?.identificationType || '05'}</tipoIdentificacionComprador>
    <razonSocialComprador>${this.cleanText(client?.name || 'CONSUMIDOR FINAL')}</razonSocialComprador>
    <identificacionComprador>${client?.identification || '9999999999999'}</identificacionComprador>
    <totalSinImpuestos>${this.formatDecimal(subtotal)}</totalSinImpuestos>
    <totalDescuento>${this.formatDecimal(totalDescuento)}</totalDescuento>
    <totalConImpuestos>
      <totalImpuesto>
        <codigo>2</codigo>
        <codigoPorcentaje>0</codigoPorcentaje>
        <baseImponible>${this.formatDecimal(subtotal)}</baseImponible>
        <valor>0.00</valor>
      </totalImpuesto>
    </totalConImpuestos>
    <propina>0.00</propina>
    <importeTotal>${this.formatDecimal(total)}</importeTotal>
    <moneda>DOLAR</moneda>
    <pagos>
      <pago>
        <formaPago>${this.getFormaPago(invoice.paymentMethod)}</formaPago>
        <total>${this.formatDecimal(total)}</total>
      </pago>
    </pagos>
  </infoFactura>
  <detalles>
${items.map((item, index) => this.generateItemXml(item, index)).join('\n')}
  </detalles>
  <infoAdicional>${client?.email ? `
    <campoAdicional nombre="Email">${this.cleanText(client.email)}</campoAdicional>` : ''}${client?.phone ? `
    <campoAdicional nombre="Telefono">${this.cleanText(client.phone)}</campoAdicional>` : ''}${client?.address ? `
    <campoAdicional nombre="Direccion">${this.cleanText(client.address)}</campoAdicional>` : ''}
  </infoAdicional>
</factura>`

    return xml
  }

  /**
   * Generate XML for a single invoice item
   */
  private generateItemXml(item: any, index: number): string {
    const cantidad = Number(item.quantity) || 1
    const precioUnitario = Number(item.unitPrice) || 0
    const descuento = Number(item.discountPercent) || 0
    const subtotalLinea = Number(item.subtotal) || cantidad * precioUnitario
    const descuentoValor = subtotalLinea * (descuento / 100)
    const precioTotalSinImpuesto = subtotalLinea - descuentoValor

    return `    <detalle>
      <codigoPrincipal>${String(item.id || index + 1).padStart(3, '0')}</codigoPrincipal>
      <descripcion>${this.cleanText(item.description)}</descripcion>
      <cantidad>${this.formatDecimal(cantidad)}</cantidad>
      <precioUnitario>${this.formatDecimal(precioUnitario)}</precioUnitario>
      <descuento>${this.formatDecimal(descuentoValor)}</descuento>
      <precioTotalSinImpuesto>${this.formatDecimal(precioTotalSinImpuesto)}</precioTotalSinImpuesto>
      <impuestos>
        <impuesto>
          <codigo>2</codigo>
          <codigoPorcentaje>0</codigoPorcentaje>
          <tarifa>0</tarifa>
          <baseImponible>${this.formatDecimal(precioTotalSinImpuesto)}</baseImponible>
          <valor>0.00</valor>
        </impuesto>
      </impuestos>
    </detalle>`
  }

  /**
   * Map payment method to SRI forma de pago code
   */
  private getFormaPago(paymentMethod: string | null): string {
    const mapping: Record<string, string> = {
      transfer: '20', // Otros con utilización del sistema financiero
      cash: '01',     // Sin utilización del sistema financiero
      card: '19',     // Tarjeta de crédito
      debit: '16',    // Tarjeta de débito
      other: '20',
    }
    return mapping[paymentMethod || ''] || '01'
  }

  // ========================================
  // Sign XML (XAdES-BES)
  // ========================================

  /**
   * Sign the XML using XAdES-BES with the P12 certificate.
   *
   * @param xml - The unsigned XML string
   * @returns The signed XML string
   */
  async signXml(xml: string): Promise<string> {
    try {
      // Read P12 certificate
      const p12Buffer = readFileSync(this.config.certificatePath)
      const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'))
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, this.config.certificatePassword)

      // Extract private key and certificate
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })

      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]
      const certBag = certBags[forge.pki.oids.certBag]

      if (!keyBag || keyBag.length === 0 || !keyBag[0].key) {
        throw new Error('No se encontró la clave privada en el certificado P12')
      }

      if (!certBag || certBag.length === 0 || !certBag[0].cert) {
        throw new Error('No se encontró el certificado en el archivo P12')
      }

      const privateKey = forge.pki.privateKeyToPem(keyBag[0].key)
      const certificate = forge.pki.certificateToPem(certBag[0].cert)

      // Parse XML
      const doc = new DOMParser().parseFromString(xml, 'text/xml')

      // Create signature
      const sig = new SignedXml({
        privateKey: privateKey,
        canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
        signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
      })

      // Add reference to the entire document
      sig.addReference({
        xpath: "//*[local-name(.)='factura']",
        digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
        transforms: [
          'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
          'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
        ],
      })

      // Add KeyInfo with certificate
      sig.publicCert = certificate

      // Compute signature
      sig.computeSignature(xml, {
        location: { reference: "//*[local-name(.)='factura']", action: 'append' },
      })

      return sig.getSignedXml()
    } catch (error: any) {
      throw new Error(`Error al firmar el XML: ${error.message}`)
    }
  }

  // ========================================
  // Send to SRI (Reception)
  // ========================================

  /**
   * Send the signed XML to SRI for reception.
   *
   * @param signedXml - The signed XML string
   * @returns SRI response
   */
  async sendToSri(signedXml: string): Promise<SriResponse> {
    try {
      const endpoint = this.config.environment === '2'
        ? SRI_ENDPOINTS.recepcion.produccion
        : SRI_ENDPOINTS.recepcion.pruebas

      // Encode XML to Base64
      const xmlBase64 = Buffer.from(signedXml, 'utf-8').toString('base64')

      // Build SOAP envelope manually
      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:validarComprobante>
      <xml>${xmlBase64}</xml>
    </ec:validarComprobante>
  </soapenv:Body>
</soapenv:Envelope>`

      // Send request
      const response = await axios.post(endpoint, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': '',
        },
        timeout: 30000,
      })

      // Parse response
      return this.parseRecepcionResponse(response.data)
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          estado: 'ERROR',
          mensajes: [{
            identificador: 'HTTP_ERROR',
            mensaje: `Error HTTP: ${error.response.status}`,
            informacionAdicional: error.response.data,
            tipo: 'ERROR',
          }],
        }
      }
      throw error
    }
  }

  /**
   * Parse SRI reception response
   */
  private parseRecepcionResponse(xmlResponse: string): SriResponse {
    const doc = new DOMParser().parseFromString(xmlResponse, 'text/xml')

    // Find estado element
    const estadoNode = doc.getElementsByTagName('estado')[0]
    const estado = estadoNode?.textContent as 'RECIBIDA' | 'DEVUELTA' || 'ERROR'

    // Parse comprobantes and mensajes
    const comprobantes: any[] = []
    const mensajes: SriMensaje[] = []

    const comprobanteNodes = doc.getElementsByTagName('comprobante')
    for (let i = 0; i < comprobanteNodes.length; i++) {
      const comp = comprobanteNodes[i]
      const claveAcceso = comp.getElementsByTagName('claveAcceso')[0]?.textContent

      // Get messages for this comprobante
      const mensajeNodes = comp.getElementsByTagName('mensaje')
      for (let j = 0; j < mensajeNodes.length; j++) {
        const msg = mensajeNodes[j]
        mensajes.push({
          identificador: msg.getElementsByTagName('identificador')[0]?.textContent || '',
          mensaje: msg.getElementsByTagName('mensaje')[0]?.textContent || '',
          informacionAdicional: msg.getElementsByTagName('informacionAdicional')[0]?.textContent || '',
          tipo: (msg.getElementsByTagName('tipo')[0]?.textContent || 'ERROR') as 'ERROR',
        })
      }

      comprobantes.push({ claveAcceso })
    }

    return {
      success: estado === 'RECIBIDA',
      estado,
      comprobantes,
      mensajes,
    }
  }

  // ========================================
  // Authorize (Query Authorization)
  // ========================================

  /**
   * Query SRI for invoice authorization status.
   *
   * @param accessKey - The 49-digit access key
   * @returns Authorization response
   */
  async authorize(accessKey: string): Promise<SriAuthResponse> {
    try {
      const endpoint = this.config.environment === '2'
        ? SRI_ENDPOINTS.autorizacion.produccion
        : SRI_ENDPOINTS.autorizacion.pruebas

      // Build SOAP envelope
      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:autorizacionComprobante>
      <claveAccesoComprobante>${accessKey}</claveAccesoComprobante>
    </ec:autorizacionComprobante>
  </soapenv:Body>
</soapenv:Envelope>`

      // Send request
      const response = await axios.post(endpoint, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': '',
        },
        timeout: 30000,
      })

      // Parse response
      return this.parseAutorizacionResponse(response.data)
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          estado: 'NO AUTORIZADO',
          mensajes: [{
            identificador: 'HTTP_ERROR',
            mensaje: `Error HTTP: ${error.response.status}`,
            informacionAdicional: error.response.data,
            tipo: 'ERROR',
          }],
        }
      }
      throw error
    }
  }

  /**
   * Parse SRI authorization response
   */
  private parseAutorizacionResponse(xmlResponse: string): SriAuthResponse {
    const doc = new DOMParser().parseFromString(xmlResponse, 'text/xml')

    // Find autorizacion element
    const autorizacionNode = doc.getElementsByTagName('autorizacion')[0]

    if (!autorizacionNode) {
      return {
        success: false,
        estado: 'NO AUTORIZADO',
        mensajes: [{
          identificador: 'NO_AUTH',
          mensaje: 'No se encontró información de autorización',
          tipo: 'ERROR',
        }],
      }
    }

    const estado = autorizacionNode.getElementsByTagName('estado')[0]?.textContent as 'AUTORIZADO' | 'NO AUTORIZADO' || 'NO AUTORIZADO'
    const numeroAutorizacion = autorizacionNode.getElementsByTagName('numeroAutorizacion')[0]?.textContent || ''
    const fechaAutorizacion = autorizacionNode.getElementsByTagName('fechaAutorizacion')[0]?.textContent || ''
    const comprobante = autorizacionNode.getElementsByTagName('comprobante')[0]?.textContent || ''

    const mensajes: SriMensaje[] = []
    const mensajeNodes = autorizacionNode.getElementsByTagName('mensaje')
    for (let i = 0; i < mensajeNodes.length; i++) {
      const msg = mensajeNodes[i]
      mensajes.push({
        identificador: msg.getElementsByTagName('identificador')[0]?.textContent || '',
        mensaje: msg.getElementsByTagName('mensaje')[0]?.textContent || '',
        informacionAdicional: msg.getElementsByTagName('informacionAdicional')[0]?.textContent || '',
        tipo: (msg.getElementsByTagName('tipo')[0]?.textContent || 'ERROR') as 'ERROR',
      })
    }

    return {
      success: estado === 'AUTORIZADO',
      estado,
      numeroAutorizacion,
      fechaAutorizacion,
      comprobante,
      mensajes,
    }
  }

  // ========================================
  // High-Level: Process Invoice
  // ========================================

  /**
   * Complete flow to process an invoice through SRI.
   *
   * 1. Validate configuration
   * 2. Generate access key
   * 3. Generate XML
   * 4. Sign XML
   * 5. Send to SRI
   * 6. Check authorization
   * 7. Update invoice
   *
   * @param invoice - The invoice to process
   * @returns Processing result
   */
  async processInvoice(invoice: Invoice): Promise<{
    success: boolean
    accessKey: string
    status: 'pending' | 'authorized' | 'rejected'
    messages: SriMensaje[]
    signedXml?: string
  }> {
    // Validate config
    const validation = this.validateConfig()
    if (!validation.valid) {
      return {
        success: false,
        accessKey: '',
        status: 'rejected',
        messages: validation.errors.map((e) => ({
          identificador: 'CONFIG_ERROR',
          mensaje: e,
          tipo: 'ERROR' as const,
        })),
      }
    }

    // Load invoice relations
    await invoice.load('client')
    await invoice.load('items')

    // Generate access key
    const accessKey = this.generateAccessKey(invoice)

    // Generate XML
    const xml = await this.generateXml(invoice, accessKey)

    // Sign XML
    let signedXml: string
    try {
      signedXml = await this.signXml(xml)
    } catch (error: any) {
      return {
        success: false,
        accessKey,
        status: 'rejected',
        messages: [{
          identificador: 'SIGN_ERROR',
          mensaje: error.message,
          tipo: 'ERROR',
        }],
      }
    }

    // Send to SRI
    const recepcion = await this.sendToSri(signedXml)

    if (!recepcion.success) {
      // Update invoice status
      invoice.accessKey = accessKey
      invoice.xmlContent = signedXml
      invoice.sriStatus = 'rejected'
      await invoice.save()

      return {
        success: false,
        accessKey,
        status: 'rejected',
        messages: recepcion.mensajes || [],
        signedXml,
      }
    }

    // Wait a moment for SRI to process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Check authorization
    const autorizacion = await this.authorize(accessKey)

    // Update invoice
    invoice.accessKey = accessKey
    invoice.xmlContent = signedXml

    if (autorizacion.success) {
      invoice.sriStatus = 'authorized'
      invoice.authorizationDate = autorizacion.fechaAutorizacion
        ? DateTime.fromFormat(autorizacion.fechaAutorizacion, 'dd/MM/yyyy HH:mm:ss')
        : DateTime.now()
    } else if (autorizacion.estado === 'EN PROCESO') {
      invoice.sriStatus = 'pending'
    } else {
      invoice.sriStatus = 'rejected'
    }

    await invoice.save()

    return {
      success: autorizacion.success,
      accessKey,
      status: invoice.sriStatus as 'pending' | 'authorized' | 'rejected',
      messages: autorizacion.mensajes || [],
      signedXml,
    }
  }
}
