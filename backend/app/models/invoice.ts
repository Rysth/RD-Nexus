import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Client from '#models/client'
import Project from '#models/project'
import Quote from '#models/quote'
import RecurringService from '#models/recurring_service'
import InvoiceItem from '#models/invoice_item'
import InvoicePayment from '#models/invoice_payment'

export default class Invoice extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare clientId: number

  @column()
  declare projectId: number | null

  @column()
  declare quoteId: number | null

  @column()
  declare recurringServiceId: number | null

  @column()
  declare invoiceNumber: string

  @column.date()
  declare issueDate: DateTime

  @column.date()
  declare dueDate: DateTime

  /**
   * Status: pending, partial, paid, overdue, voided
   */
  @column()
  declare status: 'pending' | 'partial' | 'paid' | 'overdue' | 'voided'

  @column()
  declare subtotal: number

  @column()
  declare taxRate: number

  @column()
  declare taxAmount: number

  @column()
  declare total: number

  @column()
  declare totalPaid: number

  @column()
  declare balanceDue: number

  @column()
  declare notes: string | null

  @column()
  declare termsConditions: string | null

  // Información de pago
  @column.date()
  declare paymentDate: DateTime | null

  @column()
  declare paymentMethod: 'transfer' | 'cash' | 'card' | 'other' | null

  @column()
  declare paymentNotes: string | null

  // Campos SRI (futuro)
  @column()
  declare accessKey: string | null

  @column()
  declare xmlContent: string | null

  @column.dateTime()
  declare authorizationDate: DateTime | null

  @column()
  declare sriStatus: 'pending' | 'authorized' | 'rejected' | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @belongsTo(() => Quote)
  declare quote: BelongsTo<typeof Quote>

  @belongsTo(() => RecurringService)
  declare recurringService: BelongsTo<typeof RecurringService>

  @hasMany(() => InvoiceItem)
  declare items: HasMany<typeof InvoiceItem>

  @hasMany(() => InvoicePayment)
  declare payments: HasMany<typeof InvoicePayment>

  // Computed: status label (Spanish)
  get statusLabel(): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      partial: 'Pago Parcial',
      paid: 'Pagada',
      overdue: 'Vencida',
      voided: 'Anulada',
    }
    return labels[this.status] || this.status
  }

  // Computed: payment method label (Spanish)
  get paymentMethodLabel(): string | null {
    if (!this.paymentMethod) return null
    const labels: Record<string, string> = {
      transfer: 'Transferencia',
      cash: 'Efectivo',
      card: 'Tarjeta',
      other: 'Otro',
    }
    return labels[this.paymentMethod] || this.paymentMethod
  }

  // Computed: source label (de dónde viene la factura)
  get sourceLabel(): string {
    if (this.quoteId) return 'Cotización'
    if (this.recurringServiceId) return 'Servicio Recurrente'
    return 'Manual'
  }

  // Check if invoice is overdue
  get isOverdue(): boolean {
    if (this.status === 'paid' || this.status === 'voided') return false
    if (!this.dueDate) return false
    return DateTime.now() > this.dueDate
  }

  // Check if invoice can accept payments
  get canAcceptPayments(): boolean {
    return this.status === 'pending' || this.status === 'partial' || this.status === 'overdue'
  }

  // Check if invoice is editable (only pending invoices)
  get isEditable(): boolean {
    return this.status === 'pending'
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
      client_id: this.clientId,
      project_id: this.projectId,
      quote_id: this.quoteId,
      recurring_service_id: this.recurringServiceId,
      invoice_number: this.invoiceNumber,
      issue_date: this.serializeDate(this.issueDate),
      due_date: this.serializeDate(this.dueDate),
      status: this.status,
      status_label: this.statusLabel,
      subtotal: Number(this.subtotal),
      tax_rate: Number(this.taxRate),
      tax_amount: Number(this.taxAmount),
      total: Number(this.total),
      total_paid: Number(this.totalPaid || 0),
      balance_due: Number(this.balanceDue || this.total),
      notes: this.notes,
      terms_conditions: this.termsConditions,
      payment_date: this.serializeDate(this.paymentDate),
      payment_method: this.paymentMethod,
      payment_method_label: this.paymentMethodLabel,
      payment_notes: this.paymentNotes,
      source_label: this.sourceLabel,
      is_overdue: this.isOverdue,
      is_editable: this.isEditable,
      can_accept_payments: this.canAcceptPayments,
      // SRI fields
      access_key: this.accessKey,
      sri_status: this.sriStatus,
      created_at: this.createdAt?.toISO(),
      updated_at: this.updatedAt?.toISO(),
    }
  }
}
