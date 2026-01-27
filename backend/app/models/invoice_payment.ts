import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Invoice from '#models/invoice'

export default class InvoicePayment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare invoiceId: number

  @column()
  declare amount: number

  @column.date()
  declare paymentDate: DateTime

  @column()
  declare paymentMethod: 'transfer' | 'cash' | 'card' | 'other'

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Invoice)
  declare invoice: BelongsTo<typeof Invoice>

  // Computed: payment method label (Spanish)
  get paymentMethodLabel(): string {
    const labels: Record<string, string> = {
      transfer: 'Transferencia',
      cash: 'Efectivo',
      card: 'Tarjeta',
      other: 'Otro',
    }
    return labels[this.paymentMethod] || this.paymentMethod
  }

  // Helper to serialize date safely
  private serializeDate(date: DateTime | null | undefined): string | null {
    if (!date) return null
    if (typeof (date as any).toISODate === 'function') {
      return (date as unknown as DateTime).toISODate()
    }
    try {
      return DateTime.fromISO(String(date)).toISODate()
    } catch {
      return null
    }
  }

  // Serialize for API
  serializeForApi() {
    return {
      id: this.id,
      invoice_id: this.invoiceId,
      amount: Number(this.amount),
      payment_date: this.serializeDate(this.paymentDate),
      payment_method: this.paymentMethod,
      payment_method_label: this.paymentMethodLabel,
      notes: this.notes,
      created_at: this.createdAt?.toISO(),
      updated_at: this.updatedAt?.toISO(),
    }
  }
}
