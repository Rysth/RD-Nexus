import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoices'

  async up() {
    // `table.enum()` in Postgres is implemented as a CHECK constraint by default.
    // We need to include the new `partial` status.
    this.schema.raw(`ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS invoices_status_check`)

    this.schema.raw(`
      ALTER TABLE ${this.tableName}
      ADD CONSTRAINT invoices_status_check
      CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'voided'))
    `)
  }

  async down() {
    // Revert to the original constraint (without `partial`).
    this.schema.raw(`ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS invoices_status_check`)

    this.schema.raw(`
      ALTER TABLE ${this.tableName}
      ADD CONSTRAINT invoices_status_check
      CHECK (status IN ('pending', 'paid', 'overdue', 'voided'))
    `)
  }
}
