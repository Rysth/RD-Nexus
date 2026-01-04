import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'recurring_services'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // FK to project
      table
        .integer('project_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE')

      table.string('name', 200).notNullable() // e.g. "Hosting", "Mantenimiento Anual"
      table.decimal('amount', 10, 2).notNullable() // precio del servicio
      table.enum('billing_cycle', ['monthly', 'yearly']).notNullable().defaultTo('monthly')
      table.date('next_billing_date').notNullable() // próxima fecha de facturación
      table.enum('status', ['active', 'paused']).notNullable().defaultTo('active')
      table.text('description').nullable() // notas opcionales

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Index for scheduler queries
      table.index(['status', 'next_billing_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}