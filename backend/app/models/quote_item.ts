import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Quote from '#models/quote'

export default class QuoteItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare quoteId: number

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
  @belongsTo(() => Quote)
  declare quote: BelongsTo<typeof Quote>

  // Serialize for API
  serializeForApi() {
    return {
      id: this.id,
      quote_id: this.quoteId,
      description: this.description,
      quantity: Number(this.quantity),
      unit_price: Number(this.unitPrice),
      subtotal: Number(this.subtotal),
      payment_type: this.paymentType || 'unico',
      notes: this.notes,
      sort_order: this.sortOrder,
      created_at: this.createdAt?.toISO(),
      updated_at: this.updatedAt?.toISO(),
    }
  }
}