import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Add discount_percent to quote_items
    this.schema.alterTable('quote_items', (table) => {
      table.decimal('discount_percent', 5, 2).notNullable().defaultTo(0).after('unit_price')
    })

    // Add discount_percent to invoice_items
    this.schema.alterTable('invoice_items', (table) => {
      table.decimal('discount_percent', 5, 2).notNullable().defaultTo(0).after('unit_price')
    })
  }

  async down() {
    this.schema.alterTable('quote_items', (table) => {
      table.dropColumn('discount_percent')
    })

    this.schema.alterTable('invoice_items', (table) => {
      table.dropColumn('discount_percent')
    })
  }
}
