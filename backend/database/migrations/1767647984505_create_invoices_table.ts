import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoices'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Foreign keys - orígenes de la factura
      table
        .integer('client_id')
        .unsigned()
        .references('id')
        .inTable('clients')
        .onDelete('RESTRICT')
        .notNullable()

      table
        .integer('project_id')
        .unsigned()
        .references('id')
        .inTable('projects')
        .onDelete('SET NULL')
        .nullable()

      // Referencia a cotización (si viene de quote aprobada)
      table
        .integer('quote_id')
        .unsigned()
        .references('id')
        .inTable('quotes')
        .onDelete('SET NULL')
        .nullable()
        .unique() // Una quote solo puede generar una factura

      // Referencia a servicio recurrente (si es factura automática)
      table
        .integer('recurring_service_id')
        .unsigned()
        .references('id')
        .inTable('recurring_services')
        .onDelete('SET NULL')
        .nullable()

      // Número secuencial: FAC-2026-000001
      table.string('invoice_number', 50).notNullable().unique()

      // Fechas
      table.date('issue_date').notNullable()
      table.date('due_date').notNullable()

      // Estado: pending, paid, overdue, voided
      table
        .enum('status', ['pending', 'paid', 'overdue', 'voided'])
        .defaultTo('pending')
        .notNullable()

      // Montos
      table.decimal('subtotal', 12, 2).notNullable().defaultTo(0)
      table.decimal('tax_rate', 5, 2).notNullable().defaultTo(15)
      table.decimal('tax_amount', 12, 2).notNullable().defaultTo(0)
      table.decimal('total', 12, 2).notNullable().defaultTo(0)

      // Notas
      table.text('notes').nullable()

      // Información de pago
      table.date('payment_date').nullable()
      table
        .enum('payment_method', ['transfer', 'cash', 'card', 'other'])
        .nullable()
      table.text('payment_notes').nullable()

      // Campos para SRI (futuro) - todos opcionales
      table.string('access_key', 49).nullable()
      table.text('xml_content').nullable()
      table.timestamp('authorization_date').nullable()
      table
        .enum('sri_status', ['pending', 'authorized', 'rejected'])
        .nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}