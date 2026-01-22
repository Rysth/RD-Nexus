import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'quotes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('description').nullable().after('title')
      table.decimal('discount_percent', 5, 2).notNullable().defaultTo(0).after('subtotal')
      table.decimal('discount_amount', 12, 2).notNullable().defaultTo(0).after('discount_percent')
      table.text('terms_conditions').nullable().after('notes')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('description')
      table.dropColumn('discount_percent')
      table.dropColumn('discount_amount')
      table.dropColumn('terms_conditions')
    })
  }
}
