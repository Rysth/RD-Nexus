import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Business extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slogan: string | null

  @column()
  declare logoUrl: string | null

  @column()
  declare whatsapp: string | null

  @column()
  declare instagram: string | null

  @column()
  declare facebook: string | null

  @column()
  declare tiktok: string | null

  // ========================================
  // SRI - Datos del Emisor
  // ========================================

  @column()
  declare ruc: string | null

  @column()
  declare razonSocial: string | null

  @column()
  declare nombreComercial: string | null

  @column()
  declare direccionMatriz: string | null

  @column()
  declare direccionEstablecimiento: string | null

  // ========================================
  // SRI - Configuración de Facturación
  // ========================================

  @column()
  declare codigoEstablecimiento: string

  @column()
  declare puntoEmision: string

  // ========================================
  // SRI - Régimen Tributario
  // ========================================

  @column()
  declare obligadoContabilidad: 'SI' | 'NO'

  @column()
  declare contribuyenteEspecial: string | null

  @column()
  declare regimenRimpe: string | null

  // ========================================
  // SRI - Configuración de Ambiente
  // ========================================

  @column()
  declare sriAmbiente: '1' | '2'

  @column()
  declare sriCertificatePath: string | null

  // ========================================
  // SRI - Secuencial de Facturación
  // ========================================

  @column()
  declare ultimoSecuencialFactura: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Get current business or create default
  static async current(): Promise<Business> {
    let business = await this.first()
    
    if (!business) {
      business = await this.create({
        name: 'Nexus',
        slogan: 'by RysthDesign',
        whatsapp: '',
        instagram: '',
        facebook: '',
        tiktok: '',
        // SRI defaults
        codigoEstablecimiento: '001',
        puntoEmision: '001',
        obligadoContabilidad: 'NO',
        sriAmbiente: '1',
        ultimoSecuencialFactura: 0,
      })
    }
    
    return business
  }

  // Serialize for API response
  serializeForApi() {
    return {
      id: this.id,
      name: this.name,
      slogan: this.slogan,
      logo_url: this.logoUrl,
      whatsapp: this.whatsapp,
      instagram: this.instagram,
      facebook: this.facebook,
      tiktok: this.tiktok,
      // SRI fields
      ruc: this.ruc,
      razon_social: this.razonSocial,
      nombre_comercial: this.nombreComercial,
      direccion_matriz: this.direccionMatriz,
      direccion_establecimiento: this.direccionEstablecimiento,
      codigo_establecimiento: this.codigoEstablecimiento,
      punto_emision: this.puntoEmision,
      obligado_contabilidad: this.obligadoContabilidad,
      contribuyente_especial: this.contribuyenteEspecial,
      regimen_rimpe: this.regimenRimpe,
      sri_ambiente: this.sriAmbiente,
      sri_ambiente_label: this.sriAmbiente === '1' ? 'Pruebas' : 'Producción',
      sri_certificate_configured: !!this.sriCertificatePath,
      ultimo_secuencial_factura: this.ultimoSecuencialFactura,
      sri_configured: this.isSriConfigured,
      created_at: this.createdAt?.toISO(),
      updated_at: this.updatedAt?.toISO(),
    }
  }

  // Check if SRI is properly configured
  get isSriConfigured(): boolean {
    return !!(
      this.ruc &&
      this.razonSocial &&
      this.direccionMatriz &&
      this.codigoEstablecimiento &&
      this.puntoEmision
    )
  }

  // Get formatted serie for SRI (establecimiento-puntoEmision)
  get sriSerie(): string {
    return `${this.codigoEstablecimiento || '001'}-${this.puntoEmision || '001'}`
  }

  // Get next sequential number for invoice
  async getNextSecuencial(): Promise<string> {
    const next = (this.ultimoSecuencialFactura || 0) + 1
    this.ultimoSecuencialFactura = next
    await this.save()
    return String(next).padStart(9, '0')
  }

  // Get name or default
  get nameOrDefault(): string {
    return this.name || 'Nexus'
  }

  // Get slogan or default
  get sloganOrDefault(): string {
    return this.slogan || 'by RysthDesign'
  }
}