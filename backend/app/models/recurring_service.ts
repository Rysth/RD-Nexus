import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Project from '#models/project'

export default class RecurringService extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare projectId: number

  @column()
  declare name: string

  @column()
  declare amount: number

  /**
   * Billing cycle: monthly or yearly
   */
  @column()
  declare billingCycle: 'monthly' | 'yearly'

  @column.date()
  declare nextBillingDate: DateTime

  /**
   * Status: active or paused
   */
  @column()
  declare status: 'active' | 'paused'

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  // Computed: billing cycle label (Spanish)
  get billingCycleLabel(): string {
    const labels: Record<string, string> = {
      monthly: 'Mensual',
      yearly: 'Anual',
    }
    return labels[this.billingCycle] || this.billingCycle
  }

  // Computed: status label (Spanish)
  get statusLabel(): string {
    const labels: Record<string, string> = {
      active: 'Activo',
      paused: 'Pausado',
    }
    return labels[this.status] || this.status
  }

  // Serialize for API
  serializeForApi() {
    const nextBillingDateIso = (() => {
      if (!this.nextBillingDate) return null
      if (typeof (this.nextBillingDate as any).toISODate === 'function') {
        return (this.nextBillingDate as unknown as DateTime).toISODate()
      }
      try {
        return DateTime.fromISO(String(this.nextBillingDate)).toISODate()
      } catch {
        return null
      }
    })()

    return {
      id: this.id,
      project_id: this.projectId,
      name: this.name,
      amount: Number(this.amount),
      billing_cycle: this.billingCycle,
      billing_cycle_label: this.billingCycleLabel,
      next_billing_date: nextBillingDateIso,
      status: this.status,
      status_label: this.statusLabel,
      description: this.description,
      created_at: this.createdAt?.toISO(),
      updated_at: this.updatedAt?.toISO(),
    }
  }
}