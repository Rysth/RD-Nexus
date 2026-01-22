import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Client from '#models/client'
import Project from '#models/project'
import QuoteItem from '#models/quote_item'

export default class Quote extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare projectId: number | null

  @column()
  declare clientId: number

  @column()
  declare quoteNumber: string

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column.date()
  declare issueDate: DateTime

  @column.date()
  declare validUntil: DateTime

  /**
   * Status: draft, sent, approved, rejected
   */
  @column()
  declare status: 'draft' | 'sent' | 'approved' | 'rejected'

  @column()
  declare subtotal: number

  @column()
  declare discountPercent: number

  @column()
  declare discountAmount: number

  @column()
  declare taxRate: number

  @column()
  declare taxAmount: number

  @column()
  declare total: number

  @column()
  declare notes: string | null

  @column()
  declare termsConditions: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @hasMany(() => QuoteItem)
  declare items: HasMany<typeof QuoteItem>

  // Computed: status label (Spanish)
  get statusLabel(): string {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      sent: 'Enviada',
      approved: 'Aprobada',
      rejected: 'Rechazada',
    }
    return labels[this.status] || this.status
  }

  // Check if quote is editable
  get isEditable(): boolean {
    return this.status === 'draft'
  }

  // Check if quote is expired
  get isExpired(): boolean {
    if (!this.validUntil) return false
    return DateTime.now() > this.validUntil
  }

  // Helper to serialize dates safely
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
      project_id: this.projectId,
      client_id: this.clientId,
      quote_number: this.quoteNumber,
      title: this.title,
      description: this.description,
      issue_date: this.serializeDate(this.issueDate),
      valid_until: this.serializeDate(this.validUntil),
      status: this.status,
      status_label: this.statusLabel,
      subtotal: Number(this.subtotal),
      discount_percent: Number(this.discountPercent),
      discount_amount: Number(this.discountAmount),
      tax_rate: Number(this.taxRate),
      tax_amount: Number(this.taxAmount),
      total: Number(this.total),
      notes: this.notes,
      terms_conditions: this.termsConditions,
      is_editable: this.isEditable,
      is_expired: this.isExpired,
      created_at: this.createdAt?.toISO(),
      updated_at: this.updatedAt?.toISO(),
    }
  }
}