import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Project from '#models/project'

export default class Client extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  /**
   * Ecuador identification type:
   * 04 = RUC
   * 05 = Cédula
   * 06 = Pasaporte
   */
  @column()
  declare identificationType: string

  @column()
  declare identification: string | null

  @column()
  declare email: string | null

  @column()
  declare phone: string | null

  @column()
  declare address: string | null

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @hasMany(() => Project)
  declare projects: HasMany<typeof Project>

  // Computed: identification type label
  get identificationTypeLabel(): string {
    const types: Record<string, string> = {
      '04': 'RUC',
      '05': 'Cédula',
      '06': 'Pasaporte',
    }
    return types[this.identificationType] || 'Desconocido'
  }

  // Serialize for API
  serializeForApi() {
    return {
      id: this.id,
      name: this.name,
      identification_type: this.identificationType,
      identification_type_label: this.identificationTypeLabel,
      identification: this.identification,
      email: this.email,
      phone: this.phone,
      address: this.address,
      notes: this.notes,
      created_at: this.createdAt?.toISO(),
      updated_at: this.updatedAt?.toISO(),
    }
  }
}
