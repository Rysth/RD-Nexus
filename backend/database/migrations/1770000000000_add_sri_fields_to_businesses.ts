import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'businesses'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // SRI - Datos del Emisor
      table.string('ruc', 13).nullable()
      table.string('razon_social', 300).nullable()
      table.string('nombre_comercial', 300).nullable()
      table.string('direccion_matriz', 300).nullable()
      table.string('direccion_establecimiento', 300).nullable()
      
      // SRI - Configuración de Facturación
      table.string('codigo_establecimiento', 3).defaultTo('001')
      table.string('punto_emision', 3).defaultTo('001')
      
      // SRI - Régimen Tributario
      table.enum('obligado_contabilidad', ['SI', 'NO']).defaultTo('NO')
      table.string('contribuyente_especial', 10).nullable()
      table.string('regimen_rimpe', 100).nullable()
      
      // SRI - Configuración de Ambiente
      table.enum('sri_ambiente', ['1', '2']).defaultTo('1').comment('1=Pruebas, 2=Producción')
      
      // SRI - Certificado (opcional, puede guardarse en env también)
      table.string('sri_certificate_path', 500).nullable()
      
      // SRI - Secuencial de facturación
      table.integer('ultimo_secuencial_factura').defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('ruc')
      table.dropColumn('razon_social')
      table.dropColumn('nombre_comercial')
      table.dropColumn('direccion_matriz')
      table.dropColumn('direccion_establecimiento')
      table.dropColumn('codigo_establecimiento')
      table.dropColumn('punto_emision')
      table.dropColumn('obligado_contabilidad')
      table.dropColumn('contribuyente_especial')
      table.dropColumn('regimen_rimpe')
      table.dropColumn('sri_ambiente')
      table.dropColumn('sri_certificate_path')
      table.dropColumn('ultimo_secuencial_factura')
    })
  }
}
