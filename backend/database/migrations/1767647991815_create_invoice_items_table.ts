import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('invoice_id')
        .unsigned()
        .references('id')
        .inTable('invoices')
        .onDelete('CASCADE')
        .notNullable()

      table.text('description').notNullable()
      table.decimal('quantity', 10, 2).notNullable().defaultTo(1)
      table.decimal('unit_price', 12, 2).notNullable().defaultTo(0)
      table.decimal('subtotal', 12, 2).notNullable().defaultTo(0)
      table.integer('sort_order').notNullable().defaultTo(0)

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}