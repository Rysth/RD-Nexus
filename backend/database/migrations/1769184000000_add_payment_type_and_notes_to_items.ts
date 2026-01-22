import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Add payment_type and notes to quote_items
    this.schema.alterTable('quote_items', (table) => {
      table.enum('payment_type', ['unico', 'anual', 'mensual']).defaultTo('unico').after('subtotal')
      table.text('notes').nullable().after('payment_type')
    })

    // Add payment_type and notes to invoice_items
    this.schema.alterTable('invoice_items', (table) => {
      table.enum('payment_type', ['unico', 'anual', 'mensual']).defaultTo('unico').after('subtotal')
      table.text('notes').nullable().after('payment_type')
    })
  }

  async down() {
    this.schema.alterTable('quote_items', (table) => {
      table.dropColumn('payment_type')
      table.dropColumn('notes')
    })

    this.schema.alterTable('invoice_items', (table) => {
      table.dropColumn('payment_type')
      table.dropColumn('notes')
    })
  }
}
