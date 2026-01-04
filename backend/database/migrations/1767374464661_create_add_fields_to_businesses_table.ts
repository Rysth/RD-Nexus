import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'businesses'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('name', 100).notNullable().defaultTo('MicroBiz')
      table.string('slogan', 200).nullable()
      table.string('logo_url', 500).nullable()
      table.string('whatsapp', 20).nullable()
      table.string('instagram', 50).nullable()
      table.string('facebook', 50).nullable()
      table.string('tiktok', 50).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('name')
      table.dropColumn('slogan')
      table.dropColumn('logo_url')
      table.dropColumn('whatsapp')
      table.dropColumn('instagram')
      table.dropColumn('facebook')
      table.dropColumn('tiktok')
    })
  }
}