import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'quotes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // FK to project (nullable for quotes not tied to a project)
      table
        .integer('project_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('projects')
        .onDelete('SET NULL')

      // FK to client (for direct client quotes)
      table
        .integer('client_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('clients')
        .onDelete('CASCADE')

      table.string('quote_number', 50).notNullable().unique() // e.g. COT-2026-0001
      table.string('title', 200).notNullable() // Título de la cotización
      table.date('issue_date').notNullable() // Fecha de emisión
      table.date('valid_until').notNullable() // Válido hasta
      table.enum('status', ['draft', 'sent', 'approved', 'rejected']).notNullable().defaultTo('draft')
      table.decimal('subtotal', 12, 2).notNullable().defaultTo(0)
      table.decimal('tax_rate', 5, 2).notNullable().defaultTo(0) // e.g. 15.00 for 15%
      table.decimal('tax_amount', 12, 2).notNullable().defaultTo(0)
      table.decimal('total', 12, 2).notNullable().defaultTo(0)
      table.text('notes').nullable() // Notas/términos

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Indexes
      table.index(['client_id', 'status'])
      table.index(['project_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}