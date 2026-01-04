import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projects'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Foreign key to clients
      table
        .integer('client_id')
        .unsigned()
        .references('id')
        .inTable('clients')
        .onDelete('CASCADE')
        .notNullable()

      // Project info
      table.string('name', 200).notNullable()
      table.string('production_url', 500).nullable()
      table.date('start_date').nullable()

      // Status: active, maintenance, canceled
      table.string('status', 20).notNullable().defaultTo('active')

      // Description/notes
      table.text('description').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
