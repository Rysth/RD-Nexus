import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clients'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Client info
      table.string('name', 200).notNullable()

      // Ecuador identification: 04=RUC, 05=Cédula, 06=Pasaporte
      table.string('identification_type', 2).notNullable().defaultTo('05')
      table.string('identification', 20).notNullable().unique()

      // Contact
      table.string('email', 254).nullable()
      table.string('phone', 20).nullable()
      table.text('address').nullable()

      // Notes (optional)
      table.text('notes').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
