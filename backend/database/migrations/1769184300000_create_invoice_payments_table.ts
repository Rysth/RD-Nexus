import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      
      // FK to invoice
      table
        .integer('invoice_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('invoices')
        .onDelete('CASCADE')
      
      // Payment amount
      table.decimal('amount', 12, 2).notNullable()
      
      // Payment date
      table.date('payment_date').notNullable()
      
      // Payment method
      table.enum('payment_method', ['transfer', 'cash', 'card', 'other']).notNullable()
      
      // Notes
      table.text('notes').nullable()
      
      table.timestamp('created_at')
      table.timestamp('updated_at')
      
      // Index for faster lookups
      table.index(['invoice_id'])
    })

    // Add columns to invoices table to track payment totals
    this.schema.alterTable('invoices', (table) => {
      table.decimal('total_paid', 12, 2).notNullable().defaultTo(0).after('total')
      table.decimal('balance_due', 12, 2).notNullable().defaultTo(0).after('total_paid')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    
    this.schema.alterTable('invoices', (table) => {
      table.dropColumn('total_paid')
      table.dropColumn('balance_due')
    })
  }
}
