import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Invoice from '#models/invoice'

export default class InvoiceItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare invoiceId: number

  @column()
  declare description: string

  @column()
  declare quantity: number

  @column()
  declare unitPrice: number

  @column()
  declare subtotal: number

  @column()
  declare paymentType: 'unico' | 'anual' | 'mensual'

  @column()
  declare notes: string | null

  @column()
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Invoice)
  declare invoice: BelongsTo<typeof Invoice>

  // Serialize for API
  serializeForApi() {
    return {
      id: this.id,
      invoice_id: this.invoiceId,
      description: this.description,
      quantity: Number(this.quantity),
      unit_price: Number(this.unitPrice),
      subtotal: Number(this.subtotal),
      payment_type: this.paymentType || 'unico',
      notes: this.notes,
      sort_order: this.sortOrder,
    }
  }
}
