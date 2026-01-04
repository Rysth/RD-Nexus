import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Client from '#models/client'
import RecurringService from '#models/recurring_service'

export default class Project extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare clientId: number

  @column()
  declare name: string

  @column()
  declare productionUrl: string | null

  @column.date()
  declare startDate: DateTime | null

  /**
   * Status: active, maintenance, canceled
   */
  @column()
  declare status: 'active' | 'maintenance' | 'canceled'

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>

  @hasMany(() => RecurringService)
  declare recurringServices: HasMany<typeof RecurringService>

  // Computed: status label (Spanish)
  get statusLabel(): string {
    const labels: Record<string, string> = {
      active: 'Activo',
      maintenance: 'Mantenimiento',
      canceled: 'Cancelado',
    }
    return labels[this.status] || this.status
  }

  // Serialize for API
  serializeForApi() {
    const startDateIso = (() => {
      // Ensure we always return a string ISO date or null
      if (!this.startDate) return null
      if (typeof (this.startDate as any).toISODate === 'function') {
        return (this.startDate as unknown as DateTime).toISODate()
      }
      try {
        return DateTime.fromISO(String(this.startDate)).toISODate()
      } catch (error) {
        return null
      }
    })()

    return {
      id: this.id,
      client_id: this.clientId,
      name: this.name,
      production_url: this.productionUrl,
      start_date: startDateIso,
      status: this.status,
      status_label: this.statusLabel,
      description: this.description,
      created_at: this.createdAt?.toISO(),
      updated_at: this.updatedAt?.toISO(),
    }
  }
}
