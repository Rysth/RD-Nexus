import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'quote_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // FK to quote
      table
        .integer('quote_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('quotes')
        .onDelete('CASCADE')

      table.string('description', 500).notNullable() // Descripción del item
      table.decimal('quantity', 10, 2).notNullable().defaultTo(1)
      table.decimal('unit_price', 12, 2).notNullable()
      table.decimal('subtotal', 12, 2).notNullable() // quantity * unit_price
      table.integer('sort_order').notNullable().defaultTo(0) // Para ordenar items

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Index for ordering
      table.index(['quote_id', 'sort_order'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}